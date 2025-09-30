import {
  User,
  UserTotalCoreAttributes,
  UserStamina,
  Level,
  CharacterClass,
  UserItem,
  Quest,
  UserQuest,
  RoomLobby,
  Dungeon,
  // Item type for fetching catalog
  Item,
} from '@/types';
import { UserStats } from '@/types/user-stats';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Ensure API_BASE_URL has no trailing slash
  const base = API_BASE_URL.replace(/\/$/, '');
    // If base already ends with '/api', avoid adding another '/api' to the path
    const baseHasApi = /\/api(?:$|\/)/.test(base);

    // Normalize endpoint to start with '/'
    let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

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

    const url = `${base}${path}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    // Add auth token if available (only in browser)
    let token: string | null = null;
    try {
      if (typeof window !== 'undefined' && window?.localStorage) {
        token = localStorage.getItem('token');
      }
    } catch {
      // ignore when running on server or restricted env
      token = null;
    }

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      // try to parse error body to extract a friendly message
      const errorText = await response.text();
      let errMsg = `API request failed: ${response.status} ${response.statusText}`;
      if (errorText) {
        try {
          const errJson = JSON.parse(errorText);
          if (errJson?.message) errMsg = String(errJson.message);
        } catch {
          // non-json error body, fallback to raw text
          errMsg = errorText;
        }
      }
      throw new Error(errMsg);
    }

    // Get response text first to check if it's empty
    const responseText = await response.text();
    
    if (!responseText) {
      throw new Error('Empty response from server');
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Response text:', responseText);
      throw new Error(`Invalid JSON response from server: ${responseText}`);
    }
  }

  // User Status APIs (combined data)
  async getUserStatusData(userId: number): Promise<{
    user: User;
    stats: UserStats;
    totalCoreAttributes: UserTotalCoreAttributes;
    stamina: UserStamina;
    currentLevel: Level;
    nextLevel: Level | null;
    characterClass: CharacterClass | null;
    equippedItems: UserItem[];
  }> {
    const [user, stats, totalCoreAttributes, stamina, equippedItems] = await Promise.all([
      this.getUser(userId),
      this.getUserStats(userId),
      this.getUserTotalCoreAttributes(userId),
      this.getUserStamina(userId),
      this.getEquippedItems(userId),
    ]);

    const currentLevel = await this.getLevel(user.level);
    let nextLevel: Level | null = null;
    try {
      nextLevel = await this.getLevel(user.level + 1);
    } catch {
      // Next level doesn't exist (max level reached)
    }

    const result = {
      user,
      stats,
      totalCoreAttributes,
      stamina,
      currentLevel,
      nextLevel,
      characterClass: user.characterClass || null,
      equippedItems,
    };
    
    return result;
  }

  // User APIs
  async getUser(userId: number): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async levelUpUser(userId: number): Promise<User> {
    return this.request<User>(`/users/${userId}/level-up`, {
      method: 'POST',
    });
  }

  // User Stats APIs
  async getUserStats(userId: number): Promise<UserStats> {
    return this.request<UserStats>(`/user-stats/user/${userId}`);
  }

  async getUserTotalCoreAttributes(userId: number): Promise<UserTotalCoreAttributes> {
    return this.request<UserTotalCoreAttributes>(`/user-stats/user/${userId}/total-stats`);
  }

  async updateUserStats(userId: number, data: Partial<UserStats>): Promise<UserStats> {
    const stats = await this.getUserStats(userId);
    return this.request<UserStats>(`/user-stats/${stats.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // User Stamina APIs
  async getUserStamina(userId: number): Promise<UserStamina> {
    return this.request<UserStamina>(`/user-stamina/${userId}`);
  }

  // Level APIs
  async getLevel(level: number): Promise<Level> {
    return this.request<Level>(`/levels/level/${level}`);
  }

  async getAllLevels(): Promise<Level[]> {
    return this.request<Level[]>('/levels');
  }

  // Character Class APIs
  async getAllCharacterClasses(): Promise<CharacterClass[]> {
    return this.request<CharacterClass[]>('/character-classes');
  }

  async getCharacterClass(classId: number): Promise<CharacterClass> {
    return this.request<CharacterClass>(`/character-classes/${classId}`);
  }

  async getAvailableAdvancements(): Promise<{
    availableAdvancements: CharacterClass[];
    lockedAdvancements: CharacterClass[];
  }> {
    return this.request('/character-classes/advancement/available');
  }

  // User Items APIs
  async getUserItems(userId: number): Promise<UserItem[]> {
    return this.request<UserItem[]>(`/user-items/user/${userId}`);
  }

  async getEquippedItems(userId: number): Promise<UserItem[]> {
    return this.request<UserItem[]>(`/user-items/equipped/${userId}`);
  }

  async equipItem(userItemId: number, equip: boolean): Promise<{
    success: boolean;
    message: string;
    userItem: UserItem;
  }> {
    return this.request(`/user-items/equip/${userItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ equip }),
    });
  }

  async useConsumableItem(userItemId: number): Promise<{
    success: boolean;
    message: string;
    effects: Record<string, number | string | boolean>;
  }> {
    return this.request(`/user-items/use/${userItemId}`, {
      method: 'POST',
    });
  }

  // Open a gacha box using a user-owned item instance (consumes the user_item and required key atomically server-side)
  async openGachaFromUserItem(userItemId: number, usedKeyItemId?: number): Promise<{ awarded?: unknown[] }> {
    // Backend route is POST /gacha/open-item/:userItemId
    const payload = typeof usedKeyItemId === 'number' ? { usedKeyItemId } : undefined;
    return this.request<{ awarded?: unknown[] }>(`/gacha/open-item/${userItemId}`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    });
  }

  // Fetch public gacha box info (entries & rates)
  async getGachaBox(boxId: number): Promise<any> {
    return this.request<any>(`/gacha/${boxId}`);
  }

  // Quest APIs
  async getUserQuests(): Promise<UserQuest[]> {
    return this.request<UserQuest[]>(`/quests/user/my-quests`);
  }

  async getQuest(id: number): Promise<Quest> {
    return this.request<Quest>(`/quests/${id}`);
  }

  async startQuest(questId: number): Promise<UserQuest> {
    return this.request<UserQuest>(`/quests/${questId}/start`, {
      method: 'POST',
    });
  }

  async checkQuestCompletion(questId: number): Promise<{ completed: boolean; userQuest?: UserQuest | null; userItems?: UserItem[] }> {
    return this.request<{ completed: boolean; userQuest?: UserQuest | null; userItems?: UserItem[] }>(`/quests/${questId}/check-completion`);
  }

  async updateQuestProgress(questId: number, progressUpdate: Record<string, unknown>): Promise<UserQuest> {
    return this.request<UserQuest>(`/quests/${questId}/update-progress`, {
      method: 'POST',
      body: JSON.stringify(progressUpdate),
    });
  }

  async claimQuest(userQuestId: number): Promise<{ message: string; user?: User | null; userQuest?: UserQuest | null; userItems?: UserItem[] }> {
    return this.request<{ message: string; user?: User | null; userQuest?: UserQuest | null; userItems?: UserItem[] }>(`/quests/${userQuestId}/claim`, {
      method: 'POST',
    });
  }

  async getQuestProgressSummary(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/quests/user/progress-summary');
  }

  async getAvailableQuests(): Promise<Quest[]> {
    return this.request<Quest[]>(`/quests/user/available`);
  }

  // Room Lobby APIs
  async getRoomLobbies(): Promise<RoomLobby[]> {
    return this.request<RoomLobby[]>('/room-lobby');
  }

  async createRoomLobby(data: {
    hostId: number;
    dungeonId: number;
    name: string;
    maxPlayers?: number;
    isPrivate?: boolean;
    password?: string;
  }): Promise<RoomLobby> {
    return this.request<RoomLobby>('/room-lobby/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinRoomLobby(roomId: number, playerId: number, password?: string): Promise<{ success: boolean; message: string; roomLobby: RoomLobby }> {
    return this.request(`/room-lobby/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerId, password }),
    });
  }

  async leaveRoomLobby(roomId: number, playerId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/room-lobby/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  }

  async startRoomCombat(roomId: number, hostId: number): Promise<{ success: boolean; message: string; combatSessionId: number }> {
    return this.request(`/room-lobby/${roomId}/start`, {
      method: 'POST',
      body: JSON.stringify({ hostId }),
    });
  }

  async getRoomLobby(roomId: number): Promise<RoomLobby> {
    return this.request<RoomLobby>(`/room-lobby/${roomId}`);
  }

  // Dungeon APIs
  async getDungeons(): Promise<Dungeon[]> {
    return this.request<Dungeon[]>('/dungeons');
  }

  // Monster APIs
  async getAllMonsters(): Promise<
    Array<{ id: number; name: string; level?: number; dropItems?: unknown[] }>
  > {
    return this.request(`/monsters`);
  }

  // Leaderboard APIs
  async getCombatLeaderboard(limit = 100): Promise<Array<{ userId: number; score: number; rank: number }>> {
    return this.request(`/user-power/leaderboard/top?limit=${limit}`) as Promise<Array<{ userId: number; score: number; rank: number }>>;
  }

  async getCombatLeaderboardAround(userId: number, radius = 5): Promise<Array<{ userId: number; score: number; rank: number }>> {
    // server endpoint: GET /user-power/leaderboard/around/:userId?radius=R
    return this.request(`/user-power/leaderboard/around/${userId}?radius=${radius}`) as Promise<
      Array<{ userId: number; score: number; rank: number }>
    >;
  }

  // Best-effort: fetch users and sort by level to produce a level leaderboard (server-side endpoint may be added later)
  async getUsersTopByLevel(
    limit = 100,
  ): Promise<Array<{ userId: number; level: number; username?: string; rank: number }>> {
    type UserSummary = { id: number; level?: number; username?: string };
    const users = await this.request<UserSummary[]>(`/users`);
    const sorted = users
      .map((u) => ({ userId: u.id, level: u.level || 0, username: u.username }))
      .sort((a, b) => b.level - a.level)
      .slice(0, limit)
      .map((u, idx) => ({ ...u, rank: idx + 1 }));
    return sorted;
  }

  // Authenticated endpoint that returns only dungeons the current user
  // meets the level requirement for.
  async getEligibleDungeons(): Promise<Dungeon[]> {
    return this.request<Dungeon[]>('/dungeons/eligible');
  }

  async getDungeon(dungeonId: number): Promise<Dungeon> {
    return this.request<Dungeon>(`/dungeons/${dungeonId}`);
  }

  // Item APIs (catalog)
  async getItems(): Promise<Item[]> {
    return this.request<Item[]>('/items');
  }
}

export const apiService = new ApiService();
