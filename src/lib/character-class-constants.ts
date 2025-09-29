// Character Class Constants for 10-Tier System

export const CLASS_TYPES = {
  WARRIOR: 'warrior',
  MAGE: 'mage', 
  ARCHER: 'archer',
  ASSASSIN: 'assassin',
  PRIEST: 'priest',
  KNIGHT: 'knight',
  TANK: 'tank',
  HEALER: 'healer',
  SUMMONER: 'summoner',
  NECROMANCER: 'necromancer',
} as const;

export const CLASS_TIERS = {
  BASIC: 1,
  AWAKENED: 2,
  ADVANCED: 3,
  EXPERT: 4,
  MASTER: 5,
  GRANDMASTER: 6,
  LEGENDARY: 7,
  MYTHIC: 8,
  TRANSCENDENT: 9,
  GODLIKE: 10,
} as const;

export const TIER_NAMES = {
  [CLASS_TIERS.BASIC]: 'Cơ bản',
  [CLASS_TIERS.AWAKENED]: 'Thức tỉnh',
  [CLASS_TIERS.ADVANCED]: 'Tiến bộ',
  [CLASS_TIERS.EXPERT]: 'Chuyên gia',
  [CLASS_TIERS.MASTER]: 'Bậc thầy',
  [CLASS_TIERS.GRANDMASTER]: 'Đại sư',
  [CLASS_TIERS.LEGENDARY]: 'Huyền thoại',
  [CLASS_TIERS.MYTHIC]: 'Thần thoại',
  [CLASS_TIERS.TRANSCENDENT]: 'Siêu việt',
  [CLASS_TIERS.GODLIKE]: 'Thần thánh',
} as const;

export const TIER_LEVEL_RANGES = {
  [CLASS_TIERS.BASIC]: { min: 1, max: 9 },
  [CLASS_TIERS.AWAKENED]: { min: 10, max: 24 },
  [CLASS_TIERS.ADVANCED]: { min: 25, max: 49 },
  [CLASS_TIERS.EXPERT]: { min: 50, max: 74 },
  [CLASS_TIERS.MASTER]: { min: 75, max: 99 },
  [CLASS_TIERS.GRANDMASTER]: { min: 100, max: 124 },
  [CLASS_TIERS.LEGENDARY]: { min: 125, max: 149 },
  [CLASS_TIERS.MYTHIC]: { min: 150, max: 174 },
  [CLASS_TIERS.TRANSCENDENT]: { min: 175, max: 199 },
  [CLASS_TIERS.GODLIKE]: { min: 200, max: 999 },
} as const;

export const CLASS_TYPE_NAMES = {
  [CLASS_TYPES.WARRIOR]: 'Chiến binh',
  [CLASS_TYPES.MAGE]: 'Pháp sư',
  [CLASS_TYPES.ARCHER]: 'Cung thủ',
  [CLASS_TYPES.ASSASSIN]: 'Sát thủ',
  [CLASS_TYPES.PRIEST]: 'Tăng lữ',
  [CLASS_TYPES.KNIGHT]: 'Hiệp sĩ',
  [CLASS_TYPES.TANK]: 'Đấu sĩ',
  [CLASS_TYPES.HEALER]: 'Thầy chữa',
  [CLASS_TYPES.SUMMONER]: 'Triệu hồi sư',
  [CLASS_TYPES.NECROMANCER]: 'Tử linh sư',
} as const;

export const CLASS_TYPE_DESCRIPTIONS = {
  [CLASS_TYPES.WARRIOR]: 'Chiến binh - Chuyên về sức mạnh và tấn công cận chiến',
  [CLASS_TYPES.MAGE]: 'Pháp sư - Chuyên về phép thuật và sát thương phép',
  [CLASS_TYPES.ARCHER]: 'Cung thủ - Chuyên về tấn công tầm xa và độ chính xác',
  [CLASS_TYPES.ASSASSIN]: 'Sát thủ - Chuyên về tốc độ và sát thương chí mạng',
  [CLASS_TYPES.PRIEST]: 'Tăng lữ - Chuyên về hồi phục và buff',
  [CLASS_TYPES.KNIGHT]: 'Hiệp sĩ - Chuyên về phòng thủ và bảo vệ đồng đội',
  [CLASS_TYPES.TANK]: 'Đấu sĩ - Chuyên về chịu sát thương và kiểm soát',
  [CLASS_TYPES.HEALER]: 'Thầy chữa - Chuyên về hồi máu và hỗ trợ',
  [CLASS_TYPES.SUMMONER]: 'Triệu hồi sư - Chuyên về triệu hồi và điều khiển',
  [CLASS_TYPES.NECROMANCER]: 'Tử linh sư - Chuyên về phép thuật tối và hút máu',
} as const;

// Default stat suggestions (admin can override in class metadata)
export const DEFAULT_STAT_SUGGESTIONS = {
  [CLASS_TYPES.WARRIOR]: ['strength', 'vitality'] as string[],
  [CLASS_TYPES.MAGE]: ['intelligence', 'luck'] as string[],
  [CLASS_TYPES.ARCHER]: ['dexterity', 'luck'] as string[],
  [CLASS_TYPES.ASSASSIN]: ['dexterity', 'luck'] as string[],
  [CLASS_TYPES.PRIEST]: ['intelligence', 'vitality'] as string[],
  [CLASS_TYPES.KNIGHT]: ['strength', 'vitality'] as string[],
  [CLASS_TYPES.TANK]: ['vitality', 'strength'] as string[],
  [CLASS_TYPES.HEALER]: ['intelligence', 'vitality'] as string[],
  [CLASS_TYPES.SUMMONER]: ['intelligence', 'luck'] as string[],
  [CLASS_TYPES.NECROMANCER]: ['intelligence', 'vitality'] as string[],
} as const;

export const TIER_COLORS = {
  [CLASS_TIERS.BASIC]: 'text-gray-600',
  [CLASS_TIERS.AWAKENED]: 'text-green-600',
  [CLASS_TIERS.ADVANCED]: 'text-blue-600',
  [CLASS_TIERS.EXPERT]: 'text-purple-600',
  [CLASS_TIERS.MASTER]: 'text-yellow-600',
  [CLASS_TIERS.GRANDMASTER]: 'text-orange-600',
  [CLASS_TIERS.LEGENDARY]: 'text-red-600',
  [CLASS_TIERS.MYTHIC]: 'text-pink-600',
  [CLASS_TIERS.TRANSCENDENT]: 'text-indigo-600',
  [CLASS_TIERS.GODLIKE]: 'text-gradient-to-r from-yellow-400 to-red-600',
} as const;

// Helper functions
export function getTierName(tier: number): string {
  return TIER_NAMES[tier as keyof typeof TIER_NAMES] || 'Unknown';
}

export function getClassTypeName(type: string): string {
  return CLASS_TYPE_NAMES[type as keyof typeof CLASS_TYPE_NAMES] || type;
}

export function getTierLevelRange(tier: number): { min: number; max: number } {
  return TIER_LEVEL_RANGES[tier as keyof typeof TIER_LEVEL_RANGES] || { min: 1, max: 1 };
}

export function getTierColor(tier: number): string {
  return TIER_COLORS[tier as keyof typeof TIER_COLORS] || 'text-gray-600';
}

export function getDefaultStatSuggestions(type: string): string[] {
  return DEFAULT_STAT_SUGGESTIONS[type as keyof typeof DEFAULT_STAT_SUGGESTIONS] || [];
}

// All class types are now supported directly - no legacy mapping needed
