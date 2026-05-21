import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.avif";

import { NavLink, useNavigate } from "react-router-dom";

import { FiX, FiLogOut, FiFolder } from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";

import toast from "react-hot-toast";

import { sidebarConfig } from "../../config/sidebarConfig";

import { logoutUser } from "../../features/auth/authSlice";
import { getProjects } from "../../features/projects/projectSlice";

const Sidebar = ({ role, sidebarOpen, setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const menuItems = sidebarConfig[role] || [];
  
  const { notifications } = useSelector((state) => state.notifications);
  const unreadCount = notifications ? notifications.filter((n) => !n.isRead).length : 0;
  
  const { projects } = useSelector((state) => state.projects);
  const [isWorkOpen, setIsWorkOpen] = useState(true);

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

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
          bg-black/40 backdrop-blur-sm
          transition-all duration-300
          lg:hidden
          ${sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50

          h-screen

          w-[200px]
          lg:w-[220px]
          xl:w-[230px]

          bg-white

          border-r border-gray-200

          flex flex-col

          transition-all duration-300 ease-in-out

          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* HEADER */}
        <div
          className="
            flex
            items-center
            justify-between

            px-3
            py-3

            border-b border-gray-200
          "
        >
          {/* LOGO */}
          <div className="overflow-hidden">
            <img
              src={logo}
              alt="logo"
              className="
                w-[100px]
                lg:w-[110px]
                xl:w-[120px]

                object-contain
              "
            />
          </div>

          {/* MOBILE CLOSE */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="
              lg:hidden

              w-8
              h-8

              rounded-lg

              bg-gray-100

              hover:bg-gray-200

              flex
              items-center
              justify-center

              transition-all
            "
          >
            <FiX size={18} className="text-gray-700" />
          </button>
        </div>



        {/* MENU */}
        <nav
          className="
            flex-1
            overflow-y-auto

            px-2
            py-2

            space-y-1.5

            scrollbar-thin
            scrollbar-thumb-gray-300
          "
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <React.Fragment key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  end={
                    item.path === "/admin" ||
                    item.path === "/operationmanager" ||
                    item.path === "/team"
                  }
                  className={({ isActive }) =>
                    `
                      flex
                      items-center
                      gap-2.5

                      px-2.5
                      py-2

                      rounded-xl

                      border

                      transition-all
                      duration-200

                      ${
                        isActive
                          ? `
                            bg-gradient-to-r
                            from-cyan-500
                            to-blue-600

                            text-white

                            border-cyan-400

                            shadow-md
                          `
                          : `
                            text-gray-700

                            border-transparent

                            hover:bg-cyan-50
                            hover:text-cyan-700
                          `
                      }
                    `
                  }
                >
                  <Icon size={12} className="shrink-0" />

                  <span
                    className="
                      text-[10px]
                      lg:text-[10px]

                      font-medium

                      truncate
                    "
                  >
                    {item.name}
                  </span>

                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="
                      ml-auto
                      min-w-[16px] h-[16px] px-1
                      bg-red-500 text-white rounded-full
                      flex items-center justify-center
                      text-[9px] font-bold animate-pulse
                    ">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>

                {item.name === "Projects" && (
                  <div className="space-y-1 pt-1 pb-2 border-b border-gray-100 pl-4 pr-2">
                    <button
                      onClick={() => setIsWorkOpen(!isWorkOpen)}
                      className="w-full flex items-center justify-between gap-2 py-1 text-gray-700 hover:text-cyan-700 transition-all font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <FiFolder size={12} className="text-gray-500" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Work</span>
                      </div>
                      <svg
                        className={`w-3 h-3 transform transition-transform duration-200 ${isWorkOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isWorkOpen && (
                      <div className="pl-3.5 space-y-1 overflow-y-auto max-h-[160px] scrollbar-thin">
                        {projects.length === 0 ? (
                          <span className="text-[9px] text-gray-400 italic block py-1">No Projects</span>
                        ) : (
                          projects.map((project) => (
                            <button
                              key={project._id}
                              onClick={() => {
                                setSidebarOpen(false);
                                navigate(`/${role}/projects?id=${project._id}`);
                              }}
                              className="w-full text-left block text-[10px] font-semibold text-gray-600 hover:text-cyan-600 py-1 truncate"
                              title={project.name}
                            >
                              • {project.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* FALLBACK FOR ROLES WITHOUT PROJECTS LISTED */}
          {!menuItems.some((item) => item.name === "Projects") && (
            <div className="space-y-1 pt-2 border-t border-gray-100 px-2.5">
              <button
                onClick={() => setIsWorkOpen(!isWorkOpen)}
                className="w-full flex items-center justify-between gap-2 py-2 text-gray-700 hover:text-cyan-700 transition-all font-bold"
              >
                <div className="flex items-center gap-2">
                  <FiFolder size={12} className="text-gray-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Work</span>
                </div>
                <svg
                  className={`w-3 h-3 transform transition-transform duration-200 ${isWorkOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isWorkOpen && (
                <div className="pl-3.5 space-y-1 overflow-y-auto max-h-[160px] scrollbar-thin">
                  {projects.length === 0 ? (
                    <span className="text-[9px] text-gray-400 italic block py-1">No Projects</span>
                  ) : (
                    projects.map((project) => (
                      <button
                        key={project._id}
                        onClick={() => {
                          setSidebarOpen(false);
                          navigate(`/${role}/projects?id=${project._id}`);
                        }}
                        className="w-full text-left block text-[10px] font-semibold text-gray-600 hover:text-cyan-600 py-1 truncate"
                        title={project.name}
                      >
                        • {project.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="
              w-full

              flex
              items-center
              justify-center
              gap-2

              px-3
              py-2

              rounded-xl

              bg-gradient-to-r
              from-red-500
              to-rose-500

              text-white

              text-sm
              font-semibold

              hover:scale-[1.01]

              transition-all
              duration-200
            "
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
