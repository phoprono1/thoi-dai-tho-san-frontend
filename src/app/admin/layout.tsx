'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AdminProvider } from '@/components/providers/AdminProvider';
import {
  Users,
  Sword,
  Shield,
  ShoppingCart as Shop,
  Crown,
  Building,
  MessageSquare,
  Trophy,
  Mail,
  Zap,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Gamepad2,
  Target,
  UserCheck,
  PawPrint,
  Crosshair,
  Building2,
  Sparkles,
  Hammer
} from 'lucide-react';
import AdminLogin from '@/components/admin/AdminLogin';
import { useAdmin } from '@/components/providers/AdminProvider';

// Admin-specific query client without global interceptors
const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors for admin
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Items', href: '/admin/items', icon: Sword },
  { name: 'Gacha', href: '/admin/gacha', icon: Shield },
  { name: 'Crafting', href: '/admin/crafting', icon: Hammer },
  { name: 'Skills', href: '/admin/skills', icon: Sparkles },
  { name: 'Market', href: '/admin/market', icon: Shop },
  { name: 'Monsters', href: '/admin/monsters', icon: PawPrint },
  { name: 'Dungeons', href: '/admin/dungeons', icon: Shield },
  { name: 'Wild Areas', href: '/admin/wildarea', icon: PawPrint },
  { name: 'Rooms', href: '/admin/rooms', icon: Building2 },
  { name: 'Character Classes', href: '/admin/character-classes', icon: UserCheck },
  { name: 'Combat Results', href: '/admin/combat', icon: Crosshair },
  { name: 'Quests', href: '/admin/quests', icon: Target },
  { name: 'Guilds', href: '/admin/guilds', icon: Building },
  { name: 'Titles', href: '/admin/titles', icon: Crown },
  { name: 'PVP', href: '/admin/pvp', icon: Trophy },
  { name: 'World Boss', href: '/admin/world-boss', icon: Zap },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'Giftcodes', href: '/admin/giftcodes', icon: Sparkles },
  { name: 'Daily Login', href: '/admin/daily-login', icon: Crown },
  { name: 'Mailbox', href: '/admin/mailbox', icon: Mail },
  { name: 'Levels', href: '/admin/levels', icon: BarChart3 },
  { name: 'Donors', href: '/admin/donors', icon: Crown },
  { name: 'System', href: '/admin/system', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // AdminGate component ensures every admin route requires auth
  function AdminGate({ children }: { children: React.ReactNode }) {
    const { isAdminAuthenticated } = useAdmin();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
        </div>
      );
    }

    if (!isAdminAuthenticated) {
      return <AdminLogin />;
    }

    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={adminQueryClient}>
      <AdminProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          {/* Mobile sidebar */}
          <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium ${isActive
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-r-2 border-blue-700'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-lg">
              <div className="flex items-center p-6 border-b border-gray-200 dark:border-slate-700">
                <Gamepad2 className="w-8 h-8 text-blue-600 mr-3" />
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Thời Đại Thợ Săn</span>
              </div>
              <nav className="flex-1 mt-6 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-r-4 border-blue-700'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:pl-64">
            {/* Top bar */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between px-4 py-4 lg:px-8">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 mr-4"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {navigation.find(item => item.href === pathname)?.name || 'Admin Panel'}
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <span className="text-sm text-gray-500 dark:text-gray-300">Admin Access</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('admin_access');
                      window.location.href = '/admin';
                    }}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Page content */}
            <main className="p-4 lg:p-8">
              <AdminGate>
                {children}
              </AdminGate>
            </main>
          </div>
        </div>
        <Toaster />
      </AdminProvider>
    </QueryClientProvider>
  );
}
