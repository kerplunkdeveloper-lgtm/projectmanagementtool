import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { getProfile } from "../../features/profile/profileSlice";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiSliders,
  FiVolume2,
  FiVolumeX,
  FiMoon,
  FiSun,
  FiMonitor,
  FiClock,
  FiDroplet,
  FiCheck,
  FiEye,
} from "react-icons/fi";
import { LuPaintbrush } from "react-icons/lu";
import { updateUser, logWaterBreak } from "../../features/users/userSlice";
import { triggerWaterReminderPreview } from "../../components/common/WaterReminderManager.jsx";
import WaterReminderToast from "../../components/common/WaterReminderToast.jsx";

const colors = [
  {
    id: "default",
    name: "Ocean Blue",
    lightGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    darkGradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    lightGradient: "linear-gradient(135deg, #10b981, #34d399)",
    darkGradient: "linear-gradient(135deg, #34d399, #6ee7b7)",
  },
  {
    id: "neon-green",
    name: "Cyber Neon Green",
    lightGradient: "linear-gradient(135deg, #00b018, #00f721)",
    darkGradient: "linear-gradient(135deg, #00f721, #52ff6b)",
  },
  {
    id: "violet",
    name: "Royal Purple",
    lightGradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    darkGradient: "linear-gradient(135deg, #a78bfa, #c4b5fd)",
  },
  {
    id: "amber",
    name: "Sunset Orange",
    lightGradient: "linear-gradient(135deg, #f59e0b, #fb923c)",
    darkGradient: "linear-gradient(135deg, #fbbf24, #fcd34d)",
  },
  {
    id: "rose",
    name: "Hot Pink",
    lightGradient: "linear-gradient(135deg, #f43f5e, #fb7185)",
    darkGradient: "linear-gradient(135deg, #fb7185, #fda4af)",
  },
  {
    id: "cyan",
    name: "Electric Cyan",
    lightGradient: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    darkGradient: "linear-gradient(135deg, #22d3ee, #67e8f9)",
  },
  {
    id: "lime",
    name: "Neon Lime",
    lightGradient: "linear-gradient(135deg, #84cc16, #a3e635)",
    darkGradient: "linear-gradient(135deg, #84cc16, #a3e635)",
  },
  {
    id: "fuchsia",
    name: "Fuchsia Glow",
    lightGradient: "linear-gradient(135deg, #d946ef, #e879f9)",
    darkGradient: "linear-gradient(135deg, #e879f9, #f0abfc)",
  },
  {
    id: "teal",
    name: "Deep Teal",
    lightGradient: "linear-gradient(135deg, #0d9488, #2dd4bf)",
    darkGradient: "linear-gradient(135deg, #2dd4bf, #5eead4)",
  },
  {
    id: "red",
    name: "Crimson Red",
    lightGradient: "linear-gradient(135deg, #dc2626, #f87171)",
    darkGradient: "linear-gradient(135deg, #f87171, #fca5a5)",
  },
  {
    id: "indigo",
    name: "Deep Indigo",
    lightGradient: "linear-gradient(135deg, #4f46e5, #818cf8)",
    darkGradient: "linear-gradient(135deg, #818cf8, #a5b4fc)",
  },
  {
    id: "gold",
    name: "Luxury Gold",
    lightGradient: "linear-gradient(135deg, #b45309, #d97706)",
    darkGradient: "linear-gradient(135deg, #f59e0b, #fcd34d)",
  },
];

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { profile } = useSelector((s) => s.profile);
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    soundEnabled,
    setSoundEnabled,
  } = useTheme();

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [breakStartTime, setBreakStartTime] = useState("13:00");
  const [breakEndTime, setBreakEndTime] = useState("14:00");
  const [loadingHours, setLoadingHours] = useState(true);
  const [savingHours, setSavingHours] = useState(false);

  const canChangeOfficeHours =
    user?.role === "admin" || user?.role === "operationmanager";

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch, user]);

  useEffect(() => {
    const fetchOfficeHours = async () => {
      try {
        const response = await axiosInstance.get("/settings/office-hours");
        if (response.data?.success) {
          setStartTime(response.data.data.startTime || "09:00");
          setEndTime(response.data.data.endTime || "19:00");
          if (response.data.data.breakStartTime) setBreakStartTime(response.data.data.breakStartTime);
          if (response.data.data.breakEndTime) setBreakEndTime(response.data.data.breakEndTime);
        }
      } catch (err) {
        console.error("Failed to fetch office hours:", err);
      } finally {
        setLoadingHours(false);
      }
    };
    fetchOfficeHours();
  }, []);

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      const response = await axiosInstance.put("/settings/office-hours", {
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
      });
      if (response.data?.success) {
        toast.success("Office working hours updated successfully!");
      }
    } catch (err) {
      toast.error("Failed to update working hours");
      console.error(err);
    } finally {
      setSavingHours(false);
    }
  };

  // Individual Water Reminder Settings
  const [waterEnabled, setWaterEnabled] = useState(
    user?.waterReminder?.enabled !== false
  );
  const [waterInterval, setWaterInterval] = useState(
    user?.waterReminder?.interval || 60
  );
  const [waterStart, setWaterStart] = useState(
    user?.waterReminder?.workingHours?.start || "09:00"
  );
  const [waterEnd, setWaterEnd] = useState(
    user?.waterReminder?.workingHours?.end || "17:00"
  );
  const [savingWater, setSavingWater] = useState(false);
  const [loggingGlass, setLoggingGlass] = useState(false);
  const [showInlinePreview, setShowInlinePreview] = useState(false);

  useEffect(() => {
    if (user?.waterReminder) {
      if (user.waterReminder.enabled !== undefined) {
        setWaterEnabled(user.waterReminder.enabled !== false);
      }
      if (user.waterReminder.interval) {
        setWaterInterval(Number(user.waterReminder.interval));
      }
      if (user.waterReminder.workingHours?.start) {
        setWaterStart(user.waterReminder.workingHours.start);
      }
      if (user.waterReminder.workingHours?.end) {
        setWaterEnd(user.waterReminder.workingHours.end);
      }
    }
  }, [user?.waterReminder]);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayWaterLogs = (user?.waterReminder?.logs || []).filter(
    (l) => l.date === todayStr
  );
  const todayWaterCount = todayWaterLogs.length;

  const handleSaveWaterSettings = async () => {
    setSavingWater(true);
    try {
      const updatedReminder = {
        enabled: waterEnabled,
        interval: Number(waterInterval),
        workingHours: {
          start: waterStart,
          end: waterEnd,
        },
      };
      await dispatch(
        updateUser({
          id: "me",
          userData: {
            waterReminder: updatedReminder,
          },
        })
      ).unwrap();
      toast.success("Water reminder settings saved!");
    } catch (err) {
      toast.error("Failed to save water reminder settings");
      console.error(err);
    } finally {
      setSavingWater(false);
    }
  };

  const handleQuickLogGlass = async () => {
    setLoggingGlass(true);
    try {
      await dispatch(logWaterBreak()).unwrap();
      toast.success("Glass of water logged! 💧");
    } catch (err) {
      toast.error("Failed to log glass of water");
      console.error(err);
    } finally {
      setLoggingGlass(false);
    }
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const avatarUrl = profile?.profileImage?.url;

  return (
    <div className="min-h-screen">
      <div className="px-3 sm:px-5 py-4 sm:py-6 max-w-4xl mx-auto animate-fadeIn">
        {/* PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight">
            System Settings
          </h1>
          <p className="text-xs theme-text-secondary mt-1">
            Configure your personal preferences, theme presets and
            notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5">
          {/* LEFT COLUMN: MINI PROFILE CARD */}
          <div className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm flex flex-col items-center text-center h-fit">
            <div className="relative mb-4 shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 dark:from-[#3b82f6] dark:to-emerald-500 p-[2.5px] shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-[#3b82f6] font-black text-xl">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-base font-black theme-text-primary leading-tight tracking-tight">
              {user?.name || "User"}
            </h2>
            <p className="text-[11px] theme-text-secondary mt-1 select-all font-medium">
              {user?.email}
            </p>

            <div className="flex flex-col gap-1.5 w-full mt-5">
              <div className="flex items-center justify-between rounded-xl px-3 py-2 text-left border theme-border">
                <span className="text-[10px] font-black theme-text-secondary uppercase tracking-wider">
                  Role
                </span>
                <span className="text-[10px] font-bold theme-text-primary capitalize bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-md">
                  {user?.role || "Member"}
                </span>
              </div>

              {user?.department && (
                <div className="flex items-center justify-between rounded-xl px-3 py-2 text-left border theme-border">
                  <span className="text-[10px] font-black theme-text-secondary uppercase tracking-wider">
                    Department
                  </span>
                  <span className="text-[10px] font-bold theme-text-primary capitalize bg-blue-50 dark:bg-[#3b82f6]/10 border border-blue-100 dark:border-[#3b82f6]/25 px-2 py-0.5 rounded-md">
                    {user.department}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: PREFERENCES */}
          <div className="space-y-5">
            {/* THEME SHORTCUTS & PREFERENCES */}
            <div className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b theme-border pb-3">
                <LuPaintbrush className="text-blue-500 dark:text-[#3b82f6] text-lg" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Theme Preference
                </h3>
              </div>

              {/* LIGHT / DARK SHORTCUTS */}
              <div className="mb-6">
                <label className="block text-xs font-black theme-text-secondary uppercase tracking-wider mb-2.5">
                  App Appearance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer text-center ${
                      theme === "light"
                        ? "theme-border-accent bg-indigo-500/5 text-blue-500 dark:text-[#3b82f6] border-blue-500 dark:border-[#3b82f6]"
                        : "theme-border theme-bg-card theme-text-secondary hover:theme-bg-main"
                    }`}
                  >
                    <FiSun size={16} />
                    <span className="text-[10px] font-bold">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer text-center ${
                      theme === "dark"
                        ? "theme-border-accent bg-indigo-500/5 text-blue-500 dark:text-[#3b82f6] border-blue-500 dark:border-[#3b82f6]"
                        : "theme-border theme-bg-card theme-text-secondary hover:theme-bg-main"
                    }`}
                  >
                    <FiMoon size={16} />
                    <span className="text-[10px] font-bold">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer text-center ${
                      theme === "system"
                        ? "theme-border-accent bg-indigo-500/5 text-blue-500 dark:text-[#3b82f6] border-blue-500 dark:border-[#3b82f6]"
                        : "theme-border theme-bg-card theme-text-secondary hover:theme-bg-main"
                    }`}
                  >
                    <FiMonitor size={16} />
                    <span className="text-[10px] font-bold">System</span>
                  </button>
                </div>
              </div>

              {/* ACCENT COLOR PRESET GRID */}
              <div>
                <label className="block text-xs font-black theme-text-secondary uppercase tracking-wider mb-3">
                  Accent Color Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colors.map((color) => {
                    const isActive = accentColor === color.id;
                    const gradient =
                      theme === "dark"
                        ? color.darkGradient
                        : color.lightGradient;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color.id)}
                        className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden group ${
                          isActive
                            ? "border-transparent ring-2 ring-offset-1 ring-offset-transparent"
                            : "theme-border theme-bg-card hover:theme-bg-main hover:shadow-sm"
                        }`}
                        style={
                          isActive
                            ? {
                                ringColor: "transparent",
                                boxShadow: `0 0 0 2px ${gradient.split(",")[1]?.trim().split(")")[0] ?? "#3b82f6"}`,
                              }
                            : {}
                        }
                      >
                        {/* Gradient swatch */}
                        <span
                          className="w-8 h-8 rounded-lg shrink-0 shadow-sm"
                          style={{ background: gradient }}
                        />
                        <span
                          className={`text-[11px] font-bold leading-tight ${
                            isActive
                              ? "theme-text-primary"
                              : "theme-text-secondary group-hover:theme-text-primary"
                          }`}
                        >
                          {color.name}
                        </span>
                        {isActive && (
                          <span
                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black shadow"
                            style={{ background: gradient }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* WATER BREAK REMINDER (INDIVIDUAL USER SETTING) */}
            <div className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm mt-5 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 border-b theme-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                    <FiDroplet />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold theme-text-primary uppercase tracking-wider">
                      Water Break Reminder
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                    Personal
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerWaterReminderPreview}
                    className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] tracking-wide shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    title="Trigger live toast notification preview"
                  >
                    <FiEye size={13} />
                    <span>Preview Toast</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveWaterSettings}
                    disabled={savingWater}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-extrabold text-[11px] tracking-wide shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingWater ? (
                      "Saving..."
                    ) : (
                      <>
                        <FiCheck size={13} />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mascot Hero Card */}
              <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-transparent dark:from-emerald-950/25 dark:via-teal-950/15 dark:to-transparent border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3.5">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-white dark:bg-slate-900 p-1 border border-emerald-100 dark:border-emerald-800/40 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src="/assets/water-reminder.png"
                    alt="Water Mascot"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = "/Robots/robot-1.png";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Hydration Assistant
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                    Sorted monitors your active work time and displays a friendly toast to help you stay healthy and hydrated.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border theme-border bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="water-reminder-toggle"
                      className="text-xs font-black theme-text-primary block cursor-pointer"
                    >
                      Enable Water Reminders
                    </label>
                    <p className="text-[10px] theme-text-secondary">
                      Show popup toasts during active work on this site
                    </p>
                  </div>
                  <button
                    id="water-reminder-toggle"
                    type="button"
                    role="switch"
                    aria-checked={waterEnabled}
                    onClick={() => setWaterEnabled(!waterEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      waterEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        waterEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {waterEnabled && (
                  <>
                    {/* Interval Selector */}
                    <div>
                      <label className="block text-xs font-black theme-text-secondary uppercase tracking-wider mb-2.5">
                        Reminder Interval
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 30, label: "30 Minutes", badge: "Frequent" },
                          { value: 60, label: "60 Minutes", badge: "Recommended" },
                          { value: 90, label: "90 Minutes", badge: "Extended" },
                        ].map((opt) => {
                          const isSelected = waterInterval === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setWaterInterval(opt.value)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm"
                                  : "theme-border theme-bg-card theme-text-secondary hover:theme-bg-main font-semibold"
                              }`}
                            >
                              <span className="text-xs font-black">{opt.label}</span>
                              <span
                                className={`text-[9px] mt-1 px-1.5 py-0.5 rounded-full ${
                                  isSelected
                                    ? "bg-emerald-500 text-white font-bold"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium"
                                }`}
                              >
                                {opt.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Working Hours Settings */}
                    <div>
                      <label className="block text-xs font-black theme-text-secondary uppercase tracking-wider mb-2.5">
                        Active Working Hours
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider theme-text-secondary block">
                            Reminder Start
                          </label>
                          <input
                            type="time"
                            value={waterStart}
                            onChange={(e) => setWaterStart(e.target.value)}
                            className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold theme-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider theme-text-secondary block">
                            Reminder End
                          </label>
                          <input
                            type="time"
                            value={waterEnd}
                            onChange={(e) => setWaterEnd(e.target.value)}
                            className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold theme-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                        Reminders are automatically paused outside your specified active hours.
                      </p>
                    </div>

                    {/* Daily Tracker & Quick Log */}
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black theme-text-primary">
                            Today's Hydration:
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            {todayWaterCount} / 8 glasses
                          </span>
                        </div>
                        {/* 8 water glass dots */}
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(8)].map((_, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-all ${
                                i < todayWaterCount
                                  ? "bg-gradient-to-tr from-emerald-400 to-teal-400 text-white shadow-sm"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                              }`}
                            >
                              💧
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleQuickLogGlass}
                        disabled={loggingGlass}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-50 dark:hover:bg-slate-700/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <FiDroplet size={13} className="text-emerald-500" />
                        <span>{loggingGlass ? "Logging..." : "Log a glass now"}</span>
                      </button>
                    </div>

                    {/* Live Toast Preview Toggle & Section */}
                    <div className="pt-3 border-t theme-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FiEye className="text-emerald-500" size={14} />
                          <span className="text-xs font-bold theme-text-primary">
                            Visual Toast Preview
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInlinePreview(!showInlinePreview)}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {showInlinePreview ? "Hide In-Card Preview" : "Show In-Card Preview"}
                        </button>
                      </div>

                      {showInlinePreview && (
                        <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-emerald-200/50 dark:border-emerald-800/40 flex flex-col items-center gap-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Interactive Preview
                          </div>
                          <WaterReminderToast
                            onLog={handleQuickLogGlass}
                            onSnooze={() => toast.success("Snoozed 30 mins (preview) ⏰")}
                            onClose={() => setShowInlinePreview(false)}
                            progress={100}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* BUSINESS HOURS INFO */}
            <div className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm mt-5">
              <div className="flex items-center justify-between mb-4 border-b theme-border pb-3">
                <div className="flex items-center gap-2">
                  <FiClock className="text-emerald-500 dark:text-emerald-400 text-lg animate-pulse" />
                  <h3 className="text-sm font-bold theme-text-primary uppercase tracking-wider">
                    Office Working Hours
                  </h3>
                  {!canChangeOfficeHours && (
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border theme-border">
                      Read-Only
                    </span>
                  )}
                </div>
                {canChangeOfficeHours && (
                  <button
                    onClick={handleSaveHours}
                    disabled={savingHours || loadingHours}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] tracking-wide shadow-md shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingHours ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>

              {loadingHours ? (
                <div className="text-xs theme-text-secondary py-2">
                  Loading hours config...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select Hours Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider theme-text-secondary block">
                        Start Workday
                      </label>
                      <input
                        type="time"
                        disabled={!canChangeOfficeHours}
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold theme-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#3b82f6] disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider theme-text-secondary block">
                        End Workday
                      </label>
                      <input
                        type="time"
                        disabled={!canChangeOfficeHours}
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold theme-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#3b82f6] disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Lunch Hours Fields */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider theme-text-secondary block">
                        Lunch Start Time
                      </label>
                      <input
                        type="time"
                        disabled={!canChangeOfficeHours}
                        value={breakStartTime}
                        onChange={(e) => setBreakStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold theme-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#3b82f6] disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider theme-text-secondary block">
                        Lunch End Time
                      </label>
                      <input
                        type="time"
                        disabled={!canChangeOfficeHours}
                        value={breakEndTime}
                        onChange={(e) => setBreakEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold theme-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#3b82f6] disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="h-px theme-border" />

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-450/15 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 text-xs">
                      🚫
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black theme-text-primary">
                        Sundays & Holidays
                      </h4>
                      <p className="text-[10px] theme-text-secondary mt-0.5">
                        Closed (Sundays are excluded from productivity tracking)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
