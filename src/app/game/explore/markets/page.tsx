'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function isMsgObject(v: unknown): v is { message?: string } {
  return typeof v === 'object' && v !== null && 'message' in v;
}

interface ShopItem { id: number; itemId: number; price: number; active: boolean }
interface Listing { id: number; itemId: number; sellerId: number; price: number; active: boolean; quantity?: number }
interface ItemFull { id: number; name?: string; type?: string; rarity?: number; stats?: Record<string, number> }
interface Offer { id: number; listingId: number; buyerId: number; amount: number; accepted: boolean; cancelled: boolean; quantity?: number }

export default function MarketsPage() {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [items, setItems] = useState<ItemFull[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [buyingQuantity, setBuyingQuantity] = useState<number>(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerListingId, setOfferListingId] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState<number | ''>('');
  const [offerLoading, setOfferLoading] = useState(false);
  // new listing creation (user-facing)
  const [newListingItemId, setNewListingItemId] = useState<number | ''>('');
  const [newListingPrice, setNewListingPrice] = useState<number | ''>('');
  const [newListingQuantity, setNewListingQuantity] = useState<number | ''>(1);
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [listingQuery, setListingQuery] = useState('');
  const [showListingDropdown, setShowListingDropdown] = useState(false);

  // offers per listing cache and UI toggles
  const [offersByListing, setOffersByListing] = useState<Record<number, Offer[]>>({});
  const [showOffersFor, setShowOffersFor] = useState<number | null>(null);

  // filters
  const [searchName, setSearchName] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  
  

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
      // Fetch public shop items (only active ones) for players
      const res = await api.get('/market/shop/public');
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

  const { user: authUser, isAuthenticated } = useAuth();

  const [userItems, setUserItems] = useState<Array<{ id: number; itemId: number; quantity: number; item?: ItemFull }>>([]);
  const loadUserItems = useCallback(async () => {
    try {
      if (!authUser?.id) {
        setUserItems([]);
        return;
      }
      const res = await api.get(`/user-items/user/${authUser.id}`);
      const raw = (res.data || []) as Array<Record<string, unknown>>;
      type UserItemRaw = { id: number; itemId: number; quantity?: number };
      const mapped: Array<{ id: number; itemId: number; quantity: number }> = raw.map((u: Record<string, unknown>) => {
        const ur = u as unknown as UserItemRaw;
        return { id: Number(ur.id), itemId: Number(ur.itemId), quantity: Number(ur.quantity || 1) };
      });
      // enrich with item info
      const enriched = mapped.map((mi) => ({ ...mi, item: itemById.get(mi.itemId) }));
      setUserItems(enriched);
    } catch (e) {
      console.error('Failed to load user items', e);
    }
  }, [authUser?.id, itemById]);

  // initial load on mount
  useEffect(() => {
    void loadItems();
    void loadShop();
    void loadListings();
  }, []);

  // reload user items when auth state changes
  useEffect(() => {
    if (isAuthenticated && authUser?.id) {
      void loadUserItems();
    } else {
      setUserItems([]);
    }
  }, [isAuthenticated, authUser?.id, loadUserItems]);

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
  const handleBuy = async (shopItemId: number, qty = 1) => {
    setBuyingId(shopItemId);
    setBuyingQuantity(qty);
  };

  const confirmBuy = async () => {
    if (!buyingId) return;
    setBuyLoading(true);
    try {
      await api.post(`/market/shop/${buyingId}/buy`, { quantity: buyingQuantity });
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
      setBuyingQuantity(1);
    }
  };

  // Offer handler for listings
  const handleOffer = (listingId: number) => {
    setOfferListingId(listingId);
    setOfferAmount('');
    setOfferDialogOpen(true);
  };

  const [offerQuantity, setOfferQuantity] = useState<number>(1);

  const confirmOffer = async () => {
    if (!offerListingId) return;
    const amount = Number(offerAmount);
    if (!Number.isInteger(amount) || amount <= 0) { toast.error('Số không hợp lệ'); return; }
    setOfferLoading(true);
    try {
      await api.post(`/market/listings/${offerListingId}/offer`, { amount, quantity: offerQuantity });
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
      setOfferQuantity(1);
    }
  };

  // Create a listing (user)
  const createListing = async () => {
    if (!isAuthenticated) { toast.error('Bạn cần đăng nhập'); return; }
    const selection = Number(newListingItemId);
    const price = Number(newListingPrice);
    if (!Number.isInteger(selection) || selection <= 0 || !Number.isInteger(price) || price <= 0) {
      toast.error('Vui lòng nhập itemId và price hợp lệ');
      return;
    }
    try {
      // Ensure the selected id is a UserItem id owned by the user
      const owned = userItems.find((u) => u.id === selection);
      if (!owned) {
        toast.error('Vui lòng chọn một vật phẩm bạn đang sở hữu để tạo listing');
        return;
      }
      await api.post('/market/listings', { userItemId: selection, price, quantity: Number(newListingQuantity || 1) });
      toast.success('Listing created');
      setNewListingItemId('');
      setNewListingPrice('');
      setNewListingQuantity(1);
      loadListings();
    } catch (err) {
      console.error(err);
      toast.error('Tạo listing thất bại');
    }
  };

  // Load offers for a specific listing
  const loadOffersForListing = async (listingId: number) => {
    try {
      const res = await api.get(`/market/listings/${listingId}/offers`);
      setOffersByListing((s) => ({ ...s, [listingId]: res.data || [] }));
    } catch (err) {
      console.error('Failed to load offers', err);
      setOffersByListing((s) => ({ ...s, [listingId]: [] }));
    }
  };

  const toggleShowOffers = async (listingId: number) => {
    if (showOffersFor === listingId) {
      setShowOffersFor(null);
      return;
    }
    await loadOffersForListing(listingId);
    setShowOffersFor(listingId);
  };

  const handleAcceptOffer = async (offerId: number) => {
    try {
      await api.post(`/market/offers/${offerId}/accept`);
      toast.success('Offer accepted');
      loadListings();
      if (showOffersFor) await loadOffersForListing(showOffersFor);
    } catch (err) {
      console.error(err);
      toast.error('Accept failed');
    }
  };

  const handleCancelOffer = async (offerId: number) => {
    try {
      const res = await api.post(`/market/offers/${offerId}/cancel`);
      const listingId = res.data?.listingId as number | undefined;
      toast.success('Offer cancelled');
      loadListings();
      if (listingId) {
        await loadOffersForListing(listingId);
        if (showOffersFor !== listingId) setShowOffersFor(listingId);
      } else if (showOffersFor) {
        await loadOffersForListing(showOffersFor);
      }
    } catch (err) {
      console.error(err);
      toast.error('Cancel failed');
    }
  };

  // Transaction history modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ id: number; itemId: number; buyerId: number; sellerId: number; price: number; createdAt?: string }>>([]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/market/history');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
      toast.error('Không tải được lịch sử giao dịch');
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
                        <div className="mt-2 flex items-center gap-2">
                          <Input type="number" min={1} defaultValue={1} onChange={(e) => setBuyingQuantity(e.target.value ? Number(e.target.value) : 1)} className="w-20" />
                          <Button size="sm" onClick={() => handleBuy(s.id, buyingQuantity)} disabled={buyLoading && buyingId === s.id}>
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
                        <div>Quantity: <strong>{l.quantity ?? 1}</strong></div>
                        <div>Seller: {l.sellerId}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <Button size="sm" onClick={() => handleOffer(l.id)} disabled={offerLoading && offerListingId === l.id}>
                            {offerLoading && offerListingId === l.id ? 'Placing...' : 'Offer'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => toggleShowOffers(l.id)}>
                            {showOffersFor === l.id ? 'Hide offers' : 'Show offers'}
                          </Button>
                        </div>
                        {showOffersFor === l.id && (
                          <div className="mt-3 border-t pt-3">
                            <div className="text-sm font-medium mb-2">Offers</div>
                            {(offersByListing[l.id] || []).map((o: Offer) => (
                              <div key={o.id} className="flex items-center justify-between p-2 border rounded mb-1">
                                <div className="text-sm">Offer #{o.id} • Buyer: {o.buyerId} • Qty: {o.quantity ?? 1} • Amount: {o.amount} • Accepted: {o.accepted ? 'Yes' : 'No'}</div>
                                <div className="flex gap-2">
                                  {/* If current user is seller, allow accept */}
                                  {isAuthenticated && authUser?.id === l.sellerId && !o.accepted && !o.cancelled && (
                                    <Button size="sm" onClick={() => handleAcceptOffer(o.id)}>Accept</Button>
                                  )}
                                  {/* If current user is buyer, allow cancel */}
                                  {isAuthenticated && authUser?.id === o.buyerId && !o.accepted && !o.cancelled && (
                                    <Button size="sm" variant="destructive" onClick={() => handleCancelOffer(o.id)}>Cancel</Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {(!offersByListing[l.id] || offersByListing[l.id].length === 0) && <div className="text-sm text-gray-500">No offers</div>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {/* Create listing modal (user-friendly searchable dropdown) */}
                <div className="col-span-full">
                  <div className="flex justify-end">
                    <Button onClick={() => { setListingDialogOpen(true); setListingQuery(''); setShowListingDropdown(false); }}>Tạo listing</Button>
                  </div>

                  <Dialog open={listingDialogOpen} onOpenChange={(v) => { setListingDialogOpen(v); if (!v) { setNewListingItemId(''); setNewListingPrice(''); } }}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tạo listing mới</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-sm">Tìm theo tên hoặc ID</label>
                          <Input
                            value={listingQuery}
                            onChange={(e) => { setListingQuery(e.target.value); setShowListingDropdown(true); }}
                            onFocus={() => setShowListingDropdown(true)}
                            placeholder="Gõ tên hoặc ID để tìm"
                          />
                          {showListingDropdown && (
                            <div className="absolute z-20 left-0 right-0 bg-white dark:bg-slate-800 border mt-1 max-h-60 overflow-auto rounded shadow">
                              <div className="p-2">
                                {/* Show user's owned items first when available */}
                                {userItems.length > 0 ? (
                                  userItems
                                    .filter((ui) => {
                                      const q = listingQuery.trim().toLowerCase();
                                      if (!q) return true;
                                      const name = (ui.item?.name || '').toLowerCase();
                                      return String(ui.id).includes(q) || String(ui.itemId).includes(q) || name.includes(q);
                                    })
                                    .slice(0, 200)
                                    .map((ui) => (
                                      <div
                                        key={ui.id}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                                        onMouseDown={(ev) => {
                                          ev.preventDefault();
                                          setNewListingItemId(ui.id);
                                          setListingQuery('');
                                          setShowListingDropdown(false);
                                        }}
                                      >
                                        <div className="text-sm font-medium">{ui.item?.name || `Item ${ui.itemId}`}</div>
                                        <div className="text-xs text-gray-500">UserItem ID: {ui.id} • Item ID: {ui.itemId} • Qty: {ui.quantity}</div>
                                      </div>
                                    ))
                                ) : (
                                  items
                                    .filter((it) => {
                                      const q = listingQuery.trim().toLowerCase();
                                      if (!q) return true;
                                      return String(it.id).includes(q) || (it.name || '').toLowerCase().includes(q);
                                    })
                                    .slice(0, 200)
                                    .map((it) => (
                                      <div
                                        key={it.id}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                                        onMouseDown={(ev) => {
                                          ev.preventDefault();
                                          setNewListingItemId(it.id);
                                          setListingQuery('');
                                          setShowListingDropdown(false);
                                        }}
                                      >
                                        <div className="text-sm font-medium">{it.name}</div>
                                        <div className="text-xs text-gray-500">ID: {it.id}</div>
                                      </div>
                                    ))
                                )}
                                {items.length === 0 && <div className="text-sm text-gray-500">No items</div>}
                              </div>
                            </div>
                          )}
                          {newListingItemId && (
                            <div className="mt-2 text-sm">Selected: {userItems.find(u => u.id === Number(newListingItemId))?.item?.name || itemById.get(Number(newListingItemId))?.name || `Item ${newListingItemId}`}</div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm">Price</label>
                            <Input type="number" value={newListingPrice ?? ''} onChange={(e) => setNewListingPrice(e.target.value ? Number(e.target.value) : '')} />
                          </div>
                          <div>
                            <label className="block text-sm">Quantity</label>
                            <Input type="number" min={1} value={newListingQuantity ?? 1} onChange={(e) => setNewListingQuantity(e.target.value ? Number(e.target.value) : 1)} />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" onClick={() => setListingDialogOpen(false)}>Hủy</Button>
                          <Button onClick={async () => {
                            await createListing();
                            setListingDialogOpen(false);
                          }}>Tạo</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {/* Floating action button (DropdownMenu) */}
                <div className="fixed right-6 bottom-6 z-50">
                  <div className="flex items-end">
                    {/* DropdownMenu from shadcn */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-12 h-12 rounded-full text-lg">+</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setListingDialogOpen(true); setListingQuery(''); setShowListingDropdown(false); }}>
                          Tạo listing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { /* TODO: open my listings modal */ }}>
                          Vật phẩm của tôi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { /* TODO: open my offers modal */ }}>
                          Offers của tôi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => { setHistoryOpen(true); await loadHistory(); }}>
                          Lịch sử giao dịch
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
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
          <div className="py-2">
            <div>Bạn có chắc muốn mua item này không?</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Số lượng</label>
                <Input type="number" min={1} value={buyingQuantity} onChange={(e) => setBuyingQuantity(e.target.value ? Number(e.target.value) : 1)} />
              </div>
              <div>
                <label className="block text-sm">Tổng giá</label>
                <div className="pt-2">{buyingQuantity} × {/* find item price */} </div>
              </div>
            </div>
          </div>
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
            <div>
              <label className="block text-sm">Số lượng</label>
              <Input type="number" min={1} value={offerQuantity} onChange={(e) => setOfferQuantity(e.target.value ? Number(e.target.value) : 1)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setOfferDialogOpen(false)} disabled={offerLoading}>Hủy</Button>
            <Button onClick={confirmOffer} disabled={offerLoading}>{offerLoading ? 'Đang đặt...' : 'Đặt'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction history dialog */}
      <Dialog open={historyOpen} onOpenChange={(v) => { setHistoryOpen(v); if (v) loadHistory(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lịch sử giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-sm text-gray-500">Không có giao dịch</div>
            ) : (
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th>ID</th>
                      <th>Item</th>
                      <th>Buyer</th>
                      <th>Seller</th>
                      <th>Price</th>
                      <th>At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-t">
                        <td className="py-1">{h.id}</td>
                        <td>{h.itemId}</td>
                        <td>{h.buyerId}</td>
                        <td>{h.sellerId}</td>
                        <td>{h.price}</td>
                        <td>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setHistoryOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
