"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Offer { id: number; listingId: number; buyerId: number; amount: number; accepted: boolean; cancelled: boolean; quantity?: number }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offers: Offer[]; // offers where current user is buyer
  allOffersByListing: Record<number, Offer[]>;
  onCancelOffer: (offerId: number) => void;
  getUserName?: (id?: number | null) => string;
}

export default function MyOffersModal({ open, onOpenChange, offers, allOffersByListing, onCancelOffer, getUserName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offers của tôi</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-auto">
          {offers.length === 0 ? (
            <div className="text-sm text-gray-500">Bạn chưa có offer nào</div>
          ) : (
            offers.map((o) => {
              // determine if outbid: there exists an offer on same listing with higher amount and not cancelled
              const all = allOffersByListing[o.listingId] || [];
              const higher = all.some((ao) => !ao.cancelled && ao.amount > o.amount);
              return (
                <div key={o.id} className={`p-2 border rounded flex justify-between ${higher ? 'opacity-80' : ''}`}>
                  <div>
                    <div className="text-sm">Offer #{o.id} • Listing {o.listingId} • Người mua: {getUserName ? getUserName(o.buyerId) : `#${o.buyerId}`} • Số lượng: {o.quantity ?? 1} • Giá: {o.amount}</div>
                    {higher && <div className="text-xs text-yellow-600">Bạn đã bị outbid</div>}
                    {o.cancelled && <div className="text-xs text-gray-500">Đã hủy</div>}
                    {o.accepted && <div className="text-xs text-green-600">Đã được chấp nhận</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!o.cancelled && !o.accepted && (
                      <Button size="sm" variant="destructive" onClick={() => onCancelOffer(o.id)}>Hủy</Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
