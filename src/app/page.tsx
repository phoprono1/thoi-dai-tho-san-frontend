 'use client';

import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sword, Shield, Crown, Package, Scroll, Users, MessageSquare, Trophy } from 'lucide-react';

export default function GameDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div style={{ width: 40, height: 40, overflow: 'hidden' }} className="rounded-md">
                  <Image src="/game-logo.png" alt="Thời Đại Thợ Săn" width={40} height={40} style={{ objectFit: 'cover', objectPosition: 'center' }} />
                </div>
                <div className="text-lg font-bold text-gray-900">Thời Đại Thợ Săn</div>
              </div>
              <div className="text-sm text-gray-600">
                Chào mừng, <span className="font-semibold">{user.username}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Level {user.level} • {user.experience} XP • {user.gold} 💰
              </div>
              <Button variant="outline" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.level}</div>
              <p className="text-xs text-muted-foreground">
                {user.experience} / {(user.level + 1) * 1000} XP
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gold</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.gold}</div>
              <p className="text-xs text-muted-foreground">Tiền tệ trong game</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quests</CardTitle>
              <Scroll className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nhiệm vụ đang làm</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dungeons</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
            </CardContent>
          </Card>
        </div>

        {/* Game Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sword className="h-5 w-5" />
                <span>Combat</span>
              </CardTitle>
              <CardDescription>
                Tham gia chiến đấu với monsters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Sắp có
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Dungeons</span>
              </CardTitle>
              <CardDescription>
                Khám phá dungeons và thu thập rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Sắp có
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Inventory</span>
              </CardTitle>
              <CardDescription>
                Quản lý items và equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Sắp có
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scroll className="h-5 w-5" />
                <span>Quests</span>
              </CardTitle>
              <CardDescription>
                Nhận và hoàn thành quests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Sắp có
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Guild</span>
              </CardTitle>
              <CardDescription>
                Tham gia guild và hợp tác
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Sắp có
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Chat</span>
              </CardTitle>
              <CardDescription>
                Trò chuyện với người chơi khác
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Sắp có
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
            <Trophy className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Chào mừng đến với Thời Đại Thợ Săn!</h2>
            <p className="text-lg opacity-90">
              Game RPG text-based với hệ thống chiến đấu, items, và guilds đầy đủ đang được phát triển.
            </p>
            <p className="mt-4 opacity-75">
              Các tính năng đang được hoàn thiện: Combat System, Inventory, Quests, Guilds, Chat
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
