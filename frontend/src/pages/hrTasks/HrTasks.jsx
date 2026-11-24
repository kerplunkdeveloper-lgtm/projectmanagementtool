import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiBriefcase,
  FiPlus,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiUsers,
  FiMoreVertical,
  FiPaperclip,
  FiMessageSquare,
  FiX,
  FiCheck,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiChevronRight,
  FiEye,
  FiActivity,
  FiFileText,
  FiDownload,
  FiArrowRight,
  FiFolder,
  FiPauseCircle,
} from "react-icons/fi";
import {
  LuListTodo,
  LuClipboardCheck,
  LuClockAlert,
} from "react-icons/lu";

import hrTaskService from "../../services/hrTaskService";
import { markAsRead } from "../../features/notifications/notificationSlice";

// Helper for relative time (e.g. "2 hours ago")
const getRelativeTime = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
};

// Format Date e.g. "28 Oct 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

// Avatar colors for users without photo
const AVATAR_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-fuchsia-600",
];

const getUserAvatar = (user) => {
  if (!user) return null;
  const avatar =
    (typeof user.profile?.profileImage === "object"
      ? user.profile?.profileImage?.url
      : user.profile?.profileImage) ||
    (typeof user.profileImage === "object"
      ? user.profileImage?.url
      : user.profileImage) ||
    user.avatar ||
    null;
  return typeof avatar === "string" && avatar.trim().length > 0 ? avatar : null;
};

