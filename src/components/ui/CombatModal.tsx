'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Shield, 
  Crown,
  Play,
  Pause,
  SkipForward,
  FastForward
} from 'lucide-react';

interface CombatDetails {
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

interface CombatLogEntry {
  id: number;
  userId: number;
  turn: number;
  actionOrder: number;
  action: 'attack' | 'defend' | 'skill' | 'item' | 'escape';
  details: CombatDetails;
}

interface CombatResult {
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
    
    console.log('Debug - CombatModal received combat result:', {
      enemiesExists: !!combatResult?.enemies,
      enemiesCount: combatResult?.enemies?.length || 0,
      enemies: combatResult?.enemies,
      sampleLog: combatResult?.logs?.[0] || 'No logs'
    });
    
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
      console.log('Debug - Initialized enemy HP with:', initialEnemyHp);
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

    console.log('Processing log:', log);

    // Update HP based on log
    if (log.details.actor === 'player') {
      // Player attacks enemy - use targetIndex to update correct enemy
      setEnemyHp(prev => {
        const updatedEnemyHp = { ...prev };
        const targetIndex = log.details.targetIndex ?? 0; // Default to 0 if not provided
        
        console.log('Updating enemy HP:', {
          targetIndex,
          targetIndexExists: log.details.targetIndex !== undefined,
          hpBefore: updatedEnemyHp[targetIndex]?.current,
          hpAfter: Math.max(0, log.details.hpAfter || 0),
          damage: log.details.damage,
          logDetails: log.details
        });
        
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

  const getResultColor = (result: string) => {
    switch (result) {
      case 'victory': return 'text-green-600 bg-green-100';
      case 'defeat': return 'text-red-600 bg-red-100';
      case 'escape': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!combatResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Trận chiến tại {dungeonName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Combat Arena */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white relative overflow-hidden">
            {/* Players Side */}
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-green-400 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Đội của bạn
                </h3>
                {combatResult?.teamStats?.members ? combatResult?.teamStats?.members.map((member) => (
                  <div key={member.userId} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{member.username}</span>
                      <span className="text-xs text-gray-300">
                        {playerHp[member.userId]?.current || member.hp}/{playerHp[member.userId]?.max || member.maxHp} HP
                      </span>
                    </div>
                    <Progress 
                      value={(playerHp[member.userId]?.current || member.hp) / (playerHp[member.userId]?.max || member.maxHp) * 100} 
                      className={`h-2 bg-gray-700 ${damageAnimation.player ? 'animate-pulse' : ''}`}
                      style={{
                        '--progress-foreground': 'rgb(34 197 94)' // green-500 for player team
                      } as React.CSSProperties}
                    />
                  </div>
                )) : <div className="text-sm text-gray-300">Không có thông tin đội</div>}
              </div>

              {/* VS */}
              <div className="text-4xl font-bold text-yellow-400">VS</div>

              {/* Enemy Side */}
              <div className="space-y-2 text-right">
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
                {combatResult?.enemies && combatResult?.enemies.map((enemy, index) => {
                  // Use index as enemyId since backend sends targetIndex matching this index
                  const enemyId = index;
                  const currentHp = enemyHp[enemyId]?.current || enemy.hp;
                  const maxHp = enemyHp[enemyId]?.max || enemy.maxHp;
                  
                  return (
                    <div key={enemyId} className="space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-gray-300">{currentHp}/{maxHp} HP</span>
                        <span className="text-sm font-medium">
                          {enemy.name} #{index + 1} (Lv.{enemy.level})
                        </span>
                      </div>
                      <Progress 
                        value={(currentHp / maxHp) * 100} 
                        className={`h-2 bg-gray-700 ${damageAnimation.enemy ? 'animate-pulse' : ''}`}
                        style={{
                          '--progress-foreground': 'rgb(239 68 68)' // red-500 for enemy
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
                
                {/* Fallback if no enemies data */}
                {!combatResult?.enemies && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-300">Unknown HP</span>
                      <span className="text-sm font-medium">Monster</span>
                    </div>
                    <Progress 
                      value={50} 
                      className={`h-2 bg-gray-700 ${damageAnimation.enemy ? 'animate-pulse' : ''}`}
                      style={{
                        '--progress-foreground': 'rgb(239 68 68)' // red-500 for enemy
                      } as React.CSSProperties}
                    />
                  </div>
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

          {/* Action Log */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">
                Turn {Math.ceil(currentLogIndex / 2)} - Action {currentLogIndex + 1} / {combatResult?.logs?.length || 0}
              </span>
            </div>
            <div className="bg-white rounded p-3 min-h-[60px] flex items-center">
              {lastAction ? (
                <p className="text-gray-800">{lastAction}</p>
              ) : (
                <p className="text-gray-500 italic">Trận chiến sẽ bắt đầu...</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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

            <Progress 
              value={(currentLogIndex / (combatResult?.logs?.length || 1)) * 100} 
              className="flex-1 mx-4 h-2"
            />
          </div>

          {/* Result */}
          {showResult && (
            <div className="bg-gray-50 rounded-lg p-6 text-center space-y-4">
              <Badge className={`text-lg py-2 px-4 ${getResultColor(combatResult?.result)}`}>
                {combatResult?.result === 'victory' ? '🏆 CHIẾN THẮNG!' : 
                 combatResult?.result === 'defeat' ? '💀 THẤT BẠI!' : '🏃 ĐÃ CHẠY TRỐN!'}
              </Badge>
              
              {combatResult?.rewards && (
                <div className="space-y-2">
                  <h4 className="font-bold">Phần thưởng:</h4>
                  <div className="flex justify-center gap-4 text-sm">
                    {combatResult?.rewards?.experience && (
                      <span>+{combatResult?.rewards?.experience} EXP</span>
                    )}
                    {combatResult?.rewards?.gold && (
                      <span>+{combatResult?.rewards?.gold} Gold</span>
                    )}
                  </div>
                </div>
              )}
              
              <Button onClick={onClose} className="mt-4">
                Đóng
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
