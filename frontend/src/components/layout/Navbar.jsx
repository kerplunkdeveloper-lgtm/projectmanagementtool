import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import { getProfile, clearProfile } from "../../features/profile/profileSlice";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
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
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const { notifications } = useSelector((state) => state.notifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationDetails = (type) => {
    switch (type) {
      case "project_assigned":
        return {
          icon: FiBriefcase,
          bgColor: "bg-amber-50 text-amber-600 border border-amber-100/50",
        };
      case "task_assigned":
        return {
          icon: FiCheckSquare,
          bgColor: "bg-blue-50 text-blue-600 border border-blue-100/50",
        };
      case "task_completed":
        return {
          icon: FiCheck,
          bgColor: "bg-emerald-50 text-emerald-600 border border-emerald-100/50",
        };
      case "task_updated":
        return {
          icon: FiInfo,
          bgColor: "bg-purple-50 text-purple-600 border border-purple-100/50",
        };
      default:
        return {
          icon: FiBell,
          bgColor: "bg-slate-50 text-slate-600 border border-slate-100/50",
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

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        sticky top-0 z-50
        h-[56px] lg:h-[60px]
        px-3 md:px-5
        flex items-center justify-between
        bg-white backdrop-blur-3xl
        border-b border-gray-200
        shadow-sm
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-2.5">
        {/* MOBILE MENU */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            lg:hidden w-8 h-8
            rounded-lg border border-gray-200 bg-gray-50
            text-gray-600
            flex items-center justify-center
            hover:bg-gray-100 transition-all
          "
        >
          <HiOutlineMenuAlt3 className="text-lg" />
        </button>

        {/* PAGE TITLE */}
        <h1 className="text-[15px] sm:text-[17px] lg:text-[18px] font-bold text-gray-800">
          {pageTitle}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {/* SEARCH */}
        <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 bg-gray-50">
          <FiSearch className="text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Search..."
            className="
              bg-transparent outline-none
              text-xs text-gray-700
              placeholder:text-gray-400
              w-[110px] lg:w-[140px]
            "
          />
        </div>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className={`
              relative w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200
              ${openNotifications
                ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-500/10"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
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
                  border-2 border-white shadow-sm z-10
                ">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
                <span className="absolute -top-1.5 -right-1.5 w-[17px] h-[17px] rounded-full bg-rose-500 animate-ping opacity-60 border-2 border-white" />
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
                  absolute right-0 mt-2
                  w-[340px] max-w-[calc(100vw-32px)]
                  bg-white rounded-2xl border border-slate-100
                  shadow-xl z-50 overflow-hidden
                "
              >
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        dispatch(markAllAsRead());
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60 scrollbar-thin">
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
                            px-4 py-3 text-left transition-all cursor-pointer flex items-start gap-3 relative
                            ${!n.isRead ? "bg-blue-50/20 hover:bg-blue-50/40" : "bg-white hover:bg-slate-50/60"}
                          `}
                        >
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${details.bgColor}`}>
                            <Icon size={13} />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <p className={`text-[11px] leading-relaxed break-words ${!n.isRead ? "text-slate-800 font-extrabold" : "text-slate-500 font-medium"}`}>
                              {n.message}
                            </p>
                            <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
                              {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {!n.isRead && (
                            <span className="absolute top-1/2 -translate-y-1/2 right-3 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-500/50" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setOpenNotifications(false);
                      navigate(`/${user?.role}/notifications`);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-700 font-bold tracking-wide uppercase transition-colors"
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
              rounded-lg border border-gray-200 bg-white
              hover:bg-gray-50 transition-all
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

            <div className="text-left">
              <h3 className="text-[12px] font-semibold text-gray-800 leading-tight">{user?.name}</h3>
              <p className="text-[10px] text-gray-400 capitalize leading-tight">{user?.role}</p>
            </div>

            <FiChevronDown
              className={`text-gray-500 text-xs transition-transform ${openDropdown ? "rotate-180" : ""}`}
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
                  w-48 rounded-xl
                  bg-white border border-gray-200
                  shadow-lg p-1 z-50
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
                    text-xs text-gray-700
                    hover:bg-gray-50 transition-all
                  "
                >
                  <FiUser className="text-blue-500" size={13} />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-3 py-2 rounded-lg
                    flex items-center gap-2
                    text-xs text-red-500
                    hover:bg-red-50 transition-all
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