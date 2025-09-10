'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

const GlobalChat = dynamic(() => import('@/components/global-chat/global-chat').then(mod => mod.GlobalChat), {
  ssr: false,
});

const ThemeProviderClient = dynamic(() => import('@/components/providers/ThemeProviderClient'), { ssr: false });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProviderClient>
          <QueryProvider>
            <AuthProvider>
              {children}
              <GlobalChat />
            </AuthProvider>
          </QueryProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
