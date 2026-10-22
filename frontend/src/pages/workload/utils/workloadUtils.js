import { format, isSameDay, parseISO } from "date-fns";

// ==========================================
// HIGH PERFORMANCE CACHES
// ==========================================
const dateKeyCache = new Map();
const createdDateCache = new Map();
const productivityCache = new Map();
const assignedDateCache = new Map();
const clientInfoCache = new Map();

// Fast date key extractor with O(1) string slice & caching
export const toDateKey = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.slice(0, 10);
  if (dateKeyCache.has(val)) return dateKeyCache.get(val);
  try {
    const d = new Date(val);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const res = `${d.getFullYear()}-${m}-${day}`;
    if (dateKeyCache.size > 2000) dateKeyCache.clear();
    dateKeyCache.set(val, res);
    return res;
  } catch {
    return "";
  }
};

// Safe extractor for task creation date matching the user's local timezone (YYYY-MM-DD)
export const getTaskCreatedDateKey = (val) => {
  if (!val) return "";
  const key = typeof val === "string" ? val : String(val);
  if (createdDateCache.has(key)) return createdDateCache.get(key);

  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      const fallback = typeof val === "string" ? val.slice(0, 10) : "";
      return fallback;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const res = `${y}-${m}-${day}`;
    if (createdDateCache.size > 2000) createdDateCache.clear();
    createdDateCache.set(key, res);
    return res;
  } catch {
    return typeof val === "string" ? val.slice(0, 10) : "";
  }
};

// Compute day work boundaries once per selected date instead of per task
export const getDayWorkContext = (selectedDate, officeHours = { startTime: "09:00", endTime: "19:00" }) => {
  const selDateObj = selectedDate
    ? typeof selectedDate === "string"
      ? parseISO(selectedDate)
      : new Date(selectedDate)
    : new Date();

  const [startH, startM] = (officeHours?.startTime ?? "09:00").split(':').map(Number);
  const [endH, endM] = (officeHours?.endTime ?? "19:00").split(':').map(Number);

  const selYear = selDateObj.getFullYear();
  const selMonth = selDateObj.getMonth();
  const selDate = selDateObj.getDate();

  const dayWorkStart = new Date(selYear, selMonth, selDate, startH, startM, 0, 0).getTime();
  const dayWorkEnd = new Date(selYear, selMonth, selDate, endH, endM, 0, 0).getTime();
  const selDateStr = toDateKey(selDateObj);
  const isSelectedToday = isSameDay(selDateObj, new Date());

  return {
    selDateObj,
    dayWorkStart,
    dayWorkEnd,
    selDateStr,
    isSelectedToday,
  };
};

/**
 * High-performance task productivity calculation with smart static caching
 */
