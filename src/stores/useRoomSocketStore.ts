import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';

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

interface RoomInfo {
  id: number;
  name: string;
  dungeonId: number;
  dungeonName: string;
  maxPlayers: number;
  status: string;
  host: {
    id: number;
    username: string;
  };
  players: Array<{
    id: number;
    username: string;
    status: string;
    isReady: boolean;
    joinedAt: string;
  }>;
  createdAt: string;
}

interface SocketResponse {
  success: boolean;
  error?: string;
  roomInfo?: RoomInfo;
  combatResult?: CombatResult;
}

interface RoomSocketState {
  // Socket connection
  socket: Socket | null;
  isConnected: boolean;
  
  // Room data
  roomInfo: RoomInfo | null;
  combatResult: CombatResult | null;
  
  // Connection state
  joinedRooms: Set<number>; // Track which rooms we've joined
  connectionAttempts: Map<string, number>; // Track join attempts to prevent loops
  
  // Error handling
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: number, userId: number) => Promise<void>;
  leaveRoom: (roomId: number, userId: number) => Promise<void>;
  toggleReady: (roomId: number, userId: number) => Promise<void>;
  startCombat: (roomId: number, userId: number) => Promise<void>;
  updateDungeon: (roomId: number, hostId: number, dungeonId: number) => Promise<void>;
  kickPlayer: (roomId: number, hostId: number, playerId: number) => Promise<void>;
  clearError: () => void;
  resetConnectionAttempts: (roomId: number) => void;
}

