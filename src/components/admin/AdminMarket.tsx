'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery as useQ } from '@tanstack/react-query';

interface ShopItem {
  id: number;
  itemId: number;
  price: number;
  active: boolean;
  createdAt?: string;
}

export default function AdminMarket() {
  const [itemId, setItemId] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  interface ItemFull {
    id: number;
    name?: string;
    rarity?: number;
    price?: number;
    type?: string;
    consumableType?: string;
    consumableValue?: number;
    duration?: number;
    stats?: { [k: string]: number };
  }

  const [items, setItems] = useState<ItemFull[]>([]);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const selectedItem = useMemo(() => items.find((it) => it.id === itemId) || null, [items, itemId]);
  const getItemName = (id: number) => items.find((it) => it.id === id)?.name || `Item ${id}`;

  const { data: shopItems, refetch } = useQuery({
    queryKey: ['adminShopItems'],
    queryFn: async () => {
      const res = await api.get('/market/shop');
      return res.data || [];
    },
  });

  // Transactions queries
  interface Listing { id: number; itemId: number; sellerId: number; price: number; active: boolean; createdAt?: string }
  interface Offer { id: number; listingId: number; buyerId: number; amount: number; accepted: boolean; cancelled: boolean; createdAt?: string }
  interface PurchaseHistoryEntry { id: number; itemId: number; buyerId: number; sellerId: number; price: number; createdAt?: string }

  const { data: listings, refetch: refetchListings } = useQ<Listing[]>({
    queryKey: ['adminListings'],
    queryFn: async () => {
      const res = await api.get('/market/listings');
      return res.data || [];
    },
  });

  const { data: offers } = useQ<Offer[]>({
    queryKey: ['adminOffers'],
    queryFn: async () => {
      const res = await api.get('/market/offers');
      return res.data || [];
    },
  });

  const { data: history, refetch: refetchHistory } = useQ<PurchaseHistoryEntry[]>({
    queryKey: ['adminHistory'],
    queryFn: async () => {
      const res = await api.get('/market/history');
      return res.data || [];
    },
  });

  // Fetch all items for dropdown (simple approach)
  useEffect(() => {
    let mounted = true;
    api.get('/items')
      .then((res) => {
        if (!mounted) return;
        const raw = (res.data || []) as unknown[];
        const list = raw.map((it) => {
          const o = it as Record<string, unknown>;
          return {
            id: Number(o['id'] as number),
            name: (o['name'] as string) || '',
            rarity: typeof o['rarity'] === 'number' ? (o['rarity'] as number) : undefined,
            price: typeof o['price'] === 'number' ? (o['price'] as number) : undefined,
            type: (o['type'] as string) || undefined,
            consumableType: (o['consumableType'] as string) || undefined,
            consumableValue: typeof o['consumableValue'] === 'number' ? (o['consumableValue'] as number) : undefined,
            duration: typeof o['duration'] === 'number' ? (o['duration'] as number) : undefined,
            stats: (o['stats'] as { [k: string]: number } | undefined) || {},
          } as ItemFull;
        });
        setItems(list);
      })
      .catch(() => {
        setItems([]);
      });
    return () => { mounted = false; };
  }, []);

  const handleAdd = async () => {
    if (!itemId || !price) {
      toast.error('Vui lòng nhập itemId và price');
      return;
    }
    try {
      await api.post('/market/shop', { itemId, price });
      toast.success('Đã thêm vào shop');
      setItemId(0);
      setPrice(0);
      refetch();
      refetchListings();
      refetchHistory();
    } catch {
      toast.error('Thêm thất bại');
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Bạn có chắc muốn gỡ shop item này?')) return;
    try {
      await api.delete(`/market/shop/${id}`);
      toast.success('Đã gỡ shop item');
      refetch();
      refetchListings();
      refetchHistory();
    } catch {
      toast.error('Gỡ thất bại');
    }
  };

  return (
    <Tabs defaultValue="shop" className="space-y-6">
      <TabsList>
        <TabsTrigger value="shop">Shop</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>

      <TabsContent value="shop">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: stack Shop Management and Item Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shop Management</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 items-end">
                <div className="relative">
                  <label className="block text-sm">Item</label>
                  <Input
                    type="text"
                    value={selectedItem ? `${selectedItem.id} - ${selectedItem.name}` : query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Type to search items by name or id"
                  />
                  {showDropdown && (
                    <div className="absolute z-20 left-0 right-0 bg-white dark:bg-slate-800 border mt-1 max-h-60 overflow-auto rounded shadow">
                      <div className="p-2">
                        {items
                          .filter((it) => {
                            const q = query.trim().toLowerCase();
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
                                setItemId(it.id);
                                setQuery('');
                                setShowDropdown(false);
                              }}
                            >
                              <div className="text-sm font-medium">{it.name}</div>
                              <div className="text-xs text-gray-500">ID: {it.id}</div>
                            </div>
                          ))}
                        {items.length === 0 && <div className="text-sm text-gray-500">No items</div>}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm">Price (gold)</label>
                  <Input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value || '0'))} />
                </div>
                <div>
                  <Button onClick={handleAdd}>Add to Shop</Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Item Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItem ? (
                  <div className="space-y-2">
                    <div className="font-semibold">{selectedItem.name} {selectedItem.rarity ? `• Rarity ${selectedItem.rarity}` : ''}</div>
                    <div className="text-sm text-gray-500">Type: {selectedItem.type || '—'}</div>
                    {selectedItem.consumableType && (
                      <div className="text-sm text-blue-600">Consumable: {selectedItem.consumableType} • Value: {selectedItem.consumableValue ?? '—'} • Duration: {selectedItem.duration ?? '—'}</div>
                    )}
                    <div className="pt-2">
                      <div className="text-sm font-medium">Stats</div>
                      <div className="text-sm text-gray-700">
                        {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 ? (
                          <ul className="list-disc pl-5">
                            {Object.entries(selectedItem.stats!).map(([k, v]) => (
                              <li key={k}>{k}: {v}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500">No stats</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Select an item to preview</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Current Shop Items */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Shop Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shopItems?.map((s: ShopItem) => (
                    <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{getItemName(s.itemId)} <span className="text-xs text-gray-400">(ID: {s.itemId})</span></div>
                        <div className="text-sm text-gray-500">Price: {s.price} • Active: {s.active ? 'Yes' : 'No'}</div>
                      </div>
                      <div>
                        <Button variant="destructive" size="sm" onClick={() => handleRemove(s.id)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                  {(!shopItems || shopItems.length === 0) && (
                    <div className="text-gray-500">No shop items</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="transactions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Listings + Offers stacked */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {listings?.map((l: Listing) => (
                    <div key={l.id} className="p-2 border rounded">
                      <div className="font-medium">Listing #{l.id} - Item {l.itemId}</div>
                      <div className="text-sm text-gray-500">Seller: {l.sellerId} • Price: {l.price} • Active: {l.active ? 'Yes' : 'No'}</div>
                    </div>
                  ))}
                  {!listings || listings.length === 0 ? <div className="text-gray-500">No listings</div> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {offers?.map((o: Offer) => (
                    <div key={o.id} className="p-2 border rounded">
                      <div className="font-medium">Offer #{o.id} on Listing {o.listingId}</div>
                      <div className="text-sm text-gray-500">Buyer: {o.buyerId} • Amount: {o.amount} • Accepted: {o.accepted ? 'Yes' : 'No'} • Cancelled: {o.cancelled ? 'Yes' : 'No'}</div>
                    </div>
                  ))}
                  {!offers || offers.length === 0 ? <div className="text-gray-500">No offers</div> : null}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Purchase History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {history?.map((h: PurchaseHistoryEntry) => (
                    <div key={h.id} className="p-2 border rounded">
                      <div className="font-medium">#{h.id} Item {h.itemId}</div>
                      <div className="text-sm text-gray-500">Buyer: {h.buyerId} • Seller: {h.sellerId} • Price: {h.price}</div>
                    </div>
                  ))}
                  {!history || history.length === 0 ? <div className="text-gray-500">No history</div> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
