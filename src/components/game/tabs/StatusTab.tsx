"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Progress removed for compact layout
import { User, Heart, Zap, Shield, Sword, Coins, Star, TrendingUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

  // Use server-provided stats directly. Server persists derived stats when equipping,
  // so avoid adding item bonuses again on the client which causes double-counting.
  const displayedStats = { ...stats } as typeof stats;
  const displayedMaxHp = displayedStats.maxHp || 0;
  const displayedCurrentHp = Math.min(displayedStats.currentHp || 0, displayedMaxHp);

  const displayedHealthPercent = displayedMaxHp > 0 ? (displayedCurrentHp / displayedMaxHp) * 100 : 0;
  const expPercent = nextLevel ? (user.experience / (nextLevel.experienceRequired || 1)) * 100 : 100;
  const staminaPercent = stamina.maxStamina > 0 ? (stamina.currentStamina / stamina.maxStamina) * 100 : 0;

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
    <div className="flex items-center gap-2 p-1.5 border border-[var(--border)] rounded-md bg-[var(--card)] text-sm">
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="text-[11px] text-[var(--muted-foreground)]">{label}</div>
        <div className="text-sm font-semibold leading-tight">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 p-3">
      {/* Thông tin nhân vật chính */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{user.username}</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">{characterClass?.name || 'Chưa chọn lớp'}</span>
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

          {/* Thanh máu */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-[var(--destructive)]" />
                <span className="text-[var(--destructive)] font-medium text-xs">Máu</span>
              </div>
              <span className="text-[var(--destructive)] font-bold text-sm">{displayedCurrentHp}/{displayedMaxHp}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-[var(--destructive)]" style={{ width: `${displayedHealthPercent}%` }} />
            </div>
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
        <CardHeader>
          <CardTitle className="text-sm">Thuộc tính</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatCell icon={<Sword className="h-4 w-4 text-[var(--chart-3)]" />} label="Tấn công" value={displayedStats.attack} />
            <StatCell icon={<Shield className="h-4 w-4 text-[var(--chart-4)]" />} label="Phòng thủ" value={displayedStats.defense} />
            <StatCell icon={<Heart className="h-4 w-4 text-[var(--chart-5)]" />} label="Máu" value={displayedStats.vitality} />
            <StatCell icon={<Zap className="h-4 w-4 text-[var(--accent)]" />} label="Trí tuệ" value={displayedStats.intelligence} />

            <StatCell icon={<Sword className="h-4 w-4 text-[var(--chart-3)]" />} label="Sức mạnh" value={displayedStats.strength} />
            <StatCell icon={<Zap className="h-4 w-4 text-[var(--chart-4)]" />} label="Nhanh nhẹn" value={displayedStats.dexterity} />
            <StatCell icon={<Star className="h-4 w-4 text-[var(--muted-foreground)]" />} label="May mắn" value={displayedStats.luck} />
            <StatCell icon={<Star className="h-4 w-4 text-[var(--chart-5)]" />} label="Chính xác" value={`${displayedStats.accuracy}%`} />

            <StatCell icon={<TrendingUp className="h-4 w-4 text-[var(--chart-2)]" />} label="Chí mạng" value={`${displayedStats.critRate}%`} />
            <StatCell icon={<Zap className="h-4 w-4 text-[var(--chart-1)]" />} label="Crit DMG" value={`${displayedStats.critDamage}%`} />
            <StatCell icon={<Star className="h-4 w-4 text-[var(--accent)]" />} label="Combo" value={`${displayedStats.comboRate}%`} />
            <StatCell icon={<Star className="h-4 w-4 text-[var(--destructive)]" />} label="Phản công" value={`${displayedStats.counterRate}%`} />
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
    </div>
  );
};

export default StatusTab;
