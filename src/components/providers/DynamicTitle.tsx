'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const routeTitles: Record<string, string> = {
  '/': 'Trang chủ',
  '/login': 'Đăng nhập',
  '/register': 'Đăng ký',
  '/game': 'Game',
  '/game/status': 'Thông tin nhân vật',
  '/game/inventory': 'Túi đồ',
  '/game/explore': 'Khám phá',
  '/game/explore/shop': 'Cửa hàng',
  '/game/explore/crafting': 'Chế tạo',
  '/game/explore/leaderboard': 'Bảng xếp hạng',
  '/game/guild': 'Công hội',
  '/game/explore/pets': 'Thú cưng',
  '/game/explore/dungeons': 'Hầm ngục',
  '/game/explore/wild-area': 'Khu vực hoang dã',
  '/game/explore/world-boss': 'Boss thế giới',
  '/game/explore/pvp': 'Đấu trường PvP',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Quản lý Users',
  '/admin/skills': 'Quản lý Skills',
  '/admin/character-classes': 'Quản lý Classes',
  '/admin/combat': 'Combat Test',
  '/admin/crafting': 'Quản lý Crafting',
  '/admin/quests': 'Quản lý Quests',
  '/admin/rooms': 'Quản lý Rooms',
  '/admin/titles': 'Quản lý Titles',
  '/admin/wildarea': 'Quản lý Wild Area',
  '/admin/world-boss': 'Quản lý World Boss',
  '/wiki': 'Wiki',
  '/settings': 'Cài đặt',
  '/consumables': 'Vật phẩm tiêu hao',
};

export function DynamicTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const baseTitle = 'Thời Đại Thợ Săn';
    const pageTitle = routeTitles[pathname];
    
    if (pageTitle) {
      document.title = `${pageTitle} | ${baseTitle}`;
    } else {
      // Fallback for dynamic routes
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        const formattedTitle = lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        document.title = `${formattedTitle} | ${baseTitle}`;
      } else {
        document.title = baseTitle;
      }
    }
  }, [pathname]);

  return null;
}
