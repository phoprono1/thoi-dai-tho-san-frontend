'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Crown, Target, Sword, Shield, Users, Settings, ArrowRight, Dice6 } from 'lucide-react';
import RequirementsEditor from './RequirementsEditor';

interface CharacterClass {
  id: number;
  name: string;
  type: string;
  tier: number;
  requiredLevel: number;
}

interface ClassMapping {
  id: number;
  fromClassId: number;
  toClassId: number;
  levelRequired: number;
  weight?: number;
  allowPlayerChoice?: boolean;
  isAwakening?: boolean;
  requirements?: {
    stats?: {
      minStrength?: number;
      minIntelligence?: number;
      minDexterity?: number;
      minVitality?: number;
      minLuck?: number;
      minTotalStats?: number;
    };
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
    achievements?: Array<{
      achievementId: number;
      achievementName: string;
    }>;
    pvpRank?: {
      minRank?: number;
      minPoints?: number;
    };
    guildLevel?: number;
    playtime?: number;
  };
}

interface ClassMappingManagerProps {
  characterClasses: CharacterClass[];
}

export default function ClassMappingManager({ characterClasses }: ClassMappingManagerProps) {
  const [selectedFromClass, setSelectedFromClass] = useState<number | null>(null);
  const [editingMapping, setEditingMapping] = useState<ClassMapping | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    fromClassId: 0,
    toClassId: 0,
    levelRequired: 1,
    weight: 100,
    allowPlayerChoice: true,
    isAwakening: false,
  });

  const [requirements, setRequirements] = useState<any>({
    stats: {
      minTotalStats: 0,
    },
  });

  const queryClient = useQueryClient();

  // Fetch mappings for selected class
  const { data: mappings, isLoading } = useQuery({
    queryKey: ['classMappings', selectedFromClass],
    queryFn: async () => {
      if (!selectedFromClass) return [];
      const response = await adminApi.get(`/admin/character-class-mappings/${selectedFromClass}`);
      return response.data;
    },
    enabled: !!selectedFromClass,
  });

  // Create mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: (data: any) => 
      adminApi.post(`/admin/character-class-mappings/${data.fromClassId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classMappings'] });
      toast.success('Mapping created successfully');
      setShowCreateDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create mapping'),
  });

  // Update mapping mutation
  const updateMappingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.put(`/admin/character-class-mappings/${data.fromClassId}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classMappings'] });
      toast.success('Mapping updated successfully');
      setEditingMapping(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update mapping'),
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: ({ fromClassId, id }: { fromClassId: number; id: number }) =>
      adminApi.delete(`/admin/character-class-mappings/${fromClassId}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classMappings'] });
      toast.success('Mapping deleted successfully');
    },
    onError: () => toast.error('Failed to delete mapping'),
  });

  const resetForm = () => {
    setFormData({
      fromClassId: 0,
      toClassId: 0,
      levelRequired: 1,
      weight: 100,
      allowPlayerChoice: true,
      isAwakening: false,
    });
    setRequirements({
      stats: {
        minTotalStats: 0,
      },
    });
  };

  const handleCreateMapping = () => {
    const mappingData = {
      ...formData,
      fromClassId: selectedFromClass,
      requirements,
    };
    createMappingMutation.mutate(mappingData);
  };

  const handleEditMapping = () => {
    if (!editingMapping) return;
    
    const mappingData = {
      ...formData,
      requirements,
    };
    updateMappingMutation.mutate({
      id: editingMapping.id,
      data: mappingData
    });
  };

  const openEditDialog = (mapping: ClassMapping) => {
    setEditingMapping(mapping);
    setFormData({
      fromClassId: mapping.fromClassId,
      toClassId: mapping.toClassId,
      levelRequired: mapping.levelRequired,
      weight: mapping.weight || 100,
      allowPlayerChoice: mapping.allowPlayerChoice ?? true,
      isAwakening: mapping.isAwakening ?? false,
    });
    setRequirements(mapping.requirements || {
      stats: { minTotalStats: 0 }
    });
  };

  const getClassName = (classId: number) => {
    return characterClasses.find(c => c.id === classId)?.name || 'Unknown';
  };

  const MappingCard = ({ mapping }: { mapping: ClassMapping }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{getClassName(mapping.fromClassId)}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{getClassName(mapping.toClassId)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(mapping)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteMappingMutation.mutate({
                fromClassId: mapping.fromClassId,
                id: mapping.id
              })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Level {mapping.levelRequired}
          </div>
          <div className="flex items-center gap-2">
            <Dice6 className="h-4 w-4 text-green-500" />
            Weight: {mapping.weight || 100}
          </div>
          <div className="flex items-center gap-2">
            <Users className={`h-4 w-4 ${mapping.allowPlayerChoice ? 'text-green-500' : 'text-orange-500'}`} />
            {mapping.allowPlayerChoice ? 'Player Choice' : 'Hidden Class'}
          </div>
          <div className="flex items-center gap-2">
            <Crown className={`h-4 w-4 ${mapping.isAwakening ? 'text-yellow-500' : 'text-gray-400'}`} />
            {mapping.isAwakening ? 'Awakening' : 'Normal'}
          </div>
        </div>

        {/* Special badges */}
        <div className="flex gap-2 mt-3">
          {mapping.isAwakening && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              ⭐ Awakening Path
            </Badge>
          )}
          {!mapping.allowPlayerChoice && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              🔒 Hidden Class
            </Badge>
          )}
        </div>

        {mapping.requirements && (
          <div className="mt-3 pt-3 border-t">
            <Label className="text-xs text-muted-foreground">Requirements</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {mapping.requirements?.stats?.minTotalStats && (
                <Badge variant="outline">Total ≥ {mapping.requirements.stats.minTotalStats}</Badge>
              )}
              {mapping.requirements?.dungeons && mapping.requirements.dungeons.length > 0 && (
                <Badge variant="outline">Dungeons: {mapping.requirements.dungeons.length}</Badge>
              )}
              {mapping.requirements?.quests && mapping.requirements.quests.length > 0 && (
                <Badge variant="outline">Quests: {mapping.requirements.quests.length}</Badge>
              )}
              {mapping.requirements?.items && mapping.requirements.items.length > 0 && (
                <Badge variant="outline">Items: {mapping.requirements.items.length}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Source Class</CardTitle>
          <CardDescription>
            Choose a class to view and manage its advancement paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedFromClass?.toString() || ''}
            onValueChange={(value) => setSelectedFromClass(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a class..." />
            </SelectTrigger>
            <SelectContent>
              {characterClasses.map((characterClass) => (
                <SelectItem key={characterClass.id} value={characterClass.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tier {characterClass.tier}</Badge>
                    {characterClass.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Mappings List */}
      {selectedFromClass && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Advancement Paths from {getClassName(selectedFromClass)}</CardTitle>
                <CardDescription>
                  Configure how players can advance from this class
                </CardDescription>
              </div>
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, fromClassId: selectedFromClass }));
                setShowCreateDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Path
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading mappings...</div>
            ) : Array.isArray(mappings) && mappings.length > 0 ? (
              mappings.map((mapping: ClassMapping) => (
                <MappingCard key={mapping.id} mapping={mapping} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No advancement paths configured for this class
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Advancement Path</DialogTitle>
            <DialogDescription>
              Configure how players can advance from {selectedFromClass ? getClassName(selectedFromClass) : 'this class'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Class</Label>
                <Select
                  value={formData.toClassId.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, toClassId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {characterClasses
                      .filter(c => c.id !== selectedFromClass)
                      .map((characterClass) => (
                        <SelectItem key={characterClass.id} value={characterClass.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Tier {characterClass.tier}</Badge>
                            {characterClass.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Level Required</Label>
                <Input
                  type="number"
                  value={formData.levelRequired}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    levelRequired: parseInt(e.target.value) || 1 
                  }))}
                  min="1"
                />
              </div>

              <div>
                <Label>Weight (0-1000)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    weight: parseInt(e.target.value) || 100 
                  }))}
                  min="0"
                  max="1000"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Higher weight = higher chance when random selection
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowPlayerChoice"
                    checked={formData.allowPlayerChoice}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      allowPlayerChoice: checked 
                    }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="allowPlayerChoice">Allow Player Choice</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.allowPlayerChoice ? "Visible in class selection" : "Hidden - Random unlock only"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAwakening"
                    checked={formData.isAwakening}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isAwakening: checked 
                    }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isAwakening">Is Awakening Path</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.isAwakening ? "Requires completion of requirements" : "No requirements needed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Logic Explanation */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Class Logic Preview:</h4>
              <div className="text-sm space-y-1">
                {formData.allowPlayerChoice && !formData.isAwakening && (
                  <p className="text-green-700">✅ <strong>Basic Class:</strong> Visible in selection, no requirements needed</p>
                )}
                {formData.allowPlayerChoice && formData.isAwakening && (
                  <p className="text-blue-700">⭐ <strong>Choosable Awakening:</strong> Visible in selection, requires completing requirements to unlock</p>
                )}
                {!formData.allowPlayerChoice && !formData.isAwakening && (
                  <p className="text-orange-700">🔒 <strong>Hidden Class:</strong> Random unlock only, no requirements</p>
                )}
                {!formData.allowPlayerChoice && formData.isAwakening && (
                  <p className="text-purple-700">🌟 <strong>Secret Awakening:</strong> Random unlock first, then complete requirements to awaken</p>
                )}
              </div>
            </div>

            {/* Requirements Editor */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Requirements 
                {!formData.isAwakening && (
                  <span className="text-sm text-muted-foreground ml-2">(Will be ignored for non-awakening paths)</span>
                )}
              </h3>
              <RequirementsEditor
                requirements={requirements}
                onChange={setRequirements}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateMapping}>
              Create Path
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMapping} onOpenChange={(open) => {
        if (!open) {
          setEditingMapping(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Advancement Path</DialogTitle>
            <DialogDescription>
              Modify advancement path from {editingMapping ? getClassName(editingMapping.fromClassId) : ''} to {editingMapping ? getClassName(editingMapping.toClassId) : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Class</Label>
                <Select
                  value={formData.toClassId.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, toClassId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {characterClasses
                      .filter(c => c.id !== formData.fromClassId)
                      .map((characterClass) => (
                        <SelectItem key={characterClass.id} value={characterClass.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Tier {characterClass.tier}</Badge>
                            {characterClass.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Level Required</Label>
                <Input
                  type="number"
                  value={formData.levelRequired}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    levelRequired: parseInt(e.target.value) || 1 
                  }))}
                  min="1"
                />
              </div>

              <div>
                <Label>Weight (0-1000)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    weight: parseInt(e.target.value) || 100 
                  }))}
                  min="0"
                  max="1000"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Higher weight = higher chance when random selection
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editAllowPlayerChoice"
                    checked={formData.allowPlayerChoice}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      allowPlayerChoice: checked 
                    }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="editAllowPlayerChoice">Allow Player Choice</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.allowPlayerChoice ? "Visible in class selection" : "Hidden - Random unlock only"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="editIsAwakening"
                    checked={formData.isAwakening}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isAwakening: checked 
                    }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="editIsAwakening">Is Awakening Path</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.isAwakening ? "Requires completion of requirements" : "No requirements needed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Logic Explanation */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Class Logic Preview:</h4>
              <div className="text-sm space-y-1">
                {formData.allowPlayerChoice && !formData.isAwakening && (
                  <p className="text-green-700">✅ <strong>Basic Class:</strong> Visible in selection, no requirements needed</p>
                )}
                {formData.allowPlayerChoice && formData.isAwakening && (
                  <p className="text-blue-700">⭐ <strong>Choosable Awakening:</strong> Visible in selection, requires completing requirements to unlock</p>
                )}
                {!formData.allowPlayerChoice && !formData.isAwakening && (
                  <p className="text-orange-700">🔒 <strong>Hidden Class:</strong> Random unlock only, no requirements</p>
                )}
                {!formData.allowPlayerChoice && formData.isAwakening && (
                  <p className="text-purple-700">🌟 <strong>Secret Awakening:</strong> Random unlock first, then complete requirements to awaken</p>
                )}
              </div>
            </div>

            {/* Requirements Editor */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Requirements 
                {!formData.isAwakening && (
                  <span className="text-sm text-muted-foreground ml-2">(Will be ignored for non-awakening paths)</span>
                )}
              </h3>
              <RequirementsEditor
                requirements={requirements}
                onChange={setRequirements}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingMapping(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditMapping}>
              Update Path
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
