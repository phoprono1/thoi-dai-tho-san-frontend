/* eslint-disable @typescript-eslint/no-explicit-any */
 'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Play,
  Pause,
  SkipForward,
  FastForward,
  Trophy,
  Skull,
  CornerUpLeft
} from 'lucide-react';

export interface CombatDetails {
  actor: 'player' | 'enemy';
  actorName: string;
  targetName: string;
  targetIndex?: number; // For multiple enemies with same name
  damage?: number;
  isCritical?: boolean;
  isMiss?: boolean;
  hpBefore: number;
  hpAfter: number;
  description: string;
  effects?: string[];
}

export interface CombatLogEntry {
  id: number;
  userId: number;
  turn: number;
  actionOrder: number;
  action: 'attack' | 'defend' | 'skill' | 'item' | 'escape';
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
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // Default 2x speed (500ms instead of 1000ms)
  const [showResult, setShowResult] = useState(false);

  // Animation states
  const [playerHp, setPlayerHp] = useState<{ [key: number]: { current: number; max: number } }>({});
  const [enemyHp, setEnemyHp] = useState<{ [key: number]: { current: number; max: number } }>({});
  const [lastAction, setLastAction] = useState<string>('');
  const [damageAnimation, setDamageAnimation] = useState<{ player: boolean; enemy: boolean }>({
    player: false,
    enemy: false
  });

  useEffect(() => {
    if (!combatResult) return;
    
    
    // Reset everything when NEW combat result arrives (not just when modal opens/closes)
    const initialHp: { [key: number]: { current: number; max: number } } = {};
    combatResult?.teamStats?.members?.forEach(member => {
      initialHp[member.userId] = { current: member.hp, max: member.maxHp }; // Use current HP from teamStats
    });
    setPlayerHp(initialHp);
    
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
    if (log.details.actor === 'player') {
      // Player attacks enemy - use targetIndex to update correct enemy
      setEnemyHp(prev => {
        const updatedEnemyHp = { ...prev };
        const targetIndex = log.details.targetIndex ?? 0; // Default to 0 if not provided
        
        
        if (updatedEnemyHp[targetIndex]) {
          updatedEnemyHp[targetIndex] = { 
            ...updatedEnemyHp[targetIndex], 
            current: Math.max(0, log.details.hpAfter || 0)
          };
        } else {
          console.error('No enemy found at targetIndex:', targetIndex, 'Available keys:', Object.keys(updatedEnemyHp));
        }
        
        return updatedEnemyHp;
      });
      setDamageAnimation(prev => ({ ...prev, enemy: true }));
      setTimeout(() => setDamageAnimation(prev => ({ ...prev, enemy: false })), 500);
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
      setTimeout(() => setDamageAnimation(prev => ({ ...prev, player: false })), 500);
    }

    setLastAction(log.details.description);
    setCurrentLogIndex(prev => prev + 1);
  }, [combatResult?.logs, currentLogIndex]);

  useEffect(() => {
    if (!isPlaying || !combatResult?.logs) {
      return;
    }
    
    // Check if we've processed all logs
    if (currentLogIndex >= (combatResult?.logs?.length || 0)) {
      setShowResult(true);
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      processNextLog();
    }, playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentLogIndex, playbackSpeed, combatResult, processNextLog]);

  const handlePlay = () => {
    if (showResult) return;
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setIsPlaying(false);
    processNextLog();
  };

  const handleSkipToEnd = () => {
    setIsPlaying(false);
    setCurrentLogIndex(combatResult?.logs.length || 0);
    setShowResult(true);
  };

  const handleSpeedChange = () => {
    const speeds = [2000, 1000, 500, 250]; // 0.5x, 1x, 2x, 4x
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const getSpeedLabel = () => {
    switch (playbackSpeed) {
      case 2000: return '0.5x';
      case 1000: return '1x';
      case 500: return '2x';
      case 250: return '4x';
      default: return '1x';
    }
  };

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
                          <div className="text-[11px] text-gray-300">HP</div>
                        </div>
                        <div className="mt-1">
                          <Progress
                            value={(playerHp[member.userId]?.current || member.hp) / (playerHp[member.userId]?.max || member.maxHp) * 100}
                            className={`h-2 bg-gray-700 ${damageAnimation.player ? 'animate-pulse' : ''}`}
                            style={{ '--progress-foreground': 'rgb(34 197 94)' } as React.CSSProperties}
                          />
                          <div className="text-[11px] text-gray-300 text-center mt-1">{playerHp[member.userId]?.current || member.hp}/{playerHp[member.userId]?.max || member.maxHp} HP</div>
                        </div>
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
                  {combatResult?.enemies && combatResult?.enemies.map((enemy, index) => {
                    const enemyId = index;
                    const currentHp = enemyHp[enemyId]?.current || enemy.hp;
                    const maxHp = enemyHp[enemyId]?.max || enemy.maxHp;

                    return (
                      <div key={enemyId} className="bg-gray-900/40 p-1 sm:p-2 rounded text-[12px]">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate max-w-[70%]">{enemy.name} #{index + 1}</div>
                          <div className="text-[11px] text-gray-300">Lv.{enemy.level}</div>
                        </div>
                        <div className="mt-1">
                          <Progress
                            value={(currentHp / maxHp) * 100}
                            className={`h-2 bg-gray-700 ${damageAnimation.enemy ? 'animate-pulse' : ''}`}
                            style={{
                              '--progress-foreground': 'rgb(239 68 68)'
                            } as React.CSSProperties}
                          />
                          <div className="text-[11px] text-gray-300 text-center mt-1">{currentHp}/{maxHp} HP</div>
                        </div>
                      </div>
                    );
                  })}
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
            </div>
            <div className="bg-white rounded p-3 min-h-[60px] flex items-center">
              {lastAction ? (
                <p className="text-gray-800 break-words">{lastAction}</p>
              ) : (
                <p className="text-gray-500 italic">Trận chiến sẽ bắt đầu...</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlay}
                disabled={showResult}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Tạm dừng' : 'Phát'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={isPlaying || showResult}
              >
                <SkipForward className="h-4 w-4" />
                Tiếp theo
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipToEnd}
                disabled={showResult}
              >
                <FastForward className="h-4 w-4" />
                Kết thúc
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSpeedChange}
              >
                {getSpeedLabel()}
              </Button>
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
