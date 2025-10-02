"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiService } from '@/lib/api-service';
import { RoomLobby } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Props {
  initialDungeonId: number;
  onCreated: (room: RoomLobby) => void;
}

interface UserItem {
  itemId: number;
  quantity: number;
}

export default function CreateRoomForm({ initialDungeonId, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('Phòng mới');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Query dungeon info to get required item
  const { data: dungeon } = useQuery({
    queryKey: ['dungeon', initialDungeonId],
    queryFn: async () => {
      try {
        const response = await api.get(`/dungeons/${initialDungeonId}`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch dungeon:', error);
        return null;
      }
    },
    enabled: !!initialDungeonId,
  });

  // Query required item info to get item name
  const { data: requiredItem } = useQuery({
    queryKey: ['item', dungeon?.requiredItem],
    queryFn: async () => {
      if (!dungeon?.requiredItem) return null;
      try {
        const response = await api.get(`/items/${dungeon.requiredItem}`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch required item:', error);
        return null;
      }
    },
    enabled: !!dungeon?.requiredItem,
  });

  // Query user inventory to check if they have the required item
  const { data: userInventory } = useQuery({
    queryKey: ['user-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await api.get(`/user-items/${user.id}`);
        const data = response.data || [];
        console.log('User inventory data:', data, 'Type:', typeof data, 'Is array:', Array.isArray(data));
        // Handle both array and object responses
        if (Array.isArray(data)) {
          return data;
        } else if (data && typeof data === 'object') {
          // If it's an object with items property, return that
          return data.items || [];
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch user inventory:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Check if user has required item
  const hasRequiredItem = React.useMemo(() => {
    if (!dungeon?.requiredItem || !userInventory) return true; // No requirement or no data yet
    
    // Ensure userInventory is an array
    const inventoryArray = Array.isArray(userInventory) ? userInventory : [];
    console.log('Checking inventory:', inventoryArray, 'for item:', dungeon.requiredItem);
    
    const userItem = inventoryArray.find((item: UserItem) => item.itemId === dungeon.requiredItem);
    const hasItem = userItem && userItem.quantity > 0;
    console.log('User item found:', userItem, 'Has required item:', hasItem);
    return hasItem;
  }, [dungeon?.requiredItem, userInventory]);

  // Show warning if user doesn't have required item
  useEffect(() => {
    if (dungeon?.requiredItem && requiredItem && userInventory && !hasRequiredItem) {
      toast.warning(
        `Cảnh báo: Bạn không có đủ ${requiredItem.name} để vào hầm ngục này. Bạn vẫn có thể tạo phòng nhưng sẽ không thể bắt đầu trận chiến.`,
        { duration: 8000 }
      );
    }
  }, [dungeon?.requiredItem, requiredItem, userInventory, hasRequiredItem]);

  async function handleCreate() {
    setLoading(true);
    try {
      if (!user?.id) {
        toast.error('Người chơi chưa đăng nhập');
        setLoading(false);
        return;
      }
      if (isPrivate && !password) {
        toast.error('Phòng riêng tư cần mật khẩu');
        setLoading(false);
        return;
      }

      const room = await apiService.createRoomLobby({
        hostId: Number(user.id),
        dungeonId: initialDungeonId,
        name,
        maxPlayers,
        isPrivate,
        password: isPrivate ? password : undefined,
      });
      // If private, store the password briefly so socket auto-join can use it
      try {
        if (isPrivate && room?.id && password) {
          sessionStorage.setItem(`room:${room.id}:password`, password);
        }
      } catch {
        // ignore sessionStorage errors
      }
      onCreated(room);
    } catch (err) {
      console.error('Failed to create room', err);
      
      // Enhanced error handling to show specific item names
      let errorMessage = 'Failed to create room';
      if (err instanceof Error && err.message) {
        errorMessage = err.message;
        
        // If the error mentions "Thiếu vật phẩm" and we have required item info, enhance the message
        if (errorMessage.includes('Thiếu vật phẩm') && requiredItem?.name) {
          errorMessage = `Thiếu ${requiredItem.name} để vào hầm ngục này`;
        }
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-3">
      {/* Required Item Warning */}
      {dungeon?.requiredItem && requiredItem && (
        <div className={`p-3 rounded-lg border ${hasRequiredItem ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${hasRequiredItem ? 'text-green-800' : 'text-red-800'}`}>
              {hasRequiredItem ? '✅' : '⚠️'} 
              {hasRequiredItem 
                ? `Bạn có đủ ${requiredItem.name} để vào hầm ngục này` 
                : `Bạn thiếu ${requiredItem.name} để vào hầm ngục này`}
            </span>
          </div>
          {!hasRequiredItem && (
            <p className="text-xs text-red-600 mt-1">
              Bạn vẫn có thể tạo phòng nhưng sẽ không thể bắt đầu trận chiến cho đến khi có đủ item.
            </p>
          )}
        </div>
      )}
      
      <div>
        <label className="block text-sm">Tên phòng</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Số người tối đa</label>
        <input type="number" min={1} max={10} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} className="w-32 px-2 py-1 border rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm">Phòng riêng tư</label>
          <p className="text-xs text-gray-500">Bật để chỉ người có mật khẩu mới vào được</p>
        </div>
        <Switch checked={isPrivate} onCheckedChange={(val) => setIsPrivate(Boolean(val))} />
      </div>

      {isPrivate && (
        <div>
          <label className="block text-sm">Mật khẩu</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-2 py-1 border rounded" />
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo'}</Button>
      </div>
    </div>
  );
}
