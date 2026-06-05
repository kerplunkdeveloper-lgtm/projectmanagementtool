import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useSocket from "../../hooks/useSocket.jsx";
import { exitImpersonation } from "../../features/auth/authSlice";

const DashboardLayout = ({ role }) => {
  useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname.endsWith("/chat") || location.pathname.includes("/chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, originalAdminUser } = useSelector((state) => state.auth);

  const handleSwitchBack = () => {
    dispatch(exitImpersonation());
    toast.success("Returned to Admin account");
    navigate("/admin");
  };

  return (
    <div className="h-screen overflow-hidden theme-bg-main">

      {/* SIDEBAR */}
      <Sidebar
        role={role}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* RIGHT SIDE */}
      <div className="lg:ml-60 xl:ml-64 h-screen flex flex-col">

        {/* IMPERSONATION BANNER */}
        {originalAdminUser && (
          <div className="bg-blue-500 text-white px-4 py-2 text-[10px] flex items-center justify-between gap-5 shadow-md z-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              <span>
                Viewing as <strong className="text-yellow-400">{user?.name}</strong> <span className="font-medium text-yellow-400"> ({role})</span> in Original account: <strong className="text-yellow-400">{originalAdminUser.name}</strong>.
              </span>
            </div>
            <button
              onClick={handleSwitchBack}
              className=" bg-yellow-500 text-white font-bold cursor-pointer  px-3 py-1 rounded text-[12px] uppercase tracking-wider transition-all"
            >
              Switch Back
            </button>
          </div>
        )}

        {/* NAVBAR */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* SCROLLABLE CONTENT */}
        <main className={`flex-1 ${isChatPage ? "overflow-hidden p-0" : "overflow-y-auto p-1.5 sm:p-3 md:p-4"} theme-bg-main`}>
          <div className={isChatPage ? "h-full theme-bg-card" : "min-h-full rounded-xl sm:rounded-2xl theme-bg-card border theme-border dark:shadow-none shadow-sm p-2 sm:p-3 md:p-4"}>
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;