'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Shield, 
  Crown,
  Trophy,
  Skull,
  Zap,
  Target,
  FastForward,
  Clock
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
  rewards?: {
    items?: Array<{
      id: string;
      name: string;
      quantity: number;
    }>;
    gold?: number;
    exp?: number;
  };
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
  const [playbackSpeed] = useState(167); // ~6x speed, tương tự như CombatModal
  const [bossHp, setBossHp] = useState({ current: 0, max: 0 });
  const [damageAnimation, setDamageAnimation] = useState({ player: false, boss: false });
  const [showResult, setShowResult] = useState(false);

  // Hàm xử lý từng log, sử dụng useCallback để tối ưu hiệu năng
  const processLog = useCallback((index: number) => {
    if (!combatResult?.combatLogs) return;
    
    const log = combatResult.combatLogs[index];
    if (!log) return;
    
    // Xử lý animation dựa trên actor
    if (log.actor === 'player') {
      // Player gây damage cho boss
      setDamageAnimation(prev => ({ ...prev, boss: true }));
      setTimeout(() => setDamageAnimation(prev => ({ ...prev, boss: false })), playbackSpeed * 0.8);
      
      // Cập nhật HP boss nếu có damage
      if (log.damage) {
        setBossHp(prev => ({
          ...prev,
          current: Math.max(0, prev.current - (log.damage || 0))
        }));
      }
    } else {
      // Boss gây damage cho player
      setDamageAnimation(prev => ({ ...prev, player: true }));
      setTimeout(() => setDamageAnimation(prev => ({ ...prev, player: false })), playbackSpeed * 0.8);
    }
  }, [combatResult, playbackSpeed]);
  
  useEffect(() => {
    if (isOpen && combatResult) {
      // Reset state khi mở modal
      setCurrentLogIndex(0);
      setIsAnimating(true);
      setShowResult(false);
      setBossHp({ 
        current: combatResult.bossHpBefore || 0, 
        max: combatResult.bossHpBefore || 0 
      });
      
      // Auto-play combat logs với tốc độ nhanh hơn
      const interval = setInterval(() => {
        setCurrentLogIndex(prev => {
          if (prev < (combatResult.combatLogs?.length || 0) - 1) {
            processLog(prev); // Xử lý log hiện tại
            return prev + 1;
          } else {
            // Xử lý log cuối cùng
            if (prev < (combatResult.combatLogs?.length || 0)) {
              processLog(prev);
            }
            setIsAnimating(false);
            setShowResult(true);
            clearInterval(interval);
            return prev;
          }
        });
      }, playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [isOpen, combatResult, playbackSpeed, processLog]);

  if (!combatResult) return null;

  const currentLog = combatResult.combatLogs?.[currentLogIndex];
  // Không cần hpPercentage nữa vì đã dùng bossHp state

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
          <div className="bg-gradient-to-br from-red-900/80 to-purple-900/80 p-4 rounded-lg text-white relative overflow-hidden border border-purple-700">
            <div className="flex items-center gap-4 mb-4">
              {bossImage ? (
                <div className={`w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden ${damageAnimation.boss ? 'animate-pulse ring-2 ring-red-500' : ''}`}>
                  <Image 
                    src={`http://localhost:3005${bossImage}`} 
                    alt={bossName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className={`w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center ${damageAnimation.boss ? 'animate-pulse ring-2 ring-red-500' : ''}`}>
                  <Crown className="h-8 w-8 text-purple-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {bossName}
                  <Badge variant="outline" className="ml-2 bg-purple-800/60 text-white border-purple-700">
                    World Boss
                  </Badge>
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <Shield className="h-4 w-4" />
                  <span>HP: {Math.ceil(bossHp.current).toLocaleString()} / {bossHp.max.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>HP</span>
                <span>{Math.max(0, (bossHp.current / bossHp.max) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.max(0, (bossHp.current / bossHp.max) * 100)} 
                className="h-3 bg-gray-700/50" 
              />
            </div>
            
            {/* Damage animation overlay */}
            {damageAnimation.boss && (
              <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none z-10" />
            )}
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

          {/* Combat Arena with Player */}
          <div className="bg-gradient-to-br from-blue-900/80 to-indigo-900/80 p-4 rounded-lg text-white relative overflow-hidden border border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden ${damageAnimation.player ? 'animate-pulse ring-2 ring-red-500' : ''}`}>
                  <Sword className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{playerName || 'Bạn'}</h4>
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    <Sword className="h-3 w-3" /> Người chơi
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs font-medium text-gray-300">Damage gây ra</span>
                <div className="text-xl font-bold text-amber-400">
                  {combatResult.damage?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
            
            {/* Damage animation overlay */}
            {damageAnimation.player && (
              <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none z-10" />
            )}
          </div>

          {/* Combat Logs */}
          <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-white">
              <Zap className="h-4 w-4 text-yellow-400" />
              Chi tiết chiến đấu
            </h4>
            
            {showResult ? (
              // Combat Summary when finished
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${combatResult.success ? 'bg-green-900/40 border border-green-700 text-green-300' : 'bg-red-900/40 border border-red-700 text-red-300'}`}>
                  <div className="flex items-center gap-2">
                    {combatResult.success ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <Skull className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {combatResult.success ? 'Tấn công thành công!' : 'Không đủ sức mạnh!'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    {combatResult.success 
                      ? `Bạn đã gây ra ${combatResult.damage.toLocaleString()} sát thương cho ${bossName}.` 
                      : `Bạn cần trang bị mạnh hơn để đánh bại ${bossName}.`}
                  </p>
                </div>

                {combatResult.combatLogs && combatResult.combatLogs.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-1">
                    {combatResult.combatLogs.map((log, index) => (
                      <div 
                        key={index}
                        className={`p-2 rounded-md text-sm ${log.actor === 'player' ? 'bg-blue-900/40 text-blue-200' : 'bg-red-900/40 text-red-200'}`}
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
                            <span className={`ml-2 font-bold ${log.isCritical ? 'text-amber-400' : 'text-red-300'}`}>
                              {log.isMiss ? 'MISS!' : `${log.damage.toLocaleString()} sát thương`}
                              {log.isCritical && ' (CHÍ MẠNG!)'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Combat Animation during playback
              <div>
                {currentLog && (
                  <div 
                    className={`p-3 rounded-lg text-sm animate-pulse ${currentLog.actor === 'player' ? 'bg-blue-900/40 text-blue-200 border border-blue-700' : 'bg-red-900/40 text-red-200 border border-red-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      {currentLog.actor === 'player' ? (
                        <Sword className="h-4 w-4" />
                      ) : (
                        <Crown className="h-4 w-4" />
                      )}
                      <span className="font-medium">Turn {currentLog.turn}</span>
                    </div>
                    <div className="mt-2 text-lg font-medium">
                      {currentLog.description}
                      {currentLog.damage && (
                        <span className={`ml-2 font-bold ${currentLog.isCritical ? 'text-amber-400' : 'text-white'}`}>
                          {currentLog.isMiss ? 'MISS!' : `${currentLog.damage.toLocaleString()} sát thương`}
                          {currentLog.isCritical && ' (CHÍ MẠNG!)'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-between text-xs text-gray-400">
                  <span>Turn {currentLogIndex + 1}/{combatResult.combatLogs?.length || 0}</span>
                  <span>Đang tái hiện trận đấu...</span>
                </div>
              </div>
            )}
          </div>

          {/* Boss Defeated */}
          {combatResult.isBossDead && (
            <div className="bg-gradient-to-br from-yellow-900/80 to-amber-900/80 p-4 rounded-lg border border-yellow-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <div className="font-bold text-yellow-300 flex items-center gap-2">
                    Boss đã bị đánh bại!
                    <span className="animate-pulse">🎉</span>
                  </div>
                  <p className="text-sm text-yellow-200/80">
                    Phần thưởng đã được gửi vào hộp thư của bạn.
                  </p>
                  {combatResult.nextRespawnTime && (
                    <p className="text-xs text-yellow-300/70 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Boss tiếp theo: {new Date(combatResult.nextRespawnTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div>
              {isAnimating && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-700"
                  onClick={() => {
                    setIsAnimating(false);
                    setCurrentLogIndex(combatResult.combatLogs!.length - 1);
                    setShowResult(true);
                  }}
                >
                  <FastForward className="h-4 w-4" />
                  Bỏ qua
                </Button>
              )}
            </div>
            <Button 
              onClick={onClose}
              className={showResult ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {showResult ? 'Hoàn tất' : 'Đóng'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
