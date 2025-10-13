/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Shield, Sword, Heart, RefreshCw, Info } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset';
import { apiService } from '@/lib/api-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import PetDetailModal from './PetDetailModal';

interface PetEquipment {
  id: string;
  name: string;
  slot: 'collar' | 'armor' | 'accessory' | 'weapon';
  iconImage?: string;
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
  stats: {
    strength: number;
    intelligence: number;
    dexterity: number;
    vitality: number;
    luck: number;
  };
  equipment?: PetEquipment[];
}

interface PetCompanionCardProps {
  pet?: PlayerPet | null;
}

export default function PetCompanionCard({ pet }: PetCompanionCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  // Group equipment by slot
  const equipmentBySlot = {
    weapon: pet?.equipment?.find(e => e.slot === 'weapon'),
    armor: pet?.equipment?.find(e => e.slot === 'armor'),
    accessory: pet?.equipment?.find(e => e.slot === 'accessory'),
    collar: pet?.equipment?.find(e => e.slot === 'collar'),
  };

  if (!pet) {
  };

  if (!pet) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center">
          <div className="text-muted-foreground mb-4">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có bạn đồng hành</p>
            <p className="text-xs mt-1">Hãy triệu hồi pet đầu tiên của bạn!</p>
          </div>
          <Button variant="outline" size="sm">
            Đi đến Gacha
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full overflow-hidden py-0">
        <CardContent className="p-0 relative h-full min-h-[320px]">
          {/* Background Pet Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: pet.imageUrl ? `url(${resolveAssetUrl(pet.imageUrl)})` : 'none',
              filter: 'brightness(0.4) blur(3px)',
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

          {/* Clear Pet Image Overlay - Centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-fit relative border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(pet.imageUrl)}
                alt={pet.name}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Content Container */}
          <div className="relative h-full flex flex-col p-4">
            {/* Header: Name, Rarity, Level */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2">
                <div className="font-bold text-base text-white mb-1 drop-shadow-lg">{pet.name}</div>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">Lv.{pet.level}</Badge>
              </div>
              <div className="flex items-center justify-center gap-0.5 mb-1">
                {Array.from({ length: pet.rarity }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 drop-shadow" />
                ))}
              </div>

            </div>

            {/* Equipment Slots - 4 corners with full visibility */}
            <div className="flex-1 relative">
              {/* Top Left - Weapon */}
              <div className="absolute top-2 left-2 z-10">
                <EquipmentSlot
                  equipment={equipmentBySlot.weapon}
                  icon={<Sword className="h-4 w-4" />}
                />
              </div>

              {/* Top Right - Armor */}
              <div className="absolute top-2 right-2 z-10">
                <EquipmentSlot
                  equipment={equipmentBySlot.armor}
                  icon={<Shield className="h-4 w-4" />}
                />
              </div>

              {/* Bottom Left - Collar */}
              <div className="absolute bottom-2 left-2 z-10">
                <EquipmentSlot
                  equipment={equipmentBySlot.collar}
                  icon={<Shield className="h-4 w-4" />}
                />
              </div>

              {/* Bottom Right - Accessory */}
              <div className="absolute bottom-2 right-2 z-10">
                <EquipmentSlot
                  equipment={equipmentBySlot.accessory}
                  icon={<Star className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Bottom Info - Stats & Actions */}
            <div className="space-y-2">
              {/* Core Stats - 5 stats in grid */}
              <div className="grid grid-cols-5 gap-1">
                {/* STR */}
                <div className="flex flex-row items-center gap-4 bg-black/60 backdrop-blur-sm rounded p-1">
                  <Sword className="h-3 w-3 text-orange-400" />
                  <span className="font-bold text-white text-[10px]">{pet.stats.strength}</span>
                  <span className="text-[8px] text-orange-400 font-medium">STR</span>
                </div>

                {/* INT */}
                <div className="flex flex-row items-center gap-4 bg-black/60 backdrop-blur-sm rounded p-1">
                  <Star className="h-3 w-3 text-purple-400" />
                  <span className="font-bold text-white text-[10px]">{pet.stats.intelligence}</span>
                  <span className="text-[8px] text-purple-400 font-medium">INT</span>
                </div>

                {/* DEX */}
                <div className="flex flex-row items-center gap-4 bg-black/60 backdrop-blur-sm rounded p-1">
                  <RefreshCw className="h-3 w-3 text-blue-400" />
                  <span className="font-bold text-white text-[10px]">{pet.stats.dexterity}</span>
                  <span className="text-[8px] text-blue-400 font-medium">DEX</span>
                </div>

                {/* VIT */}
                <div className="flex flex-row items-center gap-4 bg-black/60 backdrop-blur-sm rounded p-1">
                  <Heart className="h-3 w-3 text-red-400" />
                  <span className="font-bold text-white text-[10px]">{pet.stats.vitality}</span>
                  <span className="text-[8px] text-red-400 font-medium">VIT</span>
                </div>

                {/* LUK */}
                <div className="flex flex-row items-center gap-4 bg-black/60 backdrop-blur-sm rounded p-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white text-[10px]">{pet.stats.luck}</span>
                  <span className="text-[8px] text-yellow-400 font-medium">LUK</span>
                </div>
              </div>

              {/* Action Buttons - 2 buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* Switch Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8 w-full"
                  onClick={() => setShowSwitchModal(true)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Đổi Pet
                </Button>

                {/* Detail Button */}
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs h-8 w-full"
                  onClick={() => setShowDetailModal(true)}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Chi tiết
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <PetDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        pet={pet}
      />

      {/* Switch Pet Modal */}
      <SwitchPetModal
        open={showSwitchModal}
        onOpenChange={setShowSwitchModal}
        currentPet={pet}
      />
    </>
  );
}

