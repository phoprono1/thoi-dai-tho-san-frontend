'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
  import { useAuth } from '@/components/providers/AuthProvider';
  import { useUIStore } from '@/stores';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu';
  import {
    User,
    Package,
    Sword,
    Users,
    Coins,
    Scroll,
    Heart
  } from 'lucide-react';
  import { Menu, Mail, Settings, Calendar } from 'lucide-react';
  import MailboxModal from '@/components/ui/MailboxModal';
  import { useMailboxStore } from '@/stores/useMailboxStore';
  import { Spinner } from '../ui/spinner';
  import ThemeToggle from '@/components/ui/ThemeToggle';
import { giftcodeApi } from '@/lib/api-client';
import { toast } from 'sonner';
  import { GlobalChat } from '@/components/global-chat/global-chat';
  import DonateModal from '@/components/ui/DonateModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DailyLoginModal from '@/components/ui/DailyLoginModal';

  interface GameLayoutProps {
    children: React.ReactNode;
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
  }

  export default function GameLayout({ children, activeTab, onTabChange }: GameLayoutProps) {
    const { user, logout, isLoading } = useAuth();
    const { openModal } = useUIStore();
    const unreadCount = useMailboxStore((s) => s.unreadCount);
    const router = useRouter();
    const pathname = usePathname();
  const [showGiftcodeModal, setShowGiftcodeModal] = useState(false);
  const [giftcodeInput, setGiftcodeInput] = useState('');
  const [showDailyLoginModal, setShowDailyLoginModal] = useState(false);

    // Handle redirect in useEffect to avoid setState during render
    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login');
      }
    }, [user, isLoading, router]);

    // Show loading while checking auth or redirecting
    if (isLoading || !user) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Spinner

          />
        </div>
      );
    }

    const tabs = [
      { id: 'status', label: 'Trạng thái', icon: User, color: 'text-blue-500' },
      { id: 'inventory', label: 'Kho đồ', icon: Package, color: 'text-green-500' },
      { id: 'explore', label: 'Khám phá', icon: Sword, color: 'text-red-500' },
      { id: 'quests', label: 'Nhiệm vụ', icon: Scroll, color: 'text-purple-500' },
      { id: 'guild', label: 'Công hội', icon: Users, color: 'text-indigo-500' },
    ];

    const validTabIds = tabs.map(t => t.id);

    // Determine active tab: prefer explicit prop, otherwise map /game/<tab> and /game/<tab>/** to the correct tab
    const computedActiveTab = (() => {
      if (activeTab && validTabIds.includes(activeTab)) return activeTab;
      if (!pathname) return 'status';

      // normalize and split path
      const parts = pathname.split('/').filter(Boolean);

      // If path doesn't start with 'game', fall back to heuristics (for legacy routes)
      if (parts.length === 0) return 'status';

      if (parts[0] === 'game') {
        // /game -> status
        if (parts.length === 1) return 'status';
        const maybeTab = parts[1];
        if (validTabIds.includes(maybeTab)) return maybeTab;
        // fallback: if second segment is 'explore' or 'dungeons' treat as explore
        if (maybeTab === 'explore' || maybeTab === 'dungeons') return 'explore';
      }

      // Legacy or non-/game paths that still should map to explore
      if (pathname.startsWith('/dungeons') || pathname.startsWith('/explore')) return 'explore';

      return 'status';
    })();

    const handleTabChange = (tabId: string) => {
      if (!validTabIds.includes(tabId)) return;
      if (onTabChange) {
        onTabChange(tabId);
        return;
      }
      // No parent handler -> navigate to the main game page route for the selected tab
      const target = tabId === 'status' ? '/game' : `/game/${tabId}`;
      router.push(target);
    };

    return (
      <div className="min-h-screen bg-[var(--background)] flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:bg-[var(--sidebar)] lg:border-r lg:shadow-sm lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-30">
          <div className="p-6 border-b border-[var(--sidebar-border)]">
            <div className="flex items-center space-x-3">
              <div style={{ width: 40, height: 40, overflow: 'hidden' }} className="rounded-md">
                <Image src="/game-logo.png" alt="Thời Đại Thợ Săn" width={40} height={40} style={{ objectFit: 'cover', objectPosition: 'center' }} />
              </div>
              <div className="text-lg font-bold text-[var(--sidebar-foreground)]">Thời Đại Thợ Săn</div>
            </div>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = computedActiveTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                        ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] border-r-2 border-[var(--sidebar-ring)]'
                        : 'text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)]'
                      }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[var(--sidebar-primary)]' : 'text-[var(--sidebar-foreground)]'}`} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="p-4 border-t border-[var(--sidebar-border)]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Menu</span>
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openModal('mailbox')}>Mailbox</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGiftcodeModal(true)}>
                  <div className="flex items-center gap-2">Cài đặt</div>
                </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openModal('donate') }>
                      Donate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>Thoát</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

      {/* Main Content Area */}
      {/* When desktop: reserve right column for embedded chat (w-96). Left sidebar is fixed w-72.
        So main content area should have margin-left ml-72 and margin-right mr-96 on lg+. */}
    <div className="flex-1 flex flex-col min-w-0 lg:ml-72 lg:mr-96">
          {/* Header - Desktop */}
          <header className="hidden lg:block bg-[var(--card)] shadow-sm border-b border-[var(--border)]">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">
                    Lv.{user.level}
                  </Badge>
                  <div className="flex items-center space-x-2 text-sm">
                    <Coins className="h-4 w-4 text-[var(--chart-1)]" />
                    <span className="font-medium text-[var(--foreground)]">{user.gold.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-[var(--muted-foreground)]">Chào mừng, {user.username}</span>
                  <ThemeToggle />
                  <div className="ml-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowDailyLoginModal(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Daily
                    </Button>
                  </div>
                  <div className="ml-2">
                    <Button variant="ghost" size="sm" onClick={() => openModal('mailbox')}>
                      <Mail className="h-4 w-4 mr-2" />
                      {unreadCount > 0 ? <Badge variant="destructive">{unreadCount}</Badge> : null}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Header */}
          <header className="bg-[var(--card)] shadow-sm border-b border-[var(--border)] sticky top-0 z-40 lg:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg font-bold text-gray-900">Thời Đại Thợ Săn</h1>
                  <Badge variant="secondary" className="text-xs">
                    Lv.{user.level}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 text-sm">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{user.gold.toLocaleString()}</span>
                  </div>
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowDailyLoginModal(true)}>
                        <Calendar className="h-4 w-4 mr-2" /> Daily Login
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openModal('mailbox')}>
                        <Mail className="h-4 w-4 mr-2" /> Mailbox
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowGiftcodeModal(true)}>
                        <Settings className="h-4 w-4 mr-2" /> Cài đặt
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openModal('donate')}>
                        <Heart className="h-4 w-4 mr-2 inline-block" /> Donate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()}>Thoát</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 lg:pb-0" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
            <div className="w-full max-w-full mx-auto lg:max-w-none px-4 sm:px-6 lg:px-6 xl:px-8 py-6">
              {children}
            </div>
          </main>

          {/* Global Modals */}
          <MailboxModal />
          <DonateModal />
          <DailyLoginModal open={showDailyLoginModal} onOpenChange={setShowDailyLoginModal} />

          {/* Giftcode Modal (opened from Cài đặt menu item) */}
          <Dialog open={showGiftcodeModal} onOpenChange={(v) => setShowGiftcodeModal(v)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nhập Giftcode</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 p-2 border rounded"
                    placeholder="Nhập mã giftcode"
                    value={giftcodeInput}
                    onChange={(e) => setGiftcodeInput(e.target.value)}
                  />
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                    onClick={async () => {
                      try {
                        await giftcodeApi.redeem(giftcodeInput.trim());
                        toast.success('Đổi mã thành công! Kiểm tra mailbox để nhận quà.');
                        setGiftcodeInput('');
                        setShowGiftcodeModal(false);
                                } catch (err) {
                                  console.error('Redeem failed', err);
                                  // Try to read server-provided message (AxiosResponse.data.message),
                                  // fall back to generic error.message, and map known messages to VN text.
                                  const e = err as unknown as {
                                    response?: { data?: { message?: string } };
                                    message?: string;
                                  };
                                  const serverMsg = e.response?.data?.message ?? e.message ?? '';
                                  // Map common backend messages to user-friendly Vietnamese strings
                                  const mapped = serverMsg === 'Already redeemed'
                                    ? 'Giftcode đã được sử dụng'
                                    : serverMsg || 'Đổi mã thất bại';
                                  toast.error(mapped);
                                }
                    }}
                  >
                    Đổi mã
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="px-3 py-2 border rounded" onClick={() => router.push('/settings')}>Cài đặt tài khoản</button>
                  </div>
                  <button className="text-sm text-gray-500" onClick={() => setShowGiftcodeModal(false)}>Đóng</button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Mobile-only: render floating/bottom-sheet GlobalChat */}
          <div className="lg:hidden">
            <GlobalChat />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] shadow-lg z-50">
          <div className="flex justify-around items-center py-2 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = computedActiveTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-[var(--primary-foreground)]' : ''}`} />
                  <span className={`text-xs font-medium truncate ${
                    isActive ? 'text-[var(--primary-foreground)]' : ''
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

      {/* Embedded Global Chat - Desktop only */}
    <aside className="hidden lg:block lg:fixed lg:top-0 lg:right-0 lg:h-screen lg:w-96 lg:border-l lg:bg-[var(--card)] lg:shadow-sm lg:z-30">
          <div className="h-full flex flex-col">
            {/* Make the chat fill the column */}
            <div className="flex-1 overflow-hidden">
              {/* Import GlobalChat lazily to avoid SSR mismatch; use client-side import via dynamic in parent layout, but here import directly */}
              <div className="h-full">
                {/* We render GlobalChat embedded so it stays visible alongside game content */}
                <GlobalChat embedded={true} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }
