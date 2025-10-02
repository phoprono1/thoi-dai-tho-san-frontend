/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import SkillsSection from '@/components/game/SkillsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Zap, Shield, Sword, Coins, Star, TrendingUp, Heart, Crown, Hand, Footprints } from 'lucide-react';
import { useUserStatusStore } from '@/stores/user-status.store';
import { useUserStatus } from '@/hooks/use-user-status';
import { useAuth } from '@/components/providers/AuthProvider';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { characterClassesApi, userAttributesApi, titlesApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ClassAdvancementModal } from '../modals/ClassAdvancementModal';
import { resolveAssetUrl } from '@/lib/asset';

// Add CSS animations for title effects
const titleAnimationStyles = `
  @keyframes rainbow {
    0% { color: #ff0000; }
    16.66% { color: #ff8000; }
    33.33% { color: #ffff00; }
    50% { color: #00ff00; }
    66.66% { color: #0080ff; }
    83.33% { color: #8000ff; }
    100% { color: #ff0000; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes glow {
    0%, 100% { text-shadow: 0 0 5px currentColor; }
    50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
  }
  
  @keyframes fade {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = titleAnimationStyles;
  document.head.appendChild(styleElement);
}

// Equipped Title Display Component
const EquippedTitleDisplay: React.FC = () => {
  const { user: authUser } = useAuth();
  
  const { data: userTitles = [] } = useQuery({
    queryKey: ['user-titles', authUser?.id],
    queryFn: titlesApi.getUserTitles,
    enabled: !!authUser?.id,
  });

  const equippedTitle = userTitles.find((ut: any) => ut.isEquipped);

  if (!equippedTitle) {
    return (
      <Badge variant="outline" className="text-sm">
        Không có danh hiệu
      </Badge>
    );
  }

  const { title } = equippedTitle;
  const displayEffects = title?.displayEffects || {};

  const getAnimationStyle = (animation: string) => {
    switch (animation) {
      case 'pulse': return 'pulse 2s infinite';
      case 'rainbow': return 'rainbow 3s infinite';
      case 'glow': return 'glow 2s infinite';
      case 'fade': return 'fade 3s infinite';
      case 'bounce': return 'bounce 2s infinite';
      case 'shake': return 'shake 0.5s infinite';
      case 'none':
      default: return 'none';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className="text-sm font-medium"
      style={{
        color: displayEffects.color || '#000',
        backgroundColor: displayEffects.backgroundColor || 'transparent',
        borderColor: displayEffects.color || '#ccc',
        boxShadow: displayEffects.glow ? `0 0 10px ${displayEffects.color}` : 'none',
        animation: getAnimationStyle(displayEffects.animation || 'none')
      }}
    >
      {displayEffects.prefix || `[${title?.name}]`}
    </Badge>
  );
};

// Equipment slot component with image and tooltip
const EquipmentSlot: React.FC<{
  type: string;
  name: string;
  icon: React.ReactNode;
  equippedItems: any[];
}> = ({ type, name, icon, equippedItems }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const item = equippedItems?.find((it) => it.item.type === type);
  
  // Helper function to convert rarity number to string
  const getRarityText = (rarity: number | string | undefined): string => {
    if (typeof rarity === 'number') {
      return ['common', 'uncommon', 'rare', 'epic', 'legendary'][rarity - 1] || 'common';
    } else if (typeof rarity === 'string') {
      return rarity.toLowerCase();
    }
    return 'common';
  };
  
  // Rarity colors and effects
  const getRarityStyles = (rarity: number | string | undefined) => {
    const rarityStr = getRarityText(rarity);
    
    switch (rarityStr) {
      case 'common':
        return {
          border: 'border-gray-400',
          glow: 'shadow-sm',
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
          text: 'text-gray-700 dark:text-gray-300'
        };
      case 'uncommon':
        return {
          border: 'border-green-400',
          glow: 'shadow-md shadow-green-200 dark:shadow-green-900',
          bg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
          text: 'text-green-700 dark:text-green-400'
        };
      case 'rare':
        return {
          border: 'border-blue-400',
          glow: 'shadow-lg shadow-blue-300 dark:shadow-blue-900',
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
          text: 'text-blue-700 dark:text-blue-400'
        };
      case 'epic':
        return {
          border: 'border-purple-500',
          glow: 'shadow-xl shadow-purple-400 dark:shadow-purple-900 animate-pulse',
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30',
          text: 'text-purple-700 dark:text-purple-400'
        };
      case 'legendary':
        return {
          border: 'border-yellow-500',
          glow: 'shadow-2xl shadow-yellow-400 dark:shadow-yellow-900 animate-pulse',
          bg: 'bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-yellow-800/30',
          text: 'text-yellow-800 dark:text-yellow-400'
        };
      default:
        return {
          border: 'border-gray-300 dark:border-gray-600',
          glow: 'shadow-sm',
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const rarityStyles = item ? getRarityStyles(item.item.rarity) : null;
  
  return (
    <div className="relative group">
      {/* Equipment slot container */}
      <div 
        className={`
          border-2 rounded-lg p-2 min-h-[120px] flex flex-col items-center justify-center
          transition-all duration-300 cursor-pointer
          ${item ? `${rarityStyles?.border} ${rarityStyles?.glow} ${rarityStyles?.bg} hover:scale-105` : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50'}
        `}
        onClick={() => item && setShowTooltip(!showTooltip)}
        onMouseEnter={() => item && setShowTooltip(true)}
        onMouseLeave={() => item && setShowTooltip(false)}
      >
        {/* Slot label */}
        <div className="absolute top-1 left-1 flex items-center gap-1 opacity-60">
          <span className="text-[10px] font-medium">{name}</span>
        </div>
        
        {item ? (
          <div className="flex flex-col items-center justify-center gap-1">
            {/* Item image - backend uses 'image' not 'imageUrl', resolve with asset helper */}
            {item.item.image ? (
              <div className="relative w-20 h-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={resolveAssetUrl(item.item.image)} 
                  alt={item.item.name}
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Fallback to icon if image fails
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              </div>
            ) : null}
            
            {/* Fallback icon */}
            <div className={`${item.item.image ? 'hidden' : ''} text-4xl`}>
              {icon}
            </div>
            
            {/* Item level badge */}
            {item.item.level && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                Lv.{item.item.level}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 opacity-30">
            <div className="text-3xl">{icon}</div>
            <span className="text-[10px] text-center">Trống</span>
          </div>
        )}
      </div>
      
      {/* Tooltip/Popover */}
      {item && showTooltip && (
        <div 
          className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 
                     bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 
                     border-gray-200 dark:border-gray-700 pointer-events-none
                     animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 
                          bg-white dark:bg-gray-800 border-l-2 border-t-2 
                          border-gray-200 dark:border-gray-700" />
          
          <div className="relative">
            {/* Item name with rarity color */}
            <h5 className={`font-bold text-sm mb-1 ${rarityStyles?.text}`}>
              {item.item.name}
            </h5>
            
            {/* Rarity badge - convert number to text */}
            {item.item.rarity && (
              <Badge className={`text-xs mb-2 ${rarityStyles?.text} ${rarityStyles?.bg} border-0`}>
                {getRarityText(item.item.rarity).toUpperCase()}
              </Badge>
            )}
            
            {/* Description */}
            {item.item.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">
                {item.item.description}
              </p>
            )}
            
            {/* Stats */}
            {item.item.stats && Object.keys(item.item.stats).length > 0 && (
              <div className="space-y-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Chỉ số:
                </div>
                {Object.entries(item.item.stats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{stat}:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">+{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatusTab: React.FC = () => {
  // Get authenticated user
  const { user: authUser, isAuthenticated } = useAuth();

  // Use authenticated user ID instead of hardcoded value
  const userId = authUser?.id;

  // Use Zustand store
  const {
    user,
    stats,
    totalCoreAttributes,
    stamina,
    currentLevel,
    nextLevel,
    characterClass,
    equippedItems,
    isLoading,
    error,
  } = useUserStatusStore();

  // Awaken modal state
  const [showAwakenModal, setShowAwakenModal] = React.useState(false);
  
  // Title modal state
  const [showTitleModal, setShowTitleModal] = React.useState(false);

  // Class advancement modal state
  const [showClassAdvancementModal, setShowClassAdvancementModal] = React.useState(false);

  // Attribute allocation state
  const [pendingAllocations, setPendingAllocations] = React.useState<Record<'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', number>>({
    STR: 0,
    INT: 0,
    DEX: 0,
    VIT: 0,
    LUK: 0,
  });
  const [isAllocating, setIsAllocating] = React.useState(false);

  const queryClient = useQueryClient();

  // Handle attribute allocation changes
  const handleAllocationChange = (attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', delta: number) => {
    setPendingAllocations(prev => {
      const newAllocations = { ...prev };
      const current = newAllocations[attribute] + delta;

      // Prevent negative allocations
      if (current < 0) return prev;

      // Prevent exceeding available points
      const totalPending = Object.values(newAllocations).reduce((sum, val) => sum + val, 0) + delta;
      if (totalPending > (userAttributes?.unspentAttributePoints || 0)) return prev;

      newAllocations[attribute] = current;
      return newAllocations;
    });
  };

  // Save allocations to server
  const handleSaveAllocations = async () => {
    const totalPending = Object.values(pendingAllocations).reduce((sum, val) => sum + val, 0);
    if (totalPending === 0) {
      toast.info('Không có thay đổi nào để lưu');
      return;
    }

    setIsAllocating(true);
    try {
      const result = await userAttributesApi.allocateMultipleAttributePoints(pendingAllocations);
      if (result.success) {
        toast.success(result.message);
        // Reset pending allocations
        setPendingAllocations({
          STR: 0,
          INT: 0,
          DEX: 0,
          VIT: 0,
          LUK: 0,
        });
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-attributes'] });
      } else {
        toast.error(result.message || 'Lưu thất bại');
      }
    } catch (error) {
      console.error('Save allocations error:', error);
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setIsAllocating(false);
    }
  };

  // Cancel allocations
  const handleCancelAllocations = () => {
    setPendingAllocations({
      STR: 0,
      INT: 0,
      DEX: 0,
      VIT: 0,
      LUK: 0,
    });
  };

  // Fetch user attributes for attribute allocation
  const { data: userAttributes } = useQuery({
    queryKey: ['user-attributes'],
    queryFn: userAttributesApi.getUserAttributes,
    enabled: !!userId,
  });

  // Calculate remaining points after pending allocations
  const remainingPoints = (userAttributes?.unspentAttributePoints || 0) - Object.values(pendingAllocations).reduce((sum, val) => sum + val, 0);
  const hasPendingChanges = Object.values(pendingAllocations).some(val => val > 0);

  // Use TanStack Query only when userId is available
  const { isLoading: queryLoading, error: queryError } = useUserStatus(userId!);

  // If not authenticated, show message
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)] mb-4">Vui lòng đăng nhập để xem thông tin nhân vật</p>
        </div>
      </div>
    );
  }

  // Combine loading states
  const loading = isLoading || queryLoading;
  const displayError = error || (queryError instanceof Error ? queryError.message : null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{displayError}</p>
      </div>
    );
  }

  if (!user || !stats || !totalCoreAttributes || !stamina || !currentLevel) {
    return (
      <div className="p-4 text-center text-[var(--muted-foreground)]">
        <p>Không có dữ liệu nhân vật</p>
      </div>
    );
  }

  // Use server-provided total core attributes that include all bonuses
  const displayedStats = totalCoreAttributes;

  // Calculate percentages for bars
  const expPercent = nextLevel?.experienceRequired ? (user.experience / nextLevel.experienceRequired) * 100 : 100;
  const staminaPercent = stamina.maxStamina > 0 ? (stamina.currentStamina / stamina.maxStamina) * 100 : 0;

  // Calculate max HP from VIT (same formula as backend)
  const calculateMaxHp = (vit: number): number => {
    const baseMaxHp = 100;
    const hpFromVit = 12;
    const effective = Math.pow(Math.max(0, vit || 0), 0.94);
    return Math.floor(baseMaxHp + hpFromVit * effective);
  };

  // Calculate max Mana from INT (same formula as backend)
  const calculateMaxMana = (int: number): number => {
    const baseMana = 50;
    const manaFromInt = 10;
    const effective = Math.pow(Math.max(0, int || 0), 0.94);
    return Math.floor(baseMana + manaFromInt * effective);
  };

  const maxHp = calculateMaxHp(displayedStats.vit);
  const currentHp = stats.currentHp;
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;

  const maxMana = calculateMaxMana(displayedStats.int);
  const currentMana = stats.currentMana ?? maxMana; // Use maxMana if null (first combat)
  const manaPercent = maxMana > 0 ? (currentMana / maxMana) * 100 : 0;

  // Use server-authoritative combatPower only. Server calculates this when stats change
  // (level up, equip/unequip items, class advancement) and persists it to avoid race conditions.
  let combatPower: number | null = null;
  if (user && typeof (user as unknown as { combatPower?: number }).combatPower === 'number') {
    combatPower = (user as unknown as { combatPower?: number }).combatPower as number;
  }
  // No client-side fallback calculation to avoid double-counting or stale equippedItems
  combatPower = combatPower ?? 0;

  // Attribute allocation cell with + and - buttons for local state management
  const AttributeAllocationCell: React.FC<{
    icon: React.ReactNode;
    label: string;
    allocatedValue: number;
    totalValue: number;
    attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK';
    pendingAllocation: number;
    onAllocationChange: (attribute: 'STR' | 'INT' | 'DEX' | 'VIT' | 'LUK', delta: number) => void;
    canIncrease: boolean;
  }> = ({
    icon,
    label,
    allocatedValue,
    totalValue,
    attribute,
    pendingAllocation,
    onAllocationChange,
    canIncrease,
  }) => {
    const currentAllocated = allocatedValue + pendingAllocation;
    const canDecrease = currentAllocated > 0;

    return (
      <div className="flex items-center gap-2 p-1.5 border border-[var(--border)] rounded-md bg-[var(--card)] text-sm">
        <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <div className="text-[11px] text-[var(--muted-foreground)]">{label}</div>
          <div className="text-sm font-semibold leading-tight">
            {totalValue + pendingAllocation}
            {(allocatedValue > 0 || pendingAllocation > 0) && (
              <span className="text-green-500 text-xs ml-1">
                (+{allocatedValue + pendingAllocation})
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onAllocationChange(attribute, -1)}
            disabled={!canDecrease}
          >
            -
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onAllocationChange(attribute, 1)}
            disabled={!canIncrease}
          >
            +
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 p-3">
      {/* Thông tin nhân vật chính */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div className="flex flex-col">
                <div className="font-semibold text-sm">{user.username}</div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="text-xs py-0.5 px-2">Cấp {currentLevel.level}</Badge>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-[linear-gradient(90deg,#fef3c7,#fed7aa)] text-black font-semibold text-xs border border-[rgba(0,0,0,0.06)]">
                <Sword className="h-3 w-3 text-[rgba(0,0,0,0.6)]" />
                <span className="leading-none text-xs">{combatPower.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Lớp nhân vật */}
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Star className="h-3 w-3 text-[var(--chart-5)]" />
            <span className="text-xs font-medium">{characterClass?.name || 'Chưa chọn lớp'}</span>
          </div>

          {/* Thanh kinh nghiệm */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-[var(--chart-2)]" />
                <span className="text-[var(--chart-2)] font-medium text-xs">Kinh nghiệm</span>
              </div>
              <span className="text-[var(--chart-2)] font-bold text-sm">{user.experience}/{nextLevel?.experienceRequired || user.experience}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-[var(--chart-2)]" style={{ width: `${expPercent}%` }} />
            </div>
          </div>

          {/* Thanh năng lượng */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-[var(--chart-4)]" />
                <span className="text-[var(--chart-4)] font-medium text-xs">Năng lượng</span>
              </div>
              <span className="text-[var(--chart-4)] font-bold text-sm">{stamina.currentStamina}/{stamina.maxStamina}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-[var(--chart-4)]" style={{ width: `${staminaPercent}%` }} />
            </div>
          </div>

          {/* Thanh máu */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="text-red-500 font-medium text-xs">Máu</span>
              </div>
              <span className="text-red-500 font-bold text-sm">{currentHp}/{maxHp}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          {/* Thanh mana */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-blue-500" />
                <span className="text-blue-500 font-medium text-xs">Mana</span>
              </div>
              <span className="text-blue-500 font-bold text-sm">{currentMana}/{maxMana}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${manaPercent}%` }} />
            </div>
          </div>

          {/* Vàng */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-[var(--chart-1)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Vàng</span>
            </div>
            <span className="text-sm font-bold text-[var(--chart-1)]">{user.gold?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Thuộc tính (gộp chung) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Thuộc tính</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">Điểm tự do:</span>
            <Badge variant="secondary" className="text-xs">
              {remainingPoints}
            </Badge>
            {hasPendingChanges && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2"
                  onClick={handleCancelAllocations}
                  disabled={isAllocating}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={handleSaveAllocations}
                  disabled={isAllocating}
                >
                  {isAllocating ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            )}
            {userAttributes && (userAttributes.allocatedPoints.strength +
                               userAttributes.allocatedPoints.intelligence +
                               userAttributes.allocatedPoints.dexterity +
                               userAttributes.allocatedPoints.vitality +
                               userAttributes.allocatedPoints.luck) > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2"
                  onClick={async () => {
                    try {
                      const result = await userAttributesApi.resetAttributePoints();
                      if (result.success) {
                        toast.success(result.message);
                        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
                        queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
                        queryClient.invalidateQueries({ queryKey: ['user-attributes'] });
                      } else {
                        toast.error(result.message || 'Reset thất bại');
                      }
                    } catch (error) {
                      console.error('Reset attributes error:', error);
                      toast.error('Có lỗi xảy ra khi reset điểm');
                    }
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs h-6 px-2 bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    try {
                      const result = await userAttributesApi.recalculateAttributePoints();
                      if (result.success) {
                        toast.success(result.message + (result.pointsGranted ? ` (+${result.pointsGranted} điểm)` : ''));
                        queryClient.invalidateQueries({ queryKey: ['user-status', userId] });
                        queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
                        queryClient.invalidateQueries({ queryKey: ['user-attributes'] });
                      } else {
                        toast.error(result.message || 'Recalculate thất bại');
                      }
                    } catch (error) {
                      console.error('Recalculate attributes error:', error);
                      toast.error('Có lỗi xảy ra khi tính toán lại điểm');
                    }
                  }}
                >
                  Tính lại điểm
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <AttributeAllocationCell
              icon={<Sword className="h-4 w-4 text-[var(--chart-3)]" />}
              label="Sức mạnh"
              allocatedValue={userAttributes?.allocatedPoints.strength || 0}
              totalValue={displayedStats.str}
              attribute="STR"
              pendingAllocation={pendingAllocations.STR}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Zap className="h-4 w-4 text-[var(--accent)]" />}
              label="Trí tuệ"
              allocatedValue={userAttributes?.allocatedPoints.intelligence || 0}
              totalValue={displayedStats.int}
              attribute="INT"
              pendingAllocation={pendingAllocations.INT}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Zap className="h-4 w-4 text-[var(--chart-4)]" />}
              label="Nhanh nhẹn"
              allocatedValue={userAttributes?.allocatedPoints.dexterity || 0}
              totalValue={displayedStats.dex}
              attribute="DEX"
              pendingAllocation={pendingAllocations.DEX}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Shield className="h-4 w-4 text-[var(--chart-5)]" />}
              label="Sinh lực"
              allocatedValue={userAttributes?.allocatedPoints.vitality || 0}
              totalValue={displayedStats.vit}
              attribute="VIT"
              pendingAllocation={pendingAllocations.VIT}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
            <AttributeAllocationCell
              icon={<Star className="h-4 w-4 text-[var(--muted-foreground)]" />}
              label="May mắn"
              allocatedValue={userAttributes?.allocatedPoints.luck || 0}
              totalValue={displayedStats.luk}
              attribute="LUK"
              pendingAllocation={pendingAllocations.LUK}
              onAllocationChange={handleAllocationChange}
              canIncrease={remainingPoints > 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <SkillsSection />

      {/* Equipment and Title Section - 2 columns on PC, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equipped Items Section - 6 slots in human body layout */}
        <Card className="shadow-sm border border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-center flex items-center gap-2 justify-center">
              <Shield className="h-5 w-5" />
              Trang bị hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Human body layout grid */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              {/* Top row: Weapon - Helmet - Accessory */}
              <EquipmentSlot 
                type="weapon" 
                name="Vũ khí" 
                icon={<Sword className="h-4 w-4 text-orange-500" />}
                equippedItems={equippedItems || []}
              />
              <EquipmentSlot 
                type="helmet" 
                name="Mũ" 
                icon={<Shield className="h-4 w-4 text-blue-500" />}
                equippedItems={equippedItems || []}
              />
              <EquipmentSlot 
                type="accessory" 
                name="Phụ kiện" 
                icon={<Star className="h-4 w-4 text-purple-500" />}
                equippedItems={equippedItems || []}
              />
              
              {/* Middle row: Gloves - Armor - Empty */}
              <EquipmentSlot 
                type="gloves" 
                name="Găng tay" 
                icon={<Hand className="h-4 w-4 text-gray-500" />}
                equippedItems={equippedItems || []}
              />
              <EquipmentSlot 
                type="armor" 
                name="Áo giáp" 
                icon={<Shield className="h-4 w-4 text-green-500" />}
                equippedItems={equippedItems || []}
              />
              <div></div> {/* Empty slot for symmetry */}
              
              {/* Bottom row: Empty - Boots - Empty */}
              <div></div> {/* Empty slot */}
              <EquipmentSlot 
                type="boots" 
                name="Giày" 
                icon={<Footprints className="h-4 w-4 text-brown-500" />}
                equippedItems={equippedItems || []}
              />
              <div></div> {/* Empty slot */}
            </div>
          </CardContent>
        </Card>

        {/* Title & Class Advancement Section */}
        <Card className="shadow-sm border border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-center flex items-center gap-2 justify-center">
              <Crown className="h-5 w-5 text-yellow-500" />
              Danh hiệu & Chuyển chức
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Title Section */}
            <div className="text-center">
              <div className="mb-3">
                <span className="text-sm text-[var(--muted-foreground)]">Danh hiệu hiện tại:</span>
                <div className="mt-1">
                  <EquippedTitleDisplay />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTitleModal(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Crown className="h-4 w-4" />
                Quản lý Danh hiệu
              </Button>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]"></div>

            {/* Class Advancement Section */}
            <div className="text-center">
              <div className="mb-3">
                <span className="text-sm text-[var(--muted-foreground)]">Lớp hiện tại:</span>
                <div className="mt-1 font-medium text-blue-600">
                  {characterClass ? characterClass.name : 'Chưa chọn lớp'}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  {characterClass ? `Tier ${characterClass.tier}` : 'Chưa có lớp'}
                </div>
              </div>
              
              {/* Logic hiển thị button */}
              {!characterClass ? (
                // Chưa có class
                currentLevel.level >= 10 ? (
                  // Level >= 10: Hiển thị button Thức tỉnh
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAwakenModal(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Star className="h-4 w-4" />
                    Thức tỉnh
                  </Button>
                ) : (
                  // Level < 10: Hiển thị thông báo
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Cần đạt level 10 để thức tỉnh
                  </div>
                )
              ) : (
                // Đã có class: Hiển thị button chuyển chức tiếp theo
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowClassAdvancementModal(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Star className="h-4 w-4" />
                  Xem chuyển chức tiếp theo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  <AwakenModal open={showAwakenModal} onOpenChange={(v) => setShowAwakenModal(Boolean(v))} />
      <TitleModal open={showTitleModal} onOpenChange={(v) => setShowTitleModal(Boolean(v))} />
      <ClassAdvancementModal 
        open={showClassAdvancementModal} 
        onOpenChange={(v) => setShowClassAdvancementModal(Boolean(v))}
        currentClass={characterClass}
      />
    </div>
  );
};

export function AwakenModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const queryClient = useQueryClient();
  const handleAwaken = async () => {
    setIsProcessing(true);
    try {
      // Call server-authoritative awaken endpoint which will pick a Tier-1 class
      const res = await characterClassesApi.awaken();

      // server returns AdvancementResultDto: { success, newClass, statChanges, unlockedSkills, message }
      const name = res?.newClass?.name || 'Lớp mới';

      // Update client cache and zustand store so UI reflects new class and stat bonuses immediately
      try {
        // Invalidate/fetch user-status and related queries for fresh data
        // We don't have the userId from the awaken response, rely on existing store state
        const currentSnapshot = useUserStatusStore.getState();
        const uid = currentSnapshot?.user?.id;
        queryClient.invalidateQueries({ queryKey: ['user-status', uid] });
        queryClient.invalidateQueries({ queryKey: ['user-stats', uid] });
        queryClient.invalidateQueries({ queryKey: ['user', uid] });
      } catch (e) {
        // Non-fatal: keep going
        console.debug('Post-awaken cache update failed', e);
      }

      toast.success(`Thức tỉnh thành công: ${name}`);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Awaken failed', err);
      let msg = 'Thức tỉnh thất bại';
      try {
        const maybe = err as { response?: { data?: { message?: string } }; message?: string };
        if (maybe?.response?.data?.message) msg = maybe.response.data.message;
        else if (typeof maybe?.message === 'string') msg = maybe.message;
      } catch {}
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thức tỉnh</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Hành động này sẽ chọn ngẫu nhiên một lớp bậc 1 (Tier 1) cho nhân vật của bạn. Sau khi đã có lớp bậc 1, các lần nâng cấp tiếp theo (Tier 1 → Tier 2+) sẽ kiểm tra yêu cầu.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleAwaken} disabled={isProcessing}>{isProcessing ? 'Đang xử lý...' : 'Thức tỉnh'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Title Modal Component
export function TitleModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  // Fetch user titles using titlesApi
  const { data: userTitles = [], isLoading: userTitlesLoading } = useQuery({
    queryKey: ['user-titles', authUser?.id],
    queryFn: titlesApi.getUserTitles,
    enabled: !!authUser?.id && open,
  });

  // Fetch all available titles using titlesApi
  const { data: allTitles = [], isLoading: allTitlesLoading } = useQuery({
    queryKey: ['all-titles'],
    queryFn: titlesApi.getAllTitles,
    enabled: open,
  });

  // Get titles that user doesn't have yet
  const userTitleIds = new Set(userTitles.map((ut: any) => ut.titleId));
  const availableTitles = allTitles.filter((title: any) => !userTitleIds.has(title.id));

  const handleEquipTitle = async (titleId: number) => {
    setIsProcessing(true);
    try {
      await titlesApi.equipTitle(titleId);
      toast.success('Đã trang bị danh hiệu!');
      queryClient.invalidateQueries({ queryKey: ['user-titles'] });
    } catch {
      toast.error('Lỗi khi trang bị danh hiệu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnequipTitle = async () => {
    setIsProcessing(true);
    try {
      await titlesApi.unequipTitle();
      toast.success('Đã tháo danh hiệu!');
      queryClient.invalidateQueries({ queryKey: ['user-titles'] });
    } catch {
      toast.error('Lỗi khi tháo danh hiệu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlockTitle = async () => {
    setIsProcessing(true);
    try {
      const result = await titlesApi.checkAndUnlock();
      if (result.length > 0) {
        toast.success(`Đã mở khóa ${result.length} danh hiệu mới!`);
      } else {
        toast.info('Không có danh hiệu nào đủ điều kiện mở khóa');
      }
      queryClient.invalidateQueries({ queryKey: ['user-titles'] });
      queryClient.invalidateQueries({ queryKey: ['all-titles'] });
    } catch {
      toast.error('Không đủ điều kiện mở khóa');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'uncommon': return 'bg-green-100 text-green-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Quản lý Danh hiệu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Titles */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Danh hiệu đã sở hữu
            </h3>
            <div className="space-y-2">
              {userTitlesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : userTitles.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Chưa có danh hiệu nào
                </div>
              ) : (
                userTitles.map((userTitle: any) => (
                  <div 
                    key={userTitle.id}
                    className={`p-3 border rounded-lg ${userTitle.isEquipped ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="font-medium"
                            style={{ color: userTitle.title?.displayEffects?.color }}
                          >
                            {userTitle.title?.displayEffects?.prefix} {userTitle.title?.name}
                          </span>
                          <Badge className={getRarityColor(userTitle.title?.rarity || 'common')}>
                            {userTitle.title?.rarity}
                          </Badge>
                          {userTitle.isEquipped && (
                            <Badge variant="default" className="bg-yellow-500">
                              Đang trang bị
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{userTitle.title?.description}</p>
                        {userTitle.title?.stats && (
                          <div className="flex gap-2 text-xs">
                            {Object.entries(userTitle.title.stats).map(([stat, value]) => (
                              <span key={stat} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                {stat}: +{String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {userTitle.isEquipped ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleUnequipTitle}
                            disabled={isProcessing}
                          >
                            Tháo
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleEquipTitle(userTitle.title?.id)}
                            disabled={isProcessing}
                          >
                            Trang bị
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Titles to Unlock */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Danh hiệu có thể mở khóa
            </h3>
            <div className="space-y-2">
              {allTitlesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : availableTitles.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Không có danh hiệu nào để mở khóa
                </div>
              ) : (
                availableTitles.map((title: any) => (
                  <div 
                    key={title.id}
                    className="p-3 border rounded-lg border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="font-medium text-gray-500"
                            style={{ color: title.displayEffects?.color }}
                          >
                            {title.displayEffects?.prefix} {title.name}
                          </span>
                          <Badge className={getRarityColor(title.rarity)}>
                            {title.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{title.description}</p>
                        {title.stats && (
                          <div className="flex gap-2 text-xs mb-2">
                            {Object.entries(title.stats).map(([stat, value]) => (
                              <span key={stat} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {stat}: +{String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={handleUnlockTitle}
                          disabled={isProcessing}
                        >
                          Kiểm tra & Mở khóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default StatusTab;
