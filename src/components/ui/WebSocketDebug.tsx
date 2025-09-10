interface WebSocketDebugProps {
  isConnected: boolean;
  isJoined: boolean;
  roomInfo: { players?: Array<{ id: number }> } | null;
  socketError: string | null;
  userId?: number;
  roomId?: string;
}

export function WebSocketDebug({ 
  isConnected, 
  isJoined, 
  roomInfo, 
  socketError, 
  userId, 
  roomId 
}: WebSocketDebugProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-sm">
      <h4 className="font-bold mb-2">WebSocket Debug</h4>
      <div className="space-y-1">
        <div>Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span></div>
        <div>Joined: <span className={isJoined ? 'text-green-400' : 'text-yellow-400'}>
          {isJoined ? 'Yes' : 'No'}
        </span></div>
        <div>Room: {roomId || 'N/A'}</div>
        <div>User: {userId || 'N/A'}</div>
        <div>Players: {roomInfo?.players?.length || 0}</div>
        {socketError && (
          <div className="text-red-400">Error: {socketError}</div>
        )}
      </div>
    </div>
  );
}
