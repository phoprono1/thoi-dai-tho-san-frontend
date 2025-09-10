import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

export default function PvPButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-300"
        >
          <Target className="h-8 w-8 text-red-600" />
          <span className="font-medium">PvP</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-red-600" />
            <span>Chế Độ PvP</span>
          </DialogTitle>
          <DialogDescription>
            Đây là trang PvP - nơi bạn có thể đấu với các người chơi khác
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
