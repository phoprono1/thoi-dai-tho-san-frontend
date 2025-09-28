import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';
import { PvpStatistics, RANK_NAMES, RANK_COLORS } from '../AdminPvP';

interface PvpLeaderboardProps {
  statistics: PvpStatistics | null;
}

export function PvpLeaderboard({ statistics }: PvpLeaderboardProps) {
  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 người chơi</CardTitle>
        <CardDescription>Bảng xếp hạng hiện tại</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hạng</TableHead>
              <TableHead>Người chơi</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Thắng/Thua</TableHead>
              <TableHead>Tỷ lệ thắng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statistics.topPlayers.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <Trophy className={`h-4 w-4 ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 'text-orange-600'
                      }`} />
                    )}
                    #{index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{player.user.username}</div>
                </TableCell>
                <TableCell>
                  <Badge className={RANK_COLORS[player.currentRank as keyof typeof RANK_COLORS]}>
                    {RANK_NAMES[player.currentRank as keyof typeof RANK_NAMES]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-mono">{player.hunterPoints}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="text-green-600">{player.wins}</span>
                    {' / '}
                    <span className="text-red-600">{player.losses}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {player.wins + player.losses > 0 
                      ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) 
                      : 0}%
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
