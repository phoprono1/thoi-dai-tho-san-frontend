// Game Types
export interface User {
  id: number;
  username: string;
  level: number;
  experience: number;
  gold: number;
  characterClass?: CharacterClass;
  guild?: Guild;
  createdAt: Date;
  updatedAt: Date;
  isBanned?: boolean;
  isAdmin?: boolean;
  isDonor?: boolean;
}

export interface UserStats {
  id: number;
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
  currentMana: number;
  maxMana: number;
}

export interface CharacterClass {
  id: number;
  name: string;
  description: string;
  type: ClassType;
  tier: ClassTier;
  requiredLevel: number;
  statBonuses: StatBonuses;
  skillUnlocks: SkillUnlock[];
  advancementRequirements?: AdvancementRequirements;
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
}

export interface StatBonuses {
  strength?: number;
  intelligence?: number;
  dexterity?: number;
  vitality?: number;
  luck?: number;
}

export interface SkillUnlock {
  skillId: number;
  skillName: string;
  description: string;
}

export interface AdvancementRequirements {
  dungeons: DungeonRequirement[];
  quests: QuestRequirement[];
  items: ItemRequirement[];
}

export interface DungeonRequirement {
  dungeonId: number;
  dungeonName: string;
  requiredCompletions: number;
}

export interface QuestRequirement {
  questId: number;
  questName: string;
}

export interface ItemRequirement {
  itemId: number;
  itemName: string;
  quantity: number;
}

export interface Guild {
  id: number;
  name: string;
  description?: string;
  level: number;
  experience: number;
  goldFund: number;
  maxMembers: number;
  currentMembers: number;
  leaderId: number;
  leader: User;
  members: GuildMember[];
}

export interface GuildMember {
  userId: number;
  user: User;
  role: GuildRole | string;
  contributionGold: number;
  honorPoints: number;
  joinedAt: Date;
}

// Mirror backend roles
export enum GuildMemberRole {
  LEADER = 'LEADER',
  DEPUTY = 'DEPUTY',
  ELDER = 'ELDER',
  MEMBER = 'MEMBER',
}

export enum GuildRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  MEMBER = 'member',
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  QUEST = 'quest',
}

export enum ConsumableType {
  HP_POTION = 'hp_potion',
  MP_POTION = 'mp_potion',
  EXP_POTION = 'exp_potion',
  STAT_BOOST = 'stat_boost',
}

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  consumableType?: ConsumableType;
  rarity: number;
  stats: ItemStats;
  price: number;
  tradable?: boolean;
  consumableValue?: number; // For consumables: HP restore amount, EXP amount, etc.
  duration?: number; // For stat boost duration in minutes
  setId?: number; // Reference to ItemSet
  itemSet?: ItemSet; // Populated when querying with relations
  classRestrictions?: ClassRestrictions; // Class restrictions for this item
}

export interface ClassRestrictions {
  allowedClassTypes?: ClassType[]; // Class types that can use this item
  restrictedClassTypes?: ClassType[]; // Class types that cannot use this item
  requiredLevel?: number; // Minimum level required
  requiredTier?: ClassTier; // Minimum tier required (BASIC, ADVANCED, MASTER, LEGENDARY)
  description?: string; // Description of restrictions
}

export interface ItemSet {
  id: number;
  name: string;
  description?: string;
  rarity: number;
  setBonuses: SetBonus[];
  items: Item[]; // Items in this set
  createdAt: Date;
  updatedAt: Date;
}

export interface SetBonus {
  pieces: number; // Number of pieces required for this bonus
  type: 'flat' | 'percentage'; // Type of bonus
  stats: ItemStats; // Bonus stats
  description: string; // Description of the bonus
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  hp?: number;
  critRate?: number;
  critDamage?: number;
  comboRate?: number;
  counterRate?: number;
  lifesteal?: number;
  armorPen?: number;
  dodgeRate?: number;
  accuracy?: number;
  // For stat boost consumables
  strength?: number;
  intelligence?: number;
  dexterity?: number;
  vitality?: number;
  luck?: number;
}

export interface UserItem {
  id: number;
  userId: number;
  itemId: number;
  item: Item;
  quantity: number;
  upgradeLevel: number;
  maxUpgradeLevel: number;
  upgradeStats: ItemStats;
  isEquipped: boolean;
}

export interface Dungeon {
  id: number;
  name: string;
  enemies: DungeonEnemy[];
  levelRequirement: number;
  isHidden: boolean;
  requiredItem?: string;
  dropItems: DungeonDrop[];
}

export interface DungeonEnemy {
  name: string;
  hp: number;
  attack: number;
  defense?: number;
  critRate?: number;
  dodgeRate?: number;
}

