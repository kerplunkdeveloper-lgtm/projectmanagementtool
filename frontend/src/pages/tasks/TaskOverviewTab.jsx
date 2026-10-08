import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BiFile } from "react-icons/bi";
import {
  FiCalendar,
  FiFilter,
  FiChevronDown,
  FiColumns,
  FiX,
  FiTag,
  FiSearch,
  FiAlertCircle,
  FiEye,
  FiClock,
  FiDownload,
  FiUser,
  FiLock,
  FiExternalLink,
  FiLayers,
  FiPlay,
  FiAlertTriangle,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiBriefcase,
  FiArrowUpRight,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import ClientBadge, {
  getClientBranding,
} from "../../components/common/ClientBadge";
import { calculateBusinessMs } from "../../utils/businessHours";
import toast from "react-hot-toast";
import {
  calculateTaskProductivityForDate,
  getTaskAssignmentDate,
} from "../Dashboard/cards/GraphicDesignerDashboard";
import {
  getTodayProductivityMs,
  getTotalTrackedMs,
  formatHMS,
  formatShortDuration,
} from "../../utils/taskTimerUtils";

// Date comparison helper
const isSameDate = (d1, d2) => {
  if (!d1 || !d2) return false;
  try {
    const s1 =
      typeof d1 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d1.trim())
        ? d1.trim()
        : new Date(d1).toISOString().split("T")[0];
    const s2 =
      typeof d2 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d2.trim())
        ? d2.trim()
        : new Date(d2).toISOString().split("T")[0];
    return s1 === s2 && s1 !== "1970-01-01";
  } catch (e) {
    return false;
  }
};

// Date productivity check
const checkTaskProductivityAndDate = (
  task,
  dateFilter,
  officeHours = { startTime: "09:00", endTime: "19:00" },
) => {
  if (!dateFilter || dateFilter === "All") return true;
  if (!task) return false;

  const now = new Date();
  const getLocalDateStr = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(now);

  if (dateFilter === "Today") {
    const assignmentDate = getTaskAssignmentDate(task);
    if (assignmentDate && getLocalDateStr(assignmentDate) === todayStr) {
      return true;
    }
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      return task.subtasks.some((sub) => {
        const subAssignDate = getTaskAssignmentDate(sub);
        return subAssignDate && getLocalDateStr(subAssignDate) === todayStr;
      });
    }
    return false;
  }

  if (dateFilter === "Yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    const loggedMs = calculateTaskProductivityForDate(
      task,
      yesterday,
      officeHours,
    );
    if (loggedMs > 0) return true;

    if (Array.isArray(task.statusHistory) && task.statusHistory.length > 0) {
      const hasYesterdayWork = task.statusHistory.some((h) => {
        const entryDate =
          h.date || getLocalDateStr(h.startTime) || getLocalDateStr(h.endTime);
        return entryDate === yesterdayStr && (h.duration > 0 || h.endTime);
      });
      if (hasYesterdayWork) return true;
    }

    const taskStartStr = getLocalDateStr(task.startDate);
    const taskDueStr = getLocalDateStr(task.dueDate);
    const taskCreatedStr = getLocalDateStr(task.createdAt);
    const taskAssignedStr = getLocalDateStr(task.assignedDate);
    if (
      taskStartStr === yesterdayStr ||
      taskDueStr === yesterdayStr ||
      taskCreatedStr === yesterdayStr ||
      taskAssignedStr === yesterdayStr
    ) {
      return true;
    }

    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      const subHasYesterdayDate = task.subtasks.some((sub) => {
        const subStart = getLocalDateStr(sub.startDate);
        const subDue = getLocalDateStr(sub.dueDate);
        const subCreated = getLocalDateStr(sub.createdAt);
        return (
          subStart === yesterdayStr ||
          subDue === yesterdayStr ||
          subCreated === yesterdayStr
        );
      });
      if (subHasYesterdayDate) return true;
    }

    return false;
  }

  if (dateFilter === "This Week") {
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const currDay = new Date(startOfWeek);
    while (currDay <= endOfWeek && currDay <= now) {
      if (calculateTaskProductivityForDate(task, currDay, officeHours) > 0) {
        return true;
      }
      currDay.setDate(currDay.getDate() + 1);
    }

    if (task.status === "In Progress" && !task.actualEndTime) return true;

    const isDateInWeek = (d) => {
      if (!d) return false;
      const date = new Date(d);
      return !isNaN(date.getTime()) && date >= startOfWeek && date <= endOfWeek;
    };

    if (
      isDateInWeek(task.startDate) ||
      isDateInWeek(task.dueDate) ||
      isDateInWeek(task.createdAt) ||
      isDateInWeek(task.assignedDate)
    ) {
      return true;
    }

    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      const subInWeek = task.subtasks.some(
        (sub) =>
          isDateInWeek(sub.startDate) ||
          isDateInWeek(sub.dueDate) ||
          isDateInWeek(sub.createdAt),
      );
      if (subInWeek) return true;
    }

    return false;
  }

  if (dateFilter === "This Month") {
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const isDateInMonth = (d) => {
      if (!d) return false;
      const date = new Date(d);
      return (
        !isNaN(date.getTime()) && date >= startOfMonth && date <= endOfMonth
      );
    };

    if (
      isDateInMonth(task.startDate) ||
      isDateInMonth(task.dueDate) ||
      isDateInMonth(task.createdAt) ||
      isDateInMonth(task.assignedDate)
    ) {
      return true;
    }

    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      const subInMonth = task.subtasks.some(
        (sub) =>
          isDateInMonth(sub.startDate) ||
          isDateInMonth(sub.dueDate) ||
          isDateInMonth(sub.createdAt),
      );
      if (subInMonth) return true;
    }

    if (task.status === "In Progress" && !task.actualEndTime) return true;

    const currDay = new Date(startOfMonth);
    while (currDay <= endOfMonth && currDay <= now) {
      if (calculateTaskProductivityForDate(task, currDay, officeHours) > 0) {
        return true;
      }
      currDay.setDate(currDay.getDate() + 1);
    }

    return false;
  }

  return true;
};

// Formatted short date
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  const day = date.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[date.getMonth()]}`;
};

// Simple active duration badge (read-only)
const SimpleTimeTracker = ({
  task,
  startTime,
  endTime,
  status,
  pausedAt,
  autoPaused,
  savedPausedMs = 0,
  isBlocked,
  totalTrackedTime = 0,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === "In Progress" && !autoPaused && !endTime) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [status, autoPaused, endTime]);

  const taskObj = task || {
    status,
    actualStartTime: startTime,
    actualEndTime: endTime,
    pausedAt,
    autoPaused,
    totalPausedMs: savedPausedMs,
    isBlocked,
    totalTrackedTime,
  };

  const totalMs = getTotalTrackedMs(taskObj, now);

  if (status === "Not Started" || (!startTime && totalMs === 0)) {
    return <span className="text-slate-400 dark:text-[#64748b] font-medium text-[11px]">—</span>;
  }

  const colorClasses =
    status === "In Progress"
      ? "bg-blue-50/90 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-[#93c5fd] dark:border-blue-700/50"
      : status === "In Review"
        ? "bg-amber-50/90 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-[#fde047] dark:border-amber-700/50"
        : status === "On Hold"
          ? "bg-purple-50/90 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-[#d8b4fe] dark:border-purple-700/50"
          : status === "Completed"
            ? "bg-emerald-50/90 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-[#86efac] dark:border-emerald-700/50"
            : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-[#1a202c] dark:text-[#cbd5e1] dark:border-[#334155]";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black border tracking-wide shadow-2xs ${colorClasses}`}
    >
      <FiClock size={11} className="opacity-70" />
      {formatShortDuration(totalMs)}
    </span>
  );
};

// Box tracker (read-only)
const TimeTrackerBox = ({
  task,
  startTime,
  endTime,
  status,
  pausedAt,
  autoPaused,
  savedPausedMs = 0,
  isBlocked,
  totalTrackedTime = 0,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === "In Progress" && !autoPaused && !endTime) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [status, autoPaused, endTime]);

  const taskObj = task || {
    status,
    actualStartTime: startTime,
    actualEndTime: endTime,
    pausedAt,
    autoPaused,
    totalPausedMs: savedPausedMs,
    isBlocked,
    totalTrackedTime,
  };

  const totalMs = getTotalTrackedMs(taskObj, now);

  if (status === "Not Started" || (!startTime && totalMs === 0)) {
    return <span className="text-slate-400 dark:text-[#64748b] font-medium text-[11px]">—</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-[#1a202c] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-[#cbd5e1] text-[11px] font-black shadow-2xs">
      <span className="text-[10px] text-slate-400 dark:text-[#94a3b8] font-bold uppercase">Total</span>
      <span>{formatShortDuration(totalMs)}</span>
    </div>
  );
};

