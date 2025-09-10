/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

// Admin-specific API client without auth interceptors
export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor to add admin headers if needed
adminApi.interceptors.request.use((config) => {
  // Add admin-specific headers here if backend requires them
  config.headers['X-Admin-Access'] = 'true';
  return config;
});

// Response interceptor that doesn't redirect - just logs errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Admin API Error:', error.response?.data || error.message);
    // Don't redirect, let components handle errors
    return Promise.reject(error);
  },
);

// Admin API endpoints
export const adminApiEndpoints = {
  // Users
  getUsers: () => adminApi.get('/users'),
  getUser: (id: number) => adminApi.get(`/users/${id}`),
  createUser: (data: any) => adminApi.post('/users', data),
  updateUser: (id: number, data: any) => adminApi.put(`/users/${id}`, data),
  deleteUser: (id: number) => adminApi.delete(`/users/${id}`),
  banUser: (id: number) => adminApi.post(`/users/${id}/ban`),
  unbanUser: (id: number) => adminApi.post(`/users/${id}/unban`),

  // Items
  getItems: () => adminApi.get('/items'),
  getItem: (id: number) => adminApi.get(`/items/${id}`),
  createItem: (data: any) => adminApi.post('/items', data),
  updateItem: (id: number, data: any) => adminApi.put(`/items/${id}`, data),
  deleteItem: (id: number) => adminApi.delete(`/items/${id}`),

  // Dungeons
  getDungeons: () => adminApi.get('/dungeons'),
  getDungeon: (id: number) => adminApi.get(`/dungeons/${id}`),
  createDungeon: (data: any) => adminApi.post('/dungeons', data),
  updateDungeon: (id: number, data: any) => adminApi.put(`/dungeons/${id}`, data),
  deleteDungeon: (id: number) => adminApi.delete(`/dungeons/${id}`),

  // Guilds
  getGuilds: () => adminApi.get('/guild'),
  getGuild: (id: number) => adminApi.get(`/guild/${id}`),

  // Monsters
  getMonsters: () => adminApi.get('/monsters'),
  getMonster: (id: number) => adminApi.get(`/monsters/${id}`),
  createMonster: (data: any) => adminApi.post('/monsters', data),
  updateMonster: (id: number, data: any) => adminApi.put(`/monsters/${id}`, data),
  deleteMonster: (id: number) => adminApi.delete(`/monsters/${id}`),

  // Combat Results
  getCombatResults: () => adminApi.get('/combat'),
  getCombatResult: (id: number) => adminApi.get(`/combat/${id}`),

  // Quests
  getQuests: () => adminApi.get('/quests'),
  getQuest: (id: number) => adminApi.get(`/quests/${id}`),
  createQuest: (data: any) => adminApi.post('/quests', data),
  updateQuest: (id: number, data: any) => adminApi.put(`/quests/${id}`, data),
  deleteQuest: (id: number) => adminApi.delete(`/quests/${id}`),

  // Character Classes
  getCharacterClasses: () => adminApi.get('/character-classes'),
  getCharacterClass: (id: number) => adminApi.get(`/character-classes/${id}`),
  createCharacterClass: (data: any) => adminApi.post('/character-classes', data),
  updateCharacterClass: (id: number, data: any) => adminApi.put(`/character-classes/${id}`, data),
  deleteCharacterClass: (id: number) => adminApi.delete(`/character-classes/${id}`),

  // World Boss
  getWorldBoss: () => adminApi.get('/world-boss/current'),
  createWorldBoss: (data: any) => adminApi.post('/world-boss', data),

  // Chat
  getWorldMessages: () => adminApi.get('/chat/world'),
  getGuildMessages: (guildId: number) => adminApi.get(`/chat/guild/${guildId}`),
  deleteMessage: (messageId: number) => adminApi.delete(`/chat/message/${messageId}`),

  // Levels
  getLevels: () => adminApi.get('/levels'),
  getLevel: (id: number) => adminApi.get(`/levels/${id}`),
  createLevel: (data: any) => adminApi.post('/levels', data),
  updateLevel: (id: number, data: any) => adminApi.put(`/levels/${id}`, data),
  deleteLevel: (id: number) => adminApi.delete(`/levels/${id}`),

  // Donors
  getDonors: () => adminApi.get('/donors'),
  getDonor: (id: number) => adminApi.get(`/donors/${id}`),
  createDonor: (data: any) => adminApi.post('/donors', data),
  updateDonor: (id: number, data: any) => adminApi.put(`/donors/${id}`, data),
  deleteDonor: (id: number) => adminApi.delete(`/donors/${id}`),

  // System stats
  getSystemStats: async () => {
    try {
      const [users, items, dungeons, guilds, monsters, quests] = await Promise.allSettled([
        adminApiEndpoints.getUsers(),
        adminApiEndpoints.getItems(),
        adminApiEndpoints.getDungeons(),
        adminApiEndpoints.getGuilds(),
        adminApiEndpoints.getMonsters(),
        adminApiEndpoints.getQuests(),
      ]);

      return {
        totalUsers: users.status === 'fulfilled' ? users.value.data.length : 0,
        totalItems: items.status === 'fulfilled' ? items.value.data.length : 0,
        totalDungeons: dungeons.status === 'fulfilled' ? dungeons.value.data.length : 0,
        totalGuilds: guilds.status === 'fulfilled' ? guilds.value.data.length : 0,
        totalMonsters: monsters.status === 'fulfilled' ? monsters.value.data.length : 0,
        totalQuests: quests.status === 'fulfilled' ? quests.value.data.length : 0,
        activeCombats: 0, // TODO: implement when combat system is ready
        systemStatus: 'healthy' as const,
      };
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      return {
        totalUsers: 0,
        totalItems: 0,
        totalDungeons: 0,
        totalGuilds: 0,
        totalMonsters: 0,
        totalQuests: 0,
        activeCombats: 0,
        systemStatus: 'error' as const,
      };
    }
  },
};

export default adminApi;
