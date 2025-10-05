import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Target,
  ArrowUpCircle,
  Eye,
  Droplet,
  ShieldPlus,
  Sparkles,
  RefreshCcw,
  Loader2,
} from 'lucide-react';

interface CombatStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

interface CombatStatsData {
  coreStats: {
    str: number;
    int: number;
    dex: number;
    vit: number;
    luk: number;
  };
  combatStats: {
    maxHp: number;
    maxMana: number;
    attack: number;
    defense: number;
    critRate: number;
    critDamage: number;
    dodgeRate: number;
    accuracy: number;
    lifesteal: number;
    armorPen: number;
    comboRate: number;
    counterRate: number;
  };
}

export function CombatStatsModal({
  open,
  onOpenChange,
  userId,
}: CombatStatsModalProps) {
  const { data, isLoading } = useQuery<CombatStatsData>({
    queryKey: ['combat-stats', userId],
    queryFn: async () => {
      const response = await api.get(`/user-stats/user/${userId}/combat-stats`);
      return response.data;
    },
    enabled: open,
  });

  const statCategories = [
    {
      title: 'Chỉ số chiến đấu cơ bản',
      stats: [
        {
          icon: Heart,
          label: 'HP tối đa',
          value: data?.combatStats.maxHp,
          suffix: '' as string | undefined,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          description: 'Từ VIT × 12',
        },
        {
          icon: Zap,
          label: 'Mana tối đa',
          value: data?.combatStats.maxMana,
          suffix: '' as string | undefined,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          description: 'Từ INT × 10 + 50',
        },
        {
          icon: Swords,
          label: 'Tấn công',
          value: data?.combatStats.attack,
          suffix: '' as string | undefined,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          description: 'STR×0.45 + INT×0.6 + DEX×0.18',
        },
        {
          icon: Shield,
          label: 'Phòng thủ',
          value: data?.combatStats.defense,
          suffix: '' as string | undefined,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          description: 'Từ VIT × 0.5',
        },
      ],
    },
    {
      title: 'Chỉ số chiến thuật',
      stats: [
        {
          icon: Target,
          label: 'Tỉ lệ chí mạng',
          value: data?.combatStats.critRate,
          suffix: '%',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          description: 'Từ LUK × 0.28 (tối đa 75%)',
        },
        {
          icon: ArrowUpCircle,
          label: 'Sát thương chí mạng',
          value: data?.combatStats.critDamage,
          suffix: '%',
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          description: 'Từ LUK × 0.15 (base: 150%)',
        },
        {
          icon: Eye,
          label: 'Né tránh',
          value: data?.combatStats.dodgeRate,
          suffix: '%',
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          description: 'Từ DEX × 0.25 (tối đa 70%)',
        },
        {
          icon: Target,
          label: 'Chính xác',
          value: data?.combatStats.accuracy,
          suffix: '%',
          color: 'text-cyan-500',
          bgColor: 'bg-cyan-500/10',
          description: 'Từ DEX × 0.3 (base: 85%)',
        },
      ],
    },
    {
      title: 'Chỉ số đặc biệt',
      stats: [
        {
          icon: Droplet,
          label: 'Hút máu',
          value: data?.combatStats.lifesteal,
          suffix: '%',
          color: 'text-rose-500',
          bgColor: 'bg-rose-500/10',
          description: 'Từ LUK × 0.08',
        },
        {
          icon: ShieldPlus,
          label: 'Xuyên giáp',
          value: data?.combatStats.armorPen,
          suffix: '%',
          color: 'text-pink-500',
          bgColor: 'bg-pink-500/10',
          description: 'Từ STR × 0.15',
        },
        {
          icon: Sparkles,
          label: 'Đòn kép',
          value: data?.combatStats.comboRate,
          suffix: '%',
          color: 'text-violet-500',
          bgColor: 'bg-violet-500/10',
          description: 'Từ DEX × 0.12',
        },
        {
          icon: RefreshCcw,
          label: 'Phản đòn',
          value: data?.combatStats.counterRate,
          suffix: '%',
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-500/10',
          description: 'Từ VIT × 0.08',
        },
      ],
    },
  ];

  const coreStatsDisplay = [
    { label: 'STR', value: data?.coreStats.str, color: 'text-red-400' },
    { label: 'INT', value: data?.coreStats.int, color: 'text-blue-400' },
    { label: 'DEX', value: data?.coreStats.dex, color: 'text-green-400' },
    { label: 'VIT', value: data?.coreStats.vit, color: 'text-yellow-400' },
    { label: 'LUK', value: data?.coreStats.luk, color: 'text-purple-400' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Swords className="h-5 w-5" />
            Chi tiết chỉ số chiến đấu
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Core Stats Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <h3 className="text-sm font-semibold mb-3 text-foreground">
                Chỉ số cơ bản (Core Stats)
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {coreStatsDisplay.map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-2 rounded-md bg-background/50"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {stat.label}
                    </div>
                    <div className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Stats Categories */}
            {statCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  {category.title}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {category.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}
                        >
                          <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            {stat.label}
                          </div>
                          <div className={`text-xl font-bold ${stat.color}`}>
                            {stat.value?.toFixed(1)}
                            {stat.suffix || ''}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            {stat.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Note */}
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50 border border-border">
              <strong>Lưu ý:</strong> Các chỉ số chiến đấu được tính toán tự
              động dựa trên chỉ số cơ bản (STR, INT, DEX, VIT, LUK) cùng với
              trang bị, buff từ guild, class bonus và các nguồn khác.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
