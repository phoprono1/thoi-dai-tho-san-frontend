'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  Sword,
  Shield,
  Heart,
  Zap,
  TrendingUp,
  Sparkles,
  Palette,
  ChevronRight,
  Target,
} from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset';
import { apiService } from '@/lib/api-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';

interface PetStats {
  strength: number;
  intelligence: number;
  dexterity: number;
  vitality: number;
  luck: number;
}

interface PetEquipment {
  id: string;
  name: string;
  slot: 'collar' | 'armor' | 'accessory' | 'weapon';
  iconImage?: string;
  stats?: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    vitality?: number;
    luck?: number;
  };
}

interface PetAbility {
  id: number;
  name: string;
  type: string;
  description?: string;
  effects: any;
  cooldown: number;
  manaCost: number;
  targetType: string;
  icon?: string;
  rarity: number;
  currentCooldown?: number;
}

interface PlayerPet {
  id: number;
  petDefinitionId: number;
  petId: string;
  name: string;
  level: number;
  experience: number;
  evolutionStage: number;
  rarity: number;
  currentHp: number;
  maxHp: number;
  imageUrl?: string;
  stats: PetStats;
  equipment?: PetEquipment[];
  abilities?: PetAbility[];
  friendship?: number;
  unlockedSkins?: number[];
  currentSkinIndex?: number;
  petDefinition?: {
    id: number;
    maxLevel: number;
    maxEvolutionStage: number;
    images?: string[];
  };
}

interface PetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: PlayerPet;
}

