import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../features/notifications/notificationSlice';
import { apiSlice } from '../features/api/apiSlice';
import toast from 'react-hot-toast';
import { FiBell, FiX } from 'react-icons/fi';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (time, freq, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = audioCtx.currentTime;
    playTone(now, 880, 0.15); // A5
    playTone(now + 0.08, 1109, 0.3); // C#6
  } catch (err) {
    console.error("Audio Context playback failed:", err);
  }
};

const useSocket = () => {
  const socket = useRef();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (user && userId) {
      socket.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001');

      socket.current.on('connect', () => {
        socket.current.emit('join', userId);
      });

      socket.current.on('notification', (notification) => {
        dispatch(addNotification(notification));
        
        // Sync RTK Query cache so the Navbar instantly shows the new notification
        dispatch(apiSlice.util.invalidateTags(['Notification']));
        
        // Play premium audio chime
        playNotificationSound();

        // Premium Real-time Toast
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-[340px] w-full bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-[#0f172a] dark:to-[#0f172a] shadow-[0_12px_30px_rgba(59,130,246,0.25)] dark:shadow-[0_12px_30px_rgba(229,255,0,0.1)] border border-blue-500/30 dark:border-slate-800/80 rounded-xl pointer-events-auto flex items-center p-3 pr-8 relative`}
          >
            {/* White/Neon Icon Wrapper */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-white/20 dark:bg-[#e5ff00]/10 rounded-lg animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-white dark:bg-[#e5ff00] flex items-center justify-center text-blue-600 dark:text-black shadow-sm relative z-10">
                <FiBell size={14} />
              </div>
            </div>

            {/* Content text */}
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-[9px] font-bold text-blue-200 dark:text-slate-400 tracking-wider uppercase">
                New Notification
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-white dark:text-slate-100 leading-normal">
                {notification.message}
              </p>
            </div>

            {/* Top-Right Dismiss Button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md hover:bg-white/10 dark:hover:bg-slate-800 flex items-center justify-center text-blue-100 dark:text-slate-400 hover:text-white dark:hover:text-[#e5ff00] transition-colors"
            >
              <FiX size={12} />
            </button>
          </div>
        ), { duration: 5000 });
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [user, dispatch]);

  return socket.current;
};

export default useSocket;
