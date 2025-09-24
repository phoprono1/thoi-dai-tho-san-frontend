"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Progress removed for compact layout
import { User, Zap, Shield, Sword, Coins, Star, TrendingUp, Heart } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUserStatusStore } from '@/stores/user-status.store';
import { useUserStatus } from '@/hooks/use-user-status';
import { useAuth } from '@/components/providers/AuthProvider';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { characterClassesApi, userAttributesApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const StatusTab: React.FC = () => {
  // Get authenticated user
  const { user: authUser, isAuthenticated } = useAuth();

  // Use authenticated user ID instead of hardcoded value
  const userId = authUser?.id;

  // Use Zustand store
  const {
    user,
    stats,
    totalCoreAttributes,
    stamina,
    currentLevel,
    nextLevel,
    characterClass,
    equippedItems,
    isLoading,
    error,
  } = useUserStatusStore();

  // Awaken modal state
  const [showAwakenModal, setShowAwakenModal] = React.useState(false);

  // Attribute allocation state
  const [pendingAllocations, setPendingAllocations] = React.useState<Record<'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', number>>({
    STR: 0,
    INT: 0,
    DEX: 0,
    VIT: 0,
    LUK: 0,
  });
  const [isAllocating, setIsAllocating] = React.useState(false);

  const queryClient = useQueryClient();

  // Handle attribute allocation changes
  const handleAllocationChange = (attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', delta: number) => {
    setPendingAllocations(prev => {
      const newAllocations = { ...prev };
      const current = newAllocations[attribute] + delta;

      // Prevent negative allocations
      if (current < 0) return prev;

      // Prevent exceeding available points
      const totalPending = Object.values(newAllocations).reduce((sum, val) => sum + val, 0) + delta;
      if (totalPending > (userAttributes?.unspentAttributePoints || 0)) return prev;

      newAllocations[attribute] = current;
      return newAllocations;
    });
  };

  // Save allocations to server
  const handleSaveAllocations = async () => {
    const totalPending = Object.values(pendingAllocations).reduce((sum, val) => sum + val, 0);
    if (totalPending === 0) {
      toast.info('Không có thay đổi nào để lưu');
      return;
    }

    setIsAllocating(true);
    try {
      const result = await userAttributesApi.allocateMultipleAttributePoints(pendingAllocations);
      if (result.success) {
        toast.success(result.message);
        // Reset pending allocations
        setPendingAllocations({
          STR: 0,
          INT: 0,
          DEX: 0,
          VIT: 0,
          LUK: 0,
        });
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-attributes'] });
      } else {
        toast.error(result.message || 'Lưu thất bại');
      }
    } catch (error) {
      console.error('Save allocations error:', error);
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setIsAllocating(false);
    }
  };

  // Cancel allocations
  const handleCancelAllocations = () => {
    setPendingAllocations({
      STR: 0,
      INT: 0,
      DEX: 0,
      VIT: 0,
      LUK: 0,
    });
  };

  // Fetch user attributes for attribute allocation
  const { data: userAttributes } = useQuery({
    queryKey: ['user-attributes'],
    queryFn: userAttributesApi.getUserAttributes,
    enabled: !!userId,
  });

  // Calculate remaining points after pending allocations
  const remainingPoints = (userAttributes?.unspentAttributePoints || 0) - Object.values(pendingAllocations).reduce((sum, val) => sum + val, 0);
  const hasPendingChanges = Object.values(pendingAllocations).some(val => val > 0);

  // Use TanStack Query only when userId is available
  const { isLoading: queryLoading, error: queryError } = useUserStatus(userId!);

  // If not authenticated, show message
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)] mb-4">Vui lòng đăng nhập để xem thông tin nhân vật</p>
        </div>
      </div>
    );
  }

  // Combine loading states
  const loading = isLoading || queryLoading;
  const displayError = error || (queryError instanceof Error ? queryError.message : null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{displayError}</p>
      </div>
    );
  }

  if (!user || !stats || !totalCoreAttributes || !stamina || !currentLevel) {
    return (
      <div className="p-4 text-center text-[var(--muted-foreground)]">
        <p>Không có dữ liệu nhân vật</p>
      </div>
    );
  }

  // Use server-provided total core attributes that include all bonuses
  const displayedStats = totalCoreAttributes;

  // Calculate percentages for bars
  const expPercent = nextLevel?.experienceRequired ? (user.experience / nextLevel.experienceRequired) * 100 : 100;
  const staminaPercent = stamina.maxStamina > 0 ? (stamina.currentStamina / stamina.maxStamina) * 100 : 0;

  // Calculate max HP from VIT (same formula as backend)
  const calculateMaxHp = (vit: number): number => {
    const baseMaxHp = 100;
    const hpFromVit = 12;
    const effective = Math.pow(Math.max(0, vit || 0), 0.94);
    return Math.floor(baseMaxHp + hpFromVit * effective);
  };

  const maxHp = calculateMaxHp(displayedStats.vit);
  const currentHp = stats.currentHp;
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;

  // Use server-authoritative combatPower only. Server calculates this when stats change
  // (level up, equip/unequip items, class advancement) and persists it to avoid race conditions.
  let combatPower: number | null = null;
  if (user && typeof (user as unknown as { combatPower?: number }).combatPower === 'number') {
    combatPower = (user as unknown as { combatPower?: number }).combatPower as number;
  }
  // No client-side fallback calculation to avoid double-counting or stale equippedItems
  combatPower = combatPower ?? 0;

  // Attribute allocation cell with + and - buttons for local state management
  const AttributeAllocationCell: React.FC<{
    icon: React.ReactNode;
    label: string;
    allocatedValue: number;
    totalValue: number;
    attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK';
    pendingAllocation: number;
    onAllocationChange: (attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', delta: number) => void;
    canIncrease: boolean;
  }> = ({
    icon,
    label,
    allocatedValue,
    totalValue,
    attribute,
    pendingAllocation,
    onAllocationChange,
    canIncrease,
  }) => {
    const currentAllocated = allocatedValue + pendingAllocation;
    const canDecrease = currentAllocated > 0;

    return (
      <div className="flex items-center gap-2 p-1.5 border border-[var(--border)] rounded-md bg-[var(--card)] text-sm">
        <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <div className="text-[11px] text-[var(--muted-foreground)]">{label}</div>
          <div className="text-sm font-semibold leading-tight">
            {totalValue + pendingAllocation}
            {(allocatedValue > 0 || pendingAllocation > 0) && (
              <span className="text-green-500 text-xs ml-1">
                (+{allocatedValue + pendingAllocation})
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onAllocationChange(attribute, -1)}
            disabled={!canDecrease}
          >
            -
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onAllocationChange(attribute, 1)}
            disabled={!canIncrease}
          >
            +
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 p-3">
      {/* Thông tin nhân vật chính */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div className="flex flex-col">
                <div className="font-semibold text-sm">{user.username}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--muted-foreground)]">{characterClass?.name || 'Chưa chọn lớp'}</span>
                  {!characterClass && currentLevel.level >= 10 ? (
                    <Button size="sm" variant="ghost" onClick={() => setShowAwakenModal(true)}>Thức tỉnh</Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="text-xs py-0.5 px-2">Cấp {currentLevel.level}</Badge>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-[linear-gradient(90deg,#fef3c7,#fed7aa)] text-black font-semibold text-xs border border-[rgba(0,0,0,0.06)]">
                <Sword className="h-3 w-3 text-[rgba(0,0,0,0.6)]" />
                <span className="leading-none text-xs">{combatPower.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Lớp nhân vật */}
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Star className="h-3 w-3 text-[var(--chart-5)]" />
            <span className="text-xs font-medium">{characterClass?.name || 'Chưa chọn lớp'}</span>
          </div>

          {/* Thanh kinh nghiệm */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-[var(--chart-2)]" />
                <span className="text-[var(--chart-2)] font-medium text-xs">Kinh nghiệm</span>
              </div>
              <span className="text-[var(--chart-2)] font-bold text-sm">{user.experience}/{nextLevel?.experienceRequired || user.experience}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-[var(--chart-2)]" style={{ width: `${expPercent}%` }} />
            </div>
          </div>

          {/* Thanh năng lượng */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-[var(--chart-4)]" />
                <span className="text-[var(--chart-4)] font-medium text-xs">Năng lượng</span>
              </div>
              <span className="text-[var(--chart-4)] font-bold text-sm">{stamina.currentStamina}/{stamina.maxStamina}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-[var(--chart-4)]" style={{ width: `${staminaPercent}%` }} />
            </div>
          </div>

          {/* Thanh máu */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="text-red-500 font-medium text-xs">Máu</span>
              </div>
              <span className="text-red-500 font-bold text-sm">{currentHp}/{maxHp}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          {/* Vàng */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-[var(--chart-1)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Vàng</span>
            </div>
            <span className="text-sm font-bold text-[var(--chart-1)]">{user.gold?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Thuộc tính (gộp chung) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Thuộc tính</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">Điểm tự do:</span>
            <Badge variant="secondary" className="text-xs">
              {remainingPoints}
            </Badge>
            {hasPendingChanges && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2"
                  onClick={handleCancelAllocations}
                  disabled={isAllocating}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={handleSaveAllocations}
                  disabled={isAllocating}
                >
                  {isAllocating ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            )}
            {userAttributes && (userAttributes.allocatedPoints.strength +
                               userAttributes.allocatedPoints.intelligence +
                               userAttributes.allocatedPoints.dexterity +
                               userAttributes.allocatedPoints.vitality +
                               userAttributes.allocatedPoints.luck) > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-6 px-2"
                onClick={async () => {
                  try {
                    const result = await userAttributesApi.resetAttributePoints();
                    if (result.success) {
                      toast.success(result.message);
                      queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
                      queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
                      queryClient.invalidateQueries({ queryKey: ['user-attributes'] });
                    } else {
                      toast.error(result.message || 'Reset thất bại');
                    }
                  } catch (error) {
                    console.error('Reset attributes error:', error);
                    toast.error('Có lỗi xảy ra khi reset điểm');
                  }
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <AttributeAllocationCell
              icon={<Sword className="h-4 w-4 text-[var(--chart-3)]" />}
              label="Sức mạnh"
              allocatedValue={userAttributes?.allocatedPoints.strength || 0}
              totalValue={displayedStats.str}
              attribute="STR"
              pendingAllocation={pendingAllocations.STR}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Zap className="h-4 w-4 text-[var(--accent)]" />}
              label="Trí tuệ"
              allocatedValue={userAttributes?.allocatedPoints.intelligence || 0}
              totalValue={displayedStats.int}
              attribute="INT"
              pendingAllocation={pendingAllocations.INT}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Zap className="h-4 w-4 text-[var(--chart-4)]" />}
              label="Nhanh nhẹn"
              allocatedValue={userAttributes?.allocatedPoints.dexterity || 0}
              totalValue={displayedStats.dex}
              attribute="DEX"
              pendingAllocation={pendingAllocations.DEX}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Shield className="h-4 w-4 text-[var(--chart-5)]" />}
              label="Sinh lực"
              allocatedValue={userAttributes?.allocatedPoints.vitality || 0}
              totalValue={displayedStats.vit}
              attribute="VIT"
              pendingAllocation={pendingAllocations.VIT}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Star className="h-4 w-4 text-[var(--muted-foreground)]" />}
              label="May mắn"
              allocatedValue={userAttributes?.allocatedPoints.luck || 0}
              totalValue={displayedStats.luk}
              attribute="LUK"
              pendingAllocation={pendingAllocations.LUK}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipped Items Section - 3 slots */}
      <Card className="shadow-sm border border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-center flex items-center gap-2 justify-center">
            <Shield className="h-5 w-5" />
            Trang bị hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto py-1 md:grid md:grid-cols-3 md:overflow-visible md:gap-2 snap-x snap-mandatory">
            {/* Weapon */}
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-start border border-[var(--border)] rounded px-2 py-1 bg-[var(--card)] text-[var(--foreground)]">
              {equippedItems?.find((it) => it.item.type === 'weapon') ? (
                (() => {
                  const w = equippedItems.find((it) => it.item.type === 'weapon')!;
                  return (
                    <div>
                      <h5 className="font-medium text-sm leading-tight">{w.item.name}</h5>

                      {w.item.stats ? (
                        <Collapsible>
                          <div className="flex items-center justify-between mt-1">
                            {w.item.level ? (
                              <span className="text-xs text-[var(--muted-foreground)]">Lv.{w.item.level}</span>
                            ) : w.item.rarity ? (
                              <Badge variant="outline" className="text-[11px]">{w.item.rarity}</Badge>
                            ) : (
                              <span className="text-xs text-[var(--muted-foreground)]">&nbsp;</span>
                            )}
                            <CollapsibleTrigger className="text-xs text-[var(--muted-foreground)] underline">Hiện</CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <p className="text-xs text-[var(--muted-foreground)] mt-2">{w.item.description}</p>
                            <div className="space-y-1 text-sm mt-2">
                              {Object.entries(w.item.stats).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between text-sm">
                                  <span className="capitalize text-[var(--muted-foreground)]">{k}</span>
                                  <span className="font-medium">+{v}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">{w.item.description}</div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-4 text-center text-[var(--muted-foreground)] text-sm">
                  <p>Trống</p>
                </div>
              )}
            </div>

            {/* Armor */}
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-start border border-[var(--border)] rounded px-2 py-1 bg-[var(--card)] text-[var(--foreground)]">
              {equippedItems?.find((it) => it.item.type === 'armor') ? (
                (() => {
                  const a = equippedItems.find((it) => it.item.type === 'armor')!;
                  return (
                    <div>
                      <h5 className="font-medium text-sm leading-tight">{a.item.name}</h5>
                      {a.item.stats ? (
                        <Collapsible>
                          <div className="flex items-center justify-between mt-1">
                            {a.item.level ? (
                              <span className="text-xs text-[var(--muted-foreground)]">Lv.{a.item.level}</span>
                            ) : a.item.rarity ? (
                              <Badge variant="outline" className="text-[11px]">{a.item.rarity}</Badge>
                            ) : (
                              <span className="text-xs text-[var(--muted-foreground)]">&nbsp;</span>
                            )}
                            <CollapsibleTrigger className="text-xs text-[var(--muted-foreground)] underline">Hiện</CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <p className="text-xs text-[var(--muted-foreground)] mt-2">{a.item.description}</p>
                            <div className="space-y-1 text-sm mt-2">
                              {Object.entries(a.item.stats).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between">
                                  <span className="capitalize text-[var(--muted-foreground)]">{k}</span>
                                  <span className="font-medium">+{v}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">{a.item.description}</div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-4 text-center text-[var(--muted-foreground)] text-sm">
                  <p>Trống</p>
                </div>
              )}
            </div>

            {/* Accessory */}
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-start border border-[var(--border)] rounded px-2 py-1 bg-[var(--card)] text-[var(--foreground)]">
              {equippedItems?.find((it) => it.item.type === 'accessory') ? (
                (() => {
                  const acc = equippedItems.find((it) => it.item.type === 'accessory')!;
                  return (
                    <div>
                      <h5 className="font-medium text-sm leading-tight">{acc.item.name}</h5>
                      {acc.item.stats ? (
                        <Collapsible>
                          <div className="flex items-center justify-between mt-1">
                            {acc.item.level ? (
                              <span className="text-xs text-[var(--muted-foreground)]">Lv.{acc.item.level}</span>
                            ) : acc.item.rarity ? (
                              <Badge variant="outline" className="text-[11px]">{acc.item.rarity}</Badge>
                            ) : (
                              <span className="text-xs text-[var(--muted-foreground)]">&nbsp;</span>
                            )}
                            <CollapsibleTrigger className="text-xs text-[var(--muted-foreground)] underline">Hiện</CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <p className="text-xs text-[var(--muted-foreground)] mt-2">{acc.item.description}</p>
                            <div className="space-y-1 text-sm mt-2">
                              {Object.entries(acc.item.stats).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between">
                                  <span className="capitalize text-[var(--muted-foreground)]">{k}</span>
                                  <span className="font-medium">+{v}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">{acc.item.description}</div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-4 text-center text-[var(--muted-foreground)] text-sm">
                  <p>Trống</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
  <AwakenModal open={showAwakenModal} onOpenChange={(v) => setShowAwakenModal(Boolean(v))} />
    </div>
  );
};

export function AwakenModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const queryClient = useQueryClient();
  const handleAwaken = async () => {
    setIsProcessing(true);
    try {
      // Call server-authoritative awaken endpoint which will pick a Tier-1 class
      const res = await characterClassesApi.awaken();

      // server returns AdvancementResultDto: { success, newClass, statChanges, unlockedSkills, message }
      const name = res?.newClass?.name || 'Lớp mới';

      // Update client cache and zustand store so UI reflects new class and stat bonuses immediately
      try {
        // Invalidate/fetch user-status and related queries for fresh data
        // We don't have the userId from the awaken response, rely on existing store state
        const currentSnapshot = useUserStatusStore.getState();
        const uid = currentSnapshot?.user?.id;
        queryClient.invalidateQueries({ queryKey: ['user-status', uid] });
        queryClient.invalidateQueries({ queryKey: ['user-stats', uid] });
        queryClient.invalidateQueries({ queryKey: ['user', uid] });
      } catch (e) {
        // Non-fatal: keep going
        console.debug('Post-awaken cache update failed', e);
      }

      toast.success(`Thức tỉnh thành công: ${name}`);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Awaken failed', err);
      let msg = 'Thức tỉnh thất bại';
      try {
        const maybe = err as { response?: { data?: { message?: string } }; message?: string };
        if (maybe?.response?.data?.message) msg = maybe.response.data.message;
        else if (typeof maybe?.message === 'string') msg = maybe.message;
      } catch {}
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thức tỉnh</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Hành động này sẽ chọn ngẫu nhiên một lớp bậc 1 (Tier 1) cho nhân vật của bạn. Sau khi đã có lớp bậc 1, các lần nâng cấp tiếp theo (Tier 1 → Tier 2+) sẽ kiểm tra yêu cầu.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleAwaken} disabled={isProcessing}>{isProcessing ? 'Đang xử lý...' : 'Thức tỉnh'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StatusTab;
