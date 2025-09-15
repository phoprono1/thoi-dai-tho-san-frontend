"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Heart, Zap, Shield, Sword, Coins, Star, TrendingUp } from 'lucide-react';
import { useUserStatusStore } from '@/stores/user-status.store';
import { UserStats, UserItem } from '@/types';

type ComputeOptions = {
  exponent?: number;
  coeffs?: {
    atkFromSTR?: number;
    atkFromINT?: number;
    atkFromDEX?: number;
    hpFromVIT?: number;
    defFromVIT?: number;
  };
  weights?: {
    attack?: number;
    hp?: number;
    defense?: number;
    misc?: number;
  };
};
import { useUserStatus } from '@/hooks/use-user-status';
import { useAuth } from '@/components/providers/AuthProvider';
import { Spinner } from '@/components/ui/spinner';

// Port of backend computeCombatPowerFromStats to provide a deterministic
// client-side fallback when server doesn't return a precomputed combatPower.
function computeCombatPowerFromStats(
  userStat: Partial<UserStats>,
  equippedItems: UserItem[] = [],
  opts: ComputeOptions = {},
): number {
  const p = opts.exponent ?? 0.94;
  const {
    atkFromSTR = 0.45,
    atkFromINT = 0.6,
    atkFromDEX = 0.18,
    hpFromVIT = 12,
    defFromVIT = 0.5,
  } = opts.coeffs || {};

  const {
    attack: weightAttack = 1,
    hp: weightHp = 0.08,
    defense: weightDefense = 2.5,
    misc: weightMisc = 0.5,
  } = opts.weights || {};

  const STR = Math.max(0, userStat.strength || 0);
  const INT = Math.max(0, userStat.intelligence || 0);
  const DEX = Math.max(0, userStat.dexterity || 0);
  const VIT = Math.max(0, userStat.vitality || 0);
  const LUK = Math.max(0, userStat.luck || 0);

  const eff = (a: number) => Math.pow(a, p);

  let equipAttackFlat = 0;
  let equipAttackMult = 0;
  let equipHpFlat = 0;
  let equipHpMult = 0;
  let equipDefFlat = 0;

  for (const it of equippedItems) {
    if (!it || !it.item) continue;
    const s = it.item.stats || {};
    equipAttackFlat += (s.attack || 0) * (it.quantity || 1);
    equipAttackMult += 0;
    equipHpFlat += (s.hp || 0) * (it.quantity || 1);
    equipHpMult += 0;
    equipDefFlat += (s.defense || 0) * (it.quantity || 1);
  }

  const baseAttack = userStat.attack || 0;
  const baseMaxHp = userStat.maxHp || 0;
  const baseDefense = userStat.defense || 0;

  const finalAttack =
    Math.floor(
      baseAttack +
        equipAttackFlat +
      atkFromSTR * eff(STR) +
        atkFromINT * eff(INT) +
        atkFromDEX * eff(DEX),
    ) * (1 + equipAttackMult);

  const finalMaxHp =
    Math.floor(baseMaxHp + equipHpFlat + hpFromVIT * eff(VIT)) * (1 + equipHpMult);

  const finalDefense = Math.floor(baseDefense + equipDefFlat + defFromVIT * eff(VIT));

  const misc = LUK * 0.5 + DEX * 0.3;

  const power =
    weightAttack * finalAttack +
    weightHp * finalMaxHp +
    weightDefense * finalDefense +
    weightMisc * misc;

  return Math.max(0, Math.floor(power));
}

