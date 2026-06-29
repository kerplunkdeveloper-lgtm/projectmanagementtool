import React, { useState, useEffect } from "react";
import logo from "../../assets/light.png";
import logoDark from "../../assets/logodark.png";
import { useTheme } from "../../context/ThemeContext";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiX, FiLogOut, FiFolder, FiList, FiLayers } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { sidebarConfig } from "../../config/sidebarConfig";
import { logoutUser, impersonateUser } from "../../features/auth/authSlice";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";
import { getPortfolios } from "../../features/portfolio/portfolioSlice";
import ProjectIcon from "../common/ProjectIcon";

const projectColors = [
  "bg-fuchsia-300 text-fuchsia-900 dark:bg-fuchsia-400 dark:text-fuchsia-950",
  "bg-emerald-300 text-emerald-900 dark:bg-emerald-400 dark:text-emerald-950",
  "bg-lime-300 text-lime-900 dark:bg-lime-400 dark:text-lime-950",
  "bg-indigo-300 text-indigo-900 dark:bg-indigo-400 dark:text-indigo-950",
  "bg-rose-300 text-rose-900 dark:bg-rose-400 dark:text-rose-950",
  "bg-cyan-300 text-cyan-900 dark:bg-cyan-400 dark:text-cyan-950",
];

