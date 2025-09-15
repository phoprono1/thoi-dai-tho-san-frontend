'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useChatStore, ChatMessage } from '@/stores/useChatStore';

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const checkAuthAndConnect = useChatStore((state) => state.checkAuthAndConnect);
  const isConnected = useChatStore((state) => state.isConnected);
  const error = useChatStore((state) => state.error);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Limit messages to last 20 for performance
  const displayMessages = messages.slice(-20);

  useEffect(() => {
    // Only try to connect when chat drawer is opened
    if (isOpen && !isConnected) {
      checkAuthAndConnect();
    }
  }, [isOpen, isConnected, checkAuthAndConnect]);

  // Separate effect for scrolling when drawer opens
  useEffect(() => {
    if (isOpen && displayMessages.length > 0) {
      // Longer delay for drawer animation
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 500); // Increased delay for drawer opening
    }
  }, [isOpen, displayMessages.length]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (isOpen && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 50); // Quick scroll for new messages
    }
  }, [displayMessages, isOpen]);

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
      <DrawerContent className="h-[80vh] w-full">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              Chat Thế Giới
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm font-normal text-gray-500">
                {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
              </span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-grow overflow-hidden p-4 pb-2">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="flex flex-col gap-4 pr-4 pb-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-red-600 text-sm">{error}</span>
                  </div>
                )}
                {displayMessages.map((msg: ChatMessage, index: number) => (
                  <div key={msg.id || index} className="flex items-start gap-2">
                    <span className="font-bold text-blue-500">
                      {msg.username}:
                    </span>
                    <p className="flex-1 break-words">{msg.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          <div className="p-8 pt-1 border-t bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
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
      </DrawerContent>
    </Drawer>
  );
}
