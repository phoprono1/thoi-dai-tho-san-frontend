import { User } from ".";

export interface UserStats {
  id: number;
  user: User;
  userId: number;
  maxHp: number;
  currentHp: number;
  currentMana?: number | null; // Nullable - initialized on first combat
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
  availableSkillPoints?: number;
  totalSkillPointsEarned?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTotalCoreAttributes {
  str: number;
  int: number;
  dex: number;
  vit: number;
  luk: number;
}
