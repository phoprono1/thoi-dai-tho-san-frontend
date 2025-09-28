import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { RANK_NAMES } from '../AdminPvP';

interface CreateSeasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSeasonDialog({ open, onOpenChange, onSuccess }: CreateSeasonDialogProps) {
  const [loading, setLoading] = useState(false);
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [rewardsForm, setRewardsForm] = useState<any>(null);

  const fetchDefaultConfig = async () => {
    try {
      const response = await api.get('/admin/pvp/default-season-config');
      const config = response.data;
      setSeasonForm({
        name: config.name,
        description: config.description || '',
        startDate: config.startDate.split('T')[0],
        endDate: config.endDate.split('T')[0],
      });
      setRewardsForm(config.rewards);
    } catch (error) {
      console.error('Error fetching default config:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDefaultConfig();
    }
  }, [open]);

  const handleCreateSeason = async () => {
    if (!seasonForm.name || !seasonForm.startDate || !seasonForm.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/pvp/seasons', {
        ...seasonForm,
        rewards: rewardsForm,
      });
      toast.success('Tạo mùa giải thành công!');
      onOpenChange(false);
      setSeasonForm({ name: '', description: '', startDate: '', endDate: '' });
      setRewardsForm(null);
      onSuccess();
    } catch (error) {
      console.error('Error creating season:', error);
      toast.error('Lỗi khi tạo mùa giải');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo mùa giải mới</DialogTitle>
          <DialogDescription>
            Tạo mùa giải PvP mới với cấu hình phần thưởng
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tên mùa giải</Label>
              <Input
                value={seasonForm.name}
                onChange={(e) => setSeasonForm({...seasonForm, name: e.target.value})}
                placeholder="Mùa Xuân 2024"
              />
            </div>
            <div>
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={seasonForm.startDate}
                onChange={(e) => setSeasonForm({...seasonForm, startDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={seasonForm.endDate}
                onChange={(e) => setSeasonForm({...seasonForm, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={seasonForm.description}
              onChange={(e) => setSeasonForm({...seasonForm, description: e.target.value})}
              placeholder="Mô tả về mùa giải..."
            />
          </div>

          {/* Rewards Preview */}
          {rewardsForm && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Phần thưởng hàng ngày (preview)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(rewardsForm.daily).slice(0, 4).map(([rank, reward]: [string, any]) => (
                  <div key={rank} className="flex justify-between">
                    <span>{RANK_NAMES[rank as keyof typeof RANK_NAMES]}</span>
                    <span>{reward.gold} gold, {reward.experience} exp</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSeason} disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo mùa giải'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
