'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Crown,
  Star,
  MessageCircle,
  Trophy,
  Shield,
  Sword,
  UserPlus,
  Coins,
  Zap
} from 'lucide-react';

interface GuildMember {
  id: number;
  username: string;
  level: number;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  lastActive: string;
  status: 'online' | 'offline';
}

interface GuildEvent {
  id: number;
  type: 'raid' | 'pvp' | 'quest';
  title: string;
  description: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
}

export default function GuildTab() {
  // Mock data cho guild
  const guild = {
    id: 1,
    name: 'Chiến Binh Thời Đại',
    level: 5,
    memberCount: 28,
    maxMembers: 50,
    description: 'Guild dành cho những chiến binh dũng cảm!',
    leader: 'GuildMaster',
    totalContribution: 15420,
    treasury: 25000
  };

  // Mock data cho members
  const members: GuildMember[] = [
    {
      id: 1,
      username: 'GuildMaster',
      level: 25,
      role: 'leader',
      contribution: 5200,
      lastActive: 'Online',
      status: 'online'
    },
    {
      id: 2,
      username: 'WarriorX',
      level: 22,
      role: 'officer',
      contribution: 3800,
      lastActive: '2 phút trước',
      status: 'online'
    },
    {
      id: 3,
      username: 'MageQueen',
      level: 20,
      role: 'member',
      contribution: 2100,
      lastActive: '1 giờ trước',
      status: 'offline'
    },
    {
      id: 4,
      username: 'ArcherPro',
      level: 18,
      role: 'member',
      contribution: 1500,
      lastActive: '30 phút trước',
      status: 'offline'
    }
  ];

  // Mock data cho events
  const events: GuildEvent[] = [
    {
      id: 1,
      type: 'raid',
      title: 'Boss Thế Giới',
      description: 'Tham gia đánh boss thế giới cùng guild',
      participants: 15,
      maxParticipants: 20,
      startTime: '20:00 hôm nay'
    },
    {
      id: 2,
      type: 'pvp',
      title: 'Thi Đấu Guild',
      description: 'Trận đấu PvP giữa các guild',
      participants: 8,
      maxParticipants: 10,
      startTime: '19:30 hôm nay'
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'leader': return 'text-yellow-600 bg-yellow-100';
      case 'officer': return 'text-blue-600 bg-blue-100';
      case 'member': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-600' : 'text-gray-500';
  };

  const handleJoinEvent = () => {
    // TODO: Implement join event logic
  };

  const handleInviteMember = () => {
    // TODO: Implement invite member logic
  };

  const handleContribute = () => {
    // TODO: Implement contribution logic
  };

  return (
    <div className="p-4">
      {/* Guild Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{guild.name}</CardTitle>
                <CardDescription>
                  Level {guild.level} • {guild.memberCount}/{guild.maxMembers} thành viên
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Crown className="h-3 w-3 mr-1" />
              Guild
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{guild.description}</p>

          {/* Guild Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Coins className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <div className="font-bold text-yellow-700">{guild.treasury.toLocaleString()}</div>
              <div className="text-xs text-yellow-600">Kho bạc</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Star className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="font-bold text-blue-700">{guild.totalContribution.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Đóng góp</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button onClick={handleInviteMember} className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Mời
            </Button>
            <Button onClick={handleContribute} variant="outline" className="flex-1">
              <Coins className="h-4 w-4 mr-2" />
              Đóng góp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="members">Thành viên</TabsTrigger>
          <TabsTrigger value="events">Sự kiện</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      member.status === 'online' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{member.username}</h3>
                        <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                          {member.role === 'leader' ? 'Trưởng' :
                           member.role === 'officer' ? 'Phó' : 'Thành viên'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Level {member.level} • {member.contribution} đóng góp
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${getStatusColor(member.status)}`}>
                      {member.lastActive}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="events" className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {event.type === 'raid' ? (
                      <Sword className="h-5 w-5 text-red-600" />
                    ) : event.type === 'pvp' ? (
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <Star className="h-5 w-5 text-blue-600" />
                    )}
                    <h3 className="font-medium">{event.title}</h3>
                  </div>
                  <Badge variant="outline">
                    {event.participants}/{event.maxParticipants}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3">{event.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Zap className="h-4 w-4" />
                    <span>{event.startTime}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleJoinEvent}
                    disabled={event.participants >= event.maxParticipants}
                  >
                    {event.participants >= event.maxParticipants ? 'Đầy' : 'Tham gia'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat Guild</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">GM</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <p className="text-sm text-gray-900">Mọi người chuẩn bị cho boss thế giới nhé!</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">GuildMaster • 5 phút trước</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">WX</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <p className="text-sm text-gray-900">OK, mình đã sẵn sàng!</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">WarriorX • 3 phút trước</p>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button size="sm" className="px-4">
                  Gửi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
