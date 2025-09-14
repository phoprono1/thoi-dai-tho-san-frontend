'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useUIStore } from '@/stores';
import { useMailboxStore } from '@/stores/useMailboxStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface MailItem {
  id: number;
  subject?: string;
  body?: string;
  rewards?: { gold?: number; items?: Array<{ itemId: number; qty: number }>; exp?: number };
  unread?: boolean;
  createdAt?: string;
}

export default function MailboxModal() {
  const { modalOpen, modalType, closeModal } = useUIStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mails, setMails] = useState<MailItem[]>([]);
  const latestMail = useMailboxStore((s) => s.latestMail);
  const unreadCount = useMailboxStore((s) => s.unreadCount);

  // Update open state and load mails when modal opens
  useEffect(() => {
    setOpen(modalOpen && modalType === 'mailbox');
    if (modalOpen && modalType === 'mailbox') {
      loadMails();
    }
  }, [modalOpen, modalType]);

  // When the global mailbox store reports a new mail, reload if modal is open
  useEffect(() => {
    if (!latestMail) return;
    if (modalOpen && modalType === 'mailbox') {
      loadMails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestMail]);

  // if unreadCount changes while modal open, reload
  useEffect(() => {
    if (modalOpen && modalType === 'mailbox') {
      loadMails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  const loadMails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mailbox');
      type RawMail = {
        id: number;
        title?: string;
        content?: string;
        rewards?: { gold?: number; experience?: number; items?: Array<{ itemId: number; quantity?: number; qty?: number }> };
        status?: string;
        createdAt?: string;
      };
  const raw: RawMail[] = res.data || [];
  const mapped: MailItem[] = raw.map((r: RawMail) => ({
        id: r.id,
        subject: r.title,
        body: r.content,
        rewards: {
          gold: r.rewards?.gold,
          exp: r.rewards?.experience,
          items: Array.isArray(r.rewards?.items)
            ? r.rewards.items.map((it: { itemId: number; quantity?: number; qty?: number }) => ({ itemId: it.itemId, qty: it.quantity || it.qty || 1 }))
            : [],
        },
        unread: r.status === 'unread',
        createdAt: r.createdAt,
      }));
      setMails(mapped);
    } catch {
      toast.error('Không lấy được mailbox');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    closeModal();
  };

  const handleClaim = async (mailId: number) => {
    try {
  await api.post(`/mailbox/${mailId}/claim`);
      toast.success('Đã nhận thưởng');
      // Remove mail from UI (server marks as claimed)
      setMails((prev) => prev.filter((m) => m.id !== mailId));

      // If server returned updated unread count, update global mailbox store
      try {
        // call unread-count endpoint to refresh
        const ures = await api.get('/mailbox/unread-count');
        const count = ures.data?.unreadCount ?? 0;
        useMailboxStore.getState().setUnread(count);
      } catch {
        // ignore
      }
    } catch {
      toast.error('Nhận thưởng thất bại');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mailbox</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-3">
              {mails.length === 0 ? (
                <div className="text-sm text-gray-500">Không có thư</div>
              ) : (
                mails.map((m) => (
                  <Card key={m.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{m.subject || `Mail #${m.id}`}</span>
                        <span className="text-xs text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700 mb-2">{m.body}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {m.rewards?.gold ? <div>Gold: {m.rewards.gold}</div> : null}
                          {m.rewards?.exp ? <div>EXP: {m.rewards.exp}</div> : null}
                          {m.rewards?.items && m.rewards.items.length > 0 ? (
                            <div>Items: {m.rewards.items.map((it) => `${it.itemId} x${it.qty}`).join(', ')}</div>
                          ) : null}
                        </div>
                        <div>
                          <Button size="sm" onClick={() => handleClaim(m.id)}>Claim</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
