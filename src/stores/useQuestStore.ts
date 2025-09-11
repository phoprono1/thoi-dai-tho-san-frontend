/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { UserQuest } from '@/types';
// lightweight store for quest UI state

type LocalQuestsState = UserQuest[] | null;

type QuestStore = {
  detailQuest: UserQuest | null;
  setDetailQuest: (uq: UserQuest | null) => void;
  localQuests: LocalQuestsState;
  setLocalQuests: (
    payload: LocalQuestsState | ((prev: LocalQuestsState) => LocalQuestsState),
  ) => void;
  clearLocalQuests: () => void;
};

export const useQuestStore = create<QuestStore>((set: any) => ({
  detailQuest: null,
  setDetailQuest: (uq: UserQuest | null) => set({ detailQuest: uq }),
  localQuests: null,
  setLocalQuests: (
    payload: LocalQuestsState | ((prev: LocalQuestsState) => LocalQuestsState),
  ) =>
    set((state: QuestStore) => ({
      localQuests:
        typeof payload === 'function' ? (payload as (prev: LocalQuestsState) => LocalQuestsState)(state.localQuests) : payload,
    })),
  clearLocalQuests: () => set({ localQuests: null }),
} as QuestStore));

export default useQuestStore;
