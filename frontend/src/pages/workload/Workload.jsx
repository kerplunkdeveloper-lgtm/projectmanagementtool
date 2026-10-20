import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  FiSearch,
  FiGrid,
  FiList,
  FiPlus,
  FiCheck,
  FiLayers,
  FiFilter,
  FiUserCheck,
  FiTag,
  FiSend,
  FiTrendingUp,
  FiExternalLink,
} from "react-icons/fi";
import { LuPalette, LuVideo, LuFlame, LuBuilding2, LuSparkles } from "react-icons/lu";

import { getUsers } from "../../features/users/userSlice";
import { getClients } from "../../features/clients/clientslice";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../features/api/apiSlice";
import ClientBadge from "../../components/common/ClientBadge";
import toast from "react-hot-toast";

// ==========================================
// PURE UTILITIES & OPTIMIZED CACHED HELPERS
// ==========================================

// High-speed date string extractor (O(1) string slice for ISO strings)
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

// Safe extractor for task creation date matching the user's local timezone (YYYY-MM-DD)
const getTaskCreatedDateKey = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return typeof val === "string" ? val.slice(0, 10) : "";
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return typeof val === "string" ? val.slice(0, 10) : "";
  }
};

// Compute day work boundaries once per selected date instead of per task
const getDayWorkContext = (selectedDate, officeHours = { startTime: "09:00", endTime: "19:00" }) => {
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
 * High-performance task productivity calculation using precomputed day bounds & for-loops
 */
const calculateTaskProductivityForDate = (task, ctx, nowMs = Date.now()) => {
  if (!task || !ctx) return 0;
  const { dayWorkStart, dayWorkEnd, selDateStr, isSelectedToday } = ctx;

  if (dayWorkStart > nowMs) return 0;

  let subtasksDuration = 0;
  if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
    for (let i = 0; i < task.subtasks.length; i++) {
      subtasksDuration += calculateTaskProductivityForDate(task.subtasks[i], ctx, nowMs);
    }
  }

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
        return Math.max(0, historyDuration + liveWorked) + subtasksDuration;
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
      new Date(task.actualEndTime || nowMs).getTime() - taskStart
    );
    const ratio = daySpan / lifetimeSpan;
    dayPausedMs = Math.min(daySpan, totalPaused * ratio);
  }

  return Math.max(0, daySpan - dayPausedMs) + subtasksDuration;
};

// Formatter helper for duration in hours and minutes
const formatMsToHoursMinutes = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Formatter cache for assigned dates
const assignedDateCache = new Map();
const formatTaskAssignedDate = (task) => {
  const dateVal = task.createdAt || task.startDate || task.assignedDate;
  if (!dateVal) return null;
  const key = String(dateVal);
  if (assignedDateCache.has(key)) return assignedDateCache.get(key);
  try {
    const d = typeof dateVal === "string" ? parseISO(dateVal) : new Date(dateVal);
    const res = format(d, "MMM dd, yyyy");
    if (assignedDateCache.size > 1500) assignedDateCache.clear();
    assignedDateCache.set(key, res);
    return res;
  } catch (err) {
    return null;
  }
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
};

// Fast helper to resolve client display name and brand color for task badges in Workload Card
const getTaskClientInfo = (task) => {
  if (!task) return { name: "", color: "" };
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
  return { name, color };
};

const DEPARTMENT_TABS = [
  { id: "Graphic Designer", label: "Graphic Designer", icon: LuPalette, emoji: "🎨" },
  { id: "Cinematographer", label: "Cinematographer", icon: LuVideo, emoji: "🎬" },
];

