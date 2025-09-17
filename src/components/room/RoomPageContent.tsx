"use client";
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Crown, Clock, MapPin, Settings, UserX } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Dungeon } from '@/types/game';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useRoomSocketStore } from '@/stores/useRoomSocketStore';
import useRoomChat from '@/hooks/useRoomChat';
import { useChatStore } from '@/stores/useChatStore';
import { useUserStamina } from '@/hooks/use-user-status';
import { toast } from 'sonner';
import CombatModal, { CombatResult } from '@/components/ui/CombatModal';

// Small ShareButton component placed here to avoid new file churn
function ShareButton({ room, hostUsername }: { room: { id: number; name?: string; dungeon?: { id?: number } }; hostUsername: string }) {
  const sendWorld = useChatStore((s) => s.sendMessage);
  const checkAndConnect = useChatStore((s) => s.checkAuthAndConnect);
  const [open, setOpen] = useState(false);

  const handleShareWorld = async () => {
    try {
      checkAndConnect();
      // wait briefly for connection
      const waitMs = 5000;
      const pollInterval = 150;
      const deadline = Date.now() + waitMs;
      while (!useChatStore.getState().isConnected && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, pollInterval));
      }
      if (!useChatStore.getState().isConnected) {
        toast.error('Không thể kết nối tới chat thế giới, thử lại sau');
        return;
      }

      const maybe = room as unknown as { dungeonId?: number; dungeon?: { id?: number } };
      const dungeonSegment = typeof maybe.dungeonId === 'number' ? maybe.dungeonId : (maybe.dungeon && typeof maybe.dungeon.id === 'number' ? maybe.dungeon.id : undefined);
      const invite = `[ROOM_INVITE|${room.id}|${room.name || 'Phòng'}|${hostUsername}|${dungeonSegment ?? ''}]`;
      sendWorld(invite);
      toast.success('Đã chia sẻ liên kết phòng lên kênh thế giới');
      setOpen(false);
    } catch (e) {
      console.error('Failed to share room to world:', e);
      toast.error('Không thể chia sẻ phòng');
    }
  };

  const handleShareGuild = () => {
    // Placeholder: guild sharing requires backend/guild channel support.
    toast('Chia sẻ cho Guild chưa hỗ trợ');
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="px-4">Chia sẻ</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chia sẻ phòng</DialogTitle>
            <DialogDescription>Chọn kênh để chia sẻ lời mời tham gia phòng</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={handleShareWorld} className="w-full">Kênh Thế Giới</Button>
            <Button variant="outline" onClick={handleShareGuild} className="w-full">Kênh Công Hội</Button>
          </div>
          <div className="mt-4 text-right">
            <Button variant="ghost" onClick={() => setOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Props {
  roomId: number | string;
  dungeonId?: number | null;
}
// Use CombatResult type exported from CombatModal for consistent typing

type CombatReportEnemy = { id?: number; name?: string; hp?: number };
type TeamMember = { userId?: number };
type RewardItem = { itemId?: number; id?: number; quantity?: number; qty?: number };
type RewardPerUserEntry = { items?: RewardItem[] };

type CombatReport = {
  id?: number;
  combatResultId?: number;
  result?: {
    combatResultId?: number;
    dungeonId?: number;
    rewards?: { perUser?: RewardPerUserEntry[]; items?: RewardItem[] } | null;
  };
  dungeonId?: number;
  enemies?: CombatReportEnemy[];
  rewards?: { perUser?: RewardPerUserEntry[]; items?: RewardItem[] } | null;
  teamStats?: { members?: TeamMember[] } | null;
};

export default function RoomPageContent({ roomId, dungeonId }: Props) {
  // keep dungeonId referenced for future use and to avoid unused-variable lint
  void dungeonId;
  const id = String(roomId);
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isHost, setIsHost] = useState(false);
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [showDungeonDialog, setShowDungeonDialog] = useState(false);
  const [selectedDungeonId, setSelectedDungeonId] = useState<number | null>(null);
  
  const { data: room, isLoading, error } = useQuery({
    queryKey: ['room', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/room-lobby/${id}`);
        return response.data;
      } catch (err) {
        if (user?.id) {
          try {
            const hostResponse = await api.get(`/room-lobby/host/${user.id}`);
            const hostRoom = hostResponse.data;
            if (hostRoom && hostRoom.id.toString() === id) {
              return hostRoom;
            }
          } catch {}
        }
        throw err;
      }
    },
    refetchInterval: 2000,
    enabled: !!id,
  });

  const { data: dungeons } = useQuery({
    queryKey: ['dungeons'],
    queryFn: async () => {
      try {
        const response = await api.get('/dungeons');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch dungeons:', error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (room && user) {
      setIsHost(room.host.id === user.id);
    }
  }, [room, user]);

  // room socket integration
  const { 
    roomInfo: socketRoomInfo, 
    combatResult: socketCombatResult,
    joinRoom: socketJoinRoom,
    toggleReady: socketToggleReady,
    startCombat: socketStartCombat,
    prepareStart: socketPrepareStart,
    prepareInfo: socketPrepareInfo,
    updateDungeon: socketUpdateDungeon,
    kickPlayer: socketKickPlayer,
    preventStart,
    setPreventStart,
  } = useRoomSocket({ 
    roomData: room ? { id: room.id, host: room.host, players: room.players } : undefined,
    userId: user?.id,
    enabled: !!user?.id && !!id && !!room
  });

  const [chatInput, setChatInput] = useState('');
  const { messages: roomChatMessages, sendMessage } = useRoomChat(id);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Auto-scroll to bottom when messages update, but only if autoScrollEnabled is true
  useEffect(() => {
    try {
      const el = chatListRef.current;
      if (!el) return;
      if (!autoScrollEnabled) return;
      // Scroll to bottom smoothly
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch {}
  }, [roomChatMessages, autoScrollEnabled]);

  // Detect user scroll to disable auto-scroll when user scrolls up
  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    const onScroll = () => {
      try {
        const threshold = 80; // px from bottom considered "at bottom"
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
        setAutoScrollEnabled(atBottom);
      } catch {}
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    console.debug('[RoomPage] handleChatSubmit called, text=', text, 'user=', user?.id, user?.username);
    if (!text) return;
    try {
      // Ensure socket has joined this room before emitting chat.
      // Await the joinRoom promise so we only emit after server ack.
      if (!socketJoined && socketJoinRoom && user?.id) {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem(`room:${id}:password`) || undefined : undefined;
        console.log('[RoomPage] socket not joined - attempting socketJoinRoom', { roomId: Number(id), userId: user.id });
        try {
          await socketJoinRoom(Number(id), user.id, stored);
          console.log('[RoomPage] socketJoinRoom succeeded before chat emit');
        } catch (joinErr) {
          console.warn('[RoomPage] socketJoinRoom failed before chat emit:', joinErr);
          // If join failed, avoid emitting chat to prevent server rejection.
          toast.error('Không thể gửi tin nhắn — chưa tham gia phòng qua socket');
          setChatInput('');
          return;
        }
      }

      sendMessage(text, user?.username || String(user?.id || 'Anon'));
      console.debug('[RoomPage] sendMessage invoked');
    } catch (err) {
      console.error('[RoomPage] sendMessage error', err);
    }
    setChatInput('');
  };

  // Debug: observe roomChatMessages lifecycle
  useEffect(() => {
    try { console.debug('[RoomPage] useRoomChat hook mounted'); } catch {}
  }, []);

  useEffect(() => {
    try { console.debug('[RoomPage] roomChatMessages updated, count=', (roomChatMessages || []).length); } catch {}
  }, [roomChatMessages]);

  const reportCombatToQuests = useCallback(async (cr: unknown) => {
    // Forward minimal identifiers so backend can load the persisted CombatResult
    // and attribute quest progress. Avoid sending the entire large payload.
    if (!cr || !user?.id) return;
    try {
      const maybe = cr as CombatReport;
      // combatResultId may be at top-level `id` or nested (depends on where socket provides it)
      const combatResultId = maybe?.id ?? maybe?.combatResultId ?? maybe?.result?.combatResultId ?? null;
  // Try several places for dungeonId: direct, nested result, or room info
  const dungeonId = maybe?.dungeonId ?? maybe?.result?.dungeonId ?? socketRoomInfo?.dungeonId ?? room?.dungeon?.id ?? null;

  const body: { combatResultId?: number; dungeonId?: number; enemyKills?: { enemyType: string; count: number }[]; collectedItems?: { itemId: number; quantity: number }[] } = {};
      if (combatResultId) body.combatResultId = Number(combatResultId);
      if (dungeonId) body.dungeonId = Number(dungeonId);

      // If the socket payload includes enemies, compute kill counts from final HP
      if (Array.isArray(maybe?.enemies)) {
        // Count enemies with hp <= 0 as killed, aggregate by enemy name/type
        const counts: Record<string, number> = {};
        for (const e of maybe.enemies) {
          try {
            const killed = typeof e?.hp === 'number' ? (e.hp <= 0 ? 1 : 0) : 0;
            const key = e?.name ?? String(e?.id ?? 'unknown');
            if (!counts[key]) counts[key] = 0;
            counts[key] += killed;
          } catch {
            // ignore malformed enemy entries
          }
        }
        const enemyKills: Array<{ enemyType: string; count: number }> = [];
        for (const [enemyType, count] of Object.entries(counts)) {
          if (count > 0) enemyKills.push({ enemyType, count });
        }
        if (enemyKills.length > 0) body.enemyKills = enemyKills;
      }

      // Compute collected items for this user from combat rewards when available
      try {
        const rewards = maybe?.rewards ?? maybe?.result?.rewards ?? null;
        let collected: Array<{ itemId: number; quantity: number }> = [];

        // If rewards has perUser array, pick current user's index
        const maybePerUser = rewards?.perUser ?? null;
        if (Array.isArray(maybePerUser) && maybePerUser.length > 0 && maybe?.teamStats && user) {
          const memberIndex = (maybe.teamStats.members || []).findIndex((m) => m.userId === user.id);
          const entry = memberIndex >= 0 ? maybePerUser[memberIndex] : maybePerUser.length === 1 ? maybePerUser[0] : null;
          if (entry && Array.isArray(entry.items)) {
            collected = entry.items.map((it) => ({ itemId: Number(it.itemId ?? it.id), quantity: Number(it.quantity ?? it.qty ?? 1) }));
          }
        } else if (rewards && Array.isArray(rewards.items)) {
          // Solo/legacy: rewards.items is aggregated for single-player
          collected = rewards.items.map((it) => ({ itemId: Number(it.itemId ?? it.id), quantity: Number(it.quantity ?? it.qty ?? 1) }));
        }

        if (collected.length > 0) {
          body.collectedItems = collected;
        }
      } catch {
        // ignore collection extraction errors
      }

      const resp = await api.post('/quests/combat-progress', body);
      console.log('Reported combat to quests', resp?.status, body);
    } catch (err) {
      console.error('Failed reporting combat to quests', err);
    }
  }, [user, socketRoomInfo?.dungeonId, room?.dungeon?.id]);

  useEffect(() => {
    if (socketCombatResult) {
      setCombatResult(socketCombatResult as CombatResult);
      setShowCombatModal(true);
      // Lock Start while combat UI is showing so host cannot re-start
      try { setPreventStart(true); } catch {}
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      }
      void reportCombatToQuests(socketCombatResult);
    }
  }, [socketCombatResult, queryClient, user?.id, reportCombatToQuests, setPreventStart]);

  // mutations
  const updateDungeonMutation = useMutation({
    mutationFn: async ({ dungeonId }: { dungeonId: number }) => {
      if (!id || !user?.id) throw new Error('Room ID and User ID required');
      const roomIdNum = Number(id);
      await socketUpdateDungeon(roomIdNum, user.id, dungeonId);
    },
    onSuccess: () => {
      setShowDungeonDialog(false);
      setSelectedDungeonId(null);
    }
  });

  const kickPlayerMutation = useMutation({
    mutationFn: async ({ playerId }: { playerId: number }) => {
      if (!id || !user?.id) throw new Error('Room ID and User ID required');
      const roomIdNum = Number(id);
      await socketKickPlayer(roomIdNum, user.id, playerId);
    }
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/join`, { playerId: user?.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã tham gia phòng thành công!');
      // Best-effort: ensure socket also joins the room so we receive socket events like roomChat
      try {
        if (socketJoinRoom) {
          void socketJoinRoom(Number(id), user?.id as number).catch(() => {});
        }
      } catch {}
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tham gia phòng');
    },
  });

  // password dialog for private rooms
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const handleJoinWithPassword = async () => {
    if (!user?.id) {
      toast.error('Bạn cần đăng nhập để tham gia phòng');
      return;
    }
    try {
      await api.post(`/room-lobby/${id}/join`, { playerId: user.id, password: joinPassword });
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      // Persist the password temporarily so rejoin attempts within the same session can use it
      try { sessionStorage.setItem(`room:${id}:password`, joinPassword); } catch { }

      // After successful REST join, also try to join via WebSocket with the provided password
      try {
        if (socketJoinRoom) {
          await socketJoinRoom(Number(id), user.id, joinPassword);
        }
      } catch (sockErr) {
        // Socket join failing is non-fatal because REST join already succeeded.
        // Log for diagnostics and allow UI to continue using REST-backed room state.
        console.warn('Socket join after REST join failed:', sockErr);
      }

      toast.success('Đã tham gia phòng thành công!');
      setShowPasswordDialog(false);
      setJoinPassword('');
    } catch (err: unknown) {
      const extractMessage = (e: unknown) => {
        if (!e) return 'Không thể tham gia phòng';
        if (typeof e === 'string') return e;
        if (typeof e === 'object') {
          const rec = e as Record<string, unknown>;
          if (rec && typeof rec['message'] === 'string') return String(rec['message']);
        }
        return 'Không thể tham gia phòng';
      };
      toast.error(extractMessage(err));
    }
  };

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/leave`, { playerId: user?.id });
      return response.data;
    },
    onSuccess: () => {
  router.push('/game/explore');
      toast.success('Đã rời phòng thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể rời phòng');
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/start`, { hostId: user?.id });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      if (data.combatResult) {
        setCombatResult(data.combatResult as CombatResult);
        setShowCombatModal(true);
        toast.success('Trận chiến đã bắt đầu!');
      } else {
        toast.success('Trận chiến đã bắt đầu!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể bắt đầu trận chiến');
    },
  });

  const resetRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/reset`, { hostId: user?.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      try { setPreventStart(false); } catch {}
    },
    onError: (error: Error) => {
      console.error('Failed to reset room:', error);
    },
  });

  const handleCombatModalClose = () => {
    setShowCombatModal(false);
    setCombatResult(null);
  try { useRoomSocketStore.setState({ combatResult: null }); } catch { }
    // Keep the players in their current ready state after combat (per request)
    // but clear the prepare UI and keep the combatResult cleared locally
    try {
      useRoomSocketStore.setState({ prepareInfo: null, combatResult: null });
    } catch {}

    // Keep Start disabled until server/host explicitly resets room state
    try { setPreventStart(true); } catch {}

    if (isHost) resetRoomMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-full px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Không thể tải thông tin phòng</p>
            <Button onClick={() => router.push('/game/explore')}>Quay lại khám phá</Button>
          </CardContent>
        </Card>
        
      </div>
    );
  }

  if (!room) return null;

  const socketPlayer = socketRoomInfo?.players?.find((p: { id: number }) => p.id === user?.id);
  const regularPlayer = room.players?.find((p: { player: { id: number } }) => p.player.id === user?.id);
  const isPlayerInRoom = !!(socketPlayer || regularPlayer);
  const socketJoined = socketRoomInfo?.id === room.id;
  const currentDungeonName = socketRoomInfo?.dungeonName || room.dungeon.name;
  const currentDungeonLevel = room.dungeon.level;

  const socketPlayersToCheck = socketRoomInfo?.players?.filter((p: { status: string; id: number; isReady?: boolean }) => (p.status === 'JOINED' || p.status === 'READY') && p.id !== room.host.id) || [];
  const apiPlayersToCheck = room.players?.filter((p: { status: string; player: { id: number }; isReady?: boolean }) => (p.status === 'JOINED' || p.status === 'READY') && p.player.id !== room.host.id) || [];

  const allPlayersReady = socketRoomInfo ? socketPlayersToCheck.length === 0 || socketPlayersToCheck.every((p: { isReady?: boolean }) => p.isReady === true) : apiPlayersToCheck.length === 0 || apiPlayersToCheck.every((p: { isReady?: boolean }) => Boolean(p.isReady));

  const canStart = isHost && room.currentPlayers >= room.minPlayers && room.status.toLowerCase() === 'waiting' && allPlayersReady;

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants: Record<string, string> = {
      waiting: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      in_combat: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return variants[statusLower] || 'bg-gray-100 text-gray-800';
  };

  const getPlayerStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      JOINED: 'bg-green-100 text-green-800',
      READY: 'bg-blue-100 text-blue-800',
      LEFT: 'bg-gray-100 text-gray-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  function PlayerRow({ player }: { player: { id: number; player: { username: string; level: number; id: number }; status: string } }) {
    const userId = player.player.id;
    // request faster polling while on the room page (every 5s)
    const { data: stamina, isLoading: staminaLoading } = useUserStamina(userId, { refetchInterval: 5000 });
    const current = stamina?.currentStamina ?? 0;
    const max = stamina?.maxStamina ?? 100;
    const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(1, max)) * 100)));
    const barColor = pct <= 20 ? 'bg-red-500' : pct <= 50 ? 'bg-yellow-400' : 'bg-green-500';

    return (
    <div className="w-full min-w-0 flex items-center justify-between p-2 bg-gray-50 rounded-lg gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {player.player.id === room.host.id && (<Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />)}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{player.player.username}</p>
            <p className="text-xs text-gray-500">Lv {player.player.level}</p>
            <div className="mt-1 w-40">
              {staminaLoading ? (
                <div className="w-full h-2 bg-gray-200 rounded" />
              ) : (
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className={`${barColor} h-2 rounded`} style={{ width: `${pct}%` }} />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{staminaLoading ? 'Đang tải...' : `${current}/${max}`}{!staminaLoading && pct <= 20 ? ' ⚠' : ''}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPlayerStatusBadge(player.status)}>{player.status}</Badge>
          {isHost && player.player.id !== room.host.id && (
            <Button variant="outline" size="sm" onClick={() => kickPlayerMutation.mutate({ playerId: player.player.id })} disabled={kickPlayerMutation.isPending} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"><UserX className="h-3 w-3" /></Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-3 py-6">
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium">{room.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusBadge(room.status)}>{room.status}</Badge>
              {room.isPrivate && (<Badge variant="outline">Phòng riêng tư</Badge>)}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/game/explore')} className="px-3 py-1 text-sm">Quay lại</Button>
        </div>

        {/* Room Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Thông tin phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* compact responsive layout: two columns on small screens, 4 columns on md+ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500">Dungeon</p>
                {isHost ? (
                  <button onClick={() => setShowDungeonDialog(true)} className="font-medium text-left hover:text-blue-600 transition-colors flex items-center gap-1 text-sm truncate">{currentDungeonName}<Settings className="h-3 w-3" /></button>
                ) : (
                  <p className="font-medium text-sm truncate">{currentDungeonName}</p>
                )}
                <p className="text-xs text-gray-500">Lv {currentDungeonLevel}</p>
              </div>
              <div className="col-span-1">
                <p className="text-xs text-gray-500">Host</p>
                <p className="font-medium text-sm flex items-center gap-1 truncate"><Crown className="h-4 w-4 text-yellow-500" />{room.host.username}</p>
                <p className="text-xs text-gray-500">Lv {room.host.level}</p>
              </div>
              <div className="col-span-1">
                <p className="text-xs text-gray-500">Người chơi</p>
                <p className="font-medium text-sm flex items-center gap-1"><Users className="h-4 w-4" />{room.currentPlayers}/{room.maxPlayers}</p>
                <p className="text-xs text-gray-500">Min: {room.minPlayers}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500">Tạo lúc</p>
                <p className="font-medium text-sm flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(room.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người chơi ({room.players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {room.players.map((player: { id: number; player: { username: string; level: number; id: number }; status: string }) => (
                <PlayerRow key={player.id} player={player} />
              ))}

              {room.players.length === 0 && (<p className="text-center text-gray-500 py-2 col-span-1 sm:col-span-2">Chưa có người chơi nào trong phòng</p>)}
            </div>
          </CardContent>
        </Card>

        {/* In-Room Chat (ephemeral, socket-backed when available) */}
        <Card>
          <CardHeader>
            <CardTitle>Chat phòng</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-col h-36 md:h-44">
              <div ref={chatListRef} className="flex-1 overflow-y-auto pr-1 mb-1" id="room-chat-list" aria-live="polite">
                {(roomChatMessages || []).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chưa có tin nhắn — bắt đầu cuộc trò chuyện!</p>
                ) : (
                  (roomChatMessages || []).map((m, i) => (
                    <div key={i} className="mb-1">
                      <p className="text-sm font-medium truncate">{m.username} <span className="text-xs text-gray-400">· {new Date(m.ts).toLocaleTimeString()}</span></p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{m.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto">
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    aria-label="Gửi tin nhắn trong phòng"
                    className="flex-1 px-2 py-1 border rounded bg-white dark:bg-slate-800 text-sm dark:text-gray-100"
                    placeholder="Gõ tin nhắn và nhấn Enter..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button type="submit" className="whitespace-nowrap px-3 py-1 text-sm">Gửi</Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2 justify-center">
              {isHost ? (
                <>
                  <Button onClick={async () => {
                    // Ensure host is marked Ready before initiating prepare/start
                    if (!user?.id) return;
                    try {
                      const hostPlayer = socketRoomInfo?.players?.find((p: { id: number; isReady?: boolean } ) => p.id === user.id);
                      const hostIsReady = hostPlayer?.isReady === true;
                      if (!hostIsReady) {
                        if (socketToggleReady) {
                          await socketToggleReady(Number(id), user.id);
                        } else {
                          // fallback: optimistically update local socket store so UI shows host as ready
                          try {
                            const s = useRoomSocketStore.getState();
                            const currentRoom = s.roomInfo;
                            if (currentRoom && currentRoom.id === room.id) {
                              const updated = {
                                ...currentRoom,
                                players: (currentRoom.players || []).map((p: { id: number; isReady?: boolean; status?: string; username?: string; joinedAt?: string }) => {
                                  if (p.id === user.id) return { ...p, isReady: true, status: 'READY', joinedAt: p.joinedAt || new Date().toISOString(), username: p.username || '' };
                                  return { id: p.id, username: p.username || '', status: p.status || 'JOINED', isReady: Boolean(p.isReady), joinedAt: p.joinedAt || new Date().toISOString() };
                                }),
                              };
                              useRoomSocketStore.setState({ roomInfo: updated });
                            }
                          } catch {}
                        }
                      }
                    } catch (err) {
                      console.error('Failed to set host ready:', err);
                      toast.error('Không thể đặt trạng thái sẵn sàng cho host');
                      return;
                    }

                    // Trigger prepare flow: host asks all players to ready up
                    if (user?.id && socketPrepareStart) {
                      try {
                        await socketPrepareStart(Number(id), user.id);
                        toast.success('Đã gửi yêu cầu chuẩn bị cho tất cả người chơi');
                      } catch (err) {
                        console.error('Failed to emit prepareStart:', err);
                        // Fallback: attempt immediate start if everyone is already ready
                        if (!allPlayersReady) {
                          toast.error('Không thể bắt đầu: một số người chơi chưa sẵn sàng');
                          return;
                        }
                        if (user?.id && socketStartCombat) {
                          try {
                            await socketStartCombat(Number(id), user.id);
                          } catch (error) {
                            console.error('Failed to start combat via socket:', error);
                            startMutation.mutate();
                          }
                        }
                      }
                    } else {
                      // If socket prepare isn't available, fall back to old flow
                      if (!allPlayersReady) {
                        toast.error('Không thể bắt đầu: một số người chơi chưa sẵn sàng');
                        return;
                      }
                      if (user?.id && socketStartCombat) {
                        try {
                          await socketStartCombat(Number(id), user.id);
                        } catch (error) {
                          console.error('Failed to start combat via socket:', error);
                          startMutation.mutate();
                        }
                      }
                    }
                  }} disabled={!canStart || startMutation.isPending || preventStart} className="px-4 py-1 text-sm">{startMutation.isPending ? 'Đang...' : 'Bắt đầu'}</Button>
                  <ShareButton room={room} hostUsername={room.host.username} />
                  <Button variant="destructive" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} className="px-3 py-1 text-sm">{leaveMutation.isPending ? 'Đang...' : 'Hủy'}</Button>
                </>
              ) : (
                <>
                  {!isPlayerInRoom ? (
                    <>
                      <Button onClick={async () => {
                        if (room.isPrivate) {
                          // show password dialog
                          setShowPasswordDialog(true);
                          return;
                        }
                        if (user?.id && socketJoinRoom) {
                          try {
                            await socketJoinRoom(Number(id), user.id);
                            queryClient.invalidateQueries({ queryKey: ['room', id] });
                          } catch (error) {
                            console.error('Failed to join room via socket:', error);
                            joinMutation.mutate();
                          }
                        }
                      }} disabled={joinMutation.isPending || room.currentPlayers >= room.maxPlayers} className="px-4 py-1 text-sm">{joinMutation.isPending ? 'Đang...' : 'Tham gia'}</Button>
                    </>
                  ) : (
                    <>
                      {!isHost && (
                        (!socketJoined) ? (
                          <Button onClick={async () => {
                            try {
                              const stored = typeof window !== 'undefined' ? sessionStorage.getItem(`room:${id}:password`) || undefined : undefined;
                              if (user?.id && socketJoinRoom) {
                                await socketJoinRoom(Number(id), user.id, stored);
                              }
                            } catch (err) {
                              console.warn('Rejoin via socket failed', err);
                              toast.error('Không thể kết nối lại tới phòng');
                            }
                          }} variant="outline" className="px-4 py-1 text-sm">Kết nối lại</Button>
                        ) : (
                          <></>
                        )
                      )}
                      <Button variant="outline" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} className="px-3 py-1 text-sm">{leaveMutation.isPending ? 'Đang...' : 'Rời'}</Button>
                    </>
                  )}
                </>
              )}
            </div>
            {!canStart && isHost && room.currentPlayers < room.minPlayers && (<p className="text-center text-sm text-gray-500 mt-2">Cần ít nhất {room.minPlayers} người chơi để bắt đầu (hiện tại: {room.currentPlayers})</p>)}
            {!canStart && isHost && room.currentPlayers >= room.minPlayers && !allPlayersReady && (<p className="text-center text-sm text-gray-500 mt-2">Tất cả người chơi phải ấn &quot;Sẵn sàng&quot; trước khi bắt đầu trận chiến</p>)}
          </CardContent>
        </Card>
      </div>

      {/* Change Dungeon Dialog */}
      <Dialog open={showDungeonDialog} onOpenChange={setShowDungeonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn Dungeon mới</DialogTitle>
            <DialogDescription>Chọn một dungeon khác cho phòng này. Việc thay đổi sẽ ảnh hưởng đến tất cả người chơi.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="dungeon-select" className="text-sm font-medium">Dungeon</label>
              <Select value={selectedDungeonId?.toString() || ""} onValueChange={(value) => setSelectedDungeonId(parseInt(value))}>
                <SelectTrigger><SelectValue placeholder="Chọn dungeon..." /></SelectTrigger>
                <SelectContent>
                  {dungeons?.map((dungeon: Dungeon) => (<SelectItem key={dungeon.id} value={dungeon.id.toString()}>{dungeon.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDungeonDialog(false)}>Hủy</Button>
            <Button onClick={() => { if (selectedDungeonId) { updateDungeonMutation.mutate({ dungeonId: selectedDungeonId }); } }} disabled={!selectedDungeonId || updateDungeonMutation.isPending}>{updateDungeonMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog for private rooms */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phòng riêng tư</DialogTitle>
            <DialogDescription>Nhập mật khẩu để tham gia phòng này.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Mật khẩu" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPasswordDialog(false); setJoinPassword(''); router.push(`/game/explore/dungeons/${room.dungeon.id}`); }}>Hủy</Button>
            <Button onClick={handleJoinWithPassword}>Tham gia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CombatModal isOpen={showCombatModal} onClose={handleCombatModalClose} combatResult={combatResult} dungeonName={room?.dungeon?.name || 'Dungeon'} />
      {/* Prepare-to-Start Modal: shown when server emits prepareToStart and prepareInfo matches this room */}
      <Dialog open={Boolean(socketPrepareInfo && socketPrepareInfo.id === room.id)} onOpenChange={() => { /* controlled by server */ }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuẩn bị bắt đầu trận chiến</DialogTitle>
            <DialogDescription>Host đã yêu cầu tất cả người chơi sẵn sàng. Khi tất cả đã sẵn sàng, trận chiến sẽ bắt đầu tự động.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {/* Exclude players who have LEFT so counts match the main room player list */}
            {(() => {
              const visiblePlayers = (socketPrepareInfo?.players || []).filter((p: { status?: string }) => p.status !== 'LEFT');
              const readyCount = visiblePlayers.filter((p: { isReady?: boolean }) => p.isReady).length;
              return <p className="text-sm">{readyCount} / {visiblePlayers.length} đã sẵn sàng</p>;
            })()}
            <div className="space-y-2">
              {/* Only show players who are still present (not LEFT) */}
              {(socketPrepareInfo?.players || []).filter((p: { status?: string }) => p.status !== 'LEFT').map((p: { id: number; username?: string; isReady?: boolean }) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{p.username}</p>
                  </div>
                  <div>
                    {p.id === user?.id ? (
                      <Button variant={p.isReady ? 'default' : 'outline'} onClick={async () => {
                        if (!user?.id || !socketToggleReady) return;
                        // optimistic local update so UI reflects the change immediately
                        try {
                          try {
                            const store = useRoomSocketStore.getState();
                            const pi = store.prepareInfo;
                            if (pi && pi.id === room.id) {
                              type P = { id: number; username?: string; isReady?: boolean };
                              const updated = {
                                ...pi,
                                players: (pi.players || []).map((q: P) => q.id === user.id ? { ...q, isReady: !q.isReady } : q)
                              } as typeof pi;
                              useRoomSocketStore.setState({ prepareInfo: updated });
                            }
                          } catch (e) {
                            // swallow optimistic update failures
                            void e;
                          }

                          await socketToggleReady(Number(id), user.id);
                        } catch  {
                          toast.error('Không thể thay đổi trạng thái sẵn sàng');
                          // revert optimistic change if server call failed
                          try {
                            const store = useRoomSocketStore.getState();
                            const pi = store.prepareInfo;
                            if (pi && pi.id === room.id) {
                              type P = { id: number; username?: string; isReady?: boolean };
                              const updated = {
                                ...pi,
                                players: (pi.players || []).map((q: P) => q.id === user.id ? { ...q, isReady: !q.isReady } : q)
                              } as typeof pi;
                              useRoomSocketStore.setState({ prepareInfo: updated });
                            }
                          } catch {}
                        }
                      }}>
                        {p.isReady ? '✓ Sẵn sàng' : 'Sẵn sàng'}
                      </Button>
                    ) : (
                      <Badge className={p.isReady ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>{p.isReady ? 'Sẵn sàng' : 'Chưa'}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { /* host can cancel by leaving dialog on server; client just closes local UI when server clears prepareInfo */ }}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
