'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Crown } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface Class {
  id: number;
  name: string;
  description: string;
  tier: string;
  category: string;
  baseStats: {
    hp?: number;
    atk?: number;
    def?: number;
    critRate?: number;
    critDamage?: number;
    lifesteal?: number;
    penetration?: number;
  };
  requirements: {
    level?: number;
    items?: string[];
    quests?: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminClasses() {
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'C',
    category: 'warrior',
    hp: 0,
    atk: 0,
    def: 0,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    penetration: 0,
    levelRequirement: 1,
    requiredItems: '',
    requiredQuests: '',
  });

  const queryClient = useQueryClient();

  // Fetch all classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ['adminClasses'],
    queryFn: async (): Promise<Class[]> => {
      try {
        const response = await api.get('/classes');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        return [];
      }
    },
  });

  // Create class mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      tier: 'C' | 'B' | 'A' | 'S';
      category: 'warrior' | 'mage' | 'rogue';
      baseStats: {
        hp?: number;
        atk?: number;
        def?: number;
        critRate?: number;
        critDamage?: number;
        lifesteal?: number;
        penetration?: number;
      };
      requirements: {
        level?: number;
        items?: string[];
        quests?: string[];
      };
      isActive: boolean;
    }) => {
      return await api.post('/classes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      toast.success('Đã tạo class thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo class: ${error.message}`);
    },
  });

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: {
        name: string;
        description: string;
        tier: 'C' | 'B' | 'A' | 'S';
        category: 'warrior' | 'mage' | 'rogue';
        baseStats: {
          hp?: number;
          atk?: number;
          def?: number;
          critRate?: number;
          critDamage?: number;
          lifesteal?: number;
          penetration?: number;
        };
        requirements: {
          level?: number;
          items?: string[];
          quests?: string[];
        };
        isActive: boolean;
      };
    }) => {
      return await api.put(`/classes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      toast.success('Đã cập nhật class thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật class: ${error.message}`);
    },
  });

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      toast.success('Đã xóa class thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa class: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tier: 'C',
      category: 'warrior',
      hp: 0,
      atk: 0,
      def: 0,
      critRate: 0,
      critDamage: 0,
      lifesteal: 0,
      penetration: 0,
      levelRequirement: 1,
      requiredItems: '',
      requiredQuests: '',
    });
    setEditingClass(null);
  };

  const handleCreateClass = () => {
    if (!formData.name || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const classData = {
      name: formData.name,
      description: formData.description,
      tier: formData.tier as 'C' | 'B' | 'A' | 'S',
      category: formData.category as 'warrior' | 'mage' | 'rogue',
      baseStats: {
        hp: formData.hp || undefined,
        atk: formData.atk || undefined,
        def: formData.def || undefined,
        critRate: formData.critRate || undefined,
        critDamage: formData.critDamage || undefined,
        lifesteal: formData.lifesteal || undefined,
        penetration: formData.penetration || undefined,
      },
      requirements: {
        level: formData.levelRequirement || undefined,
        items: formData.requiredItems ? formData.requiredItems.split(',').map((item: string) => item.trim()).filter((item: string) => item) : undefined,
        quests: formData.requiredQuests ? formData.requiredQuests.split(',').map((quest: string) => quest.trim()).filter((quest: string) => quest) : undefined,
      },
      isActive: true,
    };

    createMutation.mutate(classData);
  };

  const handleUpdateClass = () => {
    if (!editingClass || !formData.name || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const classData = {
      name: formData.name,
      description: formData.description,
      tier: formData.tier as 'C' | 'B' | 'A' | 'S',
      category: formData.category as 'warrior' | 'mage' | 'rogue',
      baseStats: {
        hp: formData.hp || undefined,
        atk: formData.atk || undefined,
        def: formData.def || undefined,
        critRate: formData.critRate || undefined,
        critDamage: formData.critDamage || undefined,
        lifesteal: formData.lifesteal || undefined,
        penetration: formData.penetration || undefined,
      },
      requirements: {
        level: formData.levelRequirement || undefined,
        items: formData.requiredItems ? formData.requiredItems.split(',').map((item: string) => item.trim()).filter((item: string) => item) : undefined,
        quests: formData.requiredQuests ? formData.requiredQuests.split(',').map((quest: string) => quest.trim()).filter((quest: string) => quest) : undefined,
      },
      isActive: true,
    };

    updateMutation.mutate({ id: editingClass.id, data: classData });
  };

  const handleDeleteClass = (classItem: Class) => {
    if (!confirm(`Bạn có chắc muốn xóa class "${classItem.name}"?`)) return;
    deleteMutation.mutate(classItem.id);
  };

  const startEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      tier: classItem.tier,
      category: classItem.category,
      hp: classItem.baseStats.hp || 0,
      atk: classItem.baseStats.atk || 0,
      def: classItem.baseStats.def || 0,
      critRate: classItem.baseStats.critRate || 0,
      critDamage: classItem.baseStats.critDamage || 0,
      lifesteal: classItem.baseStats.lifesteal || 0,
      penetration: classItem.baseStats.penetration || 0,
      levelRequirement: classItem.requirements?.level || 1,
      requiredItems: classItem.requirements?.items?.join(', ') || '',
      requiredQuests: classItem.requirements?.quests?.join(', ') || '',
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
  case 'C': return 'bg-gray-500 dark:bg-gray-400';
      case 'B': return 'bg-green-500';
  case 'A': return 'bg-blue-500 dark:bg-blue-400';
  case 'S': return 'bg-yellow-500 dark:bg-yellow-400';
      default: return 'bg-gray-500';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'C': return 'Common';
      case 'B': return 'Uncommon';
      case 'A': return 'Rare';
      case 'S': return 'Legendary';
      default: return 'Common';
    }
  };

  const columns = [
    {
      key: 'name' as keyof Class,
      label: 'Tên Class',
      sortable: true,
    },
    {
      key: 'tier' as keyof Class,
      label: 'Tier',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${getTierColor(value as string)}`}>
          {getTierName(value as string)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'category' as keyof Class,
      label: 'Category',
      sortable: true,
    },
    {
      key: 'requirements' as keyof Class,
      label: 'Requirements',
      render: (value: unknown) => {
        const requirements = value as Class['requirements'];
        const reqs = [];
        if (requirements?.level) reqs.push(`Level ${requirements.level}`);
        if (requirements?.items && requirements.items.length > 0) reqs.push(`${requirements.items.length} items`);
        if (requirements?.quests && requirements.quests.length > 0) reqs.push(`${requirements.quests.length} quests`);
        return (
          <div className="text-sm dark:text-gray-300">
            {reqs.length > 0 ? reqs.join(', ') : 'Không có yêu cầu'}
          </div>
        );
      },
    },
    {
      key: 'baseStats' as keyof Class,
      label: 'Base Stats',
      render: (value: unknown) => {
        const stats = value as Class['baseStats'];
        const bonuses = [];
        if (stats.hp) bonuses.push(`HP: +${stats.hp}%`);
        if (stats.atk) bonuses.push(`ATK: +${stats.atk}%`);
        if (stats.def) bonuses.push(`DEF: +${stats.def}%`);
        if (stats.critRate) bonuses.push(`Crit: +${stats.critRate}%`);
        if (stats.critDamage) bonuses.push(`Crit DMG: +${stats.critDamage}%`);
        if (stats.lifesteal) bonuses.push(`Lifesteal: +${stats.lifesteal}%`);
        if (stats.penetration) bonuses.push(`Penetration: +${stats.penetration}%`);
        return (
          <div className="text-sm dark:text-gray-300">
            {bonuses.length > 0 ? bonuses.join(', ') : 'Không có bonus'}
          </div>
        );
      },
    },
    {
      key: 'isActive' as keyof Class,
      label: 'Status',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${value ? 'bg-green-500' : 'bg-red-500'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 dark:text-gray-100">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Classes</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Class có sẵn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier C-B</CardTitle>
            <Crown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes?.filter(c => c.tier === 'C' || c.tier === 'B').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Class cơ bản</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier A</CardTitle>
            <Crown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes?.filter(c => c.tier === 'A').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Class nâng cao</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier S</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes?.filter(c => c.tier === 'S').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Class Legendary</p>
          </CardContent>
        </Card>
      </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingClass ? 'Chỉnh sửa Class' : 'Tạo Class mới'}
            </CardTitle>
            <CardDescription>
              {editingClass ? 'Cập nhật thông tin class' : 'Thêm class mới vào hệ thống'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Class</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nhập tên class"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <select
                  id="tier"
                  value={formData.tier}
                  onChange={(e) => setFormData({...formData, tier: e.target.value as 'C' | 'B' | 'A' | 'S'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                >
                  <option value="C">C (Common)</option>
                  <option value="B">B (Uncommon)</option>
                  <option value="A">A (Rare)</option>
                  <option value="S">S (Legendary)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as 'warrior' | 'mage' | 'rogue'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                >
                  <option value="warrior">Warrior</option>
                  <option value="mage">Mage</option>
                  <option value="rogue">Rogue</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="levelRequirement">Level Requirement</Label>
              <Input
                id="levelRequirement"
                type="number"
                min="1"
                value={formData.levelRequirement}
                onChange={(e) => setFormData({...formData, levelRequirement: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả class"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Base Stats (% bonus)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hp" className="text-sm">HP Bonus (%)</Label>
                  <Input
                    id="hp"
                    type="number"
                    value={formData.hp}
                    onChange={(e) => setFormData({...formData, hp: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="atk" className="text-sm">Attack Bonus (%)</Label>
                  <Input
                    id="atk"
                    type="number"
                    value={formData.atk}
                    onChange={(e) => setFormData({...formData, atk: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="def" className="text-sm">Defense Bonus (%)</Label>
                  <Input
                    id="def"
                    type="number"
                    value={formData.def}
                    onChange={(e) => setFormData({...formData, def: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="critRate" className="text-sm">Crit Rate (%)</Label>
                  <Input
                    id="critRate"
                    type="number"
                    value={formData.critRate}
                    onChange={(e) => setFormData({...formData, critRate: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="critDamage" className="text-sm">Crit Damage (%)</Label>
                  <Input
                    id="critDamage"
                    type="number"
                    value={formData.critDamage}
                    onChange={(e) => setFormData({...formData, critDamage: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="lifesteal" className="text-sm">Lifesteal (%)</Label>
                  <Input
                    id="lifesteal"
                    type="number"
                    value={formData.lifesteal}
                    onChange={(e) => setFormData({...formData, lifesteal: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="penetration" className="text-sm">Armor Penetration (%)</Label>
                  <Input
                    id="penetration"
                    type="number"
                    value={formData.penetration}
                    onChange={(e) => setFormData({...formData, penetration: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredItems">Required Items (cách nhau bằng dấu phẩy)</Label>
              <Input
                id="requiredItems"
                value={formData.requiredItems}
                onChange={(e) => setFormData({...formData, requiredItems: e.target.value})}
                placeholder="Sword, Shield, ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredQuests">Required Quests (cách nhau bằng dấu phẩy)</Label>
              <Input
                id="requiredQuests"
                value={formData.requiredQuests}
                onChange={(e) => setFormData({...formData, requiredQuests: e.target.value})}
                placeholder="Quest1, Quest2, ..."
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={editingClass ? handleUpdateClass : handleCreateClass}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingClass ? 'Cập nhật' : 'Tạo Class'}
              </Button>
              {editingClass && (
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Classes List */}
        <div className="lg:col-span-2">
          <DataTable
            title="Danh sách Classes"
            data={classes || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm class..."
            searchFields={['name', 'description']}
            onCreate={() => resetForm()}
            onEdit={startEdit}
            onDelete={handleDeleteClass}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
