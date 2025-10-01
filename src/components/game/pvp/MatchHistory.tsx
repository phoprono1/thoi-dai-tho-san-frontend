import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Swords, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useState } from 'react';
import { CombatDialog } from './CombatDialog';

interface PvpMatch {
  id: number;
  challengerId: number;
  defenderId: number;
  winnerId: number | null;
  challengerPointsBefore: number;
  defenderPointsBefore: number;
  challengerPointsAfter: number;
  defenderPointsAfter: number;
  pointsChange: number;
  combatResult: any;
  createdAt: string;
  challenger: { id: number; username: string };
  defender: { id: number; username: string };
  isWin: boolean;
}

interface MatchHistoryProps {
  matches: PvpMatch[];
  currentUserId: number;
}

export function MatchHistory({ matches, currentUserId }: MatchHistoryProps) {
  const [selectedMatch, setSelectedMatch] = useState<PvpMatch | null>(null);
  const [showCombat, setShowCombat] = useState(false);

  const viewCombatDetails = (match: PvpMatch) => {
    setSelectedMatch(match);
    setShowCombat(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Mobile-friendly shorter format
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchResult = (match: PvpMatch) => {
    const isChallenger = match.challengerId === currentUserId;
    const won = match.winnerId === currentUserId;
    const opponent = isChallenger ? match.defender : match.challenger;
    const pointsChange = isChallenger ? match.pointsChange : -match.pointsChange;
    
    return {
      won,
      opponent,
      pointsChange: Math.abs(pointsChange),
      isPointsGain: won
    };
  };

  const convertMatchToCombatResult = (match: PvpMatch) => {
    return {
      winnerId: match.winnerId || undefined,
      challengerId: match.challengerId,
      pointsChange: match.pointsChange,
      combatResult: match.combatResult,
    };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lịch sử trận đấu
          </CardTitle>
          <CardDescription>
            Xem lại các trận đấu gần đây của bạn
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có trận đấu nào</p>
              <p className="text-sm">Hãy thách đấu để bắt đầu hành trình PvP</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const result = getMatchResult(match);
                
                return (
                  <div 
                    key={match.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg ${
                      result.won ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        result.won ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Swords className={`h-4 w-4 ${
                          result.won ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={result.won ? 'default' : 'destructive'} className="flex-shrink-0">
                            {result.won ? 'THẮNG' : 'THUA'}
                          </Badge>
                          <span className="font-medium truncate">vs {result.opponent.username}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span className="flex-shrink-0">{formatDate(match.createdAt)}</span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            {result.isPointsGain ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={result.isPointsGain ? 'text-green-600' : 'text-red-600'}>
                              {result.isPointsGain ? '+' : '-'}{result.pointsChange} điểm
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewCombatDetails(match)}
                      className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sm:inline">Xem chi tiết</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CombatDialog
        open={showCombat}
        onOpenChange={setShowCombat}
        combatResult={selectedMatch ? convertMatchToCombatResult(selectedMatch) : {}}
        currentUserId={currentUserId}
      />
    </>
  );
}
