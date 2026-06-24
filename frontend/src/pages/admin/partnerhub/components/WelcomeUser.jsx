import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiClock, FiCalendar, FiSun, FiMoon } from "react-icons/fi";
import { getProfile } from "../../../../features/profile/profileSlice";

const WelcomeUser = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const profileUserId = profile?.user?._id || profile?.user;
      if (!profile || profileUserId !== (user.id || user._id)) {
        dispatch(getProfile());
      }
    }
  }, [dispatch, user, profile]);

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

  const avatarUrl = profile?.profileImage?.url;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative overflow-hidden p-4 sm:p-5 mb-4  rounded-2xl border theme-border bg-blue-200  flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
      {/* Left Side: Greeting & User Profile Card */}
      <div className="flex items-center gap-4 min-w-0 relative z-10">
        {/* Avatar initials / Image */}
        <div className="relative shrink-0">
          <div className="w-30 h-30 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 dark:from-[#e5ff00] dark:to-emerald-500 p-[2px] shadow-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-900"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-[#e5ff00] font-black text-sm">
                {initials}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {/* Greeting label */}
          <p className="text-[12px] mb-2 font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1">
            <Icon className={`text-2xl ${iconColor}`} /> {greeting}
          </p>
          
          {/* Name & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-lg font-black theme-text-primary leading-tight tracking-tight">
              {user?.name || "User"}
            </h1>
            <div className="flex items-center gap-1">
              {user?.department && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/25 text-blue-600 dark:text-[#e5ff00] text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm">
                  {user.department}
                </span>
              )}
            </div>
          </div>

          {/* Email Address */}
          <p className="text-[12px] font-medium text-slate-900 dark:text-slate-900 mt-1 select-all">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Right Side: Date/Time */}
      <div className="flex items-center justify-between sm:justify-end gap-3.5 theme-bg-main border theme-border rounded-2xl p-2.5 shadow-inner w-full sm:w-auto min-w-0 sm:min-w-[240px] relative z-10">
        {/* Date */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-[#e5ff00]/10 flex items-center justify-center flex-shrink-0">
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
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-[#e5ff00]/10 flex items-center justify-center flex-shrink-0">
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