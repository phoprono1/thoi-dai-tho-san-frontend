/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '@/lib/api-client';
import { apiService } from '@/lib/api-service';
import { resolveAssetUrl } from '@/lib/asset';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Shield, 
  Target, 
  Plus, 
  Sparkles,
  Lock,
  Unlock,
  X,
  TrendingUp,
  Info,
  Gem,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// TYPES
// ============================================================================

interface SkillEffect {
  statBonuses?: Record<string, number>;
  damage?: number;
  healing?: number;
}

interface SkillDefinition {
  id: string; // This is the skillId string like 'power_strike'
  skillId?: string; // Backend may return this as well
  name: string;
  description: string;
  maxLevel: number;
  category: string;
  skillType: 'passive' | 'active' | 'toggle';
  requiredLevel: number;
  requiredAttribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK';
  requiredAttributeValue: number;
  skillPointCost: number;
  cooldown?: number; // Turn-based cooldown (e.g., 3 turns)
  manaCost?: number; // Mana cost to use skill
  effects: Record<number, SkillEffect>;
  prerequisites?: string[];
  classRestrictions?: string[];
  image?: string; // Path to skill icon image like /assets/skills/xxx.webp
}

interface PlayerSkill {
  id: number; // Primary key
  userId: number;
  currentLevel: number;
  level: number; // Alias for currentLevel
  isEquipped: boolean;
  unlockedAt: string;
  lastUsedAt?: string;
  skillDefinition: SkillDefinition;
}

interface EquippedSlotsInfo {
  passive: { used: number; max: number };
  active: { used: number; max: number };
  toggle: { used: number; max: number };
}

// ============================================================================
// SKILL TYPE CONFIG
// ============================================================================

const SKILL_TYPE_CONFIG = {
  passive: {
    label: 'Passive',
    icon: Shield,
    badge: 'P',
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-600',
    description: 'Luôn hoạt động',
    maxSlots: 3,
  },
  active: {
    label: 'Active',
    icon: Zap,
    badge: 'A',
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    description: 'Kích hoạt thủ công',
    maxSlots: 4,
  },
  toggle: {
    label: 'Toggle',
    icon: Target,
    badge: 'T',
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-600',
    description: 'Bật/Tắt',
    maxSlots: 2,
  },
};

// ============================================================================
// SKILL SLOT COMPONENT
// ============================================================================

interface SkillSlotProps {
  skill?: PlayerSkill;
  slotType: 'passive' | 'active' | 'toggle';
  onEquip: () => void;
  onUnequip: () => void;
}

