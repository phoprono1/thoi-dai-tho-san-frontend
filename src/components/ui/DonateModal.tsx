"use client";

import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function DonateModal() {
  const { modalOpen, modalType, closeModal } = useUIStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(modalOpen && modalType === 'donate');
  }, [modalOpen, modalType]);

  const handleClose = () => {
    setOpen(false);
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="mx-auto w-56 h-56 relative">
            {/* Place your QR image at /public/donate-qr.png */}
            <Image src="/donate.png" alt="Donate QR" fill style={{ objectFit: 'contain' }} />
          </div>

          <div className="text-sm text-gray-700">
            Cảm ơn bạn đã muốn ủng hộ! Sau khi donate, hãy liên hệ admin qua kênh Discord của game để thông báo và nhận hậu lễ.
          </div>

          <div className="flex justify-end">
            <Button onClick={handleClose}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
