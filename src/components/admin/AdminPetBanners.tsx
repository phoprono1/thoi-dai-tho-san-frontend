'use client';

import React, { useState, useEffect } from 'react';
import { resolveAssetUrl } from '@/lib/asset';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/lib/admin-api';

interface PetDefinition {
  id: number;
  petId: string;
  name: string;
  rarity: number;
  element: string;
  isActive: boolean;
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
  pityThresholds?: Array<{ rarity: number; pullCount: number }>;
  startDate: string;
  endDate: string;
  isActive: boolean;
  bannerImage: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const BANNER_TYPES = [
  { value: 'standard', label: '🎲 Standard', description: 'Regular gacha banner', color: 'bg-gray-500' },
  { value: 'featured', label: '⭐ Featured', description: 'Featured pets with rate-up', color: 'bg-blue-500' },
  { value: 'limited', label: '💎 Limited', description: 'Time-limited exclusive pets', color: 'bg-purple-500' },
  { value: 'event', label: '🎉 Event', description: 'Special event banner', color: 'bg-yellow-500' },
];

const RARITIES = [
  { value: 1, label: '⭐ Common', color: 'bg-gray-500' },
  { value: 2, label: '⭐⭐ Uncommon', color: 'bg-green-500' },
  { value: 3, label: '⭐⭐⭐ Rare', color: 'bg-blue-500' },
  { value: 4, label: '⭐⭐⭐⭐ Epic', color: 'bg-purple-500' },
  { value: 5, label: '⭐⭐⭐⭐⭐ Legendary', color: 'bg-yellow-500' },
];

interface AdminPetBannersProps {
  petDefinitions: PetDefinition[];
}

export default function AdminPetBanners({ petDefinitions }: AdminPetBannersProps) {
  const [banners, setBanners] = useState<PetBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PetBanner | null>(null);

  // Banner Form State
  const [bannerForm, setBannerForm] = useState({
    name: '',
    description: '',
    bannerType: 'standard' as 'standard' | 'featured' | 'limited' | 'event',
    costPerPull: 100,
    guaranteedRarity: 4,
    guaranteedPullCount: 10,
  pityThresholds: [{ rarity: 4, pullCount: 10 }],
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

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminApiEndpoints.getPetBanners();
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = async () => {
    const { valid, errors, normalized } = validateBannerForm();
    if (!valid) {
      toast.error(errors.join('; '));
      return;
    }

    try {
      setLoading(true);

      // Convert local datetime to UTC ISO string for backend
      const bannerData = {
        ...bannerForm,
        pityThresholds: (normalized && normalized.length > 0)
          ? normalized
          : [{ rarity: bannerForm.guaranteedRarity, pullCount: bannerForm.guaranteedPullCount }],
        startDate: new Date(bannerForm.startDate).toISOString(),
        endDate: new Date(bannerForm.endDate).toISOString(),
      };

      await adminApiEndpoints.createPetBanner(bannerData);

      toast.success('Banner created successfully');
      fetchBanners();
      resetForm();
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create banner');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    const { valid, errors, normalized } = validateBannerForm();
    if (!valid) {
      toast.error(errors.join('; '));
      return;
    }

    try {
      setLoading(true);

      // Convert local datetime to UTC ISO string for backend
      const bannerData = {
        ...bannerForm,
        pityThresholds: (normalized && normalized.length > 0)
          ? normalized
          : [{ rarity: bannerForm.guaranteedRarity, pullCount: bannerForm.guaranteedPullCount }],
        startDate: new Date(bannerForm.startDate).toISOString(),
        endDate: new Date(bannerForm.endDate).toISOString(),
      };

      await adminApiEndpoints.updatePetBanner(editingBanner.id, bannerData);

      toast.success('Banner updated successfully');
      fetchBanners();
      setEditingBanner(null);
      resetForm();
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await adminApiEndpoints.deletePetBanner(id);
      
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, bannerId: number) => {
    try {
      const formData = new FormData();
      formData.append('banner', file);

      await adminApiEndpoints.uploadPetBannerImage(bannerId, formData);

      toast.success('Banner image uploaded successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error uploading banner image:', error);
      toast.error('Failed to upload banner image');
    }
  };

  const resetForm = () => {
    setBannerForm({
      name: '',
      description: '',
      bannerType: 'standard' as 'standard' | 'featured' | 'limited' | 'event',
      costPerPull: 100,
      guaranteedRarity: 4,
      guaranteedPullCount: 10,
  pityThresholds: [{ rarity: 4, pullCount: 10 }],
  featuredPets: [],
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
  };

  const addFeaturedPet = () => {
    setBannerForm({
      ...bannerForm,
      featuredPets: [...bannerForm.featuredPets, { petId: '', rateUpMultiplier: 2.0 }]
    });
  };

  const removeFeaturedPet = (index: number) => {
    setBannerForm({
      ...bannerForm,
      featuredPets: bannerForm.featuredPets.filter((_, i) => i !== index)
    });
  };

  const updateFeaturedPet = (index: number, petId: string, rateUpMultiplier: number) => {
    const updated = [...bannerForm.featuredPets];
    updated[index] = { petId, rateUpMultiplier };
    setBannerForm({
      ...bannerForm,
      featuredPets: updated
    });
  };

  const getBannerTypeInfo = (type: string) => {
    return BANNER_TYPES.find(bt => bt.value === type) || BANNER_TYPES[0];
  };

  const getRarityLabel = (rarity: number) => {
    const rarityInfo = RARITIES.find(r => r.value === rarity);
    return rarityInfo ? rarityInfo.label : `${rarity} Star`;
  };

  const isDateActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalDropRate = Object.values(bannerForm.dropRates).reduce((sum, rate) => sum + rate, 0);

  // Helper: normalize, dedupe and sort pity thresholds before sending to backend
  const normalizePityThresholds = (thresholds?: Array<{ rarity: number; pullCount: number }>) => {
    if (!thresholds || thresholds.length === 0) return [];

    // Map by rarity - keep smallest pullCount if duplicates provided
    const map = new Map<number, number>();
    thresholds.forEach(t => {
      const pull = Math.max(1, Math.floor(t.pullCount || 1));
      if (!map.has(t.rarity) || (map.get(t.rarity) || 0) > pull) {
        map.set(t.rarity, pull);
      }
    });

    const normalized = Array.from(map.entries()).map(([rarity, pullCount]) => ({ rarity, pullCount }));
    // Sort by rarity asc (lower -> higher) so backend sees deterministic order
    normalized.sort((a, b) => a.rarity - b.rarity);
    return normalized;
  };

  // Validation for the form
  const validateBannerForm = () => {
    const errors: string[] = [];

    if (!bannerForm.name || bannerForm.name.trim().length === 0) {
      errors.push('Banner name is required');
    }

    if (totalDropRate !== 1) {
      errors.push('Total drop rates must equal 100% (1.0)');
    }

    const normalized = normalizePityThresholds(bannerForm.pityThresholds);
    // Check duplicates after normalization (map removed duplicates)
    if (normalized.length === 0) {
      // fallback to guaranteed fields is allowed but ensure guaranteedPullCount >= 1
      if (!bannerForm.guaranteedPullCount || bannerForm.guaranteedPullCount < 1) {
        errors.push('Guaranteed pull count must be at least 1');
      }
    } else {
      for (const t of normalized) {
        if (!t.pullCount || t.pullCount < 1) {
          errors.push(`Pity threshold for ${t.rarity}⭐ must have pull count >= 1`);
        }
        if (!t.rarity || t.rarity < 1) {
          errors.push('Pity threshold must specify a valid rarity');
        }
      }
    }

    return { valid: errors.length === 0, errors, normalized };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pet Banner Management</h2>
          <p className="text-muted-foreground">
            Create and manage gacha banners with custom drop rates and featured pets
          </p>
        </div>
        <Button onClick={fetchBanners} variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Banners
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Banner Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </CardTitle>
            <CardDescription>
              {editingBanner ? 'Modify existing banner settings' : 'Set up a new gacha banner with custom rates'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bannerName">Banner Name</Label>
                <Input
                  id="bannerName"
                  placeholder="Fire Dragons Banner"
                  value={bannerForm.name}
                  onChange={(e) => setBannerForm({ ...bannerForm, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bannerDescription">Description</Label>
                <Textarea
                  id="bannerDescription"
                  placeholder="Featured fire element pets with increased rates..."
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bannerType">Banner Type</Label>
                  <Select
                    value={bannerForm.bannerType}
                    onValueChange={(value: 'standard' | 'featured' | 'limited' | 'event') => setBannerForm({ ...bannerForm, bannerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BANNER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="costPerPull">Cost Per Pull</Label>
                  <Input
                    id="costPerPull"
                    type="number"
                    value={bannerForm.costPerPull}
                    onChange={(e) => setBannerForm({ ...bannerForm, costPerPull: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pity System */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Pity System</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="guaranteedRarity">Guaranteed Rarity</Label>
                  <Select
                    value={bannerForm.guaranteedRarity.toString()}
                    onValueChange={(value) => setBannerForm({ ...bannerForm, guaranteedRarity: parseInt(value) })}
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
                  <Label htmlFor="guaranteedPullCount">Guaranteed Pull Count</Label>
                  <Input
                    id="guaranteedPullCount"
                    type="number"
                    value={bannerForm.guaranteedPullCount}
                    onChange={(e) => setBannerForm({ ...bannerForm, guaranteedPullCount: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium mb-2">Pity Thresholds</Label>
                <div className="space-y-2">
                  {(bannerForm.pityThresholds || []).map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={String(t.rarity)}
                        onValueChange={(value) => {
                          const updated = [...(bannerForm.pityThresholds || [])];
                          updated[idx] = { ...updated[idx], rarity: parseInt(value) };
                          setBannerForm({ ...bannerForm, pityThresholds: updated });
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RARITIES.map(r => (
                            <SelectItem key={r.value} value={r.value.toString()}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        className="w-32"
                        value={t.pullCount}
                        onChange={(e) => {
                          const updated = [...(bannerForm.pityThresholds || [])];
                          updated[idx] = { ...updated[idx], pullCount: parseInt(e.target.value) || 1 };
                          setBannerForm({ ...bannerForm, pityThresholds: updated });
                        }}
                      />

                      <Button size="sm" variant="destructive" onClick={() => {
                        const updated = (bannerForm.pityThresholds || []).filter((_, i) => i !== idx);
                        setBannerForm({ ...bannerForm, pityThresholds: updated });
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <Button size="sm" variant="outline" onClick={() => {
                    const updated = [...(bannerForm.pityThresholds || []), { rarity: 4, pullCount: 10 }];
                    setBannerForm({ ...bannerForm, pityThresholds: updated });
                  }}>
                    <Plus className="h-3 w-3 mr-1" /> Add Threshold
                  </Button>
                </div>
              </div>

              {/* Inline validation summary for pity/drop rates */}
              <div className="mt-2">
                {(() => {
                  const { valid, errors } = validateBannerForm();
                  if (valid) return null;
                  return (
                    <div className="p-2 rounded border border-red-200 bg-red-50 text-sm text-red-700">
                      <strong>Form issues:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </div>

            <Separator />

            {/* Drop Rates */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Drop Rates</Label>
              <div className="space-y-3">
                {RARITIES.map((rarity) => {
                  const key = `rarity${rarity.value}` as keyof typeof bannerForm.dropRates;
                  const rate = bannerForm.dropRates[key];
                  
                  return (
                    <div key={rarity.value} className="flex items-center gap-3">
                      <div className="w-20 text-sm">{rarity.label}</div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={rate}
                          onChange={(e) => setBannerForm({
                            ...bannerForm,
                            dropRates: {
                              ...bannerForm.dropRates,
                              [key]: parseFloat(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                      <div className="w-16 text-xs text-muted-foreground">
                        {(rate * 100).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className={totalDropRate === 1 ? 'text-green-600' : 'text-red-600'}>
                    {(totalDropRate * 100).toFixed(2)}%
                  </span>
                </div>
                {totalDropRate !== 1 && (
                  <p className="text-xs text-red-600">
                    Warning: Total drop rates should equal 100%
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Featured Pets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Featured Pets</Label>
                <Button size="sm" variant="outline" onClick={addFeaturedPet}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Pet
                </Button>
              </div>
              
              <div className="space-y-2">
                {bannerForm.featuredPets.map((featured, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <Select
                      value={featured.petId}
                      onValueChange={(value) => updateFeaturedPet(index, value, featured.rateUpMultiplier)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {petDefinitions.map((pet) => (
                          <SelectItem key={pet.petId} value={pet.petId}>
                            {pet.name} ({getRarityLabel(pet.rarity)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="Rate multiplier"
                      className="w-24"
                      value={featured.rateUpMultiplier}
                      onChange={(e) => updateFeaturedPet(index, featured.petId, parseFloat(e.target.value) || 1)}
                    />
                    
                    <Button size="sm" variant="destructive" onClick={() => removeFeaturedPet(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {bannerForm.featuredPets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No featured pets. Add pets to give them rate-up bonuses.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Schedule</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={bannerForm.startDate}
                    onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={bannerForm.endDate}
                    onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={bannerForm.isActive}
                onCheckedChange={(checked) => setBannerForm({ ...bannerForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Banner</Label>
            </div>

            <Button 
              onClick={editingBanner ? handleUpdateBanner : handleCreateBanner}
              disabled={loading || !bannerForm.name || !validateBannerForm().valid}
              className="w-full"
            >
              {loading ? 'Processing...' : editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>

            {editingBanner && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingBanner(null);
                  resetForm();
                }}
                className="w-full"
              >
                Cancel Edit
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Banners List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Existing Banners
            </CardTitle>
            <CardDescription>
              Manage and monitor your gacha banners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[800px]">
              <div className="space-y-4">
                {banners.map((banner) => {
                  const typeInfo = getBannerTypeInfo(banner.bannerType);
                  const isCurrentlyActive = isDateActive(banner.startDate, banner.endDate);
                  
                  return (
                    <div
                      key={banner.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{banner.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={`${typeInfo.color} text-white`}
                            >
                              {typeInfo.label}
                            </Badge>
                            {banner.isActive && (
                              <Badge variant="secondary">
                                {isCurrentlyActive ? '🟢 Live' : '🟡 Scheduled'}
                              </Badge>
                            )}
                            {!banner.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{banner.description}</p>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingBanner(banner);
                              
                              // Convert UTC ISO strings to local datetime format for datetime-local input
                              // Format: "YYYY-MM-DDTHH:mm" (without timezone)
                              const formatForInput = (isoString: string) => {
                                const date = new Date(isoString);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return `${year}-${month}-${day}T${hours}:${minutes}`;
                              };
                              
                              setBannerForm({
                                name: banner.name,
                                description: banner.description,
                                bannerType: banner.bannerType,
                                costPerPull: banner.costPerPull,
                                guaranteedRarity: banner.guaranteedRarity,
                                guaranteedPullCount: banner.guaranteedPullCount,
                                                        featuredPets: banner.featuredPets,
                                dropRates: banner.dropRates,
                                startDate: formatForInput(banner.startDate),
                                endDate: formatForInput(banner.endDate),
                                isActive: banner.isActive,
                                sortOrder: banner.sortOrder,
                                                        // Use existing pityThresholds if present, otherwise create from legacy fields
                                                        pityThresholds: normalizePityThresholds(
                                                          banner.pityThresholds && banner.pityThresholds.length > 0
                                                            ? banner.pityThresholds
                                                            : [{ rarity: banner.guaranteedRarity, pullCount: banner.guaranteedPullCount }]
                                                        ),
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
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Banner Image</DialogTitle>
                                <DialogDescription>
                                  Upload a banner image for {banner.name}. Recommended size: 800x400px
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file, banner.id);
                                    }
                                  }}
                                />
                                {banner.bannerImage && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Current Banner:</p>
                                    <img
                                      src={resolveAssetUrl(banner.bannerImage)}
                                      alt={banner.name}
                                      className="w-full h-32 object-cover rounded border"
                                    />
                                  </div>
                                )}
                                {!banner.bannerImage && (
                                  <div className="h-32 border-2 border-dashed border-muted rounded flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                      <p className="text-sm">No banner image uploaded</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteBanner(banner.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Banner Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Cost: {banner.costPerPull} gold</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>Pity: {banner.guaranteedPullCount} pulls</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>Guaranteed: {getRarityLabel(banner.guaranteedRarity)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Featured: {banner.featuredPets.length} pets</span>
                          </div>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Start: {formatDate(banner.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>End: {formatDate(banner.endDate)}</span>
                        </div>
                      </div>

                      {/* Featured Pets */}
                      {banner.featuredPets.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Featured Pets:</p>
                          <div className="flex flex-wrap gap-1">
                            {banner.featuredPets.map((featured, index) => {
                              const pet = petDefinitions.find(p => p.petId === featured.petId);
                              return (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pet?.name || featured.petId} ({featured.rateUpMultiplier}x)
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Drop Rate Summary */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Drop Rates:</p>
                        <div className="flex gap-2 text-xs">
                          {Object.entries(banner.dropRates).map(([key, rate]) => {
                            const rarity = parseInt(key.replace('rarity', ''));
                            return (
                              <span key={key} className="text-muted-foreground">
                                {rarity}⭐: {(rate * 100).toFixed(1)}%
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {banners.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No banners found. Create your first gacha banner!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}