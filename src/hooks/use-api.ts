import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, userApi, gameApi, guildApi, chatApi, itemsApi, characterClassesApi } from '@/lib/api-client';

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
      }
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.register(username, password),
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

// User hooks
export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId,
  });
};

export const useUserStats = (userId: number) => {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => userApi.getUserStats(userId),
    enabled: !!userId,
  });
};

export const useUserItems = (userId: number) => {
  return useQuery({
    queryKey: ['userItems', userId],
    queryFn: () => userApi.getUserItems(userId),
    enabled: !!userId,
  });
};

export const useUserStamina = (userId: number) => {
  return useQuery({
    queryKey: ['userStamina', userId],
    queryFn: () => userApi.getUserStamina(userId),
    enabled: !!userId,
  });
};

// Game hooks
export const useDungeons = () => {
  return useQuery({
    queryKey: ['dungeons'],
    queryFn: gameApi.getDungeons,
  });
};

export const useDungeon = (dungeonId: number) => {
  return useQuery({
    queryKey: ['dungeon', dungeonId],
    queryFn: () => gameApi.getDungeon(dungeonId),
    enabled: !!dungeonId,
  });
};

export const useStartCombat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, dungeonId }: { userIds: number[]; dungeonId: number }) =>
      gameApi.startCombat(userIds, dungeonId),
    onSuccess: () => {
  // Invalidate related queries and ensure immediate refresh of user data
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['userStamina'] });
  queryClient.invalidateQueries({ queryKey: ['user-stamina'] });
  queryClient.invalidateQueries({ queryKey: ['userItems'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
    },
  });
};

export const useCombatHistory = (userId: number) => {
  return useQuery({
    queryKey: ['combatHistory', userId],
    queryFn: () => gameApi.getCombatHistory(userId),
    enabled: !!userId,
  });
};

export const useWorldBoss = () => {
  return useQuery({
    queryKey: ['worldBoss'],
    queryFn: gameApi.getWorldBoss,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useAttackWorldBoss = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, damage }: { userId: number; damage: number }) =>
      gameApi.attackWorldBoss(userId, damage),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['worldBoss'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStamina'] });
  queryClient.invalidateQueries({ queryKey: ['user-stamina'] });
    },
  });
};

// Guild hooks
export const useGuilds = () => {
  return useQuery({
    queryKey: ['guilds'],
    queryFn: guildApi.getGuilds,
  });
};

export const useGuild = (guildId: number) => {
  return useQuery({
    queryKey: ['guild', guildId],
    queryFn: () => guildApi.getGuild(guildId),
    enabled: !!guildId,
  });
};

export const useUserGuild = () => {
  return useQuery({
    queryKey: ['userGuild'],
    queryFn: () => guildApi.getUserGuild(),
  });
};

export const useCreateGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      guildApi.createGuild(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
    },
  });
};

export const useGuildRequests = (guildId: number) => {
  return useQuery({
    queryKey: ['guildRequests', guildId],
    queryFn: () => guildApi.getGuildRequests(guildId),
    enabled: !!guildId,
  });
};

export const useApproveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guildId, userId }: { guildId: number; userId: number }) => guildApi.approveMember(guildId, userId),
    onSuccess: (_data, variables) => {
      const gid = (variables as { guildId: number }).guildId;
      queryClient.invalidateQueries({ queryKey: ['guild', gid] });
      queryClient.invalidateQueries({ queryKey: ['guildRequests', gid] });
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
    },
  });
};

export const useRejectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guildId, userId }: { guildId: number; userId: number }) => guildApi.rejectMember(guildId, userId),
    onSuccess: (_data, variables) => {
      const gid = (variables as { guildId: number }).guildId;
      queryClient.invalidateQueries({ queryKey: ['guildRequests', gid] });
    },
  });
};

export const useJoinGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guildId: number) => guildApi.joinGuild(guildId),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['guilds'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['userGuild'] });
    },
  });
};

export const useLeaveGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guildId: number) => guildApi.leaveGuild(guildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guildId, userId, role }: { guildId: number; userId: number; role: string }) => guildApi.assignRole(guildId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
      queryClient.invalidateQueries({ queryKey: ['guild', 'members'] });
    },
  });
};

