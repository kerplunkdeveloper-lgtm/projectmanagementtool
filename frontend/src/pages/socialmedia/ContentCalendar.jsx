import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiFilter,
  FiList,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiX,
  FiLayers,
  FiMenu,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSocialmediaTasks,
  getSocialmediaStats,
  rescheduleSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";
import { formatLocalDateKey } from "../../utils/dateUtils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const CATEGORIES = [
  "All",
  "Content",
  "Copy",
  "Posting",
  "Engagement",
  "Client",
  "Ads",
  "Strategy",
  "Reporting",
  "Calendar",
  "Audit",
  "Other",
];
const CONTENT_TYPES = [
  "All",
  "Reel",
  "Post",
  "Carousel",
  "Story",
  "GMB",
  "YouTube",
  "Blog",
  "Ad",
  "Other",
];
const STATUSES = ["All", "Live", "Scheduled", "In QC", "In progress", "Not started", "Overdue"];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const COMMITMENTS = ["All", "Yes", "No"];

// Full Page Centered Loading Component with Premium Ambient Glow & Glassmorphism
const FullPageCalendarLoader = ({ monthName = "", year = "" }) => {
  return (
    <motion.div
      key="calendar-fullpage-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#f8fafc]/85 dark:bg-[#090d16]/85 backdrop-blur-md overflow-hidden select-none pointer-events-auto"
    >
      {/* Ambient Floating Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1s]" />

      {/* Main Glassmorphic Centered Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: -10 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md p-7 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl flex flex-col items-center text-center"
      >
        {/* Animated Hero Calendar Icon with Orbiting Glow Ring */}
        <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
          {/* Subtle Outer Ping Glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-pink-500/20 animate-ping opacity-60 pointer-events-none" />
          
          {/* Middle Orbit Track */}
          <div className="absolute -inset-1 rounded-3xl border-2 border-indigo-500/20 dark:border-indigo-400/20" />
          
          {/* Rotating Glowing Segment Ring */}
          <div className="absolute -inset-1 rounded-3xl border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent border-r-purple-500 animate-spin" />
          
          {/* Inner 3D Gradient Icon Box */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/35 flex items-center justify-center">
            <FiCalendar size={28} className="animate-pulse" />
          </div>
        </div>

        {/* Title & Status Chip */}
        <div className="space-y-1.5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span>Syncing Schedule</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Loading Calendar</span>
            <span className="flex gap-0.5 ml-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
            </span>
          </h3>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs">
            Preparing deliverables & publishing dates for{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {monthName} {year}
            </span>
          </p>
        </div>

        {/* Smooth Gradient Progress Bar */}
        <div className="w-full max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative mb-5 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            initial={{ x: "-100%", width: "45%" }}
            animate={{ x: "260%" }}
            transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
          />
        </div>

        {/* Status Micro-checklist Indicators */}
        <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Posts & Reels</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse [animation-delay:0.2s]" />
            <span>Deliverables</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse [animation-delay:0.4s]" />
            <span>QC Status</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ContentCalendar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "admin";
  const userRoleClean = (user?.role || role || "").toLowerCase().replace(/[\s_]/g, "");
  const isPrivileged = userRoleClean === "admin" || userRoleClean === "operationmanager";

  const { tasks, stats, loading } = useSelector((state) => state.socialmediaTasks);
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  // Helper to extract clean avatar image URL from various User/Profile structures
  const extractAvatarUrl = useCallback((target) => {
    if (!target) return null;
    if (typeof target === "string") {
      const trimmed = target.trim();
      if (trimmed.startsWith("http")) return trimmed;
      if (trimmed.startsWith("/")) {
        const backendBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return backendBase ? `${backendBase}${trimmed}` : trimmed;
      }
      return trimmed;
    }
    if (typeof target === "object") {
      if (typeof target.url === "string" && target.url.trim()) return extractAvatarUrl(target.url);
      if (target.profile?.profileImage) return extractAvatarUrl(target.profile.profileImage);
      if (target.profileImage) return extractAvatarUrl(target.profileImage);
      if (target.avatar) return extractAvatarUrl(target.avatar);
      if (target.profilePic) return extractAvatarUrl(target.profilePic);
    }
    return null;
  }, []);

  // Fast user lookup map for creator profile images and names
  const usersMap = useMemo(() => {
    const map = new Map();
    if (user) {
      if (user._id) map.set(user._id.toString(), user);
      if (user.id) map.set(user.id.toString(), user);
      if (user.name) map.set(user.name.trim().toLowerCase(), user);
    }
    (users || []).forEach((u) => {
      if (u._id) map.set(u._id.toString(), u);
      if (u.id) map.set(u.id.toString(), u);
      if (u.name) map.set(u.name.trim().toLowerCase(), u);
    });
    return map;
  }, [users, user]);

  // Resolve creator information (avatar and name)
  const getCreatorInfo = useCallback(
    (task) => {
      const createdBy = task?.createdBy;
      const assignee = task?.assignee;
      const rawName =
        (typeof createdBy === "object" ? createdBy?.name : null) ||
        (typeof assignee === "object" ? assignee?.name : null) ||
        task?.createdByName ||
        task?.assigneeName ||
        (typeof createdBy === "string" ? createdBy : null) ||
        "Admin";

      const cId = (typeof createdBy === "object" ? createdBy?._id : createdBy)?.toString();
      const aId = (typeof assignee === "object" ? assignee?._id : assignee)?.toString();
      const cName = (typeof createdBy === "object" ? createdBy?.name : null) || task?.createdByName;
      const aName = (typeof assignee === "object" ? assignee?.name : null) || task?.assigneeName;

      const matchedUser =
        (cId && usersMap.get(cId)) ||
        (aId && usersMap.get(aId)) ||
        (cName && usersMap.get(cName.trim().toLowerCase())) ||
        (aName && usersMap.get(aName.trim().toLowerCase())) ||
        (rawName && usersMap.get(rawName.trim().toLowerCase())) ||
        (typeof createdBy === "object" ? createdBy : null) ||
        (typeof assignee === "object" ? assignee : null);

      const name = matchedUser?.name || cName || aName || rawName;

      const avatarUrl =
        extractAvatarUrl(matchedUser) ||
        extractAvatarUrl(createdBy) ||
        extractAvatarUrl(assignee) ||
        null;

      const initials = (name || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("") || "U";

      return {
        name,
        avatarUrl,
        initials,
      };
    },
    [usersMap, extractAvatarUrl]
  );

  // Month & Year state (Dynamic current date)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("Month"); // "Month" | "Week" | "List"

  // Filter States
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedContentType, setSelectedContentType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedAssignee, setSelectedAssignee] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCommitment, setSelectedCommitment] = useState("All");
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [initialDateForCreate, setInitialDateForCreate] = useState(null);

  // Day popover / expanded list modal
  const [selectedDayPosts, setSelectedDayPosts] = useState(null);

  // Drag and Drop
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const realTodayStr = formatLocalDateKey(new Date());

  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch dynamic tasks and stats
  useEffect(() => {
    dispatch(getSocialmediaTasks({ year: currentYear, month: currentMonth + 1 }))
      .finally(() => setInitialLoading(false));
    dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch, currentYear, currentMonth]);

  const isCalendarLoading = loading || initialLoading;

  // Ensure tasks are unique by document _id without deleting valid posts with the same title
  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return (tasks || []).filter((t) => {
      const key = t._id ? t._id.toString() : JSON.stringify(t);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tasks]);

  // Dynamic client options
  const clientOptions = useMemo(() => {
    const set = new Set();
    clients.forEach((c) => {
      if (c.companyName) set.add(c.companyName);
    });
    uniqueTasks.forEach((t) => {
      if (t.clientName) set.add(t.clientName);
    });
    return ["All", ...Array.from(set)];
  }, [clients, uniqueTasks]);

  // Dynamic creator / assignee options
  const assigneeOptions = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      if (u.name) set.add(u.name);
    });
    uniqueTasks.forEach((t) => {
      const creator = t.createdBy?.name || t.createdByName;
      const assignee = t.assignee?.name || t.assigneeName;
      if (creator) set.add(creator);
      if (assignee) set.add(assignee);
    });
    return ["All", ...Array.from(set)];
  }, [users, uniqueTasks]);

  // Filtered tasks for calendar (only tasks with publishDate)
  const calendarTasks = useMemo(() => {
    return uniqueTasks.filter((task) => {
      if (!task.publishDate) return false;

      // Regular users see tasks created by OR assigned to themselves.
      // Admin and Operation Manager can see all users' tasks.
      if (!isPrivileged) {
        const currentUserId = (user?._id || user?.id)?.toString();
        const currentUserNameLower = (user?.name || "").trim().toLowerCase();

        const taskCreatorId =
          (typeof task.createdBy === "object"
            ? task.createdBy?._id?.toString()
            : task.createdBy?.toString()) || "";
        const taskAssigneeId =
          (typeof task.assignee === "object"
            ? task.assignee?._id?.toString()
            : task.assignee?.toString()) || "";
        const taskCreatedByNameLower = (task.createdByName || "").trim().toLowerCase();
        const taskAssigneeNameLower = (task.assigneeName || "").trim().toLowerCase();

        const creator = getCreatorInfo(task);
        const resolvedCreatorNameLower = (creator?.name || "").trim().toLowerCase();

        const isMine =
          (currentUserId && (taskCreatorId === currentUserId || taskAssigneeId === currentUserId)) ||
          (currentUserNameLower && (
            taskCreatedByNameLower === currentUserNameLower ||
            taskAssigneeNameLower === currentUserNameLower ||
            resolvedCreatorNameLower === currentUserNameLower
          ));

        if (!isMine) return false;
      }

      if (selectedClient !== "All" && task.clientName !== selectedClient) return false;
      if (selectedCategory !== "All" && task.category !== selectedCategory) return false;
      if (selectedContentType !== "All" && task.contentType !== selectedContentType) return false;
      if (selectedStatus !== "All" && task.status !== selectedStatus) return false;
      if (isPrivileged && selectedAssignee !== "All") {
        const creator = task.createdBy?.name || task.createdByName;
        const assignee = task.assignee?.name || task.assigneeName;
        if (creator !== selectedAssignee && assignee !== selectedAssignee) return false;
      }
      if (selectedPriority !== "All" && task.priority !== selectedPriority) return false;

      if (selectedCommitment !== "All") {
        const isYes = selectedCommitment === "Yes";
        if (Boolean(task.commitment) !== isYes) return false;
      }

      if (atRiskOnly) {
        if (!task.commitment) return false;
        if (["Completed", "Live"].includes(task.status)) return false;
        const targetDate = task.publishDate || task.dueDate;
        if (!targetDate) return false;
        const diffHours = (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours < 0 || diffHours > 24) return false;
      }

      return true;
    });
  }, [
    uniqueTasks,
    isPrivileged,
    user,
    getCreatorInfo,
    selectedClient,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedAssignee,
    selectedPriority,
    selectedCommitment,
    atRiskOnly,
  ]);

  // Calendar month grid calculation (Monday start)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      days.push({
        date: dateObj,
        dayNumber: d,
        isCurrentMonth: false,
        dateKey: formatLocalDateKey(dateObj),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      days.push({
        date: dateObj,
        dayNumber: i,
        isCurrentMonth: true,
        dateKey: formatLocalDateKey(dateObj),
      });
    }

    // Next month padding to fill multiple of 7
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const dateObj = new Date(currentYear, currentMonth + 1, i);
        days.push({
          date: dateObj,
          dayNumber: i,
          isCurrentMonth: false,
          dateKey: formatLocalDateKey(dateObj),
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // Calendar week view days calculation (Monday to Sunday for currentDate's week)
  const currentWeekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      weekDays.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        monthShort: MONTH_NAMES[dayDate.getMonth()].slice(0, 3),
        year: dayDate.getFullYear(),
        dateKey: formatLocalDateKey(dayDate),
        isToday: formatLocalDateKey(dayDate) === realTodayStr,
      });
    }
    return weekDays;
  }, [currentDate, realTodayStr]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    calendarTasks.forEach((task) => {
      if (!task.publishDate) return;
      const key = formatLocalDateKey(task.publishDate);
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
    });

    return map;
  }, [calendarTasks]);

  // Navigate months or weeks depending on active viewMode
  const handlePrev = () => {
    if (viewMode === "Week") {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7);
        return next;
      });
    } else {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "Week") {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
      });
    } else {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open modal to create a task on that day
  const handleAddPostOnDate = (dateObj) => {
    setSelectedTaskForEdit(null);
    setInitialDateForCreate(dateObj);
    setIsModalOpen(true);
  };

  const handleCardClick = (task, e) => {
    e.stopPropagation();
    setSelectedTaskForEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${task.taskTitle}"?`)) {
      dispatch(deleteSocialmediaTask(task._id)).then(() => {
        dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
      });
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find((t) => t._id === draggedTaskId);
    if (!task) return;

    const origDate = task.publishDate ? new Date(task.publishDate) : new Date();
    const newPublishDate = new Date(targetDate);
    newPublishDate.setHours(origDate.getHours(), origDate.getMinutes(), 0, 0);

    dispatch(
      rescheduleSocialmediaTask({
        id: draggedTaskId,
        data: {
          publishDate: newPublishDate,
        },
      })
    ).then(() => {
      dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    });
    setDraggedTaskId(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
  };

  // Status card styling helper: returns clearly visible, elegant pastel backgrounds & borders per status
  const getStatusCardStyles = (status = "", isAtRisk = false) => {
    if (isAtRisk) {
      return {
        card: "bg-[#feebee] dark:bg-rose-950/35 border-rose-200/90 dark:border-rose-800/70 hover:bg-[#fed9de] dark:hover:bg-rose-950/55 hover:border-rose-300 dark:hover:border-rose-600 shadow-2xs hover:shadow-xs",
        badge: "bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 border-rose-300/80 dark:border-rose-700",
        dot: "bg-rose-500 animate-pulse",
        divider: "border-rose-200/80 dark:border-rose-900/50",
        label: "Risk",
      };
    }

    const s = (status || "").trim().toLowerCase();

    switch (s) {
      case "live":
      case "completed":
        return {
          card: "bg-[#e6f9ee] dark:bg-emerald-950/35 border-emerald-200/90 dark:border-emerald-800/70 hover:bg-[#d5f5e2] dark:hover:bg-emerald-950/55 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-2xs hover:shadow-xs",
          badge: "bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700",
          dot: "bg-emerald-500",
          divider: "border-emerald-200/80 dark:border-emerald-900/50",
          label: "Live",
        };
      case "scheduled":
        return {
          card: "bg-[#e8f4fd] dark:bg-sky-950/35 border-sky-200/90 dark:border-sky-800/70 hover:bg-[#d8edfd] dark:hover:bg-sky-950/55 hover:border-sky-300 dark:hover:border-sky-600 shadow-2xs hover:shadow-xs",
          badge: "bg-sky-100 dark:bg-sky-900/70 text-sky-800 dark:text-sky-200 border-sky-300/80 dark:border-sky-700",
          dot: "bg-sky-500",
          divider: "border-sky-200/80 dark:border-sky-900/50",
          label: "Sched",
        };
      case "in qc":
        return {
          card: "bg-[#fef7e3] dark:bg-amber-950/35 border-amber-200/90 dark:border-amber-800/70 hover:bg-[#fdeec4] dark:hover:bg-amber-950/55 hover:border-amber-300 dark:hover:border-amber-600 shadow-2xs hover:shadow-xs",
          badge: "bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 border-amber-300/80 dark:border-amber-700",
          dot: "bg-amber-500",
          divider: "border-amber-200/80 dark:border-amber-900/50",
          label: "QC",
        };
      case "in progress":
        return {
          card: "bg-[#eef0fe] dark:bg-indigo-950/35 border-indigo-200/90 dark:border-indigo-800/70 hover:bg-[#e0e4fe] dark:hover:bg-indigo-950/55 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs hover:shadow-xs",
          badge: "bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border-indigo-300/80 dark:border-indigo-700",
          dot: "bg-indigo-500",
          divider: "border-indigo-200/80 dark:border-indigo-900/50",
          label: "In Prog",
        };
      case "overdue":
        return {
          card: "bg-[#feebee] dark:bg-rose-950/35 border-rose-200/90 dark:border-rose-800/70 hover:bg-[#fed9de] dark:hover:bg-rose-950/55 hover:border-rose-300 dark:hover:border-rose-600 shadow-2xs hover:shadow-xs",
          badge: "bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 border-rose-300/80 dark:border-rose-700",
          dot: "bg-rose-500 animate-pulse",
          divider: "border-rose-200/80 dark:border-rose-900/50",
          label: "Risk",
        };
      default:
        // Not started / Draft / default
        return {
          card: "bg-[#f4f6f8] dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 hover:bg-[#e9ecef] dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs",
          badge: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-600",
          dot: "bg-slate-400",
          divider: "border-slate-200/70 dark:border-slate-700/60",
          label: "Draft",
        };
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status, isAtRisk = false) => {
    const style = getStatusCardStyles(status, isAtRisk);
    return (
      <span
        className={`inline-flex items-center gap-1 text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded border uppercase shadow-2xs ${style.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
        <span>{style.label}</span>
      </span>
    );
  };

  const formatCardTime = (dateVal) => {
    if (!dateVal) return "12:00";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "12:00";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // Content type badge style helper
  const getContentTypeStyle = (contentType) => {
    const type = (contentType || "Post").trim().toLowerCase();
    switch (type) {
      case "reel":
        return {
          bg: "bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/80",
          label: "REEL",
        };
      case "post":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80",
          label: "POST",
        };
      case "carousel":
        return {
          bg: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/80",
          label: "CAROUSEL",
        };
      case "story":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80",
          label: "STORY",
        };
      case "youtube":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80",
          label: "YT",
        };
      case "gmb":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80",
          label: "GMB",
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          label: (contentType || "POST").toUpperCase(),
        };
    }
  };



  const outletContext = useOutletContext() || {};
  const setSidebarOpen = outletContext?.setSidebarOpen;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 relative">
      {/* Full Page Centered Loading Animation */}
      <AnimatePresence>
        {isCalendarLoading && (
          <FullPageCalendarLoader
            monthName={MONTH_NAMES[currentMonth]}
            year={currentYear}
          />
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {setSidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Open Sidebar"
            >
              <FiMenu size={18} />
            </button>
          )}
          <div>
            <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              Social Media Calendar
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {viewMode === "Week" && currentWeekDays.length === 7
                ? `${currentWeekDays[0].dayNumber} ${currentWeekDays[0].monthShort} – ${currentWeekDays[6].dayNumber} ${currentWeekDays[6].monthShort} ${currentWeekDays[6].year}`
                : `${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </h1>
          </div>
        </div>

        {/* Navigation & View switcher */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Month/Week selector navigation */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 shadow-xs">
            <button
              onClick={handlePrev}
              disabled={isCalendarLoading}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
              title={viewMode === "Week" ? "Previous Week" : "Previous Month"}
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              disabled={isCalendarLoading}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              disabled={isCalendarLoading}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
              title={viewMode === "Week" ? "Next Week" : "Next Month"}
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => {
              dispatch(getSocialmediaTasks({ year: currentYear, month: currentMonth + 1 }));
              dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
            }}
            disabled={isCalendarLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Calendar"
          >
            <FiRefreshCw size={14} className={isCalendarLoading ? "animate-spin text-indigo-500" : ""} />
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            {["Month", "Week", "List"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAddPostOnDate(new Date())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <FiPlus size={14} />
            <span>Add Post</span>
          </button>

          <button
            onClick={() => navigate(`/${userRoleClean || "admin"}/sm-tasks`)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <FiList size={14} />
            <span>Task Table</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards - 100% Dynamic from MongoDB */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* COMMITMENTS */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Commitments
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.commitments ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            planned this month
          </span>
        </div>

        {/* COMPLETED */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Completed
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {stats.completed ?? 0}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium mt-1 block">
            published on time
          </span>
        </div>

        {/* PENDING */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Pending
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.pending ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            in production or QC
          </span>
        </div>

        {/* OVERDUE */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Overdue
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {stats.overdue ?? 0}
          </div>
          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium mt-1 block">
            past publish date
          </span>
        </div>

        {/* ACHIEVEMENT */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Achievement
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.achievement ?? 0}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            vs 90% target
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* All Clients (Dynamic DB Clients) */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All clients</option>
            {clientOptions
              .filter((c) => c !== "All")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Category</option>
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Content Type */}
          <select
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Content type</option>
            {CONTENT_TYPES.filter((c) => c !== "All").map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Status</option>
            {STATUSES.filter((c) => c !== "All").map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Assignee / Created By - Admin & Operation Manager only */}
          {isPrivileged && (
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">Created By / Assignee</option>
              {assigneeOptions
                .filter((a) => a !== "All")
                .map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
            </select>
          )}

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Priority</option>
            {PRIORITIES.filter((p) => p !== "All").map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          {/* Commitment */}
          <select
            value={selectedCommitment}
            onChange={(e) => setSelectedCommitment(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Commitment</option>
            {COMMITMENTS.filter((c) => c !== "All").map((co) => (
              <option key={co} value={co}>
                {co}
              </option>
            ))}
          </select>

          {/* At Risk Pill Button */}
          <button
            type="button"
            onClick={() => setAtRiskOnly(!atRiskOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              atRiskOnly
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-xs"
                : "bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/60"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>At risk</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/70 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold">
              {stats.atRisk ?? 0}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {isCalendarLoading ? (
            <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Loading calendar tasks...
            </span>
          ) : (
            <>
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{calendarTasks.length}</span>{" "}
              posts ·{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{new Set(calendarTasks.map((t) => t.clientName).filter(Boolean)).size}</span> clients
            </>
          )}
        </div>
      </div>

      {/* VIEW MODES: MONTH | WEEK | LIST */}
      <div className="space-y-4">
        {/* 1. MONTH VIEW */}
      {viewMode === "Month" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[720px] lg:min-w-0">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center py-2.5">
                {WEEK_DAYS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Days Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            {calendarDays.map((dayItem, index) => {
              const dateKey = dayItem.dateKey;
              const postsForDay = tasksByDate[dateKey] || [];
              const isToday = dayItem.dateKey === realTodayStr;

              const displayedPosts = postsForDay.slice(0, 3);
              const remainingCount = postsForDay.length - displayedPosts.length;

              return (
                <div
                  key={index}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayItem.date)}
                  onClick={() => handleAddPostOnDate(dayItem.date)}
                  className={`min-h-[165px] sm:min-h-[185px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                    dayItem.isCurrentMonth
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/50 dark:bg-slate-950/40 text-slate-400"
                  } hover:bg-slate-50/80 dark:hover:bg-slate-800/30 group`}
                >
                  {/* Cell Top Bar */}
                  <div className="flex items-center justify-between mb-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-blue-600 text-white shadow-xs font-black"
                            : dayItem.isCurrentMonth
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400"
                        }`}
                      >
                        {dayItem.dayNumber}
                      </span>

                      {postsForDay.length > 0 && dayItem.isCurrentMonth && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {postsForDay.length} {postsForDay.length === 1 ? "post" : "posts"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddPostOnDate(dayItem.date)}
                      className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title={`Add post on ${dayItem.dayNumber} ${MONTH_NAMES[currentMonth]}`}
                    >
                      <FiPlus size={13} />
                    </button>
                  </div>

                  {/* Posts Cards inside cell */}
                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    {displayedPosts.map((post) => {
                      const clientColor = post.clientColor || "#6366f1";
                      const postDiffHours = post.publishDate
                        ? (new Date(post.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                        : -1;
                      const isRisk =
                        !["Completed", "Live"].includes(post.status) &&
                        postDiffHours >= 0 &&
                        postDiffHours <= 24;
                      const creator = getCreatorInfo(post);
                      const typeStyle = getContentTypeStyle(post.contentType);
                      const statusStyle = getStatusCardStyles(post.status, isRisk);

                      return (
                        <div
                          key={post._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, post._id)}
                          onClick={(e) => handleCardClick(post, e)}
                          className={`p-1.5 sm:p-2 rounded-xl border ${statusStyle.card} hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden group/card flex flex-col justify-between gap-1`}
                          style={{ borderLeftWidth: "3.5px", borderLeftColor: clientColor }}
                        >
                          {/* Top Row: Time + Content Type Pill + Status / Risk Badge */}
                          <div className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                                {formatCardTime(post.publishDate)}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide border ${typeStyle.bg}`}>
                                {typeStyle.label}
                              </span>
                            </div>
                            <div className="shrink-0">
                              {renderStatusBadge(post.status, isRisk)}
                            </div>
                          </div>

                          {/* Middle Row: Task Title (Prominent & Clear) */}
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2" title={post.taskTitle || post.clientName}>
                            {post.taskTitle || "Untitled Task"}
                          </div>

                          {/* Bottom Row: Client Name (Left) + Creator with Avatar (Right) */}
                          <div className={`flex items-center justify-between gap-1 pt-1 border-t ${statusStyle.divider} text-[10px]`}>
                            <span
                              className="font-bold truncate max-w-[70px] sm:max-w-[85px]"
                              style={{ color: clientColor }}
                              title={post.clientName}
                            >
                              {post.clientName}
                            </span>

                            <div className="flex items-center gap-1 shrink-0 max-w-[85px] sm:max-w-[95px]" title={`Created by ${creator.name}`}>
                              <div className="relative shrink-0 w-4 h-4 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs">
                                {creator.avatarUrl ? (
                                  <img
                                    src={creator.avatarUrl}
                                    alt={creator.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fb = e.currentTarget.parentElement?.querySelector(".cal-avatar-fallback");
                                      if (fb) fb.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="cal-avatar-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[7.5px] items-center justify-center uppercase shadow-2xs"
                                  style={{ display: creator.avatarUrl ? "none" : "flex" }}
                                >
                                  {creator.initials}
                                </div>
                              </div>
                              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {creator.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* "+X more" button */}
                  {remainingCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayPosts({
                          date: dayItem.date,
                          posts: postsForDay,
                        });
                      }}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1 text-left block w-full cursor-pointer"
                    >
                      +{remainingCount} more
                    </button>
                  )}
                </div>
              );
            })}
          </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === "Week" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Weekly Content Schedule
            </h3>
            <span className="text-xs text-slate-400">
              Click any slot to add post
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
            {currentWeekDays.map((dayItem, idx) => {
              const postsForDay = tasksByDate[dayItem.dateKey] || [];
              return (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayItem.date)}
                  onClick={() => handleAddPostOnDate(dayItem.date)}
                  className={`bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border ${
                    dayItem.isToday
                      ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20"
                      : "border-slate-200 dark:border-slate-700/60"
                  } min-h-[220px] flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-colors`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50 mb-2">
                    <span className={`text-xs font-black uppercase ${dayItem.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
                      {WEEK_DAYS[idx]}
                    </span>
                    <span className={`text-xs font-bold ${dayItem.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {dayItem.dayNumber} {dayItem.monthShort}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {postsForDay.map((p) => {
                      const creator = getCreatorInfo(p);
                      const typeStyle = getContentTypeStyle(p.contentType);
                      const pDiffHours = p.publishDate
                        ? (new Date(p.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                        : -1;
                      const isRisk =
                        !["Completed", "Live"].includes(p.status) &&
                        pDiffHours >= 0 &&
                        pDiffHours <= 24;
                      const statusStyle = getStatusCardStyles(p.status, isRisk);

                      return (
                        <div
                          key={p._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, p._id)}
                          onClick={(e) => handleCardClick(p, e)}
                          className={`p-2 rounded-xl border ${statusStyle.card} text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1.5`}
                          style={{ borderLeftWidth: "3.5px", borderLeftColor: p.clientColor || "#6366f1" }}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                                {formatCardTime(p.publishDate)}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide border ${typeStyle.bg}`}>
                                {typeStyle.label}
                              </span>
                            </div>
                            <div className="shrink-0">
                              {renderStatusBadge(p.status, isRisk)}
                            </div>
                          </div>

                          <div className="font-bold text-[11px] text-slate-900 dark:text-white leading-snug line-clamp-2" title={p.taskTitle || p.clientName}>
                            {p.taskTitle || "Untitled Task"}
                          </div>

                          <div className={`flex items-center justify-between pt-1 border-t ${statusStyle.divider} text-[10px]`}>
                            <span className="font-bold truncate max-w-[70px]" style={{ color: p.clientColor || "#6366f1" }} title={p.clientName}>
                              {p.clientName}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 max-w-[85px]" title={`Created by ${creator.name}`}>
                              <div className="relative shrink-0 w-4 h-4 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs">
                                {creator.avatarUrl ? (
                                  <img
                                    src={creator.avatarUrl}
                                    alt={creator.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fb = e.currentTarget.parentElement?.querySelector(".cal-week-fallback");
                                      if (fb) fb.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="cal-week-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[7.5px] items-center justify-center uppercase shadow-2xs"
                                  style={{ display: creator.avatarUrl ? "none" : "flex" }}
                                >
                                  {creator.initials}
                                </div>
                              </div>
                              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate">{creator.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {postsForDay.length === 0 && (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                        No posts scheduled
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddPostOnDate(dayItem.date);
                    }}
                    className="w-full mt-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <FiPlus size={12} /> Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST VIEW */}
      {viewMode === "List" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Planned Social Media Posts ({calendarTasks.length})
            </h3>
            <button
              onClick={() => handleAddPostOnDate(new Date())}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <FiPlus size={14} /> Add Post
            </button>
          </div>

          <div className="space-y-2">
            {calendarTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">
                No scheduled posts found for this month.
              </div>
            ) : (
              calendarTasks.map((task) => {
                const creator = getCreatorInfo(task);
                const typeStyle = getContentTypeStyle(task.contentType);
                const taskDiffHours = task.publishDate
                  ? (new Date(task.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                  : -1;
                const isRisk =
                  !["Completed", "Live"].includes(task.status) &&
                  taskDiffHours >= 0 &&
                  taskDiffHours <= 24;
                const statusStyle = getStatusCardStyles(task.status, isRisk);

                return (
                  <div
                    key={task._id}
                    onClick={(e) => handleCardClick(task, e)}
                    className={`p-3.5 rounded-xl border ${statusStyle.card} hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3`}
                    style={{ borderLeftWidth: "4px", borderLeftColor: task.clientColor || "#6366f1" }}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-14 text-center shrink-0">
                        <div className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {formatCardTime(task.publishDate)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(task.publishDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs" style={{ color: task.clientColor || "#6366f1" }}>
                            {task.clientName}
                          </span>
                          <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${typeStyle.bg}`}>
                            {typeStyle.label}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                          {task.taskTitle || "Untitled Task"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Creator Profile Chip */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60" title={`Created by ${creator.name}`}>
                        <div className="relative w-5 h-5 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-2xs">
                          {creator.avatarUrl ? (
                            <img
                              src={creator.avatarUrl}
                              alt={creator.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".cal-list-fallback");
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="cal-list-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[8px] items-center justify-center uppercase shadow-2xs"
                            style={{ display: creator.avatarUrl ? "none" : "flex" }}
                          >
                            {creator.initials}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 max-w-[90px] truncate">
                          {creator.name}
                        </span>
                      </div>

                      {renderStatusBadge(task.status, isRisk)}

                      <button
                        type="button"
                        onClick={() => handleCardClick(task, { stopPropagation: () => {} })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Edit post"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Delete post"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      </div>

      {/* Day Overview Popover / Modal when clicking "+X more" */}
      {selectedDayPosts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Scheduled Posts
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedDayPosts.date.getDate()} {MONTH_NAMES[selectedDayPosts.date.getMonth()]}{" "}
                  {selectedDayPosts.date.getFullYear()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayPosts(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayPosts.posts.map((post) => {
                const creator = getCreatorInfo(post);
                const typeStyle = getContentTypeStyle(post.contentType);
                const popDiffHours = post.publishDate
                  ? (new Date(post.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                  : -1;
                const isRisk =
                  !["Completed", "Live"].includes(post.status) &&
                  popDiffHours >= 0 &&
                  popDiffHours <= 24;
                const statusStyle = getStatusCardStyles(post.status, isRisk);

                return (
                  <div
                    key={post._id}
                    onClick={(e) => {
                      setSelectedDayPosts(null);
                      handleCardClick(post, e);
                    }}
                    className={`p-3 rounded-xl border ${statusStyle.card} hover:shadow-xs transition-all cursor-pointer space-y-2`}
                    style={{ borderLeftWidth: "4px", borderLeftColor: post.clientColor || "#6366f1" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {formatCardTime(post.publishDate)}
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${typeStyle.bg}`}>
                          {typeStyle.label}
                        </span>
                      </div>
                      <div>{renderStatusBadge(post.status, isRisk)}</div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {post.taskTitle || "Untitled Task"}
                    </div>

                    <div className={`flex items-center justify-between pt-1.5 border-t ${statusStyle.divider} text-xs`}>
                      <span className="font-bold text-[11px]" style={{ color: post.clientColor || "#6366f1" }}>
                        {post.clientName}
                      </span>
                      <div className="flex items-center gap-1.5" title={`Created by ${creator.name}`}>
                        <div className="relative w-4.5 h-4.5 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-2xs">
                          {creator.avatarUrl ? (
                            <img
                              src={creator.avatarUrl}
                              alt={creator.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".cal-modal-fallback");
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="cal-modal-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[8px] items-center justify-center uppercase shadow-2xs"
                            style={{ display: creator.avatarUrl ? "none" : "flex" }}
                          >
                            {creator.initials}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{creator.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const d = selectedDayPosts.date;
                  setSelectedDayPosts(null);
                  handleAddPostOnDate(d);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus size={14} /> Add new post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <SmTaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        task={selectedTaskForEdit}
        initialDate={initialDateForCreate}
      />
    </div>
  );
};

export default ContentCalendar;
