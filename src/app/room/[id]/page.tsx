'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Crown, Clock, MapPin, CheckCircle, Circle, Settings, UserX } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Dungeon } from '@/types/game';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useRoomSocketStore } from '@/stores/useRoomSocketStore';
import { toast } from 'sonner';
import CombatModal from '@/components/ui/CombatModal';
import { WebSocketDebug } from '@/components/ui/WebSocketDebug';

interface RoomPlayer {
  id: number;
  status: 'JOINED' | 'READY' | 'LEFT';
  player: {
    id: number;
    username: string;
    level: number;
  };
  // For backend API data structure
  isReady?: boolean;
}

// Socket room player structure (different from API)
interface SocketRoomPlayer {
  id: number;
  username: string;
  status: string;
  isReady: boolean;
  joinedAt: string;
}

interface RoomData {
  id: number;
  name: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isPrivate: boolean;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  createdAt: string;
  host: {
    id: number;
    username: string;
    level: number;
  };
  dungeon: {
    id: number;
    name: string;
    level: number;
  };
  players: RoomPlayer[];
}

interface CombatResult {
  id: number;
  result: 'victory' | 'defeat' | 'escape';
  duration: number;
  rewards?: {
    experience?: number;
    gold?: number;
    items?: { itemId: number; quantity: number }[];
  };
  teamStats: {
    totalHp: number;
    currentHp: number;
    members: {
      userId: number;
      username: string;
      hp: number;
      maxHp: number;
    }[];
  };
  logs: Array<{
    id: number;
    userId: number;
    turn: number;
    actionOrder: number;
    action: 'attack' | 'defend' | 'skill' | 'item' | 'escape';
    details: {
      actor: 'player' | 'enemy';
      actorName: string;
      targetName: string;
      damage?: number;
      isCritical?: boolean;
      isMiss?: boolean;
      hpBefore: number;
      hpAfter: number;
      description: string;
      effects?: string[];
    };
  }>;
}

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isHost, setIsHost] = useState(false);
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [showDungeonDialog, setShowDungeonDialog] = useState(false);
  const [selectedDungeonId, setSelectedDungeonId] = useState<number | null>(null);
  
  const { data: room, isLoading, error } = useQuery<RoomData>({
    queryKey: ['room', id],
    queryFn: async () => {
      try {
        // Try to get room by ID first
        const response = await api.get(`/room-lobby/${id}`);
        return response.data;
      } catch (err) {
        // If room not found by ID and current user exists, try to get by host
        if (user?.id) {
          try {
            const hostResponse = await api.get(`/room-lobby/host/${user.id}`);
            const hostRoom = hostResponse.data;
            if (hostRoom && hostRoom.id.toString() === id) {
              return hostRoom;
            }
          } catch {
            // Ignore host lookup errors
          }
        }
        throw err;
      }
    },
    refetchInterval: 2000, // Auto refresh every 2 seconds
    enabled: !!id,
  });

  // Fetch dungeons for dropdown
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

  // Update isHost when room data changes
  useEffect(() => {
    if (room && user) {
      setIsHost(room.host.id === user.id);
    }
  }, [room, user]);

  // WebSocket integration with new optimized hook - moved after room query
  const { 
    roomInfo: socketRoomInfo, 
    combatResult: socketCombatResult,
  // socket connection flags removed (not used here)
    joinRoom: socketJoinRoom,
    toggleReady: socketToggleReady,
    startCombat: socketStartCombat,
    updateDungeon: socketUpdateDungeon,
    kickPlayer: socketKickPlayer,
  // leaveRoom not used in this component
    error: socketError
  } = useRoomSocket({ 
    roomData: room ? {
      id: room.id,
      host: room.host,
      players: room.players
    } : undefined,
    userId: user?.id,
    enabled: !!user?.id && !!id && !!room
  });

  // Report combat results to quest service so quests get progress updates
  const reportCombatToQuests = useCallback(async (cr: unknown) => {
    if (!cr) {
      console.log('[Quest] reportCombatToQuests skipped: no combat result provided', { cr });
      return;
    }
    if (!user?.id) {
      console.log('[Quest] reportCombatToQuests skipped: no user id', { user });
      return;
    }

    // Helpful debug: show the raw combat result that's being reported
    console.log('[Quest] reportCombatToQuests called with combatResult:', cr);

    try {
      const enemyMap: Record<string, number> = {};
      const crRec = cr as Record<string, unknown>;

      if (Array.isArray(crRec['enemies'])) {
        for (const e of (crRec['enemies'] as unknown[])) {
          const eRec = e as Record<string, unknown>;
          const hp = eRec['hp'];
          if (typeof hp === 'number' && hp <= 0) {
            const name = String(eRec['name'] ?? 'unknown');
            enemyMap[name] = (enemyMap[name] || 0) + 1;
          }
        }
      }

      const enemyKills = Object.entries(enemyMap).map(([enemyType, count]) => ({ enemyType, count }));

        // Try to derive a numeric combatResultId safely. If it cannot be parsed to
        // a valid number, omit it from the payload (sending NaN is harmful).
        let crIdVal: number | undefined;
        if (typeof crRec['id'] === 'number') {
          crIdVal = crRec['id'] as number;
        } else if (typeof crRec['combatResultId'] === 'number') {
          crIdVal = crRec['combatResultId'] as number;
        } else if (typeof crRec['id'] === 'string' && !Number.isNaN(Number(crRec['id']))) {
          crIdVal = Number(crRec['id']);
        }

        // Dungeon id fallback: prefer explicit dungeonId on the combat result,
        // then nested cr.dungeon.id, and finally the current room dungeon id.
        let dungeonIdVal: number | undefined;
        if (typeof crRec['dungeonId'] === 'number') {
          dungeonIdVal = crRec['dungeonId'] as number;
        } else if (crRec['dungeon'] && typeof (crRec['dungeon'] as Record<string, unknown>)['id'] === 'number') {
          dungeonIdVal = ((crRec['dungeon'] as Record<string, unknown>)['id']) as number;
        } else if (room?.dungeon?.id) {
          dungeonIdVal = room.dungeon.id;
        }

        const payload: Record<string, unknown> = {};
        if (typeof crIdVal === 'number' && !Number.isNaN(crIdVal)) payload.combatResultId = crIdVal;
        if (typeof dungeonIdVal === 'number') payload.dungeonId = dungeonIdVal;

      if (enemyKills.length > 0) payload.enemyKills = enemyKills;

      if (crRec['result'] === 'victory') {
        const enemies = crRec['enemies'];
        if (Array.isArray(enemies)) {
          payload.bossDefeated = enemies.some(en => {
            const name = (en as Record<string, unknown>)['name'];
            return typeof name === 'string' && name.toLowerCase().includes('boss');
          });
        }
      }

      // Send to quests endpoint (uses axios instance with auth)
      const resp = await api.post('/quests/combat-progress', payload);
      // Log response and payload to help debugging quest completion issues
      const respData = resp?.data as Record<string, unknown> | undefined;
      console.log('[Quest] Reported combat result to quests payload:', payload);
      console.log('[Quest] quests response status:', resp?.status, 'data:', respData);

      if (!('combatResultId' in payload)) {
        console.warn('[Quest] payload missing combatResultId - quest server may not evaluate progress properly', { payload, cr });
      }
      if (!('dungeonId' in payload)) {
        console.warn('[Quest] payload missing dungeonId - fallback to room.dungeon may be required', { payload, roomDungeonId: room?.dungeon?.id });
      }

      if (respData && typeof respData['completed'] !== 'undefined') {
        console.log('[Quest] quests completed flag:', respData['completed']);
      }
    } catch (err) {
      console.error('[Quest] Failed reporting combat to quests', err);
    }
  }, [user, room]);

  // Mutations for room operations
  const updateDungeonMutation = useMutation({
    mutationFn: async ({ dungeonId }: { dungeonId: number }) => {
      if (!id || !user?.id) throw new Error('Room ID and User ID required');
      const roomId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
      await socketUpdateDungeon(roomId, user.id, dungeonId);
    },
    onSuccess: () => {
      setShowDungeonDialog(false);
      setSelectedDungeonId(null);
    }
  });

  const kickPlayerMutation = useMutation({
    mutationFn: async ({ playerId }: { playerId: number }) => {
      if (!id || !user?.id) throw new Error('Room ID and User ID required');
      const roomId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
      
  // debug logs removed - keep behavior unchanged
      
      await socketKickPlayer(roomId, user.id, playerId);
    }
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/join`, {
        playerId: user?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Đã tham gia phòng thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tham gia phòng');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/leave`, {
        playerId: user?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      if (isHost) {
        router.push('/game?tab=explore');
        toast.success('Đã hủy phòng thành công!');
      } else {
        router.push('/game?tab=explore');
        toast.success('Đã rời phòng thành công!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể rời phòng');
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/room-lobby/${id}/start`, {
        hostId: user?.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      
      // Check if combat result is returned
      if (data.combatResult) {
        setCombatResult(data.combatResult);
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
      const response = await api.post(`/room-lobby/${id}/reset`, {
        hostId: user?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
    },
    onError: (error: Error) => {
      console.error('Failed to reset room:', error);
    },
  });

  const handleCombatModalClose = () => {
    setShowCombatModal(false);
    setCombatResult(null);
    // Also clear the global combat result stored in the room socket store
    // so that the UI does not replay a stale combat when re-entering the room.
    try {
      useRoomSocketStore.setState({ combatResult: null });
    } catch (e) {
      // Defensive: if store.setState is not available for some reason, ignore.
      console.warn('Failed to clear global combatResult on modal close', e);
    }
    
    // Reset room status back to WAITING so players can fight again
    if (isHost) {
      resetRoomMutation.mutate();
    }
  };

  useEffect(() => {
    if (room && user) {
      setIsHost(room.host.id === user.id);
    }
  }, [room, user]);

  // Handle WebSocket combat results
  useEffect(() => {
    console.log('[Combat Debug] Effect triggered. socketCombatResult:', socketCombatResult);
    if (socketCombatResult) {
      console.log('[Combat Debug] Setting combat result and showing modal:', socketCombatResult);
      setCombatResult(socketCombatResult);
      setShowCombatModal(true);

      // Invalidate user-related queries immediately so StatusTab refreshes
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user-status'] });
        queryClient.invalidateQueries({ queryKey: ['userStats', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user-stats', user.id] });
        queryClient.invalidateQueries({ queryKey: ['userStamina', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user-stamina', user.id] });
        queryClient.invalidateQueries({ queryKey: ['equipped-items', user.id] });
      }
      // Report to quest service
      void reportCombatToQuests(socketCombatResult);
    }
  }, [socketCombatResult, queryClient, user?.id, reportCombatToQuests]);

  // Debug effect to track modal state
  useEffect(() => {
    console.log('[Combat Debug] Modal state changed - showCombatModal:', showCombatModal, 'combatResult:', !!combatResult);
  }, [showCombatModal, combatResult]);

  // Handle player kicked event
  useEffect(() => {
    const { socket } = useRoomSocketStore.getState();
    
    if (socket && user?.id) {
  const handlePlayerKicked = (data: { kickedPlayerId: number; message: string }) => {
        
        // Check if current user was kicked
        if (data.kickedPlayerId === user.id) {
          toast.error(`Bạn đã bị kick khỏi phòng: ${data.message}`);
          router.push('/game?tab=explore');
        } else {
          toast.info(data.message);
        }
      };

      socket.on('playerKicked', handlePlayerKicked);

      return () => {
        socket.off('playerKicked', handlePlayerKicked);
      };
    }
  }, [user?.id, router]);

  // Handle WebSocket errors
  useEffect(() => {
    if (socketError) {
      toast.error(`WebSocket error: ${socketError}`);
    }
  }, [socketError]);

  // Quick debug: log socket info and listen for server acks/events so we can
  // verify in the browser console whether the client actually joined and
  // whether combat results arrive.
  useEffect(() => {
    const { socket } = useRoomSocketStore.getState();
    if (!socket) return;

    try {
      console.log('[WS Debug] socket namespace: /rooms, socket id:', socket.id);
    } catch (e) {
      console.log('[WS Debug] socket object unavailable', e);
    }

    const handleJoined = (data: unknown) => console.log('[WS Debug] joinedRoom ack:', data);
    const handleCombat = (data: unknown) => console.log('[WS Debug] combatResult event:', data);

    socket.on('joinedRoom', handleJoined);
    socket.on('combatResult', handleCombat);

    return () => {
      socket.off('joinedRoom', handleJoined);
      socket.off('combatResult', handleCombat);
    };
  }, [socketRoomInfo]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Không thể tải thông tin phòng</p>
            <Button onClick={() => router.push('/game?tab=explore')}>
              Quay lại khám phá
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!room) return null;

  // Determine current player status from socket or regular room data
  const socketPlayer = socketRoomInfo?.players?.find(p => p.id === user?.id);
  const regularPlayer = room.players?.find(p => p.player.id === user?.id);
  const isPlayerInRoom = !!(socketPlayer || regularPlayer);
  const isPlayerReady = socketPlayer?.isReady || false;

  // Use socket data for dungeon info if available, otherwise fallback to API data
  const currentDungeonName = socketRoomInfo?.dungeonName || room.dungeon.name;
  const currentDungeonLevel = room.dungeon.level; // This should come from API as socket doesn't have level info
  
  // Use room data for UI display (socket data might have different structure)
  const socketPlayersToCheck = socketRoomInfo?.players?.filter(p => 
    (p.status === 'JOINED' || p.status === 'READY') && p.id !== room.host.id
  ) || [];
  const apiPlayersToCheck = room.players?.filter(p => 
    (p.status === 'JOINED' || p.status === 'READY') && p.player.id !== room.host.id
  ) || [];
  
  const allPlayersReady = socketRoomInfo ? 
    // For socket data: check all non-host players are ready
    socketPlayersToCheck.length === 0 || socketPlayersToCheck.every(p => p.isReady === true)
    :
    // For API data: check if non-host players have isReady field set to true
    apiPlayersToCheck.length === 0 || apiPlayersToCheck.every(p => Boolean((p as RoomPlayer & { isReady?: boolean }).isReady));
  
  // Removed verbose debug logs; only quest logs retained
    
  const canStart = isHost && 
    room.currentPlayers >= room.minPlayers && 
    room.status.toLowerCase() === 'waiting' &&
    allPlayersReady;

  // Removed verbose room debug logs

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      waiting: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      in_combat: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return variants[statusLower as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getPlayerStatusBadge = (status: string) => {
    const variants = {
      JOINED: 'bg-green-100 text-green-800',
      READY: 'bg-blue-100 text-blue-800',
      LEFT: 'bg-gray-100 text-gray-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{room.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusBadge(room.status)}>
                {room.status}
              </Badge>
              {room.isPrivate && (
                <Badge variant="outline">Phòng riêng tư</Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/game?tab=explore')}
          >
            Quay lại
          </Button>
        </div>

        {/* Room Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Thông tin phòng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Dungeon</p>
                {isHost ? (
                  <button
                    onClick={() => setShowDungeonDialog(true)}
                    className="font-medium text-left hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    {currentDungeonName}
                    <Settings className="h-3 w-3" />
                  </button>
                ) : (
                  <p className="font-medium">{currentDungeonName}</p>
                )}
                <p className="text-sm text-gray-500">Level {currentDungeonLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Host</p>
                <p className="font-medium flex items-center gap-1">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {room.host.username}
                </p>
                <p className="text-sm text-gray-500">Level {room.host.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số người chơi</p>
                <p className="font-medium flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {room.currentPlayers}/{room.maxPlayers}
                </p>
                <p className="text-sm text-gray-500">Tối thiểu: {room.minPlayers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thời gian tạo</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(room.createdAt).toLocaleTimeString()}
                </p>
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
            <div className="space-y-3">
              {room.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {player.player.id === room.host.id && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{player.player.username}</p>
                      <p className="text-sm text-gray-500">Level {player.player.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPlayerStatusBadge(player.status)}>
                      {player.status}
                    </Badge>
                    {isHost && player.player.id !== room.host.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => kickPlayerMutation.mutate({ playerId: player.player.id })}
                        disabled={kickPlayerMutation.isPending}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {room.players.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Chưa có người chơi nào trong phòng
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3 justify-center">
              {isHost ? (
                <>
                  <Button
                    onClick={async () => {
                      if (user?.id && socketStartCombat) {
                        try {
                          await socketStartCombat(Number(id), user.id);
                        } catch (error) {
                          console.error('Failed to start combat via socket:', error);
                          // Fallback to regular API
                          startMutation.mutate();
                        }
                      }
                    }}
                    disabled={!canStart || startMutation.isPending}
                    className="px-8"
                  >
                    {startMutation.isPending ? 'Đang bắt đầu...' : 'Bắt đầu trận chiến'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                  >
                    {leaveMutation.isPending ? 'Đang hủy...' : 'Hủy phòng'}
                  </Button>
                </>
              ) : (
                <>
                  {!isPlayerInRoom ? (
                    <Button
                      onClick={async () => {
                        if (user?.id && socketJoinRoom) {
                          try {
                            await socketJoinRoom(Number(id), user.id);
                            queryClient.invalidateQueries({ queryKey: ['room', id] });
                          } catch (error) {
                            console.error('Failed to join room via socket:', error);
                            // Fallback to regular API
                            joinMutation.mutate();
                          }
                        }
                      }}
                      disabled={joinMutation.isPending || room.currentPlayers >= room.maxPlayers}
                      className="px-8"
                    >
                      {joinMutation.isPending ? 'Đang tham gia...' : 'Tham gia phòng'}
                    </Button>
                  ) : (
                    <>
                      {/* Only show ready button for non-host players */}
                      {!isHost && (
                            <Button
                              onClick={async () => {
                                if (user?.id && socketToggleReady) {
                                  try {
                                    await socketToggleReady(Number(id), user.id);
                                          } catch {
                                              toast.error('Không thể thay đổi trạng thái sẵn sàng');
                                            }
                                } else {
                                  // missing requirements to toggle ready
                                }
                              }}
                              variant={isPlayerReady ? "default" : "outline"}
                              className="px-8"
                            >
                              {isPlayerReady ? '✓ Sẵn sàng' : 'Sẵn sàng'}
                            </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => leaveMutation.mutate()}
                        disabled={leaveMutation.isPending}
                      >
                        {leaveMutation.isPending ? 'Đang rời...' : 'Rời phòng'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
            
            {!canStart && isHost && room.currentPlayers < room.minPlayers && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Cần ít nhất {room.minPlayers} người chơi để bắt đầu (hiện tại: {room.currentPlayers})
              </p>
            )}
            
            {!canStart && isHost && room.currentPlayers >= room.minPlayers && !allPlayersReady && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Tất cả người chơi phải ấn &quot;Sẵn sàng&quot; trước khi bắt đầu trận chiến
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Dungeon Dialog */}
      <Dialog open={showDungeonDialog} onOpenChange={setShowDungeonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn Dungeon mới</DialogTitle>
            <DialogDescription>
              Chọn một dungeon khác cho phòng này. Việc thay đổi sẽ ảnh hưởng đến tất cả người chơi.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="dungeon-select" className="text-sm font-medium">
                Dungeon
              </label>
              <Select
                value={selectedDungeonId?.toString() || ""}
                onValueChange={(value) => setSelectedDungeonId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dungeon..." />
                </SelectTrigger>
                <SelectContent>
                  {dungeons?.map((dungeon: Dungeon) => (
                    <SelectItem key={dungeon.id} value={dungeon.id.toString()}>
                      {dungeon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDungeonDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (selectedDungeonId) {
                  updateDungeonMutation.mutate({ dungeonId: selectedDungeonId });
                }
              }}
              disabled={!selectedDungeonId || updateDungeonMutation.isPending}
            >
              {updateDungeonMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Combat Modal */}
      <CombatModal
        isOpen={showCombatModal}
        onClose={handleCombatModalClose}
        combatResult={combatResult}
        dungeonName={room?.dungeon?.name || 'Dungeon'}
      />
    </div>
  );
}
