"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Crown, Star, MessageCircle, Shield, Coins, Zap } from 'lucide-react';
import { useGuilds, useUserGuild, useCreateGuild, useJoinGuild, useGuild, useAssignRole, useGuildRequests, useApproveMember, useRejectMember, useKickMember, useInviteGuild, useContribute } from '@/hooks/use-api';
import { useLeaveGuild, useUpgradeGuild } from '@/hooks/use-api';
import { GuildMemberRole } from '@/types/game';
// api import removed — do not expose debug tokens to players
import { useAuthStore } from '@/stores';
import { useChatStore } from '@/stores/useChatStore';
import { Guild as TGuild } from '@/types/game';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import GuildChatArea from './GuildChatArea';

export default function GuildTab() {
  const queryClient = useQueryClient();
  const { data: userGuild, isLoading: loadingUserGuild } = useUserGuild();
  const { data: guilds } = useGuilds();
  const createGuild = useCreateGuild();
  const joinGuild = useJoinGuild();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  // debug output removed for production: don't expose tokens or raw request bodies to players
  // in-app confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Treat disbanded guilds as if the user has no guild on the client
  const activeUserGuild = userGuild && (userGuild as { status?: string }).status === 'DISBANDED' ? null : userGuild;
  // If user has an active guild, fetch its details
  const { data: guildDetail, refetch: refetchMembers } = useGuild(activeUserGuild?.id ?? 0);

  const authUser = useAuthStore((s) => s.user);
  const leaveGuild = useLeaveGuild();
  const assignRole = useAssignRole();
  const [assigningMember, setAssigningMember] = useState<number | null>(null);
  const kickMember = useKickMember();
  const chat = useChatStore();
  const inviteGuild = useInviteGuild();
  const contribute = useContribute();
  const useUpgradeGuildHook = useUpgradeGuild;
  const upgradeGuild = useUpgradeGuildHook();
  const [upgradePending, setUpgradePending] = useState<{ guildId: number; cost: number; nextLevel: number } | null>(null);
  const [inviteCooldown, setInviteCooldown] = useState<number>(0);
  const [contribOpen, setContribOpen] = useState(false);
  const [contribAmount, setContribAmount] = useState<number | ''>('');
  const [contribLoading, setContribLoading] = useState(false);
  // ensure chat socket connects when viewing a guild so we get realtime updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!activeUserGuild) return;
    try {
      chat.checkAuthAndConnect();
    } catch {}
    // intentionally only run when userGuild id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserGuild?.id]);
  // Guild requests/hooks must be called unconditionally
  const guildIdForRequests = activeUserGuild?.id ?? 0;
  const { data: requests, refetch: refetchRequests } = useGuildRequests(guildIdForRequests);
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const roleLabel = (r?: string) => {
    switch (r) {
      case GuildMemberRole.LEADER:
        return 'Hội Trưởng';
      case GuildMemberRole.DEPUTY:
        return 'Hội Phó';
      case GuildMemberRole.ELDER:
        return 'Lãnh Đạo';
      default:
        return 'Thành Viên';
    }
  };

  // Stable socket event handlers: declared at top-level so identities don't change
  // between renders. These intentionally reference refetchRequests/refetchMembers
  // which are stable refs returned from react-query hooks in this component.
  const handleMemberApproved = useCallback(() => {
    void refetchRequests();
    void refetchMembers();
    toast.success('Một thành viên đã được duyệt');
  }, [refetchRequests, refetchMembers]);

  const handleJoinRequest = useCallback(() => {
    void refetchRequests();
    toast('Có yêu cầu tham gia mới');
  }, [refetchRequests]);

  const handleMemberKicked = useCallback((payload: { userId: number }) => {
    void refetchMembers();
    if (authUser?.id === payload.userId) {
      toast.error('Bạn đã bị đá khỏi công hội');
    }
  }, [refetchMembers, authUser?.id]);

  const handleJoinRejected = useCallback(() => {
    void refetchRequests();
    toast('Một yêu cầu tham gia đã bị từ chối');
  }, [refetchRequests]);

  const handleContributed = useCallback(() => {
    void refetchMembers();
    toast('Có đóng góp mới vào công quỹ');
  }, [refetchMembers]);

  const handleCreate = async () => {
    if (!authUser) return;
    // Cost 10k gold check (frontend guard)
    if ((authUser.gold ?? 0) < 10000) {
      toast.error('Bạn cần 10.000 vàng để tạo công hội');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createGuild.mutateAsync({ name, description: desc });
      // guild created successfully — invalidate cached guild queries
      try { queryClient.invalidateQueries({ queryKey: ['user', 'guild'] }); } catch {}
      // Invalidate handled by hook — refetch will show userGuild
      return;
    } catch (err: unknown) {
      console.error('[GuildTab] createGuild failed', err);
      let msg = 'Tạo công hội thất bại';
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        if (typeof e.message === 'string') msg = e.message;
  // axios errors may include response.data.message
  const axiosErr = e as { response?: { data?: { message?: string } } };
  if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message as string;
      }
      setCreateError(msg);

      // If server says user is already member of another guild, it may be a stale
      // membership attached to a DISBANDED guild. Attempt to detect and clean up
      // automatically so the player can create a new guild.
      if (msg.includes('Bạn đã là thành viên')) {
        try {
          const resp = await api.get('/guild/user/current');
          const serverGuild = resp?.data;
          if (serverGuild && serverGuild.status === 'DISBANDED') {
            try {
              await api.post(`/guild/${serverGuild.id}/leave`);
              toast.success('Công hội trước đây đã giải tán — đã cập nhật trạng thái. Thử tạo lại.');
              // refresh cached queries and retry creation once
              try { queryClient.invalidateQueries({ queryKey: ['user', 'guild'] }); } catch {}
              try {
                await createGuild.mutateAsync({ name, description: desc });
                try { queryClient.invalidateQueries({ queryKey: ['user', 'guild'] }); } catch {}
                setCreateError(null);
                toast.success('Công hội đã được tạo thành công');
                return;
              } catch (retryErr) {
                console.error('Retry createGuild failed', retryErr);
              }
            } catch (leaveErr) {
              console.error('Failed to clear disbanded guild membership', leaveErr);
              toast.error('Không thể xóa trạng thái công hội cũ — liên hệ admin');
            }
          }
        } catch (probeErr) {
          console.warn('Failed to probe user guild after create failure', probeErr);
        }
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id: number) => {
    try {
      await joinGuild.mutateAsync(id);
    } catch (err: unknown) {
      let msg = 'Yêu cầu tham gia thất bại';
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        if (typeof e.message === 'string') msg = e.message;
      }
      toast.error(msg);
    }
  };

  if (loadingUserGuild) return <div>Loading...</div>;

  // Not in a guild: show list + create (modal)
  if (!activeUserGuild) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Danh sách công hội</h2>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Tạo công hội (10.000 vàng)</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo công hội</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <label className="block">
                    <div className="text-sm mb-1">Tên công hội</div>
                    <input className="w-full px-3 py-2 border rounded" placeholder="Tên công hội" value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">Mô tả (tùy chọn)</div>
                    <textarea className="w-full px-3 py-2 border rounded" placeholder="Mô tả" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  </label>
                  {createError && <div className="text-sm text-red-600">{createError}</div>}
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    console.log('[GuildTab] Create button clicked');
                    try {
                      // log auth user snapshot and token presence
                      console.debug('[GuildTab] authUser snapshot', authUser);
                      console.debug('[GuildTab] localStorage token', typeof window !== 'undefined' ? !!localStorage.getItem('token') : false, 'auth_token', typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false);
                    } catch {
                      // ignore
                    }
                    if (!authUser) {
                      setCreateError('Bạn chưa đăng nhập');
                      return;
                    }
                    void handleCreate();
                  }} disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo (10.000 vàng)'}</Button>
                  <DialogClose asChild>
                    <Button variant="ghost">Hủy</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {guilds?.map((g: TGuild) => (
            <Card key={g.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{g.name}</CardTitle>
                  <CardDescription>Level {g.level} • {g.currentMembers}/{g.maxMembers} thành viên</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleJoin(g.id)}>Yêu cầu vào</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // In a guild: show guild details (simplified from mock)
  const g = guildDetail ?? userGuild;
  type MemberType = {
    userId: number;
    user?: { username?: string; level?: number } | null;
    role?: string;
    contributionGold?: number;
    isOnline?: boolean;
    lastActiveAt?: string;
  };
  type EventType = {
    id: number;
    title?: string;
    description?: string;
    participants?: unknown[];
    maxParticipants?: number;
    scheduledAt?: string;
  };

  const members: MemberType[] = Array.isArray(g?.members) ? (g?.members as MemberType[]) : [];
  const events: EventType[] = Array.isArray(g?.events) ? (g?.events as EventType[]) : [];


  return (
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{g.name}</CardTitle>
                <CardDescription>Level {g.level} • {g.currentMembers}/{g.maxMembers} thành viên</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Crown className="h-3 w-3 mr-1" />
              Guild
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
            {/* header content omitted above */}
            <div className="flex items-center space-x-2">
              {/* Only leader or deputy can upgrade */}
              {(g?.leaderId === authUser?.id || (g?.members || []).some((m: unknown) => {
                const mm = m as { userId?: number; role?: string } | null | undefined;
                return mm?.userId === authUser?.id && mm?.role === 'DEPUTY';
              })) && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // prepare upgrade details and open confirm dialog; do NOT perform upgrade here
                      const nextLevel = (g?.level ?? 1) + 1;
                      const cost = (g?.level ?? 1) * 5000;
                      setConfirmTitle('Nâng cấp công hội');
                      setConfirmMessage(
                        `Nâng công hội từ cấp ${g?.level ?? 1} → ${nextLevel}. Chi phí: ${cost} vàng. Lợi ích: +10 chỗ (tối đa thành viên tăng), tăng cấp: ${nextLevel}.
                        \nBạn có chắc muốn nâng cấp không?`,
                      );
                      setUpgradePending({ guildId: g.id, cost, nextLevel });
                      setConfirmAction(null);
                      setConfirmOpen(true);
                    }}
                  >
                    Nâng cấp
                  </Button>
                </>
              )}
            </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Coins className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <div className="font-bold text-yellow-700">{g.goldFund?.toLocaleString?.() ?? 0}</div>
              <div className="text-xs text-yellow-600">Kho bạc</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Star className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="font-bold text-blue-700">{members.reduce((s: number, m: MemberType) => s + (m.contributionGold || 0), 0)}</div>
              <div className="text-xs text-blue-600">Tổng đóng góp</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              className="flex-1"
              disabled={inviteCooldown > 0 || inviteGuild.status === 'pending'}
              onClick={async () => {
                if (!g?.id) return;
                try {
                  await inviteGuild.mutateAsync(g.id);
                  toast.success('Lời mời đã được phát ra chat thế giới');
                  // start client-side cooldown timer for 30s
                  setInviteCooldown(30);
                  const iv = setInterval(() => setInviteCooldown((s) => {
                    if (s <= 1) { clearInterval(iv); return 0; }
                    return s - 1;
                  }), 1000);
                } catch (err: unknown) {
                  const e = err as { response?: { data?: { message?: string } }; message?: string };
                  toast.error(e?.response?.data?.message || e?.message || 'Gửi lời mời thất bại');
                }
              }}
            >
              {inviteCooldown > 0 ? `Mời (${inviteCooldown}s)` : 'Mời'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { setContribOpen(true); }}>Đóng góp</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="members">Thành viên</TabsTrigger>
          <TabsTrigger value="events">
            Sự kiện
            {Array.isArray(requests) && requests.length > 0 ? (
              <span className="inline-block ml-2 w-2 h-2 rounded-full bg-red-500" aria-hidden />
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        {/* Ensure socket listeners are mounted for the guild while viewing any tab (members/events/chat) */}
        {typeof window !== 'undefined' && chat.socket && g?.id ? (
          <SocketListeners
            socket={chat.socket}
            guildId={g.id}
            onMemberApproved={handleMemberApproved}
            onJoinRequest={handleJoinRequest}
            onMemberKicked={handleMemberKicked}
            onJoinRejected={handleJoinRejected}
            onContributed={handleContributed}
          />
        ) : null}

        <TabsContent value="members" className="space-y-3">
          {members.map((member: MemberType) => (
            <Card key={member.userId}>
              <CardContent className="p-4">
                {/* Mobile-first responsive layout */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left side: Avatar + Info */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${member.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{member.user?.username}</h3>
                        <Badge className={`text-xs whitespace-nowrap ${member.role === 'LEADER' ? 'text-yellow-600 bg-yellow-100' : member.role === 'DEPUTY' ? 'text-blue-600 bg-blue-100' : 'text-gray-600 bg-gray-100'}`}>
                          {roleLabel(member.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">Level {member.user?.level ?? 0} • {member.contributionGold ?? 0} đóng góp</p>
                      {/* Online status on mobile */}
                      <div className={`text-xs sm:hidden ${member.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                        {member.isOnline ? 'Đang online' : member.lastActiveAt ?? 'Offline'}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Actions - stacked on mobile, inline on desktop */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    {/* Online status on desktop */}
                    <div className={`hidden sm:block text-xs whitespace-nowrap ${member.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                      {member.lastActiveAt ?? ''}
                    </div>

                    {/* Leave button */}
                    {authUser?.id === member.userId ? (
                      <Button variant="outline" size="sm" onClick={() => {
                        setConfirmTitle('Rời công hội');
                        setConfirmMessage('Bạn có chắc muốn rời công hội?');
                        setConfirmAction(async () => {
                          await leaveGuild.mutateAsync(g.id).catch((e) => toast.error(e?.response?.data?.message || 'Rời hội thất bại'));
                        });
                        setConfirmOpen(true);
                      }}>Rời</Button>
                    ) : null}

                    {/* Assign role button (leader only) */}
                    {authUser?.id === g.leaderId && authUser?.id !== member.userId ? (
                      <Button size="sm" onClick={() => { setAssigningMember(member.userId); }}>Phân chức</Button>
                    ) : null}

                    {/* Kick button (leader or deputy) */}
                    {(authUser?.id === g.leaderId || (authUser?.id && members.find(m => m.userId === authUser.id)?.role === 'DEPUTY')) && authUser?.id !== member.userId ? (
                      <Button size="sm" variant="destructive" onClick={async () => {
                        setConfirmTitle('Đuổi thành viên');
                        setConfirmMessage('Bạn có chắc muốn đuổi thành viên này?');
                        setConfirmAction(async () => {
                          try {
                            await kickMember.mutateAsync({ guildId: g.id, userId: member.userId });
                            toast.success('Đã đuổi thành viên');
                          } catch (err: unknown) {
                            const e = err as { response?: { data?: { message?: string } }; message?: string };
                            toast.error(e?.response?.data?.message || e?.message || 'Đuổi thất bại');
                          }
                        });
                        setConfirmOpen(true);
                      }}>Đuổi</Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="events" className="space-y-3">
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={async () => { await refetchRequests(); setShowRequestsModal(true); }}>Duyệt thành viên</Button>
          </div>
          {events.map((event: EventType) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{event.title}</h3>
                  </div>
                  <Badge variant="outline">{(event.participants?.length ?? 0)}/{event.maxParticipants ?? 0}</Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3">{event.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Zap className="h-4 w-4" />
                    <span>{event.scheduledAt ?? ''}</span>
                  </div>
                  <Button size="sm">Tham gia</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {showRequestsModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-4 rounded shadow-lg w-full max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">Yêu cầu tham gia</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Array.isArray(requests) && requests.length > 0 ? (
                    (requests as { id: number; userId: number; user?: { username?: string }; joinedAt?: string }[]).map((r) => (
                      <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{r.user?.username}</div>
                          <div className="text-xs text-gray-500">Yêu cầu tham gia từ {r.joinedAt ?? ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 sm:flex-none" onClick={async () => {
                            try {
                              await approveMember.mutateAsync({ guildId: g.id, userId: r.userId });
                              toast.success('Đã duyệt');
                              await refetchRequests();
                            } catch (err: unknown) {
                              const e = err as { response?: { data?: { message?: string } }; message?: string };
                              toast.error(e?.response?.data?.message || e?.message || 'Duyệt thất bại');
                            }
                          }}>Duyệt</Button>
                          <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={async () => {
                            setConfirmTitle('Từ chối yêu cầu');
                            setConfirmMessage('Bạn có chắc muốn từ chối yêu cầu này?');
                            setConfirmAction(async () => {
                              try {
                                await rejectMember.mutateAsync({ guildId: g.id, userId: r.userId });
                                toast.success('Đã từ chối');
                                await refetchRequests();
                              } catch (err: unknown) {
                                const e = err as { response?: { data?: { message?: string } }; message?: string };
                                toast.error(e?.response?.data?.message || e?.message || 'Từ chối thất bại');
                              }
                            });
                            setConfirmOpen(true);
                          }}>Từ chối</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Không có yêu cầu nào</div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" onClick={() => setShowRequestsModal(false)}>Đóng</Button>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><MessageCircle className="h-5 w-5" /><span>Chat Guild</span></CardTitle>
            </CardHeader>
              <CardContent>
                {/* Guild-scoped messages from the chat store */}
                <GuildChatArea guildId={g.id} />
              </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Assign role modal rendered here so it can access component state */}
      <AssignRoleModal
        memberId={assigningMember}
        open={!!assigningMember}
        onClose={() => setAssigningMember(null)}
        currentRole={undefined}
            onConfirm={async (role: GuildMemberRole) => {
          if (!assigningMember) return;
          try {
            await assignRole.mutateAsync({ guildId: g.id, userId: assigningMember, role });
            toast.success('Phân chức thành công');
            setAssigningMember(null);
          } catch (err: unknown) {
            let msg = 'Phân chức thất bại';
            if (err && typeof err === 'object') {
              // try to extract axios-like response message
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const maybe = err as any;
              if (maybe?.response?.data?.message) msg = String(maybe.response.data.message);
              else if (typeof maybe?.message === 'string') msg = maybe.message;
            }
            toast.error(msg);
          }
        }}
      />
      {/* Contribution modal */}
      {contribOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded shadow-lg w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">Đóng góp vàng</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">Số vàng muốn đóng góp</label>
              <input
                type="number"
                min={1}
                step={1}
                placeholder="Nhập số vàng"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => { setContribOpen(false); setContribAmount(''); }} disabled={contribLoading}>Hủy</Button>
              <Button onClick={async () => {
                if (!g?.id) return;
                if (contribAmount === '' || Number(contribAmount) <= 0) { toast.error('Vui lòng nhập số vàng hợp lệ'); return; }
                const amount = Number(contribAmount);
                // basic frontend check for user's gold
                if (authUser && typeof authUser.gold === 'number' && authUser.gold < amount) { toast.error('Bạn không đủ vàng'); return; }
                setContribLoading(true);
                try {
                  await contribute.mutateAsync({ guildId: g.id, amount });
                  toast.success('Đã đóng góp vào quỹ công hội');
                  setContribOpen(false);
                  setContribAmount('');
                } catch (err: unknown) {
                  const e = err as { response?: { data?: { message?: string } }; message?: string };
                  toast.error(e?.response?.data?.message || e?.message || 'Đóng góp thất bại');
                } finally {
                  setContribLoading(false);
                }
              }} disabled={contribLoading}>{contribLoading ? 'Đang xử lý...' : 'Xác nhận'}</Button>
            </div>
          </div>
        </div>
      ) : null}
      {/* In-app confirm dialog used for leave/kick/reject */}
      <Dialog open={confirmOpen} onOpenChange={(v) => setConfirmOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">{confirmMessage}</div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setConfirmOpen(false); setUpgradePending(null); }} disabled={confirmLoading}>Hủy</Button>
            <Button onClick={async () => {
              setConfirmLoading(true);
              try {
                if (upgradePending) {
                  try {
                    await upgradeGuild.mutateAsync(upgradePending.guildId);
                    toast.success('Công hội đã được nâng cấp');
                    void refetchMembers();
                  } catch (err: unknown) {
                    const e = err as { response?: { data?: { message?: string } }; message?: string };
                    toast.error(e?.response?.data?.message || e?.message || 'Nâng cấp thất bại');
                  }
                } else if (confirmAction) {
                  await confirmAction();
                }
              } finally {
                setConfirmLoading(false);
                setConfirmOpen(false);
                setUpgradePending(null);
              }
            }} disabled={confirmLoading}>{confirmLoading ? 'Đang xử lý...' : 'Xác nhận'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Assign role modal (render at bottom so it's outside the list mapping)
export function AssignRoleModal({ memberId, open, onClose, onConfirm, currentRole }: { memberId: number | null; open: boolean; onClose: () => void; onConfirm: (role: GuildMemberRole) => void; currentRole?: string | null }) {
  const [selected, setSelected] = useState<GuildMemberRole>(currentRole as GuildMemberRole ?? GuildMemberRole.MEMBER);
  if (!open || !memberId) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 rounded shadow-lg w-full max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-2">Phân chức</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value={GuildMemberRole.MEMBER} checked={selected === GuildMemberRole.MEMBER} onChange={() => setSelected(GuildMemberRole.MEMBER)} className="cursor-pointer" />
            <span>Thành Viên</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value={GuildMemberRole.ELDER} checked={selected === GuildMemberRole.ELDER} onChange={() => setSelected(GuildMemberRole.ELDER)} className="cursor-pointer" />
            <span>Lãnh Đạo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value={GuildMemberRole.DEPUTY} checked={selected === GuildMemberRole.DEPUTY} onChange={() => setSelected(GuildMemberRole.DEPUTY)} className="cursor-pointer" />
            <span>Hội Phó</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={() => { onConfirm(selected); }}>Xác nhận</Button>
        </div>
      </div>
    </div>
  );
}

// Socket listeners for guild events (keeps UI in sync without F5)
function SocketListeners({
  socket,
  guildId,
  onMemberApproved,
  onJoinRequest,
  onMemberKicked,
  onJoinRejected,
  onContributed,
}: {
  socket: Socket | null;
  guildId: number;
  onMemberApproved: () => void;
  onJoinRequest: () => void;
  onMemberKicked: (payload: { userId: number }) => void;
  onJoinRejected: () => void;
  onContributed: () => void;
}) {
  useEffect(() => {
    if (!socket) return;

    // join guild room
    try {
      console.time(`[Socket] attach listeners guild:${guildId}`);
      socket.emit('joinGuild', { guildId });
    } catch {}

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
      try {
        socket.emit('leaveGuild', { guildId });
      } catch {}
      console.timeEnd(`[Socket] attach listeners guild:${guildId}`);
    };
  }, [socket, guildId, onMemberApproved, onJoinRequest, onMemberKicked, onJoinRejected, onContributed]);

  return null;
}
