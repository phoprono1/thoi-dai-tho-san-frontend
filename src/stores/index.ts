import { create } from 'zustand';
import { User, UserStats, ChatMessage, UserStamina, CombatResult } from '@/types/game';

interface AuthState {
  user: User | null;
  userStats: UserStats | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, stats: UserStats) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateStats: (stats: Partial<UserStats>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userStats: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, stats) => set({
    user,
    userStats: stats,
    isAuthenticated: true,
    isLoading: false,
  }),

  logout: () => set({
    user: null,
    userStats: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  updateUser: (userData) => set((state) => ({
    user: state.user ? { ...state.user, ...userData } : null,
  })),

  updateStats: (statsData) => set((state) => ({
    userStats: state.userStats ? { ...state.userStats, ...statsData } : null,
  })),

  setLoading: (loading) => set({ isLoading: loading }),
}));

interface GameState {
  stamina: UserStamina | null;
  isInCombat: boolean;
  combatResult: CombatResult | null;
  selectedDungeon: number | null;
  updateStamina: (stamina: UserStamina) => void;
  setInCombat: (inCombat: boolean) => void;
  setCombatResult: (result: CombatResult | null) => void;
  setSelectedDungeon: (dungeonId: number | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  stamina: null,
  isInCombat: false,
  combatResult: null,
  selectedDungeon: null,

  updateStamina: (stamina) => set({ stamina }),
  setInCombat: (inCombat) => set({ isInCombat: inCombat }),
  setCombatResult: (result) => set({ combatResult: result }),
  setSelectedDungeon: (dungeonId) => set({ selectedDungeon: dungeonId }),
}));

interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setConnected: (connected: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isConnected: false,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  setMessages: (messages) => set({ messages }),

  setConnected: (connected) => set({ isConnected: connected }),

  clearMessages: () => set({ messages: [] }),
}));

interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalType: string | null;
  modalData: Record<string, unknown> | null;
  toggleSidebar: () => void;
  openModal: (type: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  modalOpen: false,
  modalType: null,
  modalData: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (type, data) => set({
    modalOpen: true,
    modalType: type,
    modalData: data || null,
  }),

  closeModal: () => set({
    modalOpen: false,
    modalType: null,
    modalData: null,
  }),
}));
