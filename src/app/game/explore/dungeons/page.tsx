"use client";
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { RoomLobby } from '@/types';

// room APIs sometimes return a nested `dungeon` object or a flat shape
// with `dungeonId` and `dungeonName`. Use LooseRoom to accept both.
type LooseRoom = RoomLobby & { dungeonId?: number; dungeonName?: string };
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import CreateRoomForm from './[id]/CreateRoomForm';

export default function DungeonsPage() {
  const router = useRouter();
  const { data: dungeons = [], isLoading } = useQuery({ queryKey: ['dungeons'], queryFn: () => apiService.getDungeons() });
  const [filterText, setFilterText] = useState('');
  const [minLevel, setMinLevel] = useState<number | ''>('');

  const filtered = (dungeons || []).filter(d => {
    if (filterText && !d.name.toLowerCase().includes(filterText.toLowerCase())) return false;
    if (minLevel !== '' && d.levelRequirement < (minLevel as number)) return false;
    return true;
  });

  const [creatingDungeonId, setCreatingDungeonId] = useState<number | null>(null);

  const handleCreated = (room: RoomLobby) => {
    // after room created, navigate into its waiting room
    const dungeonId = room?.dungeon?.id ?? creatingDungeonId;
    setCreatingDungeonId(null);
    if (room?.id && dungeonId) {
      router.push(`/game/explore/dungeons/${dungeonId}/rooms/${room.id}`);
    }
  };

  const [showAllRooms, setShowAllRooms] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // rooms list for sheet
  const { data: allRooms = [], isLoading: roomsLoading } = useQuery({ queryKey: ['room-lobbies'], queryFn: () => apiService.getRoomLobbies() });

  const openRoomsSheet = () => setShowAllRooms(true);
  const closeRoomsSheet = () => setShowAllRooms(false);

  return (
    <>
    <div className="p-6">
  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Hầm Ngục</h1>
  <div className="flex flex-wrap items-center space-x-2">
          <input
            placeholder="Tìm theo tên..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            placeholder="Cấp tối thiểu"
            value={minLevel === '' ? '' : minLevel}
            onChange={(e) => setMinLevel(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-32 px-3 py-2 border rounded-md"
            type="number"
            min={1}
          />
          <Button onClick={() => { setFilterText(''); setMinLevel(''); }}>Xóa lọc</Button>
          {/* Button to open sheet showing all room lobbies */}
          <Button variant="outline" onClick={openRoomsSheet} className="hidden sm:inline-flex">Phòng đang có</Button>
          {/* Mobile-friendly trigger - small icon/button */}
          <Button variant="outline" onClick={openRoomsSheet} className="sm:hidden">Phòng</Button>
        </div>
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>Đang tải...</div>
        ) : (
          filtered.map((d) => {
            // derive count of rooms for this dungeon from allRooms
            // API may return either a nested `dungeon` object or flat `dungeonId` field.
            const roomCount = roomsLoading ? null : (allRooms || []).filter((r: LooseRoom) => {
              const rid = r.dungeon?.id ?? r.dungeonId;
              return rid === d.id;
            }).length;
            return (
            <Card key={d.id} className="hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{d.name}</span>
                  <span className="text-sm text-muted-foreground">{roomCount === null ? 'Đang tải...' : `${roomCount} phòng chờ`}</span>
                </CardTitle>
                <CardDescription>Lv. {d.levelRequirement} • {d.description || 'Không có mô tả'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm">Yêu cầu cấp: {d.levelRequirement}</div>
                  </div>
                  <div className="flex space-x-2">

                    {/* Create room dialog (controlled) */}
                    <Button onClick={() => setCreatingDungeonId(d.id)}>Tạo phòng</Button>
                    <Dialog open={creatingDungeonId === d.id} onOpenChange={(open) => { if (!open) setCreatingDungeonId(null); }}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tạo phòng cho {d.name}</DialogTitle>
                        </DialogHeader>
                        <CreateRoomForm initialDungeonId={d.id} onCreated={handleCreated} />
                      </DialogContent>
                    </Dialog>

                    <Button onClick={() => router.push(`/game/explore/dungeons/${d.id}`)}>Xem phòng đợi</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })
        )}
      </div>
    </div>
    {/* Sheet listing all rooms (responsive) */}
    <Sheet open={showAllRooms} onOpenChange={(open) => setShowAllRooms(open)}>
      <SheetContent side={isMobile ? 'bottom' : 'right'}>
        <SheetHeader>
          <SheetTitle>Phòng đang hoạt động</SheetTitle>
          <SheetDescription>Danh sách tất cả các phòng chờ hiện có</SheetDescription>
        </SheetHeader>
        <div className="p-4 overflow-y-auto">
          {roomsLoading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="space-y-3">
              {allRooms.length === 0 && <div className="text-sm text-gray-500">Không có phòng nào đang hoạt động</div>}
              {allRooms.map((r: LooseRoom) => {
                // resolve dungeon info from nested object or from global `dungeons` list via dungeonId
                const sheetDungeon = r.dungeon ?? dungeons.find((dd) => dd.id === r.dungeonId);
                const dungeonName = sheetDungeon?.name ?? r.dungeonName ?? 'N/A';
                const dungeonLevel = sheetDungeon?.levelRequirement ?? '–';
                const dungeonIdForUrl = sheetDungeon?.id ?? r.dungeonId ?? '';
                return (
                <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    {/* show resolved dungeon name/level */}
                    <div className="text-sm text-gray-500">Dungeon: {dungeonName} • Lv {dungeonLevel}</div>
                    <div className="text-sm text-gray-500">{r.currentPlayers}/{r.maxPlayers} người</div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:space-x-2">
                    <Button size="sm" onClick={() => { closeRoomsSheet(); router.push(`/game/explore/dungeons/${dungeonIdForUrl}/rooms/${r.id}`); }}>Vào</Button>
                    <Button variant="ghost" size="sm" onClick={async () => {
                      try {
                        const url = `${window.location.origin}/game/explore/dungeons/${dungeonIdForUrl}/rooms/${r.id}`;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(url);
                        } else {
                          // fallback
                          window.prompt('Sao chép liên kết:', url);
                        }
                        toast.success('Đã sao chép liên kết');
                      } catch {
                        toast.error('Không thể sao chép liên kết');
                      }
                    }}>Sao chép</Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
