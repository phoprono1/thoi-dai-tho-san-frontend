'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { useAdmin } from '@/components/providers/AdminProvider';
import { Users, Sword, Shield, Crown, Building, Target, PawPrint } from 'lucide-react';

export default function AdminDashboard() {
  const { logout } = useAdmin();

  // Fetch real admin stats using admin API
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApiEndpoints.getSystemStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Quản lý hệ thống Thời Đại Thợ Săn</p>
        </div>

        {/* System Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant={stats?.systemStatus === 'healthy' ? 'default' : 'destructive'}>
                  {stats?.systemStatus === 'healthy' ? '✅ Hệ thống hoạt động tốt' : '❌ Có vấn đề'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người chơi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Người dùng đã đăng ký</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng vật phẩm</CardTitle>
              <Sword className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">Items trong hệ thống</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng dungeon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDungeons || 0}</div>
              <p className="text-xs text-muted-foreground">Dungeon có sẵn</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng monsters</CardTitle>
              <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMonsters || 0}</div>
              <p className="text-xs text-muted-foreground">Monsters trong hệ thống</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng quests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalQuests || 0}</div>
              <p className="text-xs text-muted-foreground">Quests có sẵn</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng guild</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalGuilds || 0}</div>
              <p className="text-xs text-muted-foreground">Guild đã tạo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Combat đang diễn ra</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeCombats || 0}</div>
              <p className="text-xs text-muted-foreground">Trận chiến active</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Management Tools</CardTitle>
              <CardDescription>Quản lý các thành phần game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => window.location.href = '/admin/users'}
                className="w-full justify-start"
                variant="outline"
              >
                <Users className="w-4 h-4 mr-2" />
                Users Management
              </Button>
              <Button
                onClick={() => window.location.href = '/admin/quests'}
                className="w-full justify-start"
                variant="outline"
              >
                <Target className="w-4 h-4 mr-2" />
                Quests Management
              </Button>
              <Button
                onClick={() => window.location.href = '/admin/items'}
                className="w-full justify-start"
                variant="outline"
              >
                <Sword className="w-4 h-4 mr-2" />
                Items Management
              </Button>
              <Button
                onClick={() => window.location.href = '/admin/monsters'}
                className="w-full justify-start"
                variant="outline"
              >
                <PawPrint className="w-4 h-4 mr-2" />
                Monsters Management
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Tools</CardTitle>
              <CardDescription>Công cụ quản lý hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  logout();
                }}
              >
                Admin Logout
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Clear Cache
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Backup Database
              </Button>
              <Button variant="outline" className="w-full" disabled>
                System Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
