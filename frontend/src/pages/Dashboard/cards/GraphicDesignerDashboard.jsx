import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
} from "../../../features/api/apiSlice";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { getDesignerEodReports } from "../../../features/eodReports/designerEodReportSlice";
import LiveTaskBoard from "./LiveTaskBoard";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
);

import {
  format,
  isToday,
  isPast,
  parseISO,
  differenceInDays,
  isYesterday,
  isTomorrow,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  subDays,
  isSameMonth,
  formatDistanceToNow,
  isSameDay,
  addDays,
} from "date-fns";
import { calculateBusinessMs } from "../../../utils/businessHours";
import { calculateBusinessMsBetween } from "../../../utils/taskTimerUtils";
import axiosInstance from "../../../services/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiAlertCircle,
  FiActivity,
  FiFilter,
  FiChevronDown,
  FiCheckCircle,
  FiUsers,
  FiLayers,
  FiBriefcase,
  FiTrendingUp,
  FiXCircle,
  FiX,
  FiFileText,
  FiPlay,
  FiEye,
  FiPauseCircle,
  FiSearch,
  FiArrowRight,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
} from "react-icons/fi";

const kolkataFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getKolkataDateStr = (date) => {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return kolkataFormatter.format(d);
  } catch (e) {
    return "";
  }
};

/**
 * Canonical logic to determine a task's assignment date in priority order:
 * 1. task.assignedDate
 * 2. task.assignedAt
 * 3. task.startDate
 * 4. task.createdAt
 */
export const getTaskAssignmentDate = (task) => {
  if (!task) return null;
  return (
    task.assignedDate ||
    task.assignedAt ||
    task.startDate ||
    task.createdAt ||
    null
  );
};

export const isStatusInProgress = (s) =>
  (s || "").trim().toUpperCase().replace(/[-_]/g, " ") === "IN PROGRESS";

