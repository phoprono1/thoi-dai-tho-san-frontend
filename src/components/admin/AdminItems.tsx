'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Image from 'next/image';
import { toast } from 'sonner';
import { Sword, Shield, Crown, Edit, Trash2, Plus, Package } from 'lucide-react';
import { UploadCloud, DownloadCloud } from 'lucide-react';
import { Item, ItemType, ConsumableType, ItemSet, ClassRestrictions, SetBonus, ClassType, ClassTier } from '@/types/game';

export default function AdminItems() {
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingSet, setEditingSet] = useState<ItemSet | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'sets'>('items');
  const [formData, setFormData] = useState({
    name: '',
    type: ItemType.WEAPON,
    consumableType: ConsumableType.HP_POTION,
    rarity: 1,
    price: 0,
    consumableValue: 0,
    duration: 0,
    setId: 0,
    // Base stats
    attack: 0,
    defense: 0,
    hp: 0,
    // Advanced stats
    critRate: 0,
    critDamage: 0,
    comboRate: 0,
    counterRate: 0,
    lifesteal: 0,
    armorPen: 0,
    dodgeRate: 0,
    accuracy: 0,
    // Stat boost stats
    strength: 0,
    intelligence: 0,
    dexterity: 0,
    vitality: 0,
    luck: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [classRestrictions, setClassRestrictions] = useState<ClassRestrictions>({
    allowedClassTypes: [],
    restrictedClassTypes: [],
    requiredTier: ClassTier.BASIC,
    description: '',
  });

  // Fetch all item sets
  const { data: itemSets, refetch: refetchSets } = useQuery({
    queryKey: ['adminItemSets'],
    queryFn: async (): Promise<ItemSet[]> => {
      try {
        const response = await api.get('/item-sets');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch item sets:', error);
        return [];
      }
    },
  });

  const [itemSetFormData, setItemSetFormData] = useState({
    name: '',
    description: '',
    rarity: 1,
    setBonuses: [] as SetBonus[],
    itemIds: [] as number[],
  });

  // Fetch all items
  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['adminItems'],
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

  const resetItemSetForm = () => {
    setItemSetFormData({
      name: '',
      description: '',
      rarity: 1,
      setBonuses: [] as SetBonus[],
      itemIds: [] as number[],
    });
    setEditingSet(null);
  };

  const handleCreateItemSet = async () => {
    if (!itemSetFormData.name) {
      toast.error('Vui lòng điền tên item set!');
      return;
    }

    try {
      await api.post('/item-sets', itemSetFormData);
      toast.success('Đã tạo item set thành công!');
      resetItemSetForm();
      refetchSets();
    } catch (error: unknown) {
      toast.error(`Lỗi tạo item set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateItemSet = async () => {
    if (!editingSet || !itemSetFormData.name) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      await api.put(`/item-sets/${editingSet.id}`, itemSetFormData);
      toast.success('Đã cập nhật item set thành công!');
      resetItemSetForm();
      refetchSets();
    } catch (error: unknown) {
      toast.error(`Lỗi cập nhật item set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteItemSet = async (setId: number) => {
    if (!confirm('Bạn có chắc muốn xóa item set này?')) return;

    try {
      await api.delete(`/item-sets/${setId}`);
      toast.success('Đã xóa item set thành công!');
      refetchSets();
    } catch (error: unknown) {
      toast.error(`Lỗi xóa item set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startEditSet = (itemSet: ItemSet) => {
    setEditingSet(itemSet);
    setItemSetFormData({
      name: itemSet.name,
      description: itemSet.description || '',
      rarity: itemSet.rarity,
      setBonuses: itemSet.setBonuses || [],
      itemIds: itemSet.items?.map(item => item.id) || [],
    });
  };

  const addSetBonus = () => {
    setItemSetFormData({
      ...itemSetFormData,
      setBonuses: [
        ...itemSetFormData.setBonuses,
        {
          pieces: 2,
          type: 'flat' as const,
          stats: {},
          description: '',
        },
      ],
    });
  };

  const updateSetBonus = (index: number, bonus: SetBonus) => {
    const newBonuses = [...itemSetFormData.setBonuses];
    newBonuses[index] = bonus;
    setItemSetFormData({
      ...itemSetFormData,
      setBonuses: newBonuses,
    });
  };

  const removeSetBonus = (index: number) => {
    setItemSetFormData({
      ...itemSetFormData,
      setBonuses: itemSetFormData.setBonuses.filter((_: SetBonus, i: number) => i !== index),
    });
  };

  const handleCreateItem = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const itemData = {
        ...formData,
        stats: {
          // Base stats
          attack: formData.attack || undefined,
          defense: formData.defense || undefined,
          hp: formData.hp || undefined,
          // Advanced stats
          critRate: formData.critRate || undefined,
          critDamage: formData.critDamage || undefined,
          comboRate: formData.comboRate || undefined,
          counterRate: formData.counterRate || undefined,
          lifesteal: formData.lifesteal || undefined,
          armorPen: formData.armorPen || undefined,
          dodgeRate: formData.dodgeRate || undefined,
          accuracy: formData.accuracy || undefined,
          // Stat boost stats
          strength: formData.strength || undefined,
          intelligence: formData.intelligence || undefined,
          dexterity: formData.dexterity || undefined,
          vitality: formData.vitality || undefined,
          luck: formData.luck || undefined,
        },
        // Consumable data
        consumableType: formData.type === ItemType.CONSUMABLE ? formData.consumableType : undefined,
        consumableValue: formData.type === ItemType.CONSUMABLE ? formData.consumableValue : undefined,
        duration: formData.type === ItemType.CONSUMABLE && formData.consumableType === ConsumableType.STAT_BOOST ? formData.duration : undefined,
        // Set and class restrictions
        setId: formData.setId || undefined,
        classRestrictions:
          classRestrictions.allowedClassTypes?.length ||
          classRestrictions.restrictedClassTypes?.length ||
          classRestrictions.requiredTier ||
          classRestrictions.description ||
          classRestrictions.requiredLevel
            ? classRestrictions
            : undefined,
      };

      const resp = await api.post('/items', itemData);
      const created: Item = resp.data;
      // If an image file was selected, upload it and prefer the 256px thumbnail for the stored image
      if (selectedFile && created?.id) {
        try {
          const form = new FormData();
          form.append('image', selectedFile);
          const up = await api.post(`/uploads/items/${created.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
          const thumbnails = up?.data?.thumbnails;
          const prefer = thumbnails?.medium || up?.data?.path;
          if (prefer) await api.put(`/items/${created.id}`, { image: prefer });
        } catch (err) {
          console.warn('Image upload failed for new item', err);
          // continue — item was created
        }
      }
      toast.success('Đã tạo item thành công!');
      setFormData({
        name: '',
        type: ItemType.WEAPON,
        consumableType: ConsumableType.HP_POTION,
        rarity: 1,
        price: 0,
        consumableValue: 0,
        duration: 0,
        setId: 0,
        attack: 0,
        defense: 0,
        hp: 0,
        critRate: 0,
        critDamage: 0,
        comboRate: 0,
        counterRate: 0,
        lifesteal: 0,
        armorPen: 0,
        dodgeRate: 0,
        accuracy: 0,
        strength: 0,
        intelligence: 0,
        dexterity: 0,
        vitality: 0,
        luck: 0,
      });
      setClassRestrictions({
        allowedClassTypes: [],
        restrictedClassTypes: [],
        requiredTier: ClassTier.BASIC,
        description: '',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi tạo item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.name || !formData.type) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const itemData = {
        ...formData,
        stats: {
          // Base stats
          attack: formData.attack || undefined,
          defense: formData.defense || undefined,
          hp: formData.hp || undefined,
          // Advanced stats
          critRate: formData.critRate || undefined,
          critDamage: formData.critDamage || undefined,
          comboRate: formData.comboRate || undefined,
          counterRate: formData.counterRate || undefined,
          lifesteal: formData.lifesteal || undefined,
          armorPen: formData.armorPen || undefined,
          dodgeRate: formData.dodgeRate || undefined,
          accuracy: formData.accuracy || undefined,
          // Stat boost stats
          strength: formData.strength || undefined,
          intelligence: formData.intelligence || undefined,
          dexterity: formData.dexterity || undefined,
          vitality: formData.vitality || undefined,
          luck: formData.luck || undefined,
        },
        // Consumable data
        consumableType: formData.type === ItemType.CONSUMABLE ? formData.consumableType : undefined,
        consumableValue: formData.type === ItemType.CONSUMABLE ? formData.consumableValue : undefined,
        duration: formData.type === ItemType.CONSUMABLE && formData.consumableType === ConsumableType.STAT_BOOST ? formData.duration : undefined,
        // Set and class restrictions
        setId: formData.setId || undefined,
        classRestrictions:
          classRestrictions.allowedClassTypes?.length ||
          classRestrictions.restrictedClassTypes?.length ||
          classRestrictions.requiredTier ||
          classRestrictions.description ||
          classRestrictions.requiredLevel
            ? classRestrictions
            : undefined,
      };

      await api.put(`/items/${editingItem.id}`, itemData);
      // If a new image is selected, upload and then update the item's image to the 256px thumbnail if available
      if (selectedFile) {
        try {
          const form = new FormData();
          form.append('image', selectedFile);
          const up = await api.post(`/uploads/items/${editingItem.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
          const thumbnails = up?.data?.thumbnails;
          const prefer = thumbnails?.medium || up?.data?.path;
          if (prefer) await api.put(`/items/${editingItem.id}`, { image: prefer });
        } catch (err) {
          console.warn('Image upload failed for item update', err);
        }
      }
      toast.success('Đã cập nhật item thành công!');
      setFormData({
        name: '',
        type: ItemType.WEAPON,
        consumableType: ConsumableType.HP_POTION,
        rarity: 1,
        price: 0,
        consumableValue: 0,
        duration: 0,
        setId: 0,
        attack: 0,
        defense: 0,
        hp: 0,
        critRate: 0,
        critDamage: 0,
        comboRate: 0,
        counterRate: 0,
        lifesteal: 0,
        armorPen: 0,
        dodgeRate: 0,
        accuracy: 0,
        strength: 0,
        intelligence: 0,
        dexterity: 0,
        vitality: 0,
        luck: 0,
      });
      setClassRestrictions({
        allowedClassTypes: [],
        restrictedClassTypes: [],
        requiredTier: ClassTier.BASIC,
        description: '',
      });
      setEditingItem(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi cập nhật item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Bạn có chắc muốn xóa item này?')) return;

    try {
      await api.delete(`/items/${itemId}`);
      toast.success('Đã xóa item thành công!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi xóa item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      consumableType: item.consumableType || ConsumableType.HP_POTION,
      rarity: item.rarity,
      price: item.price,
      consumableValue: item.consumableValue || 0,
      duration: item.duration || 0,
      setId: item.setId || 0,
      // Base stats
      attack: item.stats.attack || 0,
      defense: item.stats.defense || 0,
      hp: item.stats.hp || 0,
      // Advanced stats
      critRate: item.stats.critRate || 0,
      critDamage: item.stats.critDamage || 0,
      comboRate: item.stats.comboRate || 0,
      counterRate: item.stats.counterRate || 0,
      lifesteal: item.stats.lifesteal || 0,
      armorPen: item.stats.armorPen || 0,
      dodgeRate: item.stats.dodgeRate || 0,
      accuracy: item.stats.accuracy || 0,
      // Stat boost stats
      strength: item.stats.strength || 0,
      intelligence: item.stats.intelligence || 0,
      dexterity: item.stats.dexterity || 0,
      vitality: item.stats.vitality || 0,
      luck: item.stats.luck || 0,
    });
    setClassRestrictions(item.classRestrictions || {
      allowedClassTypes: [],
      restrictedClassTypes: [],
      requiredTier: ClassTier.BASIC,
      description: '',
    });
  };

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 1: return 'bg-gray-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-purple-500';
      case 5: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityName = (rarity: number) => {
    switch (rarity) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      case 5: return 'Legendary';
      default: return 'Common';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải danh sách items...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Items Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Quản lý items, weapons, armor và item sets trong hệ thống</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'items' | 'sets')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="sets">Item Sets</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-8">
              <div className="flex space-x-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    // download template from backend
                    try {
                      const res = await api.get('/admin/export/template/items', { responseType: 'blob' });
                      const blob = new Blob([res.data]);
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'items-template.csv';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    } catch (e) {
                      console.error(e);
                      toast.error('Không thể tải template');
                    }
                  }}
                >
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Tải mẫu
                </Button>

                <input id="items-import-input" type="file" accept=".csv" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const form = new FormData();
                      form.append('file', file);
                      // request synchronous processing so the admin gets immediate feedback
                      form.append('sync', 'true');
                      try {
                        console.info('Uploading items CSV', file.name, file.size);
                        toast('Uploading file...');
                        const resp = await api.post('/admin/import/items', form);
                        const data = resp.data;
                        console.info('Import response', data);
                        // server may return { jobId } for background or { jobId, result } for sync
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
                        // Show any server message if present
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const respErr: any = errUnknown as any;
                        let msg = 'Lỗi khi import file';
                        if (respErr?.response) {
                          msg = respErr?.response?.data?.message || respErr?.message || msg;
                          console.error('Server response error', respErr.response);
                        } else if (errUnknown instanceof Error) {
                          msg = errUnknown.message;
                        }
                        toast.error(String(msg));
                      } finally {
                        // reset the input so the same file can be chosen again
                        try { (e.target as HTMLInputElement).value = ''; } catch { }
                      }
                    }} />
                  <Button size="sm" className="ml-2" onClick={() => document.getElementById('items-import-input')?.click()}>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await api.get('/admin/export/items', { responseType: 'blob' });
                      const blob = new Blob([res.data]);
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'items-export.csv';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    } catch (e) {
                      console.error(e);
                      toast.error('Không thể tải dữ liệu');
                    }
                  }}
                >
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Tải toàn bộ
                </Button>
              </div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Items</CardTitle>
                  <Sword className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{items?.length || 0}</div>
                  <p className="text-xs text-muted-foreground dark:text-gray-300">Items trong hệ thống</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weapons</CardTitle>
                  <Sword className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {items?.filter(i => i.type.toLowerCase().includes('weapon')).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Vũ khí</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Armor</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {items?.filter(i => i.type.toLowerCase().includes('armor')).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Giáp</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consumables</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {items?.filter(i => i.type === ItemType.CONSUMABLE).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Consumable Items</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Create Sample</CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      try {
                        await api.post('/items/create-sample');
                        toast.success('Sample items created!');
                        refetch();
                      } catch {
                        toast.error('Failed to create sample items');
                      }
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Create Sample
                  </Button>
                </CardContent>
              </Card>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create/Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingItem ? 'Chỉnh sửa Item' : 'Tạo Item mới'}
              </CardTitle>
              <CardDescription>
                {editingItem ? 'Cập nhật thông tin item' : 'Thêm item mới vào hệ thống'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên Item</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nhập tên item"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Loại Item</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ItemType) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ItemType.WEAPON}>Weapon</SelectItem>
                      <SelectItem value={ItemType.ARMOR}>Armor</SelectItem>
                      <SelectItem value={ItemType.ACCESSORY}>Accessory</SelectItem>
                      <SelectItem value={ItemType.CONSUMABLE}>Consumable</SelectItem>
                      <SelectItem value={ItemType.MATERIAL}>Material</SelectItem>
                      <SelectItem value={ItemType.QUEST}>Quest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rarity">Độ hiếm (1-5)</Label>
                  <Input
                    id="rarity"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rarity}
                    onChange={(e) => setFormData({...formData, rarity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Giá</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
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

              {/* Class Restrictions */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Class Restrictions</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Allowed Class Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(ClassType).map((classType) => (
                        <div key={classType} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`allowed-${classType}`}
                            checked={classRestrictions.allowedClassTypes?.includes(classType) || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setClassRestrictions({
                                ...classRestrictions,
                                allowedClassTypes: isChecked
                                  ? [...(classRestrictions.allowedClassTypes || []), classType]
                                  : (classRestrictions.allowedClassTypes || []).filter(t => t !== classType)
                              });
                            }}
                          />
                          <Label htmlFor={`allowed-${classType}`} className="text-sm capitalize">
                            {classType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Restricted Class Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(ClassType).map((classType) => (
                        <div key={classType} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`restricted-${classType}`}
                            checked={classRestrictions.restrictedClassTypes?.includes(classType) || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setClassRestrictions({
                                ...classRestrictions,
                                restrictedClassTypes: isChecked
                                  ? [...(classRestrictions.restrictedClassTypes || []), classType]
                                  : (classRestrictions.restrictedClassTypes || []).filter(t => t !== classType)
                              });
                            }}
                          />
                          <Label htmlFor={`restricted-${classType}`} className="text-sm capitalize">
                            {classType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredTier">Required Tier</Label>
                    <Select
                      value={classRestrictions.requiredTier?.toString() || ''}
                      onValueChange={(value) => setClassRestrictions({
                        ...classRestrictions,
                        requiredTier: value ? parseInt(value) as ClassTier : undefined
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select minimum tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ClassTier.BASIC.toString()}>Basic (Tier 1)</SelectItem>
                        <SelectItem value={ClassTier.ADVANCED.toString()}>Advanced (Tier 2)</SelectItem>
                        <SelectItem value={ClassTier.MASTER.toString()}>Master (Tier 3)</SelectItem>
                        <SelectItem value={ClassTier.LEGENDARY.toString()}>Legendary (Tier 4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredLevel">Required Level</Label>
                    <Input
                      id="requiredLevel"
                      type="number"
                      min={1}
                      value={classRestrictions.requiredLevel ?? ''}
                      onChange={(e) => setClassRestrictions({
                        ...classRestrictions,
                        requiredLevel: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="Enter minimum required level"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restrictionDescription">Restriction Description</Label>
                    <Textarea
                      id="restrictionDescription"
                      value={classRestrictions.description || ''}
                      onChange={(e) => setClassRestrictions({
                        ...classRestrictions,
                        description: e.target.value
                      })}
                      placeholder="Describe the class restrictions..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Consumable Options */}
              {formData.type === ItemType.CONSUMABLE && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold">Consumable Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consumableType">Consumable Type</Label>
                      <Select
                        value={formData.consumableType}
                        onValueChange={(value: ConsumableType) => setFormData({...formData, consumableType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại consumable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ConsumableType.HP_POTION}>HP Potion</SelectItem>
                          <SelectItem value={ConsumableType.MP_POTION}>MP Potion</SelectItem>
                          <SelectItem value={ConsumableType.EXP_POTION}>EXP Potion</SelectItem>
                          <SelectItem value={ConsumableType.STAT_BOOST}>Stat Boost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consumableValue">
                        {formData.consumableType === ConsumableType.HP_POTION && 'HP Restore'}
                        {formData.consumableType === ConsumableType.MP_POTION && 'MP Restore'}
                        {formData.consumableType === ConsumableType.EXP_POTION && 'EXP Amount'}
                        {formData.consumableType === ConsumableType.STAT_BOOST && 'Boost Amount'}
                      </Label>
                      <Input
                        id="consumableValue"
                        type="number"
                        value={formData.consumableValue}
                        onChange={(e) => setFormData({...formData, consumableValue: parseInt(e.target.value) || 0})}
                        placeholder="Enter value"
                      />
                    </div>
                  </div>
                  {formData.consumableType === ConsumableType.STAT_BOOST && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                          placeholder="Enter duration in minutes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stat Boost Values</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="strength" className="text-sm">Strength</Label>
                            <Input
                              id="strength"
                              type="number"
                              value={formData.strength}
                              onChange={(e) => setFormData({...formData, strength: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="intelligence" className="text-sm">Intelligence</Label>
                            <Input
                              id="intelligence"
                              type="number"
                              value={formData.intelligence}
                              onChange={(e) => setFormData({...formData, intelligence: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dexterity" className="text-sm">Dexterity</Label>
                            <Input
                              id="dexterity"
                              type="number"
                              value={formData.dexterity}
                              onChange={(e) => setFormData({...formData, dexterity: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="vitality" className="text-sm">Vitality</Label>
                            <Input
                              id="vitality"
                              type="number"
                              value={formData.vitality}
                              onChange={(e) => setFormData({...formData, vitality: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="luck" className="text-sm">Luck</Label>
                            <Input
                              id="luck"
                              type="number"
                              value={formData.luck}
                              onChange={(e) => setFormData({...formData, luck: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Base Stats</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="attack" className="text-sm">Attack</Label>
                    <Input
                      id="attack"
                      type="number"
                      value={formData.attack}
                      onChange={(e) => setFormData({...formData, attack: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defense" className="text-sm">Defense</Label>
                    <Input
                      id="defense"
                      type="number"
                      value={formData.defense}
                      onChange={(e) => setFormData({...formData, defense: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hp" className="text-sm">HP</Label>
                    <Input
                      id="hp"
                      type="number"
                      value={formData.hp}
                      onChange={(e) => setFormData({...formData, hp: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Advanced Stats (%)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="critRate" className="text-sm">Crit Rate (%)</Label>
                    <Input
                      id="critRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.critRate}
                      onChange={(e) => setFormData({...formData, critRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="critDamage" className="text-sm">Crit Damage (%)</Label>
                    <Input
                      id="critDamage"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.critDamage}
                      onChange={(e) => setFormData({...formData, critDamage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="comboRate" className="text-sm">Combo Rate (%)</Label>
                    <Input
                      id="comboRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.comboRate}
                      onChange={(e) => setFormData({...formData, comboRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="counterRate" className="text-sm">Counter Rate (%)</Label>
                    <Input
                      id="counterRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.counterRate}
                      onChange={(e) => setFormData({...formData, counterRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lifesteal" className="text-sm">Lifesteal (%)</Label>
                    <Input
                      id="lifesteal"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.lifesteal}
                      onChange={(e) => setFormData({...formData, lifesteal: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="armorPen" className="text-sm">Armor Pen (%)</Label>
                    <Input
                      id="armorPen"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.armorPen}
                      onChange={(e) => setFormData({...formData, armorPen: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dodgeRate" className="text-sm">Dodge Rate (%)</Label>
                    <Input
                      id="dodgeRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.dodgeRate}
                      onChange={(e) => setFormData({...formData, dodgeRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accuracy" className="text-sm">Accuracy (%)</Label>
                    <Input
                      id="accuracy"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.accuracy}
                      onChange={(e) => setFormData({...formData, accuracy: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={editingItem ? handleUpdateItem : handleCreateItem}
                  className="flex-1"
                >
                  {editingItem ? 'Cập nhật' : 'Tạo Item'}
                </Button>
                {editingItem && (
                  <Button variant="outline" onClick={() => {
                    setEditingItem(null);
                    setFormData({
                      name: '',
                      type: ItemType.WEAPON,
                      consumableType: ConsumableType.HP_POTION,
                      rarity: 1,
                      price: 0,
                      consumableValue: 0,
                      duration: 0,
                      setId: 0,
                      attack: 0,
                      defense: 0,
                      hp: 0,
                      critRate: 0,
                      critDamage: 0,
                      comboRate: 0,
                      counterRate: 0,
                      lifesteal: 0,
                      armorPen: 0,
                      dodgeRate: 0,
                      accuracy: 0,
                      strength: 0,
                      intelligence: 0,
                      dexterity: 0,
                      vitality: 0,
                      luck: 0,
                    });
                    setClassRestrictions({
                      allowedClassTypes: [],
                      restrictedClassTypes: [],
                      requiredTier: ClassTier.BASIC,
                      description: '',
                    });
                  }}>
                    Hủy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Items</CardTitle>
              <CardDescription>
                Tất cả items trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {item.type.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold dark:text-gray-100">{item.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.type}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRarityColor(item.rarity)}>
                            {getRarityName(item.rarity)}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-300">
                            {item.price} gold
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                          {item.stats.attack && `ATK: ${item.stats.attack} `}
                          {item.stats.defense && `DEF: ${item.stats.defense} `}
                          {item.stats.hp && `HP: ${item.stats.hp} `}
                          {item.stats.critRate && `CRIT: ${item.stats.critRate}% `}
                          {item.stats.critDamage && `CDMG: ${item.stats.critDamage}% `}
                          {item.stats.lifesteal && `LS: ${item.stats.lifesteal}% `}
                        </div>
                        {(item.stats.comboRate || item.stats.counterRate || item.stats.armorPen || item.stats.dodgeRate || item.stats.accuracy) && (
                          <div className="text-xs text-gray-500 dark:text-gray-300">
                            {item.stats.comboRate && `COMBO: ${item.stats.comboRate}% `}
                            {item.stats.counterRate && `CTR: ${item.stats.counterRate}% `}
                            {item.stats.armorPen && `PEN: ${item.stats.armorPen}% `}
                            {item.stats.dodgeRate && `DODGE: ${item.stats.dodgeRate}% `}
                            {item.stats.accuracy && `ACC: ${item.stats.accuracy}% `}
                          </div>
                        )}
                        {item.type === ItemType.CONSUMABLE && (
                          <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            {item.consumableType === ConsumableType.HP_POTION && `Restores ${item.consumableValue} HP`}
                            {item.consumableType === ConsumableType.MP_POTION && `Restores ${item.consumableValue} MP`}
                            {item.consumableType === ConsumableType.EXP_POTION && `Grants ${item.consumableValue} EXP`}
                            {item.consumableType === ConsumableType.STAT_BOOST && `Boost for ${item.duration}min`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(!items || items.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                    <Sword className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có item nào trong hệ thống</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="sets" className="space-y-8">
            {/* Item Sets Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Item Sets</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{itemSets?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Item sets trong hệ thống</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Legendary Sets</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {itemSets?.filter((s: ItemSet) => s.rarity === 5).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Legendary item sets</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Create Sample</CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      try {
                        await api.post('/item-sets/create-sample');
                        toast.success('Sample item sets created!');
                        refetchSets();
                      } catch {
                        toast.error('Failed to create sample item sets');
                      }
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Create Sample
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create/Edit Item Set Form */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingSet ? 'Chỉnh sửa Item Set' : 'Tạo Item Set mới'}
                  </CardTitle>
                  <CardDescription>
                    {editingSet ? 'Cập nhật thông tin item set' : 'Thêm item set mới với bonus stats'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="setName">Tên Item Set</Label>
                      <Input
                        id="setName"
                        value={itemSetFormData.name}
                        onChange={(e) => setItemSetFormData({...itemSetFormData, name: e.target.value})}
                        placeholder="Nhập tên item set"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setRarity">Độ hiếm (1-5)</Label>
                      <Input
                        id="setRarity"
                        type="number"
                        min="1"
                        max="5"
                        value={itemSetFormData.rarity}
                        onChange={(e) => setItemSetFormData({...itemSetFormData, rarity: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setDescription">Mô tả Item Set</Label>
                    <Textarea
                      id="setDescription"
                      value={itemSetFormData.description}
                      onChange={(e) => setItemSetFormData({...itemSetFormData, description: e.target.value})}
                      placeholder="Mô tả về item set này..."
                      rows={3}
                    />
                  </div>

                  {/* Item Selection */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Items in Set</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {itemSetFormData.itemIds.length} items selected
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                        {items?.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={itemSetFormData.itemIds.includes(item.id)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setItemSetFormData({
                                  ...itemSetFormData,
                                  itemIds: isChecked
                                    ? [...itemSetFormData.itemIds, item.id]
                                    : itemSetFormData.itemIds.filter(id => id !== item.id)
                                });
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-semibold">
                                  {item.type.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                        <div className="font-medium dark:text-gray-100">{item.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-300">
                                    {item.type} • {getRarityName(item.rarity)} • {item.price} gold
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        )) || (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-300">
                            <p>No items available</p>
                            <p className="text-sm">Create some items first</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Set Bonuses */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Set Bonuses</h3>
                      <Button onClick={addSetBonus} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bonus
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {itemSetFormData.setBonuses.map((bonus, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Bonus {index + 1}</h4>
                              <Button
                                onClick={() => removeSetBonus(index)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Pieces Required</Label>
                                <Input
                                  type="number"
                                  min="2"
                                  max="8"
                                  value={bonus.pieces}
                                  onChange={(e) => updateSetBonus(index, {
                                    ...bonus,
                                    pieces: parseInt(e.target.value) || 2
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Bonus Type</Label>
                                <Select
                                  value={bonus.type}
                                  onValueChange={(value) => updateSetBonus(index, {
                                    ...bonus,
                                    type: value as 'flat' | 'percentage'
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="flat">Flat Bonus</SelectItem>
                                    <SelectItem value="percentage">Percentage Bonus</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {bonus.type === 'flat' && (
                              <div className="space-y-4 border-t pt-4">
                                <h5 className="font-medium">Flat Stats</h5>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`flat-attack-${index}`} className="text-sm">Attack</Label>
                                    <Input
                                      id={`flat-attack-${index}`}
                                      type="number"
                                      value={bonus.stats?.attack || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, attack: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-defense-${index}`} className="text-sm">Defense</Label>
                                    <Input
                                      id={`flat-defense-${index}`}
                                      type="number"
                                      value={bonus.stats?.defense || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, defense: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-hp-${index}`} className="text-sm">HP</Label>
                                    <Input
                                      id={`flat-hp-${index}`}
                                      type="number"
                                      value={bonus.stats?.hp || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, hp: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-strength-${index}`} className="text-sm">Strength</Label>
                                    <Input
                                      id={`flat-strength-${index}`}
                                      type="number"
                                      value={bonus.stats?.strength || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, strength: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-intelligence-${index}`} className="text-sm">Intelligence</Label>
                                    <Input
                                      id={`flat-intelligence-${index}`}
                                      type="number"
                                      value={bonus.stats?.intelligence || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, intelligence: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-dexterity-${index}`} className="text-sm">Dexterity</Label>
                                    <Input
                                      id={`flat-dexterity-${index}`}
                                      type="number"
                                      value={bonus.stats?.dexterity || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, dexterity: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-vitality-${index}`} className="text-sm">Vitality</Label>
                                    <Input
                                      id={`flat-vitality-${index}`}
                                      type="number"
                                      value={bonus.stats?.vitality || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, vitality: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-luck-${index}`} className="text-sm">Luck</Label>
                                    <Input
                                      id={`flat-luck-${index}`}
                                      type="number"
                                      value={bonus.stats?.luck || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, luck: parseInt(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`flat-critRate-${index}`} className="text-sm">Crit Rate (%)</Label>
                                    <Input
                                      id={`flat-critRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.critRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, critRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-critDamage-${index}`} className="text-sm">Crit Damage (%)</Label>
                                    <Input
                                      id={`flat-critDamage-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.critDamage || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, critDamage: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-comboRate-${index}`} className="text-sm">Combo Rate (%)</Label>
                                    <Input
                                      id={`flat-comboRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.comboRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, comboRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-counterRate-${index}`} className="text-sm">Counter Rate (%)</Label>
                                    <Input
                                      id={`flat-counterRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.counterRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, counterRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-lifesteal-${index}`} className="text-sm">Lifesteal (%)</Label>
                                    <Input
                                      id={`flat-lifesteal-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.lifesteal || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, lifesteal: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-armorPen-${index}`} className="text-sm">Armor Pen (%)</Label>
                                    <Input
                                      id={`flat-armorPen-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.armorPen || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, armorPen: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-dodgeRate-${index}`} className="text-sm">Dodge Rate (%)</Label>
                                    <Input
                                      id={`flat-dodgeRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.dodgeRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, dodgeRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`flat-accuracy-${index}`} className="text-sm">Accuracy (%)</Label>
                                    <Input
                                      id={`flat-accuracy-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.accuracy || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, accuracy: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {bonus.type === 'percentage' && (
                              <div className="space-y-4 border-t pt-4">
                                <h5 className="font-medium">Percentage Stats</h5>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`perc-attack-${index}`} className="text-sm">Attack (%)</Label>
                                    <Input
                                      id={`perc-attack-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.attack || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, attack: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-defense-${index}`} className="text-sm">Defense (%)</Label>
                                    <Input
                                      id={`perc-defense-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.defense || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, defense: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-hp-${index}`} className="text-sm">HP (%)</Label>
                                    <Input
                                      id={`perc-hp-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.hp || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, hp: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-strength-${index}`} className="text-sm">Strength (%)</Label>
                                    <Input
                                      id={`perc-strength-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.strength || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, strength: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-intelligence-${index}`} className="text-sm">Intelligence (%)</Label>
                                    <Input
                                      id={`perc-intelligence-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.intelligence || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, intelligence: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-dexterity-${index}`} className="text-sm">Dexterity (%)</Label>
                                    <Input
                                      id={`perc-dexterity-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.dexterity || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, dexterity: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-vitality-${index}`} className="text-sm">Vitality (%)</Label>
                                    <Input
                                      id={`perc-vitality-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.vitality || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, vitality: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-luck-${index}`} className="text-sm">Luck (%)</Label>
                                    <Input
                                      id={`perc-luck-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.luck || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, luck: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-critRate-${index}`} className="text-sm">Crit Rate (%)</Label>
                                    <Input
                                      id={`perc-critRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.critRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, critRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-critDamage-${index}`} className="text-sm">Crit Damage (%)</Label>
                                    <Input
                                      id={`perc-critDamage-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={bonus.stats?.critDamage || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, critDamage: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-comboRate-${index}`} className="text-sm">Combo Rate (%)</Label>
                                    <Input
                                      id={`perc-comboRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.comboRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, comboRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-counterRate-${index}`} className="text-sm">Counter Rate (%)</Label>
                                    <Input
                                      id={`perc-counterRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.counterRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, counterRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-lifesteal-${index}`} className="text-sm">Lifesteal (%)</Label>
                                    <Input
                                      id={`perc-lifesteal-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.lifesteal || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, lifesteal: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-armorPen-${index}`} className="text-sm">Armor Pen (%)</Label>
                                    <Input
                                      id={`perc-armorPen-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.armorPen || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, armorPen: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-dodgeRate-${index}`} className="text-sm">Dodge Rate (%)</Label>
                                    <Input
                                      id={`perc-dodgeRate-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.dodgeRate || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, dodgeRate: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`perc-accuracy-${index}`} className="text-sm">Accuracy (%)</Label>
                                    <Input
                                      id={`perc-accuracy-${index}`}
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={bonus.stats?.accuracy || 0}
                                      onChange={(e) => updateSetBonus(index, {
                                        ...bonus,
                                        stats: { ...bonus.stats, accuracy: parseFloat(e.target.value) || 0 }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={bonus.description}
                                onChange={(e) => updateSetBonus(index, {
                                  ...bonus,
                                  description: e.target.value
                                })}
                                placeholder="Describe the bonus effect..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {itemSetFormData.setBonuses.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                          <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No set bonuses added yet</p>
                          <p className="text-sm mt-2">Click &quot;Add Bonus&quot; to create set bonuses</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={editingSet ? handleUpdateItemSet : handleCreateItemSet}
                      className="flex-1"
                    >
                      {editingSet ? 'Cập nhật' : 'Tạo Item Set'}
                    </Button>
                    {editingSet && (
                      <Button variant="outline" onClick={resetItemSetForm}>
                        Hủy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Item Sets List */}
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách Item Sets</CardTitle>
                  <CardDescription>
                    Tất cả item sets trong hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {itemSets?.map((itemSet: ItemSet) => (
                      <div
                        key={itemSet.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                            {itemSet.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{itemSet.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{itemSet.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getRarityColor(itemSet.rarity)}>
                                {getRarityName(itemSet.rarity)}
                              </Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-300">
                                {itemSet.setBonuses?.length || 0} bonuses
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                              {itemSet.setBonuses?.map((bonus: SetBonus, idx: number) => (
                                <div key={idx}>
                                  {bonus.pieces} pieces: {bonus.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditSet(itemSet)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteItemSet(itemSet.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(!itemSets || itemSets.length === 0) && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Chưa có item set nào trong hệ thống</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
