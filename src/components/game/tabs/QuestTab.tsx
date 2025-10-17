'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Trophy,
  Clock,
  CheckCircle,
  Circle,
  Coins,
  Gem,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { storyEventsService, type LeaderboardRow } from '@/services/storyEvents';
import { Dungeon, Item } from '@/types';

// Local lightweight type for reward items which may be stored as objects
interface RewardItem {
  itemId?: number;
  id?: number;
  itemName?: string;
  quantity?: number;
  qty?: number;
}
// Local lightweight Quest type to include optional dependencies and name
type QuestAny = {
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  type?: string;
  timeLimit?: string | null;
  requirements?: Record<string, unknown> | null;
  rewards?: Record<string, unknown> | null;
  dependencies?: { prerequisiteQuests?: Array<number | string | { id?: number; name?: string; title?: string }> } | null;
  maxProgress?: number;
};
import { toast } from 'sonner';
import { UserQuest, QuestStatus, UserItem, User } from '@/types';
import useQuestStore from '@/stores/useQuestStore';
import { useUserStatusStore } from '@/stores/user-status.store';
import { sanitizeHtml } from '@/components/admin/story-events/sanitize';
import { useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';


export default function QuestTab() {
  const detailQuest = useQuestStore((s) => s.detailQuest);
  const setDetailQuest = useQuestStore((s) => s.setDetailQuest);
  const localQuests = useQuestStore((s) => s.localQuests);
  const setLocalQuests = useQuestStore((s) => s.setLocalQuests);
  const clearLocalQuests = useQuestStore((s) => s.clearLocalQuests);
  const { user: authUser, isAuthenticated } = useAuth();

  // Get user ID from authentication
  const userId = authUser?.id;

  // Fetch user quests using TanStack Query
  const { data: userQuests = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-quests', userId],
    queryFn: async () => {
      try {
        const result = await apiService.getUserQuests();
        return result;
      } catch (err) {
        console.error('Error fetching quests:', err);
        throw err;
      }
    },
    enabled: !!userId && isAuthenticated,
  });

    // Fetch dungeons once so we can display names instead of numeric ids
    const { data: dungeonsData = [] } = useQuery({
      queryKey: ['dungeons'],
      queryFn: async () => {
        try {
          const resp = await apiService.getDungeons();
          return resp || [];
        } catch (err) {
          console.error('Failed to load dungeons', err);
          return [] as Dungeon[];
        }
      },
      enabled: isAuthenticated,
    });

  // Fetch items so we can resolve item names for requirements and rewards in the quest details modal
  const { data: itemsData = [] } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async (): Promise<Item[]> => {
      try {
        const resp = await apiService.getItems();
        return resp || [];
      } catch (err) {
        console.error('Failed to load items', err);
        return [] as Item[];
      }
    },
    enabled: isAuthenticated,
  });

  // Merge server-fetched quests with any optimistic local updates
  const mergedQuests = localQuests || userQuests;
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(0);

  // If not authenticated, show message
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem nhiệm vụ</p>
          <div className="text-sm text-gray-400 mb-2">
            Auth status: {isAuthenticated ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
          </div>
          <div className="text-sm text-gray-400">
            User ID: {userId || 'Không có'}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Token: {localStorage.getItem('token') ? 'Có' : 'Không'}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Không thể tải dữ liệu nhiệm vụ</p>
        <p className="text-sm mt-2">Chi tiết: {error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const handleAcceptQuest = async (userQuest: UserQuest) => {
    try {
      // Optimistically update UI
      setLocalQuests((prev) => {
        const base = prev || userQuests;
        return base.map((uq) =>
          uq.id === userQuest.id
            ? ({ ...uq, status: QuestStatus.IN_PROGRESS, startedAt: new Date(), progress: typeof uq.progress === 'number' ? uq.progress : 0 } as UserQuest)
            : uq,
        );
      });

      await apiService.startQuest(userQuest.questId);
      toast.success('Đã nhận nhiệm vụ');
  // Refresh authoritative data
  await refetch();
  clearLocalQuests();
    } catch {
      toast.error('Không thể nhận nhiệm vụ');
    }
  };
  const handleClaimReward = async (userQuest?: UserQuest) => {
    try {
      // We expect the backend to have applied rewards when the quest was marked completed.
      // Still call claim endpoint which will return authoritative user/quest/item state for the UI.
      if (!userQuest) {
        toast.error('Không tìm thấy nhiệm vụ để nhận thưởng');
        return;
      }
      const resp = await apiService.claimQuest(userQuest.id);
      // If the API returns updated user or items, apply them to zustand and caches
      if (resp) {
        if (resp.userItems && resp.userItems.length > 0) {
          useUserStatusStore.getState().setEquippedItems(resp.userItems as UserItem[]);
        }
        if (resp.user) {
          // Update user in store
          useUserStatusStore.getState().setUser(resp.user as unknown as User);
        }
        if (resp.userQuest) {
          // If backend marked rewards as claimed, remove the quest from
          // the local cache so it disappears from the UI. Otherwise,
          // update the quest entry with authoritative data.
          // Narrow resp.userQuest to include rewardsClaimed if present
          type MaybeClaimed = UserQuest & { rewardsClaimed?: boolean };
          const uq = resp.userQuest as MaybeClaimed;
          const claimed = uq.rewardsClaimed === true;
          setLocalQuests((prev) => {
            const base = prev || userQuests;
            if (claimed) {
              return base.filter((uq) => uq.id !== resp.userQuest!.id);
            }
            return base.map((uq) => (uq.id === resp.userQuest!.id ? (resp.userQuest as UserQuest) : uq));
          });

          // If the quest detail modal was open for this quest, close it
          // so the UI doesn't show a now-removed completed quest.
          if (uq.rewardsClaimed && detailQuest?.id === uq.id) {
            setDetailQuest(null);
          }
        }
      }

      // Invalidate and refetch relevant caches so UI reflects the change
      await refetch();
      toast.success('Đã nhận thưởng (nếu có).');
    } catch (err) {
      console.error('Claim reward failed', err);
      toast.error('Không thể nhận thưởng');
    }
  };

  const handleCheckQuest = async (userQuest: UserQuest) => {
    try {
      const resp = await apiService.checkQuestCompletion(userQuest.questId);
      // Debug: log raw response to help diagnose why completion may be false
      // and also log the user's current inventory for comparison.
      // Remove these logs after debugging.
      console.debug('checkQuestCompletion response', resp);
      if (resp) {
        if (resp.userItems && resp.userItems.length > 0) {
          // update equipped items and inventory in user-status store
          // call the store action to replace equipped items
          useUserStatusStore.getState().setEquippedItems(resp.userItems as UserItem[]);
        }

        if (resp.userQuest) {
          // Update local quests cache so UI reflects authoritative status immediately
          setLocalQuests((prev) => {
            const base = prev || userQuests;
            return base.map((uq) => (uq.id === resp.userQuest!.id ? (resp.userQuest as UserQuest) : uq));
          });
        }

        if (resp.completed) {
          toast.success('Nhiệm vụ đã hoàn thành');
        } else {
          toast.info('Chưa đủ điều kiện. Cập nhật tiến độ...');
        }
      }

      // Refresh authoritative data in background (keeps everything consistent)
      await refetch();
    } catch {
      toast.error('Không thể kiểm tra nhiệm vụ');
    }
  };

  const filteredQuests = (type: string) => {
    const source = mergedQuests || userQuests;

    // Player level — prefer currentLevel from the status store, fall back to auth user's level
    const playerLevel = useUserStatusStore.getState().currentLevel?.level ?? authUser?.level ?? 0;

    // Filter out quests that require a higher level than the player has
    type ReqSmall = { reachLevel?: number; level?: number } | undefined;
    const byLevel = (uq: UserQuest) => {
      const req = uq.quest?.requirements as ReqSmall;
      const requiredLevel = Number(req?.reachLevel ?? req?.level ?? 0) || 0;
      return requiredLevel <= playerLevel;
    };

    const list = (source || []).filter((uq) => byLevel(uq));

    if (type === 'all') {
      return list;
    }

    return list.filter((userQuest) => userQuest.quest.type === type);
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="all" className="w-full">
        {/* Responsive tabs: two columns on very small screens, three on small, five on md+ */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
          <TabsTrigger value="all" className="truncate">Tất cả</TabsTrigger>
          <TabsTrigger value="main" className="truncate">Chính</TabsTrigger>
          <TabsTrigger value="side" className="truncate">Phụ</TabsTrigger>
          <TabsTrigger value="daily" className="truncate">Hàng ngày</TabsTrigger>
          <TabsTrigger value="story" className="truncate">Cốt truyện</TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-end mb-3 space-x-2">
          <button
            onClick={async () => {
              if (refreshDisabled) return;
              try {
                setRefreshDisabled(true);
                setRefreshCountdown(5);
                await refetch();
              } finally {
                const timer = window.setInterval(() => {
                  setRefreshCountdown((c: number) => {
                    if (c <= 1) {
                      window.clearInterval(timer);
                      setRefreshDisabled(false);
                      return 0;
                    }
                    return c - 1;
                  });
                }, 1000);
              }
            }}
            disabled={refreshDisabled}
            title="Làm mới"
            className="p-2 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshDisabled ? 'animate-spin' : ''}`} />
          </button>
          {refreshCountdown > 0 && <div className="text-sm text-gray-500">({refreshCountdown}s)</div>}
        </div>

        <TabsContent value="all" className="space-y-3">
          {filteredQuests('all').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onClaim={handleClaimReward}
              onOpenDetails={() => setDetailQuest(userQuest)}
              onCheck={() => handleCheckQuest(userQuest)}
            />
          ))}
        </TabsContent>

        <TabsContent value="main" className="space-y-3">
          {filteredQuests('main').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onClaim={handleClaimReward}
              onOpenDetails={() => setDetailQuest(userQuest)}
              onCheck={() => handleCheckQuest(userQuest)}
            />
          ))}
        </TabsContent>

        <TabsContent value="side" className="space-y-3">
          {filteredQuests('side').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onClaim={handleClaimReward}
              onOpenDetails={() => setDetailQuest(userQuest)}
              onCheck={() => handleCheckQuest(userQuest)}
            />
          ))}
        </TabsContent>

        <TabsContent value="daily" className="space-y-3">
          {filteredQuests('daily').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onClaim={handleClaimReward}
              onOpenDetails={() => setDetailQuest(userQuest)}
              onCheck={() => handleCheckQuest(userQuest)}
            />
          ))}
        </TabsContent>

        <TabsContent value="achievement" className="space-y-3">
          {filteredQuests('achievement').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onClaim={handleClaimReward}
              onOpenDetails={() => setDetailQuest(userQuest)}
              onCheck={() => handleCheckQuest(userQuest)}
            />
          ))}
        </TabsContent>

        <TabsContent value="story" className="space-y-3">
          <StoryTab />
        </TabsContent>
      </Tabs>
        {detailQuest && (
          <QuestDetailsModal
            uq={detailQuest}
            dungeons={dungeonsData as Dungeon[]}
            items={itemsData}
            quests={(mergedQuests || []).map((mq: UserQuest) => mq.quest as QuestAny)}
            onClose={() => setDetailQuest(null)}
          />
        )}
      </div>
    );
}