const getInitials = (name) => {
  if (!name) return "HR";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Priority badge styling
const getPriorityBadge = (priority) => {
  switch (priority) {
    case "Urgent":
      return {
        bg: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30",
        dot: "bg-red-500 animate-pulse",
      };
    case "High":
      return {
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30",
        dot: "bg-amber-500",
      };
    case "Medium":
      return {
        bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30",
        dot: "bg-blue-500",
      };
    case "Low":
    default:
      return {
        bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30",
        dot: "bg-slate-400",
      };
  }
};

// ------------------------------------------------------------------
// Status model: Not Started -> In Progress -> Completed, any open <-> On Hold
// ------------------------------------------------------------------
const HR_STATUSES = ["Not Started", "In Progress", "On Hold", "Completed"];

const STATUS_META = {
  "Not Started": {
    bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  "In Progress": {
    bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
    dot: "bg-blue-500",
  },
  "On Hold": {
    bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60",
    dot: "bg-amber-500",
  },
  Completed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
  },
};

const getStatusBadge = (status) => ({
  ...(STATUS_META[status] || STATUS_META["Not Started"]),
  label: status || "Not Started",
});

// Status dropdown used in the table and the details drawer
const StatusSelect = ({ task, canEdit, canReopen, onChange, size = "sm" }) => {
  const meta = getStatusBadge(task.status);
  const locked = !canEdit || (task.status === "Completed" && !canReopen);
  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full pointer-events-none ${meta.dot}`} />
      <select
        value={task.status}
        disabled={locked}
        onChange={(e) => onChange(task, e.target.value)}
        title={
          !canEdit
            ? "Only the assignee or a manager can change status"
            : locked
            ? "Only a manager can reopen a completed task"
            : "Change status"
        }
        className={`appearance-none pl-6 pr-7 rounded-lg font-semibold focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]/40 transition-all ${
          size === "lg" ? "py-1.5 text-[12px]" : "py-1 text-[12px]"
        } ${meta.bg} ${locked ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
      >
        {HR_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {s}
          </option>
        ))}
      </select>
      {!locked && (
        <svg className="absolute right-2 w-3 h-3 pointer-events-none opacity-60" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
};

// HR Categories
const HR_CATEGORIES = [
  "Recruitment",
  "Onboarding",
  "Payroll",
  "Employee Relations",
  "Compliance",
  "Performance",
  "Training & Dev",
  "Exit & Offboarding",
  "General HR",
  "Policy & Audit",
  "Other",
];

const HrTasks = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notifications);

  // Unread HR department / task notifications for warning counts & UI sync
  const unreadHrNotifications = useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(
      (n) =>
        !n.isRead &&
        (n.type?.startsWith("hr_task_") ||
          n.hrTask ||
          n.message?.toLowerCase().includes("hr task") ||
          n.message?.toLowerCase().includes("hr department") ||
          (n.sender?.department &&
            (n.sender.department.toLowerCase() === "hr" ||
              n.sender.department.toLowerCase().includes("human resource")) &&
            n.message?.toLowerCase().includes("task")))
    );
  }, [notifications]);

  const handleMarkAllHrAsRead = useCallback(() => {
    if (unreadHrNotifications.length === 0) return;
    unreadHrNotifications.forEach((n) => {
      dispatch(markAsRead(n._id));
    });
    toast.success("Marked all HR alerts as read");
  }, [unreadHrNotifications, dispatch]);

  const taskHasUnreadAlert = useCallback(
    (taskId) => {
      return unreadHrNotifications.some((n) => {
        const nTaskId = typeof n.hrTask === "object" ? n.hrTask?._id : n.hrTask;
        return nTaskId === taskId;
      });
    },
    [unreadHrNotifications]
  );

  // Determine if manager role
  const isManager = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || "").toLowerCase();
    const dept = (currentUser.department || "").toLowerCase();
    return (
      role === "admin" ||
      role === "operationmanager" ||
      role === "operation manager" ||
      dept.includes("operation manager") ||
      dept.includes("managing partner")
    );
  }, [currentUser]);

  // States
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);

  // Action states
  const [holdDialog, setHoldDialog] = useState(null); // { task, reason }
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Load Data
  const fetchData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (priorityFilter !== "all") params.priority = priorityFilter;
        if (categoryFilter !== "all") params.category = categoryFilter;
        if (assigneeFilter !== "all" && isManager) params.assignedTo = assigneeFilter;
        if (dueDateFilter !== "all") params.dueDateFilter = dueDateFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const [tasksRes, metricsRes, usersRes] = await Promise.all([
          hrTaskService.getHrTasks(params),
          hrTaskService.getHrTaskMetrics(),
          isManager ? hrTaskService.getHrUsers() : Promise.resolve({ data: [] }),
        ]);

        if (tasksRes.success) setTasks(tasksRes.data || []);
        if (metricsRes.success) setMetrics(metricsRes.data || null);
        if (usersRes?.success) setHrUsers(usersRes.data || []);

        // If a task is currently open in detail drawer, refresh its state
        if (selectedTask) {
          const freshTask = (tasksRes.data || []).find(
            (t) => t._id === selectedTask._id
          );
          if (freshTask) setSelectedTask(freshTask);
        }
      } catch (err) {
        console.error("Failed to load HR tasks data:", err);
        toast.error("Error loading HR tasks");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      statusFilter,
      priorityFilter,
      categoryFilter,
      assigneeFilter,
      dueDateFilter,
      searchQuery,
      isManager,
      selectedTask,
    ]
  );

  useEffect(() => {
    fetchData();
  }, [
    statusFilter,
    priorityFilter,
    categoryFilter,
    assigneeFilter,
    dueDateFilter,
  ]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData(true);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Read ?id= query param to auto-open task when redirected from notification
  const searchTaskId = useMemo(() => {
    return new URLSearchParams(location.search).get("id");
  }, [location.search]);

  useEffect(() => {
    if (!searchTaskId) return;

    const found = tasks.find((t) => t._id === searchTaskId);
    if (found) {
      setSelectedTask(found);
      setIsDetailDrawerOpen(true);
    } else if (!loading) {
      hrTaskService
        .getHrTaskById(searchTaskId)
        .then((res) => {
          if (res?.success && res?.data) {
            setSelectedTask(res.data);
            setIsDetailDrawerOpen(true);
          }
        })
        .catch(() => {});
    }

    // Mark matching notifications as read
    if (notifications) {
      notifications.forEach((n) => {
        const nTaskId = typeof n.hrTask === "object" ? n.hrTask?._id : n.hrTask;
        if (!n.isRead && (nTaskId === searchTaskId || n.type?.startsWith("hr_task_"))) {
          dispatch(markAsRead(n._id));
        }
      });
    }
  }, [searchTaskId, tasks, loading, notifications, dispatch]);

  const canEditStatus = useCallback(
    (task) => {
      if (isManager) return true;
      const myId = currentUser?._id || currentUser?.id;
      return (task.assignedTo?._id || task.assignedTo) === myId;
    },
    [isManager, currentUser]
  );

  // Replace a task in local state after any server update
  const applyTaskUpdate = useCallback((updated) => {
    if (!updated) return;
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setSelectedTask((prev) => (prev && prev._id === updated._id ? updated : prev));
  }, []);

  const refreshMetrics = useCallback(async () => {
    try {
      const res = await hrTaskService.getHrTaskMetrics();
      if (res.success) setMetrics(res.data || null);
    } catch {
      /* non-critical */
    }
  }, []);

  const saveStatus = async (task, status, reason = "") => {
    try {
      setSubmittingAction(true);
      const res = await hrTaskService.updateHrTaskStatus(task._id, status, reason);
      if (res.success) {
        toast.success(`Status updated to ${status}`);
        applyTaskUpdate(res.data);
        // Keep list consistent with the active status filter
        if (statusFilter !== "all" && statusFilter !== status) {
          setTasks((prev) => prev.filter((t) => t._id !== task._id));
        }
        refreshMetrics();
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSubmittingAction(false);
    }
    return false;
  };

  // Status dropdown change
  const handleStatusChange = async (task, status) => {
    if (!status || status === task.status) return;

    if (status === "On Hold") {
      setHoldDialog({ task, reason: "" });
      return;
    }

    if (status === "Completed") {
      const pending = (task.checklist || []).filter((c) => !c.completed).length;
      if (
        pending > 0 &&
        !window.confirm(
          `${pending} checklist item(s) are still pending. Mark "${task.title}" as Completed anyway?`
        )
      ) {
        return;
      }
    }

    if (task.status === "Completed" && !window.confirm(`Reopen "${task.title}" as ${status}?`)) {
      return;
    }

    await saveStatus(task, status);
  };

  const handleConfirmHold = async () => {
    if (!holdDialog) return;
    if (!holdDialog.reason.trim()) {
      toast.error("Please enter a reason for putting this task On Hold");
      return;
    }
    const ok = await saveStatus(holdDialog.task, "On Hold", holdDialog.reason.trim());
    if (ok) setHoldDialog(null);
  };

  // Handle Checklist Item Toggle
  const handleToggleChecklist = async (taskId, itemId) => {
    try {
      const res = await hrTaskService.toggleChecklistItem(taskId, itemId);
      if (res.success) {
        applyTaskUpdate(res.data);
        refreshMetrics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update checklist");
    }
  };

  // Handle Adding Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;
    try {
      setSubmittingAction(true);
      const res = await hrTaskService.addComment(selectedTask._id, {
        text: newCommentText,
      });
      if (res.success) {
        setNewCommentText("");
        applyTaskUpdate(res.data);
      }
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Delete Task (Manager / Admin)
  const handleDeleteTask = async (task, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete "${task.title}"?`)) return;
    try {
      const res = await hrTaskService.deleteHrTask(task._id);
      if (res.success) {
        toast.success("HR Task deleted successfully");
        if (selectedTask?._id === task._id) {
          setIsDetailDrawerOpen(false);
          setSelectedTask(null);
        }
        fetchData(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete task");
    }
  };

  // Due Date Badge Logic (day based: a task due today is not overdue)
  const getDueDateInfo = (task) => {
    const dueDateStr = task?.dueDate;
    if (!dueDateStr) return { text: "-", color: "text-slate-500", tag: null };

    if (task.status === "Completed") {
      const done = task.completedAt ? new Date(task.completedAt) : null;
      const due = new Date(dueDateStr);
      const late = done && done.setHours(0, 0, 0, 0) > due.setHours(0, 0, 0, 0);
      return {
        text: formatDate(dueDateStr),
        color: "text-slate-500 dark:text-slate-400",
        tag: task.completedAt ? (late ? "Done late" : "Done on time") : null,
        tagClass: late
          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
          : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(dueDateStr);
    dueDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: formatDate(dueDateStr),
        color: "text-rose-600 dark:text-rose-400 font-semibold",
        tag: `Overdue by ${Math.abs(diffDays)}d`,
        tagClass: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30",
      };
    }
    if (diffDays === 0) {
      return {
        text: formatDate(dueDateStr),
        color: "text-amber-600 dark:text-amber-400 font-semibold",
        tag: "Due Today",
        tagClass: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
      };
    }
    if (diffDays <= 3) {
      return {
        text: formatDate(dueDateStr),
        color: "text-amber-600 dark:text-amber-400 font-medium",
        tag: `Due in ${diffDays}d`,
        tagClass: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-300/40",
      };
    }
    return { text: formatDate(dueDateStr), color: "text-slate-700 dark:text-slate-300", tag: null };
  };

  const counts = metrics?.counts || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 p-3 sm:p-5 lg:p-6 space-y-4">
      {/* 1. TOP HEADER & WORKSPACE SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[image:var(--btn-gradient-bg)] flex items-center justify-center text-white shadow-md">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                HR Task Management
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {isManager ? "Manager Oversight" : "HR Workspace"}
                </span>
              </h1>
              <p className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400">
                {isManager
                  ? "Assign work to HR team members and track progress by status: Not Started, In Progress, On Hold, Completed."
                  : "Work through your tasks, tick off checklist items, and update the status as you go."}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Unread Alerts pill & clear */}
          {unreadHrNotifications.length > 0 && (
            <button
              onClick={handleMarkAllHrAsRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[12px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer shadow-xs animate-pulse"
              title="Click to mark all HR alerts as read"
            >
              <FiAlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{unreadHrNotifications.length} New Alert{unreadHrNotifications.length > 1 ? "s" : ""}</span>
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-md font-semibold ml-1">Mark Read</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            title="Refresh Tasks"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[var(--color-brand-primary)]" : ""}`} />
          </button>

          {/* Workload button for Managers */}
          {isManager && (
            <button
              onClick={() => setIsWorkloadModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[var(--color-brand-primary)] dark:hover:border-[var(--color-brand-primary)] text-[12px] sm:text-[13px] font-semibold transition-all cursor-pointer shadow-xs"
            >
              <FiUsers className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>HR Workload</span>
            </button>
          )}

          {/* Create Task button (Manager assigns to HR; HR self-assigns) */}
          <button
            id="create-hr-task-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[image:var(--btn-gradient-bg)] hover:brightness-110 text-white font-semibold text-[12px] sm:text-[13px] shadow-md shadow-[color:var(--btn-glow-shadow)] transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>{isManager ? "Assign HR Task" : "Add My Task"}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS / DASHBOARD COUNTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            key: "Not Started",
            label: "Not Started",
            value: counts.notStarted,
            sub: `${counts.open ?? 0} open total`,
            icon: LuListTodo,
            tone: "text-slate-700 dark:text-slate-200",
            chip: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
            onClick: () => { setStatusFilter("Not Started"); setDueDateFilter("all"); },
          },
          {
            key: "In Progress",
            label: "In Progress",
            value: counts.inProgress,
            sub: "Ongoing",
            icon: FiClock,
            tone: "text-blue-600 dark:text-blue-400",
            chip: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
            onClick: () => { setStatusFilter("In Progress"); setDueDateFilter("all"); },
          },
          {
            key: "On Hold",
            label: "On Hold",
            value: counts.onHold,
            sub: "Paused",
            icon: FiPauseCircle,
            tone: "text-amber-600 dark:text-amber-400",
            chip: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
            highlight: (counts.onHold ?? 0) > 0,
            onClick: () => { setStatusFilter("On Hold"); setDueDateFilter("all"); },
          },
          {
            key: "overdue",
            label: "Overdue",
            value: counts.overdue,
            sub: "Past due date",
            icon: LuClockAlert,
            tone: "text-rose-600 dark:text-rose-400",
            chip: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
            highlight: (counts.overdue ?? 0) > 0,
            onClick: () => { setStatusFilter("all"); setDueDateFilter("overdue"); },
          },
          {
            key: "Completed",
            label: "Completed",
            value: counts.completed,
            sub: `${counts.completionRate ?? 0}% of all tasks`,
            icon: FiCheckCircle,
            tone: "text-emerald-600 dark:text-emerald-400",
            chip: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
            onClick: () => { setStatusFilter("Completed"); setDueDateFilter("all"); },
          },
        ].map((card, i) => {
          const Icon = card.icon;
          const active =
            card.key === "overdue" ? dueDateFilter === "overdue" : statusFilter === card.key;
          return (
            <div
              key={card.key}
              onClick={card.onClick}
              className={`bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 border shadow-xs transition-all cursor-pointer ${
                i === 4 ? "col-span-2 sm:col-span-1" : ""
              } ${
                active
                  ? "border-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)]/20"
                  : card.highlight
                  ? "border-amber-300 dark:border-amber-700/60"
                  : "border-slate-200/80 dark:border-white/5 hover:border-[var(--color-brand-primary)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <span className={`p-2 rounded-xl ${card.chip}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-xl font-bold ${card.tone}`}>{card.value ?? 0}</span>
                <span className="text-[11px] text-slate-400">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
        {/* Search bar & quick filters */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
           
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HR tasks by title, category, description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-[var(--color-brand-primary)] text-[12px] sm:text-[13px] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Assignee filter for Manager */}
            {isManager && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)] cursor-pointer"
              >
                <option value="all">All HR Assignees</option>
                {hrUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role === "humanresource" ? "HR" : u.department || "Team"})
                  </option>
                ))}
              </select>
            )}

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {HR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* Due date filter */}
            <select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)] cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="due_soon">Due Soon (&le; 3 Days)</option>
              <option value="today">Due Today</option>
              <option value="this_week">This Week</option>
              <option value="overdue">Overdue Tasks</option>
            </select>

            {/* Reset Filters button if any filter active */}
            {(statusFilter !== "all" ||
              priorityFilter !== "all" ||
              categoryFilter !== "all" ||
              assigneeFilter !== "all" ||
              dueDateFilter !== "all" ||
              searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                  setAssigneeFilter("all");
                  setDueDateFilter("all");
                  setSearchQuery("");
                }}
                className="px-3 py-2.5 rounded-xl text-[12px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800/60 pt-3">
          {[
            { id: "all", label: "All Tasks", count: counts.total },
            { id: "Not Started", label: "Not Started", count: counts.notStarted },
            { id: "In Progress", label: "In Progress", count: counts.inProgress },
            { id: "On Hold", label: "On Hold", count: counts.onHold },
            { id: "Completed", label: "Completed", count: counts.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[var(--color-brand-primary)] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${
                    statusFilter === tab.id
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TASK TABLE */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 animate-pulse">
              Loading HR tasks...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] dark:bg-indigo-950/30 text-[var(--color-brand-primary)] flex items-center justify-center mx-auto">
              <FiBriefcase className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No HR Tasks Found
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {isManager
                  ? "No tasks match your current filters. Create a new task to assign work to HR team members."
                  : "You have no tasks matching this criteria. When manager assigns work, it will appear here."}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] hover:brightness-110 text-white font-semibold text-[12px] transition-all shadow-xs"
            >
              <FiPlus className="w-4 h-4" />
              {isManager ? "Assign New Task" : "Add My Task"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 sm:px-6">Task</th>
                  <th className="py-3 px-4">HR Assignee</th>
                  <th className="py-3 px-4">Assigned By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[12px] sm:text-[13px]">
                {tasks.map((task) => {
                  const priorityMeta = getPriorityBadge(task.priority);
                  const dueMeta = getDueDateInfo(task);

                  const checklistDone = (task.checklist || []).filter((c) => c.completed).length;
                  const checklistTotal = (task.checklist || []).length;
                  const checklistPercent =
                    checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

                  const isOnHold = task.status === "On Hold";

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Task Column */}
                      <td className="py-3 px-4 sm:px-5 max-w-xs sm:max-w-md">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[var(--color-brand-primary)] dark:group-hover:text-[var(--color-brand-primary)] transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDetailDrawerOpen(true);
                                if (notifications) {
                                  notifications.forEach((n) => {
                                    const nTaskId = typeof n.hrTask === "object" ? n.hrTask?._id : n.hrTask;
                                    if (!n.isRead && (nTaskId === task._id || (n.message && n.message.includes(task.title)))) {
                                      dispatch(markAsRead(n._id));
                                    }
                                  });
                                }
                              }}
                            >
                              {task.title}
                            </span>
                            {isOnHold && task.holdReason && (
                              <span
                                title={`On Hold: ${task.holdReason}`}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 max-w-[160px]"
                              >
                                <FiPauseCircle className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{task.holdReason}</span>
                              </span>
                            )}
                            {taskHasUnreadAlert(task._id) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 to-amber-500 text-white flex items-center gap-1 animate-pulse shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                New Alert
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {task.category || "General HR"}
                            </span>

                            {checklistTotal > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <LuClipboardCheck className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                                <span>
                                  {checklistDone}/{checklistTotal} ({checklistPercent}%)
                                </span>
                              </div>
                            )}

                            {(task.comments || []).length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                <FiMessageSquare className="w-3 h-3" />
                                <span>{(task.comments || []).length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* HR Assignee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {getUserAvatar(task.assignedTo) ? (
                            <img
                              src={getUserAvatar(task.assignedTo)}
                              alt={task.assignedTo?.name || "HR Assignee"}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{ display: getUserAvatar(task.assignedTo) ? "none" : "flex" }}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[10px] items-center justify-center ring-2 ring-indigo-500/20 shadow-xs shrink-0"
                          >
                            {getInitials(task.assignedTo?.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[12px] truncate max-w-[130px]">
                              {task.assignedTo?.name || "Unassigned"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                              {task.assignedTo?.department || "HR Team"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {getUserAvatar(task.createdBy) ? (
                            <img
                              src={getUserAvatar(task.createdBy)}
                              alt={task.createdBy?.name || "Assigned By"}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20 shadow-xs shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{ display: getUserAvatar(task.createdBy) ? "none" : "flex" }}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 text-white font-bold text-[10px] items-center justify-center ring-2 ring-purple-500/20 shadow-xs shrink-0"
                          >
                            {getInitials(task.createdBy?.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[12px] truncate max-w-[130px]">
                              {task.createdBy?.name || "Manager"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                              {task.createdBy?.role === "operationmanager"
                                ? "Operation Manager"
                                : task.createdBy?.role === "admin"
                                ? "Managing Partner"
                                : "Manager"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${priorityMeta.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                          {task.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusSelect
                          task={task}
                          canEdit={canEditStatus(task) && !submittingAction}
                          canReopen={isManager}
                          onChange={handleStatusChange}
                        />
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className={`font-medium text-[12px] ${dueMeta.color}`}>
                            {dueMeta.text}
                          </div>
                          {dueMeta.tag && (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${dueMeta.tagClass}`}
                            >
                              {dueMeta.tag}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[12px]">
                        {getRelativeTime(task.lastUpdated || task.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                            title="Open Task Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>

                          {/* Manager: Edit */}
                          {isManager && (
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                              title="Edit / Reassign Task"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Manager / Admin: Delete */}
                          {isManager && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(task, e)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete Task"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. CREATE TASK MODAL (Manager) */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        hrUsers={hrUsers}
        isManager={isManager}
        currentUser={currentUser}
        onTaskCreated={() => {
          setIsCreateModalOpen(false);
          fetchData(true);
        }}
      />

      {/* 6. EDIT TASK MODAL (Manager) */}
      {isEditModalOpen && selectedTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          task={selectedTask}
          hrUsers={hrUsers}
          onClose={() => setIsEditModalOpen(false)}
          onTaskUpdated={(updated) => {
            setIsEditModalOpen(false);
            setSelectedTask(updated);
            fetchData(true);
          }}
        />
      )}

      {/* 7. TASK DETAILS DRAWER (Full instructions, checklist, attachments, comments, timeline) */}
      {isDetailDrawerOpen && selectedTask && (
        <TaskDetailsDrawer
          isOpen={isDetailDrawerOpen}
          task={selectedTask}
          isManager={isManager}
          currentUser={currentUser}
          onClose={() => setIsDetailDrawerOpen(false)}
          onToggleChecklist={(itemId) => handleToggleChecklist(selectedTask._id, itemId)}
          canEditStatus={canEditStatus(selectedTask)}
          onStatusChange={handleStatusChange}
          dueMeta={getDueDateInfo(selectedTask)}
          submittingAction={submittingAction}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          onAddComment={handleAddComment}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* 8. ON HOLD REASON MODAL */}
      {holdDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <FiPauseCircle className="w-5 h-5" />
                Put Task On Hold
              </h3>
              <button
                onClick={() => setHoldDialog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Task</div>
              <div className="text-[13px] font-bold text-slate-900 dark:text-white mt-0.5">
                {holdDialog.task.title}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Why is this task on hold? <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                autoFocus
                value={holdDialog.reason}
                onChange={(e) => setHoldDialog((d) => ({ ...d, reason: e.target.value }))}
                placeholder="E.g. Waiting on candidate documents, pending approval from finance..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-[12px] focus:outline-hidden focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                {isManager
                  ? "The assignee will be notified with this reason."
                  : "Your manager will be notified with this reason."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setHoldDialog(null)}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !holdDialog.reason.trim()}
                onClick={handleConfirmHold}
                className="px-5 py-2 rounded-xl text-[12px] font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAction ? "Saving..." : "Put On Hold"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 10. HR WORKLOAD MODAL (Manager View) */}
      {isWorkloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-[var(--color-brand-primary)]" />
                  HR Team Workload Overview
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Monitor active task distribution and overdue workloads across HR team members.
                </p>
              </div>
              <button
                onClick={() => setIsWorkloadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {!metrics?.workload || metrics.workload.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-[12px]">
                  No HR members registered yet.
                </div>
              ) : (
                metrics.workload.map((w) => {
                  const user = w.user;
                  return (
                    <div
                      key={user._id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {getUserAvatar(user) ? (
                          <img
                            src={getUserAvatar(user)}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[12px] flex items-center justify-center">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-[13px]">
                            {user.name}
                          </div>
                          <div className="text-[12px] text-slate-400">
                            {user.email} &bull; {user.department || "Human Resources"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[12px] font-semibold">
                        {[
                          { label: "Not Started", value: w.notStarted, cls: "text-slate-700 dark:text-slate-200" },
                          { label: "In Progress", value: w.inProgress, cls: "text-blue-600 dark:text-blue-400" },
                          { label: "On Hold", value: w.onHold, cls: "text-amber-600 dark:text-amber-400" },
                          { label: "Overdue", value: w.overdue, cls: "text-rose-600 dark:text-rose-400" },
                          { label: "Completed", value: w.completed, cls: "text-emerald-600 dark:text-emerald-400" },
                        ].map((m) => (
                          <div key={m.label} className="text-center">
                            <div className={`text-[13px] font-black ${m.cls}`}>{m.value ?? 0}</div>
                            <div className="text-[10px] text-slate-400 whitespace-nowrap">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsWorkloadModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[12px]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CREATE TASK MODAL COMPONENT (Manager)
// ==========================================
const CreateTaskModal = ({ isOpen, onClose, hrUsers, isManager, currentUser, onTaskCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General HR");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [checklist, setChecklist] = useState([""]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isManager) {
      // HR user: always self-assign
      const myId = currentUser?._id || currentUser?.id;
      if (myId && assignedTo !== myId) {
        setAssignedTo(myId);
      }
    } else if (hrUsers && hrUsers.length > 0 && !assignedTo) {
      setAssignedTo(hrUsers[0]._id);
    }
  }, [hrUsers, assignedTo, isManager, currentUser]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    setChecklist([...checklist, ""]);
  };

  const handleChecklistChange = (index, value) => {
    const updated = [...checklist];
    updated[index] = value;
    setChecklist(updated);
  };

  const handleRemoveChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await hrTaskService.uploadAttachment(file);
      if (res.success) {
        setAttachments([...attachments, res.data]);
        toast.success(`Attached ${file.name}`);
      }
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!dueDate) {
      toast.error("Please specify a due date");
      return;
    }
    // HR users self-assign; backend also enforces this using the logged-in user
    if (isManager && !assignedTo) {
      toast.error("Please select an HR assignee");
      return;
    }

    try {
      setSubmitting(true);
      const cleanChecklist = checklist
        .filter((item) => item.trim())
        .map((item) => ({ item: item.trim(), completed: false }));

      const res = await hrTaskService.createHrTask({
        title,
        description,
        category,
        priority,
        dueDate,
        assignedTo: isManager ? assignedTo : undefined,
        checklist: cleanChecklist,
        attachments,
      });

      if (res.success) {
        toast.success("HR task assigned successfully!");
        onTaskCreated();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-[var(--color-brand-primary)]" />
              {isManager ? "Assign New HR Task" : "Add My Task"}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {isManager
                ? "Create and delegate human resource tasks with checklists and due dates."
                : "Create a task for yourself with a checklist and due date."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Complete Q4 Payroll Reconciliation & Tax Verification"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white text-[12px] sm:text-[13px] focus:outline-hidden focus:border-[var(--color-brand-primary)]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
              Instructions & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide full instructions, guidelines, and expectations for the HR member..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white text-[12px] focus:outline-hidden focus:border-[var(--color-brand-primary)]"
            />
          </div>

          {/* Category, Priority, Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                HR Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
              >
                {HR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          {/* HR Assignee (Manager only; HR users self-assign) */}
          {!isManager && (
            <div className="px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-[12px] font-semibold text-indigo-700 dark:text-indigo-300">
              This task will be assigned to you ({currentUser?.name || "me"}).
            </div>
          )}
          {isManager && (
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
              Assign to HR Team Member <span className="text-red-500">*</span>
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white text-[12px] sm:text-[13px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
            >
              <option value="">Select HR team member</option>
              {hrUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} — ({u.role === "humanresource" ? "HR" : u.department || "Team Member"})
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Checklist Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LuClipboardCheck className="w-4 h-4 text-[var(--color-brand-primary)]" />
                Task Checklist Items
              </label>
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="text-[12px] text-[var(--color-brand-primary)] dark:text-[var(--color-brand-primary)] font-semibold hover:underline flex items-center gap-1"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 w-4">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleChecklistChange(index, e.target.value)}
                    placeholder={`Checklist item ${index + 1}...`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[12px] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[var(--color-brand-primary)]"
                  />
                  {checklist.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiPaperclip className="w-4 h-4 text-[var(--color-brand-primary)]" />
              Attachments / References
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all">
                <FiPaperclip className="w-3.5 h-3.5" />
                <span>{uploading ? "Uploading..." : "Attach File"}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <span className="text-[11px] text-slate-400">
                {attachments.length} attachment(s) added
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <FiFileText className="w-3 h-3 text-[var(--color-brand-primary)]" />
                    {att.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[image:var(--btn-gradient-bg)] hover:brightness-110 text-white font-semibold text-[12px] sm:text-[13px] shadow-md shadow-[color:var(--btn-glow-shadow)] transition-all cursor-pointer"
            >
              {submitting ? "Saving..." : isManager ? "Assign Task to HR" : "Add Task"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ==========================================
// EDIT TASK MODAL COMPONENT (Manager)
// ==========================================
const EditTaskModal = ({ isOpen, task, hrUsers, onClose, onTaskUpdated }) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [category, setCategory] = useState(task?.category || "General HR");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || task?.assignedTo || "");
  const [checklist, setChecklist] = useState(task?.checklist || []);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddChecklist = () => {
    setChecklist([...checklist, { item: "", completed: false }]);
  };

  const handleChecklistChange = (index, value) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], item: value };
    setChecklist(updated);
  };

  const handleRemoveChecklist = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !assignedTo) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await hrTaskService.updateHrTask(task._id, {
        title,
        description,
        category,
        priority,
        dueDate,
        assignedTo,
        checklist,
      });

      if (res.success) {
        toast.success("HR task updated successfully!");
        onTaskUpdated(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiEdit className="w-5 h-5 text-[var(--color-brand-primary)]" />
            Edit / Reassign Task
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white text-[12px] sm:text-[13px] focus:outline-hidden focus:border-[var(--color-brand-primary)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
              Instructions / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white text-[12px] focus:outline-hidden focus:border-[var(--color-brand-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
              >
                {HR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-[12px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          {/* Reassign Assignee */}
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
              HR Assignee (Reassign)
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white text-[12px] sm:text-[13px] font-semibold focus:outline-hidden focus:border-[var(--color-brand-primary)]"
            >
              {hrUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} — ({u.role === "humanresource" ? "HR" : u.department || "Team Member"})
                </option>
              ))}
            </select>
          </div>

          {/* Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Checklist
              </label>
              <button
                type="button"
                onClick={handleAddChecklist}
                className="text-[12px] text-[var(--color-brand-primary)] font-semibold hover:underline flex items-center gap-1"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.item || ""}
                    onChange={(e) => handleChecklistChange(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[12px] text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(index)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-brand-primary)] hover:brightness-110 text-white font-semibold text-[12px] sm:text-[13px] shadow-md transition-all cursor-pointer"
            >
              {submitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ==========================================
// TASK DETAILS DRAWER COMPONENT
// ==========================================
const TaskDetailsDrawer = ({
  isOpen,
  task,
  isManager,
  currentUser,
  onClose,
  onToggleChecklist,
  canEditStatus,
  onStatusChange,
  dueMeta,
  submittingAction,
  newCommentText,
  setNewCommentText,
  onAddComment,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState("checklist"); // 'checklist' | 'comments' | 'history' | 'attachments'

  if (!isOpen || !task) return null;

  const priorityMeta = getPriorityBadge(task.priority);
  const isCompleted = task.status === "Completed";
  const checklistLocked = isCompleted || !canEditStatus;

  const checklistDone = (task.checklist || []).filter((c) => c.completed).length;
  const checklistTotal = (task.checklist || []).length;
  const checklistPercent =
    checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${priorityMeta.bg}`}>
                {task.priority} Priority
              </span>
              <StatusSelect
                task={task}
                canEdit={canEditStatus && !submittingAction}
                canReopen={isManager}
                onChange={onStatusChange}
                size="lg"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {isManager && onDeleteTask && (
                <button
                  type="button"
                  onClick={() => onDeleteTask(task)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Task"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            {task.title}
          </h2>

          {/* HR Assignee and Assigned By Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
            {/* HR Assignee */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              {getUserAvatar(task.assignedTo) ? (
                <img
                  src={getUserAvatar(task.assignedTo)}
                  alt={task.assignedTo?.name || "HR Assignee"}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                style={{ display: getUserAvatar(task.assignedTo) ? "none" : "flex" }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[10px] items-center justify-center ring-2 ring-indigo-500/20 shadow-xs shrink-0"
              >
                {getInitials(task.assignedTo?.name)}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-medium">HR Assignee</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[12px] truncate">
                  {task.assignedTo?.name || "Unassigned"}
                </div>
              </div>
            </div>

            {/* Assigned By */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              {getUserAvatar(task.createdBy) ? (
                <img
                  src={getUserAvatar(task.createdBy)}
                  alt={task.createdBy?.name || "Assigned By"}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20 shadow-xs shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                style={{ display: getUserAvatar(task.createdBy) ? "none" : "flex" }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 text-white font-bold text-[10px] items-center justify-center ring-2 ring-purple-500/20 shadow-xs shrink-0"
              >
                {getInitials(task.createdBy?.name)}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-medium">Assigned By</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[12px] truncate">
                  {task.createdBy?.name || "Manager"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-slate-500 dark:text-slate-400 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
              <span>Due: <strong className="text-slate-800 dark:text-slate-200">{formatDate(task.dueDate)}</strong></span>
              {dueMeta?.tag && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${dueMeta.tagClass}`}>
                  {dueMeta.tag}
                </span>
              )}
            </div>
            {task.startedAt && (
              <div className="flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                <span>Started {formatDate(task.startedAt)}</span>
              </div>
            )}
            {isCompleted && task.completedAt && (
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Completed {formatDate(task.completedAt)}
                  {task.completedBy?.name ? ` by ${task.completedBy.name}` : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FiFolder className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
              <span>{task.category || "General HR"}</span>
            </div>
          </div>
        </div>

        {/* On Hold Banner */}
        {task.status === "On Hold" && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FiPauseCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-[12px] font-bold text-amber-800 dark:text-amber-300">
                  Task is On Hold
                </div>
                <div className="text-[12px] text-amber-700 dark:text-amber-400 mt-0.5">
                  {task.holdReason ? `"${task.holdReason}"` : "No reason provided"}
                </div>
              </div>
            </div>
            {canEditStatus && (
              <button
                onClick={() => onStatusChange(task, "In Progress")}
                disabled={submittingAction}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
              >
                Resume
              </button>
            )}
          </div>
        )}

        {/* Description / Instructions */}
        {task.description && (
          <div className="px-5 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-[12px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </div>
          </div>
        )}

        {/* Quick actions */}
        {canEditStatus && !isCompleted && (
          <div className="px-5 pt-4 flex items-center gap-2.5 flex-wrap">
            {task.status === "Not Started" && (
              <button
                onClick={() => onStatusChange(task, "In Progress")}
                disabled={submittingAction}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] hover:brightness-110 text-white font-semibold text-[12px] shadow-md transition-all cursor-pointer"
              >
                <FiArrowRight className="w-3.5 h-3.5" />
                Start Task
              </button>
            )}
            {task.status !== "On Hold" && (
              <button
                onClick={() => onStatusChange(task, "On Hold")}
                disabled={submittingAction}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 text-[12px] font-semibold transition-all cursor-pointer"
              >
                <FiPauseCircle className="w-3.5 h-3.5" />
                Put On Hold
              </button>
            )}
            <button
              onClick={() => onStatusChange(task, "Completed")}
              disabled={submittingAction}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              Mark Completed
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          {[
            { id: "checklist", label: `Checklist (${checklistDone}/${checklistTotal})` },
            { id: "comments", label: `Notes (${(task.comments || []).length})` },
            { id: "attachments", label: `Files (${(task.attachments || []).length})` },
            { id: "history", label: "Timeline" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-2 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-indigo-600 text-[var(--color-brand-primary)] dark:text-[var(--color-brand-primary)]"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>Progress Completion</span>
                  <span>{checklistPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {(!task.checklist || task.checklist.length === 0) ? (
                  <p className="text-[12px] text-slate-400 text-center py-4">
                    No checklist items defined for this task.
                  </p>
                ) : (
                  task.checklist.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => !checklistLocked && onToggleChecklist(c._id)}
                      title={isCompleted ? "Reopen the task to change the checklist" : undefined}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        checklistLocked ? "cursor-default opacity-80" : "cursor-pointer"
                      } ${
                        c.completed
                          ? "bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[var(--color-brand-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            c.completed
                              ? "bg-emerald-500 text-white"
                              : "border-2 border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {c.completed && <FiCheck className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-[12px] ${
                            c.completed
                              ? "line-through text-slate-400 dark:text-slate-500 font-medium"
                              : "text-slate-800 dark:text-slate-200 font-semibold"
                          }`}
                        >
                          {c.item}
                        </span>
                      </div>

                      {c.completedAt && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(c.completedAt)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {!isCompleted && checklistTotal > 0 && checklistDone === checklistTotal && canEditStatus && (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
                    All checklist items are done. Ready to close this task?
                  </span>
                  <button
                    onClick={() => onStatusChange(task, "Completed")}
                    disabled={submittingAction}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                  >
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMMENTS / NOTES */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!task.comments || task.comments.length === 0) ? (
                  <p className="text-[12px] text-slate-400 text-center py-6">
                    No comments or progress notes yet.
                  </p>
                ) : (
                  task.comments.map((cm, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-[12px] space-y-1 ${
                        cm.isFeedback
                          ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50"
                          : "bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                            {getUserAvatar(cm.user) ? (
                              <img
                                src={getUserAvatar(cm.user)}
                                alt={cm.user?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                                {getInitials(cm.user?.name)}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {cm.user?.name || "User"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {getRelativeTime(cm.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {cm.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={onAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a progress note or update..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[12px] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[var(--color-brand-primary)]"
                />
                <button
                  type="submit"
                  disabled={submittingAction || !newCommentText.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] hover:brightness-110 text-white font-semibold text-[12px] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  Post
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-3">
              {(!task.attachments || task.attachments.length === 0) ? (
                <p className="text-[12px] text-slate-400 text-center py-6">
                  No attachments on this task.
                </p>
              ) : (
                task.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-[12px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <FiFileText className="w-4 h-4 text-[var(--color-brand-primary)]" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {att.fileType || "File"}
                        </div>
                      </div>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-brand-primary)_18%,transparent)] text-[var(--color-brand-primary)] hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: TIMELINE / ACTIVITY HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {(!task.activityHistory || task.activityHistory.length === 0) ? (
                <p className="text-[12px] text-slate-400 text-center py-6">
                  No history recorded yet.
                </p>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {task.activityHistory
                    .slice()
                    .reverse()
                    .map((h, i) => (
                      <div key={i} className="relative text-[12px]">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {h.action}
                        </div>
                        {h.details && (
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                            {h.details}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {h.performedBy?.name || "System"} &bull; {getRelativeTime(h.timestamp)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HrTasks;
