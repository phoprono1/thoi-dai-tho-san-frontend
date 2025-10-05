'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { api } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/asset';
import { toast } from 'sonner';
import { 
  Sparkles, Plus, Trash2, Info, Wand2, Copy, 
  Shield, Zap, Target, Users, Lock 
} from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const SKILL_CATEGORIES = [
  { value: 'Combat', icon: '⚔️', color: 'bg-red-500' },
  { value: 'Magic', icon: '✨', color: 'bg-purple-500' },
  { value: 'Defense', icon: '🛡️', color: 'bg-blue-500' },
  { value: 'Support', icon: '💚', color: 'bg-green-500' },
  { value: 'Movement', icon: '🏃', color: 'bg-yellow-500' },
  { value: 'Utility', icon: '🔧', color: 'bg-gray-500' },
  { value: 'Special', icon: '🌟', color: 'bg-pink-500' },
] as const;

const AVAILABLE_CLASSES = [
  { value: 'warrior', label: 'Warrior', icon: '⚔️', color: 'text-red-600' },
  { value: 'mage', label: 'Mage', icon: '🔮', color: 'text-purple-600' },
  { value: 'archer', label: 'Archer', icon: '🏹', color: 'text-green-600' },
  { value: 'assassin', label: 'Assassin', icon: '🗡️', color: 'text-gray-700' },
  { value: 'knight', label: 'Knight', icon: '🛡️', color: 'text-blue-600' },
  { value: 'priest', label: 'Priest', icon: '✨', color: 'text-yellow-600' },
] as const;

const STAT_BONUS_KEYS = [
  { key: 'attack', label: 'Attack', icon: '⚔️', category: 'offense', suffix: '' },
  { key: 'defense', label: 'Defense', icon: '🛡️', category: 'defense', suffix: '' },
  { key: 'maxHp', label: 'Max HP', icon: '❤️', category: 'defense', suffix: '' },
  { key: 'critRate', label: 'Crit Rate', icon: '💥', category: 'offense', suffix: '%' },
  { key: 'critDamage', label: 'Crit Damage', icon: '💢', category: 'offense', suffix: '%' },
  { key: 'dodgeRate', label: 'Dodge Rate', icon: '💨', category: 'defense', suffix: '%' },
  { key: 'accuracy', label: 'Accuracy', icon: '🎯', category: 'offense', suffix: '%' },
  { key: 'lifesteal', label: 'Lifesteal', icon: '🩸', category: 'offense', suffix: '%' },
  { key: 'armorPen', label: 'Armor Pen', icon: '🔪', category: 'offense', suffix: '%' },
  { key: 'comboRate', label: 'Combo Rate', icon: '⚡', category: 'offense', suffix: '%' },
] as const;

const SKILL_TYPE_CONFIG = {
  passive: {
    label: 'Passive',
    icon: Shield,
    color: 'bg-green-500',
    description: 'Always active, provides constant bonuses',
    maxSlots: 3,
  },
  active: {
    label: 'Active',
    icon: Zap,
    color: 'bg-blue-500',
    description: 'Manual activation, costs mana',
    maxSlots: 4,
  },
  toggle: {
    label: 'Toggle',
    icon: Target,
    color: 'bg-purple-500',
    description: 'Can be turned on/off',
    maxSlots: 2,
  },
};

interface SkillEffect {
  statBonuses?: Record<string, number>;
  specialEffects?: string[];
  damage?: number;
  healing?: number;
  buffDuration?: number;
  debuffDuration?: number;
}

interface SkillDefinition {
  id: string;
  skillId?: string;
  name: string;
  description: string;
  maxLevel: number;
  requiredAttribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK';
  requiredAttributeValue: number;
  requiredLevel: number;
  skillPointCost: number;
  effects: Record<number, SkillEffect>;
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
  prerequisites?: string[];
  requiredSkillLevels?: Record<string, number>;
  classRestrictions?: string[];
  triggerCondition?: 'hp_below' | 'hp_above' | 'mana_below' | 'mana_above' | 'stamina_below' | 'in_combat' | 'always';
  triggerValue?: number;
  image?: string;
}