function StoryTab() {
  const [events, setEvents] = useState<Array<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [cinema, setCinema] = useState<Record<string, unknown> | null>(null);
  const [progressMap, setProgressMap] = useState<Record<number, { completed: number; required?: number }> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = showHistory 
        ? await apiService.getStoryEventsHistory()
        : await apiService.getStoryEvents();
      // filter visible events
      const visible = Array.isArray(resp) ? resp.filter((e) => (e.visibilityMode || e.visibility) !== 'hidden') : [];
      setEvents(visible);
    } catch (err) {
      console.error('Failed to load story events', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [showHistory]);

  useEffect(() => { load(); }, [load]);

  // load progress after events load
  useEffect(() => {
    if (!events || events.length === 0) return;
    (async () => {
      const map: Record<number, { completed: number; required?: number }> = {};
      for (const e of events) {
        const id = Number(e?.id || 0);
        if (!id) continue;
        try {
          const p = await apiService.getStoryEventGlobalProgress(id);
          // compute required total from requirements
          const req = e['requirements'] as Record<string, unknown> | undefined;
          const requiredDungeon = req && Array.isArray(req['completeDungeons'])
            ? (req['completeDungeons'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['count']) || 0), 0)
            : 0;
          const requiredEnemies = req && Array.isArray(req['killEnemies'])
            ? (req['killEnemies'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['count']) || 0), 0)
            : 0;
          const requiredItems = req && Array.isArray(req['collectItems'])
            ? (req['collectItems'] as Array<Record<string, unknown>>).reduce((s: number, x) => s + (Number(x['quantity']) || 0), 0)
            : 0;
          const required = requiredDungeon + requiredEnemies + requiredItems || undefined;
          const completed = Number(p.totalDungeonClears || 0) + Number(p.totalEnemyKills || 0) + Number(p.totalItemsContributed || 0);
          map[id] = { completed, required };
        } catch (err) {
          console.error('progress fetch failed for event', id, err);
          map[id] = { completed: 0 };
        }
      }
      setProgressMap(map);
    })();
  }, [events]);

  return (
    <div>
      {/* Toggle buttons for Active/History */}
      <div className="flex space-x-2 mb-4">
        <Button 
          variant={!showHistory ? "default" : "outline"} 
          onClick={() => setShowHistory(false)}
          className="flex-1"
        >
          Đang diễn ra
        </Button>
        <Button 
          variant={showHistory ? "default" : "outline"} 
          onClick={() => setShowHistory(true)}
          className="flex-1"
        >
          Lịch sử
        </Button>
      </div>

      {loading && <div>Đang tải...</div>}
      {!loading && (!events || events.length === 0) && <div className="text-sm text-gray-500">Hiện không có cốt truyện nào</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events && events.map((ev) => {
          const id = Number(ev?.id || 0);
          const title = String(ev?.title || ev?.name || '');
          const descRaw = String(ev?.descriptionHtml || ev?.description || '');
          const short = descRaw.replace(/<[^>]+>/g, '').slice(0, 120);
          const start = ev?.eventStart ? String(ev.eventStart) : null;
          const prog = progressMap ? progressMap[id] : undefined;
          const completed = prog ? prog.completed : 0;
          const required = prog ? prog.required || 0 : 0;
          const percent = required && required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0;
          return (
            <Card key={id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    <CardDescription className="text-xs text-gray-500">{short}</CardDescription>
                  </div>
                  <div className="text-sm text-gray-400">{start ? new Date(start).toLocaleDateString() : '—'}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Tiến độ cộng đồng</span>
                    <span className="text-xs text-gray-500">{required ? `${completed}/${required}` : `${completed}`}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 h-3 transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setDetail(ev)}>Chi tiết</Button>
                  <Button variant="outline" onClick={() => setLeaderboard(ev)}>Bảng xếp hạng</Button>
                  <Button onClick={() => setCinema(ev)}>Xem cốt truyện</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selected && <StoryViewer ev={selected} onClose={() => setSelected(null)} />}
      {detail && <StoryDetailModal ev={detail} onClose={() => setDetail(null)} />}
      {cinema && <CinematicModal ev={cinema} onClose={() => setCinema(null)} />}
      {leaderboard && <StoryLeaderboardModal ev={leaderboard} onClose={() => setLeaderboard(null)} />}
    </div>
  );
}

  // Story detail modal: shows descriptionHtml, requirements, rewards
function StoryDetailModal({ ev, onClose }: { ev: Record<string, unknown> | null; onClose: () => void }) {
  // compute id even if ev is null so hooks can be called reliably
  const id = ev ? Number(ev['id'] || 0) || undefined : undefined;


  // Fetch catalogs so we can resolve names for itemId/dungeonId
  const { data: itemsData = [] } = useQuery<Item[]>({
    queryKey: ['story-items'],
    queryFn: async () => {
      try {
        return await apiService.getItems();
      } catch (err) {
        console.error('Failed to load items for story detail', err);
        return [] as Item[];
      }
    },
    enabled: true,
  });

  const { data: dungeonsData = [] } = useQuery<Dungeon[]>({
    queryKey: ['story-dungeons'],
    queryFn: async () => {
      try {
        return await apiService.getDungeons();
      } catch (err) {
        console.error('Failed to load dungeons for story detail', err);
        return [] as Dungeon[];
      }
    },
    enabled: true,
  });

  // The public API provides only aggregated totals for the event; use that as a community-level "current" value.
  const { data: globalProg } = useQuery({
    queryKey: ['story-event-global-progress', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await apiService.getStoryEventGlobalProgress(id);
      } catch (err) {
        console.error('Failed to load story event global progress', err);
        return null;
      }
    },
    enabled: !!id,
  });

  // Hooks and helpers must be declared before any early return to preserve hook order
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  // helper lookups
  const findItemName = (itemId?: number) => {
    if (!itemId && itemId !== 0) return `#${itemId ?? ''}`;
    const it = itemsData.find((x) => Number(x.id) === Number(itemId));
    return it ? String(it.name || `Item #${itemId}`) : `Item #${itemId}`;
  };
  const findDungeonName = (dungeonId?: number) => {
    if (!dungeonId && dungeonId !== 0) return `#${dungeonId ?? ''}`;
    const d = dungeonsData.find((x) => Number(x.id) === Number(dungeonId));
    return d ? String(d.name || `Dungeon #${dungeonId}`) : `Dungeon #${dungeonId}`;
  };

  // Contribution state and mutation (per-item contributions)
  const [contribQtyByItem, setContribQtyByItem] = useState<Record<number, number>>({});

  const contributeMutation = useMutation<
    unknown,
    unknown,
    { eventId: number; itemId: number; quantity: number; userId?: number },
    unknown
  >({
    mutationFn: async ({ eventId, itemId, quantity, userId }: { eventId: number; itemId: number; quantity: number; userId?: number }) => {
      return apiService.contributeToStoryEvent(eventId, { itemId, quantity, userId });
    },
    onSuccess: async () => {
      // refresh the global progress for this event (use object form to satisfy types)
      if (id) await queryClient.invalidateQueries({ queryKey: ['story-event-global-progress', id] });
      toast.success('Đã cống hiến. Cảm ơn bạn!');
    },
    onError: (err: unknown) => {
      console.error('Contribute failed', err);
      const msg = err instanceof Error ? err.message : String(err ?? 'Không thể cống hiến');
      toast.error(msg);
    },
  });

  if (!ev) return null;

  const title = String(ev['title'] || ev['name'] || '');
  const desc = sanitizeHtml(String(ev['descriptionHtml'] || ev['description'] || ''));

  // Process HTML to add target="_blank" and rel for external links
  const processHtml = (html: string) => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all links and add target="_blank" and rel attributes
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    return tempDiv.innerHTML;
  };

  const processedDesc = processHtml(desc);
  const req = ev['requirements'] as Record<string, unknown> | undefined;
  const rewards = ev['rewardConfig'] as Record<string, unknown> | undefined;

  

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--card)] text-[var(--card-foreground)] max-w-2xl w-full p-6 rounded" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>

        <div className="tiptap max-h-[40vh] overflow-auto mb-4" dangerouslySetInnerHTML={{ __html: processedDesc }} />

        <div className="mb-4">
          <h4 className="font-medium">Yêu cầu</h4>
          <div className="text-sm text-gray-700 space-y-1">
            {req?.defeatBoss ? <div>- Đánh bại boss</div> : null}

            {Array.isArray(req?.killEnemies) && (req?.killEnemies as Array<{ enemyType?: string; count?: number }>).length > 0 && (
              <div>
                {(req?.killEnemies as Array<{ enemyType?: string; count?: number }>).map((k, i) => {
                  const required = Number(k.count || 0);
                  const community = globalProg ? Number(globalProg.totalEnemyKills || 0) : undefined;
                  return (
                    <div key={i}>- Tiêu diệt {String(k.enemyType || 'enemy')}: {required} {community != null ? (<span className="text-xs text-gray-500">(Cộng đồng: {community})</span>) : null}</div>
                  );
                })}
              </div>
            )}

            {Array.isArray(req?.collectItems) && (req?.collectItems as Array<{ itemId?: number; quantity?: number }>).length > 0 && (
              <div className="space-y-2">
                {(req?.collectItems as Array<{ itemId?: number; quantity?: number }>).map((it, i) => {
                  const required = Number(it.quantity || 0);
                  const itemIdNum = Number(it.itemId || 0);
                  const name = findItemName(itemIdNum);
                  const community = globalProg ? Number(globalProg.totalItemsContributed || 0) : undefined;
                  const inputVal = contribQtyByItem[itemIdNum] ?? 1;
                  const isEventActive = Boolean(ev?.isActive);
                  
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">- Thu thập <span className="font-medium">{name}</span>: {required} {community != null ? (<span className="text-xs text-gray-500">(Cộng đồng: {community})</span>) : null}</div>
                      {isEventActive ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min={1}
                            max={required}
                            value={inputVal}
                            onChange={(e) => {
                              const v = Math.max(1, Number(e.target.value) || 1);
                              setContribQtyByItem((prev) => ({ ...prev, [itemIdNum]: Math.min(v, required) }));
                            }}
                            className="w-20 text-sm px-2 py-1 border rounded bg-white text-black"
                          />
                          <Button
                            size="sm"
                            disabled={contributeMutation.status === 'pending' || !id || !authUser?.id}
                            onClick={() => {
                              const qty = contribQtyByItem[itemIdNum] ?? 1;
                              if (!id || !authUser?.id) return;
                              contributeMutation.mutate({ eventId: id, itemId: itemIdNum, quantity: qty, userId: authUser.id });
                            }}
                          >Cống hiến</Button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">Event đã kết thúc</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {Array.isArray(req?.completeDungeons) && (req?.completeDungeons as Array<{ dungeonId?: number; count?: number }>).length > 0 && (
              <div>
                {(req?.completeDungeons as Array<{ dungeonId?: number; count?: number }>).map((d, i) => {
                  const required = Number(d.count || 0);
                  const name = findDungeonName(Number(d.dungeonId));
                  const community = globalProg ? Number(globalProg.totalDungeonClears || 0) : undefined;
                  return (
                    <div key={i}>- Hoàn thành {name}: {required} {community != null ? (<span className="text-xs text-gray-500">(Cộng đồng: {community})</span>) : null}</div>
                  );
                })}
              </div>
            )}

            {!req && <div className="text-sm text-gray-500">Không có yêu cầu đặc biệt</div>}
          </div>
        </div>

        <div>
          <h4 className="font-medium">Phần thưởng</h4>
          <div className="text-sm text-gray-700">
            {rewards?.gold ? <div>- Vàng: {String(rewards.gold)}</div> : null}
            {Array.isArray(rewards?.itemPools) && (rewards?.itemPools as Array<{ itemId?: number; qty?: number }>).map((it, i) => {
              const name = findItemName(Number(it.itemId));
              return <div key={i}>- Vật phẩm {name}: {it.qty || ''}</div>;
            })}
            {!rewards && <div className="text-sm text-gray-500">Không có phần thưởng</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Parse contentHtml into segments: headings (H1/H2/H3 + following content until next H1/2/3 or image), image blocks, paragraphs
function parseContentToSegments(html: string): Array<{ type: 'heading' | 'paragraph' | 'image'; level?: number; title?: string; contentHtml?: string; src?: string }> {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  const segments: Array<{ type: 'heading' | 'paragraph' | 'image'; level?: number; title?: string; contentHtml?: string; src?: string }> = [];
  // Use element children traversal to avoid text-node noise and ensure order
  const elems = Array.from(container.children) as HTMLElement[];
  for (let i = 0; i < elems.length; i++) {
    const el = elems[i];
    if (/^H[123]$/.test(el.tagName)) {
      const level = Number(el.tagName.charAt(1));
      const title = el.textContent || '';
      // gather following sibling elements until next H1/2/3 or IMG
      const buffer: string[] = [];
      let j = i + 1;
      while (j < elems.length) {
        const e2 = elems[j];
        if (/^H[123]$/.test(e2.tagName) || e2.tagName === 'IMG') break;
        buffer.push(e2.outerHTML || e2.textContent || '');
        j++;
      }
      segments.push({ type: 'heading', level, title, contentHtml: buffer.join('') });
      // continue from the element before j (the loop will increment i)
      i = j - 1;
      continue;
    }
    if (el.tagName === 'IMG') {
      const imgEl = el as HTMLImageElement;
      segments.push({ type: 'image', src: imgEl.src, contentHtml: imgEl.alt || '' });
      continue;
    }
    // fallback: paragraph or other block
    segments.push({ type: 'paragraph', contentHtml: el.outerHTML });
  }
  return segments;
}

function CinematicModal({ ev, onClose }: { ev: Record<string, unknown> | null; onClose: () => void }) {
  // Compute html even if ev is null so hooks can be called in stable order
  const html = String(ev ? (ev['contentHtml'] || ev['descriptionHtml'] || '') : '');

  // Process HTML to add target="_blank" and rel for external links
  const processHtml = (html: string) => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all links and add target="_blank" and rel attributes
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    return tempDiv.innerHTML;
  };

  // Hooks must be at top-level and called in the same order
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true); // autoplay by default
  const [visible, setVisible] = useState(false); // for entry animation

  const segments = useMemo(() => parseContentToSegments(html) as Array<{ type: 'heading' | 'paragraph' | 'image'; level?: number; title?: string; contentHtml?: string; src?: string }>, [html]);

  const contentRef = useRef<HTMLDivElement | null>(null);
  // modal container ref used for focusing and focus-trap
  const modalRef = useRef<HTMLDivElement | null>(null);
  // remember previously focused element to return focus on close
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // live region ref for announcements
  const liveRef = useRef<HTMLDivElement | null>(null);
  // progress timer ref for pause/resume handling
  const progressStartRef = useRef<number | null>(null);
  const remainingMsRef = useRef<number | null>(null);
  // touch swipe state
  const touchStartX = useRef<number | null>(null);

  const getDurationForSegment = (s: { type?: string; level?: number } | null) => {
    if (!s) return 3500;
    if (s.type === 'image') return 4500;
    if (s.type === 'heading') {
      // headings get longer if H1
      return s.level === 1 ? 4800 : s.level === 2 ? 3800 : 3200;
    }
    return 3000; // paragraph
  };

  // animate visible on each new segment
  useEffect(() => {
    setVisible(false);
    const enter = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(enter);
  }, [index, segments.length]);

  // staggered reveal for inner content elements
  useEffect(() => {
    if (!visible || !contentRef.current) return;
    const parent = contentRef.current;
    const elems = Array.from(parent.querySelectorAll('p, li, h2, h3, blockquote')) as HTMLElement[];
    const timeouts: number[] = [];
    elems.forEach((el, i) => {
      // set initial state
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity 420ms ease, transform 420ms ease';
      const t = window.setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 120 + 80);
      timeouts.push(t);
    });
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      // reset styles
      elems.forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transition = '';
      });
    };
  }, [visible, index, segments.length]);

  useEffect(() => {
    // Removed simple duplicate autoplay timer — progress timer effect below handles timing
  }, [playing, index, segments, segments.length]);

  // Focus the modal on mount and trap focus / handle keyboard controls
  useEffect(() => {
    const node = modalRef.current;
    // save previously focused element
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    if (node) {
      node.tabIndex = -1;
      node.focus();
    }

  const handleKey = (e: KeyboardEvent) => {
      // Escape closes
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Left / Right navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        remainingMsRef.current = null;
        progressStartRef.current = null;
        setIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlaying(false);
        remainingMsRef.current = null;
        progressStartRef.current = null;
        setIndex((i) => Math.min(segments.length - 1, i + 1));
        return;
      }

      // Space toggles play/pause (prevent page scroll)
      if (e.code === 'Space' || e.key === ' ') {
        // only toggle when focus is inside modal
        if (!modalRef.current || !modalRef.current.contains(document.activeElement)) return;
        e.preventDefault();
        setPlaying((p) => !p);
        return;
      }

      // Focus trap: handle Tab navigation within modal
      if (e.key === 'Tab') {
        const root = modalRef.current;
        if (!root) return;
        const focusable = Array.from(root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter((el) => !el.hasAttribute('disabled'));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        let nextIndex = currentIndex;
        if (e.shiftKey) nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
        else nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
        e.preventDefault();
        focusable[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      // return focus to previously focused element
      try {
        previouslyFocused.current?.focus();
      } catch {
        // ignore
      }
    };
  }, [onClose, segments.length]);

  // Announce active segment for screen readers with richer descriptions
  useEffect(() => {
    if (!liveRef.current) return;
    const seg = segments[index];
    if (!seg) {
      liveRef.current.textContent = '';
      return;
    }
    let announcement = `${index + 1} trên ${segments.length}. `;
    if (seg.type === 'heading') {
      const title = String(seg.title || '').trim();
      announcement += title ? `Tiêu đề: ${title}.` : 'Tiêu đề.';
    } else if (seg.type === 'image') {
      const alt = String(seg.contentHtml || '').trim();
      announcement += alt ? `Hình ảnh: ${alt}.` : 'Hình ảnh.';
    } else if (seg.type === 'paragraph') {
      // read a short preview of the paragraph (first 80 chars)
      const text = (seg.contentHtml || '').replace(/<[^>]+>/g, '').trim();
      const preview = text.length > 80 ? text.slice(0, 77) + '...' : text;
      announcement += preview ? `Đoạn văn: ${preview}` : 'Đoạn văn.';
    }
    liveRef.current.textContent = announcement;
  }, [index, segments]);

  // Touch handlers for swipe navigation (mobile)
  useEffect(() => {
    const root = modalRef.current;
    if (!root) return;
    const onTouchStart: EventListener = (ev) => {
      const t = (ev as TouchEvent).touches?.[0];
      touchStartX.current = t ? t.clientX : null;
    };
    const onTouchEnd: EventListener = (ev) => {
      const start = touchStartX.current;
      const end = (ev as TouchEvent).changedTouches?.[0]?.clientX ?? null;
      if (start == null || end == null) return;
      const delta = end - start;
      if (Math.abs(delta) < 40) return; // ignore small moves
      if (delta > 0) { // swipe right -> prev
        setPlaying(false);
        remainingMsRef.current = null;
        progressStartRef.current = null;
        setIndex((i) => Math.max(0, i - 1));
      } else { // swipe left -> next
        setPlaying(false);
        remainingMsRef.current = null;
        progressStartRef.current = null;
        setIndex((i) => Math.min(segments.length - 1, i + 1));
      }
      touchStartX.current = null;
    };
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchend', onTouchEnd as EventListener);
    return () => {
      root.removeEventListener('touchstart', onTouchStart as EventListener);
      root.removeEventListener('touchend', onTouchEnd as EventListener);
    };
  }, [segments.length]);

  // progress timer management: start timer when playing and clear on pause/slide change
  useEffect(() => {
    if (!playing) {
      // compute remaining
      if (progressStartRef.current != null) {
        const elapsed = Date.now() - progressStartRef.current;
        const duration = getDurationForSegment(segments[index]) || 3000;
        remainingMsRef.current = Math.max(0, duration - elapsed);
      }
      return;
    }
    const duration = remainingMsRef.current ?? (getDurationForSegment(segments[index]) || 3000);
    progressStartRef.current = Date.now();
    const t = window.setTimeout(() => {
      setIndex((i) => Math.min(segments.length - 1, i + 1));
      remainingMsRef.current = null;
    }, duration);
    return () => {
      window.clearTimeout(t);
      // leave remainingMsRef as-is for resume
    };
  }, [playing, index, segments]);

  const seg = segments[index] || null;
  const rawHtml = seg?.contentHtml ? String(seg.contentHtml) : '';
  const processedRawHtml = processHtml(rawHtml);
  const safeHtml = processedRawHtml ? sanitizeHtml(processedRawHtml) : '';

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.95)] z-50 flex items-center justify-center" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={String(ev?.title || ev?.name || 'Cốt truyện')}
        className="bg-black text-white max-w-4xl w-full p-6 rounded shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <div className="text-sm text-gray-400">{ev ? String(ev['title'] || '') : ''}</div>
        </div>
        <div className="min-h-[240px] flex items-center justify-center relative">
          {/* play overlay */}
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 rounded-full p-4 pointer-events-auto">
                <div className="text-2xl font-bold">Paused</div>
              </div>
            </div>
          )}

          <div ref={contentRef} role="document" className={`w-full transition-opacity duration-600 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative">
              {seg?.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(seg.src)} alt="story" className="mx-auto max-h-[60vh] object-contain rounded" />
              ) : seg?.type === 'heading' ? (
                <div className="text-center px-4">
                  <h1 className={`mb-4 ${seg.level === 1 ? 'text-5xl' : seg.level === 2 ? 'text-4xl' : 'text-3xl'} font-extrabold leading-tight`}>{String(seg.title)}</h1>
                  <div className="tiptap text-white mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                </div>
              ) : (
                <div className="tiptap text-white mx-auto max-w-3xl px-4" dangerouslySetInnerHTML={{ __html: safeHtml }} />
              )}
            </div>
          </div>
        </div>

        {/* per-segment progress bar */}
        <div className="h-2 bg-white/10 rounded mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 h-2 transition-all"
            style={{ width: `${((index + (playing ? 0.5 : 0)) / Math.max(1, segments.length)) * 100}%` }}
            aria-hidden
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button onClick={() => { setPlaying(false); remainingMsRef.current = null; progressStartRef.current = null; setIndex((i)=> Math.max(0, i-1)); }}>Prev</Button>
            <Button onClick={() => { setPlaying(false); remainingMsRef.current = null; progressStartRef.current = null; setIndex((i)=> Math.min(segments.length-1, i+1)); }}>Next</Button>
            <Button variant="outline" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>{playing ? 'Pause' : 'Play'}</Button>
            <Button variant="ghost" onClick={() => { remainingMsRef.current = null; progressStartRef.current = null; setIndex(0); setPlaying(true); }}>Restart</Button>
          </div>
          <div className="text-sm text-gray-300">{index+1}/{segments.length}</div>
        </div>
        {/* ARIA live region for SR announcements */}
        <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      </div>
    </div>
  );
}

function StoryLeaderboardModal({ ev, onClose }: { ev: Record<string, unknown> | null; onClose: () => void }) {
  const id = ev ? Number(ev['id'] || 0) : undefined;

  // Fetch leaderboard data for this story event
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['story-leaderboard', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await storyEventsService.leaderboard(id);
      } catch (err) {
        console.error('Failed to load story leaderboard', err);
        return null;
      }
    },
    enabled: !!id,
  });

  if (!ev) return null;

  const title = String(ev['title'] || ev['name'] || '');

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--card)] text-[var(--card-foreground)] max-w-4xl w-full p-6 rounded max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bảng xếp hạng - {title}</h3>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          {isLoading && <div className="text-center py-8">Đang tải...</div>}

          {error && (
            <div className="text-center py-8 text-red-500">
              Không thể tải bảng xếp hạng
            </div>
          )}

          {!isLoading && !error && leaderboardData && Array.isArray(leaderboardData) && leaderboardData.length > 0 && (
            <div className="space-y-2">
              {leaderboardData.map((entry: LeaderboardRow, index: number) => {
                const rank = index + 1;
                const username = String(entry.username || entry.userName || 'Unknown');
                const score = Number(entry.score || entry.totalContribution || 0);
                const contributions = entry.contributions || {};

                return (
                  <Card key={entry.userId || index} className={`p-4 ${rank <= 3 ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          rank === 1 ? 'bg-yellow-400 text-black' :
                          rank === 2 ? 'bg-gray-300 text-black' :
                          rank === 3 ? 'bg-orange-400 text-black' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {rank}
                        </div>
                        <div>
                          <div className="font-medium">{username}</div>
                          <div className="text-sm text-gray-500">
                            {Object.keys(contributions).length > 0 ? (
                              Object.entries(contributions).map(([key, value]: [string, unknown]) => (
                                <span key={key} className="mr-2">
                                  {key}: {Number(value || 0)}
                                </span>
                              ))
                            ) : (
                              'Chưa có đóng góp'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg">{score.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">điểm</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && !error && (!leaderboardData || !Array.isArray(leaderboardData) || leaderboardData.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Chưa có dữ liệu bảng xếp hạng
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryViewer({ ev, onClose }: { ev: Record<string, unknown> | null; onClose: () => void }) {
  if (!ev) return null;

  // Process HTML to add target="_blank" and rel for external links
  const processHtml = (html: string) => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all links and add target="_blank" and rel attributes
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    return tempDiv.innerHTML;
  };

  // Sanitize and process contentHtml
  const rawHtml = String(ev['contentHtml'] || ev['descriptionHtml'] || ev['description'] || '');
  const safe = sanitizeHtml(rawHtml);
  const processedHtml = processHtml(safe);

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--card)] text-[var(--card-foreground)] max-w-3xl w-full p-6 rounded" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{String(ev['title'] || ev['name'] || '')}</h3>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>
        <div className="tiptap max-h-[60vh] overflow-auto" dangerouslySetInnerHTML={{ __html: processedHtml }} />
      </div>
    </div>
  );
}

interface QuestCardProps {
  userQuest: UserQuest;
  onAccept: (userQuest: UserQuest) => void;
  onClaim: (userQuest: UserQuest) => void;
  onOpenDetails?: (userQuest: UserQuest) => void;
  onCheck?: (userQuest: UserQuest) => void;
}

function QuestCard({ userQuest, onAccept, onClaim, onOpenDetails, onCheck }: QuestCardProps) {
  const quest = userQuest.quest as QuestAny;

  // Compute aggregated progress across multiple requirement types.
  // Simple strategy: sum required counts and sum completed counts (capped per requirement).
  // Lightweight local types to avoid `any` usage
  type ReqAny = {
    killEnemies?: Array<{ enemyType: string; count: number }>;
    collectItems?: Array<{ itemId: number; quantity: number }>;
    completeDungeons?: Array<{ dungeonId: number; count: number }>;
    reachLevel?: number;
    level?: number;
    defeatBoss?: boolean;
  };

  type ProgAny = {
    killEnemies?: Array<{ enemyType: string; current: number }>;
    collectItems?: Array<{ itemId: number; current: number }>;
    completeDungeons?: Array<{ dungeonId: number; current: number }>;
    currentLevel?: number;
    defeatedBoss?: boolean;
  };

  const computeAggregatedProgress = (q: { requirements?: ReqAny; maxProgress?: number }, progress: ProgAny | number | undefined) => {
    let totalRequired = 0;
    let totalCompleted = 0;

    const req: ReqAny = (q.requirements || {}) as ReqAny;
    const prog: ProgAny = (typeof progress === 'number' ? {} : (progress || {})) as ProgAny;

    // Kill enemies
    if (req.killEnemies && Array.isArray(req.killEnemies)) {
      for (const k of req.killEnemies) {
        const need = Number(k.count) || 0;
        totalRequired += need;
        const p = (prog.killEnemies || []).find((x) => x.enemyType === k.enemyType);
        const got = Math.min(Number(p?.current || 0), need);
        totalCompleted += got;
      }
    }

    // Collect items
    if (req.collectItems && Array.isArray(req.collectItems)) {
      for (const it of req.collectItems) {
        const need = Number(it.quantity) || 0;
        totalRequired += need;
        const p = (prog.collectItems || []).find((x) => x.itemId === it.itemId);
        const got = Math.min(Number(p?.current || 0), need);
        totalCompleted += got;
      }
    }

    // Complete dungeons
    if (req.completeDungeons && Array.isArray(req.completeDungeons)) {
      for (const d of req.completeDungeons) {
        const need = Number(d.count) || 0;
        totalRequired += need;
        const p = (prog.completeDungeons || []).find((x) => x.dungeonId === d.dungeonId);
        const got = Math.min(Number(p?.current || 0), need);
        totalCompleted += got;
      }
    }

    // Level requirement: treat as a single requirement (1 unit) — satisfied if currentLevel >= required level
    const requiredLevel = req.reachLevel || req.level;
    if (requiredLevel) {
      totalRequired += 1;
      const currentLevel = Number(prog.currentLevel || 0);
      totalCompleted += currentLevel >= Number(requiredLevel) ? 1 : 0;
    }

    // Boss / defeat flag
    if (req.defeatBoss) {
      totalRequired += 1;
      totalCompleted += prog.defeatedBoss ? 1 : 0;
    }

    // Fallback: if no structured requirements, try numeric progress + maxProgress
    if (totalRequired === 0) {
      if (typeof progress === 'number') {
        const maxP = q.maxProgress || 1;
        return { completed: Math.min(progress, maxP), total: maxP };
      }
      // No requirements and non-numeric progress — treat as 0/1
      return { completed: 0, total: q.maxProgress || 1 };
    }

    return { completed: totalCompleted, total: totalRequired };
  };

  // Normalize requirements and rewards to typed locals to satisfy TypeScript
  const reqObj = (quest.requirements ?? {}) as ReqAny;
  const rewardsObj = (quest.rewards ?? { experience: 0, gold: 0, items: [] }) as {
    experience?: number;
    gold?: number;
    items?: unknown[];
  };

  const { completed: numericProgress, total: maxProgress } = computeAggregatedProgress(
    { requirements: reqObj, maxProgress: quest.maxProgress },
    userQuest.progress,
  );
  const progressPercentage = maxProgress > 0 ? (numericProgress / maxProgress) * 100 : 0;

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-blue-100 text-blue-800';
      case 'side': return 'bg-green-100 text-green-800';
      case 'daily': return 'bg-purple-100 text-purple-800';
      case 'achievement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestTypeLabel = (type: string) => {
    switch (type) {
      case 'main': return 'Chính';
      case 'side': return 'Phụ';
      case 'daily': return 'Hàng ngày';
      case 'achievement': return 'Thành tựu';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'available': return <Circle className="h-5 w-5 text-gray-400" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  // (status label function removed — labels are shown via Badges/icons)

  return (
    <Card className={`transition-all ${userQuest.status === 'completed' ? 'border-green-200 bg-green-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(userQuest.status)}
            <div>
              <CardTitle className="text-lg">{quest.name ?? quest.title}</CardTitle>
                <CardDescription>{quest.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getQuestTypeColor(quest.type ?? '')}>
              {getQuestTypeLabel(quest.type ?? '')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress */}
        {userQuest.status === 'in_progress' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ</span>
              <span>{numericProgress}/{maxProgress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Time limit */}
        {quest.timeLimit && (
          <div className="flex items-center space-x-1 text-sm text-orange-600 mb-3">
            <Clock className="h-4 w-4" />
            <span>{quest.timeLimit}</span>
          </div>
        )}

        {/* Requirements */}
        {reqObj.level && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
            <Star className="h-4 w-4" />
            <span>Yêu cầu level {reqObj.level}</span>
          </div>
        )}

        {/* Rewards */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Phần thưởng:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{rewardsObj.experience ?? 0} EXP</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{rewardsObj.gold ?? 0} vàng</span>
            </div>
            {rewardsObj.items && rewardsObj.items.length > 0 && (
              <div className="flex items-center space-x-1">
                <Gem className="h-4 w-4 text-purple-500" />
                <span>{rewardsObj.items.length} vật phẩm</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {userQuest.status === 'available' && (
            <Button onClick={() => onAccept(userQuest)} className="flex-1">Nhận nhiệm vụ</Button>
          )}

          {userQuest.status === 'in_progress' && (
            <>
              <Button onClick={() => onCheck && onCheck(userQuest)} className="flex-1">Kiểm tra</Button>
              <Button variant="ghost" onClick={() => onOpenDetails && onOpenDetails(userQuest)}>Chi tiết</Button>
            </>
          )}

          {userQuest.status === 'completed' && (
            <Button onClick={() => onClaim(userQuest)} className="flex-1"><Trophy className="h-4 w-4 mr-2" />Nhận thưởng</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Details modal/drawer
function QuestDetailsModal({ uq, onClose, dungeons, items, quests }: { uq: UserQuest; onClose: () => void; dungeons: Dungeon[]; items?: Item[]; quests?: QuestAny[] }) {
  const q = uq.quest as QuestAny;
  // Local lightweight types for rendering quest requirements/progress
  interface KillReq { enemyType: string; count: number }
  interface CollectReq { itemId: number; quantity: number }
  interface DungeonReq { dungeonId: number; count: number }
  interface RequirementsAny {
    reachLevel?: number;
    level?: number;
    killEnemies?: KillReq[];
    collectItems?: CollectReq[];
    completeDungeons?: DungeonReq[];
    defeatBoss?: boolean;
  }
  interface ProgressAny {
    currentLevel?: number;
    killEnemies?: Array<{ enemyType: string; current: number }>;
    collectItems?: Array<{ itemId: number; current: number }>;
    completeDungeons?: Array<{ dungeonId: number; current: number }>;
    defeatedBoss?: boolean;
  }

  const req: RequirementsAny = (q.requirements || {}) as RequirementsAny;
  const prog: ProgressAny = (uq.progress || {}) as ProgressAny;

  const qRewards = (q.rewards ?? { experience: 0, gold: 0, items: [] }) as {
    experience?: number;
    gold?: number;
    items?: unknown[];
  };

  // Cache for fetched quest names when the passed `quests` prop doesn't include them
  const [resolvedNames, setResolvedNames] = useState<Record<number, string>>({});

  useEffect(() => {
    // Collect numeric ids we need to resolve
    const idsToFetch: number[] = [];
    if (q.dependencies && Array.isArray(q.dependencies.prerequisiteQuests)) {
      for (const p of q.dependencies.prerequisiteQuests) {
        const idNum = typeof p === 'number' ? p : typeof p === 'string' ? Number(p) : p?.id ? Number(p.id) : NaN;
        if (!isNaN(idNum)) {
          const found = (quests || []).find((qq) => Number(qq?.id) === idNum);
          if (!found && resolvedNames[idNum] == null) {
            idsToFetch.push(idNum);
          }
        }
      }
    }

    if (idsToFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const id of idsToFetch) {
        try {
          const resp = await apiService.getQuest(id);
          if (cancelled) return;
          if (resp && resp.id) {
            const anyResp = resp as unknown as { name?: string; title?: string };
            setResolvedNames((prev) => ({ ...prev, [id]: anyResp.name || anyResp.title || `#${id}` }));
          } else {
            setResolvedNames((prev) => ({ ...prev, [id]: `#${id}` }));
          }
        } catch {
          // On error, set fallback so we don't retry repeatedly
          setResolvedNames((prev) => ({ ...prev, [id]: `#${id}` }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q.dependencies, quests, resolvedNames]);

  // Normalize rewards.items to a typed array for rendering
  const rewardItems: RewardItem[] = Array.isArray(q.rewards?.items) ? (q.rewards.items as unknown as RewardItem[]) : [];

  const renderKillReq = () => {
    if (!req.killEnemies || req.killEnemies.length === 0) return null;
    return (
      <div className="space-y-2">
        {req.killEnemies.map((k: KillReq, idx: number) => {
          const p = (prog.killEnemies || []).find((x) => x.enemyType === k.enemyType);
          const current = p?.current ?? 0;
          return (
            <div key={idx} className="flex justify-between text-sm text-gray-700">
              <div>Tiêu diệt: <span className="font-medium">{k.enemyType}</span></div>
              <div className="text-gray-500">{current}/{k.count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCollectReq = () => {
    if (!req.collectItems || req.collectItems.length === 0) return null;
    return (
      <div className="space-y-2">
          {req.collectItems.map((it: CollectReq, idx: number) => {
          const p = (prog.collectItems || []).find((x) => x.itemId === it.itemId);
          const current = p?.current ?? 0;
          // Resolve item name from items prop
          const foundItem = (items || []).find((itd: Item) => Number(itd.id) === Number(it.itemId));
          const itemName = foundItem ? foundItem.name : `#${it.itemId}`;
          return (
            <div key={idx} className="flex justify-between text-sm text-gray-700">
              <div>Thu thập: <span className="font-medium">{itemName}</span></div>
              <div className="text-gray-500">{current}/{it.quantity}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDungeonReq = () => {
    if (!req.completeDungeons || req.completeDungeons.length === 0) return null;
    return (
      <div className="space-y-2">
          {req.completeDungeons.map((d: DungeonReq, idx: number) => {
          const p = (prog.completeDungeons || []).find((x) => x.dungeonId === d.dungeonId);
          const current = p?.current ?? 0;
          const found = (dungeons || []).find((dd) => dd.id === d.dungeonId);
          const name = found ? found.name : `#${d.dungeonId}`;
          return (
            <div key={idx} className="flex justify-between text-sm text-gray-700">
              <div>Hoàn thành Dungeon: <span className="font-medium">{name}</span></div>
              <div className="text-gray-500">{current}/{d.count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--card)] text-[var(--card-foreground)] w-full max-w-2xl p-4 rounded" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{q.name ?? q.title}</h3>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>

        <p className="mb-3 text-sm text-gray-600">{q.description}</p>

        <div className="mb-3">
          <h4 className="font-medium">Yêu cầu:</h4>
          <div className="mt-2 space-y-2">
            {/* Level */}
            {(req.reachLevel || req.level) && (
              <div className="flex justify-between text-sm text-gray-700">
                <div>Yêu cầu cấp</div>
                <div className="text-gray-500">{(prog.currentLevel ?? 0)}/{req.reachLevel ?? req.level}</div>
              </div>
            )}

            {/* Kill enemies */}
            {renderKillReq()}

            {/* Collect items */}
            {renderCollectReq()}

            {/* Complete dungeons */}
            {renderDungeonReq()}

            {/* Boss */}
            {req.defeatBoss && (
              <div className="flex justify-between text-sm text-gray-700">
                <div>Đánh bại boss</div>
                <div className="text-gray-500">{prog.defeatedBoss ? 'Đã' : 'Chưa'}</div>
              </div>
            )}

            {/* No requirements fallback */}
            {!req.reachLevel && !req.level && (!req.killEnemies || req.killEnemies.length===0) && (!req.collectItems || req.collectItems.length===0) && (!req.completeDungeons || req.completeDungeons.length===0) && !req.defeatBoss && (
              <div className="text-sm text-gray-500">Không có yêu cầu đặc biệt</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium">Phần thưởng:</h4>
          <div className="mt-2 text-sm text-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500"/> EXP</div>
              <div className="text-gray-500">{Number(qRewards.experience ?? 0)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-yellow-500"/> Vàng</div>
              <div className="text-gray-500">{Number(qRewards.gold ?? 0)}</div>
            </div>
            {rewardItems.length > 0 ? (
              <div>
                <div className="text-sm font-medium">Vật phẩm:</div>
                <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                  {rewardItems.map((it: RewardItem, idx: number) => {
                    const itemIdNum = Number(it.itemId || it.id || 0);
                    const found = (items || []).find((itm: Item) => Number(itm.id) === itemIdNum);
                    const displayName = found ? found.name : (it.itemName || `#${itemIdNum}`);
                    const qty = it.quantity ?? it.qty ?? 1;
                    return (<li key={idx}>{qty} x {displayName}</li>);
                  })}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Không có vật phẩm</div>
            )}
          </div>
        </div>
        {/* Prerequisite quests / dependencies */}
        <div className="mt-4">
          <h4 className="font-medium">Cần hoàn thành quest trước:</h4>
          <div className="mt-2 text-sm text-gray-700">
            {q.dependencies && Array.isArray(q.dependencies.prerequisiteQuests) && q.dependencies.prerequisiteQuests.length > 0 ? (
              <ul className="list-disc list-inside">
                {q.dependencies.prerequisiteQuests.map(
                  (
                    p: number | string | { id?: number; name?: string; title?: string },
                    idx: number,
                  ) => {
                    // Resolve to human friendly name when possible using the passed quests list
                    let label: string;
                    let idNum: number | null = null;
                    if (typeof p === 'number') idNum = p;
                    else if (typeof p === 'string') idNum = Number(p);
                    else if (p && p.id) idNum = Number(p.id);

                    if (idNum != null && !isNaN(idNum)) {
                      const found = (quests || []).find((qq) => Number(qq?.id) === idNum);
                      if (found) label = found.name || found.title || `#${idNum}`;
                      else if (resolvedNames[idNum]) label = resolvedNames[idNum];
                      else label = `#${idNum}`; // will update after fetch
                    } else if (typeof p === 'object') {
                      label = p?.name || p?.title || '#?';
                    } else {
                      label = `#${String(p)}`;
                    }

                    return <li key={idx}>{label}</li>;
                  },
                )}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">Không có nhiệm vụ tiền đề</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
