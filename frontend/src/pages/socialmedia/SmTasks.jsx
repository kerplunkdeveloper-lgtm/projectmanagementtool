import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiRepeat,
  FiArrowRight,
  FiLock,
  FiEye,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiX,
} from "react-icons/fi";
import {
  getSocialmediaTasks,
  getSocialmediaStats,
  updateSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";

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
const STATUSES = ["All", "In QC", "Scheduled", "Overdue", "Not started", "In progress", "Completed", "Live"];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const COMMITMENTS = ["All", "Yes", "No"];

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    return `${day} ${month}`;
  } catch {
    return "-";
  }
};

const formatPublishDateTime = (dateVal) => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${hh}:${mm}`;
  } catch {
    return "-";
  }
};

const SmTasks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "admin";

  const { tasks, totalCount, commitmentsCount, loading } = useSelector(
    (state) => state.socialmediaTasks
  );
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  // Filter States
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedContentType, setSelectedContentType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCommitment, setSelectedCommitment] = useState("All");
  const [selectedDueDateFilter, setSelectedDueDateFilter] = useState("All");
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Initial fetch of dynamic data
  useEffect(() => {
    dispatch(getSocialmediaTasks());
    dispatch(getSocialmediaStats());
    if (!clients || clients.length === 0) dispatch(getClients());
    if (!users || users.length === 0) dispatch(getUsers());
  }, [dispatch]);

  // Dynamic unique client list from real DB clients & tasks
  const clientOptions = useMemo(() => {
    const set = new Set();
    clients.forEach((c) => {
      if (c.companyName) set.add(c.companyName);
    });
    tasks.forEach((t) => {
      if (t.clientName) set.add(t.clientName);
    });
    return ["All", ...Array.from(set)];
  }, [clients, tasks]);

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

  // Client-side filtering
  const filteredTasks = useMemo(() => {
    return uniqueTasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          task.taskTitle?.toLowerCase().includes(q) ||
          task.clientName?.toLowerCase().includes(q) ||
          task.createdBy?.name?.toLowerCase().includes(q) ||
          task.createdByName?.toLowerCase().includes(q) ||
          task.assigneeName?.toLowerCase().includes(q) ||
          task.taskCode?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Client
      if (selectedClient !== "All" && task.clientName !== selectedClient) {
        return false;
      }

      // Category
      if (selectedCategory !== "All" && task.category !== selectedCategory) {
        return false;
      }

      // Content Type
      if (selectedContentType !== "All" && task.contentType !== selectedContentType) {
        return false;
      }

      // Status
      if (selectedStatus !== "All" && task.status !== selectedStatus) {
        return false;
      }

      // Priority
      if (selectedPriority !== "All" && task.priority !== selectedPriority) {
        return false;
      }

      // Commitment
      if (selectedCommitment !== "All") {
        const isYes = selectedCommitment === "Yes";
        if (Boolean(task.commitment) !== isYes) return false;
      }

      // At risk toggle
      if (atRiskOnly) {
        if (!task.commitment) return false;
        if (["Completed", "Live"].includes(task.status)) return false;
        const targetDate = task.publishDate || task.dueDate;
        if (!targetDate) return false;
        const diffHours = (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours > 24) return false;
      }

      // Due date filter
      if (selectedDueDateFilter === "Today") {
        const todayStr = new Date().toISOString().split("T")[0];
        const taskDueStr = task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "";
        if (taskDueStr !== todayStr) return false;
      } else if (selectedDueDateFilter === "Overdue") {
        if (["Completed", "Live"].includes(task.status)) return false;
        const targetDate = task.publishDate || task.dueDate;
        if (targetDate && new Date(targetDate).getTime() >= Date.now()) return false;
      }

      return true;
    });
  }, [
    uniqueTasks,
    searchQuery,
    selectedClient,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedPriority,
    selectedCommitment,
    atRiskOnly,
    selectedDueDateFilter,
  ]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;

  const currentCommitmentsCount = useMemo(() => {
    return filteredTasks.filter((t) => t.commitment).length;
  }, [filteredTasks]);

  const handleOpenCalendar = () => {
    navigate(`/${role}/content-calendar`);
  };

  const handleEditTask = (task) => {
    setSelectedTaskForEdit(task);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedTaskForEdit(null);
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = (task, newStatus) => {
    dispatch(updateSocialmediaTask({ id: task._id, data: { status: newStatus } }));
  };

  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${task.taskTitle}"?`)) {
      dispatch(deleteSocialmediaTask(task._id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100  p-2 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            Social Media Manager
          </span>
          <h1 className="text-2xl  font-extrabold text-slate-900 dark:text-white tracking-tight">
            My tasks
          </h1>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all self-start sm:self-auto cursor-pointer"
        >
          <FiPlus size={16} className="stroke-[2.5]" />
          <span>+ New task</span>
        </button>
      </div>

      {/* Synchronized Banner (Image 1 style) */}
      <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <FiRepeat size={16} />
          </div>
          <p className="text-xs  text-emerald-900 dark:text-emerald-200 font-medium">
            <span className="font-bold">Every row here is also a calendar card.</span> Give a task a publish date and
            it drops onto the content calendar in that slot — no second entry, no "add to calendar" step.
          </p>
        </div>

        <button
          onClick={handleOpenCalendar}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-100 transition-colors shrink-0 whitespace-nowrap self-end md:self-auto cursor-pointer"
        >
          <span>Open calendar</span>
          <FiArrowRight size={14} />
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Client Filter (Dynamic DB Clients) */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All clients</option>
            {clientOptions
              .filter((c) => c !== "All")
              .map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Category</option>
            {CATEGORIES.filter((c) => c !== "All").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Content Type Filter */}
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

          {/* Status Filter */}
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

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Priority</option>
            {PRIORITIES.filter((c) => c !== "All").map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          {/* Commitment Filter */}
          <select
            value={selectedCommitment}
            onChange={(e) => setSelectedCommitment(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Commitment</option>
            {COMMITMENTS.filter((c) => c !== "All").map((com) => (
              <option key={com} value={com}>
                {com}
              </option>
            ))}
          </select>

          {/* Due date filter */}
          <select
            value={selectedDueDateFilter}
            onChange={(e) => setSelectedDueDateFilter(e.target.value)}
            className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">Due date</option>
            <option value="Today">Due Today</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* At Risk Button (Image 1 style with red dot) */}
          <button
            type="button"
            onClick={() => setAtRiskOnly(!atRiskOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              atRiskOnly
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-xs"
                : "bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/60"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>At risk</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto">
            <input
              type="text"
              placeholder="Search tasks, clients..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-8 py-1.5 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Counter Info matching Image 1 - 100% Dynamic */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredTasks.length}</span> of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">{uniqueTasks.length}</span> tasks ·{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentCommitmentsCount}</span> are calendar
            commitments
          </div>
        </div>
      </div>

      {/* Main Table (Matching 1st Image) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Content Type</th>
                <th className="py-3 px-4">Created by</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">QC</th>
                <th className="py-3 px-4 bg-slate-100/50 dark:bg-slate-800/80 font-bold">Publish Date</th>
                <th className="py-3 px-3 bg-slate-100/50 dark:bg-slate-800/80 font-bold">Commitment</th>
                <th className="py-3 px-3 bg-slate-100/50 dark:bg-slate-800/80 font-bold">Calendar</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 italic">
                    Loading social media tasks...
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 mb-3">
                        <FiCalendar size={22} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                        No social media tasks found
                      </p>
                      <p className="text-xs text-slate-400 mb-4 max-w-sm text-center">
                        Create your first social media task or plan directly on the Content Calendar.
                      </p>
                      <button
                        onClick={handleCreateNew}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        + Create First Task
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => {
                  const clientColor = task.clientColor || "#6366f1";

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                      {/* TASK NAME with Left Accent Line */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-1 h-5 rounded-full shrink-0"
                            style={{ backgroundColor: clientColor }}
                          />
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {task.taskTitle}
                          </span>
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {task.clientName}
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.category || "Content"}
                        </span>
                      </td>

                      {/* CONTENT TYPE */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.contentType || "Post"}
                        </span>
                      </td>

                      {/* CREATED BY */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                            {(task.createdBy?.name || task.createdByName || task.assigneeName || "U")[0]}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {task.createdBy?.name || task.createdByName || task.assigneeName || "Admin"}
                          </span>
                        </div>
                      </td>

                      {/* DUE DATE */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {formatDisplayDate(task.dueDate)}
                      </td>

                      {/* STATUS - Interactive quick-change dropdown */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold border-0 cursor-pointer focus:ring-1 focus:ring-indigo-500 ${
                            task.status === "In QC"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : task.status === "Scheduled"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                              : task.status === "Overdue"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : task.status === "Not started"
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              : task.status === "In progress"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {STATUSES.filter((s) => s !== "All").map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* PRIORITY */}
                      <td className="py-3 px-3 font-bold">
                        {task.priority === "High" && <span className="text-rose-600 dark:text-rose-400">High</span>}
                        {task.priority === "Medium" && <span className="text-amber-600 dark:text-amber-400">Medium</span>}
                        {task.priority === "Low" && <span className="text-slate-500 dark:text-slate-400">Low</span>}
                      </td>

                      {/* QC */}
                      <td className="py-3 px-3">
                        {task.qc === "Pending" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50">
                            Pending
                          </span>
                        )}
                        {task.qc === "Passed" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                            Passed
                          </span>
                        )}
                        {task.qc === "Rejected" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            Rejected
                          </span>
                        )}
                        {(!task.qc || task.qc === "-") && <span className="text-slate-400">-</span>}
                      </td>

                      {/* PUBLISH DATE (Shaded column) */}
                      <td className="py-3 px-4 bg-slate-50/60 dark:bg-slate-800/40 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                        {formatPublishDateTime(task.publishDate)}
                      </td>

                      {/* COMMITMENT (Shaded column) */}
                      <td className="py-3 px-3 bg-slate-50/60 dark:bg-slate-800/40">
                        {task.commitment ? (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400">
                            <FiLock size={11} className="opacity-70" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                            <FiLock size={11} className="opacity-40" />
                            <span>No</span>
                          </span>
                        )}
                      </td>

                      {/* CALENDAR (Shaded column) */}
                      <td className="py-3 px-3 bg-slate-50/60 dark:bg-slate-800/40">
                        {task.onCalendar ? (
                          <span
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCalendar();
                            }}
                          >
                            On calendar
                          </span>
                        ) : (
                          <span className="text-slate-400">Not shown</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <FiEye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(task, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note and Pagination */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px] italic">
            Shaded columns are filled by Sorted, not by the SMM.
          </span>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Rows {filteredTasks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      <SmTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTaskForEdit}
      />
    </div>
  );
};

export default SmTasks;
