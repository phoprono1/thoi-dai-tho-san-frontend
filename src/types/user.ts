export interface User {
  id: number;
  username: string;
  password: string;
  level: number;
  experience: number;
  characterClass?: CharacterClass;
  gold: number;
  guild?: Guild;
  stats?: UserStats;
  createdAt: Date;
  updatedAt: Date;
  isBanned: boolean;
  isAdmin: boolean;
  isDonor: boolean;
}

// Forward declarations to avoid circular dependencies
export interface CharacterClass {
  id: number;
  name: string;
  description: string;
  type: string;
  tier: number;
  requiredLevel: number;
  statBonuses?: Record<string, number>;
  skillUnlocks?: Array<{
    skillId: number;
    skillName: string;
    description: string;
  }>;
  advancementRequirements?: {
    dungeons: Array<{
      dungeonId: number;
      dungeonName: string;
      requiredCompletions: number;
    }>;
    quests: Array<{
      questId: number;
      questName: string;
    }>;
    items: Array<{
      itemId: number;
      itemName: string;
      quantity: number;
    }>;
  };
  previousClassId?: number;
  previousClass?: CharacterClass;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: number;
  user: User;
  userId: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  vitality: number;
  luck: number;
  critRate: number;
  critDamage: number;
  comboRate: number;
  counterRate: number;
  lifesteal: number;
  armorPen: number;
  dodgeRate: number;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guild {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  memberCount: number;
  level: number;
  experience: number;
  createdAt: Date;
  updatedAt: Date;
}
