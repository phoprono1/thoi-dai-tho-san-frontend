import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Trophy,
  Trash2,
  XCircle,
  Gift,
  Calendar,
  Target,
} from "lucide-react";

export type StoryEventSummary = {
  id: number;
  title: string;
  createdAt: string;
  eventStart?: string | null;
  rewardDistributedAt?: string | null;
  requirements?: unknown;
};

export type StoryEventProgress = {
  totalDungeonClears: number;
  totalEnemyKills: number;
  totalItemsContributed: number;
  requiredTotal?: number; // computed required total (e.g., sum dungeon counts)
};

type Props = {
  events: StoryEventSummary[];
  progressMap?: Record<number, StoryEventProgress>;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onHardDelete?: (id: number) => void;
  onViewLeaderboard?: (id: number) => void;
  onDistribute?: (id: number) => void;
};

export default function StoryEventList({
  events,
  progressMap,
  onEdit,
  onDelete,
  onHardDelete,
  onViewLeaderboard,
  onDistribute
}: Props) {
  console.log('StoryEventList render:', { events, progressMap });

  const getStatusBadge = (event: StoryEventSummary) => {
    const now = new Date();
    const startDate = event.eventStart ? new Date(event.eventStart) : null;
    const distributed = event.rewardDistributedAt;

    if (distributed) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (startDate && startDate > now) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    }
    if (startDate && startDate <= now) {
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Active</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const getProgressPercentage = (event: StoryEventSummary) => {
    const p = progressMap ? progressMap[event.id] : undefined;
    const req = event.requirements as Record<string, unknown> | undefined;

    if (!req || !p) return null;

    const requiredDungeon = req && Array.isArray(req['completeDungeons'])
      ? (req['completeDungeons'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['count']) || 0), 0)
      : 0;
    const requiredEnemies = req && Array.isArray(req['killEnemies'])
      ? (req['killEnemies'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['count']) || 0), 0)
      : 0;
    const requiredItems = req && Array.isArray(req['collectItems'])
      ? (req['collectItems'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['quantity']) || 0), 0)
      : 0;

    const required = requiredDungeon + requiredEnemies + requiredItems;
    const completed = (Number(p.totalDungeonClears || 0) + Number(p.totalEnemyKills || 0) + Number(p.totalItemsContributed || 0));

    if (required === 0) return null;

    return Math.min(100, Math.round((completed / required) * 100));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Story Events Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Target className="h-8 w-8 text-muted-foreground/50" />
                      <span>No events found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((e) => {
                  const progressPercent = getProgressPercentage(e);
                  const p = progressMap ? progressMap[e.id] : undefined;
                  const req = e.requirements as Record<string, unknown> | undefined;

                  const requiredDungeon = req && Array.isArray(req['completeDungeons'])
                    ? (req['completeDungeons'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['count']) || 0), 0)
                    : 0;
                  const requiredEnemies = req && Array.isArray(req['killEnemies'])
                    ? (req['killEnemies'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['count']) || 0), 0)
                    : 0;
                  const requiredItems = req && Array.isArray(req['collectItems'])
                    ? (req['collectItems'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['quantity']) || 0), 0)
                    : 0;
                  const required = (requiredDungeon + requiredEnemies + requiredItems) || undefined;
                  const completed = (p ? (Number(p.totalDungeonClears || 0) + Number(p.totalEnemyKills || 0) + Number(p.totalItemsContributed || 0)) : 0);

                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">#{e.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{e.title || '(untitled)'}</div>
                        {progressPercent !== null && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {progressPercent}% complete
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(e)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.eventStart ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(e.eventStart).toLocaleDateString()}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {required != null ? (
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {completed}/{required}
                            </div>
                            {progressPercent !== null && (
                              <div className="w-16 bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {p ? `${completed}` : '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(e.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {onViewLeaderboard && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewLeaderboard(e.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trophy className="h-3 w-3" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(e.id)}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          {onHardDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onHardDelete(e.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {onDistribute && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDistribute(e.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Gift className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
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
