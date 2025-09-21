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
import { UserCheck } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface CharacterClass {
  id: number;
  name: string;
  description: string;
  type: string;
  tier: number;
  requiredLevel: number;
  statBonuses: {
    // Basic stats
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    vitality?: number;
    luck?: number;
    // Advanced stats
    critRate?: number;
    critDamage?: number;
    comboRate?: number;
    counterRate?: number;
    lifesteal?: number;
    armorPen?: number;
    dodgeRate?: number;
    accuracy?: number;
  };
  skillUnlocks: Array<{
    skillId: number;
    skillName: string;
    description: string;
  }>;
  advancementRequirements?: {
    dungeons: Array<{
      dungeonId: number;
      dungeonName: string;
      requiredCompletions: number;
    }>;
    quests: Array<{
      questId: number;
      questName: string;
    }>;
    items: Array<{
      itemId: number;
      itemName: string;
      quantity: number;
    }>;
  };
  previousClassId?: number;
  createdAt: string;
  updatedAt: string;
}

interface Mapping {
  id: number;
  toClassId: number;
  levelRequired: number;
  weight?: number;
  allowPlayerChoice?: boolean;
  isAwakening?: boolean;
  requirements?: {
    dungeons?: Array<{ dungeonId: number; dungeonName?: string; requiredCompletions: number }>;
    quests?: Array<{ questId: number; questName?: string }>;
    items?: Array<{ itemId: number; itemName?: string; quantity: number }>;
  };
}

