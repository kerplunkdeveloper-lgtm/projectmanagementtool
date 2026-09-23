import { useEffect, useRef } from 'react';

// Heartbeat interval — keeps socket alive and server knows user is still connected
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/**
 * usePresence — Tracks user presence via socket heartbeat.
 *
 * WHY WE REMOVED "AWAY" STATUS:
 * Users work in other software (Photoshop, Figma, Premiere, etc.) while keeping
 * this app open in the browser. Detecting "away" based on browser activity alone
 * would incorrectly mark actively-working users as away.
 *
 * Presence logic:
 *  - ONLINE  = Browser has the app open, socket is connected
 *  - OFFLINE = Browser closed, tab closed, or network disconnected (socket disconnect event)
 *
 * The server handles OFFLINE automatically via the socket 'disconnect' event.
 * This hook simply sends periodic heartbeats so the server knows the user is still there.
 */
export const usePresence = (socket, userId) => {
  const heartbeatTimerRef = useRef(null);

  useEffect(() => {
    if (!socket || !userId) return;

    // Send an initial "online" heartbeat when hook mounts
    socket.emit('heartbeat', {
      status: 'online',
      lastActivityAt: Date.now(),
    });

    // Keep sending heartbeat every 30 seconds
    // This serves two purposes:
    // 1. Tells server "I'm still connected and online"
    // 2. Keeps the socket alive through proxies/firewalls
    heartbeatTimerRef.current = setInterval(() => {
      socket.emit('heartbeat', {
        status: 'online',
        lastActivityAt: Date.now(),
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [socket, userId]);

  // No return value needed — presence is driven by socket connection state
};
