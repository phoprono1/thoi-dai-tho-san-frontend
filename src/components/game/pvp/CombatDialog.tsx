import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Swords, Heart, Shield, Zap, Trophy } from 'lucide-react';

interface CombatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combatResult: any;
  currentUserId?: number;
}

export function CombatDialog({ open, onOpenChange, combatResult, currentUserId }: CombatDialogProps) {
  if (!combatResult) return null;

  // Debug: Log the combat result structure
  console.log('PvP Combat Result:', combatResult);

  // Handle both fresh combat result and historical match
  let isWin, pointsChange, combat;
  
  if (combatResult.challengerId !== undefined) {
    // Historical match from MatchHistory
    // Use passed currentUserId or assume challenger perspective
    const userId = currentUserId || combatResult.challengerId;
    isWin = combatResult.winnerId === userId;
    pointsChange = combatResult.pointsChange || 0;
    combat = combatResult.combatResult || {};
  } else {
    // Fresh combat result from challenge
    isWin = combatResult.winnerId === combatResult.challengerId;
    pointsChange = combatResult.pointsChange || 0;
    combat = combatResult.combatResult || combatResult;
  }
  
  const { result, turns, logs, finalPlayers, finalEnemies } = combat;
  const isVictory = isWin;

  console.log('Combat data:', { result, turns, logs, finalPlayers, finalEnemies });
  console.log('Logs type and content:', logs, typeof logs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Kết quả trận đấu
          </DialogTitle>
          <DialogDescription>
            Chi tiết về trận đấu PvP vừa diễn ra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Result Summary */}
          <Card className={`${isVictory ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className={`text-3xl font-bold ${isVictory ? 'text-green-600' : 'text-red-600'}`}>
                  {isVictory ? '🎉 CHIẾN THẮNG!' : '💔 THẤT BẠI!'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className={`font-medium ${isVictory ? 'text-green-600' : 'text-red-600'}`}>
                    {isVictory ? '+' : '-'}{Math.abs(pointsChange)} điểm Hunter
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Trận đấu kéo dài {turns || 'N/A'} lượt
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Stats */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-blue-600">Bạn</h4>
                {finalPlayers && finalPlayers.length > 0 ? (
                  finalPlayers.map((player: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{player.name}</span>
                      <Badge variant={player.currentHp > 0 ? 'default' : 'destructive'}>
                        {player.currentHp > 0 ? 'Sống' : 'Tử vong'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>{player.currentHp}/{player.maxHp} HP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Swords className="h-3 w-3 text-orange-500" />
                        <span>{player.attack} ATK</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-blue-500" />
                        <span>{player.defense} DEF</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>{player.speed} SPD</span>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    Không có thông tin người chơi
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enemy Stats */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-red-600">Đối thủ</h4>
                {finalEnemies && finalEnemies.length > 0 ? (
                  finalEnemies.map((enemy: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{enemy.name}</span>
                      <Badge variant={enemy.currentHp > 0 ? 'default' : 'destructive'}>
                        {enemy.currentHp > 0 ? 'Sống' : 'Tử vong'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>{enemy.currentHp}/{enemy.maxHp} HP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Swords className="h-3 w-3 text-orange-500" />
                        <span>{enemy.attack} ATK</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-blue-500" />
                        <span>{enemy.defense} DEF</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>{enemy.speed} SPD</span>
                      </div>
                    </div>
                  </div>
                  ))
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
              <h4 className="font-medium mb-3">Nhật ký trận đấu</h4>
              <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
                {logs && Array.isArray(logs) && logs.length > 0 ? (
                  logs.map((log: any, index: number) => {
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
                    } catch (error) {
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
      </DialogContent>
    </Dialog>
  );
}
