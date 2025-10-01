import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Swords, Heart, Shield, Zap, Trophy, Skull, FastForward, Clock } from 'lucide-react';

interface Player {
  id?: string | number;
  name: string;
  level?: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  // Combat engine metadata
  metadata?: {
    level?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    maxHp?: number;
  };
  // Combat stats for compatibility
  stats?: {
    maxHp: number;
    attack: number;
    defense: number;
    speed?: number;
  };
}

interface Enemy extends Player {
  // Enemy specific properties can be added here
  isEnemy?: boolean;
}

interface CombatDetails {
  winner: string;
  turns: number;
  logs: Array<string | { message?: string; description?: string; text?: string }>;
  finalPlayers?: Player[];
  finalEnemies?: Enemy[];
}

interface CombatResultData {
  winnerId?: number;
  challengerId?: number;
  pointsChange?: number;
  combatResult?: CombatDetails;
  result?: string;
  turns?: number;
  logs?: Array<string | { message?: string; description?: string; text?: string }>;
  finalPlayers?: Player[];
  finalEnemies?: Enemy[];
  // Direct combat engine result structure
  finalResult?: {
    result: string;
    finalPlayers: Player[];
    finalEnemies: Enemy[];
    logs: Array<string | { message?: string; description?: string; text?: string }>;
    turns: number;
  };
}

interface CombatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combatResult: CombatResultData;
  currentUserId?: number;
}

// Combat dialog component implementation

