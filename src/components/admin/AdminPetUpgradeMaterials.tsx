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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/lib/admin-api';
import {
  getUpgradeMaterialsForPet,
  createUpgradeMaterial,
  updateUpgradeMaterial,
  deleteUpgradeMaterial,
  type UpgradeMaterial,
  type CreateUpgradeMaterialDto,
} from '@/lib/pet-upgrade-api';

interface PetDefinition {
  id: number;
  petId: string;
  name: string;
  rarity: number;
  maxEvolutionStage: number;
  images?: string[];
}

interface Item {
  id: number;
  name: string;
  type: string;
  rarity: number;
}

interface AdminPetUpgradeMaterialsProps {
  petDefinitions: PetDefinition[];
}

interface UpgradeFormState {
  petDefinitionId: number;
  level: number;
  materialItemId: number | null; // Nullable for gold-only upgrades
  quantity: number | null; // Nullable for gold-only upgrades
  goldCost: number;
  statIncrease: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    critDamage?: number;
  };
}

export default function AdminPetUpgradeMaterials({ petDefinitions }: AdminPetUpgradeMaterialsProps) {
  const [materials, setMaterials] = useState<UpgradeMaterial[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<UpgradeMaterial | null>(null);

  const [formState, setFormState] = useState<UpgradeFormState>({
    petDefinitionId: 0,
    level: 2,
    materialItemId: null,
    quantity: null,
    goldCost: 100,
    statIncrease: {},
  });

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Load materials when pet is selected
  useEffect(() => {
    if (selectedPetId) {
      loadMaterials(selectedPetId);
      setFormState(prev => ({ ...prev, petDefinitionId: selectedPetId }));
    }
  }, [selectedPetId]);

  const loadItems = async () => {
    try {
      const response = await adminApiEndpoints.getItems();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load items:', error);
      toast.error('Không thể tải danh sách vật phẩm');
    }
  };

  const loadMaterials = async (petId: number) => {
    setLoading(true);
    try {
      const data = await getUpgradeMaterialsForPet(petId);
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
      toast.error('Không thể tải danh sách nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.petDefinitionId === 0) {
      toast.error('Vui lòng chọn pet');
      return;
    }
    
    // Material is now optional - allow gold-only upgrades
    if (formState.materialItemId && !formState.quantity) {
      toast.error('Vui lòng nhập số lượng vật phẩm');
      return;
    }
    
    if (!formState.materialItemId && formState.quantity) {
      toast.error('Vui lòng chọn vật phẩm');
      return;
    }

    setLoading(true);
    try {
      // Filter out empty stat increases
      const statIncrease = Object.fromEntries(
        Object.entries(formState.statIncrease).filter(([, value]) => value && value > 0)
      );

      const dto: CreateUpgradeMaterialDto = {
        petDefinitionId: formState.petDefinitionId,
        level: formState.level,
        goldCost: formState.goldCost,
        ...(Object.keys(statIncrease).length > 0 ? { statIncrease } : {}),
      };
      
      // CRITICAL: Always include material fields when editing to ensure they can be cleared
      if (editingMaterial) {
        // Explicitly set both fields - null if not selected, values if selected
        dto.materialItemId = formState.materialItemId;
        dto.quantity = formState.quantity;
      } else if (formState.materialItemId && formState.quantity) {
        // For creation, only include if both are provided
        dto.materialItemId = formState.materialItemId;
        dto.quantity = formState.quantity;
      }

      if (editingMaterial) {
        await updateUpgradeMaterial(editingMaterial.id, dto);
        toast.success('Đã cập nhật nguyên liệu nâng cấp');
      } else {
        await createUpgradeMaterial(dto);
        toast.success('Đã tạo nguyên liệu nâng cấp');
      }

      // Reset form
      resetForm();
      
      // Reload materials
      if (selectedPetId) {
        loadMaterials(selectedPetId);
      }
    } catch (error: unknown) {
      console.error('Failed to save material:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể lưu nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: UpgradeMaterial) => {
    setEditingMaterial(material);
    setFormState({
      petDefinitionId: material.petDefinitionId,
      level: material.level,
      materialItemId: material.materialItemId,
      quantity: material.quantity,
      goldCost: material.goldCost,
      statIncrease: material.statIncrease || {},
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) return;

    setLoading(true);
    try {
      await deleteUpgradeMaterial(id);
      toast.success('Đã xóa nguyên liệu');
      
      if (selectedPetId) {
        loadMaterials(selectedPetId);
      }
    } catch (error) {
      console.error('Failed to delete material:', error);
      toast.error('Không thể xóa nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormState({
      petDefinitionId: selectedPetId || 0,
      level: 2,
      materialItemId: null,
      quantity: null,
      goldCost: 100,
      statIncrease: {},
    });
  };

  const selectedPet = petDefinitions.find(p => p.id === selectedPetId);
  
  // Group materials by level
  const materialsByLevel = materials.reduce((acc, material) => {
    if (!acc[material.level]) {
      acc[material.level] = [];
    }
    acc[material.level].push(material);
    return acc;
  }, {} as Record<number, UpgradeMaterial[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingMaterial ? 'Sửa Nguyên Liệu Nâng Cấp' : 'Thêm Nguyên Liệu Nâng Cấp'}
          </CardTitle>
          <CardDescription>
            Cấu hình nguyên liệu và chi phí để nâng cấp pet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pet Selection */}
            <div className="space-y-2">
              <Label htmlFor="pet">Pet *</Label>
              <Select
                value={formState.petDefinitionId.toString()}
                onValueChange={(value) => {
                  const petId = parseInt(value);
                  setSelectedPetId(petId);
                  setFormState(prev => ({ ...prev, petDefinitionId: petId }));
                }}
                disabled={!!editingMaterial}
              >
                <SelectTrigger id="pet">
                  <SelectValue placeholder="Chọn pet" />
                </SelectTrigger>
                <SelectContent>
                  {petDefinitions.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id.toString()}>
                      {pet.name} (★{pet.rarity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label htmlFor="level">Level Yêu Cầu *</Label>
              <Input
                id="level"
                type="number"
                min={2}
                value={formState.level}
                onChange={(e) => setFormState(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                placeholder="Ví dụ: 2"
              />
              <p className="text-xs text-muted-foreground">
                Level mà pet cần đạt để sử dụng nguyên liệu này
              </p>
            </div>

            {/* Material Item */}
            <div className="space-y-2">
              <Label htmlFor="material">
                Vật Phẩm (Tùy Chọn - Để trống nếu chỉ cần vàng)
              </Label>
              <Select
                value={formState.materialItemId?.toString() || 'none'}
                onValueChange={(value) => {
                  setFormState(prev => ({ 
                    ...prev, 
                    materialItemId: value === 'none' ? null : parseInt(value),
                    quantity: value !== 'none' && !prev.quantity ? 1 : value === 'none' ? null : prev.quantity,
                  }));
                }}
              >
                <SelectTrigger id="material">
                  <SelectValue placeholder="Không yêu cầu vật phẩm (chỉ vàng)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không yêu cầu vật phẩm</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} ({item.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                💡 Để trống cho upgrade chỉ cần vàng. Chọn vật phẩm cho mốc đặc biệt (lv 5, 10, 15,...)
              </p>
            </div>

            {/* Quantity - Only show if material is selected */}
            {formState.materialItemId && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Số Lượng *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formState.quantity || ''}
                  onChange={(e) => setFormState(prev => ({ 
                    ...prev, 
                    quantity: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="Nhập số lượng"
                />
              </div>
            )}

            {/* Gold Cost */}
            <div className="space-y-2">
              <Label htmlFor="goldCost">Chi Phí Vàng *</Label>
              <Input
                id="goldCost"
                type="number"
                min={0}
                value={formState.goldCost}
                onChange={(e) => setFormState(prev => ({ ...prev, goldCost: parseInt(e.target.value) }))}
              />
            </div>

            {/* Stat Increase (Optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tăng Chỉ Số (Tùy Chọn)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="attack" className="text-xs">Attack</Label>
                  <Input
                    id="attack"
                    type="number"
                    min={0}
                    value={formState.statIncrease.attack || ''}
                    onChange={(e) => setFormState(prev => ({ 
                      ...prev, 
                      statIncrease: { 
                        ...prev.statIncrease, 
                        attack: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="defense" className="text-xs">Defense</Label>
                  <Input
                    id="defense"
                    type="number"
                    min={0}
                    value={formState.statIncrease.defense || ''}
                    onChange={(e) => setFormState(prev => ({ 
                      ...prev, 
                      statIncrease: { 
                        ...prev.statIncrease, 
                        defense: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="hp" className="text-xs">HP</Label>
                  <Input
                    id="hp"
                    type="number"
                    min={0}
                    value={formState.statIncrease.hp || ''}
                    onChange={(e) => setFormState(prev => ({ 
                      ...prev, 
                      statIncrease: { 
                        ...prev.statIncrease, 
                        hp: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="critRate" className="text-xs">Crit Rate</Label>
                  <Input
                    id="critRate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formState.statIncrease.critRate || ''}
                    onChange={(e) => setFormState(prev => ({ 
                      ...prev, 
                      statIncrease: { 
                        ...prev.statIncrease, 
                        critRate: e.target.value ? parseFloat(e.target.value) : undefined 
                      } 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="critDamage" className="text-xs">Crit Damage</Label>
                  <Input
                    id="critDamage"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formState.statIncrease.critDamage || ''}
                    onChange={(e) => setFormState(prev => ({ 
                      ...prev, 
                      statIncrease: { 
                        ...prev.statIncrease, 
                        critDamage: e.target.value ? parseFloat(e.target.value) : undefined 
                      } 
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {editingMaterial ? 'Cập Nhật' : 'Tạo Mới'}
              </Button>
              {editingMaterial && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Nguyên Liệu</CardTitle>
          <CardDescription>
            {selectedPet 
              ? `Nguyên liệu nâng cấp cho ${selectedPet.name}` 
              : 'Chọn pet để xem nguyên liệu'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedPet ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chọn pet để xem và quản lý nguyên liệu nâng cấp</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có nguyên liệu nâng cấp nào</p>
              <p className="text-sm mt-2">Sử dụng form bên trái để thêm nguyên liệu</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {Object.entries(materialsByLevel)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([level, levelMaterials]) => (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold">
                          Level {level}
                        </Badge>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>
                      
                      {levelMaterials.map((material) => {
                        const item = items.find(i => i.id === material.materialItemId);
                        const hasStats = material.statIncrease && Object.keys(material.statIncrease).length > 0;
                        const isMilestone = material.materialItemId !== null; // Has material requirement
                        
                        return (
                          <Card key={material.id} className={`p-4 ${isMilestone ? 'border-l-4 border-l-yellow-500' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isMilestone ? (
                                    <>
                                      <h4 className="font-semibold">
                                        {item?.name || 'Unknown Item'}
                                      </h4>
                                      <Badge variant="secondary">
                                        x{material.quantity}
                                      </Badge>
                                      <Badge variant="default" className="bg-yellow-600">
                                        🏆 Milestone
                                      </Badge>
                                    </>
                                  ) : (
                                    <>
                                      <h4 className="font-semibold text-muted-foreground">
                                        Chỉ cần vàng
                                      </h4>
                                      <Badge variant="outline">
                                        💰 Gold Only
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                
                                <div className="text-sm space-y-1">
                                  <p className="text-muted-foreground">
                                    💰 Chi phí: <span className="font-semibold text-yellow-600">{material.goldCost}</span> vàng
                                  </p>
                                  
                                  {hasStats && (
                                    <div className="mt-2 p-2 bg-muted rounded-md">
                                      <p className="text-xs font-semibold mb-1">Tăng chỉ số:</p>
                                      <div className="grid grid-cols-2 gap-1 text-xs">
                                        {material.statIncrease?.attack && (
                                          <span className="text-red-600">⚔️ +{material.statIncrease.attack}</span>
                                        )}
                                        {material.statIncrease?.defense && (
                                          <span className="text-blue-600">🛡️ +{material.statIncrease.defense}</span>
                                        )}
                                        {material.statIncrease?.hp && (
                                          <span className="text-green-600">❤️ +{material.statIncrease.hp}</span>
                                        )}
                                        {material.statIncrease?.critRate && (
                                          <span className="text-orange-600">🎯 +{material.statIncrease.critRate}%</span>
                                        )}
                                        {material.statIncrease?.critDamage && (
                                          <span className="text-purple-600">💥 +{material.statIncrease.critDamage}%</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(material)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(material.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
