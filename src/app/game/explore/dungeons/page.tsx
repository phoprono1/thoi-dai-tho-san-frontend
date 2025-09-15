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
  const [sortAsc, setSortAsc] = useState(true); // true: low->high, false: high->low
  const { data: dungeons = [], isLoading, refetch } = useQuery({
    queryKey: ['dungeons', sortAsc],
    queryFn: async () => {
      try {
        // Try to fetch eligible dungeons for authenticated users first
        return await apiService.getEligibleDungeons();
      } catch {
        // Fallback to public list (unauthenticated or other error)
        return await apiService.getDungeons();
      }
    },
  });
  const [filterText, setFilterText] = useState('');
  const [minLevel, setMinLevel] = useState<number | ''>('');

  const filtered = (dungeons || [])
    .filter((d) => {
      if (filterText && !d.name.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (minLevel !== '' && d.levelRequirement < (minLevel as number)) return false;
      return true;
    })
    .sort((a, b) => (sortAsc ? a.levelRequirement - b.levelRequirement : b.levelRequirement - a.levelRequirement));

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
  <div className="mb-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Hầm Ngục</h1>
      <div className="flex items-center space-x-2">
        {/* sort toggle */}
        <Button
          variant="ghost"
          onClick={() => setSortAsc((s) => !s)}
          title={sortAsc ? 'Sắp xếp: thấp -> cao' : 'Sắp xếp: cao -> thấp'}
        >
          {/* simple up/down arrows */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            {sortAsc ? (
              <>
                <path d="M12 19V6" />
                <path d="M5 12l7-7 7 7" />
              </>
            ) : (
              <>
                <path d="M12 5v13" />
                <path d="M19 12l-7 7-7-7" />
              </>
            )}
          </svg>
        </Button>
        <Button variant="ghost" onClick={() => { setFilterText(''); setMinLevel(''); }}>Xóa lọc</Button>
        <Button variant="outline" onClick={openRoomsSheet} className="hidden sm:inline-flex">Phòng đang có</Button>
        <Button variant="outline" onClick={openRoomsSheet} className="sm:hidden">Phòng</Button>
        <Button variant="ghost" onClick={() => refetch()} title="Làm mới"> 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </Button>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        placeholder="Tìm theo tên..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 border rounded-md"
      />
      <input
        placeholder="Cấp tối thiểu"
        value={minLevel === '' ? '' : minLevel}
        onChange={(e) => setMinLevel(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-32 px-3 py-2 border rounded-md"
        type="number"
        min={1}
      />
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
      {/* limit sheet height on mobile to 75vh so it's scrollable and doesn't overflow the viewport */}
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? 'max-h-[75vh] overflow-y-auto' : ''}>
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
                <div key={r.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded shadow-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    {/* show resolved dungeon name/level in a single line on mobile */}
                    <div className="text-xs text-gray-500 truncate">{dungeonName} • Lv {dungeonLevel} • {r.currentPlayers}/{r.maxPlayers} người</div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:space-x-2 items-center">
                    <Button size="sm" className="whitespace-nowrap" onClick={() => { closeRoomsSheet(); router.push(`/game/explore/dungeons/${dungeonIdForUrl}/rooms/${r.id}`); }}>Vào</Button>
                    <Button variant="ghost" size="sm" className="mt-1 sm:mt-0" onClick={async () => {
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
