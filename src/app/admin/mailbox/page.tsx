 'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { api, itemsApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type ItemSummary = { id: number; name: string };
type SelectedItem = { itemId: number; quantity: number };

type MailPayloadRewards = {
  gold?: number;
  items?: Array<{ itemId: number; quantity: number }>
};

export default function AdminMailboxPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: number; username: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gold, setGold] = useState<number | ''>('');
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const debounceRef = useRef<number | null>(null);

  // Debounce using hooks so we don't call API each keystroke
  const search = useCallback((q: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data || []);
    } catch (err) {
      console.error('User search failed', err);
      setResults([]);
    }
    }, 250) as unknown as number;
  }, []);

  const onQueryChange = (v: string) => {
    setQuery(v);
    search(v);
  };

  // When clicking a result, set selected user and populate the input
  const pickUser = (id: number, username: string) => {
    setSelectedUser(id);
    setQuery(username);
    setResults([]);
  };

  // Fetch items once for dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await itemsApi.getItems();
        if (!mounted) return;
        // normalize to id/name — accept unknown shape from API but coerce safely
        const arr = Array.isArray(data) ? data : [];
        const list: ItemSummary[] = arr.map((it: unknown) => {
          const record = it as Record<string, unknown>;
          return { id: Number(record?.id ?? 0), name: String(record?.name ?? 'Unknown') };
        });
        setItems(list);
      } catch (e) {
        console.error('Failed to load items for admin mailbox', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addItem = (itemId: number) => {
    const exists = selectedItems.find((s) => s.itemId === itemId);
    if (exists) return;
    setSelectedItems([...selectedItems, { itemId, quantity: 1 }]);
  };

  const updateItemQty = (itemId: number, qty: number) => {
    setSelectedItems(selectedItems.map((s) => s.itemId === itemId ? { ...s, quantity: qty } : s));
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter((s) => s.itemId !== itemId));
  };

  const handleSend = async () => {
    if (!selectedUser) return toast.error('Chọn người nhận');
    try {
      const payload = {
        userId: selectedUser,
        title,
        content,
        type: 'reward',
        rewards: {} as MailPayloadRewards,
      };

      if (typeof gold === 'number') payload.rewards.gold = gold;
      if (selectedItems.length > 0) {
        payload.rewards.items = selectedItems.map((s) => ({ itemId: s.itemId, quantity: s.quantity }));
      }
      await api.post('/mailbox/send', payload);
      toast.success('Đã gửi mail thành công');
      // reset
      setTitle('');
      setContent('');
      setGold('');
      setSelectedUser(null);
      setQuery('');
      setResults([]);
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to send mail', err);
      toast.error('Lỗi khi gửi mail');
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gửi Mail / Tặng Quà</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Tìm người nhận</label>
                <Input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Nhập username..." />
                {results.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-slate-800 border rounded-md p-2 max-h-48 overflow-y-auto">
                    {results.map(r => (
                      <div key={r.id} className={`p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer ${selectedUser === r.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`} onClick={() => pickUser(r.id, r.username)}>
                        <div className="font-semibold">{r.username}</div>
                        <div className="text-xs text-gray-500">ID: {r.id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Tiêu đề</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề mail" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Nội dung</label>
                <textarea className="w-full p-2 border rounded-md bg-white dark:bg-slate-800" rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Gold (tùy chọn)</label>
                <Input value={gold as number | ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGold(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Số vàng" type="number" />
              </div>

              {/* Items picker for admin */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Chọn vật phẩm (tùy chọn)</label>
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

              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={!selectedUser || !title || !content}>Gửi</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
