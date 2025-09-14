"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiService } from '@/lib/api-service';
import { RoomLobby } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

interface Props {
  initialDungeonId: number;
  onCreated: (room: RoomLobby) => void;
}

export default function CreateRoomForm({ initialDungeonId, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('Phòng mới');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      // show friendly toast if we have an Error with message
      if (err instanceof Error && err.message) {
        toast.error(`Failed to create room: ${err.message}`);
      } else {
        toast.error('Failed to create room');
      }
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-3">
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