const StatusTab: React.FC = () => {
  // Get authenticated user
  const { user: authUser, isAuthenticated } = useAuth();

  // Use authenticated user ID instead of hardcoded value
  const userId = authUser?.id;

  // Use Zustand store
  const {
    user,
    stats,
    stamina,
    currentLevel,
    nextLevel,
    characterClass,
    equippedItems,
    isLoading,
    error,
  } = useUserStatusStore();

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

  if (!user || !stats || !stamina || !currentLevel) {
    return (
      <div className="p-4 text-center text-[var(--muted-foreground)]">
        <p>Không có dữ liệu nhân vật</p>
      </div>
    );
  }

  const expPercent = nextLevel
    ? (user.experience / nextLevel.experienceRequired) * 100
    : 100;
  const staminaPercent = (stamina.currentStamina / stamina.maxStamina) * 100;

  // Use server-provided stats directly. Server persists derived stats when equipping,
  // so avoid adding item bonuses again on the client which causes double-counting.
  const displayedStats = { ...stats } as typeof stats;
  const displayedMaxHp = displayedStats.maxHp || 0;
  const displayedCurrentHp = Math.min(displayedStats.currentHp || 0, displayedMaxHp);
  const displayedHealthPercent = displayedMaxHp > 0 ? (displayedCurrentHp / displayedMaxHp) * 100 : 0;

  // Prefer the server-provided, authoritative combatPower attached to `user`.
  // If it's missing (older backend or race condition), compute deterministically
  // on the client using the same formula as the server.
  let combatPower: number | null = null;
  if (user && typeof (user as unknown as { combatPower?: number }).combatPower === 'number') {
    combatPower = (user as unknown as { combatPower?: number }).combatPower as number;
  } else if (displayedStats) {
    // Use equippedItems from the status store to mirror server computation
    combatPower = computeCombatPowerFromStats(displayedStats as UserStats, equippedItems || []);
  }
  combatPower = combatPower ?? 0;

  // Small inline Stat cell to avoid extra file
  const StatCell: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 p-2 border-2 border-[var(--border)] rounded-md bg-[var(--card)]">
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Thông tin nhân vật chính */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-semibold">{user.username}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{characterClass?.name || 'Chưa chọn lớp'}</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Badge variant="secondary">Cấp {currentLevel.level}</Badge>
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-[linear-gradient(90deg,#fef3c7,#fed7aa)] text-black font-semibold text-sm border border-[rgba(0,0,0,0.06)]">
                <Sword className="h-4 w-4 text-[rgba(0,0,0,0.6)]" />
                <span className="leading-none">{combatPower.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lớp nhân vật */}
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Star className="h-4 w-4 text-[var(--chart-5)]" />
            <span className="text-sm font-medium">{characterClass?.name || 'Chưa chọn lớp'}</span>
          </div>

          {/* Thanh máu */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-[var(--destructive)]" />
                <span className="text-[var(--destructive)] font-medium">Máu</span>
              </div>
              <span className="text-[var(--destructive)] font-bold">{displayedCurrentHp}/{displayedMaxHp}</span>
            </div>
            <Progress value={displayedHealthPercent} className="h-2 [&>div]:bg-[var(--destructive)]" />
          </div>

          {/* Thanh kinh nghiệm */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-[var(--chart-2)]" />
                <span className="text-[var(--chart-2)] font-medium">Kinh nghiệm</span>
              </div>
              <span className="text-[var(--chart-2)] font-bold">{user.experience}/{nextLevel?.experienceRequired || user.experience}</span>
            </div>
            <Progress value={expPercent} className="h-2 [&>div]:bg-[var(--chart-2)]" />
          </div>

          {/* Thanh năng lượng */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-[var(--chart-4)]" />
                <span className="text-[var(--chart-4)] font-medium">Năng lượng</span>
              </div>
              <span className="text-[var(--chart-4)] font-bold">{stamina.currentStamina}/{stamina.maxStamina}</span>
            </div>
            <Progress value={staminaPercent} className="h-2 [&>div]:bg-[var(--chart-4)]" />
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

      {/* Thuộc tính chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Thuộc tính</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compact attributes grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/** left column: core derived stats */}
            <div className="p-4 border-2 border-[var(--border)] rounded-lg bg-[var(--card)]">
              <h4 className="text-sm font-semibold mb-3">Thuộc tính chính</h4>
              <div className="grid grid-cols-2 gap-3">
                <StatCell icon={<Sword className="h-4 w-4 text-[var(--chart-3)]" />} label="Tấn công" value={displayedStats.attack} />
                <StatCell icon={<Shield className="h-4 w-4 text-[var(--chart-4)]" />} label="Phòng thủ" value={displayedStats.defense} />
                <StatCell icon={<Heart className="h-4 w-4 text-[var(--chart-5)]" />} label="Máu" value={displayedStats.vitality} />
                <StatCell icon={<Zap className="h-4 w-4 text-[var(--accent)]" />} label="Trí tuệ" value={displayedStats.intelligence} />
              </div>
            </div>

            {/** middle column: core attributes */}
            <div className="p-4 border-2 border-[var(--border)] rounded-lg bg-[var(--card)]">
              <h4 className="text-sm font-semibold mb-3">Thuộc tính cốt lõi</h4>
              <div className="grid grid-cols-2 gap-3">
                <StatCell icon={<Sword className="h-4 w-4 text-[var(--chart-3)]" />} label="Sức mạnh" value={displayedStats.strength} />
                <StatCell icon={<Zap className="h-4 w-4 text-[var(--chart-4)]" />} label="Nhanh nhẹn" value={displayedStats.dexterity} />
                <StatCell icon={<Shield className="h-4 w-4 text-[var(--muted-foreground)]" />} label="May mắn" value={displayedStats.luck} />
                <StatCell icon={<Star className="h-4 w-4 text-[var(--chart-5)]" />} label="Chính xác" value={`${displayedStats.accuracy}%`} />
              </div>
            </div>

            {/** right column: advanced */}
            <div className="p-4 border-2 border-[var(--border)] rounded-lg bg-[var(--card)]">
              <h4 className="text-sm font-semibold mb-3">Thuộc tính nâng cao</h4>
              <div className="grid grid-cols-2 gap-3">
                <StatCell icon={<TrendingUp className="h-4 w-4 text-[var(--chart-2)]" />} label="Chí mạng" value={`${displayedStats.critRate}%`} />
                <StatCell icon={<Zap className="h-4 w-4 text-[var(--chart-1)]" />} label="Crit DMG" value={`${displayedStats.critDamage}%`} />
                <StatCell icon={<Star className="h-4 w-4 text-[var(--accent)]" />} label="Combo" value={`${displayedStats.comboRate}%`} />
                <StatCell icon={<Star className="h-4 w-4 text-[var(--destructive)]" />} label="Phản công" value={`${displayedStats.counterRate}%`} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipped Items Section - 3 slots */}
      <Card className="shadow-lg border-2 border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[var(--card-foreground)] flex items-center gap-2 justify-center">
            <Shield className="h-6 w-6" />
            Trang bị hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 overflow-x-auto py-2 md:grid md:grid-cols-3 md:overflow-visible md:gap-4 snap-x snap-mandatory">
            {/* Weapon */}
            <div className="min-w-[260px] md:min-w-0 flex-shrink-0 snap-start border-2 border-[var(--border)] rounded-lg p-4 bg-[var(--card)] text-[var(--foreground)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">Vũ khí</h4>
                <Sword className="h-5 w-5 text-[var(--chart-3)]" />
              </div>
              {equippedItems?.find((it) => it.item.type === 'weapon') ? (
                (() => {
                  const w = equippedItems.find((it) => it.item.type === 'weapon')!;
                  return (
                    <div>
                      <h5 className="font-medium text-sm mb-1">{w.item.name}</h5>
                      <div className="text-xs text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
                        <span>Lv.{w.item.level} •</span>
                        <Badge variant="outline">{w.item.rarity}</Badge>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mb-2">{w.item.description}</p>
                      {w.item.stats && (
                        <div className="space-y-1 text-sm">
                          {Object.entries(w.item.stats).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="capitalize text-[var(--muted-foreground)]">{k}</span>
                              <span className="font-medium">+{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  <p>Trống</p>
                </div>
              )}
            </div>

            {/* Armor */}
            <div className="min-w-[260px] md:min-w-0 flex-shrink-0 snap-start border-2 border-[var(--border)] rounded-lg p-4 bg-[var(--card)] text-[var(--foreground)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">Giáp</h4>
                <Shield className="h-5 w-5 text-[var(--chart-4)]" />
              </div>
              {equippedItems?.find((it) => it.item.type === 'armor') ? (
                (() => {
                  const a = equippedItems.find((it) => it.item.type === 'armor')!;
                  return (
                    <div>
                      <h5 className="font-medium text-sm mb-1">{a.item.name}</h5>
                      <div className="text-xs text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
                        <span>Lv.{a.item.level} •</span>
                        <Badge variant="outline">{a.item.rarity}</Badge>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mb-2">{a.item.description}</p>
                      {a.item.stats && (
                        <div className="space-y-1 text-sm">
                          {Object.entries(a.item.stats).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="capitalize text-[var(--muted-foreground)]">{k}</span>
                              <span className="font-medium">+{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  <p>Trống</p>
                </div>
              )}
            </div>

            {/* Accessory */}
            <div className="min-w-[260px] md:min-w-0 flex-shrink-0 snap-start border-2 border-[var(--border)] rounded-lg p-4 bg-[var(--card)] text-[var(--foreground)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">Phụ kiện</h4>
                <Star className="h-5 w-5 text-[var(--accent)]" />
              </div>
              {equippedItems?.find((it) => it.item.type === 'accessory') ? (
                (() => {
                  const acc = equippedItems.find((it) => it.item.type === 'accessory')!;
                  return (
                    <div>
                      <h5 className="font-medium text-sm mb-1">{acc.item.name}</h5>
                      <div className="text-xs text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
                        <span>Lv.{acc.item.level} •</span>
                        <Badge variant="outline">{acc.item.rarity}</Badge>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mb-2">{acc.item.description}</p>
                      {acc.item.stats && (
                        <div className="space-y-1 text-sm">
                          {Object.entries(acc.item.stats).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="capitalize text-[var(--muted-foreground)]">{k}</span>
                              <span className="font-medium">+{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  <p>Trống</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusTab;
