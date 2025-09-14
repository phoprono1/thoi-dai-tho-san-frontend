"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sword, MapPin, Trophy, Target, Crown, Shield, Zap } from 'lucide-react';
// queries/mutations moved to specific pages
import { useRouter } from 'next/navigation';

interface PvPMatch {
  id: number;
  opponent: string;
  opponentLevel: number;
  betAmount: number;
  status: 'waiting' | 'ready' | 'in_progress';
}

export default function ExploreTab() {
  // user context can be used within specific pages if needed
  const router = useRouter();
  // Explore tab is now lightweight; dungeon flows moved to /dungeons

  // No room/dungeon queries here anymore; moved to /dungeons route

  // Mock data cho PvP matches (tạm thời giữ lại)
  const pvpMatches: PvPMatch[] = [
    {
      id: 1,
      opponent: 'Player123',
      opponentLevel: 8,
      betAmount: 100,
      status: 'waiting'
    },
    {
      id: 2,
      opponent: 'WarriorX',
      opponentLevel: 12,
      betAmount: 200,
      status: 'ready'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // dungeon create/join logic moved to dedicated page

  const handleJoinPvP = () => {
    // TODO: Implement join PvP match logic
  };

  const handleCreatePvP = () => {
    // TODO: Implement create PvP match logic
  };

  // Explore tab no longer manages host rooms directly

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Khám Phá</h2>
        <p className="text-gray-600">Chọn chế độ chơi để bắt đầu cuộc phiêu lưu!</p>
      </div>

      {/* Game Mode Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Dungeon Button now navigates to /dungeons to keep Explore tab lightweight */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
          onClick={() => router.push('/game/explore/dungeons')}
        >
          <MapPin className="h-8 w-8 text-blue-600" />
          <span className="font-medium">Dungeon</span>
        </Button>

        {/* Markets Button */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50 hover:border-indigo-300"
          onClick={() => router.push('/game/explore/markets')}
        >
          <MapPin className="h-8 w-8 text-indigo-600" />
          <span className="font-medium">Cửa hàng</span>
        </Button>

        {/* PvP Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-300"
            >
              <Target className="h-8 w-8 text-red-600" />
              <span className="font-medium">PvP</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-red-600" />
                <span>Chế Độ PvP</span>
              </DialogTitle>
              <DialogDescription>
                Đây là trang PvP - nơi bạn có thể đấu với các người chơi khác
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Create PvP Match Button */}
              <Button onClick={handleCreatePvP} className="w-full mb-4">
                <Target className="h-4 w-4 mr-2" />
                Tạo Trận PvP
              </Button>

              {/* PvP Matches */}
              <div className="space-y-3">
                {pvpMatches.map((match) => (
                  <Card key={match.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                            <Sword className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{match.opponent}</h3>
                            <p className="text-sm text-gray-600">Level {match.opponentLevel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-sm mb-1">
                            <Crown className="h-4 w-4 text-yellow-600" />
                            <span>{match.betAmount} Gold</span>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                            {match.status === 'waiting' ? 'Đang chờ' :
                             match.status === 'ready' ? 'Sẵn sàng' : 'Đang đấu'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          onClick={handleJoinPvP}
                          className="w-full"
                          disabled={match.status === 'in_progress'}
                        >
                          {match.status === 'waiting' ? 'Tham gia' :
                           match.status === 'ready' ? 'Bắt đầu' : 'Đang đấu'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* PvP Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Thống kê PvP</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">15</div>
                      <div className="text-sm text-gray-600">Thắng</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">8</div>
                      <div className="text-sm text-gray-600">Thua</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">65%</div>
                      <div className="text-sm text-gray-600">Tỷ lệ thắng</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* World Boss Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
            >
              <Crown className="h-8 w-8 text-purple-600" />
              <span className="font-medium">World Boss</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <span>Chế Độ World Boss</span>
              </DialogTitle>
              <DialogDescription>
                Đây là trang World Boss - nơi bạn có thể tham gia đánh boss thế giới cùng với cộng đồng
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dragon Lord</CardTitle>
                  <CardDescription>Level 50 - Boss thế giới hiện tại</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>HP:</span>
                      <span className="font-medium">2,500,000 / 3,000,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '83%' }}></div>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    <Zap className="h-4 w-4 mr-2" />
                    Tấn Công Boss
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Người tham gia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,247</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thời gian còn lại</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2h 15m</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Guild War Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300"
            >
              <Shield className="h-8 w-8 text-green-600" />
              <span className="font-medium">Guild War</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Chế Độ Guild War</span>
              </DialogTitle>
              <DialogDescription>
                Đây là trang Guild War - nơi các công hội đối đầu với nhau trong chiến tranh công hội
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chiến Tranh Công Hội</CardTitle>
                  <CardDescription>Đang diễn ra: Dragon Warriors vs Shadow Knights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">Dragon Warriors</div>
                        <div className="text-2xl font-bold">1,250</div>
                        <div className="text-sm text-gray-600">Điểm chiến thắng</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">Shadow Knights</div>
                        <div className="text-2xl font-bold">980</div>
                        <div className="text-sm text-gray-600">Điểm chiến thắng</div>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Tham Gia Guild War
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thành viên tham gia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">45/50</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thời gian</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">1h 30m</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Phần thưởng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">10,000 Gold</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
