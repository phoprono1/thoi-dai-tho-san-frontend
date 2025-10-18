"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { directApi } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
interface Prize { id: number; prizeType: string; prizeValue: number; prizeQuantity?: number; positionRow?: number; positionCol?: number; }

interface ScratchCardType { id: number; name: string; description?: string; backgroundImageUrl?: string; costGold: number; gridRows: number; gridCols: number; prizes?: Prize[]; }

interface ScratchedPrize {
  prizeId?: number | null;
  prizeType: string;
  prizeValue?: number;
  prizeQuantity?: number;
  taxDeducted?: number;
  finalAmount?: number;
  positionRow: number;
  positionCol: number;
  playerNumber?: number;
  message?: string;
}

interface UserScratchCard {
  id: number;
  playerNumber: number;
  positionNumbers: number[];
  scratchedPositions: number[];
  revealedPrizes: ScratchedPrize[];
  placedPrizes: Array<{ prizeId: number; positionRow: number; positionCol: number }>;
  cardType: ScratchCardType;
  isCompleted?: boolean;
}

interface ApiWrapper<T> { success: boolean; data: T }

export default function ScratchCardPlayPage() {
  const router = useRouter();
  const params = useParams();
  const cardTypeId = Number(params?.id || 0);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [userCard, setUserCard] = useState<UserScratchCard | null>(null); // UserScratchCard after purchase

  const { data: cardType, isLoading, error } = useQuery<ScratchCardType | null>({
    queryKey: ['scratch-card-type', cardTypeId],
    queryFn: async () => {
      const res = await directApi.get<ApiWrapper<ScratchCardType>>(`/casino/scratch-cards/types/${cardTypeId}`);
      return res?.data ?? null;
    },
    enabled: !!cardTypeId,
  });

  const purchaseMutation = useMutation<ApiWrapper<UserScratchCard>, Error, void>({
    mutationFn: async () => {
      return directApi.post<ApiWrapper<UserScratchCard>>(`/casino/scratch-cards/purchase/${cardTypeId}`);
    },
    onSuccess: (res) => {
      const payload = res.data;
      setUserCard(payload);
      toast.success('Mua vé thành công!');
      queryClient.invalidateQueries({ queryKey: ['scratch-card-type', cardTypeId] });
    },
    onError: (err) => {
      toast.error('Lỗi khi mua vé: ' + (err.message || err.toString()));
    },
  });

  const scratchMutation = useMutation<ApiWrapper<ScratchedPrize>, Error, { cardId: number; row: number; col: number }>({
    mutationFn: async ({ cardId, row, col }) => {
      return directApi.post<ApiWrapper<ScratchedPrize>>(`/casino/scratch-cards/${cardId}/scratch`, { row, col });
    },
    onSuccess: (res) => {
      const payload = res.data;
      // Update local userCard state
      setUserCard((prev) => {
        if (!prev) return prev;
        const newPrev = { ...prev } as UserScratchCard;
        const posIndex = payload.positionRow * newPrev.cardType.gridCols + payload.positionCol;
        newPrev.scratchedPositions = [...(newPrev.scratchedPositions || []), posIndex];
        newPrev.revealedPrizes = [...(newPrev.revealedPrizes || []), payload];
        if (newPrev.scratchedPositions.length >= newPrev.cardType.gridRows * newPrev.cardType.gridCols) newPrev.isCompleted = true;
        return newPrev;
      });
      if (payload.prizeType === 'gold' && payload.finalAmount !== undefined) {
        toast.success(`Bạn nhận ${payload.finalAmount} Gold`);
      } else if (payload.prizeType === 'item' && payload.prizeQuantity !== undefined) {
        toast.success('Bạn nhận vật phẩm!');
      } else if (payload.prizeType === 'none' || payload.message) {
        toast.info(payload.message || 'Chúc bạn may mắn lần sau!');
      } else {
        // Has prize but not awarded (numbers don't match)
        toast.info('Chúc bạn may mắn lần sau!');
      }
    },
    onError: (err) => {
      toast.error('Lỗi khi cào: ' + (err.message || err.toString()));
    },
  });

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (isLoading) return <div className="p-6">Đang tải...</div>;
  if (error || !cardType) return <div className="p-6 text-red-600">Không tìm thấy vé hoặc có lỗi.</div>;

  // helper to render grid
  const totalPositions = cardType.gridRows * cardType.gridCols;

  const isScratched = (index: number) => {
    if (!userCard) return false;
    return (userCard.scratchedPositions || []).includes(index);
  };

  const handlePurchase = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    purchaseMutation.mutate();
  };

  const handlePurchaseAgain = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Reset user card state and purchase new one
    setUserCard(null);
    purchaseMutation.mutate();
  };

  const handleScratch = (index: number) => {
    if (!userCard) {
      toast.error('Bạn cần mua vé trước');
      return;
    }
    const row = Math.floor(index / cardType.gridCols);
    const col = index % cardType.gridCols;
    if (isScratched(index)) {
      toast.error('Vị trí này đã được cào');
      return;
    }
    scratchMutation.mutate({ cardId: userCard.id, row, col });
  };

  // Calculate win rate based on matching positions
  const calculateWinRate = () => {
    if (!cardType) return 0;
    // With 50/50 logic: 50% chance to match + random chance, but approximately 50% + some
    // For simplicity, show ~50% as base win rate
    return Math.round(50 + (cardType.prizes?.length || 0) * 5); // Rough estimate
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-bold">{cardType.name}</h1>
          <p className="text-gray-600">{cardType.description}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-sm text-gray-500">Giá vé</div>
          <div className="text-lg font-semibold text-yellow-600">{cardType.costGold} Gold</div>
        </div>
      </div>

      {/* Prize Information */}
      {cardType.prizes && cardType.prizes.length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Giải thưởng</h3>
            <div className="text-sm text-gray-600">
              Tỷ lệ trúng: ~{calculateWinRate()}%
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cardType.prizes.map((prize, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded p-2 border">
                <div className="flex items-center space-x-2">
                  {prize.prizeType === 'gold' ? (
                    <span className="text-yellow-500">💰</span>
                  ) : (
                    <span className="text-blue-500">📦</span>
                  )}
                  <span className="text-sm">
                    {prize.prizeType === 'gold'
                      ? `${prize.prizeValue} Gold`
                      : `Item #${prize.prizeValue} x${prize.prizeQuantity || 1}`
                    }
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  x{prize.prizeQuantity || 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        {!userCard ? (
          <div className="space-y-3">
            <div className="text-center sm:text-left">Bạn chưa mua vé. Khi mua bạn sẽ nhận một số may mắn và có thể cào các ô tương ứng.</div>
            <div className="flex justify-center sm:justify-start">
              <Button onClick={handlePurchase} disabled={purchaseMutation.status === 'pending'}>
                {purchaseMutation.status === 'pending' ? 'Đang mua...' : `Mua vé (${cardType.costGold} Gold)`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center sm:text-left">
              <span className="font-medium">Số của bạn: </span>
              <strong className="text-lg">{userCard.playerNumber}</strong>
            </div>
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Cào các ô có số trùng với số may mắn của bạn để nhận thưởng!
            </div>
            {userCard.isCompleted && (
              <div className="flex justify-center sm:justify-start">
                <Button onClick={handlePurchaseAgain} disabled={purchaseMutation.status === 'pending'} variant="outline">
                  {purchaseMutation.status === 'pending' ? 'Đang mua...' : 'Mua tiếp'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        {cardType.backgroundImageUrl ? (
          <div className="relative rounded-lg overflow-hidden max-w-md mx-auto md:max-w-lg lg:max-w-xl" style={{ aspectRatio: `${cardType.gridCols}/${cardType.gridRows}` }}>
            <Image
              src={resolveAssetUrl(cardType.backgroundImageUrl) || cardType.backgroundImageUrl}
              alt={cardType.name}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Overlay grid */}
            <div className="absolute inset-0 grid" style={{
              gridTemplateColumns: `repeat(${cardType.gridCols}, minmax(0, 1fr))`,
              gap: 1,
              padding: 4
            }}>
              {Array.from({ length: totalPositions }).map((_, idx) => {
                return (
                  <div
                    key={idx}
                    className="bg-black/50 backdrop-blur-sm rounded border border-white/30 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors min-h-[40px] md:min-h-[50px] lg:min-h-[60px]"
                    onClick={() => handleScratch(idx)}
                  >
                    {!userCard ? (
                      <span className="text-white font-bold text-sm md:text-base">{idx + 1}</span>
                    ) : isScratched(idx) ? (
                      (() => {
                        const pos = userCard.revealedPrizes?.find((r: ScratchedPrize) =>
                          r.positionRow * cardType.gridCols + r.positionCol === idx
                        );
                        const positionNumber = userCard.positionNumbers?.[idx] || (idx + 1);

                        if (!pos) return <span className="text-white font-bold text-sm md:text-base">{positionNumber}</span>;

                        // Check if this position's number matches the player's lucky number
                        const isMatchingNumber = positionNumber === (userCard?.playerNumber || 0);

                        if (pos.prizeType === 'gold' && pos.prizeValue) {
                          return (
                            <div className={`flex flex-col items-center ${isMatchingNumber ? 'animate-pulse bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-1 shadow-lg border-2 border-yellow-300' : ''}`}>
                              <span className={`font-bold text-xs md:text-sm ${isMatchingNumber ? 'text-white drop-shadow-lg' : 'text-gray-300'}`}>
                                {pos.prizeValue}G
                              </span>
                              <span className={`font-bold text-xs md:text-sm ${isMatchingNumber ? 'text-white' : 'text-gray-400'}`}>
                                ({positionNumber})
                              </span>
                              {!isMatchingNumber && (
                                <span className="text-red-400 text-xs md:text-sm mt-1">Không trúng</span>
                              )}
                            </div>
                          );
                        } else if (pos.prizeType === 'item' && pos.prizeValue) {
                          return (
                            <div className={`flex flex-col items-center ${isMatchingNumber ? 'animate-bounce bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-1 shadow-lg border-2 border-blue-300' : ''}`}>
                              <span className={`font-bold text-xs md:text-sm ${isMatchingNumber ? 'text-white drop-shadow-lg' : 'text-gray-300'}`}>
                                Item x{pos.prizeQuantity || 1}
                              </span>
                              <span className={`font-bold text-xs md:text-sm ${isMatchingNumber ? 'text-white' : 'text-gray-400'}`}>
                                ({positionNumber})
                              </span>
                              {!isMatchingNumber && (
                                <span className="text-red-400 text-xs md:text-sm mt-1">Không trúng</span>
                              )}
                            </div>
                          );
                        } else {
                          // No prize - show the position number
                          return <span className="text-gray-400 font-bold text-xs md:text-sm">{positionNumber}</span>;
                        }
                      })()
                    ) : (
                      <span className="text-white font-bold text-sm md:text-base">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Fallback grid without background image
          <div className="grid bg-gray-100 rounded p-4 max-w-md mx-auto md:max-w-lg lg:max-w-xl" style={{
            gridTemplateColumns: `repeat(${cardType.gridCols}, minmax(0, 1fr))`,
            gap: 4
          }}>
            {Array.from({ length: totalPositions }).map((_, idx) => (
              <div key={idx} className={`border rounded p-3 text-center cursor-pointer ${isScratched(idx) ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'} min-h-[50px] md:min-h-[60px] lg:min-h-[70px] flex items-center justify-center`}>
                {isScratched(idx) ? (
                  (() => {
                    const pos = userCard?.revealedPrizes?.find((r: ScratchedPrize) => r.positionRow * cardType.gridCols + r.positionCol === idx);
                    const positionNumber = userCard?.positionNumbers?.[idx] || (idx + 1);

                    if (!pos) return <div className="text-sm md:text-base">Đã cào</div>;

                    // Check if this position's number matches the player's lucky number
                    const isMatchingNumber = positionNumber === (userCard?.playerNumber || 0);

                    if (pos.prizeType === 'gold' && pos.prizeValue) {
                      return (
                        <div className={`text-center ${isMatchingNumber ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-2 animate-pulse shadow-md' : 'bg-gray-200'}`}>
                          <div className={`text-sm md:text-base font-semibold ${isMatchingNumber ? 'text-yellow-800' : 'text-gray-500'}`}>
                            {pos.prizeValue} Gold
                          </div>
                          <div className={`text-xs md:text-sm ${isMatchingNumber ? 'text-gray-700' : 'text-gray-500'}`}>
                            ({positionNumber})
                          </div>
                          {!isMatchingNumber && (
                            <div className="text-xs md:text-sm text-red-600 mt-1">Không trúng</div>
                          )}
                        </div>
                      );
                    } else if (pos.prizeType === 'item' && pos.prizeValue) {
                      return (
                        <div className={`text-center ${isMatchingNumber ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 rounded-lg p-2 animate-bounce shadow-md' : 'bg-gray-200'}`}>
                          <div className={`text-sm md:text-base font-semibold ${isMatchingNumber ? 'text-blue-800' : 'text-gray-500'}`}>
                            Item #{pos.prizeValue} x{pos.prizeQuantity || 1}
                          </div>
                          <div className={`text-xs md:text-sm ${isMatchingNumber ? 'text-gray-700' : 'text-gray-500'}`}>
                            ({positionNumber})
                          </div>
                          {!isMatchingNumber && (
                            <div className="text-xs md:text-sm text-red-600 mt-1">Không trúng</div>
                          )}
                        </div>
                      );
                    } else {
                      // No prize - show the position number
                      return <div className="text-sm md:text-base text-gray-500">{positionNumber}</div>;
                    }
                  })()
                ) : (
                  <div className="font-bold text-lg md:text-xl">?</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
