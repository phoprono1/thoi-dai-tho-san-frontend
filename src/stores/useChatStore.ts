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
  userTitle?: {
    name: string;
    prefix?: string;
    displayEffects?: {
      color?: string;
      backgroundColor?: string;
      borderColor?: string;
      glow?: boolean;
      animation?: string;
    };
  };
}

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  // true while a connection attempt is in progress to prevent races
  connecting: boolean;
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
  // true while a connection attempt is in progress to prevent races
  connecting: false,
  worldMessages: [],
  guildMessages: {},
  // messages stays in sync with worldMessages for backward compatibility
  messages: [],
  error: null,

  connect: () => {
    const { socket: existingSocket, connecting } = get();
    // If a connection attempt is already in progress, or an existing socket is connected, do nothing.
    if (connecting) return;
    if (existingSocket) {
      try {
        if (existingSocket.connected) return;
      } catch {
        return;
      }
    }

  // mark that we are attempting to connect so concurrent callers don't race
  set({ connecting: true });

    // Check if user is logged in before connecting
    const token = localStorage.getItem('token');
    if (!token) {
      // No token: reset connecting flag and silently return. In prod we
      // don't want to spam the UI with 'Please login' messages every time
      // some component tries to connect (this was observed on the VPS).
      set({ connecting: false });
      // keep the explicit UI error minimal; only set when in dev to help debugging
      if (process.env.NODE_ENV === 'development') {
        set({ error: 'Please login to use chat' });
      }
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
      set({ isConnected: true, socket: newSocket, error: null, connecting: false });

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
      set({ isConnected: false, connecting: false });
    });

    newSocket.on('connect_error', (err) => {
      console.error('[ChatSocket] Connection Error:', err);
      set({ error: 'Failed to connect to chat server.', connecting: false });
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
        // If this is a guild-specific history (has guildId) it's expected; only warn
        // when the payload is malformed (no guildId and messages missing/not-array).
        if (typeof maybe.guildId === 'number') {
          if (!Array.isArray(maybe.messages)) {
            console.debug('[ChatSocket] chatHistory guild payload missing messages array, falling back to empty', history);
          }
          const guildId = maybe.guildId;
          set((state) => ({
            guildMessages: {
              ...state.guildMessages,
              [guildId]: Array.isArray(arr) ? arr.slice(-50) : [],
            },
          }));
        } else {
          if (!Array.isArray(maybe.messages)) {
            console.warn('[ChatSocket] chatHistory received non-array payload without guildId, storing into world messages or falling back to empty', history);
          }
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
        // Deduplicate: server message may correspond to an optimistic message
        // already inserted by the client. Match by userId + exact text +
        // timestamp proximity to replace optimistic entry with authoritative one.
        set((state) => {
          const prev = state.guildMessages[gid] ?? [];

          // find a likely optimistic match (same user, same text, timestamp within 3s)
          const serverTs = new Date(message.createdAt).getTime();
          const matchIdx = prev.findIndex((m) => {
            try {
              if (m.userId !== message.userId) return false;
              if ((m.message || '') !== (message.message || '')) return false;
              const mTs = new Date(m.createdAt).getTime();
              return Math.abs(mTs - serverTs) <= 3000;
            } catch {
              return false;
            }
          });

          let next: ChatMessage[];
          if (matchIdx >= 0) {
            // Replace the optimistic message with the server-authored message
            const before = prev.slice(0, matchIdx);
            const after = prev.slice(matchIdx + 1);
            next = [...before, message, ...after].slice(-50);
          } else {
            next = [...prev, message].slice(-50);
          }

          return { guildMessages: { ...state.guildMessages, [gid]: next } };
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
      // Improve error logging so empty objects or Error instances are handled
      try {
        if (error instanceof Error) {
          // If server sends Error instance, surface it in dev but be quieter in prod
          if (process.env.NODE_ENV === 'development') {
            console.error('[ChatSocket] Server error (Error):', error.message, error);
            set({ error: error.message, connecting: false });
          } else {
            // in production, avoid showing internal error objects to users
            set({ connecting: false });
          }
          return;
        }
        // If it's an object with message property
        if (typeof error === 'object' && error !== null) {
          const maybe = error as Record<string, unknown>;
          // Ignore expected auth-related messages quietly in production
          if (typeof maybe.message === 'string' && (maybe.message === 'Not authenticated' || maybe.message === 'Not authenticated or joined.' || maybe.message === 'User not authenticated')) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('[ChatSocket] Ignored auth-related server error:', maybe.message);
            }
            set({ connecting: false });
            return;
          }

          if (typeof maybe.message === 'string' && maybe.message.length > 0) {
            console.error('[ChatSocket] Server error (payload):', maybe);
            set({ error: maybe.message, connecting: false });
            return;
          }

          // If payload is an empty object ({}), avoid noisy console.error — treat as unknown server error
          try {
            const keys = Object.keys(maybe);
            if (keys.length === 0) {
              // do not log empty object payloads to avoid spamming the console in dev
              set({ error: 'Unknown server error', connecting: false });
              return;
            }
          } catch {
            // ignore errors inspecting keys
          }

          // fallback: stringify the payload for debugging (if non-empty)
          try {
            const s = JSON.stringify(maybe);
            console.error('[ChatSocket] Server error (object):', s);
            set({ error: s, connecting: false });
            return;
          } catch {
            // fallthrough
          }
        }
        if (typeof error === 'string') {
          console.error('[ChatSocket] Server error (string):', error);
          set({ error, connecting: false });
          return;
        }
      } catch (e) {
        console.error('[ChatSocket] Error while handling server error event', e);
      }
      console.error('[ChatSocket] Server error: unknown payload', error);
      set({ error: 'Unknown server error', connecting: false });
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
