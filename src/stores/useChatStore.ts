import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import type { QueryClient } from '@tanstack/react-query';

export interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  type: string;
  createdAt: string;
}

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  // worldMessages holds the global/world chat stream
  worldMessages: ChatMessage[];
  // guildMessages keyed by guildId to avoid guild history overwriting world messages
  guildMessages: Record<number, ChatMessage[]>;
  // backward-compatible alias for components that read `messages`
  messages: ChatMessage[];
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  checkAuthAndConnect: () => void;
  // optional react-query client to allow socket handlers to trigger invalidations
  queryClient?: QueryClient | null;
  setQueryClient?: (qc: QueryClient) => void;
}

const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  worldMessages: [],
  guildMessages: {},
  // messages stays in sync with worldMessages for backward compatibility
  messages: [],
  error: null,

  connect: () => {
    const { socket: existingSocket } = get();
    if (existingSocket?.connected) return;

    // Check if user is logged in before connecting
    const token = localStorage.getItem('token');
    if (!token) {
      set({ error: 'Please login to use chat' });
      return;
    }

    // Connecting to chat: ensure NEXT_PUBLIC_API_URL doesn't include a trailing /api
    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    const base = rawBase.replace(/\/api\/?$/, '');
    const newSocket = io(`${base}/chat`, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      set({ isConnected: true, socket: newSocket, error: null });

      // Join world chat after connecting
      try {
        const decoded: { sub: number; username: string } = jwtDecode(token);
        newSocket.emit('joinWorld', { 
          userId: decoded.sub, 
          token: token 
        });
      } catch {
        set({ error: 'Invalid authentication token' });
        newSocket.disconnect();
      }
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (err) => {
      console.error('[ChatSocket] Connection Error:', err);
      set({ error: 'Failed to connect to chat server.' });
    });

    newSocket.on('worldMessage', (message: ChatMessage) => {
      set((state) => {
        const newWorld = [...state.worldMessages, message].slice(-50);
        return {
          worldMessages: newWorld,
          // keep alias in sync
          messages: newWorld,
        };
      });
    });
    
    newSocket.on('chatHistory', (history: ChatMessage[] | { guildId?: number; messages?: ChatMessage[] }) => {
      // chatHistory can be either an array (world) or an object { guildId, messages }
      if (!Array.isArray(history)) {
        const maybe = history as { guildId?: number; messages?: unknown };
        const arr = Array.isArray(maybe?.messages) ? (maybe.messages as ChatMessage[]) : [];
        console.warn('[ChatSocket] chatHistory received non-array payload, storing into guildMessages or falling back to empty', history);
        if (typeof maybe.guildId === 'number') {
          const guildId = maybe.guildId;
          set((state) => ({
            guildMessages: {
              ...state.guildMessages,
              [guildId]: Array.isArray(arr) ? arr.slice(-50) : [],
            },
          }));
        } else {
          const world = Array.isArray(arr) ? arr.slice(-50) : [];
          set({ worldMessages: world, messages: world });
        }
        return;
      }

      // plain array -> world chat history
      const world = history.slice(-50);
      set({ worldMessages: world, messages: world });
    });

    // Guild message listener
    newSocket.on('guildMessage', (message: ChatMessage & { guildId?: number }) => {
      // Append guild message to the specific guild bucket
      const gid = (message.guildId as number) || undefined;
      if (typeof gid === 'number') {
        set((state) => {
          const prev = state.guildMessages[gid] ?? [];
          const next = [...prev, message].slice(-50);
          return {
            guildMessages: { ...state.guildMessages, [gid]: next },
          };
        });
      } else {
        // fallback: if no guildId, put into world messages to avoid data loss
        set((state) => {
          const newWorld = [...state.worldMessages, message].slice(-50);
          return { worldMessages: newWorld, messages: newWorld };
        });
      }
    });

    // Guild leader changed: update any UI listening to chat store errors/info
    newSocket.on('guildLeaderChanged', (payload: { guildId: number; oldLeaderId: number | null; newLeaderId: number | null; timestamp: string }) => {
      const gid = payload.guildId;
      const systemMsg: ChatMessage = {
        id: Date.now(),
        userId: 0,
        username: 'System',
        message: payload.newLeaderId ? `Guild leader changed to user ${payload.newLeaderId}` : `Guild has no leader now`,
        type: 'guild',
        createdAt: payload.timestamp || new Date().toISOString(),
      };
      set((state) => ({ guildMessages: { ...state.guildMessages, [gid]: [...(state.guildMessages[gid] ?? []), systemMsg].slice(-50) } }));
    });

    // New guild events -> produce small system messages
    newSocket.on('guildJoinRequest', (payload: { guildId: number; userId: number; username?: string; joinedAt?: string }) => {
      const gid = payload.guildId;
      const systemMsg: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: 0,
        username: 'System',
        message: payload.username
          ? `${payload.username} requested to join the guild`
          : `A user requested to join the guild`,
        type: 'guild',
        createdAt: payload.joinedAt || new Date().toISOString(),
      };
      set((state) => ({ guildMessages: { ...state.guildMessages, [gid]: [...(state.guildMessages[gid] ?? []), systemMsg].slice(-50) } }));
    });

    newSocket.on('guildJoinRequestRejected', (payload: { guildId: number; userId: number; timestamp?: string }) => {
      const gid = payload.guildId;
      const systemMsg: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: 0,
        username: 'System',
        message: `A join request was rejected`,
        type: 'guild',
        createdAt: payload.timestamp || new Date().toISOString(),
      };
      set((state) => ({ guildMessages: { ...state.guildMessages, [gid]: [...(state.guildMessages[gid] ?? []), systemMsg].slice(-50) } }));
    });

    newSocket.on('guildMemberApproved', (payload: { guildId: number; userId: number; approvedBy?: number; timestamp?: string }) => {
      const gid = payload.guildId;
      const systemMsg: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: 0,
        username: 'System',
        message: `A join request was approved`,
        type: 'guild',
        createdAt: payload.timestamp || new Date().toISOString(),
      };
      set((state) => ({ guildMessages: { ...state.guildMessages, [gid]: [...(state.guildMessages[gid] ?? []), systemMsg].slice(-50) } }));
      // if react-query client is attached and the approved user is the current user, invalidate userGuild so UI updates without F5
      try {
        const token = localStorage.getItem('token');
        if (token && (get().queryClient)) {
          try {
            const decoded: { sub: number } = jwtDecode(token);
            if (decoded?.sub === payload.userId) {
              get().queryClient?.invalidateQueries?.({ queryKey: ['userGuild'] });
              // also refresh the guild detail
              get().queryClient?.invalidateQueries?.({ queryKey: ['guild', payload.guildId] });
            }
          } catch {
            // ignore decode errors
          }
        }
      } catch {
        // ignore errors in optional invalidation path
      }
    });

    newSocket.on('guildMemberKicked', (payload: { guildId: number; userId: number; kickedBy?: number; timestamp?: string }) => {
      const gid = payload.guildId;
      const systemMsg: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: 0,
        username: 'System',
        message: `A member was kicked from the guild`,
        type: 'guild',
        createdAt: payload.timestamp || new Date().toISOString(),
      };
      set((state) => ({ guildMessages: { ...state.guildMessages, [gid]: [...(state.guildMessages[gid] ?? []), systemMsg].slice(-50) } }));
    });

    newSocket.on('guildContributed', (payload: { guildId: number; userId: number; amount: number; timestamp?: string }) => {
      const gid = payload.guildId;
      const systemMsg: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: 0,
        username: 'System',
        message: `A member contributed ${payload.amount} gold to the guild fund`,
        type: 'guild',
        createdAt: payload.timestamp || new Date().toISOString(),
      };
      set((state) => ({ guildMessages: { ...state.guildMessages, [gid]: [...(state.guildMessages[gid] ?? []), systemMsg].slice(-50) } }));
    });

    newSocket.on('error', (error: unknown) => {
      console.error('[ChatSocket] Server error:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : typeof error === 'string' 
        ? error 
        : 'Unknown server error';
      set({ error: errorMessage });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, worldMessages: [], messages: [], guildMessages: {} });
    }
  },

  // send a message to a guild chat
  sendGuildMessage: (guildId: number, text: string) => {
    const { socket, isConnected } = get();
    const token = localStorage.getItem('token');
    if (!token) {
      set({ error: 'Please login to send messages' });
      return;
    }
    if (!socket || !isConnected) {
      get().checkAuthAndConnect();
      set({ error: 'Connecting to chat server...' });
      return;
    }
    try {
      // optimistic append so sender sees their message immediately
      try {
        const decoded = jwtDecode(token) as unknown as { sub?: number; username?: string };
        const optimistic: ChatMessage = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          userId: decoded?.sub ?? 0,
          username: decoded?.username ?? 'You',
          message: text,
          type: 'guild',
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const prev = state.guildMessages[guildId] ?? [];
          const next = [...prev, optimistic].slice(-50);
          return { guildMessages: { ...state.guildMessages, [guildId]: next } };
        });
      } catch {
        // ignore optimistic append errors
      }
      const dto = { message: text, type: 'guild', guildId };
      socket.emit('sendGuildMessage', dto);
    } catch (e) {
      console.error('Failed to send guild message:', e);
      set({ error: 'Failed to send message' });
    }
  },

  sendMessage: (text: string) => {
    const { socket, isConnected } = get();
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ error: 'Please login to send messages' });
      return;
    }

    if (!socket || !isConnected) {
      get().checkAuthAndConnect();
      set({ error: 'Connecting to chat server...' });
      return;
    }

    try {
      const messageDto = {
        message: text,
        type: 'world'
      };
      socket.emit('sendWorldMessage', messageDto);
    } catch (e) {
      console.error('Failed to send message:', e);
      set({ error: 'Failed to send message' });
    }
  },

  checkAuthAndConnect: () => {
    const token = localStorage.getItem('token');
    if (token) {
      const { isConnected } = get();
      if (!isConnected) {
        get().connect();
      }
    } else {
      set({ error: 'Please login to use chat' });
    }
  },
  setQueryClient: (qc: QueryClient) => {
    set({ queryClient: qc });
  },
}));

export { useChatStore };
