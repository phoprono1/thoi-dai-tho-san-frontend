"use client";

import { useState, useEffect } from 'react';
import { giftcodeApi, itemsApi } from '@/lib/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Giftcode = {
  id: number;
  code: string;
  rewards: Record<string, unknown> | null;
  usesAllowed?: number | null;
  usesRemaining?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

type ItemSummary = { id: number; name: string };
type SelectedItem = { itemId: number; quantity: number };

export default function AdminGiftcodesPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [gold, setGold] = useState<number | ''>('');
  const [uses, setUses] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const { data: codes, isLoading } = useQuery<Giftcode[]>({
    queryKey: ['adminGiftcodes'],
    queryFn: async () => {
      try {
        return await giftcodeApi.list();
      } catch (err) {
        console.error('Failed to load giftcodes', err);
        return [];
      }
    },
  });

  const handleCreate = async () => {
    if (!code) {
      toast.error('Vui lòng nhập mã giftcode');
      return;
    }

  const rewards: Record<string, number> = {};
    if (gold) rewards.gold = Number(gold);
    if (selectedItems.length > 0) {
      // include items in rewards as items: [{ itemId, quantity }]
      // The backend expects rewards JSON; mailbox.claimRewards understands rewards.items
      (rewards as unknown as Record<string, unknown>).items = selectedItems.map(s => ({ itemId: s.itemId, quantity: s.quantity }));
    }

    try {
      await giftcodeApi.create({ code, rewards, usesAllowed: uses || undefined, expiresAt: expiresAt || null });
      toast.success('Giftcode đã được tạo');
      setCode('');
      setGold('');
      setUses('');
      setExpiresAt('');
      qc.invalidateQueries({ queryKey: ['adminGiftcodes'] });
    } catch (error: unknown) {
      const e = error as unknown as { message?: string };
      toast.error(e?.message || 'Tạo giftcode thất bại');
    }
  };

  // load items for picker
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await itemsApi.getItems();
        const arr = Array.isArray(data) ? data : [];
        const list: ItemSummary[] = arr.map((it: unknown) => {
          const record = it as Record<string, unknown>;
          return { id: Number(record?.id ?? 0), name: String(record?.name ?? 'Unknown') };
        });
        if (mounted) setItems(list);
      } catch (e) {
        console.error('Failed to load items for giftcode picker', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addItem = (itemId: number) => {
    if (!itemId) return;
    if (selectedItems.find(s => s.itemId === itemId)) return;
    setSelectedItems([...selectedItems, { itemId, quantity: 1 }]);
  };

  const updateItemQty = (itemId: number, qty: number) => {
    setSelectedItems(selectedItems.map(s => s.itemId === itemId ? { ...s, quantity: qty } : s));
  };

  const removeItem = (itemId: number) => setSelectedItems(selectedItems.filter(s => s.itemId !== itemId));

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tạo Giftcode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code">Mã</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: WELCOME100" />
            </div>

            <div>
              <Label htmlFor="gold">Gold</Label>
              <Input id="gold" type="number" value={gold === '' ? '' : String(gold)} onChange={(e) => setGold(e.target.value ? Number(e.target.value) : '')} placeholder="Số gold" />
            </div>

            <div>
              <Label htmlFor="uses">Số lần sử dụng (rỗng = vô hạn)</Label>
              <Input id="uses" type="number" value={uses === '' ? '' : String(uses)} onChange={(e) => setUses(e.target.value ? Number(e.target.value) : '')} placeholder="Số lần" />
            </div>

            <div>
              <Label htmlFor="expiresAt">Hết hạn (UTC)</Label>
              <Input id="expiresAt" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>

            {/* Items picker for giftcode rewards */}
            <div>
              <Label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Chọn vật phẩm (tùy chọn)</Label>
              <div className="flex items-center gap-2">
                <select className="p-2 border rounded bg-white dark:bg-slate-800" onChange={(e) => addItem(Number(e.target.value))} value="">
                  <option value="">-- Chọn item --</option>
                  {items.map(it => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-2 space-y-2">
                  {selectedItems.map(si => (
                    <div key={si.itemId} className="flex items-center gap-2">
                      <div className="flex-1">{items.find(i=>i.id===si.itemId)?.name || si.itemId}</div>
                      <input type="number" min={1} className="w-20 p-1 border rounded" value={si.quantity} onChange={(e) => updateItemQty(si.itemId, Number(e.target.value) || 1)} />
                      <button className="text-red-600" onClick={() => removeItem(si.itemId)}>Xóa</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Button onClick={handleCreate}>Tạo</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách Giftcodes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(codes) && codes.length > 0 ? (
                  codes.map((c) => (
                    <div key={c.id} className="p-2 border rounded-md">
                      <div className="font-medium">{c.code} {c.isActive === false && <span className="text-xs text-red-500">(inactive)</span>}</div>
                      <div className="text-sm text-muted-foreground">Uses remaining: {c.usesRemaining ?? '∞'}</div>
                      <div className="text-sm text-muted-foreground">Expires: {c.expiresAt ?? 'Never'}</div>
                      <div className="text-sm">Rewards: {JSON.stringify(c.rewards)}</div>
                    </div>
                  ))
                ) : (
                  <div>Không có giftcode nào</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
