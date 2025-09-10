import {
  User,
  UserStats,
  UserStamina,
  Level,
  CharacterClass,
  UserItem,
  Quest,
  UserQuest,
  RoomLobby,
  Dungeon,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Get response text first to check if it's empty
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from server');
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Response text:', responseText);
      throw new Error('Invalid JSON response from server');
    }
  }

  // User Status APIs (combined data)
  async getUserStatusData(userId: number): Promise<{
    user: User;
    stats: UserStats;
    stamina: UserStamina;
    currentLevel: Level;
    nextLevel: Level | null;
    characterClass: CharacterClass | null;
    equippedItems: UserItem[];
  }> {
    const [user, stats, stamina, equippedItems] = await Promise.all([
      this.getUser(userId),
      this.getUserStats(userId),
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

    return {
      user,
      stats,
      stamina,
      currentLevel,
      nextLevel,
      characterClass: user.characterClass || null,
      equippedItems,
    };
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

  // Quest APIs
  async getUserQuests(): Promise<UserQuest[]> {
    return this.request<UserQuest[]>(`/quests/user/my-quests`);
  }

  async startQuest(questId: number): Promise<UserQuest> {
    return this.request<UserQuest>(`/quests/${questId}/start`, {
      method: 'POST',
    });
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
  }): Promise<RoomLobby> {
    return this.request<RoomLobby>('/room-lobby/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinRoomLobby(roomId: number, playerId: number): Promise<{ success: boolean; message: string; roomLobby: RoomLobby }> {
    return this.request(`/room-lobby/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
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

  async getDungeon(dungeonId: number): Promise<Dungeon> {
    return this.request<Dungeon>(`/dungeons/${dungeonId}`);
  }
}

export const apiService = new ApiService();
