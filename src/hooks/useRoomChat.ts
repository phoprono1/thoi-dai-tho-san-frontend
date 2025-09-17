import { useEffect, useState, useCallback } from 'react';
import { useRoomSocketStore } from '@/stores/useRoomSocketStore';

export type RoomChatMessage = { roomId?: number; username?: string; text: string; ts: number; senderSocketId?: string; cid?: string };

export default function useRoomChat(roomId?: number | string) {
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  // Minimal runtime socket type to avoid `any` in selector
  type SocketLike = { on?: (e: string, cb: (p: unknown) => void) => void; off?: (e: string, cb: (p: unknown) => void) => void; emit?: (e: string, p?: unknown) => void };
  // subscribe to the socket from the room socket store (Zustand)
  const socket = useRoomSocketStore((s: unknown) => (s as { socket?: SocketLike }).socket);
  const joinedRooms = useRoomSocketStore((s: unknown) => (s as { joinedRooms?: Set<number> }).joinedRooms);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: unknown) => {
      try {
        const p = payload as Record<string, unknown> | undefined;
        // Debug: log incoming payloads for diagnostics
  try { console.log('[useRoomChat] incoming payload', p); } catch {}
        if (!p) return;
        const rid = p.roomId !== undefined ? Number(p.roomId) : undefined;
        if (roomId !== undefined && rid !== undefined && Number(roomId) !== rid) return;
        const username = typeof p.username === 'string' ? p.username : 'Anon';
        const text = typeof p.text === 'string' ? p.text : String(p?.text ?? '');
        const senderSocketId = typeof p.senderSocketId === 'string' ? p.senderSocketId : undefined;
        const incomingCid = typeof p.cid === 'string' ? p.cid : undefined;
        const incomingTs = typeof p.ts === 'number' ? p.ts : Date.now();

        setMessages((m) => {
          // If this message includes a cid and we already have an optimistic
          // message with the same cid, replace that message instead of appending
          if (incomingCid) {
            const idx = m.findIndex((it) => it.cid === incomingCid);
            if (idx !== -1) {
              const copy = [...m];
              copy[idx] = { roomId: rid, username, text, ts: incomingTs, senderSocketId, cid: incomingCid };
              return copy;
            }
          }

          const next = [...m, { roomId: rid, username, text, ts: incomingTs, senderSocketId, cid: incomingCid }];
          // keep only the last 50 messages
          if (next.length > 50) return next.slice(next.length - 50);
          return next;
        });
      } catch {
        // swallow
      }
    };

    if (typeof socket.on === 'function') socket.on('roomChat', handler);
    return () => {
      try {
        if (typeof socket.off === 'function') socket.off('roomChat', handler);
      } catch {}
    };
  }, [socket, roomId]);

  const sendMessage = useCallback((text: string, username?: string) => {
    // Generate a client-side id (cid) so server echo can be matched to optimistic message
    const cid = `${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
    const payload = { roomId: roomId ? Number(roomId) : undefined, username: username || 'Anon', text, cid };
    try {
      // Debug: show what we're emitting and socket state
        try {
        const s = socket as unknown as { connected?: boolean; id?: string } | null;
        const sockState = s ? (typeof s.connected !== 'undefined' ? (s.connected ? 'connected' : 'disconnected') : 'unknown') : 'no-socket';
        console.log('[useRoomChat] emit roomChat ->', payload, 'socketState=', sockState, 'socketId=', s?.id, 'joinedRooms=', Array.from(joinedRooms || []));
      } catch {}
      if (socket && typeof socket.emit === 'function') {
        // Attach an optional ack to log server response if the server sends one.
        // The Socket type sometimes doesn't allow a typed callback; cast to any for the ack.
        try {
          // Cast via unknown to avoid eslint "any" usage
          (socket as unknown as { emit: (...args: unknown[]) => void }).emit('roomChat', payload, (ack?: unknown) => {
            try { console.log('[useRoomChat] roomChat ack:', ack); } catch {}
          });
        } catch {
          // fallback to no-ack emit
          socket.emit('roomChat', payload);
        }
      }
    } catch {}
    // optimistic append (include cid so we can dedupe when server echoes back)
    setMessages((m) => {
      // Only optimistically append if page is visible to avoid filling stores in background
      const now = Date.now();
      const shouldAppend = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      const next = shouldAppend ? [...m, { roomId: payload.roomId, username: payload.username, text: payload.text, ts: now, cid }] : m;
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  }, [socket, roomId, joinedRooms]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, clearMessages, setMessages } as const;
}
