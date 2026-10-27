import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { logWaterBreak } from '../features/users/userSlice';
import { stopWaterReminderSound, playWaterReminderSound } from '../utils/sound';
import {
  showWaterDesktopNotification,
  closeWaterDesktopNotification,
  startTitleBlink,
  stopTitleBlink,
} from '../utils/browserNotification';

export const WATER_REMINDER_TOAST_ID = 'water-break-reminder';

/**
 * Checks if current local time is within the user's configured working hours.
 * @param {{ start?: string, end?: string }} workingHours
 * @returns {boolean}
 */
export const isWithinWorkingHours = (workingHours) => {
  if (!workingHours || !workingHours.start || !workingHours.end) return true;
  if (workingHours.start === workingHours.end) return true;
  if (workingHours.start === "00:00" && (workingHours.end === "00:00" || workingHours.end === "23:59")) return true;
  try {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return true;

    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins < endMins) {
      return currentMins >= startMins && currentMins < endMins;
    }
    // Overnight shifts (e.g. 20:00 to 06:00, or 09:00 to 00:00)
    return currentMins >= startMins || currentMins < endMins;
  } catch (err) {
    console.error('Error checking working hours:', err);
    return true;
  }
};

/**
 * useWaterReminder hook
 * Manages active website use time tracking, interval checks, working hours enforcement,
 * background tab execution, desktop notifications, snooze behavior, dismiss cycles, and water logging.
 */
