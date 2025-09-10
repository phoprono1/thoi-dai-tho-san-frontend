'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Settings, Database, Server, Activity, Users, Sword, Building, BarChart3 } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalItems: number;
  totalDungeons: number;
  totalGuilds: number;
  totalCombatResults: number;
  totalCharacterClasses: number;
  totalLevels: number;
  totalDonors: number;
  systemUptime: string;
  databaseSize: string;
  activeConnections: number;
}

export default function AdminSystem() {
  const [sampleDataType, setSampleDataType] = useState('');

  // Fetch system stats
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['adminSystemStats'],
    queryFn: async (): Promise<SystemStats> => {
      try {
        const [
          usersRes,
          itemsRes,
          dungeonsRes,
          guildsRes,
          combatRes,
          classesRes,
          levelsRes,
          donorsRes
        ] = await Promise.all([
          api.get('/users'),
          api.get('/items'),
          api.get('/dungeons'),
          api.get('/guild'),
          api.get('/combat'),
          api.get('/character-classes'),
          api.get('/levels'),
          api.get('/donors'),
        ]);

        return {
          totalUsers: usersRes.data?.length || 0,
          totalItems: itemsRes.data?.length || 0,
          totalDungeons: dungeonsRes.data?.length || 0,
          totalGuilds: guildsRes.data?.length || 0,
          totalCombatResults: combatRes.data?.length || 0,
          totalCharacterClasses: classesRes.data?.length || 0,
          totalLevels: levelsRes.data?.length || 0,
          totalDonors: donorsRes.data?.length || 0,
          systemUptime: '24h 30m', // Mock data
          databaseSize: '2.4 GB', // Mock data
          activeConnections: 15, // Mock data
        };
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return {
          totalUsers: 0,
          totalItems: 0,
          totalDungeons: 0,
          totalGuilds: 0,
          totalCombatResults: 0,
          totalCharacterClasses: 0,
          totalLevels: 0,
          totalDonors: 0,
          systemUptime: 'Unknown',
          databaseSize: 'Unknown',
          activeConnections: 0,
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleCreateSampleData = async () => {
    if (!sampleDataType) {
      toast.error('Vui lòng chọn loại dữ liệu mẫu!');
      return;
    }

    try {
      let endpoint = '';
      switch (sampleDataType) {
        case 'items':
          endpoint = '/items/create-sample';
          break;
        case 'classes':
          endpoint = '/classes/create-sample';
          break;
        default:
          toast.error('Loại dữ liệu không hợp lệ!');
          return;
      }

      await api.post(endpoint);
      toast.success(`Đã tạo dữ liệu mẫu ${sampleDataType} thành công!`);
      refetch();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Lỗi tạo dữ liệu mẫu: ${err.message}`);
    }
  };

  const handleClearCache = async () => {
    try {
      // Mock cache clearing
      toast.success('Đã xóa cache thành công!');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Lỗi xóa cache: ${err.message}`);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      // Mock database backup
      toast.success('Đã tạo backup database thành công!');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`Lỗi backup database: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Đang tải thống kê hệ thống...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.systemUptime}</div>
            <p className="text-xs text-muted-foreground">Thời gian hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.databaseSize}</div>
            <p className="text-xs text-muted-foreground">Dung lượng database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeConnections}</div>
            <p className="text-xs text-muted-foreground">Kết nối đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalUsers || 0) +
               (stats?.totalItems || 0) +
               (stats?.totalDungeons || 0) +
               (stats?.totalGuilds || 0) +
               (stats?.totalCombatResults || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tổng số bản ghi</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items</CardTitle>
            <Sword className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items trong hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dungeons</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDungeons || 0}</div>
            <p className="text-xs text-muted-foreground">Dungeon có sẵn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guilds</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGuilds || 0}</div>
            <p className="text-xs text-muted-foreground">Guild đã tạo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combat Results</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCombatResults || 0}</div>
            <p className="text-xs text-muted-foreground">Kết quả chiến đấu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Character Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCharacterClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Lớp nhân vật</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Levels</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLevels || 0}</div>
            <p className="text-xs text-muted-foreground">Cấp độ đã cấu hình</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donors</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDonors || 0}</div>
            <p className="text-xs text-muted-foreground">Người đã donate</p>
          </CardContent>
        </Card>
      </div>

      {/* System Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tạo dữ liệu mẫu</CardTitle>
            <CardDescription>Tạo dữ liệu mẫu để test hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sampleDataType">Loại dữ liệu</Label>
              <select
                id="sampleDataType"
                value={sampleDataType}
                onChange={(e) => setSampleDataType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Chọn loại dữ liệu...</option>
                <option value="items">Items</option>
                <option value="classes">Classes</option>
              </select>
            </div>
            <Button
              onClick={handleCreateSampleData}
              className="w-full"
              disabled={!sampleDataType}
            >
              Tạo dữ liệu mẫu
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Công cụ hệ thống</CardTitle>
            <CardDescription>Các công cụ quản lý hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleClearCache}
              variant="outline"
              className="w-full justify-start"
            >
              <Database className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            <Button
              onClick={handleBackupDatabase}
              variant="outline"
              className="w-full justify-start"
            >
              <Database className="w-4 h-4 mr-2" />
              Backup Database
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
            >
              <Activity className="w-4 h-4 mr-2" />
              System Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
