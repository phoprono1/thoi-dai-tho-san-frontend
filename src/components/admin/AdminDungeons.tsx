'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { adminApiEndpoints } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import Image from 'next/image';
import { Monster } from '@/types/monster';
import { Item } from '@/types/item';
import { DataTable } from '@/components/admin/DataTable';
import { resolveAssetUrl } from '@/lib/asset';

interface Dungeon {
  id: number;
  name: string;
  monsterIds: number[];
  monsterCounts: { monsterId: number; count: number }[];
  levelRequirement: number;
  isHidden: boolean;
  requiredItem: number | null;
  dropItems: { itemId: number; dropRate: number }[] | null;
  description?: string | null;
  image?: string; // Image path for the dungeon
  createdAt: string;
  updatedAt: string;
}

export default function AdminDungeons() {
  const [editingDungeon, setEditingDungeon] = useState<Dungeon | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    levelRequirement: 1,
    isHidden: false,
    requiredItem: 0,
    description: '',
    monsterIds: [] as number[],
    monsterCounts: [] as { monsterId: number; count: number }[],
    dropItems: [] as { itemId: number; dropRate: number }[],
  });

  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch all dungeons
  const { data: dungeons, isLoading } = useQuery({
    queryKey: ['adminDungeons'],
    queryFn: async (): Promise<Dungeon[]> => {
      try {
        const response = await adminApiEndpoints.getDungeons();
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch dungeons:', error);
        return [];
      }
    },
  });

  // Fetch all monsters
  const { data: monsters } = useQuery({
    queryKey: ['monsters'],
    queryFn: async (): Promise<Monster[]> => {
      try {
        const response = await api.get('/monsters');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch monsters:', error);
        return [];
      }
    },
  });

  // Fetch all items
  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: async (): Promise<Item[]> => {
      try {
        const response = await api.get('/items');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch items:', error);
        return [];
      }
    },
  });

  // Create dungeon mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      levelRequirement: number;
      isHidden: boolean;
      requiredItem: number | null;
      monsterIds: number[];
      monsterCounts: { monsterId: number; count: number }[];
      dropItems: { itemId: number; dropRate: number }[] | null;
    }) => {
      return await adminApiEndpoints.createDungeon(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDungeons'] });
      toast.success('Đã tạo dungeon thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo dungeon: ${error.message}`);
    },
  });

  // Update dungeon mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: {
        name: string;
        levelRequirement: number;
        isHidden: boolean;
        requiredItem: number | null;
        monsterIds: number[];
        monsterCounts: { monsterId: number; count: number }[];
        dropItems: { itemId: number; dropRate: number }[] | null;
      };
    }) => {
      return await adminApiEndpoints.updateDungeon(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDungeons'] });
      toast.success('Đã cập nhật dungeon thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật dungeon: ${error.message}`);
    },
  });

  // Delete dungeon mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await adminApiEndpoints.deleteDungeon(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDungeons'] });
      toast.success('Đã xóa dungeon thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa dungeon: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      levelRequirement: 1,
      isHidden: false,
      requiredItem: 0,
      description: '',
      monsterIds: [],
      monsterCounts: [],
      dropItems: [],
    });
    setEditingDungeon(null);
  };

  const handleCreateDungeon = () => {
    if (!formData.name) {
      toast.error('Vui lòng điền tên dungeon!');
      return;
    }

    const dungeonData = {
      name: formData.name,
      levelRequirement: formData.levelRequirement,
      isHidden: formData.isHidden,
      requiredItem: formData.requiredItem > 0 ? formData.requiredItem : null,
      description: formData.description || null,
      monsterIds: formData.monsterIds,
      monsterCounts: formData.monsterCounts,
      dropItems: formData.dropItems.length > 0 ? formData.dropItems : null,
    };

    createMutation.mutate(dungeonData, {
      onSuccess: async (res: unknown) => {
        const created = (res as unknown as { data?: Dungeon }).data;
        if (selectedFile && created?.id) {
          try {
            const form = new FormData();
            form.append('image', selectedFile);
            const up = await api.post(`/uploads/dungeons/${created.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            const upData = (up as unknown as { data?: unknown }).data as Record<string, unknown> | undefined;
            const thumbnails = upData && (upData['thumbnails'] as Record<string, string> | undefined);
            const prefer = thumbnails?.medium || upData?.path;
            if (prefer) await api.put(`/dungeons/${created.id}`, { image: prefer });
          } catch (err) {
            console.warn('Image upload failed for new dungeon', err);
          }
        }
      }
    });
  };

  const handleUpdateDungeon = () => {
    if (!editingDungeon || !formData.name) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const dungeonData = {
      name: formData.name,
      levelRequirement: formData.levelRequirement,
      isHidden: formData.isHidden,
      requiredItem: formData.requiredItem > 0 ? formData.requiredItem : null,
      description: formData.description || null,
      monsterIds: formData.monsterIds,
      monsterCounts: formData.monsterCounts,
      dropItems: formData.dropItems.length > 0 ? formData.dropItems : null,
    };

    updateMutation.mutate({ id: editingDungeon.id, data: dungeonData }, {
      onSuccess: async () => {
        if (selectedFile && editingDungeon) {
          try {
            const form = new FormData();
            form.append('image', selectedFile);
            const up = await api.post(`/uploads/dungeons/${editingDungeon.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            const upData = (up as unknown as { data?: unknown }).data as Record<string, unknown> | undefined;
            const thumbnails = upData && (upData['thumbnails'] as Record<string, string> | undefined);
            const prefer = thumbnails?.medium || upData?.path;
            if (prefer) await api.put(`/dungeons/${editingDungeon.id}`, { image: prefer });
          } catch (err) {
            console.warn('Image upload failed for dungeon update', err);
          }
        }
      }
    });
  };

  const handleDeleteDungeon = (dungeon: Dungeon) => {
    if (!confirm(`Bạn có chắc muốn xóa dungeon "${dungeon.name}"?`)) return;
    deleteMutation.mutate(dungeon.id);
  };

  const addMonster = () => {
    setFormData({
      ...formData,
      monsterIds: [...formData.monsterIds, 0],
      monsterCounts: [...formData.monsterCounts, { monsterId: 0, count: 1 }]
    });
  };

  const removeMonster = (index: number) => {
    setFormData({
      ...formData,
      monsterIds: formData.monsterIds.filter((_, i) => i !== index),
      monsterCounts: formData.monsterCounts.filter((_, i) => i !== index)
    });
  };

  const updateMonster = (index: number, monsterId: number, count: number) => {
    const updatedMonsterIds = [...formData.monsterIds];
    const updatedMonsterCounts = [...formData.monsterCounts];
    
    updatedMonsterIds[index] = monsterId;
    updatedMonsterCounts[index] = { monsterId, count };
    
    setFormData({
      ...formData,
      monsterIds: updatedMonsterIds,
      monsterCounts: updatedMonsterCounts
    });
  };

  const addDropItem = () => {
    setFormData({
      ...formData,
      dropItems: [...formData.dropItems, { itemId: 0, dropRate: 0.1 }]
    });
  };

  const removeDropItem = (index: number) => {
    setFormData({
      ...formData,
      dropItems: formData.dropItems.filter((_, i) => i !== index)
    });
  };

  const updateDropItem = (index: number, field: keyof { itemId: number; dropRate: number }, value: number) => {
    const updatedDropItems = [...formData.dropItems];
    updatedDropItems[index] = { ...updatedDropItems[index], [field]: value };
    setFormData({
      ...formData,
      dropItems: updatedDropItems
    });
  };

  const startEdit = (dungeon: Dungeon) => {
    setEditingDungeon(dungeon);
    setFormData({
      name: dungeon.name,
      levelRequirement: dungeon.levelRequirement,
      isHidden: dungeon.isHidden,
      requiredItem: dungeon.requiredItem || 0,
      description: dungeon.description || '',
      monsterIds: dungeon.monsterIds || [],
      monsterCounts: dungeon.monsterCounts || [],
      dropItems: dungeon.dropItems || [],
    });
  };



  const columns = [
    {
      key: 'image' as keyof Dungeon,
      label: 'Hình ảnh',
      sortable: false,
      render: (value: unknown, item: Dungeon) => (
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {item.image ? (
            <Image
              src={resolveAssetUrl(item.image) || ''}
              alt={item.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-xs">
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name' as keyof Dungeon,
      label: 'Tên Dungeon',
      sortable: true,
    },
    {
      key: 'levelRequirement' as keyof Dungeon,
      label: 'Level yêu cầu',
      sortable: true,
    },
    {
      key: 'monsterCounts' as keyof Dungeon,
      label: 'Quái vật',
      render: (value: unknown) => {
        const monsterCounts = value as Dungeon['monsterCounts'];
        const totalMonsters = monsterCounts?.reduce((sum, mc) => sum + mc.count, 0) || 0;
        return (
          <div className="text-sm">
            {totalMonsters > 0 ? `${totalMonsters} quái` : 'Không có quái'}
          </div>
        );
      },
    },
    {
      key: 'isHidden' as keyof Dungeon,
      label: 'Ẩn',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${value ? 'bg-red-500' : 'bg-green-500'}`}>
          {value ? 'Ẩn' : 'Hiển thị'}
        </span>
      ),
    },
    {
      key: 'dropItems' as keyof Dungeon,
      label: 'Items rơi',
      render: (value: unknown) => {
        const dropItems = value as Dungeon['dropItems'];
        return (
          <div className="text-sm">
            {dropItems && dropItems.length > 0 ? `${dropItems.length} items` : 'Không có items'}
          </div>
        );
      },
    },
    {
      key: 'description' as keyof Dungeon,
      label: 'Mô tả',
      render: (value: unknown) => (
        <div className="text-sm max-w-xl truncate">{(value as string) || '—'}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6 dark:text-gray-100">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Dungeons</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dungeons?.length || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-300">Dungeon có sẵn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dungeon ẩn</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dungeons?.filter(d => d.isHidden).length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-300">Dungeon bị ẩn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dungeon hiển thị</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dungeons?.filter(d => !d.isHidden).length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-300">Dungeon đang hiển thị</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quái vật</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dungeons?.reduce((sum, dungeon) => sum + (dungeon.monsterCounts?.reduce((mcSum, mc) => mcSum + mc.count, 0) || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-300">Quái vật trong tất cả dungeon</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex space-x-2 mt-4 lg:col-span-3">
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await adminApiEndpoints.exportDungeonsTemplate();
              const blob = new Blob([res.data]);
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'dungeons-template.csv';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error(err);
              toast.error('Không thể tải template');
            }
          }}>
            Tải mẫu
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => {
            try {
              const res = await adminApiEndpoints.exportDungeons();
              const blob = new Blob([res.data]);
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'dungeons-export.csv';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error('Download all dungeons failed', err);
              toast.error('Không thể tải toàn bộ dungeons');
            }
          }}>
            Tải toàn bộ
          </Button>

          <input id="dungeons-import-input" type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const form = new FormData();
            form.append('file', file);
            form.append('sync', 'true');
            try {
              console.info('Uploading dungeons CSV', file.name, file.size);
              toast('Uploading file...');
              const resp = await adminApiEndpoints.importDungeons(form);
              const data = resp.data;
              console.info('Import response', data);
              if (data?.result) {
                const parsed = data.result.parsed || data.parsed || 0;
                const parseErrors = data.result.result?.parseErrors || data.result.parseErrors || [];
                if (parseErrors.length > 0) {
                  toast.error(`Import completed with ${parseErrors.length} parse errors (check console)`);
                  console.error('Import parseErrors', parseErrors, data);
                } else {
                  toast.success(`Import finished, parsed ${parsed} rows`);
                }
              } else {
                toast.success('Đã gửi import job: ' + (data.jobId || 'unknown'));
              }
            } catch (errUnknown: unknown) {
              console.error('Import request failed', errUnknown);
              const respErr = errUnknown as unknown as { response?: { data?: { message?: string }; statusText?: string }; message?: string };
              let msg = 'Lỗi khi import file';
              if (respErr?.response) {
                msg = respErr.response.data?.message || respErr.response.statusText || respErr.message || msg;
                console.error('Server response error', respErr.response);
              } else if (errUnknown instanceof Error) {
                msg = errUnknown.message;
              }
              toast.error(String(msg));
            } finally {
              try { (e.target as HTMLInputElement).value = ''; } catch { }
            }
          }} />
          <Button size="sm" className="ml-2" onClick={() => document.getElementById('dungeons-import-input')?.click()}>Import CSV</Button>
        </div>
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingDungeon ? 'Chỉnh sửa Dungeon' : 'Tạo Dungeon mới'}
            </CardTitle>
            <CardDescription>
              {editingDungeon ? 'Cập nhật thông tin dungeon' : 'Thêm dungeon mới vào hệ thống'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Dungeon</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nhập tên dungeon"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="levelRequirement">Level yêu cầu</Label>
                <Input
                  id="levelRequirement"
                  type="number"
                  min="1"
                  value={formData.levelRequirement}
                  onChange={(e) => setFormData({...formData, levelRequirement: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isHidden">Ẩn dungeon</Label>
                <select
                  id="isHidden"
                  value={formData.isHidden.toString()}
                  onChange={(e) => setFormData({...formData, isHidden: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="false">Hiển thị</option>
                  <option value="true">Ẩn</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredItem">Item yêu cầu (tùy chọn)</Label>
              <select
                id="requiredItem"
                value={formData.requiredItem}
                onChange={(e) => setFormData({...formData, requiredItem: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              >
                <option value={0}>Không yêu cầu item</option>
                {items?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (ID: {item.id})
                  </option>
                ))}
              </select>
            </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                  placeholder="Mô tả ngắn cho dungeon (tùy chọn)"
                  rows={3}
                />
              </div>

            <div className="space-y-2">
              <Label>Hình ảnh (tùy chọn)</Label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f) setPreviewUrl(URL.createObjectURL(f));
                    else setPreviewUrl(null);
                  }}
                />
                {previewUrl && (
                  <Image src={previewUrl} alt="preview" width={96} height={96} className="rounded object-cover" unoptimized />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Danh sách quái vật</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMonster}>
                  + Thêm quái
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.monsterCounts.map((monsterCount, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <select
                      value={monsterCount.monsterId}
                      onChange={(e) => updateMonster(index, parseInt(e.target.value), monsterCount.count)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                    >
                      <option value={0}>Chọn quái vật...</option>
                      {monsters?.map((monster) => (
                        <option key={monster.id} value={monster.id}>
                          {monster.name} (Lv.{monster.level})
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={monsterCount.count}
                      onChange={(e) => updateMonster(index, monsterCount.monsterId, parseInt(e.target.value) || 1)}
                      className="w-24"
                      min="1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMonster(index)}
                    >
                      X
                    </Button>
                  </div>
                ))}
                {formData.monsterCounts.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center py-4">Chưa có quái vật nào</p>
                )}
                  {formData.monsterCounts.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-100 text-center py-4">Chưa có quái vật nào</p>
                  )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items rơi (tùy chọn)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDropItem}>
                  + Thêm item
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.dropItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateDropItem(index, 'itemId', parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                    >
                      <option value={0}>Chọn item...</option>
                      {items?.map((itemOption) => (
                        <option key={itemOption.id} value={itemOption.id}>
                          {itemOption.name} (ID: {itemOption.id})
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="Tỷ lệ rơi"
                      value={item.dropRate}
                      onChange={(e) => updateDropItem(index, 'dropRate', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDropItem(index)}
                    >
                      X
                    </Button>
                  </div>
                ))}
                {formData.dropItems.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center py-4">Chưa có item rơi nào</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={editingDungeon ? handleUpdateDungeon : handleCreateDungeon}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingDungeon ? 'Cập nhật' : 'Tạo Dungeon'}
              </Button>
              {editingDungeon && (
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dungeons List */}
        <div className="lg:col-span-2">
          <DataTable
            title="Danh sách Dungeons"
            data={dungeons || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm dungeon..."
            searchFields={['name']}
            onCreate={() => resetForm()}
            onEdit={startEdit}
            onDelete={handleDeleteDungeon}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
