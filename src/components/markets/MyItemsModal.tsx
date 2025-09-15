"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Offer { id: number; listingId: number; buyerId: number; amount: number; accepted: boolean; cancelled: boolean; quantity?: number }

interface Listing { id: number; itemId: number; sellerId: number; price: number; active: boolean; quantity?: number }

interface ItemFull { id: number; name?: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listings: Listing[];
  itemById: Map<number, ItemFull>;
  offersByListing: Record<number, Offer[]>;
  onAcceptOffer: (offerId: number) => void;
  onCancelOffer: (offerId: number) => void;
  authUserId?: number | null;
  getUserName?: (id?: number | null) => string;
}

export default function MyItemsModal({ open, onOpenChange, listings, itemById, offersByListing, onAcceptOffer, onCancelOffer, authUserId, getUserName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rao bán của tôi</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-auto">
          {listings.length === 0 ? (
            <div className="text-sm text-gray-500">Bạn chưa có listing đang bán</div>
          ) : (
            listings.map((l) => (
              <div key={l.id} className="p-2 border rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{itemById.get(l.itemId)?.name || `Item ${l.itemId}`}</div>
                    <div className="text-xs text-gray-500">Listing #{l.id} • Giá: {l.price} • Qty: {l.quantity ?? 1}</div>
                  </div>
                  <div className="text-sm">Người bán: {getUserName ? getUserName(l.sellerId) : `#${l.sellerId}`}</div>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Offers</div>
                  {(offersByListing[l.id] || []).length === 0 ? (
                    <div className="text-sm text-gray-500">Chưa có offer</div>
                  ) : (
                    (() => {
                      const offers: Offer[] = (offersByListing[l.id] || []).slice();
                      // sort: pending (not accepted, not cancelled) first, then accepted, then cancelled
                      offers.sort((a: Offer, b: Offer) => {
                        const score = (o: Offer) => (o.cancelled ? 2 : (o.accepted ? 1 : 0));
                        return score(a) - score(b) || (b.amount - a.amount);
                      });
                      return offers.map((o) => (
                        <div key={o.id} className={`p-2 border rounded mb-1 flex items-center justify-between ${o.accepted || o.cancelled ? 'opacity-60' : ''}`}>
                          <div className="text-sm">Offer #{o.id} • Người mua: {getUserName ? getUserName(o.buyerId) : `#${o.buyerId}`} • Số lượng: {o.quantity ?? 1} • Giá: {o.amount} • {o.accepted ? 'Đã chấp nhận' : o.cancelled ? 'Đã hủy' : 'Đang chờ'}</div>
                          <div className="flex gap-2">
                            {authUserId && authUserId === l.sellerId && !o.accepted && !o.cancelled && (
                              <Button size="sm" onClick={() => onAcceptOffer(o.id)}>Chấp nhận</Button>
                            )}
                            {authUserId && authUserId === o.buyerId && !o.accepted && !o.cancelled && (
                              <Button size="sm" variant="destructive" onClick={() => onCancelOffer(o.id)}>Hủy</Button>
                            )}
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
