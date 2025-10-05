'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Star,
  Clock,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getActivePetBanners,
  type PetBanner,
} from '@/lib/pet-banner-api';
import { resolveAssetUrl } from '@/lib/asset';

export default function PetGachaPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<PetBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getActivePetBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to load banners:', error);
      toast.error('Không thể tải banner gacha');
    } finally {
      setLoading(false);
    }
  };

  const getBannerTypeColor = (type: string) => {
    switch (type) {
      case 'limited':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'rate_up':
        return 'bg-gradient-to-r from-orange-600 to-red-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-cyan-600';
    }
  };

  const getBannerTypeName = (type: string) => {
    switch (type) {
      case 'limited':
        return 'Giới Hạn';
      case 'rate_up':
        return 'Tăng Tỷ Lệ';
      default:
        return 'Tiêu Chuẩn';
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Đã kết thúc';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} ngày ${hours} giờ`;
    return `${hours} giờ`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-pink-500" />
                Pet Gacha
              </h1>
              <p className="text-sm text-muted-foreground">
                Triệu hồi thú cưng mới cho đội hình của bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Banner List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="w-full h-48 rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Không có banner nào đang hoạt động
              </h3>
              <p className="text-sm text-muted-foreground">
                Hãy quay lại sau khi có sự kiện mới!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card
                key={banner.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/game/explore/gacha-pet/${banner.id}`)}
              >
                {/* Banner Image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {banner.bannerImage ? (
                    <img
                      src={resolveAssetUrl(banner.bannerImage)}
                      alt={banner.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  
                  {/* Banner Type Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`${getBannerTypeColor(banner.bannerType)} text-white font-semibold`}
                    >
                      {getBannerTypeName(banner.bannerType)}
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2">{banner.name}</span>
                    {banner.guaranteedRarity && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: banner.guaranteedRarity }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-yellow-500 text-yellow-500"
                          />
                        ))}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {banner.description || 'Triệu hồi thú cưng mạnh mẽ!'}
                  </p>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Còn lại: <span className="font-semibold text-foreground">
                        {formatTimeRemaining(banner.endDate)}
                      </span>
                    </span>
                  </div>

                  {/* Cost */}
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-yellow-600">
                        {banner.costPerPull}
                      </span>{' '}
                      vàng/lượt
                    </span>
                  </div>

                  {/* Guaranteed Pull Info */}
                  {banner.guaranteedRarity && banner.guaranteedPullCount && (
                    <div className="text-xs bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">
                        🎁 Đảm bảo {banner.guaranteedRarity}★ sau{' '}
                        <span className="font-semibold text-foreground">
                          {banner.guaranteedPullCount}
                        </span>{' '}
                        lượt
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button className="w-full" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Triệu hồi
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
