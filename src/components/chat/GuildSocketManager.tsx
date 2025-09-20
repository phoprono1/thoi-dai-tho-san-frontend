"use client";

import { useEffect, useCallback } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useUserGuild } from '@/hooks/use-api';
import { toast } from 'sonner';
import type { Socket } from 'socket.io-client';

export default function GuildSocketManager() {
  const { data: userGuild } = useUserGuild();
  const activeUserGuild = userGuild && (userGuild as { status?: string }).status === 'DISBANDED' ? null : userGuild;

  const socket: Socket | null = useChatStore((s) => s.socket);
  const queryClient = useChatStore((s) => s.queryClient);

  const refetchRequests = useCallback(async () => {
    try { await queryClient?.invalidateQueries?.({ queryKey: ['guildRequests', activeUserGuild?.id ?? 0] }); } catch {}
  }, [queryClient, activeUserGuild?.id]);

  const refetchMembers = useCallback(async () => {
    try { await queryClient?.invalidateQueries?.({ queryKey: ['guild', activeUserGuild?.id ?? 0] }); } catch {}
  }, [queryClient, activeUserGuild?.id]);

  const onMemberApproved = useCallback(() => {
    void refetchRequests();
    void refetchMembers();
    toast.success('Một thành viên đã được duyệt');
  }, [refetchRequests, refetchMembers]);

  const onJoinRequest = useCallback(() => {
    void refetchRequests();
    toast('Có yêu cầu tham gia mới');
  }, [refetchRequests]);

  const onMemberKicked = useCallback(async (p: { userId: number }) => {
    void refetchMembers();
    try {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // dynamic import to keep ESM style
          const mod = await import('jwt-decode');
          // jwt-decode default export may be a function
          // @ts-expect-error: dynamic import typing
          const dec = (mod && mod.default) ? mod.default(token) : (mod(token) as { sub?: number });
          if (dec?.sub === p.userId) {
            toast.error('Bạn đã bị đá khỏi công hội');
          }
        } catch {}
      }
    } catch {}
  }, [refetchMembers]);

  const onJoinRejected = useCallback(() => {
    void refetchRequests();
    toast('Một yêu cầu tham gia đã bị từ chối');
  }, [refetchRequests]);

  const onContributed = useCallback(() => {
    void refetchMembers();
    toast('Có đóng góp mới vào quỹ công hội');
  }, [refetchMembers]);

  useEffect(() => {
    if (!socket) return;
    if (!activeUserGuild || !activeUserGuild.id) return;

    const gid = activeUserGuild.id as number;
    console.time(`[GuildSocketManager] attach guild:${gid}`);
    try { socket.emit('joinGuild', { guildId: gid }); } catch {}

    const approvedHandler = () => onMemberApproved();
    const joinReqHandler = () => onJoinRequest();
    const kickedHandler = (p: { userId: number }) => onMemberKicked(p);
    const rejHandler = () => onJoinRejected();
    const contribHandler = () => onContributed();

    socket.on('guildMemberApproved', approvedHandler);
    socket.on('guildJoinRequest', joinReqHandler);
    socket.on('guildMemberKicked', kickedHandler);
    socket.on('guildJoinRequestRejected', rejHandler);
    socket.on('guildContributed', contribHandler);

    return () => {
      socket.off('guildMemberApproved', approvedHandler);
      socket.off('guildJoinRequest', joinReqHandler);
      socket.off('guildMemberKicked', kickedHandler);
      socket.off('guildJoinRequestRejected', rejHandler);
      socket.off('guildContributed', contribHandler);
      try { socket.emit('leaveGuild', { guildId: gid }); } catch {}
      console.timeEnd(`[GuildSocketManager] attach guild:${gid}`);
    };
  }, [socket, activeUserGuild, onMemberApproved, onJoinRequest, onMemberKicked, onJoinRejected, onContributed]);

  return null;
}
