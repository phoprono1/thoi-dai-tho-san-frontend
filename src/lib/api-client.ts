import axios, { AxiosRequestHeaders } from 'axios';

// API Base URL - sẽ được cấu hình từ environment
// Fallback cho production nếu env variable không được set đúng
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return envUrl || 'http://localhost:3005/api';
  }
  
  // Production - prefer environment variable, fallback to same domain
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback to same domain with /api path for production
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // SSR fallback
  return 'http://localhost:3005/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug log API URL (chỉ trong development hoặc khi cần debug)
if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.location.search.includes('debug=api'))) {
  console.log('🌐 API_BASE_URL (api-client):', API_BASE_URL);
}

// Axios instance với interceptor để xử lý /api prefix tương tự api-service.ts
export const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't force a Content-Type here. When sending FormData the browser
  // must set the correct multipart/form-data boundary header. Setting
  // 'Content-Type' globally causes FormData uploads to be sent as
  // application/json which breaks multer on the server (missing file).
});

// Request interceptor để xử lý /api prefix và auth token
api.interceptors.request.use((config) => {
  // Xử lý /api prefix logic (tương tự api-service.ts)
  if (config.url && config.baseURL) {
    const base = config.baseURL.replace(/\/$/, '');
    const baseHasApi = /\/api(?:$|\/)/.test(base);
    
    let path = config.url.startsWith('/') ? config.url : `/${config.url}`;
    
    if (baseHasApi) {
      // strip leading '/api' from path if present to avoid /api/api
      if (path.startsWith('/api/')) {
        path = path.replace(/^\/api/, '');
      }
    } else {
      // ensure path starts with '/api/'
      if (!path.startsWith('/api/')) {
        path = `/api${path}`;
      }
    }
    
    config.url = path;
  }
  
  // Add auth token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      if (!config.headers) config.headers = {} as AxiosRequestHeaders;
      (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

// Function to setup additional interceptors (call this in client component)
let additionalInterceptorsInstalled = false;

export const setupInterceptors = () => {
  if (additionalInterceptorsInstalled) return;
  additionalInterceptorsInstalled = true;

  // Response interceptor to handle errors (auth token đã được handle ở request interceptor trên)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (typeof window !== 'undefined' && error.response?.status === 401) {
        // Debug log
        console.warn('🚫 401 Unauthorized detected, current path:', window.location.pathname);
        
        // Token expired — remove known keys and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        
        // Chỉ redirect nếu KHÔNG phải đang ở trang login/register để tránh loop
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          console.log('🔄 Redirecting to login...');
          window.location.href = '/login';
        } else {
          console.log('⏸️ Already on auth page, skipping redirect to prevent loop');
        }
      }
      return Promise.reject(error);
    },
  );
};

// Install immediately on the client so early requests include Authorization header
if (typeof window !== 'undefined') {
  try {
    setupInterceptors();
  } catch (e) {
    // ignore setup failures on SSR environments
    console.warn('setupInterceptors failed', e);
  }
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username: string, password: string) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// User API
export const userApi = {
  getUser: async (userId: number) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getUserStats: async (userId: number) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },

  getUserItems: async (userId: number) => {
    const response = await api.get(`/users/${userId}/items`);
    return response.data;
  },

  getUserStamina: async (userId: number) => {
    const response = await api.get(`/users/${userId}/stamina`);
    return response.data;
  },
};

// Game API
export const gameApi = {
  getDungeons: async () => {
    const response = await api.get('/dungeons');
    return response.data;
  },

  getDungeon: async (dungeonId: number) => {
    const response = await api.get(`/dungeons/${dungeonId}`);
    return response.data;
  },

  startCombat: async (userIds: number[], dungeonId: number) => {
    const response = await api.post('/combat/start', { userIds, dungeonId });
    return response.data;
  },

  getCombatHistory: async (userId: number) => {
    const response = await api.get(`/combat/history/${userId}`);
    return response.data;
  },

  getWorldBoss: async () => {
    const response = await api.get('/world-boss');
    return response.data;
  },

  attackWorldBoss: async (userId: number, damage: number) => {
    const response = await api.post('/world-boss/attack', { userId, damage });
    return response.data;
  },
};

// Explore API
export const exploreApi = {
  startWildArea: async (preferredCount?: number) => {
    // normalize to project convention: backend base may already include /api
    const response = await api.post('/explore/wildarea/start', { preferredCount });
    return response.data;
  },
};

