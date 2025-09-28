import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { PvpSeason, RANK_NAMES } from '../AdminPvP';
import { ItemSelector } from './ItemSelector';

interface EditRewardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season: PvpSeason | null;
  onSuccess: () => void;
}

export function EditRewardsDialog({ open, onOpenChange, season, onSuccess }: EditRewardsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rewardsForm, setRewardsForm] = useState<PvpSeason['rewards'] | null>(null);

  useEffect(() => {
    if (season && open) {
      setRewardsForm(season.rewards);
    }
  }, [season, open]);

  const handleUpdateRewards = async () => {
    if (!season || !rewardsForm) return;

    setLoading(true);
    try {
      await api.put(`/admin/pvp/seasons/${season.id}/rewards`, rewardsForm);
      toast.success('Cập nhật phần thưởng thành công!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating rewards:', error);
      toast.error('Lỗi khi cập nhật phần thưởng');
    } finally {
      setLoading(false);
    }
  };

  if (!rewardsForm) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phần thưởng</DialogTitle>
          <DialogDescription>
            Cập nhật phần thưởng hàng ngày và cuối mùa cho {season?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Phần thưởng hàng ngày</h4>
            <div className="space-y-4">
              {Object.entries(rewardsForm.daily).map(([rank, reward]) => (
                <div key={rank} className="p-4 border rounded-lg space-y-4">
                  <div className="font-medium text-lg">
                    {RANK_NAMES[rank as keyof typeof RANK_NAMES]}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Gold</Label>
                      <Input
                        type="number"
                        value={reward.gold}
                        onChange={(e) => {
                          const newRewards = {...rewardsForm};
                          newRewards.daily[rank].gold = parseInt(e.target.value) || 0;
                          setRewardsForm(newRewards);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Experience</Label>
                      <Input
                        type="number"
                        value={reward.experience}
                        onChange={(e) => {
                          const newRewards = {...rewardsForm};
                          newRewards.daily[rank].experience = parseInt(e.target.value) || 0;
                          setRewardsForm(newRewards);
                        }}
                      />
                    </div>
                  </div>

                  <ItemSelector
                    items={reward.items || []}
                    onItemsChange={(items) => {
                      const newRewards = {...rewardsForm};
                      newRewards.daily[rank].items = items;
                      setRewardsForm(newRewards);
                    }}
                    label="Items thưởng"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Phần thưởng cuối mùa</h4>
            <div className="space-y-4">
              {Object.entries(rewardsForm.seasonal).map(([tier, reward]) => (
                <div key={tier} className="p-4 border rounded-lg space-y-4">
                  <div className="font-medium text-lg">
                    {tier === 'top1' ? '🥇 Top 1' : tier === 'top2to3' ? '🥈 Top 2-3' : '🥉 Top 4-10'}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Gold</Label>
                      <Input
                        type="number"
                        value={reward.gold}
                        onChange={(e) => {
                          const newRewards = {...rewardsForm};
                          (newRewards.seasonal as any)[tier].gold = parseInt(e.target.value) || 0;
                          setRewardsForm(newRewards);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Experience</Label>
                      <Input
                        type="number"
                        value={reward.experience}
                        onChange={(e) => {
                          const newRewards = {...rewardsForm};
                          (newRewards.seasonal as any)[tier].experience = parseInt(e.target.value) || 0;
                          setRewardsForm(newRewards);
                        }}
                      />
                    </div>
                  </div>

                  <ItemSelector
                    items={reward.items || []}
                    onItemsChange={(items) => {
                      const newRewards = {...rewardsForm};
                      (newRewards.seasonal as any)[tier].items = items;
                      setRewardsForm(newRewards);
                    }}
                    label="Items thưởng đặc biệt"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateRewards} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật phần thưởng'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
