import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiPlus,
  FiSearch,
  FiEye,
  FiX,
  FiExternalLink,
  FiFilm,
  FiImage,
  FiLayers,
  FiFilter,
  FiStar,
  FiUser,
  FiFileText,
  FiPlay,
  FiTrendingUp,
  FiTag,
  FiBriefcase,
  FiRefreshCw,
  FiList,
  FiGrid,
} from "react-icons/fi";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../services/axiosInstance";

// Status styles helper
const getStatusStyles = (status = "") => {
  switch (status) {
    case "Live":
      return {
        badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
        dot: "bg-emerald-500",
        cardBorder: "hover:border-emerald-400 dark:hover:border-emerald-500/50",
      };
    case "Scheduled":
      return {
        badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30",
        dot: "bg-sky-500",
        cardBorder: "hover:border-sky-400 dark:hover:border-sky-500/50",
      };
    case "In QC":
      return {
        badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
        dot: "bg-amber-500",
        cardBorder: "hover:border-amber-400 dark:hover:border-amber-500/50",
      };
    case "In progress":
      return {
        badge: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
        dot: "bg-indigo-500",
        cardBorder: "hover:border-indigo-400 dark:hover:border-indigo-500/50",
      };
    case "Overdue":
      return {
        badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
        dot: "bg-rose-500",
        cardBorder: "hover:border-rose-400 dark:hover:border-rose-500/50",
      };
    case "Completed":
      return {
        badge: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30",
        dot: "bg-teal-500",
        cardBorder: "hover:border-teal-400 dark:hover:border-teal-500/50",
      };
    default:
      return {
        badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
        cardBorder: "hover:border-slate-300 dark:hover:border-slate-600",
      };
  }
};

// Content type icon helper
const getContentTypeIcon = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("reel")) return <FiFilm size={11} className="text-pink-500 shrink-0" />;
  if (t.includes("carousel")) return <FiLayers size={11} className="text-purple-500 shrink-0" />;
  if (t.includes("story")) return <FiClock size={11} className="text-amber-500 shrink-0" />;
  if (t.includes("youtube") || t.includes("video")) return <FiPlay size={11} className="text-red-500 shrink-0" />;
  if (t.includes("blog")) return <FiFileText size={11} className="text-blue-500 shrink-0" />;
  if (t.includes("ad")) return <FiTrendingUp size={11} className="text-emerald-500 shrink-0" />;
  return <FiImage size={11} className="text-indigo-500 shrink-0" />;
};

// Relative date indicator
const getRelativeDateLabel = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (isToday(d)) return { text: "Today", color: "bg-emerald-500 text-white font-black animate-pulse" };
    if (isTomorrow(d)) return { text: "Tomorrow", color: "bg-sky-500 text-white font-bold" };
    const now = new Date();
    if (d < now && !isToday(d)) return { text: "Past Due", color: "bg-rose-500 text-white font-black" };
    if (isThisWeek(d)) return { text: "This Week", color: "bg-indigo-500 text-white font-semibold" };
  } catch {
    return null;
  }
  return null;
};

// Avatar helper
const extractAvatarUrl = (profilePic) => {
  if (!profilePic) return null;
  if (typeof profilePic === "string") {
    if (profilePic.startsWith("http")) return profilePic;
    return `${axiosInstance.defaults.baseURL || ""}${profilePic.startsWith("/") ? "" : "/"}${profilePic}`;
  }
  if (typeof profilePic === "object" && profilePic.url) {
    if (profilePic.url.startsWith("http")) return profilePic.url;
    return `${axiosInstance.defaults.baseURL || ""}${profilePic.url.startsWith("/") ? "" : "/"}${profilePic.url}`;
  }
  return null;
};

const getAssigneeAvatar = (task) => {
  const target = task?.assignee || task?.createdBy;
  if (target) {
    if (target.avatar) return extractAvatarUrl(target.avatar);
    if (target.profilePic) return extractAvatarUrl(target.profilePic);
  }
  return null;
};

