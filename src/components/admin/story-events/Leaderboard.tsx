import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Award, Crown } from "lucide-react";

export type LeaderboardRow = {
  userId: number;
  username?: string | null;
  // backend may return either `score` or `totalScore` depending on API version
  score?: number;
  totalScore?: number;
  itemsContributed?: number;
};

type Props = {
  rows: LeaderboardRow[];
};

export default function StoryEventLeaderboard({ rows }: Props) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="h-8 w-8 text-muted-foreground/50" />
                      <span>No leaderboard data available</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => {
                  const parseNumeric = (val: unknown): number => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                      const parsed = parseFloat(val);
                      return isNaN(parsed) ? 0 : parsed;
                    }
                    return 0;
                  };

                  const rank = i + 1;
                  const numericScore: number = parseNumeric(r.score ?? r.totalScore);
                  const numericItems: number = parseNumeric(r.itemsContributed);

                  return (
                    <TableRow key={r.userId} className={rank <= 3 ? "bg-muted/30" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(rank)}
                          {rank <= 3 && (
                            <Badge variant={getRankBadgeVariant(rank)} className="text-xs">
                              #{rank}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {r.username ?? `Player #${r.userId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {r.userId}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {numericScore.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {numericItems.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
