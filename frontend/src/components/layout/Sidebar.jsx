import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiX, FiLogOut, FiFolder, FiList, FiLayers } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { sidebarConfig } from "../../config/sidebarConfig";
import { logoutUser, impersonateUser, exitImpersonation } from "../../features/auth/authSlice";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";
import { getPortfolios } from "../../features/portfolio/portfolioSlice";
import { apiSlice } from "../../features/api/apiSlice";
import ProjectIcon from "../common/ProjectIcon";

const projectColors = [
  "bg-fuchsia-300 text-fuchsia-900 dark:bg-fuchsia-400 dark:text-fuchsia-950",
  "bg-emerald-300 text-emerald-900 dark:bg-emerald-400 dark:text-emerald-950",
  "bg-lime-300 text-lime-900 dark:bg-lime-400 dark:text-lime-950",
  "bg-indigo-300 text-indigo-900 dark:bg-indigo-400 dark:text-indigo-950",
  "bg-rose-300 text-rose-900 dark:bg-rose-400 dark:text-rose-950",
  "bg-cyan-300 text-cyan-900 dark:bg-cyan-400 dark:text-cyan-950",
];

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const displayRole = (role) => {
  if (role === "operationmanager") return "Operation Manager";
  if (role === "admin") return "Admin";
  return "Team";
};

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

  const { notifications } = useSelector((state) => state.notifications);
  const unreadCount = notifications
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  const { projects } = useSelector((state) => state.projects);
  const { portfolios = [] } = useSelector((state) => state.portfolios || {});
  const { users } = useSelector((state) => state.users);
  const { user: currentUser, originalAdminUser } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
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
  const [isPortfoliosListOpen, setIsPortfoliosListOpen] = useState(false);
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(
    location.pathname.includes("/portfolio"),
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [expandedPortfolios, setExpandedPortfolios] = useState({});

  useEffect(() => {
    if (activePortfolioId) {
      setExpandedPortfolios((prev) => ({
        ...prev,
        [activePortfolioId]: true,
      }));
    } else if (activeProjectId && (projects || []).length > 0 && (portfolios || []).length > 0) {
      const parentPortfolio = portfolios.find((p) => {
        const ids = (p.projectIds || []).map((pId) =>
          typeof pId === "object" && pId !== null ? pId._id : pId,
        );
        return ids.includes(activeProjectId);
      });
      if (parentPortfolio) {
        setExpandedPortfolios((prev) => ({
          ...prev,
          [parentPortfolio._id]: true,
        }));
      }
    }
  }, [activePortfolioId, activeProjectId, projects, portfolios]);

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
      dispatch(apiSlice.util.resetApiState());
      toast.success("Successfully logged in as user");
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
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

  const handleSwitchBack = () => {
    dispatch(exitImpersonation());
    dispatch(apiSlice.util.resetApiState());
    toast.success("Switched back to Admin");
    if (window.innerWidth < 1024) setSidebarOpen(false);
    navigate("/admin");
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
          w-64 lg:w-48
          sidebar-bg
          backdrop-blur-xl
          border-r border-slate-200/40 dark:border-white/5
          shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-4 ">
          {/* LOGO */}
          <div
            onClick={() => navigate(`/${role}`)}
            className="logo-container group mb-2"
            title="Kerplunk Media"
          >
            <div className="logo-border-wrapper">
              <div className="logo-spinning-border" />
            </div>
            <div className="logo-inner">
              <span className="logo-text-kerplunk">
                {"KERPLUNK".split("").map((char, index) => (
                  <span key={index} className="logo-char">
                    {char}
                  </span>
                ))}
              </span>
            </div>
            <span className="logo-text-media">MEDIA</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-white dark:bg-[#0b0c10] hover:bg-slate-50  flex items-center justify-center transition-all border border-slate-200 dark:border-white/5"
          >
            <FiX size={18} className="text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5 sidebar-scrollbar">
          {(() => {
            let hasRenderedPortfoliosList = false;

            const renderPortfoliosList = () => (
              <div className="mt-0.5 mb-1">
                {/* Dropdown Header Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPortfoliosListOpen(!isPortfoliosListOpen)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl border border-transparent hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer group text-slate-500 dark:text-slate-400 hover:theme-text-accent"
                >
                  <FiLayers
                    size={13}
                    className="shrink-0 transition-colors"
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-widest flex-1 text-left transition-colors">
                    Portfolios
                  </span>
                  <svg
                    className={`w-3 h-3 shrink-0 transform transition-transform duration-200 transition-colors ${
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

                {/* Portfolio List */}
                {isPortfoliosListOpen && (
                  <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-white/8 space-y-0.5 overflow-y-auto max-h-[300px] sidebar-scrollbar mt-0.5">
                    {portfolios.map((portfolio) => {
                      const isActive = activePortfolioId === portfolio._id;
                      const portfolioProjects = (projects || []).filter(
                        (proj) => {
                          const ids = (portfolio.projectIds || []).map((pId) =>
                            typeof pId === "object" && pId !== null
                              ? pId._id
                              : pId,
                          );
                          return ids.includes(proj._id);
                        },
                      );

                      return (
                        <div key={portfolio._id}>
                          {/* Portfolio Row */}
                          {/* Portfolio Row */}
                          <div className="flex items-center justify-between group rounded-lg transition-all duration-150 relative">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.innerWidth < 1024)
                                  setSidebarOpen(false);
                                navigate(
                                  `/${role}/portfolio?id=${portfolio._id}`,
                                );
                                // If it's already active, toggle it. If not, expand it.
                                setExpandedPortfolios((prev) => ({
                                  ...prev,
                                  [portfolio._id]: isActive ? !prev[portfolio._id] : true,
                                }));
                              }}
                              className={`flex-1 flex items-center gap-2 text-left text-[11px] font-semibold py-1.5 pl-2.5 pr-1.5 transition-all duration-150 ${
                                portfolioProjects.length > 0 ? "rounded-l-lg" : "rounded-lg pr-2.5"
                              } ${
                                isActive
                                  ? "bg-[var(--accent-light-bg-subtle)] dark:bg-[var(--accent-dark-bg-subtle)] theme-text-accent"
                                  : "text-slate-600 dark:text-slate-500 hover:theme-text-accent hover:bg-slate-100/60 dark:hover:bg-white/5"
                              }`}
                              title={portfolio.name}
                            >
                              <svg
                                viewBox="0 0 240 180"
                                className="w-[16px] h-[13px] shrink-0"
                                style={{ fill: portfolio.color || "#ff80bf" }}
                              >
                                <path d="M 16 0 A 16 16 0 0 0 0 16 L 0 144 A 16 16 0 0 0 16 160 L 224 160 A 16 16 0 0 0 240 144 L 240 48 A 16 16 0 0 0 224 32 L 120 32 L 96 6 A 16 16 0 0 0 80 0 Z" />
                              </svg>
                              <span className="truncate flex-1 text-left">
                                {portfolio.name}
                              </span>
                              {isActive && !portfolioProjects.length && (
                                <span className="w-1.5 h-1.5 rounded-full theme-bg-accent shrink-0" />
                              )}
                            </button>

                            {portfolioProjects.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPortfolios((prev) => ({
                                    ...prev,
                                    [portfolio._id]: !prev[portfolio._id],
                                  }));
                                }}
                                className={`py-1.5 px-2 rounded-r-lg transition-all duration-150 flex items-center justify-center self-stretch cursor-pointer ${
                                  isActive
                                    ? "bg-[var(--accent-light-bg-subtle)] dark:bg-[var(--accent-dark-bg-subtle)] theme-text-accent"
                                    : "text-slate-600 dark:text-slate-500 hover:theme-text-accent hover:bg-slate-100/60 dark:hover:bg-white/5"
                                }`}
                              >
                                <svg
                                  className={`w-3 h-3 shrink-0 transform transition-transform duration-200 ${
                                    expandedPortfolios[portfolio._id] ? "rotate-180" : ""
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
                            )}
                          </div>

                          {/* Projects inside this Portfolio */}
                          {portfolioProjects.length > 0 && expandedPortfolios[portfolio._id] && (
                            <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-white/8 space-y-0.5 mt-0.5 mb-0.5">
                              {portfolioProjects.map((project) => {
                                const isProjectActive =
                                  activeProjectId === project._id;
                                return (
                                  <button
                                    key={project._id}
                                    type="button"
                                    onClick={() => {
                                      if (window.innerWidth < 1024)
                                        setSidebarOpen(false);
                                      navigate(
                                        `/${role}/projects?id=${project._id}`,
                                      );
                                    }}
                                    className={`w-full flex items-center gap-2 text-left text-[10px] font-semibold py-1 rounded-md px-2 transition-all duration-150 cursor-pointer ${
                                      isProjectActive
                                        ? "bg-slate-50 dark:bg-slate-800/60 theme-text-accent font-bold"
                                        : "text-slate-500 dark:text-slate-600 hover:theme-text-accent hover:bg-slate-100/40 dark:hover:bg-white/5"
                                    }`}
                                    title={project.name}
                                  >
                                    <ProjectIcon
                                      name={project.name}
                                      size="sm"
                                      className="shrink-0"
                                    />
                                    <span className="truncate flex-1 text-left">
                                      {project.name}
                                    </span>
                                    {isProjectActive && (
                                      <span className="w-1.5 h-1.5 rounded-full theme-bg-accent shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
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
                  const isPortfoliosItem = item.name === "Portfolio";

                  return (
                    <React.Fragment key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        end={
                          item.path === "/admin" ||
                          item.path === "/operationmanager" ||
                          item.path === "/team"
                        }
                        className={({ isActive }) => {
                          const activeClass = isActive
                            ? `bg-[var(--accent-light-bg-subtle)] dark:bg-[var(--accent-dark-bg-subtle)] theme-text-accent border-[var(--accent-color)]/20 dark:border-[var(--accent-color-dark)]/25 shadow-sm`
                            : `text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100/60 dark:hover:bg-white/5 hover:theme-text-accent`;
                          return `block rounded-xl border transition-all duration-200 ${activeClass}`;
                        }}
                      >
                        {({ isActive }) => (
                          <div className="flex items-center gap-2.5 px-3 py-2 w-full">
                            <div
                              className={`shrink-0 transition-colors ${isActive ? "theme-text-accent" : ""}`}
                            >
                              <Icon size={14} />
                            </div>
                            <span className="text-[11px] font-semibold truncate flex-1 text-left transition-colors">
                              {item.name}
                            </span>
                            {item.name === "Notifications" &&
                              unreadCount > 0 && (
                                <span className="min-w-[16px] h-[16px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse shrink-0">
                                  {unreadCount}
                                </span>
                              )}
                            {item.name === "Chat" &&
                              totalUnreadChatCount > 0 && (
                                <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[9px] font-black text-white animate-pulse shrink-0">
                                  {totalUnreadChatCount}
                                </span>
                              )}
                            {isActive &&
                              !unreadCount &&
                              item.name !== "Notifications" &&
                              item.name !== "Chat" && (
                                <span className="w-1.5 h-1.5 rounded-full theme-bg-accent shrink-0" />
                              )}
                          </div>
                        )}
                      </NavLink>

                      {isPortfoliosItem &&
                        portfolios &&
                        portfolios.length > 0 &&
                        (() => {
                          hasRenderedPortfoliosList = true;
                          return renderPortfoliosList();
                        })()}

                      {/* Projects item list is removed */}
                    </React.Fragment>
                  );
                })}

                {/* Fallback at the bottom if items were not in the menu list */}
                {!hasRenderedPortfoliosList &&
                  portfolios &&
                  portfolios.length > 0 &&
                  (role === "admin" || currentUser?.permissions?.manage_portfolios?.read || currentUser?.permissions?.manage_portfolios === true) &&
                  renderPortfoliosList()}
              </>
            );
          })()}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t border-slate-200 dark:border-white/5 space-y-1.5">

          {/* Switch Back to Admin — shown when impersonating any user */}
          {originalAdminUser && (
            <button
              type="button"
              onClick={handleSwitchBack}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-500/20 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-300/40 dark:border-indigo-400/20 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">
                  {getInitials(originalAdminUser?.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate leading-tight">
                  Switch Back
                </p>
                <p className="text-[8px] font-black text-indigo-500/70 dark:text-indigo-400/60 uppercase tracking-wider leading-none mt-0.5 truncate">
                  {originalAdminUser?.name}
                </p>
              </div>
              <svg className="w-3 h-3 text-indigo-400 dark:text-indigo-500 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
          )}

          {/* Switch User dropdown — shown only for the actual admin (not impersonating) */}
          {role === "admin" && !originalAdminUser && users && users.length > 0 && (
            <div className="p-1.5 text-left relative">
              <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">
                Switch User
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-100/50 dark:hover:bg-[#131d35] transition-all cursor-pointer shadow-sm text-left relative z-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Avatar */}
                  <div className="w-6 h-6 rounded-lg overflow-hidden border border-indigo-500/20 dark:border-indigo-400/20 shrink-0 relative flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400">
                    {profile?.profileImage?.url ? (
                      <img
                        src={profile.profileImage.url}
                        alt={currentUser?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-black">
                        {getInitials(currentUser?.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold theme-text-primary truncate leading-tight">
                      {currentUser?.name}
                    </p>
                    <p className="text-[8px] font-black theme-text-secondary uppercase tracking-wider leading-none mt-0.5">
                      {displayRole(currentUser?.role)}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-3 h-3 text-slate-400 dark:text-slate-500 transform transition-transform duration-200 shrink-0 ${
                    showUserDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Click outside Overlay */}
              {showUserDropdown && (
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowUserDropdown(false)}
                />
              )}

              {/* Dropdown Options List */}
              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 24 }}
                    className="absolute bottom-full left-1.5 right-1.5 mb-3 z-50 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 overflow-hidden flex flex-col p-2 max-h-[280px] overflow-y-auto sidebar-scrollbar"
                  >
                    {users.map((u) => {
                      const isCurrent =
                        u._id === (currentUser?._id || currentUser?.id);
                      return (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            if (!isCurrent) {
                              handleSwitchUser(u._id);
                            }
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 cursor-pointer group mb-1 last:mb-0 ${
                            isCurrent
                              ? "bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-500/10 dark:to-blue-500/5 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                              : "border border-transparent hover:bg-slate-50/80 dark:hover:bg-white/5 hover:border-slate-200/50 dark:hover:border-white/5 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Avatar */}
                            <div
                              className={`w-8 h-8 rounded-full shrink-0 overflow-hidden shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
                                isCurrent
                                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"
                              }`}
                            >
                              {u.profile?.profileImage?.url ? (
                                <img
                                  src={u.profile.profileImage.url}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-black">
                                  {getInitials(u.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-[11px] font-bold truncate leading-tight transition-colors ${
                                  isCurrent
                                    ? "text-indigo-700 dark:text-indigo-300"
                                    : "text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                }`}
                              >
                                {u.name}
                              </p>
                              <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mt-0.5 theme-text-secondary truncate">
                                {displayRole(u.role)}
                                {u.role === "team" && u.department
                                  ? ` • ${u.department}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          {/* Active Indicator */}
                          {isCurrent && (
                            <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <motion.button
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            <motion.div
              variants={{
                hover: { x: -2, scale: 1.1 },
                initial: { x: 0, scale: 1 },
              }}
              className="shrink-0"
            >
              <FiLogOut size={14} />
            </motion.div>
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
