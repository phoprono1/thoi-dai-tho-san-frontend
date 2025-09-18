import { create } from 'zustand';
import { Guild, GuildMember, GuildRole } from '@/types/game';

interface GuildState {
  currentGuild: Guild | null;
  members: GuildMember[];
  loading: boolean;
  setGuild: (g: Guild | null) => void;
  setMembers: (m: GuildMember[]) => void;
  updateMemberRole: (userId: number, role: GuildRole) => void;
  clear: () => void;
}

export const useGuildStore = create<GuildState>((set) => ({
  currentGuild: null,
  members: [],
  loading: false,
  setGuild: (g) => set({ currentGuild: g }),
  setMembers: (m) => set({ members: m }),
  updateMemberRole: (userId, role) => set((s) => ({
    members: s.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
  })),
  clear: () => set({ currentGuild: null, members: [] }),
}));

export default useGuildStore;
