import React, { useEffect, useState, useRef } from "react";

import { useSelector, useDispatch } from "react-redux";

import { logoutUser } from "../../features/auth/authSlice";

import {
  getProfile,
  clearProfile,
} from "../../features/profile/profileSlice";

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

  const [openNotifications, setOpenNotifications] =
    useState(false);

  // AUTH
  const { user } = useSelector((state) => state.auth);

  // PROFILE
  const { profile } = useSelector((state) => state.profile);

  // NOTIFICATIONS
  const { notifications } = useSelector(
    (state) => state.notifications
  );

  const unreadCount = notifications.filter(
    (n) => !n.isRead
  ).length;

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
    if (path.includes("report") || path.includes("eod"))
      return "EOD";
    if (
      path.includes("calendar") ||
      path.includes("calendor")
    )
      return "Calendar";

    return "Dashboard";
  };

  const pageTitle = getPageTitle();

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

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

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

        {/* TITLE */}
        <div>
          <h1
            className="
              text-lg
              sm:text-xl
              md:text-2xl

              font-extrabold

              text-blue-800
            "
          >
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4">
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

        {/* NOTIFICATIONS */}
        <div
          className="relative"
          ref={notificationRef}
        >
          <button
            onClick={() =>
              setOpenNotifications(
                !openNotifications
              )
            }
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

                  animate-pulse
                "
              >
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}
          <AnimatePresence>
            {openNotifications && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 15,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 15,
                  scale: 0.95,
                }}
                className="
                  absolute
                  right-0
                  mt-4

                  w-[320px]
                  sm:w-96

                  bg-white

                  rounded-[2rem]

                  border
                  border-blue-100

                  shadow-[0_20px_60px_rgba(0,0,0,0.15)]

                  overflow-hidden

                  z-50
                "
              >
                <div className="p-6 bg-slate-50/50 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800">
                    Notifications
                  </h3>

                  {unreadCount > 0 && (
                    <button
                      onClick={
                        handleMarkAllAsRead
                      }
                      className="
                        text-[10px]
                        font-black
                        text-blue-600
                        uppercase
                        tracking-widest
                      "
                    >
                      Mark All
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-slate-400 font-bold italic">
                        No Notifications
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() =>
                          handleMarkAsRead(n._id)
                        }
                        className={`
                          p-5
                          border-b
                          border-gray-50

                          cursor-pointer

                          hover:bg-blue-50/50

                          transition-all

                          ${
                            !n.isRead
                              ? "bg-blue-50/20"
                              : ""
                          }
                        `}
                      >
                        <div className="flex gap-4">
                          <div
                            className={`
                              w-10
                              h-10

                              rounded-xl

                              flex
                              items-center
                              justify-center

                              ${
                                !n.isRead
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }
                            `}
                          >
                            {n.type ===
                            "project_assigned" ? (
                              <FiBriefcase />
                            ) : (
                              <FiCheckSquare />
                            )}
                          </div>

                          <div className="flex-1">
                            <p
                              className={`
                                text-sm

                                ${
                                  !n.isRead
                                    ? "font-black text-slate-800"
                                    : "font-medium text-slate-500"
                                }
                              `}
                            >
                              {n.message}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1 font-bold">
                              {new Date(
                                n.createdAt
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* USER PROFILE */}
        <div
          className="relative"
          ref={dropdownRef}
        >
          <button
            onClick={() =>
              setOpenDropdown(!openDropdown)
            }
            className="
              flex
              items-center
              gap-2
              sm:gap-3

              px-2
              sm:px-3

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
            {/* PROFILE IMAGE */}
            {profile?.profileImage?.url ? (
              <img
                src={profile.profileImage.url}
                alt="profile"
                className="
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11

                  rounded-full
                  object-cover

                  border-2
                  border-cyan-300

                  shadow-lg
                "
              />
            ) : (
              <div
                className="
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11

                  rounded-full

                  bg-gradient-to-br
                  from-blue-500
                  to-cyan-500

                  text-white

                  flex
                  items-center
                  justify-center

                  shadow-lg
                "
              >
                <FiUser size={18} />
              </div>
            )}

            {/* INFO */}
            <div className="hidden md:block text-left">
              <h3 className="font-semibold text-gray-800 text-sm">
                {user?.name}
              </h3>

              <p className="text-xs text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>

            {/* DROPDOWN ICON */}
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
                className="
                  absolute
                  right-0
                  top-16

                  w-64

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