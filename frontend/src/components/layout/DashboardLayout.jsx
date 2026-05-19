import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useSocket from "../../hooks/useSocket.jsx";

const DashboardLayout = ({ role }) => {
  useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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