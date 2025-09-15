import { useEffect, useRef } from 'react';
import { apiService } from '@/lib/api-service';
import { useRoomSocketStore } from '@/stores/useRoomSocketStore';

interface RoomData {
  id: number;
  host: { id: number };
  players: Array<{ player: { id: number } }>;
}

interface UseRoomSocketHookProps {
  roomData?: RoomData;
  userId?: number;
  enabled?: boolean;
}

/**
 * Optimized hook for room WebSocket management using Zustand
 * Prevents infinite loops by:
 * 1. Using ref for stable join attempt tracking
 * 2. Only attempting join once per room/user combination
 * 3. Clear separation of connection and room joining logic
 */
export function useRoomSocket({
  roomData,
  userId,
  enabled = true
}: UseRoomSocketHookProps = {}) {
  const joinAttemptRef = useRef<Set<string>>(new Set());

  // Select only needed state to prevent unnecessary re-renders
  const socket = useRoomSocketStore((state) => state.socket);
  const isConnected = useRoomSocketStore((state) => state.isConnected);
  const roomInfo = useRoomSocketStore((state) => state.roomInfo);
  const combatResult = useRoomSocketStore((state) => state.combatResult);
  const error = useRoomSocketStore((state) => state.error);
  const joinedRooms = useRoomSocketStore((state) => state.joinedRooms);
  const joinRoom = useRoomSocketStore((state) => state.joinRoom);
  const leaveRoom = useRoomSocketStore((state) => state.leaveRoom);
  const toggleReady = useRoomSocketStore((state) => state.toggleReady);
  const startCombat = useRoomSocketStore((state) => state.startCombat);
  const updateDungeon = useRoomSocketStore((state) => state.updateDungeon);
  const kickPlayer = useRoomSocketStore((state) => state.kickPlayer);
  const clearError = useRoomSocketStore((state) => state.clearError);
  const resetConnectionAttempts = useRoomSocketStore((state) => state.resetConnectionAttempts);

  // Auto-join logic - only runs when conditions are met and never loops
  useEffect(() => {
    if (!enabled || !roomData || !userId || !isConnected) {
      return;
    }

    const roomId = roomData.id;
    const attemptKey = `${roomId}-${userId}`;

    // Skip if we've already attempted to join this room with this user
    if (joinAttemptRef.current.has(attemptKey)) {
      return;
    }

    // Skip if already joined via WebSocket
    if (joinedRooms.has(roomId)) {
      return;
    }

    // Check if user is a legitimate room member
    const isHost = roomData.host.id === userId;
    const isPlayer = roomData.players?.some(p => p.player.id === userId);
    const isRoomMember = isHost || isPlayer;

    if (!isRoomMember) {
      return;
    }

    // Mark this attempt to prevent loops
    joinAttemptRef.current.add(attemptKey);

  // Auto-joining room (debug logs removed)

    // Attempt to join (include password if we have it temporarily stored)
    const storedKey = `room:${roomId}:password`;
    const pw = typeof window !== 'undefined' ? sessionStorage.getItem(storedKey) || undefined : undefined;

    // If the current user is the host, try REST join first so the server records the host as joined
    // This can help if the socket join handler validates differently.
    const tryRestJoinForHost = async () => {
      try {
        if (isHost) {
          // If the host is already present in the roomData.players with an active status,
          // skip the REST join and proceed to socket join to avoid duplicate adds.
          const hostAlreadyJoined = roomData.players?.some((p: unknown) => {
            const rec = p as Record<string, unknown>;
            const statusRaw = rec?.status as string | undefined;
            const status = statusRaw ? statusRaw.toUpperCase() : '';
            const playerObj = rec?.player as Record<string, unknown> | undefined;
            const pid = (playerObj && typeof playerObj['id'] === 'number') ? (playerObj['id'] as number) : (typeof rec['id'] === 'number' ? (rec['id'] as number) : null);
            return pid === userId && (status === 'JOINED' || status === 'READY');
          });

          if (hostAlreadyJoined) {
            console.debug(`[useRoomSocket] Host ${userId} already present in room ${roomId}, skipping REST join.`);
            // Still attempt socket join to attach the socket
            await joinRoom(roomId, userId);
            return true;
          }

          console.debug(`[useRoomSocket] Attempting REST join for host ${userId} to room ${roomId}`);
          await apiService.joinRoomLobby(roomId, userId, pw);
          console.debug(`[useRoomSocket] REST join succeeded for host ${userId} to room ${roomId}`);
          // After REST join, attempt socket join without password
          await joinRoom(roomId, userId);
          return true;
        }
      } catch (err) {
        console.warn(`[useRoomSocket] REST join for host ${userId} failed for room ${roomId}:`, err instanceof Error ? err.message : err);
        // fall through to socket join attempt below
      }
      return false;
    };

    (async () => {
      try {
        let handled = false;
        if (isHost) {
          handled = await tryRestJoinForHost();
        }

        if (!handled) {
          // fallback: socket join (include password if available)
          await joinRoom(roomId, userId, pw);
        }
      } catch (error: unknown) {
        let msg = String(error);
        if (error && typeof error === 'object') {
          const rec = error as Record<string, unknown>;
          if (typeof rec['message'] === 'string') msg = String(rec['message']);
        }
        console.warn(`[useRoomSocket] Auto-join failed for room ${roomId}:`, msg);
        // Reset attempt on failure so it can be retried later if needed
        joinAttemptRef.current.delete(attemptKey);
      }
    })();

  }, [enabled, roomData?.id, userId, isConnected, joinedRooms, joinRoom, roomData]);

  // Reset join attempts when room changes
  useEffect(() => {
    if (roomData?.id) {
      resetConnectionAttempts(roomData.id);
      // Clear attempt ref for this room
      const roomPrefix = `${roomData.id}-`;
      joinAttemptRef.current.forEach((key) => {
        if (key.startsWith(roomPrefix)) {
          joinAttemptRef.current.delete(key);
        }
      });
    }
  }, [roomData?.id, resetConnectionAttempts]);

  // Cleanup on unmount
  useEffect(() => {
    const currentAttempts = joinAttemptRef.current;
    return () => {
      currentAttempts.clear();
    };
  }, []);

  return {
    // Connection state
    socket,
    isConnected,
    
    // Room data
    roomInfo,
    combatResult,
    
    // Status
    isJoined: roomData ? joinedRooms.has(roomData.id) : false,
    error,
    
    // Actions
    joinRoom,
    leaveRoom,
    toggleReady,
    startCombat,
    updateDungeon,
    kickPlayer,
    clearError,
    
    // Utilities
    resetJoinAttempts: (roomId: number) => {
      resetConnectionAttempts(roomId);
      const roomPrefix = `${roomId}-`;
      joinAttemptRef.current.forEach((key) => {
        if (key.startsWith(roomPrefix)) {
          joinAttemptRef.current.delete(key);
        }
      });
    }
  };
}
