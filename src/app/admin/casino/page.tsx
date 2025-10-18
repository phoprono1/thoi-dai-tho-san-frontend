'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Plus, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function AdminCasinoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Casino Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quản lý các minigame casino trong game
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Scratch Cards */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <CardTitle>Vé Số Cào</CardTitle>
            </div>
            <CardDescription>
              Quản lý các loại vé số cào và phần thưởng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/casino/scratch-cards">
                <Button className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Quản lý vé số cào
                </Button>
              </Link>
              <Button className="w-full" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Thống kê
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Future Games */}
        <Card className="hover:shadow-lg transition-shadow opacity-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Plus className="w-6 h-6 text-gray-400" />
              <CardTitle>Minigame Mới</CardTitle>
            </div>
            <CardDescription>
              Sẵn sàng cho các minigame casino khác
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Sắp ra mắt
            </Button>
          </CardContent>
        </Card>

        {/* Casino Settings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-500" />
              <CardTitle>Cài đặt Casino</CardTitle>
            </div>
            <CardDescription>
              Cấu hình chung cho hệ thống casino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng vé số cào</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Người chơi hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Đã tham gia casino</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Gold từ casino</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thắng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Trung bình</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}