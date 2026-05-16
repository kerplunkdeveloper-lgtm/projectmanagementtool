import React, { useEffect, useState, useRef } from "react";

import { useSelector, useDispatch } from "react-redux";

import { logoutUser } from "../../features/auth/authSlice";

import {
  getProfile,
  clearProfile,
} from "../../features/profile/profileSlice";

import { useNavigate } from "react-router-dom";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
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

  const dropdownRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(false);

  // AUTH
  const { user } = useSelector((state) => state.auth);

  // NOTIFICATIONS
  const { notifications } = useSelector((state) => state.notifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationRef = useRef(null);

  // PROFILE
  const { profile } = useSelector((state) => state.profile);

  // GET PROFILE & NOTIFICATIONS
  useEffect(() => {
    if (user) {
      if (!profile) dispatch(getProfile());
      dispatch(getNotifications());
    }
  }, [dispatch, user]);

  // OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setOpenNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // LOGOUT
  const handleLogout = async () => {
    await dispatch(logoutUser());

    dispatch(clearProfile());

    toast.success("Logout Success");

    navigate("/");
  };

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
    setOpenNotifications(false);
  };

  return (
    <motion.div
      initial={{
        y: -30,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      className="
        sticky
        top-0
        z-50

        h-20

        px-4
        md:px-8

        flex
        items-center
        justify-between

        bg-white/90
        backdrop-blur-2xl

        border-b
        border-blue-100

        shadow-[0_8px_30px_rgb(0,0,0,0.06)]
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* MOBILE MENU */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            lg:hidden

            w-11
            h-11

            rounded-2xl

            border
            border-blue-100

            bg-gradient-to-br
            from-blue-50
            to-cyan-50

            text-blue-600

            flex
            items-center
            justify-center

            shadow-md

            hover:scale-105
            hover:shadow-xl

            transition-all
            duration-300
          "
        >
          <HiOutlineMenuAlt3 className="text-2xl" />
        </button>

        {/* LOGO */}
        <div>
          <h1
            className="
              text-xl
              md:text-2xl

              font-extrabold

              bg-gradient-to-r
              from-blue-600
              via-cyan-500
              to-sky-500

              bg-clip-text
              text-transparent
            "
          >
            ProjectFlow
          </h1>

          <p className="text-xs text-gray-400 font-medium">
            Manage everything smarter
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* SEARCH */}
        <div
          className="
            hidden
            md:flex

            items-center
            gap-3

            h-12
            px-4

            rounded-2xl

            border
            border-blue-100

            bg-gradient-to-r
            from-white
            to-blue-50/40

            shadow-sm

            focus-within:border-cyan-300
            focus-within:shadow-lg

            transition-all
          "
        >
          <FiSearch className="text-blue-400 text-lg" />

          <input
            type="text"
            placeholder="Search projects..."
            className="
              bg-transparent
              outline-none

              text-gray-700

              placeholder:text-gray-400

              w-40
            "
          />
        </div>

        {/* NOTIFICATION */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className="
              relative

              w-11
              h-11

              rounded-2xl

              border
              border-blue-100

              bg-white

              text-blue-600

              flex
              items-center
              justify-center

              shadow-sm

              hover:scale-105
              hover:shadow-xl
              hover:bg-blue-50

              transition-all
              duration-300
            "
          >
            <FiBell className="text-lg" />

            {/* DOT / COUNT */}
            {unreadCount > 0 && (
              <span
                className="
                  absolute
                  -top-1
                  -right-1

                  min-w-[20px]
                  h-5
                  px-1

                  rounded-full

                  bg-rose-500
                  text-white
                  text-[10px]
                  font-black

                  flex
                  items-center
                  justify-center
                  border-2
                  border-white
                  shadow-lg
                  animate-pulse
                "
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}
          <AnimatePresence>
            {openNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[2rem] border border-blue-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden z-50"
              >
                <div className="p-6 bg-slate-50/50 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800">Intelligence</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      Sweep All
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-slate-400 font-bold italic">No tactical signals detected.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n._id}
                        onClick={() => handleMarkAsRead(n._id)}
                        className={`p-5 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50/50 ${!n.isRead ? 'bg-blue-50/20' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            !n.isRead 
                              ? n.type === 'project_assigned' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                : 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {n.type === 'project_assigned' ? <FiBriefcase size={18} /> : <FiCheckSquare size={18} />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${!n.isRead ? 'font-black text-slate-800' : 'font-medium text-slate-500'}`}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.isRead && (
                            <div className={`w-2 h-2 rounded-full mt-2 ${n.type === 'project_assigned' ? 'bg-indigo-600' : 'bg-blue-600'}`}></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-slate-50/50 text-center border-t border-gray-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End of Transmission</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* USER */}
        <div className="relative" ref={dropdownRef}>
          {/* BUTTON */}
          <button
            onClick={() =>
              setOpenDropdown(!openDropdown)
            }
            className="
              hidden
              sm:flex

              items-center
              gap-3

              px-3
              py-2

              rounded-2xl

              border
              border-blue-100

              bg-white

              shadow-sm

              hover:shadow-xl
              hover:scale-[1.02]

              transition-all
              duration-300
            "
          >
            {/* IMAGE */}
            {profile?.profileImage?.url ? (
              <img
                src={profile.profileImage.url}
                alt="profile"
                className="
                  w-11
                  h-11

                  rounded-full
                  object-cover

                  border-2
                  border-cyan-300
                "
              />
            ) : (
              <div
                className="
                  w-11
                  h-11

                  rounded-full

                  bg-gradient-to-br
                  from-blue-500
                  to-cyan-500

                  text-white

                  flex
                  items-center
                  justify-center
                "
              >
                <FiUser size={18} />
              </div>
            )}

            {/* INFO */}
            <div className="text-left hidden md:block">
              <h3 className="font-semibold text-gray-800 text-sm">
                {user?.name}
              </h3>

              <p className="text-xs text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>

            {/* ICON */}
            <FiChevronDown
              className={`
                text-gray-500
                transition-transform
                duration-300

                ${
                  openDropdown
                    ? "rotate-180"
                    : ""
                }
              `}
            />
          </button>

          {/* DROPDOWN */}
          <AnimatePresence>
            {openDropdown && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 15,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="
                  absolute
                  right-0
                  top-16

                  w-64

                  overflow-hidden

                  rounded-3xl

                  bg-white/95
                  backdrop-blur-xl

                  border
                  border-blue-100

                  shadow-[0_20px_60px_rgb(0,0,0,0.12)]

                  p-2

                  z-50
                "
              >
                {/* PROFILE */}
                <button
                  onClick={() => {
                    navigate(
                      `/${user?.role}/profile`
                    );

                    setOpenDropdown(false);
                  }}
                  className="
                    w-full

                    px-4
                    py-4

                    rounded-2xl

                    flex
                    items-center
                    gap-3

                    text-gray-700

                    hover:bg-blue-50

                    transition-all
                  "
                >
                  <FiUser className="text-blue-500" />

                  Edit Profile
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="
                    w-full

                    px-4
                    py-4

                    rounded-2xl

                    flex
                    items-center
                    gap-3

                    text-red-500

                    hover:bg-red-50

                    transition-all
                  "
                >
                  <FiLogOut />

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