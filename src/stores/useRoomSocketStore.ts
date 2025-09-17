import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

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
  // Prepare-to-start UI state provided by server when host initiates prepare
  prepareInfo: RoomInfo | null;
  // Prevent starting another combat until UI/server acknowledges reset
  preventStart: boolean;
  setPreventStart: (val: boolean) => void;
  
  // Connection state
  joinedRooms: Set<number>; // Track which rooms we've joined
  connectionAttempts: Map<string, number>; // Track join attempts to prevent loops
  
  // Error handling
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: number, userId: number, password?: string) => Promise<void>;
  leaveRoom: (roomId: number, userId: number) => Promise<void>;
  toggleReady: (roomId: number, userId: number) => Promise<void>;
  startCombat: (roomId: number, userId: number) => Promise<void>;
  prepareStart: (roomId: number, userId: number) => Promise<void>;
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
  prepareInfo: null,
  preventStart: false,
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
      // Connecting to WebSocket
      try {
        console.log('[RoomSocket] connect() called, existingSocketConnected=', Boolean(existingSocket?.connected));
      } catch {}
      
      // Get auth token for WebSocket authentication
      const token = localStorage.getItem('token');
      
      const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
      const base = rawBase.replace(/\/api\/?$/, '');
      try { console.log('[RoomSocket] connecting to', base, 'with tokenPresent=', token ? true : false); } catch {}

      const socket = io(`${base}/rooms`, {
        transports: ['websocket'],
        autoConnect: true,
        auth: {
          token: token
        }
      });

      // Connection events
      socket.on('connect', () => {
        set({ socket, isConnected: true, error: null });
      });

      socket.on('disconnect', () => {
        set({ 
          isConnected: false, 
          joinedRooms: new Set(), // Clear joined rooms on disconnect
          connectionAttempts: new Map(),
          combatResult: null, // clear any cached combat result on disconnect
        });
      });

      // Connection error handling
      socket.on('connect_error', (err) => {
        console.error('[RoomSocket] Connection error:', err);
        set({ error: 'Failed to connect to room server', isConnected: false });
      });

      // Room events
      socket.on('roomUpdated', (data: RoomInfo) => {
        // Update the main roomInfo
        set({ roomInfo: data });
        try {
          // If we currently have a prepareInfo for the same room, keep it in sync
          const currentPrepare = get().prepareInfo;
          if (currentPrepare && currentPrepare.id === data.id) {
            set({ prepareInfo: data });
          }
        } catch {
          // ignore errors reading store during socket callback
        }
      });

      socket.on('prepareToStart', (data: RoomInfo) => {
        set({ prepareInfo: data });
      });

      socket.on('combatEnqueued', () => {
        set({ prepareInfo: null });
      });

      socket.on('combatResult', (data: { roomId: number; result: unknown } | CombatResult) => {
        console.log('[RoomSocket] Received combatResult:', data);
        // Extract the actual combat result from the wrapper
        let combatResult: CombatResult | null = null;
        
        if ('result' in data && typeof data.result === 'object' && data.result !== null) {
          combatResult = data.result as CombatResult;
        } else if ('id' in data && 'duration' in data) {
          combatResult = data as CombatResult;
        }
        
        if (combatResult) {
          set({ combatResult: combatResult });
        }
      });

      socket.on('combatStarted', (data: CombatResult) => {
        set({ combatResult: data });
      });

      socket.on('roomClosed', () => {
        set({ 
          roomInfo: null,
          joinedRooms: new Set(),
          connectionAttempts: new Map()
        });
      });

      socket.on('playerKicked', () => {
        // The event will be handled in the room component
        set({ 
          roomInfo: null,
          joinedRooms: new Set(),
          connectionAttempts: new Map()
        });
      });

      set({ socket });
    },

    setPreventStart: (val: boolean) => {
      set({ preventStart: val });
    },

    prepareStart: async (roomId: number, userId: number) => {
      const { socket } = get();
      if (!socket) throw new Error('Socket not connected');
      return new Promise<void>((resolve, reject) => {
        socket.emit('prepareStart', { roomId, userId }, (resp: unknown) => {
          const r = resp as { success?: boolean; error?: string } | undefined;
          if (r?.success) {
            resolve();
          } else {
            const err = r?.error || 'Unknown error';
            try { toast.error(err); } catch {}
            reject(new Error(err));
          }
        });
      });
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

    joinRoom: async (roomId: number, userId: number, password?: string) => {
      const { socket, joinedRooms, connectionAttempts } = get();
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      // Check if already joined
      if (joinedRooms.has(roomId)) {
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

  // Joining room (debug logs removed)

      return new Promise<void>((resolve, reject) => {
        const pwToSend = typeof password === 'string' ? password.trim() : password;
        try {
          const masked = pwToSend ? '<PROVIDED>' : '<NONE>';
          // Also log the masked length for diagnostics (no raw password ever logged)
          const len = typeof pwToSend === 'string' ? pwToSend.length : 0;
          console.debug(`[RoomSocket] Emitting joinRoom for room ${roomId}, user ${userId}, password=${masked}, length=${len}`);
        } catch {
          // ignore logging errors
        }

        socket.emit('joinRoom', { roomId, userId, password: pwToSend }, (response: SocketResponse) => {
          if (response?.success) {
            // Successfully joined room — clear any previous combat result so we don't replay old logs
            set({ 
              roomInfo: response.roomInfo || null,
              joinedRooms: new Set(joinedRooms.add(roomId)),
              error: null,
              combatResult: null,
            });
            try { sessionStorage.removeItem(`room:${roomId}:password`); } catch { }
            resolve();
          } else {
            const errorMsg = response?.error || 'Unknown error';
            console.error(`[RoomSocket] Failed to join room ${roomId}:`, errorMsg);
            set({ error: errorMsg });
            // Show toast for server-provided errors
            try { toast.error(errorMsg); } catch {}
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
              error: null,
              combatResult: null, // clear combat result when leaving
            });
            resolve();
          } else {
            const errorMsg = response.error || 'Unknown error';
            set({ error: errorMsg });
            try { toast.error(errorMsg); } catch {}
            reject(new Error(errorMsg));
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
            const room = response.roomInfo || null;
            // Update roomInfo
            set({ roomInfo: room, error: null });
            try {
              // If prepare modal is active for this room, also update prepareInfo so UI reflects ready changes
              const currentPrepare = get().prepareInfo;
              if (currentPrepare && room && currentPrepare.id === room.id) {
                set({ prepareInfo: room });
              }
            } catch {
              // ignore store read/set errors
            }
            resolve();
          } else {
            const errorMsg = response.error || 'Unknown error';
            set({ error: errorMsg });
            try { toast.error(errorMsg); } catch {}
            reject(new Error(errorMsg));
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
            try { toast.error(errorMessage); } catch {}
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
            try { toast.error(errorMessage); } catch {}
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
            try { toast.error(errorMessage); } catch {}
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
