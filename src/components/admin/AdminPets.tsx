'use client';

import React, { useState, useEffect } from 'react';
import AdminPetBanners from './AdminPetBanners';
import AdminPetEvolutions from './AdminPetEvolutions';
import AdminPetUpgradeMaterials from './AdminPetUpgradeMaterials';
import AdminPetAbilities from './AdminPetAbilities';
import PetImageManager from './PetImageManager';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  Edit2,
  Trash2,
  Upload,
  Star,
  Shield,
  Sword,
  Heart,
  Target,
  Sparkles,
  Eye,
  Download,
  BarChart3,
  Package,
  Gamepad2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';

interface PetImage {
  id: number;
  imageUrl: string;
  imageType: 'evolution' | 'event' | 'variant' | 'base';
  evolutionStage?: number;
  skinName?: string;
  isDefault: boolean;
  sortOrder: number;
}

interface PetDefinition {
  id: number;
  petId: string;
  name: string;
  description: string;
  rarity: number;
  element: string;
  baseStats: {
    strength: number;
    intelligence: number;
    dexterity: number;
    vitality: number;
    luck: number;
  };
  images: string[]; // Deprecated - will be replaced with petImages
  petImages?: PetImage[]; // New structured format
  maxLevel: number;
  maxEvolutionStage: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PetBanner {
  id: number;
  name: string;
  description: string;
  bannerType: 'standard' | 'featured' | 'limited' | 'event';
  costPerPull: number;
  guaranteedRarity: number;
  guaranteedPullCount: number;
  featuredPets: Array<{
    petId: string;
    rateUpMultiplier: number;
  }>;
  dropRates: {
    rarity1: number;
    rarity2: number;
    rarity3: number;
    rarity4: number;
    rarity5: number;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  bannerImage: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const ELEMENTS = [
  { value: 'fire', label: '🔥 Fire', color: 'bg-red-500' },
  { value: 'water', label: '💧 Water', color: 'bg-blue-500' },
  { value: 'earth', label: '🌍 Earth', color: 'bg-green-500' },
  { value: 'air', label: '💨 Air', color: 'bg-cyan-500' },
  { value: 'light', label: '✨ Light', color: 'bg-yellow-500' },
  { value: 'dark', label: '🌑 Dark', color: 'bg-purple-500' },
  { value: 'neutral', label: '⚪ Neutral', color: 'bg-gray-500' },
];

const RARITIES = [
  { value: 1, label: '⭐ Common', color: 'bg-gray-500' },
  { value: 2, label: '⭐⭐ Uncommon', color: 'bg-green-500' },
  { value: 3, label: '⭐⭐⭐ Rare', color: 'bg-blue-500' },
  { value: 4, label: '⭐⭐⭐⭐ Epic', color: 'bg-purple-500' },
  { value: 5, label: '⭐⭐⭐⭐⭐ Legendary', color: 'bg-yellow-500' },
];

export default function AdminPets() {
  const [activeTab, setActiveTab] = useState('definitions');
  const [petDefinitions, setPetDefinitions] = useState<PetDefinition[]>([]);
  const [petBanners, setPetBanners] = useState<PetBanner[]>([]);
  const [loading, setLoading] = useState(false);

  // Pet Definition Form State
  const [definitionForm, setDefinitionForm] = useState({
    petId: '',
    name: '',
    description: '',
    rarity: 1,
    element: 'neutral',
    baseStats: {
      strength: 50,
      intelligence: 30,
      dexterity: 10,
      vitality: 50,
      luck: 10,
    },
    maxLevel: 10,
    maxEvolutionStage: 3,
    isActive: true,
    sortOrder: 0,
  });

  // Banner Form State will be implemented later
  /*
  const [bannerForm, setBannerForm] = useState({
    name: '',
    description: '',
    bannerType: 'standard' as const,
    costPerPull: 100,
    guaranteedRarity: 4,
    guaranteedPullCount: 10,
    featuredPets: [] as Array<{ petId: string; rateUpMultiplier: number }>,
    dropRates: {
      rarity1: 0.50,
      rarity2: 0.30,
      rarity3: 0.15,
      rarity4: 0.04,
      rarity5: 0.01,
    },
    startDate: '',
    endDate: '',
    isActive: true,
    sortOrder: 0,
  });
  */

  const [editingDefinition, setEditingDefinition] = useState<PetDefinition | null>(null);

  // Fetch Data
  useEffect(() => {
    fetchPetDefinitions();
    fetchPetBanners();
  }, []);

  const fetchPetDefinitions = async () => {
    try {
      setLoading(true);
      const response = await adminApiEndpoints.getPetDefinitions();
      setPetDefinitions(response.data);
    } catch (error) {
      console.error('Error fetching pet definitions:', error);
      toast.error('Failed to fetch pet definitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPetBanners = async () => {
    try {
      const response = await adminApiEndpoints.getPetBanners();
      setPetBanners(response.data);
    } catch (error) {
      console.error('Error fetching pet banners:', error);
      toast.error('Failed to fetch pet banners');
    }
  };

  // Pet Definition Handlers
  const handleCreateDefinition = async () => {
    try {
      setLoading(true);
      await adminApiEndpoints.createPetDefinition(definitionForm);
      
      toast.success('Pet definition created successfully');
      fetchPetDefinitions();
      setDefinitionForm({
        petId: '',
        name: '',
        description: '',
        rarity: 1,
        element: 'neutral',
        baseStats: {
          strength: 50,
          intelligence: 30,
          dexterity: 10,
          vitality: 50,
          luck: 10,
        },
        maxLevel: 10,
        maxEvolutionStage: 3,
        isActive: true,
        sortOrder: 0,
      });
    } catch (error) {
      console.error('Error creating pet definition:', error);
      toast.error('Failed to create pet definition');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDefinition = async () => {
    if (!editingDefinition) return;
    
    try {
      setLoading(true);
      await adminApiEndpoints.updatePetDefinition(editingDefinition.id, definitionForm);
      
      toast.success('Pet definition updated successfully');
      fetchPetDefinitions();
      setEditingDefinition(null);
    } catch (error) {
      console.error('Error updating pet definition:', error);
      toast.error('Failed to update pet definition');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDefinition = async (id: number) => {
    try {
      setLoading(true);
      await adminApiEndpoints.deletePetDefinition(id);
      
      toast.success('Pet definition deleted successfully');
      fetchPetDefinitions();
    } catch (error) {
      console.error('Error deleting pet definition:', error);
      toast.error('Failed to delete pet definition');
    } finally {
      setLoading(false);
    }
  };

  const getRarityDisplay = (rarity: number) => {
    const rarityInfo = RARITIES.find(r => r.value === rarity);
    return rarityInfo ? rarityInfo.label : `${rarity} Star`;
  };

  const getElementDisplay = (element: string) => {
    const elementInfo = ELEMENTS.find(e => e.value === element);
    return elementInfo ? elementInfo.label : element;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pet Management</h1>
          <p className="text-muted-foreground">
            Manage pet definitions, gacha banners, and equipment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPetDefinitions}>
            <Download className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="definitions" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Pet Definitions
          </TabsTrigger>
          <TabsTrigger value="evolutions" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Evolutions
          </TabsTrigger>
          <TabsTrigger value="abilities" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Abilities
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Gacha Banners
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Upgrade Materials
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Pet Definitions Tab */}
        <TabsContent value="definitions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingDefinition ? 'Edit Pet Definition' : 'Create Pet Definition'}
                </CardTitle>
                <CardDescription>
                  {editingDefinition ? 'Modify existing pet definition' : 'Add a new pet to the collection'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="petId">Pet ID</Label>
                  <Input
                    id="petId"
                    placeholder="fire_dragon"
                    value={definitionForm.petId}
                    onChange={(e) => setDefinitionForm({ ...definitionForm, petId: e.target.value })}
                    readOnly={!editingDefinition}
                    className={!editingDefinition ? 'bg-muted cursor-not-allowed' : ''}
                  />
                  {!editingDefinition && (
                    <p className="text-xs text-muted-foreground">Auto-generated from Pet Name</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="petName">Pet Name</Label>
                  <Input
                    id="petName"
                    placeholder="Fire Dragon"
                    value={definitionForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      // Auto-generate petId from name: "Fire Dragon" -> "fire_dragon"
                      const generatedPetId = name
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
                        .trim()
                        .replace(/\s+/g, '_'); // Replace spaces with underscore
                      setDefinitionForm({ 
                        ...definitionForm, 
                        name,
                        petId: editingDefinition ? definitionForm.petId : generatedPetId // Only auto-generate for new pets
                      });
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A mighty dragon that breathes fire..."
                    value={definitionForm.description}
                    onChange={(e) => setDefinitionForm({ ...definitionForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rarity">Rarity</Label>
                    <Select
                      value={definitionForm.rarity.toString()}
                      onValueChange={(value) => setDefinitionForm({ ...definitionForm, rarity: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RARITIES.map((rarity) => (
                          <SelectItem key={rarity.value} value={rarity.value.toString()}>
                            {rarity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="element">Element</Label>
                    <Select
                      value={definitionForm.element}
                      onValueChange={(value) => setDefinitionForm({ ...definitionForm, element: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ELEMENTS.map((element) => (
                          <SelectItem key={element.value} value={element.value}>
                            {element.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">Base Stats (5 Core Stats System)</Label>
                  <p className="text-xs text-muted-foreground mb-3">Combat stats (ATK, DEF, HP, Crit) will be calculated from these core stats</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="strength" className="flex items-center gap-1">
                        <Sword className="h-3 w-3 text-orange-500" />
                        Strength (STR)
                      </Label>
                      <Input
                        id="strength"
                        type="number"
                        placeholder="50"
                        value={definitionForm.baseStats.strength}
                        onChange={(e) => setDefinitionForm({
                          ...definitionForm,
                          baseStats: { ...definitionForm.baseStats, strength: parseInt(e.target.value) || 0 }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">Affects physical damage, lifesteal, armor pen</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="intelligence" className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        Intelligence (INT)
                      </Label>
                      <Input
                        id="intelligence"
                        type="number"
                        placeholder="30"
                        value={definitionForm.baseStats.intelligence}
                        onChange={(e) => setDefinitionForm({
                          ...definitionForm,
                          baseStats: { ...definitionForm.baseStats, intelligence: parseInt(e.target.value) || 0 }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">Affects magic damage, attack power</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="dexterity" className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-blue-500" />
                        Dexterity (DEX)
                      </Label>
                      <Input
                        id="dexterity"
                        type="number"
                        placeholder="10"
                        value={definitionForm.baseStats.dexterity}
                        onChange={(e) => setDefinitionForm({
                          ...definitionForm,
                          baseStats: { ...definitionForm.baseStats, dexterity: parseInt(e.target.value) || 0 }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">Affects accuracy, evasion, attack</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="vitality" className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        Vitality (VIT)
                      </Label>
                      <Input
                        id="vitality"
                        type="number"
                        placeholder="50"
                        value={definitionForm.baseStats.vitality}
                        onChange={(e) => setDefinitionForm({
                          ...definitionForm,
                          baseStats: { ...definitionForm.baseStats, vitality: parseInt(e.target.value) || 0 }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">Affects max HP, defense</p>
                    </div>

                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="luck" className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Luck (LUK)
                      </Label>
                      <Input
                        id="luck"
                        type="number"
                        placeholder="10"
                        value={definitionForm.baseStats.luck}
                        onChange={(e) => setDefinitionForm({
                          ...definitionForm,
                          baseStats: { ...definitionForm.baseStats, luck: parseInt(e.target.value) || 0 }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">Affects crit rate, crit damage</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxLevel">Max Level</Label>
                    <Input
                      id="maxLevel"
                      type="number"
                      value={definitionForm.maxLevel}
                      onChange={(e) => setDefinitionForm({ ...definitionForm, maxLevel: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxEvolution">Max Evolution Stage</Label>
                    <Input
                      id="maxEvolution"
                      type="number"
                      value={definitionForm.maxEvolutionStage}
                      onChange={(e) => setDefinitionForm({ ...definitionForm, maxEvolutionStage: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={definitionForm.isActive}
                    onCheckedChange={(checked) => setDefinitionForm({ ...definitionForm, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <Button 
                  onClick={editingDefinition ? handleUpdateDefinition : handleCreateDefinition}
                  disabled={loading || !definitionForm.petId || !definitionForm.name}
                  className="w-full"
                >
                  {loading ? 'Processing...' : editingDefinition ? 'Update Pet Definition' : 'Create Pet Definition'}
                </Button>

                {editingDefinition && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingDefinition(null);
                      setDefinitionForm({
                        petId: '',
                        name: '',
                        description: '',
                        rarity: 1,
                        element: 'neutral',
                        baseStats: {
                          strength: 50,
                          intelligence: 30,
                          dexterity: 10,
                          vitality: 50,
                          luck: 10,
                        },
                        maxLevel: 10,
                        maxEvolutionStage: 3,
                        isActive: true,
                        sortOrder: 0,
                      });
                    }}
                    className="w-full"
                  >
                    Cancel Edit
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Pet Definitions List
                </CardTitle>
                <CardDescription>
                  Manage existing pet definitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {petDefinitions.map((pet) => (
                      <div
                        key={pet.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{pet.name}</h4>
                            <Badge variant="outline">{getRarityDisplay(pet.rarity)}</Badge>
                            <Badge variant="secondary">{getElementDisplay(pet.element)}</Badge>
                            {!pet.isActive && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {pet.petId}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>STR: {pet.baseStats.strength}</span>
                            <span>INT: {pet.baseStats.intelligence}</span>
                            <span>DEX: {pet.baseStats.dexterity}</span>
                            <span>VIT: {pet.baseStats.vitality}</span>
                            <span>LUK: {pet.baseStats.luck}</span>
                          </div>
                          {pet.images.length > 0 && (
                            <p className="text-xs text-green-600">{pet.images.length} image(s) uploaded</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDefinition(pet);
                              setDefinitionForm({
                                petId: pet.petId,
                                name: pet.name,
                                description: pet.description,
                                rarity: pet.rarity,
                                element: pet.element,
                                baseStats: pet.baseStats,
                                maxLevel: pet.maxLevel,
                                maxEvolutionStage: pet.maxEvolutionStage,
                                isActive: pet.isActive,
                                sortOrder: pet.sortOrder,
                              });
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Upload className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Manage Pet Images</DialogTitle>
                                <DialogDescription>
                                  Organize images by evolution stages, event skins, and variants
                                </DialogDescription>
                              </DialogHeader>
                              <PetImageManager
                                petId={pet.id}
                                petName={pet.name}
                                maxEvolutionStage={pet.maxEvolutionStage}
                                images={pet.images}
                                petImages={pet.petImages}
                                onImageUploaded={fetchPetDefinitions}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${pet.name}"? This action cannot be undone.`)) {
                                handleDeleteDefinition(pet.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {petDefinitions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No pet definitions found. Create your first pet!
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pet Evolutions Tab */}
        <TabsContent value="evolutions" className="space-y-4">
          <AdminPetEvolutions petDefinitions={petDefinitions} />
        </TabsContent>

        {/* Pet Abilities Tab */}
        <TabsContent value="abilities" className="space-y-4">
          <AdminPetAbilities />
        </TabsContent>

        {/* Pet Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <AdminPetBanners petDefinitions={petDefinitions} />
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎀 Trang bị Pet - Hệ thống mới
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Hệ thống trang bị pet đã được tích hợp vào hệ thống Item chung
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📦 Hệ thống trang bị pet mới
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Trang bị pet giờ đây được quản lý trong tab <strong>Items</strong> với các loại sau:
                </p>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-center gap-2">
                    <span className="text-lg">🎀</span>
                    <span><strong>Vòng cổ Pet</strong> - Tăng HP và Defense</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <span><strong>Áo giáp Pet</strong> - Tăng Defense và Magic Defense</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">💍</span>
                    <span><strong>Phụ kiện Pet</strong> - Tăng Accuracy và Evasion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">⚔️</span>
                    <span><strong>Vũ khí Pet</strong> - Tăng Attack và Critical Rate</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✨ Lợi ích của hệ thống mới
                </h3>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <li>✅ Trang bị pet có thể rơi từ quái vật (monster drops)</li>
                  <li>✅ Có thể kiếm từ dungeons và quests</li>
                  <li>✅ Xuất hiện trong gacha boxes</li>
                  <li>✅ Có thể chế tạo (crafting recipes)</li>
                  <li>✅ Giao dịch được trên chợ (market system)</li>
                  <li>✅ Quản lý tập trung cùng items thường</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Để tạo trang bị pet, hãy chuyển sang tab <strong>Items</strong> và chọn loại trang bị pet tương ứng.
                </p>
                <Button 
                  onClick={() => {
                    // Switch to items tab - you may need to adjust this based on your routing
                    const itemsTab = document.querySelector('[value="items"]') as HTMLElement;
                    if (itemsTab) itemsTab.click();
                  }}
                  className="w-fit"
                >
                  📦 Chuyển đến tab Items
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upgrade Materials Tab */}
        <TabsContent value="upgrades" className="space-y-4">
          <AdminPetUpgradeMaterials petDefinitions={petDefinitions} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pets</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{petDefinitions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active definitions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Banners</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{petBanners.filter(b => b.isActive).length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pet Equipment</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-blue-600">New System</div>
                <p className="text-xs text-muted-foreground">
                  Managed in Items tab
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rare+ Pets</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {petDefinitions.filter(p => p.rarity >= 3).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  3+ star rarity
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pet Rarity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RARITIES.map((rarity) => {
                  const count = petDefinitions.filter(p => p.rarity === rarity.value).length;
                  const percentage = petDefinitions.length > 0 ? (count / petDefinitions.length) * 100 : 0;
                  
                  return (
                    <div key={rarity.value} className="flex items-center gap-4">
                      <div className="w-24 text-sm">{rarity.label}</div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${rarity.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-20 text-sm text-right">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


    </div>
  );
}