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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus,
  Edit2,
  Trash2,
  Star,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';

interface PetDefinition {
  id: number;
  petId: string;
  name: string;
  rarity: number;
  maxEvolutionStage: number;
  images?: string[]; // Images uploaded for this pet
}

interface RequiredPet {
  rarity: number;
  quantity: number;
  allowSameSpecies?: boolean;
  specificPetIds?: string[];
}

interface PetEvolution {
  id: number;
  basePetId: number;
  evolutionStage: number;
  requiredLevel: number;
  requiredPets: RequiredPet[];
  statMultipliers: {
    strength: number;
    intelligence: number;
    dexterity: number;
    vitality: number;
    luck: number;
  };
  newImages: string[];
  evolutionDescription: string | null;
  evolutionName: string;
  newAbilities?: number[] | null;
}

interface PetAbility {
  id: number;
  name: string;
  description: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'utility'; // Backend uses 'type' not 'abilityType'
  targetType: 'enemy' | 'all_enemies' | 'ally' | 'all_allies' | 'self';
  isActive: boolean;
}

interface AdminPetEvolutionsProps {
  petDefinitions: PetDefinition[];
}

export default function AdminPetEvolutions({ petDefinitions }: AdminPetEvolutionsProps) {
  const [evolutions, setEvolutions] = useState<PetEvolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [editingEvolution, setEditingEvolution] = useState<PetEvolution | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [abilities, setAbilities] = useState<PetAbility[]>([]);

  const [evolutionForm, setEvolutionForm] = useState({
    petId: '',
    evolutionStage: 1,
    requiredLevel: 10,
    requiredPets: [
      { rarity: 3, quantity: 5, allowSameSpecies: false }
    ] as RequiredPet[],
    statMultipliers: {
      strength: 1.5,
      intelligence: 1.5,
      dexterity: 1.5,
      vitality: 1.5,
      luck: 1.5,
    },
    newImages: [] as string[],
    description: '',
    newAbilities: [] as number[],
  });

  // Get max evolution stage for selected pet (must be after evolutionForm useState)
  const selectedPet = petDefinitions.find(p => p.petId === (evolutionForm.petId || selectedPetId));
  const maxEvolutionStage = selectedPet?.maxEvolutionStage || 3;

  useEffect(() => {
    fetchAbilities();
  }, []);

  useEffect(() => {
    if (selectedPetId) {
      fetchEvolutionsForPet(selectedPetId);
    }
  }, [selectedPetId]);

  const fetchAbilities = async () => {
    try {
      const response = await adminApiEndpoints.getPetAbilities();
      setAbilities(response.data);
    } catch (error) {
      console.error('Error fetching abilities:', error);
      toast.error('Failed to fetch abilities');
    }
  };

  const fetchEvolutionsForPet = async (petId: string) => {
    try {
      setLoading(true);
      const response = await adminApiEndpoints.getPetEvolutions(petId);
      setEvolutions(response.data);
    } catch (error) {
      console.error('Error fetching evolutions:', error);
      toast.error('Failed to fetch evolutions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvolution = async () => {
    if (!evolutionForm.petId) {
      toast.error('Please select a pet');
      return;
    }
    
    if (evolutionForm.evolutionStage > maxEvolutionStage) {
      toast.error(`Evolution stage cannot exceed ${maxEvolutionStage}`);
      return;
    }

    try {
      setLoading(true);
      
      const createData = {
        ...evolutionForm,
        newImages: selectedImages, // Use selected images from multi-select
        requiredItems: [],
        newAbilities: evolutionForm.newAbilities.length > 0 ? evolutionForm.newAbilities : null,
      };
      
      await adminApiEndpoints.createPetEvolution(createData);
      
      toast.success('Evolution created successfully');
      fetchEvolutionsForPet(evolutionForm.petId);
      resetForm();
    } catch (error: unknown) {
      console.error('Error creating evolution:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create evolution');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvolution = async () => {
    if (!editingEvolution) return;
    
    try {
      setLoading(true);
      
      // Ensure newImages is array and requiredItems exists
      const updateData = {
        ...evolutionForm,
        newImages: selectedImages, // Use selected images from multi-select
        requiredItems: [],
        newAbilities: evolutionForm.newAbilities.length > 0 ? evolutionForm.newAbilities : null,
      };
      
      await adminApiEndpoints.updatePetEvolution(editingEvolution.id, updateData);
      
      toast.success('Evolution updated successfully');
      fetchEvolutionsForPet(evolutionForm.petId);
      setEditingEvolution(null);
      resetForm();
    } catch (error: unknown) {
      console.error('Error updating evolution:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update evolution');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvolution = async (id: number) => {
    if (!confirm('Are you sure you want to delete this evolution?')) return;

    try {
      setLoading(true);
      await adminApiEndpoints.deletePetEvolution(id);
      
      toast.success('Evolution deleted successfully');
      fetchEvolutionsForPet(selectedPetId);
    } catch (error) {
      console.error('Error deleting evolution:', error);
      toast.error('Failed to delete evolution');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEvolutionForm({
      petId: '',
      evolutionStage: 1,
      requiredLevel: 10,
      requiredPets: [
        { rarity: 3, quantity: 5, allowSameSpecies: false }
      ],
      statMultipliers: {
        strength: 1.5,
        intelligence: 1.5,
        dexterity: 1.5,
        vitality: 1.5,
        luck: 1.5,
      },
      newImages: [],
      description: '',
      newAbilities: [],
    });
    setSelectedImages([]);
  };

  const addRequiredPet = () => {
    setEvolutionForm({
      ...evolutionForm,
      requiredPets: [
        ...evolutionForm.requiredPets,
        { rarity: 3, quantity: 1, allowSameSpecies: false }
      ]
    });
  };

  const removeRequiredPet = (index: number) => {
    setEvolutionForm({
      ...evolutionForm,
      requiredPets: evolutionForm.requiredPets.filter((_, i) => i !== index)
    });
  };

  const updateRequiredPet = (index: number, field: keyof RequiredPet, value: number | boolean | string[] | undefined) => {
    const updated = [...evolutionForm.requiredPets];
    updated[index] = { ...updated[index], [field]: value };
    setEvolutionForm({ ...evolutionForm, requiredPets: updated });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingEvolution ? 'Edit Evolution Path' : 'Create Evolution Path'}
          </CardTitle>
          <CardDescription>
            Define evolution requirements and stat bonuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="selectPet">Select Pet</Label>
            <Select
              value={evolutionForm.petId}
              onValueChange={(value) => {
                setEvolutionForm({ ...evolutionForm, petId: value });
                setSelectedPetId(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a pet..." />
              </SelectTrigger>
              <SelectContent>
                {petDefinitions.map((pet) => (
                  <SelectItem key={pet.id} value={pet.petId}>
                    {pet.name} ({pet.petId}) - {pet.rarity}⭐
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="evolutionStage">Evolution Stage</Label>
              <Input
                id="evolutionStage"
                type="number"
                min="1"
                max={maxEvolutionStage}
                value={evolutionForm.evolutionStage}
                onChange={(e) => setEvolutionForm({ 
                  ...evolutionForm, 
                  evolutionStage: parseInt(e.target.value) || 1 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Max: {maxEvolutionStage} {!selectedPet && '(select a pet first)'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requiredLevel">Required Level</Label>
              <Input
                id="requiredLevel"
                type="number"
                min="1"
                value={evolutionForm.requiredLevel}
                onChange={(e) => setEvolutionForm({ 
                  ...evolutionForm, 
                  requiredLevel: parseInt(e.target.value) || 1 
                })}
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Required Pets for Sacrifice</Label>
              <Button size="sm" variant="outline" onClick={addRequiredPet}>
                <Plus className="h-3 w-3 mr-1" />
                Add Requirement
              </Button>
            </div>
            
            <div className="space-y-2">
              {evolutionForm.requiredPets.map((req, index) => (
                <Card key={index} className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs">Min Rarity</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={req.rarity}
                        onChange={(e) => updateRequiredPet(index, 'rarity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={req.quantity}
                        onChange={(e) => updateRequiredPet(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => removeRequiredPet(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={req.allowSameSpecies || false}
                      onCheckedChange={(checked) => updateRequiredPet(index, 'allowSameSpecies', checked)}
                    />
                    <Label className="text-xs">Allow same species</Label>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-base font-semibold">Stat Multipliers</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="grid gap-1">
                <Label className="text-xs flex items-center gap-1">
                  <span className="text-orange-500">STR</span> Strength
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={evolutionForm.statMultipliers.strength}
                  onChange={(e) => setEvolutionForm({
                    ...evolutionForm,
                    statMultipliers: { 
                      ...evolutionForm.statMultipliers, 
                      strength: parseFloat(e.target.value) || 1 
                    }
                  })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs flex items-center gap-1">
                  <span className="text-purple-500">INT</span> Intelligence
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={evolutionForm.statMultipliers.intelligence}
                  onChange={(e) => setEvolutionForm({
                    ...evolutionForm,
                    statMultipliers: { 
                      ...evolutionForm.statMultipliers, 
                      intelligence: parseFloat(e.target.value) || 1 
                    }
                  })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs flex items-center gap-1">
                  <span className="text-blue-500">DEX</span> Dexterity
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={evolutionForm.statMultipliers.dexterity}
                  onChange={(e) => setEvolutionForm({
                    ...evolutionForm,
                    statMultipliers: { 
                      ...evolutionForm.statMultipliers, 
                      dexterity: parseFloat(e.target.value) || 1 
                    }
                  })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs flex items-center gap-1">
                  <span className="text-red-500">VIT</span> Vitality
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={evolutionForm.statMultipliers.vitality}
                  onChange={(e) => setEvolutionForm({
                    ...evolutionForm,
                    statMultipliers: { 
                      ...evolutionForm.statMultipliers, 
                      vitality: parseFloat(e.target.value) || 1 
                    }
                  })}
                />
              </div>
              <div className="grid gap-1 col-span-2">
                <Label className="text-xs flex items-center gap-1">
                  <span className="text-yellow-500">LUK</span> Luck
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={evolutionForm.statMultipliers.luck}
                  onChange={(e) => setEvolutionForm({
                    ...evolutionForm,
                    statMultipliers: { 
                      ...evolutionForm.statMultipliers, 
                      luck: parseFloat(e.target.value) || 1 
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Image Selector from Pet Definition */}
          <div>
            <Label className="text-base font-semibold mb-2">Evolution Images</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Select images from the pet definition to use for this evolution stage
            </p>
            {selectedPet && selectedPet.id ? (
              <div className="grid grid-cols-3 gap-2">
                {petDefinitions.find(p => p.id === selectedPet.id)?.images?.map((imageUrl: string, idx: number) => (
                  <div 
                    key={idx}
                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      selectedImages.includes(imageUrl) 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedImages(prev => 
                        prev.includes(imageUrl) 
                          ? prev.filter(url => url !== imageUrl)
                          : [...prev, imageUrl]
                      );
                    }}
                  >
                    <img 
                      src={resolveAssetUrl(imageUrl)} 
                      alt={`Pet ${idx + 1}`} 
                      className="w-full h-20 object-contain"
                    />
                    {selectedImages.includes(imageUrl) && (
                      <Badge className="absolute top-1 right-1 text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
                {(!petDefinitions.find(p => p.id === selectedPet.id)?.images || 
                  petDefinitions.find(p => p.id === selectedPet.id)?.images?.length === 0) && (
                  <div className="col-span-3 text-center text-sm text-muted-foreground py-4">
                    No images uploaded yet. Upload images in the Pet Definitions tab first.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                Select a pet above to choose evolution images
              </div>
            )}
            {selectedImages.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedImages.length} image(s) selected
              </p>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-base font-semibold">New Abilities (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Select abilities that will be unlocked when pet evolves to this stage
            </p>
            
            {abilities.length === 0 ? (
              <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-muted-foreground">
                No abilities available. Create abilities in the Abilities tab first.
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-lg p-3">
                <div className="space-y-2">
                  {abilities.map((ability) => {
                    const isSelected = evolutionForm.newAbilities.includes(ability.id);
                    const abilityTypeIcons: Record<string, string> = {
                      attack: '⚔️',
                      heal: '💚',
                      buff: '✨',
                      debuff: '💀',
                      utility: '🔮',
                    };
                    
                    return (
                      <div
                        key={ability.id}
                        className="flex items-start space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          const newAbilities = isSelected
                            ? evolutionForm.newAbilities.filter(id => id !== ability.id)
                            : [...evolutionForm.newAbilities, ability.id];
                          setEvolutionForm({ ...evolutionForm, newAbilities });
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked: boolean) => {
                            const newAbilities = checked
                              ? [...evolutionForm.newAbilities, ability.id]
                              : evolutionForm.newAbilities.filter(id => id !== ability.id);
                            setEvolutionForm({ ...evolutionForm, newAbilities });
                          }}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span>{abilityTypeIcons[ability.type]}</span>
                            <span className="font-medium text-sm">{ability.name}</span>
                            {!ability.isActive && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ability.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Selected: {evolutionForm.newAbilities.length > 0 
                ? evolutionForm.newAbilities.map(id => abilities.find(a => a.id === id)?.name || `#${id}`).join(', ')
                : 'None'}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this evolution stage..."
              value={evolutionForm.description}
              onChange={(e) => setEvolutionForm({ ...evolutionForm, description: e.target.value })}
            />
          </div>

          <Button 
            onClick={editingEvolution ? handleUpdateEvolution : handleCreateEvolution}
            disabled={loading || !evolutionForm.petId}
            className="w-full"
          >
            {loading ? 'Processing...' : editingEvolution ? 'Update Evolution' : 'Create Evolution'}
          </Button>

          {editingEvolution && (
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingEvolution(null);
                resetForm();
              }}
              className="w-full"
            >
              Cancel Edit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Evolutions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Evolution Paths
          </CardTitle>
          <CardDescription>
            {selectedPetId ? `Evolutions for ${petDefinitions.find(p => p.petId === selectedPetId)?.name || selectedPetId}` : 'Select a pet to view evolutions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {evolutions.length === 0 && selectedPetId && (
                <div className="text-center py-8 text-muted-foreground">
                  No evolution paths defined for this pet yet.
                </div>
              )}
              
              {evolutions.length === 0 && !selectedPetId && (
                <div className="text-center py-8 text-muted-foreground">
                  Select a pet from the dropdown to manage its evolutions.
                </div>
              )}

              {evolutions.map((evolution) => (
                <Card key={evolution.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          Stage {evolution.evolutionStage}
                        </Badge>
                        <Badge variant="outline">
                          Level {evolution.requiredLevel}+
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEvolution(evolution);
                            setSelectedImages(evolution.newImages || []); // Pre-select existing images
                            setEvolutionForm({
                              petId: selectedPetId || '', // Use selectedPetId from state, always ensure it's a string
                              evolutionStage: evolution.evolutionStage || 1,
                              requiredLevel: evolution.requiredLevel || 10,
                              requiredPets: evolution.requiredPets || [
                                { rarity: 3, quantity: 5, allowSameSpecies: false }
                              ],
                              statMultipliers: evolution.statMultipliers || {
                                strength: 1.5,
                                intelligence: 1.5,
                                dexterity: 1.5,
                                vitality: 1.5,
                                luck: 1.5,
                              },
                              newImages: evolution.newImages || [],
                              description: evolution.evolutionDescription || '',
                              newAbilities: evolution.newAbilities || [],
                            });
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteEvolution(evolution.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {evolution.evolutionDescription && (
                      <p className="text-sm text-muted-foreground">{evolution.evolutionDescription}</p>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Required Sacrifices:</Label>
                      <div className="flex flex-wrap gap-2">
                        {evolution.requiredPets.map((req, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {req.quantity}x {req.rarity}⭐+ pets
                            {req.allowSameSpecies && ' (same species OK)'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Stat Boosts:</Label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-orange-500 font-bold">STR:</span> {evolution.statMultipliers.strength}x
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-purple-500 font-bold">INT:</span> {evolution.statMultipliers.intelligence}x
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500 font-bold">DEX:</span> {evolution.statMultipliers.dexterity}x
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-red-500 font-bold">VIT:</span> {evolution.statMultipliers.vitality}x
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 font-bold">LUK:</span> {evolution.statMultipliers.luck}x
                        </div>
                      </div>
                    </div>

                    {evolution.newAbilities && evolution.newAbilities.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">New Abilities Unlocked:</Label>
                        <div className="flex flex-wrap gap-1">
                          {evolution.newAbilities.map((abilityId, idx) => (
                            <Badge key={idx} variant="default" className="text-xs">
                              Ability #{abilityId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