const formatBusinessDuration = (ms) => {
  if (!ms) return "0m 0s";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

// Approval Time Display (read-only)
const ApprovalTimeDisplay = React.memo(
  ({
    reviewStartedAt,
    completedAt,
    approvalWaitingMs,
    status,
    lastReviewStartedAt,
    reviewCycles,
  }) => {
    const [liveElapsed, setLiveElapsed] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const popupRef = useRef(null);

    useEffect(() => {
      if (!reviewStartedAt || status !== "In Review") {
        setLiveElapsed(0);
        return;
      }
      const updateTime = () => {
        const elapsed = calculateBusinessMs(reviewStartedAt, Date.now());
        setLiveElapsed(elapsed);
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }, [reviewStartedAt, status]);

    useEffect(() => {
      if (!showPopup) return;
      const handleClickOutside = (e) => {
        if (
          popupRef.current &&
          !popupRef.current.contains(e.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(e.target)
        ) {
          setShowPopup(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPopup]);

    const effectiveReviewStart =
      reviewStartedAt ||
      lastReviewStartedAt ||
      (reviewCycles && reviewCycles.length > 0
        ? reviewCycles[reviewCycles.length - 1]?.startedAt
        : null);

    if (!effectiveReviewStart && !approvalWaitingMs) {
      return <span className="text-slate-400 dark:text-[#64748b] text-[11px]">—</span>;
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return { date: "—", time: "", relative: "" };
      const d = new Date(dateStr);
      const date = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const diffMs = Date.now() - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let relative = "just now";
      if (diffDays > 0) relative = `${diffDays}d ago`;
      else if (diffHours > 0) relative = `${diffHours}h ago`;
      else if (diffMins > 0) relative = `${diffMins}m ago`;
      return { date, time, relative };
    };

    const totalWaitMs = (approvalWaitingMs || 0) + liveElapsed;
    const isInReview = status === "In Review";
    const revInfo = effectiveReviewStart
      ? formatDateTime(effectiveReviewStart)
      : null;
    const doneInfo = completedAt ? formatDateTime(completedAt) : null;

    const handleToggle = (e) => {
      e.stopPropagation();
      if (!showPopup && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY - 175,
          left: rect.right + window.scrollX - 224,
        });
      }
      setShowPopup(!showPopup);
    };

    return (
      <div className="relative inline-flex items-center gap-1 justify-center">
        {totalWaitMs > 0 && (
          <div
            className={`px-2 py-0.5 rounded-lg font-black text-[11px] tracking-wide border shadow-2xs ${
              isInReview
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25"
                : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
            }`}
          >
            {isInReview && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0 mr-1 inline-block" />
            )}
            {isInReview ? "Waiting " : "Took "}
            <span className="font-black">
              {formatBusinessDuration(totalWaitMs)}
            </span>
          </div>
        )}

        {(revInfo || doneInfo) && (
          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggle}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 dark:text-[#94a3b8] dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="View approval timeline"
          >
            <FiEye size={13} />
          </button>
        )}

        {showPopup &&
          createPortal(
            <AnimatePresence>
              <motion.div
                ref={popupRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: coords.top,
                  left: coords.left,
                }}
                className="z-[9999] w-60 p-3 bg-white dark:bg-[#151725] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col gap-2 text-left backdrop-blur-md"
              >
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-[#94a3b8]">
                    Approval Timeline
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPopup(false)}
                    className="text-slate-400 hover:text-slate-600 dark:text-[#94a3b8] dark:hover:text-[#ffffff] cursor-pointer"
                  >
                    <FiX size={12} />
                  </button>
                </div>

                {revInfo && (
                  <div className="flex flex-col gap-0.5 bg-blue-50/50 dark:bg-blue-950/30 p-2 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Review Started
                    </span>
                    <span className="font-bold text-slate-800 dark:text-[#f8fafc] text-[11px]">
                      {revInfo.date} · {revInfo.time}
                    </span>
                    <span className="text-[9px] text-blue-500 dark:text-blue-400 font-semibold">
                      {revInfo.relative}
                    </span>
                  </div>
                )}

                {doneInfo && (
                  <div className="flex flex-col gap-0.5 bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Approved & Completed
                    </span>
                    <span className="font-bold text-slate-800 dark:text-[#f8fafc] text-[11px]">
                      {doneInfo.date} · {doneInfo.time}
                    </span>
                    <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-semibold">
                      {doneInfo.relative}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
      </div>
    );
  },
);

// User avatar pill
const renderUserAvatarSmall = (u, sizeClass = "w-6 h-6 text-[9px]") => {
  if (!u) return null;
  const avatarUrl =
    (typeof u.profile?.profileImage === "object"
      ? u.profile?.profileImage?.url
      : u.profile?.profileImage) ||
    (typeof u.profileImage === "object"
      ? u.profileImage?.url
      : u.profileImage) ||
    u.profilePic ||
    u.avatar ||
    u.profile?.profilePic ||
    u.profile?.avatar;

  const initials = (u.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const AVATAR_COLORS = [
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
  ];
  const colorClass =
    AVATAR_COLORS[((u.name || "U").charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden shrink-0 border border-slate-200/80 dark:border-white/10 shadow-2xs`}
    >
      <div
        className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-[#ffffff] font-black`}
      >
        {initials}
      </div>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={u.name || "User"}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
};

// Department badge styling
const getDeptBadgeStyle = (dept) => {
  const d = dept?.toLowerCase() || "";
  if (d.includes("graphic") || d.includes("design")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40";
  }
  if (d.includes("video") || d.includes("editor")) {
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40";
  }
  if (d.includes("social") || d.includes("media")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40";
  }
  if (d.includes("content") || d.includes("writer")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40";
  }
  if (d.includes("admin") || d.includes("operation")) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40";
  }
  return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-[#1a202c] dark:text-[#cbd5e1] dark:border-[#334155]";
};

const shortenDept = (dept) => {
  if (!dept) return "";
  const d = dept.toLowerCase().trim();
  if (d.includes("graphic")) return "GD";
  if (d.includes("video")) return "VE";
  if (d.includes("social") && d.includes("manager")) return "SMM";
  if (d.includes("social")) return "SM";
  if (d.includes("content")) return "Content";
  if (d.includes("operation")) return "Ops";
  if (d.includes("admin")) return "Admin";
  if (dept.length <= 4) return dept.toUpperCase();
  return dept
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 3)
    .toUpperCase();
};

// SaaS Priority Badge (read-only)
const PriorityBadge = ({ priority }) => {
  const p = (priority || "Medium").trim();
  switch (p) {
    case "Top High":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-rose-500/10 text-rose-600 border border-rose-300 dark:bg-rose-950/60 dark:text-[#fda4af] dark:border-rose-700/60 shadow-2xs uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Top High
        </span>
      );
    case "High":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-500/10 text-amber-600 border border-amber-300 dark:bg-amber-950/60 dark:text-[#fde047] dark:border-amber-700/60 shadow-2xs uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          High
        </span>
      );
    case "Low":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-slate-500/10 text-slate-700 border border-slate-300 dark:bg-[#1a202c] dark:text-[#cbd5e1] dark:border-[#334155] shadow-2xs uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Low
        </span>
      );
    case "Medium":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-blue-500/10 text-blue-600 border border-blue-300 dark:bg-blue-950/60 dark:text-[#93c5fd] dark:border-blue-700/60 shadow-2xs uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Medium
        </span>
      );
  }
};

// SaaS Status Badge (100% read-only with pulse dots)
const StatusBadge = ({ status, isBlocked }) => {
  if (isBlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/60 dark:text-[#fca5a5] dark:border-red-700/60 shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
        BLOCKED
      </span>
    );
  }

  const s = (status || "Not Started").toUpperCase();

  if (s.includes("PROGRESS")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-blue-100/90 text-blue-700 border border-blue-300 dark:bg-blue-950/60 dark:text-[#93c5fd] dark:border-blue-700/60 shadow-2xs uppercase tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        IN PROGRESS
      </span>
    );
  }

  if (s.includes("REVIEW")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-amber-100/90 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-[#fde047] dark:border-amber-700/60 shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        IN REVIEW
      </span>
    );
  }

  if (s.includes("CORRECTION")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-orange-100/90 text-orange-800 border border-orange-300 dark:bg-orange-950/60 dark:text-[#fdba74] dark:border-orange-700/60 shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        CORRECTION
      </span>
    );
  }

  if (s.includes("HOLD")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-purple-100/90 text-purple-800 border border-purple-300 dark:bg-purple-950/60 dark:text-[#d8b4fe] dark:border-purple-700/60 shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        ON HOLD
      </span>
    );
  }

  if (s.includes("COMPLETED") || s.includes("DONE") || s.includes("APPROVE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-100/90 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-[#86efac] dark:border-emerald-700/60 shadow-2xs uppercase tracking-wider">
        <FiCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
        COMPLETED
      </span>
    );
  }

  if (s.includes("REJECT")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-rose-100/90 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-[#fca5a5] dark:border-rose-700/60 shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        REJECTED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-slate-200/80 text-slate-700 border border-slate-300 dark:bg-[#1a202c] dark:text-[#cbd5e1] dark:border-[#334155] shadow-2xs uppercase tracking-wider">
      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
      NOT STARTED
    </span>
  );
};

// SaaS Content Type Pill (read-only)
const ContentTypeBadge = ({ type }) => {
  if (!type) return <span className="text-slate-400 dark:text-[#64748b] text-[11px]">—</span>;

  const t = String(type).toUpperCase();
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1a202c] dark:text-[#cbd5e1] dark:border-[#334155]";

  if (t === "VIDEO") {
    badgeStyle = "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-[#c4b5fd] dark:border-violet-700/50";
  } else if (t === "IMAGE") {
    badgeStyle = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-[#7dd3fc] dark:border-sky-700/50";
  } else if (t === "CAROUSEL") {
    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-[#fcd34d] dark:border-amber-700/50";
  } else if (t === "REEL") {
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-[#fda4af] dark:border-rose-700/50";
  } else if (t === "POST") {
    badgeStyle = "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-[#5eead4] dark:border-teal-700/50";
  } else if (t === "STORY") {
    badgeStyle = "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-[#f472b6] dark:border-pink-700/50";
  } else if (t === "WEBSITE") {
    badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-[#67e8f9] dark:border-cyan-700/50";
  } else if (t === "SEO") {
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-[#6ee7b7] dark:border-emerald-700/50";
  } else if (t.includes("SHOOT")) {
    badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-[#a5b4fc] dark:border-indigo-700/50";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border shadow-2xs tracking-wider uppercase ${badgeStyle}`}
    >
      {type}
    </span>
  );
};

// MAIN COMPONENT: StatusOverviewTab (Strictly Read-Only SaaS Dashboard)
const TaskOverviewTab = ({
  tasks = [],
  projects = [],
  currentUserId,
  user,
  loading = false,
  dateFilter,
  setDateFilter,
  showDateDropdown,
  setShowDateDropdown,
  dateDropdownRef,
  onFilteredCountChange,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients = [] } = useSelector((state) => state.clients || {});
  const { users = [] } = useSelector((state) => state.users || {});
  const currentUser = useSelector((state) => state.auth?.user) || user;

  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Search & Filters State
  const [projectSearch, setProjectSearch] = useState("");
  const [overviewClientFilter, setOverviewClientFilter] = useState("All");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const clientDropdownRef = useRef(null);

  const [overviewCreatedByFilter, setOverviewCreatedByFilter] = useState("All");
  const [showCreatedByDropdown, setShowCreatedByDropdown] = useState(false);
  const [createdBySearchQuery, setCreatedBySearchQuery] = useState("");
  const createdByDropdownRef = useRef(null);

  const [overviewAssigneeFilter, setOverviewAssigneeFilter] = useState("All");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const assigneeDropdownRef = useRef(null);

  const [overviewDepartmentFilter, setOverviewDepartmentFilter] = useState("All");
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const departmentDropdownRef = useRef(null);

  const [overviewContentTypeFilter, setOverviewContentTypeFilter] = useState("All");
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  const [contentTypeSearchQuery, setContentTypeSearchQuery] = useState("");
  const contentTypeDropdownRef = useRef(null);

  const statusParam = searchParams.get("status");
  const departmentParam =
    searchParams.get("department") || searchParams.get("dept");

  const normalizeStatus = (s) => {
    if (!s) return "All";
    const lower = s.toLowerCase();
    if (lower === "in-review" || lower === "inreview" || lower === "in review") {
      return "In Review";
    }
    return s;
  };

  const [overviewStatusFilter, setOverviewStatusFilter] = useState(() => {
    return normalizeStatus(statusParam);
  });

  const [overviewPriorityFilter, setOverviewPriorityFilter] = useState("All");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const priorityDropdownRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Selected task for read-only Inspector Slide-Over Drawer
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const selectedTask = useMemo(
    () => tasks.find((t) => t._id === selectedTaskId),
    [tasks, selectedTaskId],
  );

  // Column Visibility State
  const [hiddenColumns, setHiddenColumns] = useState({
    taskName: false,
    projectName: false,
    clientName: false,
    contentCopy: false,
    contentType: false,
    createdBy: false,
    assignee: false,
    startDate: false,
    dueDate: false,
    priority: false,
    status: false,
    holdReason: false,
    totalHours: false,
    timeTracker: false,
    approvalInfo: false,
    action: false,
  });
  const [isColsOpen, setIsColsOpen] = useState(false);
  const colsDropdownRef = useRef(null);

  // Sync route query params
  useEffect(() => {
    if (statusParam) {
      setOverviewStatusFilter(normalizeStatus(statusParam));
    }
  }, [statusParam]);

  useEffect(() => {
    if (departmentParam) {
      setOverviewDepartmentFilter(departmentParam);
    }
  }, [departmentParam]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        colsDropdownRef.current &&
        !colsDropdownRef.current.contains(event.target)
      ) {
        setIsColsOpen(false);
      }
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false);
      }
      if (
        createdByDropdownRef.current &&
        !createdByDropdownRef.current.contains(event.target)
      ) {
        setShowCreatedByDropdown(false);
      }
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target)
      ) {
        setShowAssigneeDropdown(false);
      }
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target)
      ) {
        setShowDepartmentDropdown(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setShowPriorityDropdown(false);
      }
      if (
        contentTypeDropdownRef.current &&
        !contentTypeDropdownRef.current.contains(event.target)
      ) {
        setShowContentTypeDropdown(false);
      }
      if (
        dateDropdownRef?.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setShowDateDropdown?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dateDropdownRef, setShowDateDropdown]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    projectSearch,
    overviewPriorityFilter,
    overviewStatusFilter,
    overviewDepartmentFilter,
    dateFilter,
    overviewClientFilter,
    overviewCreatedByFilter,
    overviewAssigneeFilter,
    overviewContentTypeFilter,
  ]);

  // Maps & Lookups
  const projectsMap = useMemo(() => {
    const map = new Map();
    (projects || []).forEach((p) => {
      if (p && p._id) map.set(String(p._id), p);
    });
    return map;
  }, [projects]);

  const uniqueCreators = useMemo(() => {
    const map = new Map();
    (tasks || []).forEach((t) => {
      const u = t.createdBy;
      if (u && (u._id || u.id)) {
        const id = u._id || u.id;
        if (!map.has(id)) {
          map.set(id, u);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  }, [tasks]);

  const uniqueAssignees = useMemo(() => {
    const map = new Map();
    (tasks || []).forEach((t) => {
      const u = t.assignedTo;
      if (u && (u._id || u.id)) {
        const id = u._id || u.id;
        if (!map.has(id)) {
          map.set(id, u);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  }, [tasks]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set();
    (users || []).forEach((u) => {
      if (u.department && u.department.trim()) {
        set.add(u.department.trim());
      }
    });
    (tasks || []).forEach((t) => {
      if (t.assignedTo?.department) set.add(t.assignedTo.department.trim());
      if (t.createdBy?.department) set.add(t.createdBy.department.trim());
    });
    return Array.from(set).sort();
  }, [users, tasks]);

  const uniqueContentTypes = useMemo(() => {
    const set = new Set();
    (tasks || []).forEach((t) => {
      if (t.contentType && t.contentType.trim()) {
        set.add(t.contentType.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  const taskDisplayIdMap = useMemo(() => {
    const map = new Map();
    if (!tasks) return map;

    const projectGroups = new Map();
    for (const t of tasks) {
      const projId = String(t.project?._id || t.project || "unknown");
      if (!projectGroups.has(projId)) {
        projectGroups.set(projId, []);
      }
      projectGroups.get(projId).push(t);
    }

    for (const [projId, pTasks] of projectGroups.entries()) {
      const projectObj = projectsMap.get(projId);
      const firstTask = pTasks[0];
      const projChar = (projectObj?.name || firstTask.project?.name || "P")
        .charAt(0)
        .toUpperCase();
      const client = firstTask.project?.client?.companyName
        ? firstTask.project.client
        : projectObj?.client || firstTask.project?.client;
      const clientName = client?.companyName || "";
      const clientChars = clientName
        ? clientName.substring(0, 2).toUpperCase().padEnd(2, "X")
        : "XX";
      const prefix = `${projChar}${clientChars}T`;

      const sorted = [...pTasks].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a._id || "").localeCompare(b._id || "");
      });

      for (let i = 0; i < sorted.length; i++) {
        map.set(sorted[i]._id, `${prefix}${i + 1}`);
      }
    }

    return map;
  }, [tasks, projectsMap]);

  const getTaskDisplayId = useCallback(
    (task) => {
      if (!task || !task._id) return "";
      return taskDisplayIdMap.get(task._id) || "";
    },
    [taskDisplayIdMap],
  );

  // Main Filtered Tasks Logic
  const filteredOverviewTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const isAdminOrManager =
          user?.role === "admin" || user?.role === "operationmanager";
        const creatorId = task.createdBy?._id || task.createdBy;
        const projId = task.project?._id || task.project;
        const projectObj = projId ? projectsMap.get(String(projId)) : null;

        if (!isAdminOrManager) {
          const isCreator = creatorId === currentUserId;
          const assigneeId = task.assignedTo?._id || task.assignedTo;
          const isAssignee = assigneeId === currentUserId;
          const isPublicProject = projectObj?.access === "Public";

          if (!isCreator && !isAssignee && !isPublicProject) {
            return false;
          }
        }

        const clientObj = task.project?.client?.companyName
          ? task.project.client
          : projectObj?.client || task.project?.client;

        if (overviewClientFilter !== "All") {
          const cId =
            clientObj?._id ||
            (typeof clientObj === "string" ? clientObj : null);
          if (cId !== overviewClientFilter) {
            return false;
          }
        }

        if (
          overviewPriorityFilter !== "All" &&
          task.priority !== overviewPriorityFilter
        ) {
          return false;
        }

        if (overviewStatusFilter === "Overdue") {
          const isOverdue =
            task.dueDate &&
            new Date(task.dueDate) < new Date() &&
            task.status !== "Completed";
          if (!isOverdue) return false;
        } else if (overviewStatusFilter === "Due Today") {
          const isDueToday =
            task.dueDate &&
            isSameDate(task.dueDate, new Date()) &&
            task.status !== "Completed";
          if (!isDueToday) return false;
        } else if (overviewStatusFilter === "Active Tasks") {
          const statusUpper = (task.status || "Not Started").toUpperCase();
          const isCompleted = statusUpper === "COMPLETED";
          const isRejected = statusUpper === "REJECTED";
          if (isCompleted || isRejected) return false;
        } else if (overviewStatusFilter === "Needs Attention") {
          const s = (task.status || "").toLowerCase();
          const isAttention =
            s.includes("correction") ||
            s.includes("hold") ||
            s.includes("block") ||
            task.isBlocked;
          if (!isAttention) return false;
        } else if (
          overviewStatusFilter?.toLowerCase() === "in review" ||
          overviewStatusFilter?.toLowerCase() === "in-review" ||
          overviewStatusFilter?.toLowerCase() === "inreview"
        ) {
          const s = (task.status || "").toLowerCase();
          if (s !== "in review" && s !== "in-review" && !s.includes("review")) {
            return false;
          }
        } else if (
          overviewStatusFilter !== "All" &&
          (task.status || "").toLowerCase() !==
            overviewStatusFilter?.toLowerCase()
        ) {
          return false;
        }

        if (
          overviewCreatedByFilter !== "All" &&
          (task.createdBy?._id || task.createdBy) !== overviewCreatedByFilter
        ) {
          return false;
        }

        if (
          overviewAssigneeFilter !== "All" &&
          (task.assignedTo?._id || task.assignedTo) !== overviewAssigneeFilter
        ) {
          return false;
        }

        if (
          overviewContentTypeFilter !== "All" &&
          task.contentType !== overviewContentTypeFilter
        ) {
          return false;
        }

        if (overviewDepartmentFilter && overviewDepartmentFilter !== "All") {
          const targetDeptLower = overviewDepartmentFilter.toLowerCase();
          const assigneeId =
            typeof task.assignedTo === "object"
              ? task.assignedTo?._id
              : task.assignedTo;
          const assignedUserObj =
            typeof task.assignedTo === "object"
              ? task.assignedTo
              : users?.find((u) => (u._id || u.id) === assigneeId);

          const creatorId =
            typeof task.createdBy === "object"
              ? task.createdBy?._id
              : task.createdBy;
          const creatorUserObj =
            typeof task.createdBy === "object"
              ? task.createdBy
              : users?.find((u) => (u._id || u.id) === creatorId);

          const taskDept =
            assignedUserObj?.department || creatorUserObj?.department || "";
          const taskDeptLower = taskDept.toLowerCase();

          let matchesDept = false;
          if (targetDeptLower.includes("graphic")) {
            matchesDept =
              taskDeptLower.includes("graphic") ||
              taskDeptLower.includes("design");
          } else if (
            targetDeptLower.includes("video") ||
            targetDeptLower.includes("videographer")
          ) {
            matchesDept =
              taskDeptLower.includes("video") || taskDeptLower.includes("edit");
          } else if (targetDeptLower.includes("web")) {
            matchesDept =
              taskDeptLower.includes("web") || taskDeptLower.includes("dev");
          } else if (targetDeptLower.includes("seo")) {
            matchesDept = taskDeptLower.includes("seo");
          } else if (targetDeptLower.includes("social")) {
            matchesDept =
              taskDeptLower.includes("social") || taskDeptLower.includes("smm");
          } else if (targetDeptLower.includes("performance")) {
            matchesDept =
              taskDeptLower.includes("performance") ||
              taskDeptLower.includes("marketer");
          } else {
            matchesDept =
              taskDeptLower.includes(targetDeptLower) ||
              targetDeptLower.includes(taskDeptLower);
          }

          if (!matchesDept) return false;
        }

        if (!checkTaskProductivityAndDate(task, dateFilter)) {
          return false;
        }

        if (!projectSearch.trim()) return true;
        const q = projectSearch.toLowerCase();
        const title = task.title || "";
        const contentCopy = task.contentCopy || "";
        const contentType = task.contentType || "";
        const pName = projectObj?.name || "";
        const cName = clientObj?.companyName || "";
        const aName = task.assignedTo?.name || "";
        const crName = task.createdBy?.name || "";

        return (
          title.toLowerCase().includes(q) ||
          contentCopy.toLowerCase().includes(q) ||
          contentType.toLowerCase().includes(q) ||
          pName.toLowerCase().includes(q) ||
          cName.toLowerCase().includes(q) ||
          aName.toLowerCase().includes(q) ||
          crName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        const dateA = new Date(
          a.createdAt || a.startDate || a.dueDate || 0,
        ).getTime();
        const dateB = new Date(
          b.createdAt || b.startDate || b.dueDate || 0,
        ).getTime();
        return dateB - dateA;
      });
  }, [
    tasks,
    currentUserId,
    user?.role,
    projectSearch,
    projectsMap,
    users,
    overviewPriorityFilter,
    overviewStatusFilter,
    overviewDepartmentFilter,
    dateFilter,
    overviewClientFilter,
    overviewCreatedByFilter,
    overviewAssigneeFilter,
    overviewContentTypeFilter,
  ]);

  // Notify parent of filtered count
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredOverviewTasks.length);
    }
  }, [filteredOverviewTasks.length, onFilteredCountChange]);

  const totalPages = Math.ceil(filteredOverviewTasks.length / itemsPerPage);

  // Executive KPI summary calculations
  const kpiStats = useMemo(() => {
    let inProgress = 0;
    let inReview = 0;
    let needsAttention = 0;
    let completed = 0;

    tasks.forEach((t) => {
      const s = (t.status || "").toLowerCase();
      if (s.includes("progress")) inProgress++;
      else if (s.includes("review")) inReview++;
      else if (
        s.includes("correction") ||
        s.includes("hold") ||
        s.includes("block") ||
        t.isBlocked
      )
        needsAttention++;
      else if (s.includes("completed") || s.includes("done")) completed++;
    });

    const completionRate =
      tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return {
      total: tasks.length,
      inProgress,
      inReview,
      needsAttention,
      completed,
      completionRate,
    };
  }, [tasks]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (!filteredOverviewTasks || filteredOverviewTasks.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Task ID",
      "Task Name",
      "Project Name",
      "Client Name",
      "Content Copy",
      "Content Type",
      "Created By",
      "Assignee",
      "Start Date",
      "End Date",
      "Priority",
      "Status",
      "Hold / Block Reason",
      "Tracked Duration",
    ];

    const rows = filteredOverviewTasks.map((task) => {
      const projId = task.project?._id || task.project;
      const projectObj = projectsMap.get(String(projId));
      const projectName = projectObj?.name || task.project?.name || "No Project";
      const clientRaw = task.project?.client?.companyName
        ? task.project.client
        : projectObj?.client || task.project?.client;
      const clientName = clientRaw?.companyName || "No Client";

      const createdBy = task.createdBy?.name || "Unknown";
      const assignee = task.assignedTo?.name || "Unassigned";
      const startDate = task.startDate ? formatDate(task.startDate) : "—";
      const endDate = task.dueDate ? formatDate(task.dueDate) : "—";
      const displayId = getTaskDisplayId(task);
      const totalMs = getTotalTrackedMs(task, Date.now());
      const trackedStr = formatShortDuration(totalMs);

      return [
        displayId,
        task.title || "",
        projectName,
        clientName,
        task.contentCopy || "",
        task.contentType || "",
        createdBy,
        assignee,
        startDate,
        endDate,
        task.priority || "Medium",
        task.status || "Not Started",
        task.holdReason || task.blockedReason || "—",
        trackedStr,
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((e) =>
          e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const todayStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Status_Overview_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Status Overview data exported to Excel!");
  };

  // Copy text helper
  const handleCopyText = (text, label = "Text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setProjectSearch("");
    setOverviewClientFilter("All");
    setOverviewCreatedByFilter("All");
    setOverviewAssigneeFilter("All");
    setOverviewDepartmentFilter("All");
    setOverviewContentTypeFilter("All");
    setOverviewStatusFilter("All");
    setOverviewPriorityFilter("All");
    setDateFilter("All");
  };

  const hasActiveFilters =
    projectSearch ||
    overviewClientFilter !== "All" ||
    overviewCreatedByFilter !== "All" ||
    overviewAssigneeFilter !== "All" ||
    overviewDepartmentFilter !== "All" ||
    overviewContentTypeFilter !== "All" ||
    overviewStatusFilter !== "All" ||
    overviewPriorityFilter !== "All" ||
    dateFilter !== "All";

  return (
    <div className="space-y-4">
      {/* 1. EXECUTIVE LIVE STATUS KPI METRICS BAR */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* KPI: Total Overview */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => setOverviewStatusFilter("All")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
            overviewStatusFilter === "All"
              ? "bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-[#ffffff] border-indigo-400 shadow-lg shadow-indigo-600/35 ring-2 ring-indigo-300 dark:ring-indigo-400"
              : "bg-white dark:bg-[#121626] border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${
                overviewStatusFilter === "All"
                  ? "text-indigo-100"
                  : "text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              Total Monitored
            </span>
            <div className="flex items-center gap-1.5">
              {overviewStatusFilter === "All" && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-[#ffffff] border border-white/25 tracking-wider">
                  Active
                </span>
              )}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  overviewStatusFilter === "All"
                    ? "bg-white/20 text-[#ffffff] border border-white/20"
                    : "bg-slate-100 dark:bg-[#1e2433] text-slate-700 dark:text-[#cbd5e1] border border-slate-200/60 dark:border-[#334155]"
                }`}
              >
                <FiLayers size={14} />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                overviewStatusFilter === "All"
                  ? "text-[#ffffff]"
                  : "text-slate-900 dark:text-[#f8fafc]"
              }`}
            >
              {kpiStats.total}
            </span>
            <span
              className={`text-[10px] font-bold ${
                overviewStatusFilter === "All"
                  ? "text-indigo-100"
                  : "text-slate-500 dark:text-[#94a3b8]"
              }`}
            >
              All Tasks
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
              overviewStatusFilter === "All"
                ? "text-indigo-200"
                : "text-slate-500 dark:text-[#94a3b8]"
            }`}
          >
            <span>Read-only tracking</span>
          </div>
        </motion.div>

        {/* KPI: In Progress */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() =>
            setOverviewStatusFilter(
              overviewStatusFilter === "In Progress" ? "All" : "In Progress",
            )
          }
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
            overviewStatusFilter === "In Progress"
              ? "bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-[#ffffff] border-cyan-400 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-300 dark:ring-cyan-400"
              : "bg-white dark:bg-[#0c1a2e] border-sky-200/90 dark:border-cyan-900/60 hover:border-sky-300 dark:hover:border-cyan-700/60 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${
                overviewStatusFilter === "In Progress"
                  ? "text-cyan-100"
                  : "text-sky-900 dark:text-[#38bdf8]"
              }`}
            >
              In Progress
            </span>
            <div className="flex items-center gap-1.5">
              {overviewStatusFilter === "In Progress" && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-[#ffffff] border border-white/25 tracking-wider">
                  Active
                </span>
              )}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  overviewStatusFilter === "In Progress"
                    ? "bg-white/20 text-[#ffffff] border border-white/20"
                    : "bg-sky-100/90 dark:bg-sky-950/80 text-sky-600 dark:text-[#38bdf8] border border-sky-200/70 dark:border-sky-800/60"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      overviewStatusFilter === "In Progress"
                        ? "bg-white"
                        : "bg-sky-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      overviewStatusFilter === "In Progress"
                        ? "bg-white"
                        : "bg-sky-600 dark:bg-[#38bdf8]"
                    }`}
                  ></span>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                overviewStatusFilter === "In Progress"
                  ? "text-[#ffffff]"
                  : "text-sky-600 dark:text-[#38bdf8]"
              }`}
            >
              {kpiStats.inProgress}
            </span>
            <span
              className={`text-[10px] font-bold ${
                overviewStatusFilter === "In Progress"
                  ? "text-cyan-100"
                  : "text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              Active Now
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
              overviewStatusFilter === "In Progress"
                ? "text-cyan-100"
                : "text-sky-600 dark:text-[#38bdf8]"
            }`}
          >
            <span>Live production</span>
          </div>
        </motion.div>

        {/* KPI: In Review */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() =>
            setOverviewStatusFilter(
              overviewStatusFilter === "In Review" ? "All" : "In Review",
            )
          }
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
            overviewStatusFilter === "In Review"
              ? "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-[#ffffff] border-amber-400 shadow-lg shadow-amber-500/35 ring-2 ring-amber-300 dark:ring-amber-400"
              : "bg-white dark:bg-[#211a0f] border-amber-200/90 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700/60 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${
                overviewStatusFilter === "In Review"
                  ? "text-amber-100"
                  : "text-amber-900 dark:text-[#fbbf24]"
              }`}
            >
              In Review
            </span>
            <div className="flex items-center gap-1.5">
              {overviewStatusFilter === "In Review" && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-[#ffffff] border border-white/25 tracking-wider">
                  Active
                </span>
              )}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  overviewStatusFilter === "In Review"
                    ? "bg-white/20 text-[#ffffff] border border-white/20"
                    : "bg-amber-100/90 dark:bg-amber-950/80 text-amber-600 dark:text-[#fbbf24] border border-amber-200/70 dark:border-amber-800/60"
                }`}
              >
                <FiEye size={14} />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                overviewStatusFilter === "In Review"
                  ? "text-[#ffffff]"
                  : "text-amber-600 dark:text-[#fbbf24]"
              }`}
            >
              {kpiStats.inReview}
            </span>
            <span
              className={`text-[10px] font-bold ${
                overviewStatusFilter === "In Review"
                  ? "text-amber-100"
                  : "text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              Waiting Sign-off
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
              overviewStatusFilter === "In Review"
                ? "text-amber-100"
                : "text-amber-600 dark:text-[#fbbf24]"
            }`}
          >
            <span>Manager verification</span>
          </div>
        </motion.div>

        {/* KPI: Needs Attention */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() =>
            setOverviewStatusFilter(
              overviewStatusFilter === "Needs Attention" ? "All" : "Needs Attention",
            )
          }
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
            overviewStatusFilter === "Needs Attention"
              ? "bg-gradient-to-br from-rose-600 via-rose-600 to-red-600 text-[#ffffff] border-rose-400 shadow-lg shadow-rose-500/35 ring-2 ring-rose-300 dark:ring-rose-400"
              : "bg-white dark:bg-[#241118] border-rose-200/90 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700/60 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${
                overviewStatusFilter === "Needs Attention"
                  ? "text-rose-100"
                  : "text-rose-900 dark:text-[#fb7185]"
              }`}
            >
              Needs Attention
            </span>
            <div className="flex items-center gap-1.5">
              {overviewStatusFilter === "Needs Attention" && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-[#ffffff] border border-white/25 tracking-wider">
                  Active
                </span>
              )}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  overviewStatusFilter === "Needs Attention"
                    ? "bg-white/20 text-[#ffffff] border border-white/20"
                    : "bg-rose-100/90 dark:bg-rose-950/80 text-rose-600 dark:text-[#fb7185] border border-rose-200/70 dark:border-rose-800/60"
                }`}
              >
                <FiAlertTriangle size={14} />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                overviewStatusFilter === "Needs Attention"
                  ? "text-[#ffffff]"
                  : "text-rose-600 dark:text-[#fb7185]"
              }`}
            >
              {kpiStats.needsAttention}
            </span>
            <span
              className={`text-[10px] font-bold ${
                overviewStatusFilter === "Needs Attention"
                  ? "text-rose-100"
                  : "text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              Hold / Block
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
              overviewStatusFilter === "Needs Attention"
                ? "text-rose-100"
                : "text-rose-600 dark:text-[#fb7185]"
            }`}
          >
            <span>Corrections & Blocker</span>
          </div>
        </motion.div>

        {/* KPI: Completed */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() =>
            setOverviewStatusFilter(
              overviewStatusFilter === "Completed" ? "All" : "Completed",
            )
          }
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md col-span-2 sm:col-span-1 ${
            overviewStatusFilter === "Completed"
              ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-[#ffffff] border-emerald-400 shadow-lg shadow-emerald-500/35 ring-2 ring-emerald-300 dark:ring-emerald-400"
              : "bg-white dark:bg-[#0c1e18] border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${
                overviewStatusFilter === "Completed"
                  ? "text-emerald-100"
                  : "text-emerald-900 dark:text-[#34d399]"
              }`}
            >
              Completed
            </span>
            <div className="flex items-center gap-1.5">
              {overviewStatusFilter === "Completed" && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-[#ffffff] border border-white/25 tracking-wider">
                  Active
                </span>
              )}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  overviewStatusFilter === "Completed"
                    ? "bg-white/20 text-[#ffffff] border border-white/20"
                    : "bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-600 dark:text-[#34d399] border border-emerald-200/70 dark:border-emerald-800/60"
                }`}
              >
                <FiCheckCircle size={14} />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                overviewStatusFilter === "Completed"
                  ? "text-[#ffffff]"
                  : "text-emerald-600 dark:text-[#34d399]"
              }`}
            >
              {kpiStats.completed}
            </span>
            <span
              className={`text-[10px] font-bold ${
                overviewStatusFilter === "Completed"
                  ? "text-emerald-100"
                  : "text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              {kpiStats.completionRate}% Done
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
              overviewStatusFilter === "Completed"
                ? "text-emerald-100"
                : "text-emerald-600 dark:text-[#34d399]"
            }`}
          >
            <span>Successfully delivered</span>
          </div>
        </motion.div>
      </div>

      {/* 2. SAAS CONTROL TOOLBAR: SEARCH & SMART FILTERS */}
      <div className="relative z-30 bg-white/95 dark:bg-[#131625]/95 border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 shadow-xs backdrop-blur-xl space-y-2">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px]">
           
            <input
              type="text"
              placeholder="Search tasks by name, client, copy, assignee, creator..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-[12px] font-semibold rounded-xl bg-slate-50/80 dark:bg-[#161826] border border-slate-200 dark:border-white/10 outline-none focus:border-blue-500 dark:focus:border-blue-400 text-slate-800 dark:text-[#f8fafc] placeholder:text-slate-400 dark:placeholder:text-[#64748b] transition-all shadow-inner"
            />
            {projectSearch && (
              <button
                type="button"
                onClick={() => setProjectSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#ffffff] cursor-pointer"
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* SaaS Filter Pills Row */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {/* Client Filter */}
            <div className={`relative ${showClientDropdown ? "z-50" : "z-10"}`} ref={clientDropdownRef}>
              <button
                type="button"
                onClick={() => setShowClientDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  overviewClientFilter !== "All"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-[#93c5fd] dark:border-blue-700/60"
                    : "bg-white dark:bg-[#161826] text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate max-w-[90px]">
                  {overviewClientFilter === "All"
                    ? "Client"
                    : clients?.find((c) => c._id === overviewClientFilter)
                        ?.companyName || "Client"}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showClientDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showClientDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute left-0 top-full mt-1.5 w-64 max-h-[300px] flex flex-col bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-white/10 shrink-0">
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-slate-900 dark:text-[#f8fafc] placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-0.5 custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setOverviewClientFilter("All");
                          setShowClientDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          overviewClientFilter === "All"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-[#93c5fd]"
                            : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                        }`}
                      >
                        All Clients
                      </button>
                      {clients
                        ?.filter((c) =>
                          c.companyName
                            ?.toLowerCase()
                            .includes(clientSearchQuery.toLowerCase()),
                        )
                        .map((client) => (
                          <button
                            key={client._id}
                            type="button"
                            onClick={() => {
                              setOverviewClientFilter(client._id);
                              setShowClientDropdown(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded-xl transition-all flex items-center ${
                              overviewClientFilter === client._id
                                ? "bg-blue-50 dark:bg-blue-900/40"
                                : "hover:bg-slate-50 dark:hover:bg-white/5"
                            }`}
                          >
                            <ClientBadge
                              client={client}
                              size="sm"
                              className="w-full justify-start !text-[10px]"
                            />
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Department Filter */}
            <div className={`relative ${showDepartmentDropdown ? "z-50" : "z-10"}`} ref={departmentDropdownRef}>
              <button
                type="button"
                onClick={() => setShowDepartmentDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  overviewDepartmentFilter !== "All"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-[#86efac] dark:border-emerald-700/60"
                    : "bg-white dark:bg-[#161826] text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate max-w-[85px]">
                  {overviewDepartmentFilter === "All"
                    ? "Department"
                    : overviewDepartmentFilter}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showDepartmentDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showDepartmentDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute left-0 top-full mt-1.5 w-56 max-h-[300px] flex flex-col bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-white/10 shrink-0">
                      <input
                        type="text"
                        placeholder="Search department..."
                        value={departmentSearchQuery}
                        onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-slate-900 dark:text-[#f8fafc] placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-0.5 custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setOverviewDepartmentFilter("All");
                          setShowDepartmentDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          overviewDepartmentFilter === "All"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-[#86efac]"
                            : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                        }`}
                      >
                        All Departments
                      </button>
                      {uniqueDepartments
                        ?.filter((dept) =>
                          dept
                            .toLowerCase()
                            .includes(departmentSearchQuery.toLowerCase()),
                        )
                        .map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setOverviewDepartmentFilter(dept);
                              setShowDepartmentDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition-all font-bold ${
                              overviewDepartmentFilter === dept
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-[#86efac]"
                                : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assignee Filter */}
            <div className={`relative ${showAssigneeDropdown ? "z-50" : "z-10"}`} ref={assigneeDropdownRef}>
              <button
                type="button"
                onClick={() => setShowAssigneeDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  overviewAssigneeFilter !== "All"
                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-[#d8b4fe] dark:border-purple-700/60"
                    : "bg-white dark:bg-[#161826] text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate max-w-[85px]">
                  {overviewAssigneeFilter === "All"
                    ? "Assignee"
                    : uniqueAssignees.find(
                        (u) => (u._id || u.id) === overviewAssigneeFilter,
                      )?.name || "Assignee"}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showAssigneeDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showAssigneeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute left-0 lg:left-auto lg:right-0 top-full mt-1.5 w-60 max-h-[300px] flex flex-col bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-white/10 shrink-0">
                      <input
                        type="text"
                        placeholder="Search assignee..."
                        value={assigneeSearchQuery}
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-slate-900 dark:text-[#f8fafc] placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-0.5 custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setOverviewAssigneeFilter("All");
                          setShowAssigneeDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          overviewAssigneeFilter === "All"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-[#d8b4fe]"
                            : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                        }`}
                      >
                        All Assignees
                      </button>
                      {uniqueAssignees
                        ?.filter((u) =>
                          u.name
                            ?.toLowerCase()
                            .includes(assigneeSearchQuery.toLowerCase()),
                        )
                        .map((u) => {
                          const uid = u._id || u.id;
                          return (
                            <button
                              key={uid}
                              type="button"
                              onClick={() => {
                                setOverviewAssigneeFilter(uid);
                                setShowAssigneeDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                                overviewAssigneeFilter === uid
                                  ? "bg-purple-50 dark:bg-purple-900/40 font-bold"
                                  : "hover:bg-slate-50 dark:hover:bg-white/5"
                              }`}
                            >
                              {renderUserAvatarSmall(u)}
                              <span className="truncate text-[11px] text-slate-900 dark:text-[#f8fafc] font-bold">
                                {u.name}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Filter Dropdown */}
            <div className={`relative ${showStatusDropdown ? "z-50" : "z-10"}`} ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  overviewStatusFilter !== "All"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-[#a5b4fc] dark:border-indigo-700/60"
                    : "bg-white dark:bg-[#161826] text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate max-w-[85px]">
                  {overviewStatusFilter === "All"
                    ? "Status"
                    : overviewStatusFilter}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showStatusDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-1 z-[70] flex flex-col gap-0.5"
                  >
                    {[
                      "All",
                      "Active Tasks",
                      "In Progress",
                      "In Review",
                      "Needs Attention",
                      "Correction",
                      "On Hold",
                      "Completed",
                      "Rejected",
                      "Overdue",
                      "Due Today",
                    ].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setOverviewStatusFilter(st);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left cursor-pointer ${
                          overviewStatusFilter === st
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-[#a5b4fc]"
                            : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                        }`}
                      >
                        <span>{st === "All" ? "All Statuses" : st}</span>
                        {overviewStatusFilter === st && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Priority Filter */}
            <div className={`relative ${showPriorityDropdown ? "z-50" : "z-10"}`} ref={priorityDropdownRef}>
              <button
                type="button"
                onClick={() => setShowPriorityDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  overviewPriorityFilter !== "All"
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-[#fde047] dark:border-amber-700/60"
                    : "bg-white dark:bg-[#161826] text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate max-w-[70px]">
                  {overviewPriorityFilter === "All"
                    ? "Priority"
                    : overviewPriorityFilter}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showPriorityDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showPriorityDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-1 z-[70] flex flex-col gap-0.5"
                  >
                    {["All", "Top High", "High", "Medium", "Low"].map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => {
                          setOverviewPriorityFilter(pr);
                          setShowPriorityDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left cursor-pointer ${
                          overviewPriorityFilter === pr
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-[#fde047]"
                            : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                        }`}
                      >
                        <span>{pr === "All" ? "All Priorities" : pr}</span>
                        {overviewPriorityFilter === pr && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date Quick Filter */}
            <div className={`relative ${showDateDropdown ? "z-50" : "z-10"}`} ref={dateDropdownRef}>
              <button
                type="button"
                onClick={() => setShowDateDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  dateFilter !== "All"
                    ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-[#5eead4] dark:border-teal-700/60"
                    : "bg-white dark:bg-[#161826] text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <FiCalendar size={12} className="opacity-70" />
                <span>{dateFilter === "All" ? "Date" : dateFilter}</span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showDateDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showDateDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-1 z-[70] flex flex-col gap-0.5"
                  >
                    {[
                      { label: "All Dates", value: "All" },
                      { label: "Today", value: "Today" },
                      { label: "Yesterday", value: "Yesterday" },
                      { label: "This Week", value: "This Week" },
                      { label: "This Month", value: "This Month" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDateFilter(opt.value);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left cursor-pointer ${
                          dateFilter === opt.value
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-[#5eead4]"
                            : "text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:text-[#ffffff]"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {dateFilter === opt.value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Active Filter Tags Row & Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-[#94a3b8] mr-1">
              Active:
            </span>

            {projectSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-[#f8fafc]">
                "{projectSearch}"
                <button
                  onClick={() => setProjectSearch("")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </span>
            )}

            {overviewStatusFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-[#a5b4fc] border border-indigo-200 dark:border-indigo-700/50">
                Status: {overviewStatusFilter}
                <button
                  onClick={() => setOverviewStatusFilter("All")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </span>
            )}

            {overviewClientFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#93c5fd] border border-blue-200 dark:border-blue-700/50">
                Client:{" "}
                {clients?.find((c) => c._id === overviewClientFilter)
                  ?.companyName || "Client"}
                <button
                  onClick={() => setOverviewClientFilter("All")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </span>
            )}

            {overviewDepartmentFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#86efac] border border-emerald-200 dark:border-emerald-700/50">
                Dept: {overviewDepartmentFilter}
                <button
                  onClick={() => setOverviewDepartmentFilter("All")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </span>
            )}

            {overviewAssigneeFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-700/50">
                Assignee:{" "}
                {uniqueAssignees.find(
                  (u) => (u._id || u.id) === overviewAssigneeFilter,
                )?.name || "Assignee"}
                <button
                  onClick={() => setOverviewAssigneeFilter("All")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </span>
            )}

            {dateFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-[#5eead4] border border-teal-200 dark:border-teal-700/50">
                Date: {dateFilter}
                <button
                  onClick={() => setDateFilter("All")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetAllFilters}
              className="ml-auto text-[11px] font-extrabold text-blue-600 dark:text-[#38bdf8] hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* PORTAL ACTIONS: EXPORT & COLUMNS */}
      {portalReady && document.getElementById("task-actions-portal")
        ? createPortal(
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300 text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                title="Export status data to Excel"
              >
                <FiDownload size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <div className={`relative ${isColsOpen ? "z-50" : "z-10"}`} ref={colsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsColsOpen(!isColsOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-[11px] font-bold cursor-pointer transition-all shadow-2xs hover:bg-slate-50 dark:bg-[#161826] dark:border-white/10 dark:text-[#f8fafc] dark:hover:bg-white/5"
                >
                  <FiColumns size={13} className="text-blue-500" />
                  <span>Columns</span>
                  {Object.values(hiddenColumns).filter(Boolean).length > 0 && (
                    <span className="text-[9px] font-black bg-blue-500 text-[#ffffff] rounded-full w-4 h-4 flex items-center justify-center">
                      {Object.values(hiddenColumns).filter(Boolean).length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isColsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#161826] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-[70] space-y-1 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1.5 px-1">
                        <span className="text-[11px] font-black text-slate-800 dark:text-[#f8fafc] uppercase tracking-wider">
                          Toggle Columns
                        </span>
                        {Object.values(hiddenColumns).some(Boolean) && (
                          <button
                            type="button"
                            onClick={() =>
                              setHiddenColumns({
                                taskName: false,
                                projectName: false,
                                clientName: false,
                                contentCopy: false,
                                contentType: false,
                                createdBy: false,
                                assignee: false,
                                startDate: false,
                                dueDate: false,
                                priority: false,
                                status: false,
                                holdReason: false,
                                totalHours: false,
                                timeTracker: false,
                                approvalInfo: false,
                                action: false,
                              })
                            }
                            className="text-[10px] font-extrabold text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                        {[
                          { key: "taskName", label: "Task Name" },
                          { key: "clientName", label: "Client Name" },
                          { key: "contentType", label: "Content Type" },
                          { key: "createdBy", label: "Created By" },
                          { key: "assignee", label: "Assignee" },
                          { key: "startDate", label: "Start Date" },
                          { key: "dueDate", label: "End Date" },
                          { key: "priority", label: "Priority" },
                          { key: "status", label: "Status" },
                          { key: "holdReason", label: "Hold / Block Reason" },
                          { key: "totalHours", label: "Tracked Duration" },
                          { key: "timeTracker", label: "Time Tracker Box" },
                          { key: "approvalInfo", label: "Approve Info" },
                          { key: "action", label: "Action" },
                        ].map((col) => (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-[#cbd5e1] select-none"
                          >
                            <input
                              type="checkbox"
                              checked={!hiddenColumns[col.key]}
                              onChange={() =>
                                setHiddenColumns((prev) => ({
                                  ...prev,
                                  [col.key]: !prev[col.key],
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-white/10 dark:bg-black/20"
                            />
                            <span>{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>,
            document.getElementById("task-actions-portal"),
          )
        : null}

      {/* 3. PREMIUM SAAS DATA TABLE CONTAINER */}
      <div className="relative z-10 rounded-2xl bg-white dark:bg-[#11131e] border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative min-h-[420px]">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-[#161826]/95 backdrop-blur-md shadow-2xs">
              <tr className="border-b border-slate-200 dark:border-white/10 text-[10.5px] font-black text-slate-700 dark:text-[#f8fafc] uppercase tracking-wider">
                {!hiddenColumns.taskName && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-white/10 text-left whitespace-nowrap">
                    Task Details
                  </th>
                )}
               
                {!hiddenColumns.clientName && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-white/10 text-left whitespace-nowrap">
                    Client
                  </th>
                )}
               
                {!hiddenColumns.contentType && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Type
                  </th>
                )}
                {!hiddenColumns.createdBy && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-white/10 text-left whitespace-nowrap">
                    Created By
                  </th>
                )}
                {!hiddenColumns.startDate && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Start Date
                  </th>
                )}
                {!hiddenColumns.dueDate && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    End Date
                  </th>
                )}
                {!hiddenColumns.assignee && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-white/10 text-left whitespace-nowrap">
                    Assignee
                  </th>
                )}
                {!hiddenColumns.priority && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Priority
                  </th>
                )}
                {!hiddenColumns.status && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Status
                  </th>
                )}
                {!hiddenColumns.holdReason && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Hold / Block Note
                  </th>
                )}
                {!hiddenColumns.totalHours && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Live Duration
                  </th>
                )}
                {!hiddenColumns.timeTracker && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Total Tracked
                  </th>
                )}
                {!hiddenColumns.approvalInfo && (
                  <th className="py-2.5 px-2.5 border-r border-slate-200 dark:border-white/10 text-center whitespace-nowrap">
                    Approve Info
                  </th>
                )}
                {!hiddenColumns.action && (
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[12px] font-semibold">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      Object.values(hiddenColumns).filter((isHidden) => !isHidden).length
                    }
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-slate-500 dark:text-[#94a3b8]">
                        Loading Status Overview...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredOverviewTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      Object.values(hiddenColumns).filter((isHidden) => !isHidden).length
                    }
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center">
                        <FiSearch size={22} />
                      </div>
                      <h3 className="text-sm font-black text-slate-700 dark:text-[#f8fafc] mt-1">
                        No tasks match your criteria
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-[#94a3b8] leading-relaxed">
                        Try adjusting your search keywords, status filters, or date range options.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-[#93c5fd] font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOverviewTasks
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
                  .map((task, idx) => {
                    const projId = task.project?._id || task.project;
                    const projectObj = projId
                      ? projectsMap.get(String(projId))
                      : null;
                    const clientRaw = task.project?.client?.companyName
                      ? task.project.client
                      : projectObj?.client || task.project?.client;
                    const clientId = clientRaw?._id || clientRaw;
                    const clientObj =
                      (clients || []).find((c) => c._id === clientId) ||
                      (typeof clientRaw === "object" ? clientRaw : null);
                    const clientName = clientObj?.companyName || "No Client";
                    const clientBranding = getClientBranding(clientObj);
                    const displayId = getTaskDisplayId(task);

                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== "Completed";
                    const isDueToday =
                      task.dueDate &&
                      isSameDate(task.dueDate, new Date()) &&
                      task.status !== "Completed";

                    return (
                      <tr
                        key={task._id || `task-ov-${idx}`}
                        onClick={() => setSelectedTaskId(task._id)}
                        className="group transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-blue-50/40 dark:hover:bg-blue-950/25 cursor-pointer text-slate-800 dark:text-[#f8fafc]"
                      >
                        {/* Task Details */}
                        {!hiddenColumns.taskName && (
                          <td className="py-2.5 px-3 border-r border-slate-100 dark:border-white/5 text-left whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <BiFile
                                className="text-slate-400 dark:text-[#94a3b8] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0"
                                size={15}
                              />
                              <span
                                className="text-[12px] font-bold text-slate-900 dark:text-[#f8fafc] max-w-[280px] truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                title={task.title || "Untitled Task"}
                              >
                                {task.title || "Untitled Task"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(task.title, "Task title");
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 dark:text-[#94a3b8] dark:hover:text-blue-300"
                                title="Copy task name"
                              >
                                <FiCopy size={11} />
                              </button>
                            </div>
                          </td>
                        )}

                        {/* Client */}
                        {!hiddenColumns.clientName && (
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-white/5 text-left whitespace-nowrap">
                            {clientObj && clientObj.companyName ? (
                              <ClientBadge
                                client={clientObj}
                                size="sm"
                                className="!text-[11px] !px-2 !py-0.5"
                              />
                            ) : (
                              <span className="text-slate-600 dark:text-[#cbd5e1] text-[11px] font-bold">
                                {clientName}
                              </span>
                            )}
                          </td>
                        )}

                        {/* Content Type */}
                        {!hiddenColumns.contentType && (
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-white/10 text-center whitespace-nowrap">
                            <ContentTypeBadge type={task.contentType} />
                          </td>
                        )}

                        {/* Created By */}
                        {!hiddenColumns.createdBy && (
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-white/5 text-left whitespace-nowrap">
                            {task.createdBy ? (
                              <div className="flex items-center gap-2">
                                {renderUserAvatarSmall(task.createdBy)}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-[#f8fafc] truncate max-w-[120px]">
                                    {task.createdBy.name || "Unknown"}
                                  </span>
                                  {task.createdBy.department && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border w-fit ${getDeptBadgeStyle(
                                        task.createdBy.department,
                                      )}`}
                                    >
                                      {task.createdBy.department}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {renderUserAvatarSmall(task.createdBy)}
                                <span className="text-[11px] font-bold text-slate-800 dark:text-[#f8fafc] truncate max-w-[110px]">
                                  Unknown
                                </span>
                              </div>
                            )}
                          </td>
                        )}

                        {/* Start Date */}
                        {!hiddenColumns.startDate && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            {task.startDate ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10.5px] font-bold text-slate-800 dark:text-[#f8fafc] bg-slate-50/70 dark:bg-white/5">
                                <FiCalendar size={10} className="text-slate-400 dark:text-[#94a3b8]" />
                                <span>{formatDate(task.startDate)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-[#64748b] text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* End Date / Due Date */}
                        {!hiddenColumns.dueDate && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            {task.dueDate ? (
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-bold ${
                                  isOverdue
                                    ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
                                    : isDueToday
                                      ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800"
                                      : "bg-slate-50/70 dark:bg-white/5 text-slate-800 dark:text-[#f8fafc] border-slate-200 dark:border-white/10"
                                }`}
                              >
                                <FiClock
                                  size={10}
                                  className={
                                    isOverdue
                                      ? "text-rose-500 animate-pulse"
                                      : "text-slate-400 dark:text-[#94a3b8]"
                                  }
                                />
                                <span>{formatDate(task.dueDate)}</span>
                                {isOverdue && (
                                  <span className="ml-0.5 text-[8.5px] font-black uppercase text-rose-600 dark:text-rose-300">
                                    !
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-[#64748b] text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* Assignee */}
                        {!hiddenColumns.assignee && (
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-white/5 text-left whitespace-nowrap">
                            {task.assignedTo ? (
                              <div className="flex items-center gap-2">
                                {renderUserAvatarSmall(task.assignedTo)}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-[#f8fafc] truncate max-w-[120px]">
                                    {task.assignedTo.name}
                                  </span>
                                  {task.assignedTo.department && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border w-fit ${getDeptBadgeStyle(
                                        task.assignedTo.department,
                                      )}`}
                                    >
                                      {task.assignedTo.department}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 dark:text-[#94a3b8] text-[11px] font-semibold italic">
                                Unassigned
                              </span>
                            )}
                          </td>
                        )}

                        {/* Priority */}
                        {!hiddenColumns.priority && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            <PriorityBadge priority={task.priority} />
                          </td>
                        )}

                        {/* Status */}
                        {!hiddenColumns.status && (
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            <StatusBadge
                              status={task.status}
                              isBlocked={task.isBlocked}
                            />
                          </td>
                        )}

                        {/* Hold / Block Reason */}
                        {!hiddenColumns.holdReason && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            {task.isBlocked && task.blockedReason ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800 max-w-[130px] truncate"
                                title={task.blockedReason}
                              >
                                {task.blockedReason}
                              </span>
                            ) : task.status === "On Hold" && task.holdReason ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800 max-w-[130px] truncate"
                                title={task.holdReason}
                              >
                                {task.holdReason}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-[#64748b] text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* Total in progress */}
                        {!hiddenColumns.totalHours && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            <SimpleTimeTracker
                              status={task.status}
                              startTime={task.actualStartTime}
                              endTime={task.actualEndTime}
                              pausedAt={task.pausedAt}
                              savedPausedMs={task.totalPausedMs}
                              totalTrackedTime={task.totalTrackedTime}
                            />
                          </td>
                        )}

                        {/* Time Tracker Box */}
                        {!hiddenColumns.timeTracker && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            <TimeTrackerBox
                              status={task.status}
                              startTime={task.actualStartTime}
                              endTime={task.actualEndTime}
                              pausedAt={task.pausedAt}
                              savedPausedMs={task.totalPausedMs}
                              totalTrackedTime={task.totalTrackedTime}
                            />
                          </td>
                        )}

                        {/* Approval Info */}
                        {!hiddenColumns.approvalInfo && (
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-white/5 text-center whitespace-nowrap">
                            <ApprovalTimeDisplay
                              reviewStartedAt={task.reviewStartedAt}
                              completedAt={task.completedAt}
                              approvalWaitingMs={task.approvalWaitingMs}
                              status={task.status}
                              lastReviewStartedAt={task.lastReviewStartedAt}
                              reviewCycles={task.reviewCycles}
                            />
                          </td>
                        )}

                        {/* Action Column */}
                        {!hiddenColumns.action && (
                          <td
                            className="py-2 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(task._id)}
                                className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-extrabold text-slate-700 dark:text-[#f8fafc] hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-[#93c5fd] hover:border-blue-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <FiEye size={12} />
                                <span>Inspect</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const userRole =
                                    user?.role === "admin"
                                      ? "admin"
                                      : user?.role === "operationmanager"
                                        ? "operationmanager"
                                        : "team";
                                  navigate(
                                    `/${userRole}/projects?id=${projId}&taskId=${task._id}`,
                                  );
                                }}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-[#94a3b8] dark:hover:text-[#93c5fd] dark:hover:bg-blue-900/40 transition-all cursor-pointer shadow-2xs"
                                title="Open in Project Workspace"
                              >
                                <FiArrowUpRight size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. SAAS PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-[#161826]/70 shrink-0 gap-3">
            <div className="text-[12px] font-bold text-slate-600 dark:text-[#94a3b8]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredOverviewTasks.length,
              )}{" "}
              of {filteredOverviewTasks.length} tasks
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[12px] font-extrabold text-slate-800 dark:text-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/5 transition-all shadow-2xs cursor-pointer"
              >
                Previous
              </button>

              {(() => {
                const pages = [];
                const maxVisible = 5;
                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("...");
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (currentPage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-[12px] text-slate-400 dark:text-[#64748b] font-bold select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-[12px] rounded-xl border transition-all cursor-pointer font-black ${
                        currentPage === page
                          ? "bg-blue-600 text-[#ffffff] border-blue-600 shadow-sm"
                          : "border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-[#cbd5e1]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[12px] font-extrabold text-slate-800 dark:text-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/5 transition-all shadow-2xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. SLIDE-OVER INSPECTOR DRAWER (100% READ-ONLY) */}
      <AnimatePresence>
        {selectedTask && (
          <div
            key={`drawer-${selectedTask._id}`}
            className="fixed inset-0 z-50 flex justify-end"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#11131f] h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-white/10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/80 dark:bg-[#151725]/80 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                    <FiEye size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#1a202c] text-slate-700 dark:text-[#cbd5e1]">
                        {getTaskDisplayId(selectedTask) || "TASK"}
                      </span>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/40">
                        🔒 Read-Only
                      </span>
                    </div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-[#f8fafc] truncate mt-1">
                      {selectedTask.title || "Status Overview"}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:text-[#ffffff] transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-[12px]">
                {/* Status & Priority Ribbon */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider block mb-1">
                      Status
                    </span>
                    <StatusBadge
                      status={selectedTask.status}
                      isBlocked={selectedTask.isBlocked}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider block mb-1">
                      Priority
                    </span>
                    <PriorityBadge priority={selectedTask.priority} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider block mb-1">
                      Content Type
                    </span>
                    <ContentTypeBadge type={selectedTask.contentType} />
                  </div>
                </div>

                {/* Core Attributes */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#161826] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-3">
                  <h3 className="text-[11px] font-black text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider">
                    Core Attributes
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Project</span>
                      <p className="font-extrabold text-slate-900 dark:text-[#f8fafc] truncate">
                        {projectsMap.get(String(selectedTask.project?._id || selectedTask.project))?.name || "Internal Project"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Client</span>
                      <div>
                        {(() => {
                          const projId = selectedTask.project?._id || selectedTask.project;
                          const projectObj = projectsMap.get(String(projId));
                          const clientRaw = selectedTask.project?.client?.companyName
                            ? selectedTask.project.client
                            : projectObj?.client || selectedTask.project?.client;
                          const clientId = clientRaw?._id || clientRaw;
                          const clientObj =
                            (clients || []).find((c) => c._id === clientId) ||
                            (typeof clientRaw === "object" ? clientRaw : null);

                          if (clientObj?.companyName) {
                            return (
                              <ClientBadge
                                client={clientObj}
                                size="sm"
                                className="!text-[10px]"
                              />
                            );
                          }
                          return (
                            <span className="font-bold text-slate-800 dark:text-[#cbd5e1]">
                              {clientObj?.companyName || "No Client"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Assigned Member</span>
                      <div className="flex items-center gap-2 mt-1">
                        {renderUserAvatarSmall(selectedTask.assignedTo)}
                        <span className="font-bold text-slate-900 dark:text-[#f8fafc]">
                          {selectedTask.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Created By</span>
                      <div className="flex items-center gap-2 mt-1">
                        {renderUserAvatarSmall(selectedTask.createdBy)}
                        <span className="font-bold text-slate-900 dark:text-[#f8fafc]">
                          {selectedTask.createdBy?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Schedule */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#161826] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-3">
                  <h3 className="text-[11px] font-black text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider">
                    Schedule & Durations
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Start Date</span>
                      <p className="font-extrabold text-slate-900 dark:text-[#f8fafc]">
                        {selectedTask.startDate ? formatDate(selectedTask.startDate) : "Not specified"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">End Date / Due Date</span>
                      <p className="font-extrabold text-slate-900 dark:text-[#f8fafc]">
                        {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : "Not specified"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Total Tracked Time</span>
                      <p className="font-extrabold text-blue-600 dark:text-[#38bdf8]">
                        {formatShortDuration(getTotalTrackedMs(selectedTask, Date.now()))}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">Approval Waiting Time</span>
                      <p className="font-extrabold text-amber-600 dark:text-[#fbbf24]">
                        {selectedTask.approvalWaitingMs
                          ? formatBusinessDuration(selectedTask.approvalWaitingMs)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Copy Details */}
                {selectedTask.contentCopy && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#161826] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider">
                        Content Copy
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyText(selectedTask.contentCopy, "Content Copy")}
                        className="text-xs text-blue-600 dark:text-[#38bdf8] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FiCopy size={11} />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-800 dark:text-[#f8fafc] text-xs font-medium whitespace-pre-wrap leading-relaxed">
                      {selectedTask.contentCopy}
                    </div>
                  </div>
                )}

                {/* Hold / Blocker Notes */}
                {(selectedTask.holdReason || selectedTask.blockedReason) && (
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 space-y-2">
                    <h3 className="text-[11px] font-black text-rose-600 dark:text-[#fb7185] uppercase tracking-wider">
                      {selectedTask.isBlocked ? "Blocker Details" : "Hold Details"}
                    </h3>
                    <p className="text-xs font-bold text-slate-900 dark:text-[#f8fafc]">
                      Reason: {selectedTask.blockedReason || selectedTask.holdReason}
                    </p>
                    {(selectedTask.blockedComment || selectedTask.holdComment) && (
                      <p className="text-xs text-slate-600 dark:text-[#cbd5e1] italic">
                        "{selectedTask.blockedComment || selectedTask.holdComment}"
                      </p>
                    )}
                  </div>
                )}

                {/* Read-only notification pill */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 flex items-center gap-2 text-slate-600 dark:text-[#cbd5e1] text-[11px]">
                  <FiLock size={14} className="text-amber-500 shrink-0" />
                  <span>
                    Status Overview is in <strong>Read-Only Monitoring Mode</strong>. To modify tasks, navigate to the Project Workspace.
                  </span>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#151725]/60">
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const projId = selectedTask.project?._id || selectedTask.project;
                    const userRole =
                      user?.role === "admin"
                        ? "admin"
                        : user?.role === "operationmanager"
                          ? "operationmanager"
                          : "team";
                    navigate(
                      `/${userRole}/projects?id=${projId}&taskId=${selectedTask._id}`,
                    );
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#ffffff] bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Open in Project</span>
                  <FiExternalLink size={13} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskOverviewTab;
