"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StoryEventList, { StoryEventSummary, StoryEventProgress } from '@/components/admin/story-events/List';
import StoryEventLeaderboard, { LeaderboardRow } from '@/components/admin/story-events/Leaderboard';
import { storyEventsService } from '@/services/storyEvents';
import { Plus, Target, TrendingUp, Users, RefreshCw, Trophy } from "lucide-react";

export default function AdminStoryEventsPage() {
  const [events, setEvents] = useState<StoryEventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<number, StoryEventProgress> | undefined>(undefined);
  const [leaderboardModal, setLeaderboardModal] = useState<{ show: boolean; eventId?: number; eventTitle?: string; rows?: LeaderboardRow[] }>({ show: false });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      console.log('Loading story events...');
      const data = await storyEventsService.listAll();
      console.log('Loaded events:', data);
      const items = data || [];
      // fetch global progress for each event in parallel
      type ProgRow = { id: number | null; progress: unknown | null };
      const progresses = await Promise.all(items.map(async (ev: unknown): Promise<ProgRow> => {
        const id = (ev as Record<string, unknown>)['id'] as number | undefined;
        if (!id) return { id: null, progress: null };
        try {
          const p = await storyEventsService.getGlobalProgress(id);
          return { id, progress: p };
        } catch {
          return { id, progress: null };
        }
      }));
      const pm: Record<number, StoryEventProgress> = {};
      for (const x of progresses) {
        if (!x || x.id == null) continue;
        const raw = x.progress as Record<string, unknown> | null;
        pm[x.id] = {
          totalDungeonClears: Number(raw?.['totalDungeonClears'] ?? 0),
          totalEnemyKills: Number(raw?.['totalEnemyKills'] ?? 0),
          totalItemsContributed: Number(raw?.['totalItemsContributed'] ?? 0),
        } as StoryEventProgress;
      }
      console.log('Setting events:', items);
      setEvents(items || []);
      setProgressMap(pm);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLeaderboard = async (eventId: number) => {
    try {
      const event = events.find(e => e.id === eventId);
      const rows = await storyEventsService.leaderboard(eventId);
      setLeaderboardModal({
        show: true,
        eventId,
        eventTitle: event?.title || `Event ${eventId}`,
        rows
      });
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      alert('Failed to load leaderboard');
    }
  };

  const getStats = () => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => {
      const now = new Date();
      const startDate = e.eventStart ? new Date(e.eventStart) : null;
      const distributed = e.rewardDistributedAt;
      return !distributed && startDate && startDate <= now;
    }).length;
    const completedEvents = events.filter(e => e.rewardDistributedAt).length;

    return { totalEvents, activeEvents, completedEvents };
  };

  const stats = getStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Story Events Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor story events, leaderboards, and rewards distribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/story-events/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              All story events created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Currently running events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completedEvents}</div>
            <p className="text-xs text-muted-foreground">
              Events with rewards distributed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <StoryEventList
          events={events}
          progressMap={progressMap}
          onEdit={(id) => { window.location.href = `/admin/story-events/${id}` }}
          onViewLeaderboard={handleViewLeaderboard}
          onDelete={async (id) => {
            if (!confirm('Vô hiệu hóa story event này?')) return;
            await storyEventsService.delete(id);
            load();
          }}
          onHardDelete={async (id) => {
            if (!confirm('XÓA VĨNH VIỄN story event này? Hành động này không thể hoàn tác!')) return;
            await storyEventsService.hardDelete(id);
            load();
          }}
          onDistribute={async (id) => {
            if (!confirm('Run distribution for event ' + id + '?')) return;
            await storyEventsService.distribute(id, { mode: 'pool' } as unknown);
            load();
          }}
        />
      )}

      {/* Leaderboard Modal */}
      <Dialog open={leaderboardModal.show} onOpenChange={(open) => setLeaderboardModal({ show: open })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard: {leaderboardModal.eventTitle}
            </DialogTitle>
          </DialogHeader>
          {leaderboardModal.rows && (
            <StoryEventLeaderboard rows={leaderboardModal.rows} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
