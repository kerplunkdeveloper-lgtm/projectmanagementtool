import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import useWaterReminder, { WATER_REMINDER_TOAST_ID } from '../../hooks/useWaterReminder.jsx';
import WaterReminderToast from './WaterReminderToast';

/**
 * WaterReminderManager
 * Global component that connects water reminder timer logic with toast presentation.
 * Ensures only one reminder is active at any time.
 */
const WaterReminderManager = () => {
  const {
    isReminderOpen,
    handleClose,
    handleSnooze,
    handleLogGlass,
    activeSeconds,
    targetSeconds,
  } = useWaterReminder();

  useEffect(() => {
    if (isReminderOpen) {
      toast.custom(
        () => (
          <WaterReminderToast
            onLog={handleLogGlass}
            onSnooze={handleSnooze}
            onClose={handleClose}
            progress={Math.min(100, Math.round((activeSeconds / targetSeconds) * 100)) || 100}
          />
        ),
        {
          id: WATER_REMINDER_TOAST_ID,
          duration: Infinity, // Remains open until user takes action
          position: 'top-center',
        }
      );
    } else {
      toast.dismiss(WATER_REMINDER_TOAST_ID);
    }
  }, [isReminderOpen, handleLogGlass, handleSnooze, handleClose, activeSeconds, targetSeconds]);

  // Support manual preview trigger from Settings or anywhere in the app
  useEffect(() => {
    const handlePreview = () => {
      toast.custom(
        () => (
          <WaterReminderToast
            onLog={handleLogGlass}
            onSnooze={handleSnooze}
            onClose={handleClose}
            progress={100}
          />
        ),
        {
          id: WATER_REMINDER_TOAST_ID,
          duration: Infinity,
          position: 'top-center',
        }
      );
    };

    window.addEventListener('trigger-water-reminder-preview', handlePreview);
    return () => {
      window.removeEventListener('trigger-water-reminder-preview', handlePreview);
    };
  }, [handleLogGlass, handleSnooze, handleClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      toast.dismiss(WATER_REMINDER_TOAST_ID);
    };
  }, []);

  return null; // Logic & toast controller only, renders toast via react-hot-toast
};

export const triggerWaterReminderPreview = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trigger-water-reminder-preview'));
  }
};

export default WaterReminderManager;