export function CombatDialog({ open, onOpenChange, combatResult, currentUserId }: CombatDialogProps) {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playbackSpeed] = useState(167); // ~6x speed, tương tự như CombatModal
  const [playerHp, setPlayerHp] = useState<{ [key: string]: { current: number; max: number } }>({});
  const [enemyHp, setEnemyHp] = useState<{ [key: string]: { current: number; max: number } }>({});
  const [damageAnimation, setDamageAnimation] = useState({ player: false, enemy: false });
  const [showResult, setShowResult] = useState(false);
  
  // Xử lý dữ liệu combatResult sử dụng useMemo để tránh render không cần thiết
  const combatData = useMemo(() => {
    let isWin = false;
    let pointsChange = 0;
    let combat: CombatDetails = { winner: '', turns: 0, logs: [] };
    let logs: Array<string | { message?: string; description?: string; text?: string }> = [];
    let turns = 0;
    let finalPlayers: Player[] = [];
    let finalEnemies: Enemy[] = [];
    let isVictory = false;
    
    if (combatResult) {
      if (combatResult.challengerId !== undefined) {
        // Historical match from MatchHistory
        // Use passed currentUserId or assume challenger perspective
        const userId = currentUserId || combatResult.challengerId;
        isWin = combatResult.winnerId === userId;
        pointsChange = combatResult.pointsChange || 0;
        combat = combatResult.combatResult || { winner: '', turns: 0, logs: [] };
      } else {
        // Fresh combat result from challenge
        isWin = combatResult.winnerId === combatResult.challengerId;
        pointsChange = combatResult.pointsChange || 0;
        combat = combatResult.combatResult || combatResult as unknown as CombatDetails;
      }
      
      logs = combat.logs || combatResult.logs || [];
      turns = combat.turns || combatResult.turns || 0;
      
      // Extract finalPlayers and finalEnemies from combat result
      // They could be in combat.finalPlayers/finalEnemies or directly in combatResult
      finalPlayers = combat.finalPlayers || combatResult.finalPlayers || [];
      finalEnemies = combat.finalEnemies || combatResult.finalEnemies || [];
      
      // If no finalPlayers/finalEnemies, try to construct from other data
      if (finalPlayers.length === 0 && finalEnemies.length === 0) {
        // Try to extract from combatResult if it has the combat engine structure
        const resultData = combatResult as unknown as { 
          result?: string; 
          finalPlayers?: Player[]; 
          finalEnemies?: Enemy[]; 
        };
        if (resultData.result) {
          finalPlayers = resultData.finalPlayers || [];
          finalEnemies = resultData.finalEnemies || [];
        }
      }
      
      isVictory = isWin;
    }
    
    return {
      isWin,
      pointsChange,
      combat,
      logs,
      turns,
      finalPlayers,
      finalEnemies,
      isVictory
    };
  }, [combatResult, currentUserId]);
  
  // Helper functions to extract correct values from player/enemy data
  const getPlayerLevel = useCallback((player: Player): number => {
    return player.metadata?.level || player.level || 1;
  }, []);
  
  const getPlayerMaxHp = useCallback((player: Player): number => {
    return player.metadata?.maxHp || player.stats?.maxHp || player.maxHp || 100;
  }, []);
  
  const getPlayerCurrentHp = useCallback((player: Player): number => {
    return player.currentHp || getPlayerMaxHp(player);
  }, [getPlayerMaxHp]);
  
  const getPlayerAttack = useCallback((player: Player): number => {
    return player.metadata?.attack || player.stats?.attack || player.attack || 10;
  }, []);
  
  const getPlayerDefense = useCallback((player: Player): number => {
    return player.metadata?.defense || player.stats?.defense || player.defense || 5;
  }, []);
  
  const getPlayerSpeed = useCallback((player: Player): number => {
    return player.metadata?.speed || player.stats?.speed || player.speed || 100;
  }, []);
  
  // Hàm xử lý từng log
  const processLog = useCallback((index: number) => {
    const { logs } = combatData;
    if (!logs || !Array.isArray(logs) || !logs[index]) return;
    
    const log = logs[index];
    let logText = '';
    try {
      if (typeof log === 'string') {
        logText = log;
      } else if (log && typeof log === 'object') {
        logText = log.message || log.description || log.text || JSON.stringify(log);
      } else {
        logText = String(log);
      }
    } catch {
      logText = 'Invalid log entry';
    }
    
    // Xử lý animation dựa trên nội dung log
    if (logText.includes('gây') && logText.toLowerCase().includes('người chơi')) {
      // Đối thủ gây damage cho người chơi
      setDamageAnimation(prev => ({ ...prev, player: true }));
      setTimeout(() => setDamageAnimation(prev => ({ ...prev, player: false })), playbackSpeed * 0.8);
    } else if (logText.includes('gây')) {
      // Người chơi gây damage cho đối thủ
      setDamageAnimation(prev => ({ ...prev, enemy: true }));
      setTimeout(() => setDamageAnimation(prev => ({ ...prev, enemy: false })), playbackSpeed * 0.8);
    }
  }, [combatData, playbackSpeed]);
  
  useEffect(() => {
    if (open && combatResult) {
      // Reset state khi mở dialog
      setCurrentLogIndex(0);
      setIsAnimating(true);
      setShowResult(false);
      
      const { finalPlayers, finalEnemies } = combatData;
      
      // Khởi tạo HP cho người chơi và đối thủ
      const initialPlayerHp: { [key: string]: { current: number; max: number } } = {};
      if (finalPlayers && finalPlayers.length > 0) {
        finalPlayers.forEach((player: Player, idx: number) => {
          const maxHp = getPlayerMaxHp(player);
          const currentHp = getPlayerCurrentHp(player);
          initialPlayerHp[String(player.id || `player-${idx}`)] = {
            current: currentHp,
            max: maxHp
          };
        });
      }
      setPlayerHp(initialPlayerHp);
      
      const initialEnemyHp: { [key: string]: { current: number; max: number } } = {};
      if (finalEnemies && finalEnemies.length > 0) {
        finalEnemies.forEach((enemy: Enemy, idx: number) => {
          const maxHp = getPlayerMaxHp(enemy);
          const currentHp = getPlayerCurrentHp(enemy);
          initialEnemyHp[String(enemy.id || `enemy-${idx}`)] = {
            current: currentHp,
            max: maxHp
          };
        });
      }
      setEnemyHp(initialEnemyHp);
      
      // Auto-play combat logs với tốc độ nhanh hơn
      const interval = setInterval(() => {
        setCurrentLogIndex(prev => {
          const { logs } = combatData;
          if (logs && Array.isArray(logs) && prev < logs.length - 1) {
            processLog(prev); // Xử lý log hiện tại
            return prev + 1;
          } else {
            // Xử lý log cuối cùng
            if (logs && Array.isArray(logs) && prev < logs.length) {
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
    return undefined;
  }, [open, playbackSpeed, processLog, combatResult, combatData, getPlayerCurrentHp, getPlayerMaxHp]);
  
  // Lấy log hiện tại để hiển thị
  const getCurrentLogText = () => {
    const { logs } = combatData;
    if (!logs || !Array.isArray(logs) || !logs[currentLogIndex]) return '';
    
    const log = logs[currentLogIndex];
    try {
      if (typeof log === 'string') {
        return log;
      } else if (log && typeof log === 'object') {
        return log.message || log.description || log.text || JSON.stringify(log);
      } else {
        return String(log);
      }
    } catch {
      return 'Invalid log entry';
    }
  };
  


  // Nếu không có combatResult thì không hiển thị gì
  if (!combatResult) return null;
  
  // Lấy dữ liệu từ combatData
  const { isVictory, pointsChange, turns, finalPlayers, finalEnemies, logs } = combatData;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Kết quả trận đấu PvP
          </DialogTitle>
          <DialogDescription>
            Chi tiết về trận đấu PvP vừa diễn ra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showResult ? (
            // Combat Arena - Hiển thị khi đang animate
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white relative overflow-hidden">
              {/* Players Side */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Team 1 - Player */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Bạn
                  </h3>
                  
                  {finalPlayers && finalPlayers.length > 0 ? (
                    <div className="space-y-3">
                      {finalPlayers.map((player: Player, index: number) => {
                        const playerId = player.id || `player-${index}`;
                        const level = getPlayerLevel(player);
                        const maxHp = getPlayerMaxHp(player);
                        const currentHp = getPlayerCurrentHp(player);
                        const attack = getPlayerAttack(player);
                        const defense = getPlayerDefense(player);
                        const speed = getPlayerSpeed(player);
                        
                        return (
                          <div key={playerId} className="bg-blue-900/40 p-3 rounded-lg relative overflow-hidden border border-blue-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{player.name}</div>
                              <Badge className="bg-blue-600">
                                Lv.{level}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>HP</span>
                                <span>{playerHp[String(playerId)]?.current || currentHp}/{playerHp[String(playerId)]?.max || maxHp}</span>
                              </div>
                              <Progress
                                value={(playerHp[String(playerId)]?.current || currentHp) / (playerHp[String(playerId)]?.max || maxHp) * 100}
                                className={`h-2 bg-gray-700 ${damageAnimation.player ? 'animate-pulse' : ''}`}
                              />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Swords className="h-3 w-3 text-orange-400" />
                                <span>{attack}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-blue-400" />
                                <span>{defense}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-400" />
                                <span>{speed}</span>
                              </div>
                            </div>
                            
                            {/* Damage animation overlay */}
                            {damageAnimation.player && (
                              <div className="absolute inset-0 bg-red-500/30 animate-pulse pointer-events-none z-10" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 bg-gray-800/50 p-3 rounded">
                      Không có thông tin người chơi
                    </div>
                  )}
                </div>
                
                {/* Team 2 - Enemy */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-red-400 flex items-center gap-2 justify-end">
                    <span>Đối thủ</span>
                    <Swords className="h-4 w-4" />
                  </h3>
                  
                  {finalEnemies && finalEnemies.length > 0 ? (
                    <div className="space-y-3">
                      {finalEnemies.map((enemy: Enemy, index: number) => {
                        const enemyId = enemy.id || `enemy-${index}`;
                        const level = getPlayerLevel(enemy);
                        const maxHp = getPlayerMaxHp(enemy);
                        const currentHp = getPlayerCurrentHp(enemy);
                        const attack = getPlayerAttack(enemy);
                        const defense = getPlayerDefense(enemy);
                        const speed = getPlayerSpeed(enemy);
                        
                        return (
                          <div key={enemyId} className="bg-red-900/40 p-3 rounded-lg relative overflow-hidden border border-red-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{enemy.name}</div>
                              <Badge className="bg-red-600">
                                Lv.{level}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>HP</span>
                                <span>{enemyHp[String(enemyId)]?.current || currentHp}/{enemyHp[String(enemyId)]?.max || maxHp}</span>
                              </div>
                              <Progress
                                value={(enemyHp[String(enemyId)]?.current || currentHp) / (enemyHp[String(enemyId)]?.max || maxHp) * 100}
                                className={`h-2 bg-gray-700 ${damageAnimation.enemy ? 'animate-pulse' : ''}`}
                                style={{ '--progress-foreground': 'rgb(220 38 38)' } as React.CSSProperties}
                              />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Swords className="h-3 w-3 text-orange-400" />
                                <span>{attack}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-blue-400" />
                                <span>{defense}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-400" />
                                <span>{speed}</span>
                              </div>
                            </div>
                            
                            {/* Damage animation overlay */}
                            {damageAnimation.enemy && (
                              <div className="absolute inset-0 bg-red-500/30 animate-pulse pointer-events-none z-10" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 bg-gray-800/50 p-3 rounded">
                      Không có thông tin đối thủ
                    </div>
                  )}
                </div>
              </div>
              
              {/* Current Action Log */}
              <div className="bg-gray-800/70 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Tiến trình chiến đấu</h4>
                  <span className="text-xs text-gray-400">
                    Action {currentLogIndex + 1}/{logs?.length || 0}
                  </span>
                </div>
                
                <div className="bg-gray-900/60 p-3 rounded min-h-[60px] flex items-center animate-pulse">
                  <p className="text-white">{getCurrentLogText()}</p>
                </div>
              </div>
            </div>
          ) : (
            // Result Summary - Hiển thị khi hoàn thành
            <div className="space-y-6">
              {/* Result Card */}
              <div className={`bg-gradient-to-br ${isVictory ? 'from-green-900/80 to-emerald-800/80 border-green-700' : 'from-red-900/80 to-rose-800/80 border-red-700'} p-6 rounded-lg text-white relative overflow-hidden border`}>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    {isVictory ? <Trophy className="h-8 w-8 text-yellow-300" /> : <Skull className="h-8 w-8 text-red-300" />}
                    <h2 className="text-2xl font-bold">
                      {isVictory ? 'CHIẾN THẮNG' : 'THẤT BẠI'}
                    </h2>
                  </div>
                  
                  <div className="text-xl font-semibold">
                    <span className={isVictory ? 'text-green-300' : 'text-red-300'}>
                      {isVictory ? '+' : '-'}{Math.abs(pointsChange)} điểm Hunter
                    </span>
                  </div>
                  
                  <div className="text-sm opacity-80">
                    Trận đấu kéo dài {turns || 'N/A'} lượt
                  </div>
                </div>
              </div>
              
              {/* Final Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player Stats */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 text-blue-600 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Bạn
                    </h4>
                    {finalPlayers && finalPlayers.length > 0 ? (
                      finalPlayers.map((player: Player, index: number) => {
                        const maxHp = getPlayerMaxHp(player);
                        const currentHp = getPlayerCurrentHp(player);
                        const attack = getPlayerAttack(player);
                        const defense = getPlayerDefense(player);
                        const speed = getPlayerSpeed(player);
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{player.name}</span>
                              <Badge variant={currentHp > 0 ? 'default' : 'destructive'}>
                                {currentHp > 0 ? 'Sống' : 'Tử vong'}
                              </Badge>
                            </div>
                            <Progress
                              value={(currentHp / maxHp) * 100}
                              className="h-2"
                            />
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>{currentHp}/{maxHp} HP</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Swords className="h-3 w-3 text-orange-500" />
                                <span>{attack} ATK</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-blue-500" />
                                <span>{defense} DEF</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                <span>{speed} SPD</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Không có thông tin người chơi
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enemy Stats */}
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 text-red-600 flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      Đối thủ
                    </h4>
                    {finalEnemies && finalEnemies.length > 0 ? (
                      finalEnemies.map((enemy: Enemy, index: number) => {
                        const maxHp = getPlayerMaxHp(enemy);
                        const currentHp = getPlayerCurrentHp(enemy);
                        const attack = getPlayerAttack(enemy);
                        const defense = getPlayerDefense(enemy);
                        const speed = getPlayerSpeed(enemy);
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{enemy.name}</span>
                              <Badge variant={currentHp > 0 ? 'default' : 'destructive'}>
                                {currentHp > 0 ? 'Sống' : 'Tử vong'}
                              </Badge>
                            </div>
                            <Progress
                              value={(currentHp / maxHp) * 100}
                              className="h-2"
                              style={{ '--progress-foreground': 'rgb(220 38 38)' } as React.CSSProperties}
                            />
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>{currentHp}/{maxHp} HP</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Swords className="h-3 w-3 text-orange-500" />
                                <span>{attack} ATK</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-blue-500" />
                                <span>{defense} DEF</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                <span>{speed} SPD</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Không có thông tin đối thủ
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Combat Logs */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Nhật ký trận đấu
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
                    {logs && Array.isArray(logs) && logs.length > 0 ? (
                      logs.map((log, index) => {
                        // Convert log to string if it's an object
                        let logText = '';
                        try {
                          if (typeof log === 'string') {
                            logText = log;
                          } else if (log && typeof log === 'object') {
                            logText = log.message || log.description || log.text || JSON.stringify(log);
                          } else {
                            logText = String(log);
                          }
                        } catch {
                          logText = 'Invalid log entry';
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className={`p-2 rounded ${
                              logText.includes('gây') ? 'bg-red-50 text-red-700' :
                              logText.includes('hồi') ? 'bg-green-50 text-green-700' :
                              'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {logText}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        Không có log trận đấu chi tiết
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div>
              {isAnimating && !showResult && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-700"
                  onClick={() => {
                    setIsAnimating(false);
                    setShowResult(true);
                  }}
                >
                  <FastForward className="h-4 w-4" />
                  Bỏ qua
                </Button>
              )}
            </div>
            <Button 
              onClick={() => onOpenChange(false)}
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