// Equipment Slot Component
interface EquipmentSlotProps {
  equipment?: PetEquipment;
  icon: React.ReactNode;
}

function EquipmentSlot({ equipment, icon }: EquipmentSlotProps) {
  return (
    <div
      className="relative w-14 h-14 rounded-lg border-2 border-white/30 bg-black/50 backdrop-blur-md flex items-center justify-center hover:border-primary hover:bg-black/70 hover:scale-105 transition-all cursor-pointer group shadow-xl"
      title={equipment ? equipment.name : 'Trống'}
    >
      {equipment ? (
        <>
          {equipment.iconImage ? (
            <img
              src={resolveAssetUrl(equipment.iconImage)}
              alt={equipment.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div className="text-white">{icon}</div>
          )}
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <span className="text-[10px] text-white font-medium text-center px-1 leading-tight">
              {equipment.name}
            </span>
          </div>
        </>
      ) : (
        <div className="text-white/40">{icon}</div>
      )}
    </div>
  );
}

// Switch Pet Modal Component
interface SwitchPetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPet: PlayerPet;
}

function SwitchPetModal({ open, onOpenChange, currentPet }: SwitchPetModalProps) {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);

  // Fetch all user pets
  const PAGE_SIZE = 24;
  const [page, setPage] = useState(0);
  const [elementFilter, setElementFilter] = useState<string | undefined>(undefined);
  const [minRarityFilter, setMinRarityFilter] = useState<number | undefined>(undefined);
  const [maxRarityFilter, setMaxRarityFilter] = useState<number | undefined>(undefined);
  const [sortOption, setSortOption] = useState<'rarity_desc' | 'rarity_asc' | 'newest' | 'oldest' | undefined>(undefined);

  const { data: allPets = [], isLoading } = useQuery<any[]>({
    queryKey: ['all-user-pets', authUser?.id, page, elementFilter, minRarityFilter, maxRarityFilter, sortOption],
    queryFn: () =>
      apiService.getUserPets(true, PAGE_SIZE, page * PAGE_SIZE, {
        element: elementFilter,
        minRarity: minRarityFilter,
        maxRarity: maxRarityFilter,
        sort: sortOption,
      }),
    enabled: !!authUser?.id && open,
  });

  // Log pet count for debugging (helps check counts before/after multi-pulls)
  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined') {
      try {
        const count = Array.isArray(allPets) ? allPets.length : 0;
        console.log(`[SwitchPetModal] userId=${authUser?.id} allPetsCount=${count}`);
      } catch {
        // ignore logging errors
      }
    }
  }, [open, authUser?.id, allPets]);
  const handleSwitchPet = async (petId: number) => {
    if (petId === currentPet.id) {
      toast.info('Pet này đã được chọn rồi!');
      return;
    }

    setSwitching(true);
    try {
      await apiService.setActivePet(petId);
      toast.success('Đã đổi pet thành công!');

      // Refresh pets list
      queryClient.invalidateQueries({ queryKey: ['user-pets', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-user-pets'] });

      onOpenChange(false);
    } catch (error) {
      console.error('Switch pet error:', error);
      toast.error('Lỗi khi đổi pet!');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chọn Pet Đồng Hành</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Filters Row */}
            <div className="mb-3 flex flex-wrap gap-2 items-center">
              <select
                value={elementFilter ?? ''}
                onChange={(e) => { setPage(0); setElementFilter(e.target.value || undefined); }}
                className="px-2 py-1 rounded border"
                aria-label="Element filter"
              >
                <option value="">Tất cả hệ</option>
                <option value="fire">Hỏa</option>
                <option value="water">Thủy</option>
                <option value="earth">Địa</option>
                <option value="wind">Phong</option>
                <option value="light">Ánh</option>
                <option value="dark">Bóng</option>
              </select>

              <select
                value={minRarityFilter ?? ''}
                onChange={(e) => { setPage(0); setMinRarityFilter(e.target.value ? parseInt(e.target.value, 10) : undefined); }}
                className="px-2 py-1 rounded border"
                aria-label="Min rarity"
              >
                <option value="">Min sao</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
                <option value="4">4★</option>
                <option value="5">5★</option>
              </select>

              <select
                value={maxRarityFilter ?? ''}
                onChange={(e) => { setPage(0); setMaxRarityFilter(e.target.value ? parseInt(e.target.value, 10) : undefined); }}
                className="px-2 py-1 rounded border"
                aria-label="Max rarity"
              >
                <option value="">Max sao</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
                <option value="4">4★</option>
                <option value="5">5★</option>
              </select>

              <select
                value={sortOption ?? ''}
                onChange={(e) => { setPage(0); setSortOption(e.target.value ? (e.target.value as any) : undefined); }}
                className="px-2 py-1 rounded border"
                aria-label="Sort"
              >
                <option value="">Sắp xếp</option>
                <option value="rarity_desc">Sao: Cao → Thấp</option>
                <option value="rarity_asc">Sao: Thấp → Cao</option>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>

              <div className="ml-auto flex items-center gap-2">
                <button
                  className="px-2 py-1 rounded border"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Prev
                </button>
                <div className="px-2">Trang {page + 1}</div>
                <button
                  className="px-2 py-1 rounded border"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={Array.isArray(allPets) ? allPets.length < PAGE_SIZE : false}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(allPets as any[]).map((pet: PlayerPet) => (
                <button
                  key={pet.id}
                  onClick={() => handleSwitchPet(pet.id)}
                  disabled={switching || pet.id === currentPet.id}
                  className={`relative p-3 rounded-lg border-2 transition-all ${pet.id === currentPet.id
                    ? 'border-primary bg-primary/10 cursor-default'
                    : 'border-muted hover:border-primary cursor-pointer'
                    } ${switching ? 'opacity-50' : ''}`}
                >
                  <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center mb-2 overflow-hidden p-2">
                    {pet.imageUrl ? (
                      <img
                        src={resolveAssetUrl(pet.imageUrl)}
                        alt={pet.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Shield className="h-12 w-12 text-muted-foreground opacity-50" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm mb-1">{pet.name}</div>
                    <div className="flex items-center justify-center gap-0.5 mb-1">
                      {Array.from({ length: pet.rarity }).map((_, i) => (
                        <Star key={i} className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs">Lv.{pet.level}</Badge>
                  </div>
                  {pet.id === currentPet.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Star className="h-3 w-3 fill-current" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
