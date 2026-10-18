import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketContext } from "../../context/SocketContext";
import {
  format,
  isSameDay,
  parseISO,
  subDays,
  addDays,
} from "date-fns";
import {
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiPlay,
  FiPauseCircle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiBriefcase,
  FiRefreshCw,
  FiX,
  FiActivity,
  FiCheckCircle,
  FiSearch,
  FiZap,
} from "react-icons/fi";

import { getUsers } from "../../features/users/userSlice";
import { useGetTasksQuery } from "../../features/api/apiSlice";
import ClientBadge from "../../components/common/ClientBadge";

// High-speed date string extractor (100x faster than toLocaleDateString)
const toDateKey = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.slice(0, 10);
  try {
    const d = new Date(val);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  } catch {
    return "";
  }
};

/**
 * Single source of truth calculation for task productivity on a specific date.
 */
const calculateTaskProductivityForDate = (
  task,
  selectedDate = new Date(),
  officeHours = { startTime: "09:00", endTime: "19:00" }
) => {
  if (!task) return 0;

  const selDateObj = selectedDate
    ? typeof selectedDate === "string"
      ? parseISO(selectedDate)
      : new Date(selectedDate)
    : new Date();

  const startTimeStr = officeHours?.startTime ?? "09:00";
  const endTimeStr = officeHours?.endTime ?? "19:00";

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const dayWorkStart = new Date(
    selDateObj.getFullYear(),
    selDateObj.getMonth(),
    selDateObj.getDate(),
    startH,
    startM,
    0,
    0
  ).getTime();

  const dayWorkEnd = new Date(
    selDateObj.getFullYear(),
    selDateObj.getMonth(),
    selDateObj.getDate(),
    endH,
    endM,
    0,
    0
  ).getTime();

  if (dayWorkStart > Date.now()) return 0;

  let subtasksDuration = 0;
  if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
    task.subtasks.forEach((sub) => {
      subtasksDuration += calculateTaskProductivityForDate(
        sub,
        selectedDate,
        officeHours
      );
    });
  }

  if (
    task.statusHistory &&
    Array.isArray(task.statusHistory) &&
    task.statusHistory.length > 0
  ) {
    const selDateStr = toDateKey(selDateObj);
    const isSelectedToday = isSameDay(selDateObj, new Date());
    let historyDuration = 0;

    task.statusHistory.forEach((h) => {
      if (h.status !== "In Progress") return;

      const entryDate = h.date ? toDateKey(h.date) : (h.startTime ? toDateKey(h.startTime) : "");
      if (entryDate !== selDateStr) return;

      if (h.duration > 0) {
        historyDuration += h.duration;
      } else if (h.endTime) {
        historyDuration += Math.max(
          0,
          new Date(h.endTime).getTime() - new Date(h.startTime).getTime()
        );
      } else if (
        isSelectedToday &&
        task.status === "In Progress" &&
        !task.autoPaused
      ) {
        // Open entry on today — handled by live section below
      } else {
        const entryStartMs = new Date(h.startTime).getTime();
        const capEnd =
          task.autoPaused && task.pausedAt
            ? Math.min(new Date(task.pausedAt).getTime(), dayWorkEnd)
            : dayWorkEnd;
        historyDuration += Math.max(
          0,
          Math.min(capEnd, dayWorkEnd) - Math.max(entryStartMs, dayWorkStart)
        );
      }
    });

    if (isSelectedToday && task.status === "In Progress" && !task.autoPaused) {
      const liveSessionStart = task.actualStartTime
        ? new Date(task.actualStartTime).getTime()
        : 0;
      const liveSessionDateStr = task.actualStartTime
        ? toDateKey(task.actualStartTime)
        : null;

      if (liveSessionStart > 0 && liveSessionDateStr === selDateStr) {
        const nowMs = Date.now();
        let liveWorked = Math.max(0, nowMs - liveSessionStart);

        return Math.max(0, historyDuration + Math.max(0, liveWorked)) + subtasksDuration;
      }
    }

    if (
      historyDuration > 0 ||
      (task.statusHistory.length > 0 && !task.actualStartTime)
    ) {
      return historyDuration + subtasksDuration;
    }
  }

  if (!task.actualStartTime) return subtasksDuration;

  const taskStart = new Date(task.actualStartTime).getTime();
  if (isNaN(taskStart) || taskStart >= dayWorkEnd) return 0;

  const statusUpper = (task.status || "").trim().toUpperCase();
  let taskEnd;

  if (
    statusUpper === "IN REVIEW" ||
    statusUpper === "IN_REVIEW" ||
    statusUpper === "IN-REVIEW"
  ) {
    taskEnd = new Date(
      task.reviewStartedAt ||
      task.lastReviewStartedAt ||
      task.pausedAt ||
      task.actualEndTime ||
      task.updatedAt
    ).getTime();
  } else if (statusUpper === "COMPLETED") {
    const reviewTime =
      task.reviewStartedAt ||
      task.lastReviewStartedAt ||
      (task.reviewCycles && task.reviewCycles.length > 0
        ? task.reviewCycles[task.reviewCycles.length - 1].startedAt
        : null);

    taskEnd = reviewTime
      ? new Date(reviewTime).getTime()
      : new Date(
        task.actualEndTime || task.completedAt || task.updatedAt
      ).getTime();
  } else if (
    statusUpper === "ON HOLD" ||
    statusUpper === "ON_HOLD" ||
    statusUpper === "CORRECTION"
  ) {
    taskEnd = new Date(
      task.pausedAt || task.actualEndTime || task.updatedAt
    ).getTime();
  } else if (statusUpper === "REJECTED") {
    taskEnd = new Date(
      task.actualEndTime || task.completedAt || task.pausedAt || task.updatedAt
    ).getTime();
  } else if (statusUpper === "IN PROGRESS" || statusUpper === "IN_PROGRESS") {
    if (task.autoPaused) {
      taskEnd = new Date(task.pausedAt || Date.now()).getTime();
    } else {
      taskEnd = isSameDay(selDateObj, new Date()) ? Date.now() : dayWorkEnd;
    }
  } else {
    if (task.actualEndTime) {
      taskEnd = new Date(task.actualEndTime).getTime();
    } else if (task.pausedAt) {
      taskEnd = new Date(task.pausedAt).getTime();
    } else {
      taskEnd = isSameDay(selDateObj, new Date()) ? Date.now() : dayWorkEnd;
    }
  }

  if (isNaN(taskEnd) || taskEnd <= taskStart || taskEnd <= dayWorkStart) return 0;

  const effectiveStart = Math.max(taskStart, dayWorkStart);
  const effectiveEnd = Math.min(taskEnd, dayWorkEnd);
  const daySpan = Math.max(0, effectiveEnd - effectiveStart);
  if (daySpan <= 0) return 0;

  let dayPausedMs = 0;


  const totalPaused = task.totalPausedMs || 0;
  if (totalPaused > 0) {
    const lifetimeSpan = Math.max(
      1,
      new Date(task.actualEndTime || Date.now()).getTime() - taskStart
    );
    const ratio = daySpan / lifetimeSpan;
    dayPausedMs = Math.min(daySpan, totalPaused * ratio);
  }

  return Math.max(0, daySpan - dayPausedMs) + subtasksDuration;
};

