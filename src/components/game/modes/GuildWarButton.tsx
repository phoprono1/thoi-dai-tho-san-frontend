import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export default function GuildWarButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300"
        >
          <Shield className="h-8 w-8 text-green-600" />
          <span className="font-medium">Guild War</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Chế Độ Guild War</span>
          </DialogTitle>
          <DialogDescription>
            Đây là trang Guild War - nơi các công hội đối đầu với nhau trong chiến tranh công hội
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
