'use client';

import dynamic from 'next/dynamic';

// Dynamically import client components to avoid SSR issues
const QueryProvider = dynamic(() => import('@/components/providers/QueryProvider'), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>
});

const AuthProvider = dynamic(() => import('@/components/providers/AuthProvider').then(mod => ({ default: mod.AuthProvider })), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>
});

const ThemeProviderClient = dynamic(() => import('@/components/providers/ThemeProviderClient'), { ssr: false });

// Persistent guild socket manager (client-only)
const GuildSocketManager = dynamic(() => import('@/components/chat/GuildSocketManager').then(mod => ({ default: mod.default })), { ssr: false });

// Dynamic title updater
const DynamicTitle = dynamic(() => import('@/components/providers/DynamicTitle').then(mod => ({ default: mod.DynamicTitle })), { ssr: false });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderClient>
      <QueryProvider>
        <AuthProvider>
          {/* Dynamic title updater based on current route */}
          <DynamicTitle />
          {/* Persistent guild socket manager keeps guild listeners mounted while user is logged-in */}
          <GuildSocketManager />
          {/* Top-wide marquee banner (clickable) */}
          <div className="top-marquee-banner">
            <div className="marquee-inner bg-accent text-accent-foreground rounded-md mx-auto inline-block">
              <a href="https://discord.gg/guQEEr6G" target="_blank" rel="noopener noreferrer">
                Tham gia Discord của chúng tôi — Click để vào: https://discord.gg/DKQAM5Nf
              </a>
            </div>
          </div>
          {children}
        </AuthProvider>
      </QueryProvider>
    </ThemeProviderClient>
  );
}
