'use client';

import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { UserQuest, QuestStatus, UserItem } from '@/types';
import useQuestStore from '@/stores/useQuestStore';
import { useUserStatusStore } from '@/stores/user-status.store';


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
  const handleClaimReward = async () => {
    try {
      await refetch();
      toast.success('Yêu cầu nhận thưởng đã gửi (nếu có).');
    } catch {
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
    if (type === 'all') {
      return source;
    }

    return source.filter((userQuest) => userQuest.quest.type === type);
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="main">Chính</TabsTrigger>
          <TabsTrigger value="side">Phụ</TabsTrigger>
          <TabsTrigger value="daily">Hàng ngày</TabsTrigger>
          <TabsTrigger value="achievement">Thành tựu</TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-end mb-3">
          <Button onClick={async () => {
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
          }} disabled={refreshDisabled} size="sm">Làm mới</Button>
          {refreshCountdown > 0 && <div className="ml-2 text-sm text-gray-500">({refreshCountdown}s)</div>}
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
      </Tabs>
        {detailQuest && (
          <QuestDetailsModal uq={detailQuest} onClose={() => setDetailQuest(null)} />
        )}
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
  const quest = userQuest.quest;
  const numericProgress = typeof userQuest.progress === 'number' ? userQuest.progress : 0;
  const maxProgress = quest.maxProgress || 1;
  const progressPercentage = (numericProgress / maxProgress) * 100;

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
              <CardTitle className="text-lg">{quest.title}</CardTitle>
              <CardDescription>{quest.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getQuestTypeColor(quest.type)}>
              {getQuestTypeLabel(quest.type)}
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
        {quest.requirements.level && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
            <Star className="h-4 w-4" />
            <span>Yêu cầu level {quest.requirements.level}</span>
          </div>
        )}

        {/* Rewards */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Phần thưởng:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{quest.rewards.experience} EXP</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{quest.rewards.gold} vàng</span>
            </div>
            {quest.rewards.items && quest.rewards.items.length > 0 && (
              <div className="flex items-center space-x-1">
                <Gem className="h-4 w-4 text-purple-500" />
                <span>{quest.rewards.items.length} vật phẩm</span>
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
function QuestDetailsModal({ uq, onClose }: { uq: UserQuest; onClose: () => void }) {
  const q = uq.quest;
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
          return (
            <div key={idx} className="flex justify-between text-sm text-gray-700">
              <div>Thu thập: <span className="font-medium">Vật phẩm #{it.itemId}</span></div>
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
          return (
            <div key={idx} className="flex justify-between text-sm text-gray-700">
              <div>Hoàn thành Dungeon: <span className="font-medium">#{d.dungeonId}</span></div>
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
          <h3 className="text-lg font-medium">{q.title}</h3>
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
              <div className="text-gray-500">{q.rewards?.experience ?? 0}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-yellow-500"/> Vàng</div>
              <div className="text-gray-500">{q.rewards?.gold ?? 0}</div>
            </div>
            {q.rewards?.items && q.rewards.items.length > 0 ? (
              <div>
                <div className="text-sm font-medium">Vật phẩm:</div>
                <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                  {q.rewards.items.map((it: unknown, idx: number) => (
                    <li key={idx}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Không có vật phẩm</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
