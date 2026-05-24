import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import { getProfile, clearProfile } from "../../features/profile/profileSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../features/notifications/notificationSlice";
import toast from "react-hot-toast";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import {
  FiBell,
  FiSearch,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiCheckSquare,
  FiBriefcase,
  FiCheck,
  FiInfo,
  FiTrash2,
  FiSun,
  FiMoon,
  FiMonitor,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const themeRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openThemeMenu, setOpenThemeMenu] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const { notifications } = useSelector((state) => state.notifications);
  const { theme, setTheme } = useTheme();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationDetails = (type) => {
    switch (type) {
      case "project_assigned":
        return {
          icon: FiBriefcase,
          bgColor: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30",
        };
      case "task_assigned":
        return {
          icon: FiCheckSquare,
          bgColor: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30",
        };
      case "task_completed":
        return {
          icon: FiCheck,
          bgColor: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30",
        };
      case "task_updated":
        return {
          icon: FiInfo,
          bgColor: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30",
        };
      default:
        return {
          icon: FiBell,
          bgColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-slate-800/30",
        };
    }
  };

  const getPageTitle = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("clients")) return "Clients";
    if (path.includes("projects")) return "Projects";
    if (path.includes("tasks")) return "Tasks";
    if (path.includes("partnerhub")) return "PartnerHub";
    if (path.includes("profile")) return "Profile";
    if (path.includes("team")) return "Team";
    if (path.includes("users")) return "Users";
    if (path.includes("template")) return "Template";
    if (path.includes("report") || path.includes("eod")) return "EOD";
    if (path.includes("calendar") || path.includes("calendor")) return "Calendar";
    return "Dashboard";
  };

  const pageTitle = getPageTitle();

  useEffect(() => {
    if (user) {
      const profileUserId = profile?.user?._id || profile?.user;
      if (!profile || profileUserId !== (user.id || user._id)) {
        dispatch(getProfile());
      }
      dispatch(getNotifications());
    }
  }, [dispatch, user, profile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setOpenThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(clearProfile());
    toast.success("Logout Success");
    navigate("/");
  };

  const getThemeIcon = () => {
    if (theme === "light") return <FiSun size={14} className="text-amber-500" />;
    if (theme === "dark") return <FiMoon size={14} className="text-indigo-400" />;
    return <FiMonitor size={14} className="text-slate-400 dark:text-slate-350" />;
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        sticky top-0 z-50
        h-[56px] lg:h-[60px]
        px-3 md:px-5
        flex items-center justify-between
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl
        
        shadow-sm transition-all duration-300
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-2.5">
        {/* MOBILE MENU */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            lg:hidden w-8 h-8
            rounded-lg border border-gray-200 dark:border-transparent bg-gray-50 dark:bg-slate-800
            text-gray-600 dark:text-slate-300
            flex items-center justify-center
            hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer
          "
        >
          <HiOutlineMenuAlt3 className="text-lg" />
        </button>

        {/* PAGE TITLE */}
        <h1 className="text-[15px] sm:text-[17px] lg:text-[18px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          {pageTitle}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {/* SEARCH */}
        <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-transparent bg-gray-50 ">
          <FiSearch className="text-gray-400 dark:text-slate-500 text-xs" />
          <input
            type="text"
            placeholder="Search..."
            className="
              bg-transparent outline-none p-1 rounded-lg px-2
              text-xs text-gray-700 dark:text-slate-200
              placeholder:text-gray-400 dark:placeholder:text-slate-500
              w-[110px] lg:w-[140px]
            "
          />
        </div>

        {/* PREMIUM LIGHT/DARK/SYSTEM THEME DROPDOWN */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setOpenThemeMenu(!openThemeMenu)}
            className={`
              w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer
              ${openThemeMenu
                ? "bg-blue-50/50 dark:bg-slate-800 border-blue-200 dark:border-transparent"
                : "border-gray-200 dark:border-transparent bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 "
              }
            `}
            title="Switch Theme"
          >
            {getThemeIcon()}  
          </button>

          <AnimatePresence>
            {openThemeMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="
                  absolute right-0 mt-2 w-36 rounded-xl
                  bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800
                  shadow-xl p-1.5 z-50 flex flex-col gap-0.5
                "
              >
                <button
                  onClick={() => {
                    setTheme("light");
                    setOpenThemeMenu(false);
                  }}
                  className={`
                    w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all cursor-pointer
                    ${theme === "light"
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <FiSun size={13} className="text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  onClick={() => {
                    setTheme("dark");
                    setOpenThemeMenu(false);
                  }}
                  className={`
                    w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all cursor-pointer
                    ${theme === "dark"
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <FiMoon size={13} className="text-indigo-400" />
                  <span>Dark</span>
                </button>

                <button
                  onClick={() => {
                    setTheme("system");
                    setOpenThemeMenu(false);
                  }}
                  className={`
                    w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all cursor-pointer
                    ${theme === "system"
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <FiMonitor size={13} className="text-slate-400" />
                  <span>System</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className={`
              relative w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer
              ${openNotifications
                ? "bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-transparent text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/10"
                : "border-gray-200 dark:border-transparent bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-100"
              }
            `}
          >
            <FiBell className="text-[15px]" />
            {unreadCount > 0 && (
              <>
                <span className="
                  absolute -top-1.5 -right-1.5
                  min-w-[17px] h-[17px] px-1
                  rounded-full bg-rose-500
                  text-white text-[8px] font-black
                  flex items-center justify-center
                  border-2 border-white  shadow-sm z-10
                ">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
                <span className="absolute -top-1.5 -right-1.5 w-[17px] h-[17px] rounded-full bg-rose-500 animate-ping opacity-60 border-2 border-white dark:border-slate-900" />
              </>
            )}
          </button>

          {/* DROPDOWN MENU */}
          <AnimatePresence>
            {openNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="
                  fixed top-[62px] left-4 right-4
                  md:absolute md:top-auto md:left-auto md:right-0 md:mt-2
                  md:w-[340px] md:max-w-none
                  bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800
                  shadow-2xl z-50 overflow-hidden
                "
              >
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-400 to indido-500  border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100 uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        dispatch(markAllAsRead());
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 font-bold transition-colors cursor-pointer hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800 scrollbar-thin">
                  {(notifications || []).length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                      <FiBell className="text-2xl mb-2 opacity-30 text-slate-400" />
                      <span className="text-[11px] font-bold">No notifications yet</span>
                      <p className="text-[9px] text-slate-400 mt-0.5 px-6">You will be notified here when tasks are assigned or updated.</p>
                    </div>
                  ) : (
                    (notifications || []).map((n) => {
                      const details = getNotificationDetails(n.type);
                      const Icon = details.icon;
                      return (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.isRead) {
                              dispatch(markAsRead(n._id));
                            }
                            setOpenNotifications(false);
                            if (n.project && user?.role !== "team") {
                              navigate(`/${user?.role}/projects?id=${n.project}`);
                            } else {
                              navigate(`/${user?.role}/tasks`);
                            }
                          }}
                          className={`
                            px-4 py-3 text-left transition-all cursor-pointer flex items-start gap-3 relative group
                            ${!n.isRead 
                              ? "bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20" 
                              : "bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                            }
                          `}
                        >
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${details.bgColor}`}>
                            <Icon size={13} />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className={`text-[11px] leading-relaxed break-words ${!n.isRead ? "text-slate-800 dark:text-slate-100 font-extrabold" : "text-slate-500 dark:text-slate-400 font-medium"}`}>
                              {n.message}
                            </p>
                            <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
                              {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 absolute right-3 top-1/2 -translate-y-1/2">
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-500/50" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(deleteNotification(n._id));
                                toast.success("Notification deleted");
                              }}
                              className="
                                p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150
                                opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 cursor-pointer
                              "
                              title="Delete Notification"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-blue-400 to indido-500  border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setOpenNotifications(false);
                      navigate(`/${user?.role}/notifications`);
                    }}
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 font-bold tracking-wide uppercase transition-colors cursor-pointer"
                  >
                    View All History
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="
              flex items-center gap-1.5
              px-1.5 py-1
              rounded-lg border border-gray-200 dark:border-transparent bg-white dark:bg-slate-900
              hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer
            "
          >
            {profile?.profileImage?.url ? (
              <img
                src={profile.profileImage.url}
                alt="profile"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center">
                <FiUser size={13} />
              </div>
            )}

            <div className="text-left hidden sm:block">
              <h3 className="text-[12px] font-semibold text-gray-800 dark:text-slate-200 leading-tight">{user?.name}</h3>
              <p className="text-[10px] text-gray-400 capitalize leading-tight">{user?.role}</p>
            </div>

            <FiChevronDown
              className={`text-gray-550 dark:text-slate-400 text-xs transition-transform ${openDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* DROPDOWN */}
          <AnimatePresence>
            {openDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="
                  absolute right-0 top-10
                  w-52 rounded-xl
                  bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800
                  shadow-lg p-1.5 z-50
                "
              >


                <button
                  onClick={() => {
                    navigate(`/${user?.role}/profile`);
                    setOpenDropdown(false);
                  }}
                  className="
                    w-full px-3 py-2 rounded-lg
                    flex items-center gap-2
                    text-xs text-gray-700 dark:text-slate-200
                    hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer
                  "
                >
                  <FiUser className="text-blue-500" size={13} />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-3 py-2 rounded-lg
                    flex items-center gap-2
                    text-xs text-red-500
                    hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer
                  "
                >
                  <FiLogOut size={13} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;