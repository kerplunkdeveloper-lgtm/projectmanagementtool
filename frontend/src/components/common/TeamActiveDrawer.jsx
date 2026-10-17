import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiSearch,
  FiUsers,
  FiRefreshCw,
  FiSettings,
  FiCheck,
  FiSliders,
  FiMessageSquare,
} from "react-icons/fi";
import { useGetTeamActivityQuery } from "../../features/api/apiSlice";
import { useSocketContext } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";

// Theme Accent Color Configurations
const ACCENT_STYLES = {
  emerald: {
    name: "Emerald Green",
    hex: "#10b981",
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bgSoft: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    ring: "focus:ring-emerald-500/30 focus:border-emerald-500/60",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    bar: "bg-emerald-500",
  },
  default: {
    name: "Ocean Blue",
    hex: "#3b82f6",
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    bgSoft: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    ring: "focus:ring-blue-500/30 focus:border-blue-500/60",
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    bar: "bg-blue-500",
  },
  violet: {
    name: "Royal Purple",
    hex: "#7c3aed",
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
    bgSoft: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-500/20",
    dot: "bg-violet-500",
    ring: "focus:ring-violet-500/30 focus:border-violet-500/60",
    badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25",
    bar: "bg-violet-500",
  },
  amber: {
    name: "Sunset Orange",
    hex: "#f59e0b",
    primary: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    bgSoft: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    ring: "focus:ring-amber-500/30 focus:border-amber-500/60",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    bar: "bg-amber-500",
  },
  rose: {
    name: "Hot Pink",
    hex: "#f43f5e",
    primary: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    bgSoft: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-500/20",
    dot: "bg-rose-500",
    ring: "focus:ring-rose-500/30 focus:border-rose-500/60",
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
    bar: "bg-rose-500",
  },
  cyan: {
    name: "Electric Cyan",
    hex: "#06b6d4",
    primary: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/30",
    text: "text-cyan-600 dark:text-cyan-400",
    bgSoft: "bg-cyan-50 dark:bg-cyan-500/10",
    border: "border-cyan-500/20",
    dot: "bg-cyan-500",
    ring: "focus:ring-cyan-500/30 focus:border-cyan-500/60",
    badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
    bar: "bg-cyan-500",
  },
  indigo: {
    name: "Deep Indigo",
    hex: "#4f46e5",
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30",
    text: "text-indigo-600 dark:text-indigo-400",
    bgSoft: "bg-indigo-50 dark:bg-indigo-500/10",
    border: "border-indigo-500/20",
    dot: "bg-indigo-500",
    ring: "focus:ring-indigo-500/30 focus:border-indigo-500/60",
    badge: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    bar: "bg-indigo-500",
  },
  teal: {
    name: "Deep Teal",
    hex: "#0d9488",
    primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/30",
    text: "text-teal-600 dark:text-teal-400",
    bgSoft: "bg-teal-50 dark:bg-teal-500/10",
    border: "border-teal-500/20",
    dot: "bg-teal-500",
    ring: "focus:ring-teal-500/30 focus:border-teal-500/60",
    badge: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25",
    bar: "bg-teal-500",
  },
  lime: {
    name: "Neon Lime",
    hex: "#84cc16",
    primary: "bg-lime-600 hover:bg-lime-700 text-white shadow-lime-500/30",
    text: "text-lime-600 dark:text-lime-400",
    bgSoft: "bg-lime-50 dark:bg-lime-500/10",
    border: "border-lime-500/20",
    dot: "bg-lime-500",
    ring: "focus:ring-lime-500/30 focus:border-lime-500/60",
    badge: "bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/25",
    bar: "bg-lime-500",
  },
  fuchsia: {
    name: "Fuchsia Glow",
    hex: "#d946ef",
    primary: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-fuchsia-500/30",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bgSoft: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
    dot: "bg-fuchsia-500",
    ring: "focus:ring-fuchsia-500/30 focus:border-fuchsia-500/60",
    badge: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/25",
    bar: "bg-fuchsia-500",
  },
};

const THEME_COLOR_LIST = [
  { id: "emerald", hex: "#10b981", name: "Emerald" },
  { id: "default", hex: "#3b82f6", name: "Blue" },
  { id: "violet", hex: "#7c3aed", name: "Purple" },
  { id: "amber", hex: "#f59e0b", name: "Orange" },
  { id: "rose", hex: "#f43f5e", name: "Pink" },
  { id: "cyan", hex: "#06b6d4", name: "Cyan" },
  { id: "indigo", hex: "#4f46e5", name: "Indigo" },
  { id: "teal", hex: "#0d9488", name: "Teal" },
];



