"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sword, MapPin, Trophy, Target, Crown, Shield, Zap, ShoppingCart, ShieldHalf, Hammer, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ExploreTab() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Hoạt động</h2>
        <p className="text-gray-600">Chọn hoạt động để bắt đầu cuộc phiêu lưu!</p>
      </div>

      {/* Game Mode Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Hầm ngục (Dungeon) */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
          onClick={() => router.push('/game/explore/dungeons')}
        >
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="font-medium">Hầm ngục</span>
        </Button>

        {/* Khu Dã Ngoại (Wild Area) — navigate to /wildarea */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-emerald-50 hover:border-emerald-300"
          onClick={async () => {
            // If auth is still initializing, wait briefly
            if (isLoading) {
              await new Promise((r) => setTimeout(r, 300));
            }
            if (!user) {
              router.push('/login');
            } else {
              router.push('/game/explore/wildarea');
            }
          }}
        >
          <Sword className="h-8 w-8 text-emerald-600" />
          <span className="font-medium">Khu Dã Ngoại</span>
        </Button>

        {/* Cửa hàng (Markets) */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50 hover:border-indigo-300"
          onClick={() => router.push('/game/explore/markets')}
        >
          <ShoppingCart className="h-8 w-8 text-orange-600" />
          <span className="font-medium">Cửa Hàng</span>
        </Button>

        {/* Crafting Button */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-amber-50 hover:border-amber-300"
          onClick={() => router.push('/game/explore/crafting')}
        >
          <Hammer className="h-8 w-8 text-amber-600" />
          <span className="font-medium">Chế tạo</span>
        </Button>

        {/* Pet Gacha Button */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-pink-50 hover:border-pink-300"
          onClick={() => router.push('/game/explore/gacha-pet')}
        >
          <Sparkles className="h-8 w-8 text-pink-600" />
          <span className="font-medium">Thú Cưng</span>
        </Button>

        {/* World Boss Button */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
          onClick={() => router.push('/game/explore/world-boss')}
        >
          <Crown className="h-8 w-8 text-purple-600" />
          <span className="font-medium">Boss Thế Giới</span>
        </Button>

        {/* Leaderboard Button */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-yellow-50 hover:border-yellow-300"
          onClick={() => router.push('/game/explore/leaderboard')}
        >
          <Trophy className="h-8 w-8 text-yellow-600" />
          <span className="font-medium">Bảng xếp hạng</span>
        </Button>

        {/* Đấu Xếp Hạng (PvP) */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-300"
          onClick={() => router.push('/game/explore/pvp')}
        >
          <Target className="h-8 w-8 text-red-600" />
          <span className="font-medium">Đấu Xếp Hạng</span>
        </Button>

        {/* Guild War Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300"
            >
              <ShieldHalf className="h-8 w-8 text-green-600" />
              <span className="font-medium">Công Hội Chiến</span>
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
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Thông tin Guild War</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
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

        {/* Placeholder for more activities */}
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 hover:border-gray-300"
          disabled
        >
          <Zap className="h-8 w-8 text-gray-400" />
          <span className="font-medium text-gray-400">Sắp có</span>
        </Button>
      </div>
    </div>
  );
}