export const calculateTaskProductivityForDate = (task, ctx, nowMs = Date.now()) => {
  if (!task || !ctx) return 0;
  const { dayWorkStart, dayWorkEnd, selDateStr, isSelectedToday } = ctx;

  if (dayWorkStart > nowMs) return 0;

  const isLiveTask = isSelectedToday && task.status === "In Progress" && !task.autoPaused;

  // Use memoized cache for non-live completed, paused, or past-day tasks
  if (!isLiveTask && task._id) {
    const cacheKey = `${task._id}_${task.updatedAt || ""}_${selDateStr}`;
    if (productivityCache.has(cacheKey)) {
      return productivityCache.get(cacheKey);
    }
  }

  let subtasksDuration = 0;
  if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
    for (let i = 0; i < task.subtasks.length; i++) {
      subtasksDuration += calculateTaskProductivityForDate(task.subtasks[i], ctx, nowMs);
    }
  }

  let result = 0;

  if (task.statusHistory && Array.isArray(task.statusHistory) && task.statusHistory.length > 0) {
    let historyDuration = 0;

    for (let i = 0; i < task.statusHistory.length; i++) {
      const h = task.statusHistory[i];
      if (h.status !== "In Progress") continue;

      const entryDate = h.date ? toDateKey(h.date) : (h.startTime ? toDateKey(h.startTime) : "");
      if (entryDate !== selDateStr) continue;

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
        // Open entry on today — handled by live session below
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
    }

    if (isSelectedToday && task.status === "In Progress" && !task.autoPaused) {
      const liveSessionStart = task.actualStartTime
        ? new Date(task.actualStartTime).getTime()
        : 0;
      const liveSessionDateStr = task.actualStartTime
        ? toDateKey(task.actualStartTime)
        : null;

      if (liveSessionStart > 0 && liveSessionDateStr === selDateStr) {
        const liveWorked = Math.max(0, nowMs - liveSessionStart);
        result = Math.max(0, historyDuration + liveWorked) + subtasksDuration;
        return result;
      }
    }

    if (
      historyDuration > 0 ||
      (task.statusHistory.length > 0 && !task.actualStartTime)
    ) {
      result = historyDuration + subtasksDuration;
      if (!isLiveTask && task._id) {
        if (productivityCache.size > 2500) productivityCache.clear();
        productivityCache.set(`${task._id}_${task.updatedAt || ""}_${selDateStr}`, result);
      }
      return result;
    }
  }

  if (!task.actualStartTime) {
    result = subtasksDuration;
    if (!isLiveTask && task._id) {
      if (productivityCache.size > 2500) productivityCache.clear();
      productivityCache.set(`${task._id}_${task.updatedAt || ""}_${selDateStr}`, result);
    }
    return result;
  }

  const taskStart = new Date(task.actualStartTime).getTime();
  if (isNaN(taskStart) || taskStart >= dayWorkEnd) {
    if (!isLiveTask && task._id) {
      productivityCache.set(`${task._id}_${task.updatedAt || ""}_${selDateStr}`, 0);
    }
    return 0;
  }

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
      taskEnd = new Date(task.pausedAt || nowMs).getTime();
    } else {
      taskEnd = isSelectedToday ? nowMs : dayWorkEnd;
    }
  } else {
    if (task.actualEndTime) {
      taskEnd = new Date(task.actualEndTime).getTime();
    } else if (task.pausedAt) {
      taskEnd = new Date(task.pausedAt).getTime();
    } else {
      taskEnd = isSelectedToday ? nowMs : dayWorkEnd;
    }
  }

  if (isNaN(taskEnd) || taskEnd <= taskStart || taskEnd <= dayWorkStart) {
    if (!isLiveTask && task._id) {
      productivityCache.set(`${task._id}_${task.updatedAt || ""}_${selDateStr}`, 0);
    }
    return 0;
  }

  const effectiveStart = Math.max(taskStart, dayWorkStart);
  const effectiveEnd = Math.min(taskEnd, dayWorkEnd);
  const daySpan = Math.max(0, effectiveEnd - effectiveStart);
  if (daySpan <= 0) {
    if (!isLiveTask && task._id) {
      productivityCache.set(`${task._id}_${task.updatedAt || ""}_${selDateStr}`, 0);
    }
    return 0;
  }

  let dayPausedMs = 0;
  const totalPaused = task.totalPausedMs || 0;
  if (totalPaused > 0) {
    const lifetimeSpan = Math.max(
      1,
      new Date(task.actualEndTime || nowMs).getTime() - taskStart
    );
    const ratio = daySpan / lifetimeSpan;
    dayPausedMs = Math.min(daySpan, totalPaused * ratio);
  }

  result = Math.max(0, daySpan - dayPausedMs) + subtasksDuration;

  if (!isLiveTask && task._id) {
    if (productivityCache.size > 2500) productivityCache.clear();
    productivityCache.set(`${task._id}_${task.updatedAt || ""}_${selDateStr}`, result);
  }

  return result;
};

// Formatter helper for duration in hours and minutes
export const formatMsToHoursMinutes = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Formatter cache for assigned dates
export const formatTaskAssignedDate = (task) => {
  const dateVal = task.createdAt || task.startDate || task.assignedDate;
  if (!dateVal) return null;
  const key = String(dateVal);
  if (assignedDateCache.has(key)) return assignedDateCache.get(key);
  try {
    const d = typeof dateVal === "string" ? parseISO(dateVal) : new Date(dateVal);
    const res = format(d, "MMM dd, yyyy");
    if (assignedDateCache.size > 2000) assignedDateCache.clear();
    assignedDateCache.set(key, res);
    return res;
  } catch {
    return null;
  }
};

export const getPriorityBadgeClass = (priority) => {
  const p = (priority || "").toLowerCase();
  if (p.includes("top") || p.includes("urgent"))
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60";
  if (p.includes("high"))
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60";
  if (p.includes("medium"))
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60";
  return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60";
};

export const getStatusBadgeClass = (status) => {
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
};

// Fast cached helper to resolve client display name and brand color for task badges
export const getTaskClientInfo = (task) => {
  if (!task) return { name: "", color: "" };
  if (task._id && clientInfoCache.has(task._id)) {
    return clientInfoCache.get(task._id);
  }

  const clientObj =
    task.client && typeof task.client === "object"
      ? task.client
      : task.project?.client && typeof task.project.client === "object"
        ? task.project.client
        : null;

  let name =
    clientObj?.companyName ||
    clientObj?.name ||
    task.clientName ||
    "";

  if (!name && typeof task.client === "string" && task.client.length < 24) {
    name = task.client;
  }

  const color = clientObj?.color || task.clientColor || (name ? "#6366f1" : "");
  const res = { name, color };

  if (task._id) {
    if (clientInfoCache.size > 2000) clientInfoCache.clear();
    clientInfoCache.set(task._id, res);
  }

  return res;
};

