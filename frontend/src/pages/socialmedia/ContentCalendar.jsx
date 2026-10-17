import React, { useState, useEffect, useMemo } from "react";
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
} from "react-icons/fi";
import {
  getSocialmediaTasks,
  getSocialmediaStats,
  rescheduleSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";

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

const ContentCalendar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "admin";

  const { tasks, stats, loading } = useSelector((state) => state.socialmediaTasks);
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

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

  // Fetch dynamic tasks and stats
  useEffect(() => {
    dispatch(getSocialmediaTasks({ year: currentYear, month: currentMonth + 1 }));
    dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    if (!clients || clients.length === 0) dispatch(getClients());
    if (!users || users.length === 0) dispatch(getUsers());
  }, [dispatch, currentYear, currentMonth]);

  // Deduplicate tasks by taskTitle + clientName
  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return tasks.filter((t) => {
      const key = `${(t.taskTitle || '').trim().toLowerCase()}___${(t.clientName || '').trim().toLowerCase()}`;
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
      const creator = t.createdBy?.name || t.createdByName || t.assigneeName;
      if (creator) set.add(creator);
    });
    return ["All", ...Array.from(set)];
  }, [users, uniqueTasks]);

  // Filtered tasks for calendar (only tasks with publishDate)
  const calendarTasks = useMemo(() => {
    return uniqueTasks.filter((task) => {
      if (!task.publishDate) return false;

      if (selectedClient !== "All" && task.clientName !== selectedClient) return false;
      if (selectedCategory !== "All" && task.category !== selectedCategory) return false;
      if (selectedContentType !== "All" && task.contentType !== selectedContentType) return false;
      if (selectedStatus !== "All" && task.status !== selectedStatus) return false;
      if (selectedAssignee !== "All") {
        const creator = task.createdBy?.name || task.createdByName || task.assigneeName;
        if (creator !== selectedAssignee) return false;
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
        if (diffHours > 24) return false;
      }

      return true;
    });
  }, [
    uniqueTasks,
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
        dateKey: dateObj.toISOString().split("T")[0],
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      days.push({
        date: dateObj,
        dayNumber: i,
        isCurrentMonth: true,
        dateKey: dateObj.toISOString().split("T")[0],
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
          dateKey: dateObj.toISOString().split("T")[0],
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    calendarTasks.forEach((task) => {
      if (!task.publishDate) return;
      const key = new Date(task.publishDate).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
    });

    return map;
  }, [calendarTasks]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
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
      dispatch(deleteSocialmediaTask(task._id));
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
          dueDate: newPublishDate,
        },
      })
    );
    setDraggedTaskId(null);
  };

  // Status badge styling helper
  const renderStatusBadge = (status, isAtRisk = false) => {
    if (isAtRisk) {
      return (
        <span className="text-[9px] font-black tracking-wide text-rose-700 bg-rose-100 dark:bg-rose-950/70 dark:text-rose-300 px-1.5 py-0.5 rounded uppercase">
          Risk
        </span>
      );
    }

    switch (status) {
      case "Live":
      case "Completed":
        return (
          <span className="text-[9px] font-black tracking-wide text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase">
            Live
          </span>
        );
      case "In QC":
        return (
          <span className="text-[9px] font-black tracking-wide text-amber-700 bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 px-1.5 py-0.5 rounded uppercase">
            QC
          </span>
        );
      case "Scheduled":
        return (
          <span className="text-[9px] font-black tracking-wide text-indigo-700 bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 px-1.5 py-0.5 rounded uppercase">
            Sched
          </span>
        );
      case "Overdue":
        return (
          <span className="text-[9px] font-black tracking-wide text-rose-700 bg-rose-100 dark:bg-rose-950/70 dark:text-rose-300 px-1.5 py-0.5 rounded uppercase">
            Risk
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-black tracking-wide text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase">
            Draft
          </span>
        );
    }
  };

  const formatCardTime = (dateVal) => {
    if (!dateVal) return "12:00";
    const d = new Date(dateVal);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const outletContext = useOutletContext() || {};
  const setSidebarOpen = outletContext?.setSidebarOpen;

  // Real today date check
  const realTodayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
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
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h1>
          </div>
        </div>

        {/* Navigation & View switcher */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Month selector navigation */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <FiChevronRight size={16} />
            </button>
          </div>

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
            onClick={() => navigate(`/${role}/sm-tasks`)}
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

          {/* Assignee */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Assignee</option>
            {assigneeOptions
              .filter((a) => a !== "All")
              .map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>

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
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{stats.commitments ?? 0}</span>{" "}
          commitments ·{" "}
          <span className="font-bold text-slate-800 dark:text-slate-200">{stats.activeClients ?? 0}</span> clients
        </div>
      </div>

      {/* VIEW MODES: MONTH | WEEK | LIST */}

      {/* 1. MONTH VIEW */}
      {viewMode === "Month" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
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
                  className={`min-h-[145px] sm:min-h-[160px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
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
                      const isRisk =
                        !["Completed", "Live"].includes(post.status) &&
                        post.publishDate &&
                        (new Date(post.publishDate).getTime() - Date.now()) / (1000 * 60 * 60) <= 24;

                      return (
                        <div
                          key={post._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, post._id)}
                          onClick={(e) => handleCardClick(post, e)}
                          className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer relative overflow-hidden group/card"
                          style={{ borderLeftWidth: "3px", borderLeftColor: clientColor }}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] leading-tight mb-0.5">
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate font-mono uppercase">
                              {formatCardTime(post.publishDate)} {post.contentType}
                            </span>
                            {renderStatusBadge(post.status, isRisk)}
                          </div>

                          <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {post.clientName}
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
            {calendarDays.slice(0, 7).map((dayItem, idx) => {
              const postsForDay = tasksByDate[dayItem.dateKey] || [];
              return (
                <div
                  key={idx}
                  onClick={() => handleAddPostOnDate(dayItem.date)}
                  className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 min-h-[220px] flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50 mb-2">
                    <span className="text-xs font-black text-slate-500 uppercase">
                      {WEEK_DAYS[idx]}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {dayItem.dayNumber} {MONTH_NAMES[currentMonth].slice(0, 3)}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {postsForDay.map((p) => (
                      <div
                        key={p._id}
                        onClick={(e) => handleCardClick(p, e)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs hover:border-indigo-400 transition-colors"
                        style={{ borderLeftWidth: "3px", borderLeftColor: p.clientColor || "#6366f1" }}
                      >
                        <div className="font-bold text-[10px] text-slate-500">
                          {formatCardTime(p.publishDate)} · {p.contentType}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {p.clientName}
                        </div>
                      </div>
                    ))}
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
              calendarTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={(e) => handleCardClick(task, e)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ borderLeftWidth: "4px", borderLeftColor: task.clientColor || "#6366f1" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                      {formatCardTime(task.publishDate)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {task.clientName}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                          {task.contentType}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(task.publishDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {task.taskTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    {renderStatusBadge(task.status)}
                    <button
                      type="button"
                      onClick={() => handleCardClick(task, { stopPropagation: () => {} })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {selectedDayPosts.posts.map((post) => (
                <div
                  key={post._id}
                  onClick={(e) => {
                    setSelectedDayPosts(null);
                    handleCardClick(post, e);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-3"
                  style={{ borderLeftWidth: "4px", borderLeftColor: post.clientColor || "#6366f1" }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                        {formatCardTime(post.publishDate)}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        {post.contentType}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {post.clientName}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[220px]">
                      {post.taskTitle}
                    </div>
                  </div>
                  <div>{renderStatusBadge(post.status)}</div>
                </div>
              ))}
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
        onClose={() => setIsModalOpen(false)}
        task={selectedTaskForEdit}
        initialDate={initialDateForCreate}
      />
    </div>
  );
};

export default ContentCalendar;
