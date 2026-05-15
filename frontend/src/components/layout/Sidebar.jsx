import React from "react";
import logo from "../../assets/logo.avif";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  FiX,
   FiLogOut,
} from "react-icons/fi";

import {
  useSelector,
  useDispatch,
} from "react-redux";

import toast from "react-hot-toast";

import { sidebarConfig } from "../../config/sidebarConfig";


import {
  logoutUser,
} from "../../features/auth/authSlice";

const Sidebar = ({
  role,
  sidebarOpen,
  setSidebarOpen,
}) => {


  const dispatch = useDispatch();
  const navigate = useNavigate();
  const menuItems = sidebarConfig[role] || [];

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logout Success");
    navigate("/");
  };









  return (
    <>

      {/* MOBILE OVERLAY */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`
          fixed inset-0 z-40
          lg:hidden
          ${sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}
          transition-all duration-300
          bg-black/50 backdrop-blur-sm
        `}
      />

      {/* SIDEBAR */}
      <aside
       className={`
  fixed
  lg:fixed

  top-0
  left-0

  z-50

  w-72

  h-full

  bg-gradient-to-b
  from-[#0D1B2A]
  to-[#091118]

  border-r
  border-white/10

  flex
  flex-col

  transition-all
  duration-300

  ${
    sidebarOpen
      ? "translate-x-0"
      : "-translate-x-full lg:translate-x-0"
  }
`}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <img src={logo} alt="logo" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Project Hub</h2>
              <p className="text-gray-400 text-xs uppercase tracking-wider">{role}</p>
            </div>
          </div>

          {/* CLOSE BUTTON - MOBILE ONLY */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                end={
                  item.path === "/admin" ||
                  item.path === "/operationmanager" ||
                  item.path === "/team"
                }
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-white shadow-lg"
                      : "text-gray-300 hover:bg-white/5 border border-transparent"
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-semibold text-sm">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>


        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 font-semibold transition-all duration-200"
          >
            <FiLogOut size={18} />
            Logout
          </button>
        </div>

      </aside>

    </>
  );
};

export default Sidebar;