interface EffectFormData {
  level: number;
  statBonuses: Record<string, number>;
  damage?: number;
  healing?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminSkillsNew() {
  const queryClient = useQueryClient();
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxLevel: 5,
    requiredAttribute: 'STR' as 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK',
    requiredAttributeValue: 0,
    requiredLevel: 1,
    skillPointCost: 1,
    isActive: true,
    sortOrder: 0,
    category: 'Combat',
    skillType: 'passive' as 'passive' | 'active' | 'toggle',
    manaCost: 10,
    cooldown: 3,
    targetType: 'self' as 'self' | 'enemy' | 'ally' | 'aoe_enemies' | 'aoe_allies',
    damageType: 'physical' as 'physical' | 'magical',
    damageFormula: '',
    healingFormula: '',
    triggerCondition: 'always' as 'hp_below' | 'hp_above' | 'mana_below' | 'mana_above' | 'stamina_below' | 'in_combat' | 'always',
    triggerValue: 0,
  });

  const [effectsData, setEffectsData] = useState<EffectFormData[]>([
    { level: 1, statBonuses: {}, damage: 0, healing: 0 },
  ]);
  
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [prereqSearch, setPrereqSearch] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

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

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useMutation({
    mutationFn: async (data: Omit<SkillDefinition, 'id'>) => {
      return await adminApiEndpoints.createSkill(data);
    },
    onSuccess: async (res: unknown) => {
      const created = (res as Record<string, unknown>)?.data as SkillDefinition | undefined;
      
      // Upload image AFTER creation (for new skills only)
      if (selectedFile && created?.id) {
        try {
          const form = new FormData();
          form.append('image', selectedFile);
          await api.post(`/uploads/skills/${created.id}`, form, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
          });
          console.log('✅ Skill image uploaded after creation');
        } catch (err) {
          console.warn('⚠️ Image upload failed:', err);
          toast.warning('Skill tạo thành công nhưng upload ảnh thất bại');
        }
      }
      
      // Invalidate queries to refresh with new image
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      queryClient.invalidateQueries({ queryKey: ['playerSkills'] });
      toast.success('✨ Đã tạo skill thành công!');
      resetForm();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast.error(`❌ Lỗi tạo skill: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ skillId, data }: { skillId: string; data: Partial<SkillDefinition> }) => {
      return await adminApiEndpoints.updateSkill(skillId, data);
    },
    onSuccess: async () => {
      // Upload already done in handleSubmit for edit mode
      // Just invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      queryClient.invalidateQueries({ queryKey: ['playerSkills'] });
      toast.success('✅ Đã cập nhật skill thành công!');
      resetForm();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast.error(`❌ Lỗi cập nhật skill: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (skillId: string) => {
      return await adminApiEndpoints.deleteSkill(skillId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      toast.success('🗑️ Đã xóa skill và gỡ khỏi tất cả người chơi!');
    },
    onError: (error: Error) => {
      toast.error(`❌ Lỗi xóa skill: ${error.message}`);
    },
  });

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxLevel: 5,
      requiredAttribute: 'STR',
      requiredAttributeValue: 0,
      requiredLevel: 1,
      skillPointCost: 1,
      isActive: true,
      sortOrder: 0,
      category: 'Combat',
      skillType: 'passive',
      manaCost: 0,
      cooldown: 0,
      targetType: 'self',
      damageType: 'physical',
      damageFormula: '',
      healingFormula: '',
      triggerCondition: 'always',
      triggerValue: 0,
    });
    setEffectsData([{ level: 1, statBonuses: {}, damage: 0, healing: 0 }]);
    setSelectedPrerequisites([]);
    setSelectedClasses([]);
    setEditingSkill(null);
    setActiveTab('basic');
    setPrereqSearch('');
    setSelectedFile(null);
  };

  const addEffectLevel = () => {
    const nextLevel = Math.max(...effectsData.map(e => e.level)) + 1;
    if (nextLevel <= formData.maxLevel) {
      setEffectsData([...effectsData, { level: nextLevel, statBonuses: {}, damage: 0, healing: 0 }]);
      toast.success(`➕ Đã thêm Level ${nextLevel}`);
    } else {
      toast.error(`⚠️ Max level là ${formData.maxLevel}`);
    }
  };

  const removeEffectLevel = (level: number) => {
    if (effectsData.length === 1) {
      toast.error('⚠️ Phải có ít nhất 1 level!');
      return;
    }
    setEffectsData(effectsData.filter(e => e.level !== level));
    toast.info(`🗑️ Đã xóa Level ${level}`);
  };

  const duplicateEffectLevel = (level: number) => {
    const sourcEffect = effectsData.find(e => e.level === level);
    if (!sourcEffect) return;
    
    const nextLevel = Math.max(...effectsData.map(e => e.level)) + 1;
    if (nextLevel > formData.maxLevel) {
      toast.error(`⚠️ Max level là ${formData.maxLevel}`);
      return;
    }
    
    setEffectsData([...effectsData, { 
      level: nextLevel, 
      statBonuses: { ...sourcEffect.statBonuses },
      damage: sourcEffect.damage,
      healing: sourcEffect.healing,
    }]);
    toast.success(`📋 Đã copy Level ${level} → Level ${nextLevel}`);
  };

  const updateEffectStatBonus = (level: number, stat: string, value: number) => {
    setEffectsData(effectsData.map(e => {
      if (e.level === level) {
        return {
          ...e,
          statBonuses: {
            ...e.statBonuses,
            [stat]: value || 0,
          }
        };
      }
      return e;
    }));
  };

  const toggleClass = (classValue: string) => {
    setSelectedClasses(prev =>
      prev.includes(classValue)
        ? prev.filter(c => c !== classValue)
        : [...prev, classValue]
    );
  };

  const togglePrerequisite = (skillId: string) => {
    setSelectedPrerequisites(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('⚠️ Vui lòng điền đầy đủ tên và mô tả!');
      setActiveTab('basic');
      return;
    }

    const skillId = editingSkill?.id || nameToSlug(formData.name);

    // Build effects
    const effects: Record<number, SkillEffect> = {};
    effectsData.forEach(e => {
      const cleanBonuses: Record<string, number> = {};
      Object.entries(e.statBonuses).forEach(([key, val]) => {
        if (val && val !== 0) cleanBonuses[key] = val;
      });

      effects[e.level] = {
        ...(Object.keys(cleanBonuses).length > 0 && { statBonuses: cleanBonuses }),
        ...(e.damage && e.damage > 0 && { damage: e.damage }),
        ...(e.healing && e.healing > 0 && { healing: e.healing }),
      };
    });

    const skillData: Partial<SkillDefinition> & { skillId: string } = {
      skillId,
      name: formData.name.trim(),
      description: formData.description.trim(),
      maxLevel: formData.maxLevel,
      requiredAttribute: formData.requiredAttribute,
      requiredAttributeValue: formData.requiredAttributeValue,
      requiredLevel: formData.requiredLevel,
      skillPointCost: formData.skillPointCost,
      effects,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      category: formData.category,
      skillType: formData.skillType,
      ...(formData.skillType !== 'passive' && {
        manaCost: formData.manaCost > 0 ? formData.manaCost : 10,
        cooldown: formData.cooldown > 0 ? formData.cooldown : 3,
        targetType: formData.targetType || undefined,
        damageType: formData.damageType || undefined,
        damageFormula: formData.damageFormula.trim() || undefined,
        healingFormula: formData.healingFormula.trim() || undefined,
      }),
      ...(formData.skillType === 'toggle' && {
        triggerCondition: formData.triggerCondition || 'always',
        triggerValue: formData.triggerValue || 0,
      }),
      ...(selectedPrerequisites.length > 0 && { prerequisites: selectedPrerequisites }),
      ...(selectedClasses.length > 0 && { classRestrictions: selectedClasses }),
    };

    // STEP 1: Upload image first (if file selected) so backend can auto-save image path
    if (selectedFile && editingSkill) {
      try {
        const form = new FormData();
        form.append('image', selectedFile);
        await api.post(`/uploads/skills/${skillId}`, form, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        console.log('✅ Image uploaded first');
      } catch (err) {
        console.warn('⚠️ Image upload failed:', err);
        toast.warning('Upload ảnh thất bại, tiếp tục lưu skill...');
      }
    }

    // STEP 2: Update/create skill (image already saved if uploaded)
    if (editingSkill) {
      updateMutation.mutate({ skillId: editingSkill.id, data: skillData });
    } else {
      createMutation.mutate(skillData as Omit<SkillDefinition, 'id'>);
    }
  };

  const handleDeleteSkill = (skill: SkillDefinition) => {
    if (!confirm(`⚠️ Bạn có chắc muốn xóa skill "${skill.name}"?\n\n🚨 CẢNH BÁO: Skill này sẽ bị xóa khỏi TẤT CẢ NGƯỜI CHƠI!\n\nHành động này không thể hoàn tác!`)) return;
    
    // Show loading toast
    toast.info('🔄 Đang xóa skill và gỡ khỏi người chơi...');
    
    deleteMutation.mutate(skill.id);
  };

  const startEdit = (skill: SkillDefinition) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description,
      maxLevel: skill.maxLevel,
      requiredAttribute: skill.requiredAttribute,
      requiredAttributeValue: skill.requiredAttributeValue,
      requiredLevel: skill.requiredLevel,
      skillPointCost: skill.skillPointCost,
      isActive: skill.isActive,
      sortOrder: skill.sortOrder,
      category: skill.category || 'Combat',
      skillType: skill.skillType,
      manaCost: skill.manaCost ?? 10,
      cooldown: skill.cooldown ?? 3,
      targetType: skill.targetType || 'self',
      damageType: skill.damageType || 'physical',
      damageFormula: skill.damageFormula || '',
      healingFormula: skill.healingFormula || '',
      triggerCondition: skill.triggerCondition || 'always',
      triggerValue: skill.triggerValue || 0,
    });

    const parsedEffects: EffectFormData[] = Object.entries(skill.effects || {}).map(([level, effect]) => ({
      level: parseInt(level),
      statBonuses: effect.statBonuses || {},
      damage: effect.damage || 0,
      healing: effect.healing || 0,
    }));
    setEffectsData(parsedEffects.length > 0 ? parsedEffects : [{ level: 1, statBonuses: {}, damage: 0, healing: 0 }]);

    setSelectedPrerequisites(skill.prerequisites || []);
    setSelectedClasses(skill.classRestrictions || []);
    setActiveTab('basic');
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns = [
    {
      key: 'image' as keyof SkillDefinition,
      label: 'Icon',
      render: (value: unknown, row: SkillDefinition) => {
        if (!value) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-12 h-12 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-950">
                    <span className="text-xs text-red-500">No Icon</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-red-500">⚠️ Skill chưa có icon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return (
          <div className="relative w-12 h-12 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <Image
              src={resolveAssetUrl(value as string) || ''}
              alt={row.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        );
      },
    },
    {
      key: 'name' as keyof SkillDefinition,
      label: 'Tên Skill',
      sortable: true,
    },
    {
      key: 'skillType' as keyof SkillDefinition,
      label: 'Type',
      render: (value: unknown) => {
        const config = SKILL_TYPE_CONFIG[value as keyof typeof SKILL_TYPE_CONFIG];
        const Icon = config.icon;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className={`${config.color} text-white`}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.description}</p>
                <p className="text-xs text-gray-400">Max slots: {config.maxSlots}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      sortable: true,
    },
    {
      key: 'category' as keyof SkillDefinition,
      label: 'Category',
      render: (value: unknown) => {
        const cat = SKILL_CATEGORIES.find(c => c.value === value);
        return (
          <Badge variant="outline">
            {cat?.icon} {value as string || 'None'}
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: 'requiredLevel' as keyof SkillDefinition,
      label: 'Req. Level',
      sortable: true,
    },
    {
      key: 'maxLevel' as keyof SkillDefinition,
      label: 'Max Lv',
      sortable: true,
    },
    {
      key: 'skillPointCost' as keyof SkillDefinition,
      label: 'SP Cost',
      sortable: true,
    },
  ];

  // ============================================================================
  // FILTERED SKILLS FOR PREREQUISITES
  // ============================================================================

  const filteredSkillsForPrereq = skills?.filter(s => {
    if (editingSkill && s.id === editingSkill.id) return false;
    if (!prereqSearch.trim()) return true;
    return s.name.toLowerCase().includes(prereqSearch.toLowerCase());
  }) || [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6 dark:text-gray-100">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {Object.entries(SKILL_TYPE_CONFIG).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{config.label} Skills</CardTitle>
                <Icon className={`h-4 w-4 text-${config.color.split('-')[1]}-500`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {skills?.filter(s => s.skillType === type).length || 0}
                </div>
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  {config.maxSlots} slots max
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              {editingSkill ? 'Chỉnh sửa Skill' : 'Tạo Skill mới'}
            </CardTitle>
            <CardDescription>
              {editingSkill ? 'Cập nhật thông tin skill' : 'Form builder không cần JSON 🎉'}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
                <TabsTrigger value="prereq">Prerequisites</TabsTrigger>
                <TabsTrigger value="combat">Combat</TabsTrigger>
              </TabsList>

              {/* TAB: BASIC INFO */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      ✨ Tên Skill <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập tên skill..."
                      className="font-semibold"
                    />
                    {formData.name && !editingSkill && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 p-2 rounded flex items-center gap-1">
                        <Wand2 className="h-3 w-3" />
                        ID tự động: <code className="font-mono font-bold">{nameToSlug(formData.name)}</code>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      📝 Mô tả <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả về skill này..."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  {/* Upload Skill Image */}
                  <div className="space-y-2">
                    <Label htmlFor="skill-image" className="flex items-center gap-2">
                      🖼️ Skill Icon
                    </Label>
                    
                    {/* Current Image Preview (when editing) */}
                    {editingSkill?.image && (
                      <div className="flex items-center gap-3 p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
                        <div className="relative w-16 h-16 border-2 border-blue-300 rounded-lg overflow-hidden bg-white shadow-md">
                          {editingSkill.image ? (
                            <Image
                              src={resolveAssetUrl(editingSkill.image) || ''}
                              alt={editingSkill.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-2xl font-bold">
                              {editingSkill.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">📸 Current Image</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-mono">{editingSkill.image}</p>
                        </div>
                      </div>
                    )}

                    {/* New Image Preview (when file selected) */}
                    {selectedFile && (
                      <div className="flex items-center gap-3 p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                        <div className="relative w-16 h-16 border-2 border-green-300 rounded-lg overflow-hidden bg-white shadow-md">
                          <Image
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-300">✅ New Image Selected</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      </div>
                    )}

                    <Input
                      id="skill-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    
                    <p className="text-xs text-gray-500">
                      💡 Recommended: 256x256px, PNG/WebP format. Max 5MB.
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="flex items-center gap-1">
                        🏷️ Category
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                {cat.icon} {cat.value}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skillType" className="flex items-center gap-1">
                        ⚡ Skill Type
                      </Label>
                      <Select
                        value={formData.skillType}
                        onValueChange={(value) => setFormData({ ...formData, skillType: value as 'passive' | 'active' | 'toggle' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SKILL_TYPE_CONFIG).map(([type, config]) => (
                            <SelectItem key={type} value={type}>
                              <span className="flex items-center gap-2">
                                {React.createElement(config.icon, { className: 'h-4 w-4' })}
                                {config.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {SKILL_TYPE_CONFIG[formData.skillType].description}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="requiredLevel">🎯 Level tối thiểu</Label>
                      <Input
                        id="requiredLevel"
                        type="number"
                        min="1"
                        value={formData.requiredLevel}
                        onChange={(e) => setFormData({ ...formData, requiredLevel: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skillPointCost">💎 SP Cost</Label>
                      <Input
                        id="skillPointCost"
                        type="number"
                        min="1"
                        value={formData.skillPointCost}
                        onChange={(e) => setFormData({ ...formData, skillPointCost: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="requiredAttribute">📊 Attribute</Label>
                      <Select
                        value={formData.requiredAttribute}
                        onValueChange={(value) => setFormData({ ...formData, requiredAttribute: value as 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STR">💪 STR (Strength)</SelectItem>
                          <SelectItem value="INT">🧠 INT (Intelligence)</SelectItem>
                          <SelectItem value="DEX">🎯 DEX (Dexterity)</SelectItem>
                          <SelectItem value="VIT">❤️ VIT (Vitality)</SelectItem>
                          <SelectItem value="LUK">🍀 LUK (Luck)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requiredAttributeValue">Giá trị tối thiểu</Label>
                      <Input
                        id="requiredAttributeValue"
                        type="number"
                        min="0"
                        value={formData.requiredAttributeValue}
                        onChange={(e) => setFormData({ ...formData, requiredAttributeValue: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="maxLevel">⬆️ Max Level</Label>
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
                      <Label htmlFor="sortOrder">🔢 Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: EFFECTS */}
              <TabsContent value="effects" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Effects per Level</h3>
                    <p className="text-xs text-gray-500">Stat bonuses cho mỗi level</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addEffectLevel}
                    disabled={effectsData.length >= formData.maxLevel}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Level
                  </Button>
                </div>

                <div className="space-y-3">
                  {effectsData.sort((a, b) => a.level - b.level).map((effect) => (
                    <Card key={effect.level} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-base">
                            Level {effect.level}
                          </Badge>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => duplicateEffectLevel(effect.level)}
                                  >
                                    <Copy className="h-4 w-4 text-blue-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy to next level</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {effectsData.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeEffectLevel(effect.level)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        {/* Offensive Stats */}
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">⚔️ Offensive</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {STAT_BONUS_KEYS.filter(s => s.category === 'offense').map(({ key, label, icon, suffix }) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-xs flex items-center gap-1">
                                  {icon} {label}
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={effect.statBonuses[key] || 0}
                                    onChange={(e) => updateEffectStatBonus(effect.level, key, parseInt(e.target.value) || 0)}
                                    className="h-8 text-sm pr-8"
                                  />
                                  {suffix && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                      {suffix}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Defensive Stats */}
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">🛡️ Defensive</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {STAT_BONUS_KEYS.filter(s => s.category === 'defense').map(({ key, label, icon, suffix }) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-xs flex items-center gap-1">
                                  {icon} {label}
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={effect.statBonuses[key] || 0}
                                    onChange={(e) => updateEffectStatBonus(effect.level, key, parseInt(e.target.value) || 0)}
                                    className="h-8 text-sm pr-8"
                                  />
                                  {suffix && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                      {suffix}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* TAB: PREREQUISITES */}
              <TabsContent value="prereq" className="space-y-4 mt-4">
                {/* Class Restrictions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Label>Class Restrictions</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Để trống = tất cả class có thể học</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                    {AVAILABLE_CLASSES.map(cls => (
                      <div key={cls.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.value}`}
                          checked={selectedClasses.includes(cls.value)}
                          onCheckedChange={() => toggleClass(cls.value)}
                        />
                        <label 
                          htmlFor={`class-${cls.value}`} 
                          className={`text-sm cursor-pointer flex items-center gap-1 ${cls.color}`}
                        >
                          {cls.icon} {cls.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedClasses.length > 0 && (
                    <p className="text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✅ Đã chọn: {selectedClasses.map(c => AVAILABLE_CLASSES.find(cl => cl.value === c)?.label).join(', ')}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Skill Prerequisites */}
                {skills && skills.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <Label>Skill Prerequisites</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Skills phải học trước khi unlock skill này</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <Input
                      placeholder="🔍 Tìm skill..."
                      value={prereqSearch}
                      onChange={(e) => setPrereqSearch(e.target.value)}
                      className="mb-2"
                    />

                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                      {filteredSkillsForPrereq.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          {prereqSearch ? 'Không tìm thấy skill phù hợp' : 'Chưa có skill nào'}
                        </p>
                      ) : (
                        filteredSkillsForPrereq.map(skill => (
                          <div key={skill.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                            <Checkbox
                              id={`prereq-${skill.id}`}
                              checked={selectedPrerequisites.includes(skill.id)}
                              onCheckedChange={() => togglePrerequisite(skill.id)}
                            />
                            <label htmlFor={`prereq-${skill.id}`} className="text-sm cursor-pointer flex-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {SKILL_CATEGORIES.find(c => c.value === skill.category)?.icon}
                              </Badge>
                              {skill.name}
                              <span className="text-xs text-gray-400">Lv.{skill.requiredLevel}</span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>

                    {selectedPrerequisites.length > 0 && (
                      <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        🔒 Đã chọn: {selectedPrerequisites.length} skill(s)
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* TAB: COMBAT (for Active/Toggle) */}
              <TabsContent value="combat" className="space-y-4 mt-4">
                {formData.skillType === 'passive' ? (
                  <div className="text-center py-8 text-gray-400">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Passive skills không cần combat settings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">
                        ⚠️ Lưu ý: Active skills cần mana cost & cooldown
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Nếu để 0, hệ thống sẽ tự động set: <code>manaCost=10</code>, <code>cooldown=3</code>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="manaCost" className="flex items-center gap-2">
                          💧 Mana Cost <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="manaCost"
                          type="number"
                          min="1"
                          value={formData.manaCost}
                          onChange={(e) => setFormData({ ...formData, manaCost: parseInt(e.target.value) || 10 })}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">
                          Mana tiêu tốn mỗi lần dùng skill
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cooldown" className="flex items-center gap-2">
                          ⏱️ Cooldown (turns) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cooldown"
                          type="number"
                          min="1"
                          value={formData.cooldown}
                          onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) || 3 })}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">
                          Số turn phải chờ trước khi dùng lại
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="targetType">🎯 Target Type</Label>
                        <Select
                          value={formData.targetType}
                          onValueChange={(value) => setFormData({ ...formData, targetType: value as 'self' | 'enemy' | 'ally' | 'aoe_enemies' | 'aoe_allies' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">👤 Self</SelectItem>
                            <SelectItem value="enemy">💀 Enemy</SelectItem>
                            <SelectItem value="ally">🤝 Ally</SelectItem>
                            <SelectItem value="aoe_enemies">💥 AOE Enemies</SelectItem>
                            <SelectItem value="aoe_allies">💚 AOE Allies</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="damageType">⚔️ Damage Type</Label>
                        <Select
                          value={formData.damageType}
                          onValueChange={(value) => setFormData({ ...formData, damageType: value as 'physical' | 'magical' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physical">⚔️ Physical</SelectItem>
                            <SelectItem value="magical">✨ Magical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="damageFormula">📐 Damage Formula</Label>
                      <Input
                        id="damageFormula"
                        value={formData.damageFormula}
                        onChange={(e) => setFormData({ ...formData, damageFormula: e.target.value })}
                        placeholder="e.g., INT * 2 + level * 10"
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500">
                        Variables: INT, STR, DEX, VIT, LUK, level, attack, defense
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="healingFormula">💚 Healing Formula</Label>
                      <Input
                        id="healingFormula"
                        value={formData.healingFormula}
                        onChange={(e) => setFormData({ ...formData, healingFormula: e.target.value })}
                        placeholder="e.g., INT * 1.5 + level * 5"
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500">
                        Leave empty if not a healing skill
                      </p>
                    </div>

                    {/* Toggle Trigger Conditions */}
                    {formData.skillType === 'toggle' && (
                      <>
                        <Separator />
                        <div className="space-y-3 p-3 border border-purple-500 rounded-lg bg-purple-500/5">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold text-sm">Toggle Trigger Conditions</span>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Skill sẽ tự động bật/tắt dựa trên điều kiện
                          </p>

                          <div className="space-y-2">
                            <Label htmlFor="triggerCondition">🎯 Trigger Condition</Label>
                            <Select
                              value={formData.triggerCondition}
                              onValueChange={(value) => setFormData({ 
                                ...formData, 
                                triggerCondition: value as 'hp_below' | 'hp_above' | 'mana_below' | 'mana_above' | 'stamina_below' | 'in_combat' | 'always'
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="always">⚡ Always (luôn bật)</SelectItem>
                                <SelectItem value="hp_below">❤️ HP dưới %</SelectItem>
                                <SelectItem value="hp_above">💚 HP trên %</SelectItem>
                                <SelectItem value="mana_below">💧 Mana dưới %</SelectItem>
                                <SelectItem value="mana_above">🌊 Mana trên %</SelectItem>
                                <SelectItem value="stamina_below">⚡ Stamina dưới %</SelectItem>
                                <SelectItem value="in_combat">⚔️ Trong combat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.triggerCondition !== 'always' && formData.triggerCondition !== 'in_combat' && (
                            <div className="space-y-2">
                              <Label htmlFor="triggerValue">
                                🎚️ Trigger Value (%)
                              </Label>
                              <Input
                                id="triggerValue"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.triggerValue}
                                onChange={(e) => setFormData({ ...formData, triggerValue: parseInt(e.target.value) || 0 })}
                              />
                              <p className="text-xs text-yellow-600">
                                Ví dụ: HP dưới 20% → tăng 50% dame
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Submit Buttons */}
            <div className="flex space-x-2 pt-6 border-t mt-6">
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingSkill ? '✅ Cập nhật' : '✨ Tạo Skill'}
              </Button>
              {editingSkill && (
                <Button variant="outline" onClick={resetForm}>
                  ❌ Hủy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills List */}
        <div className="lg:col-span-2">
          <DataTable
            title="📚 Danh sách Skills"
            data={skills || []}
            columns={columns}
            searchPlaceholder="🔍 Tìm kiếm skill..."
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
