import { useEffect, useRef } from 'react';
import { apiService, API_BASE_URL } from '@/lib/api-service';

// Best-effort hook: if the current user is host of a room and navigates away (visibilitychange or beforeunload),
// try to call the cancel room API so rooms don't remain 'active' when the host left without cancelling.
export function useAutoCancelRoom(roomId: number | null, isHost: boolean) {
  const invokedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !isHost) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !invokedRef.current) {
        invokedRef.current = true;
        // best-effort: call leaveRoomLobby for the host (server should treat host leave as cancel)
        apiService.leaveRoomLobby(roomId, -1).catch(() => {});
      }
    };

    const handleBeforeUnload = () => {
      if (!invokedRef.current) {
        invokedRef.current = true;
        // navigator.sendBeacon is preferred but we keep simple fetch fallback
        try {
          // use API_BASE_URL for low-level beacon
          if (navigator.sendBeacon) navigator.sendBeacon(`${API_BASE_URL}/room-lobby/${roomId}/leave`);
          else fetch(`${API_BASE_URL}/room-lobby/${roomId}/leave`, { method: 'POST', keepalive: true }).catch(() => {});
        } catch {
          // ignore errors, best-effort
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, isHost]);
}
