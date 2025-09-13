import axios from 'axios';

// API Base URL - sẽ được cấu hình từ environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't force a Content-Type here. When sending FormData the browser
  // must set the correct multipart/form-data boundary header. Setting
  // 'Content-Type' globally causes FormData uploads to be sent as
  // application/json which breaks multer on the server (missing file).
});

// Function to setup interceptors (call this in client component)
export const setupInterceptors = () => {
  // Request interceptor để thêm auth token
  api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token'); // Fixed: use 'token' instead of 'auth_token'
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Response interceptor để handle errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (typeof window !== 'undefined' && error.response?.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('token'); // Fixed: use 'token' instead of 'auth_token'
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );
};

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

// Guild API
export const guildApi = {
  getGuilds: async () => {
    const response = await api.get('/guilds');
    return response.data;
  },

  getGuild: async (guildId: number) => {
    const response = await api.get(`/guilds/${guildId}`);
    return response.data;
  },

  createGuild: async (name: string, description?: string) => {
    const response = await api.post('/guilds', { name, description });
    return response.data;
  },

  joinGuild: async (guildId: number) => {
    const response = await api.post(`/guilds/${guildId}/join`);
    return response.data;
  },

  leaveGuild: async () => {
    const response = await api.post('/guilds/leave');
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
};
