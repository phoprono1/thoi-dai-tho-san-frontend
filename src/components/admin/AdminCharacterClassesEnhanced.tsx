'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints, adminApi } from '@/lib/admin-api';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Wand2, 
  Settings, 
  Users, 
  Target,
  BookOpen,
  Zap,
  Crown,
  Sword,
  Shield,
  Heart,
  Star,
  Eye
} from 'lucide-react';
import { CLASS_TYPES, CLASS_TIERS, CLASS_TYPE_NAMES, TIER_NAMES, getTierColor, getDefaultStatSuggestions } from '@/lib/character-class-constants';
import ClassMappingManager from './ClassMappingManager';

interface CharacterClass {
  id: number;
  name: string;
  description: string;
  type: string;
  tier: number;
  requiredLevel: number;
  statBonuses: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    vitality?: number;
    luck?: number;
  };
  skillUnlocks: Array<{
    skillId: number;
    skillName: string;
    description: string;
  }>;
  advancementRequirements?: {
    dungeons?: Array<{
      dungeonId: number;
      dungeonName: string;
      requiredCompletions: number;
    }>;
    quests?: Array<{
      questId: number;
      questName: string;
    }>;
    items?: Array<{
      itemId: number;
      itemName: string;
      quantity: number;
    }>;
    stats?: {
      minStrength?: number;
      minIntelligence?: number;
      minDexterity?: number;
      minVitality?: number;
      minLuck?: number;
      minTotalStats?: number;
    };
    achievements?: Array<{
      achievementId: number;
      achievementName?: string;
    }>;
    pvpRank?: {
      minRank?: number;
      minPoints?: number;
    };
    guildLevel?: number;
    playtime?: number;
  };
  metadata?: {
    displayName?: string;
    description?: string;
    playstyle?: string;
    difficulty?: string;
    tags?: Array<string>;
    notes?: string;
    customData?: Record<string, any>;
  };
  previousClassId?: number;
  createdAt: string;
  updatedAt: string;
}

// ClassMapping interface moved to ClassMappingManager component