export const useRoomSocketStore = create<RoomSocketState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    socket: null,
    isConnected: false,
    roomInfo: null,
    combatResult: null,
    joinedRooms: new Set(),
    connectionAttempts: new Map(),
    error: null,

    connect: () => {
      const { socket: existingSocket } = get();
      
      // Don't create multiple connections
      if (existingSocket?.connected) {
        return;
      }

      // Cleanup existing socket
      if (existingSocket) {
        existingSocket.disconnect();
      }

      console.log('[RoomSocket] Connecting to WebSocket...');
      
      const socket = io('http://localhost:3005/rooms', {
        transports: ['websocket'],
        autoConnect: true,
      });

      // Connection events
      socket.on('connect', () => {
        console.log('[RoomSocket] Connected:', socket.id);
        set({ socket, isConnected: true, error: null });
      });

      socket.on('disconnect', () => {
        console.log('[RoomSocket] Disconnected');
        set({ 
          isConnected: false, 
          joinedRooms: new Set(), // Clear joined rooms on disconnect
          connectionAttempts: new Map()
        });
      });

      socket.on('connect_error', (err) => {
        console.error('[RoomSocket] Connection error:', err);
        set({ error: 'Failed to connect to room server', isConnected: false });
      });

      // Room events
      socket.on('roomUpdated', (data: RoomInfo) => {
        console.log('[RoomSocket] Room updated:', data);
        set({ roomInfo: data });
      });

      socket.on('combatStarted', (data: CombatResult) => {
        console.log('[RoomSocket] Combat started received:', {
          hasData: !!data,
          hasTeamStats: !!data?.teamStats,
          teamMembersCount: data?.teamStats?.members?.length || 0,
        });
        set({ combatResult: data });
      });

      socket.on('roomClosed', () => {
        console.log('[RoomSocket] Room was closed');
        set({ 
          roomInfo: null,
          joinedRooms: new Set(),
          connectionAttempts: new Map()
        });
      });

      socket.on('playerKicked', (data: { kickedPlayerId: number; message: string }) => {
        console.log('[RoomSocket] Player kicked event received:', data);
        // The event will be handled in the room component
        set({ 
          roomInfo: null,
          joinedRooms: new Set(),
          connectionAttempts: new Map()
        });
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null, 
          isConnected: false, 
          roomInfo: null,
          joinedRooms: new Set(),
          connectionAttempts: new Map()
        });
      }
    },

    joinRoom: async (roomId: number, userId: number) => {
      const { socket, joinedRooms, connectionAttempts } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      // Check if already joined
      if (joinedRooms.has(roomId)) {
        console.log(`[RoomSocket] Already joined room ${roomId}, skipping`);
        return;
      }

      // Prevent rapid repeated attempts
      const attemptKey = `${roomId}-${userId}`;
      const attempts = connectionAttempts.get(attemptKey) || 0;
      const maxAttempts = 3;

      if (attempts >= maxAttempts) {
        console.warn(`[RoomSocket] Max join attempts reached for room ${roomId}, user ${userId}`);
        return;
      }

      // Increment attempt count
      set({ 
        connectionAttempts: new Map(connectionAttempts.set(attemptKey, attempts + 1))
      });

      console.log(`[RoomSocket] Joining room ${roomId} for user ${userId} (attempt ${attempts + 1})`);

      return new Promise<void>((resolve, reject) => {
        socket.emit('joinRoom', { roomId, userId }, (response: SocketResponse) => {
          if (response?.success) {
            console.log(`[RoomSocket] Successfully joined room ${roomId}`);
            set({ 
              roomInfo: response.roomInfo || null,
              joinedRooms: new Set(joinedRooms.add(roomId)),
              error: null
            });
            resolve();
          } else {
            const errorMsg = response?.error || 'Unknown error';
            console.error(`[RoomSocket] Failed to join room ${roomId}:`, errorMsg);
            set({ error: errorMsg });
            reject(new Error(errorMsg));
          }
        });
      });
    },

    leaveRoom: async (roomId: number, userId: number) => {
      const { socket, joinedRooms } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit('leaveRoom', { roomId, userId }, (response: SocketResponse) => {
          if (response.success) {
            const newJoinedRooms = new Set(joinedRooms);
            newJoinedRooms.delete(roomId);
            set({ 
              roomInfo: null,
              joinedRooms: newJoinedRooms,
              error: null
            });
            resolve();
          } else {
            set({ error: response.error || 'Unknown error' });
            reject(new Error(response.error || 'Unknown error'));
          }
        });
      });
    },

    toggleReady: async (roomId: number, userId: number) => {
      const { socket } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit('toggleReady', { roomId, userId }, (response: SocketResponse) => {
          if (response.success) {
            set({ roomInfo: response.roomInfo || null, error: null });
            resolve();
          } else {
            set({ error: response.error || 'Unknown error' });
            reject(new Error(response.error || 'Unknown error'));
          }
        });
      });
    },

    startCombat: async (roomId: number, userId: number) => {
      const { socket } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit('startCombat', { roomId, userId }, (response: SocketResponse) => {
          if (response?.success) {
            set({ combatResult: response.combatResult || null, error: null });
            resolve();
          } else {
            const errorMessage = response?.error || 'Unknown error occurred';
            set({ error: errorMessage });
            reject(new Error(errorMessage));
          }
        });
      });
    },

    updateDungeon: async (roomId: number, hostId: number, dungeonId: number) => {
      const { socket } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit('updateDungeon', { roomId, hostId, dungeonId }, (response: SocketResponse) => {
          if (response?.success) {
            set({ roomInfo: response.roomInfo || null, error: null });
            resolve();
          } else {
            const errorMessage = response?.error || 'Unknown error occurred';
            set({ error: errorMessage });
            reject(new Error(errorMessage));
          }
        });
      });
    },

    kickPlayer: async (roomId: number, hostId: number, playerId: number) => {
      const { socket } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit('kickPlayer', { roomId, hostId, playerId }, (response: SocketResponse) => {
          if (response?.success) {
            set({ roomInfo: response.roomInfo || null, error: null });
            resolve();
          } else {
            const errorMessage = response?.error || 'Unknown error occurred';
            set({ error: errorMessage });
            reject(new Error(errorMessage));
          }
        });
      });
    },

    clearError: () => {
      set({ error: null });
    },

    resetConnectionAttempts: (roomId: number) => {
      const { connectionAttempts } = get();
      const newAttempts = new Map(connectionAttempts);
      
      // Remove all attempts for this room
      for (const key of newAttempts.keys()) {
        if (key.startsWith(`${roomId}-`)) {
          newAttempts.delete(key);
        }
      }
      
      set({ connectionAttempts: newAttempts });
    }
  }))
);

// Auto-connect when store is created
useRoomSocketStore.getState().connect();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useRoomSocketStore.getState().disconnect();
  });
}
