 'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/useChatStore';

export default function GuildChatArea({ guildId }: { guildId: number }) {
  const messages = useChatStore((s) => s.guildMessages[guildId] ?? []);
  // access sendGuildMessage via getState to avoid subscribing to the function reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendGuildMessage = (...args: any[]) => (useChatStore as any).getState().sendGuildMessage?.(...args);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    try {
      const el = scrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }, [messages]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      await sendGuildMessage(guildId, t);
      setText('');
    } catch (err) {
      console.error('Guild send failed', err);
    }
  };

  return (
    <div>
      <div ref={scrollRef} className="space-y-3 mb-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">Chưa có tin nhắn nào</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm">
              <div className="font-medium text-gray-800">{m.username || (m.userId === 0 ? 'System' : `User ${m.userId}`)}</div>
              <div className="text-gray-700">{m.message}</div>
              <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
      <div className="flex space-x-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void onSend(); } }}
          type="text"
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Button size="sm" className="px-4" onClick={() => void onSend()}>Gửi</Button>
      </div>
    </div>
  );
}
