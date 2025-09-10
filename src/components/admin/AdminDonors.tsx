'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Crown } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface Donor {
  id: number;
  userId: number;
  username: string;
  amount: number;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDonors() {
  // Fetch all donors
  const { data: donors, isLoading } = useQuery({
    queryKey: ['adminDonors'],
    queryFn: async (): Promise<Donor[]> => {
      try {
        const response = await api.get('/donors');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch donors:', error);
        return [];
      }
    },
  });

  const columns = [
    {
      key: 'id' as keyof Donor,
      label: 'ID',
      sortable: true,
    },
    {
      key: 'username' as keyof Donor,
      label: 'Username',
      sortable: true,
    },
    {
      key: 'userId' as keyof Donor,
      label: 'User ID',
      sortable: true,
    },
    {
      key: 'amount' as keyof Donor,
      label: 'Số tiền',
      render: (value: unknown) => `${(value as number).toLocaleString()} VND`,
      sortable: true,
    },
    {
      key: 'message' as keyof Donor,
      label: 'Lời nhắn',
      render: (value: unknown) => (value as string) || 'Không có lời nhắn',
    },
    {
      key: 'createdAt' as keyof Donor,
      label: 'Thời gian',
      render: (value: unknown) => new Date(value as string).toLocaleString('vi-VN'),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Donors</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donors?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Người đã donate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tiền</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donors?.reduce((sum, donor) => sum + donor.amount, 0).toLocaleString() || 0} VND
            </div>
            <p className="text-xs text-muted-foreground">Tổng số tiền donate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trung bình</CardTitle>
            <Crown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donors?.length ?
                Math.round(donors.reduce((sum, donor) => sum + donor.amount, 0) / donors.length).toLocaleString()
                : 0} VND
            </div>
            <p className="text-xs text-muted-foreground">Số tiền trung bình</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớn nhất</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donors?.length ? Math.max(...donors.map(d => d.amount)).toLocaleString() : 0} VND
            </div>
            <p className="text-xs text-muted-foreground">Khoản donate lớn nhất</p>
          </CardContent>
        </Card>
      </div>

      {/* Donors List */}
      <DataTable
        title="Danh sách Donors"
        data={donors || []}
        columns={columns}
        searchPlaceholder="Tìm kiếm donor..."
        searchFields={['username', 'message']}
        loading={isLoading}
        actions={false}
      />
    </div>
  );
}
