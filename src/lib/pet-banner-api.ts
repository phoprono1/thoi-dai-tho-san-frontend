/**
 * Pet Banner API
 * Handles pet gacha banner operations
 */

import { api } from './api-client';

export interface PetBanner {
  id: number;
  name: string;
  description: string;
  bannerType: 'standard' | 'rate_up' | 'limited';
  bannerImage?: string;
  costPerPull: number;
  // New: support multi-threshold pity configuration coming from backend
  pityThresholds?: { rarity: number; pullCount: number }[];
  guaranteedRarity?: number;
  guaranteedPullCount?: number;
  featuredPets: number[]; // Pet definition IDs
  dropRates: {
    rarity1?: number;
    rarity2?: number;
    rarity3?: number;
    rarity4?: number;
    rarity5?: number;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PetDefinition {
  id: number;
  petId: string;
  name: string;
  description?: string;
  rarity: number;
  element?: string;
  maxEvolutionStage: number;
  baseStats: {
    attack: number;
    defense: number;
    hp: number;
    critRate?: number;
    critDamage?: number;
  };
  images?: string[];
}

export interface PullResult {
  userPet: {
    id: number;
    petDefinitionId: number;
    petId: string;
    name: string;
    level: number;
    rarity: number;
    imageUrl?: string;
  };
  isNew: boolean;
}

export interface MultiPullResult {
  results: PullResult[];
  totalCost: number;
}

/**
 * Get all active pet banners
 */
export async function getActivePetBanners(): Promise<PetBanner[]> {
  const response = await api.get('/pets/banners/active');
  return response.data;
}

/**
 * Get pet banner by ID
 */
export async function getPetBannerById(bannerId: number): Promise<PetBanner> {
  const response = await api.get(`/pets/banners/${bannerId}`);
  return response.data;
}

/**
 * Get featured pets for a banner
 */
export async function getFeaturedPets(bannerId: number): Promise<PetDefinition[]> {
  const response = await api.get(`/pets/banners/${bannerId}/featured-pets`);
  return response.data;
}

/**
 * Pull a single pet from banner
 */
export async function pullPet(bannerId: number): Promise<PullResult> {
  const response = await api.post(`/pets/banners/${bannerId}/pull`);
  return response.data;
}

/**
 * Pull multiple pets from banner
 */
export async function pullMultiplePets(
  bannerId: number,
  count: number = 10
): Promise<MultiPullResult> {
  // include count in the request body so the parameter is used (avoids unused-parameter errors)
  const response = await api.post(`/pets/banners/${bannerId}/pull-10`, { count });
  return response.data;
}

/**
 * Get user's pull history
 */
export async function getPullHistory(
  limit: number = 50,
  bannerId?: number
): Promise<PullResult[]> {
  const response = await api.get('/pets/pull-history', {
    params: { limit, bannerId },
  });
  return response.data;
}

