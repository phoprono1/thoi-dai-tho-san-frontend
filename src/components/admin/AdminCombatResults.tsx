'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Target } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface CombatResult {
  id: number;
  userId: number;
  dungeonId: number;
  result: 'victory' | 'defeat';
  duration: number;
  experience: number;
  gold: number;
  items: string[];
  logs: unknown[];
  createdAt: string;
}

export default function AdminCombatResults() {
  // Fetch all combat results
  const { data: combatResults, isLoading } = useQuery({
    queryKey: ['adminCombatResults'],
    queryFn: async (): Promise<CombatResult[]> => {
      try {
        const response = await api.get('/combat');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch combat results:', error);
        return [];
      }
    },
  });

  const getResultColor = (result: string) => {
    switch (result) {
      case 'victory': return 'bg-green-500';
      case 'defeat': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const columns = [
    {
      key: 'id' as keyof CombatResult,
      label: 'ID',
      sortable: true,
    },
    {
      key: 'userId' as keyof CombatResult,
      label: 'User ID',
      sortable: true,
    },
    {
      key: 'dungeonId' as keyof CombatResult,
      label: 'Dungeon ID',
      sortable: true,
    },
    {
      key: 'result' as keyof CombatResult,
      label: 'Kết quả',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${getResultColor(value as string)}`}>
          {value === 'victory' ? 'Thắng' : 'Thua'}
        </span>
      ),
    },
    {
      key: 'duration' as keyof CombatResult,
      label: 'Thời gian (ms)',
      sortable: true,
    },
    {
      key: 'experience' as keyof CombatResult,
      label: 'EXP',
      sortable: true,
    },
    {
      key: 'gold' as keyof CombatResult,
      label: 'Gold',
      sortable: true,
    },
    {
      key: 'createdAt' as keyof CombatResult,
      label: 'Thời gian',
      render: (value: unknown) => new Date(value as string).toLocaleString('vi-VN'),
      sortable: true,
    },
  ];

  return (
  <div className="space-y-6 dark:text-gray-100">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng trận đấu</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combatResults?.length || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Trận đã diễn ra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiến thắng</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {combatResults?.filter(c => c.result === 'victory').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Trận thắng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {combatResults?.filter(c => c.result === 'defeat').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Trận thua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thắng</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {combatResults?.length ?
                Math.round((combatResults.filter(c => c.result === 'victory').length / combatResults.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Tỷ lệ chiến thắng</p>
          </CardContent>
        </Card>
      </div>

      {/* Combat Results List */}
      <DataTable
        title="Danh sách kết quả chiến đấu"
        data={combatResults || []}
        columns={columns}
        searchPlaceholder="Tìm kiếm kết quả chiến đấu..."
        searchFields={['id', 'userId', 'dungeonId']}
        loading={isLoading}
        actions={false}
      />
    </div>
  );
}
