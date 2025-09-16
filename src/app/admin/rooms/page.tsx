'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Room = {
  id: number;
  name: string;
  dungeonId?: number;
  dungeonName?: string | null;
  maxPlayers: number;
  status: string;
  host?: { id: number; username: string } | null;
  isPrivate?: boolean;
  currentPlayers: number;
  createdAt: string;
};

export default function AdminRoomsPage() {
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = React.useState<boolean>(true);

  function extractErrorMessage(e: unknown, fallback = 'Lỗi không xác định') {
    if (e && typeof e === 'object' && e !== null) {
      const ex = e as { response?: { data?: { message?: string } } };
      if (ex.response && ex.response.data && typeof ex.response.data.message === 'string') {
        return ex.response.data.message;
      }
    }
    return fallback;
  }

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: async () => {
      const res = await adminApiEndpoints.getRooms();
      return res.data;
    },
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (roomId: number) => adminApiEndpoints.adminCancelRoom(roomId),
    onSuccess: () => {
      toast.success('Đã hủy phòng');
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
    },
    onError: (e: unknown) => {
      toast.error(extractErrorMessage(e, 'Lỗi khi hủy phòng'));
    },
  });

  const bulkMutation = useMutation({
    mutationFn: () => adminApiEndpoints.adminBulkCancelEmpty(),
    onSuccess: (res: { data?: { cancelled?: number[] } } | unknown) => {
      const r = res as { data?: { cancelled?: number[] } };
      const cancelled = r.data?.cancelled || [];
      toast.success(`Hủy ${cancelled.length} phòng trống`);
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
    },
    onError: (e: unknown) => {
      toast.error(extractErrorMessage(e, 'Lỗi khi hủy hàng loạt'));
    },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Quản lý phòng chờ</h2>
      <div className="mb-4">
        <Button onClick={() => bulkMutation.mutate()} disabled={bulkMutation.status === 'pending'}>
          Hủy tất cả phòng đang trống
        </Button>
        <label className="ml-4 inline-flex items-center">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="mr-2"
          />
          Hiện tất cả phòng (bao gồm có người)
        </label>
      </div>

      {isLoading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {rooms
            .filter((r: Room) => (showAll ? true : r.currentPlayers > 0))
            .map((r: Room) => (
            <div key={r.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{r.name} • Host: {r.host?.username}</div>
                <div className="text-sm text-gray-500">Status: {r.status} • Players: {r.currentPlayers}/{r.maxPlayers}</div>
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (r.currentPlayers > 0) {
                      if (!confirm(`Phòng hiện có ${r.currentPlayers} người. Bạn có chắc muốn hủy phòng ${r.name}?`)) return;
                    }
                    cancelMutation.mutate(r.id);
                  }}
                  disabled={cancelMutation.status === 'pending'}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
