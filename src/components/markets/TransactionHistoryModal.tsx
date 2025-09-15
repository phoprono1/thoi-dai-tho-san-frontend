"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface HistoryEntry { id: number; itemId: number; buyerId: number; sellerId: number; price: number; createdAt?: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  history: HistoryEntry[];
  getUserName?: (id?: number | null) => string;
}

export default function TransactionHistoryModal({ open, onOpenChange, history, getUserName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lịch sử giao dịch</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-auto">
          {history.length === 0 ? (
            <div className="text-sm text-gray-500">Không có giao dịch</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th>ID</th>
                  <th>Item</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="py-1">{h.id}</td>
                    <td>{h.itemId}</td>
                    <td>{getUserName ? getUserName(h.buyerId) : h.buyerId}</td>
                    <td>{getUserName ? getUserName(h.sellerId) : h.sellerId}</td>
                    <td>{h.price}</td>
                    <td>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
