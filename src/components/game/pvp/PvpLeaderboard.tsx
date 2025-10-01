import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

interface LeaderboardPlayer {
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

interface PvpLeaderboardProps {
  players: LeaderboardPlayer[];
  currentUserId: number;
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

export function PvpLeaderboard({ players, currentUserId }: PvpLeaderboardProps) {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-600" />;
      default: return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankBg = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-primary/10 border-primary/20';
    if (position <= 3) return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
    return 'hover:bg-muted/50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Bảng xếp hạng
        </CardTitle>
        <CardDescription>
          Top 50 thợ săn hàng đầu trong mùa giải hiện tại
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có dữ liệu bảng xếp hạng</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, index) => {
              // Skip if user data is missing (defensive check)
              if (!player.user) {
                console.warn(`Player ${player.id} has no user data, skipping`);
                return null;
              }

              const position = index + 1;
              const isCurrentUser = player.user.id === currentUserId;
              
              return (
                <div 
                  key={player.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg transition-colors ${getRankBg(position, isCurrentUser)}`}
                >
                  {/* Rank Position */}
                  <div className="flex items-center justify-between sm:justify-center sm:w-12">
                    <div className="flex items-center gap-1">
                      {getRankIcon(position)}
                      <span className={`font-bold ${position <= 3 ? 'text-lg' : 'text-sm'}`}>
                        #{position}
                      </span>
                    </div>
                    
                    {/* Special Badge for Top 3 - Mobile */}
                    {position <= 3 && (
                      <div className="sm:hidden">
                        <Badge 
                          variant="outline" 
                          className={
                            position === 1 ? 'border-yellow-400 text-yellow-600' :
                            position === 2 ? 'border-gray-400 text-gray-600' :
                            'border-orange-400 text-orange-600'
                          }
                        >
                          {position === 1 ? 'Vô địch' : position === 2 ? 'Á quân' : 'Hạng 3'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Player Info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {player.user.username}
                        {isCurrentUser && <span className="text-xs text-primary ml-1">(Bạn)</span>}
                      </span>
                      <Badge variant="secondary" className="flex-shrink-0">Lv.{player.user.level}</Badge>
                      <Badge className={`${RANK_COLORS[player.currentRank as keyof typeof RANK_COLORS]} flex-shrink-0`}>
                        {player.rankName}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <span className="font-mono font-medium text-primary flex-shrink-0">
                        {player.hunterPoints} điểm
                      </span>
                      <span className="flex-shrink-0">{player.wins}W/{player.losses}L</span>
                      <span className="flex-shrink-0">{(player.winRate || 0).toFixed(1)}% thắng</span>
                    </div>
                  </div>
                  
                  {/* Special Badges for Top 3 - Desktop */}
                  {position <= 3 && (
                    <div className="hidden sm:block text-right">
                      <Badge 
                        variant="outline" 
                        className={
                          position === 1 ? 'border-yellow-400 text-yellow-600' :
                          position === 2 ? 'border-gray-400 text-gray-600' :
                          'border-orange-400 text-orange-600'
                        }
                      >
                        {position === 1 ? 'Vô địch' : position === 2 ? 'Á quân' : 'Hạng 3'}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
