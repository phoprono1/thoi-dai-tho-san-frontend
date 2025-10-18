"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { directApi } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';
import { Coins } from 'lucide-react';

interface Prize {
  id: number;
  prizeType: string;
  prizeValue: number;
  prizeQuantity?: number;
  probabilityWeight?: number;
  taxRate?: string;
  maxClaims?: number | null;
  claimsCount?: number;
  positionRow?: number;
  positionCol?: number;
}

interface ScratchCardType {
  id: number;
  name: string;
  description?: string;
  backgroundImageUrl?: string;
  costGold: number;
  gridRows: number;
  gridCols: number;
  isActive: boolean;
  prizes?: Prize[];
}

export default function ScratchCardsPage() {
  const router = useRouter();

  const { data: cardTypes, isLoading, error } = useQuery({
    queryKey: ['scratch-cards'],
    queryFn: async () => {
      // backend controller exposes GET /casino/scratch-cards/types and returns { success, data }
      const res = await directApi.get<any>('/casino/scratch-cards/types');
      // If backend returns wrapper { success, data }, return data
      if (res && typeof res === 'object' && 'data' in res) return (res.data as ScratchCardType[]) || [];
      // Fallback: if API already returned array
      if (Array.isArray(res)) return res as ScratchCardType[];
      return [] as ScratchCardType[];
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (error) {
      console.error('Failed to load scratch cards', error);
    }
  }, [error]);

  if (isLoading) return <div className="p-6">Đang tải vé số cào...</div>;

  if (error) return <div className="p-6 text-red-600">Lỗi khi tải vé số cào. Vui lòng thử lại sau.</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Khu Giải Trí</h1>
        <p className="text-gray-600">Chọn minigame để chơi. Hiện tại có vé số cào.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardTypes && cardTypes.length > 0 ? (
          cardTypes.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">{card.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{card.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500">Giá vé</div>
                    <div className="text-base font-semibold text-yellow-600">{card.costGold} Gold</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3">
                  {card.backgroundImageUrl ? (
                    <div className="relative w-full h-32 rounded border overflow-hidden">
                      <Image
                        src={resolveAssetUrl(card.backgroundImageUrl) || card.backgroundImageUrl}
                        alt={card.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">No image</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="text-gray-500">Lưới</div>
                    <div className="font-medium">{card.gridRows} × {card.gridCols}</div>
                  </div>
                  <Button size="sm" onClick={() => router.push(`/game/explore/casino/scratch-cards/${card.id}`)}>
                    Chơi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">Hiện không có vé số cào hoạt động.</div>
        )}
      </div>
    </div>
  );
}