// Guild API
export const guildApi = {
  // NOTE: backend controller prefixes routes with /guild (singular)
  getGuilds: async () => {
    const response = await api.get('/guild');
    return response.data;
  },

  getGuild: async (guildId: number) => {
    const response = await api.get(`/guild/${guildId}`);
    return response.data;
  },

  getUserGuild: async () => {
    const response = await api.get('/guild/user/current');
    return response.data;
  },

  createGuild: async (name: string, description?: string) => {
    const response = await api.post('/guild/create', { name, description });
    return response.data;
  },

  inviteGuild: async (guildId: number) => {
    const response = await api.post(`/guild/${guildId}/invite`);
    return response.data;
  },

  joinGuild: async (guildId: number) => {
    const response = await api.post(`/guild/${guildId}/join`);
    return response.data;
  },

  approveMember: async (guildId: number, userId: number) => {
    const response = await api.post(`/guild/${guildId}/approve/${userId}`);
    return response.data;
  },
  rejectMember: async (guildId: number, userId: number) => {
    const response = await api.post(`/guild/${guildId}/reject/${userId}`);
    return response.data;
  },
  getGuildRequests: async (guildId: number) => {
    const response = await api.get(`/guild/${guildId}/requests`);
    return response.data;
  },

  contribute: async (guildId: number, amount: number) => {
    const response = await api.post(`/guild/${guildId}/contribute`, { amount });
    return response.data;
  },

  upgrade: async (guildId: number) => {
    const response = await api.post(`/guild/${guildId}/upgrade`);
    return response.data;
  },

  assignRole: async (guildId: number, userId: number, role: string) => {
    const response = await api.put(`/guild/${guildId}/assign-role/${userId}`, { role });
    return response.data;
  },

  leaveGuild: async (guildId: number) => {
    const response = await api.post(`/guild/${guildId}/leave`);
    return response.data;
  },

  kickMember: async (guildId: number, userId: number) => {
    const response = await api.post(`/guild/${guildId}/kick/${userId}`);
    return response.data;
  },

  createGuildWar: async (guildId: number, opponentGuildId: number, scheduledAt?: string) => {
    const response = await api.post(`/guild/${guildId}/create-guild-war`, { opponentGuildId, scheduledAt });
    return response.data;
  },
};

// Chat API
export const chatApi = {
  getWorldMessages: async (limit = 50) => {
    const response = await api.get(`/chat/world?limit=${limit}`);
    return response.data;
  },

  getGuildMessages: async (guildId: number, limit = 50) => {
    const response = await api.get(`/chat/guild/${guildId}?limit=${limit}`);
    return response.data;
  },

  sendMessage: async (message: string, type: string, guildId?: number) => {
    const response = await api.post('/chat/send', { message, type, guildId });
    return response.data;
  },
};

// Items API
export const itemsApi = {
  getItems: async () => {
    const response = await api.get('/items');
    return response.data;
  },

  getItem: async (itemId: number) => {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  },

  buyItem: async (itemId: number, quantity = 1) => {
    const response = await api.post('/items/buy', { itemId, quantity });
    return response.data;
  },

  sellItem: async (userItemId: number, quantity = 1) => {
    const response = await api.post('/items/sell', { userItemId, quantity });
    return response.data;
  },

  equipItem: async (userItemId: number) => {
    const response = await api.post(`/items/${userItemId}/equip`);
    return response.data;
  },

  unequipItem: async (userItemId: number) => {
    const response = await api.post(`/items/${userItemId}/unequip`);
    return response.data;
  },

  upgradeItem: async (userItemId: number) => {
    const response = await api.post(`/items/${userItemId}/upgrade`);
    return response.data;
  },
};

// Levels API
export const levelsApi = {
  getLevels: async () => {
    const response = await api.get('/levels');
    return response.data;
  },

  getLevel: async (level: number) => {
    const response = await api.get(`/levels/${level}`);
    return response.data;
  },
};

