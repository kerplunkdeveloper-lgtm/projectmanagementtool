import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiSearch,
  FiFilter,
  FiPlus,
  FiCheck,
  FiX,
  FiMoreHorizontal,
  FiTrash2,
  FiEdit3,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiShare2,
  FiMessageSquare,
  FiPaperclip,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiTag,
  FiDownload,
  FiSend,
  FiCheckSquare,
  FiArrowRight,
  FiEye,
  FiCopy,
  FiRefreshCw,
  FiUser,
  FiLayers,
  FiBriefcase,
  FiList,
  FiColumns,
  FiGrid,
  FiMove,
  FiArrowDown,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
  FaWhatsapp,
  FaTiktok,
  FaPinterestP,
  FaHeart,
} from "react-icons/fa6";
import toast from "react-hot-toast";
import axiosInstance from "../../services/axiosInstance";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";

// Platform styling and icons config
export const getPlatformConfig = (platform) => {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return {
        name: "Instagram",
        icon: FaInstagram,
        bg: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/50",
        badgeBg:
          "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white",
        accent: "text-pink-600 dark:text-pink-400",
        ring: "ring-pink-500",
      };
    case "facebook":
      return {
        name: "Facebook",
        icon: FaFacebookF,
        bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
        badgeBg: "bg-blue-600 text-white",
        accent: "text-blue-600 dark:text-blue-400",
        ring: "ring-blue-500",
      };
    case "linkedin":
      return {
        name: "LinkedIn",
        icon: FaLinkedinIn,
        bg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50",
        badgeBg: "bg-[#0077b5] text-white",
        accent: "text-sky-600 dark:text-sky-400",
        ring: "ring-sky-500",
      };
    case "youtube":
      return {
        name: "YouTube",
        icon: FaYoutube,
        bg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50",
        badgeBg: "bg-[#ff0000] text-white",
        accent: "text-red-600 dark:text-red-400",
        ring: "ring-red-500",
      };
    case "x (twitter)":
    case "x":
    case "twitter":
      return {
        name: "X (Twitter)",
        icon: FaXTwitter,
        bg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
        badgeBg: "bg-black text-white dark:bg-slate-800",
        accent: "text-slate-800 dark:text-slate-200",
        ring: "ring-slate-500",
      };
    case "whatsapp":
      return {
        name: "WhatsApp",
        icon: FaWhatsapp,
        bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
        badgeBg: "bg-[#25D366] text-white",
        accent: "text-emerald-600 dark:text-emerald-400",
        ring: "ring-emerald-500",
      };
    case "tiktok":
      return {
        name: "TikTok",
        icon: FaTiktok,
        bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
        badgeBg: "bg-black text-white",
        accent: "text-purple-600",
        ring: "ring-purple-500",
      };
    case "pinterest":
      return {
        name: "Pinterest",
        icon: FaPinterestP,
        bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
        badgeBg: "bg-[#E60023] text-white",
        accent: "text-rose-600",
        ring: "ring-rose-500",
      };
    default:
      return {
        name: platform || "Other",
        icon: FiShare2,
        bg: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        badgeBg: "bg-indigo-600 text-white",
        accent: "text-indigo-600",
        ring: "ring-indigo-500",
      };
  }
};

// Priority badge config
const getPriorityBadge = (priority) => {
  switch (priority) {
    case "High":
      return {
        label: "High",
        bg: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/50",
        icon: FaHeart,
        color: "text-rose-500",
      };
    case "Medium":
      return {
        label: "Medium",
        bg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/50",
        icon: FiClock,
        color: "text-amber-500",
      };
    case "Low":
    default:
      return {
        label: "Low",
        bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/50",
        icon: FiCheck,
        color: "text-emerald-500",
      };
  }
};

// Status styling config
const getStatusConfig = (status) => {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "-");
  switch (norm) {
    case "to-do":
    case "todo":
    case "not-started":
      return {
        label: "To Do",
        bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
      };
    case "in-progress":
    case "inprogress":
      return {
        label: "In-Progress",
        bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40",
        dot: "bg-blue-500",
      };
    case "waiting":
    case "in-review":
      return {
        label: "Waiting",
        bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40",
        dot: "bg-amber-500",
      };
    case "scheduled":
      return {
        label: "Scheduled",
        bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/40",
        dot: "bg-purple-500",
      };
    case "published":
    case "completed":
      return {
        label: "Published",
        bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40",
        dot: "bg-emerald-500",
      };
    case "overdue":
      return {
        label: "Overdue",
        bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40",
        dot: "bg-rose-500",
      };
    default:
      return {
        label: status || "To Do",
        bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
      };
  }
};

// Distinct color theme generator for Calendar task cards
export const getCalendarCardTheme = (task, index = 0) => {
  const themes = [
    {
      bg: "bg-gradient-to-br from-indigo-50/95 via-indigo-50/50 to-blue-50/70 dark:from-indigo-950/50 dark:via-slate-900/60 dark:to-blue-950/30",
      border: "border-indigo-200/90 dark:border-indigo-800/70 border-l-[3.5px] !border-l-indigo-500 dark:!border-l-indigo-400",
      timeBg: "text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 border-indigo-200/70 dark:border-indigo-800/60",
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      bg: "bg-gradient-to-br from-emerald-50/95 via-emerald-50/50 to-teal-50/70 dark:from-emerald-950/50 dark:via-slate-900/60 dark:to-teal-950/30",
      border: "border-emerald-200/90 dark:border-emerald-800/70 border-l-[3.5px] !border-l-emerald-500 dark:!border-l-emerald-400",
      timeBg: "text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 border-emerald-200/70 dark:border-emerald-800/60",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      bg: "bg-gradient-to-br from-amber-50/95 via-amber-50/50 to-orange-50/70 dark:from-amber-950/50 dark:via-slate-900/60 dark:to-orange-950/30",
      border: "border-amber-200/90 dark:border-amber-800/70 border-l-[3.5px] !border-l-amber-500 dark:!border-l-amber-400",
      timeBg: "text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 border-amber-200/70 dark:border-amber-800/60",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      bg: "bg-gradient-to-br from-purple-50/95 via-purple-50/50 to-fuchsia-50/70 dark:from-purple-950/50 dark:via-slate-900/60 dark:to-fuchsia-950/30",
      border: "border-purple-200/90 dark:border-purple-800/70 border-l-[3.5px] !border-l-purple-500 dark:!border-l-purple-400",
      timeBg: "text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-900/60 border-purple-200/70 dark:border-purple-800/60",
      accent: "text-purple-600 dark:text-purple-400",
    },
    {
      bg: "bg-gradient-to-br from-rose-50/95 via-rose-50/50 to-pink-50/70 dark:from-rose-950/50 dark:via-slate-900/60 dark:to-pink-950/30",
      border: "border-rose-200/90 dark:border-rose-800/70 border-l-[3.5px] !border-l-rose-500 dark:!border-l-rose-400",
      timeBg: "text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/60 border-rose-200/70 dark:border-rose-800/60",
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      bg: "bg-gradient-to-br from-cyan-50/95 via-cyan-50/50 to-sky-50/70 dark:from-cyan-950/50 dark:via-slate-900/60 dark:to-sky-950/30",
      border: "border-cyan-200/90 dark:border-cyan-800/70 border-l-[3.5px] !border-l-cyan-500 dark:!border-l-cyan-400",
      timeBg: "text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-900/60 border-cyan-200/70 dark:border-cyan-800/60",
      accent: "text-cyan-600 dark:text-cyan-400",
    },
    {
      bg: "bg-gradient-to-br from-teal-50/95 via-teal-50/50 to-emerald-50/70 dark:from-teal-950/50 dark:via-slate-900/60 dark:to-emerald-950/30",
      border: "border-teal-200/90 dark:border-teal-800/70 border-l-[3.5px] !border-l-teal-500 dark:!border-l-teal-400",
      timeBg: "text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 border-teal-200/70 dark:border-teal-800/60",
      accent: "text-teal-600 dark:text-teal-400",
    },
  ];

  const key = task?._id || task?.taskName || String(index);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const themeIndex = Math.abs(hash) % themes.length;
  return themes[themeIndex];
};

