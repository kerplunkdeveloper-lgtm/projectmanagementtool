import React, { useEffect, useState, useRef } from "react";

import { useSelector, useDispatch } from "react-redux";

import { logoutUser } from "../../features/auth/authSlice";

import { getProfile, clearProfile } from "../../features/profile/profileSlice";

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

  // DROPDOWN
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

  // CLOSE DROPDOWN OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0D1B2A]/80 to-[#0A1529]/80 backdrop-blur-xl"
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* MENU BUTTON - MOBILE ONLY */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
        >
          <HiOutlineMenuAlt3 className="text-2xl" />
        </button>

        {/* TITLE */}
        <h1 className="text-white text-xl md:text-2xl font-bold">
          Project Management
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* SEARCH */}
        <div className="hidden md:flex items-center gap-3 px-4 h-12 rounded-lg bg-white/10 border border-white/10 focus-within:border-cyan-400/50 transition-all">
          <FiSearch className="text-gray-300" />
          <input
            type="text"
            placeholder="Search projects..."
            className="bg-transparent outline-none text-white placeholder:text-gray-400 w-32"
          />
        </div>

        {/* NOTIFICATION */}
        <button className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center hover:scale-105 transition-all">
          <FiBell />
        </button>

        {/* USER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          {/* USER BUTTON */}
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15 transition-all"
          >
            {/* IMAGE */}
            {profile?.profileImage?.url ? (
              <img
                src={profile.profileImage.url}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400/40 bg-[#111827] flex items-center justify-center text-gray-400 shadow-xl">
                <FiUser size={20} />
              </div>
            )}

            {/* INFO */}
            <div className="text-left hidden md:block">
              <h3 className="text-white font-semibold text-sm">{user?.name}</h3>
              <p className="text-xs text-cyan-300 capitalize">{user?.role}</p>
            </div>

            {/* ICON */}
            <FiChevronDown
              className={`text-white transition-transform ${openDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* DROPDOWN */}
          <AnimatePresence>
            {openDropdown && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                }}
                className="
                  absolute
                  right-0
                  top-16

                  w-56

                  overflow-hidden

                  rounded-2xl

                  bg-[#111827]

                  border
                  border-white/10

                  shadow-2xl

                  z-50
                "
              >
                {/* PROFILE */}
                <button
                  onClick={() => {
                    navigate(`/${user?.role}/profile`);

                    setOpenDropdown(false);
                  }}
                  className="
    w-full

    px-5
    py-4

    flex
    items-center
    gap-3

    text-white

    hover:bg-white/10

    transition-all
  "
                >
                  <FiUser />
                  Edit Profile
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="
                    w-full

                    px-5
                    py-4

                    flex
                    items-center
                    gap-3

                    text-red-400

                    hover:bg-red-500/10

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
