import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
export const WATER_ALLOWED_INTERVALS = [30, 60, 90];
export const WATER_DAILY_GOAL = 8;
export const WATER_MAX_LOGS_PER_DAY = 20;

const DEFAULT_INTERVAL = 60;
// If no tab ticked for longer than this (device asleep, browser closed), the gap is not counted
const MAX_TICK_GAP_SEC = 120;

/** Only 30 / 60 / 90 are valid. Anything else (e.g. old 1-min test value) falls back to 60. */
export const normalizeWaterInterval = (value) => {
  const n = Number(value);
  return WATER_ALLOWED_INTERVALS.includes(n) ? n : DEFAULT_INTERVAL;
};

const readInt = (key) => {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0;
  } catch {
    return 0;
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable */
  }
};

const todayKeyDate = () => new Date().toLocaleDateString('en-CA');

/**
 * Checks if current local time is within the user's configured working hours.
 * @param {{ start?: string, end?: string }} workingHours
 * @returns {boolean}
 */
export const isWithinWorkingHours = (workingHours) => {
  if (!workingHours || !workingHours.start || !workingHours.end) return true;
  if (workingHours.start === workingHours.end) return true;
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
    // Overnight shifts (e.g. 20:00 to 06:00)
    return currentMins >= startMins || currentMins < endMins;
  } catch (err) {
    console.error('Error checking working hours:', err);
    return true;
  }
};

/**
 * useWaterReminder hook
 * - Counts elapsed time inside the user's working hours (one shared clock across all tabs)
 * - Fully stops (no timer, no popup, no sound) when the user disables reminders
 * - Handles snooze, dismiss and water logging
 */
