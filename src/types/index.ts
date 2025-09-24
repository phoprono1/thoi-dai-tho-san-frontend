// Forward declarations to avoid circular dependencies
import { UserStats } from './user-stats';

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

export interface UserTotalCoreAttributes {
  str: number;
  int: number;
  dex: number;
  vit: number;
  luk: number;
}

export interface UserStamina {
  id: number;
  userId: number;
  currentStamina: number;
  maxStamina: number;
  lastRegenTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Level {
  id: number;
  level: number;
  experienceRequired: number;
  name?: string;
  rewards?: {
    gold?: number;
    items?: { itemId: number; quantity: number }[];
  };
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ClassType {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ARCHER = 'archer',
  ASSASSIN = 'assassin',
  TANK = 'tank',
  HEALER = 'healer',
}

export enum ClassTier {
  BASIC = 1,
  ADVANCED = 2,
  MASTER = 3,
  LEGENDARY = 4,
  GODLIKE = 5,
}

export interface CharacterClass {
  id: number;
  name: string;
  description: string;
  type: ClassType;
  tier: ClassTier;
  requiredLevel: number;
  statBonuses: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    vitality?: number;
    luck?: number;
    critRate?: number;
    critDamage?: number;
    comboRate?: number;
    counterRate?: number;
    lifesteal?: number;
    armorPen?: number;
    dodgeRate?: number;
    accuracy?: number;
  };
  skillUnlocks: Array<{
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

export interface UserItem {
  id: number;
  user: User;
  userId: number;
  item: Item;
  itemId: number;
  quantity: number;
  upgradeLevel: number;
  maxUpgradeLevel: number;
  upgradeStats?: {
  attack?: number;
  defense?: number;
  critRate?: number;
  critDamage?: number;
  comboRate?: number;
  counterRate?: number;
  lifesteal?: number;
  armorPen?: number;
  dodgeRate?: number;
  accuracy?: number;
  // additional potential upgrade stat fields
  strength?: number;
  intelligence?: number;
  dexterity?: number;
  vitality?: number;
  luck?: number;
  hp?: number;
  maxHp?: number;
  };
  isEquipped: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: number;
  name: string;
  /** Optional URL to the item's image/thumbnail served by backend */
  image?: string | null;
  description: string;
  type: string;
  rarity: string;
  level: number;
  stats: {
    attack?: number;
    defense?: number;
    critRate?: number;
    critDamage?: number;
    comboRate?: number;
    counterRate?: number;
    lifesteal?: number;
    armorPen?: number;
    dodgeRate?: number;
    accuracy?: number;
  // additional possible item stat fields used across the UI
  strength?: number;
  intelligence?: number;
  dexterity?: number;
  vitality?: number;
  luck?: number;
  // items may provide hp or maxHp directly
  hp?: number;
  maxHp?: number;
  };
  price: number;
  isConsumable: boolean;
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

export enum QuestType {
  MAIN = 'main',
  SIDE = 'side',
  DAILY = 'daily',
  ACHIEVEMENT = 'achievement',
}

export enum QuestStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  progress: number;
  maxProgress: number;
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
  requirements: {
    level?: number;
    quests?: number[];
  };
  timeLimit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQuest {
  id: number;
  userId: number;
  questId: number;
  status: QuestStatus;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  quest: Quest;
}

export interface Dungeon {
  id: number;
  name: string;
  description: string;
  levelRequirement: number;
  maxPlayers: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomLobby {
  id: number;
  name: string;
  host: {
    id: number;
    username: string;
    level: number;
  };
  dungeon: Dungeon;
  status: 'waiting' | 'starting' | 'in_combat' | 'completed' | 'cancelled';
  currentPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomPlayer {
  id: number;
  roomLobbyId: number;
  userId: number;
  user: User;
  joinedAt: string;
  isReady: boolean;
}

export interface UserTotalCoreAttributes {
  str: number;
  int: number;
  dex: number;
  vit: number;
  luk: number;
}
