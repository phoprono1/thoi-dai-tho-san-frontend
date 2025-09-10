import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Heart, Zap, Shield, Sword, Coins, Star, TrendingUp } from 'lucide-react';
import { useUserStatusStore } from '@/stores/user-status.store';
import { useUserStatus } from '@/hooks/use-user-status';
import { useAuth } from '@/components/providers/AuthProvider';
import { Spinner } from '@/components/ui/spinner';

const StatusTab: React.FC = () => {
  // Get authenticated user
  const { user: authUser, isAuthenticated } = useAuth();

  // Use authenticated user ID instead of hardcoded value
  const userId = authUser?.id;

  // Use Zustand store
  const {
    user,
    stats,
    stamina,
    currentLevel,
    nextLevel,
    characterClass,
    isLoading,
    error,
  } = useUserStatusStore();

  // Use TanStack Query only when userId is available
  const { isLoading: queryLoading, error: queryError } = useUserStatus(userId!);

  // If not authenticated, show message
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem thông tin nhân vật</p>
        </div>
      </div>
    );
  }

  // Combine loading states
  const loading = isLoading || queryLoading;
  const displayError = error || (queryError instanceof Error ? queryError.message : null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{displayError}</p>
      </div>
    );
  }

  if (!user || !stats || !stamina || !currentLevel) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Không có dữ liệu nhân vật</p>
      </div>
    );
  }

  const healthPercent = (stats.currentHp / stats.maxHp) * 100;
  const expPercent = nextLevel
    ? (user.experience / nextLevel.experienceRequired) * 100
    : 100;
  const staminaPercent = (stamina.currentStamina / stamina.maxStamina) * 100;

  return (
    <div className="space-y-4 p-4">
      {/* Thông tin nhân vật chính */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {user.username}
            <Badge variant="secondary" className="ml-auto">
              Cấp {currentLevel.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lớp nhân vật */}
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{characterClass?.name || 'Chưa chọn lớp'}</span>
          </div>

          {/* Thanh máu */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">Máu</span>
              </div>
              <span className="text-red-600 font-bold">{stats.currentHp}/{stats.maxHp}</span>
            </div>
            <Progress value={healthPercent} className="h-2 [&>div]:bg-red-500" />
          </div>

          {/* Thanh kinh nghiệm */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Kinh nghiệm</span>
              </div>
              <span className="text-green-600 font-bold">{user.experience}/{nextLevel?.experienceRequired || user.experience}</span>
            </div>
            <Progress value={expPercent} className="h-2 [&>div]:bg-green-500" />
          </div>

          {/* Thanh năng lượng */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600 font-medium">Năng lượng</span>
              </div>
              <span className="text-blue-600 font-bold">{stamina.currentStamina}/{stamina.maxStamina}</span>
            </div>
            <Progress value={staminaPercent} className="h-2 [&>div]:bg-blue-500" />
          </div>

          {/* Vàng */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Vàng</span>
            </div>
            <span className="text-sm font-bold text-yellow-600">{user.gold?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Thuộc tính chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Thuộc tính</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thuộc tính chi tiết */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cột 1: Thuộc tính cơ bản */}
            <div className="space-y-4 border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sword className="h-5 w-5" />
                Thuộc tính cơ bản
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Sword className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs font-medium">Tấn công</p>
                    <p className="text-sm font-bold">{stats.attack}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs font-medium">Phòng thủ</p>
                    <p className="text-sm font-bold">{stats.defense}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Heart className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs font-medium">Sinh lực</p>
                    <p className="text-sm font-bold">{stats.vitality}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-xs font-medium">Trí tuệ</p>
                    <p className="text-sm font-bold">{stats.intelligence}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2: Thuộc tính cốt lõi */}
            <div className="space-y-4 border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Thuộc tính cốt lõi
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Sword className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs font-medium">Sức mạnh</p>
                    <p className="text-sm font-bold">{stats.strength}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Zap className="h-4 w-4 text-cyan-500" />
                  <div>
                    <p className="text-xs font-medium">Nhanh nhẹn</p>
                    <p className="text-sm font-bold">{stats.dexterity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium">May mắn</p>
                    <p className="text-sm font-bold">{stats.luck}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-xs font-medium">Độ chính xác</p>
                    <p className="text-sm font-bold">{stats.accuracy}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 3: Thuộc tính nâng cao */}
            <div className="space-y-4 border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Thuộc tính nâng cao
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs font-medium">Tỷ lệ chí mạng</p>
                    <p className="text-sm font-bold">{stats.critRate}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs font-medium">Sát thương chí mạng</p>
                    <p className="text-sm font-bold">{stats.critDamage}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Star className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-xs font-medium">Tỷ lệ combo</p>
                    <p className="text-sm font-bold">{stats.comboRate}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 border-2 border-gray-300 rounded-md bg-white shadow-sm">
                  <Star className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs font-medium">Tỷ lệ phản công</p>
                    <p className="text-sm font-bold">{stats.counterRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusTab;
