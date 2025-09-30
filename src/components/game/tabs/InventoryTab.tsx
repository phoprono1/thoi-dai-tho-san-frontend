"use client";

import { useState, useEffect } from 'react';

// Add CSS for rarity effects
const rarityEffectStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes legendary-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
    50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.3); }
  }
  
  .rarity-legendary {
    animation: legendary-glow 2s ease-in-out infinite;
  }
  
  .rarity-epic {
    box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3);
  }
  
  .rarity-rare {
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = rarityEffectStyles;
  document.head.appendChild(styleElement);
}
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sword,
  Shield,
  Gem,
  Heart,
  Coins,
  RefreshCw,
  Loader2,
  Hand,
  Footprints
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { resolveAssetUrl } from '@/lib/asset';
import { itemsApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { UserItem } from '@/types';
// Local, lightweight types for ItemSet display (prevent tight coupling with global types)
interface SetBonusLocal {
  pieces: number;
  type?: string;
  stats?: Record<string, number>;
  description?: string;
}

interface SetItemLocal {
  id: number;
  name: string;
}

interface ItemSetLocal {
  id: number;
  name: string;
  description?: string;
  rarity?: number;
  setBonuses?: SetBonusLocal[];
  items?: SetItemLocal[];
}
// Public shape for GET /gacha/:id used in the UI
interface GachaBoxPublic {
  id: number;
  name: string;
  openMode?: string;
  metadata?: Record<string, unknown>;
  entries: Array<Record<string, unknown>>;
}
import { useUserStatusStore } from '@/stores/user-status.store';

export default function InventoryTab() {
  const [selectedItem, setSelectedItem] = useState<UserItem | null>(null);
  const [setDetails, setSetDetails] = useState<ItemSetLocal | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortField, setSortField] = useState<'name' | 'price' | 'rarity' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [revealState, setRevealState] = useState<{ open: boolean; stage: 'waiting' | 'revealed'; awarded: unknown[] }>({ open: false, stage: 'waiting', awarded: [] });
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [sellMax, setSellMax] = useState<number>(1);

  // When an item is selected, ensure we have its ItemSet details available.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedItem) {
        setSetDetails(null);
        return;
      }

      // If backend populated the relation, it may be in selectedItem.item.itemSet
      const maybeSet = (selectedItem.item as unknown as Record<string, unknown>)?.itemSet as ItemSetLocal | undefined;
      // If we have a set but it doesn't include the members list, fetch full item details
      if (maybeSet && maybeSet.items && maybeSet.items.length > 0) {
        setSetDetails(maybeSet as ItemSetLocal);
        return;
      }

      // Otherwise, fetch item details to get set info (if any)
      try {
        if ((selectedItem.item as unknown as Record<string, unknown>)?.id) {
          const full = await itemsApi.getItem(selectedItem.item.id);
          if (!mounted) return;
          setSetDetails((full?.itemSet ?? null) as ItemSetLocal | null);
        } else {
          setSetDetails(null);
        }
      } catch {
        setSetDetails(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedItem, items]);

  // Fetch public gacha box info when selectedItem is a box
  const [boxInfo, setBoxInfo] = useState<GachaBoxPublic | null>(null);
  const [boxRequiredKeyName, setBoxRequiredKeyName] = useState<string | null>(null);
  const [boxRequiredKeyId, setBoxRequiredKeyId] = useState<number | null>(null);
  const [ownedKeyCount, setOwnedKeyCount] = useState<number>(0);
  const [useRequiredKey, setUseRequiredKey] = useState<boolean>(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Reset gacha-related state by default so non-box selections don't keep stale UI
      setBoxInfo(null);
      setBoxRequiredKeyName(null);
      setBoxRequiredKeyId(null);
      setOwnedKeyCount(0);
      if (!selectedItem) return;
      const maybe = (selectedItem.item as unknown as Record<string, unknown>)?.gachaBoxId;
      if (!maybe) return;
      try {
        const info = await apiService.getGachaBox(Number(maybe));
        if (!mounted) return;
        setBoxInfo(info as unknown as GachaBoxPublic);
        // If box requires a key item, resolve its id and name
        try {
          const meta = info as unknown as GachaBoxPublic;
          const reqId = meta.metadata && Object.prototype.hasOwnProperty.call(meta.metadata, 'requiredKeyItemId') ? Number((meta.metadata as Record<string, unknown>)['requiredKeyItemId']) : undefined;
          if (reqId) {
            const itm = await itemsApi.getItem(reqId);
            if (mounted) setBoxRequiredKeyName(itm?.name ?? null);
            if (mounted) setBoxRequiredKeyId(reqId ?? null);
            // compute owned count
            const owned = items.filter((ui) => ui.item.id === reqId).reduce((s, ui) => s + (Number((ui as unknown as Record<string, unknown>).quantity || 1)), 0);
            if (mounted) setOwnedKeyCount(owned);
          } else {
            if (mounted) setBoxRequiredKeyName(null);
            if (mounted) setBoxRequiredKeyId(null);
            if (mounted) setOwnedKeyCount(0);
          }
        } catch {
          if (mounted) setBoxRequiredKeyName(null);
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  // include `items` so ownedKeyCount updates when inventory changes and clear state on non-box items
  }, [selectedItem, items]);

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



  // Return structured Tailwind classes for a given numeric rarity
  const rarityStyle = (rarity?: number | string) => {
    const r = Number(rarity) || 1;
    switch (r) {
      case 1: // common
        return { 
          border: 'border-gray-200', 
          bg: 'bg-gray-50', 
          glow: '', 
          overlay: '',
          cssClass: ''
        };
      case 2: // uncommon
        return { 
          border: 'border-green-400', 
          bg: 'bg-gradient-to-br from-green-50 to-green-100', 
          glow: '', 
          overlay: 'bg-gradient-to-t from-green-400/20 to-transparent',
          cssClass: ''
        };
      case 3: // rare
        return { 
          border: 'border-blue-400', 
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100', 
          glow: '', 
          overlay: 'bg-gradient-to-t from-blue-400/30 to-transparent',
          cssClass: 'rarity-rare'
        };
      case 4: // epic
        return { 
          border: 'border-purple-500', 
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100', 
          glow: 'shadow-md', 
          overlay: 'bg-gradient-to-t from-purple-500/40 to-transparent',
          cssClass: 'rarity-epic'
        };
      case 5: // legendary
        return { 
          border: 'border-yellow-400', 
          bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', 
          glow: 'shadow-lg ring-1 ring-yellow-300', 
          overlay: 'bg-gradient-to-t from-yellow-400/50 to-transparent',
          cssClass: 'rarity-legendary'
        };
      default:
        return { 
          border: 'border-gray-200', 
          bg: 'bg-gray-50', 
          glow: '', 
          overlay: '',
          cssClass: ''
        };
    }
  };

  // Create item display component with rarity effects
  const ItemCard = ({ userItem, count, onClick }: { userItem: UserItem; count?: number; onClick: () => void }) => {
    const rarity = rarityStyle(userItem.item.rarity);
    
    return (
      <Card
        className={`group cursor-pointer transition-all transform-gpu will-change-transform hover:scale-[1.
          03] hover:shadow-xl ${userItem.isEquipped ? 'ring-2 ring-blue-500' : ''} ${rarity.border} ${rarity.glow} ${rarity.cssClass}`}
        onClick={onClick}
      >
        <CardContent className={`p-1 flex items-center justify-center relative overflow-hidden ${rarity.bg}`}>
          {/* Item Image */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {userItem.item.image ? (
              <Image
                src={resolveAssetUrl(userItem.item.image) || ''}
                alt={userItem.item.name}
                width={128}
                height={128}
                className="object-contain"
                unoptimized
              />
            ) : (
              renderItemIcon(userItem.item.type, 'h-16 w-16 text-gray-400')
            )}
            
            {/* Rarity Overlay Effect */}
            {rarity.overlay && (
              <div className={`absolute inset-0 ${rarity.overlay} pointer-events-none`} />
            )}
            
            {/* Equipped Badge */}
            {userItem.isEquipped && (
              <div className="absolute -top-1 -left-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                E
              </div>
            )}
            
            {/* Quantity Badge */}
            {count && count > 1 && (
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count > 99 ? '99+' : count}
              </div>
            )}
          </div>
          
          {/* Item Name */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center truncate">
            {userItem.item.name}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Equipment types - expanded to 6 slots
  const equipmentTypes = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];

  // Which item types should be stacked (non-equip)
  const isStackable = (type?: string) => {
    return !type || !equipmentTypes.includes(type);
  };

  const isEquipableType = (type?: string) => {
    return !!type && equipmentTypes.includes(type);
  };

  // Build grouped display list: for stackable types we show one tile with a count
  const buildDisplayList = (list: UserItem[]) => {
    const groups: Record<string, { sample: UserItem; count: number; ids: number[] }> = {};
    for (const ui of list) {
      const key = isStackable(ui.item.type) ? `stack:${ui.item.id}` : `single:${ui.id}`;
      const uiRec = ui as unknown as Record<string, unknown>;
      const qty = Number(uiRec.quantity || uiRec.qty || 1);
      if (!groups[key]) groups[key] = { sample: ui, count: 0, ids: [] };
      groups[key].count += qty;
      groups[key].ids.push(ui.id);
    }
    return Object.values(groups).map((g) => ({ sample: g.sample, count: g.count, ids: g.ids }));
  };

  const sortDisplay = (arr: Array<{ sample: UserItem; count: number; ids: number[] }>) => {
    const copy = [...arr];
    copy.sort((a, b) => {
      const A = a.sample.item as unknown as Record<string, unknown>;
      const B = b.sample.item as unknown as Record<string, unknown>;
      let res = 0;
      if (sortField === 'name') res = String(A.name || '').localeCompare(String(B.name || ''));
      if (sortField === 'price') res = (Number(A.price) || 0) - (Number(B.price) || 0);
      if (sortField === 'rarity') res = (Number(A.rarity) || 0) - (Number(B.rarity) || 0);
      if (sortField === 'type') res = String(A.type || '').localeCompare(String(B.type || ''));
      return sortOrder === 'asc' ? res : -res;
    });
    return copy;
  };

  // Derived lists per active tab will use this helper to group/sort and paginate
  const getPage = (itemsToShow: Array<{ sample: UserItem; count: number; ids: number[] }>) => {
    const start = (page - 1) * pageSize;
    const pageItems = itemsToShow.slice(start, start + pageSize);
    const total = itemsToShow.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    return { pageItems, total, pageCount };
  };

  // Render correct icon based on item type
  const renderItemIcon = (type: string | undefined, className = 'h-6 w-6 text-gray-600') => {
    switch (type) {
      case 'weapon':
        return <Sword className={className} />;
      case 'helmet':
        return <Shield className={className} />;
      case 'armor':
        return <Shield className={className} />;
      case 'gloves':
        return <Hand className={className} />;
      case 'boots':
        return <Footprints className={className} />;
      case 'accessory':
        return <Gem className={className} />;
      case 'consumable':
        return <Heart className={className} />;
      default:
        return <Sword className={className} />;
    }
  };

  // Note: setDetails useEffect moved earlier to keep hook order stable

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

  const handleRefresh = async () => {
    if (!userId) return;
    try {
      setRefreshDisabled(true);
      setRefreshCountdown(5);
      // Invalidate and refetch the user-items query
      queryClient.invalidateQueries({ queryKey: ['user-items', userId] });
      // also refetch related caches used elsewhere
      queryClient.invalidateQueries({ queryKey: ['equipped-items', userId] });
      try {
        await queryClient.refetchQueries({ queryKey: ['user-items', userId], exact: true });
      } catch {
        // ignore transient refetch errors
      }
    } finally {
      const timer = window.setInterval(() => {
        setRefreshCountdown((c) => {
          if (c <= 1) {
            window.clearInterval(timer);
            setRefreshDisabled(false);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  const handleSellItem = async () => {
    // Open sell modal for selected item
    if (!selectedItem) return toast.error('Chưa chọn vật phẩm để bán');
    // compute available quantity for this userItem
    const uiRec = selectedItem as unknown as Record<string, unknown>;
    const qty = Math.max(1, Number(uiRec.quantity || uiRec.qty || 1));
    setSellMax(qty);
    setSellQuantity(1);
    setSellModalOpen(true);
  };

  const confirmSell = async () => {
    if (!selectedItem || !userId) return;
    const q = Math.max(1, Math.min(sellMax, Math.floor(sellQuantity) || 1));
    try {
      const resp = await itemsApi.sellItem(selectedItem.id, q);
      // try to show gold received from resp, otherwise generic message
      const gold = resp && (resp as any).goldReceived ? Number((resp as any).goldReceived) : undefined;
      if (gold != null) {
        toast.success(`Đã bán ${q}x ${selectedItem.item.name} — nhận ${gold} vàng`);
      } else if (resp && (resp as any).message) {
        toast.success(String((resp as any).message));
      } else {
        toast.success('Đã bán vật phẩm');
      }
      setSellModalOpen(false);
      // refresh user and inventory caches
      queryClient.invalidateQueries({ queryKey: ['user-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['userItems', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      // close detail modal as the item may have been consumed
      setSelectedItem(null);
    } catch (err) {
      console.error('Sell failed', err);
      const msg = err && err instanceof Error ? err.message : 'Không thể bán vật phẩm';
      toast.error(msg || 'Không thể bán vật phẩm');
    }
  };


  return (
    <div className="p-3">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full mb-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max px-1">
            <TabsTrigger value="all" className="whitespace-nowrap text-xs px-2 py-1">Tất cả</TabsTrigger>
            <TabsTrigger value="weapon" className="whitespace-nowrap text-xs px-2 py-1">Vũ khí</TabsTrigger>
            <TabsTrigger value="helmet" className="whitespace-nowrap text-xs px-2 py-1">Mũ</TabsTrigger>
            <TabsTrigger value="armor" className="whitespace-nowrap text-xs px-2 py-1">Giáp</TabsTrigger>
            <TabsTrigger value="gloves" className="whitespace-nowrap text-xs px-2 py-1">Găng</TabsTrigger>
            <TabsTrigger value="boots" className="whitespace-nowrap text-xs px-2 py-1">Giày</TabsTrigger>
            <TabsTrigger value="accessory" className="whitespace-nowrap text-xs px-2 py-1">Phụ kiện</TabsTrigger>
            <TabsTrigger value="consumable" className="whitespace-nowrap text-xs px-2 py-1">Tiêu hao</TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Controls: sort + page size */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col items-start min-w-0">
                <label className="text-xs text-gray-600 mb-1">Sắp xếp</label>
                <div className="flex items-center gap-2">
                  <select value={sortField} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortField(e.target.value as 'name' | 'price' | 'rarity' | 'type')} className="p-1 text-xs rounded border min-w-0">
                    <option value="name">Tên</option>
                    <option value="price">Giá</option>
                    <option value="rarity">Phẩm chất</option>
                    <option value="type">Loại</option>
                  </select>
                  <button className="px-2 py-1 border rounded text-xs" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>{sortOrder === 'asc' ? '↑' : '↓'}</button>
                </div>
              </div>

              <div className="flex flex-col items-start min-w-0">
                <label className="text-xs text-gray-600 mb-1">Hiển thị</label>
                <select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="p-1 text-xs rounded border min-w-0">
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              <div className="flex items-center">
                <button title="Làm mới" onClick={handleRefresh} disabled={refreshDisabled} className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-neutral-950">
                  <RefreshCw className={`h-5 w-5 ${refreshDisabled ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {refreshCountdown > 0 && <div className="text-sm text-gray-500">({refreshCountdown}s)</div>}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {(() => {
              const grouped = buildDisplayList(items);
              const sorted = sortDisplay(grouped);
              const { pageItems, pageCount } = getPage(sorted);
              // ensure pageCount is referenced so linters don't complain
              const _pageCount = pageCount;
              void _pageCount;
              return pageItems.map(({ sample, count, ids }) => (
                <ItemCard
                  key={ids.join('-')}
                  userItem={sample}
                  count={count}
                  onClick={() => setSelectedItem(sample)}
                />
              ));
            })()}
          </div>

          {/* Pagination controls */}
          {(() => {
            const grouped = sortDisplay(buildDisplayList(items));
            const { total, pageCount } = getPage(grouped);
            return (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                <div className="text-sm text-gray-600">{page} / {pageCount} — {total} mục</div>
                <Button variant="outline" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</Button>
              </div>
            );
          })()}
        </TabsContent>

        {/* Other tabs with filtered items */}
        {['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory', 'consumable'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {(() => {
                const filtered = items.filter((ui) => ui.item.type === type);
                const grouped = sortDisplay(buildDisplayList(filtered));
                const { pageItems } = getPage(grouped);
                return pageItems.map(({ sample, count, ids }) => (
                  <ItemCard
                    key={ids.join('-')}
                    userItem={sample}
                    count={count}
                    onClick={() => setSelectedItem(sample)}
                  />
                ));
              })()}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center p-3 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <Card
            className="w-full max-w-sm bg-[var(--card)] text-[var(--card-foreground)]"
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
              {/* Show required key item if any */}
              {boxRequiredKeyName && (
                <div className="text-sm text-yellow-400 font-medium">Cần: {boxRequiredKeyName} để mở rương</div>
              )}
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

              {/* Item Set Info (if any) */}
              {setDetails && (
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Bộ: {setDetails.name}</div>
                      {setDetails.description && (
                        <div className="text-xs text-muted-foreground">{setDetails.description}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Rarity: {setDetails.rarity}</div>
                  </div>

                  {/* Compute how many pieces of this set the player currently has equipped */}
                  {(() => {
                    const setItemIds = new Set<number>((setDetails.items || []).map((s) => s.id));
                    const equippedCount = items.filter((ui) => ui.isEquipped && setItemIds.has(ui.item.id)).length;
                    return (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">Đã trang bị: <span className="font-medium">{equippedCount}</span> / {setDetails.items?.length ?? 0}</div>

                        <div className="space-y-1">
                          {setDetails.setBonuses?.map((b: SetBonusLocal) => {
                            const active = equippedCount >= (b.pieces ?? 0);
                            return (
                              <div key={String(b.pieces) + b.description} className={`flex items-start gap-2 ${active ? 'font-semibold text-white' : 'text-gray-400'}`}>
                                <div className={`flex items-center justify-center w-6 h-6 rounded ${active ? 'bg-green-600' : 'bg-gray-200'} text-xs`}>
                                  {b.pieces}
                                </div>
                                <div className="text-sm">
                                  <div className={active ? 'font-bold' : ''}>{b.description}</div>
                                  {/* Show a compact stat summary if available; clarify percentage vs flat */}
                                  {b.stats && (
                                    <div className="text-xs text-gray-300">
                                      {Object.entries(b.stats)
                                        .map(([k, v]) => {
                                          const isPct = (b.type === 'percentage' || b.type === 'percent');
                                          const num = Number(v || 0);
                                          return `${k}: ${isPct ? `+${num}%` : `+${num}`}`;
                                        })
                                        .join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-2">
                          <div className="text-xs text-gray-400 mb-1">Thành phần bộ:</div>
                          <div className="flex flex-wrap gap-2">
                            {setDetails.items?.map((si: SetItemLocal) => {
                              const isEquipped = items.some((ui) => ui.item.id === si.id && ui.isEquipped);
                              return (
                                <div key={si.id} className={`px-2 py-1 rounded text-sm border ${isEquipped ? 'border-green-500 bg-green-600 text-white' : 'border-gray-200 bg-[var(--card)] text-[var(--card-foreground)]'}`}>
                                  <div className="leading-none">{si.name}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {/* Open for gacha boxes (catalog item has gachaBoxId) */}
                {!!(((selectedItem.item as unknown) as Record<string, unknown>).gachaBoxId) && (
                  <Button
                    className="flex-1 bg-amber-400 text-black"
                    onClick={async () => {
                      // Open gacha from this user_item
                      if (!userId) return;
                      setIsOpening(true);
                      setRevealState({ open: true, stage: 'waiting', awarded: [] });
                      try {
                        // Start server call
                        // choose key id to use: if user opted to use required key and they own it
                        const keyToUse = useRequiredKey && boxRequiredKeyId && ownedKeyCount > 0 ? boxRequiredKeyId : undefined;
                        const respPromise = apiService.openGachaFromUserItem(selectedItem.id, keyToUse);
                        // Minimum animation delay before reveal
                        const minDelay = new Promise((res) => setTimeout(res, 900));
                        const [resp] = await Promise.all([respPromise, minDelay]);
                        const awarded = (resp && (resp as unknown as { awarded?: unknown[] }).awarded) || [];
                        // If server intentionally returned no awards (allowed when no guaranteed entries),
                        // immediately transition out of the waiting spinner into the revealed state so
                        // the UI can show the "no rewards" message instead of hanging on the spinner.
                        if (!awarded || awarded.length === 0) {
                          setRevealState({ open: true, stage: 'revealed', awarded: [] });
                          // Refresh inventory caches even if nothing awarded so UI stays consistent
                          queryClient.invalidateQueries({ queryKey: ['user-items', userId] });
                          queryClient.invalidateQueries({ queryKey: ['userItems', userId] });
                          queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
                          setIsOpening(false);
                          return;
                        }
                        // For better UX, fetch item details (name, image, rarity) and reveal sequentially
                        const itemIds = Array.from(new Set(awarded
                          .filter((a) => a && typeof a === 'object' && 'itemId' in (a as Record<string, unknown>))
                          .map((a) => Number((a as Record<string, unknown>).itemId))));
                        const idToItem: Record<number, { name: string; image?: string; rarity?: number }> = {};
                        await Promise.all(itemIds.map(async (iid: number) => {
                          try {
                            const it = await itemsApi.getItem(iid);
                            idToItem[iid] = { name: it?.name ?? `Item #${iid}`, image: it?.image, rarity: it?.rarity };
                          } catch {
                            idToItem[iid] = { name: `Item #${iid}` };
                          }
                        }));

                        // Build awarded list enriched with item details
                        const awardedDetailed = awarded.map((a) => {
                          if (a && typeof a === 'object' && 'itemId' in (a as Record<string, unknown>)) {
                            const ai = a as Record<string, unknown>;
                            const iid = Number(ai.itemId);
                            const meta = idToItem[iid] || { name: `Item #${iid}` };
                            return { ...ai, name: String(meta.name), image: meta.image, rarity: meta.rarity };
                          }
                          return a;
                        });

                        // Prepare all award details first, then reveal them together in one synchronized step.
                        // This avoids staggered DOM updates that look inconsistent when users spam-open boxes.
                        setRevealState({ open: true, stage: 'waiting', awarded: [] });
                        // short suspense pause before showing everything at once
                        await new Promise((r) => setTimeout(r, 700));
                        setRevealState({ open: true, stage: 'revealed', awarded: awardedDetailed });
                        // Refresh inventory and related caches
                        queryClient.invalidateQueries({ queryKey: ['user-items', userId] });
                        queryClient.invalidateQueries({ queryKey: ['userItems', userId] });
                        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
                      } catch (err) {
                        console.error('Open gacha failed', err);
                        const msg = (err && typeof err === 'object' && 'message' in err) ? String((err as { message?: unknown }).message ?? '') : 'Không thể mở rương';
                        if (msg.includes('Yêu cầu sử dụng key cụ thể')) {
                          const more = boxRequiredKeyId ? `Yêu cầu key id=${boxRequiredKeyId}. Bạn có ${ownedKeyCount} cái.` : '';
                          toast.error(`${msg} ${more}`);
                        } else {
                          toast.error(msg || 'Không thể mở rương');
                        }
                        setRevealState({ open: false, stage: 'waiting', awarded: [] });
                      } finally {
                        setIsOpening(false);
                      }
                    }}
                    disabled={isOpening}
                  >
                    {isOpening ? 'Đang mở...' : 'Mở rương'}
                  </Button>
                )}
                {/* If box requires a specific key, show small toggle and owned count */}
                {boxRequiredKeyId ? (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Dùng key:</label>
                    <button onClick={() => setUseRequiredKey((v) => !v)} className={`px-2 py-1 text-xs rounded ${useRequiredKey ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                      {useRequiredKey ? `Có (${ownedKeyCount})` : 'Không'}
                    </button>
                  </div>
                ) : null}
                {isEquipableType(selectedItem.item.type) ? (
                  <Button
                    className="flex-1"
                    onClick={() => handleEquipItem(selectedItem)}
                    variant={selectedItem.isEquipped ? "outline" : "default"}
                  >
                    {selectedItem.isEquipped ? 'Tháo ra' : 'Mặc vào'}
                  </Button>
                ) : (
                  // If this item maps to a gacha box, hide the Use button (it uses 'Mở rương' instead)
                  (!((selectedItem.item as unknown as Record<string, unknown>).gachaBoxId) && selectedItem.item.type === 'consumable') ? (
                    <Button
                      className="flex-1"
                      onClick={() => handleUseItem(selectedItem)}
                    >
                      Sử dụng
                    </Button>
                  ) : (
                  <div className="flex-1" />
                  )
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

              {/* Gacha drop table: show when selected item is a gacha box */}
              {boxInfo && (
                <div className="mt-4 p-3 border rounded bg-[var(--card)]">
                  <div className="text-sm font-semibold mb-2">Bảng rớt: {boxInfo.name}</div>
                  <div className="text-xs text-gray-400 mb-2">Hiển thị tỉ lệ (xem notes):</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="overflow-y-auto max-h-56 md:max-h-80 pr-2">
                    {(boxInfo.entries as unknown[]).length === 0 ? (
                      <div className="text-xs text-gray-400">Không có mục trong bảng rớt để hiển thị.</div>
                    ) : (
                      (boxInfo.entries as unknown[]).map((eu) => {
                        const e = eu as Record<string, unknown>;
                        const id = e.id as number | undefined;
                        const itemName = (e.itemName as string) ?? (e.itemId ? `Item #${e.itemId}` : '—');
                        const amtMin = e.amountMin as number | undefined;
                        const amtMax = e.amountMax as number | undefined;
                        const guaranteed = !!e.guaranteed;
                        const displayRate = e.displayRate as number | null | undefined;
                        return (
                          <div key={String(id ?? Math.random())} className="flex items-center justify-between text-sm p-2 border rounded bg-white/5">
                            <div>
                              <div className="font-medium">{itemName}</div>
                              <div className="text-xs text-gray-400">Số lượng: {amtMin}{amtMax && amtMax !== amtMin ? ` - ${amtMax}` : ''} {guaranteed ? '• Guaranteed' : ''}</div>
                            </div>
                            <div className="text-right text-xs text-gray-300">
                              {displayRate == null ? '—' : `${(Number(displayRate) * 100).toFixed(2)}%`}
                            </div>
                          </div>
                        );
                      })
                    )}
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

      {/* Reveal Modal */}
          {revealState.open && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setRevealState({ open: false, stage: 'waiting', awarded: [] })}>
              <div className="bg-white rounded-lg p-6 w-full max-w-md text-center" onClick={(e) => e.stopPropagation()} style={{ zIndex: 10000 }}>
                {revealState.stage === 'waiting' ? (
                  <div>
                    <div className="text-lg font-semibold mb-2">Đang mở rương...</div>
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="animate-spin h-12 w-12 text-amber-400" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-semibold mb-4">Bạn nhận được:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {revealState.awarded.length === 0 && <div>Không có phần thưởng</div>}
                      {revealState.awarded.map((a, idx) => {
                        const obj = a as Record<string, unknown> | null;
                        const name = obj && 'name' in obj ? String(obj.name) : JSON.stringify(a);
                        const img = obj && 'image' in obj ? String(obj.image) : undefined;
                        const rarity = obj && 'rarity' in obj && obj.rarity != null ? Number(obj.rarity) : undefined;
                        const rnum = typeof rarity === 'number' ? rarity : 0;
                        const rarityClass = rnum >= 5 ? 'ring-yellow-400' : (rnum === 4 ? 'ring-purple-500' : (rnum === 3 ? 'ring-blue-400' : 'ring-gray-300'));
                        return (
                          <div key={idx} className={`p-3 rounded bg-[var(--card)] flex items-center gap-3 border ${rarityClass}`}>
                            <div className="w-20 h-20 bg-black/5 rounded flex items-center justify-center overflow-hidden">
                              {img ? (
                                <Image src={resolveAssetUrl(img) || ''} alt={name} width={80} height={80} className="object-contain" unoptimized />
                              ) : (
                                <div className="text-sm text-gray-500">(No image)</div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-semibold">{name}</div>
                              <div className="text-xs text-gray-400 mt-1">{rarity ? `Rarity: ${rarity}` : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4">
                      <Button onClick={() => { setRevealState({ open: false, stage: 'waiting', awarded: [] }); if (userId) queryClient.invalidateQueries({ queryKey: ['user-items', userId] }); }}>
                        Đóng
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* Sell Modal */}
      {sellModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50" onClick={() => setSellModalOpen(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Bán vật phẩm</div>
            <div className="mb-3">{selectedItem.item.name}</div>
            <div className="mb-3 text-sm text-gray-600">Số lượng có: {sellMax}</div>
            <div className="flex items-center gap-2 mb-3">
              <input type="number" min={1} max={sellMax} value={sellQuantity} onChange={(e) => setSellQuantity(Number(e.target.value || 1))} className="border p-2 rounded w-24" />
              <div className="text-sm">x Giá bán: {Number((selectedItem.item as unknown as Record<string, unknown>).price || 0)} vàng</div>
            </div>
            <div className="mb-4 text-sm">Tổng nhận: <strong>{sellQuantity * Number((selectedItem.item as unknown as Record<string, unknown>).price || 0)}</strong> vàng</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSellModalOpen(false)}>Hủy</Button>
              <Button onClick={() => confirmSell()}>Xác nhận bán</Button>
            </div>
          </div>
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
