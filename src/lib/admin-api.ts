/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

// Admin-specific API client without auth interceptors
export const adminApi = axios.create({
  // Ensure adminApi talks to the backend API prefix. The backend sets a global
  // prefix of '/api' so include it in the default base URL to avoid 404s when
  // code calls endpoints like '/gacha'. In production NEXT_PUBLIC_API_URL can
  // include the full '/api' path if desired.
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor to add admin headers if needed
adminApi.interceptors.request.use((config) => {
  // Ensure baseURL has no trailing slash
  const base = (config.baseURL || '').replace(/\/$/, '');
  // If base already ends with '/api', avoid adding another '/api' to the path
  const baseHasApi = /\/api(?:$|\/)/.test(base);

  // Normalize url to start with '/'
  const path = config.url?.startsWith('/') ? config.url : `/${config.url || ''}`;

  if (baseHasApi) {
    // base already has /api, just append path
    config.url = `${base}${path}`;
  } else {
    // base doesn't have /api, add it
    config.url = `${base}/api${path}`;
  }
  // Remove baseURL since we're building the full URL in config.url
  config.baseURL = '';

  // Add admin-specific headers here if backend requires them
  config.headers['X-Admin-Access'] = 'true';
  // Copy Authorization token from regular api client storage if present
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

// Response interceptor that doesn't redirect - just logs errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Provide clearer diagnostics for admin requests
    const status = error.response?.status;
    const data = error.response?.data;
    console.error('Admin API Error:', { status, data, message: error.message });
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
  promoteToAdmin: (id: number) => adminApi.post(`/users/${id}/promote`, { type: 'admin' }),
  demoteFromAdmin: (id: number) => adminApi.post(`/users/${id}/demote`, { type: 'admin' }),
  promoteToDonor: (id: number) => adminApi.post(`/users/${id}/promote`, { type: 'donor' }),
  demoteFromDonor: (id: number) => adminApi.post(`/users/${id}/demote`, { type: 'donor' }),
  resetUser: (id: number) => adminApi.post(`/admin/reset-user/${id}`),
  resetAllUsers: () => adminApi.post('/admin/reset-all-users'),

  // Items
  getItems: () => adminApi.get('/items'),
  getItem: (id: number) => adminApi.get(`/items/${id}`),
  createItem: (data: any) => adminApi.post('/items', data),
  updateItem: (id: number, data: any) => adminApi.put(`/items/${id}`, data),
  deleteItem: (id: number) => adminApi.delete(`/items/${id}`),
  uploadItemImage: (id: number, formData: FormData) => adminApi.post(`/uploads/items/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Story editor images
  // Accept an optional axios config (e.g., onUploadProgress) to allow progress tracking
  uploadStoryImage: (formData: FormData, config?: any) => adminApi.post('/uploads/story', formData, { headers: { 'Content-Type': 'multipart/form-data' }, ...(config || {}) }),
  exportItemsTemplate: () => adminApi.get('/admin/export/template/items', { responseType: 'blob' }),
  importItems: (formData: FormData) => adminApi.post('/admin/import/items', formData),
  exportItems: () => adminApi.get('/admin/export/items', { responseType: 'blob' }),
  createSampleItems: () => adminApi.post('/items/create-sample'),
  createSampleItemSets: () => adminApi.post('/item-sets/create-sample'),
  getItemSets: () => adminApi.get('/item-sets'),
  createItemSet: (data: any) => adminApi.post('/item-sets', data),
  updateItemSet: (id: number, data: any) => adminApi.put(`/item-sets/${id}`, data),
  deleteItemSet: (id: number) => adminApi.delete(`/item-sets/${id}`),

  // Dungeons
  getDungeons: () => adminApi.get('/dungeons'),
  getDungeon: (id: number) => adminApi.get(`/dungeons/${id}`),
  createDungeon: (data: any) => adminApi.post('/dungeons/admin', data),
  updateDungeon: (id: number, data: any) => adminApi.put(`/dungeons/admin/${id}`, data),
  deleteDungeon: (id: number) => adminApi.delete(`/dungeons/admin/${id}`),
  exportDungeonsTemplate: () => adminApi.get('/admin/export/template/dungeons', { responseType: 'blob' }),
  importDungeons: (formData: FormData) => adminApi.post('/admin/import/dungeons', formData),
  exportDungeons: () => adminApi.get('/admin/export/dungeons', { responseType: 'blob' }),

  // Guilds
  getGuilds: () => adminApi.get('/guild'),
  getGuild: (id: number) => adminApi.get(`/guild/${id}`),

  // Monsters
  getMonsters: () => adminApi.get('/monsters/admin'),
  getMonster: (id: number) => adminApi.get(`/monsters/admin/${id}`),
  createMonster: (data: any) => adminApi.post('/monsters/admin', data),
  updateMonster: (id: number, data: any) => adminApi.put(`/monsters/admin/${id}`, data),
  deleteMonster: (id: number) => adminApi.delete(`/monsters/admin/${id}`),
  exportMonstersTemplate: () => adminApi.get('/admin/export/template/monsters', { responseType: 'blob' }),
  exportMonsters: () => adminApi.get('/admin/export/monsters', { responseType: 'blob' }),
  importMonsters: (formData: FormData) => adminApi.post('/admin/import/monsters', formData),

  // Combat Results
  getCombatResults: () => adminApi.get('/combat'),
  getCombatResult: (id: number) => adminApi.get(`/combat/${id}`),

  // Quests
  getQuests: () => adminApi.get('/quests/admin'),
  getQuest: (id: number) => adminApi.get(`/quests/admin/${id}`),
  createQuest: (data: any) => adminApi.post('/quests/admin', data),
  updateQuest: (id: number, data: any) => adminApi.put(`/quests/admin/${id}`, data),
  deleteQuest: (id: number, options?: { force?: boolean }) => adminApi.delete(`/quests/admin/${id}`, { params: options }),
  exportQuestsTemplate: () => adminApi.get('/admin/export/template/quests', { responseType: 'blob' }),
  importQuests: (formData: FormData) => adminApi.post('/admin/import/quests', formData),
  exportQuests: () => adminApi.get('/admin/export/quests', { responseType: 'blob' }),

  // Character Classes
  getCharacterClasses: () => adminApi.get('/admin/character-classes'),
  getCharacterClass: (id: number) => adminApi.get(`/admin/character-classes/${id}`),
  createCharacterClass: (data: any) => adminApi.post('/admin/character-classes', data),
  updateCharacterClass: (id: number, data: any) => adminApi.put(`/admin/character-classes/${id}`, data),
  deleteCharacterClass: (id: number) => adminApi.delete(`/admin/character-classes/${id}`),
  exportCharacterClassesTemplate: () => adminApi.get('/admin/export/template/character-classes', { responseType: 'blob' }),
  exportCharacterClasses: () => adminApi.get('/admin/export/character-classes', { responseType: 'blob' }),
  importCharacterClasses: (formData: FormData) => adminApi.post('/admin/import/character-classes', formData),

  // Skills
  getSkills: () => adminApi.get('/admin/skill-definitions'),
  getSkill: (skillId: string) => adminApi.get(`/admin/skill-definitions/${skillId}`),
  createSkill: (data: any) => adminApi.post('/admin/skill-definitions', data),
  updateSkill: (skillId: string, data: any) => adminApi.put(`/admin/skill-definitions/${skillId}`, data),
  deleteSkill: (skillId: string) => adminApi.delete(`/admin/skill-definitions/${skillId}`),

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
  exportLevelsTemplate: () => adminApi.get('/admin/export/template/levels', { responseType: 'blob' }),
  exportLevels: () => adminApi.get('/admin/export/levels', { responseType: 'blob' }),
  importLevels: (formData: FormData) => adminApi.post('/admin/import/levels', formData),

  // Donors
  getDonors: () => adminApi.get('/donors'),
  getDonor: (id: number) => adminApi.get(`/donors/${id}`),
  createDonor: (data: any) => adminApi.post('/donors', data),
  updateDonor: (id: number, data: any) => adminApi.put(`/donors/${id}`, data),
  deleteDonor: (id: number) => adminApi.delete(`/donors/${id}`),

  // Daily Login
  getDailyLoginConfigs: () => adminApi.get('/daily-login/admin/configs'),
  getDailyLoginConfig: (year: number, month: number) => adminApi.get(`/daily-login/admin/config/${year}/${month}`),
  createOrUpdateDailyLoginConfig: (data: any) => adminApi.post('/daily-login/admin/config', data),

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
  // Market admin actions
  getShopItems: () => adminApi.get('/market/shop'),
  addShopItem: (data: { itemId: number; price: number; quantity?: number }) => adminApi.post('/market/shop', data),
  updateShopItem: (id: number, data: { price?: number; quantity?: number; active?: boolean }) => adminApi.patch(`/market/shop/${id}`, data),
  removeShopItem: (id: number) => adminApi.delete(`/market/shop/${id}`),

  // Room admin actions
  getRooms: () => adminApi.get('/room-lobby'),
  adminCancelRoom: (roomId: number) => adminApi.post(`/room-lobby/${roomId}/admin-cancel`),
  adminBulkCancelEmpty: () => adminApi.post('/room-lobby/admin/bulk-cancel-empty'),

  // Backfill actions
  backfillUser: (userId: number) => adminApi.post(`/admin/backfill/user/${userId}`),
  backfillBatch: () => adminApi.post('/admin/backfill/batch'),

  // Gacha / Boxes
  getGachaBoxes: () => adminApi.get('/gacha'),
  getGachaBox: (id: number) => adminApi.get(`/gacha/${id}`),
  createGachaBox: (data: any) => adminApi.post('/gacha', data),
  updateGachaBox: (id: number, data: any) => adminApi.put(`/gacha/${id}`, data),
  deleteGachaBox: (id: number) => adminApi.delete(`/gacha/${id}`),

  // Entries
  addGachaEntry: (boxId: number, data: any) => adminApi.post(`/gacha/${boxId}/entries`, data),
  updateGachaEntry: (entryId: number, data: any) => adminApi.put(`/gacha/entries/${entryId}`, data),
  deleteGachaEntry: (entryId: number) => adminApi.delete(`/gacha/entries/${entryId}`),

  // WildArea Management
  getWildAreaMonsters: () => adminApi.get('/wildarea/admin'),
  getWildAreaMonster: (id: number) => adminApi.get(`/wildarea/admin/${id}`),
  createWildAreaMonster: (data: { monsterId: number; minLevel: number; maxLevel: number; spawnWeight?: number; description?: string }) => adminApi.post('/wildarea/admin', data),
  updateWildAreaMonster: (id: number, data: { minLevel?: number; maxLevel?: number; spawnWeight?: number; description?: string; isActive?: boolean }) => adminApi.put(`/wildarea/admin/${id}`, data),
  deleteWildAreaMonster: (id: number, hard = false) => adminApi.delete(`/wildarea/admin/${id}`, { params: { hard: hard.toString() } }),
  getWildAreaStats: () => adminApi.get('/wildarea/stats'),

  // User gacha instances
  getUserGachaInstances: () => adminApi.get('/me/gacha/instances'),
  awardUserGachaInstance: (data: any) => adminApi.post('/me/gacha/instances', data),
  openUserGachaInstance: (id: number) => adminApi.post(`/me/gacha/instances/${id}/open`),

  // Pet Admin APIs
  getPetDefinitions: () => adminApi.get('/admin/pets/definitions'),
  getPetDefinition: (id: number) => adminApi.get(`/admin/pets/definitions/${id}`),
  createPetDefinition: (data: any) => adminApi.post('/admin/pets/definitions', data),
  updatePetDefinition: (id: number, data: any) => adminApi.put(`/admin/pets/definitions/${id}`, data),
  deletePetDefinition: (id: number) => adminApi.delete(`/admin/pets/definitions/${id}`),

  getPetBanners: () => adminApi.get('/admin/pets/banners'),
  getPetBanner: (id: number) => adminApi.get(`/admin/pets/banners/${id}`),
  createPetBanner: (data: any) => adminApi.post('/admin/pets/banners', data),
  updatePetBanner: (id: number, data: any) => adminApi.put(`/admin/pets/banners/${id}`, data),
  deletePetBanner: (id: number) => adminApi.delete(`/admin/pets/banners/${id}`),

  getPetEquipment: () => adminApi.get('/admin/pets/equipment'),
  getPetEquipmentItem: (id: string | number) => adminApi.get(`/admin/pets/equipment/${id}`),
  createPetEquipment: (data: any) => adminApi.post('/admin/pets/equipment', data),
  updatePetEquipment: (id: string | number, data: any) => adminApi.put(`/admin/pets/equipment/${id}`, data),
  deletePetEquipment: (id: string | number) => adminApi.delete(`/admin/pets/equipment/${id}`),

  // Pet Image Uploads
  uploadPetDefinitionImage: (id: number, formData: FormData) => adminApi.post(`/uploads/pets/definitions/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadPetBannerImage: (bannerId: number, formData: FormData) => adminApi.post(`/uploads/pets/banners/${bannerId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadPetEquipmentImage: (equipmentId: string | number, formData: FormData) => adminApi.post(`/uploads/pets/equipment/${equipmentId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Pet Image Management
  deletePetImage: (petId: number, imageIndex: number) => adminApi.delete(`/admin/pets/${petId}/images/${imageIndex}`),

  // Pet Evolution Management
  getPetEvolutions: (petId: string) => adminApi.get(`/admin/pets/${petId}/evolutions`),
  createPetEvolution: (data: any) => adminApi.post('/admin/pets/evolutions', data),
  updatePetEvolution: (id: number, data: any) => adminApi.put(`/admin/pets/evolutions/${id}`, data),
  deletePetEvolution: (id: number) => adminApi.delete(`/admin/pets/evolutions/${id}`),

  // Pet Abilities Management
  getPetAbilities: () => adminApi.get('/admin/pet-abilities'),
  getPetAbility: (id: number) => adminApi.get(`/admin/pet-abilities/${id}`),
  createPetAbility: (data: any) => adminApi.post('/admin/pet-abilities', data),
  updatePetAbility: (id: number, data: any) => adminApi.patch(`/admin/pet-abilities/${id}`, data),
  deletePetAbility: (id: number) => adminApi.delete(`/admin/pet-abilities/${id}`),

  // Story Events Management
  getStoryEvents: () => adminApi.get('/story-events'),
  getAllStoryEvents: () => adminApi.get('/story-events/admin/all'),
  getStoryEvent: (id: number) => adminApi.get(`/story-events/${id}`),
  createStoryEvent: (data: any) => adminApi.post('/story-events/admin', data),
  updateStoryEvent: (id: number, data: any) => adminApi.put(`/story-events/admin/${id}`, data),
  deleteStoryEvent: (id: number) => adminApi.delete(`/story-events/admin/${id}`),
  hardDeleteStoryEvent: (id: number) => adminApi.delete(`/story-events/admin/${id}/hard`),
  contributeStoryEventItem: (eventId: number, body: { userId: number; itemId: number; quantity?: number }) => adminApi.post(`/story-events/${eventId}/contribute-item`, body),
  getStoryEventLeaderboard: (eventId: number, limit?: number, offset?: number) => adminApi.get(`/story-events/${eventId}/leaderboard`, { params: { limit, offset } }),
  getStoryEventGlobalProgress: (eventId: number) => adminApi.get(`/story-events/${eventId}/global-progress`),
  distributeStoryEventRewards: (eventId: number, spec: any) => adminApi.post(`/story-events/${eventId}/distribute`, spec),
};

// Convenience wrapper for uploads with progress
export async function uploadStoryImage(formData: FormData, config?: any) {
  const resp = await adminApiEndpoints.uploadStoryImage(formData, config);
  return resp.data;
}

export default adminApi;
