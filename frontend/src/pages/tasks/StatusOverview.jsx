import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  isToday,
  isYesterday,
  isSameDay,
  subDays,
  addDays,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
} from "date-fns";
import {
  FiSearch,
  FiX,
  FiFilter,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiLayers,
  FiEye,
  FiTrendingUp,
  FiUser,
  FiMenu,
} from "react-icons/fi";
import { LuListChecks, LuPalette, LuVideo, LuBuilding2, LuFolderKanban } from "react-icons/lu";
import { TbPencilHeart, TbFlame } from "react-icons/tb";

import axiosInstance from "../../services/axiosInstance";
import { useGetTasksQuery } from "../../features/api/apiSlice";
import { getTasks } from "../../features/tasks/taskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";
import ClientBadge from "../../components/common/ClientBadge";
import SearchableDropdown from "../../components/common/SearchableDropdown";

// Helper for avatar URL extraction
const getUserAvatarUrl = (user) => {
  if (!user) return null;
  const url =
    user?.profile?.profileImage?.url ||
    (typeof user?.profile?.profileImage === "string" ? user.profile.profileImage : null) ||
    user?.profileImage?.url ||
    (typeof user?.profileImage === "string" ? user.profileImage : null) ||
    user?.avatar?.url ||
    (typeof user?.avatar === "string" ? user.avatar : null) ||
    user?.profilePic ||
    null;
  return url && typeof url === "string" && url.trim().length > 0 ? url : null;
};

// Format Date nicely
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return "—";
  }
};

// Calculate Total Productivity (accumulated worked time across task, statusHistory, subtasks, and live session)
const calculateTaskTotalProductivity = (task, currentNowMs = Date.now()) => {
  if (!task) return 0;

  let baseTime = Number(task.totalTrackedTime) || 0;
  let historyTime = 0;
  let hasOpenSession = false;
  let openSessionStart = null;

  if (Array.isArray(task.statusHistory) && task.statusHistory.length > 0) {
    task.statusHistory.forEach((h) => {
      const statusLower = (h.status || "").toLowerCase();
      const isProductive =
        statusLower.includes("progress") ||
        (h.status === "On Hold" && (h.reason === "Client Call" || h.reason === "Meeting"));

      if (!isProductive) return;

      if (h.duration && h.duration > 0) {
        historyTime += Number(h.duration);
      } else if (h.endTime && h.startTime) {
        const diff = new Date(h.endTime).getTime() - new Date(h.startTime).getTime();
        if (diff > 0) historyTime += diff;
      } else if (!h.endTime && h.startTime) {
        hasOpenSession = true;
        openSessionStart = new Date(h.startTime).getTime();
      }
    });
  }

  // Use the larger of baseTime or closed historyTime
  let totalMs = Math.max(baseTime, historyTime);

  // If there's an open in-progress session, add live elapsed time
  const statusLower = (task.status || "").toLowerCase();
  const isInProgress = statusLower.includes("progress") && !task.autoPaused;

  if (isInProgress) {
    let liveStart = openSessionStart;
    if (!liveStart && task.actualStartTime) {
      liveStart = new Date(task.actualStartTime).getTime();
    }
    if (liveStart && liveStart > 0 && liveStart < currentNowMs) {
      totalMs += Math.max(0, currentNowMs - liveStart);
    }
  }

  // Also accumulate subtasks' productivity if any
  if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
    task.subtasks.forEach((sub) => {
      let subBase = Number(sub.totalTrackedTime) || 0;
      let subHistory = 0;
      let subOpenStart = null;

      if (Array.isArray(sub.statusHistory)) {
        sub.statusHistory.forEach((sh) => {
          const sLower = (sh.status || "").toLowerCase();
          const isSubProd =
            sLower.includes("progress") ||
            (sh.status === "On Hold" && (sh.reason === "Client Call" || sh.reason === "Meeting"));
          if (!isSubProd) return;

          if (sh.duration && sh.duration > 0) subHistory += Number(sh.duration);
          else if (sh.endTime && sh.startTime) {
            const diff = new Date(sh.endTime).getTime() - new Date(sh.startTime).getTime();
            if (diff > 0) subHistory += diff;
          } else if (!sh.endTime && sh.startTime) {
            subOpenStart = new Date(sh.startTime).getTime();
          }
        });
      }

      let subTotal = Math.max(subBase, subHistory);
      const subStatusLower = (sub.status || "").toLowerCase();
      if (subStatusLower.includes("progress") && !sub.autoPaused) {
        const sLiveStart = subOpenStart || (sub.actualStartTime ? new Date(sub.actualStartTime).getTime() : 0);
        if (sLiveStart && sLiveStart > 0 && sLiveStart < currentNowMs) {
          subTotal += Math.max(0, currentNowMs - sLiveStart);
        }
      }
      totalMs += subTotal;
    });
  }

  return totalMs;
};

// Format ms into clean readable "Xh YYm"
const formatProductivity = (ms = 0) => {
  if (!ms || isNaN(ms) || ms <= 0) return "0h 00m";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

// Check if task is overdue
const isTaskOverdue = (dueDate, status) => {
  if (!dueDate) return false;
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "rejected") return false;
  const d = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
};

// Status badge styling
const getStatusBadgeStyle = (status) => {
  const s = (status || "not started").toLowerCase();
  if (s === "completed") {
    return {
      label: "Completed",
      classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
      dotClass: "bg-emerald-500",
    };
  }
  if (s.includes("progress")) {
    return {
      label: "In Progress",
      classes: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
      dotClass: "bg-blue-500 animate-pulse",
    };
  }
  if (s.includes("review")) {
    return {
      label: "In Review",
      classes: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
      dotClass: "bg-purple-500",
    };
  }
  if (s.includes("correction")) {
    return {
      label: "Correction",
      classes: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/60",
      dotClass: "bg-orange-500",
    };
  }
  if (s.includes("hold") || s.includes("pause")) {
    return {
      label: "On Hold",
      classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
      dotClass: "bg-amber-500",
    };
  }
  if (s.includes("reject")) {
    return {
      label: "Rejected",
      classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
      dotClass: "bg-rose-500",
    };
  }
  return {
    label: status || "Not Started",
    classes: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  };
};

// Priority badge styling
const getPriorityBadgeStyle = (priority) => {
  const p = (priority || "medium").toLowerCase();
  if (p.includes("top")) {
    return {
      label: "Top High",
      classes: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/60",
      icon: <TbFlame className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />,
    };
  }
  if (p === "high") {
    return {
      label: "High",
      classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
      icon: <FiAlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />,
    };
  }
  if (p === "medium") {
    return {
      label: "Medium",
      classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
      icon: <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />,
    };
  }
  return {
    label: "Low",
    classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    icon: <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />,
  };
};

