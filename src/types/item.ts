export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
}

export enum ItemRarity {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  /** Optional URL to the item's image/thumbnail served by backend */
  image?: string | null;
  stats: {
    // Base stats
    attack?: number;
    defense?: number;
    hp?: number;
    // Advanced stats
    critRate?: number; // Bạo kích (%)
    critDamage?: number; // Sát thương bạo kích (%)
    comboRate?: number; // Liên kích (%)
    counterRate?: number; // Phản kích (%)
    lifesteal?: number; // Hút máu (%)
    armorPen?: number; // Xuyên giáp (%)
    dodgeRate?: number; // Né tránh (%)
    accuracy?: number; // Chính xác (%)
  } | null;
  price: number;
  createdAt: string;
  updatedAt: string;
}
