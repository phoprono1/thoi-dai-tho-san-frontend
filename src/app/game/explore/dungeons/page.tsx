"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { RoomLobby, Dungeon, Item } from '@/types';

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

  // Fetch monster and item catalogs so we can render names for dungeon drops
  // typed shape returned by apiService.getAllMonsters
  type MonsterSummary = { id: number; name: string; level?: number; dropItems?: unknown[] };

  const { data: monsters = [], isLoading: monstersLoading } = useQuery<MonsterSummary[]>({ queryKey: ['monsters'], queryFn: () => apiService.getAllMonsters() });
  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({ queryKey: ['items'], queryFn: () => apiService.getItems() });

  const monsterMap = useMemo(() => new Map<number, string>((monsters || []).map((m) => [m.id, m.name])), [monsters]);
  const itemMap = useMemo(() => new Map<number, string>((items || []).map((i: Item) => [i.id, i.name])), [items]);
  // map monsterId -> array of drop items from that monster
  const monsterDropMap = useMemo(() => {
    const mm = new Map<number, Array<{ itemId: number; dropRate?: number }>>();
    (monsters || []).forEach((m: MonsterSummary) => {
      const drops: Array<{ itemId: number; dropRate?: number }> = [];
      const mDrops = (m.dropItems ?? []) as unknown[];
      if (Array.isArray(mDrops)) {
        mDrops.forEach((it) => {
          if (it && typeof it === 'object') {
            const rec = it as Record<string, unknown>;
            const itemObj = rec['item'] as Record<string, unknown> | undefined;
            const itemId = rec['itemId'] ?? rec['id'] ?? (itemObj && itemObj['id']);
            const dropRate = rec['dropRate'] ?? rec['rate'] ?? rec['chance'];
            const id = Number(itemId);
            if (!Number.isNaN(id)) drops.push({ itemId: id, dropRate: typeof dropRate === 'number' ? dropRate : undefined });
          }
        });
      }
      if (drops.length) mm.set(m.id, drops);
    });
    return mm;
  }, [monsters]);

  const renderDropPreview = (d: Dungeon) => {
    // collect monster ids
    const maybe = d as unknown as Record<string, unknown>;
    const monsterIds: number[] = [];
    if (Array.isArray(maybe.monsterIds)) {
      (maybe.monsterIds as unknown[]).forEach((v) => { if (typeof v === 'number') monsterIds.push(v); });
    } else if (Array.isArray(maybe.monsterCounts)) {
      (maybe.monsterCounts as unknown[]).forEach((mc) => {
        if (mc && typeof mc === 'object' && 'monsterId' in (mc as Record<string, unknown>)) {
          const id = Number((mc as Record<string, unknown>).monsterId);
          if (!Number.isNaN(id)) monsterIds.push(id);
        }
      });
    } else if (Array.isArray(maybe.monsters)) {
      (maybe.monsters as unknown[]).forEach((m) => {
        if (m && typeof m === 'object' && 'id' in (m as Record<string, unknown>)) {
          const id = Number((m as Record<string, unknown>).id);
          if (!Number.isNaN(id)) monsterIds.push(id);
        } else if (typeof m === 'number') {
          monsterIds.push(m as number);
        }
      });
    }

    const monsterNames = monsterIds.map((id) => monsterMap.get(id) ?? `Quái #${id}`);

    // collect item drops
    const dropItems: Array<{ itemId: number; dropRate?: number }> = [];
    // include drops from monsters (if any)
    monsterIds.forEach((mid) => {
      const mDrops = monsterDropMap.get(mid);
      if (Array.isArray(mDrops)) {
        mDrops.forEach((md) => dropItems.push({ itemId: md.itemId, dropRate: md.dropRate }));
      }
    });
    if (Array.isArray(maybe.dropItems)) {
      (maybe.dropItems as unknown[]).forEach((it) => {
                    if (it && typeof it === 'object') {
          const rec = it as Record<string, unknown>;
          const itemObj = rec['item'] as Record<string, unknown> | undefined;
          const itemId = rec['itemId'] ?? rec['id'] ?? (itemObj && itemObj['id']);
          const dropRate = rec['dropRate'] ?? rec['rate'] ?? rec['chance'];
          const id = Number(itemId);
          if (!Number.isNaN(id)) dropItems.push({ itemId: id, dropRate: typeof dropRate === 'number' ? dropRate : undefined });
        }
      });
    } else if (Array.isArray(maybe.loot)) {
      (maybe.loot as unknown[]).forEach((it) => {
        if (it && typeof it === 'object') {
          const rec = it as Record<string, unknown>;
          const itemObj = rec['item'] as Record<string, unknown> | undefined;
          const itemId = rec['itemId'] ?? rec['id'] ?? (itemObj && itemObj['id']);
          const dropRate = rec['dropRate'] ?? rec['rate'] ?? rec['chance'];
          const id = Number(itemId);
          if (!Number.isNaN(id)) dropItems.push({ itemId: id, dropRate: typeof dropRate === 'number' ? dropRate : undefined });
        }
      });
    }

    // include dungeon-level rewards (e.g., d.rewards.items) which may be names or ids
    const rewardNamesFromDungeon: string[] = [];
    const rewardsObj = maybe['rewards'] as Record<string, unknown> | undefined;
    if (rewardsObj && Array.isArray(rewardsObj['items'])) {
      (rewardsObj['items'] as unknown[]).forEach((it) => {
        if (typeof it === 'number') {
          // item id
          const id = it as number;
          dropItems.push({ itemId: id });
        } else if (typeof it === 'string') {
          // could be an item name or numeric id in string form
          const asNum = Number(it);
          if (!Number.isNaN(asNum)) {
            dropItems.push({ itemId: asNum });
          } else {
            rewardNamesFromDungeon.push(it);
          }
        }
      });
    }

    const itemNames = dropItems.map((di) => ({ name: itemMap.get(di.itemId) ?? `Vật phẩm #${di.itemId}`, rate: di.dropRate }));
    // append any explicit reward names from dungeon.rewards.items
  rewardNamesFromDungeon.forEach((n) => itemNames.push({ name: n, rate: undefined }));

    // dedupe itemNames by itemId/name, prefer higher drop rates when available
    const dedupMap = new Map<string, number | undefined>();
    const finalItems: Array<{ name: string; rate?: number }> = [];
    itemNames.forEach((it) => {
      const key = it.name;
      const existing = dedupMap.get(key);
      if (existing === undefined) {
        dedupMap.set(key, it.rate);
      } else if (it.rate !== undefined && (existing === undefined || it.rate > existing)) {
        dedupMap.set(key, it.rate);
      }
    });
    dedupMap.forEach((rate, name) => finalItems.push({ name, rate }));

    const shortParts: string[] = [];
    if (monsterNames.length) shortParts.push(`Quái: ${monsterNames.slice(0, 3).join(', ')}${monsterNames.length > 3 ? ', …' : ''}`);
    if (itemNames.length) shortParts.push(`Rơi: ${itemNames.slice(0, 3).map((it) => it.name).join(', ')}${itemNames.length > 3 ? ', …' : ''}`);
    const short = shortParts.join(' • ') || '';

  const fullLines: string[] = [];
  if (monsterNames.length) fullLines.push(`Quái: ${monsterNames.join(', ')}`);
  if (finalItems.length) fullLines.push(`Rơi: ${finalItems.map((it) => (it.rate ? `${it.name} (${Math.round(it.rate * 100)}%)` : it.name)).join(', ')}`);
  const full = fullLines.join('\n');

    // show loading if catalogs are still loading
    if (monstersLoading || itemsLoading) return { short: 'Đang tải...', full: 'Đang tải...' };

    return { short, full, items: finalItems };
  };


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
              if (rid !== d.id) return false;
              try {
                const status = String(r.status || '').toLowerCase();
                const current = Number(r.currentPlayers || 0);
                if (status === 'starting' && current === 0) return false;
              } catch {
                // ignore
              }
              return true;
            }).length;
            return (
            <Card key={d.id} className="hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{d.name}</span>
                  <span className="text-sm text-muted-foreground">{roomCount === null ? 'Đang tải...' : `${roomCount} phòng chờ`}</span>
                </CardTitle>
                <CardDescription>Lv. {d.levelRequirement} • {d.description || 'Không có mô tả'}</CardDescription>
                {/* Small muted italic line for monsters/drops. Hover to see full list (title attr used for tooltip). */}
                {(() => {
                  const p = renderDropPreview(d);
                  // helper to format item stats using the items catalog
                  const formatItemTooltip = (name: string, rate?: number) => {
                    // try to find item by name in catalog
                    const found = (items || []).find((it) => it.name === name) as Item | undefined;
                    const parts: string[] = [];
                    if (found) {
                      if (found.stats) {
                        const s = found.stats as Record<string, unknown>;
                        Object.entries(s).forEach(([k, v]) => {
                          if (v !== undefined && v !== null) parts.push(`${k}: ${String(v)}`);
                        });
                      }
                      if (found.type) parts.push(`Loại: ${found.type}`);
                      if (found.rarity) parts.push(`Hiếm: ${found.rarity}`);
                    }
                    if (rate !== undefined) parts.push(`Tỉ lệ rơi: ${Math.round(rate * 100)}%`);
                    return parts.join(' • ') || (rate !== undefined ? `Tỉ lệ rơi: ${Math.round(rate * 100)}%` : name);
                  };

                  // map rarity to badge colors (tailwind)
                  const rarityColor = (name: string) => {
                    const found = (items || []).find((it) => it.name === name) as Item | undefined;
                    const r = Number(found?.rarity ?? 1);
                    switch (Math.min(Math.max(Math.round(r), 1), 5)) {
                      case 5:
                        return 'bg-purple-600 text-white';
                      case 4:
                        return 'bg-indigo-600 text-white';
                      case 3:
                        return 'bg-sky-600 text-white';
                      case 2:
                        return 'bg-green-600 text-white';
                      default:
                        return 'bg-gray-200 text-gray-800';
                    }
                  };

                  return (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(p.items || []).slice(0, 8).map((it, idx) => (
                        <span
                          key={`${d.id}-item-${idx}`}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${rarityColor(it.name)}`}
                          title={formatItemTooltip(it.name, it.rate)}
                        >
                          {it.name}
                        </span>
                      ))}
                      {(p.items || []).length > 8 && (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">+{(p.items || []).length - 8} thêm</span>
                      )}
                    </div>
                  );
                })()}
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
              { /* Exclude rooms that are in 'starting' state with zero players (these are transient/closing) */ }
              {allRooms
                .filter((r: LooseRoom) => {
                  try {
                    const status = String(r.status || '').toLowerCase();
                    const current = Number(r.currentPlayers || 0);
                    // hide rooms that are 'starting' and have no players
                    if (status === 'starting' && current === 0) return false;
                    return true;
                  } catch {
                    return true;
                  }
                })
                .map((r: LooseRoom) => {
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
