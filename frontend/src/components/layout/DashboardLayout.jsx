import React, {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import Navbar from "./Navbar";

import Sidebar from "./Sidebar";

import useSocket from "../../hooks/useSocket.jsx";

const DashboardLayout = ({
  role,
}) => {
  useSocket(); // Initialize real-time notification socket connectivity

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);



  return (

    <div
      className="
        h-screen
        overflow-hidden
        bg-[#08111F]
      
      "
    >

      {/* ========================================= */}
      {/* SIDEBAR */}
      {/* ========================================= */}

      <aside
        className={`

          fixed
          top-0
          left-0

          z-50

          h-screen

          w-[290px]

         bg-white

          border-r
          border-white/10

          transition-all
          duration-300

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >

        <Sidebar
          role={role}
          sidebarOpen={
            sidebarOpen
          }
          setSidebarOpen={
            setSidebarOpen
          }
        />
      </aside>



      {/* ========================================= */}
      {/* RIGHT SIDE */}
      {/* ========================================= */}

      <div
        className="
          lg:ml-[290px]

          h-screen

          flex
          flex-col
        "
      >

        {/* ========================================= */}
        {/* FIXED NAVBAR */}
        {/* ========================================= */}

        <div
          className="
            fixed

            top-0
            right-0
            left-0

            lg:left-[290px]

            z-40

            h-20

            bg-white

            backdrop-blur-xl

            border-b
            border-white/10
          "
        >

          <Navbar
            setSidebarOpen={
              setSidebarOpen
            }
          />
        </div>



        {/* ========================================= */}
        {/* SCROLLABLE CONTENT */}
        {/* ========================================= */}

        <main
          className="
            flex-1
            mt-20
            overflow-y-auto
            p-2
            sm:p-3
            md:p-4
            lg:p-6
            bg-white
          "
        >

          <div
            className="
              min-h-full

              rounded-3xl

              border
              border-white/10

              bg-white/[0.03]

              backdrop-blur-xl

              shadow-2xl

              p-4
              sm:p-5
              md:p-6
              lg:p-8
            "
          >

            <Outlet />

          </div>
        </main>
      </div>



      {/* ========================================= */}
      {/* MOBILE OVERLAY */}
      {/* ========================================= */}

      {
        sidebarOpen && (

          <div
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
            className="
              fixed
              inset-0
              z-30

              bg-black/60

              backdrop-blur-sm

              lg:hidden
            "
          />
        )
      }
    </div>
  );
};

export default DashboardLayout;