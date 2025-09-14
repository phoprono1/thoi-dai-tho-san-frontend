'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function isMsgObject(v: unknown): v is { message?: string } {
  return typeof v === 'object' && v !== null && 'message' in v;
}

interface ShopItem { id: number; itemId: number; price: number; active: boolean }
interface Listing { id: number; itemId: number; sellerId: number; price: number; active: boolean }
interface ItemFull { id: number; name?: string; type?: string; rarity?: number; stats?: Record<string, number> }

export default function MarketsPage() {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [items, setItems] = useState<ItemFull[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerListingId, setOfferListingId] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState<number | ''>('');
  const [offerLoading, setOfferLoading] = useState(false);

  // filters
  const [searchName, setSearchName] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadItems();
    loadShop();
    loadListings();
  }, []);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const res = await api.get('/items');
      const raw = res.data || [];
      const mapped: ItemFull[] = raw.map((o: Record<string, unknown>) => ({
        id: Number(o['id'] as number),
        name: (o['name'] as string) || undefined,
        type: (o['type'] as string) || undefined,
        rarity: typeof o['rarity'] === 'number' ? (o['rarity'] as number) : undefined,
        stats: (o['stats'] as Record<string, number> | undefined) || {},
      }));
      setItems(mapped);
    } catch {
      toast.error('Không tải được items');
    } finally {
      setLoadingItems(false);
    }
  };

  const loadShop = async () => {
    setLoadingShop(true);
    try {
      const res = await api.get('/market/shop');
      setShopItems(res.data || []);
    } catch {
      toast.error('Không tải được shop');
    } finally {
      setLoadingShop(false);
    }
  };

  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.get('/market/listings');
      setListings(res.data || []);
    } catch {
      toast.error('Không tải được listings');
    } finally {
      setLoadingListings(false);
    }
  };

  const itemById = useMemo(() => {
    const m = new Map<number, ItemFull>();
    items.forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);

  const types = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => { if (it.type) s.add(it.type); });
    return Array.from(s).sort();
  }, [items]);

  function matchesFilters(itemId: number, price: number) {
    const it = itemById.get(itemId);
    if (searchName) {
      const q = searchName.trim().toLowerCase();
      const name = (it?.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (selectedType) {
      if ((it?.type || '') !== selectedType) return false;
    }
    if (typeof minPrice === 'number' && price < minPrice) return false;
    if (typeof maxPrice === 'number' && price > maxPrice) return false;
    return true;
  }

  const filteredShop = shopItems.filter((s) => matchesFilters(s.itemId, s.price));
  const filteredListings = listings.filter((l) => matchesFilters(l.itemId, l.price));

  // Buy handler for shop items
  const handleBuy = async (shopItemId: number) => {
    setBuyingId(shopItemId);
  };

  const confirmBuy = async () => {
    if (!buyingId) return;
    setBuyLoading(true);
    try {
      await api.post(`/market/shop/${buyingId}/buy`);
      toast.success('Mua thành công - kiểm tra mailbox để nhận vật phẩm');
      loadShop();
    } catch (err: unknown) {
      console.error(err);
      let msg = 'Mua thất bại';
      if (isAxiosError(err)) {
        const data = err.response?.data as unknown;
        if (isMsgObject(data)) {
          msg = data.message || err.message || msg;
        } else {
          msg = err.message || msg;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setBuyLoading(false);
      setBuyingId(null);
    }
  };

  // Offer handler for listings
  const handleOffer = (listingId: number) => {
    setOfferListingId(listingId);
    setOfferAmount('');
    setOfferDialogOpen(true);
  };

  const confirmOffer = async () => {
    if (!offerListingId) return;
    const amount = Number(offerAmount);
    if (!Number.isInteger(amount) || amount <= 0) { toast.error('Số không hợp lệ'); return; }
    setOfferLoading(true);
    try {
      await api.post(`/market/listings/${offerListingId}/offer`, { amount });
      toast.success('Offer đã đặt - chờ phản hồi hoặc refund vào mailbox');
      loadListings();
      setOfferDialogOpen(false);
    } catch (err: unknown) {
      console.error(err);
      let msg = 'Đặt offer thất bại';
      if (isAxiosError(err)) {
        const data = err.response?.data as unknown;
        if (isMsgObject(data)) {
          msg = data.message || err.message || msg;
        } else {
          msg = err.message || msg;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setOfferLoading(false);
      setOfferListingId(null);
      setOfferAmount('');
    }
  };

  return (
      <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cửa hàng & Chợ đen</h1>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input placeholder="Tìm theo tên" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <Input placeholder="Giá tối thiểu" type="number" value={minPrice ?? ''} onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : undefined)} />
        <Input placeholder="Giá tối đa" type="number" value={maxPrice ?? ''} onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : undefined)} />
        <Select onValueChange={(v) => setSelectedType(v === '__all__' ? undefined : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Loại vật phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="shop">
        <TabsList>
          <TabsTrigger value="shop">Cửa hàng</TabsTrigger>
          <TabsTrigger value="black">Chợ đen</TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          <div className="space-y-4">
            {loadingShop || loadingItems ? <div>Loading...</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShop.map((s) => {
                  const it = itemById.get(s.itemId);
                  return (
                    <Card key={s.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{it?.name || `Item ${s.itemId}`}</CardTitle>
                            <div className="text-sm text-gray-500">{it?.type || '—'}</div>
                          </div>
                          <div className="text-right">
                            <Badge>{it?.rarity ? `R${it.rarity}` : 'R0'}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div>Price: <strong>{s.price}</strong></div>
                        <div>Active: {s.active ? 'Yes' : 'No'}</div>
                        <div className="mt-2">
                          <Button size="sm" onClick={() => handleBuy(s.id)} disabled={buyLoading && buyingId === s.id}>
                            {buyLoading && buyingId === s.id ? 'Buying...' : 'Buy'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredShop.length === 0 && <div className="text-gray-500">No shop items match filters</div>}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="black">
          <div className="space-y-4">
            {loadingListings || loadingItems ? <div>Loading...</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredListings.map((l) => {
                  const it = itemById.get(l.itemId);
                  return (
                    <Card key={l.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{it?.name || `Item ${l.itemId}`}</CardTitle>
                            <div className="text-sm text-gray-500">{it?.type || '—'}</div>
                          </div>
                          <div className="text-right">
                            <Badge>{it?.rarity ? `R${it.rarity}` : 'R0'}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div>Price: <strong>{l.price}</strong></div>
                        <div>Seller: {l.sellerId}</div>
                        <div className="mt-2">
                          <Button size="sm" onClick={() => handleOffer(l.id)} disabled={offerLoading && offerListingId === l.id}>
                            {offerLoading && offerListingId === l.id ? 'Placing...' : 'Offer'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredListings.length === 0 && <div className="text-gray-500">No listings match filters</div>}
              </div>
            )}
          </div>
        </TabsContent>
  </Tabs>
  {/* Buy confirmation dialog */}
      <Dialog open={!!buyingId} onOpenChange={(v) => { if (!v) setBuyingId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận mua</DialogTitle>
          </DialogHeader>
          <div className="py-2">Bạn có chắc muốn mua item này không?</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setBuyingId(null)} disabled={buyLoading}>Hủy</Button>
            <Button onClick={confirmBuy} disabled={buyLoading}>{buyLoading ? 'Đang mua...' : 'Xác nhận'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={(v) => { setOfferDialogOpen(v); if (!v) { setOfferListingId(null); setOfferAmount(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">Nhập số vàng muốn trả:</div>
            <Input type="number" value={typeof offerAmount === 'number' ? String(offerAmount) : ''} onChange={(e) => setOfferAmount(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setOfferDialogOpen(false)} disabled={offerLoading}>Hủy</Button>
            <Button onClick={confirmOffer} disabled={offerLoading}>{offerLoading ? 'Đang đặt...' : 'Đặt'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
}
