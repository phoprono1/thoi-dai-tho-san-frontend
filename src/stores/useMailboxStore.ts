import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface MailboxStore {
  socket: Socket | null;
  unreadCount: number;
  latestMail: unknown | null;
  connect: () => void;
  disconnect: () => void;
  setUnread: (n: number) => void;
}

export const useMailboxStore = create<MailboxStore>((set, get) => ({
  socket: null,
  unreadCount: 0,
  latestMail: null,

  connect: () => {
    if (typeof window === 'undefined') return;
    const existing = get().socket;
    if (existing?.connected) return;

    if (existing) {
      try { existing.disconnect(); } catch {}
    }

    const token = localStorage.getItem('token');
    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    const base = rawBase.replace(/\/api\/?$/, '');
    const s = io(`${base}/mailbox`, { transports: ['websocket'], auth: { token } });

    s.on('connect', () => {
      // no-op
    });

    s.on('mailReceived', (data: unknown) => {
      try { toast('New mail received'); } catch {}
      set({ latestMail: data });
      // fallback: fetch unread-count to keep store in sync in case server didn't emit count
      (async () => {
        try {
          const resp = await fetch(`${rawBase}/api/mailbox/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const j = await resp.json();
            set({ unreadCount: j.unreadCount ?? 0 });
          }
        } catch {
          // ignore
        }
      })();
    });

    s.on('mailUnreadCount', (d: { count: number }) => {
      set({ unreadCount: d.count });
    });

    s.on('connect_error', (err) => {
      console.error('[Mailbox] connect_error', err);
    });

    set({ socket: s });
  },

  disconnect: () => {
    const s = get().socket;
    if (s) {
      try { s.disconnect(); } catch {}
    }
    set({ socket: null, unreadCount: 0, latestMail: null });
  },

  setUnread: (n: number) => set({ unreadCount: n }),
}));

// Auto-connect on client
if (typeof window !== 'undefined') {
  try { useMailboxStore.getState().connect(); } catch {}
  window.addEventListener('beforeunload', () => {
    try { useMailboxStore.getState().disconnect(); } catch {}
  });
}
