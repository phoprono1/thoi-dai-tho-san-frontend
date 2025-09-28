import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Swords, BarChart3, Calendar } from 'lucide-react';
import { PvpStatistics, PvpSeason, RANK_NAMES, RANK_COLORS } from '../AdminPvP';

interface PvpOverviewProps {
  statistics: PvpStatistics | null;
  seasons: PvpSeason[];
}

export function PvpOverview({ statistics, seasons }: PvpOverviewProps) {
  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số người chơi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPlayers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng trận đấu</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalMatches.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averageRating}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mùa giải hiện tại</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seasons.find(s => s.isActive)?.name || 'Không có'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rank Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bố Rank</CardTitle>
          <CardDescription>Số lượng người chơi ở từng bậc rank</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statistics.rankDistribution).map(([rank, count]) => (
              <div key={rank} className="text-center p-4 border rounded-lg">
                <Badge className={`mb-2 ${RANK_COLORS[rank as keyof typeof RANK_COLORS]}`}>
                  {RANK_NAMES[rank as keyof typeof RANK_NAMES]}
                </Badge>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {statistics.totalPlayers > 0 ? ((count / statistics.totalPlayers) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
