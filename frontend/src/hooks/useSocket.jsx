import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../features/notifications/notificationSlice';
import toast from 'react-hot-toast';

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
            } max-w-md w-full bg-white shadow-2xl rounded-[1.5rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-blue-50 overflow-hidden`}
          >
            <div className="flex-1 w-0 p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <span className="font-black text-xs">NEW</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-black text-slate-800">
                    Tactical Update
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-100">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                CLOSE
              </button>
            </div>
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
