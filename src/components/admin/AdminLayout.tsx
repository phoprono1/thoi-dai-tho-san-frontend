import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Target,
  Settings,
  BarChart3,
  Shield,
  Sword,
  Trophy,
  Package
} from 'lucide-react';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Quests',
    href: '/admin/quests',
    icon: Target,
  },
  {
    title: 'Items',
    href: '/admin/items',
    icon: Package,
  },
  {
    title: 'Combat',
    href: '/admin/combat',
    icon: Sword,
  },
  {
    title: 'Guilds',
    href: '/admin/guilds',
    icon: Shield,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
  {/* Header */}
  <header className="bg-white/95 dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">Welcome, Admin</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
  <nav className="w-64 bg-white/95 dark:bg-slate-900 shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-100 dark:border-slate-800">
          <div className="p-4">
            <ul className="space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
          ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
