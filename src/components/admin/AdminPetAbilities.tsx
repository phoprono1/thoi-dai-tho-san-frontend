'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Shield,
  Heart,
  Swords,
  Star,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/lib/admin-api';

interface PetAbility {
  id: number;
  name: string;
  description: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'utility'; // Backend uses 'type' not 'abilityType'
  targetType: 'enemy' | 'all_enemies' | 'ally' | 'all_allies' | 'self';
  cooldown: number;
  manaCost: number;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  effects: { // Backend stores all effects in this object
    scaling?: {
      strength?: number;
      intelligence?: number;
      dexterity?: number;
    };
    damageMultiplier?: number; // Backend uses this instead of basePower at root level
    damageType?: 'physical' | 'magic' | 'true';
    statType?: string;
    statValue?: number;
    duration?: number;
    healType?: string;
    [key: string]: string | number | undefined | object;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ABILITY_TYPES = [
  { value: 'attack', label: '⚔️ Attack', icon: Swords, color: 'text-red-500', description: 'Deal damage to enemies' },
  { value: 'heal', label: '💚 Heal', icon: Heart, color: 'text-green-500', description: 'Restore HP to allies' },
  { value: 'buff', label: '✨ Buff', icon: Sparkles, color: 'text-blue-500', description: 'Boost ally stats' },
  { value: 'debuff', label: '💀 Debuff', icon: Shield, color: 'text-purple-500', description: 'Reduce enemy stats' },
  { value: 'utility', label: '🔮 Utility', icon: Star, color: 'text-yellow-500', description: 'Special effects' },
];

const TARGET_TYPES = [
  { value: 'enemy', label: '🎯 Single Enemy' },
  { value: 'all_enemies', label: '💥 All Enemies' },
  { value: 'ally', label: '👥 Single Ally' },
  { value: 'all_allies', label: '🛡️ All Allies' },
  { value: 'self', label: '🐾 Self' },
];

const STAT_TYPES = [
  { value: 'attack', label: 'Attack' },
  { value: 'defense', label: 'Defense' },
  { value: 'critRate', label: 'Crit Rate' },
  { value: 'critDamage', label: 'Crit Damage' },
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'evasion', label: 'Evasion' },
];

export default function AdminPetAbilities() {
  const [abilities, setAbilities] = useState<PetAbility[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAbility, setEditingAbility] = useState<PetAbility | null>(null);

  const [abilityForm, setAbilityForm] = useState({
    name: '',
    description: '',
    abilityType: 'attack' as 'attack' | 'heal' | 'buff' | 'debuff' | 'utility',
    targetType: 'enemy' as 'enemy' | 'all_enemies' | 'ally' | 'all_allies' | 'self',
    cooldown: 3,
    manaCost: 20,
    basePower: 100,
    scaling: {
      strength: 0,
      intelligence: 0,
      dexterity: 0,
    },
    effects: {
      statType: 'attack',
      statValue: 10,
      duration: 3,
      damageType: 'physical',
      healType: 'percentage',
    },
    isActive: true,
  });

  useEffect(() => {
    fetchAbilities();
  }, []);

  const fetchAbilities = async () => {
    try {
      setLoading(true);
      const response = await adminApiEndpoints.getPetAbilities();
      setAbilities(response.data);
    } catch (error) {
      console.error('Error fetching pet abilities:', error);
      toast.error('Failed to fetch pet abilities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAbility = async () => {
    try {
      setLoading(true);
      
      // Map frontend form to backend entity structure
      const createData = {
        name: abilityForm.name,
        type: abilityForm.abilityType, // Map abilityType → type
        description: abilityForm.description,
        targetType: abilityForm.targetType,
        cooldown: abilityForm.cooldown,
        manaCost: abilityForm.manaCost,
        isActive: abilityForm.isActive,
        effects: {
          // Include scaling in effects
          scaling: abilityForm.scaling,
          // Include basePower as damageMultiplier
          damageMultiplier: abilityForm.basePower / 100, // Convert to multiplier
          // Include type-specific effects
          ...abilityForm.effects,
        },
      };
      
      await adminApiEndpoints.createPetAbility(createData);
      
      toast.success('Pet ability created successfully');
      fetchAbilities();
      resetForm();
    } catch (error: unknown) {
      console.error('Error creating pet ability:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create pet ability');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAbility = async () => {
    if (!editingAbility) return;
    
    try {
      setLoading(true);
      
      // Map frontend form to backend entity structure
      const updateData = {
        name: abilityForm.name,
        type: abilityForm.abilityType, // Map abilityType → type
        description: abilityForm.description,
        targetType: abilityForm.targetType,
        cooldown: abilityForm.cooldown,
        manaCost: abilityForm.manaCost,
        isActive: abilityForm.isActive,
        effects: {
          // Include scaling in effects
          scaling: abilityForm.scaling,
          // Include basePower as damageMultiplier
          damageMultiplier: abilityForm.basePower / 100, // Convert to multiplier
          // Include type-specific effects
          ...abilityForm.effects,
        },
      };
      
      await adminApiEndpoints.updatePetAbility(editingAbility.id, updateData);
      
      toast.success('Pet ability updated successfully');
      fetchAbilities();
      setEditingAbility(null);
      resetForm();
    } catch (error: unknown) {
      console.error('Error updating pet ability:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update pet ability');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAbility = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ability?')) return;

    try {
      setLoading(true);
      await adminApiEndpoints.deletePetAbility(id);
      
      toast.success('Pet ability deleted successfully');
      fetchAbilities();
    } catch (error) {
      console.error('Error deleting pet ability:', error);
      toast.error('Failed to delete pet ability');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAbilityForm({
      name: '',
      description: '',
      abilityType: 'attack',
      targetType: 'enemy',
      cooldown: 3,
      manaCost: 20,
      basePower: 100,
      scaling: {
        strength: 0,
        intelligence: 0,
        dexterity: 0,
      },
      effects: {
        statType: 'attack',
        statValue: 10,
        duration: 3,
        damageType: 'physical',
        healType: 'percentage',
      },
      isActive: true,
    });
    setEditingAbility(null);
  };

  const getAbilityTypeInfo = (type: string) => {
    return ABILITY_TYPES.find(t => t.value === type) || ABILITY_TYPES[0];
  };

  const getTargetTypeLabel = (type: string) => {
    return TARGET_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingAbility ? 'Edit Pet Ability' : 'Create Pet Ability'}
          </CardTitle>
          <CardDescription>
            Define pet abilities for combat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="abilityName">Ability Name</Label>
            <Input
              id="abilityName"
              placeholder="Fire Breath"
              value={abilityForm.name}
              onChange={(e) => setAbilityForm({ ...abilityForm, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Breathes fire on enemies, dealing massive damage..."
              value={abilityForm.description}
              onChange={(e) => setAbilityForm({ ...abilityForm, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="abilityType">Ability Type</Label>
              <Select
                value={abilityForm.abilityType}
                onValueChange={(value) => setAbilityForm({ ...abilityForm, abilityType: value as 'attack' | 'heal' | 'buff' | 'debuff' | 'utility' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ABILITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={abilityForm.targetType}
                onValueChange={(value) => setAbilityForm({ ...abilityForm, targetType: value as PetAbility['targetType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.map((target) => (
                    <SelectItem key={target.value} value={target.value}>
                      {target.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cooldown">Cooldown (turns)</Label>
              <Input
                id="cooldown"
                type="number"
                min="0"
                value={abilityForm.cooldown}
                onChange={(e) => setAbilityForm({ ...abilityForm, cooldown: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manaCost">Mana Cost</Label>
              <Input
                id="manaCost"
                type="number"
                min="0"
                value={abilityForm.manaCost}
                onChange={(e) => setAbilityForm({ ...abilityForm, manaCost: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="basePower">Base Power</Label>
              <Input
                id="basePower"
                type="number"
                min="0"
                value={abilityForm.basePower}
                onChange={(e) => setAbilityForm({ ...abilityForm, basePower: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-base font-semibold">Stat Scaling</Label>
            <p className="text-xs text-muted-foreground mb-2">How much each stat affects the ability</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label className="text-xs text-orange-500">Strength</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={abilityForm.scaling.strength}
                  onChange={(e) => setAbilityForm({
                    ...abilityForm,
                    scaling: { ...abilityForm.scaling, strength: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-purple-500">Intelligence</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={abilityForm.scaling.intelligence}
                  onChange={(e) => setAbilityForm({
                    ...abilityForm,
                    scaling: { ...abilityForm.scaling, intelligence: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-blue-500">Dexterity</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={abilityForm.scaling.dexterity}
                  onChange={(e) => setAbilityForm({
                    ...abilityForm,
                    scaling: { ...abilityForm.scaling, dexterity: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Type-specific Effects */}
          <div>
            <Label className="text-base font-semibold">Ability Effects</Label>
            <p className="text-xs text-muted-foreground mb-3">Configure effects based on ability type</p>
            
            {(abilityForm.abilityType === 'attack' || abilityForm.abilityType === 'heal') && (
              <div className="space-y-3">
                {abilityForm.abilityType === 'attack' && (
                  <div className="grid gap-2">
                    <Label className="text-xs">Damage Type</Label>
                    <Select
                      value={abilityForm.effects.damageType}
                      onValueChange={(value) => setAbilityForm({
                        ...abilityForm,
                        effects: { ...abilityForm.effects, damageType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="magical">Magical</SelectItem>
                        <SelectItem value="true">True Damage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {abilityForm.abilityType === 'heal' && (
                  <div className="grid gap-2">
                    <Label className="text-xs">Heal Type</Label>
                    <Select
                      value={abilityForm.effects.healType}
                      onValueChange={(value) => setAbilityForm({
                        ...abilityForm,
                        effects: { ...abilityForm.effects, healType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat Amount</SelectItem>
                        <SelectItem value="percentage">Percentage of Max HP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {(abilityForm.abilityType === 'buff' || abilityForm.abilityType === 'debuff') && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-xs">Stat to Modify</Label>
                    <Select
                      value={abilityForm.effects.statType}
                      onValueChange={(value) => setAbilityForm({
                        ...abilityForm,
                        effects: { ...abilityForm.effects, statType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAT_TYPES.map((stat) => (
                          <SelectItem key={stat.value} value={stat.value}>
                            {stat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="number"
                      value={abilityForm.effects.statValue}
                      onChange={(e) => setAbilityForm({
                        ...abilityForm,
                        effects: { ...abilityForm.effects, statValue: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Duration (turns)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={abilityForm.effects.duration}
                    onChange={(e) => setAbilityForm({
                      ...abilityForm,
                      effects: { ...abilityForm.effects, duration: parseInt(e.target.value) || 1 }
                    })}
                  />
                </div>
              </div>
            )}

            {abilityForm.abilityType === 'utility' && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Utility abilities have special effects defined in code (cleanse, shield, etc.)
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={abilityForm.isActive}
              onCheckedChange={(checked) => setAbilityForm({ ...abilityForm, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <Button 
            onClick={editingAbility ? handleUpdateAbility : handleCreateAbility}
            disabled={loading || !abilityForm.name}
            className="w-full"
          >
            {loading ? 'Processing...' : editingAbility ? 'Update Ability' : 'Create Ability'}
          </Button>

          {editingAbility && (
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="w-full"
            >
              Cancel Edit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Abilities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pet Abilities List
          </CardTitle>
          <CardDescription>
            Manage existing pet abilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px]">
            <div className="space-y-3">
              {abilities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No pet abilities created yet.
                </div>
              )}

              {abilities.map((ability) => {
                const typeInfo = getAbilityTypeInfo(ability.type);
                const IconComponent = typeInfo.icon;
                
                return (
                  <Card key={ability.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent className={`h-4 w-4 ${typeInfo.color}`} />
                            <h3 className="font-semibold">{ability.name}</h3>
                            {!ability.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{ability.description}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAbility(ability);
                              // Map backend structure to frontend form structure
                              setAbilityForm({
                                name: ability.name,
                                description: ability.description,
                                abilityType: ability.type, // Backend uses 'type', not 'abilityType'
                                targetType: ability.targetType,
                                cooldown: ability.cooldown,
                                manaCost: ability.manaCost,
                                // Extract basePower from effects.damageMultiplier
                                basePower: (ability.effects?.damageMultiplier || 1) * 100,
                                // Extract scaling from effects
                                scaling: {
                                  strength: ability.effects?.scaling?.strength ?? 0,
                                  intelligence: ability.effects?.scaling?.intelligence ?? 0,
                                  dexterity: ability.effects?.scaling?.dexterity ?? 0,
                                },
                                effects: {
                                  statType: ability.effects?.statType ?? 'attack',
                                  statValue: ability.effects?.statValue ?? 10,
                                  duration: ability.effects?.duration ?? 3,
                                  damageType: ability.effects?.damageType ?? 'physical',
                                  healType: ability.effects?.healType ?? 'percentage',
                                },
                                isActive: ability.isActive,
                              });
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteAbility(ability.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{typeInfo.label}</Badge>
                        <Badge variant="outline">{getTargetTypeLabel(ability.targetType)}</Badge>
                        <Badge variant="secondary">CD: {ability.cooldown}t</Badge>
                        <Badge variant="secondary">Mana: {ability.manaCost}</Badge>
                        <Badge variant="secondary">Power: {(ability.effects?.damageMultiplier || 1) * 100}</Badge>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex gap-3">
                          {(ability.effects?.scaling?.strength ?? 0) > 0 && (
                            <span className="text-orange-500">STR: {ability.effects?.scaling?.strength}x</span>
                          )}
                          {(ability.effects?.scaling?.intelligence ?? 0) > 0 && (
                            <span className="text-purple-500">INT: {ability.effects?.scaling?.intelligence}x</span>
                          )}
                          {(ability.effects?.scaling?.dexterity ?? 0) > 0 && (
                            <span className="text-blue-500">DEX: {ability.effects?.scaling?.dexterity}x</span>
                          )}
                        </div>
                      </div>

                      {ability.effects && Object.keys(ability.effects).length > 0 && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <strong>Effects:</strong>{' '}
                          {JSON.stringify(ability.effects)}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