const Sidebar = ({ role, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const activeProjectId = location.pathname.includes("/projects")
    ? new URLSearchParams(location.search).get("id")
    : null;
  const activePortfolioId = location.pathname.includes("/portfolio")
    ? new URLSearchParams(location.search).get("id")
    : null;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const activeLogo = isDark ? logoDark : logo;

  const { notifications } = useSelector((state) => state.notifications);
  const unreadCount = notifications
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  const { projects } = useSelector((state) => state.projects);
  const { portfolios = [] } = useSelector((state) => state.portfolios || {});
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { unreadCounts = {} } = useSelector((state) => state.chat);
  const totalUnreadChatCount = Object.values(unreadCounts).reduce(
    (sum, val) => sum + (val || 0),
    0,
  );

  const menuItems = (sidebarConfig[role] || []).filter((item) => {
    if (role === "admin") return true;
    if (item.permissionKey === "manage_clients") return true;
    if (!item.permissionKey) return true;
    const perm = currentUser?.permissions?.[item.permissionKey];
    if (perm === true) return true; // legacy
    return perm?.read;
  });

  const [isWorkOpen, setIsWorkOpen] = useState(false);
  const [isProjectsListOpen, setIsProjectsListOpen] = useState(true);
  const [isPortfoliosListOpen, setIsPortfoliosListOpen] = useState(true);
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(
    location.pathname.includes("/portfolio"),
  );

  useEffect(() => {
    if (location.pathname.includes("/portfolio")) {
      setIsPortfolioDropdownOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    dispatch(getProjects());
    dispatch(getPortfolios());
    if (role === "admin") {
      dispatch(getUsers());
    }
  }, [dispatch, role]);

  const handleSwitchUser = async (userId) => {
    try {
      const result = await dispatch(impersonateUser(userId)).unwrap();
      toast.success("Successfully logged in as user");
      setSidebarOpen(false);
      const targetRole = result.data.user.role;
      if (targetRole === "admin") {
        navigate("/admin");
      } else if (targetRole === "operationmanager") {
        navigate("/operationmanager");
      } else if (targetRole === "team") {
        navigate("/team");
      }
    } catch (err) {
      toast.error(err || "Failed to switch user");
    }
  };

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
          fixed inset-0 z-[90]
          bg-black/40 backdrop-blur-sm
          transition-all duration-300
          lg:hidden
          ${sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      <aside
        className={`
          fixed top-0 left-0 z-[100] h-screen
          w-64 lg:w-48 xl:w-52
          bg-white/60 dark:bg-[#0b0c10]/65
          backdrop-blur-xl
          border-r border-slate-200/40 dark:border-white/5
          shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-4">
          {/* LOGO */}
          <div className="overflow-hidden">
            <img
              src={activeLogo}
              alt="logo"
              className="w-[110px] lg:w-[130px]  object-contain dark:brightness-100"
            />
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-white dark:bg-[#0b0c10] hover:bg-slate-50  flex items-center justify-center transition-all border border-slate-200 dark:border-white/5"
          >
            <FiX size={18} className="text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1.5 sidebar-scrollbar">
          {(() => {
            let hasRenderedProjectsList = false;
            let hasRenderedPortfoliosList = false;

            const renderProjectsList = () => (
              <div className="space-y-1 pt-1.5 pb-1 px-1.5 ml-2 border-l border-slate-100 dark:border-white/5">
                {/* Dropdown Header Toggle */}
                <button
                  onClick={() => setIsProjectsListOpen(!isProjectsListOpen)}
                  className="w-full flex items-center justify-between py-2 px-1 text-left text-blue-900 dark:text-[#e5ff00] hover:opacity-85 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <FiList
                      size={15}
                      className="shrink-0 text-blue-900 dark:text-[#e5ff00]"
                    />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      List of Projects
                    </span>
                  </div>
                  <svg
                    className={`w-3 h-3 transform transition-transform duration-200 text-blue-900 dark:text-[#e5ff00] ${
                      isProjectsListOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Submenu List */}
                {isProjectsListOpen && (
                  <div className="pl-1 space-y-1 overflow-y-auto max-h-[160px] sidebar-scrollbar transition-all">
                    {projects.map((project, index) => {
                      const isActive = activeProjectId === project._id;
                      return (
                        <button
                          key={project._id}
                          onClick={() => {
                            setSidebarOpen(false);
                            navigate(`/${role}/projects?id=${project._id}`);
                          }}
                          className={`w-full flex items-center gap-2 text-left text-[11px] font-bold py-1.5 rounded-lg px-2 transition-colors group ${
                            isActive
                              ? "text-blue-600 dark:text-[#e5ff00]"
                              : "text-slate-600 dark:text-slate-250"
                          }`}
                          title={project.name}
                        >
                          <ProjectIcon
                            name={project.name}
                            size="sm"
                            className="group-hover:scale-110 transition-transform"
                          />
                          <span className="truncate">{project.name}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#e5ff00] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );

            const renderPortfoliosList = () => (
              <div className="space-y-1 pt-1.5 pb-1 px-1.5 ml-2 border-l border-slate-100 dark:border-white/5">
                {/* Dropdown Header Toggle */}
                <button
                  onClick={() => setIsPortfoliosListOpen(!isPortfoliosListOpen)}
                  className="w-full flex items-center justify-between py-2 px-1 text-left text-blue-900 dark:text-[#e5ff00] hover:opacity-85 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <FiLayers
                      size={15}
                      className="shrink-0 text-blue-900 dark:text-[#e5ff00]"
                    />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      List of Portfolio
                    </span>
                  </div>
                  <svg
                    className={`w-3 h-3 transform transition-transform duration-200 text-blue-900 dark:text-[#e5ff00] ${
                      isPortfoliosListOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Submenu List */}
                {isPortfoliosListOpen && (
                  <div className="pl-1 space-y-1 overflow-y-auto max-h-[160px] sidebar-scrollbar transition-all">
                    {portfolios.map((portfolio, index) => {
                      const isActive = activePortfolioId === portfolio._id;
                      return (
                        <button
                          key={portfolio._id}
                          onClick={() => {
                            setSidebarOpen(false);
                            navigate(`/${role}/portfolio?id=${portfolio._id}`);
                          }}
                          className={`w-full flex items-center gap-2 text-left text-[11px] font-bold py-1.5 rounded-lg px-2 transition-colors group ${
                            isActive
                              ? "bg-blue-50 dark:bg-[#e5ff00]/20 text-blue-600 dark:text-[#e5ff00]"
                              : "text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                          title={portfolio.name}
                        >
                          <svg
                            viewBox="0 0 240 180"
                            className="w-[20px] h-[16px] shrink-0 transition-transform duration-350 group-hover:scale-110"
                            style={{ fill: portfolio.color || "#ff80bf" }}
                          >
                            <path d="M 16 0 A 16 16 0 0 0 0 16 L 0 144 A 16 16 0 0 0 16 160 L 224 160 A 16 16 0 0 0 240 144 L 240 48 A 16 16 0 0 0 224 32 L 120 32 L 96 6 A 16 16 0 0 0 80 0 Z" />
                          </svg>
                          <span className="truncate">{portfolio.name}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#e5ff00] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );

            return (
              <>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isProjectsItem =
                    item.name === "Projects" ||
                    item.name === "Projects management" ||
                    item.name === "Projects Overview";
                  const isPortfoliosItem = item.name === "Portfolio";

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
                        className={({ isActive }) => {
                          const activeClass = isActive
                            ? `bg-blue-600/10 dark:bg-[#e5ff00]/10 text-blue-600 dark:text-[#e5ff00] border-blue-200/50 dark:border-[#e5ff00]/25 shadow-sm`
                            : `text-slate-600 dark:text-slate-350 border-transparent hover:bg-slate-100/40  hover:text-slate-900 `;

                          return `block rounded-xl border transition-all duration-200 ${activeClass}`;
                        }}
                      >
                        {({ isActive }) => (
                          <motion.div
                            className="flex items-center gap-2 px-2.5 py-1.5 w-full"
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            variants={{
                              hover: { x: 4 },
                              tap: { scale: 0.98 },
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 18,
                            }}
                          >
                            <motion.div
                              variants={{
                                hover: {
                                  rotate: 10,
                                  scale: 1.25,
                                },
                                initial: {
                                  rotate: 0,
                                  scale: 1,
                                },
                              }}
                              className="shrink-0"
                            >
                              <Icon size={16} />
                            </motion.div>

                            <span className="text-xs lg:text-[11px] xl:text-xs font-semibold truncate">
                              {item.name}
                            </span>

                            {item.name === "Notifications" &&
                              unreadCount > 0 && (
                                <span className="ml-auto min-w-[16px] h-[16px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse">
                                  {unreadCount}
                                </span>
                              )}

                            {item.name === "Chat" &&
                              totalUnreadChatCount > 0 && (
                                <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[9px] font-black text-white shadow-[0_4px_10px_rgba(244,63,94,0.3)] animate-pulse border border-white/25">
                                  {totalUnreadChatCount}
                                </span>
                              )}
                          </motion.div>
                        )}
                      </NavLink>

                      {isPortfoliosItem &&
                        portfolios &&
                        portfolios.length > 0 &&
                        (() => {
                          hasRenderedPortfoliosList = true;
                          return renderPortfoliosList();
                        })()}

                      {isProjectsItem &&
                        projects &&
                        projects.length > 0 &&
                        (() => {
                          hasRenderedProjectsList = true;
                          return renderProjectsList();
                        })()}
                    </React.Fragment>
                  );
                })}

                {/* Fallback at the bottom if items were not in the menu list */}
                {!hasRenderedPortfoliosList &&
                  portfolios &&
                  portfolios.length > 0 &&
                  renderPortfoliosList()}
                {!hasRenderedProjectsList &&
                  projects &&
                  projects.length > 0 &&
                  renderProjectsList()}
              </>
            );
          })()}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t border-slate-200 dark:border-white/5 space-y-1.5">
          {role === "admin" && users && users.length > 0 && (
            <div className="p-1.5 text-left">
              <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 px-0.5">
                Switch User
              </label>
              <div className="relative flex items-center">
                <select
                  value={currentUser?._id || currentUser?.id || ""}
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      e.target.value !== (currentUser?._id || currentUser?.id)
                    ) {
                      handleSwitchUser(e.target.value);
                    }
                  }}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg pl-1.5 pr-6 py-1 text-[8px] font-black text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-indigo-500 dark:focus:border-indigo-400 transition-all appearance-none"
                >
                  {users.map((u) => {
                    const isCurrent =
                      u._id === (currentUser?._id || currentUser?.id);
                    const displayRole =
                      u.role === "operationmanager"
                        ? "Operation Manager"
                        : u.role === "admin"
                          ? "Admin"
                          : "Team";
                    const displayDept =
                      u.role === "team" && u.department
                        ? ` - ${u.department}`
                        : "";
                    return (
                      <option
                        key={u._id}
                        value={u._id}
                        className={
                          isCurrent
                            ? "font-bold text-indigo-600 dark:text-white bg-indigo-50 dark:bg-[#1e293b]"
                            : "bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                        }
                        style={{
                          backgroundColor: isDark
                            ? isCurrent
                              ? "#1e293b"
                              : "#0f172a"
                            : isCurrent
                              ? "#e0e7ff"
                              : "#ffffff",
                          color: isDark
                            ? "#ffffff"
                            : isCurrent
                              ? "#4f46e5"
                              : "#1f2937",
                        }}
                      >
                        {isCurrent ? "● " : ""}
                        {u.name} ({displayRole}
                        {displayDept}){isCurrent ? " — Active" : ""}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-2 pointer-events-none text-slate-500 dark:text-slate-400">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <motion.button
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            <motion.div
              variants={{
                hover: { x: -3, scale: 1.15 },
                initial: { x: 0, scale: 1 },
              }}
              className="shrink-0"
            >
              <FiLogOut size={15} />
            </motion.div>
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
