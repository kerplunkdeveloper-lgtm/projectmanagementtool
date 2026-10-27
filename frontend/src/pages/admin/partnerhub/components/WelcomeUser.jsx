import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiClock,
  FiCalendar,
  FiSun,
  FiMoon,
  FiUser,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { MdOutlineEdit as MdPencilEdit } from "react-icons/md";
import { motion } from "framer-motion";
import { getProfile } from "../../../../features/profile/profileSlice";

const WelcomeUser = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading: profileLoading } = useSelector((state) => state.profile);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAttemptedProfileFetch, setHasAttemptedProfileFetch] = useState(false);

  const robotImages = [
    "/Robots/robot-6.png",
    "/Robots/robot-2.png",
    "/Robots/robot-5.png",
    "/Robots/robot-1.png",
  ];
  const [robotIndex, setRobotIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setHasAttemptedProfileFetch(false);
  }, [user?._id, user?.id]);

  useEffect(() => {
    if (user && !profileLoading && !hasAttemptedProfileFetch) {
      const profileUserId = profile?.user?._id || profile?.user;
      if (!profile || profileUserId !== (user.id || user._id)) {
        setHasAttemptedProfileFetch(true);
        dispatch(getProfile());
      }
    }
  }, [dispatch, user, profile, profileLoading, hasAttemptedProfileFetch]);

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

  const getDepartmentBgImage = (dept, role) => {
    const d = (dept || "").toLowerCase();
    const r = (role || "").toLowerCase();

    if (r === "admin" || r === "superadmin") {
      return "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80";
    }
    if (
      d.includes("social") ||
      d.includes("media") ||
      d.includes("marketing") ||
      d.includes("instagram")
    ) {
      return "https://images.unsplash.com/photo-1683721003111-070bcc053d8b?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    }
    if (
      d.includes("web") ||
      d.includes("dev") ||
      d.includes("software") ||
      d.includes("code") ||
      d.includes("tech") ||
      d.includes("programmer")
    ) {
      return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80";
    }
    if (
      d.includes("design") ||
      d.includes("creative") ||
      d.includes("ui") ||
      d.includes("ux") ||
      d.includes("art") ||
      d.includes("graphic") ||
      d.includes("designer")
    ) {
      // Sleek Photoshop/Creative workspace image for graphic designers
      return "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80";
    }
    if (
      d.includes("seo") ||
      d.includes("search") ||
      d.includes("analytics") ||
      d.includes("expert")
    ) {
      return "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80";
    }
    if (
      d.includes("video") ||
      d.includes("editor") ||
      d.includes("editing") ||
      d.includes("production") ||
      d.includes("film")
    ) {
      return "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80";
    }
    if (
      d.includes("content") ||
      d.includes("writer") ||
      d.includes("writing") ||
      d.includes("copywriter") ||
      d.includes("blog")
    ) {
      return "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80";
    }
    if (
      d.includes("operation") ||
      d.includes("manage") ||
      d.includes("admin") ||
      d.includes("lead") ||
      d.includes("project") ||
      d.includes("account")
    ) {
      return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80";
    }

    return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
  };

  const [isLive, setIsLive] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState("PM");

  const activeDate = isLive ? currentTime : selectedDate;
  const activeHour = isLive ? currentTime.getHours() % 12 || 12 : selectedHour;
  const activeMinute = isLive ? currentTime.getMinutes() : selectedMinute;
  const activeAmPm = isLive
    ? currentTime.getHours() >= 12
      ? "PM"
      : "AM"
    : selectedAmPm;
  const activeViewDate = isLive ? currentTime : viewDate;

  // Get days of the month for the calendar widget based on activeViewDate
  const getCalendarDays = () => {
    const year = activeViewDate.getFullYear();
    const month = activeViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevTotalDays - i, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    // Next month padding days to make full grid
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const getHourStyle = (h) => {
    const angle = (h * 30 * Math.PI) / 180;
    const radius = 38; // px radius for placement inside 110px dial
    const x = Math.sin(angle) * radius;
    const y = -Math.cos(angle) * radius;
    return {
      transform: `translate(${x}px, ${y}px)`,
    };
  };

  const handAngle = activeHour * 30;

  // Handler functions
  const handlePrevMonth = () => {
    setIsLive(false);
    setViewDate(
      new Date(activeViewDate.getFullYear(), activeViewDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setIsLive(false);
    setViewDate(
      new Date(activeViewDate.getFullYear(), activeViewDate.getMonth() + 1, 1),
    );
  };

  const handleDayClick = (day, isCurrent) => {
    setIsLive(false);
    const targetMonth = isCurrent
      ? activeViewDate.getMonth()
      : day > 20
        ? activeViewDate.getMonth() - 1
        : activeViewDate.getMonth() + 1;
    const clicked = new Date(activeViewDate.getFullYear(), targetMonth, day);
    setSelectedDate(clicked);
    setViewDate(clicked);
  };

  const handleHourClick = (h) => {
    setIsLive(false);
    setSelectedHour(h);
  };

  const incrementHour = (e) => {
    e.stopPropagation();
    setIsLive(false);
    setSelectedHour((prev) => {
      const cur = isLive ? currentTime.getHours() % 12 || 12 : prev;
      return cur === 12 ? 1 : cur + 1;
    });
  };

  const decrementHour = (e) => {
    e.stopPropagation();
    setIsLive(false);
    setSelectedHour((prev) => {
      const cur = isLive ? currentTime.getHours() % 12 || 12 : prev;
      return cur === 1 ? 12 : cur - 1;
    });
  };

  const incrementMinute = (e) => {
    e.stopPropagation();
    setIsLive(false);
    setSelectedMinute((prev) => {
      const cur = isLive ? currentTime.getMinutes() : prev;
      return cur === 59 ? 0 : cur + 1;
    });
  };

  const decrementMinute = (e) => {
    e.stopPropagation();
    setIsLive(false);
    setSelectedMinute((prev) => {
      const cur = isLive ? currentTime.getMinutes() : prev;
      return cur === 0 ? 59 : cur - 1;
    });
  };

  const toggleAmPm = (e) => {
    e.stopPropagation();
    setIsLive(false);
    setSelectedAmPm((prev) => {
      const cur = isLive ? (currentTime.getHours() >= 12 ? "PM" : "AM") : prev;
      return cur === "PM" ? "AM" : "PM";
    });
  };

  const handleTodayClick = () => {
    setIsLive(true);
  };

  return (
    <>
      <div className="relative overflow-hidden p-3 sm:p-3.5 mb-4 rounded-2xl border-none flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fadeIn shadow-lg transition-colors duration-300 theme-bg-accent">
        {/* Background Image overlay with mix-blend-overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src={getDepartmentBgImage(
              user?.department || profile?.department,
              user?.role || profile?.role,
            )}
            alt=""
            className="w-full h-full object-cover opacity-[0.25] mix-blend-overlay dark:opacity-[0.32] transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent dark:from-white/10 dark:via-white/2 dark:to-transparent" />
        </div>

        {/* Left Side: Greeting & User Profile Card */}
        <div className="flex items-center gap-3.5 min-w-0 relative z-10">
          {/* Avatar initials / Image */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="relative shrink-0 cursor-pointer hover:scale-105 active:scale-98 transition-all duration-300 group"
            title="Click to view profile details"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-[130px] md:h-[130px] lg:w-[200px] lg:h-[200px] rounded-full shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-900"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-[#3b82f6] font-black text-sm">
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
            <p className="text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-0.5 text-white/90 dark:text-black/90">
              <Icon className={`text-xl ${iconColor} drop-shadow-sm`} />{" "}
              {greeting}
            </p>

            {/* Name & Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                {user?.name || "User"}
              </h1>
              <div className="flex items-center gap-1">
                {user?.department && (
                  <span className="spinning-border-badge text-black">
                    <span className="spinning-border-badge-inner text-black">
                      {user.department}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Email Address */}
            <p className="text-[11px] font-medium text-white/90 dark:text-black/90 mt-0.5 select-all">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Right Side: Exact Reference Image Dual-Panel Calendar, Time & Mascot Card */}
        <div className="bg-white dark:bg-[#070b13] border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-black/5 dark:shadow-none flex flex-row items-stretch justify-between gap-2 sm:gap-3.5 w-full sm:w-auto shrink-0 select-none">
          {/* Left Panel: Calendar Picker */}
          <div className="flex-1 min-w-0 sm:w-[205px] sm:flex-initial flex flex-col justify-between">
            {/* Calendar Header: < Month Year > */}
            <div className="flex items-center justify-between px-0.5 mb-1 sm:mb-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-5.5 h-5.5 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                title="Previous month"
              >
                <FiChevronLeft size={13} className="stroke-[2.5]" />
              </button>

              <span className="text-[12.5px] sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight select-none truncate">
                {activeViewDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-5.5 h-5.5 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                title="Next month"
              >
                <FiChevronRight size={13} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Weekdays Row: SUN MON TUE WED THU FRI SAT */}
            <div className="grid grid-cols-7 text-center text-[8px] sm:text-[8.5px] font-extrabold text-slate-800 dark:text-slate-300 mb-1 tracking-tight select-none">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-y-0.5 sm:gap-y-0.5 gap-x-0.5 sm:gap-x-0.5 text-center">
              {getCalendarDays().map((cell, idx) => {
                const isSelected =
                  cell.isCurrentMonth &&
                  cell.day === activeDate.getDate() &&
                  activeViewDate.getMonth() === activeDate.getMonth() &&
                  activeViewDate.getFullYear() === activeDate.getFullYear();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDayClick(cell.day, cell.isCurrentMonth)}
                    className={`h-5.5 w-5.5 sm:h-5.5 sm:w-5.5 mx-auto flex items-center justify-center rounded-full text-[10px] sm:text-[10.5px] transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#2563eb] text-white font-bold shadow-md shadow-blue-500/50 scale-105"
                        : cell.isCurrentMonth
                        ? "text-slate-900 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-white/10"
                        : "text-slate-400 dark:text-white/30 font-medium"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Calendar Footer: Today Pill */}
            <div className="mt-1.5 sm:mt-1.5 pt-1 sm:pt-1 flex items-center justify-start border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={handleTodayClick}
                className="px-2.5 sm:px-2.5 py-0.5 sm:py-0.5 rounded-lg border border-slate-200/90 dark:border-white/15 bg-white dark:bg-slate-800 text-[#2563eb] dark:text-blue-400 font-bold text-[10px] sm:text-[10px] shadow-2xs hover:shadow-sm hover:border-blue-400 dark:hover:border-blue-400 active:scale-95 transition-all cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          {/* Divider: Clean vertical line */}
          <div className="w-[1px] bg-slate-100 dark:bg-white/10 self-stretch my-0.5 shrink-0" />

          {/* Right Panel: Current Time & Mascot */}
          <div className="flex-1 min-w-0 sm:w-[200px] sm:flex-initial flex flex-col justify-center pl-1 sm:pl-0">
            {/* Title */}
            <div className="text-[12px] sm:text-[13px] font-bold text-slate-900 dark:text-white text-left mb-1 sm:mb-1.5 select-none">
              Current Time
            </div>

            {/* Row: Time Card + Greeting on left, Mascot on right */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {/* Left Column: Blue Time Card & Greeting Pill */}
              <div className="flex flex-col items-start gap-1 sm:gap-1.5 min-w-0">
                {/* Gradient Blue Digital Clock Box */}
                <div className="w-[78px] sm:w-[98px] h-[64px] sm:h-[76px] rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-md shadow-blue-500/25 flex flex-col items-center justify-center p-1 sm:p-1.5 relative overflow-hidden group shrink-0">
                  {/* Subtle top ambient shine */}
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-white/15 rounded-full blur-sm pointer-events-none" />

                  {/* Digital Time: HH:MM */}
                  <div className="flex items-center text-[17px] sm:text-[22px] font-black tracking-tight leading-none text-white select-none">
                    <span>
                      {String(currentTime.getHours() % 12 || 12).padStart(2, "0")}
                    </span>
                    <span className="mx-0.5 text-white/90 animate-pulse font-bold">
                      :
                    </span>
                    <span>
                      {String(currentTime.getMinutes()).padStart(2, "0")}
                    </span>
                  </div>

                  {/* AM/PM */}
                  <div className="text-[9px] sm:text-[10px] font-extrabold text-white/95 mt-0.5 sm:mt-1 uppercase tracking-wider select-none">
                    {currentTime.getHours() >= 12 ? "PM" : "AM"}
                  </div>
                </div>

                {/* Greeting Pill */}
                <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/10 border border-slate-200/70 dark:border-white/10 shadow-2xs max-w-full">
                  <span className="text-[10px] sm:text-[11px] leading-none shrink-0">
                    {currentTime.getHours() < 12
                      ? "☀️"
                      : currentTime.getHours() < 17
                      ? "☀️"
                      : currentTime.getHours() < 21
                      ? "🌆"
                      : "🌙"}
                  </span>
                  <span className="text-[8px] sm:text-[9.5px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate">
                    {currentTime.getHours() < 12
                      ? "Good morning"
                      : currentTime.getHours() < 17
                      ? "Good afternoon"
                      : currentTime.getHours() < 21
                      ? "Good evening"
                      : "Good night"}
                  </span>
                </div>
              </div>

              {/* Right Column: 3D Cute Robot Mascot */}
              <div className="relative shrink-0 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -2.5, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative cursor-pointer group"
                  onClick={() =>
                    setRobotIndex((prev) => (prev + 1) % robotImages.length)
                  }
                  title="Click to interact with mascot!"
                >
                  <img
                    src={robotImages[robotIndex]}
                    alt="Robot Mascot"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/Robots/robot-1.png";
                    }}
                    className="w-16 sm:w-[76px] h-20 sm:h-[105px] object-contain filter drop-shadow-md select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Celebration sparkles beside thumbs up */}
                  <div className="absolute top-2 -right-1 text-blue-500 font-bold text-[10px] animate-bounce pointer-events-none select-none">
                    ✨
                  </div>
                </motion.div>
              </div>
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

            <Link 
              to={`/${user.role}/profile`} 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-14 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors z-20 cursor-pointer"
            >
              <MdPencilEdit className="h-4 w-4 text-slate-500" />
            </Link>
            
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
                  <span className="text-xs font-bold uppercase tracking-wider">
                    No Profile Image
                  </span>
                </div>
              )}
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center text-left">
              {/* Role Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-blue-600 dark:text-[#3b82f6] text-[9.5px] font-black uppercase tracking-wider">
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
                <span className="text-xs font-semibold select-all truncate">
                  {user?.email}
                </span>
              </div>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800/80 my-4" />

              {/* Bio & Phone Details */}
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    About Me / Bio
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {profile?.bio || "No profile bio details added yet."}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    Phone Number
                  </h4>
                  <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 font-bold">
                    {profile?.phone || "Not added"}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WelcomeUser;
