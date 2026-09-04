import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useGetTasksQuery, useUpdateTaskMutation } from "../../features/api/apiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCoffee, FiPlay, FiPause } from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";

const OfficeHoursPausedPopup = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;

  const { data: tasks = [] } = useGetTasksQuery(undefined, {
    skip: !currentUserId,
  });

  const [updateTask] = useUpdateTaskMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [officeHours, setOfficeHours] = useState({
    startTime: "09:00",
    endTime: "19:00",
    workingDays: [1, 2, 3, 4, 5, 6],
  });

  // Track dismissed tasks/subtasks in this session to prevent re-opening on every poll
  const dismissedKeysRef = useRef(new Set());

  // Fetch office hours settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axiosInstance.get("/settings/office-hours");
        if (data?.success && data?.data) {
          setOfficeHours({
            startTime: data.data.startTime || "09:00",
            endTime: data.data.endTime || "19:00",
            workingDays: data.data.workingDays || [1, 2, 3, 4, 5, 6],
          });
        }
      } catch (err) {
        console.error("Failed to fetch office hours in popup:", err);
      }
    };
    if (currentUserId) {
      fetchSettings();
    }
  }, [currentUserId]);

  // Helper to determine if current time is within business hours (Asia/Kolkata IST)
  const isCurrentlyInBusinessHours = () => {
    try {
      const now = new Date();
      // Convert to IST
      const istTime = new Date(now.getTime() + 330 * 60 * 1000);
      const day = istTime.getUTCDay();
      const workingDays =
        officeHours.workingDays && officeHours.workingDays.length > 0
          ? officeHours.workingDays
          : [1, 2, 3, 4, 5, 6];

      if (!workingDays.includes(day)) return false;

      const startTimeStr = officeHours.startTime || "09:00";
      const endTimeStr = officeHours.endTime || "19:00";
      const [startH, startM] = startTimeStr.split(":").map(Number);
      const [endH, endM] = endTimeStr.split(":").map(Number);

      const currentMins = istTime.getUTCHours() * 60 + istTime.getUTCMinutes();
      const startMins = startH * 60 + (startM || 0);
      const endMins = endH * 60 + (endM || 0);

      return currentMins >= startMins && currentMins < endMins;
    } catch {
      return true;
    }
  };

  // Calculate working time of a task/subtask in milliseconds
  const calculateWorkingTime = (item) => {
    if (!item.actualStartTime) return 0;
    const start = new Date(item.actualStartTime).getTime();
    const end = item.pausedAt ? new Date(item.pausedAt).getTime() : Date.now();

    let sessionPauseMs = 0;
    if (item.blockerHistory && item.blockerHistory.length > 0) {
      item.blockerHistory.forEach((h) => {
        if (h.pausedAt) {
          const p = new Date(h.pausedAt).getTime();
          let r = h.resumedAt ? new Date(h.resumedAt).getTime() : Date.now();
          if (r > end) r = end;
          if (r >= p) {
            const oStart = Math.max(p, start);
            const oEnd = Math.min(r, end);
            if (oEnd > oStart) {
              sessionPauseMs += oEnd - oStart;
            }
          }
        }
      });
    }

    if (item.isBlocked && item.blockerPausedAt) {
      const p = new Date(item.blockerPausedAt).getTime();
      if (p < end) {
        const oStart = Math.max(p, start);
        if (end > oStart) {
          sessionPauseMs += end - oStart;
        }
      }
    }

    const elapsed = end - start - (item.totalPausedMs || 0) - sessionPauseMs;
    return Math.max(0, elapsed);
  };

  const formatWorkingTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatPausedAt = (dateVal) => {
    if (!dateVal) return "07:00 PM";
    const date = new Date(dateVal);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const calculateAwayDuration = (dateVal) => {
    if (!dateVal) return null;
    const diffMs = Math.max(0, Date.now() - new Date(dateVal).getTime());
    const totalMins = Math.floor(diffMs / 60000);
    if (totalMins < 1) return "Less than a minute";
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m} mins`;
  };

  // 1. Listen for background auto-pause (query updates)
  useEffect(() => {
    if (!tasks || tasks.length === 0 || !currentUserId || isOpen) return;

    // Find any task assigned to current user that is In Progress and marked as autoPaused
    const autoPausedTask = tasks.find((t) => {
      const isAssignee = Array.isArray(t.assignedTo)
        ? t.assignedTo.some((u) => (u?._id || u)?.toString() === currentUserId?.toString())
        : (t.assignedTo?._id || t.assignedTo)?.toString() === currentUserId?.toString();
      
      const isTaskInProgress = t.status === "In Progress" || t.status === "In-Progress";

      const hasAutoPausedSubtask = t.subtasks?.some((sub) => {
        const subAssignee = Array.isArray(sub.assignedTo)
          ? sub.assignedTo.some((u) => (u?._id || u)?.toString() === currentUserId?.toString())
          : (sub.assignedTo?._id || sub.assignedTo)?.toString() === currentUserId?.toString();
        const isSubInProgress = sub.status === "In Progress" || sub.status === "In-Progress";
        const subKey = `sub_${sub._id}_${sub.pausedAt || "p"}`;
        return subAssignee && isSubInProgress && sub.autoPaused && !dismissedKeysRef.current.has(subKey);
      });

      const taskKey = `task_${t._id}_${t.pausedAt || "p"}`;
      return (isAssignee && isTaskInProgress && t.autoPaused && !dismissedKeysRef.current.has(taskKey)) || hasAutoPausedSubtask;
    });

    if (autoPausedTask) {
      const subtask = autoPausedTask.subtasks?.find((sub) => {
        const subAssignee = Array.isArray(sub.assignedTo)
          ? sub.assignedTo.some((u) => (u?._id || u)?.toString() === currentUserId?.toString())
          : (sub.assignedTo?._id || sub.assignedTo)?.toString() === currentUserId?.toString();
        const isSubInProgress = sub.status === "In Progress" || sub.status === "In-Progress";
        const subKey = `sub_${sub._id}_${sub.pausedAt || "p"}`;
        return subAssignee && isSubInProgress && sub.autoPaused && !dismissedKeysRef.current.has(subKey);
      });
      const target = subtask || autoPausedTask;

      const workingTimeMs = calculateWorkingTime(target);
      const pausedAtStr = formatPausedAt(target.pausedAt);
      const awayDurationStr = calculateAwayDuration(target.pausedAt);
      const isBiz = isCurrentlyInBusinessHours();

      // Only show Away mode if we are in business hours AND the task was paused today
      const isPausedToday = target.pausedAt
        ? new Date(target.pausedAt).toDateString() === new Date().toDateString()
        : true;

      const mode = isBiz && isPausedToday ? "away" : "office_hours";

      setPopupData({
        task: autoPausedTask,
        target,
        isSubtask: !!subtask,
        workingTimeStr: formatWorkingTime(workingTimeMs),
        pausedAtStr,
        awayDurationStr,
        mode,
      });
      setIsOpen(true);
    }
  }, [tasks, currentUserId, isOpen]);

  // 2. Listen for manual "In Progress" block custom window event
  useEffect(() => {
    const handleManualBlock = (event) => {
      const { workingTimeMs, pausedAtHour } = event.detail;
      const workingTimeStr = formatWorkingTime(workingTimeMs);
      const pausedAtStr = formatPausedAt(pausedAtHour);

      setPopupData({
        isManualBlock: true,
        mode: "office_hours",
        workingTimeStr,
        pausedAtStr,
      });
      setIsOpen(true);
    };

    window.addEventListener("show-office-hours-ended-popup", handleManualBlock);
    return () => window.removeEventListener("show-office-hours-ended-popup", handleManualBlock);
  }, []);

  // Action: Resume task immediately (When user clicks Resume)
  const handleResumeTask = async () => {
    if (!popupData || popupData.isManualBlock) {
      setIsOpen(false);
      setPopupData(null);
      return;
    }

    const { task, target, isSubtask } = popupData;
    const dismissKey = isSubtask ? `sub_${target._id}_${target.pausedAt || "p"}` : `task_${task._id}_${task.pausedAt || "p"}`;
    dismissedKeysRef.current.add(dismissKey);

    setIsSubmitting(true);
    try {
      const pauseDuration = target.pausedAt ? Math.max(0, Date.now() - new Date(target.pausedAt).getTime()) : 0;

      if (isSubtask) {
        const updatedSubtasks = task.subtasks.map((sub) => {
          if (sub._id === target._id) {
            return {
              ...sub,
              autoPaused: false,
              pausedAt: null,
              totalPausedMs: (sub.totalPausedMs || 0) + pauseDuration,
            };
          }
          return sub;
        });
        await updateTask({
          id: task._id,
          taskData: { subtasks: updatedSubtasks },
        }).unwrap();
      } else {
        await updateTask({
          id: task._id,
          taskData: {
            autoPaused: false,
            pausedAt: null,
            totalPausedMs: (target.totalPausedMs || 0) + pauseDuration,
          },
        }).unwrap();
      }
      toast.success("Welcome back! Task timer resumed. 🚀");
    } catch (err) {
      console.error("Failed to resume task from away popup:", err);
      toast.error("Failed to resume task. Please resume manually.");
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
      setPopupData(null);
    }
  };

  // Action: Keep paused / Dismiss
  const handleKeepPaused = async () => {
    if (!popupData || popupData.isManualBlock) {
      setIsOpen(false);
      setPopupData(null);
      return;
    }

    const { task, target, isSubtask } = popupData;
    const dismissKey = isSubtask ? `sub_${target._id}_${target.pausedAt || "p"}` : `task_${task._id}_${task.pausedAt || "p"}`;
    dismissedKeysRef.current.add(dismissKey);

    setIsSubmitting(true);
    try {
      if (isSubtask) {
        const updatedSubtasks = task.subtasks.map((sub) => {
          if (sub._id === target._id) {
            return { ...sub, autoPaused: false };
          }
          return sub;
        });
        await updateTask({
          id: task._id,
          taskData: { subtasks: updatedSubtasks },
        }).unwrap();
      } else {
        await updateTask({
          id: task._id,
          taskData: { autoPaused: false },
        }).unwrap();
      }
      if (popupData.mode === "away") {
        toast("Task remains paused.", { icon: "⏸️" });
      }
    } catch (err) {
      console.error("Failed to clear auto-paused flag:", err);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
      setPopupData(null);
    }
  };

  if (!isOpen || !popupData) return null;

  const isAwayMode = popupData.mode === "away";
  const taskTitle = popupData.target?.title || popupData.task?.title || "Active Task";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden"
        >
          {/* Decorative top strip */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isAwayMode
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
          />

          <div className="flex flex-col items-center gap-2.5">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                isAwayMode
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500"
                  : "bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-500"
              }`}
            >
              {isAwayMode ? (
                <FiCoffee size={32} className="animate-bounce text-emerald-500" />
              ) : (
                <FiClock size={32} className="animate-pulse text-amber-500" />
              )}
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-1">
              {isAwayMode ? "Welcome Back! 👋" : "⏰ Office Hours Ended"}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed font-semibold">
              {isAwayMode
                ? "Your task timer was paused while you were away to keep your working hours accurate."
                : "Your work has been paused automatically because business hours have ended."}
            </p>
          </div>

          {/* Task Info Pill (Away mode only) */}
          {isAwayMode && taskTitle && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-left">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Paused Task
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={taskTitle}>
                {taskTitle}
              </p>
            </div>
          )}

          {/* Time Grid Info */}
          <div className="grid grid-cols-2 gap-4 py-3.5 px-2 my-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <div className="space-y-1 text-center border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                {isAwayMode ? "Time Away" : "Working Time"}
              </span>
              <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {isAwayMode ? popupData.awayDurationStr || popupData.pausedAtStr : popupData.workingTimeStr}
              </span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Paused At
              </span>
              <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {popupData.pausedAtStr}
              </span>
            </div>
          </div>

          {!isAwayMode && (
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              Tomorrow you can continue <br />
              from where you stopped.
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            {isAwayMode ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResumeTask}
                  className="w-full py-3 px-5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FiPlay size={14} /> Resume Work
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleKeepPaused}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FiPause size={12} /> Keep Paused
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleKeepPaused}
                className="w-full py-3 px-5 rounded-2xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                OK
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OfficeHoursPausedPopup;
