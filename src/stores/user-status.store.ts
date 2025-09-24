import { create } from 'zustand';
import { User, UserTotalCoreAttributes, UserStamina, Level, CharacterClass, UserItem } from '@/types';
import { UserStats } from '@/types/user-stats';

interface UserStatusState {
  // Data
  user: User | null;
  stats: UserStats | null;
  totalCoreAttributes: UserTotalCoreAttributes | null;
  stamina: UserStamina | null;
  currentLevel: Level | null;
  nextLevel: Level | null;
  characterClass: CharacterClass | null;
  equippedItems: UserItem[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setStats: (stats: UserStats | null) => void;
  setTotalCoreAttributes: (totalCoreAttributes: UserTotalCoreAttributes | null) => void;
  setStamina: (stamina: UserStamina | null) => void;
  setCurrentLevel: (level: Level | null) => void;
  setNextLevel: (level: Level | null) => void;
  setCharacterClass: (characterClass: CharacterClass | null) => void;
  setEquippedItems: (items: UserItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Combined actions
  setUserStatusData: (data: {
    user: User;
    stats: UserStats;
    totalCoreAttributes: UserTotalCoreAttributes;
    stamina: UserStamina;
    currentLevel: Level;
    nextLevel: Level | null;
    characterClass: CharacterClass | null;
    equippedItems: UserItem[];
  }) => void;

  clearData: () => void;
}

export const useUserStatusStore = create<UserStatusState>((set) => ({
  // Initial state
  user: null,
  stats: null,
  totalCoreAttributes: null,
  stamina: null,
  currentLevel: null,
  nextLevel: null,
  characterClass: null,
  equippedItems: [],
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setStats: (stats) => set({ stats }),
  setTotalCoreAttributes: (totalCoreAttributes) => set({ totalCoreAttributes }),
  setStamina: (stamina) => set({ stamina }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setNextLevel: (level) => set({ nextLevel: level }),
  setCharacterClass: (characterClass) => set({ characterClass }),
  setEquippedItems: (items) => set({ equippedItems: items }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Combined action
  setUserStatusData: (data) => set({
    user: data.user,
    stats: data.stats,
    totalCoreAttributes: data.totalCoreAttributes,
    stamina: data.stamina,
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    characterClass: data.characterClass,
    equippedItems: data.equippedItems,
    isLoading: false,
    error: null,
  }),

  // Clear all data
  clearData: () => set({
    user: null,
    stats: null,
    totalCoreAttributes: null,
    stamina: null,
    currentLevel: null,
    nextLevel: null,
    characterClass: null,
    equippedItems: [],
    isLoading: false,
    error: null,
  }),
}));
