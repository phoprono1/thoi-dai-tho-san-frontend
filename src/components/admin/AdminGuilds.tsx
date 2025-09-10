'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Building } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface Guild {
  id: number;
  name: string;
  description: string;
  leaderId: number;
  level: number;
  experience: number;
  gold: number;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminGuilds() {
  // Fetch all guilds
  const { data: guilds, isLoading } = useQuery({
    queryKey: ['adminGuilds'],
    queryFn: async (): Promise<Guild[]> => {
      try {
        const response = await api.get('/guild');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch guilds:', error);
        return [];
      }
    },
  });

  const columns = [
    {
      key: 'id' as keyof Guild,
      label: 'ID',
      sortable: true,
    },
    {
      key: 'name' as keyof Guild,
      label: 'Tên Guild',
      sortable: true,
    },
    {
      key: 'leaderId' as keyof Guild,
      label: 'Leader ID',
      sortable: true,
    },
    {
      key: 'level' as keyof Guild,
      label: 'Level',
      sortable: true,
    },
    {
      key: 'memberCount' as keyof Guild,
      label: 'Thành viên',
      render: (value: unknown, item: Guild) => `${value}/${item.maxMembers}`,
      sortable: true,
    },
    {
      key: 'experience' as keyof Guild,
      label: 'EXP',
      sortable: true,
    },
    {
      key: 'gold' as keyof Guild,
      label: 'Gold',
      sortable: true,
    },
    {
      key: 'createdAt' as keyof Guild,
      label: 'Ngày tạo',
      render: (value: unknown) => new Date(value as string).toLocaleDateString('vi-VN'),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Guilds</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guilds?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Guild đã tạo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thành viên</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guilds?.reduce((sum, guild) => sum + guild.memberCount, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Thành viên trong tất cả guild</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level trung bình</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guilds?.length ?
                Math.round(guilds.reduce((sum, guild) => sum + guild.level, 0) / guilds.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Level trung bình của guild</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Gold</CardTitle>
            <Building className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guilds?.reduce((sum, guild) => sum + guild.gold, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Tổng gold trong tất cả guild</p>
          </CardContent>
        </Card>
      </div>

      {/* Guilds List */}
      <DataTable
        title="Danh sách Guilds"
        data={guilds || []}
        columns={columns}
        searchPlaceholder="Tìm kiếm guild..."
        searchFields={['name', 'description']}
        loading={isLoading}
        actions={false}
      />
    </div>
  );
}
