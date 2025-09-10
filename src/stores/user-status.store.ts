import { create } from 'zustand';
import { User, UserStats, UserStamina, Level, CharacterClass } from '@/types';

interface UserStatusState {
  // Data
  user: User | null;
  stats: UserStats | null;
  stamina: UserStamina | null;
  currentLevel: Level | null;
  nextLevel: Level | null;
  characterClass: CharacterClass | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setStats: (stats: UserStats | null) => void;
  setStamina: (stamina: UserStamina | null) => void;
  setCurrentLevel: (level: Level | null) => void;
  setNextLevel: (level: Level | null) => void;
  setCharacterClass: (characterClass: CharacterClass | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Combined actions
  setUserStatusData: (data: {
    user: User;
    stats: UserStats;
    stamina: UserStamina;
    currentLevel: Level;
    nextLevel: Level | null;
    characterClass: CharacterClass | null;
  }) => void;

  clearData: () => void;
}

export const useUserStatusStore = create<UserStatusState>((set) => ({
  // Initial state
  user: null,
  stats: null,
  stamina: null,
  currentLevel: null,
  nextLevel: null,
  characterClass: null,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setStats: (stats) => set({ stats }),
  setStamina: (stamina) => set({ stamina }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setNextLevel: (level) => set({ nextLevel: level }),
  setCharacterClass: (characterClass) => set({ characterClass }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Combined action
  setUserStatusData: (data) => set({
    user: data.user,
    stats: data.stats,
    stamina: data.stamina,
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    characterClass: data.characterClass,
    isLoading: false,
    error: null,
  }),

  // Clear all data
  clearData: () => set({
    user: null,
    stats: null,
    stamina: null,
    currentLevel: null,
    nextLevel: null,
    characterClass: null,
    isLoading: false,
    error: null,
  }),
}));