export default function PetDetailModal({ open, onOpenChange, pet }: PetDetailModalProps) {
  const [activeTab, setActiveTab] = useState('stats');

  // Fetch detailed pet data when modal opens
  const { data: detailedPet } = useQuery({
    queryKey: ['pet-detail', pet.id],
    queryFn: () => apiService.getPetDetail(pet.id),
    enabled: open && !!pet.id,
    initialData: pet,
    refetchOnMount: true, // Always refetch when modal opens
  });

  // Use detailed pet data if available, fallback to prop
  const displayPet = detailedPet || pet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {displayPet.name}
            <Badge variant="secondary" className="ml-auto">Lv.{displayPet.level}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats">Thuộc tính</TabsTrigger>
            <TabsTrigger value="equipment">Trang bị</TabsTrigger>
            <TabsTrigger value="upgrade">Nâng cấp</TabsTrigger>
            <TabsTrigger value="evolution">Tiến hóa</TabsTrigger>
            <TabsTrigger value="skins">Skin</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <StatsTab pet={displayPet} />
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <EquipmentTab pet={displayPet} />
          </TabsContent>

          {/* Upgrade Tab */}
          <TabsContent value="upgrade" className="space-y-4">
            <UpgradeTab pet={displayPet} />
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-4">
            <EvolutionTab pet={displayPet} />
          </TabsContent>

          {/* Skins Tab */}
          <TabsContent value="skins" className="space-y-4">
            <SkinsTab pet={displayPet} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Stats Tab Component
function StatsTab({ pet }: { pet: PlayerPet }) {
  // Calculate exp to next level (assuming 1000 per level, adjust based on backend)
  // const maxExp = pet.petDefinition?.maxLevel ? 1000 : 1000;
  // const expPercent = Math.min(100, (pet.experience / maxExp) * 100);
  // const friendship = pet.friendship || 0;
  // const friendshipBonus = Math.floor(friendship / 10);

  return (
    <div className="space-y-4">
      {/* Pet Image & Basic Info */}
      <Card>
        <CardContent className="flex flex-col items-center py-6">
          <div className="w-32 h-32 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center overflow-hidden mb-4 p-2">
            {pet.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={resolveAssetUrl(pet.imageUrl)} 
                alt={pet.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Shield className="h-16 w-16 text-muted-foreground opacity-50" />
            )}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: pet.rarity }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <Badge variant="outline">Giai đoạn tiến hóa: {pet.evolutionStage}</Badge>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Chỉ số cốt lõi (Core Stats)</CardTitle>
          <p className="text-xs text-muted-foreground">Pet cung cấp 20% chỉ số này cho người chơi</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <StatItem 
              icon={<Sword className="h-4 w-4 text-orange-500" />}
              label="Strength (STR)"
              value={pet.stats?.strength || 0}
            />
            <StatItem 
              icon={<Sparkles className="h-4 w-4 text-purple-500" />}
              label="Intelligence (INT)"
              value={pet.stats?.intelligence || 0}
            />
            <StatItem 
              icon={<Target className="h-4 w-4 text-blue-500" />}
              label="Dexterity (DEX)"
              value={pet.stats?.dexterity || 0}
            />
            <StatItem 
              icon={<Heart className="h-4 w-4 text-red-500" />}
              label="Vitality (VIT)"
              value={pet.stats?.vitality || 0}
            />
            <StatItem 
              icon={<Star className="h-4 w-4 text-yellow-500" />}
              label="Luck (LUK)"
              value={pet.stats?.luck || 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pet Abilities Section */}
      {pet.abilities && pet.abilities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Kỹ năng Pet</CardTitle>
            <p className="text-xs text-muted-foreground">Các kỹ năng đã mở khóa</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {pet.abilities.map((ability) => (
                <div
                  key={ability.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  {/* Ability Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {ability.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={resolveAssetUrl(ability.icon)} 
                        alt={ability.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Sparkles className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  {/* Ability Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{ability.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {ability.type}
                      </Badge>
                      {ability.currentCooldown && ability.currentCooldown > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Cooldown: {ability.currentCooldown}
                        </Badge>
                      )}
                    </div>
                    {ability.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {ability.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs">
                      {ability.manaCost > 0 && (
                        <span className="text-blue-500">
                          💧 Mana: {ability.manaCost}
                        </span>
                      )}
                      {ability.cooldown > 0 && (
                        <span className="text-orange-500">
                          ⏱ Cooldown: {ability.cooldown} turns
                        </span>
                      )}
                      <span className="text-purple-500">
                        🎯 {ability.targetType}
                      </span>
                      {Array.from({ length: ability.rarity }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Equipment Tab Component
function EquipmentTab({ pet }: { pet: PlayerPet }) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [equiping, setEquiping] = useState(false);

  // Fetch user's pet equipment items from inventory
  const { data: userItems = [] } = useQuery({
    queryKey: ['user-items-pet-equipment', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return [];
      // Get all user items and filter for pet equipment
      const items = await apiService.getUserItems(authUser.id);
      // Filter for pet equipment types (pet_collar, pet_armor, pet_accessory, pet_weapon)
      return items.filter((item: any) => 
        item.item?.type?.startsWith('pet_') && item.quantity > 0
      );
    },
    enabled: !!authUser?.id,
  });

  const equipmentSlots = [
    { slot: 'collar', name: 'Cổ', icon: <Shield className="h-5 w-5" /> },
    { slot: 'armor', name: 'Áo giáp', icon: <Shield className="h-5 w-5" /> },
    { slot: 'accessory', name: 'Phụ kiện', icon: <Star className="h-5 w-5" /> },
    { slot: 'weapon', name: 'Vũ khí', icon: <Sword className="h-5 w-5" /> },
  ];

  const getEquippedItem = (slot: string) => {
    return pet.equipment?.find((e) => e.slot === slot);
  };

  const getSlotItems = (slot: string) => {
    return userItems.filter((ui: any) => {
      const itemType = ui.item?.type || '';
      return itemType === `pet_${slot}`;
    });
  };

  const handleEquip = async (itemId: number, slot: string) => {
    setEquiping(true);
    try {
      const result = await apiService.equipPetItem(pet.id, itemId, slot);
      toast.success('Đã trang bị thành công!');
      
      // Update cache immediately with response data
      if (result && result.equipment) {
        // Update pet detail query
        queryClient.setQueryData(['pet-detail', pet.id], result);
        
        // Update pets list query
        queryClient.setQueryData(['user-pets', authUser?.id], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((p: any) => p.id === pet.id ? { ...p, equipment: result.equipment } : p);
        });
      }
      
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['pet-detail'] });
      queryClient.invalidateQueries({ queryKey: ['user-pets', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-user-pets'] });
      setSelectedSlot(null);
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi trang bị!');
    } finally {
      setEquiping(false);
    }
  };

  const handleUnequip = async (slot: string) => {
    setEquiping(true);
    try {
      const result = await apiService.unequipPetItem(pet.id, slot);
      toast.success('Đã tháo trang bị!');
      
      // Update cache immediately with response data
      if (result && result.equipment !== undefined) {
        // Update pet detail query
        queryClient.setQueryData(['pet-detail', pet.id], result);
        
        // Update pets list query
        queryClient.setQueryData(['user-pets', authUser?.id], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((p: any) => p.id === pet.id ? { ...p, equipment: result.equipment } : p);
        });
      }
      
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['pet-detail'] });
      queryClient.invalidateQueries({ queryKey: ['user-pets', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-user-pets'] });
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi tháo trang bị!');
    } finally {
      setEquiping(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trang bị Pet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {equipmentSlots.map(({ slot, name, icon }) => {
              const equippedItem = getEquippedItem(slot);
              return (
                <div key={slot} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">{name}</div>
                  <div
                    className={`
                      border-2 rounded-lg p-3 min-h-[100px] flex flex-col items-center justify-center
                      transition-all cursor-pointer
                      ${equippedItem ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}
                    `}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {equippedItem ? (
                      <>
                        {equippedItem.iconImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={resolveAssetUrl(equippedItem.iconImage)} 
                            alt={equippedItem.name}
                            className="w-12 h-12 object-contain mb-2"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center mb-2">
                            {icon}
                          </div>
                        )}
                        <div className="text-xs font-semibold text-center">{equippedItem.name}</div>
                        {equippedItem.stats && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {Object.entries(equippedItem.stats).map(([key, value]) => (
                              <span key={key} className="mr-1">
                                {key}: +{value as number}
                              </span>
                            ))}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="mt-2 h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnequip(slot);
                          }}
                          disabled={equiping}
                        >
                          Tháo
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-muted-foreground mb-2">{icon}</div>
                        <div className="text-xs text-muted-foreground">Trống</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Selection Dialog */}
      {selectedSlot && (
        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Chọn trang bị {equipmentSlots.find((s) => s.slot === selectedSlot)?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {getSlotItems(selectedSlot).length > 0 ? (
                getSlotItems(selectedSlot).map((userItem: any) => (
                  <div
                    key={userItem.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEquip(userItem.itemId, selectedSlot)}
                  >
                    {userItem.item?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={resolveAssetUrl(userItem.item.image)} 
                        alt={userItem.item.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                        <Shield className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{userItem.item?.name}</div>
                      {userItem.item?.stats && (
                        <div className="text-sm text-muted-foreground">
                          {Object.entries(userItem.item.stats).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: +{value as number}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">Số lượng: {userItem.quantity}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Không có trang bị nào trong túi đồ
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Upgrade Tab Component
function UpgradeTab({ pet }: { pet: PlayerPet }) {
  const [upgrading, setUpgrading] = useState(false);
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  // Fetch upgrade requirements from backend
  const { data: requirements, isLoading } = useQuery({
    queryKey: ['upgrade-requirements', pet.id],
    queryFn: () => apiService.getUpgradeRequirements(pet.id),
  });

  const handleUpgrade = async () => {
    if (!requirements?.canUpgrade) {
      toast.error('Không đủ nguyên liệu hoặc vàng để nâng cấp!');
      return;
    }

    setUpgrading(true);
    try {
      const result = await apiService.upgradePet(pet.id);
      toast.success(result.message || 'Nâng cấp thành công!');
      
      // Refresh pet data
      queryClient.invalidateQueries({ queryKey: ['pet-detail', pet.id] });
      queryClient.invalidateQueries({ queryKey: ['user-pets', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['upgrade-requirements', pet.id] });
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error?.message || 'Lỗi khi nâng cấp pet!');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !requirements ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Không tìm thấy yêu cầu nâng cấp
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Nâng cấp lên Lv.{requirements.level}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Gold requirement */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-yellow-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Vàng</div>
                    <div className={`text-xs ${requirements.hasEnoughGold ? 'text-green-500' : 'text-red-500'}`}>
                      {requirements.playerGold.toLocaleString()} / {requirements.goldCost.toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant={requirements.hasEnoughGold ? 'default' : 'secondary'}>
                  {requirements.hasEnoughGold ? '✓ Đủ' : '✗ Thiếu'}
                </Badge>
              </div>

              {/* Material requirements */}
              {requirements.materials.filter((m: any) => m.itemId !== null).length > 0 ? (
                requirements.materials
                  .filter((m: any) => m.itemId !== null)
                  .map((material: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-purple-500">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{material.itemName}</div>
                          <div className={`text-xs ${material.hasEnough ? 'text-green-500' : 'text-red-500'}`}>
                            {material.playerHas} / {material.quantity}
                          </div>
                        </div>
                      </div>
                      <Badge variant={material.hasEnough ? 'default' : 'secondary'}>
                        {material.hasEnough ? '✓' : '✗'}
                      </Badge>
                    </div>
                  ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Chỉ cần vàng để nâng cấp
                </div>
              )}
            </CardContent>
          </Card>

          {requirements.statIncrease && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Thuộc tính tăng thêm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {requirements.statIncrease.attack > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tấn công</span>
                      <span className="font-semibold text-green-500">+{requirements.statIncrease.attack}</span>
                    </div>
                  )}
                  {requirements.statIncrease.defense > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phòng thủ</span>
                      <span className="font-semibold text-green-500">+{requirements.statIncrease.defense}</span>
                    </div>
                  )}
                  {requirements.statIncrease.hp > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">HP</span>
                      <span className="font-semibold text-green-500">+{requirements.statIncrease.hp}</span>
                    </div>
                  )}
                  {requirements.statIncrease.critRate > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tỷ lệ chí mạng</span>
                      <span className="font-semibold text-green-500">+{requirements.statIncrease.critRate}%</span>
                    </div>
                  )}
                  {requirements.statIncrease.critDamage > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sát thương chí mạng</span>
                      <span className="font-semibold text-green-500">+{requirements.statIncrease.critDamage}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            className="w-full" 
            disabled={!requirements.canUpgrade || upgrading}
            onClick={handleUpgrade}
          >
            {upgrading ? 'Đang nâng cấp...' : requirements.canUpgrade ? 'Nâng cấp' : 'Không đủ nguyên liệu'}
          </Button>
        </>
      )}
    </div>
  );
}

// Evolution Tab Component
function EvolutionTab({ pet }: { pet: PlayerPet }) {
  const [evolving, setEvolving] = useState(false);
  const [selectedEvolution, setSelectedEvolution] = useState<any>(null);
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  
  // Fetch available evolutions from backend
  const { data: evolutions = [], isLoading } = useQuery({
    queryKey: ['pet-evolutions', pet.id],
    queryFn: () => apiService.getAvailableEvolutions(pet.id),
  });

  // Fetch user's other pets for sacrifice
  const { data: userPets = [], isLoading: loadingPets } = useQuery({
    queryKey: ['user-pets-for-sacrifice', pet.id],
    queryFn: async () => {
      // Include ALL pets (includeInactive = true)
      const pets = await apiService.getUserPets(true);
      console.log('🔍 [EvolutionTab] Fetched pets:', pets);
      // Exclude current pet being evolved
      const filtered = pets.filter((p: any) => p.id !== pet.id);
      console.log('🔍 [EvolutionTab] After filtering (exclude pet.id=' + pet.id + '):', filtered);
      return filtered;
    },
    enabled: !!selectedEvolution,
  });

  const handleEvolve = async () => {
    if (!selectedEvolution) return;

    setEvolving(true);
    try {
      await apiService.evolvePet(pet.id, selectedEvolution.id, selectedPetIds.length > 0 ? selectedPetIds : undefined);
      toast.success('Tiến hóa thành công!');
      
      // Refresh all pet data
      queryClient.invalidateQueries({ queryKey: ['pet-detail', pet.id] });
      queryClient.invalidateQueries({ queryKey: ['user-pets', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['pet-evolutions', pet.id] });
      
      // Reset selection
      setSelectedEvolution(null);
      setSelectedPetIds([]);
    } catch (error: any) {
      console.error('Evolution error:', error);
      toast.error(error?.message || 'Lỗi khi tiến hóa pet!');
    } finally {
      setEvolving(false);
    }
  };

  const togglePetSelection = (petId: number) => {
    setSelectedPetIds(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const maxEvolutionStage = pet.petDefinition?.maxEvolutionStage || 3;
  const canEvolve = evolutions.length > 0;
  const isMaxEvolution = pet.evolutionStage >= maxEvolutionStage;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : isMaxEvolution ? (
        <Card>
          <CardContent className="py-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="font-semibold mb-2">Đã đạt giai đoạn tiến hóa tối đa!</p>
            <p className="text-sm text-muted-foreground">
              Pet của bạn đã ở dạng mạnh nhất.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg border-2 border-primary/20 bg-muted flex items-center justify-center mb-2 p-2 overflow-hidden">
                {pet.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={resolveAssetUrl(pet.imageUrl)} 
                    alt="Current"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Shield className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <Badge variant="outline">Giai đoạn {pet.evolutionStage}</Badge>
            </div>

            <ChevronRight className="h-8 w-8 text-muted-foreground" />

            <div className="text-center">
              <div className="w-24 h-24 rounded-lg border-2 border-primary bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <Badge>Giai đoạn {pet.evolutionStage + 1}</Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            {canEvolve ? (
              <>
                <p className="font-semibold text-foreground mb-2">Có {evolutions.length} lựa chọn tiến hóa!</p>
                <p className="text-xs">Chọn hướng tiến hóa phù hợp với phong cách chơi của bạn.</p>
              </>
            ) : (
              <p>Chưa đủ điều kiện tiến hóa. Hãy tăng cấp và hoàn thành nhiệm vụ.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {canEvolve && evolutions.length > 0 && (
        <div className="space-y-3">
          {evolutions.map((evolution: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-sm">{evolution.evolutionName || `Tiến hóa Stage ${evolution.evolutionStage}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {evolution.evolutionDescription && (
                  <p className="text-xs text-muted-foreground">{evolution.evolutionDescription}</p>
                )}
                
                {/* Required Level */}
                <div className="text-xs">
                  <span className="font-semibold">Level yêu cầu:</span>
                  <span className={pet.level >= evolution.requiredLevel ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                    {pet.level} / {evolution.requiredLevel}
                  </span>
                </div>

                {/* Required Pets for sacrifice */}
                {evolution.requiredPets && evolution.requiredPets.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Pet cần hi sinh:</p>
                    {evolution.requiredPets.map((reqPet: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                        <span>{reqPet.quantity}x Pet {reqPet.rarity}⭐ trở lên</span>
                        <span className="text-red-500">
                          {reqPet.allowSameSpecies ? '(Cùng loài OK)' : '(Khác loài)'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Required Items */}
                {evolution.requiredItems && evolution.requiredItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Vật phẩm cần:</p>
                    {evolution.requiredItems.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                        <span>{item.name || 'Unknown Item'}</span>
                        <span className="text-red-500">{item.quantity || 0}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stat Multipliers */}
                {evolution.statMultipliers && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Hệ số tăng stats:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {evolution.statMultipliers.hp > 1 && (
                        <div>HP: <span className="text-green-500">x{evolution.statMultipliers.hp}</span></div>
                      )}
                      {evolution.statMultipliers.attack > 1 && (
                        <div>ATK: <span className="text-green-500">x{evolution.statMultipliers.attack}</span></div>
                      )}
                      {evolution.statMultipliers.defense > 1 && (
                        <div>DEF: <span className="text-green-500">x{evolution.statMultipliers.defense}</span></div>
                      )}
                      {evolution.statMultipliers.critRate > 1 && (
                        <div>Crit Rate: <span className="text-green-500">x{evolution.statMultipliers.critRate}</span></div>
                      )}
                      {evolution.statMultipliers.critDamage > 1 && (
                        <div>Crit Dmg: <span className="text-green-500">x{evolution.statMultipliers.critDamage}</span></div>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  disabled={evolving}
                  onClick={() => setSelectedEvolution(evolution)}
                >
                  Chọn pet để tiến hóa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pet Selection Dialog */}
      {selectedEvolution && (
        <Dialog open={!!selectedEvolution} onOpenChange={() => {
          setSelectedEvolution(null);
          setSelectedPetIds([]);
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chọn pet để hi sinh - {selectedEvolution.evolutionName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Requirements */}
              {selectedEvolution.requiredPets && selectedEvolution.requiredPets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Yêu cầu hi sinh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEvolution.requiredPets.map((reqPet: any, i: number) => (
                      <div key={i} className="text-sm mb-2">
                        <Badge variant="destructive">
                          {reqPet.quantity}x Pet {reqPet.rarity}⭐ trở lên
                        </Badge>
                        {reqPet.allowSameSpecies && (
                          <span className="text-xs text-muted-foreground ml-2">(Cùng loài OK)</span>
                        )}
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-2">
                      Đã chọn: {selectedPetIds.length} pet
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Available Pets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pet có sẵn (Click để chọn)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {loadingPets ? (
                    <div className="col-span-2 flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : userPets.length === 0 ? (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                      Không có pet nào để hi sinh
                      <div className="text-xs mt-2">
                        (Đang tìm {pet.id} pets, includeInactive=true)
                      </div>
                    </div>
                  ) : (
                    userPets.map((userPet: any) => {
                      const isSelected = selectedPetIds.includes(userPet.id);
                      return (
                        <div
                          key={userPet.id}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => togglePetSelection(userPet.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                              {userPet.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={resolveAssetUrl(userPet.imageUrl)} 
                                  alt={userPet.petDefinition?.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Shield className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">
                                {userPet.petDefinition?.name || 'Unknown'}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <span>{'⭐'.repeat(userPet.petDefinition?.rarity || 1)}</span>
                                <span className="text-muted-foreground">Lv.{userPet.level}</span>
                              </div>
                              {isSelected && (
                                <Badge variant="default" className="text-xs mt-1">Đã chọn</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedEvolution(null);
                    setSelectedPetIds([]);
                  }}
                >
                  Hủy
                </Button>
                <Button 
                  className="flex-1"
                  disabled={selectedPetIds.length === 0 || evolving}
                  onClick={handleEvolve}
                >
                  {evolving ? 'Đang tiến hóa...' : `Tiến hóa (${selectedPetIds.length} pet)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!canEvolve && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Điều kiện tiến hóa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Level tối thiểu</span>
              <span className={pet.level >= 10 ? 'text-green-500' : 'text-red-500'}>
                {pet.level} / 10
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Giai đoạn hiện tại</span>
              <span>{pet.evolutionStage} / {maxEvolutionStage}</span>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}

// Skins Tab Component
function SkinsTab({ pet }: { pet: PlayerPet }) {
  const queryClient = useQueryClient();
  const [selectedSkin, setSelectedSkin] = useState<number>(pet.currentSkinIndex || 0);
  const [applying, setApplying] = useState(false);
  
  // Get all available skins from pet definition
  const allSkins = pet.petDefinition?.images || [pet.imageUrl];
  const unlockedSkins = pet.unlockedSkins || [0]; // Default skin always unlocked

  const handleApplySkin = async () => {
    setApplying(true);
    try {
      await apiService.changePetSkin(pet.id, selectedSkin);
      toast.success('Đã đổi skin thành công!');
      queryClient.invalidateQueries({ queryKey: ['pet-detail', pet.id] });
      queryClient.invalidateQueries({ queryKey: ['user-pets'] });
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi đổi skin!');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Chọn skin hiển thị ({unlockedSkins.length} / {allSkins.length} đã mở khóa)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {allSkins.map((skinUrl: string | undefined, index: number) => {
              const isUnlocked = unlockedSkins.includes(index);
              const isSelected = selectedSkin === index;
              
              return (
                <div
                  key={index}
                  className={`relative aspect-square rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary shadow-lg'
                      : 'border-muted hover:border-primary/50'
                  } ${!isUnlocked && 'opacity-50'}`}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedSkin(index);
                      toast.success(`Đã chọn skin ${index === 0 ? 'mặc định' : `#${index + 1}`}`);
                    } else {
                      toast.error('Skin chưa mở khóa!');
                    }
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center p-2 overflow-hidden">
                    {skinUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={resolveAssetUrl(skinUrl)} 
                        alt={`Skin ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Shield className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">🔒 Chưa mở</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {index === 0 ? 'Mặc định' : `Skin #${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button 
        className="w-full" 
        onClick={handleApplySkin}
        disabled={selectedSkin === (pet.currentSkinIndex || 0) || applying}
      >
        {applying ? 'Đang áp dụng...' : selectedSkin === (pet.currentSkinIndex || 0) ? 'Đang sử dụng' : 'Áp dụng'}
      </Button>
    </div>
  );
}

// Stat Item Component
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      {icon}
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold text-sm">{value}</div>
      </div>
    </div>
  );
}
