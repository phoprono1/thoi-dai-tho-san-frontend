import { api } from './api-client';

// Types
export interface BossSchedule {
  id: number;
  name: string;
  description?: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  isActive: boolean;
  timezone: string;
  bossTemplate: {
    name: string;
    description: string;
    level: number;
    stats: {
      attack: number;
      defense: number;
      critRate: number;
      critDamage: number;
    };
    damagePhases: {
      phase1Threshold: number;
      phase2Threshold: number;
      phase3Threshold: number;
    };
    rewards: {
      individual: {
        top1: { gold: number; experience: number; items: unknown[] };
        top2: { gold: number; experience: number; items: unknown[] };
        top3: { gold: number; experience: number; items: unknown[] };
        top4to10: { gold: number; experience: number; items: unknown[] };
        top11to30: { gold: number; experience: number; items: unknown[] };
      };
      guild: {
        top1: { gold: number; experience: number; items: unknown[] };
        top2to5: { gold: number; experience: number; items: unknown[] };
        top6to10: { gold: number; experience: number; items: unknown[] };
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorldBoss {
  id: number;
  name: string;
  description: string;
  maxHp: number;
  currentHp: number;
  level: number;
  stats: {
    attack: number;
    defense: number;
    critRate: number;
    critDamage: number;
  };
  status: string;
  displayMode: string;
  spawnCount: number;
  durationMinutes: number;
  endTime?: string;
  scheduledStartTime?: string;
  damagePhases: {
    phase1Threshold: number;
    phase2Threshold: number;
    phase3Threshold: number;
    currentPhase: number;
    totalDamageReceived: number;
  };
  rewards: {
    individual: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2: { gold: number; experience: number; items: unknown[] };
      top3: { gold: number; experience: number; items: unknown[] };
      top4to10: { gold: number; experience: number; items: unknown[] };
      top11to30: { gold: number; experience: number; items: unknown[] };
    };
    guild: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2to5: { gold: number; experience: number; items: unknown[] };
      top6to10: { gold: number; experience: number; items: unknown[] };
    };
  };
  scheduleId?: number;
  maxCombatTurns: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BossRanking {
  individual: Array<{
    rank: number;
    userId: number;
    username: string;
    totalDamage: number;
    attackCount: number;
    lastDamage: number;
  }>;
  guild: Array<{
    rank: number;
    guildId: number;
    guildName: string;
    totalDamage: number;
    attackCount: number;
    lastDamage: number;
  }>;
}

export interface CreateBossScheduleDto {
  name: string;
  description?: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  bossTemplate: {
    name: string;
    description: string;
    level: number;
    stats: {
      attack: number;
      defense: number;
      critRate: number;
      critDamage: number;
    };
    damagePhases: {
      phase1Threshold: number;
      phase2Threshold: number;
      phase3Threshold: number;
    };
    rewards: {
      individual: {
        top1: { gold: number; experience: number; items: unknown[] };
        top2: { gold: number; experience: number; items: unknown[] };
        top3: { gold: number; experience: number; items: unknown[] };
        top4to10: { gold: number; experience: number; items: unknown[] };
        top11to30: { gold: number; experience: number; items: unknown[] };
      };
      guild: {
        top1: { gold: number; experience: number; items: unknown[] };
        top2to5: { gold: number; experience: number; items: unknown[] };
        top6to10: { gold: number; experience: number; items: unknown[] };
      };
    };
  };
  isActive?: boolean;
  timezone?: string;
}

export interface CreateWorldBossDto {
  name: string;
  description: string;
  maxHp: number;
  level: number;
  stats: {
    attack: number;
    defense: number;
    critRate: number;
    critDamage: number;
  };
  durationMinutes?: number;
  image?: string;
}

export interface BossTemplate {
  id: number;
  name: string;
  description: string;
  level: number;
  image?: string;
  stats: {
    attack: number;
    defense: number;
    critRate: number;
    critDamage: number;
  };
  damagePhases: {
    phase1Threshold: number;
    phase2Threshold: number;
    phase3Threshold: number;
  };
  defaultRewards: {
    individual: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2: { gold: number; experience: number; items: unknown[] };
      top3: { gold: number; experience: number; items: unknown[] };
      top4to10: { gold: number; experience: number; items: unknown[] };
      top11to30: { gold: number; experience: number; items: unknown[] };
    };
    guild: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2to5: { gold: number; experience: number; items: unknown[] };
      top6to10: { gold: number; experience: number; items: unknown[] };
    };
  };
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBossTemplateDto {
  name: string;
  description: string;
  level: number;
  image?: string;
  stats: {
    attack: number;
    defense: number;
    critRate: number;
    critDamage: number;
  };
  damagePhases: {
    phase1Threshold: number;
    phase2Threshold: number;
    phase3Threshold: number;
  };
  defaultRewards: {
    individual: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2: { gold: number; experience: number; items: unknown[] };
      top3: { gold: number; experience: number; items: unknown[] };
      top4to10: { gold: number; experience: number; items: unknown[] };
      top11to30: { gold: number; experience: number; items: unknown[] };
    };
    guild: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2to5: { gold: number; experience: number; items: unknown[] };
      top6to10: { gold: number; experience: number; items: unknown[] };
    };
  };
  isActive?: boolean;
  category?: string;
}