export const useKickMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guildId, userId }: { guildId: number; userId: number }) =>
      guildApi.kickMember(guildId, userId),
    onSuccess: (_data, variables) => {
      const gid = (variables as { guildId: number }).guildId;
      queryClient.invalidateQueries({ queryKey: ['guild', gid] });
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
    },
  });
};

export const useInviteGuild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guildId: number) => guildApi.inviteGuild(guildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldMessages'] });
    },
  });
};

export const useContribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guildId, amount }: { guildId: number; amount: number }) => guildApi.contribute(guildId, amount),
    onSuccess: (_data, variables) => {
      const gid = (variables as { guildId: number }).guildId;
      queryClient.invalidateQueries({ queryKey: ['guild', gid] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
    },
  });
};

export const useUpgradeGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guildId: number) => guildApi.upgrade(guildId),
    onSuccess: (_data, guildId) => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildId as number] });
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
      queryClient.invalidateQueries({ queryKey: ['userGuild'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
;

// Chat hooks
export const useWorldMessages = (limit = 50) => {
  return useQuery({
    queryKey: ['worldMessages', limit],
    queryFn: () => chatApi.getWorldMessages(limit),
  });
};

export const useGuildMessages = (guildId: number, limit = 50) => {
  return useQuery({
    queryKey: ['guildMessages', guildId, limit],
    queryFn: () => chatApi.getGuildMessages(guildId, limit),
    enabled: !!guildId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, type, guildId }: { message: string; type: string; guildId?: number }) =>
      chatApi.sendMessage(message, type, guildId),
    onSuccess: (_, variables) => {
      if (variables.type === 'world') {
        queryClient.invalidateQueries({ queryKey: ['worldMessages'] });
      } else if (variables.guildId) {
        queryClient.invalidateQueries({ queryKey: ['guildMessages', variables.guildId] });
      }
    },
  });
};

// Items hooks
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getItems,
  });
};

export const useBuyItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity?: number }) =>
      itemsApi.buyItem(itemId, quantity),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['userItems'] });
  queryClient.invalidateQueries({ queryKey: ['user'] }); // For gold update
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['userStamina'] });
  queryClient.invalidateQueries({ queryKey: ['user-stamina'] });
  queryClient.invalidateQueries({ queryKey: ['equipped-items'] });
    },
  });
};

export const useSellItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userItemId, quantity }: { userItemId: number; quantity?: number }) =>
      itemsApi.sellItem(userItemId, quantity),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['userItems'] });
  queryClient.invalidateQueries({ queryKey: ['user'] }); // For gold update
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['userStamina'] });
  queryClient.invalidateQueries({ queryKey: ['user-stamina'] });
  queryClient.invalidateQueries({ queryKey: ['equipped-items'] });
    },
  });
};

export const useEquipItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userItemId: number) => itemsApi.equipItem(userItemId),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['userItems'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStamina'] });
  queryClient.invalidateQueries({ queryKey: ['user-stamina'] });
  queryClient.invalidateQueries({ queryKey: ['equipped-items'] });
    },
  });
};

export const useUnequipItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userItemId: number) => itemsApi.unequipItem(userItemId),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['userItems'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStamina'] });
  queryClient.invalidateQueries({ queryKey: ['user-stamina'] });
  queryClient.invalidateQueries({ queryKey: ['equipped-items'] });
    },
  });
};

// Character Classes hooks
export const useCharacterClasses = () => {
  return useQuery({
    queryKey: ['characterClasses'],
    queryFn: characterClassesApi.getCharacterClasses,
  });
};

export const useCharacterClass = (classId: number) => {
  return useQuery({
    queryKey: ['characterClass', classId],
    queryFn: () => characterClassesApi.getCharacterClass(classId),
    enabled: !!classId,
  });
};

export const useAdvanceClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newClassId }: { userId: number; newClassId: number }) =>
      characterClassesApi.advanceClass(userId, newClassId),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['user-status'] });
  queryClient.invalidateQueries({ queryKey: ['userStats'] });
  queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });
};
