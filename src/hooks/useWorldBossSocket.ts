import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/providers/AuthProvider';

interface WorldBossSocketEvents {
  bossUpdate: (data: any) => void;
  rankingUpdate: (data: { bossId: number; rankings: any }) => void;
  bossDefeated: (data: { bossId: number; nextRespawnTime: string; rewards: any }) => void;
  newBossSpawn: (data: any) => void;
  attackResult: (data: any) => void;
  error: (data: { message: string }) => void;
}

export function useWorldBossSocket(events: Partial<WorldBossSocketEvents>) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create socket connection
    const socket = io('http://localhost:3005/world-boss', {
      query: {
        userId: user.id.toString(),
      },
      transports: ['websocket'],
      forceNew: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔗 Connected to World Boss WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from World Boss WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ World Boss WebSocket connection error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]); // Only depend on user.id

  // Separate effect for event handlers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Register event listeners
    Object.entries(events).forEach(([event, handler]) => {
      if (handler) {
        socket.on(event, handler);
      }
    });

    return () => {
      // Clean up event listeners
      Object.entries(events).forEach(([event, handler]) => {
        if (handler) {
          socket.off(event, handler);
        }
      });
    };
  }, [events]);

  // Helper functions to emit events
  const emitAttackBoss = () => {
    if (socketRef.current) {
      socketRef.current.emit('attackBoss', {});
    }
  };

  const emitGetBossStatus = () => {
    if (socketRef.current) {
      socketRef.current.emit('getBossStatus');
    }
  };

  const emitGetBossRankings = (bossId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('getBossRankings', { bossId });
    }
  };

  return {
    socket: socketRef.current,
    emitAttackBoss,
    emitGetBossStatus,
    emitGetBossRankings,
  };
}
