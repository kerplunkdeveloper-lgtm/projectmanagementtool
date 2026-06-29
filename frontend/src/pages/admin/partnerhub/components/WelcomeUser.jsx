import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiClock, FiCalendar, FiSun, FiMoon, FiUser, FiMail } from "react-icons/fi";
import { getProfile } from "../../../../features/profile/profileSlice";

const WelcomeUser = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <>
      <div 
        className="relative overflow-hidden p-4 sm:p-5 mb-4 rounded-2xl border-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn shadow-lg transition-colors duration-300"
        style={{ background: 'var(--color-brand-gradient)' }}
      >
        {/* Left Side: Greeting & User Profile Card */}
        <div className="flex items-center gap-4 min-w-0 relative z-10">
          {/* Avatar initials / Image */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="relative shrink-0 cursor-pointer hover:scale-105 active:scale-98 transition-all duration-300 group"
            title="Click to view profile details"
          >
            <div className="w-20 h-20 md:w-[120px] md:h-[120px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 dark:from-[#e5ff00] dark:to-emerald-500 p-[2px] shadow-sm">
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
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider transition-opacity duration-300">
              View
            </div>
          </div>

          <div className="min-w-0">
            {/* Greeting label */}
            <p className="text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 text-white/90 dark:text-black/90">
              <Icon className={`text-2xl ${iconColor} drop-shadow-sm`} /> {greeting}
            </p>
            
            {/* Name & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-4xl font-medium text-black leading-tight tracking-tight">
                {user?.name || "User"}
              </h1>
              <div className="flex items-center gap-1">
                {user?.department && (
                  <span className="px-2 py-0.5 rounded-md bg-white/20 dark:bg-black/10 border border-white/30 dark:border-black/20 text-black text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm backdrop-blur-sm">
                    {user.department}
                  </span>
                )}
              </div>
            </div>

            {/* Email Address */}
            <p className="text-[12px] font-medium text-black/90 mt-1 select-all">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Right Side: Date/Time */}
        <div className="flex items-center justify-between sm:justify-end gap-3.5 bg-white/10 dark:bg-black/5 border border-white/20 dark:border-black/10 rounded-2xl p-2.5 shadow-inner w-full sm:w-auto min-w-0 sm:min-w-[240px] relative z-10 backdrop-blur-sm">
          {/* Date */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
            <div className="w-8 h-8 rounded-lg bg-white/20 dark:bg-black/10 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FiCalendar size={13} className="text-black" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-wider text-white/80 dark:text-black/80 leading-none mb-1">Date</p>
              <p className="text-xs font-black text-black dark:text-black truncate leading-none">{formattedDate}</p>
            </div>
          </div>

          <div className="w-px h-6 border-l border-white/20 dark:border-black/10 flex-shrink-0" />

          {/* Time */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
            <div className="w-8 h-8 rounded-lg bg-white/20 dark:bg-black/10 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FiClock size={13} className="text-black" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-wider text-white/80 dark:text-black/80 leading-none mb-1">Time</p>
              <p className="text-xs font-black text-black dark:text-black font-mono tracking-tight whitespace-nowrap leading-none">{formattedTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PROFILE DETAILS MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row transform transition-all animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors z-20 cursor-pointer"
            >
              &times;
            </button>

            {/* Left Side: Image Full View */}
            <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-950/60 flex items-center justify-center overflow-hidden min-h-[280px] md:min-h-[380px] relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div className="w-full h-full min-h-[280px] md:min-h-[380px] flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-600">
                  <FiUser size={64} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">No Profile Image</span>
                </div>
              )}
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center text-left">
              {/* Role Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-blue-600 dark:text-[#e5ff00] text-[9.5px] font-black uppercase tracking-wider">
                  {user?.role || "Member"}
                </span>
                {user?.department && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black uppercase tracking-wider">
                    {user.department}
                  </span>
                )}
              </div>

              {/* Name */}
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                {user?.name || "User"}
              </h2>

              {/* Email */}
              <div className="mt-2.5 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <FiMail size={14} className="shrink-0" />
                <span className="text-xs font-semibold select-all truncate">{user?.email}</span>
              </div>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800/80 my-4" />

              {/* Bio & Phone Details */}
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">About Me / Bio</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {profile?.bio || "No profile bio details added yet."}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Phone Number</h4>
                  <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 font-bold">
                    {profile?.phone || "Not added"}
                  </p>
                </div>

                {profile?.address && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Location / Address</h4>
                    <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 font-bold">
                      {profile.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WelcomeUser;