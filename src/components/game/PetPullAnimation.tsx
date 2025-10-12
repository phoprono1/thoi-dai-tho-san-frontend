'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Sparkles, X } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset';

interface PullResult {
  userPet: {
    id: number;
    petDefinitionId: number;
    petId: string;
    name: string;
    level: number;
    rarity: number;
    imageUrl?: string;
  };
  isNew: boolean;
}

interface PetPullAnimationProps {
  results: PullResult[];
  onComplete: () => void;
}

export default function PetPullAnimation({ results, onComplete }: PetPullAnimationProps) {
  const isMultiPull = results.length > 1;
  
  if (!results || results.length === 0) {
    return null;
  }

  if (isMultiPull) {
    return <MultiPullAnimation results={results} onComplete={onComplete} />;
  }
  
  return <SinglePullAnimation result={results[0]} onComplete={onComplete} />;
}

function MultiPullAnimation({ results, onComplete }: { results: PullResult[]; onComplete: () => void }) {
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [currentRevealing, setCurrentRevealing] = useState<number | null>(null);
  const [showCards, setShowCards] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);

  const sortedResults = results.map((result, index) => ({ result, originalIndex: index }))
    .sort((a, b) => {
      const rarityA = a.result.userPet.rarity;
      const rarityB = b.result.userPet.rarity;
      const isLowA = rarityA <= 3;
      const isLowB = rarityB <= 3;
      if (isLowA && !isLowB) return -1;
      if (!isLowA && isLowB) return 1;
      if (isLowA) return rarityA - rarityB;
      return rarityB - rarityA;
    });

  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showCards) return;
    let currentIndex = 0;
    const revealNext = () => {
      if (currentIndex >= sortedResults.length) {
        setAllRevealed(true);
        return;
      }
      const cardIndex = sortedResults[currentIndex].originalIndex;
      setCurrentRevealing(cardIndex);
      setTimeout(() => {
        setRevealedCards(prev => new Set(prev).add(cardIndex));
        setCurrentRevealing(null);
        currentIndex++;
        setTimeout(revealNext, 600);
      }, 800);
    };
    const startTimer = setTimeout(revealNext, 500);
    return () => clearTimeout(startTimer);
  }, [showCards, sortedResults]);

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5: return 'from-yellow-400 via-orange-500 to-red-500';
      case 4: return 'from-purple-400 via-purple-600 to-purple-800';
      case 3: return 'from-blue-400 via-blue-600 to-blue-800';
      case 2: return 'from-green-400 via-green-600 to-green-800';
      default: return 'from-gray-400 via-gray-600 to-gray-800';
    }
  };

  const getRarityGlow = (rarity: number) => {
    switch (rarity) {
      case 5: return 'shadow-2xl shadow-yellow-500/70 animate-pulse';
      case 4: return 'shadow-xl shadow-purple-500/60';
      case 3: return 'shadow-lg shadow-blue-500/40';
      default: return 'shadow-md shadow-gray-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10" onClick={onComplete}>
        <X className="h-6 w-6" />
      </Button>
      {allRevealed && (
        <Button size="lg" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold z-10" onClick={onComplete}>
          Hoàn thành
        </Button>
      )}
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="grid grid-cols-5 gap-3 md:gap-4">
          {results.map((result, index) => {
            const isRevealed = revealedCards.has(index);
            const isRevealing = currentRevealing === index;
            const rarity = result.userPet.rarity;
            const isHighRarity = rarity >= 4;
            return (
              <div key={index} className={`relative transition-all duration-700 ${showCards ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} style={{ transitionDelay: `${index * 50}ms` }}>
                <div className="relative aspect-[3/4] perspective-1000">
                  <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
                    <div className="absolute inset-0 backface-hidden">
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-0.5 shadow-lg">
                        <div className="w-full h-full rounded-lg bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180">
                      <div className={`w-full h-full rounded-lg bg-gradient-to-br ${getRarityColor(rarity)} p-0.5 ${isRevealed ? getRarityGlow(rarity) : ''} ${isRevealing ? 'animate-bounce' : ''}`}>
                        <div className="w-full h-full rounded-lg bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-2 relative overflow-hidden">
                          {isHighRarity && isRevealed && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-20 animate-pulse" />
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-shimmer" />
                            </>
                          )}
                          {result.isNew && isRevealed && (
                            <Badge className="absolute top-1 right-1 bg-yellow-500 text-black font-bold text-[10px] px-1 py-0">MỚI</Badge>
                          )}
                          <div className="flex items-center gap-0.5 mb-1 relative z-10">
                            {Array.from({ length: rarity }).map((_, i) => (
                              <Star key={i} className={`h-2.5 w-2.5 fill-yellow-400 text-yellow-400 ${isRevealing ? 'animate-spin' : ''}`} />
                            ))}
                          </div>
                          <div className="relative w-full aspect-square mb-1 flex items-center justify-center overflow-hidden">
                            {result.userPet.imageUrl ? (
                              <img src={resolveAssetUrl(result.userPet.imageUrl)} alt={result.userPet.name} className={`max-w-full max-h-full object-contain transition-all duration-500 relative z-10 ${isRevealing ? 'scale-110' : 'scale-100'}`} />
                            ) : (
                              <Sparkles className="h-12 w-12 text-white/50" />
                            )}
                          </div>
                          <p className="text-[10px] md:text-xs lg:text-sm font-semibold text-white text-center break-words whitespace-normal px-1 relative z-10">{result.userPet.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {rarity === 5 && isRevealed && (
                  <div className="absolute inset-0 pointer-events-none overflow-visible -z-10">
                    <div className="absolute inset-0 animate-spin-slow">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="absolute top-1/2 left-1/2 w-1 h-full bg-gradient-to-t from-transparent via-yellow-400/50 to-transparent" style={{ transform: `translate(-50%, -50%) rotate(${i * 45}deg)`, transformOrigin: 'center' }} />
                      ))}
                    </div>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {results.some(r => r.userPet.rarity === 5) && revealedCards.size > 0 && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-yellow-500/5 via-green-500/5 via-blue-500/5 to-purple-500/5 animate-rainbow" />
        </div>
      )}
    </div>
  );
}

function SinglePullAnimation({ result, onComplete }: { result: PullResult; onComplete: () => void }) {
  const [showCard, setShowCard] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5: return 'from-yellow-400 via-orange-500 to-red-500';
      case 4: return 'from-purple-400 via-purple-600 to-purple-800';
      case 3: return 'from-blue-400 via-blue-600 to-blue-800';
      case 2: return 'from-green-400 via-green-600 to-green-800';
      default: return 'from-gray-400 via-gray-600 to-gray-800';
    }
  };

  const getRarityGlow = (rarity: number) => {
    switch (rarity) {
      case 5: return 'shadow-2xl shadow-yellow-500/50';
      case 4: return 'shadow-2xl shadow-purple-500/50';
      case 3: return 'shadow-2xl shadow-blue-500/50';
      case 2: return 'shadow-2xl shadow-green-500/50';
      default: return 'shadow-xl shadow-gray-500/30';
    }
  };

  const handleReveal = () => {
    setRevealing(true);
    setTimeout(() => onComplete(), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={onComplete}>
        <X className="h-6 w-6" />
      </Button>
      <div className="relative w-full max-w-md">
        {showCard && (
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <Sparkles className="h-32 w-32 text-yellow-400 opacity-30" />
          </div>
        )}
        <div className={`relative transition-all duration-500 ${showCard ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className={`relative aspect-[3/4] rounded-2xl bg-gradient-to-br ${getRarityColor(result.userPet.rarity)} p-1 ${getRarityGlow(result.userPet.rarity)} transition-all duration-700 ${revealing ? 'animate-bounce' : ''}`}>
            <div className="w-full h-full rounded-xl bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-6">
              {result.isNew && (
                <Badge className="absolute top-4 right-4 bg-yellow-500 text-black font-bold text-sm">🎉 MỚI!</Badge>
              )}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: result.userPet.rarity }).map((_, i) => (
                  <Star key={i} className={`h-6 w-6 fill-yellow-400 text-yellow-400 ${revealing ? 'animate-spin' : ''}`} />
                ))}
              </div>
              <div className="relative w-48 h-48 mb-6 flex items-center justify-center overflow-hidden">
                {result.userPet.imageUrl ? (
                  <img src={resolveAssetUrl(result.userPet.imageUrl)} alt={result.userPet.name} className={`max-w-full max-h-full object-contain transition-all duration-500 ${revealing ? 'scale-110' : 'scale-100'}`} />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="h-24 w-24 text-white/50" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-2 break-words">{result.userPet.name}</h2>
              <p className="text-sm md:text-base text-gray-400 mb-6 break-words">ID: {result.userPet.petId}</p>
              {!revealing && (
                <Button size="lg" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold" onClick={handleReveal}>
                  Hoàn thành
                </Button>
              )}
            </div>
          </div>
        </div>
        {result.userPet.rarity === 5 && showCard && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
