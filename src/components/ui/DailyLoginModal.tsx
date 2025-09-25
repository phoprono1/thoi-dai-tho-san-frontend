import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyLoginApi } from '@/lib/api-client';
import { itemsApi } from '@/lib/api-client';
import { Item } from '@/types/item';
import { toast } from 'sonner';
import { Calendar, Gift, Flame, CheckCircle, Clock } from 'lucide-react';

interface DailyReward {
  day: number;
  rewards: {
    gold?: number;
    exp?: number;
    items?: Array<{
      itemId: number;
      quantity: number;
    }>;
  };
}

interface StreakReward {
  streak: number;
  rewards: {
    gold?: number;
    exp?: number;
    items?: Array<{
      itemId: number;
      quantity: number;
    }>;
  };
}

interface DailyLoginConfig {
  id: number;
  year: number;
  month: number;
  enabled: boolean;
  metadata: {
    dailyRewards: DailyReward[];
    streakRewards: StreakReward[];
  };
}

interface UserStatus {
  canClaim: boolean;
  currentStreak: number;
}

interface DailyLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DailyLoginModal({ open, onOpenChange }: DailyLoginModalProps) {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Fetch user status
  const { data: status, isLoading: statusLoading } = useQuery<UserStatus>({
    queryKey: ['daily-login-status'],
    queryFn: async () => {
      const response = await dailyLoginApi.getStatus();
      return response;
    },
    enabled: open,
  });

  // Fetch current config
  const { data: configData, isLoading: configLoading } = useQuery<{ config: DailyLoginConfig | null }>({
    queryKey: ['daily-login-config'],
    queryFn: async () => {
      const response = await dailyLoginApi.getConfig();
      return response;
    },
    enabled: open,
  });

  // Fetch all items for name mapping
  const { data: items } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => {
      try {
        const response = await itemsApi.getItems();
        console.log('Items API response:', response);
        // API returns array directly
        if (Array.isArray(response)) {
          return response;
        }
        console.warn('Unexpected items API response format:', response);
        return [];
      } catch (error) {
        console.error('Failed to fetch items:', error);
        throw error;
      }
    },
    enabled: open,
    retry: 1,
  });

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await dailyLoginApi.claim();
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-login-status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Refresh user data for gold/exp updates
      toast.success('Đã nhận quà thành công!');
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Không thể nhận quà');
    },
  });

  const config = configData?.config;
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Check if config is for current month
  const isCurrentMonth = config && config.year === currentYear && config.month === currentMonth;

  const handleClaim = () => {
    if (status?.canClaim) {
      claimMutation.mutate();
    }
  };

  const getDayReward = (day: number) => {
    if (!config?.metadata?.dailyRewards) return null;
    return config.metadata.dailyRewards.find(r => r.day === day);
  };

  const renderReward = (reward: { gold?: number; exp?: number; items?: Array<{ itemId: number; quantity: number }> }) => {
    const parts = [];
    if (reward.gold) parts.push(`${reward.gold} vàng`);
    if (reward.exp) parts.push(`${reward.exp} EXP`);
    if (reward.items && reward.items.length > 0) {
      parts.push(`${reward.items.length} vật phẩm`);
    }
    return parts.join(', ');
  };

  if (statusLoading || configLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Đang tải...</DialogTitle>
            <DialogDescription>Đang tải thông tin đăng nhập hằng ngày</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Đang tải...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Đăng nhập hằng ngày
          </DialogTitle>
          <DialogDescription>
            Nhận quà mỗi ngày và duy trì chuỗi đăng nhập để nhận phần thưởng đặc biệt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Day Reward Info */}
          {selectedDay && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Phần thưởng ngày {selectedDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const reward = getDayReward(selectedDay);
                  if (reward) {
                    return (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {reward.rewards.gold && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <span className="text-yellow-600">💰</span>
                              {reward.rewards.gold} vàng
                            </Badge>
                          )}
                          {reward.rewards.exp && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <span className="text-blue-600">⭐</span>
                              {reward.rewards.exp} EXP
                            </Badge>
                          )}
                          {reward.rewards.items && reward.rewards.items.length > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <span className="text-green-600">📦</span>
                              {reward.rewards.items.length} vật phẩm
                            </Badge>
                          )}
                        </div>
                        {reward.rewards.items && reward.rewards.items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Chi tiết vật phẩm:</p>
                            <div className="space-y-1">
                              {reward.rewards.items.map((item, idx) => {
                                const itemName = items?.find(i => i.id === item.itemId)?.name || `Item ${item.itemId}`;
                                return (
                                  <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                    • {itemName} x{item.quantity}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p className="text-gray-500">Không có phần thưởng cho ngày này</p>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Status and Streak */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold">Chuỗi: {status?.currentStreak || 0} ngày</span>
              </div>
              {status?.canClaim ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Có thể nhận quà
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Đã nhận hôm nay
                </Badge>
              )}
            </div>
            <Button
              onClick={handleClaim}
              disabled={!status?.canClaim || claimMutation.isPending}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Gift className="w-4 h-4" />
              {claimMutation.isPending ? 'Đang nhận...' : 'Nhận quà'}
            </Button>
          </div>

          {/* Current Month Calendar */}
          {isCurrentMonth && config && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Phần thưởng tháng {config.month}/{config.year}
                </CardTitle>
                <CardDescription>
                  Nhận quà mỗi ngày để duy trì chuỗi thưởng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                    <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Calculate first day of month */}
                  {(() => {
                    const firstDay = new Date(config.year, config.month - 1, 1).getDay();
                    const daysInMonth = new Date(config.year, config.month, 0).getDate();
                    const cells = [];

                    // Empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<div key={`empty-${i}`} className="h-8 sm:h-12"></div>);
                    }

                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const reward = getDayReward(day);
                      const isToday = day === currentDay;
                      const isPast = day < currentDay;
                      const isSelected = selectedDay === day;
                      const hasReward = !!reward;

                      cells.push(
                        <button
                          key={day}
                          onClick={() => setSelectedDay(isSelected ? null : day)}
                          className={`h-8 sm:h-12 w-full border rounded-md text-center flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : isToday
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                              : isPast
                              ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-400'
                              : hasReward
                              ? 'border-green-300 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-300'
                              : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{day}</span>
                            {hasReward && !isSelected && (
                              <div className="w-1 h-1 bg-green-500 rounded-full mt-0.5"></div>
                            )}
                          </div>
                        </button>
                      );
                    }

                    return cells;
                  })()}
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Có quà</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Hôm nay</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Streak Rewards */}
          {config?.metadata?.streakRewards && config.metadata.streakRewards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Phần thưởng chuỗi
                </CardTitle>
                <CardDescription>
                  Phần thưởng đặc biệt khi duy trì chuỗi đăng nhập
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {config.metadata.streakRewards
                    .sort((a, b) => a.streak - b.streak)
                    .map((streakReward) => {
                      const isAchieved = (status?.currentStreak || 0) >= streakReward.streak;
                      return (
                        <div
                          key={streakReward.streak}
                          className={`p-3 border rounded-lg ${
                            isAchieved
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{streakReward.streak} ngày</span>
                            {isAchieved && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {renderReward(streakReward.rewards)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No config message */}
          {!isCurrentMonth && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Chưa có cấu hình phần thưởng cho tháng này
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}