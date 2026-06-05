import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../features/notifications/notificationSlice';
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

      socket.current.emit('join', userId);

      socket.current.on('notification', (notification) => {
        dispatch(addNotification(notification));
        
        // Play premium audio chime
        playNotificationSound();

        // Premium Real-time Toast
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 rounded-2xl pointer-events-auto flex items-center p-4 pr-10 relative`}
          >
            {/* Animated Pulsing Bell Icon */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl animate-pulse" />
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md relative z-10">
                <FiBell size={18} />
              </div>
            </div>

            {/* Content text */}
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-800 dark:text-yellow-50 tracking-wider uppercase">
                New Notification
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Top-Right Dismiss Button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-3 right-3 w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <FiX size={14} />
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
