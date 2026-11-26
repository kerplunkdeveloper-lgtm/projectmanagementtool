import { motion } from "framer-motion";
import calendarMascotImg from "../../../public/assets/calendorchar.png";

// Full Page Centered Loading Component with 3D Mascot Character Animation & Ambient Glow
const CalendarLoaderModal = ({ monthName = "", year = "" }) => {
  return (
    <motion.div
      key="calendar-fullpage-loader"
      role="status"
      aria-live="polite"
      aria-label={`Loading calendar for ${monthName} ${year}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#060a14]/90 backdrop-blur-md overflow-hidden select-none pointer-events-auto"
    >
      {/* Ambient Floating Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1s]" />

      {/* Main Glassmorphic Centered Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: -10 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md p-7 sm:p-9 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1e2a40] shadow-2xl shadow-indigo-500/20 backdrop-blur-xl flex flex-col items-center text-center overflow-hidden"
      >
        {/* Subtle decorative top neon bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* 3D Mascot Character Hero with Floating Animation and Glowing Aura */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Ambient Outer Aura Glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-pink-500/20 blur-2xl animate-pulse pointer-events-none" />

          {/* Mascot Image with Gentle Bobbing / Floating Motion */}
          <motion.div
            animate={{
              y: [0, -7, 0],
              rotate: [0, 1.2, -1.2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-indigo-500/25 shadow-2xl shadow-indigo-500/30 bg-[#0f172a] flex items-center justify-center border border-indigo-500/30"
          >
            <img
              src={calendarMascotImg}
              alt="Content Calendar Mascot"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Title & Status Chip */}
        <div className="space-y-1.5 mb-5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Loading Calendar</span>
            <span className="flex gap-0.5 ml-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
            </span>
          </h3>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs">
            Organizing deliverables & publishing schedule for{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {monthName} {year}
            </span>
          </p>
        </div>

        {/* Smooth Gradient Progress Bar */}
        <div className="w-full max-w-xs h-2 bg-slate-200/80 dark:bg-[#162033] border border-slate-200/80 dark:border-[#23334d] rounded-full overflow-hidden relative mb-5 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            initial={{ x: "-100%", width: "45%" }}
            animate={{ x: "260%" }}
            transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
          />
        </div>

        {/* Status Micro-checklist Indicators */}
        <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Posts & Reels</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse [animation-delay:0.2s]" />
            <span className="text-slate-600 dark:text-slate-300">Deliverables</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse [animation-delay:0.4s]" />
            <span className="text-slate-600 dark:text-slate-300">QC Status</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CalendarLoaderModal;
