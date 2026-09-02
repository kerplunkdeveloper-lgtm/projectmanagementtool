import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCoffee } from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import { useSelector } from "react-redux";

const LunchBreakPopup = () => {
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [officeHours, setOfficeHours] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [hasSkipped, setHasSkipped] = useState(false);

  // Fetch office hours configuration
  useEffect(() => {
    if (!user) return;
    const fetchOfficeHours = async () => {
      try {
        const response = await axiosInstance.get("/settings/office-hours");
        if (response.data?.success) {
          setOfficeHours(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch office hours for lunch popup:", err);
      }
    };
    fetchOfficeHours();
    
    // Refresh settings every 15 mins just in case admin changes them
    const interval = setInterval(fetchOfficeHours, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Check time every minute to see if we are in lunch break
  useEffect(() => {
    if (!officeHours) return;

    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (!user?._id) return;
      const todayStr = new Date().toLocaleDateString("en-CA");
      const skipKey = `skippedLunch_${user._id}_${todayStr}`;
      if (localStorage.getItem(skipKey)) {
        setIsOpen(false);
        setHasSkipped(true);
        return;
      }

      const breakStartTimeStr = officeHours.breakStartTime ?? "13:00";
      const breakEndTimeStr = officeHours.breakEndTime ?? "14:00";
      const [startH, startM] = breakStartTimeStr.split(':').map(Number);
      const [endH, endM] = breakEndTimeStr.split(':').map(Number);

      // Ensure we format the display time beautifully
      let hoursDisplay = currentHour % 12 || 12;
      const ampm = currentHour >= 12 ? "PM" : "AM";
      setCurrentTimeStr(`${hoursDisplay.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")} ${ampm}`);

      const nowMins = currentHour * 60 + currentMinute;
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      if (nowMins >= startMins && nowMins < endMins) {
        setIsOpen(true);
        // Calculate remaining minutes
        const endHourDate = new Date();
        endHourDate.setHours(endH, endM, 0, 0);
        const diffMs = endHourDate - now;
        setRemainingMinutes(Math.max(1, Math.ceil(diffMs / 60000)));
      } else {
        setIsOpen(false);
      }
    };

    checkTime();
    const intervalId = setInterval(checkTime, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [officeHours, user, hasSkipped]);

  const handleContinueWorking = () => {
    if (!user?._id) return;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const skipKey = `skippedLunch_${user._id}_${todayStr}`;
    localStorage.setItem(skipKey, "true");
    setHasSkipped(true);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden"
          >
            {/* Decorative top strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-inner">
                <FiCoffee size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-2 tracking-tight">
                Scheduled Lunch Break
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed font-semibold">
                Your scheduled lunch break is now active. Productivity tracking is paused during this period.
              </p>
            </div>

            {/* Time Grid Info */}
            <div className="grid grid-cols-2 gap-4 py-4 px-2 my-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="space-y-1 text-center border-r border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Current Time
                </span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                  {currentTimeStr}
                </span>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block">
                  Time Remaining
                </span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {remainingMinutes} <span className="text-xs">min</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center"
                onClick={() => {
                  // Do nothing, just leave it open to lock the screen
                }}
              >
                Take Lunch
              </button>
              <button
                type="button"
                onClick={handleContinueWorking}
                className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700"
              >
                Continue Working
              </button>
            </div>
            <div className="mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              The screen will automatically unlock when the break ends if you choose to take lunch.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LunchBreakPopup;