const StatusOverview = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const setSidebarOpen = outletContext?.setSidebarOpen;

  // Active Tab: 'designer' | 'cinematographer'
  const [activeTab, setActiveTab] = useState("designer");

  // RTK Query Hooks - directly mirrors GraphicDesignerDashboard and Dashboardmain
  const {
    data: rtkGdActiveTasks = [],
    isLoading: isGdActiveLoading,
    refetch: refetchGdActive,
  } = useGetTasksQuery(
    { active_only: true, department: "Graphic Designer", status_overview: "true" },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: rtkGdAllTasks = [],
    isLoading: isGdAllLoading,
    refetch: refetchGdAll,
  } = useGetTasksQuery(
    { department: "Graphic Designer", status_overview: "true" },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: rtkCinemaActiveTasks = [],
    isLoading: isCinemaActiveLoading,
    refetch: refetchCinemaActive,
  } = useGetTasksQuery(
    { active_only: true, department: "Cinematographer", status_overview: "true" },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: rtkCinemaAllTasks = [],
    isLoading: isCinemaAllLoading,
    refetch: refetchCinemaAll,
  } = useGetTasksQuery(
    { department: "Cinematographer", status_overview: "true" },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: rtkDashboardTasks = [],
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useGetTasksQuery(
    { active_only: true, status_overview: "true" },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: rtkAllTasks = [],
    isLoading: isAllTasksLoading,
    refetch: refetchAllTasks,
  } = useGetTasksQuery({ status_overview: "true" }, { refetchOnMountOrArgChange: true });

  const {
    data: rtkStatusOverviewTasks = [],
    isLoading: isStatusOverviewLoading,
    refetch: refetchStatusOverview,
  } = useGetTasksQuery(
    { all: "true", status_overview: "true" },
    { refetchOnMountOrArgChange: true }
  );

  // Fallback direct axios fetch across all clients
  const [fallbackTasks, setFallbackTasks] = useState([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  const fetchTasksData = useCallback(async () => {
    try {
      setFallbackLoading(true);
      const res = await axiosInstance.get("/tasks?all=true&status_overview=true");
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        setFallbackTasks(list);
      }
    } catch (err) {
      console.warn("[StatusOverview] Fallback fetch:", err?.message);
    } finally {
      setFallbackLoading(false);
    }
  }, []);

  // Filters state - Default date filter is "Today"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [creatorFilter, setCreatorFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Today");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Redux state
  const { clients = [] } = useSelector((state) => state.clients || {});
  const { projects = [] } = useSelector((state) => state.projects || {});
  const { users = [] } = useSelector((state) => state.users || {});
  const { user: currentUser } = useSelector((state) => state.auth || {});

  // Determine if current user is Social Media Head
  const isSocialMediaHead = useMemo(() => {
    if (!currentUser) return false;
    const dept = (currentUser.department || currentUser.profile?.department || "").toLowerCase().trim();
    const role = (currentUser.role || "").toLowerCase().trim();
    if (dept.includes("executive") || role.includes("executive")) return false;
    return (
      dept.includes("social media head") ||
      dept.includes("smm head") ||
      role === "socialmediahead" ||
      role === "socialmediamanager"
    );
  }, [currentUser]);

  // Determine if current user is Social Media Executive
  const isSocialMediaExecutive = useMemo(() => {
    if (!currentUser) return false;
    const dept = (currentUser.department || currentUser.profile?.department || "").toLowerCase().trim();
    const role = (currentUser.role || "").toLowerCase().trim();
    const desig = (currentUser.designation || "").toLowerCase().trim();
    if (dept.includes("head") || role.includes("head")) return false;
    return (
      dept.includes("social media executive") ||
      dept === "social media executive" ||
      (dept.includes("social") && dept.includes("executive")) ||
      (role.includes("social") && role.includes("executive")) ||
      desig.includes("social media executive") ||
      (dept.includes("smm") && dept.includes("executive"))
    );
  }, [currentUser]);

  const currentUserId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  // Determine current base path for routing
  const basePath = useMemo(() => {
    const parts = (location.pathname || "").split("/").filter(Boolean);
    return parts[0] || "admin";
  }, [location.pathname]);

  // Maps for fast lookups
  const clientsMap = useMemo(() => {
    const m = new Map();
    (clients || []).forEach((c) => {
      if (c?._id) m.set(String(c._id), c);
      if (c?.id) m.set(String(c.id), c);
    });
    return m;
  }, [clients]);

  const projectsMap = useMemo(() => {
    const m = new Map();
    (projects || []).forEach((p) => {
      if (p?._id) m.set(String(p._id), p);
      if (p?.id) m.set(String(p.id), p);
    });
    return m;
  }, [projects]);

  const usersMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => {
      if (u?._id) m.set(String(u._id), u);
      if (u?.id) m.set(String(u.id), u);
    });
    return m;
  }, [users]);

  // Set of Chennai client IDs & names for Social Media Head filtering
  const { chennaiClientIdSet, chennaiClientNameSet } = useMemo(() => {
    const idSet = new Set();
    const nameSet = new Set();
    (clients || []).forEach((c) => {
      if (!c) return;
      const b = (c.branch || "").trim().toLowerCase();
      // For Social Media Head, clients from /api/clients are already Chennai branch; otherwise check branch === 'chennai'
      if (b === "chennai" || isSocialMediaHead) {
        if (c._id) idSet.add(String(c._id));
        if (c.id) idSet.add(String(c.id));
        const name = (c.companyName || c.name || "").trim().toLowerCase();
        if (name) nameSet.add(name);
      }
    });
    return { chennaiClientIdSet: idSet, chennaiClientNameSet: nameSet };
  }, [clients, isSocialMediaHead]);

  // Robust helper to resolve client for ANY task
  const getTaskClient = useCallback(
    (t) => {
      if (!t) return null;
      let resolved = null;

      // 1. Direct populated client on task
      if (t.client && typeof t.client === "object" && (t.client.companyName || t.client.name)) {
        const cId = String(t.client._id || t.client.id || "");
        const fromMap = cId ? clientsMap.get(cId) : null;
        resolved = fromMap
          ? { ...fromMap, ...t.client, branch: t.client.branch || fromMap.branch }
          : t.client;
      }
      // 2. Client on populated project
      else if (t.project && typeof t.project === "object") {
        if (
          t.project.client &&
          typeof t.project.client === "object" &&
          (t.project.client.companyName || t.project.client.name)
        ) {
          const cId = String(t.project.client._id || t.project.client.id || "");
          const fromMap = cId ? clientsMap.get(cId) : null;
          resolved = fromMap
            ? { ...fromMap, ...t.project.client, branch: t.project.client.branch || fromMap.branch }
            : t.project.client;
        } else if (t.project.client) {
          const c = clientsMap.get(String(t.project.client?._id || t.project.client));
          if (c) resolved = c;
        }
      }
      // 3. Client ID string on task
      else if (t.client) {
        const cId = typeof t.client === "object" ? t.client._id || t.client.id : t.client;
        const c = clientsMap.get(String(cId));
        if (c) resolved = c;
      }
      // 4. Project ID lookup in projectsMap
      else if (t.project) {
        const pId = typeof t.project === "object" ? t.project._id || t.project.id : t.project;
        const p = projectsMap.get(String(pId));
        if (p?.client) {
          const c =
            typeof p.client === "object"
              ? p.client
              : clientsMap.get(String(p.client?._id || p.client));
          if (c) resolved = c;
        }
      }
      // 5. Check subtasks client
      if (!resolved && Array.isArray(t.subtasks)) {
        for (const sub of t.subtasks) {
          if (sub?.client) {
            const subCId = String(sub.client?._id || sub.client?.id || sub.client || "");
            const fromMap = subCId ? clientsMap.get(subCId) : null;
            const subC =
              typeof sub.client === "object" && (sub.client.companyName || sub.client.name)
                ? (fromMap ? { ...fromMap, ...sub.client, branch: sub.client.branch || fromMap.branch } : sub.client)
                : fromMap;
            if (subC) {
              resolved = subC;
              break;
            }
          }
        }
      }
      // 6. Project fallback (if no direct client entity exists, use project name)
      if (!resolved) {
        const pId = typeof t.project === "object" ? t.project?._id : t.project;
        const projObj = (typeof t.project === "object" ? t.project : null) || projectsMap.get(String(pId));
        if (projObj?.name) {
          resolved = { companyName: projObj.name, name: projObj.name, isProjectFallback: true };
        }
      }
      return resolved;
    },
    [clientsMap, projectsMap]
  );

  // Helper to check if task belongs to a Chennai branch client
  const isTaskFromChennaiClient = useCallback(
    (t) => {
      if (!t) return false;
      const client = getTaskClient(t);
      if (!client) return false;
      if (client.isProjectFallback) return false;

      // 1. Direct branch property on resolved client
      const b = (client.branch || "").trim().toLowerCase();
      if (b === "chennai") return true;
      if (b && b !== "chennai") return false;

      // 2. Client ID match in chennaiClientIdSet or clientsMap
      const cId = String(client._id || client.id || "");
      if (cId) {
        if (chennaiClientIdSet.has(cId)) return true;
        const mapped = clientsMap.get(cId);
        if (mapped) {
          const mb = (mapped.branch || "").trim().toLowerCase();
          if (mb === "chennai") return true;
          if (mb && mb !== "chennai") return false;
          if (isSocialMediaHead) return true;
        }
      }

      // 3. Client Name match
      const cName = (client.companyName || client.name || "").trim().toLowerCase();
      if (cName && chennaiClientNameSet.has(cName)) return true;

      // 4. Project's client check
      if (t.project) {
        const pId = typeof t.project === "object" ? t.project?._id : t.project;
        const proj = (typeof t.project === "object" ? t.project : null) || projectsMap.get(String(pId));
        if (proj?.client) {
          const projCId = String(proj.client?._id || proj.client?.id || proj.client);
          if (chennaiClientIdSet.has(projCId)) return true;
          const projCObj = typeof proj.client === "object" ? proj.client : clientsMap.get(projCId);
          if (projCObj) {
            const pb = (projCObj.branch || "").trim().toLowerCase();
            if (pb === "chennai") return true;
            if (pb && pb !== "chennai") return false;
            if (isSocialMediaHead) return true;
          }
        }
      }

      return false;
    },
    [getTaskClient, chennaiClientIdSet, chennaiClientNameSet, clientsMap, projectsMap, isSocialMediaHead]
  );

  // Helper to resolve creator object for any task
  const getTaskCreator = useCallback(
    (t) => {
      if (!t) return null;
      const creatorRaw = typeof t.createdBy === "object" ? t.createdBy : null;
      const creatorFromMap = usersMap.get(String(creatorRaw?._id || t.createdBy));
      return creatorFromMap
        ? { ...creatorRaw, ...creatorFromMap }
        : creatorRaw || creatorFromMap || null;
    },
    [usersMap]
  );

  // Helper to check if task was created by the logged-in user
  const isTaskCreatedByCurrentUser = useCallback(
    (t) => {
      if (!t || !currentUserId) return false;
      const creatorRaw = typeof t.createdBy === "object" ? t.createdBy?._id || t.createdBy?.id : t.createdBy;
      const creatorId = String(creatorRaw || "");
      if (creatorId && creatorId === currentUserId) return true;

      const creatorObj = getTaskCreator(t);
      const mappedCreatorId = String(creatorObj?._id || creatorObj?.id || "");
      if (mappedCreatorId && mappedCreatorId === currentUserId) return true;

      return false;
    },
    [currentUserId, getTaskCreator]
  );

  // Initial fetch
  useEffect(() => {
    fetchTasksData();
    dispatch(getClients());
    dispatch(getProjects());
    dispatch(getUsers());
  }, [fetchTasksData, dispatch]);

  const handleRefresh = () => {
    refetchGdActive();
    refetchGdAll();
    refetchCinemaActive();
    refetchCinemaAll();
    refetchDashboard();
    refetchAllTasks();
    refetchStatusOverview();
    fetchTasksData();
    dispatch(getClients());
    dispatch(getProjects());
    dispatch(getUsers());
  };

  // Consolidate all tasks from all RTK Query sources + fallback (deduplicated by _id)
  const allTasks = useMemo(() => {
    const map = new Map();
    const addList = (list) => {
      if (!Array.isArray(list)) return;
      list.forEach((t) => {
        if (!t?._id) return;
        const idStr = String(t._id);
        if (!map.has(idStr)) {
          map.set(idStr, t);
        } else {
          const prev = map.get(idStr);
          map.set(idStr, { ...prev, ...t });
        }
      });
    };

    addList(rtkGdAllTasks);
    addList(rtkCinemaAllTasks);
    addList(rtkGdActiveTasks);
    addList(rtkCinemaActiveTasks);
    addList(rtkStatusOverviewTasks);
    addList(rtkDashboardTasks);
    addList(rtkAllTasks);
    addList(fallbackTasks);

    const consolidated = Array.from(map.values());
    if (isSocialMediaExecutive) {
      return consolidated.filter((t) => isTaskCreatedByCurrentUser(t));
    }
    if (isSocialMediaHead) {
      return consolidated.filter((t) => isTaskFromChennaiClient(t));
    }
    return consolidated;
  }, [
    rtkGdAllTasks,
    rtkCinemaAllTasks,
    rtkGdActiveTasks,
    rtkCinemaActiveTasks,
    rtkStatusOverviewTasks,
    rtkDashboardTasks,
    rtkAllTasks,
    fallbackTasks,
    isSocialMediaExecutive,
    isTaskCreatedByCurrentUser,
    isSocialMediaHead,
    isTaskFromChennaiClient,
  ]);

  const tasksLoading =
    allTasks.length === 0 &&
    (isGdActiveLoading ||
      isCinemaActiveLoading ||
      isDashboardLoading ||
      isAllTasksLoading ||
      fallbackLoading);

  // Sets of users belonging to Graphic Design and Cinematography
  const { gdUserIdsSet, cinemaUserIdsSet } = useMemo(() => {
    const gdSet = new Set();
    const cinemaSet = new Set();

    (users || []).forEach((u) => {
      if (!u) return;
      const uid = String(u._id || u.id);
      const dept = (u.department || u.profile?.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      const desig = (u.designation || "").toLowerCase().trim();

      const isGD =
        dept.includes("graphic") ||
        dept.includes("design") ||
        dept.includes("ui") ||
        dept.includes("ux") ||
        dept === "designer" ||
        role.includes("designer") ||
        role.includes("graphic") ||
        desig.includes("graphic") ||
        desig.includes("design");

      const isCinema =
        dept.includes("cinema") ||
        dept.includes("video") ||
        dept.includes("edit") ||
        dept.includes("shoot") ||
        dept.includes("camera") ||
        role.includes("cinema") ||
        role.includes("video") ||
        role.includes("cinematog") ||
        desig.includes("cinema") ||
        desig.includes("video") ||
        desig.includes("editor");

      if (isGD) gdSet.add(uid);
      if (isCinema) cinemaSet.add(uid);
    });

    return { gdUserIdsSet: gdSet, cinemaUserIdsSet: cinemaSet };
  }, [users]);

  // Helper to resolve assignee object for any task (checking top-level and subtasks)
  const getTaskAssignee = useCallback(
    (t) => {
      if (!t) return null;
      const assigneeRaw = typeof t.assignedTo === "object" ? t.assignedTo : null;
      const assigneeFromMap = usersMap.get(String(assigneeRaw?._id || t.assignedTo));
      let assigneeObj = assigneeFromMap
        ? { ...assigneeRaw, ...assigneeFromMap }
        : assigneeRaw || assigneeFromMap;

      // If task unassigned at top level, check subtasks
      if (!assigneeObj && Array.isArray(t.subtasks)) {
        for (const sub of t.subtasks) {
          if (sub?.assignedTo) {
            const subRaw = typeof sub.assignedTo === "object" ? sub.assignedTo : null;
            const subFromMap = usersMap.get(String(subRaw?._id || sub.assignedTo));
            assigneeObj = subFromMap
              ? { ...subRaw, ...subFromMap }
              : subRaw || subFromMap;
            if (assigneeObj) break;
          }
        }
      }
      return assigneeObj || null;
    },
    [usersMap]
  );

  // Helper to test if a user reference is a Graphic Designer
  const checkIsDesignerUser = useCallback(
    (userRef) => {
      if (!userRef) return false;
      const uId = typeof userRef === "object" ? userRef._id || userRef.id : userRef;
      if (uId && gdUserIdsSet.has(String(uId))) return true;

      const user = (uId ? usersMap.get(String(uId)) : null) || (typeof userRef === "object" ? userRef : null);
      if (!user) return false;
      const dept = (user.department || user.profile?.department || "").toLowerCase().trim();
      const role = (user.role || "").toLowerCase().trim();
      const desig = (user.designation || "").toLowerCase().trim();
      return (
        dept.includes("graphic") ||
        dept.includes("design") ||
        dept.includes("ui") ||
        dept.includes("ux") ||
        dept === "designer" ||
        role.includes("graphic") ||
        role.includes("design") ||
        desig.includes("graphic") ||
        desig.includes("design")
      );
    },
    [gdUserIdsSet, usersMap]
  );

  // Helper to test if a user reference is a Cinematographer
  const checkIsCinemaUser = useCallback(
    (userRef) => {
      if (!userRef) return false;
      const uId = typeof userRef === "object" ? userRef._id || userRef.id : userRef;
      if (uId && cinemaUserIdsSet.has(String(uId))) return true;

      const user = (uId ? usersMap.get(String(uId)) : null) || (typeof userRef === "object" ? userRef : null);
      if (!user) return false;
      const dept = (user.department || user.profile?.department || "").toLowerCase().trim();
      const role = (user.role || "").toLowerCase().trim();
      const desig = (user.designation || "").toLowerCase().trim();
      return (
        dept.includes("cinema") ||
        dept.includes("video") ||
        dept.includes("edit") ||
        dept.includes("shoot") ||
        dept.includes("camera") ||
        role.includes("cinema") ||
        role.includes("video") ||
        role.includes("cinematog") ||
        desig.includes("cinema") ||
        desig.includes("video") ||
        desig.includes("editor")
      );
    },
    [cinemaUserIdsSet, usersMap]
  );

  // Set of task IDs directly returned by Graphic Designer queries
  const gdQueryTaskIds = useMemo(() => {
    const set = new Set();
    [...(rtkGdActiveTasks || []), ...(rtkGdAllTasks || [])].forEach((t) => {
      if (t?._id) set.add(String(t._id));
    });
    return set;
  }, [rtkGdActiveTasks, rtkGdAllTasks]);

  // Set of task IDs directly returned by Cinematographer queries
  const cinemaQueryTaskIds = useMemo(() => {
    const set = new Set();
    [...(rtkCinemaActiveTasks || []), ...(rtkCinemaAllTasks || [])].forEach((t) => {
      if (t?._id) set.add(String(t._id));
    });
    return set;
  }, [rtkCinemaActiveTasks, rtkCinemaAllTasks]);

  // Categorize task into Graphic Designer and Cinematographer collections
  const { allDesignerTasks, allCinematographerTasks } = useMemo(() => {
    const designers = [];
    const cinematographers = [];
    const seenDesignerIds = new Set();
    const seenCinemaIds = new Set();

    (allTasks || []).forEach((t) => {
      if (!t || !t._id) return;
      const tid = String(t._id);

      const ct = (t.contentType || "").toUpperCase().trim();
      const taskType = (t.type || "").toUpperCase().trim();
      const wtUpper = (t.workType || "").toUpperCase().trim();

      // Exclude MOM (Minutes of Meeting) content type tasks from Status Overview
      if (
        ct === "MOM" ||
        ct.includes("MOM") ||
        taskType === "MOM" ||
        taskType.includes("MOM") ||
        wtUpper === "MOM" ||
        wtUpper.includes("MOM")
      ) {
        return;
      }

      const taskDept = (t.department || "").toLowerCase().trim();
      const wt = (t.workType || "").toLowerCase().trim();
      const titleLower = (t.title || "").toLowerCase();

      // Check Assignee
      const isAssigneeGD = checkIsDesignerUser(t.assignedTo);
      const isAssigneeCinema = checkIsCinemaUser(t.assignedTo);

      // Check Subtasks
      let hasSubtaskGD = false;
      let hasSubtaskCinema = false;
      if (Array.isArray(t.subtasks)) {
        for (const sub of t.subtasks) {
          if (!hasSubtaskGD && checkIsDesignerUser(sub.assignedTo)) hasSubtaskGD = true;
          if (!hasSubtaskCinema && checkIsCinemaUser(sub.assignedTo)) hasSubtaskCinema = true;
        }
      }

      // Check Task Department
      const isTaskDeptGD =
        taskDept.includes("graphic") ||
        taskDept.includes("design") ||
        taskDept === "designer" ||
        taskDept.includes("ui") ||
        taskDept.includes("ux");

      const isTaskDeptCinema =
        taskDept.includes("cinema") ||
        taskDept.includes("video") ||
        taskDept.includes("edit") ||
        taskDept.includes("shoot") ||
        taskDept.includes("camera") ||
        taskDept.includes("cinematog");

      // Check Content Type
      const isContentTypeGD = [
        "IMAGE",
        "POST",
        "CAROUSEL",
        "BANNER",
        "FLYER",
        "GRAPHIC",
        "THUMBNAIL",
        "POSTER",
        "LOGO",
        "BROCHURE",
      ].includes(ct);
      const isContentTypeCinema = [
        "VIDEO",
        "REEL",
        "SHOOT",
        "CINEMATIC",
        "FOOTAGE",
        "EDIT",
        "MOTION",
        "AUDIO",
        "TEASER",
        "TRAILER",
      ].includes(ct);

      // Check Work Type
      const isWorkTypeGD =
        wt.includes("graphic") ||
        wt.includes("design") ||
        wt.includes("poster") ||
        wt.includes("banner") ||
        wt.includes("flyer") ||
        wt.includes("logo");
      const isWorkTypeCinema =
        wt.includes("video") ||
        wt.includes("shoot") ||
        wt.includes("cinema") ||
        wt.includes("edit") ||
        wt.includes("footage") ||
        wt.includes("reel");

      // Check Project Name
      const pId = typeof t.project === "object" ? t.project?._id : t.project;
      const projObj =
        (typeof t.project === "object" ? t.project : null) ||
        projectsMap.get(String(pId));
      const projName = (projObj?.name || "").toLowerCase();
      const isProjGD = projName.includes("design") || projName.includes("graphic");
      const isProjCinema =
        projName.includes("cinema") ||
        projName.includes("video") ||
        projName.includes("shoot");

      const matchesGD =
        gdQueryTaskIds.has(tid) ||
        isAssigneeGD ||
        isTaskDeptGD ||
        hasSubtaskGD ||
        isContentTypeGD ||
        isWorkTypeGD ||
        isProjGD;

      const matchesCinema =
        cinemaQueryTaskIds.has(tid) ||
        isAssigneeCinema ||
        isTaskDeptCinema ||
        hasSubtaskCinema ||
        isContentTypeCinema ||
        isWorkTypeCinema ||
        isProjCinema;

      if (matchesGD && !seenDesignerIds.has(tid)) {
        seenDesignerIds.add(tid);
        designers.push(t);
      }
      if (matchesCinema && !seenCinemaIds.has(tid)) {
        seenCinemaIds.add(tid);
        cinematographers.push(t);
      }

      // Fallback for unclassified tasks
      if (!matchesGD && !matchesCinema) {
        if (
          titleLower.includes("video") ||
          titleLower.includes("reel") ||
          titleLower.includes("shoot") ||
          titleLower.includes("cinema") ||
          titleLower.includes("camera") ||
          titleLower.includes("edit")
        ) {
          if (!seenCinemaIds.has(tid)) {
            seenCinemaIds.add(tid);
            cinematographers.push(t);
          }
        } else {
          if (!seenDesignerIds.has(tid)) {
            seenDesignerIds.add(tid);
            designers.push(t);
          }
        }
      }
    });

    return {
      allDesignerTasks: designers,
      allCinematographerTasks: cinematographers,
    };
  }, [
    allTasks,
    gdQueryTaskIds,
    cinemaQueryTaskIds,
    checkIsDesignerUser,
    checkIsCinemaUser,
    projectsMap,
  ]);

  // Current tab active task pool
  const currentTabPool = useMemo(() => {
    return activeTab === "designer" ? allDesignerTasks : allCinematographerTasks;
  }, [activeTab, allDesignerTasks, allCinematographerTasks]);

  // Unique client options for filter (combining all available clients + tasks' clients)
  const clientFilterOptions = useMemo(() => {
    const map = new Map();

    // 1. All clients registered in the system (filtered for Social Media Head / Executive)
    if (!isSocialMediaExecutive) {
      (clients || []).forEach((c) => {
        if (isSocialMediaHead) {
          const b = (c?.branch || "").trim().toLowerCase();
          if (b && b !== "chennai") return;
        }
        const name = c?.companyName || c?.name;
        if (name && name.trim()) {
          map.set(name.trim().toLowerCase(), name.trim());
        }
      });
    }

    // 2. Any clients referenced in current tasks pool
    currentTabPool.forEach((t) => {
      if (isSocialMediaExecutive && !isTaskCreatedByCurrentUser(t)) return;
      if (isSocialMediaHead && !isTaskFromChennaiClient(t)) return;
      const c = getTaskClient(t);
      const name = c?.companyName || c?.name;
      if (name && name.trim()) {
        map.set(name.trim().toLowerCase(), name.trim());
      }
    });

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [
    clients,
    currentTabPool,
    getTaskClient,
    isSocialMediaHead,
    isSocialMediaExecutive,
    isTaskFromChennaiClient,
    isTaskCreatedByCurrentUser,
  ]);

  // Unique creator options for filter (from current task pool)
  const creatorFilterOptions = useMemo(() => {
    const map = new Map();
    currentTabPool.forEach((t) => {
      const creator = getTaskCreator(t);
      const name = creator?.name?.trim();
      if (name) {
        map.set(name.toLowerCase(), name);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [currentTabPool, getTaskCreator]);

  // Unique assignee options for filter (from current task pool and subtasks)
  const assigneeFilterOptions = useMemo(() => {
    const map = new Map();
    currentTabPool.forEach((t) => {
      const assignee = getTaskAssignee(t);
      const name = assignee?.name?.trim();
      if (name) {
        map.set(name.toLowerCase(), name);
      }
      if (Array.isArray(t.subtasks)) {
        t.subtasks.forEach((sub) => {
          if (sub?.assignedTo) {
            const subRaw = typeof sub.assignedTo === "object" ? sub.assignedTo : null;
            const subFromMap = usersMap.get(String(subRaw?._id || sub.assignedTo));
            const subObj = subFromMap ? { ...subRaw, ...subFromMap } : subRaw || subFromMap;
            const subName = subObj?.name?.trim();
            if (subName) {
              map.set(subName.toLowerCase(), subName);
            }
          }
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [currentTabPool, getTaskAssignee, usersMap]);

  // Filter tasks based on search, status, priority, client, and date
  const filteredTasks = useMemo(() => {
    return currentTabPool.filter((t) => {
      // Exclude MOM (Minutes of Meeting) content type tasks
      const ctUpper = (t.contentType || "").toUpperCase().trim();
      const typeUpper = (t.type || "").toUpperCase().trim();
      const wtUpper = (t.workType || "").toUpperCase().trim();
      if (
        ctUpper === "MOM" ||
        ctUpper.includes("MOM") ||
        typeUpper === "MOM" ||
        typeUpper.includes("MOM") ||
        wtUpper === "MOM" ||
        wtUpper.includes("MOM")
      ) {
        return false;
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (t.title || "").toLowerCase();
        const client = getTaskClient(t);
        const clientName = (client?.companyName || client?.name || "").toLowerCase();
        const creatorObj =
          typeof t.createdBy === "object" ? t.createdBy : usersMap.get(String(t.createdBy));
        const createdByName = (creatorObj?.name || "").toLowerCase();
        const assigneeObj =
          typeof t.assignedTo === "object" ? t.assignedTo : usersMap.get(String(t.assignedTo));
        const assigneeName = (assigneeObj?.name || "").toLowerCase();

        const match =
          title.includes(q) ||
          clientName.includes(q) ||
          createdByName.includes(q) ||
          assigneeName.includes(q);
        if (!match) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "All") {
        const s = (t.status || "Not Started").toLowerCase();
        const sf = statusFilter.toLowerCase();
        if (sf === "in review") {
          if (!s.includes("review") && !s.includes("correction")) return false;
        } else if (sf === "in progress") {
          if (!s.includes("progress")) return false;
        } else if (sf === "on hold") {
          if (!s.includes("hold") && !s.includes("pause")) return false;
        } else if (sf === "completed") {
          if (s !== "completed") return false;
        } else if (sf === "not started") {
          if (s !== "not started" && s !== "pending") return false;
        } else if (s !== sf) {
          return false;
        }
      }

      // 3. Priority Filter
      if (priorityFilter !== "All") {
        const p = (t.priority || "Medium").toLowerCase();
        const pf = priorityFilter.toLowerCase();
        if (p !== pf) return false;
      }

      // 4. Client Filter
      if (clientFilter !== "All") {
        const client = getTaskClient(t);
        const clientName = client?.companyName || client?.name || "";
        if (clientName.toLowerCase() !== clientFilter.toLowerCase()) return false;
      }

      // 5. Creator Filter
      if (creatorFilter !== "All") {
        const creator = getTaskCreator(t);
        const name = creator?.name?.trim() || "";
        if (name.toLowerCase() !== creatorFilter.toLowerCase()) return false;
      }

      // 6. Assignee Filter
      if (assigneeFilter !== "All") {
        const assignee = getTaskAssignee(t);
        const mainName = assignee?.name?.trim() || "";
        const filterLower = assigneeFilter.toLowerCase();
        let matches = mainName.toLowerCase() === filterLower;

        if (!matches && Array.isArray(t.subtasks)) {
          matches = t.subtasks.some((sub) => {
            const subRaw = typeof sub.assignedTo === "object" ? sub.assignedTo : null;
            const subFromMap = usersMap.get(String(subRaw?._id || sub.assignedTo));
            const subObj = subFromMap ? { ...subRaw, ...subFromMap } : subRaw || subFromMap;
            return (subObj?.name?.trim() || "").toLowerCase() === filterLower;
          });
        }

        if (!matches) return false;
      }

      // 7. Date Filter (Calendar-wise & Presets)
      if (dateFilter !== "All Time") {
        const taskCreatedDate = t.createdAt ? new Date(t.createdAt) : null;
        const taskStartDate = t.startDate ? new Date(t.startDate) : null;
        const taskDueDate = t.dueDate ? new Date(t.dueDate) : null;
        const taskCompletedDate = t.completedAt
          ? new Date(t.completedAt)
          : t.updatedAt
          ? new Date(t.updatedAt)
          : null;
        const taskAssignmentDate = taskStartDate || taskCreatedDate;

        const statusLower = (t.status || "").toLowerCase();
        const isCompleted = statusLower === "completed" || statusLower.includes("approve");
        const isRejected = statusLower.includes("reject") || statusLower.includes("cancel");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === "Today") {
          // 1. Task assigned or started today
          if (taskAssignmentDate && isSameDay(taskAssignmentDate, today)) return true;
          // 2. Task due today
          if (taskDueDate && isSameDay(taskDueDate, today)) return true;
          // 3. Completed or rejected today
          if ((isCompleted || isRejected) && taskCompletedDate && isSameDay(taskCompletedDate, today)) return true;
          // 4. Currently active / in progress task (started on or before today, and still active)
          if (!isCompleted && !isRejected) {
            if (taskAssignmentDate && isBefore(startOfDay(taskAssignmentDate), endOfDay(today))) {
              return true;
            }
          }
          return false;
        } else if (dateFilter === "Yesterday") {
          const yesterday = subDays(today, 1);
          if (taskAssignmentDate && isSameDay(taskAssignmentDate, yesterday)) return true;
          if (taskDueDate && isSameDay(taskDueDate, yesterday)) return true;
          if ((isCompleted || isRejected) && taskCompletedDate && isSameDay(taskCompletedDate, yesterday)) return true;
          if (!isCompleted && !isRejected) {
            if (taskAssignmentDate && isBefore(startOfDay(taskAssignmentDate), endOfDay(yesterday))) {
              return true;
            }
          }
          return false;
        } else if (dateFilter === "Date" || dateFilter.startsWith("20")) {
          // Exact calendar day selected
          const targetDay = selectedCalendarDate;
          if (taskAssignmentDate && isSameDay(taskAssignmentDate, targetDay)) return true;
          if (taskDueDate && isSameDay(taskDueDate, targetDay)) return true;
          if ((isCompleted || isRejected) && taskCompletedDate && isSameDay(taskCompletedDate, targetDay)) return true;
          if (!isCompleted && !isRejected) {
            if (taskAssignmentDate && isBefore(startOfDay(taskAssignmentDate), endOfDay(targetDay))) {
              return true;
            }
          }
          return false;
        } else if (dateFilter === "Last 7 Days") {
          const last7Days = subDays(today, 7);
          const checkDate = taskAssignmentDate || taskDueDate || taskCreatedDate;
          if (checkDate && isAfter(checkDate, last7Days)) return true;
          if (!isCompleted && !isRejected) return true;
          return false;
        } else if (dateFilter === "This Month") {
          const checkDate = taskAssignmentDate || taskDueDate || taskCreatedDate;
          if (
            checkDate &&
            checkDate.getMonth() === today.getMonth() &&
            checkDate.getFullYear() === today.getFullYear()
          ) {
            return true;
          }
          if (!isCompleted && !isRejected) return true;
          return false;
        } else if (dateFilter === "Overdue") {
          if (!isTaskOverdue(t.dueDate, t.status)) return false;
        }
      }

      return true;
    });
  }, [
    currentTabPool,
    searchQuery,
    statusFilter,
    priorityFilter,
    clientFilter,
    creatorFilter,
    assigneeFilter,
    dateFilter,
    selectedCalendarDate,
    getTaskClient,
    getTaskCreator,
    getTaskAssignee,
    usersMap,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchQuery,
    statusFilter,
    priorityFilter,
    clientFilter,
    creatorFilter,
    assigneeFilter,
    dateFilter,
    selectedCalendarDate,
  ]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // Live ticker for Total Productivity of currently visible tasks
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const hasInProgress = paginatedTasks.some((t) => {
      const s = (t.status || "").toLowerCase();
      return s.includes("progress") && !t.autoPaused;
    });

    if (!hasInProgress) return;

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 4000);

    return () => clearInterval(interval);
  }, [paginatedTasks]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;

  // Navigate to task board
  const handleViewTaskInBoard = (task) => {
    const client = getTaskClient(task);
    const clientId = client?._id || client?.id || "";
    const projectId =
      typeof task.project === "object"
        ? task.project?._id || task.project?.id
        : task.project || "";

    const targetSubPath = activeTab === "designer" ? "designer-tasks" : "cinematographer-tasks";
    let url = `/${basePath}/${targetSubPath}`;
    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (projectId) params.set("projectId", projectId);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    navigate(url);
  };

  return (
    <div className="p-4  space-y-6 max-w-8xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111827]">
        <div className="flex items-center gap-3">
          {setSidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Open Sidebar"
            >
              <FiMenu size={18} />
            </button>
          )}
          <div className="w-12 h-12 rounded-md bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-2xs">
            <LuListChecks size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-xl  font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Status Overview
            </h1>
            <p className="text-xs sm:text-sm italic text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isSocialMediaHead
                ? "Live status tracking of Designer & Cinematographer tasks (Chennai Branch)"
                : isSocialMediaExecutive
                ? "Live status tracking of your created Designer & Cinematographer tasks"
                : "Live status tracking of all Designer and Cinematographer tasks across all clients"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={tasksLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Tasks"
          >
            <FiRefreshCw size={13} className={tasksLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* COMPACT TABS & CALENDAR NAVIGATOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Compact Tabs */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#131926] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs w-fit">
          {/* Tab 1: All Designer Tasks */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("designer");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === "designer"
                ? "bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === "designer"
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                  : "bg-slate-200/70 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <TbPencilHeart size={14} />
            </div>
            <span>All Designer Tasks</span>
           
          </button>

          {/* Tab 2: All Cinematographer Tasks */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("cinematographer");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === "cinematographer"
                ? "bg-white dark:bg-[#1e293b] text-amber-600 dark:text-amber-400 shadow-xs border border-amber-100 dark:border-amber-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === "cinematographer"
                  ? "bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "bg-slate-200/70 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <LuVideo size={14} />
            </div>
            <span>All Cinematographer Tasks</span>
           
          </button>
        </div>

        {/* CALENDAR-WISE DATE NAVIGATOR & PICKER */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Preset Pills */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-[#131926] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedCalendarDate(new Date());
                setDateFilter("Today");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                dateFilter === "Today"
                  ? "bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCalendarDate(subDays(new Date(), 1));
                setDateFilter("Yesterday");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                dateFilter === "Yesterday"
                  ? "bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("All Time")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                dateFilter === "All Time"
                  ? "bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Stepper with Interactive Calendar Picker */}
          <div className="flex items-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden h-9">
            <button
              type="button"
              onClick={() => {
                const prev = subDays(selectedCalendarDate, 1);
                setSelectedCalendarDate(prev);
                setDateFilter(isToday(prev) ? "Today" : isYesterday(prev) ? "Yesterday" : "Date");
              }}
              className="h-full px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-r border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Previous Day"
            >
              <FiChevronLeft size={14} />
            </button>

            <label className="relative flex items-center gap-1.5 px-3 h-full cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-bold text-slate-800 dark:text-slate-100 select-none">
              <FiCalendar className="text-indigo-500 dark:text-indigo-400 shrink-0" size={13} />
              <span className="min-w-[85px] text-center font-bold">
                {dateFilter === "All Time"
                  ? "All Time"
                  : isToday(selectedCalendarDate)
                  ? `Today (${format(selectedCalendarDate, "dd MMM")})`
                  : isYesterday(selectedCalendarDate)
                  ? `Yesterday (${format(selectedCalendarDate, "dd MMM")})`
                  : format(selectedCalendarDate, "dd MMM yyyy")}
              </span>
              <FiChevronDown className="text-slate-400 shrink-0" size={12} />
              <input
                type="date"
                value={format(selectedCalendarDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    const newD = new Date(y, m - 1, d);
                    setSelectedCalendarDate(newD);
                    setDateFilter(isToday(newD) ? "Today" : isYesterday(newD) ? "Yesterday" : "Date");
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const next = addDays(selectedCalendarDate, 1);
                setSelectedCalendarDate(next);
                setDateFilter(isToday(next) ? "Today" : isYesterday(next) ? "Yesterday" : "Date");
              }}
              className="h-full px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-l border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Next Day"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-[#111827] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
           
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task name, client, creator, or assignee..."
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Client Filter (Searchable) */}
            <SearchableDropdown
              value={clientFilter}
              onChange={(val) => setClientFilter(val)}
              options={clientFilterOptions}
              allLabel={`All Clients (${clientFilterOptions.length})`}
              placeholder="Client"
              searchPlaceholder="Search client..."
              menuWidth="w-60"
              buttonClassName="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-2 min-w-[140px]"
            />

            {/* Created By Filter (Searchable) */}
            <SearchableDropdown
              value={creatorFilter}
              onChange={(val) => setCreatorFilter(val)}
              options={creatorFilterOptions}
              allLabel={`All Creators (${creatorFilterOptions.length})`}
              placeholder="Created By"
              searchPlaceholder="Search creator..."
              menuWidth="w-56"
              buttonClassName="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-2 min-w-[140px]"
            />

            {/* Assignee Filter (Searchable) */}
            <SearchableDropdown
              value={assigneeFilter}
              onChange={(val) => setAssigneeFilter(val)}
              options={assigneeFilterOptions}
              allLabel={`All Assignees (${assigneeFilterOptions.length})`}
              placeholder="Assignee"
              searchPlaceholder="Search assignee..."
              menuWidth="w-56"
              buttonClassName="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-2 min-w-[140px]"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-2xs"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Not Started">Not Started / Pending</option>
              <option value="Correction">Correction</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-2xs"
            >
              <option value="All">All Priorities</option>
              <option value="Top High">🔥 Top High</option>
              <option value="High">⚡ High</option>
              <option value="Medium">🔷 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>

            {/* Date Filter Dropdown */}
            <select
              value={
                ["Today", "Yesterday", "Last 7 Days", "This Month", "Overdue", "All Time"].includes(
                  dateFilter
                )
                  ? dateFilter
                  : "Date"
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "Today") {
                  setSelectedCalendarDate(new Date());
                  setDateFilter("Today");
                } else if (val === "Yesterday") {
                  setSelectedCalendarDate(subDays(new Date(), 1));
                  setDateFilter("Yesterday");
                } else {
                  setDateFilter(val);
                }
              }}
              className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-2xs"
            >
              <option value="Today">Today (Default)</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
              <option value="Overdue">⚠️ Overdue</option>
              <option value="All Time">All Time</option>
              {!["Today", "Yesterday", "Last 7 Days", "This Month", "Overdue", "All Time"].includes(
                dateFilter
              ) && (
                <option value="Date">
                  Custom ({format(selectedCalendarDate, "dd MMM yyyy")})
                </option>
              )}
            </select>

            {/* Clear All Filters button */}
            {(searchQuery ||
              statusFilter !== "All" ||
              priorityFilter !== "All" ||
              clientFilter !== "All" ||
              creatorFilter !== "All" ||
              assigneeFilter !== "All" ||
              dateFilter !== "Today" ||
              !isToday(selectedCalendarDate)) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setPriorityFilter("All");
                  setClientFilter("All");
                  setCreatorFilter("All");
                  setAssigneeFilter("All");
                  setDateFilter("Today");
                  setSelectedCalendarDate(new Date());
                }}
                className="h-10 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer shadow-2xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-[#131926] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
                <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[260px]">Task Name</th>
                <th className="py-2.5 px-3 min-w-[150px]">Client Name</th>
                <th className="py-2.5 px-3 min-w-[150px]">Created By</th>
                <th className="py-2.5 px-3 min-w-[150px]">Assignee</th>
                <th className="py-2.5 px-3 min-w-[160px]">Start Date & End Date</th>
                <th className="py-2.5 px-3 min-w-[150px]">Total Productivity</th>
                <th className="py-2.5 px-3 min-w-[120px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] font-medium">
              {tasksLoading && paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FiRefreshCw size={26} className="animate-spin text-indigo-500" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        Loading tasks across all clients...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <LuListChecks size={24} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No tasks found
                      </span>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        No {activeTab === "designer" ? "Designer" : "Cinematographer"} tasks match the selected filters or search query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((t, idx) => {
                  const rowIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const clientObj = getTaskClient(t);
                  const creatorObj = getTaskCreator(t);
                  const assigneeObj = getTaskAssignee(t);

                  const creatorDept =
                    creatorObj?.department ||
                    creatorObj?.profile?.department ||
                    creatorObj?.designation ||
                    creatorObj?.role ||
                    "";

                  const assigneeDept =
                    assigneeObj?.department ||
                    assigneeObj?.profile?.department ||
                    assigneeObj?.designation ||
                    t.department ||
                    (activeTab === "designer" ? "Graphic Designer" : "Cinematographer");

                  const creatorAvatar = getUserAvatarUrl(creatorObj);
                  const assigneeAvatar = getUserAvatarUrl(assigneeObj);

                  const statusBadge = getStatusBadgeStyle(t.status);
                  const priorityBadge = getPriorityBadgeStyle(t.priority);
                  const overdue = isTaskOverdue(t.dueDate, t.status);

                  const totalProdMs = calculateTaskTotalProductivity(t, nowMs);
                  const isTaskActiveInProgress =
                    (t.status || "").toLowerCase().includes("progress") && !t.autoPaused;

                  return (
                    <tr
                      key={t._id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#151c2e]/70 transition-colors"
                    >
                      {/* 1. Row Index */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-[11px] text-slate-400 dark:text-slate-500">
                        {rowIndex}
                      </td>

                      {/* 2. Task Name & Priority */}
                      <td className="py-2 px-3">
                        <div className="flex items-start gap-2 max-w-[300px]">
                          <div className="mt-0.5 shrink-0 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                            {activeTab === "designer" ? (
                              <TbPencilHeart size={13} className="text-indigo-500" />
                            ) : (
                              <LuVideo size={13} className="text-amber-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="font-bold text-slate-900 dark:text-slate-100 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer truncate max-w-[180px]"
                                title={t.title || "Untitled Task"}
                                onClick={() => handleViewTaskInBoard(t)}
                              >
                                {t.title || "Untitled Task"}
                              </span>

                              {/* Priority badge next to task name */}
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-2xs shrink-0 ${priorityBadge.classes}`}
                                title={`Priority: ${priorityBadge.label}`}
                              >
                                {priorityBadge.icon}
                                <span>{priorityBadge.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {t.contentType && !t.contentType.toUpperCase().includes("MOM") && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-black">
                                  {t.contentType}
                                </span>
                              )}
                              {t.workType && (
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[120px]">
                                  {t.workType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Client Name */}
                      <td className="py-2 px-3">
                        {clientObj ? (
                          clientObj.isProjectFallback ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <LuBuilding2 size={11} className="text-slate-500" />
                              <span className="truncate max-w-[120px]">{clientObj.companyName}</span>
                            </span>
                          ) : (
                            <ClientBadge client={clientObj} size="sm" />
                          )
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                            — No Client —
                          </span>
                        )}
                      </td>

                      {/* 4. Created By */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2 max-w-[160px]">
                          <div className="relative shrink-0 w-6 h-6">
                            {creatorAvatar ? (
                              <img
                                src={creatorAvatar}
                                alt={creatorObj?.name || "User"}
                                className="w-6 h-6 rounded-full object-cover border border-purple-200 dark:border-purple-800/80 shadow-2xs"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-[9px] items-center justify-center uppercase shadow-2xs"
                              style={{ display: creatorAvatar ? "none" : "flex" }}
                            >
                              {creatorObj?.name ? creatorObj.name.substring(0, 2) : "U"}
                            </div>
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span
                              className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate"
                              title={creatorObj?.name || "System"}
                            >
                              {creatorObj?.name || "—"}
                            </span>
                            {creatorDept && (
                              <span
                                className="inline-block text-[9px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/40 px-1 py-0.2 rounded border border-purple-100 dark:border-purple-900/40 truncate max-w-[120px]"
                                title={creatorDept}
                              >
                                {creatorDept}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. Assignee */}
                      <td className="py-2 px-3">
                        {assigneeObj ? (
                          <div className="flex items-center gap-2 max-w-[160px]">
                            <div className="relative shrink-0 w-6 h-6">
                              {assigneeAvatar ? (
                                <img
                                  src={assigneeAvatar}
                                  alt={assigneeObj?.name || "Assignee"}
                                  className="w-6 h-6 rounded-full object-cover border border-indigo-200 dark:border-indigo-800/80 shadow-2xs"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                    if (fallback) fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-extrabold text-[9px] items-center justify-center uppercase shadow-2xs"
                                style={{ display: assigneeAvatar ? "none" : "flex" }}
                              >
                                {assigneeObj?.name ? assigneeObj.name.substring(0, 2) : "U"}
                              </div>
                            </div>
                            <div className="min-w-0 flex flex-col">
                              <span
                                className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate"
                                title={assigneeObj?.name}
                              >
                                {assigneeObj?.name}
                              </span>
                              {assigneeDept && (
                                <span
                                  className={`inline-block text-[9px] font-semibold px-1 py-0.2 rounded border truncate max-w-[120px] ${
                                    activeTab === "designer"
                                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40"
                                      : "text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40"
                                  }`}
                                  title={assigneeDept}
                                >
                                  {assigneeDept}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* 6. Start Date and End Date */}
                      <td className="py-2 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 w-8">
                              Start:
                            </span>
                            <span className="font-semibold text-[11px]">{formatDate(t.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 w-8">
                              End:
                            </span>
                            <span
                              className={`font-semibold text-[11px] ${
                                overdue
                                  ? "text-rose-600 dark:text-rose-400 font-bold"
                                  : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {formatDate(t.dueDate)}
                            </span>
                            {overdue && (
                              <span
                                className="inline-flex items-center px-1 py-0.2 rounded text-[8px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                                title="Task is past due date"
                              >
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7. Total Productivity */}
                      <td className="py-2 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                              totalProdMs > 0
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <FiClock
                              size={11}
                              className={isTaskActiveInProgress ? "animate-spin text-emerald-500" : ""}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px] font-mono leading-tight">
                                {formatProductivity(totalProdMs)}
                              </span>
                              {isTaskActiveInProgress && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                                  title="Actively tracking"
                                />
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                              {isTaskActiveInProgress
                                ? "Live Working"
                                : totalProdMs > 0
                                ? "Total Tracked"
                                : "No Time"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 8. Status */}
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border shadow-2xs ${statusBadge.classes}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredTasks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131926]/50">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing{" "}
              <strong>
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTasks.length)} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
              </strong>{" "}
              of <strong>{filteredTasks.length}</strong> tasks
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs"
                title="Previous Page"
              >
                <FiChevronLeft size={14} />
              </button>

              <span className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs"
                title="Next Page"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusOverview;
