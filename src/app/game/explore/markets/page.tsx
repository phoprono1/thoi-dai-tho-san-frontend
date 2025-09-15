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
import ListingModal from '@/components/markets/ListingModal';
import MyItemsModal from '@/components/markets/MyItemsModal';
import MyOffersModal from '@/components/markets/MyOffersModal';
import TransactionHistoryModal from '@/components/markets/TransactionHistoryModal';
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

  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const getUserName = (id?: number | null) => {
    if (id === null || id === undefined) return 'Ẩn danh';
    return userNames[id] ?? `Người dùng #${id}`;
  };

  
  

  const loadItems = useCallback(async () => {
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
  }, []);

  const loadShop = useCallback(async () => {
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
  }, []);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const res = await api.get<Listing[]>('/market/listings');
      const data = (res.data || []) as Listing[];
      setListings(data);
      try {
        const sellerIds = Array.from(new Set(data.map((l) => Number(l.sellerId)).filter((v) => Boolean(v)))) as number[];
        const missing = sellerIds.filter((id) => !userNames[id]);
        if (missing.length > 0) {
          const usersResp = await Promise.all(missing.map((id: number) => api.get(`/users/${id}`).then((r) => ({ id, username: r.data?.username as string }))));
          const map: Record<number, string> = {};
          usersResp.forEach((u: { id: number; username?: string }) => { if (u && u.id) map[u.id] = u.username || `Người dùng #${u.id}`; });
          setUserNames((s) => ({ ...s, ...map }));
        }
      } catch (err) {
        console.warn('Failed to preload seller names', err);
      }
    } catch {
      toast.error('Không tải được listings');
    } finally {
      setLoadingListings(false);
    }
  }, [userNames]);

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
  }, [loadItems, loadShop, loadListings]);

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

  // Load offers for a specific listing and preload buyer usernames
  const loadOffersForListing = useCallback(async (listingId: number) => {
    try {
      const res = await api.get(`/market/listings/${listingId}/offers`);
      const offers: Offer[] = (res.data || []) as Offer[];
      // Find buyerIds missing from cache
      const missingBuyerIds = Array.from(new Set(offers.map((o) => o.buyerId).filter((id) => !(id in userNames))));
      if (missingBuyerIds.length > 0) {
        try {
          const nameFetches = await Promise.all(missingBuyerIds.map((id) => api.get(`/users/${id}`)));
          const nameMap: Record<number, string> = {};
          nameFetches.forEach((r, idx) => {
            const user = r.data;
            const id = missingBuyerIds[idx];
            if (user && user.id) nameMap[id] = user.username || `Người dùng #${id}`;
          });
          setUserNames((prev) => ({ ...prev, ...nameMap }));
        } catch {
          // ignore name preload failures
        }
      }
      setOffersByListing((s) => ({ ...s, [listingId]: offers }));
    } catch (err) {
      console.error('Failed to load offers', err);
      setOffersByListing((s) => ({ ...s, [listingId]: [] }));
    }
  }, [userNames]);

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

  // modal open flags
  const [myItemsOpen, setMyItemsOpen] = useState(false);
  const [myOffersOpen, setMyOffersOpen] = useState(false);

  // When the seller modal opens, preload offers for all listings the user is selling and poll periodically
  useEffect(() => {
    if (!myItemsOpen || !authUser?.id) return;
    let cancelled = false;
    const sellerListings = listings.filter((l) => l.sellerId === authUser.id);
    // load initial offers for each listing
    sellerListings.forEach((l) => void loadOffersForListing(l.id));

    // poll every 5s while modal open
    const iv = setInterval(() => {
      if (cancelled) return;
      sellerListings.forEach((l) => void loadOffersForListing(l.id));
    }, 5000);

    return () => { cancelled = true; clearInterval(iv); };
  }, [myItemsOpen, listings, authUser?.id, loadOffersForListing]);

  // When the buyer modal opens, preload offers for all listings and poll so user's offers update in near-realtime
  useEffect(() => {
    if (!myOffersOpen) return;
    let cancelled = false;
    // load offers for all listings once
    listings.forEach((l) => void loadOffersForListing(l.id));
    const iv = setInterval(() => {
      if (cancelled) return;
      listings.forEach((l) => void loadOffersForListing(l.id));
    }, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [myOffersOpen, listings, loadOffersForListing]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/market/history');
      const raw = res.data || [];
      // filter to only the current user's buy/sell history if authenticated
      if (authUser?.id) {
        const filtered = (raw as Array<Record<string, unknown>>).filter((r) => {
          const buyerId = Number(r['buyerId'] as number || 0);
          const sellerId = Number(r['sellerId'] as number || 0);
          return buyerId === authUser.id || sellerId === authUser.id;
        }).map((r) => ({
          id: Number(r['id'] as number),
          itemId: Number(r['itemId'] as number),
          buyerId: Number(r['buyerId'] as number),
          sellerId: Number(r['sellerId'] as number),
          price: Number(r['price'] as number),
          createdAt: (r['createdAt'] as string) || undefined,
        }));
        setHistory(filtered);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to load history', err);
      toast.error('Không tải được lịch sử giao dịch');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cửa hàng & Chợ đen</h1>

      {/* Filters (compact on mobile: two columns) */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Input placeholder="Tìm theo tên" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="col-span-2 md:col-span-1" />
        <Input placeholder="Giá tối thiểu" type="number" value={minPrice ?? ''} onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : undefined)} className="col-span-1" />
        <Input placeholder="Giá tối đa" type="number" value={maxPrice ?? ''} onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : undefined)} className="col-span-1" />
        <div className="col-span-2 md:col-span-1">
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
                        <div>Giá: <strong>{s.price}</strong></div>
                        <div>Hoạt động: {s.active ? 'Có' : 'Không'}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <Input type="number" min={1} defaultValue={1} onChange={(e) => setBuyingQuantity(e.target.value ? Number(e.target.value) : 1)} className="w-20" />
                          <Button size="sm" onClick={() => handleBuy(s.id, buyingQuantity)} disabled={buyLoading && buyingId === s.id}>
                            {buyLoading && buyingId === s.id ? 'Đang mua...' : 'Mua'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredShop.length === 0 && <div className="text-gray-500">Không có vật phẩm phù hợp</div>}
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
                        <div>Giá: <strong>{l.price}</strong></div>
                        <div>Số lượng: <strong>{l.quantity ?? 1}</strong></div>
                        <div>Người bán: <strong>{getUserName(l.sellerId)}</strong></div>
                        <div className="mt-2 flex items-center gap-2">
                          <Button size="sm" onClick={() => handleOffer(l.id)} disabled={offerLoading && offerListingId === l.id}>
                            {offerLoading && offerListingId === l.id ? 'Đang đặt...' : 'Đặt giá'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => toggleShowOffers(l.id)}>
                            {showOffersFor === l.id ? 'Ẩn offers' : 'Xem offers'}
                          </Button>
                        </div>
                        {showOffersFor === l.id && (
                          <div className="mt-3 border-t pt-3">
                            <div className="text-sm font-medium mb-2">Offers</div>
                            {(offersByListing[l.id] || []).map((o: Offer) => (
                              <div key={o.id} className="flex items-center justify-between p-2 border rounded mb-1">
                                <div className="text-sm">Offer #{o.id} • Người mua: {getUserName(o.buyerId)} • Số lượng: {o.quantity ?? 1} • Giá: {o.amount} • Đã chấp nhận: {o.accepted ? 'Có' : 'Không'}</div>
                                <div className="flex gap-2">
                                  {/* If current user is seller, allow accept */}
                                  {isAuthenticated && authUser?.id === l.sellerId && !o.accepted && !o.cancelled && (
                                    <Button size="sm" onClick={() => handleAcceptOffer(o.id)}>Chấp nhận</Button>
                                  )}
                                  {/* If current user is buyer, allow cancel */}
                                  {isAuthenticated && authUser?.id === o.buyerId && !o.accepted && !o.cancelled && (
                                    <Button size="sm" variant="destructive" onClick={() => handleCancelOffer(o.id)}>Hủy</Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {(!offersByListing[l.id] || offersByListing[l.id].length === 0) && <div className="text-sm text-gray-500">Không có offers</div>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {/* Create listing modal (user-friendly searchable dropdown) */}
                <div className="col-span-full">
                  {/* Listing modal is now a separate component */}
                  <ListingModal
                    open={listingDialogOpen}
                    onOpenChange={(v) => { setListingDialogOpen(v); if (!v) { setNewListingItemId(''); setNewListingPrice(''); } }}
                    items={items.map((it) => ({ id: it.id, name: it.name }))}
                    userItems={userItems}
                    itemById={itemById}
                    listingQuery={listingQuery}
                    setListingQuery={setListingQuery}
                    showListingDropdown={showListingDropdown}
                    setShowListingDropdown={setShowListingDropdown}
                    newListingItemId={newListingItemId}
                    setNewListingItemId={setNewListingItemId}
                    newListingPrice={newListingPrice}
                    setNewListingPrice={setNewListingPrice}
                    newListingQuantity={newListingQuantity}
                    setNewListingQuantity={setNewListingQuantity}
                    createListing={createListing}
                  />
                </div>
                {/* Floating action button (DropdownMenu) */}
                <div className="fixed right-4 bottom-16 z-[9999] sm:right-6 sm:bottom-6">
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
                          <DropdownMenuItem onClick={async () => { setMyItemsOpen(true); }}>
                            Vật phẩm của tôi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => { setMyOffersOpen(true); }}>
                            Offers của tôi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => { setHistoryOpen(true); await loadHistory(); }}>
                            Lịch sử giao dịch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {filteredListings.length === 0 && <div className="text-gray-500">Không có listing phù hợp</div>}
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

      {/* External modal components mounted here */}
      {/* My listings + offers modal: show listings where current user is seller */}
      <MyItemsModal
        open={myItemsOpen}
        onOpenChange={setMyItemsOpen}
        listings={listings.filter((l) => authUser?.id && l.sellerId === authUser.id)}
        itemById={itemById}
        offersByListing={offersByListing}
        onAcceptOffer={handleAcceptOffer}
        onCancelOffer={handleCancelOffer}
        authUserId={authUser?.id}
        getUserName={getUserName}
      />

      {/* My offers modal: placeholder for offers where current user is buyer */}
      <MyOffersModal
        open={myOffersOpen}
        onOpenChange={setMyOffersOpen}
        offers={Object.values(offersByListing).flat().filter((o) => authUser?.id && o.buyerId === authUser.id)}
        allOffersByListing={offersByListing}
        onCancelOffer={handleCancelOffer}
        getUserName={getUserName}
      />

  <TransactionHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} history={history} getUserName={getUserName} />

    </div>
  );
}
