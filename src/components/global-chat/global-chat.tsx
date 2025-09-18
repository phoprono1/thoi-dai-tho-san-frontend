/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatMessage } from '@/stores/useChatStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useJoinGuild } from '@/hooks/use-api';

export function GlobalChat({ embedded = false }: { embedded?: boolean }) {
  // When embedded we always render the panel (desktop right column). Otherwise use the floating drawer trigger.
  const [isOpen, setIsOpen] = useState<boolean>(embedded);
  const [newMessage, setNewMessage] = useState('');
  const messages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const checkAuthAndConnect = useChatStore((state) => state.checkAuthAndConnect);
  const isConnected = useChatStore((state) => state.isConnected);
  const error = useChatStore((state) => state.error);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Limit messages to last 20 for performance
  // Limit messages to last 50 then dedupe by id/cid to avoid duplicate rendering
  const rawDisplay = messages.slice(-50);
  const seen = new Set<string>();
  const displayMessages = rawDisplay.filter((m) => {
    const rec = m as unknown as Record<string, any>;
    const cid = rec.cid ?? rec.clientCid ?? undefined;
    const key = String(rec.id ?? cid ?? `${rec.username ?? ''}-${rec.message ?? ''}-${rec.createdAt ?? ''}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(-20);

  useEffect(() => {
    // Try to connect when the drawer opens or when rendered embedded on desktop
    if ((isOpen || embedded) && !isConnected) {
      checkAuthAndConnect();
    }
  }, [isOpen, embedded, isConnected, checkAuthAndConnect]);

  // Separate effect for scrolling when drawer opens or when embedded
  useEffect(() => {
    if ((isOpen || embedded) && displayMessages.length > 0) {
      // Longer delay for drawer animation/opening
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 500);
    }
  }, [isOpen, embedded, displayMessages.length]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change (respect embedded/drawer)
    if ((isOpen || embedded) && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 50);
    }
  }, [displayMessages, isOpen, embedded]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
      // Force scroll to bottom after sending message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 50);
    }
  };

  // Invite confirm state (for guild invites sent via world chat)
  const [inviteConfirmOpen, setInviteConfirmOpen] = useState(false);
  const [inviteGuildId, setInviteGuildId] = useState<number | null>(null);
  const [inviteGuildName, setInviteGuildName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const joinGuild = useJoinGuild();

  const acceptInvite = async () => {
    if (!inviteGuildId) {
      setInviteConfirmOpen(false);
      return;
    }
    try {
      setInviteLoading(true);
      await joinGuild.mutateAsync(inviteGuildId);
      toast('Yêu cầu tham gia đã được gửi');
    } catch (err) {
      console.error('join guild failed', err);
      toast('Không thể gửi yêu cầu tham gia');
    } finally {
      setInviteLoading(false);
      setInviteConfirmOpen(false);
      setInviteGuildId(null);
      setInviteGuildName('');
    }
  };

  // Shared panel content (used both inline and in drawer)
  const PanelContent = (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      {embedded ? (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Chat Thế Giới</h3>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-normal text-gray-500">{isConnected ? 'Đã kết nối' : 'Chưa kết nối'}</span>
          </div>
        </div>
      ) : (
        // When used inside Drawer, provide DrawerHeader and DrawerTitle for accessibility
        <DrawerHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <DrawerTitle>Chat Thế Giới</DrawerTitle>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            <span className="text-sm font-normal text-gray-500">{isConnected ? 'Đã kết nối' : 'Chưa kết nối'}</span>
          </div>
        </DrawerHeader>
      )}
      <div className="flex-grow overflow-hidden p-4 pb-2">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4 pr-4 pb-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}
            {displayMessages.map((msg: ChatMessage, index: number) => {
              const rec = msg as unknown as Record<string, unknown>;
              const cid = (rec['cid'] ?? rec['clientCid']) as string | undefined;
              const computedKey = String(rec['id'] ?? cid ?? `i${index}-${String(rec['createdAt'] ?? '')}`);
              // Render room invite messages specially so players can join
              if (rec['message'] && String(rec['message']).startsWith('[ROOM_INVITE|')) {
                try {
                  const parts = String(rec['message']).split('|');
                    // Format: [ROOM_INVITE|<roomId>|<roomName>|<hostUsername>|<dungeonId?>]
                    const roomId = Number(parts[1]);
                    const roomName = parts[2] || 'Phòng';
                    const hostName = parts[3] || msg.username;
                    const dungeonIdPart = parts[4] || '';
                    const dungeonId = dungeonIdPart ? Number(dungeonIdPart) : undefined;
                    // If dungeonId is provided and numeric, route to full path
                    const joinTarget = dungeonId && !Number.isNaN(dungeonId)
                      ? `/game/explore/dungeons/${dungeonId}/rooms/${roomId}`
                      : `/room/${roomId}`;
                    return (
                      <div key={`invite-${computedKey}`} className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Lời mời tham gia phòng</div>
                            <div className="text-xs text-gray-600">{roomName} — Host: {hostName}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => router.push(joinTarget)} className="px-3 py-1 bg-green-500 text-white rounded">Tham gia</button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                        </div>
                      );
                    } catch {
                    // fall back to rendering raw message
                      return (
                        <div key={`invite-${computedKey}`} className="flex items-start gap-2">
                          <span className="font-bold text-blue-500">{msg.username}:</span>
                          <p className="flex-1 break-words">{msg.message}</p>
                          <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        </div>
                      );
                  }
                // end invite render
                // close try/catch above handled
                return null; // unreachable
              }

              // Render structured guildInvite events broadcast as worldMessage { type: 'guildInvite', guildId, guildName, inviterId, inviterUsername }
              if (rec['type'] === 'guildInvite') {
                try {
                  const guildId = Number(rec['guildId']);
                  if (Number.isNaN(guildId)) throw new Error('invalid guild id');
                  const guildName = String(rec['guildName'] ?? 'Công hội');
                  const inviter = String(rec['inviterUsername'] ?? rec['inviterId'] ?? 'Người chơi');

                  return (
                    <div key={`guild-invite-${computedKey}`} className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Lời mời tham gia công hội</div>
                          <div className="text-xs text-gray-600">{guildName} — Mời bởi: {inviter}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setInviteGuildId(guildId);
                              setInviteGuildName(guildName);
                              setInviteConfirmOpen(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded"
                          >
                            Tham gia
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">{new Date(String(rec['timestamp'] ?? msg.createdAt)).toLocaleTimeString()}</div>
                    </div>
                  );
                } catch {
                  return (
                    <div key={`guild-invite-${computedKey}`} className="flex items-start gap-2">
                      <span className="font-bold text-blue-500">{msg.username}:</span>
                      <p className="flex-1 break-words">{msg.message}</p>
                      <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                  );
                }
              }

              // Render guild invite messages: format [GUILD_INVITE|<guildId>|<guildName>|<inviterUsername>]
              if (rec['message'] && String(rec['message']).startsWith('[GUILD_INVITE|')) {
                try {
                  const parts = String(rec['message']).split('|');
                  const guildId = Number(parts[1]);
                  if (Number.isNaN(guildId)) throw new Error('invalid guild id');
                  const guildName = parts[2] || 'Công hội';
                  const inviter = parts[3] || (msg.username as string | undefined) || 'Người chơi';

                  return (
                    <div key={`guild-invite-${computedKey}`} className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Lời mời tham gia công hội</div>
                          <div className="text-xs text-gray-600">{guildName} — Mời bởi: {inviter}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setInviteGuildId(guildId);
                              setInviteGuildName(guildName);
                              setInviteConfirmOpen(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded"
                          >
                            Tham gia
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                    </div>
                  );
                } catch {
                  return (
                    <div key={`guild-invite-${computedKey}`} className="flex items-start gap-2">
                      <span className="font-bold text-blue-500">{msg.username}:</span>
                      <p className="flex-1 break-words">{msg.message}</p>
                      <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                  );
                }
              }

              // Normal message render
              return (
                <div key={computedKey} className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">{msg.username}:</span>
                  <p className="flex-1 break-words">{msg.message}</p>
                  <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
              );
            })}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 pt-1 border-t bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
            autoComplete="off"
            disabled={!isConnected}
            className="flex-1 bg-white/90 dark:bg-slate-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-slate-700 rounded-md"
          />
          <Button type="submit" disabled={!isConnected || !newMessage.trim()}>
            Gửi
          </Button>
        </form>
      </div>
    </div>
  );

  // If embedded, render the panel directly; otherwise render the floating drawer with trigger
  if (embedded) {
    return (
      <div className="h-full w-full">
        {PanelContent}
        <Dialog open={inviteConfirmOpen} onOpenChange={(v) => setInviteConfirmOpen(v)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận tham gia</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm text-gray-700">Bạn có muốn gửi yêu cầu tham gia công hội &quot;{inviteGuildName}&quot;?</div>
            <DialogFooter>
              <button onClick={() => setInviteConfirmOpen(false)} className="mr-2 px-3 py-1">Hủy</button>
              <button onClick={() => void acceptInvite()} className="px-3 py-1 bg-green-600 text-white rounded">{inviteLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Drawer used as a bottom-sheet on mobile when not embedded
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={
            // Mobile: bottom-left above bottom nav/FAB to avoid market FAB on right. Desktop (md+): center vertically on right side.
            "fixed left-4 bottom-24 z-50 h-12 w-12 rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-2 hover:bg-white md:right-4 md:left-auto md:top-1/2 md:-translate-y-1/2 md:bottom-auto"
          }
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      {/* as bottom sheet: on small screens use height 60% from bottom */}
      <DrawerContent className="w-full sm:w-full h-[60vh] sm:h-[60vh] md:h-[80vh]">
        {PanelContent}
        <Dialog open={inviteConfirmOpen} onOpenChange={(v) => setInviteConfirmOpen(v)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận tham gia</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm text-gray-700">Bạn có muốn gửi yêu cầu tham gia công hội &quot;{inviteGuildName}&quot;?</div>
            <DialogFooter>
              <button onClick={() => setInviteConfirmOpen(false)} className="mr-2 px-3 py-1">Hủy</button>
              <button onClick={() => void acceptInvite()} className="px-3 py-1 bg-green-600 text-white rounded">{inviteLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
}
