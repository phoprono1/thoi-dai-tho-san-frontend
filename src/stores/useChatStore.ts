import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

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
  messages: ChatMessage[];
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  checkAuthAndConnect: () => void;
}

const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
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
        const newMessages = [...state.messages, message];
        // Keep only last 50 messages in memory (display shows only 20)
        return { 
          messages: newMessages.slice(-50) 
        };
      });
    });
    
  newSocket.on('chatHistory', (history: ChatMessage[]) => {
    // Limit chat history to 50 messages
    set({ messages: history.slice(-50) });
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
      set({ socket: null, isConnected: false, messages: [] });
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
}));

export { useChatStore };
