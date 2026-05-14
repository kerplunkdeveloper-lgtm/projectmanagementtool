import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  HiOutlineMenuAlt3,
} from "react-icons/hi";

import {
  FiBell,
  FiSearch,
} from "react-icons/fi";

import { motion } from "framer-motion";

const Navbar = ({ setSidebarOpen }) => {

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user } = useSelector(
    (state) => state.auth
  );

  const handleLogout = () => {

    dispatch(logoutUser());

    navigate("/");

    toast.success("Logout Success");
  };

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        sticky top-0 z-40
        h-20
        px-4 md:px-8
        flex items-center justify-between
        border-b border-white/10
        bg-white/5
        backdrop-blur-2xl
      "
    >

      {/* LEFT */}
      <div className="flex items-center gap-4">

        <button
          onClick={() => setSidebarOpen(true)}
          className="
            lg:hidden
            w-11 h-11
            rounded-xl
            bg-white/10
            hover:bg-white/20
            flex items-center justify-center
            transition
          "
        >
          <HiOutlineMenuAlt3 className="text-2xl text-white" />
        </button>

        <div>

          <h1 className="text-white text-xl md:text-2xl font-bold">
            Project Management
          </h1>

          

        </div>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* SEARCH */}
        <div
          className="
            hidden md:flex
            items-center gap-3
            px-4 h-12
            rounded-2xl
            bg-white/10
            border border-white/10
          "
        >
          <FiSearch className="text-gray-300" />

          <input
            type="text"
            placeholder="Search..."
            className="
              bg-transparent
              outline-none
              text-white
              placeholder:text-gray-400
            "
          />
        </div>

        {/* BELL */}
        <button
          className="
            w-11 h-11
            rounded-2xl
            bg-white/10
            border border-white/10
            text-white
            flex items-center justify-center
            hover:scale-105
            transition
          "
        >
          <FiBell />
        </button>

        {/* USER */}
        <div
          className="
            hidden sm:flex
            items-center gap-3
            px-4 py-2
            rounded-2xl
            bg-white/10
            border border-white/10
          "
        >

          <div
            className="
              w-11 h-11
              rounded-full
              bg-gradient-to-r
              from-cyan-400
              to-blue-600
              flex items-center justify-center
              text-white font-bold
            "
          >
            {user?.name?.charAt(0)}
          </div>

          <div>

            <h3 className="text-white font-semibold">
              {user?.name}
            </h3>

            <p className="text-xs text-cyan-300 capitalize">
              {user?.role}
            </p>

          </div>

        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="
            px-5 h-11
            rounded-2xl
            bg-gradient-to-r
            from-cyan-500
            to-blue-600
            text-white
            font-semibold
            shadow-lg shadow-cyan-500/30
            hover:scale-105
            transition-all duration-300
          "
        >
          Logout
        </button>

      </div>

    </motion.div>
  );
};

export default Navbar;