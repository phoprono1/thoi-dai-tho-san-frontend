import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Thời Đại Thợ Săn - Game RPG Idle',
    template: '%s | Thời Đại Thợ Săn'
  },
  description: 'Game RPG Idle - Khám phá thế giới săn bắn, chiến đấu với quái vật, nâng cấp kỹ năng và trở thành thợ săn huyền thoại!',
  icons: {
    icon: [
      {
        url: 'game-logo.png',
        href: 'game-logo.png',
      }
    ]
  },
};

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