const creatorInfoCache = new Map();

export const getTaskCreatorInfo = (task, usersMap) => {
  if (!task) return null;
  if (task._id && creatorInfoCache.has(task._id)) {
    return creatorInfoCache.get(task._id);
  }

  let creatorObj = task.createdBy;
  if (typeof creatorObj === "string" && usersMap) {
    creatorObj = usersMap.get(creatorObj) || creatorObj;
  }

  if (!creatorObj || typeof creatorObj !== "object" || !creatorObj.name) {
    return null;
  }

  const name = creatorObj.name;
  const avatarUrl =
    creatorObj.profile?.profileImage?.url ||
    (typeof creatorObj.profile?.profileImage === "string" ? creatorObj.profile.profileImage : null) ||
    creatorObj.profileImage?.url ||
    (typeof creatorObj.profileImage === "string" ? creatorObj.profileImage : null) ||
    creatorObj.avatar?.url ||
    (typeof creatorObj.avatar === "string" ? creatorObj.avatar : null) ||
    creatorObj.profilePic ||
    null;

  const res = { name, avatarUrl };

  if (task._id) {
    if (creatorInfoCache.size > 2000) creatorInfoCache.clear();
    creatorInfoCache.set(task._id, res);
  }

  return res;
};

export const DEPARTMENT_TABS = [
  { id: "Graphic Designer", label: "Graphic Designer", emoji: "🎨" },
  { id: "Cinematographer", label: "Cinematographer", emoji: "🎬" },
];

// ==========================================
// WORK TYPES REFERENCE TABLE & LOAD WEIGHTS
// (From Standard Benchmark Guidelines)
// ==========================================
export const WORK_TYPES = [
  {
    id: "Simple static poster",
    label: "Simple static poster",
    department: "Graphic Designer",
    avgTime: "30 mins",
    realisticOutput: "10 posters / day",
    outputShort: "10 posters",
    weightSlots: 1.0,
    icon: "🖼️",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60",
    dotColor: "bg-sky-500",
  },
  {
    id: "Standard branded poster",
    label: "Standard branded poster",
    department: "Graphic Designer",
    avgTime: "45 mins",
    realisticOutput: "8 posters / day",
    outputShort: "8 posters",
    weightSlots: 1.25,
    icon: "🎨",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
    dotColor: "bg-blue-500",
  },
  {
    id: "Creative / campaign poster",
    label: "Creative / campaign poster",
    department: "Graphic Designer",
    avgTime: "1.5 hrs",
    realisticOutput: "4 posters / day",
    outputShort: "4 posters",
    weightSlots: 2.5,
    icon: "✨",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60",
    dotColor: "bg-purple-500",
  },
  {
    id: "Simple reel edit",
    label: "Simple reel edit",
    department: "Cinematographer",
    avgTime: "1 hrs",
    realisticOutput: "5 reels / day",
    outputShort: "5 reels",
    weightSlots: 1.8,
    icon: "✂️",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60",
    dotColor: "bg-teal-500",
  },
  {
    id: "Standard reel edit",
    label: "Standard reel edit",
    department: "Cinematographer",
    avgTime: "2 hrs",
    realisticOutput: "3 reels / day",
    outputShort: "3 reels",
    weightSlots: 3.0,
    icon: "🎬",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60",
    dotColor: "bg-indigo-500",
  },
  {
    id: "Heavy reel / motion graphics",
    label: "Heavy reel / motion graphics",
    department: "Cinematographer",
    avgTime: "3 hrs",
    realisticOutput: "2 reels / day",
    outputShort: "2 reels",
    weightSlots: 5.0,
    icon: "🔥",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60",
    dotColor: "bg-rose-500",
  },
];

export const getWorkTypeMeta = (workTypeId) => {
  if (!workTypeId) return null;
  const normalized = String(workTypeId).toLowerCase().trim();
  return (
    WORK_TYPES.find((w) => w.id.toLowerCase() === normalized || w.label.toLowerCase() === normalized) ||
    null
  );
};

export const getTaskSlotWeight = (task) => {
  if (!task) return 1;
  const meta = getWorkTypeMeta(task.workType);
  return meta ? meta.weightSlots : 1;
};


