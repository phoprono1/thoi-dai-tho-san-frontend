import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Gift, Zap, Target, Crown } from 'lucide-react';

interface PvpRanking {
  id: number;
  hunterPoints: number;
  currentRank: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winStreak: number;
  bestWinStreak: number;
  highestPoints: number;
  hasClaimedDailyReward: boolean;
  lastDailyRewardDate: string | null;
  lastMatchAt?: string | null;
  lastOpponentRefreshAt?: string | null;
  canFight?: boolean;
  canRefreshOpponents?: boolean;
  winRate: number;
  rankName: string;
}

interface PvpRankingCardProps {
  ranking: PvpRanking;
  onClaimReward: () => void;
  loading: boolean;
}

const RANK_COLORS = {
  APPRENTICE: 'bg-gray-100 text-gray-800 border-gray-200',
  AMATEUR: 'bg-green-100 text-green-800 border-green-200',
  PROFESSIONAL: 'bg-blue-100 text-blue-800 border-blue-200',
  ELITE: 'bg-purple-100 text-purple-800 border-purple-200',
  EPIC: 'bg-pink-100 text-pink-800 border-pink-200',
  LEGENDARY: 'bg-orange-100 text-orange-800 border-orange-200',
  MYTHICAL: 'bg-red-100 text-red-800 border-red-200',
  DIVINE: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300',
};

const RANK_THRESHOLDS = {
  APPRENTICE: { min: 0, max: 999 },
  AMATEUR: { min: 1000, max: 1499 },
  PROFESSIONAL: { min: 1500, max: 1999 },
  ELITE: { min: 2000, max: 2499 },
  EPIC: { min: 2500, max: 2999 },
  LEGENDARY: { min: 3000, max: 3499 },
  MYTHICAL: { min: 3500, max: 3999 },
  DIVINE: { min: 4000, max: 999999 },
};

export function PvpRankingCard({ ranking, onClaimReward, loading }: PvpRankingCardProps) {
  const currentThreshold = RANK_THRESHOLDS[ranking.currentRank as keyof typeof RANK_THRESHOLDS];
  const progressToNext = currentThreshold ? 
    ((ranking.hunterPoints - currentThreshold.min) / (currentThreshold.max - currentThreshold.min)) * 100 : 100;

  const getNextRankName = () => {
    const ranks = Object.keys(RANK_THRESHOLDS);
    const currentIndex = ranks.indexOf(ranking.currentRank);
    if (currentIndex < ranks.length - 1) {
      const nextRank = ranks[currentIndex + 1];
      return RANK_THRESHOLDS[nextRank as keyof typeof RANK_THRESHOLDS];
    }
    return null;
  };

  const nextRank = getNextRankName();

  // Calculate cooldown status
  const getCooldownStatus = () => {
    if (!ranking.lastMatchAt) return { canFight: true, remainingTime: 0 };
    
    const lastMatch = new Date(ranking.lastMatchAt);
    const now = new Date();
    const timeDiff = now.getTime() - lastMatch.getTime();
    const cooldownTime = 60000; // 60 seconds
    
    if (timeDiff >= cooldownTime) {
      return { canFight: true, remainingTime: 0 };
    } else {
      return { canFight: false, remainingTime: Math.ceil((cooldownTime - timeDiff) / 1000) };
    }
  };

  const cooldownStatus = getCooldownStatus();

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Thông tin Ranking
                <Badge className={RANK_COLORS[ranking.currentRank as keyof typeof RANK_COLORS]}>
                  {ranking.rankName}
                </Badge>
              </CardTitle>
              <CardDescription>
                {ranking.hunterPoints} điểm Hunter • #{ranking.hunterPoints} toàn server
              </CardDescription>
            </div>
          </div>
          
          {!ranking.hasClaimedDailyReward && (
            <Button 
              onClick={onClaimReward}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Nhận thưởng hàng ngày
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress to next rank */}
        {nextRank && ranking.currentRank !== 'DIVINE' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ lên rank tiếp theo</span>
              <span>{ranking.hunterPoints}/{nextRank.min} điểm</span>
            </div>
            <Progress value={Math.min(progressToNext, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              Còn {Math.max(0, nextRank.min - ranking.hunterPoints)} điểm để lên rank tiếp theo
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{ranking.wins}</div>
            <div className="text-sm text-green-700">Thắng</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{ranking.losses}</div>
            <div className="text-sm text-red-700">Thua</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{(ranking.winRate || 0).toFixed(1)}%</div>
            <div className="text-sm text-blue-700">Tỷ lệ thắng</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{ranking.winStreak}</div>
            <div className="text-sm text-purple-700">Chuỗi thắng</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Chuỗi thắng tốt nhất:</span>
            <span className="font-medium">{ranking.bestWinStreak}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Điểm cao nhất:</span>
            <span className="font-medium">{ranking.highestPoints}</span>
          </div>
        </div>

        {/* Combat Status - Always ready */}
        <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
          <Zap className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-700">
            Sẵn sàng chiến đấu
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