export interface CreateBossFromTemplateDto {
  templateId: number;
  scheduleId?: number;
  durationMinutes?: number;
  customRewards?: {
    individual: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2: { gold: number; experience: number; items: unknown[] };
      top3: { gold: number; experience: number; items: unknown[] };
      top4to10: { gold: number; experience: number; items: unknown[] };
      top11to30: { gold: number; experience: number; items: unknown[] };
    };
    guild: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2to5: { gold: number; experience: number; items: unknown[] };
      top6to10: { gold: number; experience: number; items: unknown[] };
    };
  };
}

// Item interfaces and API
export interface Item {
  id: number;
  name: string;
  type: string;
  rarity: number;
  price?: number;
  tradable: boolean;
  stats?: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    vitality?: number;
    luck?: number;
    attack?: number;
    defense?: number;
    critRate?: number;
    critDamage?: number;
  };
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemReward {
  itemId: number;
  quantity: number;
  item?: Item; // Populated item data
}

// Items API
export const itemsApi = {
  async getAllItems(): Promise<Item[]> {
    const response = await api.get('/items');
    return response.data;
  },

  async getItemById(id: number): Promise<Item> {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  async getItemsByType(type: string): Promise<Item[]> {
    const response = await api.get(`/items/type/${type}`);
    return response.data;
  },
};

// Using api-client which already handles auth and base URL

// World Boss API
export const worldBossApi = {
  // Boss Management
  async getCurrentBoss(): Promise<WorldBoss | null> {
    const response = await api.get('/world-boss/current');
    return response.data;
  },

  async createBoss(data: CreateWorldBossDto): Promise<WorldBoss> {
    const response = await api.post('/world-boss', data);
    return response.data;
  },

  async attackBoss(): Promise<{
    success: boolean;
    damage: number;
    bossHpBefore: number;
    bossHpAfter: number;
    isBossDead: boolean;
    combatLogs?: unknown[];
    currentPhase?: number;
    totalDamageReceived?: number;
    rewards?: unknown;
    nextRespawnTime?: string;
  }> {
    const response = await api.post('/world-boss/attack', {});
    return response.data;
  },

  // Rankings
  async getBossRankings(bossId?: number): Promise<BossRanking> {
    const url = bossId ? `/world-boss/rankings/${bossId}` : '/world-boss/rankings';
    const response = await api.get(url);
    return response.data;
  },

  // Boss Schedules
  async getAllSchedules(): Promise<BossSchedule[]> {
    const response = await api.get('/world-boss/schedule');
    return response.data;
  },

  async getActiveSchedules(): Promise<BossSchedule[]> {
    const response = await api.get('/world-boss/schedule/active');
    return response.data;
  },

  async createSchedule(data: CreateBossScheduleDto): Promise<BossSchedule> {
    const response = await api.post('/world-boss/schedule', data);
    return response.data;
  },

  async updateSchedule(id: number, data: Partial<CreateBossScheduleDto>): Promise<BossSchedule> {
    const response = await api.put(`/world-boss/schedule/${id}`, data);
    return response.data;
  },

  async deleteSchedule(id: number): Promise<void> {
    await api.delete(`/world-boss/schedule/${id}`);
  },

  // Boss Templates
  async getAllTemplates(): Promise<BossTemplate[]> {
    const response = await api.get('/world-boss/template');
    return response.data;
  },

  async getActiveTemplates(): Promise<BossTemplate[]> {
    const response = await api.get('/world-boss/template/active');
    return response.data;
  },

  async createTemplate(data: CreateBossTemplateDto): Promise<BossTemplate> {
    const response = await api.post('/world-boss/template', data);
    return response.data;
  },

  async updateTemplate(id: number, data: Partial<CreateBossTemplateDto>): Promise<BossTemplate> {
    const response = await api.put(`/world-boss/template/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`/world-boss/template/${id}`);
  },

  async getTemplatesByCategory(category: string): Promise<BossTemplate[]> {
    const response = await api.get(`/world-boss/template/category/${category}`);
    return response.data;
  },

  // Enhanced Boss Management
  async createBossFromTemplate(data: CreateBossFromTemplateDto): Promise<WorldBoss> {
    const response = await api.post('/world-boss/from-template', data);
    return response.data;
  },

  async assignBossToSchedule(bossId: number, scheduleId: number): Promise<WorldBoss> {
    const response = await api.put('/world-boss/assign-schedule', { bossId, scheduleId });
    return response.data;
  },

  async removeBossFromSchedule(bossId: number): Promise<WorldBoss> {
    const response = await api.put('/world-boss/remove-schedule', { bossId });
    return response.data;
  },

  async updateBossRewards(bossId: number, customRewards: any): Promise<WorldBoss> {
    const response = await api.put(`/world-boss/${bossId}/rewards`, customRewards);
    return response.data;
  },

  async getBossesWithTemplates(): Promise<any[]> {
    const response = await api.get('/world-boss/with-templates');
    return response.data;
  },

  // Admin endpoints for ending bosses
  async endExpiredBosses(): Promise<{ message: string }> {
    const response = await api.post('/world-boss/end-expired');
    return response.data;
  },

  async endBoss(bossId: number): Promise<{ message: string }> {
    const response = await api.post(`/world-boss/${bossId}/end`);
    return response.data;
  },
};
