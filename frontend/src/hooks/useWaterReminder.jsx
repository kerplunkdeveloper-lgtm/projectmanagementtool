import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { logWaterBreak } from '../features/users/userSlice';

export const WATER_REMINDER_TOAST_ID = 'water-break-reminder';
const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes of inactivity considered idle

/**
 * Checks if current local time is within the user's configured working hours.
 * @param {{ start?: string, end?: string }} workingHours
 * @returns {boolean}
 */
export const isWithinWorkingHours = (workingHours) => {
  if (!workingHours || !workingHours.start || !workingHours.end) return true;
  try {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return true;

    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    return currentMins >= startMins && currentMins < endMins;
  } catch (err) {
    console.error('Error checking working hours:', err);
    return true;
  }
};

/**
 * useWaterReminder hook
 * Manages active website use time tracking, interval checks, working hours enforcement,
 * snooze behavior, dismiss cycles, and water logging.
 */
export const useWaterReminder = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;

  const waterReminder = user?.waterReminder || {};
  const isEnabled = waterReminder.enabled !== false;
  const intervalMinutes = Number(waterReminder.interval) || 60;
  const targetSeconds = intervalMinutes * 60;
  const workingHours = waterReminder.workingHours || { start: '09:00', end: '19:00' };

  const [activeSeconds, setActiveSeconds] = useState(() => {
    if (!userId) return 0;
    try {
      const saved = localStorage.getItem(`water_reminder_active_sec_${userId}`);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [todayLogsCount, setTodayLogsCount] = useState(() => {
    if (!userId) return 0;
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const saved = localStorage.getItem(`water_reminder_today_${userId}_${todayStr}`);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const lastActivityRef = useRef(Date.now());
  const activeSecondsRef = useRef(activeSeconds);
  activeSecondsRef.current = activeSeconds;

  // Sync today's count from user model if available
  useEffect(() => {
    if (user?.waterReminder?.logs && Array.isArray(user.waterReminder.logs)) {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const count = user.waterReminder.logs.filter((l) => l.date === todayStr).length;
      setTodayLogsCount(count);
      if (userId) {
        localStorage.setItem(`water_reminder_today_${userId}_${todayStr}`, count.toString());
      }
    }
  }, [user?.waterReminder?.logs, userId]);

  // Keep activeSeconds in sync with user change
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(`water_reminder_active_sec_${userId}`);
      const val = saved ? parseInt(saved, 10) || 0 : 0;
      setActiveSeconds(val);
      activeSecondsRef.current = val;
    } catch {
      setActiveSeconds(0);
      activeSecondsRef.current = 0;
    }
  }, [userId]);

  // Listen for user interactions on the site to track active presence
  useEffect(() => {
    let lastRecorded = 0;
    const handleActivity = () => {
      const now = Date.now();
      // Throttle interaction updates to once every 2 seconds
      if (now - lastRecorded > 2000) {
        lastRecorded = now;
        lastActivityRef.current = now;
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Main active timer interval
  useEffect(() => {
    if (!userId || !isEnabled) {
      if (isReminderOpen) {
        toast.dismiss(WATER_REMINDER_TOAST_ID);
        setIsReminderOpen(false);
      }
      return;
    }

    const timer = setInterval(() => {
      // 1. Check document visibility (only count when browser tab is active/visible)
      if (document.visibilityState !== 'visible') return;

      // 2. Check user activity (within idle threshold)
      const isUserActive = Date.now() - lastActivityRef.current < IDLE_TIMEOUT_MS;
      if (!isUserActive) return;

      // 3. Check working hours
      const inWorkingHours = isWithinWorkingHours(workingHours);
      if (!inWorkingHours) return;

      // Increment active seconds
      const nextSeconds = activeSecondsRef.current + 1;
      activeSecondsRef.current = nextSeconds;
      setActiveSeconds(nextSeconds);

      // Periodically persist to localStorage every 5 seconds
      if (nextSeconds % 5 === 0 && userId) {
        try {
          localStorage.setItem(`water_reminder_active_sec_${userId}`, nextSeconds.toString());
        } catch {}
      }

      // Check if threshold reached
      if (nextSeconds >= targetSeconds && !isReminderOpen) {
        setIsReminderOpen(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, isEnabled, targetSeconds, workingHours, isReminderOpen]);

  // Dismiss cycle (when close button '×' is clicked)
  const handleClose = useCallback(() => {
    toast.dismiss(WATER_REMINDER_TOAST_ID);
    setIsReminderOpen(false);
    setActiveSeconds(0);
    activeSecondsRef.current = 0;
    if (userId) {
      try {
        localStorage.setItem(`water_reminder_active_sec_${userId}`, '0');
      } catch {}
    }
  }, [userId]);

  // Snooze for 30 minutes
  const handleSnooze = useCallback(() => {
    toast.dismiss(WATER_REMINDER_TOAST_ID);
    setIsReminderOpen(false);
    // Rewind activeSeconds so that 30 minutes of active use will trigger next reminder
    const snoozeSeconds = 30 * 60;
    const remainingBeforeNext = Math.max(0, targetSeconds - snoozeSeconds);
    setActiveSeconds(remainingBeforeNext);
    activeSecondsRef.current = remainingBeforeNext;
    if (userId) {
      try {
        localStorage.setItem(`water_reminder_active_sec_${userId}`, remainingBeforeNext.toString());
      } catch {}
    }
    toast.success('Reminder snoozed for 30 minutes', {
      duration: 3000,
      icon: '⏰',
      style: {
        borderRadius: '16px',
        background: '#ffffff',
        color: '#0f172a',
        fontSize: '13px',
        fontWeight: '700',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    });
  }, [userId, targetSeconds]);

  // Log a glass of water
  const handleLogGlass = useCallback(async () => {
    toast.dismiss(WATER_REMINDER_TOAST_ID);
    setIsReminderOpen(false);
    setActiveSeconds(0);
    activeSecondsRef.current = 0;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const newCount = todayLogsCount + 1;
    setTodayLogsCount(newCount);

    if (userId) {
      try {
        localStorage.setItem(`water_reminder_active_sec_${userId}`, '0');
        localStorage.setItem(`water_reminder_today_${userId}_${todayStr}`, newCount.toString());
        localStorage.setItem(`water_reminder_last_log_${userId}`, Date.now().toString());
      } catch {}
    }

    try {
      await dispatch(logWaterBreak()).unwrap();
    } catch (err) {
      console.warn('Water log saved locally, sync error:', err);
    }

    // Success feedback as requested: "Glass of water logged!"
    toast.custom(
      (t) => (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#121c18] border border-emerald-200 dark:border-emerald-800/60 shadow-xl transition-all duration-300 ${
            t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center text-white shadow-md text-base">
            🥛
          </div>
          <div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-100">
              Glass of water logged!
            </p>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {newCount} {newCount === 1 ? 'glass' : 'glasses'} logged today. Great job!
            </p>
          </div>
        </div>
      ),
      { duration: 3500 }
    );
  }, [dispatch, userId, todayLogsCount]);

  return {
    isEnabled,
    intervalMinutes,
    targetSeconds,
    workingHours,
    activeSeconds,
    isReminderOpen,
    setIsReminderOpen,
    todayLogsCount,
    handleClose,
    handleSnooze,
    handleLogGlass,
  };
};

export default useWaterReminder;
