import React, { useEffect, useState } from 'react';
import useWaterReminder, { WATER_DAILY_GOAL } from '../../hooks/useWaterReminder.jsx';
import WaterReminderPopup from './WaterReminderPopup';

/**
 * WaterReminderManager
 * Global component that connects water reminder timer logic with Popup modal presentation.
 * Displays interactive modal dialog and plays drinkwater.mp3 song.
 */
const WaterReminderManager = () => {
  const {
    isReminderOpen,
    handleClose,
    handleSnooze,
    handleLogGlass,
    todayLogsCount,
  } = useWaterReminder();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Support manual preview trigger from Settings or anywhere in the app
  useEffect(() => {
    const handlePreview = () => {
      setIsPreviewOpen(true);
    };

    window.addEventListener('trigger-water-reminder-preview', handlePreview);
    return () => {
      window.removeEventListener('trigger-water-reminder-preview', handlePreview);
    };
  }, []);

  const isModalOpen = isReminderOpen || isPreviewOpen;

  const handleModalClose = () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
    }
    if (isReminderOpen) {
      handleClose();
    }
  };

  const handleModalSnooze = (mins = 30) => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
    }
    // Preview snooze must not touch the real reminder timer
    if (isReminderOpen) {
      handleSnooze(mins);
    }
  };

  const handleModalLog = async () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
    }
    await handleLogGlass();
  };

  return (
    <WaterReminderPopup
      isOpen={isModalOpen}
      onLog={handleModalLog}
      onSnooze={handleModalSnooze}
      onClose={handleModalClose}
      todayLogsCount={todayLogsCount}
      dailyGoal={WATER_DAILY_GOAL}
    />
  );
};

export const triggerWaterReminderPreview = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trigger-water-reminder-preview'));
  }
};

export default WaterReminderManager;

