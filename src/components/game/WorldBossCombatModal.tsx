'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sword, 
  Shield, 
  Crown,
  Trophy,
  Skull,
  Zap,
  Target
} from 'lucide-react';

export interface WorldBossCombatResult {
  success: boolean;
  damage: number;
  bossHpBefore: number;
  bossHpAfter: number;
  isBossDead: boolean;
  combatLogs?: Array<{
    turn: number;
    actor: 'player' | 'boss';
    action: string;
    damage?: number;
    isCritical?: boolean;
    isMiss?: boolean;
    description: string;
  }>;
  currentPhase?: number;
  totalDamageReceived?: number;
  rewards?: any;
  nextRespawnTime?: string;
}

interface WorldBossCombatModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatResult: WorldBossCombatResult | null;
  bossName: string;
  bossImage?: string;
  playerName: string;
}

export function WorldBossCombatModal({
  isOpen,
  onClose,
  combatResult,
  bossName,
  bossImage,
  playerName,
}: WorldBossCombatModalProps) {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && combatResult?.combatLogs) {
      setCurrentLogIndex(0);
      setIsAnimating(true);
      
      // Auto-play combat logs
      const interval = setInterval(() => {
        setCurrentLogIndex(prev => {
          if (prev < combatResult.combatLogs!.length - 1) {
            return prev + 1;
          } else {
            setIsAnimating(false);
            clearInterval(interval);
            return prev;
          }
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isOpen, combatResult]);

  if (!combatResult) return null;

  const currentLog = combatResult.combatLogs?.[currentLogIndex];
  const hpPercentage = combatResult.bossHpAfter / combatResult.bossHpBefore * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Tấn công {bossName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Boss Status */}
          <div className="bg-gradient-to-r from-red-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              {bossImage ? (
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={`http://localhost:3005${bossImage}`} 
                    alt={bossName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Crown className="h-8 w-8 text-purple-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{bossName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>HP: {combatResult.bossHpAfter.toLocaleString()} / {combatResult.bossHpBefore.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>HP</span>
                <span>{Math.max(0, hpPercentage).toFixed(1)}%</span>
              </div>
              <Progress value={Math.max(0, hpPercentage)} className="h-3" />
            </div>
          </div>

          {/* Combat Result Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sword className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Kết quả tấn công</span>
              </div>
              {combatResult.success ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Thành công</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <Skull className="h-4 w-4" />
                  <span className="text-sm font-medium">Thất bại</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Sát thương gây ra:</span>
                <div className="text-xl font-bold text-red-600">
                  {combatResult.damage.toLocaleString()}
                </div>
              </div>
              {combatResult.currentPhase && (
                <div>
                  <span className="text-gray-600">Phase hiện tại:</span>
                  <div className="text-xl font-bold text-purple-600">
                    {combatResult.currentPhase}/3
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combat Logs */}
          {combatResult.combatLogs && combatResult.combatLogs.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                Chi tiết chiến đấu
              </h4>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {combatResult.combatLogs.slice(0, currentLogIndex + 1).map((log, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded text-sm ${
                      log.actor === 'player' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    } ${index === currentLogIndex && isAnimating ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {log.actor === 'player' ? (
                        <Sword className="h-3 w-3" />
                      ) : (
                        <Crown className="h-3 w-3" />
                      )}
                      <span className="font-medium">Turn {log.turn}</span>
                    </div>
                    <div className="mt-1">
                      {log.description}
                      {log.damage && (
                        <span className={`ml-2 font-bold ${
                          log.isCritical ? 'text-orange-600' : ''
                        }`}>
                          {log.isMiss ? 'MISS!' : `${log.damage.toLocaleString()} damage`}
                          {log.isCritical && ' (CRITICAL!)'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {isAnimating && (
                <div className="mt-2 text-center text-sm text-gray-500">
                  Đang phát lại chiến đấu... ({currentLogIndex + 1}/{combatResult.combatLogs.length})
                </div>
              )}
            </div>
          )}

          {/* Boss Defeated */}
          {combatResult.isBossDead && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-yellow-800">Boss đã bị đánh bại!</span>
              </div>
              <p className="text-sm text-yellow-700">
                Phần thưởng đã được gửi vào hộp thư của bạn.
              </p>
              {combatResult.nextRespawnTime && (
                <p className="text-xs text-yellow-600 mt-1">
                  Boss tiếp theo sẽ xuất hiện lúc: {new Date(combatResult.nextRespawnTime).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isAnimating && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsAnimating(false);
                  setCurrentLogIndex(combatResult.combatLogs!.length - 1);
                }}
              >
                Bỏ qua
              </Button>
            )}
            <Button onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
