import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

export default function DungeonButton({}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
        >
          <MapPin className="h-8 w-8 text-blue-600" />
          <span className="font-medium">Dungeon</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Chế Độ Dungeon</span>
          </DialogTitle>
          <DialogDescription>
            Tham gia phòng dungeon hoặc tạo phòng mới để bắt đầu cuộc phiêu lưu
          </DialogDescription>
        </DialogHeader>
        {/* The actual content is handled in ExploreTab - this is just a trigger + wrapper */}
      </DialogContent>
    </Dialog>
  );
}
