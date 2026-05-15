import React, { useState } from "react";

import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ role }) => {

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div
      className="
        min-h-screen
        flex

        bg-gradient-to-br
        from-[#061224]
        via-[#0A1931]
        to-[#102A43]

        text-black
     

        overflow-hidden
      "
    >

      {/* SIDEBAR */}
      <Sidebar
        role={role}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN */}
      <div
        className="
          flex-1
          flex
          flex-col

          w-full
        "
      >

        {/* NAVBAR */}
        <Navbar
          setSidebarOpen={setSidebarOpen}
        />

        {/* PAGE CONTENT */}
        <main
          className="
            flex-1
            overflow-auto

            p-3 sm:p-4 md:p-6
          "
        >

          <div
            className="
              min-h-[calc(100vh-100px)]

              rounded-2xl md:rounded-3xl

              border border-white/10

              bg-white/5
              backdrop-blur-xl

              shadow-2xl

              p-4 sm:p-5 md:p-8
            "
          >

            <Outlet />

          </div>

        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;