// Formatter helper for duration in hours and minutes (no starting 0 clutter)
const formatMsToHoursMinutes = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Formatter helper to display the date when the task was assigned
const formatTaskAssignedDate = (task) => {
  const dateVal = task.createdAt || task.startDate || task.assignedDate;
  if (!dateVal) return null;
  try {
    const d = typeof dateVal === "string" ? parseISO(dateVal) : new Date(dateVal);
    return format(d, "MMM dd, yyyy");
  } catch (err) {
    return null;
  }
};

const Workload = () => {
  const dispatch = useDispatch();

  // Load users from Redux store
  const { users = [], loading: usersLoading } = useSelector((state) => state.users);

  // Load tasks via RTK Query - Fast indexed query: active tasks for Graphic Designers only (<50ms)
  const {
    data: tasksData = [],
    isLoading: tasksLoading,
    isFetching: tasksFetching,
    refetch: refetchTasks,
  } = useGetTasksQuery({ active_only: true, department: "Graphic Designer" });

  // Real-time Online / Offline state from shared SocketContext (no duplicate socket)
  const { onlineUserIds = [], userPresence = {} } = useSocketContext() || {};

  // O(1) set for lightning-fast online check
  const onlineUserIdsSet = useMemo(() => {
    return new Set((onlineUserIds || []).map((id) => id?.toString()));
  }, [onlineUserIds]);

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [expandedUserIds, setExpandedUserIds] = useState([]);
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);

  // Instant Speed: Only fetch users if not already loaded in Redux store
  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getUsers());
    }
  }, [dispatch, users?.length]);

  // Filter users strictly for Graphic Designer department only
  const filteredUsers = useMemo(() => {
    let list = (users || []).filter((u) => u.employmentStatus !== "relieved");

    // Strictly Graphic Designer department
    list = list.filter((u) => {
      const deptLower = (u.department || "").toLowerCase().trim();
      const roleLower = (u.role || "").toLowerCase().trim();

      return (
        deptLower.includes("graphic") ||
        deptLower.includes("design") ||
        deptLower === "designer" ||
        roleLower.includes("designer") ||
        roleLower === "graphic designer"
      );
    });

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, searchTerm]);

  // High-performance indexed map of tasks by assigned user ID (O(1) instant lookup)
  const tasksByUserMap = useMemo(() => {
    const map = new Map();
    (tasksData || []).forEach((t) => {
      if (!t) return;
      const assignedId =
        typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
      if (assignedId) {
        const sId = assignedId.toString();
        if (!map.has(sId)) map.set(sId, []);
        map.get(sId).push(t);
      }
      if (Array.isArray(t.subtasks)) {
        t.subtasks.forEach((sub) => {
          const subAssignedId =
            typeof sub.assignedTo === "object" ? sub.assignedTo?._id : sub.assignedTo;
          if (subAssignedId) {
            const subIdStr = subAssignedId.toString();
            if (!map.has(subIdStr)) map.set(subIdStr, []);
            const arr = map.get(subIdStr);
            if (!arr.some((existing) => existing._id === t._id)) {
              arr.push(t);
            }
          }
        });
      }
    });
    return map;
  }, [tasksData]);

  // Compute detailed workload data for each user
  const userWorkloads = useMemo(() => {
    return filteredUsers.map((u) => {
      const userIdStr = u._id?.toString();

      // Real-time Online / Offline status using O(1) Set
      const isOnline =
        onlineUserIdsSet.has(userIdStr) ||
        userPresence[userIdStr]?.status === "online" ||
        userPresence[userIdStr]?.status === "away" ||
        u.presenceStatus === "online";

      // Instant O(1) task lookup
      const assignedTasks = tasksByUserMap.get(userIdStr) || [];

      // Categorize tasks
      const activeTasks = assignedTasks.filter(
        (t) => t.status === "In Progress" && !t.autoPaused
      );

      const onHoldTasks = assignedTasks.filter(
        (t) => t.status === "On Hold" || (t.status === "In Progress" && t.autoPaused)
      );

      const pendingTasks = assignedTasks.filter(
        (t) => t.status === "Not Started" || t.status === "To Do" || t.status === "Pending"
      );

      // Filter tasks for "View Tasks" to ONLY: In Progress, On Hold, and Not Started (per user requirement)
      const displayTasks = assignedTasks.filter((t) => {
        const s = (t.status || "").toLowerCase().trim();
        if (
          s.includes("complete") ||
          s.includes("done") ||
          s.includes("review") ||
          s.includes("reject") ||
          s.includes("correct")
        ) {
          return false;
        }
        return (
          s.includes("progress") ||
          s.includes("hold") ||
          s.includes("pause") ||
          s.includes("not started") ||
          s.includes("to do") ||
          s.includes("todo") ||
          s.includes("pending")
        );
      });

      // Designer Capacity: Exactly 8 Tasks per Designer
      const maxCapacityTasks = 8;
      const totalActiveTasksCount = displayTasks.length;
      const taskUtilizationPercent = Math.min(
        150,
        Math.round((totalActiveTasksCount / maxCapacityTasks) * 100)
      );

      // Define Card Theme and Status based on capacity (Slot > 8 gives RED color background)
      let cardTheme = {
        cardBg: "bg-white dark:bg-[#0f172a]/95",
        cardBorder: "border-slate-200/90 dark:border-slate-800",
        cardRing: "",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
        meterBg: "bg-slate-50/90 dark:bg-[#1e293b]/60 border-slate-200/80 dark:border-slate-800/80",
        slotFilledColor: "bg-emerald-500",
        slotEmptyColor: "bg-slate-200 dark:bg-slate-800",
        capacityTextColor: "text-emerald-600 dark:text-emerald-400",
        isOverloaded: false,
        statusTag: `${maxCapacityTasks - totalActiveTasksCount} Slots Open`,
      };

      if (totalActiveTasksCount > maxCapacityTasks) {
        // Red color background when slot exceeds 8 (slot 8 mela pochu na Red color background)
        cardTheme = {
          cardBg: "bg-rose-50/95 dark:bg-[#200d11]",
          cardBorder: "border-rose-300 dark:border-rose-800/80",
          cardRing: "ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10",
          badgeBg: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800",
          meterBg: "bg-rose-100/70 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60",
          slotFilledColor: "bg-rose-500",
          slotEmptyColor: "bg-rose-200/60 dark:bg-rose-950/40",
          capacityTextColor: "text-rose-600 dark:text-rose-400",
          isOverloaded: true,
          statusTag: `⚠️ Overloaded (+${totalActiveTasksCount - maxCapacityTasks} tasks)`,
        };
      } else if (totalActiveTasksCount === maxCapacityTasks) {
        // Full Capacity (exactly 8 tasks)
        cardTheme = {
          cardBg: "bg-indigo-50/40 dark:bg-[#121630]",
          cardBorder: "border-indigo-200/90 dark:border-indigo-800/80",
          cardRing: "ring-1 ring-indigo-500/30",
          badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-800",
          meterBg: "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/50",
          slotFilledColor: "bg-indigo-500",
          slotEmptyColor: "bg-slate-200 dark:bg-slate-800",
          capacityTextColor: "text-indigo-600 dark:text-indigo-400",
          isOverloaded: false,
          statusTag: "Full Capacity (8/8)",
        };
      } else if (totalActiveTasksCount >= 6) {
        // High Load (6 - 7 tasks)
        cardTheme = {
          cardBg: "bg-amber-50/30 dark:bg-[#1e170c]",
          cardBorder: "border-amber-200/90 dark:border-amber-800/80",
          cardRing: "ring-1 ring-amber-500/20",
          badgeBg: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800",
          meterBg: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50",
          slotFilledColor: "bg-amber-500",
          slotEmptyColor: "bg-slate-200 dark:bg-slate-800",
          capacityTextColor: "text-amber-600 dark:text-amber-400",
          isOverloaded: false,
          statusTag: `High Load (${maxCapacityTasks - totalActiveTasksCount} left)`,
        };
      }

      let capacityStatus = {
        label: cardTheme.statusTag,
        color: cardTheme.capacityTextColor,
        barColor: cardTheme.slotFilledColor,
        badgeClass: cardTheme.badgeBg,
      };

      // Pre-sort tasks once in memory: 1. In Progress, 2. On Hold, 3. Not Started
      const sortedDisplayTasks = [...displayTasks].sort((a, b) => {
        const getWeight = (status) => {
          const s = (status || "").toLowerCase();
          if (s.includes("progress")) return 1;
          if (s.includes("hold") || s.includes("pause")) return 2;
          return 3;
        };
        return getWeight(a.status) - getWeight(b.status);
      });

      // Calculate total productivity time logged for selected date
      let workedMs = 0;
      assignedTasks.forEach((t) => {
        workedMs += calculateTaskProductivityForDate(t, selectedDate);
      });

      // Determine Work Activity Status Badge
      let availability = {
        label: isOnline ? "Online (Available)" : "Offline",
        status: isOnline ? "online" : "offline",
        badgeClass: isOnline
          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60"
          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1e293b]/70 dark:text-slate-400 dark:border-slate-700/60",
        dotClass: isOnline ? "bg-sky-500" : "bg-slate-400 dark:bg-slate-500",
      };

      if (activeTasks.length > 0) {
        availability = {
          label: "Busy (Working)",
          status: "busy",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
          dotClass: "bg-emerald-500 animate-ping",
        };
      } else if (onHoldTasks.length > 0) {
        availability = {
          label: "On Break / Paused",
          status: "paused",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
          dotClass: "bg-amber-500",
        };
      }

      return {
        user: u,
        isOnline,
        assignedTasks,
        displayTasks,
        sortedDisplayTasks,
        activeTasks,
        pendingTasks,
        onHoldTasks,
        workedMs,
        maxCapacityTasks,
        totalActiveTasksCount,
        taskUtilizationPercent,
        capacityStatus,
        cardTheme,
        availability,
      };
    });
  }, [filteredUsers, tasksByUserMap, selectedDate, onlineUserIdsSet, userPresence]);

  // Executive Team Health Metrics for KPI summary cards
  const teamMetrics = useMemo(() => {
    const total = userWorkloads.length;
    const online = userWorkloads.filter((w) => w.isOnline).length;
    const working = userWorkloads.filter((w) => w.availability.status === "busy").length;
    const onBreak = userWorkloads.filter((w) => w.availability.status === "paused").length;
    const available = userWorkloads.filter(
      (w) => w.isOnline && w.activeTasks.length === 0 && w.onHoldTasks.length === 0
    ).length;
    const overloaded = userWorkloads.filter((w) => w.cardTheme.isOverloaded).length;
    const totalActive = userWorkloads.reduce((acc, w) => acc + (w.activeTasks?.length || 0), 0);
    const totalAssigned = userWorkloads.reduce((acc, w) => acc + w.totalActiveTasksCount, 0);
    const maxCapacity = Math.max(1, total * 8);
    const capacityPercent = Math.min(150, Math.round((totalAssigned / maxCapacity) * 100));
    const totalWorkedMs = userWorkloads.reduce((acc, w) => acc + (w.workedMs || 0), 0);

    return {
      total,
      online,
      working,
      onBreak,
      available,
      overloaded,
      totalActive,
      totalAssigned,
      capacityPercent,
      totalWorkedMs,
    };
  }, [userWorkloads]);

  // Apply availability filter if selected
  const finalWorkloads = useMemo(() => {
    if (availabilityFilter === "all") return userWorkloads;
    if (availabilityFilter === "online") {
      return userWorkloads.filter((w) => w.isOnline);
    }
    if (availabilityFilter === "offline") {
      return userWorkloads.filter((w) => !w.isOnline);
    }
    if (availabilityFilter === "busy") {
      return userWorkloads.filter((w) => w.availability.status === "busy");
    }
    if (availabilityFilter === "paused") {
      return userWorkloads.filter((w) => w.availability.status === "paused");
    }
    if (availabilityFilter === "available") {
      return userWorkloads.filter(
        (w) => w.isOnline && w.activeTasks.length === 0 && w.onHoldTasks.length === 0
      );
    }
    if (availabilityFilter === "overloaded") {
      return userWorkloads.filter((w) => w.cardTheme.isOverloaded);
    }
    return userWorkloads.filter(
      (w) => w.availability.status === availabilityFilter
    );
  }, [userWorkloads, availabilityFilter]);

  const toggleExpandUser = (userId) => {
    setExpandedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDateChange = (days) => {
    setSelectedDate((prev) => (days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days))));
  };

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || "").toLowerCase();
    if (p.includes("top") || p.includes("urgent"))
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60";
    if (p.includes("high"))
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60";
    if (p.includes("medium"))
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60";
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60";
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("progress"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60";
    if (s.includes("review"))
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60";
    if (s.includes("hold") || s.includes("pause"))
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60";
    if (s.includes("completed"))
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60";
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60";
  }; return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070b14] p-4 sm:p-6 lg:p-8 space-y-6 font-inter text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Controls Toolbar - Same Line Modern UI/UX */}
      <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Graphic Designer Department Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-black shadow-2xs">
            <span>🎨 Graphic Designer</span>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-extrabold shadow-xs">
              {finalWorkloads.length}
            </span>
          </div>
        </div>

        {/* Right: Search + Availability Filter + Date Navigator + Refresh on the Same Line */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60 lg:w-64">

            <input
              type="text"
              placeholder="Search designer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1e293b]/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Availability Status Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1e293b]/60 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="online">🟢 Online Only</option>
            <option value="offline">⚪ Offline Only</option>
            <option value="busy">⚡ Busy (Working)</option>
            <option value="paused">⏸️ On Break</option>
          </select>

          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#1e293b]/60 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <FiChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-1 whitespace-nowrap">
              {isSameDay(selectedDate, new Date())
                ? "Today, " + format(selectedDate, "MMM dd")
                : format(selectedDate, "MMM dd")}
            </span>
            <button
              onClick={() => handleDateChange(1)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Day"
            >
              <FiChevronRight size={14} />
            </button>
          </div>

          {/* Refresh Tasks */}
          <button
            onClick={() => refetchTasks()}
            className="p-2 rounded-xl bg-slate-50 dark:bg-[#1e293b]/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0"
            title="Refresh Workload"
          >
            <FiRefreshCw size={14} className={tasksFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""} />
          </button>
        </div>
      </div>

      {/* Main Workload User Grid */}
      {usersLoading && (!users || users.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase animate-pulse">
            Loading team workload data...
          </span>
        </div>
      ) : finalWorkloads.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a]/90 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800/90 space-y-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50">
            <FiUsers size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              No Graphic Designers Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are no graphic designers matching your search or filter criteria.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setAvailabilityFilter("all");
            }}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {finalWorkloads.map((workload) => {
            const {
              user: member,
              isOnline,
              displayTasks,
              sortedDisplayTasks,
              activeTasks,
              pendingTasks,
              onHoldTasks,
              workedMs,
              maxCapacityTasks,
              totalActiveTasksCount,
              taskUtilizationPercent,
              capacityStatus,
              cardTheme,
              availability,
            } = workload;

            const isExpanded = expandedUserIds.includes(member._id);

            return (
              <div
                key={member._id}
                className={`${cardTheme.cardBg} ${cardTheme.cardBorder} ${cardTheme.cardRing} rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group h-full relative`}
              >


                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Top: Avatar, Info & Online Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {member.profile?.profileImage?.url ? (
                          <img
                            src={member.profile.profileImage.url}
                            alt={member.name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs uppercase">
                            {member.name ? member.name.substring(0, 2) : "TM"}
                          </div>
                        )}
                        {/* Real-time Online Indicator */}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${isOnline
                              ? "bg-emerald-500 shadow-xs"
                              : "bg-slate-400 dark:bg-slate-600"
                            }`}
                          title={isOnline ? "Online Now" : "Offline"}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3
                          className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                          title={member.name}
                        >
                          {member.name}
                        </h3>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 truncate">
                            {member.department || "Graphic Designer"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Online / Activity Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${isOnline
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1e293b]/70 dark:text-slate-400 dark:border-slate-700/60"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-slate-500"
                            }`}
                        />
                        {isOnline ? "Online" : "Offline"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${availability.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${availability.dotClass}`} />
                        {availability.label}
                      </span>
                    </div>
                  </div>

                  {/* Active Task Live Strip (Fixed height for clean baseline alignment) */}
                  <div className="h-12 flex items-center">
                    {activeTasks.length > 0 ? (
                      <div className="w-full h-full p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs">
                        <FiPlay className="text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" size={15} />
                        <div className="min-w-0 flex-1 truncate">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 block leading-tight">
                            Working On Task:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate block text-xs">
                            {activeTasks[0]?.title}
                          </span>
                        </div>
                      </div>
                    ) : onHoldTasks.length > 0 ? (
                      <div className="w-full h-full p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <FiPauseCircle className="text-amber-500 shrink-0" size={16} />
                        <span className="text-xs font-bold truncate">Tasks paused / On break</span>
                      </div>
                    ) : (
                      <div className="w-full h-full p-2.5 rounded-xl bg-slate-50/90 dark:bg-[#1e293b]/40 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        <span className="text-xs font-semibold">Available • Ready for new tasks</span>
                      </div>
                    )}
                  </div>

                  {/* Designer 8-Task Capacity Box */}
                  <div className={`${cardTheme.meterBg} p-3.5 rounded-2xl border space-y-2.5 transition-colors`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold">
                        <FiBriefcase className={cardTheme.isOverloaded ? "text-rose-500" : "text-indigo-500 dark:text-indigo-400"} size={14} />
                        Task Capacity (Max 8)
                      </span>
                      <span className={`font-black text-xs ${cardTheme.capacityTextColor}`}>
                        {totalActiveTasksCount} / {maxCapacityTasks} Tasks ({taskUtilizationPercent}%)
                      </span>
                    </div>

                    {/* 8-Slot Visual Segmented Bar */}
                    <div className="grid grid-cols-8 gap-1.5 py-0.5">
                      {Array.from({ length: maxCapacityTasks }).map((_, index) => {
                        const isFilled = index < totalActiveTasksCount;
                        return (
                          <div
                            key={index}
                            className={`h-3 rounded-full transition-all duration-300 ${isFilled
                                ? cardTheme.slotFilledColor
                                : cardTheme.slotEmptyColor
                              }`}
                            title={`Task Slot ${index + 1}: ${isFilled ? "Occupied" : "Free"}`}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5 gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cardTheme.badgeBg}`}>
                        {cardTheme.statusTag}
                      </span>
                      {/* today Productivity iruntha mattum show pannu */}
                      {workedMs > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                          <FiClock size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Today Productivity:</span>
                          <strong className="font-black text-emerald-800 dark:text-emerald-200">
                            {formatMsToHoursMinutes(workedMs)}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3-Column Task Counters: In Progress, On Hold, Not Started only */}
                  <div className="grid grid-cols-3 gap-2.5 pt-0.5">
                    <div className="bg-emerald-50/90 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 text-center">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        In Progress
                      </div>
                      <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
                        {activeTasks.length}
                      </div>
                    </div>

                    <div className="bg-amber-50/90 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/50 text-center">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        On Hold
                      </div>
                      <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-0.5">
                        {onHoldTasks.length}
                      </div>
                    </div>

                    <div className="bg-slate-100/95 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/70 text-center">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Not Started
                      </div>
                      <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {pendingTasks.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Expand Assigned Tasks Toggle (Only In Progress, On Hold, Not Started) */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#0a0f1d]/50 p-3">
                  <button
                    onClick={() => toggleExpandUser(member._id)}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FiBriefcase size={14} />
                      {isExpanded ? "Hide Tasks" : `View Tasks (${displayTasks.length})`}
                    </span>
                    {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </button>

                  {/* Expanded Task List - ONLY In Progress, On Hold, Not Started */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2.5 mt-2 border-t border-slate-200/60 dark:border-slate-800/80 max-h-64 overflow-y-auto space-y-2 pr-1"
                      >
                        {sortedDisplayTasks.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                            No active tasks (In Progress, On Hold, or Not Started) assigned.
                          </div>
                        ) : (
                          sortedDisplayTasks.map((task) => {
                            const assignedDateFormatted = formatTaskAssignedDate(task);
                            const taskWorkedTodayMs = calculateTaskProductivityForDate(task, selectedDate);

                            return (
                              <div
                                key={task._id}
                                className="bg-white dark:bg-[#111827] rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors shadow-2xs"
                              >
                                {/* Assigned Date & Status */}
                                <div className="flex items-center justify-between gap-2">
                                  {assignedDateFormatted ? (
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                      <FiCalendar size={12} className="text-indigo-500 shrink-0" />
                                      <span>Assigned Date: <strong className="text-slate-900 dark:text-slate-100 font-extrabold">{assignedDateFormatted}</strong></span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                      Assigned Task
                                    </span>
                                  )}

                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getStatusBadgeClass(
                                      task.status
                                    )}`}
                                  >
                                    {task.status}
                                  </span>
                                </div>

                                {/* Task Name */}
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug">
                                    {task.title}
                                  </h5>
                                  <button
                                    onClick={() => setSelectedTaskModal(task)}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                                    title="View Task Details"
                                  >
                                    <FiEye size={13} />
                                  </button>
                                </div>

                                {/* today Productivity athunu iruntha mattum show pannu */}
                                {taskWorkedTodayMs > 0 && (
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <FiClock size={11} />
                                      Today Productivity:
                                    </span>
                                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                      {formatMsToHoursMinutes(taskWorkedTodayMs)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Preview Modal */}
      <AnimatePresence>
        {selectedTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FiBriefcase className="text-indigo-500 dark:text-indigo-400" size={18} />
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Task Details
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTaskModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Task Title
                  </label>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedTaskModal.title}
                  </p>
                </div>

                {selectedTaskModal.client && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      Client
                    </label>
                    <ClientBadge client={selectedTaskModal.client} size="md" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Status
                    </label>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                          selectedTaskModal.status
                        )}`}
                      >
                        {selectedTaskModal.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Priority
                    </label>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase border ${getPriorityBadgeClass(
                          selectedTaskModal.priority
                        )}`}
                      >
                        {selectedTaskModal.priority || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTaskModal.description && (
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Description
                    </label>
                    <p className="text-slate-700 dark:text-slate-200 mt-1 bg-slate-50 dark:bg-[#1e293b]/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/70 whitespace-pre-wrap leading-relaxed">
                      {selectedTaskModal.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedTaskModal(null)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workload;