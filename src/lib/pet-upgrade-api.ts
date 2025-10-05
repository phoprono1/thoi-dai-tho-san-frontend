import { api } from './api-client';

export interface UpgradeMaterial {
  id: number;
  petDefinitionId: number;
  level: number;
  materialItemId: number | null;
  quantity: number | null;
  goldCost: number;
  statIncrease?: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    critDamage?: number;
  };
  materialItem?: {
    id: number;
    name: string;
    type: string;
    rarity: number;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpgradeMaterialDto {
  petDefinitionId: number;
  level: number;
  materialItemId?: number | null;
  quantity?: number | null;
  goldCost: number;
  statIncrease?: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    critDamage?: number;
  };
}

export interface UpdateUpgradeMaterialDto {
  materialItemId?: number | null;
  quantity?: number | null;
  goldCost?: number;
  statIncrease?: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    critDamage?: number;
  };
}

export interface UpgradeRequirements {
  level: number;
  materials: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    playerHas: number;
    hasEnough: boolean;
  }>;
  goldCost: number;
  playerGold: number;
  hasEnoughGold: boolean;
  canUpgrade: boolean;
  statIncrease?: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    critDamage?: number;
  };
}

/**
 * Get all upgrade materials for a specific pet
 */
export async function getUpgradeMaterialsForPet(petDefinitionId: number) {
  const response = await api.get<UpgradeMaterial[]>(
    `/admin/pets/pets/${petDefinitionId}/upgrade-materials`
  );
  return response.data;
}

/**
 * Create upgrade material requirement
 */
export async function createUpgradeMaterial(data: CreateUpgradeMaterialDto) {
  const response = await api.post<UpgradeMaterial>(
    '/admin/pets/upgrade-materials',
    data
  );
  return response.data;
}

/**
 * Update upgrade material
 */
export async function updateUpgradeMaterial(
  id: number,
  data: UpdateUpgradeMaterialDto
) {
  const response = await api.put<UpgradeMaterial>(
    `/admin/pets/upgrade-materials/${id}`,
    data
  );
  return response.data;
}

/**
 * Delete upgrade material
 */
export async function deleteUpgradeMaterial(id: number) {
  const response = await api.delete(
    `/admin/pets/upgrade-materials/${id}`
  );
  return response.data;
}

/**
 * Get upgrade requirements for a user's pet (Player API)
 */
export async function getUpgradeRequirements(userPetId: number) {
  const response = await api.get<UpgradeRequirements>(
    `/pets/${userPetId}/upgrade-requirements`
  );
  return response.data;
}

/**
 * Upgrade a user's pet (Player API)
 */
export async function upgradePet(userPetId: number) {
  const response = await api.post(
    `/pets/${userPetId}/upgrade`,
    {}
  );
  return response.data;
}
