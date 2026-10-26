import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiX, FiDroplet } from 'react-icons/fi';

/**
 * WaterReminderToast
 * A high-fidelity, accessible toast matching Sorted's white and mint-green design.
 * Features the 3D mint-green robot holding a fresh glass of water.
 */
const WaterReminderToast = ({
  onLog,
  onSnooze,
  onClose,
  progress = 100,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Water break notification"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.96 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15, scale: 0.96 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative w-full max-w-[480px] bg-white dark:bg-[#111c16] border border-emerald-100 dark:border-emerald-800/50 rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(16,185,129,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden pointer-events-auto"
    >
      {/* Top subtle mint glow border */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss water reminder"
        className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer z-10"
      >
        <FiX size={18} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* MASCOT ANIMATION */}
        <div className="relative shrink-0 flex items-center justify-center w-24 sm:w-28">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -6, 0],
                    rotate: [0, -1, 1, 0],
                  }
            }
            transition={
              shouldReduceMotion
                ? {}
                : {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            className="relative"
          >
            {/* Soft mint backdrop glow */}
            <div className="absolute -inset-2 bg-emerald-300/25 dark:bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

            <img
              src="/assets/water-reminder.png"
              alt="Sorted Water Break Robot Mascot"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md select-none relative z-10"
              onError={(e) => {
                // Fallback to robot-1 if public asset loading had any issue
                e.target.src = '/Robots/robot-1.png';
              }}
            />
          </motion.div>
        </div>

        {/* CONTENT & ACTIONS */}
        <div className="flex-1 min-w-0 pr-4 sm:pr-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Water break!
            </h3>
            <span className="text-base animate-bounce" role="img" aria-label="water droplet">
              💧
            </span>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-300 font-medium mt-1 leading-snug">
            You’ve been working for a while. Take a moment to hydrate.
          </p>

          {/* MINT-GREEN PROGRESS / CYCLE BAR */}
          <div
            className="w-full h-1.5 sm:h-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-full mt-3 overflow-hidden border border-emerald-100/60 dark:border-emerald-900/40"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Hydration cycle progress"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(10, progress))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-3 mt-3.5">
            <button
              type="button"
              onClick={onLog}
              aria-label="Log a glass of water"
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <FiDroplet className="text-white fill-white/30 text-xs sm:text-sm" aria-hidden="true" />
              <span>Log a glass</span>
            </button>

            <button
              type="button"
              onClick={onSnooze}
              aria-label="Remind me later in 30 minutes"
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl cursor-pointer"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WaterReminderToast;