export interface DungeonDrop {
  itemId: number;
  dropRate: number;
}

export interface CombatResult {
  id: number;
  dungeonId: number;
  dungeon: Dungeon;
  userIds: number[];
  result: CombatResultType;
  duration: number;
  rewards: CombatRewards;
  teamStats: TeamStats;
  logs: CombatLog[];
  createdAt: Date;
}

export enum CombatResultType {
  VICTORY = 'victory',
  DEFEAT = 'defeat',
}

export interface CombatRewards {
  experience: number;
  gold: number;
  items: RewardItem[];
}

export interface RewardItem {
  itemId: number;
  quantity: number;
}

export interface TeamStats {
  totalHp: number;
  currentHp: number;
  members: TeamMember[];
}

export interface TeamMember {
  userId: number;
  username: string;
  hp: number;
  maxHp: number;
}

export interface CombatLog {
  turn: number;
  actionOrder: number;
  action: string;
  userId: number;
  details: CombatLogDetails;
}

export interface CombatLogDetails {
  actor: 'player' | 'enemy';
  actorName: string;
  targetName: string;
  targetIndex?: number;
  damage?: number;
  healing?: number;
  skillId?: string;
  skillName?: string;
  isCritical?: boolean;
  isMiss?: boolean;
  hpBefore: number;
  hpAfter: number;
  description: string;
  effects?: string[];
  flags?: {
    crit?: boolean;
    lifesteal?: number;
    armorPen?: number;
    dodge?: boolean;
    counter?: boolean;
    comboIndex?: number;
  };
}

export interface WorldBoss {
  id: number;
  name: string;
  description: string;
  maxHp: number;
  currentHp: number;
  level: number;
  stats: BossStats;
  status: BossStatus;
  respawnTime?: Date;
  spawnCount: number;
  durationMinutes: number;
  endTime?: Date;
  rewards: BossRewards;
}

export interface BossStats {
  attack: number;
  defense: number;
  critRate: number;
  critDamage: number;
}

export enum BossStatus {
  ALIVE = 'alive',
  DEAD = 'dead',
  RESPAWNING = 'respawning',
}

export interface BossRewards {
  gold: number;
  experience: number;
  items: BossRewardItem[];
}

export interface BossRewardItem {
  itemId: number;
  quantity: number;
  dropRate: number;
}

export interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  type: ChatType;
  guildId?: number;
  createdAt: Date;
}

export enum ChatType {
  WORLD = 'world',
  GUILD = 'guild',
}

export interface UserStamina {
  userId: number;
  currentStamina: number;
  maxStamina: number;
  lastRegenTime: Date;
}

export interface Level {
  level: number;
  experienceRequired: number;
  name: string;
  rewards: LevelRewards;
}

export interface LevelRewards {
  gold?: number;
  items?: RewardItem[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface CreateGuildForm {
  name: string;
  description?: string;
}

export interface SendMessageForm {
  message: string;
  type: ChatType;
  guildId?: number;
}

// Skill Types
export type SkillId = string;

export interface SkillEffect {
  statBonuses?: {
    attack?: number;
    defense?: number;
    maxHp?: number;
    critRate?: number;
    critDamage?: number;
    dodgeRate?: number;
    accuracy?: number;
    lifesteal?: number;
    armorPen?: number;
    comboRate?: number;
  };
  specialEffects?: string[];
  // For active skills
  damage?: number;
  healing?: number;
  buffDuration?: number;
  debuffDuration?: number;
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  maxLevel: number;
  requiredAttribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK';
  requiredAttributeValue: number;
  requiredLevel: number;
  skillPointCost: number;
  effects: {
    [level: number]: SkillEffect;
  };
  isActive: boolean;
  sortOrder: number;
  category?: string;
  skillType: 'passive' | 'active' | 'toggle';
  manaCost?: number;
  cooldown?: number;
  targetType?: 'self' | 'enemy' | 'ally' | 'aoe_enemies' | 'aoe_allies';
  damageType?: 'physical' | 'magical';
  damageFormula?: string;
  healingFormula?: string;
}

export interface PlayerSkill {
  id: number;
  userId: number;
  skillDefinitionId: number;
  skillDefinition: SkillDefinition;
  level: number;
  unlockedAt: string;
  updatedAt: string;
}

export interface SkillEffectSummary {
  userId: number;
  skillEffects: Record<string, SkillEffect>;
  totalStatBonuses: {
    attack?: number;
    defense?: number;
    maxHp?: number;
    critRate?: number;
    critDamage?: number;
    dodgeRate?: number;
    accuracy?: number;
    lifesteal?: number;
    armorPen?: number;
    comboRate?: number;
  };
}
