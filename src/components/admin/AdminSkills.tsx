'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface SkillEffect {
  statBonuses?: {
    attack?: number;
    defense?: number;
    maxHp?: number;
    critRate?: number;
    critDamage?: number;
    dodgeRate?: number;
    accuracy?: number;
    lifesteal?: number;
    armorPen?: number;
    comboRate?: number;
  };
  specialEffects?: string[];
  damage?: number;
  healing?: number;
  buffDuration?: number;
  debuffDuration?: number;
}

interface SkillDefinition {
  id: string; // This is skillId (string), not the numeric id
  name: string;
  description: string;
  maxLevel: number;
  requiredAttribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK';
  requiredAttributeValue: number;
  requiredLevel: number;
  skillPointCost: number;
  effects: {
    [level: number]: SkillEffect;
  };
  isActive: boolean;
  sortOrder: number;
  category?: string;
  skillType: 'passive' | 'active' | 'toggle';
  manaCost?: number;
  cooldown?: number;
  targetType?: 'self' | 'enemy' | 'ally' | 'aoe_enemies' | 'aoe_allies';
  damageType?: 'physical' | 'magical';
  damageFormula?: string;
  healingFormula?: string;
}

export default function AdminSkills() {
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
  const [formData, setFormData] = useState({
    skillId: '',
    name: '',
    description: '',
    maxLevel: 5,
    requiredAttribute: 'STR' as 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK',
    requiredAttributeValue: 0,
    requiredLevel: 1,
    skillPointCost: 1,
    effects: '',
    isActive: true,
    sortOrder: 0,
    category: '',
    skillType: 'passive' as 'passive' | 'active' | 'toggle',
    manaCost: 0,
    cooldown: 0,
    targetType: 'self' as 'self' | 'enemy' | 'ally' | 'aoe_enemies' | 'aoe_allies',
    damageType: 'physical' as 'physical' | 'magical',
    damageFormula: '',
    healingFormula: '',
  });

  const queryClient = useQueryClient();

  // Fetch all skill definitions
  const { data: skills, isLoading } = useQuery({
    queryKey: ['adminSkills'],
    queryFn: async (): Promise<SkillDefinition[]> => {
      try {
        const response = await adminApiEndpoints.getSkills();
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch skills:', error);
        return [];
      }
    },
  });

  // Create skill mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<SkillDefinition, 'id'>) => {
      return await adminApiEndpoints.createSkill(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      toast.success('Đã tạo skill thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo skill: ${error.message}`);
    },
  });

  // Update skill mutation
  const updateMutation = useMutation({
    mutationFn: async ({ skillId, data }: { skillId: string; data: Partial<SkillDefinition> }) => {
      return await adminApiEndpoints.updateSkill(skillId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      toast.success('Đã cập nhật skill thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật skill: ${error.message}`);
    },
  });

  // Delete skill mutation
  const deleteMutation = useMutation({
    mutationFn: async (skillId: string) => {
      return await adminApiEndpoints.deleteSkill(skillId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      toast.success('Đã xóa skill thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa skill: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      skillId: '',
      name: '',
      description: '',
      maxLevel: 5,
      requiredAttribute: 'STR',
      requiredAttributeValue: 0,
      requiredLevel: 1,
      skillPointCost: 1,
      effects: '',
      isActive: true,
      sortOrder: 0,
      category: '',
      skillType: 'passive',
      manaCost: 0,
      cooldown: 0,
      targetType: 'self',
      damageType: 'physical',
      damageFormula: '',
      healingFormula: '',
    });
    setEditingSkill(null);
  };

  const handleCreateSkill = () => {
    if (!formData.skillId || !formData.name || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Parse effects JSON
    let effects: { [level: number]: SkillEffect } = {};
    try {
      if (formData.effects) {
        effects = JSON.parse(formData.effects);
      } else {
        // Default effects for level 1
        effects = {
          1: {
            statBonuses: {
              attack: 10,
              defense: 5,
            }
          }
        };
      }
    } catch {
      toast.error('Effects JSON không hợp lệ!');
      return;
    }

    const skillData = {
      skillId: formData.skillId,
      name: formData.name,
      description: formData.description,
      maxLevel: formData.maxLevel,
      requiredAttribute: formData.requiredAttribute,
      requiredAttributeValue: formData.requiredAttributeValue,
      requiredLevel: formData.requiredLevel,
      skillPointCost: formData.skillPointCost,
      effects,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      category: formData.category || undefined,
      skillType: formData.skillType,
      manaCost: formData.manaCost || undefined,
      cooldown: formData.cooldown || undefined,
      targetType: formData.targetType || undefined,
      damageType: formData.damageType || undefined,
      damageFormula: formData.damageFormula || undefined,
      healingFormula: formData.healingFormula || undefined,
    };

    createMutation.mutate(skillData);
  };

  const handleUpdateSkill = () => {
    if (!editingSkill || !formData.skillId || !formData.name || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Parse effects JSON
    let effects: { [level: number]: SkillEffect } = {};
    try {
      if (formData.effects) {
        effects = JSON.parse(formData.effects);
      }
    } catch {
      toast.error('Effects JSON không hợp lệ!');
      return;
    }

    const skillData = {
      skillId: formData.skillId,
      name: formData.name,
      description: formData.description,
      maxLevel: formData.maxLevel,
      requiredAttribute: formData.requiredAttribute,
      requiredAttributeValue: formData.requiredAttributeValue,
      requiredLevel: formData.requiredLevel,
      skillPointCost: formData.skillPointCost,
      effects,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      category: formData.category || undefined,
      skillType: formData.skillType,
      manaCost: formData.manaCost || undefined,
      cooldown: formData.cooldown || undefined,
      targetType: formData.targetType || undefined,
      damageType: formData.damageType || undefined,
      damageFormula: formData.damageFormula || undefined,
      healingFormula: formData.healingFormula || undefined,
    };

    updateMutation.mutate({ skillId: editingSkill.id, data: skillData });
  };

  const handleDeleteSkill = (skill: SkillDefinition) => {
    if (!confirm(`Bạn có chắc muốn xóa skill "${skill.name}"?`)) return;
    deleteMutation.mutate(skill.id);
  };

  const startEdit = (skill: SkillDefinition) => {
    setEditingSkill(skill);
    setFormData({
      skillId: skill.id,
      name: skill.name,
      description: skill.description,
      maxLevel: skill.maxLevel,
      requiredAttribute: skill.requiredAttribute,
      requiredAttributeValue: skill.requiredAttributeValue,
      requiredLevel: skill.requiredLevel,
      skillPointCost: skill.skillPointCost,
      effects: JSON.stringify(skill.effects, null, 2),
      isActive: skill.isActive,
      sortOrder: skill.sortOrder,
      category: skill.category || '',
      skillType: skill.skillType,
      manaCost: skill.manaCost || 0,
      cooldown: skill.cooldown || 0,
      targetType: skill.targetType || 'self',
      damageType: skill.damageType || 'physical',
      damageFormula: skill.damageFormula || '',
      healingFormula: skill.healingFormula || '',
    });
  };

  const getSkillTypeColor = (skillType: string) => {
    switch (skillType) {
      case 'passive': return 'bg-green-500 dark:bg-green-400';
      case 'active': return 'bg-blue-500 dark:bg-blue-400';
      case 'toggle': return 'bg-purple-500 dark:bg-purple-400';
      default: return 'bg-gray-500';
    }
  };

  const getSkillTypeName = (skillType: string) => {
    switch (skillType) {
      case 'passive': return 'Passive';
      case 'active': return 'Active';
      case 'toggle': return 'Toggle';
      default: return 'Unknown';
    }
  };

  const getAttributeColor = (attribute: string) => {
    switch (attribute) {
      case 'STR': return 'bg-red-500 dark:bg-red-400';
      case 'INT': return 'bg-blue-500 dark:bg-blue-400';
      case 'DEX': return 'bg-yellow-500 dark:bg-yellow-400';
      case 'VIT': return 'bg-green-500 dark:bg-green-400';
      case 'LUK': return 'bg-purple-500 dark:bg-purple-400';
      default: return 'bg-gray-500';
    }
  };

  const columns = [
    {
      key: 'name' as keyof SkillDefinition,
      label: 'Tên Skill',
      sortable: true,
    },
    {
      key: 'skillType' as keyof SkillDefinition,
      label: 'Type',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${getSkillTypeColor(value as string)}`}>
          {getSkillTypeName(value as string)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'requiredAttribute' as keyof SkillDefinition,
      label: 'Attribute',
      render: (value: unknown) => (
        <span className={`px-2 py-1 rounded text-xs text-white ${getAttributeColor(value as string)}`}>
          {value as string}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'requiredLevel' as keyof SkillDefinition,
      label: 'Required Level',
      sortable: true,
    },
    {
      key: 'maxLevel' as keyof SkillDefinition,
      label: 'Max Level',
      sortable: true,
    },
    {
      key: 'skillPointCost' as keyof SkillDefinition,
      label: 'SP Cost',
      sortable: true,
    },
    {
      key: 'category' as keyof SkillDefinition,
      label: 'Category',
      render: (value: unknown) => (
        <span className="capitalize">{value as string || 'None'}</span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6 dark:text-gray-100">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Skills</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills?.length || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Skill definitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passive Skills</CardTitle>
            <Sparkles className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills?.filter(s => s.skillType === 'passive').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Always active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Skills</CardTitle>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills?.filter(s => s.skillType === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Manual activation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toggle Skills</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills?.filter(s => s.skillType === 'toggle').length || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">On/off toggle</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingSkill ? 'Chỉnh sửa Skill' : 'Tạo Skill mới'}
            </CardTitle>
            <CardDescription>
              {editingSkill ? 'Cập nhật thông tin skill' : 'Thêm skill mới vào hệ thống'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skillId">Skill ID</Label>
              <Input
                id="skillId"
                value={formData.skillId}
                onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                placeholder="unique_skill_id"
                disabled={!!editingSkill}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Tên Skill</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên skill"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về skill"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxLevel">Max Level</Label>
                <Input
                  id="maxLevel"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxLevel}
                  onChange={(e) => setFormData({ ...formData, maxLevel: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skillPointCost">SP Cost</Label>
                <Input
                  id="skillPointCost"
                  type="number"
                  min="1"
                  value={formData.skillPointCost}
                  onChange={(e) => setFormData({ ...formData, skillPointCost: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredAttribute">Required Attribute</Label>
                <select
                  id="requiredAttribute"
                  value={formData.requiredAttribute}
                  onChange={(e) => setFormData({ ...formData, requiredAttribute: e.target.value as 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                >
                  <option value="STR">STR</option>
                  <option value="INT">INT</option>
                  <option value="DEX">DEX</option>
                  <option value="VIT">VIT</option>
                  <option value="LUK">LUK</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiredAttributeValue">Min Attribute Value</Label>
                <Input
                  id="requiredAttributeValue"
                  type="number"
                  min="0"
                  value={formData.requiredAttributeValue}
                  onChange={(e) => setFormData({ ...formData, requiredAttributeValue: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Combat, Magic, Agility, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillType">Skill Type</Label>
              <select
                id="skillType"
                value={formData.skillType}
                onChange={(e) => setFormData({ ...formData, skillType: e.target.value as 'passive' | 'active' | 'toggle' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
              >
                <option value="passive">Passive</option>
                <option value="active">Active</option>
                <option value="toggle">Toggle</option>
              </select>
            </div>

            {(formData.skillType === 'active' || formData.skillType === 'toggle') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manaCost">Mana Cost</Label>
                    <Input
                      id="manaCost"
                      type="number"
                      min="0"
                      value={formData.manaCost}
                      onChange={(e) => setFormData({ ...formData, manaCost: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                    <Input
                      id="cooldown"
                      type="number"
                      min="0"
                      value={formData.cooldown}
                      onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetType">Target Type</Label>
                  <select
                    id="targetType"
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as 'self' | 'enemy' | 'ally' | 'aoe_enemies' | 'aoe_allies' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                  >
                    <option value="self">Self</option>
                    <option value="enemy">Enemy</option>
                    <option value="ally">Ally</option>
                    <option value="aoe_enemies">AOE Enemies</option>
                    <option value="aoe_allies">AOE Allies</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="damageType">Damage Type</Label>
                    <select
                      id="damageType"
                      value={formData.damageType}
                      onChange={(e) => setFormData({ ...formData, damageType: e.target.value as 'physical' | 'magical' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                    >
                      <option value="physical">Physical</option>
                      <option value="magical">Magical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="damageFormula">Damage Formula</Label>
                  <Input
                    id="damageFormula"
                    value={formData.damageFormula}
                    onChange={(e) => setFormData({ ...formData, damageFormula: e.target.value })}
                    placeholder="e.g., INT * 2 + level * 10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="healingFormula">Healing Formula</Label>
                  <Input
                    id="healingFormula"
                    value={formData.healingFormula}
                    onChange={(e) => setFormData({ ...formData, healingFormula: e.target.value })}
                    placeholder="e.g., INT * 1.5 + level * 5"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="effects">Effects (JSON)</Label>
              <Textarea
                id="effects"
                value={formData.effects}
                onChange={(e) => setFormData({ ...formData, effects: e.target.value })}
                placeholder='{"1": {"statBonuses": {"attack": 10, "defense": 5}}}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={editingSkill ? handleUpdateSkill : handleCreateSkill}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingSkill ? 'Cập nhật' : 'Tạo Skill'}
              </Button>
              {editingSkill && (
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills List */}
        <div className="lg:col-span-2">
          <DataTable
            title="Danh sách Skills"
            data={skills || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm skill..."
            searchFields={['name', 'description', 'category']}
            onCreate={() => resetForm()}
            onEdit={startEdit}
            onDelete={handleDeleteSkill}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}