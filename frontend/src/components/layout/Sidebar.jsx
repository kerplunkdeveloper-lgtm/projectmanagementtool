import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.avif";
import logoDark from "../../assets/logodark.png";
import { useTheme } from "../../context/ThemeContext";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiX, FiLogOut, FiFolder } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { sidebarConfig } from "../../config/sidebarConfig";
import { logoutUser, impersonateUser } from "../../features/auth/authSlice";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";

const projectColors = [
  "bg-fuchsia-300 text-fuchsia-900 dark:bg-fuchsia-400 dark:text-fuchsia-950",
  "bg-emerald-300 text-emerald-900 dark:bg-emerald-400 dark:text-emerald-950",
  "bg-lime-300 text-lime-900 dark:bg-lime-400 dark:text-lime-950",
  "bg-indigo-300 text-indigo-900 dark:bg-indigo-400 dark:text-indigo-950",
  "bg-rose-300 text-rose-900 dark:bg-rose-400 dark:text-rose-950",
  "bg-cyan-300 text-cyan-900 dark:bg-cyan-400 dark:text-cyan-950"
];

const Sidebar = ({ role, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const activeProjectId = new URLSearchParams(location.search).get("id");
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
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { unreadCounts = {} } = useSelector((state) => state.chat);
  const totalUnreadChatCount = Object.values(unreadCounts).reduce((sum, val) => sum + (val || 0), 0);

  const menuItems = (sidebarConfig[role] || []).filter(item => {
    if (role === "admin") return true;
    if (!item.permissionKey) return true;
    const perm = currentUser?.permissions?.[item.permissionKey];
    if (perm === true) return true; // legacy
    return perm?.read;
  });

  const [isWorkOpen, setIsWorkOpen] = useState(false);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);

  useEffect(() => {
    dispatch(getProjects());
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
          w-72 lg:w-60 xl:w-64
          theme-bg-card
          border-r theme-border
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
              className="w-[110px] lg:w-[150px]  object-contain dark:brightness-100"
            />
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg theme-bg-main hover:opacity-85 flex items-center justify-center transition-all border theme-border"
          >
            <FiX size={18} className="theme-text-primary" />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1.5 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <React.Fragment key={item.path}>
                {item.name === "Projects" ? (
                  <div className="space-y-1">
                    {/* Main Projects Toggle Button */}
                    <button
                      onClick={() => setIsProjectsMenuOpen(!isProjectsMenuOpen)}
                      className={`w-full flex items-center justify-between rounded-xl border transition-all duration-200 px-3 py-2.5 ${
                        location.pathname.includes("/projects")
                          ? "dashboard-btn-primary shadow-sm"
                          : "theme-text-primary border-transparent hover:theme-bg-main hover:theme-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">
                          <Icon size={16} />
                        </span>
                        <span className="text-xs lg:text-[11px] xl:text-xs font-semibold">
                          Projects
                        </span>
                      </div>
                      <svg
                        className={`w-3 h-3 transform transition-transform duration-200 ${
                          isProjectsMenuOpen ? "rotate-180" : ""
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

                    {/* Submenu Accordion Panel */}
                    {isProjectsMenuOpen && (
                      <div className="pl-3.5 pr-2 py-2 space-y-2.5 theme-bg-main rounded-2xl border theme-border mt-1 transition-all">
                        {/* Nested Item 1: Projects Management Link */}
                        <NavLink
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 text-[10px] font-bold py-1.5 rounded-lg px-2 transition-colors ${
                              isActive && !activeProjectId
                                ? "bg-blue-50 dark:bg-[#e5ff00]/20 text-blue-600 dark:text-[#e5ff00]"
                                : "theme-text-secondary hover:theme-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/40"
                            }`
                          }
                        >
                          <FiFolder size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                          <span>Project Overview</span>
                        </NavLink>

                        {/* Nested Item 2: My Projects List */}
                        {projects && projects.length > 0 && (
                          <div className="space-y-1">
                            <div className="py-1 px-2">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                List of Projects
                              </span>
                            </div>

                            <div className="pl-2 space-y-0.5 overflow-y-auto max-h-[160px] scrollbar-thin">
                              {projects.map((project, index) => {
                                const isActive = activeProjectId === project._id;
                                return (
                                  <button
                                    key={project._id}
                                    onClick={() => {
                                      setSidebarOpen(false);
                                      navigate(`/${role}/projects?id=${project._id}`);
                                    }}
                                    className={`w-full flex items-center gap-2 text-left text-[10px] font-semibold py-1.5 rounded-lg px-1.5 transition-colors group ${
                                      isActive
                                        ? "bg-blue-50 dark:bg-[#e5ff00]/20 text-blue-600 dark:text-[#e5ff00] font-bold"
                                        : "theme-text-secondary hover:theme-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/40"
                                    }`}
                                    title={project.name}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                        projectColors[index % projectColors.length]
                                      } group-hover:scale-110 transition-transform`}
                                    >
                                      <span className="text-[8px] font-black uppercase opacity-90">
                                        {project.name.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="truncate">{project.name}</span>
                                    {isActive && (
                                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#e5ff00] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
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
                        ? ` dashboard-btn-primary shadow-md`
                        : `theme-text-primary border-transparent hover:theme-bg-main hover:theme-text-primary`;

                      return `block rounded-xl border transition-all duration-200 ${activeClass}`;
                    }}
                  >
                    {({ isActive }) => (
                      <motion.div
                        className="flex items-center gap-3 px-3 py-2.5 w-full"
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

                        {item.name === "Notifications" && unreadCount > 0 && (
                          <span className="ml-auto min-w-[16px] h-[16px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse">
                            {unreadCount}
                          </span>
                        )}

                        {item.name === "Chat" && totalUnreadChatCount > 0 && (
                          <span className="ml-auto min-w-[16px] h-[16px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse">
                            {totalUnreadChatCount}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </NavLink>
                )}
              </React.Fragment>
            );
          })}

          {/* FALLBACK FOR ROLES WITHOUT PROJECTS LISTED */}
          {role !== "team" &&
            !menuItems.some((item) => item.name === "Projects" || item.name === "Projects management") &&
            projects &&
            projects.length > 0 && (
              <div className="space-y-1 pt-2 px-2.5">
                <div className="flex items-center gap-2 py-2">
                  <FiFolder size={12} className="text-gray-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    My Projects
                  </span>
                </div>

                <div className="pl-3.5 space-y-1 overflow-y-auto max-h-[160px] scrollbar-thin">
                  {projects.map((project, index) => {
                    const isActive = activeProjectId === project._id;
                    return (
                      <button
                        key={project._id}
                        onClick={() => {
                          setSidebarOpen(false);
                          navigate(`/${role}/projects?id=${project._id}`);
                        }}
                        className={`w-full flex items-center gap-2 text-left text-[10px] font-semibold py-1.5 rounded-lg px-1.5 transition-colors group ${
                          isActive
                            ? "bg-blue-50 dark:bg-[#e5ff00]/20 text-blue-600 dark:text-[#e5ff00]"
                            : "theme-text-secondary hover:theme-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        }`}
                        title={project.name}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${projectColors[index % projectColors.length]} group-hover:scale-110 transition-transform`}>
                          <span className="text-[8px] font-black uppercase opacity-90">{project.name.charAt(0)}</span>
                        </div>
                        <span className="truncate">{project.name}</span>
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#e5ff00] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t theme-border space-y-1.5">
          {role === "admin" && users && users.length > 0 && (
            <div className="p-1.5 text-left">
              <label className="block text-[8px] font-black theme-text-secondary uppercase tracking-wider mb-0.5 px-0.5">
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
                  className="w-full theme-bg-card border theme-border rounded-lg pl-1.5 pr-6 py-1 text-[8px] font-black theme-text-primary outline-none cursor-pointer focus:border-indigo-500 dark:focus:border-indigo-400 transition-all appearance-none"
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
                          backgroundColor: isDark ? (isCurrent ? "#1e293b" : "#0f172a") : (isCurrent ? "#e0e7ff" : "#ffffff"),
                          color: isDark ? "#ffffff" : (isCurrent ? "#4f46e5" : "#1f2937")
                        }}
                      >
                        {isCurrent ? "● " : ""}
                        {u.name} ({displayRole}
                        {displayDept}){isCurrent ? " — Active" : ""}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-2 pointer-events-none theme-text-secondary">
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