const ContentCalendarOverview = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth?.user);
  const clientsFromStore = useSelector((state) => state.clients?.clients || []);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "today", "upcoming", "scheduled", "inqc", "live", "overdue"
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"

  const userRole = (currentUser?.role?.name || currentUser?.role || "")
    .toString()
    .toLowerCase()
    .trim();
  const isSuperOrAdmin =
    userRole === "admin" ||
    userRole === "operationmanager" ||
    userRole === "operation manager";

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/socialmedia-task-calendar");
      setTasks(data.data || []);
    } catch (error) {
      console.error("Failed to fetch content calendar tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Clients list for filter dropdown
  const clientOptions = useMemo(() => {
    const map = new Map();
    clientsFromStore.forEach((c) => {
      if (c.companyName) {
        map.set(c.companyName.trim().toLowerCase(), c.companyName.trim());
      }
    });
    tasks.forEach((t) => {
      if (t.clientName) {
        map.set(t.clientName.trim().toLowerCase(), t.clientName.trim());
      }
      if (t.client?.companyName) {
        map.set(t.client.companyName.trim().toLowerCase(), t.client.companyName.trim());
      }
    });
    return Array.from(map.values()).sort();
  }, [clientsFromStore, tasks]);

  // Content types list for filter dropdown
  const contentTypeOptions = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.contentType) set.add(t.contentType.trim());
    });
    if (set.size === 0) {
      return ["Reel", "Carousel", "Static Post", "Story", "Video", "Ad"];
    }
    return Array.from(set).sort();
  }, [tasks]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    let todayCount = 0;
    let scheduledCount = 0;
    let inQcCount = 0;
    let liveCount = 0;
    let overdueCount = 0;
    const now = new Date();

    tasks.forEach((t) => {
      const dateStr = t.publishDate || t.dueDate;
      if (dateStr) {
        try {
          const parsed = parseISO(dateStr);
          if (isToday(parsed)) {
            todayCount += 1;
          }
          if (parsed < now && t.status !== "Completed" && t.status !== "Live") {
            overdueCount += 1;
          }
        } catch {}
      }

      const st = (t.status || "").toLowerCase();
      if (st === "scheduled") scheduledCount += 1;
      else if (st === "in qc") inQcCount += 1;
      else if (st === "live" || st === "completed") liveCount += 1;
      else if (st === "overdue") overdueCount += 1;
    });

    return {
      total,
      today: todayCount,
      scheduled: scheduledCount,
      inQc: inQcCount,
      live: liveCount,
      overdue: overdueCount,
    };
  }, [tasks]);

  // Filtered tasks based on tab, client, content type, and search query
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Filter by tab
    if (activeTab === "today") {
      list = list.filter((t) => {
        const d = t.publishDate || t.dueDate;
        if (!d) return false;
        try {
          return isToday(parseISO(d));
        } catch {
          return false;
        }
      });
    } else if (activeTab === "upcoming") {
      const now = new Date();
      list = list.filter((t) => {
        const d = t.publishDate || t.dueDate;
        if (!d) return false;
        try {
          return parseISO(d) >= now && t.status !== "Completed" && t.status !== "Live";
        } catch {
          return false;
        }
      });
    } else if (activeTab === "scheduled") {
      list = list.filter((t) => t.status === "Scheduled");
    } else if (activeTab === "inqc") {
      list = list.filter((t) => t.status === "In QC");
    } else if (activeTab === "live") {
      list = list.filter((t) => t.status === "Live" || t.status === "Completed");
    } else if (activeTab === "overdue") {
      const now = new Date();
      list = list.filter((t) => {
        if (t.status === "Overdue") return true;
        const dStr = t.publishDate || t.dueDate;
        if (!dStr) return false;
        try {
          return parseISO(dStr) < now && t.status !== "Completed" && t.status !== "Live";
        } catch {
          return false;
        }
      });
    }

    // Client filter
    if (selectedClient !== "all") {
      const cl = selectedClient.toLowerCase();
      list = list.filter(
        (t) =>
          (t.clientName || "").toLowerCase() === cl ||
          (t.client?.companyName || "").toLowerCase() === cl
      );
    }

    // Content Type filter
    if (selectedContentType !== "all") {
      const ct = selectedContentType.toLowerCase();
      list = list.filter((t) => (t.contentType || "").toLowerCase() === ct);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => {
        const titleMatch = (t.taskTitle || "").toLowerCase().includes(q);
        const codeMatch = (t.taskCode || "").toLowerCase().includes(q);
        const clientMatch = (t.clientName || t.client?.companyName || "").toLowerCase().includes(q);
        const catMatch = (t.category || "").toLowerCase().includes(q);
        const ctMatch = (t.contentType || "").toLowerCase().includes(q);
        const assigneeMatch = (t.assigneeName || t.assignee?.name || "").toLowerCase().includes(q);
        const creatorMatch = (t.createdByName || t.createdBy?.name || "").toLowerCase().includes(q);
        return (
          titleMatch ||
          codeMatch ||
          clientMatch ||
          catMatch ||
          ctMatch ||
          assigneeMatch ||
          creatorMatch
        );
      });
    }

    // Sort chronologically
    list.sort((a, b) => {
      const dateA = new Date(a.publishDate || a.dueDate || 0);
      const dateB = new Date(b.publishDate || b.dueDate || 0);
      return dateA - dateB;
    });

    return list;
  }, [tasks, activeTab, selectedClient, selectedContentType, searchQuery]);

  const hasActiveFilters =
    activeTab !== "all" ||
    selectedClient !== "all" ||
    selectedContentType !== "all" ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setActiveTab("all");
    setSelectedClient("all");
    setSelectedContentType("all");
    setSearchQuery("");
  };

  const calendarPath = `/${currentUser?.role || "admin"}/content-calendar`;

  return (
    <div className="w-full sidebar-bg rounded-2xl border border-slate-200 dark:border-[#223149] shadow-xs p-4 sm:p-5 transition-all flex flex-col justify-between">
      {/* ─── Top Section: Header, Metrics, Actions ─────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          {/* Title & Description */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl theme-bg-accent text-white shadow-xs shrink-0">
              <FiCalendar size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Content Calendar Overview
                </h2>
                {metrics.today > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {metrics.today} Today
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Publishing schedules & deliverables
              </p>
            </div>
          </div>

          {/* Action & View Mode Controls */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {/* Table / Grid Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-[#131d2e] p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-[#1a2538] theme-text-accent shadow-2xs font-bold"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <FiList size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Cards View"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-[#1a2538] theme-text-accent shadow-2xs font-bold"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <FiGrid size={13} />
              </button>
            </div>

            <button
              type="button"
              onClick={fetchTasks}
              title="Refresh Content Tasks"
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>

            <Link
              to={calendarPath}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg theme-bg-accent text-white shadow-2xs hover:opacity-95 transition-all cursor-pointer"
            >
              <FiPlus size={12} /> Create
            </Link>

            <Link
              to={calendarPath}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
            >
              <span>Full View</span>
              <FiChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform theme-text-accent" />
            </Link>
          </div>
        </div>

        {/* ─── Minimalist Metric Chips Ribbon ─────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap my-3">
          {[
            { id: "all", label: "All Posts", count: metrics.total },
            { id: "today", label: "Today", count: metrics.today },
            { id: "scheduled", label: "Scheduled", count: metrics.scheduled },
            { id: "inqc", label: "In QC", count: metrics.inQc },
            { id: "live", label: "Live", count: metrics.live },
            { id: "overdue", label: "Overdue", count: metrics.overdue },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveTab(pill.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  isActive
                    ? "theme-bg-accent text-white border-transparent shadow-2xs font-black"
                    : "bg-slate-50/70 dark:bg-[#111927] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Minimalist Filter Bar: Client, Type & Search ───────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3.5">
          {/* Client Selector Filter */}
          <div className="relative shrink-0 sm:max-w-[140px] w-full">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full text-[11px] font-semibold py-1.5 pl-2.5 pr-6 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer truncate"
            >
              <option value="all">🏢 All Clients</option>
              {clientOptions.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>
          </div>

          {/* Content Type Selector Filter */}
          <div className="relative shrink-0 sm:max-w-[120px] w-full">
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
              className="w-full text-[11px] font-semibold py-1.5 pl-2.5 pr-6 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer truncate"
            >
              <option value="all">🎬 All Types</option>
              {contentTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Live Search */}
          <div className="relative flex-1">
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search post, client, creator..."
              className="w-full pl-7 pr-6 py-1.5 text-[11px] bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700/80 rounded-lg font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <FiX size={11} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* ─── Content Body: Table or Cards ──────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Loading posts...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 dark:bg-[#111927]/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 border border-indigo-500/20">
              <FiCalendar size={18} />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Content Posts Found
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-0.5 mb-3 font-medium">
              {hasActiveFilters
                ? "No posts match your current search or filters."
                : "No content tasks scheduled right now."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* ─── MINIMALIST TABLE VIEW ─── */
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-[#111927] border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Post & Client</th>
                  <th className="py-2 px-3 hidden sm:table-cell">Type</th>
                  <th className="py-2 px-3 hidden md:table-cell">Creator / Assignee</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredTasks.slice(0, 5).map((task) => {
                  const statusStyle = getStatusStyles(task.status);
                  const dateStr = task.publishDate || task.dueDate;
                  const relativeDate = getRelativeDateLabel(dateStr);
                  const formattedDate = dateStr
                    ? format(new Date(dateStr), "EEE, MMM d")
                    : "No Date";
                  const clientName = task.client?.companyName || task.clientName || "General";
                  const creatorOrAssigneeName =
                    task.assignee?.name ||
                    task.assigneeName ||
                    task.createdBy?.name ||
                    task.createdByName ||
                    "Unassigned";
                  const avatarUrl = getAssigneeAvatar(task);

                  return (
                    <tr
                      key={task._id}
                      onClick={() => setSelectedTaskForModal(task)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162235] transition-colors cursor-pointer group"
                    >
                      {/* Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11.5px]">
                              {formattedDate}
                            </span>
                            {relativeDate && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase ${relativeDate.color}`}
                              >
                                {relativeDate.text}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {task.publishDate ? "Publish Date" : "Due Date"}
                          </span>
                        </div>
                      </td>

                      {/* Post & Client */}
                      <td className="py-2 px-3">
                        <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[220px]">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-[11.5px] truncate group-hover:text-indigo-500 transition-colors">
                              {task.taskTitle}
                            </span>
                            {task.commitment && (
                              <FiStar size={10} className="fill-amber-500 text-amber-500 shrink-0" title="Commitment" />
                            )}
                          </div>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                            {clientName}
                          </span>
                        </div>
                      </td>

                      {/* Content Type */}
                      <td className="py-2 px-3 hidden sm:table-cell whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-[#1a2538] text-slate-700 dark:text-slate-300">
                          {getContentTypeIcon(task.contentType)}
                          <span>{task.contentType || "Post"}</span>
                        </span>
                      </td>

                      {/* Creator / Assignee */}
                      <td className="py-2 px-3 hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={creatorOrAssigneeName}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[9px] shrink-0">
                              {creatorOrAssigneeName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                            {creatorOrAssigneeName}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {task.status || "Not started"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── FALLBACK GRID VIEW ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredTasks.slice(0, 4).map((task) => {
              const statusStyle = getStatusStyles(task.status);
              const dateStr = task.publishDate || task.dueDate;
              const formattedDate = dateStr
                ? format(new Date(dateStr), "EEE, MMM d")
                : "No Date";
              const clientName = task.client?.companyName || task.clientName || "General";
              const creatorOrAssigneeName =
                task.assignee?.name ||
                task.assigneeName ||
                task.createdBy?.name ||
                task.createdByName ||
                "Unassigned";

              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskForModal(task)}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111927]/60 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {formattedDate}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${statusStyle.badge}`}
                    >
                      {task.status || "Not started"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-indigo-500 transition-colors">
                    {task.taskTitle}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mb-2">
                    {clientName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                      {getContentTypeIcon(task.contentType)}
                      <span>{task.contentType || "Post"}</span>
                    </span>
                    <span className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                      {creatorOrAssigneeName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Bottom Footer: Count & Calendar Link ─────────────────────── */}
      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          Showing {Math.min(viewMode === "table" ? 5 : 4, filteredTasks.length)} of {filteredTasks.length} posts
        </span>
        <Link
          to={calendarPath}
          className="font-bold theme-text-accent hover:underline flex items-center gap-0.5"
        >
          <span>Open Content Calendar</span>
          <FiChevronRight size={13} />
        </Link>
      </div>

      {/* ─── Task Quick View Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedTaskForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskForModal(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-[#131d2e]/50">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {selectedTaskForModal.taskCode && (
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/40">
                        {selectedTaskForModal.taskCode}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {selectedTaskForModal.contentType || "Post"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        getStatusStyles(selectedTaskForModal.status).badge
                      }`}
                    >
                      {selectedTaskForModal.status || "Not started"}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedTaskForModal.taskTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Client:{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {selectedTaskForModal.client?.companyName ||
                        selectedTaskForModal.clientName ||
                        "General"}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTaskForModal(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Schedule & Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#131d2e] border border-slate-200/80 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Publish Date
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiCalendar size={13} className="text-indigo-500" />
                      {selectedTaskForModal.publishDate
                        ? format(new Date(selectedTaskForModal.publishDate), "EEE, MMM d, yyyy")
                        : "No publish date"}
                    </p>
                    {selectedTaskForModal.dueDate && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                        <FiClock size={12} />
                        Due: {format(new Date(selectedTaskForModal.dueDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Deliverable Info
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Category: <span className="font-bold">{selectedTaskForModal.category || "Content"}</span>
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                      Priority:{" "}
                      <span className="font-bold">{selectedTaskForModal.priority || "Medium"}</span>
                    </p>
                    {selectedTaskForModal.qc && (
                      <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                        QC Status: <span className="font-bold">{selectedTaskForModal.qc}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Team & Assignee Info */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111927] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Assignee:</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FiUser size={13} className="text-indigo-500" />
                      {selectedTaskForModal.assignee?.name ||
                        selectedTaskForModal.assigneeName ||
                        "Unassigned"}
                    </span>
                  </div>

                  {selectedTaskForModal.createdBy && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Created By:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedTaskForModal.createdBy?.name ||
                          selectedTaskForModal.createdByName ||
                          "Admin"}
                      </span>
                    </div>
                  )}

                  {selectedTaskForModal.commitment && (
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold">
                      <FiStar size={12} className="fill-amber-500" />
                      <span>Committed to Client Calendar</span>
                    </div>
                  )}
                </div>

                {/* Notes or caption */}
                {selectedTaskForModal.notes && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Notes & Copy Preview
                    </h4>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-[#131d2e] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedTaskForModal.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131d2e]/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForModal(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskForModal(null);
                    navigate(calendarPath);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl theme-bg-accent hover:opacity-95 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Open in Calendar</span>
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

export default ContentCalendarOverview;
