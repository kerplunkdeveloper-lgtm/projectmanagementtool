import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

// 5 minutes of no activity = away
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
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
      // Send heartbeat
      socket.emit('heartbeat', { 
        status: Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS ? 'away' : 'online',
        lastActivityAt: lastActivityRef.current 
      });
    }, HEARTBEAT_INTERVAL_MS);

    // Listen for productivity resumed events
    const handleProductivityResumed = ({ durationMs, previousStatus }) => {
      const mins = Math.floor(durationMs / 60000);
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      
      let timeString = '';
      if (hours > 0) {
        timeString = `${hours}h ${remainingMins}m`;
      } else {
        timeString = `${mins} minutes`;
      }

      const statusText = previousStatus === 'away' ? 'away' : 'offline';
      
      toast.success(
        `🟢 Welcome back!\nYou were ${statusText} for ${timeString}.\nYour productivity timer has resumed.`,
        { duration: 6000, id: 'welcome-back-toast' }
      );
    };

    socket.on('productivity_resumed', handleProductivityResumed);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      socket.off('productivity_resumed', handleProductivityResumed);
    };
  }, [socket, userId, presence]);

  return presence;
};
