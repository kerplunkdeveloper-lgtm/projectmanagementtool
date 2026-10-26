import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDroplet,
  FiVolume2,
  FiVolumeX,
  FiX,
  FiClock,
  FiCheckCircle,
  FiHeart,
} from "react-icons/fi";
import {
  playWaterReminderSound,
  stopWaterReminderSound,
  toggleWaterReminderMute,
} from "../../utils/sound";

/**
 * WaterReminderPopup
 * Premium, interactive Modal Popup for Water Break Reminders.
 * Plays drinkwater.mp3 song with audio toggle, hydration tracker, and slick animations.
 */
const WaterReminderPopup = ({
  isOpen = false,
  onLog,
  onSnooze,
  onClose,
  todayLogsCount = 0,
  dailyGoal = 8,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const audioStartedRef = useRef(false);

  // Play drinkwater.mp3 when popup opens, stop when it closes
  useEffect(() => {
    if (isOpen) {
      audioStartedRef.current = true;
      playWaterReminderSound();
    } else {
      stopWaterReminderSound();
      audioStartedRef.current = false;
      setIsLogging(false);
    }

    return () => {
      stopWaterReminderSound();
    };
  }, [isOpen]);

  // Handle Mute / Unmute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    toggleWaterReminderMute(nextMuted);
  };

  // Handle logging a glass with celebration
  const handleLogClick = async () => {
    if (isLogging) return;
    setIsLogging(true);
    stopWaterReminderSound();

    if (onLog) {
      await onLog();
    }
  };

  // Handle snooze with stop sound
  const handleSnoozeClick = (mins = 30) => {
    stopWaterReminderSound();
    if (onSnooze) {
      onSnooze(mins);
    }
  };

  // Handle close
  const handleCloseClick = () => {
    stopWaterReminderSound();
    if (onClose) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleCloseClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const percentage = Math.min(100, Math.round((todayLogsCount / dailyGoal) * 100));

  const modalMarkup = (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="water-modal-title"
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 dark:bg-black/80 backdrop-blur-md transition-all select-none"
        >
          {/* Main Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0c1815] border border-cyan-200/70 dark:border-cyan-800/50 rounded-[28px] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.35)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] overflow-hidden text-center"
          >
            {/* Top decorative animated water gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 animate-pulse" />

            {/* Subtle background ambient water glow orbs */}
            <div className="absolute -top-16 -left-16 w-44 h-44 bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Sound Status & Close Button */}
            <div className="relative z-10 flex items-center justify-between w-full mb-2">
              {/* Sound controller badge */}
              <button
                type="button"
                onClick={handleToggleMute}
                title={isMuted ? "Unmute reminder song" : "Mute reminder song"}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 active:scale-95"
              >
                {isMuted ? (
                  <>
                    <FiVolumeX className="text-sm text-slate-400 dark:text-slate-500" />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Muted
                    </span>
                  </>
                ) : (
                  <>
                    <FiVolume2 className="text-sm text-cyan-600 dark:text-cyan-400 animate-pulse" />
                    {/* Animated sound wave bars */}
                    <div className="flex items-end gap-[2px] h-3">
                      <span className="w-0.5 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-0.5 h-3 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-0.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                      Playing
                    </span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseClick}
                aria-label="Close water break popup"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Mascot with Floating & Ripple Animation */}
            <div className="relative flex items-center justify-center my-3">
              {/* Ripple concentric rings */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0.1, 0.35],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-36 h-36 rounded-full bg-cyan-400/20 dark:bg-cyan-500/15 pointer-events-none"
              />
              <motion.div
                animate={{
                  scale: [1, 1.45, 1],
                  opacity: [0.2, 0.05, 0.2],
                }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute w-44 h-44 rounded-full bg-teal-400/15 dark:bg-teal-500/10 pointer-events-none"
              />

              {/* Mascot Floating Image */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, -1.5, 1.5, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <img
                  src="/assets/water-reminder.png"
                  alt="Water Break Mascot"
                  className="w-32 h-32 sm:w-40 sm:h-40  rounded-full object-contain drop-shadow-[0_12px_24px_rgba(6,182,212,0.3)] select-none"
                  onError={(e) => {
                    e.target.src = "/Robots/robot-1.png";
                  }}
                />
              </motion.div>
            </div>

            {/* Badge & Title */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-400/30 text-teal-600 dark:text-teal-400">
                <FiDroplet className="text-teal-500 animate-bounce" /> Hydration Alert
              </span>

              <h2
                id="water-modal-title"
                className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-1"
              >
                Time for a Water Break! 💧
              </h2>
            </div>

            {/* Daily Hydration Progress & Droplets Tracker */}
            <div className="relative z-10 my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-cyan-100 dark:border-cyan-900/40 text-left">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiHeart className="text-pink-500" size={13} />
                  Today's Hydration
                </span>
                <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                  {todayLogsCount} of {dailyGoal} glasses ({percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                />
              </div>

              {/* 8 Glass droplets tracker */}
              <div className="flex items-center justify-between gap-1 px-1">
                {Array.from({ length: dailyGoal }).map((_, index) => {
                  const isCompleted = index < todayLogsCount;
                  return (
                    <div
                      key={index}
                      title={`Glass ${index + 1}`}
                      className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-gradient-to-t from-cyan-500 to-teal-400 text-white shadow-sm shadow-cyan-500/30 scale-105"
                          : "bg-slate-200/70 dark:bg-slate-800/70 text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      <FiDroplet
                        size={12}
                        className={isCompleted ? "fill-white" : "opacity-40"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col gap-2.5 mt-2">
              {/* Primary Action: Log a Glass */}
              <button
                type="button"
                onClick={handleLogClick}
                disabled={isLogging}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 active:scale-[0.98] transition-all shadow-[0_8px_25px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/30 group"
              >
                <FiDroplet className="text-lg fill-white/40 group-hover:scale-110 transition-transform" />
                <span>{isLogging ? "Logging Water..." : "I Drank a Glass of Water 🥛"}</span>
              </button>

              {/* Secondary Actions: Snooze / Remind Later */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSnoozeClick(30)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-slate-700/60"
                >
                  <FiClock size={13} className="text-cyan-500" />
                  <span>Snooze 30m</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent"
                >
                  Remind Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalMarkup, document.body);
};

export default WaterReminderPopup;
