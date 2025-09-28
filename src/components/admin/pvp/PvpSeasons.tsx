import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { PvpSeason } from '../AdminPvP';

interface PvpSeasonsProps {
  seasons: PvpSeason[];
  onEditRewards: (season: PvpSeason) => void;
  onRefresh: () => void;
}

export function PvpSeasons({ seasons, onEditRewards, onRefresh }: PvpSeasonsProps) {
  const handleDeleteSeason = async (seasonId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mùa giải này không?')) return;

    try {
      await api.delete(`/admin/pvp/seasons/${seasonId}`);
      toast.success('Xóa mùa giải thành công!');
      onRefresh();
    } catch (error) {
      console.error('Error deleting season:', error);
      toast.error('Lỗi khi xóa mùa giải');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách mùa giải</CardTitle>
        <CardDescription>Quản lý các mùa giải PvP</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên mùa giải</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasons.map((season) => (
              <TableRow key={season.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{season.name}</div>
                    <div className="text-sm text-muted-foreground">{season.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(season.startDate).toLocaleDateString('vi-VN')}</div>
                    <div className="text-muted-foreground">
                      đến {new Date(season.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={season.isActive ? 'default' : 'secondary'}>
                    {season.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRewards(season)}
                      title="Chỉnh sửa phần thưởng"
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSeason(season.id)}
                      disabled={season.isActive}
                      title="Xóa mùa giải"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
