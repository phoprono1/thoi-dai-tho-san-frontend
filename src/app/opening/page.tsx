'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';

const POEMS = [
  `Thế giới bóng đêm, hầm ngục sâu thẳm,\nThợ săn dũng cảm, bước chân không chùn.\nÁnh đuốc le lói, soi đường tiến thẳng,\nQuái vật gầm rú, trận chiến khốc liệt.`,
  `Vũ khí sắc bén, áo giáp kiên cường,\nKỹ năng tinh nhuệ, chiến đấu không ngừng.\nMỗi bước tiến lên, thử thách gian nan,\nHuyền thoại thợ săn, danh tiếng vang xa.`,
  `Đại địa rung chuyển, âm thanh rền vang,\nQuỷ dữ hiện hình, sức mạnh kinh hoàng.\nThợ săn cô độc, liều mình chiến đấu,\nBảo vệ thế giới, nguyện ước son vàng.`,
  `Từ hầm ngục tối, lên đỉnh vinh quang,\nChiến lợi phẩm quý, rạng rỡ hào quang.\nThần thoại thợ săn, mãi mãi bất diệt,\nHuyền thoại sống dậy, tiếng gọi anh hùng.`,
  `Tựa game vang danh, thời đại anh hùng,\nThợ săn kiên cường, chiến thắng muôn trùng.\nHầm ngục sâu thẳm, thử thách khắc nghiệt,\nNhưng lòng dũng cảm, mãi mãi không khuất.`
];

export default function OpeningPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [index, setIndex] = useState(-1);
  const [showDialog, setShowDialog] = useState(false);
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState('');
  const mountedRef = useRef(true);
  const timersRef = useRef<number[]>([]);
  const [stanzaDone, setStanzaDone] = useState(false);
  const continueResolveRef = useRef<(() => void) | null>(null);
  const [finalTransition, setFinalTransition] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    const clearAllTimers = () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          resolve();
          timersRef.current = timersRef.current.filter((x) => x !== id);
        }, ms);
        timersRef.current.push(id);
      });

    const playSequential = async () => {
      for (let s = 0; s < POEMS.length && mountedRef.current; s++) {
        const stanza = POEMS[s];
        setIndex(s);

        // blink (close eyes)
        setVisible(false);
        await sleep(300);

        // open eyes and type
        setVisible(true);
        setTyped('');
        for (let i = 1; i <= stanza.length && mountedRef.current; i++) {
          setTyped(stanza.slice(0, i));
          await sleep(30);
        }

        // stanza done, show continue button and wait for user or auto timeout
        setStanzaDone(true);
        await new Promise<void>((resolve) => {
          // auto-continue after 3500ms
          const auto = window.setTimeout(() => {
            resolve();
          }, 3500);
          timersRef.current.push(auto);
          continueResolveRef.current = () => {
            clearTimeout(auto);
            resolve();
          };
        });
        continueResolveRef.current = null;
        setStanzaDone(false);

        // fade out
        setVisible(false);
        await sleep(300);
      }

      if (mountedRef.current) {
        setShowDialog(true);
        localStorage.setItem('seenOpening', '1');
      }
    };

    playSequential();

    return () => {
      mountedRef.current = false;
      clearAllTimers();
      continueResolveRef.current = null;
    };
  }, []);

  const handleStart = () => {
    // Play final darken transition then navigate
    setFinalTransition(true);
    // small delay to allow overlay to appear
    window.setTimeout(() => router.push('/game'), 420);
  };

  const handleQuit = () => {
    logout();
    router.push('/login');
  };

  const handleSkip = () => {
    // stop cinematic and open dialog immediately
    if (continueResolveRef.current) continueResolveRef.current();
    mountedRef.current = false;
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    localStorage.setItem('seenOpening', '1');
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      {/* subtle zoom + blur background effect */}
      <div className={`absolute inset-0 bg-gradient-to-b from-black via-[#040406] to-[#060308] transition-transform duration-700 ${visible ? 'scale-100' : 'scale-105'}`} style={{ transformOrigin: 'center' }} />

      {/* blink overlay */}
      <div className={`absolute inset-0 bg-black z-20 transition-transform duration-300 ${visible ? 'scale-y-0' : 'scale-y-100'}`} style={{ transformOrigin: 'center', pointerEvents: 'none' }} />

      <div className="relative z-30 max-w-3xl px-6 text-center">
        <div className={`transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'} text-lg leading-relaxed whitespace-pre-line`}>
          {index >= 0 ? typed : ''}
        </div>

        <div className="mt-8">
          <div className="h-1 w-48 mx-auto bg-white/10 rounded" />
        </div>

        {/* Continue button under stanza */}
        {stanzaDone && (
          <div className="mt-6">
            <Button onClick={() => {
              // lightning flash effect
              const flash = document.createElement('div');
              flash.style.position = 'fixed';
              flash.style.inset = '0';
              flash.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))';
              flash.style.zIndex = '60';
              flash.style.opacity = '0.95';
              document.body.appendChild(flash);
              setTimeout(() => { flash.style.transition = 'opacity 300ms'; flash.style.opacity = '0'; }, 40);
              setTimeout(() => { document.body.removeChild(flash); }, 360);
              if (continueResolveRef.current) continueResolveRef.current();
            }}>Tiếp tục</Button>
          </div>
        )}

      </div>

      {/* Skip button top-right while cinematic playing */}
      {!showDialog && (
        <div className="absolute top-6 right-6 z-40">
          <Button variant="ghost" onClick={handleSkip}>Bỏ qua</Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => setShowDialog(open)}>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle>Chào mừng đến với Thời Đại Thợ Săn</DialogTitle>
          </DialogHeader>
          <div className="mt-2 mb-4 text-sm">Hãy chọn con đường của bạn. Một hành trình đầy nguy hiểm và vinh quang đang chờ.</div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={handleQuit}>Từ bỏ</Button>
            <Button onClick={handleStart}>Bắt đầu hành trình</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* final transition overlay when starting */}
      {finalTransition && (
        <div className="fixed inset-0 z-50 bg-black" style={{ transition: 'opacity 400ms' }} />
      )}
    </div>
  );
}