// ==========================================
// MEMOIZED WORKLOAD TABLE / LIST VIEW
// ==========================================
const WorkloadTableView = React.memo(({
  workloads,
  expandedUserIds,
  onToggleExpand,
  onViewTask,
  selectedDepartment,
}) => {
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-[#131b2e]/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4">Team Member</th>
              <th className="py-3.5 px-4">Live Status & Current Task</th>
              <th className="py-3.5 px-4 min-w-[190px]">Capacity (Max 8)</th>
              <th className="py-3.5 px-4">Tasks Breakdown</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {workloads.map((workload) => {
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
                cardTheme,
                availability,
              } = workload;

              const isExpanded = expandedUserIds.has(member._id);

              return (
                <React.Fragment key={member._id}>
                  <tr
                    className={`transition-colors group ${
                      cardTheme.isOverloaded
                        ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30"
                        : "hover:bg-slate-50/80 dark:hover:bg-[#131b2e]/60"
                    }`}
                  >
                    {/* 1. Member Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {member.profile?.profileImage?.url ? (
                            <img
                              src={member.profile.profileImage.url}
                              alt={member.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-2xs">
                              {member.name ? member.name.substring(0, 2) : "TM"}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0f172a] ${
                              isOnline ? "bg-emerald-500 shadow-xs" : "bg-slate-400 dark:bg-slate-600"
                            }`}
                            title={isOnline ? "Online Now" : "Offline"}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {member.name}
                          </h4>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {member.department || (selectedDepartment === "Cinematographer" ? "Cinematographer" : "Graphic Designer")}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Live Status & Current Task Column */}
                    <td className="py-3 px-4 max-w-[260px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${availability.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${availability.dotClass}`} />
                            {availability.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                        {activeTasks.length > 0 ? (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                            <FiPlay size={11} className="animate-pulse shrink-0" />
                            <span className="truncate" title={activeTasks[0]?.title}>
                              {activeTasks[0]?.title}
                            </span>
                          </div>
                        ) : onHoldTasks.length > 0 ? (
                          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
                            <FiPauseCircle size={12} className="shrink-0" />
                            <span>Tasks paused / on break</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block">
                            Available • Ready for tasks
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Capacity (8 Slots) Column */}
                    <td className="py-3 px-4">
                      <div className="space-y-1.5 max-w-[190px]">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={`font-black ${cardTheme.capacityTextColor}`}>
                            {totalActiveTasksCount} / {maxCapacityTasks} Tasks
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {taskUtilizationPercent}%
                          </span>
                        </div>
                        {/* 8-slot meter */}
                        <div className="grid grid-cols-8 gap-1 py-0.5">
                          {Array.from({ length: maxCapacityTasks }).map((_, index) => {
                            const isFilled = index < totalActiveTasksCount;
                            return (
                              <div
                                key={index}
                                className={`h-2.5 rounded-full transition-all duration-200 ${
                                  isFilled ? cardTheme.slotFilledColor : cardTheme.slotEmptyColor
                                }`}
                                title={`Slot ${index + 1}: ${isFilled ? "Occupied" : "Free"}`}
                              />
                            );
                          })}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cardTheme.badgeBg}`}>
                          {cardTheme.statusTag}
                        </span>
                      </div>
                    </td>

                    {/* 4. Tasks Breakdown Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]"
                          title="In Progress"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{activeTasks.length} In Progress</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-extrabold text-[11px]"
                          title="On Hold"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>{onHoldTasks.length} On Hold</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]"
                          title="Not Started"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{pendingTasks.length} Not Started</span>
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(member._id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isExpanded
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                        }`}
                      >
                        <FiBriefcase size={13} />
                        <span>Tasks ({displayTasks.length})</span>
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Task Details Accordion Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/70 dark:bg-[#0a0f1d]/60 border-b border-slate-200/80 dark:border-slate-800/80">
                      <td colSpan={5} className="p-4 pl-12">
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2">
                          <div className="flex items-center justify-between pb-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>Assigned Active Tasks for {member.name}:</span>
                            <span className="text-[11px] font-normal">
                              Only In Progress, On Hold, and Not Started tasks shown
                            </span>
                          </div>

                          {sortedDisplayTasks.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-[#111827] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              No active tasks assigned currently.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {sortedDisplayTasks.map((task) => (
                                <div
                                  key={task._id}
                                  className="bg-white dark:bg-[#111827] rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors shadow-2xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    {task.assignedDateFormatted ? (
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                        <FiCalendar size={11} className="text-indigo-500 shrink-0" />
                                        <span>{task.assignedDateFormatted}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Active Task</span>
                                    )}
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getStatusBadgeClass(
                                        task.status
                                      )}`}
                                    >
                                      {task.status}
                                    </span>
                                  </div>

                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug line-clamp-2">
                                      {task.title}
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => onViewTask(task)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                                      title="View Task Details"
                                    >
                                      <FiEye size={13} />
                                    </button>
                                  </div>

                                  {task.workedTodayMs > 0 && (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <FiClock size={11} />
                                        Today Productivity:
                                      </span>
                                      <span className="font-black text-slate-800 dark:text-slate-200">
                                        {formatMsToHoursMinutes(task.workedTodayMs)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ==========================================
// MEMOIZED WORKLOAD CARD COMPONENT (GRID VIEW)
// ==========================================
const WorkloadCard = React.memo(({
  workload,
  isExpanded,
  onToggleExpand,
  onViewTask,
  selectedDepartment,
}) => {
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
    cardTheme,
    availability,
  } = workload;

  return (
    <div
      className={`${cardTheme.cardBg} ${cardTheme.cardBorder} ${cardTheme.cardRing} rounded-2xl border shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full relative`}
    >
      {/* Top Dynamic Ambient Indicator Bar */}
      <div
        className={`h-1.5 w-full transition-all duration-300 ${
          cardTheme.isOverloaded
            ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 animate-pulse"
            : totalActiveTasksCount >= maxCapacityTasks
            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
            : totalActiveTasksCount >= 6
            ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
            : "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
        }`}
      />

      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Top: Avatar, Info & Online / Activity Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              {member.profile?.profileImage?.url ? (
                <img
                  src={member.profile.profileImage.url}
                  alt={member.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white font-black text-sm flex items-center justify-center ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-xs uppercase">
                  {member.name ? member.name.substring(0, 2) : "TM"}
                </div>
              )}

              {/* Real-time Online Indicator with Live Pulse */}
              {isOnline ? (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </span>
              ) : (
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-400 dark:bg-slate-600"
                  title="Offline"
                />
              )}
            </div>

            <div className="min-w-0">
              <h3
                className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                title={member.name}
              >
                {member.name}
              </h3>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 truncate">
                  <span>{selectedDepartment === "Cinematographer" ? "🎬" : "🎨"}</span>
                  <span className="truncate">
                    {member.department || (selectedDepartment === "Cinematographer" ? "Cinematographer" : "Graphic Designer")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Online / Activity & Productivity Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1e293b]/70 dark:text-slate-400 dark:border-slate-700/60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-slate-500"
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

            {/* Tracked Time Today */}
            {workedMs > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60 shadow-2xs"
                title="Total Time Worked Today"
              >
                <FiClock size={10} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{formatMsToHoursMinutes(workedMs)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Active Task Live Strip (Fixed height for clean baseline alignment with quick view action) */}
        <div className="h-12 flex items-center">
          {activeTasks.length > 0 ? (
            <div className="w-full h-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                  <FiPlay className="animate-pulse" size={13} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      Active Task
                    </span>
                    {(() => {
                      const clientInfo = getTaskClientInfo(activeTasks[0]);
                      if (!clientInfo.name) return null;
                      return (
                        <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 truncate max-w-[120px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: clientInfo.color || "#10b981" }} />
                          {clientInfo.name}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate block text-xs mt-0.5" title={activeTasks[0]?.title}>
                    {activeTasks[0]?.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTask(activeTasks[0]);
                }}
                className="shrink-0 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer hover:scale-105"
                title="Quick View Task Details"
              >
                <FiEye size={12} />
              </button>
            </div>
          ) : onHoldTasks.length > 0 ? (
            <div className="w-full h-full p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-2.5 text-xs text-amber-800 dark:text-amber-300 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FiPauseCircle size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block leading-tight">
                    On Hold / Paused
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-xs mt-0.5" title={onHoldTasks[0]?.title}>
                    {onHoldTasks[0]?.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTask(onHoldTasks[0]);
                }}
                className="shrink-0 p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer hover:scale-105"
                title="View Paused Task"
              >
                <FiEye size={12} />
              </button>
            </div>
          ) : (
            <div className="w-full h-full p-2.5 rounded-xl bg-slate-50/90 dark:bg-[#1a2234]/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <LuSparkles size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block leading-tight">
                  Ready For Work
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  0 active tasks • Open for new assignments
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Capacity Box */}
        <div className={`${cardTheme.meterBg} p-3.5 rounded-2xl border space-y-2.5 transition-colors shadow-2xs`}>
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-bold">
              <FiBriefcase className={cardTheme.isOverloaded ? "text-rose-500" : "text-indigo-500 dark:text-indigo-400"} size={14} />
              Task Capacity (Max {maxCapacityTasks})
            </span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-black bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 ${cardTheme.capacityTextColor}`}>
              {totalActiveTasksCount} / {maxCapacityTasks} Tasks ({taskUtilizationPercent}%)
            </span>
          </div>

          {/* 8-Slot Visual Segmented Bar - High UX Pill Capsules */}
          <div className="grid grid-cols-8 gap-1.5 py-0.5">
            {Array.from({ length: maxCapacityTasks }).map((_, index) => {
              const isFilled = index < totalActiveTasksCount;
              return (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all duration-300 relative group/slot ${
                    isFilled
                      ? `${cardTheme.slotFilledColor} shadow-xs ring-1 ring-white/20`
                      : "bg-slate-200/90 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/50"
                  }`}
                  title={`Slot ${index + 1}: ${isFilled ? "Occupied" : "Free"}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5 gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${cardTheme.badgeBg} shadow-2xs`}>
              {cardTheme.statusTag}
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {cardTheme.isOverloaded
                ? `Exceeded by ${totalActiveTasksCount - maxCapacityTasks}`
                : `${Math.max(0, maxCapacityTasks - totalActiveTasksCount)} slot${maxCapacityTasks - totalActiveTasksCount === 1 ? "" : "s"} left`}
            </span>
          </div>
        </div>

        {/* 3-Column Task Counters with Micro-interactions */}
        <div className="grid grid-cols-3 gap-2.5 pt-0.5">
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 text-center hover:scale-[1.02] transition-transform duration-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <FiPlay size={10} className="shrink-0" />
              <span>In Progress</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
              {activeTasks.length}
            </div>
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 text-center hover:scale-[1.02] transition-transform duration-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <FiPauseCircle size={10} className="shrink-0" />
              <span>On Hold</span>
            </div>
            <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-0.5">
              {onHoldTasks.length}
            </div>
          </div>

          <div className="bg-slate-100/90 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center hover:scale-[1.02] transition-transform duration-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <FiClock size={10} className="shrink-0" />
              <span>Not Started</span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
              {pendingTasks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Expand Assigned Tasks Toggle */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0a0f1d]/50 p-3">
        <button
          onClick={() => onToggleExpand(member._id)}
          className="w-full flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FiBriefcase size={14} />
            <span>{isExpanded ? "Hide Tasks" : "View Tasks"}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              {displayTasks.length}
            </span>
          </span>
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </div>
        </button>

        {/* Expanded Task List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2.5 mt-2 border-t border-slate-200/60 dark:border-slate-800/80 max-h-72 overflow-y-auto space-y-2 pr-1"
            >
              {sortedDisplayTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No active tasks (In Progress, On Hold, or Not Started) assigned.
                </div>
              ) : (
                sortedDisplayTasks.map((task) => {
                  const clientInfo = getTaskClientInfo(task);
                  return (
                    <div
                      key={task._id}
                      className="bg-white dark:bg-[#111827] rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors shadow-2xs group/task"
                    >
                      {/* Top Bar: Client & Priority & Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Client Badge */}
                        {clientInfo.name ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 max-w-[140px] truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: clientInfo.color || "#6366f1" }}
                            />
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate">
                              {clientInfo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            General Task
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          {task.priority && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadgeClass(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>

                      {/* Task Name & Quick View */}
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug group-hover/task:text-indigo-600 dark:group-hover/task:text-indigo-400 transition-colors">
                          {task.title}
                        </h5>
                        <button
                          type="button"
                          onClick={() => onViewTask(task)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 shrink-0 cursor-pointer transition-colors"
                          title="View Task Details"
                        >
                          <FiEye size={13} />
                        </button>
                      </div>

                      {/* Bottom Info: Assigned Date & Productivity */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400">
                        {task.assignedDateFormatted ? (
                          <span className="flex items-center gap-1 font-semibold">
                            <FiCalendar size={11} className="text-indigo-500 shrink-0" />
                            <span>
                              Assigned: <strong className="text-slate-800 dark:text-slate-200">{task.assignedDateFormatted}</strong>
                            </span>
                          </span>
                        ) : (
                          <span />
                        )}

                        {task.workedTodayMs > 0 && (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <FiClock size={11} />
                            <span>Today: {formatMsToHoursMinutes(task.workedTodayMs)}</span>
                          </span>
                        )}
                      </div>
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
});

// ==========================================
// MEMOIZED TASK PREVIEW MODAL
// ==========================================
const TaskPreviewModal = React.memo(({ task, onClose }) => {
  if (!task) return null;

  return (
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
            onClick={onClose}
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
              {task.title}
            </p>
          </div>

          {task.client && (
            <div>
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Client
              </label>
              <ClientBadge client={task.client} size="md" />
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
                    task.status
                  )}`}
                >
                  {task.status}
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
                    task.priority
                  )}`}
                >
                  {task.priority || "Medium"}
                </span>
              </div>
            </div>
          </div>

          {task.description && (
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Description
              </label>
              <p className="text-slate-700 dark:text-slate-200 mt-1 bg-slate-50 dark:bg-[#1e293b]/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/70 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
});

// ==========================================
// WORKLOAD SKELETON LOADER (ZERO JANK UI)
// ==========================================
const WorkloadSkeleton = ({ viewMode = "table" }) => {
  if (viewMode === "table") {
    return (
      <div className="bg-white dark:bg-[#0f172a]/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden animate-pulse">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-1/4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#0f172a]/95 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="h-9 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-50 dark:bg-slate-800/30 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

// ==========================================
// WORKLOAD TASK INLINE ENTRY & ALLOCATION TABLE (AUTOSAVE)
// ==========================================
const WorkloadTaskTable = ({
  tasks = [],
  users = [],
  clients = [],
  selectedDepartment = "Graphic Designer",
  currentUser,
  onViewTask,
  createTaskMutation,
  updateTaskMutation,
  refetchTasks,
}) => {
  // Active logged in user & Admin read-only detection
  const activeUser =
    currentUser ||
    (() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })();
  const activeUserId = (activeUser?._id || activeUser?.id)?.toString();
  const userRole = (activeUser?.role || "").toLowerCase().trim();
  const isAdmin =
    userRole === "admin" ||
    userRole === "operationmanager" ||
    userRole === "operation manager";

  // Inline New Task Entry State
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [isSavingNew, setIsSavingNew] = useState(false);
  const newTitleInputRef = useRef(null);

  // Editable Titles for Existing Rows: { [taskId]: string }
  const [editingTitles, setEditingTitles] = useState({});

  // Briefly track which row was just autosaved for visual checkmark: taskId
  const [savedRowId, setSavedRowId] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Table Filters State
  const todayDateStr = useMemo(() => getTaskCreatedDateKey(new Date()), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCreatedDate, setFilterCreatedDate] = useState(() => getTaskCreatedDateKey(new Date()));
  const [filterClient, setFilterClient] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterSmm, setFilterSmm] = useState("all");
  const [filterDept, setFilterDept] = useState("current"); // "current" | "all"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Priority definitions with distinct modern styling
  const PRIORITY_OPTIONS = useMemo(
    () => [
      {
        id: "Top High",
        label: "Top High",
        icon: "🔥",
        pillClass: "bg-rose-500 text-white font-extrabold shadow-xs shadow-rose-500/20",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60",
      },
      {
        id: "High",
        label: "High",
        icon: "⚡",
        pillClass: "bg-amber-500 text-white font-bold shadow-xs shadow-amber-500/20",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60",
      },
      {
        id: "Medium",
        label: "Medium",
        icon: "🔷",
        pillClass: "bg-sky-500 text-white font-bold shadow-xs shadow-sky-500/20",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60",
      },
      {
        id: "Low",
        label: "Low",
        icon: "🟢",
        pillClass: "bg-emerald-600 text-white font-medium shadow-xs shadow-emerald-500/20",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60",
      },
    ],
    []
  );

  // Map users by string ID for instant O(1) lookups
  const usersMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (u?._id) map.set(u._id.toString(), u);
    });
    return map;
  }, [users]);

  // Map clients by string ID
  const clientsMap = useMemo(() => {
    const map = new Map();
    (clients || []).forEach((c) => {
      if (c?._id) map.set(c._id.toString(), c);
    });
    return map;
  }, [clients]);

  // Social Media Managers list
  const smmList = useMemo(() => {
    const smms = (users || []).filter((u) => {
      if (u.employmentStatus === "relieved") return false;
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      const desig = (u.designation || "").toLowerCase().trim();
      return (
        dept.includes("social media") ||
        dept.includes("smm") ||
        role.includes("social media") ||
        role.includes("smm") ||
        role === "socialmediamanager" ||
        desig.includes("social media") ||
        desig.includes("smm")
      );
    });

    if (smms.length > 0) return smms;

    return (users || []).filter(
      (u) =>
        u.employmentStatus !== "relieved" &&
        (u.role === "admin" || u.role === "operationmanager")
    );
  }, [users]);

  // Assignee options list (Graphic Designers and Cinematographers)
  const assigneeList = useMemo(() => {
    const isCinema = selectedDepartment === "Cinematographer";
    const deptMembers = (users || []).filter((u) => {
      if (u.employmentStatus === "relieved") return false;
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      if (isCinema) {
        return (
          dept.includes("cinema") ||
          dept.includes("video") ||
          dept.includes("edit") ||
          dept.includes("shoot") ||
          dept.includes("camera") ||
          role.includes("cinema") ||
          role.includes("video") ||
          role.includes("cinematog")
        );
      }
      return (
        dept.includes("graphic") ||
        dept.includes("design") ||
        dept === "designer" ||
        role.includes("designer") ||
        role === "graphic designer"
      );
    });

    return deptMembers.length > 0
      ? deptMembers
      : (users || []).filter((u) => u.employmentStatus !== "relieved");
  }, [users, selectedDepartment]);

  // Inline new task defaults to empty ("Select Assignee" and "Select Client")

  // Helper to resolve task SMM / Creator with full user profile from usersMap
  const getTaskSmm = useCallback(
    (t) => {
      let creatorId = null;
      if (t.createdBy) {
        creatorId = (typeof t.createdBy === "object" ? t.createdBy?._id : t.createdBy)?.toString();
      }
      if (!creatorId) {
        const cObj = typeof t.client === "object" ? t.client : clientsMap.get(t.client?.toString());
        if (cObj?.assignedTo) {
          const list = Array.isArray(cObj.assignedTo) ? cObj.assignedTo : [cObj.assignedTo];
          const first = list.find(Boolean);
          if (first) {
            creatorId = (typeof first === "object" ? first._id : first)?.toString();
          }
        }
      }

      if (creatorId) {
        const fullCreator = usersMap.get(creatorId);
        if (fullCreator) {
          return typeof t.createdBy === "object" ? { ...t.createdBy, ...fullCreator } : fullCreator;
        }
      }

      if (typeof t.createdBy === "object" && t.createdBy?.name) {
        return t.createdBy;
      }
      return null;
    },
    [usersMap, clientsMap]
  );

  // Helper to resolve task Client
  const getTaskClient = useCallback(
    (t) => {
      // 1. Direct client object if already populated
      if (t.client && typeof t.client === "object" && (t.client.companyName || t.client.name)) {
        return t.client;
      }
      // 2. Client from project.client
      if (t.project && typeof t.project === "object") {
        if (t.project.client && typeof t.project.client === "object" && (t.project.client.companyName || t.project.client.name)) {
          return t.project.client;
        }
        if (t.project.client) {
          const c = clientsMap.get(t.project.client.toString());
          if (c) return c;
        }
      }
      // 3. Client from direct client id string
      if (t.client) {
        const cId = typeof t.client === "object" ? t.client._id : t.client;
        const c = clientsMap.get(cId?.toString());
        if (c) return c;
      }
      // 4. Client from subtasks
      if (t.subtasks && Array.isArray(t.subtasks)) {
        for (const sub of t.subtasks) {
          if (sub.client) {
            const subCId = typeof sub.client === "object" ? sub.client._id : sub.client;
            const c =
              typeof sub.client === "object" && (sub.client.companyName || sub.client.name)
                ? sub.client
                : clientsMap.get(subCId?.toString());
            if (c) return c;
          }
        }
      }
      // 5. Match by clientName string against clients list
      if (t.clientName) {
        const found = clients.find(
          (c) => c.companyName?.trim().toLowerCase() === t.clientName.trim().toLowerCase()
        );
        if (found) return found;
        return { companyName: t.clientName, color: t.clientColor || "#6366f1" };
      }
      return null;
    },
    [clients, clientsMap]
  );

  // Helper to resolve task Assignee with full user profile from usersMap
  const getTaskAssignee = useCallback(
    (t) => {
      if (!t.assignedTo) return null;
      const aId = (typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo)?.toString();
      if (aId) {
        const fullAssignee = usersMap.get(aId);
        if (fullAssignee) {
          return typeof t.assignedTo === "object" ? { ...t.assignedTo, ...fullAssignee } : fullAssignee;
        }
      }
      return typeof t.assignedTo === "object" ? t.assignedTo : null;
    },
    [usersMap]
  );

  // Helper to extract user profile image URL
  const getUserAvatarUrl = useCallback(
    (u) => {
      if (!u) return null;
      const uId = (typeof u === "object" ? u._id : u)?.toString();
      const fromMap = uId ? usersMap.get(uId) : null;
      const target = fromMap || u;

      const url =
        target?.profile?.profileImage?.url ||
        (typeof target?.profile?.profileImage === "string" ? target.profile.profileImage : null) ||
        target?.profileImage?.url ||
        (typeof target?.profileImage === "string" ? target.profileImage : null) ||
        target?.avatar?.url ||
        (typeof target?.avatar === "string" ? target.avatar : null) ||
        target?.profilePic ||
        u?.profile?.profileImage?.url ||
        (typeof u?.profile?.profileImage === "string" ? u.profile.profileImage : null) ||
        u?.profileImage?.url ||
        (typeof u?.profileImage === "string" ? u.profileImage : null) ||
        u?.avatar?.url ||
        (typeof u?.avatar === "string" ? u.avatar : null) ||
        u?.profilePic ||
        null;

      if (url && typeof url === "string" && url.trim().length > 0) {
        return url.trim();
      }
      return null;
    },
    [usersMap]
  );

  // ==========================================
  // AUTOSAVE HANDLERS
  // ==========================================

  // 1. AUTOSAVE INLINE NEW TASK (Disabled for Admin)
  const handleAutoSaveNewTask = async () => {
    if (isAdmin || !newTitle.trim() || isSavingNew) return;
    if (!newClient) {
      toast.error("Please select a client", { icon: "🏢" });
      return;
    }
    if (!newAssignee) {
      toast.error("Please select an assignee", { icon: "👤" });
      return;
    }
    try {
      setIsSavingNew(true);
      const titleToSave = newTitle.trim();
      await createTaskMutation({
        title: titleToSave,
        client: newClient,
        assignedTo: newAssignee,
        priority: newPriority || "Medium",
        department: selectedDepartment,
        createdBy: activeUser?._id,
        status: "Not Started",
      }).unwrap();

      toast.success(`Task "${titleToSave}" autosaved!`, { icon: "⚡" });
      setNewTitle("");
      setNewClient("");
      setNewAssignee("");
      if (refetchTasks) refetchTasks();
      if (newTitleInputRef.current) newTitleInputRef.current.focus();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to autosave task");
    } finally {
      setIsSavingNew(false);
    }
  };

  // 2. AUTOSAVE EXISTING TASK TITLE (On Blur or Enter)
  const handleAutoSaveTaskTitle = async (taskId, originalTitle) => {
    if (isAdmin) return;
    const updatedTitle = editingTitles[taskId];
    if (
      updatedTitle === undefined ||
      updatedTitle.trim() === (originalTitle || "").trim() ||
      !updatedTitle.trim()
    ) {
      return;
    }
    try {
      setUpdatingTaskId(taskId);
      await updateTaskMutation({
        id: taskId,
        taskData: { title: updatedTitle.trim() },
      }).unwrap();
      setSavedRowId(taskId);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success("Task title autosaved!", { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update title");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 3. AUTOSAVE EXISTING TASK CLIENT
  const handleClientChange = async (task, newClientId) => {
    if (isAdmin) return;
    const currentId = typeof task.client === "object" ? task.client?._id : task.client;
    if (currentId?.toString() === newClientId?.toString()) return;
    try {
      setUpdatingTaskId(task._id);
      await updateTaskMutation({
        id: task._id,
        taskData: { client: newClientId },
      }).unwrap();
      const newC = clientsMap.get(newClientId);
      setSavedRowId(task._id);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success(`Client autosaved: ${newC?.companyName || "Client"}`, { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update client");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 4. AUTOSAVE EXISTING TASK ASSIGNEE
  const handleAssigneeChange = async (task, newAssigneeId) => {
    if (isAdmin) return;
    const currentId = typeof task.assignedTo === "object" ? task.assignedTo?._id : task.assignedTo;
    if (currentId?.toString() === newAssigneeId?.toString()) return;
    try {
      setUpdatingTaskId(task._id);
      await updateTaskMutation({
        id: task._id,
        taskData: { assignedTo: newAssigneeId },
      }).unwrap();
      const newU = usersMap.get(newAssigneeId);
      setSavedRowId(task._id);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success(`Assignee autosaved: ${newU?.name || "Member"}`, { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reassign task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 5. AUTOSAVE EXISTING TASK PRIORITY
  const handlePriorityChange = async (task, newPriority) => {
    if (isAdmin) return;
    if (task.priority === newPriority) return;
    try {
      setUpdatingTaskId(task._id);
      await updateTaskMutation({
        id: task._id,
        taskData: { priority: newPriority },
      }).unwrap();
      setSavedRowId(task._id);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success(`Priority autosaved: ${newPriority}`, { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update priority");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Filter Tasks List
  const filteredTasks = useMemo(() => {
    let list = tasks || [];

    // If logged-in user is not Admin (e.g. Social Media Manager),
    // strictly show ONLY tasks created by this user!
    if (!isAdmin && activeUserId) {
      list = list.filter((t) => {
        const creatorId =
          typeof t.createdBy === "object"
            ? t.createdBy?._id?.toString()
            : t.createdBy?.toString();
        const smmObj = getTaskSmm(t);
        const smmId = smmObj?._id?.toString();
        const isNameMatch =
          smmObj?.name &&
          activeUser?.name &&
          smmObj.name.trim().toLowerCase() === activeUser.name.trim().toLowerCase();

        return (
          (creatorId && creatorId === activeUserId) ||
          (smmId && smmId === activeUserId) ||
          Boolean(isNameMatch)
        );
      });
    }

    // Filter by department if "current" selected
    if (filterDept === "current") {
      const isCinema = selectedDepartment === "Cinematographer";
      list = list.filter((t) => {
        const assignedId = typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
        const u = usersMap.get(assignedId?.toString());
        if (!u) return false;
        const dept = (u.department || "").toLowerCase().trim();
        const role = (u.role || "").toLowerCase().trim();
        if (isCinema) {
          return (
            dept.includes("cinema") ||
            dept.includes("video") ||
            dept.includes("edit") ||
            dept.includes("shoot") ||
            dept.includes("camera") ||
            role.includes("cinema") ||
            role.includes("video") ||
            role.includes("cinematog")
          );
        }
        return (
          dept.includes("graphic") ||
          dept.includes("design") ||
          dept === "designer" ||
          role.includes("designer") ||
          role === "graphic designer"
        );
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const title = (t.title || "").toLowerCase();
        const cObj = typeof t.client === "object" ? t.client : clientsMap.get(t.client?.toString());
        const clientName = (cObj?.companyName || "").toLowerCase();
        return title.includes(q) || clientName.includes(q);
      });
    }

    // Filter by Client Dropdown
    if (filterClient !== "all") {
      list = list.filter((t) => {
        const cId = typeof t.client === "object" ? t.client?._id : t.client;
        return cId?.toString() === filterClient;
      });
    }

    // Filter by Priority
    if (filterPriority !== "all") {
      list = list.filter((t) => (t.priority || "Medium") === filterPriority);
    }

    // Filter by Assignee
    if (filterAssignee !== "all") {
      list = list.filter((t) => {
        const aId = typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
        return aId?.toString() === filterAssignee;
      });
    }

    // Filter by Created Date (when task was created)
    if (filterCreatedDate) {
      list = list.filter((t) => {
        const rawDate = t.createdAt || t.createdDate || t.date;
        if (!rawDate) return false;
        return getTaskCreatedDateKey(rawDate) === filterCreatedDate;
      });
    }

    // Filter by SMM (Applicable for Admin)
    if (isAdmin && filterSmm !== "all") {
      list = list.filter((t) => {
        const smm = getTaskSmm(t);
        return smm?._id?.toString() === filterSmm;
      });
    }

    return list;
  }, [
    tasks,
    isAdmin,
    activeUserId,
    activeUser?.name,
    filterDept,
    selectedDepartment,
    searchQuery,
    filterCreatedDate,
    filterClient,
    filterPriority,
    filterAssignee,
    filterSmm,
    usersMap,
    clientsMap,
    getTaskSmm,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  return (
    <div className="overflow-hidden space-y-4 transition-colors">
      {/* Table Section Header with Autosave Status / Admin Read-Only Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50 shadow-xs">
            <FiLayers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Workload Task Entry & Allocation
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                  <FiEye size={12} />
                  Read-Only Mode ({userRole === "admin" ? "Admin" : "Operation Manager"})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Autosave Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? `${userRole === "admin" ? "Admin" : "Operation Manager"} monitoring mode: View all tasks, clients, creators, assignees, and progress.`
                : `Showing only tasks created by you (${activeUser?.name || "You"}). Enter new tasks in the first row or edit cells to autosave.`}
            </p>
          </div>
        </div>

        {/* Quick helper tip */}
        {isAdmin ? (
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto flex items-center gap-1.5">
            <FiEye size={13} className="text-indigo-500" />
            <span>Click <b>Action 👁️</b> to read full task details</span>
          </div>
        ) : (
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 self-start sm:self-auto flex items-center gap-1.5">
            <LuSparkles size={13} />
            <span>Press <b>Enter ↵</b> in Task Name to autosave instantly</span>
          </div>
        )}
      </div>

      {/* FILTER TOOLBAR FOR THE TABLE - PROPERLY ALIGNED 2-TIER LAYOUT */}
      <div className="bg-slate-50 dark:bg-[#151923] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        {/* ROW 1: Search & Date & Actions Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Left: Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search task name or client..."
              className="w-full h-9 pl-9 pr-8 text-xs bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Right: Dept Toggle + Created Date + Today + Reset */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Department Scope Toggle */}
            <div className="flex items-center h-9 bg-white dark:bg-[#0f172a] p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setFilterDept("current");
                  setCurrentPage(1);
                }}
                className={`h-full px-2.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  filterDept === "current"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {selectedDepartment}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterDept("all");
                  setCurrentPage(1);
                }}
                className={`h-full px-2.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  filterDept === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                All Depts
              </button>
            </div>

            {/* Created Date Filter */}
            <div className="flex items-center h-9 gap-1.5 px-3 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs focus-within:ring-1 focus-within:ring-indigo-500 shrink-0">
              <FiCalendar size={13} className="text-indigo-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Created:</span>
              <input
                type="date"
                value={filterCreatedDate}
                onChange={(e) => {
                  setFilterCreatedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer border-none p-0 outline-none"
                style={{ colorScheme: "light dark" }}
                title="Filter by Task Created Date"
              />
              {filterCreatedDate && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterCreatedDate("");
                    setCurrentPage(1);
                  }}
                  className="p-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer rounded"
                  title="Clear Created Date Filter"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Quick "Today" Shortcut Button */}
            <button
              type="button"
              onClick={() => {
                setFilterCreatedDate(filterCreatedDate === todayDateStr ? "" : todayDateStr);
                setCurrentPage(1);
              }}
              className={`h-9 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer shadow-xs shrink-0 ${
                filterCreatedDate === todayDateStr
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                  : "bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300"
              }`}
              title={filterCreatedDate === todayDateStr ? "Click to clear date filter & show all dates" : "Filter tasks created today"}
            >
              Today
            </button>

            {/* Reset Filters */}
            {(searchQuery || filterCreatedDate !== todayDateStr || filterClient !== "all" || filterPriority !== "all" || filterAssignee !== "all" || filterSmm !== "all" || filterDept !== "current") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCreatedDate(todayDateStr);
                  setFilterClient("all");
                  setFilterPriority("all");
                  setFilterAssignee("all");
                  setFilterSmm("all");
                  setFilterDept("current");
                  setCurrentPage(1);
                }}
                className="h-9 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0"
                title="Reset all filters to default"
              >
                <FiX size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Balanced Dropdown Grid (Equal Width, Equal Height, Proper Alignment) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Client Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterClient}
              onChange={(e) => {
                setFilterClient(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Client"
            >
              <option value="all">🏢 All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterAssignee}
              onChange={(e) => {
                setFilterAssignee(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Assignee"
            >
              <option value="all">👥 All Assignees</option>
              {assigneeList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Priority"
            >
              <option value="all">🎯 All Priorities</option>
              <option value="Top High">🔥 Top High</option>
              <option value="High">⚡ High</option>
              <option value="Medium">🔷 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          {/* SMM / Creator Filter Dropdown */}
          <div className="w-full">
            {isAdmin ? (
              <select
                value={filterSmm}
                onChange={(e) => {
                  setFilterSmm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
                title="Filter by Creator / SMM"
              >
                <option value="all">👤 All Creators / SMMs</option>
                {smmList.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="w-full h-9 flex items-center justify-center gap-1.5 px-3 text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-xs truncate"
                title="Showing only tasks created by you"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">Creator: {activeUser?.name || "You"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-[#131826] text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
              <th className="py-3 px-3.5 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[170px]">Created By</th>
              <th className="py-3 px-4 min-w-[170px]">Assignee</th>
              <th className="py-3 px-4 min-w-[160px]">Client</th>
              <th className="py-3 px-4 min-w-[240px]">Task Name</th>
              <th className="py-3 px-4 min-w-[130px]">Priority</th>
              <th className="py-3 px-4 min-w-[120px]">Status</th>
              <th className="py-3 px-3.5 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
            {/* ======================================================== */}
            {/* INLINE NEW TASK ENTRY ROW (Only for non-Admin creators)   */}
            {/* ======================================================== */}
            {!isAdmin && (
              <tr className="bg-indigo-50/70 dark:bg-[#161d2e] border-b-2 border-indigo-200 dark:border-indigo-800/80 transition-colors">
                {/* 1. # Index / Plus Icon */}
                <td className="py-2.5 px-3.5 text-center">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs shadow-xs"
                    title="New Task Entry"
                  >
                    +
                  </span>
                </td>

                {/* 2. Created By / SMM (First field: Shows logged-in user entering the task) */}
                <td className="py-2.5 px-4">
                  {(() => {
                    const avatarUrl = getUserAvatarUrl(activeUser);
                    return (
                      <div
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-xs max-w-[170px]"
                        title={`Task will be entered by: ${activeUser?.name || "You"}`}
                      >
                        <div className="relative shrink-0 w-6 h-6">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={activeUser?.name || "You"}
                              className="w-6 h-6 rounded-full object-cover border border-purple-300 dark:border-purple-700 shadow-2xs"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-[10px] items-center justify-center shadow-2xs"
                            style={{ display: avatarUrl ? "none" : "flex" }}
                          >
                            {(activeUser?.name || "U")[0].toUpperCase()}
                          </div>
                        </div>
                        <span className="font-bold text-xs text-purple-700 dark:text-purple-300 truncate">
                          {activeUser?.name || "You"}
                        </span>
                        <span className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 shrink-0">
                          (You)
                        </span>
                      </div>
                    );
                  })()}
                </td>

                {/* 3. Assignee Select (Second field) */}
                <td className="py-2.5 px-4">
                  {(() => {
                    const currentSelectedUser = newAssignee
                      ? assigneeList.find((u) => u._id?.toString() === newAssignee?.toString())
                      : null;
                    const avatarUrl = getUserAvatarUrl(currentSelectedUser);
                    return (
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0 w-6 h-6">
                          {currentSelectedUser ? (
                            <>
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={currentSelectedUser?.name || "Assignee"}
                                  className="w-6 h-6 rounded-full object-cover border border-indigo-300 dark:border-indigo-700 shadow-2xs"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                    if (fallback) fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black text-[10px] items-center justify-center uppercase shadow-2xs"
                                style={{ display: avatarUrl ? "none" : "flex" }}
                              >
                                {currentSelectedUser?.name ? currentSelectedUser.name.substring(0, 2) : "U"}
                              </div>
                            </>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 shadow-2xs">
                              👤
                            </div>
                          )}
                        </div>
                        <select
                          value={newAssignee}
                          onChange={(e) => setNewAssignee(e.target.value)}
                          className={`w-full max-w-[145px] py-1.5 px-2 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-xs truncate transition-all ${
                            newAssignee
                              ? "bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 border-indigo-200 dark:border-indigo-800/80"
                              : "bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                          }`}
                          title="Select Assignee"
                        >
                          <option value="">Select Assignee</option>
                          {assigneeList.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </td>

                {/* 4. Client Select (Third field) */}
                <td className="py-2.5 px-4">
                  <select
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className={`w-full max-w-[155px] py-1.5 px-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-xs truncate transition-all ${
                      newClient
                        ? "bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 border-indigo-200 dark:border-indigo-800/80"
                        : "bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}
                    title="Select Client"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 5. Task Name Inline Input (Fourth field) */}
                <td className="py-2.5 px-4">
                  <div className="relative flex items-center">
                    <input
                      ref={newTitleInputRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAutoSaveNewTask();
                        }
                      }}
                      onBlur={() => {
                        if (newTitle.trim()) handleAutoSaveNewTask();
                      }}
                      placeholder="+ Type new task name & press Enter to autosave..."
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-xl border border-indigo-300 dark:border-indigo-700/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600 placeholder:text-indigo-400/80 dark:placeholder:text-indigo-400/50 shadow-xs transition-all"
                    />
                    {isSavingNew && (
                      <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                        <FiRefreshCw size={11} className="animate-spin" />
                        <span>Saving...</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* 6. Priority Select (Fifth field) */}
                <td className="py-2.5 px-4">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="py-1.5 px-2.5 text-xs font-black rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 cursor-pointer shadow-xs"
                    title="Select Priority"
                  >
                    <option value="Top High">🔥 Top High</option>
                    <option value="High">⚡ High</option>
                    <option value="Medium">🔷 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </td>

                {/* 7. Status Indicator (Sixth field) */}
                <td className="py-2.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                    ⚡ Auto-save
                  </span>
                </td>

                {/* 8. Action Button */}
                <td className="py-2.5 px-3.5 text-center">
                  <button
                    type="button"
                    onClick={handleAutoSaveNewTask}
                    disabled={!newTitle.trim() || isSavingNew}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] disabled:opacity-30 cursor-pointer transition-all shadow-xs"
                    title="Save new task (or press Enter)"
                  >
                    <FiCheck size={12} />
                    <span>Save</span>
                  </button>
                </td>
              </tr>
            )}

            {/* ======================================================== */}
            {/* EXISTING TASKS (Read-only for Admin / Editable for others)*/}
            {/* ======================================================== */}
            {paginatedTasks.map((t, idx) => {
              const rowIndex = (currentPage - 1) * itemsPerPage + idx + 1;
              const clientObj = getTaskClient(t);
              const smmObj = getTaskSmm(t);
              const assigneeObj = getTaskAssignee(t);
              const currentPriority = t.priority || "Medium";
              const priorityMeta =
                PRIORITY_OPTIONS.find((p) => p.id === currentPriority) || PRIORITY_OPTIONS[2];
              const isRowUpdating = updatingTaskId === t._id;
              const isRowJustSaved = savedRowId === t._id;

              const statusColor = (t.status || "").toLowerCase().includes("progress")
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60"
                : (t.status || "").toLowerCase().includes("hold") || (t.status || "").toLowerCase().includes("pause")
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60"
                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

              return (
                <tr
                  key={t._id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-[#151c2e]/70 transition-colors ${
                    isRowUpdating ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {/* 1. # Index */}
                  <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400 dark:text-slate-500">
                    {rowIndex}
                  </td>

                  {/* 2. Created By / SMM (First field: Shows person who entered the task) */}
                  <td className="py-3 px-4">
                    {(() => {
                      const avatarUrl = getUserAvatarUrl(smmObj);
                      const createdDateFormatted = t.createdAt
                        ? (() => {
                            try {
                              return format(new Date(t.createdAt), "dd MMM yyyy");
                            } catch {
                              return "";
                            }
                          })()
                        : "";
                      return (
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0 w-7 h-7">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={smmObj?.name || "User"}
                                className="w-7 h-7 rounded-full object-cover border border-purple-200 dark:border-purple-800/80 shadow-2xs"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="avatar-fallback w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-[11px] items-center justify-center uppercase shadow-2xs"
                              style={{ display: avatarUrl ? "none" : "flex" }}
                            >
                              {smmObj?.name ? smmObj.name.substring(0, 2) : "U"}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[145px] block">
                              {smmObj?.name || "—"}
                            </span>
                            {createdDateFormatted && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                                {createdDateFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* 3. Assignee (Second field: Read-only for Admin, Dropdown for creators) */}
                  <td className="py-3 px-4">
                    {(() => {
                      const avatarUrl = getUserAvatarUrl(assigneeObj);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0 w-7 h-7">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={assigneeObj?.name || "Assignee"}
                                className="w-7 h-7 rounded-full object-cover border border-indigo-200 dark:border-indigo-800/80 shadow-2xs"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="avatar-fallback w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-extrabold text-[11px] items-center justify-center uppercase shadow-2xs"
                              style={{ display: avatarUrl ? "none" : "flex" }}
                            >
                              {assigneeObj?.name ? assigneeObj.name.substring(0, 2) : "U"}
                            </div>
                          </div>
                          {isAdmin ? (
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[145px]">
                              {assigneeObj?.name || "Unassigned"}
                            </span>
                          ) : (
                            <select
                              value={assigneeObj?._id || ""}
                              onChange={(e) => handleAssigneeChange(t, e.target.value)}
                              className="w-full max-w-[140px] py-1 px-2 text-xs font-bold bg-slate-50 dark:bg-[#1a2234] text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate shadow-xs"
                              title="Change Assignee (Autosaves)"
                            >
                              {assigneeList.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 4. Client (Third field: Displays task's client name with color indicator) */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            clientObj?.color ||
                            t.clientColor ||
                            (clientObj ? "#6366f1" : "transparent"),
                        }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">
                        {clientObj?.companyName ||
                          clientObj?.name ||
                          t.clientName ||
                          (typeof t.client === "string" ? t.client : "—")}
                      </span>
                    </div>
                  </td>

                  {/* 5. Task Name (Fourth field: Read-only for Admin, Editable input for creators) */}
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[260px]">
                          {t.title}
                        </span>
                        {t.subtasks && t.subtasks.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {t.subtasks.length} sub
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingTitles[t._id] !== undefined ? editingTitles[t._id] : t.title}
                          onChange={(e) =>
                            setEditingTitles({ ...editingTitles, [t._id]: e.target.value })
                          }
                          onBlur={() => handleAutoSaveTaskTitle(t._id, t.title)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-full px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-slate-100/90 dark:hover:bg-[#1a2234] focus:bg-white dark:focus:bg-[#0f172a] rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all truncate shadow-2xs"
                          title="Click to edit task title (autosaves on Enter or blur)"
                        />
                        {t.subtasks && t.subtasks.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {t.subtasks.length} sub
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 6. Priority (Fifth field: Read-only for Admin, Dropdown for creators) */}
                  <td className="py-3 px-4">
                    {isAdmin ? (
                      <span
                        className={`inline-flex items-center gap-1 py-1 px-2.5 text-[11px] font-black rounded-lg border shadow-xs ${priorityMeta.badgeClass}`}
                      >
                        <span>{priorityMeta.icon}</span>
                        <span>{priorityMeta.label}</span>
                      </span>
                    ) : (
                      <select
                        value={currentPriority}
                        onChange={(e) => handlePriorityChange(t, e.target.value)}
                        className={`py-1 px-2.5 text-[11px] font-black rounded-lg border cursor-pointer shadow-xs transition-all ${priorityMeta.badgeClass}`}
                        title="Change Priority (Autosaves)"
                      >
                        <option value="Top High">🔥 Top High</option>
                        <option value="High">⚡ High</option>
                        <option value="Medium">🔷 Medium</option>
                        <option value="Low">🟢 Low</option>
                      </select>
                    )}
                  </td>

                  {/* 7. Status Badge (Sixth field: Live Autosave Feedback) */}
                  <td className="py-3 px-4">
                    {isRowJustSaved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                        <FiCheck size={12} />
                        Saved
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusColor}`}>
                        {t.status || "Not Started"}
                      </span>
                    )}
                  </td>

                  {/* 8. Action Preview Button (Read Task Details) */}
                  <td className="py-3 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onViewTask(t)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      title={isAdmin ? "Read Task Details (Modal)" : "View Task Details Modal"}
                    >
                      <FiEye size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <b className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</b> to{" "}
            <b className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
            </b>{" "}
            of <b className="text-slate-800 dark:text-slate-200">{filteredTasks.length}</b> tasks
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === pg
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN WORKLOAD COMPONENT
// ==========================================
const Workload = () => {
  const dispatch = useDispatch();

  // Load users from Redux store
  const { users = [], loading: usersLoading } = useSelector((state) => state.users);

  // Load clients from Redux store
  const { clients = [] } = useSelector((state) => state.clients);

  // Current logged in user
  const { user: currentUser } = useSelector((state) => state.auth);

  // Task Mutations for creation and update
  const [createTaskMutation] = useCreateTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();

  // Department tab state (Graphic Designer / Cinematographer)
  const [selectedDepartment, setSelectedDepartment] = useState("Graphic Designer");

  // View mode state (table / grid) - defaults to "table" per user requirement
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("workload_view_mode") || "table";
    } catch {
      return "table";
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("workload_view_mode", mode);
    } catch {}
  };

  // Load active tasks via RTK Query with automatic caching (shared across departments for 0ms tab switching)
  const {
    data: tasksData = [],
    isLoading: tasksLoading,
    isFetching: tasksFetching,
    isError: tasksIsError,
    refetch: refetchTasks,
  } = useGetTasksQuery({ active_only: true, minimal: true });

  // Real-time Online / Offline state from shared SocketContext
  const { onlineUserIds = [], userPresence = {} } = useSocketContext() || {};

  // O(1) set for lightning-fast online check
  const onlineUserIdsSet = useMemo(() => {
    return new Set((onlineUserIds || []).map((id) => id?.toString()));
  }, [onlineUserIds]);

  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [expandedUserIds, setExpandedUserIds] = useState(() => new Set());
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);

  // Fetch users and clients once on mount if not already loaded
  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getUsers());
    }
    if (!clients || clients.length === 0) {
      dispatch(getClients());
    }
  }, [dispatch, users?.length, clients?.length]);

  // Calculate member count for each department tab
  const departmentCounts = useMemo(() => {
    let gd = 0;
    let cinema = 0;
    const list = users || [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      if (u.employmentStatus === "relieved") continue;
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();

      if (
        dept.includes("graphic") ||
        dept.includes("design") ||
        dept === "designer" ||
        role.includes("designer") ||
        role === "graphic designer"
      ) {
        gd++;
      }
      if (
        dept.includes("cinema") ||
        dept.includes("video") ||
        dept.includes("edit") ||
        dept.includes("shoot") ||
        dept.includes("camera") ||
        role.includes("cinema") ||
        role.includes("video") ||
        role.includes("cinematog")
      ) {
        cinema++;
      }
    }
    return { "Graphic Designer": gd, Cinematographer: cinema };
  }, [users]);

  // Filter department members (Graphic Designer vs Cinematographer)
  const departmentUsers = useMemo(() => {
    const list = users || [];
    const isCinema = selectedDepartment === "Cinematographer";
    return list.filter((u) => {
      if (u.employmentStatus === "relieved") return false;
      const deptLower = (u.department || "").toLowerCase().trim();
      const roleLower = (u.role || "").toLowerCase().trim();

      if (isCinema) {
        return (
          deptLower.includes("cinema") ||
          deptLower.includes("video") ||
          deptLower.includes("edit") ||
          deptLower.includes("shoot") ||
          deptLower.includes("camera") ||
          roleLower.includes("cinema") ||
          roleLower.includes("video") ||
          roleLower.includes("cinematog")
        );
      }

      return (
        deptLower.includes("graphic") ||
        deptLower.includes("design") ||
        deptLower === "designer" ||
        roleLower.includes("designer") ||
        roleLower === "graphic designer"
      );
    });
  }, [users, selectedDepartment]);

  // O(1) indexed map of tasks by assigned user ID using Set for deduplication
  const tasksByUserMap = useMemo(() => {
    const map = new Map();
    const seenMap = new Map();

    const addTaskToUser = (userId, task) => {
      if (!userId) return;
      const sId = userId.toString();
      let arr = map.get(sId);
      let seen = seenMap.get(sId);
      if (!arr) {
        arr = [];
        seen = new Set();
        map.set(sId, arr);
        seenMap.set(sId, seen);
      }
      if (!seen.has(task._id)) {
        seen.add(task._id);
        arr.push(task);
      }
    };

    const list = tasksData || [];
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (!t) continue;
      const assignedId = typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
      if (assignedId) addTaskToUser(assignedId, t);

      if (t.subtasks && t.subtasks.length > 0) {
        for (let j = 0; j < t.subtasks.length; j++) {
          const sub = t.subtasks[j];
          const subAssignedId = typeof sub.assignedTo === "object" ? sub.assignedTo?._id : sub.assignedTo;
          if (subAssignedId) addTaskToUser(subAssignedId, t);
        }
      }
    }
    return map;
  }, [tasksData]);

  // Calculate day context once per selectedDate
  const dayWorkCtx = useMemo(() => {
    return getDayWorkContext(selectedDate);
  }, [selectedDate]);

  // Compute workload for department members (heavy calculations isolated from search keystrokes)
  const userWorkloads = useMemo(() => {
    const nowMs = Date.now();

    return departmentUsers.map((u) => {
      const userIdStr = u._id?.toString();

      // Real-time Online / Offline status using O(1) Set
      const isOnline =
        onlineUserIdsSet.has(userIdStr) ||
        userPresence[userIdStr]?.status === "online" ||
        userPresence[userIdStr]?.status === "away" ||
        u.presenceStatus === "online";

      // Instant O(1) task lookup
      const assignedTasks = tasksByUserMap.get(userIdStr) || [];

      // Categorize tasks & calculate productivity
      let workedMs = 0;
      const productivityMap = new Map();

      for (let i = 0; i < assignedTasks.length; i++) {
        const t = assignedTasks[i];
        const prod = calculateTaskProductivityForDate(t, dayWorkCtx, nowMs);
        workedMs += prod;
        if (t._id) productivityMap.set(t._id.toString(), prod);
      }

      const activeTasks = [];
      const onHoldTasks = [];
      const pendingTasks = [];
      const displayTasks = [];

      for (let i = 0; i < assignedTasks.length; i++) {
        const t = assignedTasks[i];
        const status = t.status || "";
        const sLower = status.toLowerCase().trim();

        if (status === "In Progress" && !t.autoPaused) {
          activeTasks.push(t);
        } else if (status === "On Hold" || (status === "In Progress" && t.autoPaused)) {
          onHoldTasks.push(t);
        } else if (status === "Not Started" || status === "To Do" || status === "Pending") {
          pendingTasks.push(t);
        }

        // Display tasks in view tasks: only In Progress, On Hold, Not Started
        if (
          !sLower.includes("complete") &&
          !sLower.includes("done") &&
          !sLower.includes("review") &&
          !sLower.includes("reject") &&
          !sLower.includes("correct") &&
          (
            sLower.includes("progress") ||
            sLower.includes("hold") ||
            sLower.includes("pause") ||
            sLower.includes("not started") ||
            sLower.includes("to do") ||
            sLower.includes("todo") ||
            sLower.includes("pending")
          )
        ) {
          displayTasks.push(t);
        }
      }

      // Pre-sort display tasks and attach memoized values to avoid recalculations in render
      const sortedDisplayTasks = displayTasks
        .map((task) => ({
          ...task,
          workedTodayMs: productivityMap.get(task._id?.toString()) || 0,
          assignedDateFormatted: formatTaskAssignedDate(task),
        }))
        .sort((a, b) => {
          const getWeight = (status) => {
            const s = (status || "").toLowerCase();
            if (s.includes("progress")) return 1;
            if (s.includes("hold") || s.includes("pause")) return 2;
            return 3;
          };
          return getWeight(a.status) - getWeight(b.status);
        });

      // Capacity calculations
      const maxCapacityTasks = 8;
      const totalActiveTasksCount = displayTasks.length;
      const taskUtilizationPercent = Math.min(
        150,
        Math.round((totalActiveTasksCount / maxCapacityTasks) * 100)
      );

      // Card Theme & Status based on capacity
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
        cardTheme,
        availability,
      };
    });
  }, [departmentUsers, tasksByUserMap, dayWorkCtx, onlineUserIdsSet, userPresence]);

  // Ultra-fast instant search & availability filter (0ms overhead, no recalculations)
  const finalWorkloads = useMemo(() => {
    let list = userWorkloads;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.user.name?.toLowerCase().includes(q) ||
          w.user.email?.toLowerCase().includes(q) ||
          w.user.department?.toLowerCase().includes(q)
      );
    }

    if (availabilityFilter === "all") return list;
    if (availabilityFilter === "online") return list.filter((w) => w.isOnline);
    if (availabilityFilter === "offline") return list.filter((w) => !w.isOnline);
    if (availabilityFilter === "busy") return list.filter((w) => w.availability.status === "busy");
    if (availabilityFilter === "paused") return list.filter((w) => w.availability.status === "paused");
    if (availabilityFilter === "available") {
      return list.filter(
        (w) => w.isOnline && w.activeTasks.length === 0 && w.onHoldTasks.length === 0
      );
    }
    if (availabilityFilter === "overloaded") return list.filter((w) => w.cardTheme.isOverloaded);
    return list.filter((w) => w.availability.status === availabilityFilter);
  }, [userWorkloads, searchTerm, availabilityFilter]);

  // Memoized stable callbacks for 60fps interaction
  const toggleExpandUser = useCallback((userId) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleDateChange = useCallback((days) => {
    setSelectedDate((prev) => (days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days))));
  }, []);

  const handleOpenTaskModal = useCallback((task) => {
    setSelectedTaskModal(task);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setSelectedTaskModal(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070b14] p-4 sm:p-6 lg:p-8 space-y-6 font-inter text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Controls Toolbar */}
      <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Department Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-[#151923] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs shrink-0">
          {DEPARTMENT_TABS.map((tab) => {
            const isActive = selectedDepartment === tab.id;
            const count = departmentCounts[tab.id] || 0;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDepartment(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: View Toggle + Search + Availability Filter + Date Navigator + Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
          {/* View Toggle: Table / Grid */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1e293b]/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
            <button
              type="button"
              onClick={() => handleSetViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Table / List View"
            >
              <FiList size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Grid / Card View"
            >
              <FiGrid size={14} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56 lg:w-60">
            <input
              type="text"
              placeholder={selectedDepartment === "Cinematographer" ? "Search cinematographer..." : "Search designer..."}
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

      {/* Background sync progress bar */}
      {tasksFetching && (
        <div className="h-1 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full" />
        </div>
      )}

      {/* Main Workload View: Table / List or Grid */}
      {((!users || users.length === 0) && usersLoading) || (tasksLoading && (!tasksData || tasksData.length === 0)) ? (
        <WorkloadSkeleton viewMode={viewMode} />
      ) : tasksIsError && (!tasksData || tasksData.length === 0) ? (
        <div className="bg-white dark:bg-[#0f172a]/90 rounded-2xl p-10 text-center border border-rose-200 dark:border-rose-900/50 space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
            <FiRefreshCw size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Failed to load workload data
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There was an issue fetching the latest workload tasks. Please try refreshing.
            </p>
          </div>
          <button
            onClick={() => refetchTasks()}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2"
          >
            <FiRefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      ) : finalWorkloads.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a]/90 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800/90 space-y-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50">
            <FiUsers size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              No {selectedDepartment === "Cinematographer" ? "Cinematographers" : "Graphic Designers"} Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are no {selectedDepartment === "Cinematographer" ? "cinematographers" : "graphic designers"} matching your search or filter criteria.
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
      ) : viewMode === "table" ? (
        <WorkloadTableView
          workloads={finalWorkloads}
          expandedUserIds={expandedUserIds}
          onToggleExpand={toggleExpandUser}
          onViewTask={handleOpenTaskModal}
          selectedDepartment={selectedDepartment}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {finalWorkloads.map((workload) => (
            <WorkloadCard
              key={workload.user._id}
              workload={workload}
              isExpanded={expandedUserIds.has(workload.user._id)}
              onToggleExpand={toggleExpandUser}
              onViewTask={handleOpenTaskModal}
              selectedDepartment={selectedDepartment}
            />
          ))}
        </div>
      )}

      {/* Workload Task Allocation Table (Bottom Section) */}
      <WorkloadTaskTable
        tasks={tasksData}
        users={users}
        clients={clients}
        selectedDepartment={selectedDepartment}
        currentUser={currentUser}
        onViewTask={handleOpenTaskModal}
        createTaskMutation={createTaskMutation}
        updateTaskMutation={updateTaskMutation}
        refetchTasks={refetchTasks}
      />

      {/* Task Preview Modal */}
      <AnimatePresence>
        {selectedTaskModal && (
          <TaskPreviewModal
            task={selectedTaskModal}
            onClose={handleCloseTaskModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workload;