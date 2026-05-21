import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, originalAdminUser } = useSelector((state) => state.auth);

  const handleSwitchBack = () => {
    dispatch(exitImpersonation());
    toast.success("Returned to Admin account");
    navigate("/admin");
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50">

      {/* SIDEBAR */}
      <Sidebar
        role={role}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* RIGHT SIDE */}
      <div className="lg:ml-[220px] xl:ml-[230px] h-screen flex flex-col">

        {/* IMPERSONATION BANNER */}
        {originalAdminUser && (
          <div className="bg-blue-400 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md z-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-900 animate-pulse" />
              <span>
                Viewing as <strong>{user?.name}</strong> ({role}) in Original account: <strong>{originalAdminUser.name}</strong>.
              </span>
            </div>
            <button
              onClick={handleSwitchBack}
              className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded font-medium text-[10px] uppercase tracking-wider transition-all"
            >
              Switch Back
            </button>
          </div>
        )}

        {/* NAVBAR */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-gray-50">
          <div className="min-h-full rounded-2xl bg-white border border-gray-200 shadow-sm p-3 md:p-4">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;