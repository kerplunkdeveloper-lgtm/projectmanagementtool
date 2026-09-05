import { useEffect, useRef, useState } from 'react';

// 15 minutes of no activity = away in chat/presence
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
// Send heartbeat every 30 seconds
const HEARTBEAT_INTERVAL_MS = 30 * 1000; 

export const usePresence = (socket, userId) => {
  const [presence, setPresence] = useState('online');
  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (presence === 'away') {
        setPresence('online');
        socket.emit('heartbeat', { status: 'online', lastActivityAt: lastActivityRef.current });
      }
      
      // Reset idle timer
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setPresence('away');
        socket.emit('heartbeat', { status: 'away', lastActivityAt: lastActivityRef.current });
      }, IDLE_TIMEOUT_MS);
    };

    // Attach activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleActivity));

    // Initialize idle timer
    handleActivity();

    // Start heartbeat
    heartbeatTimerRef.current = setInterval(() => {
      socket.emit('heartbeat', { 
        status: Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS ? 'away' : 'online',
        lastActivityAt: lastActivityRef.current 
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [socket, userId, presence]);

  return presence;
};

