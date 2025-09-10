import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Zap } from 'lucide-react';

export default function WorldBossButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
        >
          <Crown className="h-8 w-8 text-purple-600" />
          <span className="font-medium">World Boss</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-purple-600" />
            <span>Chế Độ World Boss</span>
          </DialogTitle>
          <DialogDescription>
            Đây là trang World Boss - nơi bạn có thể tham gia đánh boss thế giới cùng với cộng đồng
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