export const useWaterReminder = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;

  // Settings saved in another tab update localStorage "user" but not this tab's redux state.
  // Keep a synced copy so turning reminders OFF in one tab stops them in every tab.
  const [syncedReminder, setSyncedReminder] = useState(null);
  useEffect(() => {
    setSyncedReminder(null);
  }, [user?.waterReminder]);

  useEffect(() => {
    if (!userId) return;
    const handleUserStorage = (e) => {
      if (e.key !== 'user' || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if ((parsed?._id || parsed?.id) === userId && parsed?.waterReminder) {
          setSyncedReminder(parsed.waterReminder);
        }
      } catch {
        /* ignore malformed */
      }
    };
    window.addEventListener('storage', handleUserStorage);
    return () => window.removeEventListener('storage', handleUserStorage);
  }, [userId]);

  const waterReminder = syncedReminder || user?.waterReminder || {};
  const isEnabled = !!userId && waterReminder.enabled !== false;
  const intervalMinutes = normalizeWaterInterval(waterReminder.interval);
  const targetSeconds = intervalMinutes * 60;
  const whStart = waterReminder.workingHours?.start || '09:00';
  const whEnd = waterReminder.workingHours?.end || '18:00';
  const workingHours = useMemo(() => ({ start: whStart, end: whEnd }), [whStart, whEnd]);

  const activeKey = `water_reminder_active_sec_${userId}`;
  const lastTickKey = `water_reminder_last_tick_${userId}`;

  const [activeSeconds, setActiveSeconds] = useState(() => (userId ? readInt(activeKey) : 0));
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [todayLogsCount, setTodayLogsCount] = useState(() =>
    userId ? readInt(`water_reminder_today_${userId}_${todayKeyDate()}`) : 0
  );

  const activeSecondsRef = useRef(activeSeconds);
  activeSecondsRef.current = activeSeconds;
  const isLoggingRef = useRef(false);

  // Sync today's count from user model if available
  useEffect(() => {
    if (user?.waterReminder?.logs && Array.isArray(user.waterReminder.logs)) {
      const todayStr = todayKeyDate();
      const count = user.waterReminder.logs.filter((l) => l.date === todayStr).length;
      setTodayLogsCount(count);
      if (userId) writeLS(`water_reminder_today_${userId}_${todayStr}`, count);
    }
  }, [user?.waterReminder?.logs, userId]);

  // Keep activeSeconds in sync with user change
  useEffect(() => {
    if (!userId) return;
    const val = readInt(activeKey);
    setActiveSeconds(val);
    activeSecondsRef.current = val;
  }, [userId, activeKey]);

  const closeAllAlerts = useCallback(() => {
    toast.dismiss(WATER_REMINDER_TOAST_ID);
    stopWaterReminderSound();
    stopTitleBlink();
    closeWaterDesktopNotification();
    setIsReminderOpen(false);
  }, []);

  const setTimerValue = useCallback(
    (val) => {
      setActiveSeconds(val);
      activeSecondsRef.current = val;
      if (userId) writeLS(activeKey, val);
    },
    [userId, activeKey]
  );

  // Reset timer when settings are saved
  useEffect(() => {
    const handleReset = () => {
      setTimerValue(0);
      closeAllAlerts();
    };
    window.addEventListener('water-reminder-reset-timer', handleReset);
    return () => window.removeEventListener('water-reminder-reset-timer', handleReset);
  }, [setTimerValue, closeAllAlerts]);

  // When user returns to tab, restore tab title
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') stopTitleBlink();
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Cross-tab synchronization of timer & today's count
  useEffect(() => {
    if (!userId) return;

    const handleStorage = (e) => {
      if (e.key === activeKey) {
        const val = e.newValue ? parseInt(e.newValue, 10) || 0 : 0;
        activeSecondsRef.current = val;
        setActiveSeconds(val);
        // Another tab logged / closed / snoozed -> close popup here too
        if (val < targetSeconds && isReminderOpen) closeAllAlerts();
      }
      if (e.key === `water_reminder_today_${userId}_${todayKeyDate()}`) {
        setTodayLogsCount(e.newValue ? parseInt(e.newValue, 10) || 0 : 0);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userId, activeKey, targetSeconds, isReminderOpen, closeAllAlerts]);

  // Reminders turned OFF (or logged out): stop everything immediately and clear the timer
  useEffect(() => {
    if (isEnabled) return;
    closeAllAlerts();
    if (userId) {
      setTimerValue(0);
      try {
        localStorage.removeItem(lastTickKey);
      } catch {
        /* ignore */
      }
    }
  }, [isEnabled, userId, lastTickKey, closeAllAlerts, setTimerValue]);

  // Main timer: counts elapsed time within working hours, shared across all open tabs
  useEffect(() => {
    if (!isEnabled) return undefined;

    const timer = setInterval(() => {
      const now = Date.now();
      const sharedActive = readInt(activeKey);

      // Already due (this tab or another tab reached it) -> show popup here too, stop counting
      if (sharedActive >= targetSeconds) {
        activeSecondsRef.current = sharedActive;
        if (!isReminderOpen && isWithinWorkingHours(workingHours)) setIsReminderOpen(true);
        writeLS(lastTickKey, now);
        return;
      }

      // Multi-tab dedupe: one shared clock, only one tab counts each second
      const sharedLastTick = readInt(lastTickKey);
      if (sharedLastTick && now - sharedLastTick < 900) return;
      writeLS(lastTickKey, now);

      let deltaSec = sharedLastTick ? Math.round((now - sharedLastTick) / 1000) : 1;
      // Device slept / browser closed for a long time -> don't count that gap
      if (deltaSec > MAX_TICK_GAP_SEC || deltaSec < 0) deltaSec = 0;

      // Paused outside working hours
      if (deltaSec === 0 || !isWithinWorkingHours(workingHours)) return;

      const nextSeconds = Math.min(sharedActive + deltaSec, targetSeconds);
      activeSecondsRef.current = nextSeconds;
      setActiveSeconds(nextSeconds);
      writeLS(activeKey, nextSeconds);

      // This tab crossed the threshold -> it owns the sound / desktop notification
      if (nextSeconds >= targetSeconds && !isReminderOpen) {
        setIsReminderOpen(true);
        playWaterReminderSound();

        if (document.visibilityState !== 'visible' || !document.hasFocus()) {
          showWaterDesktopNotification({
            title: '💧 Time to drink water!',
            body: `You've reached your ${intervalMinutes}m hydration goal. Take a refreshing sip of water!`,
            onClick: () => {
              try {
                window.focus();
              } catch {
                /* ignore */
              }
            },
          });
          startTitleBlink('💧 Drink Water! (Break Time)');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, activeKey, lastTickKey, targetSeconds, intervalMinutes, workingHours, isReminderOpen]);

  // Dismiss (×): close and start a fresh interval
  const handleClose = useCallback(() => {
    closeAllAlerts();
    setTimerValue(0);
  }, [closeAllAlerts, setTimerValue]);

  // Snooze: next reminder fires after `snoozeMinutes` (never longer than the interval)
  const handleSnooze = useCallback(
    (snoozeMinutes = 30) => {
      closeAllAlerts();
      if (!isEnabled) return;
      const mins = typeof snoozeMinutes === 'number' && snoozeMinutes > 0 ? snoozeMinutes : 30;
      const snoozeSeconds = Math.min(mins * 60, targetSeconds);
      setTimerValue(targetSeconds - snoozeSeconds);
      toast.success(`Reminder snoozed for ${Math.round(snoozeSeconds / 60)} minutes`, {
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
    },
    [isEnabled, targetSeconds, closeAllAlerts, setTimerValue]
  );

  // Log a glass of water
  const handleLogGlass = useCallback(async () => {
    closeAllAlerts();
    if (isEnabled) setTimerValue(0);

    if (isLoggingRef.current) return; // prevent double-click duplicates
    if (todayLogsCount >= WATER_MAX_LOGS_PER_DAY) {
      toast.error(`Daily limit reached (${WATER_MAX_LOGS_PER_DAY} glasses)`);
      return;
    }

    isLoggingRef.current = true;
    let newCount;
    try {
      const res = await dispatch(logWaterBreak()).unwrap();
      newCount = typeof res?.countToday === 'number' ? res.countToday : todayLogsCount + 1;
      setTodayLogsCount(newCount);
      if (userId) {
        writeLS(`water_reminder_today_${userId}_${todayKeyDate()}`, newCount);
        writeLS(`water_reminder_last_log_${userId}`, Date.now());
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to log glass of water');
      return;
    } finally {
      isLoggingRef.current = false;
    }

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
  }, [dispatch, userId, isEnabled, todayLogsCount, closeAllAlerts, setTimerValue]);

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
