'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Star,
  Clock,
  TrendingUp,
  ArrowLeft,
  Info,
  History,
  Package,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  getPetBannerById,
  getFeaturedPets,
  pullPet,
  pullMultiplePets,
  getPullHistory,
  type PetBanner,
  type PetDefinition,
  type PullResult,
} from '@/lib/pet-banner-api';
import { resolveAssetUrl } from '@/lib/asset';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Item, UserItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PetPullAnimation from '@/components/game/PetPullAnimation';

export default function BannerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = parseInt(params?.id as string);

  const [banner, setBanner] = useState<PetBanner | null>(null);
  const [featuredPets, setFeaturedPets] = useState<PetDefinition[]>([]);
  const [pullHistory, setPullHistory] = useState<PullResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [pullResults, setPullResults] = useState<PullResult[]>([]);
  const { user: authUser } = useAuth();
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);

  // Confirmation modal state for fallback-to-gold
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | { type: 'single' | 'multi' }> (null);
  const [fallbackInfo, setFallbackInfo] = useState<{ available: number; required: number; goldNeeded: number } | null>(null);
  const queryClient = useQueryClient();

  // Normalization helpers for pull history entries (server may return different shapes)
  type RawHistory = {
    userPet?: Record<string, unknown>;
    pet?: Record<string, unknown>;
    petObtainedId?: number;
    isNew?: boolean;
  };

  const normalizeEntryToPullResult = React.useCallback((entry: RawHistory): PullResult => {
    if (entry.userPet && typeof entry.userPet === 'object') {
      const up = entry.userPet as Record<string, unknown>;
      return {
        userPet: {
          id: (typeof up.id === 'number' ? up.id : 0),
          petDefinitionId: (typeof up.petDefinitionId === 'number' ? up.petDefinitionId : 0),
          petId: (typeof up.petId === 'string' ? up.petId : ''),
          name: (typeof up.name === 'string' ? up.name : 'Unknown'),
          level: (typeof up.level === 'number' ? up.level : 1),
          rarity: (typeof up.rarity === 'number' ? up.rarity : 1),
          imageUrl: typeof up.imageUrl === 'string' ? up.imageUrl : undefined,
        },
        isNew: Boolean(entry.isNew),
      };
    }

    if (entry.pet && typeof entry.pet === 'object') {
      const pet = entry.pet as Record<string, unknown>;
      const images = Array.isArray(pet.images) ? pet.images : undefined;
      const firstImage = images && images.length > 0 && typeof images[0] === 'string' ? images[0] as string : undefined;
      const img = firstImage ?? (typeof pet.image === 'string' ? pet.image : undefined);
      return {
        userPet: {
          id: (typeof pet.id === 'number' ? pet.id : 0),
          petDefinitionId: typeof entry.petObtainedId === 'number' ? entry.petObtainedId : 0,
          petId: (typeof pet.petId === 'string' ? pet.petId : ''),
          name: (typeof pet.name === 'string' ? pet.name : 'Unknown'),
          level: 1,
          rarity: (typeof pet.rarity === 'number' ? pet.rarity : 1),
          imageUrl: img,
        },
        isNew: Boolean(entry.isNew),
      };
    }

    return { userPet: { id: 0, petDefinitionId: 0, petId: '', name: 'Unknown', level: 1, rarity: 1 }, isNew: Boolean(entry.isNew) };
  }, []);

  // load banner when id changes
  const loadBannerData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [bannerData, petsData, historyData] = await Promise.all([
        getPetBannerById(bannerId),
        getFeaturedPets(bannerId),
        getPullHistory(20),
      ]);
      setBanner(bannerData);
      setFeaturedPets(petsData);

      // Normalize history defensively using the top-level helper (server may return multiple shapes)
      const normalized = (historyData as RawHistory[]).map((h) => normalizeEntryToPullResult(h));
      setPullHistory(normalized);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      toast.error('Không thể tải thông tin banner');
    } finally {
      setLoading(false);
    }
  }, [bannerId, normalizeEntryToPullResult]);

  useEffect(() => {
    if (bannerId) loadBannerData();
  }, [bannerId, loadBannerData]);

  useEffect(() => {
    // load item catalog
    apiService.getItems().then((it) => setCatalogItems(it)).catch(() => {});
  }, []);

  useEffect(() => {
    if (authUser && authUser.id) {
      apiService.getUserItems(authUser.id).then((ui) => setUserItems(ui)).catch(() => {});
    }
  }, [authUser]);

  const performPendingAction = async () => {
    if (!pendingAction || !banner) return;
    setShowFallbackModal(false);
    try {
      setPulling(true);
      if (pendingAction.type === 'single') {
        const result = await pullPet(banner.id);
        setPullResults([result]);
      } else {
        const result = await pullMultiplePets(banner.id, 10);
        setPullResults(result.results);
      }

      // refresh history and user items
  const historyData = await getPullHistory(20);
  setPullHistory((historyData as RawHistory[]).map((h) => normalizeEntryToPullResult(h)));
      if (authUser) {
        const ui = await apiService.getUserItems(authUser.id);
        setUserItems(ui);
      }
      queryClient.invalidateQueries({ queryKey: ['user-pets'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-pets'] });
      setShowAnimation(true);
    } catch (error: unknown) {
      const msg = extractMessage(error);
      toast.error(msg);
    } finally {
      setPulling(false);
      setPendingAction(null);
      setFallbackInfo(null);
    }
  };

  // removed duplicate loadBannerData (use useCallback version above)

  const handleSinglePull = async () => {
    if (!banner) return;
    const perPullQty = banner.costItemQuantity ?? 1;
    let available = 0;
    if (banner.costItemId) {
      // Always reload userItems before checking
      if (authUser && authUser.id) {
        const uiList = await apiService.getUserItems(authUser.id);
        setUserItems(uiList);
        const ui = uiList.find((u) => u.itemId === banner.costItemId);
        available = ui?.quantity ?? 0;
      } else {
        const ui = userItems.find((u) => u.itemId === banner.costItemId);
        available = ui?.quantity ?? 0;
      }
      if (available >= perPullQty) {
        // enough tickets -> proceed
      } else if (banner.costPerPull === 0) {
        // ticket-only and not enough
        toast.error('Không đủ vé để triệu hồi');
        return;
      } else {
        // show fallback modal: will use gold for the pull
        setPendingAction({ type: 'single' });
        const goldNeeded = banner.costPerPull;
        setFallbackInfo({ available, required: perPullQty, goldNeeded });
        setShowFallbackModal(true);
        return;
      }
    }

    try {
      setPulling(true);
      const result = await pullPet(bannerId);
      setPullResults([result]);
      setShowAnimation(true);

      // Reload history after pull
      const historyData = await getPullHistory(20);
      setPullHistory((historyData as RawHistory[]).map((h) => normalizeEntryToPullResult(h)));
      // Invalidate user pets so UI updates (counts, switch modal)
      queryClient.invalidateQueries({ queryKey: ['user-pets'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-pets'] });
      // Reload userItems after pull
      if (authUser && authUser.id) {
        const uiList = await apiService.getUserItems(authUser.id);
        setUserItems(uiList);
      }
    } catch (error: unknown) {
      console.error('Failed to pull:', error);
      toast.error(extractMessage(error));
    } finally {
      setPulling(false);
    }
  };

  const handleMultiPull = async () => {
    if (!banner) return;
    const perPullQty = banner.costItemQuantity ?? 1;
    let available = 0;
    if (banner.costItemId) {
      // Always reload userItems before checking
      if (authUser && authUser.id) {
        const uiList = await apiService.getUserItems(authUser.id);
        setUserItems(uiList);
        const ui = uiList.find((u) => u.itemId === banner.costItemId);
        available = ui?.quantity ?? 0;
      } else {
        const ui = userItems.find((u) => u.itemId === banner.costItemId);
        available = ui?.quantity ?? 0;
      }
      const totalRequired = perPullQty * 10;
      if (available >= totalRequired) {
        // enough tickets -> proceed
      } else if (banner.costPerPull === 0) {
        // ticket-only and not enough tickets
        toast.error('Không đủ vé để triệu hồi 10x');
        return;
      } else {
        // show fallback modal detailing how many tickets and gold will be used
        const availableFullPulls = Math.floor(available / perPullQty);
        const ticketsConsumed = availableFullPulls * perPullQty;
        const remainingPulls = 10 - availableFullPulls;
        const goldNeeded = remainingPulls * banner.costPerPull;
        setPendingAction({ type: 'multi' });
        setFallbackInfo({ available: ticketsConsumed, required: totalRequired, goldNeeded });
        setShowFallbackModal(true);
        return;
      }
    }

    try {
      setPulling(true);
      const result = await pullMultiplePets(bannerId, 10);
      setPullResults(result.results);
      setShowAnimation(true);

      // Reload history after pull
      const historyData = await getPullHistory(20);
      setPullHistory((historyData as RawHistory[]).map((h) => normalizeEntryToPullResult(h)));
      // Invalidate user pets so UI updates (counts, switch modal)
      queryClient.invalidateQueries({ queryKey: ['user-pets'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-pets'] });
      // Reload userItems after pull
      if (authUser && authUser.id) {
        const uiList = await apiService.getUserItems(authUser.id);
        setUserItems(uiList);
      }
    } catch (error: unknown) {
      console.error('Failed to pull:', error);
      toast.error(extractMessage(error));
    } finally {
      setPulling(false);
    }
  };

  function extractMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      const e = err as Record<string, unknown>;
      const resp = e.response as Record<string, unknown> | undefined;
      if (resp && typeof resp === 'object') {
        const data = resp.data as Record<string, unknown> | undefined;
        if (data && typeof data.message === 'string') return data.message;
      }
      if (typeof e.message === 'string') return e.message;
    }
    return 'Triệu hồi thất bại';
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="w-full h-64 rounded-lg mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="lg:col-span-2 h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Không tìm thấy banner</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
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
              <div className="flex-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {banner.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4" />
                  <span>Còn lại: {formatTimeRemaining(banner.endDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          {banner.bannerImage ? (
            <img
              src={resolveAssetUrl(banner.bannerImage)}
              alt={banner.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-24 w-24 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 -mt-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Pull Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-500" />
                    Triệu hồi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSinglePull}
                    disabled={pulling}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Triệu hồi x1
                    <Badge variant="secondary" className="ml-auto">
                      {banner.costItemId ? (
                        <>{banner.costItemQuantity ?? 1} × {catalogItems.find(i => i.id === banner.costItemId)?.name || `Item#${banner.costItemId}`}</>
                      ) : (
                        <>{banner.costPerPull} 💰</>
                      )}
                    </Badge>
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={handleMultiPull}
                    disabled={pulling}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Triệu hồi x10
                    <Badge variant="secondary" className="ml-auto">
                      {banner.costItemId ? (
                        <>{(banner.costItemQuantity ?? 1) * 10} × {catalogItems.find(i => i.id === banner.costItemId)?.name || `Item#${banner.costItemId}`}</>
                      ) : (
                        <>{banner.costPerPull * 10} 💰</>
                      )}
                    </Badge>
                  </Button>

                  {/* Show pity thresholds: prefer new multi-threshold config, fall back to legacy guaranteedRarity/guaranteedPullCount */}
                  {((banner.pityThresholds && banner.pityThresholds.length > 0) || (banner.guaranteedRarity && banner.guaranteedPullCount)) && (
                    <div className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded p-3 border border-yellow-500/20">
                      <p className="font-semibold mb-1">🎁 Đảm bảo may mắn</p>
                      <div className="space-y-1">
                        {banner.pityThresholds && banner.pityThresholds.length > 0 ? (
                          // sort thresholds by rarity desc (show highest rarity first), then by pullCount asc
                          [...banner.pityThresholds]
                            .sort((a, b) => b.rarity - a.rarity || a.pullCount - b.pullCount)
                            .map((t, i) => (
                              <p key={i}>
                                Đảm bảo nhận {t.rarity}★ sau {t.pullCount} lượt
                              </p>
                            ))
                        ) : (
                          <p>
                            Đảm bảo nhận {banner.guaranteedRarity}★ sau {banner.guaranteedPullCount} lượt
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tỷ lệ rơi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(banner.dropRates)
                      .sort(([a], [b]) => parseInt(b.replace('rarity', '')) - parseInt(a.replace('rarity', '')))
                      .map(([key, value]) => {
                        const rarity = parseInt(key.replace('rarity', ''));
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: rarity }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-yellow-500 text-yellow-500"
                                />
                              ))}
                            </div>
                            <span className="font-semibold">{value * 100}%</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="featured" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="featured">
                    <Star className="h-4 w-4 mr-2" />
                    Nổi bật
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <Info className="h-4 w-4 mr-2" />
                    Thông tin
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Lịch sử
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="featured" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Thú cưng nổi bật</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {featuredPets.map((pet) => (
                          <Card key={pet.id} className="overflow-hidden">
                            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-2 overflow-hidden">
                              {pet.images?.[0] ? (
                                <img
                                  src={resolveAssetUrl(pet.images[0])}
                                  alt={pet.name}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                              )}
                            </div>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-0.5 mb-1">
                                {Array.from({ length: pet.rarity }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3 fill-yellow-500 text-yellow-500"
                                  />
                                ))}
                              </div>
                              <h4 className="font-semibold text-sm md:text-base text-center break-words whitespace-normal">
                                {pet.name}
                              </h4>
                              {pet.element && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {pet.element}
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="info" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Thông tin banner</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Mô tả</h4>
                        <p className="text-sm text-muted-foreground">
                          {banner.description || 'Triệu hồi thú cưng mạnh mẽ cho đội hình của bạn!'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Thời gian</h4>
                        <p className="text-sm text-muted-foreground">
                          Bắt đầu: {new Date(banner.startDate).toLocaleString('vi-VN')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Kết thúc: {new Date(banner.endDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lịch sử triệu hồi gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pullHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Chưa có lịch sử triệu hồi</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pullHistory.map((result, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                            >
                              <div className="w-12 h-12 rounded bg-background flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                                {result.userPet.imageUrl ? (
                                  <img
                                    src={resolveAssetUrl(result.userPet.imageUrl)}
                                    alt={result.userPet.name}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                    <span className="break-words whitespace-normal">{result.userPet.name}</span>
                                </div>
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  {Array.from({ length: result.userPet.rarity }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className="h-3 w-3 fill-yellow-500 text-yellow-500"
                                    />
                                  ))}
                                </div>
                              </div>
                              {result.isNew && (
                                <Badge variant="default">Mới!</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Pull Animation Modal */}
      {showAnimation && (
        <PetPullAnimation
          results={pullResults}
          onComplete={() => {
            setShowAnimation(false);
            setPullResults([]);
          }}
        />
      )}

      {/* Fallback confirmation modal */}
      <Dialog open={showFallbackModal} onOpenChange={(open) => setShowFallbackModal(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận sử dụng vàng</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            {fallbackInfo ? (
              <div>
                <p>Bạn có <strong>{fallbackInfo.available}</strong> vé, nhưng cần <strong>{fallbackInfo.required}</strong>.</p>
                <p>Phần thiếu sẽ được trừ bằng vàng: <strong>{fallbackInfo.goldNeeded}</strong> 💰.</p>
                <p>Bạn có muốn tiếp tục?</p>
              </div>
            ) : (
              <p>Không đủ vé, hệ thống sẽ sử dụng vàng để hoàn tất lượt triệu hồi.</p>
            )}
          </DialogDescription>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowFallbackModal(false); setPendingAction(null); setFallbackInfo(null); }}>Hủy</Button>
            <Button onClick={() => performPendingAction()} disabled={pulling}>{pulling ? 'Đang xử lý...' : 'Xác nhận'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