// Character Classes API
export const characterClassesApi = {
  getCharacterClasses: async () => {
    const response = await api.get('/character-classes');
    return response.data;
  },

  getCharacterClass: async (classId: number) => {
    const response = await api.get(`/character-classes/${classId}`);
    return response.data;
  },
  advanceClass: async (userId: number, newClassId: number) => {
    const response = await api.post('/character-classes/advance', {
      userId,
      newClassId,
    });
    return response.data;
  },

  // New: perform advancement (server validates requirements and consumes items)
  performAdvancement: async (userId: number, targetClassId: number) => {
    const response = await api.post('/character-classes/advancement/perform', {
      userId,
      targetClassId,
    });
    return response.data;
  },
  // Server-authoritative awaken: pick a Tier 1 class for the authenticated user
  awaken: async () => {
    const response = await api.post('/character-classes/advancement/awaken');
    return response.data;
  },
  // Get available advancements for current authenticated user
  getAvailableAdvancements: async () => {
    const response = await api.get('/character-classes/advancement/available');
    return response.data;
  },

  // Pending advancement APIs
  getPendingAdvancement: async () => {
    const response = await api.get('/character-classes/advancement/pending');
    return response.data;
  },

  acceptPendingAdvancement: async () => {
    const response = await api.post('/character-classes/advancement/pending/accept');
    return response.data;
  },

  clearPendingAdvancement: async () => {
    const response = await api.delete('/character-classes/advancement/pending');
    return response.data;
  },

  createPendingAdvancement: async (data: any) => {
    const response = await api.post('/character-classes/advancement/pending/create', data);
    return response.data;
  },

  checkAdvancementRequirements: async (targetClassId: number) => {
    const response = await api.get(`/character-classes/advancement/check/${targetClassId}`);
    return response.data;
  },
};

// Skills API
export const skillsApi = {
  getPlayerSkills: async () => {
    const response = await api.get('/skills');
    return response.data;
  },

  getAvailableSkills: async () => {
    const response = await api.get('/skills/available');
    return response.data;
  },

  unlockSkill: async (skillId: string) => {
    const response = await api.post(`/skills/unlock/${skillId}`);
    return response.data;
  },

  levelUpSkill: async (skillId: string) => {
    const response = await api.post(`/skills/level-up/${skillId}`);
    return response.data;
  },

  getSkillEffects: async () => {
    const response = await api.get('/skills/effects');
    return response.data;
  },
};

// User Attributes API
export const userAttributesApi = {
  getUserAttributes: async () => {
    const response = await api.get('/user-attributes');
    return response.data;
  },

  allocateAttributePoint: async (attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK') => {
    const response = await api.post('/user-attributes/allocate', { attribute });
    return response.data;
  },

  resetAttributePoints: async () => {
    const response = await api.post('/user-attributes/reset');
    return response.data;
  },

  allocateMultipleAttributePoints: async (allocations: Record<'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', number>) => {
    const response = await api.post('/user-attributes/allocate-multiple', { allocations });
    return response.data;
  },

  recalculateAttributePoints: async () => {
    const response = await api.post('/user-attributes/recalculate');
    return response.data;
  },
};

// Giftcode API
export const giftcodeApi = {
  create: async (payload: { code: string; rewards: { gold?: number; items?: Array<{ itemId: number; quantity: number }> }; usesAllowed?: number; expiresAt?: string | null }) => {
    const response = await api.post('/giftcode/create', payload);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/giftcode/list');
    return response.data;
  },

  redeem: async (code: string) => {
    const response = await api.post('/giftcode/redeem', { code });
    return response.data;
  },
};

// Daily Login API
export const dailyLoginApi = {
  getStatus: async () => {
    const response = await api.get('/daily-login/status');
    return response.data;
  },

  claim: async () => {
    const response = await api.post('/daily-login/claim');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/daily-login/history');
    return response.data;
  },

  getConfig: async () => {
    const response = await api.get('/daily-login/config');
    return response.data;
  },
};

// Titles API
export const titlesApi = {
  getAllTitles: async () => {
    const response = await api.get('/titles');
    return response.data;
  },

  getUserTitles: async () => {
    const response = await api.get('/titles/my-titles');
    return response.data;
  },

  getEquippedTitle: async () => {
    const response = await api.get('/titles/equipped');
    return response.data;
  },

  equipTitle: async (titleId: number) => {
    const response = await api.post(`/titles/equip/${titleId}`);
    return response.data;
  },

  unequipTitle: async () => {
    const response = await api.post('/titles/unequip');
    return response.data;
  },

  checkRequirements: async (titleId: number) => {
    const response = await api.get(`/titles/check-requirements/${titleId}`);
    return response.data;
  },

  checkAndUnlock: async () => {
    const response = await api.post('/titles/check-and-unlock');
    return response.data;
  },
};
