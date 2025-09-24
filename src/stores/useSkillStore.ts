import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PlayerSkill, SkillDefinition, SkillEffectSummary } from '@/types/game';

export interface SkillState {
  // Player skills data
  playerSkills: PlayerSkill[];
  availableSkills: SkillDefinition[];
  skillEffects: SkillEffectSummary | null;

  // UI state
  selectedSkill: SkillDefinition | null;
  skillCooldowns: Record<string, number>; // skillId -> remaining cooldown turns

  // Actions
  setPlayerSkills: (skills: PlayerSkill[]) => void;
  setAvailableSkills: (skills: SkillDefinition[]) => void;
  setSkillEffects: (effects: SkillEffectSummary | null) => void;
  addPlayerSkill: (skill: PlayerSkill) => void;
  updatePlayerSkill: (skillId: string, updates: Partial<PlayerSkill>) => void;
  removePlayerSkill: (skillId: string) => void;
  setSelectedSkill: (skill: SkillDefinition | null) => void;
  setSkillCooldown: (skillId: string, cooldown: number) => void;
  reduceCooldowns: () => void;
  clearCooldowns: () => void;
}

export const useSkillStore = create<SkillState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    playerSkills: [],
    availableSkills: [],
    skillEffects: null,
    selectedSkill: null,
    skillCooldowns: {},

    // Actions
    setPlayerSkills: (skills) => {
      set({ playerSkills: skills });
    },

    setAvailableSkills: (skills) => {
      set({ availableSkills: skills });
    },

    setSkillEffects: (effects) => {
      set({ skillEffects: effects });
    },

    addPlayerSkill: (skill) => {
      set((state) => ({
        playerSkills: [...state.playerSkills, skill],
      }));
    },

    updatePlayerSkill: (skillId, updates) => {
      set((state) => ({
        playerSkills: state.playerSkills.map((skill) =>
          skill.skillDefinition.id === skillId
            ? { ...skill, ...updates }
            : skill
        ),
      }));
    },

    removePlayerSkill: (skillId) => {
      set((state) => ({
        playerSkills: state.playerSkills.filter(
          (skill) => skill.skillDefinition.id !== skillId
        ),
      }));
    },

    setSelectedSkill: (skill) => {
      set({ selectedSkill: skill });
    },

    setSkillCooldown: (skillId, cooldown) => {
      set((state) => ({
        skillCooldowns: {
          ...state.skillCooldowns,
          [skillId]: cooldown,
        },
      }));
    },

    reduceCooldowns: () => {
      set((state) => ({
        skillCooldowns: Object.fromEntries(
          Object.entries(state.skillCooldowns)
            .map(([skillId, cooldown]) => [skillId, Math.max(0, (cooldown as number) - 1)])
            .filter(([, cooldown]) => (cooldown as number) > 0)
        ),
      }));
    },

    clearCooldowns: () => {
      set({ skillCooldowns: {} });
    },
  }))
);