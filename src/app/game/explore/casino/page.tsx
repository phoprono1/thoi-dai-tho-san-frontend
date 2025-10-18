"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

export default function CasinoHubPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Khu Giải Trí</h1>
        <p className="text-gray-600">Các minigame hiện có</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Coins className="w-5 h-5 text-yellow-500" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">Vé số cào</CardTitle>
                  <CardDescription className="text-sm">Minigame vé số cào — thử vận may của bạn!</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => router.push('/game/explore/casino/scratch-cards')}>Mở</Button>
            </div>
          </CardContent>
        </Card>

        {/* Future minigames can be added here */}
      </div>
    </div>
  );
}
