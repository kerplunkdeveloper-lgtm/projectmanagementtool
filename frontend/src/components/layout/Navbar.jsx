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
      if (!profile) dispatch(getProfile());
      dispatch(getNotifications());
    }
  }, [dispatch, user]);

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

  const handleMarkAsRead = (id) => dispatch(markAsRead(id));
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
    setOpenNotifications(false);
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
        bg-white/95 backdrop-blur-xl
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
            className="
              relative w-8 h-8
              rounded-lg border border-gray-200 bg-white
              text-gray-600
              flex items-center justify-center
              hover:bg-gray-50 transition-all
            "
          >
            <FiBell className="text-[15px]" />
            {unreadCount > 0 && (
              <span className="
                absolute -top-1 -right-1
                min-w-[16px] h-[16px] px-1
                rounded-full bg-red-500
                text-white text-[9px] font-bold
                flex items-center justify-center
              ">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}
          <AnimatePresence>
            {openNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="
                  absolute right-0 mt-2
                  w-[280px] sm:w-[310px]
                  bg-white rounded-xl
                  border border-gray-200 shadow-lg
                  overflow-hidden z-50
                "
              >
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      Mark all
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-xs text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleMarkAsRead(n._id)}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all ${!n.isRead ? "bg-blue-50/30" : ""}`}
                      >
                        <div className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            {n.type === "project_assigned" ? (
                              <FiBriefcase size={13} />
                            ) : (
                              <FiCheckSquare size={13} />
                            )}
                          </div>
                          <p className="text-[12px] text-gray-700 font-medium leading-snug">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
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

            <div className="hidden lg:block text-left">
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