// Initials helper
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const TeamActiveDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { accentColor = "emerald", setAccentColor } = useTheme();
  const activeStyle = ACCENT_STYLES[accentColor] || ACCENT_STYLES.emerald;

  const [searchQuery, setSearchQuery] = useState("");

  // Settings State (persisted in localStorage)
  const [showSettings, setShowSettings] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(() => {
    return localStorage.getItem("team_active_online_only") === "true";
  });
  const [groupByDept, setGroupByDept] = useState(() => {
    return localStorage.getItem("team_active_group_by_dept") !== "false";
  });

  const { socket } = useSocketContext() || {};

  const deptLower = (currentUser?.department || "").toLowerCase();
  const isHr =
    deptLower.includes("hr") ||
    deptLower.includes("human resource") ||
    currentUser?.department === "HR";
  const hasUsersPerm = Boolean(currentUser?.permissions?.manage_users);

  const isAuthorized =
    currentUser?.role === "admin" ||
    currentUser?.role === "operationmanager" ||
    isHr ||
    hasUsersPerm;

  // Fetch team activity
  const { data, isLoading, isFetching, refetch } = useGetTeamActivityQuery(undefined, {
    skip: !isOpen || !isAuthorized,
    refetchOnMountOrArgChange: true,
  });

  // Toggle handlers
  const handleToggleOnlineOnly = () => {
    const nextVal = !showOnlineOnly;
    setShowOnlineOnly(nextVal);
    localStorage.setItem("team_active_online_only", String(nextVal));
  };

  const handleToggleGroupByDept = () => {
    const nextVal = !groupByDept;
    setGroupByDept(nextVal);
    localStorage.setItem("team_active_group_by_dept", String(nextVal));
  };

  // Socket updates
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleUpdate = () => {
      refetch();
    };

    socket.on("user:presence", handleUpdate);
    socket.on("online_users_list", handleUpdate);
    socket.on("team:activity:update", handleUpdate);

    return () => {
      socket.off("user:presence", handleUpdate);
      socket.off("online_users_list", handleUpdate);
      socket.off("team:activity:update", handleUpdate);
    };
  }, [socket, isOpen, refetch]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showSettings) setShowSettings(false);
        else onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showSettings, onClose]);

  const categories = data?.categories || [];
  const summary = data?.summary || { totalUsers: 0, onlineCount: 0, offlineCount: 0 };

  // Filtered categories and users
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return categories
      .map((cat) => {
        const filteredUsers = (cat.users || []).filter((u) => {
          const empStatus = (u.employmentStatus || "").toLowerCase();
          const accStatus = (u.accountStatus || "").toLowerCase();
          if (empStatus === "relieved" || accStatus === "inactive") return false;
          if (showOnlineOnly && !u.isOnline) return false;
          if (!q) return true;
          return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department && u.department.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
          );
        });

        if (filteredUsers.length === 0 && (q || showOnlineOnly)) {
          return null;
        }

        return {
          ...cat,
          filteredUsers,
        };
      })
      .filter(Boolean);
  }, [categories, searchQuery, showOnlineOnly]);

  // Flat list fallback if groupByDept is toggled off
  const flatUsersList = useMemo(() => {
    const list = [];
    filteredCategories.forEach((cat) => {
      if (cat.filteredUsers) {
        list.push(...cat.filteredUsers);
      }
    });
    return list;
  }, [filteredCategories]);


  const handleOpenChat = (targetUserId) => {
    onClose();
    const role = currentUser?.role || "admin";
    navigate(`/${role}/chat?id=${targetUserId}`);
  };

  if (typeof document === "undefined" || !isAuthorized) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="
              relative w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl
              bg-white dark:bg-[#11131a] text-slate-800 dark:text-slate-100
              border-l border-slate-200/80 dark:border-white/10
            "
          >
            {/* 1. TOP HEADER (Uses active accent color) */}
            <div className="p-4 sm:p-5 pb-3 shrink-0 relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Themed Squircle Icon */}
                  <div
                    className={`w-10 h-10 rounded-2xl ${activeStyle.bgSoft} ${activeStyle.text} ${activeStyle.border} flex items-center justify-center shrink-0 border`}
                  >
                    <FiUsers size={20} />
                  </div>

                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      Our Kerplunk Team
                    </h2>
                    <p className={`text-xs font-bold mt-0.5 ${activeStyle.text}`}>
                      {summary.totalUsers} members · {summary.onlineCount} online
                    </p>
                  </div>
                </div>

                {/* Right Header Buttons: Settings, Refresh, Close */}
                <div className="flex items-center gap-1">
                  {/* Settings Button */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      showSettings
                        ? `${activeStyle.bgSoft} ${activeStyle.text}`
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    }`}
                    title="Team Active Settings"
                  >
                    <FiSettings size={18} className={showSettings ? "animate-spin" : ""} />
                  </button>

                  <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    title="Refresh data"
                  >
                    <FiRefreshCw size={15} className={isFetching ? "animate-spin text-emerald-500" : ""} />
                  </button>

                  <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* SETTINGS PANEL OVERLAY (Shows when Settings icon is clicked) */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="
                      absolute left-4 right-4 top-16 z-30
                      p-4 rounded-2xl bg-white dark:bg-[#181b26]
                      border border-slate-200 dark:border-white/10
                      shadow-2xl space-y-3.5 backdrop-blur-xl
                    "
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <FiSliders size={14} className={activeStyle.text} />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                          Team Active Settings
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <FiX size={15} />
                      </button>
                    </div>

                    {/* Toggle: Only Online Users */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Show Online Members Only
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Hide inactive / offline team members
                        </p>
                      </div>
                      <button
                        onClick={handleToggleOnlineOnly}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          showOnlineOnly ? activeStyle.primary : "bg-slate-200 dark:bg-white/10"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            showOnlineOnly ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>



                    {/* Toggle: Group by Department */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Group by Department Hierarchy
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Admin ➔ Ops ➔ Social ➔ Graphic ➔ Cinema
                        </p>
                      </div>
                      <button
                        onClick={handleToggleGroupByDept}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          groupByDept ? activeStyle.primary : "bg-slate-200 dark:bg-white/10"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            groupByDept ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Active Accent Color Switcher */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Theme Active Color
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {THEME_COLOR_LIST.map((c) => {
                          const isCurrent = accentColor === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setAccentColor(c.id)}
                              title={c.name}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                                isCurrent ? "scale-115 ring-2 ring-offset-2 ring-current" : "hover:scale-110"
                              }`}
                              style={{ backgroundColor: c.hex, color: c.hex }}
                            >
                              {isCurrent && <FiCheck className="text-white text-[10px]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 2. SEARCH BAR & ONLINE FILTER */}
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`
                      w-full pl-4 pr-9 py-2.5 text-sm rounded-xl
                      bg-slate-100/90 dark:bg-white/5 border border-transparent
                      text-slate-900 dark:text-white placeholder:text-slate-400
                      focus:outline-hidden focus:bg-white dark:focus:bg-[#1a1d28]
                      ${activeStyle.ring}
                      transition-all
                    `}
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <FiX size={15} />
                    </button>
                  ) : (
                    <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  )}
                </div>

                {showOnlineOnly && (
                  <span className={`text-[10px] font-bold px-2.5 py-2 rounded-xl ${activeStyle.badge} shrink-0`}>
                    Online Only
                  </span>
                )}
              </div>
            </div>

            {/* 4. MEMBER LIST */}
            <div className="flex-1 overflow-y-auto px-1 divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
              {isLoading && (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <div className={`w-8 h-8 border-2 ${activeStyle.border} border-t-current rounded-full animate-spin ${activeStyle.text}`} />
                  <p className="text-xs font-semibold text-slate-400">Loading members...</p>
                </div>
              )}

              {!isLoading && filteredCategories.length === 0 && (
                <div className="py-16 text-center space-y-1.5 px-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 mx-auto flex items-center justify-center text-slate-400">
                    <FiUsers size={20} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No members found
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {searchQuery ? `No matches for "${searchQuery}"` : "No active team members found."}
                  </p>
                </div>
              )}

              {!isLoading &&
                (groupByDept ? (
                  filteredCategories.map((category) => {
                    const users = category.filteredUsers || [];

                    return (
                      <div key={category.id} className="pt-2 pb-1">
                        {/* Department Section Header */}
                        <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <span>{category.label}</span>
                          <span className={category.onlineCount > 0 ? activeStyle.text : ""}>
                            {category.onlineCount}/{category.totalCount} Online
                          </span>
                        </div>

                        {/* User Items */}
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {users.map((user) => renderUserRow(user))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {flatUsersList.map((user) => renderUserRow(user))}
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );

  function renderUserRow(user) {
    const isCurrent =
      (currentUser?._id && currentUser._id.toString() === user._id.toString()) ||
      (currentUser?.id && currentUser.id.toString() === user._id.toString());

    return (
      <div
        key={user._id}
        className="
          px-4 py-3 flex items-center justify-between gap-3
          hover:bg-slate-50/80 dark:hover:bg-white/[0.03]
          transition-colors
        "
      >
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar with status indicator dot */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>{getInitials(user.name)}</span>
              )}
            </div>

            {/* Bottom-right Status Dot with white border using active color */}
            <span
              className={`
                absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#11131a]
                ${user.isOnline ? activeStyle.dot : "bg-slate-400"}
              `}
            />
          </div>

          {/* Text Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </h4>
              {isCurrent && (
                <span className={`text-xs font-bold ${activeStyle.text}`}>
                  (You)
                </span>
              )}
            </div>

            {/* Role & Department */}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {user.role === "admin"
                ? "Admin"
                : `${user.role === "operationmanager" ? "Operation Manager" : "Team"} • ${
                    user.department || "Member"
                  }`}
            </p>

            {/* Online / Offline Status */}
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  user.isOnline ? `${activeStyle.dot} animate-pulse` : "bg-slate-400"
                }`}
              />
              <span
                className={`font-semibold ${
                  user.isOnline ? activeStyle.text : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {user.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Direct Chat Button */}
        {!isCurrent && (
          <button
            onClick={() => handleOpenChat(user._id)}
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all duration-200 cursor-pointer shrink-0 group/chat"
            title={`Message ${user.name}`}
          >
            <FiMessageSquare size={16} className="transition-transform group-hover/chat:scale-110" />
          </button>
        )}
      </div>
    );
  }
};

export default TeamActiveDrawer;
