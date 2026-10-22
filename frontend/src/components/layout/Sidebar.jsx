import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context/ThemeContext";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiX,
  FiLogOut,
  FiFolder,
  FiList,
  FiLayers,
  FiShare2,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { sidebarConfig } from "../../config/sidebarConfig";
import {
  logoutUser,
  impersonateUser,
  exitImpersonation,
} from "../../features/auth/authSlice";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";
import { getPortfolios } from "../../features/portfolio/portfolioSlice";
import { getClients } from "../../features/clients/clientslice";
import { apiSlice, useGetTasksQuery } from "../../features/api/apiSlice";
import { getEodReports } from "../../features/eodReports/eodReportSlice";
import { getDesignerEodReports } from "../../features/eodReports/designerEodReportSlice";
import {
  markAllChatAsRead,
  markAsRead,
} from "../../features/notifications/notificationSlice";
import { clearAllUnreadCounts } from "../../features/chat/chatSlice";
import ProjectIcon from "../common/ProjectIcon";
import { preloadRoute } from "../../routes/AppRoutes";
import sortedLogo from "../../assets/sorted.png";
import darkSortedLogo from "../../assets/darksorted.png";

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
  if (role === "humanresource") return "Human Resource";
  return "Team";
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 22,
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.95,
    transition: {
      duration: 0.12,
      ease: "easeInOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 22,
    },
  },
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

  const unreadMomCount = notifications
    ? notifications.filter(
        (n) =>
          !n.isRead &&
          ["mom_created", "mom_assigned", "mom_updated", "mom_overdue"].includes(n.type),
      ).length
    : 0;

  const { projects } = useSelector((state) => state.projects);
  const portfoliosState = useSelector((state) => state.portfolios);
  const portfolios = portfoliosState?.portfolios || [];
  const { users } = useSelector((state) => state.users);
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const { user: currentUser, originalAdminUser } = useSelector(
    (state) => state.auth,
  );
  const { profile } = useSelector((state) => state.profile);
  const { unreadCounts = {}, totalUnreadCount: reduxTotalUnread = 0 } = useSelector((state) => state.chat);
  const localUnreadChatCount = Object.values(unreadCounts).reduce(
    (sum, val) => sum + (val || 0),
    0,
  );
  const dbUnreadChatCount = notifications
    ? notifications.filter((n) => !n.isRead && (n.type === "message_received" || n.type === "mention_received"))
      .length
    : 0;

  // Real-time unread chat count (server persisted + local session sync)
  const totalUnreadChatCount = Math.max(
    localUnreadChatCount,
    dbUnreadChatCount,
    reduxTotalUnread || 0,
  );
  // EOD Reports for Admin / Operation Manager count
  const { eodReports } = useSelector((state) => state.eodReports || {});
  const { designerEodReports } = useSelector(
    (state) => state.designerEodReports || {},
  );

  const fetchedEodRef = React.useRef(false);
  useEffect(() => {
    if (
      (role === "admin" || role === "operationmanager") &&
      !fetchedEodRef.current
    ) {
      if (!eodReports || eodReports.length === 0) dispatch(getEodReports());
      if (!designerEodReports || designerEodReports.length === 0)
        dispatch(getDesignerEodReports());
      fetchedEodRef.current = true;
    }
  }, [dispatch, role, eodReports, designerEodReports]);

  const newReportsCount = React.useMemo(() => {
    if (role !== "admin" && role !== "operationmanager") return 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = (d) => {
      if (!d) return false;
      try {
        const str = new Date(d).toISOString().split("T")[0];
        return str === todayStr;
      } catch {
        return false;
      }
    };
    const todayGeneral = (eodReports || []).filter((r) =>
      isToday(r.date || r.createdAt),
    );
    const todayDesigner = (designerEodReports || []).filter(
      (r) => !r.isDraft && isToday(r.date || r.createdAt),
    );
    return todayGeneral.length + todayDesigner.length;
  }, [eodReports, designerEodReports, role]);

  const menuItems = React.useMemo(() => {
    return (sidebarConfig[role] || [])
      .map((item) => {
        if (item.children && Array.isArray(item.children)) {
          const visibleChildren = item.children.filter((subItem) => {
            const deptLower = (currentUser?.department || "").toLowerCase();
            const roleLower = (currentUser?.role || role || "").toLowerCase();

            const isAdmin =
              roleLower === "admin" ||
              deptLower.includes("managing partner") ||
              roleLower.includes("managing partner");
            const isOperationManager =
              roleLower === "operationmanager" ||
              deptLower.includes("operation manager") ||
              roleLower.includes("operation manager");

            const isSocialMedia =
              deptLower.includes("social media") ||
              deptLower.includes("social manager") ||
              deptLower.includes("smm") ||
              roleLower.includes("social");

            const isGraphicDesigner =
              !isAdmin &&
              !isOperationManager &&
              !isSocialMedia &&
              (deptLower.includes("graphic") ||
                deptLower.includes("design") ||
                roleLower.includes("graphic") ||
                roleLower.includes("design"));

            const isCinematographer =
              !isAdmin &&
              !isOperationManager &&
              !isSocialMedia &&
              (deptLower.includes("cinema") ||
                deptLower.includes("video") ||
                deptLower.includes("edit") ||
                deptLower.includes("shoot") ||
                deptLower.includes("camera") ||
                roleLower.includes("cinema") ||
                roleLower.includes("video") ||
                roleLower.includes("edit"));

            const isGDOrCinema = isGraphicDesigner || isCinematographer;

            // In Tasks dropdown: Graphic Designers and Cinematographers should ONLY see Assigned Tasks
            if (
              (item.name === "Tasks" || item.path?.includes("/tasks")) &&
              isGDOrCinema
            ) {
              return (
                subItem.name === "Assigned Tasks" ||
                subItem.path?.endsWith("/tasks")
              );
            }

            if (
              subItem.name === "Content Calendar" ||
              subItem.path?.includes("content-calendar")
            ) {
              if (!isSocialMedia && !isAdmin && !isOperationManager) {
                return false;
              }
            }

            if (
              subItem.name === "Calendar" ||
              subItem.path?.includes("event-calendar") ||
              subItem.path?.includes("all-calendar")
            ) {
              const isSocialMediaManager = deptLower.includes("social media manager");
              if (!isAdmin && !isOperationManager && !isSocialMediaManager) {
                return false;
              }
            }

            if (
              subItem.name === "SM Tasks" ||
              subItem.path?.includes("sm-tasks")
            ) {
              if (!isSocialMedia && !isAdmin && !isOperationManager) {
                return false;
              }
            }

            if (
              subItem.name === "Designer Tasks" ||
              subItem.path?.includes("designer-tasks")
            ) {
              const isDesigner = deptLower.includes("design") || roleLower.includes("design");
              if (isDesigner) return true;
            }

            if (
              subItem.name === "Cinematographer Tasks" ||
              subItem.path?.includes("cinematographer-tasks")
            ) {
              const isCinema =
                deptLower.includes("cinema") ||
                deptLower.includes("video") ||
                deptLower.includes("edit") ||
                roleLower.includes("cinema");
              if (isCinema) return true;
            }

            if (subItem.permissionKey) {
              if (role === "admin" || role === "operationmanager" || role === "operation manager") return true;
              if (subItem.permissionKey === "manage_clients") return true;
              const perm = currentUser?.permissions?.[subItem.permissionKey];
              if (perm === true) return true;
              return perm?.read;
            }

            return true;
          });

          return { ...item, children: visibleChildren };
        }
        return item;
      })
      .filter((item) => {
        if (item.children) {
          return item.children.length > 0;
        }

        // Hide Projects Overview for Social Media Manager department
        if (
          item.name === "Projects Overview" &&
          (currentUser?.department === "Social Media Manager" ||
            currentUser?.department === "Social Media Executive")
        ) {
          return false;
        }

        // Hide My Reports for Social Media Manager department
        if (
          item.name === "My Reports" &&
          currentUser?.department === "Social Media Manager"
        ) {
          return false;
        }

        // Show SM Creditionals ONLY for Social Media Manager department, Managing Partner / Admin, and Operation Manager
        if (
          item.name === "SM Creditionals" ||
          item.name === "SM Credentials" ||
          item.name === "Social Accounts" ||
          item.name?.toLowerCase().includes("sm cred") ||
          item.path?.includes("social-accounts")
        ) {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const isSocialMedia = deptLower.includes("social media");
          const isManagingPartner =
            roleLower === "admin" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");
          const isOperationManager =
            roleLower === "operationmanager" ||
            deptLower.includes("operation manager") ||
            roleLower.includes("operation manager");

          if (!isSocialMedia && !isManagingPartner && !isOperationManager) {
            return false;
          }
        }

        // Show SM Tasks and Content Calendar ONLY for Social Media Manager department, Admin, and Operation Manager
        if (
          item.name === "SM Tasks" ||
          item.name === "Content Calendar" ||
          item.path?.includes("sm-tasks") ||
          item.path?.includes("content-calendar")
        ) {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const isSocialMedia =
            deptLower.includes("social media") ||
            deptLower.includes("social manager") ||
            deptLower.includes("smm");
          const isAdmin =
            roleLower === "admin" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");
          const isOperationManager =
            roleLower === "operationmanager" ||
            deptLower.includes("operation manager") ||
            roleLower.includes("operation manager");

          if (!isSocialMedia && !isAdmin && !isOperationManager) {
            return false;
          }
        }

        // Show Client Calls ONLY for Social Media Manager department
        if (item.name === "Client Calls" || item.path?.includes("client-calls")) {
          const deptLower = (currentUser?.department || "").toLowerCase();

          const isSocialMediaManager = deptLower.includes("social media manager");

          if (!isSocialMediaManager) {
            return false;
          }
        }

        // Show MOM Points ONLY for Admin, Operation Manager, and Social Media Manager
        if (item.name === "MOM Points" || item.path?.includes("mom-points")) {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const isAdmin =
            roleLower === "admin" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");
          const isOperationManager =
            roleLower === "operationmanager" ||
            deptLower.includes("operation manager") ||
            roleLower.includes("operation manager");
          const isSocialMediaManager =
            deptLower.includes("social media manager") ||
            deptLower.includes("social manager") ||
            deptLower.includes("social media") ||
            roleLower === "socialmediamanager";

          if (!isAdmin && !isOperationManager && !isSocialMediaManager) {
            return false;
          }
        }

        // Show Status Overview ONLY for Social Media Manager/Executive, Admin, Operation Manager, Managing Partner
        if (
          item.name === "Task Overview" ||
          item.name === "Status Overview" ||
          item.path?.includes("task-overview") ||
          item.path?.includes("status-overview")
        ) {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const canSee =
            deptLower.includes("social media") ||
            roleLower === "admin" ||
            roleLower === "operationmanager" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");

          if (!canSee) {
            return false;
          }
        }



        // Show Calendar ONLY for Admin, Operation Manager, and Social Media Manager department
        if (item.name === "Calendar" || item.path?.includes("all-calendar")) {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const isAdmin =
            roleLower === "admin" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");
          const isOperationManager =
            roleLower === "operationmanager" ||
            deptLower.includes("operation manager") ||
            roleLower.includes("operation manager");
          const isSocialMediaManager = deptLower.includes("social media manager");

          if (!isAdmin && !isOperationManager && !isSocialMediaManager) {
            return false;
          }
        }

        // Show Workload ONLY for Admin, Operation Manager, and Social Media Manager department
        if (item.name === "Workload" || item.path?.includes("workload")) {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const isAdmin =
            roleLower === "admin" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");
          const isOperationManager =
            roleLower === "operationmanager" ||
            deptLower.includes("operation manager") ||
            roleLower.includes("operation manager");
          const isSocialMedia =
            deptLower.includes("social media") ||
            deptLower.includes("social manager") ||
            deptLower.includes("smm") ||
            roleLower.includes("social media") ||
            roleLower === "socialmediamanager";

          if (!isAdmin && !isOperationManager && !isSocialMedia) {
            return false;
          }
        }

        // Hide Chat when admin is impersonating another user
        if (item.name === "Chat" && originalAdminUser) {
          return false;
        }

        if (role === "admin" || role === "operationmanager" || role === "operation manager") return true;
        if (item.permissionKey === "manage_clients") return true;
        if (!item.permissionKey) return true;
        const perm = currentUser?.permissions?.[item.permissionKey];
        if (perm === true) return true; // legacy
        return perm?.read;
      });
  }, [role, currentUser, originalAdminUser]);

  const isCurrentCalendarRoute = React.useMemo(() => {
    const p = (location.pathname || "").toLowerCase();
    return p.includes("shootcalendor") || p.includes("content-calendar") || p.includes("event-calendar");
  }, [location.pathname]);

  const [openDropdowns, setOpenDropdowns] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_open_dropdowns_v2");
      if (saved) return JSON.parse(saved);
      const calSaved = localStorage.getItem("sidebar_calendar_open");
      return {
        "All Calendar": calSaved !== null ? JSON.parse(calSaved) : true,
        Tasks: true,
      };
    } catch {
      return { "All Calendar": true, Tasks: true };
    }
  });

  const toggleDropdown = React.useCallback((name) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_open_dropdowns_v2", JSON.stringify(openDropdowns));
    } catch {}
  }, [openDropdowns]);

  // Auto-expand dropdown when navigating to a child page
  useEffect(() => {
    const p = (location.pathname || "").toLowerCase();
    setOpenDropdowns((prev) => {
      let changed = false;
      const next = { ...prev };
      if (p.includes("shootcalendor") || p.includes("content-calendar") || p.includes("event-calendar")) {
        if (!next["All Calendar"]) {
          next["All Calendar"] = true;
          changed = true;
        }
      }
      if (
        p.includes("sm-tasks") ||
        p.includes("designer-tasks") ||
        p.includes("cinematographer-tasks") ||
        p.endsWith("/tasks")
      ) {
        if (!next["Tasks"]) {
          next["Tasks"] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname]);

  const [isPortfoliosListOpen, setIsPortfoliosListOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_portfolios_open");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isSmePortfoliosListOpen, setIsSmePortfoliosListOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_sme_portfolios_open");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [expandedPortfolios, setExpandedPortfolios] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_expanded_portfolios");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const userDropdownRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebar_portfolios_open",
        JSON.stringify(isPortfoliosListOpen),
      );
    } catch (e) {
      console.error(e);
    }
  }, [isPortfoliosListOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebar_sme_portfolios_open",
        JSON.stringify(isSmePortfoliosListOpen),
      );
    } catch (e) {
      console.error(e);
    }
  }, [isSmePortfoliosListOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebar_expanded_portfolios",
        JSON.stringify(expandedPortfolios),
      );
    } catch (e) {
      console.error(e);
    }
  }, [expandedPortfolios]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showUserDropdown) {
      const timer = setTimeout(() => setUserSearchQuery(""), 200);
      return () => clearTimeout(timer);
    }
  }, [showUserDropdown]);

  useEffect(() => {
    setShowUserDropdown(false);
    setUserSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    if (activePortfolioId) {
      const parentPortfolio = (portfolios || []).find(
        (p) => p._id === activePortfolioId,
      );
      const userName = parentPortfolio?.createdBy?.name;
      const folderId = userName ? `user-folder-${userName}` : null;

      setExpandedPortfolios((prev) => ({
        ...prev,
        [activePortfolioId]: true,
        ...(folderId ? { [folderId]: true } : {}),
      }));
    } else if (
      activeProjectId &&
      (projects || []).length > 0 &&
      (portfolios || []).length > 0
    ) {
      const parentPortfolio = portfolios.find((p) => {
        const ids = (p.projectIds || []).map((pId) =>
          typeof pId === "object" && pId !== null ? pId._id : pId,
        );
        return ids.includes(activeProjectId);
      });
      if (parentPortfolio) {
        const userName = parentPortfolio.createdBy?.name;
        const folderId = userName ? `user-folder-${userName}` : null;

        setExpandedPortfolios((prev) => ({
          ...prev,
          [parentPortfolio._id]: true,
          ...(folderId ? { [folderId]: true } : {}),
        }));
      }
    }
  }, [activePortfolioId, activeProjectId, projects, portfolios]);

  const fetchedUserRef = React.useRef(null);
  useEffect(() => {
    const currentUserId = currentUser?._id || currentUser?.id;
    if (currentUserId && fetchedUserRef.current !== currentUserId) {
      fetchedUserRef.current = currentUserId;
      dispatch(getProjects());
      dispatch(getPortfolios());
      dispatch(getClients());
      if (role === "admin") {
        dispatch(getUsers());
      }
    }
  }, [dispatch, role, currentUser?._id, currentUser?.id]);

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
        window.location.href = "/admin";
      } else if (targetRole === "operationmanager") {
        window.location.href = "/operationmanager";
      } else if (targetRole === "humanresource" || targetRole === "hr") {
        window.location.href = "/humanresource";
      } else {
        window.location.href = "/team";
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

    window.location.href = "/admin";
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logout Success");
    navigate("/");
  };

  const [hoveredPortalItem, setHoveredPortalItem] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const isChildActive = (childPath) => {
    if (!childPath) return false;
    const current = (location.pathname || "").toLowerCase().split("?")[0].replace(/\/+$/, "");
    const target = childPath.toLowerCase().split("?")[0].replace(/\/+$/, "");
    if (current === target) return true;
    if (target.includes("sm-tasks") && current.includes("sm-tasks")) return true;
    if (target.includes("designer-tasks") && current.includes("designer-tasks")) return true;
    if (target.includes("cinematographer-tasks") && current.includes("cinematographer-tasks")) return true;
    if (target.endsWith("/tasks") && current.endsWith("/tasks")) return true;
    if (target.includes("shootcalendor") && current.includes("shootcalendor")) return true;
    if (target.includes("content-calendar") && current.includes("content-calendar")) return true;
    if (target.includes("event-calendar") && current.includes("event-calendar")) return true;
    return false;
  };

  const isItemActive = (item) => {
    if (!item) return false;
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => isChildActive(child.path));
    }
    const current = (location.pathname || "").toLowerCase().split("?")[0].replace(/\/+$/, "");
    const target = (item.path || "").toLowerCase().split("?")[0].replace(/\/+$/, "");
    if (
      target === "/admin" ||
      target === "/operationmanager" ||
      target === "/humanresource" ||
      target === "/team"
    ) {
      return current === target;
    }
    return current === target || current.startsWith(target + "/");
  };

  const getItemBadgeCount = (itemName) => {
    if (itemName === "Notifications") return unreadCount;
    if (itemName === "Chat") return totalUnreadChatCount;
    if (itemName === "Client Calls") {
      return (notifications || []).filter((n) => !n.isRead && n.type === "client_call_created").length;
    }
    if (itemName === "MOM Points") return unreadMomCount;
    if (itemName === "Reports" && (role === "admin" || role === "operationmanager")) {
      return newReportsCount;
    }
    return 0;
  };

  const handleItemMouseEnter = (e, item, isDropdown = false, badgeCount = 0) => {
    if (sidebarOpen || window.innerWidth < 1024) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredPortalItem({
      item,
      rect,
      isDropdown,
      badgeCount,
    });
  };

  const handleItemMouseLeave = () => {
    if (sidebarOpen || window.innerWidth < 1024) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPortalItem(null);
    }, 150);
  };

  const handleItemClick = (item) => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
    if (item.name === "Chat") {
      dispatch(clearAllUnreadCounts());
      dispatch(markAllChatAsRead());
    }
    if (item.name === "Client Calls") {
      if (notifications) {
        notifications.forEach((n) => {
          if (!n.isRead && n.type === "client_call_created") {
            dispatch(markAsRead(n._id));
          }
        });
      }
    }
    if (item.name === "MOM Points") {
      if (notifications) {
        notifications.forEach((n) => {
          if (!n.isRead && ["mom_created", "mom_assigned", "mom_updated", "mom_overdue"].includes(n.type)) {
            dispatch(markAsRead(n._id));
          }
        });
      }
    }
    setHoveredPortalItem(null);
  };

  const topCardNames =
    role === "operationmanager"
      ? [
        "Home",
        "Sticky Notes",
        "Chat",
        "Users",
        "Reports",
        "Client Calls",
        "MOM Points",
        "SM Credentials",
      ]
      : [
        "Home",
        "Sticky Notes",
        "Chat",
        "Users",
        "SM Credentials",
        "Client Calls",
        "MOM Points",
        "Reports",
      ];

  const renderCollapsedMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const badgeCount = getItemBadgeCount(item.name);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div
          key={item.name}
          className="relative flex items-center justify-center my-0.5 w-full"
          onMouseEnter={(e) => handleItemMouseEnter(e, item, true, badgeCount)}
          onMouseLeave={handleItemMouseLeave}
        >
          <button
            type="button"
            onClick={() => {
              if (item.children?.[0]?.path) {
                navigate(item.children[0].path);
                setHoveredPortalItem(null);
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-slate-900/20 dark:shadow-black/50"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
            }`}
            title={item.name}
          >
            <Icon size={17} />
            {/* Active left bar */}
            {isActive && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full theme-bg-accent shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            )}
            {/* Tiny dropdown indicator dot */}
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 opacity-70" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={item.path || item.name}
        className="relative flex items-center justify-center my-0.5 w-full"
        onMouseEnter={(e) => handleItemMouseEnter(e, item, false, badgeCount)}
        onMouseLeave={handleItemMouseLeave}
      >
        <NavLink
          to={item.path}
          onMouseEnter={() => preloadRoute(item.path)}
          onClick={() => handleItemClick(item)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all duration-200 ${
            isActive
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-slate-900/20 dark:shadow-black/50"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
          }`}
          title={item.name}
        >
          <Icon size={17} />
          {/* Active left bar */}
          {isActive && (
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full theme-bg-accent shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          )}
          {/* Badge counter */}
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0b0c10] shadow-sm animate-pulse">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </NavLink>
      </div>
    );
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
          fixed top-0 left-0 z-[100] h-[100dvh]
          sidebar-bg
          backdrop-blur-xl
          shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0 w-64 max-w-[80vw] lg:w-52"
              : "-translate-x-full lg:translate-x-0 w-64 max-w-[80vw] lg:w-16"
          }
        `}
      >
        {/* HEADER */}
        <div
          className={`flex items-center shrink-0 border-b border-slate-200/50 dark:border-white/5 transition-all duration-300 ${
            sidebarOpen ? "justify-between px-4 py-3.5" : "justify-center py-3 px-1.5"
          }`}
        >
          {sidebarOpen ? (
            <>
              {/* LOGO */}
              <div
                onClick={() => navigate(`/${role}`)}
                className="cursor-pointer transition-transform active:scale-95 flex items-center px-1"
                title="Sorted Logo"
              >
                <img
                  src={isDark ? darkSortedLogo : sortedLogo}
                  alt="Sorted Logo"
                  className="h-10 w-auto object-contain drop-shadow-sm"
                />
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-8 h-8 rounded-lg bg-white dark:bg-[#0b0c10] hover:bg-slate-50 flex items-center justify-center transition-all border border-slate-200 dark:border-white/5"
              >
                <FiX size={18} className="text-slate-900 dark:text-white" />
              </button>
            </>
          ) : (
            /* COLLAPSED ICON LOGO - SORTED.PNG IMAGE */
            <div
              onClick={() => navigate(`/${role}`)}
              onMouseEnter={(e) =>
                handleItemMouseEnter(e, { name: "Sorted Dashboard" }, false, 0)
              }
              onMouseLeave={handleItemMouseLeave}
              className="group/logo w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/5"
              title="Sorted - Go to Dashboard"
            >
              <img
                src="/sorted.png"
                alt="Sorted Logo"
                className="w-8 h-8 object-contain drop-shadow-md transition-transform duration-200 group-hover/logo:scale-110 active:scale-95"
              />
            </div>
          )}
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-px sidebar-scrollbar">
          {(() => {
            let hasRenderedPortfoliosList = false;

            const renderPortfolioDropdown = (
              title,
              icon,
              isOpen,
              setIsOpen,
              list,
              groupByUser = false,
            ) => {
              if (title === "My Projects" || title === "My Project") {
                if (!projects || projects.length === 0) return null;
              } else {
                if (!list || list.length === 0) return null;
              }

              const renderPortfolioItems = (portfoliosToRender) => {
                return portfoliosToRender.map((portfolio) => {
                  const isActive = activePortfolioId === portfolio._id;
                  const portfolioProjects = (projects || []).filter((proj) => {
                    const ids = (portfolio.projectIds || []).map((pId) =>
                      typeof pId === "object" && pId !== null ? pId._id : pId,
                    );
                    return ids.includes(proj._id);
                  });

                  return (
                    <div key={portfolio._id} className="w-full text-left">
                      {/* Portfolio Row */}
                      <div className="flex items-center justify-between group rounded-lg transition-all duration-150 relative w-full text-left">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                            navigate(`/${role}/portfolio?id=${portfolio._id}`);
                            setExpandedPortfolios((prev) => ({
                              ...prev,
                              [portfolio._id]: isActive
                                ? !prev[portfolio._id]
                                : true,
                            }));
                          }}
                          className={`flex-1 flex items-center gap-2 text-left text-xs lg:text-[0.6875rem] py-1.5 px-2 transition-all duration-150 rounded-lg border ${isActive
                              ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-black shadow-sm border-slate-900/5 dark:border-white/5"
                              : "text-slate-700 dark:text-slate-300 font-semibold border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5"
                            }`}
                          title={portfolio.name}
                        >
                          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                            <svg
                              viewBox="0 0 240 180"
                              className="w-3.5 h-3 shrink-0"
                              style={{ fill: portfolio.color || "#ff80bf" }}
                            >
                              <path d="M 16 0 A 16 16 0 0 0 0 16 L 0 144 A 16 16 0 0 0 16 160 L 224 160 A 16 16 0 0 0 240 144 L 240 48 A 16 16 0 0 0 224 32 L 120 32 L 96 6 A 16 16 0 0 0 80 0 Z" />
                            </svg>
                          </div>
                          <span className="truncate flex-1 text-left">
                            {portfolio.name}
                          </span>
                          {isActive && !portfolioProjects.length && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white shrink-0" />
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
                            className={`py-1.5 px-1.5 rounded-r-lg transition-all duration-150 flex items-center justify-center cursor-pointer ${isActive
                                ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5"
                              }`}
                          >
                            <svg
                              className={`w-3 h-3 shrink-0 transform transition-transform duration-200 ${expandedPortfolios[portfolio._id]
                                  ? "rotate-180"
                                  : ""
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
                      {portfolioProjects.length > 0 &&
                        expandedPortfolios[portfolio._id] && (
                          <div className="ml-2.5 pl-2 border-l border-slate-200/60 dark:border-white/10 space-y-0.5 my-0.5 text-left">
                            {portfolioProjects.map((project) => {
                              const isProjectActive =
                                activeProjectId === project._id;
                              const _clientId1 =
                                project.client?._id || project.client;
                              const _clientObj1 =
                                clients.find((c) => c._id === _clientId1) ||
                                null;
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
                                  className={`w-full flex items-center gap-2 text-left text-[11px] lg:text-[0.625rem] font-semibold py-1 px-1.5 rounded-md transition-all duration-150 cursor-pointer ${isProjectActive
                                      ? "bg-slate-100 dark:bg-slate-800/80 theme-text-accent font-bold"
                                      : "text-slate-500 dark:text-white/80 hover:theme-text-accent hover:bg-slate-100/50 dark:hover:bg-white/5"
                                    }`}
                                  title={project.name}
                                >
                                  <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                                    <ProjectIcon
                                      client={_clientObj1}
                                      name={project.name}
                                      size="sm"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left">
                                    <span className="truncate text-left block w-full">
                                      {project.name}
                                    </span>
                                    {_clientObj1 && (
                                      <span
                                        className="text-[8px] font-bold truncate block w-fit max-w-full rounded px-1.5 py-0.5 leading-tight text-left self-start"
                                        style={{
                                          color: _clientObj1.color || "#6366f1",
                                          backgroundColor: `${_clientObj1.color || "#6366f1"}18`,
                                        }}
                                      >
                                        {_clientObj1.companyName}
                                      </span>
                                    )}
                                  </div>
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
                });
              };

              let content;
              if (groupByUser) {
                const groupedUsers = {};
                list.forEach((p) => {
                  const userName = p.createdBy?.name || "Unknown User";
                  if (!groupedUsers[userName])
                    groupedUsers[userName] = new Set();
                  (p.projectIds || []).forEach((pId) => {
                    const id =
                      typeof pId === "object" && pId !== null ? pId._id : pId;
                    if (id) groupedUsers[userName].add(id);
                  });
                });

                content = Object.entries(groupedUsers).map(
                  ([userName, projIdSet]) => {
                    const folderId = `user-folder-${userName}`;
                    const userProjects = (projects || []).filter((proj) =>
                      projIdSet.has(proj._id),
                    );

                    return (
                      <div key={folderId} className="mb-0.5 text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPortfolios((prev) => ({
                              ...prev,
                              [folderId]: !prev[folderId],
                            }));
                          }}
                          className="w-full flex items-center gap-2 text-left text-xs lg:text-[0.6875rem] font-bold py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/5 text-slate-600 dark:text-white/90 group transition-all"
                        >
                          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                            <svg
                              className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                          </div>
                          <span className="truncate flex-1 text-left group-hover:theme-text-accent">
                            {userName}
                          </span>
                          <svg
                            className={`w-3 h-3 shrink-0 transform transition-transform duration-200 ${expandedPortfolios[folderId] ? "rotate-180" : ""
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
                        {expandedPortfolios[folderId] && (
                          <div className="ml-2.5 pl-2 border-l border-slate-200/60 dark:border-white/10 mt-0.5 space-y-0.5 text-left">
                            {userProjects.length > 0 ? (
                              userProjects.map((project) => {
                                const isProjectActive =
                                  activeProjectId === project._id;
                                const _clientId2 =
                                  project.client?._id || project.client;
                                const _clientObj2 =
                                  clients.find((c) => c._id === _clientId2) ||
                                  null;
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
                                    className={`w-full flex items-center gap-2 text-left text-[11px] lg:text-[0.625rem] font-semibold py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer ${isProjectActive
                                        ? "bg-slate-100 dark:bg-slate-800/80 theme-text-accent font-bold"
                                        : "text-slate-600 dark:text-white hover:theme-text-accent hover:bg-slate-100/50 dark:hover:bg-white/5"
                                      }`}
                                    title={project.name}
                                  >
                                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                                      <ProjectIcon
                                        client={_clientObj2}
                                        name={project.name}
                                        size="sm"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left">
                                      <span className="truncate text-left block w-full">
                                        {project.name}
                                      </span>
                                      {_clientObj2 && (
                                        <span
                                          className="text-[8px] font-bold truncate block w-fit max-w-full rounded px-1.5 py-0.5 leading-tight text-left self-start"
                                          style={{
                                            color:
                                              _clientObj2.color || "#6366f1",
                                            backgroundColor: `${_clientObj2.color || "#6366f1"}18`,
                                          }}
                                        >
                                          {_clientObj2.companyName}
                                        </span>
                                      )}
                                    </div>
                                    {isProjectActive && (
                                      <span className="w-1.5 h-1.5 rounded-full theme-bg-accent shrink-0" />
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="text-[10px] text-slate-400 px-2 py-1 italic">
                                No projects found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  },
                );
              } else {
                // If title is Works or My Projects, list projects directly without middle portfolio folders
                if (
                  title === "Works" ||
                  title === "My Projects" ||
                  title === "My Project" ||
                  title === "Portfolios"
                ) {
                  let matchedProjects = [];
                  if (title === "My Projects" || title === "My Project") {
                    matchedProjects = projects || [];
                  } else {
                    const allProjectIds = new Set();
                    list.forEach((port) => {
                      (port.projectIds || []).forEach((pId) => {
                        const id =
                          typeof pId === "object" && pId !== null
                            ? pId._id
                            : pId;
                        if (id) allProjectIds.add(id);
                      });
                    });

                    matchedProjects = (projects || []).filter((proj) =>
                      allProjectIds.has(proj._id),
                    );
                  }

                  content =
                    matchedProjects.length > 0 ? (
                      <div className="space-y-0.5 my-0.5 text-left">
                        {matchedProjects.map((project) => {
                          const isProjectActive =
                            activeProjectId === project._id;
                          const _clientId3 =
                            project.client?._id || project.client;
                          const _clientObj3 =
                            clients.find((c) => c._id === _clientId3) || null;
                          return (
                            <button
                              key={project._id}
                              type="button"
                              onClick={() => {
                                if (window.innerWidth < 1024)
                                  setSidebarOpen(false);
                                navigate(`/${role}/projects?id=${project._id}`);
                              }}
                              className={`w-full flex items-center gap-2 text-left text-[11px] lg:text-[0.625rem] font-semibold py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer ${isProjectActive
                                  ? "bg-slate-100 dark:bg-slate-800/80 theme-text-accent font-bold"
                                  : "text-slate-600 dark:text-white hover:theme-text-accent hover:bg-slate-100/50 dark:hover:bg-white/5"
                                }`}
                              title={project.name}
                            >
                              <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                                <ProjectIcon
                                  client={_clientObj3}
                                  name={project.name}
                                  size="sm"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left">
                                <span className="truncate text-left block w-full">
                                  {project.name}
                                </span>
                                {_clientObj3 && (
                                  <span
                                    className="text-[8px] font-bold truncate block w-fit max-w-full rounded px-1.5 py-0.5 leading-tight text-left self-start"
                                    style={{
                                      color: _clientObj3.color || "#6366f1",
                                      backgroundColor: `${_clientObj3.color || "#6366f1"}18`,
                                    }}
                                  >
                                    {_clientObj3.companyName}
                                  </span>
                                )}
                              </div>
                              {isProjectActive && (
                                <span className="w-1.5 h-1.5 rounded-full theme-bg-accent shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 px-2 py-1 italic">
                        No projects found
                      </div>
                    );
                } else {
                  content = renderPortfolioItems(list);
                }
              }

              return (
                <div className="my-0.5 text-left">
                  {/* Dropdown Header Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 lg:py-1.5 text-left rounded-xl border border-transparent hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer group text-slate-500 dark:text-white hover:theme-text-accent"
                  >
                    <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100/70 dark:bg-white/5 group-hover:bg-[var(--accent-light-bg-subtle)] dark:group-hover:bg-[var(--accent-dark-bg-subtle)] transition-colors">
                      {icon}
                    </div>
                    <span className="text-xs lg:text-[0.625rem] font-bold uppercase tracking-wider whitespace-nowrap truncate flex-1 text-left transition-colors">
                      {title}
                    </span>
                    <svg
                      className={`w-3 h-3 shrink-0 transform transition-transform duration-200 transition-colors ${isOpen ? "rotate-180" : ""
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
                  {isOpen && (
                    <div className="ml-3 pl-2 border-l border-slate-200/60 dark:border-white/10 space-y-0.5 overflow-y-auto max-h-[18.75rem] sidebar-scrollbar mt-0.5 text-left">
                      {content}
                    </div>
                  )}
                </div>
              );
            };

            const renderPortfoliosList = () => {
              return null;
            };

            const renderMenuItem = (item) => {
              const Icon = item.icon;
              const isPortfoliosItem = item.name === "Portfolio";

              if (item.children && item.children.length > 0) {
                const isChildActive = (childPath) => {
                  if (!childPath) return false;
                  const current = (location.pathname || "").toLowerCase().split("?")[0].replace(/\/+$/, "");
                  const target = childPath.toLowerCase().split("?")[0].replace(/\/+$/, "");
                  if (current === target) return true;
                  if (target.includes("sm-tasks") && current.includes("sm-tasks")) return true;
                  if (target.includes("designer-tasks") && current.includes("designer-tasks")) return true;
                  if (target.includes("cinematographer-tasks") && current.includes("cinematographer-tasks")) return true;
                  if (target.endsWith("/tasks") && current.endsWith("/tasks")) return true;
                  if (target.includes("shootcalendor") && current.includes("shootcalendor")) return true;
                  if (target.includes("content-calendar") && current.includes("content-calendar")) return true;
                  if (target.includes("event-calendar") && current.includes("event-calendar")) return true;
                  return false;
                };

                const isAnyChildActive = item.children.some((child) => isChildActive(child.path));
                const isDropdownOpen = !!openDropdowns[item.name];

                return (
                  <div key={item.name} className="my-0.5 text-left">
                    {/* Dropdown Header Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.name)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 lg:py-1.5 rounded-xl border transition-all duration-200 cursor-pointer group text-left ${
                        isAnyChildActive
                          ? "bg-slate-900/10 dark:bg-white/20 shadow-sm border-slate-900/5 dark:border-white/10"
                          : "hover:bg-slate-900/5 dark:hover:bg-white/10 border-transparent text-slate-700 dark:text-white"
                      }`}
                    >
                      <motion.div
                        className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${
                          isAnyChildActive
                            ? "bg-slate-900 dark:bg-white shadow-md shadow-slate-900/20 dark:shadow-black/50"
                            : "bg-slate-900/5 dark:bg-white/10 group-hover:bg-slate-900/10 dark:group-hover:bg-white/20"
                        }`}
                        whileHover={{
                          scale: 1.22,
                          rotate: [0, -10, 7, -4, 0],
                          y: -1,
                          boxShadow:
                            "0 0 0 3px rgba(99,102,241,0.25), 0 0 12px rgba(99,102,241,0.15)",
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{
                          scale: {
                            type: "spring",
                            stiffness: 500,
                            damping: 14,
                          },
                          rotate: { duration: 0.38, ease: "easeInOut" },
                          y: {
                            type: "spring",
                            stiffness: 500,
                            damping: 18,
                          },
                          boxShadow: { duration: 0.25 },
                        }}
                      >
                        <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_70%)]" />
                        <Icon
                          size={14}
                          className={`transition-colors duration-200 relative z-10 ${
                            isAnyChildActive
                              ? "text-white dark:text-slate-900"
                              : "text-slate-700 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white"
                          }`}
                        />
                      </motion.div>

                      <span
                        className={`text-xs lg:text-[0.6875rem] truncate flex-1 text-left transition-colors duration-200 ${
                          isAnyChildActive
                            ? "text-slate-900 dark:text-white font-black"
                            : "text-slate-700 dark:text-white font-bold group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}
                      >
                        {item.name}
                      </span>

                      <svg
                        className={`w-3.5 h-3.5 shrink-0 transform transition-transform duration-200 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ${
                          isDropdownOpen ? "rotate-180" : ""
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

                    {/* Children List */}
                    <AnimatePresence initial={false}>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 dark:border-white/10 space-y-0.5 my-1 text-left">
                            {item.children.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = isChildActive(subItem.path);

                              return (
                                <NavLink
                                  key={subItem.path}
                                  to={subItem.path}
                                  onMouseEnter={() => preloadRoute(subItem.path)}
                                  onClick={() => {
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                  }}
                                  className="block rounded-lg transition-all duration-150 relative group"
                                >
                                  <div
                                    className={`flex items-center gap-2 px-2.5 py-1.5 w-full rounded-lg text-left transition-all duration-150 border ${
                                      isSubActive
                                        ? "bg-slate-900/10 dark:bg-white/20 shadow-xs border-slate-900/5 dark:border-white/10 font-bold"
                                        : "hover:bg-slate-900/5 dark:hover:bg-white/10 border-transparent text-slate-600 dark:text-white/80"
                                    }`}
                                  >
                                    {isSubActive && (
                                      <span className="w-1.5 h-1.5 rounded-full theme-bg-accent shrink-0" />
                                    )}
                                    <SubIcon
                                      size={13}
                                      className={`shrink-0 transition-colors ${
                                        isSubActive
                                          ? "text-slate-900 dark:text-white"
                                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                      }`}
                                    />
                                    <span
                                      className={`text-[11px] lg:text-[0.6875rem] truncate flex-1 text-left ${
                                        isSubActive
                                          ? "text-slate-900 dark:text-white font-bold"
                                          : "text-slate-650 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white"
                                      }`}
                                    >
                                      {subItem.name}
                                    </span>
                                  </div>
                                </NavLink>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <React.Fragment key={item.path}>
                  <NavLink
                    to={item.path}
                    onMouseEnter={() => preloadRoute(item.path)}
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                      if (item.name === "Chat") {
                        dispatch(clearAllUnreadCounts());
                        dispatch(markAllChatAsRead());
                      }
                      if (item.name === "Client Calls") {
                        if (notifications) {
                          notifications.forEach((n) => {
                            if (!n.isRead && n.type === "client_call_created") {
                              dispatch(markAsRead(n._id));
                            }
                          });
                        }
                      }
                      if (item.name === "MOM Points") {
                        if (notifications) {
                          notifications.forEach((n) => {
                            if (!n.isRead && ["mom_created", "mom_assigned", "mom_updated", "mom_overdue"].includes(n.type)) {
                              dispatch(markAsRead(n._id));
                            }
                          });
                        }
                      }
                    }}
                    end={
                      item.path === "/admin" ||
                      item.path === "/operationmanager" ||
                      item.path === "/humanresource" ||
                      item.path === "/team"
                    }
                    className={({ isActive }) => {
                      return `block rounded-xl transition-all duration-200 relative group ${isActive ? "" : ""}`;
                    }}
                  >
                    {({ isActive }) => (
                      <motion.div
                        className={`flex items-center gap-2.5 px-3 py-2 lg:py-1.5 w-full rounded-xl relative overflow-hidden transition-all duration-200 text-left border ${isActive
                            ? "bg-slate-900/10 dark:bg-white/20 shadow-sm border-slate-900/5 dark:border-white/10"
                            : "hover:bg-slate-900/5 dark:hover:bg-white/10 border-transparent"
                          }`}
                        whileHover={{ x: 2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        {/* Active left accent bar */}
                        {isActive && (
                          <motion.span
                            layoutId="activeBar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4.5 rounded-r-full theme-bg-accent"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                          />
                        )}

                        {/* Icon wrapper — fixed w-6 h-6 ensures all icons align on same column */}
                        <motion.div
                          className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${isActive
                              ? "bg-slate-900 dark:bg-white shadow-md shadow-slate-900/20 dark:shadow-black/50"
                              : "bg-slate-900/5 dark:bg-white/10 group-hover:bg-slate-900/10 dark:group-hover:bg-white/20"
                            }`}
                          whileHover={{
                            scale: 1.22,
                            rotate: [0, -10, 7, -4, 0],
                            y: -1,
                            boxShadow:
                              "0 0 0 3px rgba(99,102,241,0.25), 0 0 12px rgba(99,102,241,0.15)",
                          }}
                          whileTap={{ scale: 0.85 }}
                          transition={{
                            scale: {
                              type: "spring",
                              stiffness: 500,
                              damping: 14,
                            },
                            rotate: { duration: 0.38, ease: "easeInOut" },
                            y: {
                              type: "spring",
                              stiffness: 500,
                              damping: 18,
                            },
                            boxShadow: { duration: 0.25 },
                          }}
                        >
                          {/* Shimmer burst on hover */}
                          <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_70%)]" />
                          <Icon
                            size={14}
                            className={`transition-colors duration-200 relative z-10 ${isActive
                                ? "text-white dark:text-slate-900"
                                : "text-slate-700 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white"
                              }`}
                          />
                        </motion.div>

                        {/* Label */}
                        <span
                          className={`text-xs lg:text-[0.6875rem] truncate flex-1 text-left transition-colors duration-200 ${isActive
                              ? "text-slate-900 dark:text-white font-black"
                              : "text-slate-700 dark:text-white font-bold group-hover:text-slate-900 dark:group-hover:text-white"
                            }`}
                        >
                          {item.name}
                        </span>

                        {/* Notification badges */}
                        {item.name === "Notifications" && unreadCount > 0 && (
                          <span className="min-w-[1rem] h-[1rem] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[0.5625rem] font-bold animate-pulse shrink-0">
                            {unreadCount}
                          </span>
                        )}
                        {item.name === "Chat" && totalUnreadChatCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[10px] font-black text-white shadow-sm shadow-rose-500/40 animate-pulse shrink-0">
                            {totalUnreadChatCount > 99 ? "99+" : totalUnreadChatCount}
                          </span>
                        )}
                        {item.name === "Client Calls" &&
                          (notifications
                            ? notifications.filter(
                              (n) =>
                                !n.isRead &&
                                n.type === "client_call_created",
                            ).length
                            : 0) > 0 && (
                            <span className="flex h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 px-1 text-[0.5625rem] font-black text-white shadow-xs shrink-0 animate-pulse">
                              {notifications
                                ? notifications.filter(
                                  (n) =>
                                    !n.isRead &&
                                    n.type === "client_call_created",
                                ).length
                                : 0}
                            </span>
                          )}
                        {item.name === "MOM Points" && unreadMomCount > 0 && (
                          <span className="flex h-[1rem] min-w-[1.4rem] items-center gap-0.5 justify-center rounded-full bg-rose-500 px-1 text-[0.5625rem] font-black text-white shadow-xs shrink-0 animate-pulse">
                            <span>{unreadMomCount > 99 ? "99+" : unreadMomCount}</span>
                            <span className="text-[0.45rem] uppercase tracking-wider">New</span>
                          </span>
                        )}
                        {item.name === "Reports" &&
                          (role === "admin" || role === "operationmanager") &&
                          newReportsCount > 0 && (
                            <span className="flex h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 px-1 text-[0.5625rem] font-black text-white shadow-xs shrink-0 animate-pulse">
                              {newReportsCount}
                            </span>
                          )}

                        {/* Active dot (for items without badge) */}
                        {isActive &&
                          !unreadCount &&
                          item.name !== "Notifications" &&
                          item.name !== "Chat" &&
                          !(
                            item.name === "Client Calls" &&
                            (notifications
                              ? notifications.filter(
                                (n) =>
                                  !n.isRead &&
                                  n.type === "client_call_created",
                              ).length
                              : 0) > 0
                          ) &&
                          !(
                            item.name === "MOM Points" &&
                            unreadMomCount > 0
                          ) &&
                          !(
                            item.name === "Reports" &&
                            (role === "admin" || role === "operationmanager") &&
                            newReportsCount > 0
                          ) && (
                            <motion.span
                              className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white shrink-0"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 20,
                              }}
                            />
                          )}
                      </motion.div>
                    )}
                  </NavLink>

                  {isPortfoliosItem &&
                    ((portfolios && portfolios.length > 0) ||
                      (projects && projects.length > 0)) &&
                    (() => {
                      hasRenderedPortfoliosList = true;
                      return renderPortfoliosList();
                    })()}
                </React.Fragment>
              );
            };

            const isGroupedRole = true;

            const topCardNames =
              role === "operationmanager"
                ? [
                  "Home",
                  "Sticky Notes",
                  "Chat",
                  "Users",
                  "Reports",
                  "Client Calls",
                  "MOM Points",
                  "SM Credentials",
                ]
                : [
                  "Home",
                  "Sticky Notes",
                  "Chat",
                  "Users",
                  "SM Credentials",
                  "Client Calls",
                  "MOM Points",
                  "Reports",
                ];

            return (
              <>
                {!sidebarOpen ? (
                  <div className="flex flex-col items-center space-y-1 py-1">
                    {/* Core Group */}
                    <div className="flex flex-col items-center space-y-0.5 w-full">
                      {menuItems
                        .filter((item) => topCardNames.includes(item.name))
                        .map((item) => renderCollapsedMenuItem(item))}
                    </div>

                    {/* Subtle divider */}
                    <div className="w-8 h-px bg-slate-200/70 dark:bg-white/10 my-1.5" />

                    {/* Secondary Group */}
                    <div className="flex flex-col items-center space-y-0.5 w-full">
                      {menuItems
                        .filter((item) => !topCardNames.includes(item.name))
                        .map((item) => renderCollapsedMenuItem(item))}
                    </div>
                  </div>
                ) : isGroupedRole ? (
                  <div className="space-y-4">
                    {/* General / Core Group */}
                    <div className="space-y-1">
                      <div className="border border-slate-200/60 dark:border-white/5 bg-slate-50/30 dark:bg-slate-50 shadow-xl rounded-2xl p-1.5 space-y-0.5 shadow-sm">
                        {menuItems
                          .filter((item) => topCardNames.includes(item.name))
                          .map((item) => renderMenuItem(item))}
                      </div>
                    </div>

                    {/* normal group*/}
                    <div className="space-y-1">
                      <div className="space-y-0.5">
                        {menuItems
                          .filter((item) => !topCardNames.includes(item.name))
                          .map((item) => renderMenuItem(item))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {menuItems.map((item) => renderMenuItem(item))}
                  </div>
                )}

                {/* Fallback at the bottom if items were not in the menu list */}
                {!hasRenderedPortfoliosList &&
                  ((portfolios && portfolios.length > 0) ||
                    (projects && projects.length > 0)) &&
                  (role === "admin" ||
                    currentUser?.permissions?.manage_portfolios?.read ||
                    currentUser?.permissions?.manage_portfolios === true ||
                    (projects && projects.length > 0)) &&
                  renderPortfoliosList()}
              </>
            );
          })()}
        </nav>
        {/* FOOTER */}
        {!sidebarOpen ? (
          /* COLLAPSED FOOTER */
          <div className="p-2 border-t border-slate-200/60 dark:border-white/5 flex flex-col items-center gap-2 shrink-0 relative z-10">
            {/* Switch Back to Admin — shown when impersonating any user */}
            {originalAdminUser && (
              <button
                type="button"
                onClick={handleSwitchBack}
                className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/70 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={`Switch Back to Admin (${originalAdminUser?.name})`}
                onMouseEnter={(e) =>
                  handleItemMouseEnter(
                    e,
                    { name: `Switch Back (${originalAdminUser?.name})` },
                    false,
                    0,
                  )
                }
                onMouseLeave={handleItemMouseLeave}
              >
                <span className="text-[10px] font-black">
                  {getInitials(originalAdminUser?.name)}
                </span>
              </button>
            )}

            {/* User Avatar / Switch User trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (role === "admin" && !originalAdminUser && users && users.length > 0) {
                    setShowUserDropdown(!showUserDropdown);
                  } else {
                    navigate(`/${role}/profile`);
                  }
                }}
                className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/20 dark:border-indigo-400/20 flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
                title={`${currentUser?.name} (${displayRole(currentUser?.role)})`}
                onMouseEnter={(e) =>
                  handleItemMouseEnter(
                    e,
                    { name: `${currentUser?.name} • ${displayRole(currentUser?.role)}` },
                    false,
                    0,
                  )
                }
                onMouseLeave={handleItemMouseLeave}
              >
                {profile?.profileImage?.url ? (
                  <img
                    src={profile.profileImage.url}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-black">
                    {getInitials(currentUser?.name)}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b0c10]" />
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Logout"
              onMouseEnter={(e) =>
                handleItemMouseEnter(e, { name: "Logout" }, false, 0)
              }
              onMouseLeave={handleItemMouseLeave}
            >
              <FiLogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-200 dark:border-white/5 space-y-1.5 relative z-10">
          {/* Switch Back to Admin — shown when impersonating any user */}
          {originalAdminUser && (
            <button
              type="button"
              onClick={handleSwitchBack}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-500/20 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-300/40 dark:border-indigo-400/20 flex items-center justify-center shrink-0">
                <span className="text-[0.5625rem] font-black text-indigo-600 dark:text-indigo-400">
                  {getInitials(originalAdminUser?.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[0.625rem] font-bold text-indigo-700 dark:text-indigo-300 truncate leading-tight">
                  Switch Back
                </p>
                <p className="text-[0.5rem] font-black text-indigo-500/70 dark:text-indigo-400/60 uppercase tracking-wider leading-none mt-0.5 truncate">
                  {originalAdminUser?.name}
                </p>
              </div>
              <svg
                className="w-3 h-3 text-indigo-400 dark:text-indigo-500 shrink-0 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                />
              </svg>
            </button>
          )}

          {/* Switch User dropdown — shown only for the actual admin (not impersonating) */}
          {role === "admin" &&
            !originalAdminUser &&
            users &&
            users.length > 0 && (
              <div ref={userDropdownRef} className="p-1.5 text-left relative">
                <label className="block text-[10px] lg:text-[0.5rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">
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
                        <span className="text-xs lg:text-[0.5625rem] font-black">
                          {getInitials(currentUser?.name)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs lg:text-[0.625rem] font-bold theme-text-primary truncate leading-tight">
                        {currentUser?.name}
                      </p>
                      <p className="text-[10px] lg:text-[0.5rem] font-medium theme-text-secondary  leading-none mt-0.5">
                        {currentUser?.role === "team"
                          ? currentUser?.department || "Team"
                          : displayRole(currentUser?.role)}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-3 h-3 text-slate-400 dark:text-slate-500 transform transition-transform duration-200 shrink-0 ${showUserDropdown ? "rotate-180" : ""
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

                {/* Dropdown Options List */}
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="absolute bottom-full left-0 right-0 mb-2.5 z-[100] w-full bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 overflow-hidden flex flex-col origin-bottom"
                    >
                      <div className="p-2  border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="p-2 max-h-[22rem] overflow-y-auto sidebar-scrollbar flex flex-col gap-1">
                        {(() => {
                          const filteredUsers = users.filter((u) => {
                            const searchStr = userSearchQuery
                              .toLowerCase()
                              .trim();
                            if (!searchStr) return true;

                            const searchTerms = searchStr.split(/\s+/);
                            const searchableText = [
                              u.name,
                              u.department || "",
                              displayRole(u.role),
                            ]
                              .join(" ")
                              .toLowerCase();

                            return searchTerms.every((term) =>
                              searchableText.includes(term),
                            );
                          });

                          if (filteredUsers.length === 0) {
                            return (
                              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                                No users found matching "{userSearchQuery}"
                              </div>
                            );
                          }

                          // Group by department
                          const groupedUsers = filteredUsers.reduce(
                            (acc, u) => {
                              const dept = u.department || displayRole(u.role);
                              if (!acc[dept]) acc[dept] = [];
                              acc[dept].push(u);
                              return acc;
                            },
                            {},
                          );

                          return Object.entries(groupedUsers).map(
                            ([dept, deptUsers]) => (
                              <div
                                key={dept}
                                className="space-y-0.5 mb-1 last:mb-0"
                              >
                                {deptUsers.map((u) => {
                                  const isCurrent =
                                    u._id ===
                                    (currentUser?._id || currentUser?.id);
                                  return (
                                    <motion.button
                                      key={u._id}
                                      variants={itemVariants}
                                      whileHover={{ scale: 1.02, x: 2 }}
                                      whileTap={{ scale: 0.98 }}
                                      type="button"
                                      onClick={() => {
                                        setShowUserDropdown(false);
                                        if (!isCurrent) {
                                          handleSwitchUser(u._id);
                                        }
                                      }}
                                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-300 cursor-pointer group mb-1 last:mb-0 ${isCurrent
                                          ? "bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-500/10 dark:to-blue-500/5 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                                          : "border border-transparent hover:bg-slate-50/80 dark:hover:bg-white/5 hover:border-slate-200/50 dark:hover:border-white/5 hover:shadow-sm"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        {/* Avatar */}
                                        <div
                                          className={`w-7 h-7 rounded-full shrink-0 overflow-hidden shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${isCurrent
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
                                            <span className="text-xs lg:text-[0.625rem] font-black">
                                              {getInitials(u.name)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className={`text-[11px] lg:text-[0.625rem] font-bold truncate leading-tight transition-colors ${isCurrent
                                                ? "text-indigo-700 dark:text-indigo-300"
                                                : "text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                              }`}
                                          >
                                            {u.name}
                                          </p>
                                          <p className="text-[9px] lg:text-[0.5rem] font-black opacity-70 uppercase tracking-widest mt-[1px] theme-text-secondary truncate">
                                            {u.role === "team"
                                              ? u.department || "Team"
                                              : displayRole(u.role)}
                                          </p>
                                        </div>
                                      </div>
                                      {/* Active Indicator */}
                                      {isCurrent && (
                                        <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            ),
                          );
                        })()}
                      </div>
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
        )}
      </aside>

      {/* FLOATING PORTAL FOR COLLAPSED SIDEBAR TOOLTIPS AND FLYOUTS */}
      {hoveredPortalItem &&
        createPortal(
          hoveredPortalItem.isDropdown ? (() => {
            const FlyoutIcon = hoveredPortalItem.item.icon;
            return (
              <div
                style={{
                  position: "fixed",
                  top: `${Math.max(12, Math.min(hoveredPortalItem.rect.top, window.innerHeight - 340))}px`,
                  left: `${hoveredPortalItem.rect.right + 8}px`,
                  zIndex: 999999,
                }}
                className="w-56 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-indigo-500/10 dark:shadow-black/60 p-2 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                }}
                onMouseLeave={handleItemMouseLeave}
              >
                {/* Header */}
                <div className="px-3 py-1.5 mb-0.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {FlyoutIcon && <FlyoutIcon size={14} className="theme-text-accent" />}
                    <span className="text-xs font-black theme-text-primary tracking-wide">
                      {hoveredPortalItem.item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {hoveredPortalItem.item.children?.length}
                  </span>
                </div>

              {/* Sub items */}
              <div className="space-y-0.5 max-h-[300px] overflow-y-auto sidebar-scrollbar">
                {hoveredPortalItem.item.children?.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = isChildActive(sub.path);
                  return (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      onMouseEnter={() => preloadRoute(sub.path)}
                      onClick={() => {
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                        setHoveredPortalItem(null);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSubActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                          : "text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <SubIcon
                        size={14}
                        className={
                          isSubActive
                            ? "text-white dark:text-slate-900"
                            : "text-slate-400"
                        }
                      />
                      <span className="truncate flex-1 text-left">{sub.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })() : (
            <div
              style={{
                position: "fixed",
                top: `${hoveredPortalItem.rect.top + hoveredPortalItem.rect.height / 2}px`,
                left: `${hoveredPortalItem.rect.right + 10}px`,
                transform: "translateY(-50%)",
                zIndex: 999999,
              }}
              className="pointer-events-none px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-[#151c2e]/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-white/15 flex items-center gap-2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-[#151c2e] border-l border-b border-white/15 rotate-45" />
              <span className="relative z-10">{hoveredPortalItem.item.name}</span>
              {hoveredPortalItem.badgeCount > 0 && (
                <span className="relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {hoveredPortalItem.badgeCount}
                </span>
              )}
            </div>
          ),
          document.body,
        )}

      {/* PORTAL FOR SWITCH USER IN COLLAPSED MODE */}
      {showUserDropdown &&
        !sidebarOpen &&
        createPortal(
          <div
            ref={userDropdownRef}
            style={{
              position: "fixed",
              bottom: "16px",
              left: "72px",
              zIndex: 999999,
            }}
            className="w-72 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 dark:shadow-black/60 overflow-hidden flex flex-col origin-bottom-left animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                autoFocus
              />
            </div>

            <div className="p-2 max-h-[20rem] overflow-y-auto sidebar-scrollbar flex flex-col gap-1">
              {(() => {
                const filteredUsers = users.filter((u) => {
                  const searchStr = userSearchQuery.toLowerCase().trim();
                  if (!searchStr) return true;
                  const searchTerms = searchStr.split(/\s+/);
                  const searchableText = [
                    u.name,
                    u.department || "",
                    displayRole(u.role),
                  ]
                    .join(" ")
                    .toLowerCase();
                  return searchTerms.every((term) =>
                    searchableText.includes(term),
                  );
                });

                if (filteredUsers.length === 0) {
                  return (
                    <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No users found matching "{userSearchQuery}"
                    </div>
                  );
                }

                const groupedUsers = filteredUsers.reduce((acc, u) => {
                  const dept = u.department || displayRole(u.role);
                  if (!acc[dept]) acc[dept] = [];
                  acc[dept].push(u);
                  return acc;
                }, {});

                return Object.entries(groupedUsers).map(([dept, deptUsers]) => (
                  <div key={dept} className="space-y-0.5 mb-1 last:mb-0">
                    {deptUsers.map((u) => {
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
                          className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-300 cursor-pointer group mb-1 last:mb-0 ${
                            isCurrent
                              ? "bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-500/10 dark:to-blue-500/5 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                              : "border border-transparent hover:bg-slate-50/80 dark:hover:bg-white/5 hover:border-slate-200/50 dark:hover:border-white/5 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-full shrink-0 overflow-hidden shadow-sm flex items-center justify-center ${
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
                                <span className="text-xs font-black">
                                  {getInitials(u.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold truncate leading-tight text-slate-700 dark:text-slate-200">
                                {u.name}
                              </p>
                              <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mt-[1px] theme-text-secondary truncate">
                                {u.role === "team"
                                  ? u.department || "Team"
                                  : displayRole(u.role)}
                              </p>
                            </div>
                          </div>
                          {isCurrent && (
                            <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Sidebar;
