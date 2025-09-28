import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Gift, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface PvpManagementProps {
  onRefresh: () => void;
}

export function PvpManagement({ onRefresh }: PvpManagementProps) {
  const [loading, setLoading] = useState(false);

  const handleResetRankings = async () => {
    if (!confirm('Bạn có chắc chắn muốn reset tất cả rankings không? Hành động này không thể hoàn tác!')) return;

    setLoading(true);
    try {
      await api.post('/admin/pvp/reset-rankings');
      toast.success('Reset rankings thành công!');
      onRefresh();
    } catch (error) {
      console.error('Error resetting rankings:', error);
      toast.error('Lỗi khi reset rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeRewards = async () => {
    if (!confirm('Bạn có chắc chắn muốn phát thưởng cuối mùa cho top 10 không?')) return;

    setLoading(true);
    try {
      const response = await api.post('/admin/pvp/distribute-seasonal-rewards');
      toast.success(`Phát thưởng thành công cho ${response.data.rewards.length} người chơi!`);
    } catch (error) {
      console.error('Error distributing rewards:', error);
      toast.error('Lỗi khi phát thưởng');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPlayers = async () => {
    if (!confirm('Bạn có chắc chắn muốn đồng bộ hóa tất cả người chơi vào hệ thống PvP không?')) return;

    setLoading(true);
    try {
      const response = await api.post('/admin/pvp/sync-players');
      const { syncedCount, message } = response.data;
      
      if (syncedCount > 0) {
        toast.success(`Đồng bộ thành công ${syncedCount} người chơi!`);
      } else {
        toast.info('Tất cả người chơi đã có trong hệ thống PvP');
      }
      
      onRefresh();
    } catch (error: any) {
      console.error('Error syncing players:', error);
      const errorMsg = error.response?.data?.message || 'Lỗi khi đồng bộ người chơi';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Đồng bộ người chơi</CardTitle>
          <CardDescription>Khởi tạo ranking cho tất cả người chơi chưa có trong hệ thống PvP</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSyncPlayers}
            disabled={loading}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Đồng bộ người chơi
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Rankings</CardTitle>
          <CardDescription>Reset tất cả rankings về mặc định cho mùa giải mới</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleResetRankings}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset tất cả Rankings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phát thưởng cuối mùa</CardTitle>
          <CardDescription>Phát thưởng cho top 10 người chơi cuối mùa</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDistributeRewards}
            disabled={loading}
            className="w-full"
          >
            <Gift className="h-4 w-4 mr-2" />
            Phát thưởng Top 10
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
