import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface CombatState {
  // Current combat data
  currentCombat: {
    id: number;
    result: 'victory' | 'defeat' | 'escape';
    duration: number;
    rewards?: {
      experience?: number;
      gold?: number;
      items?: { itemId: number; quantity: number }[];
    };
    teamStats: {
      totalHp: number;
      currentHp: number;
      members: {
        userId: number;
        username: string;
        hp: number;
        maxHp: number;
        currentMana?: number;
        maxMana?: number;
      }[];
    };
    logs: Array<{
      id: number;
      userId: number;
      turn: number;
      actionOrder: number;
      action: 'attack' | 'defend' | 'skill' | 'item' | 'escape';
      details: {
        actor: 'player' | 'enemy';
        actorName: string;
        targetName: string;
        targetIndex?: number;
        damage?: number;
        healing?: number;
        skillId?: string;
        skillName?: string;
        isCritical?: boolean;
        isMiss?: boolean;
        hpBefore: number;
        hpAfter: number;
        description: string;
        effects?: string[];
        flags?: {
          crit?: boolean;
          lifesteal?: number;
          armorPen?: number;
          dodge?: boolean;
          counter?: boolean;
          comboIndex?: number;
        };
      };
    }>;
  } | null;

  // Combat UI state
  isCombatActive: boolean;
  currentTurn: number;
  currentPlayerIndex: number;

  // Actions
  setCombatResult: (combat: CombatState['currentCombat']) => void;
  clearCombat: () => void;
  setCombatActive: (active: boolean) => void;
  setCurrentTurn: (turn: number) => void;
  setCurrentPlayer: (playerIndex: number) => void;
}

export const useCombatStore = create<CombatState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    currentCombat: null,
    isCombatActive: false,
    currentTurn: 1,
    currentPlayerIndex: 0,

    // Actions
    setCombatResult: (combat) => {
      set({
        currentCombat: combat,
        isCombatActive: !!combat,
      });
    },

    clearCombat: () => {
      set({
        currentCombat: null,
        isCombatActive: false,
        currentTurn: 1,
        currentPlayerIndex: 0,
      });
    },

    setCombatActive: (active) => {
      set({ isCombatActive: active });
    },

    setCurrentTurn: (turn) => {
      set({ currentTurn: turn });
    },

    setCurrentPlayer: (playerIndex) => {
      set({ currentPlayerIndex: playerIndex });
    },
  }))
);