export const getDaysRemaining = (dueDateStr, referenceDate = new Date()) => {
  if (!dueDateStr) return null;
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  const refDate = new Date(referenceDate);
  refDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - refDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDeadlineBadgeText = (dueDateStr, status, selectedDate) => {
  if (!dueDateStr) return "";
  const days = getDaysRemaining(dueDateStr, selectedDate);
  const isCompleted =
    status?.toLowerCase() === "completed" ||
    status?.toLowerCase().includes("approve");
  if (isCompleted) return "Completed";

  if (days < 0) {
    const absDays = Math.abs(days);
    return `${absDays} ${absDays === 1 ? "day" : "days"} overdue`;
  } else if (days === 0) {
    return "Due Today";
  } else if (days === 1) {
    return "Due Tomorrow";
  } else {
    return `${days} days to go`;
  }
};

/**
 * Single source of truth to calculate actual worked time for a task
 * belonging to a specific calendar date (selectedDate).
 */
export const calculateTaskProductivityForDate = (
  task,
  selectedDate = new Date(),
  officeHours = { startTime: "09:00", endTime: "19:00" },
  nowMs = Date.now(),
) => {
  if (!task) return 0;

  const selDateObj = selectedDate
    ? typeof selectedDate === "string"
      ? parseISO(selectedDate)
      : new Date(selectedDate)
    : new Date();

  const startTimeStr = officeHours?.startTime ?? "09:00";
  const endTimeStr = officeHours?.endTime ?? "19:00";

  const [startH, startM] = startTimeStr.split(":").map(Number);
  const [endH, endM] = endTimeStr.split(":").map(Number);

  // Office-hours boundaries for selectedDate (local time) — used by both paths
  const dayWorkStart = new Date(
    selDateObj.getFullYear(),
    selDateObj.getMonth(),
    selDateObj.getDate(),
    startH,
    startM,
    0,
    0,
  ).getTime();

  const dayWorkEnd = new Date(
    selDateObj.getFullYear(),
    selDateObj.getMonth(),
    selDateObj.getDate(),
    endH,
    endM,
    0,
    0,
  ).getTime();

  // Guard: Never generate artificial productivity for a future date
  if (dayWorkStart > nowMs) return 0;

  // Calculate subtasks productivity if any
  let subtasksDuration = 0;
  if (
    task.subtasks &&
    Array.isArray(task.subtasks) &&
    task.subtasks.length > 0
  ) {
    task.subtasks.forEach((sub) => {
      subtasksDuration += calculateTaskProductivityForDate(
        sub,
        selectedDate,
        officeHours,
        nowMs,
      );
    });
  }

  // 0. PRIMARY PATH: Use statusHistory for accurate per-day tracking
  if (
    task.statusHistory &&
    Array.isArray(task.statusHistory) &&
    task.statusHistory.length > 0
  ) {
    const selDateStr = getKolkataDateStr(selDateObj);
    const isSelectedToday = isSameDay(selDateObj, new Date());
    let historyDuration = 0;

    task.statusHistory.forEach((h) => {
      const isProductiveHold =
        h.status === "On Hold" &&
        (h.reason === "Client Call" || h.reason === "Meeting");
      if (!isStatusInProgress(h.status) && !isProductiveHold) return;

      let entryDate = h.date;
      if (entryDate && entryDate.includes(",")) {
        try {
          entryDate = getKolkataDateStr(entryDate);
        } catch (e) {}
      }
      if (!entryDate || entryDate.includes(",")) {
        entryDate = h.startTime ? getKolkataDateStr(h.startTime) : null;
      }
      if (entryDate !== selDateStr) return;

      if (h.duration > 0) {
        // ✅ Properly closed entry — use the recorded duration directly
        historyDuration += h.duration;
      } else if (h.endTime) {
        // Closed but duration field wasn't saved — derive from timestamps
        historyDuration += Math.max(
          0,
          new Date(h.endTime).getTime() - new Date(h.startTime).getTime(),
        );
      } else if (
        isSelectedToday &&
        (isStatusInProgress(task.status) ||
          (task.status === "On Hold" && isProductiveHold)) &&
        !task.autoPaused
      ) {
        // Open entry on TODAY, still running — handled by live section below, skip here
      } else {
        // ✅ FIX Bug 1: Open entry (endTime=null, duration=0) on a PAST date
        // or an autoPaused entry — cap contribution at that day's EOD / pausedAt
        const entryStartMs = new Date(h.startTime).getTime();
        const pauseTime = task.pausedAt || task.holdStartedAt;
        const capEnd = pauseTime
          ? Math.min(new Date(pauseTime).getTime(), dayWorkEnd)
          : dayWorkEnd;
        historyDuration += Math.max(
          0,
          Math.min(capEnd, dayWorkEnd) - Math.max(entryStartMs, dayWorkStart),
        );
      }
    });

    // ✅ FIX Bug 3: Live session guard — fallback to statusHistory open entry or updatedAt if actualStartTime is missing
    const currentIsProductiveHold =
      task.status === "On Hold" &&
      task.statusHistory &&
      task.statusHistory.length > 0 &&
      (task.statusHistory[task.statusHistory.length - 1].reason ===
        "Client Call" ||
        task.statusHistory[task.statusHistory.length - 1].reason === "Meeting");

    if (
      isSelectedToday &&
      (isStatusInProgress(task.status) || currentIsProductiveHold) &&
      !task.autoPaused
    ) {
      let liveSessionStart = 0;

      // 1. Try to find the open entry in status history (most accurate for current chunk)
      if (task.statusHistory && Array.isArray(task.statusHistory)) {
        const openEntry = [...task.statusHistory]
          .reverse()
          .find(
            (h) =>
              (isStatusInProgress(h.status) ||
                (h.status === "On Hold" &&
                  (h.reason === "Client Call" || h.reason === "Meeting"))) &&
              !h.endTime,
          );
        if (openEntry && openEntry.startTime) {
          liveSessionStart = new Date(openEntry.startTime).getTime();
        }
      }

      // 2. Fallback to actualStartTime or holdStartedAt
      if (isNaN(liveSessionStart) || liveSessionStart <= 0) {
        if (isStatusInProgress(task.status) && task.actualStartTime) {
          liveSessionStart = new Date(task.actualStartTime).getTime();
        } else if (currentIsProductiveHold && task.holdStartedAt) {
          liveSessionStart = new Date(task.holdStartedAt).getTime();
        }
      }

      // 3. Fallback to updatedAt
      if (isNaN(liveSessionStart) || liveSessionStart <= 0) {
        if (task.updatedAt) {
          liveSessionStart = new Date(task.updatedAt).getTime();
        }
      }

      const liveSessionDateStr =
        liveSessionStart > 0
          ? getKolkataDateStr(liveSessionStart)
          : null;

      // Only add live elapsed time if liveSessionStart is valid
      if (
        liveSessionStart > 0 &&
        (liveSessionDateStr === selDateStr || isSelectedToday)
      ) {
        const cappedNowMs = Math.min(nowMs, dayWorkEnd);
        // Ensure we only calculate time that occurred within today's working hours
        const effectiveLiveStart = Math.max(liveSessionStart, dayWorkStart);
        let liveWorked = Math.max(0, cappedNowMs - effectiveLiveStart);

        if (task.blockerHistory && Array.isArray(task.blockerHistory)) {
          task.blockerHistory.forEach((b) => {
            if (b.pausedAt) {
              const p = new Date(b.pausedAt).getTime();
              const r = b.resumedAt
                ? new Date(b.resumedAt).getTime()
                : cappedNowMs;
              const oStart = Math.max(p, effectiveLiveStart);
              const oEnd = Math.min(r, cappedNowMs);
              if (oEnd > oStart) {
                liveWorked -= oEnd - oStart;
              }
            }
          });
        }
        if (task.isBlocked && task.blockerPausedAt) {
          const p = new Date(task.blockerPausedAt).getTime();
          const oStart = Math.max(p, effectiveLiveStart);
          if (cappedNowMs > oStart) {
            liveWorked -= cappedNowMs - oStart;
          }
        }
        return (
          Math.max(0, historyDuration + Math.max(0, liveWorked)) +
          subtasksDuration
        );
      }
    }

    if (
      historyDuration > 0 ||
      (task.statusHistory.length > 0 && !task.actualStartTime)
    ) {
      return historyDuration + subtasksDuration;
    }
  }

  if (!task.actualStartTime) {
    const selDateStr = getKolkataDateStr(selDateObj);
    const isSelectedToday = isSameDay(selDateObj, new Date());
    const baseTracked = isSelectedToday
      ? task.dailyTrackedTime || 0
      : task.totalTrackedTime || 0;
    return baseTracked + subtasksDuration;
  }

  // FALLBACK PATH: No usable statusHistory — estimate from actualStartTime
  const taskStart = new Date(task.actualStartTime).getTime();
  if (isNaN(taskStart)) return 0;

  // Guard 2: Task started after this day's office hours ended
  if (taskStart >= dayWorkEnd) return 0;

  // 2. Determine when task's working period stopped or paused for the Designer
  const statusUpper = (task.status || "").trim().toUpperCase();

  let taskEnd;

  if (
    statusUpper === "IN REVIEW" ||
    statusUpper === "IN_REVIEW" ||
    statusUpper === "IN-REVIEW"
  ) {
    // DESIGNER SIDE: "In Review" means Designer FINISHED work and submitted it.
    // Designer productivity MUST STOP when task moves from "In Progress" to "In Review".
    taskEnd = new Date(
      task.reviewStartedAt ||
        task.lastReviewStartedAt ||
        task.pausedAt ||
        task.actualEndTime ||
        task.updatedAt,
    ).getTime();
  } else if (statusUpper === "COMPLETED") {
    // SOCIAL MEDIA MANAGER SIDE: "Completed" means Manager approved work.
    // Moving "In Review" -> "Completed" is NOT additional Designer working time.
    // If the task was submitted to "In Review", Designer work stopped at review submission time.
    // ✅ FIX Bug 4: Use LAST review cycle (not [0]) — multi-correction tasks end at final review
    const reviewTime =
      task.reviewStartedAt ||
      task.lastReviewStartedAt ||
      (task.reviewCycles && task.reviewCycles.length > 0
        ? task.reviewCycles[task.reviewCycles.length - 1].startedAt
        : null);

    taskEnd = reviewTime
      ? new Date(reviewTime).getTime()
      : new Date(
          task.actualEndTime || task.completedAt || task.updatedAt,
        ).getTime();
  } else if (
    statusUpper === "ON HOLD" ||
    statusUpper === "ON_HOLD" ||
    statusUpper === "CORRECTION"
  ) {
    taskEnd = new Date(
      task.pausedAt || task.actualEndTime || task.updatedAt,
    ).getTime();
  } else if (statusUpper === "REJECTED") {
    taskEnd = new Date(
      task.actualEndTime || task.completedAt || task.pausedAt || task.updatedAt,
    ).getTime();
  } else if (statusUpper === "IN PROGRESS" || statusUpper === "IN_PROGRESS") {
    if (task.autoPaused) {
      taskEnd = new Date(task.pausedAt || nowMs).getTime();
    } else {
      taskEnd = isSameDay(selDateObj, new Date()) ? nowMs : dayWorkEnd;
    }
  } else {
    // Default fallback (e.g. Pending)
    if (task.actualEndTime) {
      taskEnd = new Date(task.actualEndTime).getTime();
    } else if (task.pausedAt) {
      taskEnd = new Date(task.pausedAt).getTime();
    } else {
      taskEnd = isSameDay(selDateObj, new Date()) ? nowMs : dayWorkEnd;
    }
  }

  if (isNaN(taskEnd) || taskEnd <= taskStart) return 0;

  // Guard 3: If taskEnd is before selectedDate's office hours started
  if (taskEnd <= dayWorkStart) return 0;

  // 3. Intersect task working period [taskStart, taskEnd] with office hours window [dayWorkStart, dayWorkEnd]
  const effectiveStart = Math.max(taskStart, dayWorkStart);
  const effectiveEnd = Math.min(taskEnd, dayWorkEnd);

  const daySpan = Math.max(0, effectiveEnd - effectiveStart);
  if (daySpan <= 0) return 0;

  // 4. Calculate pause duration that falls inside the office-hours window
  const isPausedState =
    ((statusUpper === "IN PROGRESS" || statusUpper === "IN_PROGRESS") &&
      task.autoPaused) ||
    [
      "ON HOLD",
      "ON_HOLD",
      "REJECTED",
      "IN REVIEW",
      "IN_REVIEW",
      "IN-REVIEW",
      "CORRECTION",
    ].includes(statusUpper);

  let dayPausedMs = 0;

  let hasHistoryPause = false;
  if (
    task.blockerHistory &&
    Array.isArray(task.blockerHistory) &&
    task.blockerHistory.length > 0
  ) {
    task.blockerHistory.forEach((b) => {
      if (b.pausedAt) {
        const pStart = new Date(b.pausedAt).getTime();
        const pEnd = b.resumedAt
          ? new Date(b.resumedAt).getTime()
          : isPausedState && task.pausedAt
            ? new Date(task.pausedAt).getTime()
            : isSameDay(selDateObj, new Date())
              ? nowMs
              : dayWorkEnd;
        if (!isNaN(pStart) && !isNaN(pEnd) && pEnd > pStart) {
          const overlapStart = Math.max(pStart, dayWorkStart);
          const overlapEnd = Math.min(pEnd, dayWorkEnd);
          if (overlapEnd > overlapStart) {
            dayPausedMs += overlapEnd - overlapStart;
            hasHistoryPause = true;
          }
        }
      }
    });
  }

  // ✅ FIX Bug 5: Only use totalPausedMs when NO blockerHistory exists
  // Blockers happen on specific days — proportional distribution across all days is incorrect
  if (!hasHistoryPause) {
    const totalPaused = task.totalPausedMs || 0;
    if (totalPaused > 0) {
      const lifetimeSpan = Math.max(
        1,
        new Date(task.actualEndTime || nowMs).getTime() - taskStart,
      );
      const ratio = daySpan / lifetimeSpan;
      dayPausedMs = Math.min(daySpan, totalPaused * ratio);
    }
  }

  return Math.max(0, daySpan - dayPausedMs) + subtasksDuration;
};

export const isTaskLive = (task, selectedDate = new Date()) => {
  if (!task) return false;
  const selDateObj = selectedDate
    ? typeof selectedDate === "string"
      ? parseISO(selectedDate)
      : new Date(selectedDate)
    : new Date();

  const isSelectedToday = isSameDay(selDateObj, new Date());
  if (!isSelectedToday) return false;

  const currentIsProductiveHold =
    task.status === "On Hold" &&
    task.statusHistory &&
    task.statusHistory.length > 0 &&
    (task.statusHistory[task.statusHistory.length - 1].reason ===
      "Client Call" ||
      task.statusHistory[task.statusHistory.length - 1].reason === "Meeting");

  if (
    (isStatusInProgress(task.status) || currentIsProductiveHold) &&
    !task.autoPaused
  ) {
    return true;
  }
  return false;
};

const LiveProductivityCell = React.memo(
  ({
    tasks = [],
    initialLoggedMs = 0,
    selectedDate = new Date(),
    officeHours = { startTime: "09:00", endTime: "19:00" },
    productivityCache = null,
  }) => {
    const isSelectedDateToday = useMemo(() => {
      return isSameDay(selectedDate || new Date(), new Date());
    }, [selectedDate]);

    const hasInProgress = useMemo(() => {
      return tasks.some(
        (t) => t.status === "In Progress" && !t.actualEndTime && !t.autoPaused,
      );
    }, [tasks]);

    const hasInReview = useMemo(() => {
      return tasks.some((t) => {
        const s = (t.status || "").toLowerCase();
        return (s === "in review" || s === "in-review") && !t.actualEndTime;
      });
    }, [tasks]);

    const calculateTotalLogged = useCallback(() => {
      let total = 0;
      const selDateObj = selectedDate ? new Date(selectedDate) : new Date();

      tasks.forEach((t) => {
        let taskTotal = 0;
        const pData = productivityCache ? productivityCache.get(t._id) : null;
        if (pData) {
          if (pData.isLive) {
            taskTotal = calculateTaskProductivityForDate(
              t,
              selectedDate,
              officeHours,
              Date.now(),
            );
          } else {
            taskTotal = pData.staticMs;
          }
        } else {
          taskTotal = calculateTaskProductivityForDate(
            t,
            selectedDate,
            officeHours,
            Date.now(),
          );
        }
        total += taskTotal;
      });
      return total;
    }, [tasks, selectedDate, officeHours, productivityCache]);

    const [liveMs, setLiveMs] = useState(() => calculateTotalLogged());

    useEffect(() => {
      setLiveMs(calculateTotalLogged());
      if (isSelectedDateToday && hasInProgress) {
        const interval = setInterval(() => {
          setLiveMs(calculateTotalLogged());
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [
      tasks,
      selectedDate,
      isSelectedDateToday,
      hasInProgress,
      calculateTotalLogged,
    ]);

    const formatLoggedDuration = (ms, includeSeconds = false) => {
      if (!ms || ms <= 0) return includeSeconds ? "0m 0s" : "0m";
      const totalSecs = Math.floor(ms / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      const mStr = String(m).padStart(2, "0");
      const sStr = String(s).padStart(2, "0");
      if (includeSeconds) {
        return h > 0 ? `${h}h ${mStr}m ${sStr}s` : `${m}m ${sStr}s`;
      }
      return h > 0 ? `${h}h ${mStr}m` : `${m}m`;
    };

    if (isSelectedDateToday && hasInProgress) {
      return (
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"
            title="Running"
          />
          <span className="text-emerald-700 dark:text-emerald-300 font-black text-[12px] whitespace-nowrap">
            {formatLoggedDuration(liveMs, true)}
          </span>
        </div>
      );
    }

    if (!liveMs || liveMs <= 0) {
      return (
        <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10.5px] italic whitespace-nowrap">
          Not started
        </span>
      );
    }

    return (
      <span className="text-slate-700 dark:text-slate-300 font-black text-[12px] whitespace-nowrap">
        {formatLoggedDuration(liveMs)}
      </span>
    );
  },
);

const LiveTotalProductivityCell = React.memo(
  ({
    teamPerformance = [],
    selectedDate = new Date(),
    officeHours = { startTime: "09:00", endTime: "19:00" },
    productivityCache = null,
  }) => {
    const isSelectedDateToday = useMemo(() => {
      return isSameDay(selectedDate || new Date(), new Date());
    }, [selectedDate]);

    // Check if any designer has an active task running
    const hasAnyInProgress = useMemo(() => {
      return teamPerformance.some((tp) =>
        (tp.tasks || []).some(
          (t) =>
            t.status === "In Progress" && !t.actualEndTime && !t.autoPaused,
        ),
      );
    }, [teamPerformance]);

    const calculateGrandTotal = useCallback(() => {
      let grandTotal = 0;
      teamPerformance.forEach((tp) => {
        (tp.tasks || []).forEach((t) => {
          let taskTotal = 0;
          const pData = productivityCache ? productivityCache.get(t._id) : null;
          if (pData) {
            if (pData.isLive) {
              taskTotal = calculateTaskProductivityForDate(
                t,
                selectedDate,
                officeHours,
                Date.now(),
              );
            } else {
              taskTotal = pData.staticMs;
            }
          } else {
            taskTotal = calculateTaskProductivityForDate(
              t,
              selectedDate,
              officeHours,
              Date.now(),
            );
          }
          grandTotal += taskTotal;
        });
      });
      return grandTotal;
    }, [teamPerformance, selectedDate, officeHours, productivityCache]);

    const [liveMs, setLiveMs] = useState(() => calculateGrandTotal());

    useEffect(() => {
      setLiveMs(calculateGrandTotal());
      if (isSelectedDateToday && hasAnyInProgress) {
        const interval = setInterval(() => {
          setLiveMs(calculateGrandTotal());
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [
      teamPerformance,
      selectedDate,
      isSelectedDateToday,
      hasAnyInProgress,
      calculateGrandTotal,
    ]);

    const formatGrandTotal = (ms) => {
      if (!ms || ms <= 0) return "0m";
      const totalSecs = Math.floor(ms / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const mStr = String(m).padStart(2, "0");
      return h > 0 ? `${h}h ${mStr}m` : `${m}m`;
    };

    return (
      <span className="text-[12px] font-black text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
        {formatGrandTotal(liveMs)}
      </span>
    );
  },
);

const LiveUnproductiveCell = React.memo(
  ({
    tp,
    selectedDate = new Date(),
    officeHours = { startTime: "09:00", endTime: "19:00" },
    productivityCache,
  }) => {
    const isSelectedDateToday = useMemo(
      () => isSameDay(selectedDate || new Date(), new Date()),
      [selectedDate],
    );

    const hasLiveTask = useMemo(() => {
      return (tp.tasks || []).some((t) => isTaskLive(t, selectedDate));
    }, [tp.tasks, selectedDate]);

    const [now, setNow] = useState(() => new Date());

    const isWithinOfficeHours = useMemo(() => {
      const startTimeStr = officeHours?.startTime ?? "09:00";
      const endTimeStr = officeHours?.endTime ?? "19:00";
      const [startH, startM] = startTimeStr.split(":").map(Number);
      const [endH, endM] = endTimeStr.split(":").map(Number);
      const officeStart = new Date(now);
      officeStart.setHours(startH, startM, 0, 0);
      const officeEnd = new Date(now);
      officeEnd.setHours(endH, endM, 0, 0);
      return isSelectedDateToday && now >= officeStart && now < officeEnd;
    }, [isSelectedDateToday, officeHours, now]);

    const isUnproductiveRunning = isWithinOfficeHours && !hasLiveTask;

    useEffect(() => {
      setNow(new Date());
    }, [tp, hasLiveTask]);

    useEffect(() => {
      if (isUnproductiveRunning) {
        const interval = setInterval(() => {
          setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [isUnproductiveRunning]);

    const liveMs = useMemo(() => {
      if (!isSelectedDateToday) return tp.onHoldTimeMs || 0;

      const startTimeStr = officeHours?.startTime ?? "09:00";
      const [startH, startM] = startTimeStr.split(":").map(Number);
      const officeStart = new Date(now);
      officeStart.setHours(startH, startM, 0, 0);

      const endTimeStr = officeHours?.endTime ?? "19:00";
      const [endH, endM] = endTimeStr.split(":").map(Number);
      const officeEnd = new Date(now);
      officeEnd.setHours(endH, endM, 0, 0);

      const endToUse =
        now < officeEnd
          ? Math.max(now.getTime(), officeStart.getTime())
          : officeEnd.getTime();

      const elapsedOfficeMs = Math.max(0, endToUse - officeStart.getTime());

      let liveTotalLoggedMs = 0;
      (tp.tasks || []).forEach((t) => {
        const pData = productivityCache ? productivityCache.get(t._id) : null;
        if (pData) {
          if (pData.isLive) {
            liveTotalLoggedMs += calculateTaskProductivityForDate(
              t,
              selectedDate,
              officeHours,
              now.getTime(),
            );
          } else {
            liveTotalLoggedMs += pData.staticMs;
          }
        } else {
          liveTotalLoggedMs += calculateTaskProductivityForDate(
            t,
            selectedDate,
            officeHours,
            now.getTime(),
          );
        }
      });

      return Math.max(
        0,
        elapsedOfficeMs - liveTotalLoggedMs - (tp.blockerTimeMs || 0),
      );
    }, [
      now,
      isSelectedDateToday,
      tp.onHoldTimeMs,
      officeHours,
      tp.tasks,
      productivityCache,
      selectedDate,
      tp.blockerTimeMs,
    ]);

    const formatMs = (ms, includeSeconds) => {
      if (!ms || ms <= 0) return includeSeconds ? "0m 0s" : "0m";
      const totalSecs = Math.floor(ms / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      const mStr = String(m).padStart(2, "0");
      const sStr = String(s).padStart(2, "0");
      if (includeSeconds) return h > 0 ? `${h}h ${mStr}m ${sStr}s` : `${m}m`;
      return h > 0 ? `${h}h ${mStr}m` : `${m}m`;
    };

    if (isUnproductiveRunning) {
      return (
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 rounded-full">
          <span
            className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0"
            title="Idle"
          />
          <span className="text-orange-700 dark:text-orange-400 font-black text-[12px] whitespace-nowrap">
            {formatMs(liveMs, true)}
          </span>
        </div>
      );
    }

    if (!liveMs || liveMs <= 0) {
      return (
        <span className="text-slate-400 dark:text-slate-500 font-bold text-[11.5px]">
          0m
        </span>
      );
    }

    return (
      <span className="text-orange-600 dark:text-orange-400 font-black text-[11.5px]">
        {formatMs(liveMs, false)}
      </span>
    );
  },
);

const StatusCellValue = React.memo(
  ({
    todayVal = 0,
    carryVal = 0,
    activeTextClass = "",
    inactiveTextClass = "text-slate-500 dark:text-slate-400 font-bold",
    badgeClass = "",
    showRunningIndicator = false,
  }) => {
    const hasToday = todayVal > 0;
    const hasCarry = carryVal > 0;

    return (
      <div className="flex items-center justify-center gap-1.5 py-0.5 min-h-[24px] group">
        {/* Main value (Today's count) */}
        <div className="flex items-center justify-center gap-0.5">
          <span
            className={`text-[13.5px] font-black tracking-tight transition-all duration-200 group-hover:scale-105 ${
              hasToday ? activeTextClass : inactiveTextClass
            }`}
          >
            {todayVal}
          </span>
          {showRunningIndicator && hasToday && (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
          )}
        </div>

        {/* Carry Forward Badge */}
        {hasCarry ? (
          <span
            className={`inline-flex items-center px-1.5 py-0.3 rounded-full text-[9px] font-black tracking-wider uppercase border shadow-3xs transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shrink-0 ${badgeClass}`}
            title={`${carryVal} Carry Forward`}
          >
            {carryVal} CF
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 select-none w-3 text-center">
            -
          </span>
        )}
      </div>
    );
  },
);

const ApprovalTimelineCell = React.memo(({ task }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [now, setNow] = useState(Date.now());
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const effectiveReviewStart =
    task?.reviewStartedAt ||
    task?.lastReviewStartedAt ||
    (task?.reviewCycles && task.reviewCycles.length > 0
      ? task.reviewCycles[task.reviewCycles.length - 1]?.startedAt
      : null);

  const statusLower = (task?.status || "").toLowerCase();
  const isCompleted = !!(task?.completedAt || task?.approvedAt);
  const isInReview =
    (statusLower.includes("review") || statusLower.includes("revision")) &&
    !isCompleted;

  // Live timer interval for tasks currently in review/waiting
  useEffect(() => {
    if (isInReview && effectiveReviewStart) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isInReview, effectiveReviewStart]);

  let totalWaitMs = task?.approvalWaitingMs || 0;
  if (effectiveReviewStart) {
    if (isCompleted) {
      totalWaitMs =
        totalWaitMs ||
        calculateBusinessMs(
          effectiveReviewStart,
          task.completedAt || task.approvedAt,
        );
    } else {
      totalWaitMs =
        totalWaitMs + calculateBusinessMs(effectiveReviewStart, new Date(now));
    }
  }

  if (!effectiveReviewStart && !isCompleted && totalWaitMs <= 0) {
    return (
      <span className="text-slate-400 dark:text-slate-600 font-bold">—</span>
    );
  }

  const formatApprovalDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      return {
        dateFormatted: `${format(d, "dd MMM")} · ${format(d, "hh:mm a")}`,
        relative: formatDistanceToNow(d) + " ago",
      };
    } catch (e) {
      return null;
    }
  };

  const revInfo = formatApprovalDate(effectiveReviewStart);
  const doneInfo = formatApprovalDate(task?.completedAt || task?.approvedAt);

  let tookText = "";
  if (totalWaitMs > 0) {
    const totalSecs = Math.floor(totalWaitMs / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    tookText = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  }

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!showPopup && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 270;
      const popoverHeight = revInfo && doneInfo ? 230 : 160;

      let top = rect.top - popoverHeight - 8;
      if (top < 10) {
        top = rect.bottom + 8;
      }
      let left = rect.right - popoverWidth;
      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }
      setCoords({ top, left });
    }
    setShowPopup(!showPopup);
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 justify-center">
      {/* Badge Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black tracking-wide border shadow-sm transition-all hover:scale-[1.03] cursor-pointer ${
          isInReview
            ? "bg-[#fefce8] text-[#b45309] border-[#fde68a] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
            : "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isInReview
              ? "bg-[#f59e0b] animate-pulse"
              : "bg-purple-500 dark:bg-purple-400"
          }`}
        />
        <span>
          {isInReview
            ? tookText
              ? `Waiting ${tookText}`
              : "Waiting"
            : tookText
              ? `Took ${tookText}`
              : "Timeline"}
        </span>
        <FiEye
          size={13}
          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 ml-0.5 shrink-0 transition-colors"
        />
      </button>

      {/* Details Popup rendered via Portal matching Reference Image */}
      {showPopup &&
        createPortal(
          <div className="fixed inset-0 z-[99999] pointer-events-none">
            {/* Click outside backdrop */}
            <div
              className="fixed inset-0 pointer-events-auto bg-black/10 dark:bg-black/40"
              onClick={() => setShowPopup(false)}
            />

            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
              }}
              className="pointer-events-auto w-[270px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  TIMELINE DETAILS
                </span>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX size={13} />
                </button>
              </div>

              {/* Body */}
              <div className="p-3.5 flex flex-col gap-3 bg-white dark:bg-[#0f172a]">
                {/* Review Start Card */}
                {revInfo && (
                  <div className="flex flex-col gap-0.5 bg-slate-50/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-black text-[#8b5cf6] dark:text-[#a78bfa] uppercase tracking-widest">
                      REVIEW START
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-[13px] mt-1 leading-snug">
                      {revInfo.dateFormatted}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {revInfo.relative}
                    </span>
                  </div>
                )}

                {/* Completed Card */}
                {doneInfo && (
                  <div className="flex flex-col gap-0.5 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      COMPLETED
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-[13px] mt-1 leading-snug">
                      {doneInfo.dateFormatted}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {doneInfo.relative}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
});

const getPriorityStyle = (priority) => {
  const p = priority?.toLowerCase() || "";
  if (p.includes("top high"))
    return "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30";
  if (p.includes("high"))
    return "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30";
  if (p.includes("medium"))
    return "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
  if (p.includes("low"))
    return "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
  return "bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
};

const GraphicDesignerDashboard = ({ targetDept = "Graphic Designer" }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const performanceTableRef = useRef(null);
  const boardScrollRef = useRef(null);
  const navigate = useNavigate();

  const scrollBoard = (direction) => {
    if (boardScrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      boardScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMetricClick = (status) => {
    let mappedFilter = "Today";
    if (isToday(selectedDate)) mappedFilter = "Today";
    else if (isYesterday(selectedDate)) mappedFilter = "Yesterday";
    else mappedFilter = format(selectedDate, "yyyy-MM-dd");

    localStorage.setItem("task_date_filter", mappedFilter);
    if (targetDept) {
      localStorage.setItem("task_department_filter", targetDept);
    }
    const deptQuery = targetDept
      ? `&department=${encodeURIComponent(targetDept)}`
      : "";
    navigate(
      `/${user?.role || "team"}/tasks?status=${encodeURIComponent(status)}${deptQuery}`,
    );
  };
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { projects } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);
  const designerEodState = useSelector((state) => state.designerEodReports);
  const designerEodReports = designerEodState?.designerEodReports || [];
  const {
    data: allTasks = [],
    isLoading,
    refetch: refetchTasks,
  } = useGetTasksQuery({ active_only: true, department: targetDept });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [approvalModal, setApprovalModal] = useState({
    open: false,
    designerName: "",
    tasks: [],
  });
  const [viewTasksModal, setViewTasksModal] = useState({
    open: false,
    designerId: null,
    designerName: "",
  });

  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const socketUrl = baseUrl
        ? baseUrl
        : typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:5001";

      const socket = io(socketUrl, {
        transports: ["polling", "websocket"],
        withCredentials: true,
      });

      const userId = user?._id || user?.id;
      if (userId) {
        socket.emit("join", userId);
      }

      socket.on("online_users_list", (usersList) => {
        if (Array.isArray(usersList)) {
          setOnlineUserIds(usersList);
        }
      });

      socket.on("task_updated", () => {
        refetchTasks();
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {}
  }, [user]);

  const [officeHours, setOfficeHours] = useState({
    startTime: "09:00",
    endTime: "19:00",
  });
  useEffect(() => {
    const fetchOfficeHours = async () => {
      try {
        const { data } = await axiosInstance.get("/settings/office-hours");
        if (data?.success) {
          setOfficeHours({
            startTime: data.data.startTime,
            endTime: data.data.endTime,
          });
        }
      } catch (err) {}
    };
    fetchOfficeHours();
  }, []);
  const [taskTab, setTaskTab] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [modalGroupTab, setModalGroupTab] = useState("assignedToday");
  const [bottleneckClient, setBottleneckClient] = useState("All Clients");
  const [bottleneckCreator, setBottleneckCreator] = useState("All Creators");
  const [bottleneckAssignee, setBottleneckAssignee] = useState("All Assignees");
  const [bottleneckStatus, setBottleneckStatus] = useState("All Statuses");
  const [trendDesignerFilter, setTrendDesignerFilter] =
    useState("All Designers");
  const [updateTask] = useUpdateTaskMutation();

  useEffect(() => {
    const params = {};
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    params.date = `${year}-${month}-${day}`;
    dispatch(getDesignerEodReports(params));
  }, [dispatch, selectedDate]);

  // 1. Filter Department Members dynamically based on targetDept
  const designers = useMemo(() => {
    const deptLower = targetDept.toLowerCase();
    const baseDesigners =
      users?.filter((u) => {
        const uDept = u.department?.toLowerCase() || "";
        if (deptLower.includes("graphic")) {
          return uDept.includes("graphic") || uDept.includes("design");
        }
        if (
          deptLower.includes("videographer") ||
          deptLower.includes("video") ||
          deptLower.includes("cinema") ||
          deptLower.includes("cinematog")
        ) {
          return (
            uDept.includes("video") ||
            uDept.includes("edit") ||
            uDept.includes("cinema") ||
            uDept.includes("cinematog")
          );
        }
        if (deptLower.includes("mobile")) {
          return (
            uDept.includes("mobile") ||
            uDept.includes("flutter") ||
            uDept.includes("react native") ||
            uDept.includes("android") ||
            uDept.includes("ios") ||
            uDept.includes("app")
          );
        }
        if (deptLower.includes("web")) {
          return uDept.includes("web");
        }
        return uDept.includes(deptLower);
      }) || [];

    // If logged-in user is a Social Media Manager, filter designers to only those
    // who are assigned tasks created by this Social Media Manager
    const isSocialMediaManager =
      user?.department?.toLowerCase() === "social media manager";
    if (isSocialMediaManager) {
      const currentUserId = user?._id || user?.id;
      const assignedDesignerIds = new Set();

      allTasks.forEach((task) => {
        const creatorId =
          task.createdBy && typeof task.createdBy === "object"
            ? task.createdBy._id
            : task.createdBy;
        if (creatorId === currentUserId && task.assignedTo) {
          // Filter by selectedDate so we only show designers who have tasks in the current view
          let includeTask = false;
          const taskCreatedDate = task.createdAt
            ? parseISO(task.createdAt)
            : null;
          const taskDueDate = task.dueDate ? parseISO(task.dueDate) : null;
          const taskStartDate = task.startDate
            ? parseISO(task.startDate)
            : null;
          const startCheckDate =
            taskStartDate || taskDueDate || taskCreatedDate;

          const statusLower = task.status?.toLowerCase() || "";
          const isCompleted =
            statusLower === "completed" || statusLower.includes("approve");
          const isRejected =
            statusLower.includes("reject") || statusLower.includes("cancel");

          if (isCompleted) {
            const completedDate = task.completedAt
              ? parseISO(task.completedAt)
              : task.updatedAt
                ? parseISO(task.updatedAt)
                : null;
            includeTask = completedDate
              ? isSameDay(completedDate, selectedDate)
              : false;
          } else if (isRejected) {
            const rejectedDate = task.rejectedAt
              ? parseISO(task.rejectedAt)
              : task.updatedAt
                ? parseISO(task.updatedAt)
                : null;
            includeTask = rejectedDate
              ? isSameDay(rejectedDate, selectedDate)
              : false;
          } else {
            if (startCheckDate) {
              includeTask =
                isSameDay(startCheckDate, selectedDate) ||
                isBefore(startCheckDate, selectedDate);
            }
          }

          if (includeTask) {
            const assigneeId =
              typeof task.assignedTo === "object"
                ? task.assignedTo._id
                : task.assignedTo;
            assignedDesignerIds.add(assigneeId);
          }
        }
      });

      return baseDesigners.filter((d) => assignedDesignerIds.has(d._id));
    }

    return baseDesigners;
  }, [users, allTasks, user, targetDept, selectedDate]);

  const designerIds = useMemo(() => designers.map((d) => d._id), [designers]);

  const tasksByAssignee = useMemo(() => {
    const map = {};
    allTasks.forEach((t) => {
      if (!t.assignedTo) return;
      const aId =
        typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo;
      if (!map[aId]) map[aId] = [];
      map[aId].push(t);
    });
    return map;
  }, [allTasks]);

  const productivityCache = useMemo(() => {
    const cache = new Map();
    designerIds.forEach((assigneeId) => {
      const tasks = tasksByAssignee[assigneeId] || [];
      tasks.forEach((task) => {
        const isSocialMediaManager =
          user?.department?.toLowerCase() === "social media manager";
        if (isSocialMediaManager) {
          const creatorId =
            task.createdBy && typeof task.createdBy === "object"
              ? task.createdBy._id
              : task.createdBy;
          const currentUserId = user?._id || user?.id;
          if (creatorId !== currentUserId) return;
        }

        const staticMs = calculateTaskProductivityForDate(
          task,
          selectedDate,
          officeHours,
          Date.now(),
        );
        const rawStaticMs = calculateTaskProductivityForDate(
          task,
          selectedDate,
          { startTime: "00:00", endTime: "23:59" },
          Date.now(),
        );
        const isLive = isTaskLive(task, selectedDate);
        cache.set(task._id, { staticMs, rawStaticMs, isLive });
      });
    });
    return cache;
  }, [designerIds, tasksByAssignee, selectedDate, officeHours, user]);

  // 2. Filter Tasks assigned to Graphic Designers + Date Filter
  const designerTasks = useMemo(() => {
    const relevantTasks = [];
    designerIds.forEach((assigneeId) => {
      const tasks = tasksByAssignee[assigneeId] || [];
      relevantTasks.push(...tasks);
    });

    return relevantTasks.filter((task) => {
      // Check Creator if logged-in user is a Social Media Manager
      const isSocialMediaManager =
        user?.department?.toLowerCase() === "social media manager";
      if (isSocialMediaManager) {
        const creatorId =
          task.createdBy && typeof task.createdBy === "object"
            ? task.createdBy._id
            : task.createdBy;
        const currentUserId = user?._id || user?.id;
        if (creatorId !== currentUserId) return false;
      }

      // Check Date
      const taskCreatedDate = task.createdAt ? parseISO(task.createdAt) : null;
      const taskDueDate = task.dueDate ? parseISO(task.dueDate) : null;
      const taskStartDate = task.startDate ? parseISO(task.startDate) : null;

      const statusLower = task.status?.toLowerCase() || "";
      const isCompleted =
        statusLower === "completed" || statusLower.includes("approve");
      const isRejected =
        statusLower.includes("reject") || statusLower.includes("cancel");

      // 1. Completed tasks: ONLY show them on the day they were actually completed, or if they had productivity
      if (isCompleted) {
        const completedDate = task.completedAt
          ? parseISO(task.completedAt)
          : task.updatedAt
            ? parseISO(task.updatedAt)
            : null;
        if (completedDate && isSameDay(completedDate, selectedDate))
          return true;
        const pData = productivityCache.get(task._id);
        if (pData && pData.staticMs > 0) return true;
        return false;
      }

      // 2. Rejected tasks: ONLY show them on the day they were rejected, or if they had productivity
      if (isRejected) {
        const rejectedDate = task.rejectedAt
          ? parseISO(task.rejectedAt)
          : task.updatedAt
            ? parseISO(task.updatedAt)
            : null;
        if (rejectedDate && isSameDay(rejectedDate, selectedDate)) return true;
        const pData = productivityCache.get(task._id);
        if (pData && pData.staticMs > 0) return true;
        return false;
      }

      // 3. Unfinished active tasks: show if selectedDate is on or after its start date (or created date if no start date)
      const startCheckDate = taskStartDate || taskCreatedDate;
      if (startCheckDate) {
        const isStarted =
          isSameDay(startCheckDate, selectedDate) ||
          isBefore(startCheckDate, selectedDate);
        if (isStarted) {
          return true;
        }
      }

      return false;
    });
  }, [
    designerIds,
    tasksByAssignee,
    selectedDate,
    user,
    officeHours,
    productivityCache,
  ]);

  // 3. Compute Metrics
  // todayAssignedTasks: only tasks whose assignment date (startDate || createdAt) falls on selectedDate.
  // This is used for Metric Cards and Performance Table status counts.
  // Productivity continues to use all designerTasks (actual work done on selectedDate).
  const todayAssignedDesignerTasks = useMemo(() => {
    return designerTasks.filter((task) => {
      const assignmentDate = task.startDate || task.createdAt;
      if (!assignmentDate) return false;
      return isSameDay(new Date(assignmentDate), selectedDate);
    });
  }, [designerTasks, selectedDate]);

  const metrics = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let onHold = 0;
    let inReview = 0;
    let overdue = 0;
    let dueToday = 0;
    let rejected = 0;
    let corrections = 0;
    let totalRevisions = 0;

    // Metric card counts reflect TODAY ASSIGNED TASKS ONLY.
    todayAssignedDesignerTasks.forEach((task) => {
      const status = task.status?.toLowerCase() || "";
      if (status === "completed" || status.includes("approve")) completed++;
      else if (status.includes("reject")) rejected++;
      else if (status.includes("correction")) corrections++;
      else if (status.includes("hold")) onHold++;
      else if (status.includes("progress")) inProgress++;
      else if (status.includes("review") || status.includes("revision"))
        inReview++;
      else if (status === "pending") pending++;
      else pending++; // default fallback

      totalRevisions += task.revisions || 0;

      if (
        task.dueDate &&
        status !== "completed" &&
        !status.includes("approve")
      ) {
        const days = getDaysRemaining(task.dueDate, selectedDate);
        if (days !== null && days < 0) {
          overdue++;
        } else if (days !== null && days === 0) {
          dueToday++;
        }
      }
    });

    return {
      designersWorking: designers.length,
      // tasksAssigned = today's assigned batch only
      tasksAssigned: todayAssignedDesignerTasks.length,
      completed,
      pending,
      inProgress,
      onHold,
      inReview,
      corrections,
      overdue,
      dueToday,
      rejected,
      totalRevisions,
    };
  }, [todayAssignedDesignerTasks, designers.length, selectedDate]);

  const interruptions = useMemo(() => {
    let totalBlockers = 0;
    const counts = {
      "Client Calls": 0,
      "Urgent Tasks": 0,
      Revisions: 0,
      Meetings: 0,
      Other: 0,
    };

    const processBlocker = (type) => {
      totalBlockers++;
      if (!type) {
        counts["Other"]++;
        return;
      }
      const t = type.toLowerCase();
      if (t.includes("call") || t.includes("client")) counts["Client Calls"]++;
      else if (t.includes("urgent")) counts["Urgent Tasks"]++;
      else if (t.includes("revision")) counts["Revisions"]++;
      else if (t.includes("meeting")) counts["Meetings"]++;
      else counts["Other"]++;
    };

    const selDateObj = selectedDate || new Date();
    const dayStart = startOfDay(selDateObj).getTime();
    const nextDayStart = startOfDay(addDays(selDateObj, 1)).getTime();

    designerTasks.forEach((task) => {
      if (task.blockerHistory && Array.isArray(task.blockerHistory)) {
        task.blockerHistory.forEach((b) => {
          if (!b.pausedAt) return;
          const pStart = new Date(b.pausedAt).getTime();
          if (isNaN(pStart)) return;
          let pEnd = b.resumedAt
            ? new Date(b.resumedAt).getTime()
            : b.totalPauseMinutes
              ? pStart + b.totalPauseMinutes * 60 * 1000
              : task.pausedAt
                ? new Date(task.pausedAt).getTime()
                : isSameDay(selDateObj, new Date())
                  ? Date.now()
                  : nextDayStart;
          if (isNaN(pEnd) || pEnd <= pStart) return;
          const overlapStart = Math.max(pStart, dayStart);
          const overlapEnd = Math.min(pEnd, nextDayStart);
          if (overlapEnd > overlapStart) {
            processBlocker(b.blockerType);
          }
        });
      }
      if (task.isBlocked && task.blockerPausedAt) {
        const pStart = new Date(task.blockerPausedAt).getTime();
        if (!isNaN(pStart)) {
          const pEnd = isSameDay(selDateObj, new Date())
            ? Date.now()
            : nextDayStart;
          const overlapStart = Math.max(pStart, dayStart);
          const overlapEnd = Math.min(pEnd, nextDayStart);
          if (overlapEnd > overlapStart) {
            const alreadyHandled =
              task.blockerHistory &&
              task.blockerHistory.some((h) => {
                if (!h.pausedAt) return false;
                return Math.abs(new Date(h.pausedAt).getTime() - pStart) < 1000;
              });
            if (!alreadyHandled) {
              processBlocker(task.blockerType);
            }
          }
        }
      }
    });

    return { total: totalBlockers, counts };
  }, [designerTasks, selectedDate]);

  // 4. Team Performance
  const teamPerformance = useMemo(() => {
    return designers.map((designer) => {
      // All tasks for this designer that are visible on selectedDate
      // (used for Productivity, Blockers, Approval time)
      const myTasks = designerTasks.filter((t) => {
        if (!t.assignedTo) return false;
        const aId =
          typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo;
        if (aId !== designer._id) return false;
        const s = (t.status || "").toLowerCase();
        if (s.includes("reject") || s.includes("cancel")) return false;
        return true;
      });

      // TODAY ASSIGNED TASKS ONLY — tasks whose assignment date
      // (assignedDate || assignedAt || startDate || createdAt)
      // falls on selectedDate. Used for status counts in the Performance Table.
      const todayAssignedTasks = myTasks.filter((task) => {
        const assignmentDate = getTaskAssignmentDate(task);
        if (!assignmentDate) return false;
        return isSameDay(new Date(assignmentDate), selectedDate);
      });

      // --- Status counts: based on TODAY ASSIGNED BATCH only ---
      let comp = 0;
      let pend = 0;
      let prog = 0;
      let hold = 0;
      let rev = 0;
      let over = 0;
      let totalRevisions = 0;

      todayAssignedTasks.forEach((t) => {
        const s = t.status?.toLowerCase() || "";
        const isCompleted = s === "completed" || s.includes("approve");
        const isRejected = s.includes("reject") || s.includes("cancel");

        if (isCompleted) comp++;
        else if (s.includes("hold")) hold++;
        else if (s.includes("progress")) prog++;
        else if (s.includes("review") || s.includes("revision")) rev++;
        else if (s === "pending") pend++;
        else if (!isRejected) pend++; // default fallback

        if (
          t.dueDate &&
          isBefore(startOfDay(parseISO(t.dueDate)), startOfDay(selectedDate)) &&
          !isCompleted &&
          !isRejected
        )
          over++;

        totalRevisions += t.revisions || 0;
      });

      // CARRY FORWARD TASKS ONLY — tasks whose assignment date
      // (assignedDate || assignedAt || startDate || createdAt)
      // is before selectedDate. Used for status counts in the Performance Table.
      const carryForwardTasks = myTasks.filter((task) => {
        const assignmentDate = getTaskAssignmentDate(task);
        if (!assignmentDate) return false;
        return isBefore(
          startOfDay(new Date(assignmentDate)),
          startOfDay(selectedDate),
        );
      });

      // --- Status counts: based on CARRY FORWARD BATCH only ---
      let carryComp = 0;
      let carryPend = 0;
      let carryProg = 0;
      let carryHold = 0;
      let carryRev = 0;

      carryForwardTasks.forEach((t) => {
        const s = t.status?.toLowerCase() || "";
        const isCompleted = s === "completed" || s.includes("approve");
        const isRejected = s.includes("reject") || s.includes("cancel");

        if (isCompleted) carryComp++;
        else if (s.includes("hold")) carryHold++;
        else if (s.includes("progress")) carryProg++;
        else if (s.includes("review") || s.includes("revision")) carryRev++;
        else if (s === "pending") carryPend++;
        else if (!isRejected) carryPend++; // default fallback
      });

      // --- Productivity & Blockers: based on ALL myTasks worked on selectedDate ---
      let totalLoggedMs = 0;
      let totalBusinessLoggedMs = 0;
      let totalOffworkingLoggedMs = 0;
      let inProgressLoggedMs = 0;
      let totalBlockerMs = 0;
      let totalOnHoldMs = 0;
      let totalApprovalMs = 0;
      let approvalCount = 0;
      const blockerTypesSet = new Set();
      const holdReasonsSet = new Set();

      const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Filter reports for this designer
      const designerReports =
        designerEodReports?.filter((report) => {
          const rUserId =
            typeof report.user === "object" ? report.user?._id : report.user;
          return rUserId === designer._id;
        }) || [];

      // Find the one that matches the selectedDate
      const targetDateStr = getLocalDateString(selectedDate);
      const designerReport = designerReports.find((report) => {
        const reportDate = new Date(report.date).toISOString().split("T")[0];
        return reportDate === targetDateStr;
      });

      let eodReportTotalMs = null;
      if (
        !isSameDay(selectedDate || new Date(), new Date()) &&
        designerReport &&
        Array.isArray(designerReport.tasks)
      ) {
        let eodTotal = 0;
        const selDateObj = selectedDate ? new Date(selectedDate) : new Date();
        const selDateStr = getKolkataDateStr(selDateObj);
        designerReport.tasks.forEach((rt) => {
          const originalTask = (designerTasks || []).find(
            (at) => at._id === (rt.taskId?._id || rt.taskId || rt.id || rt._id),
          );
          const target = originalTask || rt;
          let msToday = 0;
          const pData = productivityCache.get(target._id || target.id);
          if (pData) {
            msToday = pData.staticMs;
          } else {
            msToday = calculateTaskProductivityForDate(
              target,
              selDateObj,
              officeHours,
              Date.now(),
            );
          }
          const taskTotalToday = msToday;
          if (taskTotalToday > 0) {
            eodTotal += taskTotalToday;
          } else {
            const timeStr = rt.time || "";
            const hoursMatch = timeStr.match(/(\d+)\s*h/i);
            const minsMatch = timeStr.match(/(\d+)\s*m/i);
            const secsMatch = timeStr.match(/(\d+)\s*s/i);

            let mins = 0;
            if (hoursMatch) mins += parseInt(hoursMatch[1], 10) * 60;
            if (minsMatch) mins += parseInt(minsMatch[1], 10);
            if (secsMatch && !hoursMatch && !minsMatch) {
              const secs = parseInt(secsMatch[1], 10);
              if (secs > 0) mins += Math.ceil(secs / 60);
            }
            eodTotal += mins * 60 * 1000;
          }
        });
        eodReportTotalMs = eodTotal;
      }

      myTasks.forEach((t) => {
        let taskBlockerMs = 0;
        const selDateObj = selectedDate || new Date();
        const selDateStr = getKolkataDateStr(selDateObj);
        const dayStart = startOfDay(selDateObj).getTime();
        const nextDayStart = startOfDay(addDays(selDateObj, 1)).getTime();

        if (Array.isArray(t.statusHistory)) {
          t.statusHistory.forEach((h) => {
            if (h.status === "Blocked") {
              const hDate = getKolkataDateStr(h.startTime || h.date);
              if (hDate === selDateStr) {
                taskBlockerMs += h.duration || 0;
                if (h.blockerType) {
                  blockerTypesSet.add(h.blockerType);
                }
              }
            }
          });
        }

        if (t.status === "Blocked" && t.blockedStartedAt) {
          const hDate = getKolkataDateStr(t.blockedStartedAt);
          if (hDate === selDateStr) {
            const endMs = isSameDay(selDateObj, new Date())
              ? Date.now()
              : startOfDay(addDays(selDateObj, 1)).getTime();
            taskBlockerMs += Math.max(
              0,
              endMs - new Date(t.blockedStartedAt).getTime(),
            );
          }
        }

        totalBlockerMs += taskBlockerMs;

        let taskOnHoldMs = 0;

        if (Array.isArray(t.statusHistory)) {
          t.statusHistory.forEach((h) => {
            if (h.status === "On Hold") {
              const hDate = getKolkataDateStr(h.startTime || h.date);
              if (hDate === selDateStr) {
                if (h.reason === "Client Call" || h.reason === "Meeting") {
                  taskBlockerMs += h.duration || 0;
                  if (h.reason) blockerTypesSet.add(h.reason);
                } else if (h.reason !== "Another Task") {
                  taskOnHoldMs += h.duration || 0;
                  if (h.reason) holdReasonsSet.add(h.reason);
                }
              }
            }
          });
        }

        if (t.status === "On Hold" && t.holdStartedAt) {
          const hDate = getKolkataDateStr(t.holdStartedAt);
          if (hDate === selDateStr) {
            const endMs = isSameDay(selDateObj, new Date())
              ? Date.now()
              : startOfDay(addDays(selDateObj, 1)).getTime();
            const duration = Math.max(
              0,
              endMs - new Date(t.holdStartedAt).getTime(),
            );

            const liveHoldEntry = [...(t.statusHistory || [])]
              .reverse()
              .find((x) => x.status === "On Hold");

            if (
              liveHoldEntry &&
              (liveHoldEntry.reason === "Client Call" ||
                liveHoldEntry.reason === "Meeting")
            ) {
              taskBlockerMs += duration;
              blockerTypesSet.add(liveHoldEntry.reason);
            } else if (
              !liveHoldEntry ||
              liveHoldEntry.reason !== "Another Task"
            ) {
              taskOnHoldMs += duration;
              if (liveHoldEntry && liveHoldEntry.reason) {
                holdReasonsSet.add(liveHoldEntry.reason);
              }
            }
          }
        }

        totalOnHoldMs += taskOnHoldMs;

        const pData = productivityCache.get(t._id);
        const taskLoggedMs = pData
          ? pData.staticMs
          : calculateTaskProductivityForDate(
              t,
              selectedDate,
              officeHours,
              Date.now(),
            );
        const taskRawLoggedMs =
          pData && pData.rawStaticMs !== undefined
            ? pData.rawStaticMs
            : calculateTaskProductivityForDate(
                t,
                selectedDate,
                { startTime: "00:00", endTime: "23:59" },
                Date.now(),
              );

        const taskTotalLogged = taskLoggedMs;

        if (taskTotalLogged > 0) {
          totalLoggedMs += taskTotalLogged;
          totalBusinessLoggedMs += taskTotalLogged;
          inProgressLoggedMs += taskTotalLogged;
        }

        const offWorkingMs = Math.max(0, taskRawLoggedMs - taskLoggedMs);
        if (offWorkingMs > 0) {
          totalOffworkingLoggedMs += offWorkingMs;
        }
      });

      if (eodReportTotalMs !== null) {
        totalLoggedMs = eodReportTotalMs;
      }

      // Compute elapsed business time for selectedDate to determine true unproductivity
      const selDateObjLocal = new Date(selectedDate);
      const startTimeStr = officeHours?.startTime ?? "09:00";
      const endTimeStr = officeHours?.endTime ?? "19:00";

      const officeStart = new Date(selDateObjLocal);
      const [startH, startM] = startTimeStr.split(":").map(Number);
      officeStart.setHours(startH, startM, 0, 0);

      const officeEnd = new Date(selDateObjLocal);
      const [endH, endM] = endTimeStr.split(":").map(Number);
      officeEnd.setHours(endH, endM, 0, 0);

      const now = new Date();
      let endToUse = officeEnd;
      if (isSameDay(selDateObjLocal, now) && now < officeEnd) {
        endToUse = now > officeStart ? now : officeStart;
      }

      // Calculate total elapsed office ms
      const elapsedOfficeMs = calculateBusinessMsBetween(
        officeStart,
        endToUse,
        officeHours,
        null,
      );

      // Override totalOnHoldMs to be the remaining time that isn't logged or blocked
      totalOnHoldMs = Math.max(
        0,
        elapsedOfficeMs - totalLoggedMs - totalBlockerMs,
      );

      // Compute approval time using actual review and completion fields (all tasks)
      myTasks.forEach((t) => {
        const totalWaitMs =
          t.approvalWaitingMs ||
          (t.reviewStartedAt && t.completedAt
            ? calculateBusinessMs(t.reviewStartedAt, t.completedAt)
            : 0);
        if (totalWaitMs > 0) {
          totalApprovalMs += totalWaitMs;
          approvalCount++;
        }
      });

      const avgRevisions =
        todayAssignedTasks.length > 0
          ? totalRevisions / todayAssignedTasks.length
          : 0;
      const totalHours = totalLoggedMs / (1000 * 60 * 60);
      const inProgressHours = inProgressLoggedMs / (1000 * 60 * 60);
      const avgApprovalMs =
        approvalCount > 0 ? totalApprovalMs / approvalCount : 0;

      let lastSubmittedStr = "Not submitted";
      if (designerReport) {
        if (designerReport.isDraft) {
          lastSubmittedStr = "Draft";
        } else {
          const reportUpdatedAt = new Date(designerReport.updatedAt);
          if (isSameDay(reportUpdatedAt, selectedDate)) {
            lastSubmittedStr = format(reportUpdatedAt, "h:mm a");
          } else {
            lastSubmittedStr = format(reportUpdatedAt, "MMM dd, h:mm a");
          }
        }
      }

      return {
        id: designer._id,
        name: designer.name,
        profileImage:
          (typeof designer.profile?.profileImage === "object"
            ? designer.profile?.profileImage?.url
            : designer.profile?.profileImage) ||
          (typeof designer.profileImage === "object"
            ? designer.profileImage?.url
            : designer.profileImage) ||
          designer.profilePic ||
          designer.avatar ||
          designer.profile?.profilePic ||
          designer.profile?.avatar,
        // assigned = today's assigned batch count only
        assigned: todayAssignedTasks.length,
        completed: comp,
        pending: pend,
        inProgress: prog,
        onHold: hold,
        inReview: rev,
        carryForward: {
          assigned: carryForwardTasks.length,
          completed: carryComp,
          pending: carryPend,
          inProgress: carryProg,
          onHold: carryHold,
          inReview: carryRev,
        },
        // inReviewTasks: filtered from todayAssignedTasks (assignment-based)
        inReviewTasks: todayAssignedTasks.filter((t) => {
          const s = t.status?.toLowerCase() || "";
          return s.includes("review") || s.includes("revision");
        }),
        overdue: over,
        totalRevisions,
        avgRevisions,
        totalHours,
        totalLoggedMs,
        inProgressHours,
        inProgressLoggedMs,
        totalBusinessLoggedMs,
        totalOffworkingLoggedMs,
        avgApprovalMs,
        blockers:
          blockerTypesSet.size > 0
            ? Array.from(blockerTypesSet).join(", ")
            : "none",
        holdReasons:
          holdReasonsSet.size > 0
            ? Array.from(holdReasonsSet).join(", ")
            : "none",
        blockerTimeMs: totalBlockerMs,
        onHoldTimeMs: totalOnHoldMs,
        lastSubmitted: lastSubmittedStr,
        // tasksWorkedOn: count of tasks that had productivity > 0 on selectedDate (all tasks, not just today-assigned)
        tasksWorkedOn: myTasks.filter((t) => {
          const pData = productivityCache.get(t._id);
          return pData
            ? pData.staticMs > 0
            : calculateTaskProductivityForDate(
                t,
                selectedDate,
                officeHours,
                Date.now(),
              ) > 0;
        }).length,
        // tasks passed to LiveProductivityCell = all myTasks (productivity includes historical tasks worked today)
        tasks: myTasks,
      };
    });
  }, [
    designers,
    designerTasks,
    designerEodReports,
    selectedDate,
    officeHours,
    productivityCache,
  ]);

  const avgEfficiency = useMemo(() => {
    const totalLoggedAll = teamPerformance.reduce(
      (s, tp) => s + tp.totalLoggedMs,
      0,
    );
    const startTimeStr = officeHours?.startTime ?? "09:00";
    const endTimeStr = officeHours?.endTime ?? "19:00";
    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);
    const totalOfficeMs =
      (endH * 60 + endM - (startH * 60 + startM)) * 60 * 1000;
    return totalOfficeMs > 0 && teamPerformance.length > 0
      ? Math.min(
          100,
          Math.round(
            (totalLoggedAll / (totalOfficeMs * teamPerformance.length)) * 100,
          ),
        )
      : 0;
  }, [teamPerformance, officeHours]);

  // 5.5. Productivity Trend for the last 7 days ending on selectedDate
  const productivityTrendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(subDays(selectedDate, i));
    }

    return {
      labels: days.map((day) => format(day, "d MMM")),
      datasets: designers.map((designer) => {
        // Hoist filtering out of the days loop and use tasksByAssignee index
        const myTasksFromAll = tasksByAssignee[designer._id] || [];
        const designerTasksFromAll = myTasksFromAll.filter((t) => {
          const s = (t.status || "").toLowerCase();
          if (s.includes("reject") || s.includes("cancel")) return false;
          return true;
        });

        const data = days.map((day) => {
          let totalMs = 0;
          designerTasksFromAll.forEach((t) => {
            if (isSameDay(day, selectedDate)) {
              const pData = productivityCache.get(t._id);
              totalMs += pData
                ? pData.staticMs
                : calculateTaskProductivityForDate(
                    t,
                    day,
                    officeHours,
                    Date.now(),
                  );
            } else {
              totalMs += calculateTaskProductivityForDate(
                t,
                day,
                officeHours,
                Date.now(),
              );
            }
          });

          const totalHours = totalMs / (1000 * 60 * 60);
          const mins = Math.round((totalMs / (1000 * 60)) % 60);
          const hrs = Math.floor(totalMs / (1000 * 60 * 60));

          return {
            hours: totalHours,
            formatted: `${hrs}h ${String(mins).padStart(2, "0")}m`,
          };
        });

        return {
          designer,
          data,
        };
      }),
    };
  }, [
    selectedDate,
    designers,
    tasksByAssignee,
    officeHours,
    productivityCache,
  ]);

  // 6. Client Progress
  const clientProgress = useMemo(() => {
    const cp = {};
    designerTasks.forEach((task) => {
      let clientId = task.client;
      if (typeof clientId === "object" && clientId?._id)
        clientId = clientId._id;
      if (!clientId && task.project) {
        const projId =
          typeof task.project === "object" ? task.project._id : task.project;
        const proj = projects?.find((p) => p._id === projId);
        clientId = proj?.client?._id || proj?.client;
      }
      if (!clientId) return;

      if (!cp[clientId]) {
        cp[clientId] = {
          id: clientId,
          pending: 0,
          completed: 0,
          dueToday: 0,
          delayed: 0,
          revision: 0,
        };
      }

      const s = task.status?.toLowerCase() || "";
      const isRejected = s.includes("reject") || s.includes("cancel");
      if (s === "completed" || s.includes("approve")) cp[clientId].completed++;
      else if (!isRejected) {
        cp[clientId].pending++;
        if (s.includes("revision")) cp[clientId].revision++;
        if (task.dueDate) {
          const dueISO = parseISO(task.dueDate);
          if (isSameDay(dueISO, selectedDate)) cp[clientId].dueToday++;
          if (isBefore(startOfDay(dueISO), startOfDay(selectedDate)))
            cp[clientId].delayed++;
        }
      }
    });

    return Object.values(cp).map((c) => {
      const cl = clients?.find((cl) => cl._id === c.id);
      return { ...c, name: cl?.name || cl?.companyName || "Unknown Client" };
    });
  }, [designerTasks, projects, clients, selectedDate]);

  // 7. Delayed Projects/Tasks (Raw active bottlenecks)
  const rawBottleneckTasks = useMemo(() => {
    return designerTasks
      .filter((t) => {
        const s = t.status?.toLowerCase() || "";
        const isActive =
          s !== "completed" &&
          !s.includes("approve") &&
          !s.includes("reject") &&
          !s.includes("cancel");
        return isActive;
      })
      .map((t) => {
        const s = t.status?.toLowerCase() || "";
        let diff = t.dueDate
          ? differenceInDays(
              startOfDay(selectedDate),
              startOfDay(parseISO(t.dueDate)),
            )
          : 0;
        let delayText = "";
        if (s.includes("hold")) {
          delayText = "On Hold";
        } else if (diff === 0) {
          delayText = "Due Today";
        } else if (diff < 0) {
          delayText =
            Math.abs(diff) +
            (Math.abs(diff) === 1 ? " day" : " days") +
            " left";
        } else {
          delayText = diff + (diff === 1 ? " day" : " days") + " delayed";
        }

        let projName = "No Project";
        if (t.project) {
          const pId = typeof t.project === "object" ? t.project._id : t.project;
          const p = projects?.find((x) => x._id === pId);
          projName = p?.name || "Unknown";
        }

        let clientId = t.client;
        let cObj = null;
        if (typeof clientId === "object" && clientId?._id) {
          cObj = clientId;
          clientId = clientId._id;
        }
        if (!clientId && t.project) {
          const pId = typeof t.project === "object" ? t.project._id : t.project;
          const p =
            projects?.find((x) => x._id === pId) ||
            (typeof t.project === "object" ? t.project : null);
          if (p && p.client) {
            clientId = typeof p.client === "object" ? p.client._id : p.client;
            if (typeof p.client === "object") cObj = p.client;
          }
        }
        const cl = clients?.find((c) => c._id === clientId) || cObj;
        const clientName = cl?.name || cl?.companyName || "No Client";

        const creatorObj =
          t.createdBy && typeof t.createdBy === "object"
            ? t.createdBy
            : users?.find((u) => u._id === t.createdBy);
        const creatorName = creatorObj?.name || "Unknown";
        const creatorImage =
          (typeof creatorObj?.profile?.profileImage === "object"
            ? creatorObj?.profile?.profileImage?.url
            : creatorObj?.profile?.profileImage) ||
          (typeof creatorObj?.profileImage === "object"
            ? creatorObj?.profileImage?.url
            : creatorObj?.profileImage) ||
          creatorObj?.profilePic ||
          creatorObj?.avatar ||
          creatorObj?.profile?.profilePic ||
          creatorObj?.profile?.avatar ||
          null;

        const assigneeObj = t.assignedTo
          ? typeof t.assignedTo === "object"
            ? t.assignedTo
            : designers.find((d) => d._id === t.assignedTo) ||
              users?.find((u) => u._id === t.assignedTo)
          : null;
        const assigneeName = assigneeObj?.name || "Unassigned";
        const assigneeImage =
          (typeof assigneeObj?.profile?.profileImage === "object"
            ? assigneeObj?.profile?.profileImage?.url
            : assigneeObj?.profile?.profileImage) ||
          (typeof assigneeObj?.profileImage === "object"
            ? assigneeObj?.profileImage?.url
            : assigneeObj?.profileImage) ||
          assigneeObj?.profilePic ||
          assigneeObj?.avatar ||
          assigneeObj?.profile?.profilePic ||
          assigneeObj?.profile?.avatar ||
          null;

        return {
          ...t,
          projName,
          clientName,
          creatorName,
          creatorImage,
          assigneeName,
          assigneeImage,
          daysDelayed: delayText,
        };
      });
  }, [designerTasks, projects, clients, users, designers]);

  const bottleneckClients = useMemo(() => {
    return [
      "All Clients",
      ...new Set(rawBottleneckTasks.map((t) => t.clientName)),
    ];
  }, [rawBottleneckTasks]);

  const bottleneckCreators = useMemo(() => {
    return [
      "All Creators",
      ...new Set(rawBottleneckTasks.map((t) => t.creatorName)),
    ];
  }, [rawBottleneckTasks]);

  const bottleneckAssignees = useMemo(() => {
    return [
      "All Assignees",
      ...new Set(rawBottleneckTasks.map((t) => t.assigneeName)),
    ];
  }, [rawBottleneckTasks]);

  const bottleneckStatuses = useMemo(() => {
    return [
      "All Statuses",
      ...new Set(rawBottleneckTasks.map((t) => t.status)),
    ].filter(Boolean);
  }, [rawBottleneckTasks]);

  const delayedTasks = useMemo(() => {
    return rawBottleneckTasks.filter((t) => {
      if (
        bottleneckClient !== "All Clients" &&
        t.clientName !== bottleneckClient
      )
        return false;
      if (
        bottleneckCreator !== "All Creators" &&
        t.creatorName !== bottleneckCreator
      )
        return false;
      if (
        bottleneckAssignee !== "All Assignees" &&
        t.assigneeName !== bottleneckAssignee
      )
        return false;
      if (bottleneckStatus !== "All Statuses" && t.status !== bottleneckStatus)
        return false;
      return true;
    });
  }, [
    rawBottleneckTasks,
    bottleneckClient,
    bottleneckCreator,
    bottleneckAssignee,
    bottleneckStatus,
  ]);

  const activeDesigner = useMemo(() => {
    return viewTasksModal.open
      ? teamPerformance.find((p) => p.id === viewTasksModal.designerId)
      : null;
  }, [viewTasksModal.open, viewTasksModal.designerId, teamPerformance]);

  const designerTasksList = useMemo(() => {
    return activeDesigner?.tasks || [];
  }, [activeDesigner]);

  const getTaskCategory = (status = "") => {
    const s = status.toLowerCase();
    if (s === "assigned") return "assigned";
    if (s === "pending") return "pending";
    if (s.includes("progress")) return "inprogress";
    if (s.includes("hold")) return "onhold";
    if (s.includes("review") || s.includes("revision")) return "inreview";
    if (s === "completed" || s.includes("approve")) return "completed";
    return "pending";
  };

  const groupedModalTasks = useMemo(() => {
    const assignedToday = [];
    const carriedForward = [];

    designerTasksList.forEach((task) => {
      const assignmentDate = task.startDate || task.createdAt;
      const isAssignedToday =
        assignmentDate && isSameDay(new Date(assignmentDate), selectedDate);
      if (isAssignedToday) {
        assignedToday.push(task);
      } else {
        carriedForward.push(task);
      }
    });

    return { assignedToday, carriedForward };
  }, [designerTasksList, selectedDate]);

  const activeModalTasksList = useMemo(() => {
    return designerTasksList;
  }, [designerTasksList]);

  const filteredModalTasks = useMemo(() => {
    const filtered = activeModalTasksList.filter((task) => {
      if (taskTab !== "all") {
        const cat = getTaskCategory(task.status);
        if (cat !== taskTab) return false;
      }
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(q);

        let projName = "";
        if (task.project) {
          const pId =
            typeof task.project === "object" ? task.project._id : task.project;
          const p = projects?.find((x) => x._id === pId);
          projName = p?.name || "";
        }
        const projectMatch = projName.toLowerCase().includes(q);

        return titleMatch || projectMatch;
      }
      return true;
    });

    const orderMap = {
      pending: 1,
      assigned: 1,
      inprogress: 2,
      onhold: 3,
      inreview: 4,
      completed: 5,
    };

    return [...filtered].sort((a, b) => {
      const catA = getTaskCategory(a.status);
      const catB = getTaskCategory(b.status);
      const orderA = orderMap[catA] || 99;
      const orderB = orderMap[catB] || 99;
      return orderA - orderB;
    });
  }, [activeModalTasksList, taskTab, taskSearch, projects]);

  const modalTabCounts = useMemo(() => {
    const counts = {
      all: 0,
      assigned: 0,
      pending: 0,
      inprogress: 0,
      onhold: 0,
      inreview: 0,
      completed: 0,
    };
    activeModalTasksList.forEach((task) => {
      counts.all++;
      const cat = getTaskCategory(task.status);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [activeModalTasksList]);

  if (isLoading) {
    return (
      <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full flex items-center justify-center text-slate-400 font-mono text-sm tracking-widest uppercase shadow-inner border border-slate-200 dark:border-slate-800">
        Initializing {targetDept} Board...
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRelativeDateLabel = (date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE");
  };

  // Chart configs and data mapping
  const totalAssignedTasksCount = metrics.tasksAssigned || 0;
  const getPercentageString = (count) => {
    if (totalAssignedTasksCount === 0) return "0%";
    return `${Math.round((count / totalAssignedTasksCount) * 100)}%`;
  };

  const barChartData = {
    labels: [
      "Not Started",
      "In Progress",
      "In Review",
      "Completed",
      "On Hold",
      "Rejected",
    ],
    datasets: [
      {
        label: "Tasks",
        data: [
          metrics.pending,
          metrics.inProgress,
          metrics.inReview,
          metrics.completed,
          metrics.onHold,
          metrics.rejected,
        ],
        backgroundColor: [
          "#f97316", // Pending (Orange)
          "#3b82f6", // In Progress (Blue)
          "#a855f7", // In Review (Purple)
          "#10b981", // Completed (Green)
          "#eab308", // On Hold (Yellow)
          "#ef4444", // Rejected (Red)
        ],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            const percentage = getPercentageString(value);
            return ` ${value} Tasks (${percentage})`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9, weight: "bold" },
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        ticks: {
          stepSize: 1,
          font: { size: 9 },
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  const chartLineColors = [
    "#a855f7",
    "#3b82f6",
    "#10b981",
    "#f97316",
    "#eab308",
    "#ef4444",
    "#06b6d4",
    "#f43f5e",
    "#6366f1",
    "#8b5cf6",
  ];

  const lineChartData = {
    labels: productivityTrendData.labels,
    datasets: productivityTrendData.datasets
      .filter(
        (ds) =>
          trendDesignerFilter === "All Designers" ||
          ds.designer.name === trendDesignerFilter,
      )
      .map((ds, i) => {
        const color = chartLineColors[i % chartLineColors.length];
        return {
          label: ds.designer.name,
          data: ds.data.map((d) => d.hours),
          borderColor: color,
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: false,
        };
      }),
  };

  const lineChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          font: { size: 9 },
          color: isDarkMode ? "#cbd5e1" : "#475569",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dsIndex = context.datasetIndex;
            const index = context.dataIndex;
            const ds = productivityTrendData.datasets[dsIndex];
            const formatted = ds.data[index].formatted;
            return ` ${ds.designer.name}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 8.5,
            weight: "600",
          },
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
      y: {
        min: 0,
        suggestedMax: 8,
        ticks: {
          callback: (value) => `${value}h`,
          font: {
            size: 8.5,
            weight: "600",
          },
          color: isDarkMode ? "#94a3b8" : "#64748b",
          stepSize: 2,
        },
        grid: {
          color: isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.04)",
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  const statusLegendItems = [
    {
      label: "Not Started",
      count: metrics.pending,
      percent: getPercentageString(metrics.pending),
      color: "#f97316",
    },
    {
      label: "In Progress",
      count: metrics.inProgress,
      percent: getPercentageString(metrics.inProgress),
      color: "#3b82f6",
    },
    {
      label: "In Review",
      count: metrics.inReview,
      percent: getPercentageString(metrics.inReview),
      color: "#a855f7",
    },
    {
      label: "Completed",
      count: metrics.completed,
      percent: getPercentageString(metrics.completed),
      color: "#10b981",
    },
    {
      label: "On Hold",
      count: metrics.onHold,
      percent: getPercentageString(metrics.onHold),
      color: "#eab308",
    },
    {
      label: "Rejected",
      count: metrics.rejected,
      percent: getPercentageString(metrics.rejected),
      color: "#ef4444",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0b1120] py-4 md:py-4 px-0 md:px-0 space-y-8 font-sans overflow-visible transition-colors duration-75 relative">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div className="space-y-1 ">
          <h2 className="text-sm lg:text-xl font-black tracking-tight text-slate-800 dark:text-white flex items-center justify-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
              <FiActivity className="text-emerald-600 dark:text-emerald-400 text-xl" />
            </div>
            {targetDept} Board
          </h2>
        </div>

        {/* Date Filter & Navigator Group */}
        <div className="flex items-center gap-2">
          {/* Label indicating Today/Yesterday/Tomorrow */}
          <span className="text-[11px] font-extrabold text-slate-650 dark:text-slate-300 sidebar-bg  px-3.5 py-2.5 rounded-xl shadow-sm tracking-wide">
            {getRelativeDateLabel(selectedDate)}
          </span>

          {/* Date Picker Button */}
          <label className="relative flex items-center gap-2 px-3.5 py-2.5 sidebar-bg rounded-xl text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer transition-all font-bold text-xs">
            <FiCalendar
              className="text-emerald-500 dark:text-emerald-400 shrink-0"
              size={14}
            />
            <span className="min-w-[80px] text-center">
              {format(selectedDate, "MMM dd, yyyy")}
            </span>
            <FiChevronDown className="text-slate-400" size={13} />
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>

          {/* Prev / Next buttons */}
          <div className="flex items-center  rounded-xl overflow-hidden sidebar-bg shadow-sm">
            <button
              onClick={() => setSelectedDate((prev) => subDays(prev, 1))}
              className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <FiChevronLeft size={14} />
            </button>
            <button
              onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
              className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Day"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      {/* Premium Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-2 relative z-10">
        {[
          {
            label:
              user?.role === "admin" || user?.role === "operationmanager"
                ? targetDept.toLowerCase().endsWith("s")
                  ? `Total ${targetDept}`
                  : `Total ${targetDept}s`
                : `Assigned ${targetDept}`,
            value: metrics.designersWorking,
            icon: FiUsers,
            glow: "hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] hover:border-blue-300 dark:hover:border-blue-500",
            bg: "bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40",
            labelColor: "text-blue-700 dark:text-blue-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-blue-100/80 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700/60",
            iconColor: "text-blue-600 dark:text-blue-400",
            onClick: () => {
              performanceTableRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            },
          },
          {
            label: "Assigned",
            value: metrics.tasksAssigned,
            icon: FiLayers,
            glow: "hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:border-indigo-300 dark:hover:border-indigo-500",
            bg: "bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40",
            labelColor: "text-indigo-700 dark:text-indigo-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-indigo-100/80 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700/60",
            iconColor: "text-indigo-600 dark:text-indigo-400",
            onClick: () => handleMetricClick("All"),
          },
          {
            label: "Not Started",
            value: metrics.pending,
            icon: FiClock,
            glow: "hover:shadow-[0_4px_20px_rgba(20,184,166,0.15)] hover:border-teal-300 dark:hover:border-teal-500",
            bg: "bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/40",
            labelColor: "text-teal-700 dark:text-teal-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-teal-100/80 dark:bg-teal-900/50 border border-teal-200 dark:border-teal-700/60",
            iconColor: "text-teal-600 dark:text-teal-400",
            onClick: () => handleMetricClick("Not Started"),
          },
          {
            label: "In Progress",
            value: metrics.inProgress,
            icon: FiPlay,
            glow: "hover:shadow-[0_4px_20px_rgba(14,165,233,0.15)] hover:border-sky-300 dark:hover:border-sky-500",
            bg: "bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-800/40",
            labelColor: "text-sky-700 dark:text-sky-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-sky-100/80 dark:bg-sky-900/50 border border-sky-200 dark:border-sky-700/60",
            iconColor: "text-sky-600 dark:text-sky-400",
            onClick: () => handleMetricClick("In Progress"),
          },
          {
            label: "On Hold",
            value: metrics.onHold,
            icon: FiPauseCircle,
            glow: "hover:shadow-[0_4px_20px_rgba(217,70,239,0.15)] hover:border-fuchsia-300 dark:hover:border-fuchsia-500",
            bg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/20 border border-fuchsia-200/70 dark:border-fuchsia-800/40",
            labelColor: "text-fuchsia-700 dark:text-fuchsia-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-fuchsia-100/80 dark:bg-fuchsia-900/50 border border-fuchsia-200 dark:border-fuchsia-700/60",
            iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
            onClick: () => handleMetricClick("On Hold"),
          },
          {
            label: "In Review",
            value: metrics.inReview,
            icon: FiEye,
            glow: "hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] hover:border-amber-300 dark:hover:border-amber-500",
            bg: "bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40",
            labelColor: "text-amber-700 dark:text-amber-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-amber-100/80 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700/60",
            iconColor: "text-amber-600 dark:text-amber-400",
            onClick: () => handleMetricClick("In Review"),
          },
          {
            label: "Completed",
            value: metrics.completed,
            icon: FiCheckCircle,
            glow: "hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:border-emerald-300 dark:hover:border-emerald-500",
            bg: "bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40",
            labelColor: "text-emerald-700 dark:text-emerald-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-emerald-100/80 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/60",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            onClick: () => handleMetricClick("Completed"),
          },
          {
            label: "Due Tasks",
            value: metrics.dueToday,
            icon: FiCalendar,
            glow: "hover:shadow-[0_4px_20px_rgba(244,63,94,0.15)] hover:border-rose-300 dark:hover:border-rose-500",
            bg: "bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40",
            labelColor: "text-rose-700 dark:text-rose-300",
            valueColor: "text-slate-900 dark:text-white",
            iconBg:
              "bg-rose-100/80 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-700/60",
            iconColor: "text-rose-600 dark:text-rose-400",
            onClick: () => handleMetricClick("Due Today"),
          },
        ].map((m, i) => {
          const IconComponent = m.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={i}
              onClick={m.onClick}
              className={`flex flex-col text-left p-3 rounded-2xl ${m.bg} ${m.glow} relative overflow-hidden group hover:scale-[1.03] transition-all duration-300 backdrop-blur-md shadow-2xs ${m.onClick ? "cursor-pointer" : ""}`}
            >
              {/* Decorative light reflection overlay */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 dark:from-white/5 to-transparent rounded-full -mr-6 -mt-6 blur-md pointer-events-none" />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span
                  className={`text-2xl lg:text-3xl font-black ${m.valueColor} tracking-tight`}
                >
                  {m.value}
                </span>
                <div
                  className={`p-2 rounded-xl ${m.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-2xs`}
                >
                  <IconComponent size={14} className={m.iconColor} />
                </div>
              </div>

              <span
                className={`text-[10px] font-black tracking-wider uppercase mt-1 leading-tight relative z-10 ${m.labelColor}`}
              >
                {m.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Live Task Board Component */}
      <LiveTaskBoard
        designerTasks={designerTasks}
        designers={designers}
        projects={projects}
        clients={clients}
        selectedDate={selectedDate}
        targetDept={targetDept}
      />
      <div className="relative z-10 scroll-mt-6" ref={performanceTableRef}>
        {/* Merged Layout: Team Performance & Today's Productivity (Full Width Single Table) */}
        <div className="sidebar-bg rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col w-full">
          {/* Header */}
          <div className="px-4 py-3 min-h-[58px] border-b border-slate-200 dark:border-slate-800  flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-wide uppercase truncate">
                <span className="text-xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  {targetDept}
                </span>{" "}
                - Team Performance & Today's Productivity
              </h3>
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 tracking-wide truncate block">
                Today's Assigned, Carry Forward & Actual Work Tracker
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg  text-[12px] font-extrabold text-slate-700 dark:text-slate-300">
                <span className="px-1.5 py-0.3 rounded  sidebar-bg text-slate-800 dark:text-slate-200 text-[12px] font-black uppercase">
                  CF
                </span>
                <span>Carry Forward</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-800/40 text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400">
                <span>Office:</span>
                <span>
                  {(() => {
                    const startTimeStr = officeHours?.startTime ?? "09:00";
                    const endTimeStr = officeHours?.endTime ?? "19:00";
                    const s = parseInt(startTimeStr.split(":")[0], 10);
                    const e = parseInt(endTimeStr.split(":")[0], 10);
                    const fmt = (h) => {
                      const ampm = h >= 12 ? "PM" : "AM";
                      const val = h % 12 === 0 ? 12 : h % 12;
                      return `${val} ${ampm}`;
                    };
                    return `${fmt(s)}–${fmt(e)}`;
                  })()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg sidebar-bg border border-slate-200/60 dark:border-slate-800 text-[9px] font-extrabold text-slate-700 dark:text-slate-300">
                <FiCalendar
                  className="text-indigo-500 dark:text-indigo-400 shrink-0"
                  size={14}
                />
                <span className="text-[12px]">
                  {format(selectedDate, "MMM dd")}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse table-auto border border-slate-200 dark:border-[#223149]">
              <thead>
                <tr className="h-[42px] bg-slate-100/90 dark:bg-[#131d2e] border-b border-slate-200 dark:border-[#223149]">
                  <th className="py-2 px-3 align-middle text-[10.5px] font-black tracking-wider text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap min-w-[130px] border-r border-slate-200 dark:border-[#223149]">
                    Designer
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-indigo-700 dark:text-indigo-300 whitespace-nowrap text-center bg-indigo-500/10 dark:bg-indigo-950/40 border-r border-indigo-200/60 dark:border-indigo-900/40">
                    Assigned
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-rose-700 dark:text-rose-300 whitespace-nowrap text-center bg-rose-500/10 dark:bg-rose-950/40 border-r border-rose-200/60 dark:border-rose-900/40">
                    Not Started
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-sky-700 dark:text-sky-300 whitespace-nowrap text-center bg-sky-500/10 dark:bg-sky-950/40 border-r border-sky-200/60 dark:border-sky-900/40">
                    In-progress
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-fuchsia-700 dark:text-fuchsia-300 whitespace-nowrap text-center bg-fuchsia-500/10 dark:bg-fuchsia-950/40 border-r border-fuchsia-200/60 dark:border-fuchsia-900/40">
                    On-Hold
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-amber-700 dark:text-amber-300 whitespace-nowrap text-center bg-amber-500/10 dark:bg-amber-950/40 border-r border-amber-200/60 dark:border-amber-900/40">
                    IN-Review
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-300 whitespace-nowrap text-center bg-emerald-500/10 dark:bg-emerald-950/40 border-r border-emerald-200/60 dark:border-emerald-900/40">
                    Done
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-200 whitespace-nowrap text-center border-r border-slate-200 dark:border-[#223149]">
                    Rev
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-amber-700 dark:text-amber-300 whitespace-nowrap text-center border-r border-slate-200 dark:border-[#223149]">
                    Unproductive Hours
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-300 whitespace-nowrap text-center border-r border-slate-200 dark:border-[#223149]">
                    Productive Hours
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-indigo-700 dark:text-indigo-300 whitespace-nowrap text-center border-r border-slate-200 dark:border-[#223149]">
                    Efficiency
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider uppercase text-rose-700 dark:text-rose-300 whitespace-nowrap text-center border-r border-slate-200 dark:border-[#223149]">
                    Dly
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap text-center border-r border-slate-200 dark:border-[#223149]">
                    Submitted
                  </th>
                  <th className="py-2 px-2 align-middle text-[10.5px] font-black tracking-wider text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1a2538]">
                {teamPerformance.map((tp, idx) => {
                  const isOnline =
                    onlineUserIds.includes(tp.id) ||
                    tp.isOnline ||
                    tp.isUserOnline ||
                    tp.status === "online" ||
                    tp.userStatus === "online";

                  const avatarColors = [
                    "bg-blue-500",
                    "bg-violet-500",
                    "bg-rose-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-cyan-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                  ];
                  const avatarBg = avatarColors[idx % avatarColors.length];

                  const startTimeStr = officeHours?.startTime ?? "09:00";
                  const endTimeStr = officeHours?.endTime ?? "19:00";
                  const [startH, startM] = startTimeStr.split(":").map(Number);
                  const [endH, endM] = endTimeStr.split(":").map(Number);
                  const totalOfficeMs =
                    (endH * 60 + endM - (startH * 60 + startM)) * 60 * 1000;
                  const efficiency =
                    totalOfficeMs > 0
                      ? Math.min(
                          100,
                          Math.round((tp.totalLoggedMs / totalOfficeMs) * 100),
                        )
                      : 0;

                  const efficiencyColor =
                    efficiency >= 80
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black"
                      : efficiency >= 50
                        ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold";

                  const revVal =
                    tp.totalRevisions !== undefined
                      ? tp.totalRevisions
                      : Math.round(tp.avgRevisions || 0);

                  const delayCount = (tp.tasks || []).filter((t) => {
                    const s = (t.status || "").toLowerCase();
                    if (
                      s === "completed" ||
                      s.includes("approve") ||
                      s.includes("reject") ||
                      s.includes("cancel")
                    )
                      return false;
                    if (!t.dueDate) return false;
                    return isBefore(
                      startOfDay(parseISO(t.dueDate)),
                      startOfDay(selectedDate),
                    );
                  }).length;

                  return (
                    <tr
                      key={tp.id}
                      className="h-[44px] hover:bg-slate-50/80 dark:hover:bg-[#162235] transition-colors"
                    >
                      {/* Designer */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-[#1a2538]">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            {tp.profileImage ? (
                              <img
                                src={tp.profileImage}
                                alt={tp.name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                              />
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-full ${avatarBg} text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs`}
                              >
                                {getInitials(tp.name)}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#131d2e] ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                              title={isOnline ? "Online" : "Offline"}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-[#0f172a] dark:text-[#f8fafc] truncate max-w-[115px] leading-tight">
                              {tp.name}
                            </span>
                            <span
                              className={`text-[9px] font-medium leading-none mt-0.5 ${isOnline ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}
                            >
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Today Assigned */}
                      <td className="py-2 px-2 text-center bg-indigo-500/[0.04] dark:bg-indigo-950/20 border-r border-indigo-200/50 dark:border-indigo-900/30">
                        <StatusCellValue
                          todayVal={tp.assigned}
                          carryVal={tp.carryForward?.assigned || 0}
                          activeTextClass="text-indigo-600 dark:text-indigo-300 font-black text-sm"
                          badgeClass="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40"
                        />
                      </td>

                      {/* Pending / Not Started */}
                      <td className="py-2 px-2 text-center bg-rose-500/[0.04] dark:bg-rose-950/20 border-r border-rose-200/50 dark:border-rose-900/30">
                        <StatusCellValue
                          todayVal={tp.pending}
                          carryVal={tp.carryForward?.pending || 0}
                          activeTextClass="text-rose-600 dark:text-rose-400 font-black text-sm"
                          badgeClass="bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40"
                        />
                      </td>

                      {/* In Progress */}
                      <td className="py-2 px-2 text-center bg-sky-500/[0.04] dark:bg-sky-950/20 border-r border-sky-200/50 dark:border-sky-900/30">
                        <StatusCellValue
                          todayVal={tp.inProgress}
                          carryVal={tp.carryForward?.inProgress || 0}
                          activeTextClass="text-sky-600 dark:text-sky-300 font-black text-sm"
                          badgeClass="bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/40"
                          showRunningIndicator={true}
                        />
                      </td>

                      {/* On Hold */}
                      <td className="py-2 px-2 text-center bg-fuchsia-500/[0.04] dark:bg-fuchsia-950/20 border-r border-fuchsia-200/50 dark:border-fuchsia-900/30">
                        <StatusCellValue
                          todayVal={tp.onHold}
                          carryVal={tp.carryForward?.onHold || 0}
                          activeTextClass="text-fuchsia-600 dark:text-fuchsia-300 font-black text-sm"
                          badgeClass="bg-fuchsia-50 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/40"
                        />
                      </td>

                      {/* In Review */}
                      <td className="py-2 px-2 text-center bg-amber-500/[0.04] dark:bg-amber-950/20 border-r border-amber-200/50 dark:border-amber-900/30">
                        <StatusCellValue
                          todayVal={tp.inReview}
                          carryVal={tp.carryForward?.inReview || 0}
                          activeTextClass="text-amber-600 dark:text-amber-300 font-black text-sm"
                          badgeClass="bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/40"
                        />
                      </td>

                      {/* Completed */}
                      <td className="py-2 px-2 text-center bg-emerald-500/[0.04] dark:bg-emerald-950/20 border-r border-emerald-200/50 dark:border-emerald-900/30">
                        <StatusCellValue
                          todayVal={tp.completed}
                          carryVal={tp.carryForward?.completed || 0}
                          activeTextClass="text-emerald-600 dark:text-emerald-300 font-black text-sm"
                          badgeClass="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40"
                        />
                      </td>

                      {/* Revisions */}
                      <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-[#1a2538]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                            revVal === 0
                              ? "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40"
                          }`}
                        >
                          {revVal} rev
                        </span>
                      </td>

                      {/* Unproductive Time */}
                      <td className="py-2 px-2 text-center whitespace-nowrap border-r border-slate-100 dark:border-[#1a2538]">
                        <div className="flex flex-col items-center">
                          <LiveUnproductiveCell
                            tp={tp}
                            selectedDate={selectedDate}
                            officeHours={officeHours}
                            productivityCache={productivityCache}
                          />
                        </div>
                      </td>

                      {/* Productive Time — live when In Progress */}
                      <td className="py-2 px-2 text-center whitespace-nowrap border-r border-slate-100 dark:border-[#1a2538]">
                        <LiveProductivityCell
                          tasks={tp.tasks}
                          initialLoggedMs={tp.totalLoggedMs}
                          selectedDate={selectedDate}
                          officeHours={officeHours}
                          productivityCache={productivityCache}
                        />
                      </td>

                      {/* Efficiency */}
                      <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-[#1a2538]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] shadow-2xs ${efficiencyColor}`}
                        >
                          {efficiency}%
                        </span>
                      </td>

                      {/* Delays */}
                      <td className="py-2 px-1.5 text-center whitespace-nowrap border-r border-slate-100 dark:border-[#1a2538]">
                        {delayCount === 0 ? (
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            0
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-500/40 shadow-3xs whitespace-nowrap">
                            {delayCount} Dly
                          </span>
                        )}
                      </td>

                      {/* Last Submitted */}
                      <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-[#1a2538]">
                        {tp.lastSubmitted === "Not submitted" ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            Nil
                          </span>
                        ) : tp.lastSubmitted === "Draft" ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 animate-pulse">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                            {tp.lastSubmitted}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setViewTasksModal({
                              open: true,
                              designerId: tp.id,
                              designerName: tp.name,
                            });
                            setTaskTab("all");
                            setTaskSearch("");
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/15 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-all cursor-pointer flex items-center justify-center mx-auto shadow-2xs"
                          title="View Performance Tasks"
                        >
                          <FiEye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total row */}
              {teamPerformance.length > 0 &&
                (() => {
                  const totalTasksWorkedOn = teamPerformance.reduce(
                    (s, tp) => s + tp.tasksWorkedOn,
                    0,
                  );
                  const totalLoggedAll = teamPerformance.reduce(
                    (s, tp) => s + tp.totalLoggedMs,
                    0,
                  );
                  const startTimeStr = officeHours?.startTime ?? "09:00";
                  const endTimeStr = officeHours?.endTime ?? "19:00";
                  const [startH, startM] = startTimeStr.split(":").map(Number);
                  const [endH, endM] = endTimeStr.split(":").map(Number);
                  const totalOfficeMs =
                    (endH * 60 + endM - (startH * 60 + startM)) * 60 * 1000;
                  const totalPossibleMs =
                    teamPerformance.length * totalOfficeMs;
                  const avgEfficiency =
                    totalPossibleMs > 0
                      ? Math.min(
                          100,
                          Math.round((totalLoggedAll / totalPossibleMs) * 100),
                        )
                      : 0;

                  const totalRevisionsSum = teamPerformance.reduce((s, tp) => {
                    const revVal =
                      tp.totalRevisions !== undefined
                        ? tp.totalRevisions
                        : Math.round(tp.avgRevisions || 0);
                    return s + revVal;
                  }, 0);

                  const totalBlockerTimeMs = teamPerformance.reduce(
                    (s, tp) => s + tp.blockerTimeMs,
                    0,
                  );
                  const totalBlockerSecs = Math.floor(
                    totalBlockerTimeMs / 1000,
                  );
                  const tbh = Math.floor(totalBlockerSecs / 3600);
                  const tbm = Math.floor((totalBlockerSecs % 3600) / 60);
                  const blockerFmt = tbh > 0 ? `${tbh}h ${tbm}m` : `${tbm}m`;

                  const totalDelaysSum = teamPerformance.reduce((s, tp) => {
                    const dCount = (tp.tasks || []).filter((t) => {
                      const st = (t.status || "").toLowerCase();
                      if (
                        st === "completed" ||
                        st.includes("approve") ||
                        st.includes("reject") ||
                        st.includes("cancel")
                      )
                        return false;
                      if (!t.dueDate) return false;
                      return isBefore(
                        startOfDay(parseISO(t.dueDate)),
                        startOfDay(selectedDate),
                      );
                    }).length;
                    return s + dCount;
                  }, 0);

                  const submittedCount = teamPerformance.filter(
                    (tp) =>
                      tp.lastSubmitted &&
                      tp.lastSubmitted !== "Not submitted" &&
                      tp.lastSubmitted !== "Draft",
                  ).length;
                  const totalUsers = teamPerformance.length;

                  return (
                    <tfoot>
                      <tr className="h-[44px] bg-slate-100 dark:bg-[#131d2e] border-t-2 border-slate-300 dark:border-[#2a3a52] font-black">
                        {/* Designer / Total */}
                        <td className="py-2 px-3 align-middle text-[12px] font-black uppercase tracking-wider text-center border-r border-slate-200 dark:border-[#223149] text-[#0f172a] dark:text-[#f8fafc]">
                          TOTAL
                        </td>

                        {/* Assigned */}
                        <td className="py-2 px-2 align-middle text-center bg-indigo-500/10 dark:bg-indigo-950/40 border-r border-indigo-200/70 dark:border-indigo-900/40">
                          <StatusCellValue
                            todayVal={teamPerformance.reduce(
                              (s, tp) => s + tp.assigned,
                              0,
                            )}
                            carryVal={teamPerformance.reduce(
                              (s, tp) => s + (tp.carryForward?.assigned || 0),
                              0,
                            )}
                            activeTextClass="text-indigo-600 dark:text-indigo-300 font-black text-sm"
                            badgeClass="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40"
                          />
                        </td>

                        {/* Pend */}
                        <td className="py-2 px-2 align-middle text-center bg-rose-500/10 dark:bg-rose-950/40 border-r border-rose-200/70 dark:border-rose-900/40">
                          <StatusCellValue
                            todayVal={teamPerformance.reduce(
                              (s, tp) => s + tp.pending,
                              0,
                            )}
                            carryVal={teamPerformance.reduce(
                              (s, tp) => s + (tp.carryForward?.pending || 0),
                              0,
                            )}
                            activeTextClass="text-rose-600 dark:text-rose-400 font-black text-sm"
                            badgeClass="bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40"
                          />
                        </td>

                        {/* Prog */}
                        <td className="py-2 px-2 align-middle text-center bg-sky-500/10 dark:bg-sky-950/40 border-r border-sky-200/70 dark:border-sky-900/40">
                          <StatusCellValue
                            todayVal={teamPerformance.reduce(
                              (s, tp) => s + tp.inProgress,
                              0,
                            )}
                            carryVal={teamPerformance.reduce(
                              (s, tp) => s + (tp.carryForward?.inProgress || 0),
                              0,
                            )}
                            activeTextClass="text-sky-600 dark:text-sky-300 font-black text-sm"
                            badgeClass="bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/40"
                          />
                        </td>

                        {/* Hold */}
                        <td className="py-2 px-2 align-middle text-center bg-fuchsia-500/10 dark:bg-fuchsia-950/40 border-r border-fuchsia-200/70 dark:border-fuchsia-900/40">
                          <StatusCellValue
                            todayVal={teamPerformance.reduce(
                              (s, tp) => s + tp.onHold,
                              0,
                            )}
                            carryVal={teamPerformance.reduce(
                              (s, tp) => s + (tp.carryForward?.onHold || 0),
                              0,
                            )}
                            activeTextClass="text-fuchsia-600 dark:text-fuchsia-300 font-black text-sm"
                            badgeClass="bg-fuchsia-50 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/40"
                          />
                        </td>

                        {/* Review */}
                        <td className="py-2 px-2 align-middle text-center bg-amber-500/10 dark:bg-amber-950/40 border-r border-amber-200/70 dark:border-amber-900/40">
                          <StatusCellValue
                            todayVal={teamPerformance.reduce(
                              (s, tp) => s + tp.inReview,
                              0,
                            )}
                            carryVal={teamPerformance.reduce(
                              (s, tp) => s + (tp.carryForward?.inReview || 0),
                              0,
                            )}
                            activeTextClass="text-amber-600 dark:text-amber-300 font-black text-sm"
                            badgeClass="bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/40"
                          />
                        </td>

                        {/* Done */}
                        <td className="py-2 px-2 align-middle text-center bg-emerald-500/10 dark:bg-emerald-950/40 border-r border-emerald-200/70 dark:border-emerald-900/40">
                          <StatusCellValue
                            todayVal={teamPerformance.reduce(
                              (s, tp) => s + tp.completed,
                              0,
                            )}
                            carryVal={teamPerformance.reduce(
                              (s, tp) => s + (tp.carryForward?.completed || 0),
                              0,
                            )}
                            activeTextClass="text-emerald-600 dark:text-emerald-300 font-black text-sm"
                            badgeClass="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40"
                          />
                        </td>

                        {/* Revisions */}
                        <td className="py-2 px-2 align-middle text-center border-r border-slate-200 dark:border-[#223149]">
                          <span className="text-[11.5px] font-black text-[#0f172a] dark:text-[#f8fafc]">
                            {totalRevisionsSum} rev
                          </span>
                        </td>

                        {/* Unproductive Time */}
                        <td className="py-2 px-2 align-middle text-center border-r border-slate-200 dark:border-[#223149] whitespace-nowrap">
                          {(() => {
                            const totalMs = teamPerformance.reduce(
                              (acc, tp) => acc + (tp.onHoldTimeMs || 0),
                              0,
                            );
                            if (totalMs === 0) {
                              return (
                                <span className="text-[11.5px] font-bold text-slate-400 dark:text-slate-500">
                                  0m
                                </span>
                              );
                            }
                            const totalMinutes = Math.floor(
                              totalMs / (1000 * 60),
                            );
                            const h = Math.floor(totalMinutes / 60);
                            const m = totalMinutes % 60;
                            return (
                              <span className="text-[11.5px] font-black text-amber-700 dark:text-amber-300">
                                {h > 0 ? `${h}h ${m}m` : `${m}m`}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Productive Time */}
                        <td className="py-2 px-2 align-middle text-center border-r border-slate-200 dark:border-[#223149] whitespace-nowrap">
                          <LiveTotalProductivityCell
                            teamPerformance={teamPerformance}
                            selectedDate={selectedDate}
                            officeHours={officeHours}
                            productivityCache={productivityCache}
                          />
                        </td>

                        {/* Efficiency */}
                        <td className="py-2 px-2 align-middle text-center border-r border-slate-200 dark:border-[#223149]">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-2xs bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {avgEfficiency}%
                          </span>
                        </td>

                        {/* Delays Total */}
                        <td className="py-2 px-1.5 align-middle text-center border-r border-slate-200 dark:border-[#223149] whitespace-nowrap">
                          <span className="text-[11px] font-black text-rose-700 dark:text-rose-300 whitespace-nowrap">
                            {totalDelaysSum > 0
                              ? `${totalDelaysSum} Dly`
                              : "0 Dly"}
                          </span>
                        </td>

                        {/* Submitted */}
                        <td className="py-2 px-2 align-middle text-center border-r border-slate-200 dark:border-[#223149] whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs whitespace-nowrap"
                            title={`${submittedCount} out of ${totalUsers} users submitted report`}
                          >
                            {submittedCount}/{totalUsers}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2 px-2 align-middle text-center text-slate-400" />
                      </tr>
                    </tfoot>
                  );
                })()}
            </table>
          </div>
        </div>
      </div>

      {/* Charts Section: Task Status Distribution + Productivity Trend */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Today's Task Status Distribution */}
        <div className="sidebar-bg backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col p-4">
          <div className="pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white tracking-wide uppercase">
                Today's Task Status Distribution
              </h3>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                Based on Today Assigned
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                {metrics.tasksAssigned}
              </div>
              <div className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Total Tasks
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[170px] relative mt-2">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* RIGHT: Productivity Trend (This Week) */}
        <div className="sidebar-bg backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col p-4">
          <div className="pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white tracking-wide uppercase">
                Productivity Trend
              </h3>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                This Week
              </span>
            </div>
            <div>
              <select
                value={trendDesignerFilter}
                onChange={(e) => setTrendDesignerFilter(e.target.value)}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="All Designers">All Designers</option>
                {designers.map((designer) => (
                  <option key={designer._id} value={designer.name}>
                    {designer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[170px] relative mt-1">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <FiAlertCircle
              size={10}
              className="text-indigo-400 dark:text-indigo-500 shrink-0"
            />
            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
              Productivity is calculated based on actual time worked within
              office hours.
            </span>
          </div>
        </div>
      </div>

      {/* Delayed Projects & Bottlenecks */}
      {(() => {
        const getChartColors = (count) => {
          const baseColors = [
            "rgba(244, 63, 94, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(217, 70, 239, 0.8)",
            "rgba(14, 165, 233, 0.8)",
          ];
          return Array.from(
            { length: count },
            (_, i) => baseColors[i % baseColors.length],
          );
        };

        const assigneeCounts = {};
        const statusCounts = {};

        delayedTasks.forEach((t) => {
          const a = t.assigneeName || "Unassigned";
          const s = t.status || "Unknown";
          assigneeCounts[a] = (assigneeCounts[a] || 0) + 1;
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const assigneeLabels = Object.keys(assigneeCounts);
        const statusLabels = Object.keys(statusCounts);

        const bottleneckAssigneeData = {
          labels: assigneeLabels,
          datasets: [
            {
              data: Object.values(assigneeCounts),
              backgroundColor: getChartColors(assigneeLabels.length).reverse(),
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        };

        const bottleneckStatusData = {
          labels: statusLabels,
          datasets: [
            {
              data: Object.values(statusCounts),
              backgroundColor: getChartColors(statusLabels.length),
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        };

        const bOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: isDarkMode ? "#cbd5e1" : "#475569",
                font: { size: 10, weight: "bold" },
                boxWidth: 10,
                padding: 10,
              },
            },
            tooltip: {
              backgroundColor: isDarkMode
                ? "rgba(15, 23, 42, 0.9)"
                : "rgba(255, 255, 255, 0.95)",
              titleColor: isDarkMode ? "#f8fafc" : "#0f172a",
              bodyColor: isDarkMode ? "#cbd5e1" : "#475569",
              borderColor: isDarkMode
                ? "rgba(51, 65, 85, 0.5)"
                : "rgba(226, 232, 240, 0.8)",
              borderWidth: 1,
              padding: 8,
              boxPadding: 4,
              usePointStyle: true,
            },
          },
          cutout: "65%",
        };

        return (
          <div className="sidebar-bg backdrop-blur-md rounded-2xl  overflow-hidden shadow-sm dark:shadow-xl relative z-10">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
                  <FiAlertCircle className="text-lg" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-widest">
                  Delayed Projects & Bottlenecks
                </h3>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full lg:w-auto">
                {/* Client Filter */}
                <select
                  value={bottleneckClient}
                  onChange={(e) => setBottleneckClient(e.target.value)}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-250 focus:outline-none focus:border-rose-500 transition-all shadow-sm"
                >
                  {bottleneckClients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>

                {/* Creator Filter */}
                <select
                  value={bottleneckCreator}
                  onChange={(e) => setBottleneckCreator(e.target.value)}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-250 focus:outline-none focus:border-rose-500 transition-all shadow-sm"
                >
                  {bottleneckCreators.map((creator) => (
                    <option key={creator} value={creator}>
                      {creator}
                    </option>
                  ))}
                </select>

                {/* Assignee Filter */}
                <select
                  value={bottleneckAssignee}
                  onChange={(e) => setBottleneckAssignee(e.target.value)}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-250 focus:outline-none focus:border-rose-500 transition-all shadow-sm"
                >
                  {bottleneckAssignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={bottleneckStatus}
                  onChange={(e) => setBottleneckStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-700 dark:text-slate-250 focus:outline-none focus:border-rose-500 transition-all shadow-sm"
                >
                  {bottleneckStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {delayedTasks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-b border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/30">
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-center">
                    By Assignee
                  </h4>
                  <div className="h-[160px] relative">
                    <Doughnut
                      data={bottleneckAssigneeData}
                      options={bOptions}
                    />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-center">
                    By Status
                  </h4>
                  <div className="h-[160px] relative">
                    <Doughnut data={bottleneckStatusData} options={bOptions} />
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
              {delayedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-500 dark:text-emerald-400">
                  <FiCheckCircle className="text-4xl mb-3 opacity-50" />
                  <p className="text-sm font-black tracking-widest uppercase">
                    Zero Bottlenecks!
                  </p>
                </div>
              ) : (
                delayedTasks.map((task) => {
                  let projName = "No Project";
                  if (task.project) {
                    const pId =
                      typeof task.project === "object"
                        ? task.project._id
                        : task.project;
                    const p = projects?.find((x) => x._id === pId);
                    projName = p?.name || "Unknown";
                  }

                  const s = task.status?.toLowerCase() || "";
                  let cardStyle =
                    "border-rose-500 bg-rose-50 dark:bg-rose-500/10";
                  let badgeStyle =
                    "bg-rose-100 text-rose-700 border-rose-205 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30";
                  let timeBadgeStyle =
                    "text-rose-600 dark:text-rose-300 bg-white dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30";

                  if (s.includes("hold")) {
                    cardStyle =
                      "border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-500/10";
                    badgeStyle =
                      "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 dark:border-fuchsia-900/30";
                    timeBadgeStyle =
                      "text-fuchsia-600 dark:text-fuchsia-300 bg-white dark:bg-fuchsia-500/20 border border-fuchsia-200 dark:border-fuchsia-500/30";
                  } else if (s.includes("progress")) {
                    cardStyle =
                      "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10";
                    badgeStyle =
                      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
                    timeBadgeStyle =
                      "text-blue-600 dark:text-blue-300 bg-white dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30";
                  } else if (s.includes("review") || s.includes("revision")) {
                    cardStyle =
                      "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-500/10";
                    badgeStyle =
                      "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-450 dark:border-yellow-900/30";
                    timeBadgeStyle =
                      "text-yellow-600 dark:text-yellow-450 bg-white dark:bg-yellow-500/20 border border-yellow-250 dark:border-yellow-500/30";
                  } else if (s.includes("pending") || s.includes("assigned")) {
                    cardStyle =
                      "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10";
                    badgeStyle =
                      "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/30";
                    timeBadgeStyle =
                      "text-orange-655 dark:text-orange-400 bg-white dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30";
                  }

                  // Hash function to get unique soft badge style per client
                  const getClientBadgeStyle = (name) => {
                    const hash = name
                      .split("")
                      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const colors = [
                      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30",
                      "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30",
                      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
                      "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
                      "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/30",
                      "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900/30",
                      "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/30",
                    ];
                    return colors[hash % colors.length];
                  };

                  const clientBadgeColor = getClientBadgeStyle(task.clientName);

                  return (
                    <div
                      key={task._id}
                      className={`flex flex-col md:flex-row md:items-center md:justify-between p-3.5 rounded-xl border-l-4 ${cardStyle} shadow-sm dark:shadow-none transition-all hover:scale-[1.01] hover:shadow-md gap-4`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${clientBadgeColor}`}
                          >
                            {task.clientName}
                          </span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">
                            •
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {projName}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {task.title}
                        </h4>

                        <div className="flex items-center gap-6 mt-3 flex-wrap">
                          {/* Creator */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                              Creator:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {task.creatorImage ? (
                                <img
                                  src={task.creatorImage}
                                  alt={task.creatorName}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[8px] font-black ring-1 ring-slate-300 shrink-0">
                                  {getInitials(task.creatorName)}
                                </div>
                              )}
                              <span className="text-[11px] font-bold text-slate-750 dark:text-slate-300">
                                {task.creatorName}
                              </span>
                            </div>
                          </div>

                          {/* Assignee */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                              Assignee:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {task.assigneeImage ? (
                                <img
                                  src={task.assigneeImage}
                                  alt={task.assigneeName}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-400/40 shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[8px] font-black ring-1 ring-indigo-400/30 shrink-0">
                                  {getInitials(task.assigneeName)}
                                </div>
                              )}
                              <span className="text-[11px] font-bold text-slate-755 dark:text-slate-300">
                                {task.assigneeName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${badgeStyle}`}
                        >
                          {task.status}
                        </span>
                        <div
                          className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${timeBadgeStyle}`}
                        >
                          {task.daysDelayed}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}
      {viewTasksModal.open &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 md:p-6">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity"
              onClick={() => {
                setViewTasksModal({
                  open: false,
                  designerId: null,
                  designerName: "",
                });
                setModalGroupTab("assignedToday");
              }}
            />
            {/* Modal Content Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-6xl h-[92vh] sm:h-[88vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-3.5 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  {activeDesigner?.profileImage ? (
                    <img
                      src={activeDesigner.profileImage}
                      alt={activeDesigner.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">
                      {getInitials(activeDesigner?.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-slate-850 dark:text-white tracking-wide truncate">
                      {activeDesigner?.name}'s Performance Details
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-black font-extrabold text-[9.5px] border border-slate-300/50 dark:border-slate-700">
                        Today: {format(new Date(), "dd MMM yyyy")}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-500 text-white dark:text-white font-extrabold text-[9.5px] border border-red-500/20">
                        Assigned Today: {activeDesigner?.assigned || 0}
                      </span>
                      {(activeDesigner?.overdue || 0) > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[9.5px] border border-rose-500/30 animate-pulse">
                          Overdue: {activeDesigner?.overdue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-48 min-w-[130px]">
                    <input
                      type="text"
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Search task or client..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                    {taskSearch && (
                      <button
                        type="button"
                        onClick={() => setTaskSearch("")}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <FiX size={12} />
                      </button>
                    )}
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={taskTab}
                      onChange={(e) => setTaskTab(e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-extrabold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-750 dark:text-white focus:outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="all">All Tasks</option>
                      <option value="pending">Not Started</option>
                      <option value="inprogress">In Progress</option>
                      <option value="onhold">On Hold</option>
                      <option value="inreview">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setViewTasksModal({
                        open: false,
                        designerId: null,
                        designerName: "",
                      });
                      setModalGroupTab("assignedToday");
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer shrink-0"
                    title="Close"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body Container */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/20 dark:bg-slate-900/10">
                {/* Main Task List Container */}
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0f172a] p-3 sm:p-5 overflow-hidden">
                  <div
                    className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-0 sm:pr-1"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {filteredModalTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <FiLayers
                          size={40}
                          className="mb-3 opacity-30 text-indigo-500"
                        />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                          No tasks found
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold">
                          Try changing your filter tab or search keyword
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* DESKTOP TABLE VIEW (hidden on small mobile screens) */}
                        <div className="hidden md:block border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-2xs bg-white dark:bg-slate-900/30 custom-scrollbar">
                          <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                  Task Title
                                </th>
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                  Client
                                </th>
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                  Created By
                                </th>
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                  Priority
                                </th>
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                  {taskTab === "assigned"
                                    ? "Assigned Date"
                                    : taskTab === "pending"
                                      ? "Pending Since"
                                      : taskTab === "inprogress"
                                        ? "Started At"
                                        : taskTab === "onhold"
                                          ? "Paused At"
                                          : taskTab === "inreview"
                                            ? "Submitted At"
                                            : taskTab === "completed"
                                              ? "Completed At"
                                              : "Due Date"}
                                </th>
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                  Status
                                </th>
                                <th className="py-3 px-4 text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase text-center">
                                  Approval Timeline
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {filteredModalTasks.map((task) => {
                                let clientName = "No Client";
                                if (task.client) {
                                  const cId =
                                    typeof task.client === "object"
                                      ? task.client._id
                                      : task.client;
                                  const c = clients?.find((x) => x._id === cId);
                                  clientName =
                                    c?.companyName ||
                                    c?.name ||
                                    (typeof task.client === "object"
                                      ? task.client.companyName ||
                                        task.client.name
                                      : "Unknown Client");
                                } else if (task.project) {
                                  const pId =
                                    typeof task.project === "object"
                                      ? task.project._id
                                      : task.project;
                                  const p = projects?.find(
                                    (x) => x._id === pId,
                                  );
                                  if (p) {
                                    const cId =
                                      typeof p.client === "object"
                                        ? p.client?._id
                                        : p.client;
                                    const c = clients?.find(
                                      (x) => x._id === cId,
                                    );
                                    clientName =
                                      c?.companyName ||
                                      c?.name ||
                                      (typeof p.client === "object"
                                        ? p.client?.companyName ||
                                          p.client?.name
                                        : "Unknown Client");
                                  }
                                }

                                const getStatusBadgeStyle = (status = "") => {
                                  const s = status.toLowerCase();
                                  if (
                                    s === "completed" ||
                                    s.includes("approve")
                                  ) {
                                    return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 font-black";
                                  }
                                  if (s.includes("hold")) {
                                    return "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 dark:border-fuchsia-900/30 font-black";
                                  }
                                  if (s.includes("progress")) {
                                    return "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/30 font-black";
                                  }
                                  if (
                                    s.includes("review") ||
                                    s.includes("revision")
                                  ) {
                                    return "bg-amber-50 text-amber-800 border border-amber-250 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30 font-black";
                                  }
                                  if (s === "assigned") {
                                    return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 font-black";
                                  }
                                  return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30 font-black";
                                };

                                const creatorObj =
                                  task.createdBy &&
                                  typeof task.createdBy === "object"
                                    ? task.createdBy
                                    : users?.find(
                                        (u) => u._id === task.createdBy,
                                      );
                                const creatorName =
                                  creatorObj?.name || "Unknown";
                                const creatorImage =
                                  (typeof creatorObj?.profile?.profileImage ===
                                  "object"
                                    ? creatorObj?.profile?.profileImage?.url
                                    : creatorObj?.profile?.profileImage) ||
                                  (typeof creatorObj?.profileImage === "object"
                                    ? creatorObj?.profileImage?.url
                                    : creatorObj?.profileImage) ||
                                  creatorObj?.profilePic ||
                                  creatorObj?.avatar ||
                                  null;

                                let targetDate = task.dueDate || task.createdAt;
                                if (taskTab === "assigned")
                                  targetDate = task.createdAt;
                                else if (taskTab === "pending")
                                  targetDate = task.createdAt;
                                else if (taskTab === "inprogress")
                                  targetDate =
                                    task.actualStartTime || task.updatedAt;
                                else if (taskTab === "onhold")
                                  targetDate = task.pausedAt || task.updatedAt;
                                else if (taskTab === "inreview")
                                  targetDate =
                                    task.actualEndTime || task.updatedAt;
                                else if (taskTab === "completed")
                                  targetDate =
                                    task.approvedAt ||
                                    task.completedAt ||
                                    task.actualEndTime ||
                                    task.updatedAt;

                                return (
                                  <tr
                                    key={task._id}
                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-b-0"
                                  >
                                    <td className="py-3 px-4 text-xs font-extrabold text-slate-850 dark:text-slate-100 max-w-xs break-words">
                                      <span className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        {task.title}
                                      </span>
                                      <div className="mt-1.5">
                                        {(() => {
                                          const assignmentDate =
                                            task.startDate || task.createdAt;
                                          const isAssignedToday =
                                            assignmentDate &&
                                            isSameDay(
                                              new Date(assignmentDate),
                                              selectedDate,
                                            );
                                          return (
                                            <span
                                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isAssignedToday ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                                            >
                                              {isAssignedToday
                                                ? "Today Assigned"
                                                : "Carried Forward"}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold bg-slate-100/70 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 shadow-2xs">
                                        <FiBriefcase
                                          size={10}
                                          className="text-slate-400 shrink-0"
                                        />
                                        {clientName}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        {creatorImage ? (
                                          <img
                                            src={creatorImage}
                                            alt={creatorName}
                                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                                            {getInitials(creatorName)}
                                          </div>
                                        )}
                                        <span className="text-[11px] font-bold text-slate-750 dark:text-slate-300">
                                          {creatorName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      {task.priority && (
                                        <span
                                          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${getPriorityStyle(
                                            task.priority,
                                          )}`}
                                        >
                                          {task.priority}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
                                      {targetDate ? (
                                        <div className="flex flex-col gap-0.5">
                                          <span className="flex items-center gap-1 text-[11px]">
                                            <FiClock
                                              size={11}
                                              className="text-slate-400 shrink-0"
                                            />
                                            {(() => {
                                              try {
                                                const isDueDateCol =
                                                  !taskTab ||
                                                  taskTab === "all" ||
                                                  targetDate === task.dueDate;
                                                const d = parseISO(targetDate);
                                                if (
                                                  isDueDateCol &&
                                                  (String(
                                                    targetDate,
                                                  ).includes("00:00:00") ||
                                                    !String(
                                                      targetDate,
                                                    ).includes("T"))
                                                ) {
                                                  d.setHours(17, 30, 0, 0);
                                                }
                                                return format(
                                                  d,
                                                  "MMM dd, h:mm a",
                                                );
                                              } catch (e) {
                                                return "—";
                                              }
                                            })()}
                                          </span>
                                          {task.dueDate &&
                                            (!taskTab ||
                                              taskTab === "all" ||
                                              targetDate === task.dueDate) &&
                                            (() => {
                                              const text = getDeadlineBadgeText(
                                                task.dueDate,
                                                task.status,
                                              );
                                              if (!text) return null;
                                              const isDelayed =
                                                text.includes("overdue");
                                              const isDueToday =
                                                text === "Due Today";
                                              const isCompleted =
                                                text === "Completed";
                                              const colorClass = isCompleted
                                                ? "text-emerald-500 dark:text-emerald-400"
                                                : isDelayed
                                                  ? "text-rose-500 dark:text-rose-400"
                                                  : isDueToday
                                                    ? "text-amber-500 dark:text-amber-400"
                                                    : "text-slate-500 dark:text-slate-400";
                                              return (
                                                <span
                                                  className={`text-[9px] font-bold ${colorClass}`}
                                                >
                                                  {text}
                                                </span>
                                              );
                                            })()}
                                        </div>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex flex-col gap-1">
                                        <span
                                          className={`w-fit px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-wider ${getStatusBadgeStyle(
                                            task.status,
                                          )}`}
                                        >
                                          {task.status || "Not Started"}
                                        </span>
                                        {task.status === "On Hold" &&
                                          (() => {
                                            const hEntry = [
                                              ...(task.statusHistory || []),
                                            ]
                                              .reverse()
                                              .find(
                                                (x) => x.status === "On Hold",
                                              );
                                            if (hEntry && hEntry.reason) {
                                              return (
                                                <span
                                                  className="text-[9px] font-bold text-fuchsia-600 dark:text-fuchsia-400"
                                                  title={hEntry.reason}
                                                >
                                                  {hEntry.reason}
                                                </span>
                                              );
                                            }
                                            return null;
                                          })()}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <ApprovalTimelineCell task={task} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* MOBILE CARD VIEW (Optimized for small touch screens) */}
                        <div className="block md:hidden space-y-3">
                          {filteredModalTasks.map((task) => {
                            let clientName = "No Client";
                            if (task.client) {
                              const cId =
                                typeof task.client === "object"
                                  ? task.client._id
                                  : task.client;
                              const c = clients?.find((x) => x._id === cId);
                              clientName =
                                c?.companyName || c?.name || "Unknown Client";
                            }

                            const creatorObj =
                              task.createdBy &&
                              typeof task.createdBy === "object"
                                ? task.createdBy
                                : users?.find((u) => u._id === task.createdBy);
                            const creatorName = creatorObj?.name || "Unknown";

                            const getStatusBadgeStyle = (status = "") => {
                              const s = status.toLowerCase();
                              if (s === "completed" || s.includes("approve")) {
                                return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 font-black";
                              }
                              if (s.includes("hold")) {
                                return "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 dark:border-fuchsia-900/30 font-black";
                              }
                              if (s.includes("progress")) {
                                return "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/30 font-black";
                              }
                              if (
                                s.includes("review") ||
                                s.includes("revision")
                              ) {
                                return "bg-amber-50 text-amber-800 border border-amber-250 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30 font-black";
                              }
                              return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30 font-black";
                            };

                            let targetDate = task.dueDate || task.createdAt;

                            return (
                              <div
                                key={task._id}
                                className="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col gap-2.5"
                              >
                                {/* Title & Priority */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-col gap-1.5">
                                    <h4 className="text-xs font-black text-slate-850 dark:text-white leading-snug">
                                      {task.title}
                                    </h4>
                                    {(() => {
                                      const assignmentDate =
                                        task.startDate || task.createdAt;
                                      const isAssignedToday =
                                        assignmentDate &&
                                        isSameDay(
                                          new Date(assignmentDate),
                                          selectedDate,
                                        );
                                      return (
                                        <span
                                          className={`w-fit px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isAssignedToday ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                                        >
                                          {isAssignedToday
                                            ? "Today Assigned"
                                            : "Carried Forward"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  {task.priority && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase shrink-0 ${getPriorityStyle(
                                        task.priority,
                                      )}`}
                                    >
                                      {task.priority}
                                    </span>
                                  )}
                                </div>

                                {/* Client & Creator Row */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                    <FiBriefcase size={10} />
                                    {clientName}
                                  </span>
                                  <span className="font-semibold">
                                    By: {creatorName}
                                  </span>
                                </div>

                                {/* Status & Date Row */}
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800">
                                  <div className="flex flex-col gap-1">
                                    <span
                                      className={`w-fit px-2 py-0.5 rounded-md text-[9.5px] uppercase ${getStatusBadgeStyle(
                                        task.status,
                                      )}`}
                                    >
                                      {task.status || "Not Started"}
                                    </span>
                                    {task.status === "On Hold" &&
                                      (() => {
                                        const hEntry = [
                                          ...(task.statusHistory || []),
                                        ]
                                          .reverse()
                                          .find((x) => x.status === "On Hold");
                                        if (hEntry && hEntry.reason) {
                                          return (
                                            <span
                                              className="text-[9px] font-bold text-fuchsia-600 dark:text-fuchsia-400"
                                              title={hEntry.reason}
                                            >
                                              {hEntry.reason}
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                  </div>

                                  {targetDate && (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <FiClock size={10} />
                                        {(() => {
                                          try {
                                            const isDueDateCol =
                                              !taskTab ||
                                              taskTab === "all" ||
                                              targetDate === task.dueDate;
                                            const d = parseISO(targetDate);
                                            if (
                                              isDueDateCol &&
                                              (String(targetDate).includes(
                                                "00:00:00",
                                              ) ||
                                                !String(targetDate).includes(
                                                  "T",
                                                ))
                                            ) {
                                              d.setHours(17, 30, 0, 0);
                                            }
                                            return format(d, "MMM dd, h:mm a");
                                          } catch (e) {
                                            return "—";
                                          }
                                        })()}
                                      </span>
                                      {task.dueDate &&
                                        (!taskTab ||
                                          taskTab === "all" ||
                                          targetDate === task.dueDate) &&
                                        (() => {
                                          const text = getDeadlineBadgeText(
                                            task.dueDate,
                                            task.status,
                                          );
                                          if (!text) return null;
                                          const isDelayed =
                                            text.includes("overdue");
                                          const isDueToday =
                                            text === "Due Today";
                                          const isCompleted =
                                            text === "Completed";
                                          const colorClass = isCompleted
                                            ? "text-emerald-500 dark:text-emerald-400"
                                            : isDelayed
                                              ? "text-rose-500 dark:text-rose-400"
                                              : isDueToday
                                                ? "text-amber-500 dark:text-amber-400"
                                                : "text-slate-500 dark:text-slate-400";
                                          return (
                                            <span
                                              className={`text-[9px] font-bold ${colorClass}`}
                                            >
                                              {text}
                                            </span>
                                          );
                                        })()}
                                    </div>
                                  )}
                                </div>

                                {/* Approval Timeline */}
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-black uppercase text-slate-400">
                                    Timeline:
                                  </span>
                                  <ApprovalTimelineCell task={task} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                  Showing {filteredModalTasks.length}{" "}
                  {filteredModalTasks.length === 1 ? "task" : "tasks"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setViewTasksModal({
                      open: false,
                      designerId: null,
                      designerName: "",
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-black text-xs font-black text-slate-750 dark:text-white transition-all cursor-pointer shadow-2xs"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
      {/* APPROVAL TIMELINE DETAILS OFFCANVAS (SLIDE-OVER FROM RIGHT) */}
      <AnimatePresence>
        {approvalModal.open &&
          createPortal(
            <div className="fixed inset-0 z-[1050] overflow-hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() =>
                  setApprovalModal({ open: false, designerName: "", tasks: [] })
                }
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              />

              <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-[1050]">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-screen max-w-5xl bg-white dark:bg-[#0f111a] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 sm:p-5 px-5 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-[#0c121e] shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setApprovalModal({
                            open: false,
                            designerName: "",
                            tasks: [],
                          })
                        }
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                        title="Close panel"
                      >
                        <FiArrowRight size={18} />
                      </button>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shadow-2xs shrink-0">
                        <FiClock size={18} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-black text-slate-850 dark:text-white tracking-wider truncate">
                          Approval Info
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide truncate">
                          Timestamps for{" "}
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {approvalModal.designerName}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setApprovalModal({
                          open: false,
                          designerName: "",
                          tasks: [],
                        })
                      }
                      className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <FiXCircle size={20} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 custom-scrollbar">
                    {approvalModal.tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <FiAlertCircle size={36} className="opacity-40 mb-2" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          No approval tasks found
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900/40 custom-scrollbar">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">
                                  Task Name
                                </th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">
                                  Client Name
                                </th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">
                                  Created By
                                </th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">
                                  Assignee
                                </th>
                                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">
                                  Start & End Date
                                </th>
                                <th className="py-3 px-4 text-center">
                                  Approval Info
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                              {approvalModal.tasks.map((task) => {
                                const clientObj =
                                  task.project?.client || task.client;
                                let clientName = "No Client";
                                if (clientObj) {
                                  const cId =
                                    typeof clientObj === "object"
                                      ? clientObj._id
                                      : clientObj;
                                  const c = clients?.find((x) => x._id === cId);
                                  clientName =
                                    c?.companyName ||
                                    c?.name ||
                                    (typeof clientObj === "object"
                                      ? clientObj.companyName || clientObj.name
                                      : "Unknown Client");
                                }

                                const creatorObj =
                                  task.createdBy &&
                                  typeof task.createdBy === "object"
                                    ? task.createdBy
                                    : users?.find(
                                        (u) => u._id === task.createdBy,
                                      );
                                const creatorName =
                                  creatorObj?.name || "Unknown";

                                const assigneeObj =
                                  task.assignedTo &&
                                  typeof task.assignedTo === "object"
                                    ? task.assignedTo
                                    : designers.find(
                                        (d) => d._id === task.assignedTo,
                                      ) ||
                                      users?.find(
                                        (u) => u._id === task.assignedTo,
                                      );
                                const assigneeName =
                                  assigneeObj?.name || "Unassigned";

                                return (
                                  <tr
                                    key={task._id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                  >
                                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-850 dark:text-white">
                                      {task.title}
                                    </td>
                                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-650 dark:text-slate-350">
                                      {clientName}
                                    </td>
                                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-350">
                                      {creatorName}
                                    </td>
                                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-350">
                                      {assigneeName}
                                    </td>
                                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-500 dark:text-slate-400">
                                      {task.startDate
                                        ? format(
                                            parseISO(task.startDate),
                                            "dd MMM yyyy",
                                          )
                                        : "—"}
                                      <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                                        to
                                      </span>
                                      {task.dueDate
                                        ? format(
                                            parseISO(task.dueDate),
                                            "dd MMM yyyy",
                                          )
                                        : "—"}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <ApprovalTimelineCell task={task} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card Stack */}
                        <div className="block md:hidden space-y-3">
                          {approvalModal.tasks.map((task) => {
                            const clientObj =
                              task.project?.client || task.client;
                            let clientName = "No Client";
                            if (clientObj) {
                              const cId =
                                typeof clientObj === "object"
                                  ? clientObj._id
                                  : clientObj;
                              const c = clients?.find((x) => x._id === cId);
                              clientName =
                                c?.companyName || c?.name || "Unknown Client";
                            }

                            return (
                              <div
                                key={task._id}
                                className="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 shadow-2xs"
                              >
                                <h4 className="text-xs font-black text-slate-850 dark:text-white">
                                  {task.title}
                                </h4>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                  <span>Client: {clientName}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                  <span className="text-[10px] font-black uppercase text-slate-400">
                                    Approval Details:
                                  </span>
                                  <ApprovalTimelineCell task={task} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setApprovalModal({
                          open: false,
                          designerName: "",
                          tasks: [],
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-black text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>,
            document.body,
          )}
      </AnimatePresence>
    </div>
  );
};

export default GraphicDesignerDashboard;
