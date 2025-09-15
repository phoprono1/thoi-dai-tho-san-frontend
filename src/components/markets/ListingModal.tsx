"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ItemFull { id: number; name?: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: Array<ItemFull>;
  userItems: Array<{ id: number; itemId: number; quantity: number; item?: ItemFull }>;
  itemById: Map<number, ItemFull>;
  listingQuery: string;
  setListingQuery: (s: string) => void;
  showListingDropdown: boolean;
  setShowListingDropdown: (b: boolean) => void;
  newListingItemId: number | '';
  setNewListingItemId: (v: number | '') => void;
  newListingPrice: number | '';
  setNewListingPrice: (v: number | '') => void;
  newListingQuantity: number | '';
  setNewListingQuantity: (v: number | '') => void;
  createListing: () => Promise<void>;
}

export default function ListingModal(props: Props) {
  const {
    open,
    onOpenChange,
    items,
    userItems,
    itemById,
    listingQuery,
    setListingQuery,
    showListingDropdown,
    setShowListingDropdown,
    newListingItemId,
    setNewListingItemId,
    newListingPrice,
    setNewListingPrice,
    newListingQuantity,
    setNewListingQuantity,
    createListing,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo listing mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm">Tìm theo tên hoặc ID</label>
            <Input
              value={listingQuery}
              onChange={(e) => { setListingQuery(e.target.value); setShowListingDropdown(true); }}
              onFocus={() => setShowListingDropdown(true)}
              placeholder="Gõ tên hoặc ID để tìm"
            />
            {showListingDropdown && (
              <div className="absolute z-20 left-0 right-0 bg-white dark:bg-slate-800 border mt-1 max-h-60 overflow-auto rounded shadow">
                <div className="p-2">
                  {userItems.length > 0 ? (
                    userItems
                      .filter((ui) => {
                        const q = listingQuery.trim().toLowerCase();
                        if (!q) return true;
                        const name = (ui.item?.name || '').toLowerCase();
                        return String(ui.id).includes(q) || String(ui.itemId).includes(q) || name.includes(q);
                      })
                      .slice(0, 200)
                      .map((ui) => (
                        <div
                          key={ui.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setNewListingItemId(ui.id);
                            setListingQuery('');
                            setShowListingDropdown(false);
                          }}
                        >
                          <div className="text-sm font-medium">{ui.item?.name || `Item ${ui.itemId}`}</div>
                          <div className="text-xs text-gray-500">UserItem ID: {ui.id} • Item ID: {ui.itemId} • Qty: {ui.quantity}</div>
                        </div>
                      ))
                  ) : (
                    items
                      .filter((it) => {
                        const q = listingQuery.trim().toLowerCase();
                        if (!q) return true;
                        return String(it.id).includes(q) || (it.name || '').toLowerCase().includes(q);
                      })
                      .slice(0, 200)
                      .map((it) => (
                        <div
                          key={it.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setNewListingItemId(it.id);
                            setListingQuery('');
                            setShowListingDropdown(false);
                          }}
                        >
                          <div className="text-sm font-medium">{it.name}</div>
                          <div className="text-xs text-gray-500">ID: {it.id}</div>
                        </div>
                      ))
                  )}
                  {items.length === 0 && <div className="text-sm text-gray-500">No items</div>}
                </div>
              </div>
            )}
            {newListingItemId && (
              <div className="mt-2 text-sm">Selected: {userItems.find(u => u.id === Number(newListingItemId))?.item?.name || itemById.get(Number(newListingItemId))?.name || `Item ${newListingItemId}`}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">Price</label>
              <Input type="number" value={newListingPrice ?? ''} onChange={(e) => setNewListingPrice(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div>
              <label className="block text-sm">Quantity</label>
              <Input type="number" min={1} value={newListingQuantity ?? 1} onChange={(e) => setNewListingQuantity(e.target.value ? Number(e.target.value) : 1)} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={async () => { await createListing(); onOpenChange(false); }}>Tạo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
