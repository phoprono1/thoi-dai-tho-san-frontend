'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Users, MessageCircle, Settings } from 'lucide-react';

export default function PersistentNav() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  const items = [
    { href: '/', label: 'Home', Icon: Home },
    { href: '/game', label: 'Game', Icon: MapPin },
    { href: '/social', label: 'Social', Icon: Users },
    { href: '/chat', label: 'Chat', Icon: MessageCircle },
    { href: '/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] shadow-lg z-50 lg:hidden">
      <div className="max-w-[1024px] mx-auto flex items-center justify-between px-2 py-2">
        {items.map((it) => {
          const isActive = pathname === it.href || pathname.startsWith(it.href + '/');
          const Icon = it.Icon;
          return (
            <Link key={it.href} href={it.href} className={`flex-1 flex flex-col items-center justify-center text-xs py-1 ${isActive ? 'text-[var(--sidebar-primary)]' : 'text-[var(--muted-foreground)]'}`}>
              <Icon className={`h-6 w-6 ${isActive ? 'text-[var(--sidebar-primary)]' : ''}`} />
              <span className="mt-1">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