const SkillSlot: React.FC<SkillSlotProps> = ({ skill, slotType, onEquip, onUnequip }) => {
  const config = SKILL_TYPE_CONFIG[slotType];
  const [showTooltip, setShowTooltip] = React.useState(false);

  if (!skill) {
    // Empty slot
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`relative w-16 h-16 border-2 ${config.borderColor} border-dashed rounded-lg bg-[var(--card)] hover:bg-[var(--accent)] cursor-pointer flex items-center justify-center transition-all`}
              onClick={onEquip}
            >
              <Plus className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Thêm skill {config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Filled slot
  const definition = skill.skillDefinition;
  const currentLevel = skill.currentLevel || skill.level || 1;
  const currentEffect = definition.effects[currentLevel];

  return (
    <div className="relative w-16 h-16">
      <div
        className={`relative w-full h-full border-2 ${config.borderColor} rounded-lg ${config.color} flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group`}
        onClick={onUnequip}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Skill Icon/Image */}
        {definition.image ? (
          <Image 
            src={resolveAssetUrl(definition.image) || ''}
            alt={definition.name}
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-lg"
            unoptimized
          />
        ) : (
          <div className="text-white font-bold text-xl">
            {definition.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-1 rounded-bl rounded-tr">
          {config.badge}
        </div>

        {/* Level Badge */}
        <div className="absolute bottom-0 left-0 bg-black text-white text-[10px] font-bold px-1 rounded-tr rounded-bl">
          Lv.{currentLevel}
        </div>

        {/* Cooldown Badge (Active/Toggle skills only) */}
        {definition.cooldown && definition.cooldown > 0 && (definition.skillType === 'active' || definition.skillType === 'toggle') && (
          <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-tl rounded-br flex items-center gap-0.5">
            <span>CD: {definition.cooldown}T</span>
          </div>
        )}

        {/* Remove icon on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
          <X className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg whitespace-nowrap -top-2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={config.color}>{config.label}</Badge>
              <span className="font-bold">{definition.name}</span>
            </div>
            <p className="text-xs text-gray-300">{definition.description}</p>
            {/* Cooldown & Mana Cost */}
            {(definition.cooldown || definition.manaCost) && (
              <div className="text-xs space-y-1">
                {definition.cooldown && definition.cooldown > 0 && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <Zap className="h-3 w-3" />
                    <span>Kích hoạt mỗi <strong>{definition.cooldown} turn</strong></span>
                  </div>
                )}
                {definition.manaCost && definition.manaCost > 0 && (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Zap className="h-3 w-3" />
                    <span>Chi phí: <strong>{definition.manaCost} mana</strong></span>
                  </div>
                )}
              </div>
            )}
            <div className="text-xs">
              <span className="font-semibold">Level {currentLevel}:</span>
              {currentEffect?.statBonuses && Object.entries(currentEffect.statBonuses).map(([stat, value]) => (
                <div key={stat} className="ml-2">
                  • {stat}: +{value}
                </div>
              ))}
              {currentEffect?.damage && <div className="ml-2">• Damage: {currentEffect.damage}</div>}
              {currentEffect?.healing && <div className="ml-2">• Healing: {currentEffect.healing}</div>}
            </div>
            <p className="text-xs text-yellow-400">Click để tháo</p>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SKILL EQUIP MODAL
// ============================================================================

interface SkillEquipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotType: 'passive' | 'active' | 'toggle';
  onEquip: (skillId: string) => void;
}

const SkillEquipModal: React.FC<SkillEquipModalProps> = ({
  open,
  onOpenChange,
  slotType,
  onEquip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playerSkills = [] } = useQuery<PlayerSkill[]>({
    queryKey: ['playerSkills'],
    queryFn: async () => {
      const skills = await skillsApi.getPlayerSkills();
      console.log('🎯 PlayerSkills for equip modal:', skills);
      console.log('🎯 Looking for slotType:', slotType);
      return skills;
    },
    enabled: open,
  });

  // Filter: correct type, not equipped, matching search
  const availableSkills = playerSkills.filter(skill => {
    const matchesType = skill.skillDefinition?.skillType === slotType;
    const notEquipped = !skill.isEquipped;
    const matchesSearch = searchQuery.trim() === '' || skill.skillDefinition?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const skillId = skill.skillDefinition?.skillId || skill.skillDefinition?.id;
    console.log(`Skill ${skillId}:`, { 
      type: skill.skillDefinition?.skillType, 
      matchesType, 
      isEquipped: skill.isEquipped, 
      notEquipped,
      matchesSearch 
    });
    
    return matchesType && notEquipped && matchesSearch;
  });

  const config = SKILL_TYPE_CONFIG[slotType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {React.createElement(config.icon, { className: "h-5 w-5" })}
            Chọn Skill {config.label}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chọn kỹ năng để trang bị vào slot {config.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="🔍 Tìm skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {availableSkills.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Không có skill {config.label} nào</p>
                  <p className="text-xs">Hãy mở khóa skill mới ở Cây Kỹ Năng</p>
                </div>
              ) : (
                availableSkills.map((skill, idx) => {
                  const definition = skill.skillDefinition;
                  const currentLevel = skill.currentLevel || skill.level || 1;
                  const currentEffect = definition.effects[currentLevel];
                  // Backend expects skillDefinition.skillId (string like 'power_strike')
                  const equipSkillId = definition.skillId || definition.id;

                  return (
                    <div
                      key={`equip-${equipSkillId}-${idx}`}
                      className="border border-[var(--border)] rounded-lg p-3 hover:bg-[var(--accent)] cursor-pointer transition-colors"
                      onClick={() => {
                        console.log('🎯 Equipping skill:', { skillDefId: definition.skillId, definitionId: definition.id, selected: equipSkillId });
                        onEquip(equipSkillId);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={config.color}>{config.badge}</Badge>
                            <span className="font-semibold">{definition.name}</span>
                            <Badge variant="outline">Lv.{currentLevel}/{definition.maxLevel}</Badge>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] mb-2">{definition.description}</p>
                          {currentEffect && (
                            <div className="text-xs space-y-0.5">
                              {currentEffect.statBonuses && Object.entries(currentEffect.statBonuses).map(([stat, value]) => (
                                <div key={stat} className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  <span>{stat}: +{value}</span>
                                </div>
                              ))}
                              {currentEffect.damage && (
                                <div className="flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-orange-500" />
                                  <span>Damage: {currentEffect.damage}</span>
                                </div>
                              )}
                              {currentEffect.healing && (
                                <div className="flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-blue-500" />
                                  <span>Healing: {currentEffect.healing}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Plus className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// SKILL TREE MODAL
// ============================================================================

interface SkillTreeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ open, onOpenChange }) => {
  const [selectedTab, setSelectedTab] = useState<'passive' | 'active' | 'toggle'>('passive');
  const queryClient = useQueryClient();

  const { data: playerSkills = [] } = useQuery<PlayerSkill[]>({
    queryKey: ['playerSkills'],
    queryFn: skillsApi.getPlayerSkills,
    enabled: open,
  });

  const { data: availableSkills = [] } = useQuery<any[]>({
    queryKey: ['availableSkills'],
    queryFn: async () => {
      const skills = await skillsApi.getAvailableSkills();
      console.log('🎯 Available skills from API:', skills);
      console.log('🎯 First skill:', skills[0]);
      return skills;
    },
    enabled: open,
  });

  const unlockMutation = useMutation({
    mutationFn: (skillId: string) => skillsApi.unlockSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerSkills'] });
      queryClient.invalidateQueries({ queryKey: ['availableSkills'] });
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      toast.success('✨ Đã mở khóa skill!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không đủ điều kiện mở khóa');
    },
  });

  const levelUpMutation = useMutation({
    mutationFn: (skillId: string) => skillsApi.levelUpSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerSkills'] });
      toast.success('⬆️ Đã nâng cấp skill!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể nâng cấp');
    },
  });

  // Combine unlocked skills with available skills
  // Available skills come from backend as SkillDefinition objects
  const filteredAvailable = availableSkills.filter(s => {
    const skillType = s.skillDefinition?.skillType || s.skillType;
    return skillType === selectedTab;
  });
  const filteredUnlocked = playerSkills.filter(s => s.skillDefinition.skillType === selectedTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Cây Kỹ Năng
          </DialogTitle>
          <DialogDescription className="sr-only">
            Quản lý và nâng cấp các kỹ năng của bạn
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(SKILL_TYPE_CONFIG).map(([type, config]) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {React.createElement(config.icon, { className: "h-4 w-4" })}
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(SKILL_TYPE_CONFIG).map((type) => {
            const config = SKILL_TYPE_CONFIG[type as keyof typeof SKILL_TYPE_CONFIG];

            return (
              <TabsContent key={type} value={type} className="mt-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {/* Unlocked Skills */}
                    {filteredUnlocked.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Unlock className="h-4 w-4 text-green-500" />
                          Đã mở khóa
                        </h3>
                        <div className="space-y-2">
                          {filteredUnlocked.map((skill, idx) => {
                            const definition = skill.skillDefinition;
                            const currentLevel = skill.currentLevel || skill.level || 1;
                            const currentEffect = definition.effects[currentLevel];
                            const canLevelUp = currentLevel < definition.maxLevel;
                            const skillId = definition.skillId || definition.id;

                            return (
                              <div
                                key={`unlocked-${skill.userId}-${skillId}-${idx}`}
                                className="border border-green-500 rounded-lg p-3 bg-green-500/10"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className={config.color}>{config.badge}</Badge>
                                      <span className="font-semibold">{definition.name}</span>
                                      <Badge variant="outline">
                                        Lv.{currentLevel}/{definition.maxLevel}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--muted-foreground)] mb-2">
                                      {definition.description}
                                    </p>
                                    {currentEffect && (
                                      <div className="text-xs space-y-0.5 mb-2">
                                        {currentEffect.statBonuses && Object.entries(currentEffect.statBonuses).map(([stat, value]) => (
                                          <div key={stat}>• {stat}: +{value}</div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                      <Info className="h-3 w-3" />
                                      <span>SP Cost: {definition.skillPointCost}</span>
                                      {definition.requiredLevel > 0 && (
                                        <span>• Req Level: {definition.requiredLevel}</span>
                                      )}
                                    </div>
                                  </div>
                                  {canLevelUp && (
                                    <Button
                                      size="sm"
                                      onClick={() => levelUpMutation.mutate(skillId)}
                                      disabled={levelUpMutation.isPending}
                                    >
                                      <TrendingUp className="h-4 w-4 mr-1" />
                                      Nâng cấp
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available to Unlock */}
                    {filteredAvailable.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-orange-500" />
                          Có thể mở khóa
                        </h3>
                        <div className="space-y-2">
                          {filteredAvailable.map((skill: any, idx: number) => {
                            const skillId = skill.skillId || skill.id;
                            const skillName = skill.name;
                            const firstEffect = skill.effects?.[1];

                            return (
                              <div
                                key={`available-${skillId}-${idx}`}
                                className="border border-[var(--border)] rounded-lg p-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className={config.color}>{config.badge}</Badge>
                                      <span className="font-semibold">{skillName}</span>
                                      <Badge variant="outline">Max Lv.{skill.maxLevel}</Badge>
                                    </div>
                                    <p className="text-xs text-[var(--muted-foreground)] mb-2">
                                      {skill.description}
                                    </p>
                                    {firstEffect && (
                                      <div className="text-xs space-y-0.5 mb-2">
                                        {firstEffect.statBonuses && Object.entries(firstEffect.statBonuses).map(([stat, value]: [string, any]) => (
                                          <div key={stat}>• {stat}: +{value}</div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                      <Info className="h-3 w-3" />
                                      <span>SP Cost: {skill.skillPointCost}</span>
                                      {skill.requiredLevel > 0 && (
                                        <span>• Req Level: {skill.requiredLevel}</span>
                                      )}
                                      {skill.requiredAttributeValue > 0 && (
                                        <span>• Req {skill.requiredAttribute}: {skill.requiredAttributeValue}</span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => unlockMutation.mutate(skillId)}
                                    disabled={unlockMutation.isPending}
                                  >
                                    <Unlock className="h-4 w-4 mr-1" />
                                    Mở khóa
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {filteredAvailable.length === 0 && filteredUnlocked.length === 0 && (
                      <div className="text-center py-12 text-[var(--muted-foreground)]">
                        <Lock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p>Chưa có skill {config.label} nào</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// MAIN SKILLS SECTION COMPONENT
// ============================================================================

export default function SkillsSection() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [equipModalType, setEquipModalType] = useState<'passive' | 'active' | 'toggle'>('passive');
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);

  const { data: playerSkills = [] } = useQuery<PlayerSkill[]>({
    queryKey: ['playerSkills', authUser?.id],
    queryFn: skillsApi.getPlayerSkills,
    enabled: !!authUser?.id,
  });

  const { data: slotsInfo } = useQuery<EquippedSlotsInfo>({
    queryKey: ['equippedSlots', authUser?.id],
    queryFn: skillsApi.getEquippedSlots,
    enabled: !!authUser?.id,
  });

  // Get user stats to show available skill points
  const { data: userStats } = useQuery({
    queryKey: ['userStats', authUser?.id],
    queryFn: () => apiService.getUserStats(authUser!.id),
    enabled: !!authUser?.id,
  });

  const equipMutation = useMutation({
    mutationFn: (skillId: string) => skillsApi.equipSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerSkills'] });
      queryClient.invalidateQueries({ queryKey: ['equippedSlots'] });
      toast.success('✅ Đã trang bị skill!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể trang bị skill');
    },
  });

  const unequipMutation = useMutation({
    mutationFn: (skillId: string) => skillsApi.unequipSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerSkills'] });
      queryClient.invalidateQueries({ queryKey: ['equippedSlots'] });
      toast.success('✅ Đã tháo skill!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể tháo skill');
    },
  });

  const handleOpenEquipModal = (type: 'passive' | 'active' | 'toggle') => {
    setEquipModalType(type);
    setEquipModalOpen(true);
  };

  const handleEquipSkill = (skillId: string) => {
    equipMutation.mutate(skillId);
  };

  const handleUnequipSkill = (skillId: string) => {
    unequipMutation.mutate(skillId);
  };

  // Group equipped skills by type
  const equippedPassive = playerSkills.filter(s => s.isEquipped && s.skillDefinition.skillType === 'passive');
  const equippedActive = playerSkills.filter(s => s.isEquipped && s.skillDefinition.skillType === 'active');
  const equippedToggle = playerSkills.filter(s => s.isEquipped && s.skillDefinition.skillType === 'toggle');

  // Create slots array
  const passiveSlots = Array.from({ length: 3 }, (_, i) => equippedPassive[i]);
  const activeSlots = Array.from({ length: 4 }, (_, i) => equippedActive[i]);
  const toggleSlots = Array.from({ length: 2 }, (_, i) => equippedToggle[i]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Kỹ năng
          {/* Skill Points Display */}
          <div className="flex items-center gap-1 ml-2">
            <Gem className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              {userStats?.availableSkillPoints || 0} SP
            </span>
          </div>
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSkillTreeOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Cây Kỹ Năng
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 lg:space-y-0">
        {/* Grid layout: 3 columns on PC, stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Passive Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-medium">Passive</span>
              <Badge variant="outline" className="text-xs">
                {slotsInfo?.passive.used || 0}/{slotsInfo?.passive.max || 3}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {passiveSlots.map((skill, index) => (
              <SkillSlot
                key={`passive-${index}`}
                skill={skill}
                slotType="passive"
                onEquip={() => handleOpenEquipModal('passive')}
                onUnequip={() => skill && handleUnequipSkill(skill.skillDefinition?.skillId || skill.skillDefinition?.id || '')}
              />
            ))}
          </div>
        </div>

        {/* Active Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Active</span>
              <Badge variant="outline" className="text-xs">
                {slotsInfo?.active.used || 0}/{slotsInfo?.active.max || 4}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeSlots.map((skill, index) => (
              <SkillSlot
                key={`active-${index}`}
                skill={skill}
                slotType="active"
                onEquip={() => handleOpenEquipModal('active')}
                onUnequip={() => skill && handleUnequipSkill(skill.skillDefinition?.skillId || skill.skillDefinition?.id || '')}
              />
            ))}
          </div>
        </div>

        {/* Toggle Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Toggle</span>
              <Badge variant="outline" className="text-xs">
                {slotsInfo?.toggle.used || 0}/{slotsInfo?.toggle.max || 2}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {toggleSlots.map((skill, index) => (
              <SkillSlot
                key={`toggle-${index}`}
                skill={skill}
                slotType="toggle"
                onEquip={() => handleOpenEquipModal('toggle')}
                onUnequip={() => skill && handleUnequipSkill(skill.skillDefinition?.skillId || skill.skillDefinition?.id || '')}
              />
            ))}
          </div>
        </div>
        </div>
      </CardContent>

      {/* Modals */}
      <SkillEquipModal
        open={equipModalOpen}
        onOpenChange={setEquipModalOpen}
        slotType={equipModalType}
        onEquip={handleEquipSkill}
      />

      <SkillTreeModal
        open={skillTreeOpen}
        onOpenChange={setSkillTreeOpen}
      />
    </Card>
  );
}
