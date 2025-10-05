'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  Trash2,
  Star,
  Package,
  Upload,
  X,
} from 'lucide-react';
import { adminApiEndpoints } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';
import { toast } from 'sonner';

// Simplified interface matching backend response
interface PetEquipment {
  id: number;
  name: string;
  slot: 'collar' | 'armor' | 'accessory' | 'weapon';
  rarity: number;
  statBoosts: Array<{
    stat: string;
    value: number;
    isPercentage: boolean;
  }>;
  setBonus: Record<string, unknown> | null;
  compatibleElements: string[];
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

const EQUIPMENT_SLOTS = [
  { value: 'collar', label: '🔗 Collar', icon: '🔗' },
  { value: 'armor', label: '🛡️ Armor', icon: '🛡️' },
  { value: 'accessory', label: '💍 Accessory', icon: '💍' },
  { value: 'weapon', label: '⚔️ Weapon', icon: '⚔️' },
];

const RARITY_LEVELS = [
  { value: 1, label: 'Common', color: 'gray', emoji: '⚪' },
  { value: 2, label: 'Uncommon', color: 'green', emoji: '🟢' },
  { value: 3, label: 'Rare', color: 'blue', emoji: '🔵' },
  { value: 4, label: 'Epic', color: 'purple', emoji: '🟣' },
  { value: 5, label: 'Legendary', color: 'yellow', emoji: '🟡' },
];

const STAT_TYPES = [
  { value: 'hp', label: '❤️ HP', description: 'Health Points' },
  { value: 'attack', label: '⚔️ Attack', description: 'Attack Power' },
  { value: 'defense', label: '🛡️ Defense', description: 'Defense Power' },
  { value: 'speed', label: '💨 Speed', description: 'Movement Speed' },
  { value: 'mana', label: '🔮 Mana', description: 'Magic Points' },
  { value: 'critRate', label: '🎯 Crit Rate', description: 'Critical Hit Rate' },
  { value: 'critDamage', label: '💥 Crit Damage', description: 'Critical Damage' },
];

const ELEMENTS = [
  { value: 'fire', label: '🔥 Fire' },
  { value: 'water', label: '💧 Water' },
  { value: 'earth', label: '🌍 Earth' },
  { value: 'air', label: '💨 Air' },
  { value: 'light', label: '✨ Light' },
  { value: 'dark', label: '🌑 Dark' },
  { value: 'neutral', label: '⚪ Neutral' },
];

export default function AdminPetEquipmentSimple() {
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<PetEquipment[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    slot: 'collar' as 'collar' | 'armor' | 'accessory' | 'weapon',
    rarity: 1,
    statBoosts: [{ stat: 'hp', value: 10, isPercentage: false }],
    compatibleElements: [] as string[],
    setBonus: null as Record<string, any> | null,
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await adminApiEndpoints.getPetEquipment();
      // Backend returns { data: PetEquipment[], pagination: {...} }
      setEquipment(response.data.data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to fetch equipment');
      setEquipment([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEquipmentForm({
      name: '',
      slot: 'collar',
      rarity: 1,
      statBoosts: [{ stat: 'hp', value: 10, isPercentage: false }],
      compatibleElements: [],
      setBonus: null,
    });
    setSelectedImage(null);
  };

  const handleCreateEquipment = async () => {
    try {
      setLoading(true);
      const response = await adminApiEndpoints.createPetEquipment(equipmentForm);
      
      // Upload image if selected
      if (selectedImage && response.data?.id) {
        await handleImageUpload(selectedImage, response.data.id);
      }
      
      toast.success('Equipment created successfully');
      fetchEquipment();
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
      toast.error('Failed to create equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, equipmentId: number) => {
    try {
      const formData = new FormData();
      formData.append('icon', file);

      const response = await adminApiEndpoints.uploadPetEquipmentImage(equipmentId, formData);
      
      toast.success('Image uploaded successfully');
      fetchEquipment();
      return response;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      throw error;
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      setLoading(true);
      await adminApiEndpoints.deletePetEquipment(id);
      
      toast.success('Equipment deleted successfully');
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error('Failed to delete equipment');
    } finally {
      setLoading(false);
    }
  };

  const getSlotInfo = (slot: string) => {
    return EQUIPMENT_SLOTS.find(s => s.value === slot) || EQUIPMENT_SLOTS[0];
  };

  const getRarityInfo = (rarity: number) => {
    return RARITY_LEVELS.find(r => r.value === rarity) || RARITY_LEVELS[0];
  };

  return (
    <div className="space-y-6">
      {/* Create Equipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Equipment
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Pet Equipment</DialogTitle>
            <DialogDescription>
              Add new equipment for pets
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name</Label>
              <Input
                id="name"
                placeholder="Enter equipment name"
                value={equipmentForm.name}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot">Equipment Slot</Label>
                <Select value={equipmentForm.slot} onValueChange={(value: 'collar' | 'armor' | 'accessory' | 'weapon') => setEquipmentForm({ ...equipmentForm, slot: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rarity">Rarity Level</Label>
                <Select value={equipmentForm.rarity.toString()} onValueChange={(value) => setEquipmentForm({ ...equipmentForm, rarity: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITY_LEVELS.map((rarity) => (
                      <SelectItem key={rarity.value} value={rarity.value.toString()}>
                        {rarity.emoji} {rarity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Stat Boosts Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Stat Boosts</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEquipmentForm({
                    ...equipmentForm,
                    statBoosts: [...equipmentForm.statBoosts, { stat: 'hp', value: 10, isPercentage: false }]
                  })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Stat
                </Button>
              </div>

              {equipmentForm.statBoosts.map((boost, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Stat Type</Label>
                    <Select 
                      value={boost.stat} 
                      onValueChange={(value) => {
                        const newBoosts = [...equipmentForm.statBoosts];
                        newBoosts[index].stat = value;
                        setEquipmentForm({ ...equipmentForm, statBoosts: newBoosts });
                      }}
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

                  <div className="w-24">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={boost.value}
                      onChange={(e) => {
                        const newBoosts = [...equipmentForm.statBoosts];
                        newBoosts[index].value = parseInt(e.target.value) || 0;
                        setEquipmentForm({ ...equipmentForm, statBoosts: newBoosts });
                      }}
                    />
                  </div>

                  <div className="w-20">
                    <Label>Type</Label>
                    <Select 
                      value={boost.isPercentage ? 'percent' : 'flat'} 
                      onValueChange={(value) => {
                        const newBoosts = [...equipmentForm.statBoosts];
                        newBoosts[index].isPercentage = value === 'percent';
                        setEquipmentForm({ ...equipmentForm, statBoosts: newBoosts });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {equipmentForm.statBoosts.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const newBoosts = equipmentForm.statBoosts.filter((_, i) => i !== index);
                        setEquipmentForm({ ...equipmentForm, statBoosts: newBoosts });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Compatible Elements */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Compatible Elements</Label>
              <div className="grid grid-cols-2 gap-2">
                {ELEMENTS.map((element) => (
                  <div key={element.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={element.value}
                      checked={equipmentForm.compatibleElements.includes(element.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEquipmentForm({
                            ...equipmentForm,
                            compatibleElements: [...equipmentForm.compatibleElements, element.value]
                          });
                        } else {
                          setEquipmentForm({
                            ...equipmentForm,
                            compatibleElements: equipmentForm.compatibleElements.filter(el => el !== element.value)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={element.value} className="text-sm">
                      {element.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Equipment Image</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedImage(file);
                  }
                }}
                className="cursor-pointer"
              />
              {selectedImage && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Image selected: {selectedImage.name}
                </div>
              )}
            </div>

            <Button 
              onClick={handleCreateEquipment} 
              disabled={loading || !equipmentForm.name.trim()}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Equipment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment List
          </CardTitle>
          <CardDescription>
            Manage existing pet equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-muted-foreground">Loading equipment...</div>
                </div>
              ) : equipment.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-muted-foreground">No equipment found</div>
                </div>
              ) : (
                equipment.map((item) => {
                  const slotInfo = getSlotInfo(item.slot);
                  const rarityInfo = getRarityInfo(item.rarity);
                  
                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {/* Equipment Image */}
                          <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img
                                src={resolveAssetUrl(item.image) || ''}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">{slotInfo.icon}</span>
                            )}
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              <Badge variant="secondary">
                                {slotInfo.label}
                              </Badge>
                              <Badge variant="outline" style={{ color: rarityInfo.color }}>
                                {rarityInfo.emoji} {rarityInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEquipment(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Stat Boosts */}
                      {item.statBoosts && item.statBoosts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Stat Boosts
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {item.statBoosts.map((boost, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {boost.stat.toUpperCase()}: +{boost.value}{boost.isPercentage ? '%' : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compatible Elements */}
                      {item.compatibleElements && item.compatibleElements.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Compatible Elements</h4>
                          <div className="flex flex-wrap gap-1">
                            {item.compatibleElements.map((element, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}