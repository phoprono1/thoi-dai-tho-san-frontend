"use client";
import React, { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { apiService } from '@/lib/api-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RoomLobby } from '@/types';

const CreateRoomForm = lazy(() => import('./CreateRoomForm'));

export default function DungeonLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const dungeonId = Number(params?.id || 0);
  type LooseRoom = RoomLobby & { dungeonId?: number; dungeonName?: string; dungeon?: { id?: number } };
  const { data: lobbies = [], isLoading } = useQuery<RoomLobby[]>({
    queryKey: ['roomLobbies', dungeonId],
    queryFn: async () => {
      const list = await apiService.getRoomLobbies();
      return (list || []).filter((r: LooseRoom) => {
        const rid = r?.dungeon?.id ?? r?.dungeonId;
        return rid === dungeonId;
      });
    },
    enabled: !!dungeonId,
  });
  // lobbies is already filtered/normalized by the queryFn above

  const [creating, setCreating] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phòng chờ hầm ngục</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreating(true)}>Tạo phòng mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo phòng</DialogTitle>
            </DialogHeader>
            <Suspense fallback={<div>Đang tải form...</div>}>
              <CreateRoomForm
                initialDungeonId={dungeonId}
                onCreated={(room: RoomLobby) => {
                  setCreating(false);
                  // go to the canonical nested room path
                  router.push(`/game/explore/dungeons/${dungeonId}/rooms/${room.id}`);
                }}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>Đang tải...</div>
        ) : lobbies.length === 0 ? (
          <div>Không có phòng chờ cho hầm ngục này.</div>
        ) : (
          lobbies.map(l => (
            <Card key={l.id} className="hover:shadow-md">
              <CardHeader>
                <CardTitle>{l.name}</CardTitle>
                <CardDescription>Host: {l.host.username} • {l.status}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm">{l.currentPlayers}/{l.maxPlayers} người</div>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push(`/game/explore/dungeons/${dungeonId}/rooms/${l.id}`)}>Vào phòng</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
