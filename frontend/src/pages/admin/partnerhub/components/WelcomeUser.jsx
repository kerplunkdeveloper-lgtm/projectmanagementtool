import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiClock, FiCalendar, FiSun, FiMoon } from "react-icons/fi";

const WelcomeUser = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  let greeting = "Good Evening";
  let Icon = FiMoon;
  let iconColor = "text-indigo-500";

  if (hour < 12) {
    greeting = "Good Morning";
    Icon = FiSun;
    iconColor = "text-amber-500";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
    Icon = FiSun;
    iconColor = "text-amber-500";
  }

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden  mb-4 rounded-2xl theme-bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
      

      {/* Left Side: Greeting */}
      <div className="flex items-center gap-3.5 min-w-0 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10  flex items-center justify-center  flex-shrink-0">
          <Icon className={`text-lg ${iconColor}`} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg md:text-xl  font-medium theme-text-primary leading-tight truncate">
              {greeting}, <span className="font-medium  text-blue-500 dark:text-[#e5ff00]">{user?.name || "User"}</span>
            </h1>
            <span className="px-2 py-0.5 rounded-lg italic  bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm">
              {user?.role || "Guest"}
            </span>
          </div>

        </div>
      </div>

      {/* Right Side: Date/Time */}
      <div className="flex items-center justify-between sm:justify-end gap-3.5 theme-bg-main border theme-border rounded-2xl p-2.5 shadow-inner w-full sm:w-auto min-w-0 sm:min-w-[240px] relative z-10">
        {/* Date */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-[#e5ff00]/40 flex items-center justify-center flex-shrink-0">
            <FiCalendar size={13} className="text-blue-600 dark:text-[#e5ff00]" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-wider theme-text-secondary leading-none mb-1">Date</p>
            <p className="text-xs font-black theme-text-primary truncate leading-none">{formattedDate}</p>
          </div>
        </div>

        <div className="w-px h-6 theme-border border-l flex-shrink-0" />

        {/* Time */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-[#e5ff00]/40 flex items-center justify-center flex-shrink-0">
            <FiClock size={13} className="text-indigo-600 dark:text-[#e5ff00]" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-wider theme-text-secondary leading-none mb-1">Time</p>
            <p className="text-xs font-black theme-text-primary font-mono tracking-tight whitespace-nowrap leading-none">{formattedTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeUser;