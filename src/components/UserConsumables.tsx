'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Heart, Zap, Star, Pill } from 'lucide-react';
import { UserItem, ItemType, ConsumableType } from '@/types/game';

export default function UserConsumables() {
  const queryClient = useQueryClient();

  // Fetch user's consumable items
  const { data: consumables, isLoading } = useQuery({
    queryKey: ['userConsumables'],
    queryFn: async (): Promise<UserItem[]> => {
      try {
        const response = await api.get('/user-items');
        const allItems = response.data || [];
        return allItems.filter((item: UserItem) =>
          item.item.type === ItemType.CONSUMABLE && item.quantity > 0
        );
      } catch (error) {
        console.error('Failed to fetch consumables:', error);
        return [];
      }
    },
  });

  // Use consumable mutation
  const useConsumableMutation = useMutation({
    mutationFn: async (userItemId: number) => {
      const response = await api.post(`/user-items/use/${userItemId}`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Item đã được sử dụng thành công!');
      queryClient.invalidateQueries({ queryKey: ['userConsumables'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi sử dụng item');
    },
  });

  const handleUseConsumable = (userItemId: number, itemName: string) => {
    if (confirm(`Bạn có chắc muốn sử dụng ${itemName}?`)) {
      useConsumableMutation.mutate(userItemId);
    }
  };

  const getConsumableIcon = (type: ConsumableType) => {
    switch (type) {
      case ConsumableType.HP_POTION:
        return <Heart className="w-5 h-5 text-red-500" />;
      case ConsumableType.MP_POTION:
        return <Zap className="w-5 h-5 text-blue-500" />;
      case ConsumableType.EXP_POTION:
        return <Star className="w-5 h-5 text-yellow-500" />;
      case ConsumableType.STAT_BOOST:
        return <Pill className="w-5 h-5 text-purple-500" />;
      default:
        return <Pill className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConsumableDescription = (item: UserItem) => {
    const { consumableType, consumableValue } = item.item;
    switch (consumableType) {
      case ConsumableType.HP_POTION:
        return `Khôi phục ${consumableValue} HP`;
      case ConsumableType.MP_POTION:
        return `Khôi phục ${consumableValue} MP`;
      case ConsumableType.EXP_POTION:
        return `Nhận ${consumableValue} EXP`;
      case ConsumableType.STAT_BOOST:
        return `Tăng stats trong ${item.item.duration} phút`;
      default:
        return 'Consumable item';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải consumables...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consumable Items</h1>
          <p className="text-gray-600 mt-2">Sử dụng các item tiêu hao để tăng cường sức mạnh</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consumables?.map((userItem) => (
            <Card key={userItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getConsumableIcon(userItem.item.consumableType!)}
                    <div>
                      <CardTitle className="text-lg">{userItem.item.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {getConsumableDescription(userItem)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    x{userItem.quantity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Rarity:</span>
                    <Badge
                      className={
                        userItem.item.rarity === 1 ? 'bg-gray-500' :
                        userItem.item.rarity === 2 ? 'bg-green-500' :
                        userItem.item.rarity === 3 ? 'bg-blue-500' :
                        userItem.item.rarity === 4 ? 'bg-purple-500' :
                        'bg-yellow-500'
                      }
                    >
                      {userItem.item.rarity === 1 ? 'Common' :
                       userItem.item.rarity === 2 ? 'Uncommon' :
                       userItem.item.rarity === 3 ? 'Rare' :
                       userItem.item.rarity === 4 ? 'Epic' : 'Legendary'}
                    </Badge>
                  </div>

                  {userItem.item.consumableType === ConsumableType.STAT_BOOST && (
                    <div className="text-xs text-gray-500">
                      {userItem.item.stats.strength && `STR: +${userItem.item.stats.strength} `}
                      {userItem.item.stats.intelligence && `INT: +${userItem.item.stats.intelligence} `}
                      {userItem.item.stats.dexterity && `DEX: +${userItem.item.stats.dexterity} `}
                      {userItem.item.stats.vitality && `VIT: +${userItem.item.stats.vitality} `}
                      {userItem.item.stats.luck && `LUK: +${userItem.item.stats.luck} `}
                    </div>
                  )}

                  <Button
                    onClick={() => handleUseConsumable(userItem.id, userItem.item.name)}
                    disabled={useConsumableMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    {useConsumableMutation.isPending ? 'Đang sử dụng...' : 'Sử dụng'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!consumables || consumables.length === 0) && (
            <div className="col-span-full text-center py-12">
              <Pill className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Không có consumable items
              </h3>
              <p className="text-gray-500">
                Bạn chưa có consumable items nào. Hãy mua từ shop hoặc nhận từ quest!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
