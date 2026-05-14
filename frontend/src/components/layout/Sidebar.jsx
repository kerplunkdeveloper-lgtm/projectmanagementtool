import React from "react";

import {
  NavLink,
} from "react-router-dom";

import {
  FiX,
} from "react-icons/fi";

import { sidebarConfig } from "../../config/sidebarConfig";

const Sidebar = ({
  role,
  sidebarOpen,
  setSidebarOpen,
}) => {

  const menuItems =
    sidebarConfig[role] || [];

  return (
    <>

      {/* OVERLAY */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`
          fixed inset-0 z-40
          bg-black/50
          backdrop-blur-sm
          transition-all duration-300

          lg:hidden

          ${
            sidebarOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }
        `}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0 z-50

          w-[280px]
          h-screen

          bg-[#0D1B2A]

          border-r border-white/10

          p-5

          transition-all duration-300

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* TOP */}
        <div
          className="
            flex items-center
            justify-between
            mb-10
          "
        >

          <div>

            <h1
              className="
                text-5xl
                font-bold
                text-cyan-400
              "
            >
              PMS
            </h1>

            <p className="text-gray-400">
              {role}
            </p>

          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="
              lg:hidden

              w-10 h-10

              rounded-xl

              bg-white/10

              flex
              items-center
              justify-center

              text-white
            "
          >
            <FiX size={22} />
          </button>

        </div>

        {/* MENU */}
        <div className="space-y-4">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}

                onClick={() =>
                  setSidebarOpen(false)
                }

                end={
                  item.path === "/admin" ||
                  item.path === "/operation" ||
                  item.path === "/team"
                }

                className={({ isActive }) =>
                  `
                    flex
                    items-center
                    gap-4

                    px-5
                    py-4

                    rounded-2xl

                    transition-all
                    duration-300

                    ${
                      isActive
                        ? `
                          bg-gradient-to-r
                          from-cyan-400
                          to-blue-600

                          text-white

                          shadow-lg
                        `
                        : `
                          bg-white/5
                          text-gray-200

                          hover:bg-white/10
                        `
                    }
                  `
                }
              >

                <Icon size={22} />

                <span
                  className="
                    text-base
                    font-semibold
                  "
                >
                  {item.name}
                </span>

              </NavLink>
            );
          })}
        </div>

      </aside>

    </>
  );
};

export default Sidebar;