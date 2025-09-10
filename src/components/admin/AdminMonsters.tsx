'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Swords } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { Monster, MonsterType, MonsterElement } from '@/types/monster';
import { Item } from '@/types/item';

export default function AdminMonsters() {
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: MonsterType.NORMAL,
    element: MonsterElement.NEUTRAL,
    level: 1,
    baseHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    experienceReward: 50,
    goldReward: 10,
    dropItems: [] as { itemId: number; dropRate: number; minQuantity: number; maxQuantity: number }[],
  });

  const queryClient = useQueryClient();

  // Fetch all monsters
  const { data: monsters, isLoading } = useQuery({
    queryKey: ['adminMonsters'],
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

  // Fetch all items for drop selection
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

  // Create monster mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Monster>) => {
      return await api.post('/monsters', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMonsters'] });
      toast.success('Đã tạo monster thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo monster: ${error.message}`);
    },
  });

  // Update monster mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Monster> }) => {
      return await api.put(`/monsters/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMonsters'] });
      toast.success('Đã cập nhật monster thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật monster: ${error.message}`);
    },
  });

  // Delete monster mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/monsters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMonsters'] });
      toast.success('Đã xóa monster thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa monster: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: MonsterType.NORMAL,
      element: MonsterElement.NEUTRAL,
      level: 1,
      baseHp: 100,
      baseAttack: 10,
      baseDefense: 5,
      experienceReward: 50,
      goldReward: 10,
      dropItems: [],
    });
    setEditingMonster(null);
  };

  const handleCreateMonster = () => {
    if (!formData.name) {
      toast.error('Vui lòng điền tên monster!');
      return;
    }

    const monsterData = {
      ...formData,
      dropItems: formData.dropItems.length > 0 ? formData.dropItems : null,
    };

    createMutation.mutate(monsterData);
  };

  const handleUpdateMonster = () => {
    if (!editingMonster || !formData.name) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const monsterData = {
      ...formData,
      dropItems: formData.dropItems.length > 0 ? formData.dropItems : null,
    };

    updateMutation.mutate({ id: editingMonster.id, data: monsterData });
  };

  const handleDeleteMonster = (monster: Monster) => {
    if (!confirm(`Bạn có chắc muốn xóa monster "${monster.name}"?`)) return;
    deleteMutation.mutate(monster.id);
  };

  const addDropItem = () => {
    setFormData({
      ...formData,
      dropItems: [...formData.dropItems, {
        itemId: 0,
        dropRate: 0.1,
        minQuantity: 1,
        maxQuantity: 1
      }]
    });
  };

  const removeDropItem = (index: number) => {
    setFormData({
      ...formData,
      dropItems: formData.dropItems.filter((_, i) => i !== index)
    });
  };

  const updateDropItem = (index: number, field: keyof typeof formData.dropItems[0], value: string | number) => {
    const updatedDropItems = [...formData.dropItems];
    
    if (field === 'itemId') {
      updatedDropItems[index] = { ...updatedDropItems[index], itemId: Number(value) };
    } else if (field === 'dropRate') {
      updatedDropItems[index] = { ...updatedDropItems[index], dropRate: Number(value) };
    } else if (field === 'minQuantity') {
      updatedDropItems[index] = { ...updatedDropItems[index], minQuantity: Number(value) };
    } else if (field === 'maxQuantity') {
      updatedDropItems[index] = { ...updatedDropItems[index], maxQuantity: Number(value) };
    }
    
    setFormData({
      ...formData,
      dropItems: updatedDropItems
    });
  };

  const startEdit = (monster: Monster) => {
    setEditingMonster(monster);
    setFormData({
      name: monster.name,
      description: monster.description || '',
      type: monster.type,
      element: monster.element,
      level: monster.level,
      baseHp: monster.baseHp,
      baseAttack: monster.baseAttack,
      baseDefense: monster.baseDefense,
      experienceReward: monster.experienceReward,
      goldReward: monster.goldReward,
      dropItems: monster.dropItems || [],
    });
  };

  const columns = [
    {
      key: 'name' as keyof Monster,
      label: 'Tên Monster',
      sortable: true,
    },
    {
      key: 'type' as keyof Monster,
      label: 'Loại',
      sortable: true,
      render: (value: unknown) => {
        const type = value as MonsterType;
        const typeLabels = {
          [MonsterType.NORMAL]: 'Thường',
          [MonsterType.ELITE]: 'Tinh Anh',
          [MonsterType.BOSS]: 'Boss',
          [MonsterType.MINI_BOSS]: 'Mini Boss',
        };
        return (
          <span className={`px-2 py-1 rounded text-xs text-white ${
            type === MonsterType.BOSS ? 'bg-red-500' :
            type === MonsterType.ELITE ? 'bg-yellow-500' :
            type === MonsterType.MINI_BOSS ? 'bg-orange-500' :
            'bg-gray-500'
          }`}>
            {typeLabels[type]}
          </span>
        );
      },
    },
    {
      key: 'element' as keyof Monster,
      label: 'Nguyên Tố',
      sortable: true,
      render: (value: unknown) => {
        const element = value as MonsterElement;
        const elementLabels = {
          [MonsterElement.FIRE]: 'Lửa',
          [MonsterElement.WATER]: 'Nước',
          [MonsterElement.EARTH]: 'Đất',
          [MonsterElement.WIND]: 'Gió',
          [MonsterElement.LIGHT]: 'Sáng',
          [MonsterElement.DARK]: 'Tối',
          [MonsterElement.NEUTRAL]: 'Trung lập',
        };
        return elementLabels[element];
      },
    },
    {
      key: 'level' as keyof Monster,
      label: 'Level',
      sortable: true,
    },
    {
      key: 'baseHp' as keyof Monster,
      label: 'HP Cơ Bản',
      sortable: true,
    },
    {
      key: 'baseAttack' as keyof Monster,
      label: 'ATK Cơ Bản',
      sortable: true,
    },
    {
      key: 'experienceReward' as keyof Monster,
      label: 'EXP Thưởng',
      sortable: true,
    },
    {
      key: 'dropItems' as keyof Monster,
      label: 'Items Rơi',
      render: (value: unknown) => {
        const dropItems = value as Monster['dropItems'];
        return (
          <div className="text-sm">
            {dropItems && dropItems.length > 0 ? `${dropItems.length} items` : 'Không có items'}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Monsters</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monsters?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Monster có sẵn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boss</CardTitle>
            <Swords className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monsters?.filter(m => m.type === MonsterType.BOSS).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Monster boss</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Elite</CardTitle>
            <Swords className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monsters?.filter(m => m.type === MonsterType.ELITE).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Monster tinh anh</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level Trung Bình</CardTitle>
            <Swords className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monsters && monsters.length > 0
                ? Math.round(monsters.reduce((sum, m) => sum + m.level, 0) / monsters.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Level trung bình</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingMonster ? 'Chỉnh sửa Monster' : 'Tạo Monster mới'}
            </CardTitle>
            <CardDescription>
              {editingMonster ? 'Cập nhật thông tin monster' : 'Thêm monster mới vào hệ thống'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Monster</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nhập tên monster"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả về monster"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Loại</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as MonsterType})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={MonsterType.NORMAL}>Thường</option>
                  <option value={MonsterType.ELITE}>Tinh Anh</option>
                  <option value={MonsterType.MINI_BOSS}>Mini Boss</option>
                  <option value={MonsterType.BOSS}>Boss</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="element">Nguyên Tố</Label>
                <select
                  id="element"
                  value={formData.element}
                  onChange={(e) => setFormData({...formData, element: e.target.value as MonsterElement})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={MonsterElement.NEUTRAL}>Trung lập</option>
                  <option value={MonsterElement.FIRE}>Lửa</option>
                  <option value={MonsterElement.WATER}>Nước</option>
                  <option value={MonsterElement.EARTH}>Đất</option>
                  <option value={MonsterElement.WIND}>Gió</option>
                  <option value={MonsterElement.LIGHT}>Sáng</option>
                  <option value={MonsterElement.DARK}>Tối</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseHp">HP Cơ Bản</Label>
                <Input
                  id="baseHp"
                  type="number"
                  min="1"
                  value={formData.baseHp}
                  onChange={(e) => setFormData({...formData, baseHp: parseInt(e.target.value) || 100})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseAttack">ATK Cơ Bản</Label>
                <Input
                  id="baseAttack"
                  type="number"
                  min="1"
                  value={formData.baseAttack}
                  onChange={(e) => setFormData({...formData, baseAttack: parseInt(e.target.value) || 10})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseDefense">DEF Cơ Bản</Label>
                <Input
                  id="baseDefense"
                  type="number"
                  min="1"
                  value={formData.baseDefense}
                  onChange={(e) => setFormData({...formData, baseDefense: parseInt(e.target.value) || 5})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceReward">EXP Thưởng</Label>
                <Input
                  id="experienceReward"
                  type="number"
                  min="0"
                  value={formData.experienceReward}
                  onChange={(e) => setFormData({...formData, experienceReward: parseInt(e.target.value) || 50})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goldReward">Gold Thưởng</Label>
                <Input
                  id="goldReward"
                  type="number"
                  min="0"
                  value={formData.goldReward}
                  onChange={(e) => setFormData({...formData, goldReward: parseInt(e.target.value) || 10})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items Rơi (tùy chọn)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDropItem}>
                  + Thêm item
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.dropItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateDropItem(index, 'itemId', parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Min SL"
                      value={item.minQuantity}
                      onChange={(e) => updateDropItem(index, 'minQuantity', parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Max SL"
                      value={item.maxQuantity}
                      onChange={(e) => updateDropItem(index, 'maxQuantity', parseInt(e.target.value) || 1)}
                      className="w-16"
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
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có item rơi nào</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={editingMonster ? handleUpdateMonster : handleCreateMonster}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingMonster ? 'Cập nhật' : 'Tạo Monster'}
              </Button>
              {editingMonster && (
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monsters List */}
        <div className="lg:col-span-2">
          <DataTable
            title="Danh sách Monsters"
            data={monsters || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm monster..."
            searchFields={['name', 'description']}
            onCreate={() => resetForm()}
            onEdit={startEdit}
            onDelete={handleDeleteMonster}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
