import React, { useState } from "react";

import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ role }) => {

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (

    <div className="h-screen overflow-hidden bg-[#09111F]">

      {/* NAVBAR */}
      <div
        className="
          fixed
          top-0
          left-0
          right-0
          z-50
          h-20
        "
      >
        <Navbar
          setSidebarOpen={setSidebarOpen}
        />
      </div>



      {/* BODY */}
      <div className="flex pt-20 h-screen">

        {/* SIDEBAR */}
        <div
          className="
            fixed
            top-20
            left-0
            z-40

            h-[calc(100vh-80px)]

            lg:w-72
          "
        >
          <Sidebar
            role={role}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>



        {/* MAIN CONTENT */}
        <main
          className="
            flex-1

            lg:ml-72

            h-[calc(100vh-80px)]

            overflow-y-auto

            bg-gradient-to-br
            from-[#0F1729]
            via-[#142238]
            to-[#0D1B2A]

            p-3
            sm:p-4
            md:p-6
          "
        >

          {/* CONTENT WRAPPER */}
          <div
            className="
              min-h-full

              rounded-2xl
              md:rounded-3xl

              border
              border-white/10

              bg-gradient-to-br
              from-white/5
              to-white/[0.02]

              backdrop-blur-xl

              shadow-2xl

              p-4
              sm:p-5
              md:p-8
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