const ContentCalcendor = () => {
  const dispatch = useDispatch();

  // Auth User from Redux
  const { user: authUser } = useSelector((state) => state.auth);

  // Dynamic Clients & Users from Redux
  const clientsState = useSelector((state) => state.clients);
  const dbClients = useMemo(() => {
    return clientsState?.clients || clientsState?.data || [];
  }, [clientsState]);

  const usersState = useSelector((state) => state.users);
  const dbUsers = useMemo(() => {
    return usersState?.users || usersState?.data || [];
  }, [usersState]);

  // View Mode: 'list' (List/Table View), 'kanban' (Kanban Board), or 'calendar' (Calendar Grid)
  const [viewMode, setViewMode] = useState("list");

  // Drag and drop states for Kanban & Calendar
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  // Dynamic Tasks State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected task id (for tracking active selections if needed)
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Subtask UI state for Table View
  const [expandedSubtasks, setExpandedSubtasks] = useState({});
  const [subtaskFormInputs, setSubtaskFormInputs] = useState({});
  const [editingSubtask, setEditingSubtask] = useState(null); // { taskId, subtaskId, title }

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [sortOption, setSortOption] = useState("dueDateSoonest");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // User Role & Department Authorization (Strictly Social Media Manager department only)
  const userRole = (authUser?.role || "").toLowerCase();
  const userDept = (authUser?.department || "").toLowerCase();
  const isManagerOrAdmin =
    userRole === "admin" || userRole === "operationmanager";
  const isSocialMediaDept =
    userDept.includes("social media manager") ||
    userDept.includes("social media") ||
    userRole === "socialmediamanager";
  const isAuthorized = isSocialMediaDept;

  // Filter dbUsers for ONLY Social Media Manager department
  const socialMediaUsers = useMemo(() => {
    return dbUsers.filter((u) => {
      const dept = (u.department || "").toLowerCase();
      const r = (u.role || "").toLowerCase();
      return (
        dept.includes("social media manager") ||
        dept.includes("social media") ||
        r === "socialmediamanager"
      );
    });
  }, [dbUsers]);

  // Selection for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Add / Edit Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalPlatforms, setModalPlatforms] = useState(["Instagram"]);
  const [modalAssignedUserId, setModalAssignedUserId] = useState("");
  const [modalClientName, setModalClientName] = useState("");

  // Sync modal state when modal opens or editingTask changes
  useEffect(() => {
    if (isTaskModalOpen) {
      if (editingTask) {
        const initialPlatforms =
          Array.isArray(editingTask.platforms) &&
          editingTask.platforms.length > 0
            ? editingTask.platforms
            : editingTask.platform
              ? [editingTask.platform]
              : ["Instagram"];
        setModalPlatforms(initialPlatforms);

        const initialUserId =
          (editingTask.assignedTo &&
            (editingTask.assignedTo[0]?._id || editingTask.assignedTo[0])) ||
          editingTask.createdBy?._id ||
          (typeof editingTask.createdBy === "string"
            ? editingTask.createdBy
            : "") ||
          authUser?._id ||
          "";
        setModalAssignedUserId(initialUserId);

        const initialClient =
          editingTask.client?.companyName || editingTask.clientName || "";
        setModalClientName(initialClient);
      } else {
        setModalPlatforms(["Instagram"]);
        const initialUserId = authUser?._id || "";
        setModalAssignedUserId(initialUserId);

        // Pre-select first assigned client for the user if available
        const userAssigned = dbClients.filter((c) => {
          if (!initialUserId) return true;
          const targetId = String(initialUserId);
          if (Array.isArray(c.assignedTo)) {
            const hasAssigned = c.assignedTo.some((u) => {
              const uId =
                typeof u === "object" && u !== null ? u._id || u.id : u;
              return String(uId) === targetId;
            });
            if (hasAssigned) return true;
          }
          const createdById =
            typeof c.createdBy === "object" && c.createdBy !== null
              ? c.createdBy._id || c.createdBy.id
              : c.createdBy;
          return createdById && String(createdById) === targetId;
        });

        if (userAssigned.length > 0) {
          setModalClientName(userAssigned[0].companyName);
        } else {
          setModalClientName("");
        }
      }
    }
  }, [isTaskModalOpen, editingTask, authUser, dbClients]);

  // Toggle platform in modal
  const toggleModalPlatform = (pName) => {
    setModalPlatforms((prev) => {
      if (prev.includes(pName)) {
        if (prev.length === 1) {
          toast.error("Please keep at least one platform selected");
          return prev;
        }
        return prev.filter((p) => p !== pName);
      } else {
        return [...prev, pName];
      }
    });
  };

  // Calendar specific state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState("month"); // 'month' or 'week'

  // Load clients and users on mount
  useEffect(() => {
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch]);

  // Fetch dynamic content calendar tasks from DB
  const fetchTasks = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const res = await axiosInstance.get("/content-calendar");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTasks(res.data.data);
        if (res.data.data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(res.data.data[0]._id);
        }
        if (showToast) toast.success("Refreshed successfully!");
      }
    } catch (err) {
      console.error("Error fetching content calendar tasks:", err);
      if (showToast) toast.error("Failed to fetch tasks from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Currently selected task
  const selectedTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    return tasks.find((t) => t._id === selectedTaskId) || tasks[0] || null;
  }, [tasks, selectedTaskId]);

  // Date formatting helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Time formatting helper
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    return timeString;
  };

  // Dynamic Metrics summaries
  const metrics = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return (
        s === "to do" || s === "to-do" || s === "todo" || s === "not started"
      );
    }).length;
    const inProgress = tasks.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s === "in-progress" || s === "in progress" || s === "inprogress";
    }).length;
    const waiting = tasks.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s === "waiting" || s === "in review" || s === "in-review";
    }).length;
    const scheduled = tasks.filter(
      (t) => (t.status || "").toLowerCase() === "scheduled",
    ).length;
    const published = tasks.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s === "published" || s === "completed";
    }).length;

    return { total, todo, inProgress, waiting, scheduled, published };
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = task.taskName?.toLowerCase().includes(q);
          const matchClient =
            task.clientName?.toLowerCase().includes(q) ||
            task.client?.companyName?.toLowerCase().includes(q);
          const matchCat = task.taskCategory?.toLowerCase().includes(q);
          const tPlatforms =
            Array.isArray(task.platforms) && task.platforms.length > 0
              ? task.platforms
              : [task.platform];
          const matchPlatform = tPlatforms.some((p) =>
            p?.toLowerCase().includes(q),
          );
          const matchTag = task.tags?.some((tag) =>
            tag.toLowerCase().includes(q),
          );
          if (
            !matchName &&
            !matchClient &&
            !matchCat &&
            !matchPlatform &&
            !matchTag
          ) {
            return false;
          }
        }

        // Status Filter Pill
        if (statusFilter !== "All" && task.status !== statusFilter) {
          return false;
        }

        // Platform Filter
        if (platformFilter !== "All") {
          const tPlatforms =
            Array.isArray(task.platforms) && task.platforms.length > 0
              ? task.platforms
              : [task.platform];
          if (!tPlatforms.includes(platformFilter)) {
            return false;
          }
        }

        // Client Filter
        if (clientFilter !== "All") {
          const cName = task.client?.companyName || task.clientName;
          if (cName !== clientFilter) return false;
        }

        // Poster / User Filter
        if (userFilter !== "All") {
          const isCreated =
            (task.createdBy?._id || task.createdBy) === userFilter;
          const isAssigned =
            Array.isArray(task.assignedTo) &&
            task.assignedTo.some(
              (u) => (u?._id || u) === userFilter,
            );
          const isSubtaskAssigned =
            Array.isArray(task.subtasks) &&
            task.subtasks.some(
              (st) => (st.assigneeUser?._id || st.assigneeUser) === userFilter,
            );
          if (!isCreated && !isAssigned && !isSubtaskAssigned) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "dueDateSoonest") {
          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        }
        if (sortOption === "dueDateLatest") {
          return new Date(b.dueDate || 0) - new Date(a.dueDate || 0);
        }
        if (sortOption === "priority") {
          const weight = { High: 3, Medium: 2, Low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        if (sortOption === "nameAZ") {
          return (a.taskName || "").localeCompare(b.taskName || "");
        }
        if (sortOption === "status") {
          return (a.status || "").localeCompare(b.status || "");
        }
        return 0;
      });
  }, [
    tasks,
    searchQuery,
    statusFilter,
    platformFilter,
    clientFilter,
    userFilter,
    sortOption,
  ]);

  // Helper to determine if a client is assigned to a specific user
  const isClientAssignedToUser = (clientObj, userId) => {
    if (!clientObj || !userId) return false;
    const targetId = String(userId);
    if (Array.isArray(clientObj.assignedTo)) {
      const isAssigned = clientObj.assignedTo.some((u) => {
        const uId =
          typeof u === "object" && u !== null ? u._id || u.id : u;
        return String(uId) === targetId;
      });
      if (isAssigned) return true;
    }
    const createdById =
      typeof clientObj.createdBy === "object" && clientObj.createdBy !== null
        ? clientObj.createdBy._id || clientObj.createdBy.id
        : clientObj.createdBy;
    if (createdById && String(createdById) === targetId) {
      return true;
    }
    return false;
  };

  // Assigned clients for the user selected in the modal
  const modalAssignedClients = useMemo(() => {
    const targetUserId = modalAssignedUserId || authUser?._id;
    if (!targetUserId) return dbClients;
    return dbClients.filter((c) => isClientAssignedToUser(c, targetUserId));
  }, [dbClients, modalAssignedUserId, authUser]);

  // Other agency clients (for managers/admins)
  const modalOtherClients = useMemo(() => {
    if (!isManagerOrAdmin) return [];
    const targetUserId = modalAssignedUserId || authUser?._id;
    if (!targetUserId) return [];
    return dbClients.filter((c) => !isClientAssignedToUser(c, targetUserId));
  }, [dbClients, modalAssignedUserId, authUser, isManagerOrAdmin]);

  // Unique clients list from DB and existing tasks
  const dynamicClientsList = useMemo(() => {
    const set = new Set();
    if (!isManagerOrAdmin && authUser?._id) {
      const myClients = dbClients.filter((c) =>
        isClientAssignedToUser(c, authUser._id),
      );
      myClients.forEach((c) => {
        if (c.companyName) set.add(c.companyName);
      });
      tasks.forEach((t) => {
        if (t.client?.companyName) set.add(t.client.companyName);
        else if (t.clientName) set.add(t.clientName);
      });
    } else {
      dbClients.forEach((c) => {
        if (c.companyName) set.add(c.companyName);
      });
      tasks.forEach((t) => {
        if (t.client?.companyName) set.add(t.client.companyName);
        else if (t.clientName) set.add(t.clientName);
      });
    }
    return Array.from(set).filter(Boolean);
  }, [dbClients, tasks, isManagerOrAdmin, authUser]);

  const platformOptions = [
    "Instagram",
    "Facebook",
    "LinkedIn",
    "YouTube",
    "X (Twitter)",
    "WhatsApp",
    "TikTok",
    "Pinterest",
  ];

  const categoryOptions = [
    "Publishing",
    "Community Mgmt",
    "Review & Approval",
    "Content Planning",
    "Coordination",
    "Reporting",
    "Shoot Management",
    "Documentation",
    "Performance Support",
  ];

  // Multi-select row handling
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTaskIds(filteredTasks.map((t) => t._id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Update Task directly in backend DB
  const handleUpdateTask = async (taskId, updatedFields) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updatedFields } : t)),
    );

    try {
      const res = await axiosInstance.put(
        `/content-calendar/${taskId}`,
        updatedFields,
      );
      if (res.data?.success && res.data?.data) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.data : t)),
        );
      }
    } catch (err) {
      console.error("Failed to update task in backend:", err);
      toast.error("Failed to sync change to server");
      fetchTasks();
    }
  };

  // Delete Task from backend DB
  const handleDeleteTask = async (taskId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this content task?"))
      return;

    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    if (selectedTaskId === taskId) {
      const remaining = tasks.filter((t) => t._id !== taskId);
      setSelectedTaskId(remaining[0]?._id || null);
    }
    toast.success("Task deleted successfully");

    try {
      await axiosInstance.delete(`/content-calendar/${taskId}`);
    } catch (err) {
      console.error("Failed to delete task from backend:", err);
      toast.error("Server error deleting task");
      fetchTasks();
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedTaskIds.length === 0) return;
    setTasks((prev) =>
      prev.map((t) =>
        selectedTaskIds.includes(t._id) ? { ...t, status: newStatus } : t,
      ),
    );
    toast.success(`Updated ${selectedTaskIds.length} tasks to ${newStatus}`);

    try {
      await axiosInstance.post("/content-calendar/bulk", {
        action: "updateStatus",
        taskIds: selectedTaskIds,
        status: newStatus,
      });
    } catch (err) {
      console.error("Bulk update failed:", err);
    }
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedTaskIds.length} selected tasks?`))
      return;

    setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t._id)));
    toast.success(`Deleted ${selectedTaskIds.length} tasks`);

    try {
      await axiosInstance.post("/content-calendar/bulk", {
        action: "delete",
        taskIds: selectedTaskIds,
      });
    } catch (err) {
      console.error("Bulk delete failed:", err);
    }
    setSelectedTaskIds([]);
  };

  // Toggle subtasks expand in table
  const toggleExpandSubtasks = (taskId, e) => {
    if (e) e.stopPropagation();
    setExpandedSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Subtask Toggle Handler for any task
  const handleToggleTaskSubtask = async (taskId, subId, e) => {
    if (e) e.stopPropagation();
    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask) return;

    const updatedSubtasks = (targetTask.subtasks || []).map((st, idx) => {
      const currentId = st._id || st.id || `sub-${idx}`;
      return currentId === subId ? { ...st, completed: !st.completed } : st;
    });

    handleUpdateTask(taskId, { subtasks: updatedSubtasks });
    if (activeSubtaskModalTask?._id === taskId) {
      setActiveSubtaskModalTask((prev) =>
        prev ? { ...prev, subtasks: updatedSubtasks } : null,
      );
    }
  };

  // Add Subtask for any task
  const handleAddTaskSubtask = (taskId, e) => {
    if (e) e.preventDefault();
    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask) return;

    const currentInput = subtaskFormInputs[taskId] || {};
    if (!currentInput.title || !currentInput.title.trim()) {
      toast.error("Please enter a subtask title");
      return;
    }

    const newSub = {
      title: currentInput.title.trim(),
      completed: false,
    };

    const updatedSubtasks = [...(targetTask.subtasks || []), newSub];
    handleUpdateTask(taskId, { subtasks: updatedSubtasks });
    setSubtaskFormInputs((prev) => ({
      ...prev,
      [taskId]: { title: "" },
    }));
    if (activeSubtaskModalTask?._id === taskId) {
      setActiveSubtaskModalTask((prev) =>
        prev ? { ...prev, subtasks: updatedSubtasks } : null,
      );
    }
    toast.success("Subtask added successfully");
  };

  // Delete Subtask for any task
  const handleDeleteTaskSubtask = (taskId, subId, e) => {
    if (e) e.stopPropagation();
    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask) return;

    const updatedSubtasks = (targetTask.subtasks || []).filter((st, idx) => {
      const currentId = st._id || st.id || `sub-${idx}`;
      return currentId !== subId;
    });
    handleUpdateTask(taskId, { subtasks: updatedSubtasks });
    if (activeSubtaskModalTask?._id === taskId) {
      setActiveSubtaskModalTask((prev) =>
        prev ? { ...prev, subtasks: updatedSubtasks } : null,
      );
    }
    if (editingSubtask?.subtaskId === subId) {
      setEditingSubtask(null);
    }
    toast.success("Subtask removed");
  };

  // Start Editing Subtask
  const handleStartEditSubtask = (taskId, subtask, subId, e) => {
    if (e) e.stopPropagation();
    setEditingSubtask({
      taskId,
      subtaskId: subId,
      title: subtask?.title || "",
    });
  };

  // Cancel Editing Subtask
  const handleCancelEditSubtask = (e) => {
    if (e) e.stopPropagation();
    setEditingSubtask(null);
  };

  // Save Editing Subtask
  const handleSaveEditSubtask = (taskId, subId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editingSubtask || editingSubtask.subtaskId !== subId) return;
    if (!editingSubtask.title || !editingSubtask.title.trim()) {
      toast.error("Subtask title cannot be empty");
      return;
    }

    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask) return;

    const updatedSubtasks = (targetTask.subtasks || []).map((st, idx) => {
      const currentId = st._id || st.id || `sub-${idx}`;
      if (currentId === subId) {
        return {
          ...st,
          title: editingSubtask.title.trim(),
        };
      }
      return st;
    });

    handleUpdateTask(taskId, { subtasks: updatedSubtasks });
    if (activeSubtaskModalTask?._id === taskId) {
      setActiveSubtaskModalTask((prev) =>
        prev ? { ...prev, subtasks: updatedSubtasks } : null,
      );
    }
    setEditingSubtask(null);
    toast.success("Subtask updated successfully");
  };

  // Save Task from Modal (Create or Edit in DB)
  const handleSaveModalTask = async (taskFormData) => {
    try {
      const selectedClientName = taskFormData.clientName?.trim();
      const matchedClient = dbClients.find(
        (c) =>
          c._id === selectedClientName ||
          c.companyName?.toLowerCase() === selectedClientName?.toLowerCase(),
      );

      const payload = {
        ...taskFormData,
        clientName: matchedClient?.companyName || selectedClientName,
        client: matchedClient?._id || undefined,
      };

      if (editingTask && editingTask._id) {
        // Edit existing task
        const res = await axiosInstance.put(
          `/content-calendar/${editingTask._id}`,
          payload,
        );
        if (res.data?.success) {
          setTasks((prev) =>
            prev.map((t) => (t._id === editingTask._id ? res.data.data : t)),
          );
          toast.success("Task updated successfully!");
        }
      } else {
        // Create new task in DB
        const res = await axiosInstance.post("/content-calendar", payload);
        if (res.data?.success && res.data?.data) {
          setTasks((prev) => [res.data.data, ...prev]);
          setSelectedTaskId(res.data.data._id);
          toast.success("Content task scheduled successfully!");
        }
      }
    } catch (err) {
      console.error("Error saving task:", err);
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setIsTaskModalOpen(false);
      setEditingTask(null);
    }
  };

  // Month navigation for Calendar
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Render Calendar Grid Days dynamically
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Access check: strictly Social Media Manager department only
  if (!loading && authUser && !isAuthorized) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-center text-3xl mb-4 shadow-sm">
          <FiAlertCircle />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Access Restricted to Social Media Manager Department
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          Content Calendar is exclusively configured for the Social Media Manager department.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd] dark:bg-[#060a12] text-slate-800 dark:text-slate-100  transition-colors duration-200">
      <div className="max-w-[1750px] mx-auto space-y-5">
       
     

        {/* ============================================================ */}
        {/* 2. DYNAMIC STATS / METRIC CARDS ROW                          */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Total Tasks */}
          <div className="bg-white/90 dark:bg-[#0d1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center text-xl shrink-0">
              <FiCalendar />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.total}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Total Tasks
              </div>
            </div>
          </div>

          {/* To Do */}
          <div className="bg-white/90 dark:bg-[#0d1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 flex items-center justify-center text-xl shrink-0">
              <FiCheckSquare />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.todo}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                To Do
              </div>
            </div>
          </div>

          {/* In-Progress */}
          <div className="bg-white/90 dark:bg-[#0d1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-500/40 transition-all flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20 flex items-center justify-center text-xl shrink-0">
              <FiClock />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.inProgress}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                In-Progress
              </div>
            </div>
          </div>

          {/* Waiting */}
          <div className="bg-white/90 dark:bg-[#0d1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center justify-center text-xl shrink-0">
              <FiClock />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.waiting}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Waiting
              </div>
            </div>
          </div>

          {/* Scheduled */}
          <div className="bg-white/90 dark:bg-[#0d1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 flex items-center justify-center text-xl shrink-0">
              <FiEye />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.scheduled}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Scheduled
              </div>
            </div>
          </div>

          {/* Published */}
          <div className="bg-white/90 dark:bg-[#0d1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center text-xl shrink-0">
              <FiCheckCircle />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.published}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Published
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. MAIN WORKSPACE (List View, Kanban Board, Calendar View)   */}
        {/* ============================================================ */}
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* LEFT/CENTER: VIEW WORKSPACE */}
          <div className="w-full flex-1 min-w-0 p-2 space-y-4">
            {/* View Switcher Bar & Main Action Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-1">
              {/* Segmented View Switcher: List, Kanban, Calendar */}
              <div className="inline-flex p-1 bg-slate-100/90 dark:bg-[#0d1322] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    viewMode === "list"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs dark:shadow-md dark:shadow-indigo-600/30 ring-1 ring-slate-200/60 dark:ring-indigo-500"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <FiList className="w-4 h-4" />
                  <span>List View</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      viewMode === "list"
                        ? "bg-indigo-50 dark:bg-white/20 text-indigo-600 dark:text-white"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {filteredTasks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs dark:shadow-md dark:shadow-indigo-600/30 ring-1 ring-slate-200/60 dark:ring-indigo-500"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <FiColumns className="w-4 h-4" />
                  <span>Kanban View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    viewMode === "calendar"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs dark:shadow-md dark:shadow-indigo-600/30 ring-1 ring-slate-200/60 dark:ring-indigo-500"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <FiCalendar className="w-4 h-4" />
                  <span>Calendar View</span>
                </button>
              </div>

              {/* Search, Filter Popover Toggle & Add Task Button */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-60">
                  <input
                    type="text"
                    placeholder="Search tasks, clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-7 py-2 bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                 
                
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilterModal(!showFilterModal)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    platformFilter !== "All" ||
                    clientFilter !== "All" ||
                    userFilter !== "All" ||
                    statusFilter !== "All"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-bold"
                      : "bg-white dark:bg-[#0d1322] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <FiFilter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                  {(platformFilter !== "All" ||
                    clientFilter !== "All" ||
                    userFilter !== "All" ||
                    statusFilter !== "All") && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  )}
                </button>

                {/* Add Task Button */}
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

                {/* Filter Popover */}
                <AnimatePresence>
                  {showFilterModal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Platform
                        </label>
                        <select
                          value={platformFilter}
                          onChange={(e) => setPlatformFilter(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-[#111728] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Platforms</option>
                          {platformOptions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Client
                        </label>
                        <select
                          value={clientFilter}
                          onChange={(e) => setClientFilter(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-[#111728] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Clients</option>
                          {dynamicClientsList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setPlatformFilter("All");
                            setClientFilter("All");
                            setUserFilter("All");
                            setStatusFilter("All");
                            setShowFilterModal(false);
                          }}
                          className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ----------------- IF VIEW MODE IS LIST ----------------- */}
                {viewMode === "list" && (
                  <>
                    {/* Bulk Actions Floating Bar */}
                    {selectedTaskIds.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                          {selectedTaskIds.length} tasks selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBulkStatusChange("Published")}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                          >
                            Mark Published
                          </button>
                          <button
                            onClick={() => handleBulkStatusChange("In-Progress")}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                          >
                            Set In-Progress
                          </button>
                          <button
                            onClick={() => handleBulkStatusChange("Scheduled")}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                          >
                            Set Scheduled
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 flex items-center gap-1"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                          <button
                            onClick={() => setSelectedTaskIds([])}
                            className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* DATA TABLE */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-2xs">
                      <table className="content-calendar-table w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-3 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  filteredTasks.length > 0 &&
                                  selectedTaskIds.length === filteredTasks.length
                                }
                                onChange={handleSelectAll}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                              />
                            </th>
                            <th className="py-3 px-3 font-bold">Task Name</th>
                            <th className="py-3 px-3 font-bold">Client</th>
                            <th className="py-3 px-3 font-bold">Poster</th>
                            <th className="py-3 px-3 font-bold">Category</th>
                            <th className="py-3 px-3 font-bold">Platform</th>
                            <th className="py-3 px-3 font-bold">Due Date</th>
                            <th className="py-3 px-3 font-bold">Priority</th>
                            <th className="py-3 px-3 font-bold">Status</th>
                            <th className="py-3 px-3 font-bold">Subtasks</th>
                            <th className="py-3 px-3 font-bold text-center w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {loading ? (
                            <tr>
                              <td
                                colSpan={11}
                                className="py-12 text-center text-slate-400"
                              >
                                <div className="flex flex-col items-center justify-center space-y-2.5">
                                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[11px] font-semibold">
                                    Loading content tasks...
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ) : filteredTasks.length === 0 ? (
                            <tr>
                              <td
                                colSpan={11}
                                className="py-12 text-center text-slate-400"
                              >
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center text-lg">
                                    <FiCalendar />
                                  </div>
                                  <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                    No content tasks yet
                                  </p>
                                  <p className="text-[11px] text-slate-400 max-w-sm">
                                    Create your first content schedule post to start
                                    tracking social media deliverables.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setEditingTask(null);
                                      setIsTaskModalOpen(true);
                                    }}
                                    className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                                  >
                                    + Create First Task
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredTasks.map((task, tIdx) => {
                              const taskId = task._id || `task-${tIdx}`;
                              const isSelected = selectedTaskId === task._id;
                              const isChecked = selectedTaskIds.includes(task._id);
                              const isExpanded = !!expandedSubtasks[task._id];
                              const tPlatforms =
                                Array.isArray(task.platforms) &&
                                task.platforms.length > 0
                                  ? task.platforms
                                  : [task.platform || "Instagram"];
                              const priorityCfg = getPriorityBadge(task.priority);
                              const statusCfg = getStatusConfig(task.status);
                              const displayClientName =
                                task.client?.companyName ||
                                task.clientName ||
                                "Client";

                              // Poster / Assigned Member
                              const poster =
                                (task.assignedTo && task.assignedTo[0]) ||
                                task.createdBy ||
                                null;
                              const posterName =
                                poster?.name ||
                                (typeof task.createdBy === "string"
                                  ? task.createdBy
                                  : "Team");
                              const posterAvatar =
                                poster?.profileImage ||
                                poster?.avatar ||
                                poster?.profile?.avatar;
                              const posterInitials = posterName
                                ? posterName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                : "ME";

                              // Subtask calculation
                              const totalSubs = task.subtasks?.length || 0;
                              const completedSubs =
                                task.subtasks?.filter((s) => s.completed)?.length ||
                                0;
                              const progressPct =
                                totalSubs > 0
                                  ? Math.round((completedSubs / totalSubs) * 100)
                                  : 0;

                              return (
                                <React.Fragment key={taskId}>
                                  <tr
                                    onClick={() => setSelectedTaskId(task._id)}
                                    className={`content-task-row group cursor-pointer transition-all duration-150 text-xs ${
                                      isExpanded
                                        ? "is-expanded !border-l-2 !border-l-indigo-500"
                                        : isSelected
                                          ? "bg-indigo-50/40 dark:bg-indigo-950/30"
                                          : ""
                                    }`}
                                  >
                                    {/* Checkbox */}
                                    <td
                                      className="py-2.5 px-3 text-center"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) =>
                                          handleToggleSelectRow(task._id, e)
                                        }
                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                      />
                                    </td>

                                    {/* Task Name */}
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white max-w-[180px] truncate text-xs leading-tight">
                                      {task.taskName}
                                    </td>

                                    {/* Client Name */}
                                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium text-xs truncate max-w-[120px]">
                                      {displayClientName}
                                    </td>

                                    {/* Poster / Member */}
                                    <td
                                      className="py-2.5 px-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div
                                        className="flex items-center gap-1.5"
                                        title={`Poster / Assigned: ${posterName}`}
                                      >
                                        {posterAvatar ? (
                                          <img
                                            src={posterAvatar}
                                            alt={posterName}
                                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs shrink-0"
                                          />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 shadow-2xs">
                                            {posterInitials}
                                          </div>
                                        )}
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[85px]">
                                          {posterName}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Task Category (Editable Dropdown) */}
                                    <td
                                      className="py-2.5 px-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="relative inline-block">
                                        <select
                                          value={task.taskCategory || "Publishing"}
                                          onChange={(e) =>
                                            handleUpdateTask(task._id, {
                                              taskCategory: e.target.value,
                                            })
                                          }
                                          aria-label="Edit Task Category"
                                          className="appearance-none cursor-pointer pl-2.5 pr-5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100/90 dark:bg-[#111728] hover:bg-slate-200/80 dark:hover:bg-[#161f36] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                          {categoryOptions.map((cat) => (
                                            <option
                                              key={cat}
                                              value={cat}
                                              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                            >
                                              {cat}
                                            </option>
                                          ))}
                                        </select>
                                        <FiChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                      </div>
                                    </td>

                                    {/* Platform Badges (Icons Only) */}
                                    <td className="py-2.5 px-3">
                                      <div className="flex flex-wrap items-center gap-1">
                                        {tPlatforms.map((pName, pIdx) => {
                                          const pCfg = getPlatformConfig(pName);
                                          return (
                                            <span
                                              key={`${pName}-${pIdx}`}
                                              title={`Platform: ${pName}`}
                                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs border shadow-2xs transition-transform hover:scale-110 ${pCfg.bg}`}
                                            >
                                              <pCfg.icon className="w-2.5 h-2.5 shrink-0" />
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </td>

                                    {/* Due Date & Time */}
                                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap leading-tight">
                                      <div>{formatDate(task.dueDate)}</div>
                                      {task.dueTime && (
                                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 mt-0.5">
                                          <FiClock className="w-2.5 h-2.5" />
                                          <span>{formatTime(task.dueTime)}</span>
                                        </div>
                                      )}
                                    </td>

                                    {/* Priority Badge */}
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityCfg.bg}`}
                                      >
                                        <priorityCfg.icon
                                          className={`w-2.5 h-2.5 ${priorityCfg.color}`}
                                        />
                                        <span>{priorityCfg.label}</span>
                                      </span>
                                    </td>

                                    {/* Status (Editable Dropdown) */}
                                    <td
                                      className="py-2.5 px-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="relative inline-flex items-center">
                                        <select
                                          value={task.status || "To Do"}
                                          onChange={(e) =>
                                            handleUpdateTask(task._id, {
                                              status: e.target.value,
                                            })
                                          }
                                          aria-label="Edit Status"
                                          className={`appearance-none cursor-pointer pl-5 pr-5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs transition-all hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${statusCfg.bg}`}
                                        >
                                          <option
                                            value="To Do"
                                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                          >
                                            To Do
                                          </option>
                                          <option
                                            value="In-Progress"
                                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                          >
                                            In-Progress
                                          </option>
                                          <option
                                            value="Waiting"
                                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                          >
                                            Waiting
                                          </option>
                                          <option
                                            value="Scheduled"
                                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                          >
                                            Scheduled
                                          </option>
                                          <option
                                            value="Published"
                                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                          >
                                            Published
                                          </option>
                                        </select>
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusCfg.dot}`}
                                        />
                                        <FiChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                      </div>
                                    </td>

                                    {/* Subtasks Interactive Dropdown Button */}
                                    <td
                                      className="py-2.5 px-3 min-w-[130px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          toggleExpandSubtasks(task._id, e)
                                        }
                                        className={`group/sub inline-flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all duration-150 ${
                                          isExpanded
                                            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30 font-bold"
                                            : totalSubs === 0
                                              ? "border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#111728] text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30"
                                              : progressPct === 100
                                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 shadow-2xs hover:bg-emerald-100/70"
                                                : "bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs hover:bg-indigo-100/70"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          {totalSubs > 0 && progressPct === 100 ? (
                                            <FiCheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                          ) : (
                                            <FiList className="w-3 h-3 shrink-0 opacity-80" />
                                          )}
                                          <span>
                                            Subtasks {totalSubs > 0 ? `(${completedSubs}/${totalSubs})` : `(0)`}
                                          </span>
                                        </div>
                                        {isExpanded ? (
                                          <FiChevronUp className="w-3.5 h-3.5 shrink-0" />
                                        ) : (
                                          <FiChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                        )}
                                      </button>
                                    </td>

                                    {/* Actions: Edit, Delete */}
                                    <td
                                      className="py-2.5 px-3 text-center whitespace-nowrap"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {/* Edit Button */}
                                        <button
                                          onClick={() => {
                                            setEditingTask(task);
                                            setIsTaskModalOpen(true);
                                          }}
                                          title="Edit Task"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all hover:scale-110"
                                        >
                                          <FiEdit3 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                          onClick={(e) =>
                                            handleDeleteTask(task._id, e)
                                          }
                                          title="Delete Task"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all hover:scale-110"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* EXPANDABLE SUBTASKS PANEL */}
                                  {isExpanded && (
                                    <tr className="expanded-subtask-panel bg-slate-50/60 dark:bg-[#070a12] border-b border-indigo-100/50 dark:border-indigo-950/60">
                                      <td
                                        colSpan={11}
                                        className="py-3 px-3 sm:px-6"
                                      >
                                        <motion.div
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -4 }}
                                          className="p-3 bg-white dark:bg-[#0d121f] rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm space-y-2.5"
                                        >
                                          {/* Existing Subtasks List */}
                                          {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="space-y-1.5 pb-1">
                                              {task.subtasks.map((st, sIdx) => {
                                                const subId = st._id || st.id || `sub-${sIdx}`;
                                                const isEditingThis = Boolean(
                                                  editingSubtask &&
                                                  editingSubtask.taskId === task._id &&
                                                  editingSubtask.subtaskId === subId
                                                );

                                                if (isEditingThis) {
                                                  return (
                                                    <form
                                                      key={subId}
                                                      onSubmit={(e) => handleSaveEditSubtask(task._id, subId, e)}
                                                      className="p-1.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-500/70 shadow-xs flex items-center gap-1.5 transition-all"
                                                    >
                                                      <input
                                                        type="text"
                                                        value={editingSubtask?.title || ""}
                                                        onChange={(e) =>
                                                          setEditingSubtask((prev) => ({
                                                            ...prev,
                                                            title: e.target.value,
                                                          }))
                                                        }
                                                        autoFocus
                                                        placeholder="Subtask title..."
                                                        className="flex-1 min-w-[160px] p-1.5 bg-white dark:bg-[#111728] border border-indigo-300 dark:border-indigo-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                                      />

                                                      <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                          type="submit"
                                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                                                        >
                                                          <FiCheck className="w-3 h-3" />
                                                          <span>Save</span>
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={handleCancelEditSubtask}
                                                          className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-all"
                                                          title="Cancel"
                                                        >
                                                          <FiX className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    </form>
                                                  );
                                                }

                                                return (
                                                  <div
                                                    key={subId}
                                                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-colors text-[11px] ${
                                                      st.completed
                                                        ? "bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-80"
                                                        : "bg-slate-50/80 dark:bg-[#121829] hover:bg-slate-100/80 dark:hover:bg-[#172036] border-slate-100 dark:border-slate-800/80"
                                                    }`}
                                                  >
                                                    <label className="flex items-center gap-2 cursor-pointer flex-1 select-none min-w-0">
                                                      <input
                                                        type="checkbox"
                                                        checked={!!st.completed}
                                                        onChange={(e) =>
                                                          handleToggleTaskSubtask(
                                                            task._id,
                                                            subId,
                                                            e,
                                                          )
                                                        }
                                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                                                      />
                                                      <span
                                                        className={`font-semibold truncate text-[11px] ${
                                                          st.completed
                                                            ? "line-through text-slate-400 dark:text-slate-500"
                                                            : "text-slate-800 dark:text-slate-200"
                                                        }`}
                                                      >
                                                        {st.title}
                                                      </span>
                                                    </label>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={(e) =>
                                                          handleStartEditSubtask(
                                                            task._id,
                                                            st,
                                                            subId,
                                                            e,
                                                          )
                                                        }
                                                        title="Edit Subtask"
                                                        className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                                      >
                                                        <FiEdit3 className="w-3 h-3" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={(e) =>
                                                          handleDeleteTaskSubtask(
                                                            task._id,
                                                            subId,
                                                            e,
                                                          )
                                                        }
                                                        title="Delete Subtask"
                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                      >
                                                        <FiTrash2 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}

                                          {/* Direct Inline Subtask Input Row */}
                                          <form
                                            onSubmit={(e) =>
                                              handleAddTaskSubtask(task._id, e)
                                            }
                                            className="flex gap-2 items-center"
                                          >
                                            <div className="relative flex-1 min-w-[180px]">
                                              <input
                                                type="text"
                                                placeholder="+ Add new subtask..."
                                                value={
                                                  subtaskFormInputs[task._id]?.title || ""
                                                }
                                                onChange={(e) =>
                                                  setSubtaskFormInputs((prev) => ({
                                                    ...prev,
                                                    [task._id]: {
                                                      ...(prev[task._id] || {}),
                                                      title: e.target.value,
                                                    },
                                                  }))
                                                }
                                                className="w-full p-2 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                              />
                                            </div>

                                            <button
                                              type="submit"
                                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-500/20 flex items-center gap-1 shrink-0 active:scale-95"
                                            >
                                              <FiPlus className="w-3.5 h-3.5" />
                                              <span>Add</span>
                                            </button>
                                          </form>
                                        </motion.div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}


              {/* ----------------- IF VIEW MODE IS KANBAN ----------------- */}
              {viewMode === "kanban" && (
                <div className="space-y-4">
                  {/* Kanban Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                    {[
                      {
                        status: "To Do",
                        label: "To Do",
                        bg: "bg-slate-100/90 dark:bg-slate-800/60",
                        border: "border-slate-200/80 dark:border-slate-700/60",
                        dot: "bg-slate-400",
                        textColor: "text-slate-700 dark:text-slate-300",
                      },
                      {
                        status: "In-Progress",
                        label: "In-Progress",
                        bg: "bg-blue-50/50 dark:bg-blue-950/20",
                        border: "border-blue-200/70 dark:border-blue-800/40",
                        dot: "bg-blue-500",
                        textColor: "text-blue-700 dark:text-blue-300",
                      },
                      {
                        status: "Waiting",
                        label: "Waiting",
                        bg: "bg-amber-50/50 dark:bg-amber-950/20",
                        border: "border-amber-200/70 dark:border-amber-800/40",
                        dot: "bg-amber-500",
                        textColor: "text-amber-700 dark:text-amber-300",
                      },
                      {
                        status: "Scheduled",
                        label: "Scheduled",
                        bg: "bg-purple-50/50 dark:bg-purple-950/20",
                        border: "border-purple-200/70 dark:border-purple-800/40",
                        dot: "bg-purple-500",
                        textColor: "text-purple-700 dark:text-purple-300",
                      },
                      {
                        status: "Published",
                        label: "Published",
                        bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
                        border: "border-emerald-200/70 dark:border-emerald-800/40",
                        dot: "bg-emerald-500",
                        textColor: "text-emerald-700 dark:text-emerald-300",
                      },
                    ].map((col) => {
                      const colTasks = filteredTasks.filter((t) => {
                        const s = (t.status || "").toLowerCase();
                        if (col.status === "Published")
                          return s === "published" || s === "completed";
                        if (col.status === "To Do")
                          return (
                            s === "to do" ||
                            s === "to-do" ||
                            s === "todo" ||
                            s === "not started"
                          );
                        if (col.status === "In-Progress")
                          return (
                            s === "in-progress" ||
                            s === "in progress" ||
                            s === "inprogress"
                          );
                        if (col.status === "Waiting")
                          return (
                            s === "waiting" ||
                            s === "in review" ||
                            s === "in-review"
                          );
                        if (col.status === "Scheduled") return s === "scheduled";
                        return s === col.status.toLowerCase();
                      });

                      return (
                        <div
                          key={col.status}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverColumn !== col.status) {
                              setDragOverColumn(col.status);
                            }
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget)) return;
                            if (dragOverColumn === col.status) {
                              setDragOverColumn(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const taskId =
                              e.dataTransfer.getData("text/plain") ||
                              draggedTask?._id;
                            if (taskId) {
                              handleUpdateTask(taskId, { status: col.status });
                              toast.success(`Task status moved to "${col.label}"`);
                            }
                            setDraggedTask(null);
                            setDragOverColumn(null);
                          }}
                          className={`rounded-2xl p-3 border transition-all duration-200 ${
                            dragOverColumn === col.status
                              ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/50 shadow-md scale-[1.01]"
                              : `${col.border} ${col.bg}`
                          } flex flex-col min-h-[480px] max-h-[calc(100vh-250px)] shadow-2xs`}
                        >
                          {/* Column Header */}
                          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                              <h3 className={`font-bold text-xs uppercase tracking-wider ${col.textColor}`}>
                                {col.label}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                                {colTasks.length}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingTask({
                                  status: col.status,
                                  priority: "Medium",
                                  platform: "Instagram",
                                  taskCategory: "Publishing",
                                });
                                setIsTaskModalOpen(true);
                              }}
                              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs"
                              title={`Add task to ${col.label}`}
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Column Tasks Container */}
                          <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                            {/* Drag drop helper indicator inside column when hovering */}
                            {dragOverColumn === col.status && draggedTask && (
                              <div className="p-3 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse shadow-xs">
                                <FiArrowDown className="w-4 h-4 text-indigo-600 animate-bounce" />
                                <span>Drop to move to "{col.label}"</span>
                              </div>
                            )}

                            {colTasks.length === 0 ? (
                              <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs flex flex-col items-center justify-center gap-2 bg-white/40 dark:bg-slate-900/30">
                                <span className="font-medium text-slate-400">
                                  No tasks
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTask({
                                      status: col.status,
                                      priority: "Medium",
                                      platform: "Instagram",
                                      taskCategory: "Publishing",
                                    });
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  <FiPlus className="w-3 h-3" />
                                  <span>Add Post</span>
                                </button>
                              </div>
                            ) : (
                              colTasks.map((task) => {
                                const tPlatforms =
                                  Array.isArray(task.platforms) &&
                                  task.platforms.length > 0
                                    ? task.platforms
                                    : [task.platform || "Instagram"];
                                const priorityCfg = getPriorityBadge(
                                  task.priority,
                                );
                                const displayClientName =
                                  task.client?.companyName ||
                                  task.clientName ||
                                  "Client";
                                const poster =
                                  (task.assignedTo && task.assignedTo[0]) ||
                                  task.createdBy ||
                                  null;
                                const posterName =
                                  poster?.name ||
                                  (typeof task.createdBy === "string"
                                    ? task.createdBy
                                    : "Team");
                                const posterAvatar =
                                  poster?.profileImage ||
                                  poster?.avatar ||
                                  poster?.profile?.avatar;
                                const posterInitials = posterName
                                  ? posterName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : "ME";
                                const totalSubs =
                                  task.subtasks?.length || 0;
                                const completedSubs =
                                  task.subtasks?.filter(
                                    (s) => s.completed,
                                  )?.length || 0;
                                const progressPct =
                                  totalSubs > 0
                                    ? Math.round(
                                        (completedSubs / totalSubs) * 100,
                                      )
                                    : 0;

                                return (
                                  <motion.div
                                    key={task._id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData(
                                        "text/plain",
                                        task._id,
                                      );
                                      setDraggedTask(task);
                                      e.dataTransfer.effectAllowed = "move";
                                    }}
                                    onDragEnd={() => {
                                      setDraggedTask(null);
                                      setDragOverColumn(null);
                                    }}
                                    className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all group space-y-2.5 ${
                                      draggedTask?._id === task._id
                                        ? "opacity-30 scale-95 border-dashed border-indigo-500 rotate-1 shadow-lg cursor-grabbing"
                                        : "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                                  >
                                    {/* Top Row: Platforms + Category + Priority + Drag Handle */}
                                    <div className="flex items-center justify-between gap-1.5">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {tPlatforms.map((pName, pIdx) => {
                                          const pCfg =
                                            getPlatformConfig(pName);
                                          return (
                                            <span
                                              key={`${pName}-${pIdx}`}
                                              title={`Platform: ${pName}`}
                                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border shadow-2xs ${pCfg.bg}`}
                                            >
                                              <pCfg.icon className="w-2.5 h-2.5" />
                                            </span>
                                          );
                                        })}
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-100 dark:border-indigo-900/40">
                                          {task.taskCategory || "Publishing"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityCfg.bg}`}
                                        >
                                          <span>{priorityCfg.label}</span>
                                        </span>
                                        <span
                                          title="Drag to change status"
                                          className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors cursor-grab"
                                        >
                                          <FiMove className="w-3 h-3" />
                                        </span>
                                      </div>
                                    </div>

                                    {/* Task Title */}
                                    <h4
                                      onClick={() => {
                                        setEditingTask(task);
                                        setIsTaskModalOpen(true);
                                      }}
                                      className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                      {task.taskName}
                                    </h4>

                                    {/* Client Badge */}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                      <FiBriefcase className="w-3 h-3 text-indigo-500 shrink-0" />
                                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                        {displayClientName}
                                      </span>
                                    </div>

                                    {/* Subtasks Progress Bar if any */}
                                    {totalSubs > 0 && (
                                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                          <span className="flex items-center gap-1">
                                            <FiCheckSquare className="w-3 h-3 text-indigo-500" />
                                            <span>Subtasks</span>
                                          </span>
                                          <span>
                                            {completedSubs}/{totalSubs} (
                                            {progressPct}%)
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              progressPct === 100
                                                ? "bg-emerald-500"
                                                : "bg-indigo-600"
                                            }`}
                                            style={{
                                              width: `${progressPct}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Poster & Due Date */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                      {/* Poster */}
                                      <div
                                        className="flex items-center gap-1.5 min-w-0"
                                        title={`Poster: ${posterName}`}
                                      >
                                        {posterAvatar ? (
                                          <img
                                            src={posterAvatar}
                                            alt={posterName}
                                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                            {posterInitials}
                                          </div>
                                        )}
                                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[70px]">
                                          {posterName}
                                        </span>
                                      </div>

                                      {/* Due Date */}
                                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                                        <FiCalendar className="w-3 h-3 text-rose-500" />
                                        <span>{formatDate(task.dueDate)}</span>
                                      </div>
                                    </div>

                                    {/* Interactive Actions & Live Status Selector */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/40">
                                      {/* Live Status Selector */}
                                      <div className="relative">
                                        <select
                                          value={task.status || "To Do"}
                                          onChange={(e) =>
                                            handleUpdateTask(task._id, {
                                              status: e.target.value,
                                            })
                                          }
                                          className="appearance-none pl-2 pr-5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
                                        >
                                          <option value="To Do">To Do</option>
                                          <option value="In-Progress">
                                            In-Progress
                                          </option>
                                          <option value="Waiting">
                                            Waiting
                                          </option>
                                          <option value="Scheduled">
                                            Scheduled
                                          </option>
                                          <option value="Published">
                                            Published
                                          </option>
                                        </select>
                                        <FiChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                      </div>

                                      {/* Action buttons */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setActiveSubtaskModalTask(task)
                                          }
                                          title="Manage Subtasks"
                                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                                        >
                                          <FiCheckSquare className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingTask(task);
                                            setIsTaskModalOpen(true);
                                          }}
                                          title="Edit Task"
                                          className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                                        >
                                          <FiEdit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) =>
                                            handleDeleteTask(task._id, e)
                                          }
                                          title="Delete Task"
                                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---------------- IF VIEW MODE IS CALENDAR ---------------- */}
              {viewMode === "calendar" && (
              <div className="space-y-4">
                {/* Calendar Navigation Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {currentDate.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                      <button
                        onClick={prevMonth}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                        title="Previous Month"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={goToToday}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                      >
                        Today
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                        title="Next Month"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Quick Action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setIsTaskModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-indigo-500/20"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Schedule Post</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Days Grid */}
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Date Cells */}
                  <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/70 bg-white dark:bg-slate-900/40 min-h-[560px]">
                    {calendarDays.map((item, idx) => {
                      const itemDateStr = item.date.toISOString().split("T")[0];
                      const dayTasks = filteredTasks.filter((t) => {
                        if (!t.dueDate) return false;
                        const dStr = new Date(t.dueDate)
                          .toISOString()
                          .split("T")[0];
                        return dStr === itemDateStr;
                      });

                      const isToday =
                        new Date().toISOString().split("T")[0] === itemDateStr;

                      return (
                        <div
                          key={idx}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverDate !== itemDateStr) {
                              setDragOverDate(itemDateStr);
                            }
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget)) return;
                            if (dragOverDate === itemDateStr) {
                              setDragOverDate(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const taskId =
                              e.dataTransfer.getData("text/plain") ||
                              draggedTask?._id;
                            if (taskId) {
                              handleUpdateTask(taskId, { dueDate: itemDateStr });
                              toast.success(`Rescheduled to ${formatDate(itemDateStr)}`);
                            }
                            setDraggedTask(null);
                            setDragOverDate(null);
                          }}
                          className={`p-1.5 sm:p-2 min-h-[120px] sm:min-h-[145px] flex flex-col justify-between transition-all duration-150 group relative ${
                            dragOverDate === itemDateStr
                              ? "bg-indigo-100/90 dark:bg-indigo-950/80 ring-2 ring-indigo-500 shadow-md rounded-xl z-20"
                              : item.isCurrentMonth
                                ? "bg-white dark:bg-slate-900/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                                : "bg-slate-50/50 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                          }`}
                        >
                          {/* Top: Day number & Quick add */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                                isToday
                                  ? "bg-emerald-500 text-white shadow-xs ring-2 ring-emerald-200 dark:ring-emerald-900/50"
                                  : item.isCurrentMonth
                                    ? "text-slate-800 dark:text-slate-200 group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                                    : "text-slate-300 dark:text-slate-600"
                              }`}
                            >
                              {item.dayNumber}
                            </span>
                            <button
                              onClick={() => {
                                setEditingTask({
                                  dueDate: itemDateStr,
                                  status: "To Do",
                                  priority: "Medium",
                                  platform: "Instagram",
                                  taskCategory: "Publishing",
                                });
                                setIsTaskModalOpen(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all text-xs"
                              title="Add task on this date"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Drop highlight helper inside date cell */}
                          {dragOverDate === itemDateStr && draggedTask && (
                            <div className="p-1 rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold text-center animate-pulse">
                              Reschedule to {formatDate(itemDateStr)}
                            </div>
                          )}

                          {/* Post Badges on this day */}
                          <div className="space-y-2 my-1 overflow-y-auto max-h-[135px] scrollbar-none">
                            {dayTasks.map((t, tIndex) => {
                              const tPlatforms =
                                Array.isArray(t.platforms) &&
                                t.platforms.length > 0
                                  ? t.platforms
                                  : [t.platform || "Instagram"];
                              const statusCfg = getStatusConfig(t.status);
                              const cardTheme = getCalendarCardTheme(t, tIndex);
                              const isTaskSelected = selectedTaskId === t._id;
                              const clientName =
                                t.client?.companyName || t.clientName || "";

                              return (
                                <div
                                  key={t._id}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.setData(
                                      "text/plain",
                                      t._id,
                                    );
                                    setDraggedTask(t);
                                    e.dataTransfer.effectAllowed = "move";
                                  }}
                                  onDragEnd={() => {
                                    setDraggedTask(null);
                                    setDragOverDate(null);
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskId(t._id);
                                    setEditingTask(t);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className={`p-2 sm:p-2.5 rounded-xl border text-[11px] font-medium flex flex-col gap-1.5 shadow-2xs transition-all duration-200 relative group/card ${
                                    draggedTask?._id === t._id
                                      ? "opacity-25 scale-95 border-dashed border-indigo-500 cursor-grabbing"
                                      : "cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.015] hover:z-10"
                                  } ${
                                    isTaskSelected
                                      ? "ring-2 ring-indigo-500 shadow-md"
                                      : ""
                                  } ${cardTheme.bg} ${cardTheme.border}`}
                                >
                                  {/* Row 1: Platform Icon(s) Stack + Category + Due Time */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="flex items-center -space-x-1 shrink-0">
                                        {tPlatforms
                                          .slice(0, 3)
                                          .map((pName, pIdx) => {
                                            const pCfg =
                                              getPlatformConfig(pName);
                                            return (
                                              <span
                                                key={pIdx}
                                                title={pName}
                                                className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs"
                                              >
                                                <pCfg.icon className="w-2.5 h-2.5" />
                                              </span>
                                            );
                                          })}
                                        {tPlatforms.length > 3 && (
                                          <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            +{tPlatforms.length - 3}
                                          </span>
                                        )}
                                      </div>
                                      {t.taskCategory && (
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[65px]">
                                          {t.taskCategory}
                                        </span>
                                      )}
                                    </div>

                                    {t.dueTime && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 shadow-2xs border flex items-center gap-1 ${cardTheme.timeBg}`}
                                      >
                                        <FiClock className="w-2.5 h-2.5 opacity-75" />
                                        {formatTime(t.dueTime)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Row 2: Full Task Name (Clear, bold & readable) */}
                                  <div
                                    className="font-bold text-xs leading-snug text-slate-900 dark:text-white break-words line-clamp-2"
                                    title={t.taskName}
                                  >
                                    {t.taskName}
                                  </div>

                                  {/* Row 3: Client Name & Status Tag */}
                                  <div className="flex items-center justify-between gap-1.5 text-[10px] pt-1 border-t border-black/5 dark:border-white/5">
                                    {/* Client Name with Icon */}
                                    <div className="flex items-center gap-1 min-w-0 text-slate-600 dark:text-slate-300 font-semibold">
                                      <FiBriefcase className="w-2.5 h-2.5 shrink-0 opacity-70 text-slate-400 dark:text-slate-500" />
                                      <span
                                        className="truncate max-w-[85px] sm:max-w-[95px]"
                                        title={clientName || "General"}
                                      >
                                        {clientName || "General"}
                                      </span>
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[9px] border shrink-0 shadow-2xs ${statusCfg.bg}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                                      ></span>
                                      <span className="truncate max-w-[65px]">
                                        {statusCfg.label}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Bottom count badge if more than 2 */}
                          {dayTasks.length > 2 && (
                            <div className="text-[10px] font-bold text-slate-400">
                              +{dayTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. DYNAMIC CREATE / EDIT TASK MODAL                          */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingTask
                    ? "Edit Content Task"
                    : "Create New Content Task"}
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const data = {
                    taskName: form.taskName.value,
                    clientName: form.clientName.value,
                    taskCategory: form.taskCategory.value,
                    assignedUserId: form.assignedUserId?.value || authUser?._id,
                    assignedTo: form.assignedUserId?.value
                      ? [form.assignedUserId.value]
                      : authUser?._id
                        ? [authUser._id]
                        : [],
                    platform: modalPlatforms[0] || "Instagram",
                    platforms: modalPlatforms,
                    dueDate: form.dueDate.value,
                    dueTime: form.dueTime.value || "",
                    priority: form.priority.value,
                    status: form.status.value,
                  };
                  handleSaveModalTask(data);
                }}
                className="space-y-4 text-xs sm:text-sm"
              >
                {/* Task Name */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    name="taskName"
                    defaultValue={editingTask?.taskName || ""}
                    placeholder="e.g. Festive Offer Campaign"
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                {/* Client, Category & Poster/Member */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Client Name *</span>
                      <span className="text-[10px] font-semibold text-indigo-500">
                        {modalAssignedClients.length} Assigned
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        name="clientName"
                        value={modalClientName}
                        onChange={(e) => setModalClientName(e.target.value)}
                        required
                        className="w-full appearance-none p-2.5 pr-8 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 dark:text-slate-100 cursor-pointer text-xs sm:text-sm"
                      >
                        <option value="" disabled>
                          -- Select Assigned Client --
                        </option>

                        {/* Current client if not in list */}
                        {modalClientName &&
                          !dbClients.some(
                            (c) =>
                              c.companyName?.toLowerCase() ===
                              modalClientName.toLowerCase(),
                          ) && (
                            <option value={modalClientName}>
                              {modalClientName} (Current)
                            </option>
                          )}

                        {/* Assigned clients group */}
                        {modalAssignedClients.length > 0 && (
                          <optgroup
                            label={
                              isManagerOrAdmin && modalAssignedUserId
                                ? `✨ Assigned to ${dbUsers.find((u) => u._id === modalAssignedUserId)?.name || "Selected User"}`
                                : "✨ Your Assigned Clients"
                            }
                          >
                            {modalAssignedClients.map((c) => (
                              <option
                                key={c._id || c.companyName}
                                value={c.companyName}
                              >
                                {c.companyName}
                                {c.industry ? ` (${c.industry})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {/* Other agency clients group for admin/manager */}
                        {isManagerOrAdmin && modalOtherClients.length > 0 && (
                          <optgroup label="🏢 Other Agency Clients">
                            {modalOtherClients.map((c) => (
                              <option
                                key={c._id || c.companyName}
                                value={c.companyName}
                              >
                                {c.companyName}
                                {c.industry ? ` (${c.industry})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <FiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>

                    {modalAssignedClients.length === 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3 shrink-0" />
                        <span>No clients assigned to this user</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      name="taskCategory"
                      defaultValue={editingTask?.taskCategory || "Publishing"}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs sm:text-sm"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Poster
                    </label>
                    <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {authUser?.name
                          ? authUser.name.slice(0, 2).toUpperCase()
                          : "ME"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {authUser?.name || "Me"}
                        </div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                          {authUser?.department || authUser?.role || "Social Media Team"}
                        </div>
                      </div>
                      <input
                        type="hidden"
                        name="assignedUserId"
                        value={authUser?._id || ""}
                      />
                    </div>
                  </div>
                </div>

                {/* Multiple Platforms Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Platforms *{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({modalPlatforms.length} selected)
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Select multiple channels
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {platformOptions.map((p) => {
                      const pCfg = getPlatformConfig(p);
                      const isSelected = modalPlatforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleModalPlatform(p)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                            isSelected
                              ? `${pCfg.bg} ring-2 ${pCfg.ring} shadow-xs font-bold`
                              : "bg-slate-50 dark:bg-[#111728] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <pCfg.icon className="w-4 h-4 shrink-0" />
                          <span className="truncate flex-1 text-left">{p}</span>
                          {isSelected && (
                            <FiCheck className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Due Date & Due Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      defaultValue={
                        editingTask?.dueDate
                          ? new Date(editingTask.dueDate)
                              .toISOString()
                              .split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Due Time
                    </label>
                    <input
                      type="time"
                      name="dueTime"
                      defaultValue={editingTask?.dueTime || ""}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingTask?.priority || "Medium"}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingTask?.status || "To Do"}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Waiting">Waiting</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
                  >
                    {editingTask ? "Save Changes" : "Create Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentCalcendor;