export default function AdminCharacterClasses() {
  const [editingClass, setEditingClass] = useState<CharacterClass | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'warrior',
    tier: 1,
    requiredLevel: 1,
    // Basic stats
    strength: 0,
    intelligence: 0,
    dexterity: 0,
    vitality: 0,
    luck: 0,
    // Advanced stats
    critRate: 0,
    critDamage: 150,
    comboRate: 0,
    counterRate: 0,
    lifesteal: 0,
    armorPen: 0,
    dodgeRate: 0,
    accuracy: 0,
    skillUnlocks: '',
  });

  const queryClient = useQueryClient();

  // Fetch all character classes
  const { data: characterClasses, isLoading } = useQuery({
    queryKey: ['adminCharacterClasses'],
    queryFn: async (): Promise<CharacterClass[]> => {
      try {
        const response = await api.get('/character-classes');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch character classes:', error);
        return [];
      }
    },
  });

  // Create character class mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      type: string;
      tier: number;
      requiredLevel: number;
      statBonuses: {
        // Basic stats
        strength?: number;
        intelligence?: number;
        dexterity?: number;
        vitality?: number;
        luck?: number;
        // Advanced stats
        critRate?: number;
        critDamage?: number;
        comboRate?: number;
        counterRate?: number;
        lifesteal?: number;
        armorPen?: number;
        dodgeRate?: number;
        accuracy?: number;
      };
      skillUnlocks: Array<{
        skillId: number;
        skillName: string;
        description: string;
      }>;
    }) => {
      return await api.post('/character-classes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharacterClasses'] });
      toast.success('Đã tạo character class thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo character class: ${error.message}`);
    },
  });

  // Update character class mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: {
        name: string;
        description: string;
        type: string;
        tier: number;
        requiredLevel: number;
        statBonuses: {
          // Basic stats
          strength?: number;
          intelligence?: number;
          dexterity?: number;
          vitality?: number;
          luck?: number;
          // Advanced stats
          critRate?: number;
          critDamage?: number;
          comboRate?: number;
          counterRate?: number;
          lifesteal?: number;
          armorPen?: number;
          dodgeRate?: number;
          accuracy?: number;
        };
        skillUnlocks: Array<{
          skillId: number;
          skillName: string;
          description: string;
        }>;
      };
    }) => {
      return await api.put(`/character-classes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharacterClasses'] });
      toast.success('Đã cập nhật character class thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật character class: ${error.message}`);
    },
  });

  // Delete character class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/character-classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharacterClasses'] });
      toast.success('Đã xóa character class thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa character class: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'warrior',
      tier: 1,
      requiredLevel: 1,
      // Basic stats
      strength: 0,
      intelligence: 0,
      dexterity: 0,
      vitality: 0,
      luck: 0,
      // Advanced stats
      critRate: 0,
      critDamage: 150,
      comboRate: 0,
      counterRate: 0,
      lifesteal: 0,
      armorPen: 0,
      dodgeRate: 0,
      accuracy: 0,
      skillUnlocks: '',
    });
    setEditingClass(null);
  };

  const handleCreateClass = () => {
    if (!formData.name || !formData.description || !formData.type) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const classData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      tier: formData.tier,
      requiredLevel: formData.requiredLevel,
      statBonuses: {
        strength: formData.strength || undefined,
        intelligence: formData.intelligence || undefined,
        dexterity: formData.dexterity || undefined,
        vitality: formData.vitality || undefined,
        luck: formData.luck || undefined,
        // Advanced stats
        critRate: formData.critRate || undefined,
        critDamage: formData.critDamage || undefined,
        comboRate: formData.comboRate || undefined,
        counterRate: formData.counterRate || undefined,
        lifesteal: formData.lifesteal || undefined,
        armorPen: formData.armorPen || undefined,
        dodgeRate: formData.dodgeRate || undefined,
        accuracy: formData.accuracy || undefined,
      },
      skillUnlocks: formData.skillUnlocks.split(',').map((skill, index) => ({
        skillId: index + 1,
        skillName: skill.trim(),
        description: `${skill.trim()} skill`,
      })).filter(skill => skill.skillName),
    };

    createMutation.mutate(classData);
  };

  const handleUpdateClass = () => {
    if (!editingClass || !formData.name || !formData.description || !formData.type) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const classData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      tier: formData.tier,
      requiredLevel: formData.requiredLevel,
      statBonuses: {
        strength: formData.strength || undefined,
        intelligence: formData.intelligence || undefined,
        dexterity: formData.dexterity || undefined,
        vitality: formData.vitality || undefined,
        luck: formData.luck || undefined,
        // Advanced stats
        critRate: formData.critRate || undefined,
        critDamage: formData.critDamage || undefined,
        comboRate: formData.comboRate || undefined,
        counterRate: formData.counterRate || undefined,
        lifesteal: formData.lifesteal || undefined,
        armorPen: formData.armorPen || undefined,
        dodgeRate: formData.dodgeRate || undefined,
        accuracy: formData.accuracy || undefined,
      },
      skillUnlocks: formData.skillUnlocks.split(',').map((skill, index) => ({
        skillId: index + 1,
        skillName: skill.trim(),
        description: `${skill.trim()} skill`,
      })).filter(skill => skill.skillName),
    };

    updateMutation.mutate({ id: editingClass.id, data: classData });
  };

  const handleDeleteClass = (classItem: CharacterClass) => {
    if (!confirm(`Bạn có chắc muốn xóa character class "${classItem.name}"?`)) return;
    deleteMutation.mutate(classItem.id);
  };

  const startEdit = (classItem: CharacterClass) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description,
      type: classItem.type,
      tier: classItem.tier,
      requiredLevel: classItem.requiredLevel,
      // Basic stats
      strength: classItem.statBonuses.strength || 0,
      intelligence: classItem.statBonuses.intelligence || 0,
      dexterity: classItem.statBonuses.dexterity || 0,
      vitality: classItem.statBonuses.vitality || 0,
      luck: classItem.statBonuses.luck || 0,
      // Advanced stats
      critRate: classItem.statBonuses.critRate || 0,
      critDamage: classItem.statBonuses.critDamage || 150,
      comboRate: classItem.statBonuses.comboRate || 0,
      counterRate: classItem.statBonuses.counterRate || 0,
      lifesteal: classItem.statBonuses.lifesteal || 0,
      armorPen: classItem.statBonuses.armorPen || 0,
      dodgeRate: classItem.statBonuses.dodgeRate || 0,
      accuracy: classItem.statBonuses.accuracy || 0,
      skillUnlocks: classItem.skillUnlocks.map(skill => skill.skillName).join(', '),
    });
    // fetch mappings for this class
    (async () => {
      try {
        const resp = await api.get(`/admin/character-classes/${classItem.id}/mappings`);
        setMappings(resp.data || []);
      } catch (err) {
        console.error('Failed to fetch mappings', err);
      }
    })();
  };

  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [newMapping, setNewMapping] = useState<Partial<Mapping>>({
    toClassId: 0,
    levelRequired: 25,
    weight: 100,
    allowPlayerChoice: true,
    isAwakening: false,
    requirements: {},
  });

  const createMapping = async () => {
    if (!editingClass) return;
    // validate weight
    if (newMapping.allowPlayerChoice !== true) {
      const w = Number(newMapping.weight ?? 0);
      if (isNaN(w) || w < 0) {
        toast.error('Weight phải là số >= 0');
        return;
      }
    }
    try {
      const resp = await api.post(`/admin/character-classes/${editingClass.id}/mappings`, newMapping);
      setMappings((m) => [...m, resp.data]);
      toast.success('Đã tạo mapping mới');
    } catch (err) {
      console.error('Create mapping failed', err);
      toast.error('Không thể tạo mapping');
    }
  };

  const [editingMappingId, setEditingMappingId] = useState<number | null>(null);

  const startEditMapping = (mp: Mapping) => {
    setEditingMappingId(mp.id);
    setNewMapping({
      toClassId: mp.toClassId,
      levelRequired: mp.levelRequired,
      weight: mp.weight,
      allowPlayerChoice: mp.allowPlayerChoice,
      isAwakening: mp.isAwakening,
      requirements: mp.requirements,
    });
  };

  const updateMapping = async () => {
    if (!editingClass || editingMappingId == null) return;
    // validate weight
    if (newMapping.allowPlayerChoice !== true) {
      const w = Number(newMapping.weight ?? 0);
      if (isNaN(w) || w < 0) {
        toast.error('Weight phải là số >= 0');
        return;
      }
    }
    try {
      const resp = await api.put(`/admin/character-classes/${editingClass.id}/mappings/${editingMappingId}`, newMapping);
      setMappings((m) => m.map((x) => (x.id === editingMappingId ? resp.data : x)));
      setEditingMappingId(null);
      setNewMapping({ toClassId: 0, levelRequired: 25, weight: 100, allowPlayerChoice: true, isAwakening: false, requirements: {} });
      toast.success('Đã cập nhật mapping');
    } catch (err) {
      console.error('Update mapping failed', err);
      toast.error('Không thể cập nhật mapping');
    }
  };

  // compute total weight for display (exclude allowPlayerChoice mappings)
  const totalWeight = mappings
    .filter((m) => !m.allowPlayerChoice)
    .reduce((s, m) => s + (Number(m.weight ?? 0) || 0), 0);

  // Normalize weights: scale so total becomes 100 (rounding may adjust)
  const normalizeWeights = async () => {
    if (!editingClass) return;
    const eligible = mappings.filter((m) => !m.allowPlayerChoice);
    const total = eligible.reduce((s, m) => s + (Number(m.weight ?? 0) || 0), 0);
    if (total <= 0) {
      toast.error('Không thể normalize: tổng weight = 0');
      return;
    }
    // scale to sum 100
    const updated = mappings.map((m) => {
      if (m.allowPlayerChoice) return m;
      const w = Number(m.weight ?? 0) || 0;
      const scaled = Math.max(0, Math.round((w / total) * 100));
      return { ...m, weight: scaled };
    });
    try {
      // attempt bulk update on server; if endpoint doesn't exist the call will fail and we still update locally
      await api.put(`/admin/character-classes/${editingClass.id}/mappings/normalize`, { mappings: updated });
    } catch (err) {
      // ignore server error for normalize and fallback to client-side update
      console.warn('Bulk normalize API failed, falling back to client update', err);
    }
    setMappings(updated);
    toast.success('Đã chuẩn hóa weights (tổng ~100)');
  };

  const deleteMapping = async (id: number) => {
    if (!editingClass) return;
    if (!confirm('Xác nhận xóa mapping này?')) return;
    try {
      await api.delete(`/admin/character-classes/${editingClass.id}/mappings/${id}`);
      setMappings((m) => m.filter((x) => x.id !== id));
      toast.success('Đã xóa mapping');
    } catch (err) {
      console.error('Delete mapping failed', err);
      toast.error('Không thể xóa mapping');
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
  case 1: return 'bg-gray-500 dark:bg-gray-400';
      case 2: return 'bg-green-500';
  case 2: return 'bg-green-500 dark:bg-green-400';
  case 3: return 'bg-blue-500 dark:bg-blue-400';
  case 4: return 'bg-purple-500 dark:bg-purple-400';
  case 5: return 'bg-yellow-500 dark:bg-yellow-400';
      default: return 'bg-gray-500';
    }
  };

  const getTierName = (tier: number) => {
    switch (tier) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      case 5: return 'Legendary';
      default: return 'Common';
    }
  };

  const columns = [
    {
      key: 'name' as keyof CharacterClass,
      label: 'Tên Class',
      sortable: true,
    },
    {
      key: 'tier' as keyof CharacterClass,
      label: 'Tier',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${getTierColor(value as number)}`}>
          {getTierName(value as number)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'type' as keyof CharacterClass,
      label: 'Type',
      render: (value: unknown) => (
        <span className="capitalize">{value as string}</span>
      ),
      sortable: true,
    },
    {
      key: 'requiredLevel' as keyof CharacterClass,
      label: 'Required Level',
      sortable: true,
    },
    {
      key: 'statBonuses' as keyof CharacterClass,
      label: 'Stat Bonuses',
      render: (value: unknown) => {
        const bonuses = value as CharacterClass['statBonuses'];
        return (
          <div className="text-sm dark:text-gray-300">
            <div className="font-semibold">Basic:</div>
            <div>STR: {bonuses.strength || 0}, INT: {bonuses.intelligence || 0}</div>
            <div>DEX: {bonuses.dexterity || 0}, VIT: {bonuses.vitality || 0}</div>
            <div>LUK: {bonuses.luck || 0}</div>
            {(bonuses.critRate || bonuses.comboRate || bonuses.lifesteal) && (
              <>
                <div className="font-semibold mt-1">Advanced:</div>
                {bonuses.critRate && <div>Crit: {bonuses.critRate}%</div>}
                {bonuses.comboRate && <div>Combo: {bonuses.comboRate}%</div>}
                {bonuses.lifesteal && <div>Lifesteal: {bonuses.lifesteal}%</div>}
              </>
            )}
          </div>
        );
      },
    },
    {
      key: 'skillUnlocks' as keyof CharacterClass,
      label: 'Skill Unlocks',
      render: (value: unknown) => {
        const skills = value as CharacterClass['skillUnlocks'];
        return (
          <div className="text-sm">
            {skills.length > 0 ? skills.slice(0, 2).map(s => s.skillName).join(', ') + (skills.length > 2 ? '...' : '') : 'Không có skill'}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 dark:text-gray-100">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Classes</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{characterClasses?.length || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Character classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier 1-2</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {characterClasses?.filter(c => c.tier <= 2).length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Basic classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier 3-4</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {characterClasses?.filter(c => c.tier >= 3 && c.tier <= 4).length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Advanced classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier 5</CardTitle>
            <UserCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {characterClasses?.filter(c => c.tier === 5).length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Legendary classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex space-x-2 mt-4 lg:col-span-3">
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const res = await api.get('/admin/export/template/character-classes', { responseType: 'blob' });
                    const blob = new Blob([res.data]);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'character-classes-template.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } catch (err) {
                    console.error('Download template failed', err);
                    toast.error('Không thể tải template');
                  }
                }}>
                  Tải mẫu
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  try {
                    const res = await api.get('/admin/export/character-classes', { responseType: 'blob' });
                    const blob = new Blob([res.data]);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'character-classes-export.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } catch (err) {
                    console.error('Download all character-classes failed', err);
                    toast.error('Không thể tải toàn bộ character classes');
                  }
                }}>
                  Tải toàn bộ
                </Button>

              <input id="character-classes-import-input" type="file" accept=".csv" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                form.append('sync', 'true');
                try {
                  console.info('Uploading character-classes CSV', file.name, file.size);
                  toast('Uploading file...');
                  const resp = await api.post('/admin/import/character-classes', form);
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
              <Button size="sm" className="ml-2" onClick={() => document.getElementById('character-classes-import-input')?.click()}>Import CSV</Button>
            </div>
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingClass ? 'Chỉnh sửa Character Class' : 'Tạo Character Class mới'}
            </CardTitle>
            <CardDescription>
              {editingClass ? 'Cập nhật thông tin character class' : 'Thêm character class mới vào hệ thống'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Class</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên character class"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Tier (1-5)</Label>
                <Input
                  id="tier"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiredLevel">Required Level</Label>
                <Input
                  id="requiredLevel"
                  type="number"
                  min="1"
                  value={formData.requiredLevel}
                  onChange={(e) => setFormData({ ...formData, requiredLevel: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về character class"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'warrior' | 'mage' | 'archer' | 'assassin' | 'priest' | 'knight' | 'summoner' | 'necromancer' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
              >
                <option value="">Chọn type</option>
                <option value="warrior">Warrior</option>
                <option value="mage">Mage</option>
                <option value="archer">Archer</option>
                <option value="assassin">Assassin</option>
                <option value="priest">Priest</option>
                <option value="knight">Knight</option>
                <option value="summoner">Summoner</option>
                <option value="necromancer">Necromancer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Stat Bonuses</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strength" className="text-sm">Strength</Label>
                  <Input
                    id="strength"
                    type="number"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="intelligence" className="text-sm">Intelligence</Label>
                  <Input
                    id="intelligence"
                    type="number"
                    value={formData.intelligence}
                    onChange={(e) => setFormData({ ...formData, intelligence: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="dexterity" className="text-sm">Dexterity</Label>
                  <Input
                    id="dexterity"
                    type="number"
                    value={formData.dexterity}
                    onChange={(e) => setFormData({ ...formData, dexterity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="vitality" className="text-sm">Vitality</Label>
                  <Input
                    id="vitality"
                    type="number"
                    value={formData.vitality}
                    onChange={(e) => setFormData({ ...formData, vitality: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="luck" className="text-sm">Luck</Label>
                  <Input
                    id="luck"
                    type="number"
                    value={formData.luck}
                    onChange={(e) => setFormData({ ...formData, luck: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Advanced Stat Bonuses</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="critRate" className="text-sm">Crit Rate (%)</Label>
                  <Input
                    id="critRate"
                    type="number"
                    value={formData.critRate}
                    onChange={(e) => setFormData({ ...formData, critRate: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="critDamage" className="text-sm">Crit Damage (%)</Label>
                  <Input
                    id="critDamage"
                    type="number"
                    value={formData.critDamage}
                    onChange={(e) => setFormData({ ...formData, critDamage: parseInt(e.target.value) || 150 })}
                  />
                </div>
                <div>
                  <Label htmlFor="comboRate" className="text-sm">Combo Rate (%)</Label>
                  <Input
                    id="comboRate"
                    type="number"
                    value={formData.comboRate}
                    onChange={(e) => setFormData({ ...formData, comboRate: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="counterRate" className="text-sm">Counter Rate (%)</Label>
                  <Input
                    id="counterRate"
                    type="number"
                    value={formData.counterRate}
                    onChange={(e) => setFormData({ ...formData, counterRate: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="lifesteal" className="text-sm">Lifesteal (%)</Label>
                  <Input
                    id="lifesteal"
                    type="number"
                    value={formData.lifesteal}
                    onChange={(e) => setFormData({ ...formData, lifesteal: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="armorPen" className="text-sm">Armor Pen (%)</Label>
                  <Input
                    id="armorPen"
                    type="number"
                    value={formData.armorPen}
                    onChange={(e) => setFormData({ ...formData, armorPen: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="dodgeRate" className="text-sm">Dodge Rate (%)</Label>
                  <Input
                    id="dodgeRate"
                    type="number"
                    value={formData.dodgeRate}
                    onChange={(e) => setFormData({ ...formData, dodgeRate: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="accuracy" className="text-sm">Accuracy (%)</Label>
                  <Input
                    id="accuracy"
                    type="number"
                    value={formData.accuracy}
                    onChange={(e) => setFormData({ ...formData, accuracy: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {editingClass && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Mappings (Advancements)</h3>
                <div className="space-y-2">
                  {mappings.length === 0 && <div className="text-sm text-muted-foreground">Chưa có mapping nào.</div>}
                  {mappings.map((mp) => {
                    const w = Number(mp.weight ?? 0) || 0;
                    const pct = totalWeight > 0 && !mp.allowPlayerChoice ? Math.round((w / totalWeight) * 100) : 0;
                    return (
                      <div key={mp.id} className="flex items-center justify-between">
                        <div className="text-sm">
                          To: {mp.toClassId} @ Lv {mp.levelRequired} {mp.isAwakening ? '(Awakening)' : ''}
                          {!mp.allowPlayerChoice && (
                            <span className="ml-3 text-xs text-muted-foreground">{w} ({pct}%)</span>
                          )}
                          {mp.allowPlayerChoice && (
                            <span className="ml-3 text-xs text-muted-foreground">Player choice</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" onClick={() => startEditMapping(mp)}>Sửa</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMapping(mp.id)}>Xóa</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select className="p-2 border rounded" value={newMapping.toClassId || 0} onChange={(e) => setNewMapping({ ...newMapping, toClassId: parseInt(e.target.value) || 0 })}>
                    <option value={0}>Chọn target class</option>
                    {characterClasses?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>
                    ))}
                  </select>
                  <Input type="number" placeholder="Level Required" value={newMapping.levelRequired} onChange={(e) => setNewMapping({ ...newMapping, levelRequired: parseInt(e.target.value) || 1 })} />
                  <Input type="number" placeholder="Weight" value={newMapping.weight} onChange={(e) => setNewMapping({ ...newMapping, weight: parseInt(e.target.value) || 100 })} />
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newMapping.allowPlayerChoice} onChange={(e) => setNewMapping({ ...newMapping, allowPlayerChoice: e.target.checked })} />
                    <Label>Allow Player Choice</Label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                  {editingMappingId ? (
                    <>
                      <Button size="sm" onClick={updateMapping}>Lưu</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingMappingId(null); setNewMapping({ toClassId: 0, levelRequired: 25, weight: 100, allowPlayerChoice: true, isAwakening: false, requirements: {} }); }}>Hủy</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={createMapping}>Tạo Mapping</Button>
                  )}
                  </div>
                  <div>
                    <Button size="sm" variant="outline" onClick={normalizeWeights}>Normalize Weights</Button>
                  </div>
                </div>
              </div>
            )}

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

        {/* Character Classes List */}
        <div className="lg:col-span-2">
          <DataTable
            title="Danh sách Character Classes"
            data={characterClasses || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm character class..."
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
