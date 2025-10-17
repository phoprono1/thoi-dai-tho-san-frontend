import { adminApiEndpoints } from '@/lib/admin-api';

export type LeaderboardRow = {
  userId: number;
  username?: string | null;
  score: number;
  itemsContributed?: number;
  // allow passthrough for other backend fields
  [k: string]: unknown;
};

export const storyEventsService = {
  listActive: async () => {
    const res = await adminApiEndpoints.getStoryEvents();
    return res.data;
  },

  listAll: async () => {
    const res = await adminApiEndpoints.getAllStoryEvents();
    return res.data;
  },

  get: async (id: number) => {
    const res = await adminApiEndpoints.getStoryEvent(id);
    return res.data;
  },

  create: async (payload: unknown) => {
    const res = await adminApiEndpoints.createStoryEvent(payload);
    return res.data;
  },

  update: async (id: number, payload: unknown) => {
    const res = await adminApiEndpoints.updateStoryEvent(id, payload);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await adminApiEndpoints.deleteStoryEvent(id);
    return res.data;
  },

  hardDelete: async (id: number) => {
    const res = await adminApiEndpoints.hardDeleteStoryEvent(id);
    return res.data;
  },

  contributeItem: async (eventId: number, body: { userId: number; itemId: number; quantity?: number }) => {
    const res = await adminApiEndpoints.contributeStoryEventItem(eventId, body);
    return res.data;
  },

  leaderboard: async (eventId: number, limit = 50, offset = 0) => {
    const res = await adminApiEndpoints.getStoryEventLeaderboard(eventId, limit, offset);
    // Normalize rows so UI always receives a `score` field
    const rows = Array.isArray(res.data) ? (res.data as Array<Record<string, unknown>>) : [];
    const mapped: LeaderboardRow[] = rows.map((r) => {
      const parseNumeric = (val: unknown): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      
      return {
        ...r,
        score: parseNumeric(r['score'] ?? r['totalScore']),
        itemsContributed: parseNumeric(r['itemsContributed']),
        enemyKills: parseNumeric(r['enemyKills']),
        dungeonClears: parseNumeric(r['dungeonClears']),
      } as unknown as LeaderboardRow;
    });
    return mapped;
  },

  getGlobalProgress: async (eventId: number) => {
    const res = await adminApiEndpoints.getStoryEventGlobalProgress(eventId);
    return res.data || { totalDungeonClears: 0, totalEnemyKills: 0, totalItemsContributed: 0 };
  },

  distribute: async (eventId: number, spec: unknown) => {
    const res = await adminApiEndpoints.distributeStoryEventRewards(eventId, spec);
    return res.data;
  },
};
