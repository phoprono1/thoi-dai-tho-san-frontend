import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Swords, User, Trophy } from 'lucide-react';

interface Opponent {
  id: number;
  userId: number;
  hunterPoints: number;
  currentRank: string;
  wins: number;
  losses: number;
  user: {
    id: number;
    username: string;
    level: number;
  };
  rankName: string;
  winRate: number;
}

interface OpponentsListProps {
  opponents: Opponent[];
  onChallenge: (opponentId: number) => void;
  onRefresh: () => void;
  canRefresh: boolean;
  canFight: boolean;
  loading: boolean;
}

const RANK_COLORS = {
  APPRENTICE: 'bg-gray-100 text-gray-800',
  AMATEUR: 'bg-green-100 text-green-800',
  PROFESSIONAL: 'bg-blue-100 text-blue-800',
  ELITE: 'bg-purple-100 text-purple-800',
  EPIC: 'bg-pink-100 text-pink-800',
  LEGENDARY: 'bg-orange-100 text-orange-800',
  MYTHICAL: 'bg-red-100 text-red-800',
  DIVINE: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
};

export function OpponentsList({ 
  opponents, 
  onChallenge, 
  onRefresh, 
  canRefresh, 
  canFight, 
  loading 
}: OpponentsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Đối thủ tiềm năng
            </CardTitle>
            <CardDescription>
              Chọn đối thủ có trình độ tương đương để thách đấu
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {opponents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Không tìm thấy đối thủ phù hợp</p>
            <p className="text-sm">Hãy thử làm mới danh sách</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {opponents.map((opponent) => (
              <div 
                key={opponent.id} 
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">{opponent.user.username}</span>
                      <Badge variant="secondary" className="flex-shrink-0">Lv.{opponent.user.level}</Badge>
                      <Badge className={`${RANK_COLORS[opponent.currentRank as keyof typeof RANK_COLORS]} flex-shrink-0`}>
                        {opponent.rankName}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Trophy className="h-3 w-3" />
                        {opponent.hunterPoints} điểm
                      </span>
                      <span className="flex-shrink-0">{opponent.wins}W/{opponent.losses}L</span>
                      <span className="flex-shrink-0">{(opponent.winRate || 0).toFixed(1)}% thắng</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => onChallenge(opponent.userId)}
                  disabled={loading}
                  className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
                  size="sm"
                >
                  <Swords className="h-4 w-4" />
                  Thách đấu
                </Button>
              </div>
            ))}
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
