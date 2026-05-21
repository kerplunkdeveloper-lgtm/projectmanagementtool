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
    <div className="relative overflow-hidden bg-white border border-slate-200/70 shadow-sm rounded-2xl p-2 mb-2 animate-fadeIn">
      {/* Background Blurs */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        {/* Left Side: Greeting */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner flex-shrink-0">
            <Icon className={`text-xs ${iconColor}`} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight truncate">
                {greeting},{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                  {user?.name || "User"}
                </span>
              </h1>
              <span className="px-1.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm">
                {user?.role || "Guest"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Date/Time */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 shadow-sm self-start sm:self-auto">
          {/* Date */}
          <div className="flex items-center gap-1.5 min-w-0">
            <FiCalendar size={9} className="text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Date</p>
              <p className="text-[9px] font-bold text-slate-700 truncate leading-none">{formattedDate}</p>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

          {/* Time */}
          <div className="flex items-center gap-1.5 min-w-0">
            <FiClock size={9} className="text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Time</p>
              <p className="text-[9px] font-bold text-slate-700 font-mono tracking-tight whitespace-nowrap leading-none">{formattedTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeUser;