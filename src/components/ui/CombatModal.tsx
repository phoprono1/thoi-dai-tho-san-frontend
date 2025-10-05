/* eslint-disable @typescript-eslint/no-explicit-any */
 'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { resolveAssetUrl } from '@/lib/asset';
import api from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRoomSocketStore } from '@/stores/useRoomSocketStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
// Badge removed (not used) - keep styling consistent with modal
import { 
  Sword, 
  Shield, 
  Crown,
  Zap,
  Trophy,
  Skull,
  CornerUpLeft
} from 'lucide-react';

export interface CombatDetails {
  actor: 'player' | 'enemy' | 'pet';
  actorName: string;
  petId?: number; // Pet ID when actor is 'pet'
  petName?: string; // Pet name when actor is 'pet' (fallback if actorName is owner name)
  targetName: string;
  targetIndex?: number; // For multiple enemies with same name
  damage?: number;
  damageType?: string; // physical, magic, true
  isCritical?: boolean;
  isMiss?: boolean;
  hpBefore: number;
  hpAfter: number;
  manaBefore?: number; // Mana before action (for skills)
  manaAfter?: number;  // Mana after action (for skills)
  manaCost?: number;   // Mana cost of skill
  description: string;
  effects?: string[];
  abilityIcon?: string; // Pet ability icon
}

export interface CombatLogEntry {
  id: number;
  userId: number;
  turn: number;
  actionOrder: number;
  action: 'attack' | 'defend' | 'skill' | 'item' | 'escape' | 'pet_ability';
  details: CombatDetails;
}

export interface CombatResult {
  id: number;
  result: 'victory' | 'defeat' | 'escape';
  duration: number;
  rewards?: {
    experience?: number;
    gold?: number;
    items?: { itemId: number; quantity: number }[];
  };
  teamStats: {
    totalHp: number;
    currentHp: number;
    members: {
      userId: number;
      username: string;
      hp: number;
      maxHp: number;
      currentMana?: number;
      maxMana?: number;
    }[];
  };
  enemies?: {
    id: number;
    name: string;
    hp: number;
    maxHp: number;
    level: number;
    type: string;
    element: string;
  }[];
  originalEnemies?: {
    id: number;
    name: string;
    hp: number;
    maxHp: number;
    level: number;
    type: string;
    element: string;
  }[];
  logs: CombatLogEntry[];
}

interface CombatModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatResult: CombatResult | null;
  dungeonName: string;
}

export default function CombatModal({ isOpen, onClose, combatResult, dungeonName }: CombatModalProps) {
  const { user: authUser } = useAuth();
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Auto play
  // Increase playback speed to ~6x (about 167ms per log) as requested
  const [playbackSpeed] = useState(400); // ~4x speed
  const [showResult, setShowResult] = useState(false);

  // Animation states
  const [playerHp, setPlayerHp] = useState<{ [key: number]: { current: number; max: number } }>({});
  const [playerMana, setPlayerMana] = useState<{ [key: number]: { current: number; max: number } }>({});
  const [enemyHp, setEnemyHp] = useState<{ [key: number]: { current: number; max: number } }>({});
  const [lastAction, setLastAction] = useState<string>('');
  const [currentAction, setCurrentAction] = useState<'attack' | 'skill' | 'pet_ability' | null>(null);
  const [damageAnimation, setDamageAnimation] = useState<{ player: boolean; enemy: boolean }>({
    player: false,
    enemy: false
  });

  // Local cache for monster metadata (image path) to avoid repeated API requests
  const monsterMetaCacheRef = useRef<Record<string, { image?: string }>>({});
  const enemiesKey = JSON.stringify(combatResult?.enemies || []);

  useEffect(() => {
    // If combatResult has enemies but they don't include image, try to fetch
    const parsed = JSON.parse(enemiesKey) as any[];
    const toFetch: Set<number> = new Set();
    (parsed || []).forEach((e: any) => {
      if (e && typeof e.id === 'number') {
        const key = String(e.id);
        const cached = monsterMetaCacheRef.current[key];
        if (!cached || !cached.image) toFetch.add(e.id);
      }
    });

    if (toFetch.size === 0) return;

    // Fire-and-forget fetches; populate cache when responses arrive
  toFetch.forEach(async (mid) => {
      try {
        const resp = await api.get(`/monsters/${mid}`);
        const data = resp?.data;
        if (data) {
          monsterMetaCacheRef.current[String(mid)] = { image: data.image };
          // trigger a local state refresh by toggling a dummy piece of state
          setDamageAnimation((p) => ({ ...p }));
        }
      } catch {
        // ignore network or 404 errors; fallback to asset path
      }
    });
  }, [enemiesKey]);

  useEffect(() => {
    if (!combatResult) return;
    
    // DEBUG: Log combat result to check pet ability logs
    console.log('[COMBAT MODAL DEBUG] Full combat result:', {
      totalLogs: combatResult.logs?.length,
      logs: combatResult.logs?.map(log => ({
        turn: log.turn,
        action: log.action,
        actor: log.details.actor,
        actorName: log.details.actorName,
        description: log.details.description,
      })),
    });
    
    // Reset everything when NEW combat result arrives (not just when modal opens/closes)
    const initialHp: { [key: number]: { current: number; max: number } } = {};
    const initialMana: { [key: number]: { current: number; max: number } } = {};
    // Use maxHp as the initial displayed HP so clients don't see the post-combat
    // final HP immediately (teamStats.members currently carries final HP).
    combatResult?.teamStats?.members?.forEach(member => {
      initialHp[member.userId] = { current: member.maxHp, max: member.maxHp };
      // Initialize mana from teamStats.members
      initialMana[member.userId] = { 
        current: member.currentMana ?? member.maxMana ?? 0, 
        max: member.maxMana ?? 0 
      };
    });
    setPlayerHp(initialHp);
    setPlayerMana(initialMana);
    
    // Initialize enemy HP using originalEnemies if available, fallback to enemies
    const initialEnemyHp: { [key: number]: { current: number; max: number } } = {};
    const enemiesToUse = combatResult?.originalEnemies || combatResult?.enemies;
    if (enemiesToUse) {
      enemiesToUse.forEach((enemy, index) => {
        // Use index as key to match targetIndex from backend
        initialEnemyHp[index] = { current: enemy.maxHp, max: enemy.maxHp }; // Start with full HP
      });
    }
    setEnemyHp(initialEnemyHp);
    
    setCurrentLogIndex(0);
    setShowResult(false);
    setIsPlaying(true); // Auto-start playing
    setLastAction(''); // Reset action display
    setDamageAnimation({ player: false, enemy: false }); // Reset animations
  }, [combatResult]); // Remove isOpen dependency

  const processNextLog = useCallback(() => {
    if (!combatResult?.logs) return;
    
    // Check if we've reached the end
    if (currentLogIndex >= (combatResult?.logs?.length || 0)) {
      setShowResult(true);
      setIsPlaying(false);
      return;
    }
    
    const log = combatResult?.logs?.[currentLogIndex];
    if (!log) {
      setShowResult(true);
      setIsPlaying(false);
      return;
    }


    // Update HP based on log
    if (log.details.actor === 'player' || log.details.actor === 'pet') {
      // Player or Pet attacks enemy - prefer details.targetIndex, otherwise attempt
      // to resolve by targetName (fallback) so UI still updates correctly.
      setEnemyHp(prev => {
        const updatedEnemyHp = { ...prev };
        let targetIndex = log.details.targetIndex;

        if (typeof targetIndex === 'undefined') {
          // fallback resolution: try to pick enemy by matching name AND hpBefore
          const keys = Object.keys(updatedEnemyHp);

          // First try: exact name + hpBefore match
          const foundByNameAndHp = keys.find((k) => {
            const idx = Number(k);
            const e = (combatResult.originalEnemies || combatResult.enemies)?.[idx];
            if (!e || e.name !== log.details.targetName) return false;
            const cur = updatedEnemyHp[idx]?.current;
            return typeof cur === 'number' && cur === (log.details.hpBefore ?? cur);
          });
          if (foundByNameAndHp) {
            targetIndex = Number(foundByNameAndHp);
          } else {
            // Second try: any enemy with matching hpBefore (best effort)
            const foundByHp = keys.find((k) => {
              const idx = Number(k);
              const cur = updatedEnemyHp[idx]?.current;
              return typeof cur === 'number' && cur === (log.details.hpBefore ?? cur);
            });
            if (foundByHp) {
              targetIndex = Number(foundByHp);
            } else {
              // Last resort: find first enemy with same name (legacy behavior)
              const found = keys.find((k) => {
                const idx = Number(k);
                const e = (combatResult.originalEnemies || combatResult.enemies)?.[idx];
                return e && e.name === log.details.targetName;
              });
              if (found) targetIndex = Number(found);
            }
          }
        }

        if (typeof targetIndex !== 'undefined' && updatedEnemyHp[targetIndex]) {
          updatedEnemyHp[targetIndex] = {
            ...updatedEnemyHp[targetIndex],
            current: Math.max(0, log.details.hpAfter || 0),
          };
        } else {
          console.warn('No enemy found to apply player/pet action:', log.details.targetName, 'idx:', targetIndex);
        }

        return updatedEnemyHp;
      });
      
      // Update player mana if this was a skill action (not pet ability)
      if (log.action === 'skill' && typeof log.details.manaAfter === 'number') {
        setPlayerMana(prev => ({
          ...prev,
          [log.userId]: {
            ...prev[log.userId],
            current: Math.max(0, log.details.manaAfter ?? 0),
          }
        }));
      }
      
  setDamageAnimation(prev => ({ ...prev, enemy: true }));
  // match damage animation length with playback speed (slightly longer for visibility)
  setTimeout(() => setDamageAnimation(prev => ({ ...prev, enemy: false })), Math.max(120, playbackSpeed * 1.0));
    } else {
      // Enemy attacks player
      setPlayerHp(prev => ({
        ...prev,
        [log.userId]: { 
          ...prev[log.userId], 
          current: Math.max(0, log.details.hpAfter || 0)
        }
      }));
  setDamageAnimation(prev => ({ ...prev, player: true }));
  setTimeout(() => setDamageAnimation(prev => ({ ...prev, player: false })), Math.max(120, playbackSpeed * 1.0));
    }

    setLastAction(log.details.description);
    // Check actor type to determine if this is a pet ability (backend normalizes pet_ability -> skill)
    setCurrentAction(log.details.actor === 'pet' ? 'pet_ability' : log.action as 'attack' | 'skill' | 'pet_ability' | null);
    setCurrentLogIndex(prev => prev + 1);
  }, [combatResult?.logs, currentLogIndex, playbackSpeed, combatResult?.enemies, combatResult?.originalEnemies]);

  useEffect(() => {
    if (!isPlaying || !combatResult?.logs) {
      return;
    }
    
    // Check if we've processed all logs
    if (currentLogIndex >= (combatResult?.logs?.length || 0)) {
      // Delay showing result slightly so the final damage animation can
      // complete and the last enemy's HP is visible at 0 before switching
      // to the result panel.
      const animationDelay = Math.max(120, playbackSpeed);
      const t = setTimeout(() => {
        setShowResult(true);
        setIsPlaying(false);
      }, animationDelay);

      return () => clearTimeout(t);
    }

    const timer = setTimeout(() => {
      processNextLog();
    }, playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentLogIndex, playbackSpeed, combatResult, processNextLog]);

  // Playback is fixed at 2x (500ms). No user controls are provided for pause/skip/speed.

  // getResultColor removed (unused) - icons used for result instead

  if (!combatResult) return null;
  // Determine which rewards to show for this client.
  // Backend may return either a single aggregated reward object (solo or legacy)
  // or an object like { aggregated, perUser } for multiplayer where perUser is an array
  // matching the server's user ordering. We map current auth user -> team member index
  // and pick that entry when available.
  let displayedExperience = combatResult.rewards?.experience ?? 0;
  let displayedGold = combatResult.rewards?.gold ?? 0;
  let displayedItems: Array<any> = combatResult.rewards?.items ?? [];

  const maybePerUser = (combatResult as any)?.rewards?.perUser;
  if (maybePerUser && Array.isArray(maybePerUser) && combatResult.teamStats?.members && authUser) {
    const memberIndex = combatResult.teamStats.members.findIndex(m => m.userId === authUser.id);
    if (memberIndex >= 0 && maybePerUser[memberIndex]) {
      const entry = maybePerUser[memberIndex];
      displayedExperience = entry.experience ?? displayedExperience;
      displayedGold = entry.gold ?? displayedGold;
      displayedItems = entry.items ?? displayedItems;
    } else if (maybePerUser.length === 1 && maybePerUser[0]) {
      // Fallback: single-player wrapped in perUser array
      const entry = maybePerUser[0];
      displayedExperience = entry.experience ?? displayedExperience;
      displayedGold = entry.gold ?? displayedGold;
      displayedItems = entry.items ?? displayedItems;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Trận chiến tại {dungeonName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Combat Arena or Result (result replaces arena when finished) */}
          {!showResult ? (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 sm:p-6 text-white relative overflow-hidden">
            {/* Players Side */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="space-y-2 w-full">
                <h3 className="font-bold text-lg text-green-400 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Đội của bạn
                </h3>
                {/* Compact 2-column grid for players to match enemy layout */}
                {combatResult?.teamStats?.members ? (
                  <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
                    {combatResult.teamStats.members.map(member => (
                      <div key={member.userId} className="bg-gray-900/40 p-1 sm:p-2 rounded text-[12px]">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate max-w-[70%]">{member.username}</div>
                        </div>
                        {/* HP Bar */}
                        <div className="mt-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                            <span>HP</span>
                            <span className="font-semibold">{playerHp[member.userId]?.current || member.hp}/{playerHp[member.userId]?.max || member.maxHp}</span>
                          </div>
                          <Progress
                            value={(playerHp[member.userId]?.current || member.hp) / (playerHp[member.userId]?.max || member.maxHp) * 100}
                            className={`h-2 bg-gray-700 ${damageAnimation.player ? 'animate-pulse' : ''}`}
                            style={{ '--progress-foreground': 'rgb(34 197 94)' } as React.CSSProperties}
                          />
                        </div>
                        {/* Mana Bar */}
                        {member.maxMana && member.maxMana > 0 && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-[10px] text-blue-400 mb-0.5">
                              <div className="flex items-center gap-0.5">
                                <Zap className="h-2.5 w-2.5" />
                                <span>Mana</span>
                              </div>
                              <span className="font-semibold">
                                {playerMana[member.userId]?.current ?? member.currentMana ?? member.maxMana}/{member.maxMana}
                              </span>
                            </div>
                            <Progress
                              value={((playerMana[member.userId]?.current ?? member.currentMana ?? member.maxMana) / member.maxMana) * 100}
                              className="h-2 bg-gray-700"
                              style={{ '--progress-foreground': 'rgb(59 130 246)' } as React.CSSProperties}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-300">Không có thông tin đội</div>
                )}
              </div>

              {/* VS */}
              <div className="text-3xl font-bold text-yellow-400 self-center">VS</div>

              {/* Enemy Side (mobile-style): full-width 2-column grid, same on PC */}
                <div className="space-y-2 text-right w-full">
                <h3 className="font-bold text-lg text-red-400 flex items-center gap-2 justify-end">
                  <span>
                    {combatResult?.enemies && combatResult?.enemies.length > 0
                      ? (combatResult?.enemies.length === 1
                          ? combatResult?.enemies[0].name
                          : `${combatResult?.enemies.length} Quái vật`)
                      : 'Quái vật'}
                  </span>
                  <Sword className="h-4 w-4" />
                </h3>

                {/* Mobile: grid 2 columns x up to 5 rows (vertical scroll). On md+ switch to horizontal scroll for wide screens */}
                <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(110px,1fr))] max-h-[520px] overflow-y-auto py-1 pr-2">
                  {combatResult?.enemies && (() => {
                    // Build counts for duplicate enemy ids so we can show a quantity badge
                    const counts: Record<string, number> = {};
                    (combatResult.enemies || []).forEach((e) => {
                      const key = String(e.id ?? e.name ?? Math.random());
                      counts[key] = (counts[key] || 0) + 1;
                    });

                    return combatResult.enemies.map((enemy, index) => {
                      const enemyId = index;
                      const currentHp = enemyHp[enemyId]?.current || enemy.hp;
                      const maxHp = enemyHp[enemyId]?.max || enemy.maxHp;
                      const key = String(enemy.id ?? enemy.name ?? index);
                      const qty = counts[key] || 1;

                      // Prefer an absolute URL from resolveAssetUrl. If the enemy record
                      // includes an `image` field use it. Otherwise prefer the cached
                      // monster metadata (fetched from /monsters/:id). Do NOT invent
                      // a /assets/monsters/<id>.png path because images are stored
                      // with hashed filenames under /assets/monsters/thumbs/...
                      const cachedImage = monsterMetaCacheRef.current[String(enemy.id || '')]?.image;
                      const imgSrc = resolveAssetUrl((enemy as any)?.image as string) || resolveAssetUrl(cachedImage as string) || undefined;

                      return (
                        <div key={enemyId} className="bg-gray-900/40 p-1 sm:p-2 rounded text-[12px] flex items-center gap-2">
                          {/* Fixed-size thumbnail so it doesn't expand the card */}
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-800 rounded overflow-hidden relative">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={enemy.name}
                                width={64}
                                height={64}
                                className="object-cover"
                                onError={() => { /* ignore */ }}
                                unoptimized
                              />
                            ) : (
                              // Last-resort inline placeholder
                              <div className="w-full h-full bg-gray-800" />
                            )}
                            {qty > 1 && (
                              <div className="absolute -top-1 -right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">x{qty}</div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium truncate">{enemy.name} #{index + 1}</div>
                              <div className="text-[11px] text-gray-300">Lv.{enemy.level}</div>
                            </div>
                            <div className="mt-1">
                              {/* Shorten the HP bar visually so the thumbnail fits nicely */}
                              <Progress
                                value={(currentHp / Math.max(1, maxHp)) * 100}
                                className={`h-1.5 bg-gray-700 ${damageAnimation.enemy ? 'animate-pulse' : ''}`}
                                style={{
                                  '--progress-foreground': 'rgb(239 68 68)'
                                } as React.CSSProperties}
                              />
                              <div className="text-[11px] text-gray-300 text-left mt-1">{currentHp}/{maxHp} HP</div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                {/* If no enemies available */}
                {!combatResult?.enemies && (
                  <div className="text-sm text-gray-300">Không có thông tin quái vật</div>
                )}
              </div>
            </div>
            {/* Damage Animations */}
            {damageAnimation.player && (
              <div className="absolute left-6 top-1/2 -translate-y-1/2 animate-bounce">
                <span className="text-red-400 font-bold text-2xl">-DMG!</span>
              </div>
            )}
            {damageAnimation.enemy && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 animate-bounce">
                <span className="text-green-400 font-bold text-2xl">-DMG!</span>
              </div>
            )}
          </div>
          ) : (
            // Result panel replaces the combat arena when showResult === true
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-700/70 rounded-lg p-6 text-white space-y-4 border border-gray-700">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  {combatResult?.result === 'victory' && <Trophy className="h-6 w-6 text-yellow-300" />}
                  {combatResult?.result === 'defeat' && <Skull className="h-6 w-6 text-red-400" />}
                  {combatResult?.result === 'escape' && <CornerUpLeft className="h-6 w-6 text-yellow-200" />}
                  <h2 className="text-xl font-bold">
                    {combatResult?.result === 'victory' ? 'CHIẾN THẮNG' : combatResult?.result === 'defeat' ? 'THẤT BẠI' : 'ĐÃ CHẠY TRỐN'}
                  </h2>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  {typeof displayedExperience === 'number' && displayedExperience > 0 && (
                    <div className="bg-gray-900/40 px-3 py-2 rounded flex items-center gap-2">
                      <span className="text-yellow-300 font-semibold">+{displayedExperience}</span>
                      <span className="text-gray-300">EXP</span>
                    </div>
                  )}
                  {typeof displayedGold === 'number' && displayedGold > 0 && (
                    <div className="bg-gray-900/40 px-3 py-2 rounded flex items-center gap-2">
                      <span className="text-yellow-300 font-semibold">+{displayedGold}</span>
                      <span className="text-gray-300">Gold</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900/30 p-3 rounded">
                <h4 className="font-semibold text-sm text-gray-200 mb-2">Phần thưởng</h4>
                {displayedItems && displayedItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {displayedItems.map((it: any, idx: number) => (
                      <div key={idx} className="bg-gray-900/40 p-2 rounded flex items-center justify-between text-xs">
                        <div className="truncate font-medium">{it.name ? it.name : `Item #${it.itemId}`}</div>
                        <div className="text-gray-300 text-xs">x{it.quantity}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-300">Không có vật phẩm rơi</div>
                )}
              </div>

              <div className="flex justify-center">
                <Button onClick={() => {
                  // Defensive: clear global combat result in the socket store so
                  // closing the modal never leaves stale combat data that can
                  // re-open the modal later.
                  try {
                    useRoomSocketStore.setState({ combatResult: null });
                  } catch {
                    // ignore if not available
                  }
                  onClose();
                }}>Đóng</Button>
              </div>
            </div>
          )}

          {/* Action Log */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">
                {/* Clamp action index so it never exceeds total logs */}
                {(() => {
                  const total = combatResult?.logs?.length || 0;
                  const actionIndex = Math.min(Math.max(0, currentLogIndex), total);
                  const displayAction = total > 0 ? Math.min(actionIndex + 1, total) : 0;
                  const displayTurn = Math.max(1, Math.ceil(displayAction / Math.max(1, 1)));
                  return `Turn ${displayTurn} - Action ${displayAction} / ${total}`;
                })()}
              </span>
              {currentAction === 'pet_ability' && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium flex items-center gap-1">
                  🐉 Pet Ability
                </span>
              )}
              {currentAction === 'skill' && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  ⚡ Skill
                </span>
              )}
            </div>
            <div className={`rounded p-3 min-h-[60px] flex items-center ${
              currentAction === 'pet_ability' 
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
                : 'bg-white'
            }`}>
              {lastAction ? (
                <p className={`break-words ${
                  currentAction === 'pet_ability'
                    ? 'text-purple-900 font-medium'
                    : 'text-gray-800'
                }`}>{lastAction}</p>
              ) : (
                <p className="text-gray-500 italic">Trận chiến sẽ bắt đầu...</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Playback fixed at 2x. No controls shown to keep multiplayer sessions synchronized. */}
            </div>

            <div className="w-full sm:w-auto flex items-center">
              <Progress 
                value={(currentLogIndex / (combatResult?.logs?.length || 1)) * 100} 
                className="flex-1 mx-4 h-2 min-w-0"
              />
            </div>
          </div>

          
        </div>
      </DialogContent>
    </Dialog>
  );
}
