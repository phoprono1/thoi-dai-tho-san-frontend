export enum MonsterType {
  NORMAL = 'normal',
  ELITE = 'elite',
  BOSS = 'boss',
  MINI_BOSS = 'mini_boss',
}

export enum MonsterElement {
  FIRE = 'fire',
  WATER = 'water',
  EARTH = 'earth',
  WIND = 'wind',
  LIGHT = 'light',
  DARK = 'dark',
  NEUTRAL = 'neutral',
}

export interface Monster {
  id: number;
  name: string;
  description: string | null;
  type: MonsterType;
  element: MonsterElement;
  level: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  experienceReward: number;
  goldReward: number;
  dropItems: {
    itemId: number;
    dropRate: number;
    minQuantity: number;
    maxQuantity: number;
  }[] | null;
  isActive: boolean;
  image?: string; // Image path for the monster
  createdAt: string;
  updatedAt: string;
}
