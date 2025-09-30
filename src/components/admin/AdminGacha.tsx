'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { toast } from 'sonner';
// Image not needed here
import { DataTable } from './DataTable';

type GachaEntry = {
  id?: number;
  itemId?: number;
  itemJson?: unknown;
  amountMin: number;
  amountMax: number;
  weight?: number;
  probability?: number;
  groupKey?: string;
  guaranteed?: boolean;
};

type GachaBox = {
  id?: number;
  name: string;
  description?: string;
  image?: string;
  openMode?: 'single' | 'multi';
  isActive?: boolean;
  metadata?: unknown;
  entries?: GachaEntry[];
  createdAt?: string;
};

export default function AdminGacha() {
  const [editingBox, setEditingBox] = useState<GachaBox | null>(null);
  const [form, setForm] = useState<GachaBox>({ name: '', description: '', image: '', openMode: 'single', isActive: true, metadata: {} });
  const [entryForm, setEntryForm] = useState<GachaEntry>({ itemId: undefined, itemJson: undefined, amountMin: 1, amountMax: 1, weight: undefined, probability: undefined, groupKey: undefined, guaranteed: false });
  const [editingEntryBoxId, setEditingEntryBoxId] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<GachaEntry | null>(null);

  const { data: boxes = [], refetch } = useQuery({
    queryKey: ['adminGachaBoxes'],
    queryFn: async () => {
      try {
        const resp = await adminApiEndpoints.getGachaBoxes();
        return resp.data || [];
      } catch (err) {
        console.error('Failed to fetch gacha boxes', err);
        return [];
      }
    },
  });

  // local search text for entry item picker
  const [entryItemSearch, setEntryItemSearch] = useState('');

  // Fetch items so admin can choose a key item for requiredKey
  type ItemLite = { id: number; name?: string };

  const { data: items = [] } = useQuery<ItemLite[]>({
    queryKey: ['adminItemsForGacha'],
    queryFn: async () => {
      try {
        const resp = await adminApiEndpoints.getItems();
        return resp.data || [];
      } catch {
        return [];
      }
    },
  });

  // helpers to read/update requiredKeyItemId from metadata safely without using `any`
  const getRequiredKey = (metadata: unknown): number | undefined => {
    if (typeof metadata !== 'object' || metadata === null) return undefined;
    const m = metadata as Record<string, unknown>;
    const v = m['requiredKeyItemId'];
    return typeof v === 'number' ? v : undefined;
  };

  const setRequiredKeyInMetadata = (metadata: unknown, v?: number): unknown => {
    const base = (typeof metadata === 'object' && metadata !== null) ? { ...(metadata as Record<string, unknown>) } : {};
    if (v === undefined) {
      delete (base as Record<string, unknown>)['requiredKeyItemId'];
    } else {
      (base as Record<string, unknown>)['requiredKeyItemId'] = v;
    }
    return base;
  };

  useEffect(() => {
    if (editingBox) setForm({ ...editingBox });
    else setForm({ name: '', description: '', image: '', openMode: 'single', isActive: true, metadata: {} });
  }, [editingBox]);

  const startCreate = () => setEditingBox(null);
  const startEdit = (box: GachaBox) => setEditingBox(box);

  const handleSaveBox = async () => {
    if (!form.name) return toast.error('Tên hộp là bắt buộc');
    try {
      // Only send top-level allowed fields to the API (avoid sending `entries` array)
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image,
        openMode: form.openMode,
        isActive: form.isActive,
        metadata: form.metadata || {},
      } as const;

      if (editingBox && editingBox.id) {
        await adminApiEndpoints.updateGachaBox(editingBox.id, payload);
        toast.success('Đã cập nhật box');
      } else {
        await adminApiEndpoints.createGachaBox(payload);
        toast.success('Đã tạo box');
      }
      refetch();
      setEditingBox(null);
    } catch (error: unknown) {
      toast.error('Lỗi khi lưu box');
      console.error(error);
    }
  };

  const handleDeleteBox = async (id: number) => {
    if (!confirm('Xóa box?')) return;
    try {
      await adminApiEndpoints.deleteGachaBox(id);
      toast.success('Đã xóa box');
      refetch();
    } catch (err) {
      toast.error('Lỗi khi xóa box');
    }
  };

  // Entries management
  const startAddEntry = (boxId: number) => {
    setEditingEntryBoxId(boxId);
    setEditingEntry(null);
    setEntryForm({ itemId: undefined, itemJson: undefined, amountMin: 1, amountMax: 1, weight: undefined, probability: undefined, groupKey: undefined, guaranteed: false });
  };

  const startEditEntry = (boxId: number, entry: GachaEntry) => {
    setEditingEntryBoxId(boxId);
    setEditingEntry(entry);
    setEntryForm({ ...entry });
  };

  const handleSaveEntry = async () => {
    if (!editingEntryBoxId) return; // safety
    try {
      if (editingEntry && editingEntry.id) {
        await adminApiEndpoints.updateGachaEntry(editingEntry.id, entryForm);
        toast.success('Đã cập nhật entry');
      } else {
        await adminApiEndpoints.addGachaEntry(editingEntryBoxId, entryForm);
        toast.success('Đã thêm entry');
      }
      refetch();
      setEditingEntry(null);
      setEditingEntryBoxId(null);
    } catch {
      toast.error('Lỗi khi lưu entry');
      console.error('Failed to save entry');
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Xóa entry?')) return;
    try {
      await adminApiEndpoints.deleteGachaEntry(entryId);
      toast.success('Đã xóa entry');
      refetch();
    } catch (error) {
      toast.error('Lỗi khi xóa entry');
    }
  };

  // ...existing code...


  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gacha Boxes</h1>
          <div>
            <Button onClick={startCreate}>Tạo Box mới</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable<GachaBox & { id: number }>
              title="Boxes"
              data={boxes as Array<GachaBox & { id: number }>}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Tên' },
                { key: 'description', label: 'Mô tả' },
                { key: 'openMode', label: 'Mode' },
            { key: 'isActive', label: 'Active', render: (v: unknown) => (v ? 'Yes' : 'No') },
                { key: 'createdAt', label: 'Tạo' },
              ]}
              onEdit={(b) => startEdit(b)}
              onDelete={(b) => { if (b.id) handleDeleteBox(b.id); }}
              onView={(b) => {
                // open entries management
                if (b.id) startAddEntry(b.id);
              }}
            />
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{editingBox ? 'Chỉnh sửa Box' : 'Tạo Box'}</CardTitle>
                <CardDescription>Thông tin cơ bản</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Tên</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Open Mode</Label>
                    <select value={form.openMode} onChange={(e) => setForm({ ...form, openMode: e.target.value as 'single' | 'multi' })} className="w-full p-2 border rounded">
                      <option value="single">Single (per group)</option>
                      <option value="multi">Multi (independent trials)</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button onClick={handleSaveBox} className="flex-1">Lưu</Button>
                    <Button variant="outline" onClick={() => setEditingBox(null)}>Hủy</Button>
                  </div>

                  {editingBox && (
                    <div className="mt-4 border-t pt-3 space-y-2">
                      <div className="space-y-2">
                        <Label>Required Key Item (optional)</Label>
                        <select
                          value={getRequiredKey(form.metadata) ?? ''}
                          onChange={(e) => {
                            const v = e.target.value ? parseInt(e.target.value) : undefined;
                            setForm({ ...form, metadata: setRequiredKeyInMetadata(form.metadata, v) });
                          }}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">-- No key required --</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>{it.name} (id:{it.id})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Item creation is not automatic anymore - admins should create items in Items admin and select them when adding entries. */}
                        <Button size="sm" onClick={() => { if (editingBox?.id) startAddEntry(editingBox.id); }}>Thêm Entry</Button>
                      </div>

                      {/* Debug: show metadata JSON so admin can confirm fields like requiredKeyItemId are set before saving */}
                      <div className="mt-3 p-2 bg-gray-50 border rounded text-sm">
                        <div className="font-medium">Metadata (debug)</div>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(form.metadata || {}, null, 2)}</pre>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Entries</h4>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {(editingBox.entries || []).map((en: GachaEntry) => (
                            <div key={en.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{en.itemId ? `Item ${en.itemId}` : 'Custom JSON'}</div>
                                <div className="text-sm text-gray-500">Amt {en.amountMin}-{en.amountMax} • {en.groupKey || 'default'} • {en.guaranteed ? 'Guaranteed' : ''}</div>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="ghost" onClick={() => { if (editingBox?.id) startEditEntry(editingBox.id, en); }}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => { if (en.id) handleDeleteEntry(en.id); }}>Xóa</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Entry editor */}
            {editingEntryBoxId && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>{editingEntry ? 'Chỉnh sửa Entry' : 'Thêm Entry'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label>Item (chọn từ danh sách, nếu để trống sẽ dùng itemJson)</Label>
                      <div className="space-y-2">
                        <Input placeholder="Tìm item theo tên..." value={entryItemSearch} onChange={(e) => setEntryItemSearch(e.target.value)} />
                        <select value={entryForm.itemId ?? ''} onChange={(e) => { setEntryForm({ ...entryForm, itemId: e.target.value ? parseInt(e.target.value) : undefined }); setEntryItemSearch(''); }} className="w-full p-2 border rounded">
                          <option value="">-- Chọn item (hoặc để trống) --</option>
                          {items.filter((it) => {
                            const q = (entryItemSearch || '').toLowerCase();
                            return !q || (it.name || '').toLowerCase().includes(q);
                          }).map((it) => (
                            <option key={it.id} value={it.id}>{it.name} (id:{it.id})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Amount Min</Label>
                      <Input type="number" value={entryForm.amountMin} onChange={(e) => setEntryForm({ ...entryForm, amountMin: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <Label>Amount Max</Label>
                      <Input type="number" value={entryForm.amountMax} onChange={(e) => setEntryForm({ ...entryForm, amountMax: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <Label>Weight (single mode)</Label>
                      <Input type="number" min={0} step={1} value={entryForm.weight ?? ''} onChange={(e) => setEntryForm({ ...entryForm, weight: e.target.value !== '' ? parseInt(e.target.value) : undefined })} />
                      <div className="text-sm text-gray-500">Số nguyên không âm. Dùng trong chế độ single để so sánh trọng số giữa các entry.</div>
                    </div>
                    <div>
                      <Label>Probability (multi mode 0..1)</Label>
                      <Input type="number" min={0} max={1} step={0.001} value={entryForm.probability ?? ''} onChange={(e) => setEntryForm({ ...entryForm, probability: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} />
                      <div className="text-sm text-gray-500">Số thực trong khoảng [0, 1]. Cho phép nhập 0, 1, 0.2, 0.001, v.v. Dùng trong chế độ multi như xác suất mỗi lần rút.</div>
                    </div>
                    <div>
                      <Label>Group Key</Label>
                      <Input value={entryForm.groupKey || ''} onChange={(e) => setEntryForm({ ...entryForm, groupKey: e.target.value || undefined })} />
                      <div className="text-sm text-gray-500">{`(Tùy chọn) Group Key phân vùng để áp dụng cơ chế guarantee / quota trên tập con entry có cùng groupKey. Ví dụ: 'rare_queue' hoặc 'banner_2025'.`}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input id="guaranteed" type="checkbox" checked={entryForm.guaranteed || false} onChange={(e) => setEntryForm({ ...entryForm, guaranteed: e.target.checked })} />
                      <Label htmlFor="guaranteed">Guaranteed</Label>
                    </div>
                    <div className="text-sm text-gray-500">{`Khi checked, entry này được coi là 'được bảo đảm' cho user theo chính sách guarantee (ví dụ đảm bảo 1 món mỗi N mở — tùy logic backend).`}</div>

                    <div className="flex space-x-2 mt-3">
                      <Button onClick={handleSaveEntry} className="flex-1">Lưu Entry</Button>
                      <Button variant="outline" onClick={() => { setEditingEntryBoxId(null); setEditingEntry(null); }}>Hủy</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
