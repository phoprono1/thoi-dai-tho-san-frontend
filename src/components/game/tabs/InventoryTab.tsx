'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sword,
  Shield,
  Gem,
  Heart,
  Shirt,
  Coins,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { UserItem } from '@/types';

export default function InventoryTab() {
  const [selectedItem, setSelectedItem] = useState<UserItem | null>(null);
  const { user: authUser, isAuthenticated } = useAuth();

  // Get user ID from authentication
  const userId = authUser?.id;

  // Fetch user items using TanStack Query
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['user-items', userId],
    queryFn: () => apiService.getUserItems(userId!),
    enabled: !!userId && isAuthenticated,
  });

  // If not authenticated, show message
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem kho đồ</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Không thể tải dữ liệu kho đồ</p>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleEquipItem = async (userItem: UserItem) => {
    try {
      await apiService.equipItem(userItem.id, !userItem.isEquipped);
      toast.success(userItem.isEquipped ? 'Đã tháo vật phẩm' : 'Đã mặc vật phẩm');
      // Refetch items
      // This would trigger a refetch in a real implementation
    } catch (error) {
      toast.error('Không thể thực hiện thao tác');
    }
  };

  const handleUseItem = async (userItem: UserItem) => {
    try {
      await apiService.useConsumableItem(userItem.id);
      toast.success('Đã sử dụng vật phẩm');
      // Refetch items
    } catch (error) {
      toast.error('Không thể sử dụng vật phẩm');
    }
  };

  const handleSellItem = async (userItem: UserItem) => {
    // TODO: Implement sell item logic
    toast.info('Tính năng bán vật phẩm đang được phát triển');
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="weapon">Vũ khí</TabsTrigger>
          <TabsTrigger value="armor">Giáp</TabsTrigger>
          <TabsTrigger value="accessory">Phụ kiện</TabsTrigger>
          <TabsTrigger value="consumable">Tiêu hao</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {items.map((userItem) => {
              const item = userItem.item;
              return (
                <Card
                  key={userItem.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    userItem.isEquipped ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedItem(userItem)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Sword className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">{item.name}</h3>
                          {userItem.isEquipped && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              Đã mặc
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                            {item.rarity}
                          </Badge>
                          <span className="text-xs text-gray-500">Lv.{item.level}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Other tabs with filtered items */}
        {['weapon', 'armor', 'accessory', 'consumable'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {items
                .filter((userItem) => userItem.item.type === type)
                .map((userItem) => {
                  const item = userItem.item;
                  return (
                    <Card
                      key={userItem.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        userItem.isEquipped ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedItem(userItem)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Sword className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-sm truncate">{item.name}</h3>
                              {userItem.isEquipped && (
                                <Badge variant="secondary" className="text-xs ml-2">
                                  Đã mặc
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                                {item.rarity}
                              </Badge>
                              <span className="text-xs text-gray-500">Lv.{item.level}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Sword className="h-8 w-8 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedItem.item.name}</CardTitle>
                    <CardDescription>
                      Level {selectedItem.item.level} • {selectedItem.item.rarity}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Item Stats */}
              {selectedItem.item.stats && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Thuộc tính:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedItem.item.stats).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">+{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade Stats */}
              {selectedItem.upgradeStats && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Thuộc tính nâng cấp:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedItem.upgradeStats).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">+{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {selectedItem.item.type !== 'consumable' ? (
                  <Button
                    className="flex-1"
                    onClick={() => handleEquipItem(selectedItem)}
                    variant={selectedItem.isEquipped ? "outline" : "default"}
                  >
                    {selectedItem.isEquipped ? 'Tháo ra' : 'Mặc vào'}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => handleUseItem(selectedItem)}
                  >
                    Sử dụng
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSellItem(selectedItem)}
                >
                  <Coins className="h-4 w-4 mr-1" />
                  Bán
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
