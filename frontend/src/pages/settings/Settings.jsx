import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { getProfile } from "../../features/profile/profileSlice";
import { FiUser, FiMail, FiSliders, FiVolume2, FiVolumeX, FiMoon, FiSun, FiMonitor } from "react-icons/fi";
import { LuPaintbrush } from "react-icons/lu";

const colors = [
  { id: "default", name: "Default", class: "bg-blue-500", darkClass: "dark:bg-[#e5ff00]" },
  { id: "emerald", name: "Emerald Green", class: "bg-emerald-500", darkClass: "dark:bg-emerald-400" },
  { id: "violet", name: "Royal Purple", class: "bg-violet-600", darkClass: "dark:bg-violet-400" },
  { id: "amber", name: "Vibrant Orange", class: "bg-amber-500", darkClass: "dark:bg-amber-400" },
  { id: "rose", name: "Neon Pink", class: "bg-rose-500", darkClass: "dark:bg-rose-400" }
];

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { profile } = useSelector((s) => s.profile);
  const { theme, setTheme, accentColor, setAccentColor, soundEnabled, setSoundEnabled } = useTheme();

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch, user]);

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const avatarUrl = profile?.profileImage?.url;

  return (
    <div className="min-h-screen">
      <div className="px-3 sm:px-5 py-4 sm:py-6 max-w-4xl mx-auto animate-fadeIn">
        {/* PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black theme-text-primary tracking-tight">System Settings</h1>
          <p className="text-xs theme-text-secondary mt-1">Configure your personal preferences, theme presets and notifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5">
          {/* LEFT COLUMN: MINI PROFILE CARD */}
          <div className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm flex flex-col items-center text-center h-fit">
            <div className="relative mb-4 shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 dark:from-[#e5ff00] dark:to-emerald-500 p-[2.5px] shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-[#e5ff00] font-black text-xl">
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
                <span className="text-[10px] font-black theme-text-secondary uppercase tracking-wider">Role</span>
                <span className="text-[10px] font-bold theme-text-primary capitalize bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-md">
                  {user?.role || "Member"}
                </span>
              </div>

              {user?.department && (
                <div className="flex items-center justify-between rounded-xl px-3 py-2 text-left border theme-border">
                  <span className="text-[10px] font-black theme-text-secondary uppercase tracking-wider">Department</span>
                  <span className="text-[10px] font-bold theme-text-primary capitalize bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/25 px-2 py-0.5 rounded-md">
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
                <LuPaintbrush className="text-blue-500 dark:text-[#e5ff00] text-lg" />
                <h3 className="text-sm font-bold theme-text-primary uppercase tracking-wider">Theme Preference</h3>
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
                        ? "theme-border-accent bg-indigo-500/5 text-blue-500 dark:text-[#e5ff00] border-blue-500 dark:border-[#e5ff00]"
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
                        ? "theme-border-accent bg-indigo-500/5 text-blue-500 dark:text-[#e5ff00] border-blue-500 dark:border-[#e5ff00]"
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
                        ? "theme-border-accent bg-indigo-500/5 text-blue-500 dark:text-[#e5ff00] border-blue-500 dark:border-[#e5ff00]"
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
                <label className="block text-xs font-black theme-text-secondary uppercase tracking-wider mb-2.5">
                  Accent Color Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {colors.map((color) => {
                    const isActive = accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? "theme-border-accent bg-indigo-500/5 border-blue-500 dark:border-[#e5ff00]"
                            : "theme-border theme-bg-card hover:theme-bg-main"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full shadow-inner ${color.class} ${color.darkClass}`} />
                        <span className={`text-[11px] font-bold ${isActive ? "theme-text-primary" : "theme-text-secondary"}`}>
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SOUND SETTINGS */}
            <div className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b theme-border pb-3">
                <FiSliders className="text-blue-500 dark:text-[#e5ff00] text-lg" />
                <h3 className="text-sm font-bold theme-text-primary uppercase tracking-wider">Preferences</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-[#e5ff00]/10 flex items-center justify-center text-blue-500 dark:text-[#e5ff00]">
                    {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black theme-text-primary">Notification Sounds</h4>
                    <p className="text-[9px] theme-text-secondary mt-0.5">Play a chime when you receive notifications or messages.</p>
                  </div>
                </div>

                {/* IOS-style toggle switch */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? "theme-bg-accent" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