export default function AdminCharacterClassesEnhanced() {
  const [activeTab, setActiveTab] = useState('classes');
  const [editingClass, setEditingClass] = useState<CharacterClass | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'warrior',
    tier: 1,
    requiredLevel: 1,
    strength: 0,
    intelligence: 0,
    dexterity: 0,
    vitality: 0,
    luck: 0,
  });

  const queryClient = useQueryClient();

  // Fetch character classes
  const { data: characterClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['adminCharacterClasses'],
    queryFn: async () => {
      const response = await adminApiEndpoints.getCharacterClasses();
      return response.data;
    },
  });

  // Class mappings are handled in ClassMappingManager component
  // No need to fetch all mappings here

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: any) => adminApiEndpoints.createCharacterClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharacterClasses'] });
      toast.success('Class created successfully');
      setShowCreateDialog(false);
      setEditingClass(null);
      resetForm();
    },
    onError: () => toast.error('Failed to create class'),
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApiEndpoints.updateCharacterClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharacterClasses'] });
      toast.success('Class updated successfully');
      setShowCreateDialog(false);
      setEditingClass(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update class'),
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => adminApiEndpoints.deleteCharacterClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharacterClasses'] });
      toast.success('Class deleted successfully');
    },
    onError: () => toast.error('Failed to delete class'),
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'warrior',
      tier: 1,
      requiredLevel: 1,
      strength: 0,
      intelligence: 0,
      dexterity: 0,
      vitality: 0,
      luck: 0,
    });
    setEditingClass(null);
  };

  // Handle form submission
  const handleSubmit = () => {
    const classData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      tier: formData.tier,
      requiredLevel: formData.requiredLevel,
      statBonuses: {
        strength: formData.strength,
        intelligence: formData.intelligence,
        dexterity: formData.dexterity,
        vitality: formData.vitality,
        luck: formData.luck,
      },
      skillUnlocks: [],
      metadata: {
        displayName: formData.name,
        playstyle: 'Custom',
        difficulty: 'Medium',
        tags: [formData.type, `tier-${formData.tier}`],
        notes: editingClass ? 'Updated via admin panel' : 'Created via admin panel',
      },
    };

    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, data: classData });
    } else {
      createClassMutation.mutate(classData);
    }
  };

  // Load class data for editing
  const handleEdit = (characterClass: CharacterClass) => {
    setFormData({
      name: characterClass.name,
      description: characterClass.description,
      type: characterClass.type,
      tier: characterClass.tier,
      requiredLevel: characterClass.requiredLevel,
      strength: characterClass.statBonuses.strength || 0,
      intelligence: characterClass.statBonuses.intelligence || 0,
      dexterity: characterClass.statBonuses.dexterity || 0,
      vitality: characterClass.statBonuses.vitality || 0,
      luck: characterClass.statBonuses.luck || 0,
    });
    setEditingClass(characterClass);
    setShowCreateDialog(true);
  };

  // Generate class template
  const generateTemplate = (type: string, tier: number) => {
    const baseBonus = tier * 2;
    const suggestions = getDefaultStatSuggestions(type);
    
    return {
      name: `${CLASS_TYPE_NAMES[type as keyof typeof CLASS_TYPE_NAMES]} Tier ${tier}`,
      description: `A tier ${tier} ${type} class with balanced stats`,
      type,
      tier,
      requiredLevel: getTierLevelRequirement(tier),
      statBonuses: {
        strength: baseBonus,
        intelligence: baseBonus,
        dexterity: baseBonus,
        vitality: baseBonus,
        luck: baseBonus,
      },
      skillUnlocks: [],
      advancementRequirements: tier > 1 ? {
        stats: {
          minTotalStats: tier * 50,
        },
      } : undefined,
      metadata: {
        displayName: `${CLASS_TYPE_NAMES[type as keyof typeof CLASS_TYPE_NAMES]} Tier ${tier}`,
        playstyle: 'Balanced',
        difficulty: 'Medium',
        tags: [type, `tier-${tier}`],
        notes: 'Generated from template - customize as needed',
      },
    };
  };

  const getTierLevelRequirement = (tier: number): number => {
    const requirements = [1, 10, 25, 50, 75, 100, 125, 150, 175, 200];
    return requirements[tier - 1] || 1;
  };

  const getClassIcon = (type: string) => {
    const icons = {
      warrior: Sword,
      mage: Zap,
      archer: Target,
      assassin: Eye,
      priest: Heart,
      knight: Shield,
      tank: Shield,
      healer: Heart,
      summoner: Users,
      necromancer: BookOpen,
    };
    return icons[type as keyof typeof icons] || Star;
  };

  const ClassCard = ({ characterClass }: { characterClass: CharacterClass }) => {
    const Icon = getClassIcon(characterClass.type);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <CardTitle className="text-lg">{characterClass.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={getTierColor(characterClass.tier)}>
                Tier {characterClass.tier}
              </Badge>
              <Badge variant="outline">
                {CLASS_TYPE_NAMES[characterClass.type as keyof typeof CLASS_TYPE_NAMES]}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-sm">
            Level {characterClass.requiredLevel}+ • {characterClass.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stat Bonuses */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Stat Bonuses
            </h4>
            <div className="grid grid-cols-5 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium text-red-600">STR</div>
                <div>{characterClass.statBonuses.strength || 0}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">INT</div>
                <div>{characterClass.statBonuses.intelligence || 0}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">DEX</div>
                <div>{characterClass.statBonuses.dexterity || 0}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">VIT</div>
                <div>{characterClass.statBonuses.vitality || 0}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">LUK</div>
                <div>{characterClass.statBonuses.luck || 0}</div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {characterClass.advancementRequirements && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Requirements
              </h4>
              <div className="text-sm text-muted-foreground">
                {characterClass.advancementRequirements?.stats?.minTotalStats && (
                  <div>Min Total Stats: {characterClass.advancementRequirements.stats.minTotalStats}</div>
                )}
                {characterClass.advancementRequirements?.dungeons && characterClass.advancementRequirements.dungeons.length > 0 && (
                  <div>Dungeons: {characterClass.advancementRequirements.dungeons.length}</div>
                )}
                {characterClass.advancementRequirements?.quests && characterClass.advancementRequirements.quests.length > 0 && (
                  <div>Quests: {characterClass.advancementRequirements.quests.length}</div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {characterClass.metadata && (
            <div>
              <h4 className="font-medium mb-2">Metadata</h4>
              <div className="flex flex-wrap gap-1">
                {characterClass.metadata.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(characterClass)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const template = generateTemplate(characterClass.type, characterClass.tier);
                createClassMutation.mutate({
                  ...template,
                  name: `${characterClass.name} Copy`,
                });
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Clone
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this class?')) {
                  deleteClassMutation.mutate(characterClass.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const QuickCreateTemplates = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {Object.entries(CLASS_TYPES).map(([key, type]) => (
        <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="mb-2">
              {React.createElement(getClassIcon(type), { className: "h-8 w-8 mx-auto" })}
            </div>
            <h3 className="font-medium mb-2">{CLASS_TYPE_NAMES[type as keyof typeof CLASS_TYPE_NAMES]}</h3>
            <Select onValueChange={(tier) => {
              const template = generateTemplate(type, parseInt(tier));
              createClassMutation.mutate(template);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Create Tier..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((tier) => (
                  <SelectItem key={tier} value={tier.toString()}>
                    Tier {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Character Classes</h1>
          <p className="text-muted-foreground">
            Manage character classes, advancement paths, and requirements
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="mappings">Advancement Paths</TabsTrigger>
          <TabsTrigger value="templates">Quick Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-6">
          {classesLoading ? (
            <div>Loading classes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characterClasses?.map((characterClass: CharacterClass) => (
                <ClassCard key={characterClass.id} characterClass={characterClass} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          <ClassMappingManager characterClasses={characterClasses || []} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Class Templates</CardTitle>
              <CardDescription>
                Create classes quickly using predefined templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickCreateTemplates />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingClass(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? 'Edit Character Class' : 'Create Character Class'}
            </DialogTitle>
            <DialogDescription>
              Configure the character class properties and stat bonuses
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter class name"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLASS_TYPES).map(([key, type]) => (
                    <SelectItem key={type} value={type}>
                      {CLASS_TYPE_NAMES[type as keyof typeof CLASS_TYPE_NAMES]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tier</Label>
              <Select 
                value={formData.tier.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tier: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((tier) => (
                    <SelectItem key={tier} value={tier.toString()}>
                      Tier {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Required Level</Label>
              <Input
                type="number"
                value={formData.requiredLevel}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  requiredLevel: parseInt(e.target.value) || 1 
                }))}
                min="1"
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter class description"
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <h4 className="font-medium mb-3">Stat Bonuses</h4>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label className="text-sm">Strength</Label>
                  <Input
                    type="number"
                    value={formData.strength}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      strength: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-sm">Intelligence</Label>
                  <Input
                    type="number"
                    value={formData.intelligence}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      intelligence: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-sm">Dexterity</Label>
                  <Input
                    type="number"
                    value={formData.dexterity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dexterity: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-sm">Vitality</Label>
                  <Input
                    type="number"
                    value={formData.vitality}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      vitality: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-sm">Luck</Label>
                  <Input
                    type="number"
                    value={formData.luck}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      luck: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingClass(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingClass ? 'Update' : 'Create'} Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
