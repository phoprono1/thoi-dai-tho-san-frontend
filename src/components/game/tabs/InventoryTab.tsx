 'use client';

import { useState, useEffect } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { UserItem } from '@/types';
import { useUserStatusStore } from '@/stores/user-status.store';

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

  const queryClient = useQueryClient();
  const setEquippedItems = useUserStatusStore((s) => s.setEquippedItems);

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

  // Render correct icon based on item type
  const renderItemIcon = (type: string | undefined, className = 'h-6 w-6 text-gray-600') => {
    switch (type) {
      case 'weapon':
        return <Sword className={className} />;
      case 'armor':
        return <Shield className={className} />;
      case 'accessory':
        return <Gem className={className} />;
      case 'consumable':
        return <Heart className={className} />;
      default:
        return <Sword className={className} />;
    }
  };

  const handleEquipItem = async (userItem: UserItem) => {
    try {
      const resp = await apiService.equipItem(userItem.id, !userItem.isEquipped);
      // api returns { success, message, userItem } or the updated userItem directly
      let updatedUserItem: UserItem | null = null;
      if (resp && typeof resp === 'object') {
        const asObj = resp as Record<string, unknown>;
        if (asObj.userItem && typeof asObj.userItem === 'object') {
          updatedUserItem = asObj.userItem as UserItem;
        } else {
          updatedUserItem = resp as unknown as UserItem;
        }
      }
      toast.success(userItem.isEquipped ? 'Đã tháo vật phẩm' : 'Đã mặc vật phẩm');
      // Invalidate queries so UI refreshes equipped items and stats
      if (userId) {
        // Invalidate both naming styles used across the app
        queryClient.invalidateQueries({ queryKey: ['user-items', userId] });
        queryClient.invalidateQueries({ queryKey: ['userItems', userId] });
        queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user', userId] });
        // Invalidate higher-level combined/user status queries so StatusTab updates
        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
        queryClient.invalidateQueries({ queryKey: ['equipped-items', userId] });
        // Update zustand store and react-query cache immediately for snappy UI
        try {
          const currently = useUserStatusStore.getState().equippedItems || [];
          if (!updatedUserItem) {
            // nothing to do
            return;
          }

          let newEquipped: UserItem[] = [];
          if (updatedUserItem.isEquipped) {
            // unequip any item of the same type, then add the updated one
            newEquipped = currently.filter((it) => it.item.type !== updatedUserItem.item.type).concat(updatedUserItem);
          } else {
            // remove the item from equipped list
            newEquipped = currently.filter((it) => it.id !== updatedUserItem.id);
          }
          // update zustand
          setEquippedItems(newEquipped);
          // update react-query caches
          queryClient.setQueryData(['equipped-items', userId], newEquipped);
          queryClient.setQueryData(['user-status', userId], (old: unknown) => {
            if (!old || typeof old !== 'object') return old;
            const oldObj = old as Record<string, unknown>;
            return { ...oldObj, equippedItems: newEquipped };
          });
        } catch (e) {
          // non-critical if cache update fails
          console.debug('cache update failed', e);
        }
        // Force refetch in case the queries had no active subscribers
        try {
          await queryClient.refetchQueries({ queryKey: ['user-status', userId], exact: true });
          await queryClient.refetchQueries({ queryKey: ['equipped-items', userId], exact: true });
        } catch {
          // ignore refetch errors
        }
        queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-stamina', userId] });
      }
    } catch {
      toast.error('Không thể thực hiện thao tác');
    }
  };

  const handleUseItem = async (userItem: UserItem) => {
    try {
      await apiService.useConsumableItem(userItem.id);
      toast.success('Đã sử dụng vật phẩm');
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['user-items', userId] });
        queryClient.invalidateQueries({ queryKey: ['userItems', userId] });
        queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
        queryClient.invalidateQueries({ queryKey: ['equipped-items', userId] });
        try {
          await queryClient.refetchQueries({ queryKey: ['user-status', userId], exact: true });
          await queryClient.refetchQueries({ queryKey: ['equipped-items', userId], exact: true });
        } catch {
          // ignore
        }
        queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-stamina', userId] });
      }
    } catch {
      toast.error('Không thể sử dụng vật phẩm');
    }
  };

  const handleSellItem = async () => {
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
                        {renderItemIcon(item.type, 'h-6 w-6 text-gray-600')}
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
                            {renderItemIcon(item.type, 'h-6 w-6 text-gray-600')}
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
        <div
          className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <Card
            className="w-full max-w-md bg-[var(--card)] text-[var(--card-foreground)]"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-[var(--secondary)] rounded-lg">
                    {renderItemIcon(selectedItem.item.type, 'h-8 w-8 text-[var(--accent)]')}
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
                  onClick={() => handleSellItem()}
                >
                  <Coins className="h-4 w-4 mr-1" />
                  Bán
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Close modal on Escape key */}
      {selectedItem && (
        <EscapeKeyListener onEscape={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

function EscapeKeyListener({ onEscape }: { onEscape: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);

  return null;
}