export const useWaterReminder = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;

  const waterReminder = user?.waterReminder || {};
  const isEnabled = waterReminder.enabled !== false;
  
  // Read instant local interval override if set in Settings
  const localInterval = userId && typeof window !== 'undefined'
    ? localStorage.getItem(`water_reminder_interval_${userId}`)
    : null;
  const intervalMinutes = localInterval ? Number(localInterval) : (Number(waterReminder.interval) || 60);
  const targetSeconds = Math.max(10, intervalMinutes * 60);
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
  const lastTickRef = useRef(Date.now());
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

  // Listen for reset timer event when settings are updated
  useEffect(() => {
    const handleReset = () => {
      setActiveSeconds(0);
      activeSecondsRef.current = 0;
      lastTickRef.current = Date.now();
      stopTitleBlink();
      closeWaterDesktopNotification();
    };
    window.addEventListener('water-reminder-reset-timer', handleReset);
    return () => window.removeEventListener('water-reminder-reset-timer', handleReset);
  }, []);

  // When user returns to tab, restore tab title
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        stopTitleBlink();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Listen for user interactions on the site to update presence timestamp
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

  // Cross-tab synchronization via localStorage events
  useEffect(() => {
    if (!userId) return;

    const handleStorage = (e) => {
      if (e.key === `water_reminder_active_sec_${userId}`) {
        const val = e.newValue ? parseInt(e.newValue, 10) || 0 : 0;
        activeSecondsRef.current = val;
        setActiveSeconds(val);
        // If another tab reset active seconds to 0 (user logged glass or closed popup), close here too
        if (val === 0 && isReminderOpen) {
          setIsReminderOpen(false);
          stopWaterReminderSound();
          stopTitleBlink();
          closeWaterDesktopNotification();
        }
      }
      const todayStr = new Date().toLocaleDateString('en-CA');
      if (e.key === `water_reminder_today_${userId}_${todayStr}`) {
        const count = e.newValue ? parseInt(e.newValue, 10) || 0 : 0;
        setTodayLogsCount(count);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userId, isReminderOpen]);

  // Main active timer interval (Tracks real elapsed time across all tabs & in background)
  useEffect(() => {
    if (!userId || !isEnabled) {
      if (isReminderOpen) {
        toast.dismiss(WATER_REMINDER_TOAST_ID);
        stopWaterReminderSound();
        stopTitleBlink();
        closeWaterDesktopNotification();
        setIsReminderOpen(false);
      }
      return;
    }

    lastTickRef.current = Date.now();

    const timer = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.max(1, Math.floor((now - lastTickRef.current) / 1000));
      lastTickRef.current = now;

      // Multi-tab deduping: prevent multiple open tabs from simultaneously incrementing the same second
      const savedLastTick = parseInt(localStorage.getItem(`water_reminder_last_tick_${userId}`) || '0', 10);
      if (savedLastTick && (now - savedLastTick) < 850) {
        return;
      }
      try {
        localStorage.setItem(`water_reminder_last_tick_${userId}`, now.toString());
      } catch {}

      // Working hours check: For test intervals (<= 5 minutes), bypass working hours check so user can easily test
      if (intervalMinutes > 5) {
        const inWorkingHours = isWithinWorkingHours(workingHours);
        if (!inWorkingHours) return;
      }

      // Increment active seconds by elapsed time
      const nextSeconds = activeSecondsRef.current + Math.min(deltaSec, targetSeconds);
      activeSecondsRef.current = nextSeconds;
      setActiveSeconds(nextSeconds);

      try {
        localStorage.setItem(`water_reminder_active_sec_${userId}`, nextSeconds.toString());
      } catch {}

      // Log progress to console for live monitoring
      if (nextSeconds % 5 === 0 || nextSeconds >= targetSeconds) {
        console.log(`[💧 WaterReminder] Elapsed: ${nextSeconds}/${targetSeconds}s (Interval: ${intervalMinutes}m) [Tab: ${document.visibilityState}]`);
      }

      // Check if threshold reached
      if (nextSeconds >= targetSeconds && !isReminderOpen) {
        console.log('[💧 WaterReminder] ⏰ Threshold reached! Triggering Water Break Popup, Desktop Alert & Sound!');
        setIsReminderOpen(true);
        playWaterReminderSound();

        // If tab is in background or window is unfocused, fire Desktop Notification & Tab Title Blink
        if (document.visibilityState !== 'visible' || !document.hasFocus()) {
          showWaterDesktopNotification({
            title: '💧 Time to drink water!',
            body: `You've reached your ${intervalMinutes}m hydration goal. Take a refreshing sip of water!`,
            onClick: () => {
              try {
                window.focus();
              } catch {}
              setIsReminderOpen(true);
            },
          });
          startTitleBlink('💧 Drink Water! (Break Time)');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, isEnabled, targetSeconds, intervalMinutes, workingHours, isReminderOpen]);

  // Dismiss cycle (when close button '×' is clicked)
  const handleClose = useCallback(() => {
    toast.dismiss(WATER_REMINDER_TOAST_ID);
    stopWaterReminderSound();
    stopTitleBlink();
    closeWaterDesktopNotification();
    setIsReminderOpen(false);
    setActiveSeconds(0);
    activeSecondsRef.current = 0;
    lastTickRef.current = Date.now();
    if (userId) {
      try {
        localStorage.setItem(`water_reminder_active_sec_${userId}`, '0');
      } catch {}
    }
  }, [userId]);

  // Snooze reminder (e.g. 15 or 30 minutes)
  const handleSnooze = useCallback((snoozeMinutes = 30) => {
    toast.dismiss(WATER_REMINDER_TOAST_ID);
    stopWaterReminderSound();
    stopTitleBlink();
    closeWaterDesktopNotification();
    setIsReminderOpen(false);
    lastTickRef.current = Date.now();

    // Rewind activeSeconds so that snoozeMinutes of elapsed time will trigger next reminder
    const mins = typeof snoozeMinutes === 'number' ? snoozeMinutes : 30;
    const snoozeSeconds = mins * 60;
    const remainingBeforeNext = Math.max(0, targetSeconds - snoozeSeconds);
    setActiveSeconds(remainingBeforeNext);
    activeSecondsRef.current = remainingBeforeNext;
    if (userId) {
      try {
        localStorage.setItem(`water_reminder_active_sec_${userId}`, remainingBeforeNext.toString());
      } catch {}
    }
    toast.success(`Reminder snoozed for ${mins} minutes`, {
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
    stopWaterReminderSound();
    stopTitleBlink();
    closeWaterDesktopNotification();
    setIsReminderOpen(false);
    setActiveSeconds(0);
    activeSecondsRef.current = 0;
    lastTickRef.current = Date.now();

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
