import React, { useEffect, useState, useRef } from "react";

import { useSelector, useDispatch } from "react-redux";

import { logoutUser } from "../../features/auth/authSlice";

import {
  getProfile,
  clearProfile,
} from "../../features/profile/profileSlice";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { HiOutlineMenuAlt3 } from "react-icons/hi";

import {
  FiBell,
  FiSearch,
  FiUser,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";

import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(false);

  // AUTH
  const { user } = useSelector((state) => state.auth);

  // PROFILE
  const { profile } = useSelector((state) => state.profile);

  // GET PROFILE
  useEffect(() => {
    if (user && !profile) {
      dispatch(getProfile());
    }
  }, [dispatch, profile, user]);

  // OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdown(false);
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
        <button
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

          {/* DOT */}
          <span
            className="
              absolute
              top-2
              right-2

              w-2.5
              h-2.5

              rounded-full

              bg-red-500
              animate-pulse
            "
          />
        </button>

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