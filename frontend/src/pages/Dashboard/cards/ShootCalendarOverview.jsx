import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiVideo,
  FiCamera,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiPlus,
  FiSearch,
  FiEye,
  FiUsers,
  FiBriefcase,
  FiX,
  FiExternalLink,
  FiCheckSquare,
  FiAlertTriangle,
} from "react-icons/fi";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../services/axiosInstance";
import io from "socket.io-client";

// Status styling definitions
const getStatusStyles = (status) => {
  switch (status) {
    case "Confirmed":
      return {
        badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
        dot: "bg-emerald-500",
        cardBorder: "hover:border-emerald-400 dark:hover:border-emerald-500/50",
      };
    case "In Progress":
      return {
        badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
        dot: "bg-blue-500",
        cardBorder: "hover:border-blue-400 dark:hover:border-blue-500/50",
      };
    case "Planned":
      return {
        badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
        dot: "bg-purple-500",
        cardBorder: "hover:border-purple-400 dark:hover:border-purple-500/50",
      };
    case "Pending Approval":
      return {
        badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
        dot: "bg-amber-500",
        cardBorder: "hover:border-amber-400 dark:hover:border-amber-500/50",
      };
    case "At Risk":
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
        cardBorder: "hover:border-slate-400 dark:hover:border-slate-600",
      };
  }
};

const getRelativeDateLabel = (date) => {
  if (!date) return null;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (isToday(d)) return { text: "Today", color: "bg-emerald-500 text-white font-black animate-pulse" };
    if (isTomorrow(d)) return { text: "Tomorrow", color: "bg-blue-500 text-white font-bold" };
    if (isThisWeek(d)) return { text: "This Week", color: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold" };
    return null;
  } catch {
    return null;
  }
};

const ShootCalendarOverview = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth?.user);

  const [shoots, setShoots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "today", "upcoming", "thisWeek", "confirmed"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShootForModal, setSelectedShootForModal] = useState(null);

  const fetchShoots = async () => {
    try {
      const { data } = await axiosInstance.get("/shoot-calendar");
      setShoots(data.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard shoots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoots();
  }, []);

  // Real-time live update listener
  useEffect(() => {
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

    const currentUserId = currentUser?._id || currentUser?.id;
    if (currentUserId) {
      socket.emit("join", currentUserId.toString());
    }

    socket.on("shoot_created", () => fetchShoots());
    socket.on("shoot_updated", () => fetchShoots());

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Filter shoots allowed for the user's role
  const allowedShoots = useMemo(() => {
    const isSuperOrAdmin =
      currentUser?.role === "admin" ||
      currentUser?.role === "operationmanager";

    const currentUserId = String(currentUser?._id || currentUser?.id || "");

    return shoots.filter((shoot) => {
      if (!isSuperOrAdmin && currentUserId) {
        const creatorId = String(shoot.createdBy?._id || shoot.createdBy?.id || shoot.createdBy || "");
        const assignedId = String(shoot.assignedTo?._id || shoot.assignedTo?.id || shoot.assignedTo || "");
        const inTeam =
          Array.isArray(shoot.shootTeam) &&
          shoot.shootTeam.some((m) => {
            const mId = String(m?._id || m?.id || m || "");
            return mId === currentUserId;
          });

        if (creatorId !== currentUserId && assignedId !== currentUserId && !inTeam) {
          return false;
        }
      }
      return true;
    });
  }, [shoots, currentUser]);

  // Calculate high-level metrics
  const metrics = useMemo(() => {
    const total = allowedShoots.length;
    const today = allowedShoots.filter((s) => {
      if (!s.schedule?.shootDate) return false;
      try {
        return isToday(parseISO(s.schedule.shootDate));
      } catch {
        return false;
      }
    }).length;

    const upcoming = allowedShoots.filter((s) => {
      if (!s.schedule?.shootDate) return false;
      try {
        const d = parseISO(s.schedule.shootDate);
        return d >= new Date() && s.status !== "Completed" && s.status !== "Cancelled";
      } catch {
        return false;
      }
    }).length;

    const confirmed = allowedShoots.filter((s) => s.status === "Confirmed").length;
    const inProgress = allowedShoots.filter((s) => s.status === "In Progress").length;

    return { total, today, upcoming, confirmed, inProgress };
  }, [allowedShoots]);

  // Filtered shoots based on tab and search query
  const filteredShoots = useMemo(() => {
    let list = [...allowedShoots];

    // Tab filter
    if (activeTab === "today") {
      list = list.filter((s) => {
        if (!s.schedule?.shootDate) return false;
        try {
          return isToday(parseISO(s.schedule.shootDate));
        } catch {
          return false;
        }
      });
    } else if (activeTab === "upcoming") {
      list = list.filter((s) => {
        if (!s.schedule?.shootDate) return false;
        try {
          const d = parseISO(s.schedule.shootDate);
          return d >= new Date() && s.status !== "Completed" && s.status !== "Cancelled";
        } catch {
          return false;
        }
      });
    } else if (activeTab === "thisWeek") {
      list = list.filter((s) => {
        if (!s.schedule?.shootDate) return false;
        try {
          return isThisWeek(parseISO(s.schedule.shootDate));
        } catch {
          return false;
        }
      });
    } else if (activeTab === "confirmed") {
      list = list.filter((s) => s.status === "Confirmed");
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((shoot) => {
        const titleMatch = shoot.shootTitle?.toLowerCase().includes(q);
        const clientMatch = shoot.client?.companyName?.toLowerCase().includes(q);
        const locationMatch = shoot.location?.toLowerCase().includes(q);
        const typeMatch = shoot.shootType?.toLowerCase().includes(q);
        const leadMatch = shoot.assignedTo?.name?.toLowerCase().includes(q);
        const teamMatch =
          Array.isArray(shoot.shootTeam) &&
          shoot.shootTeam.some((m) =>
            (m?.name || (typeof m === "string" ? m : "")).toLowerCase().includes(q)
          );
        return titleMatch || clientMatch || locationMatch || typeMatch || leadMatch || teamMatch;
      });
    }

    // Sort chronologically
    list.sort((a, b) => {
      const dateA = new Date(a.schedule?.shootDate || 0);
      const dateB = new Date(b.schedule?.shootDate || 0);
      return dateA - dateB;
    });

    return list;
  }, [allowedShoots, activeTab, searchQuery]);

  const canCreate =
    currentUser?.role === "admin" ||
    currentUser?.role === "operationmanager";

  return (
    <div className="w-full sidebar-bg rounded-2xl border border-slate-200 dark:border-[#223149] shadow-xs p-4 sm:p-6 transition-all">
      {/* ─── Top Section: Header, Metrics, Actions ─────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        {/* Title & Description */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl theme-bg-accent text-white shadow-md shadow-accent/20 shrink-0">
            <FiCalendar size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Shoot Calendar Overview
              </h2>
              {metrics.today > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {metrics.today} {metrics.today === 1 ? "Shoot Today" : "Shoots Today"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Real-time video & photography production schedules, lead assignees and crew allocations
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate(`/${currentUser?.role}/Shootcalendor`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl theme-bg-accent text-white shadow-sm hover:opacity-95 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FiPlus size={15} /> Schedule Shoot
            </button>
          )}
          <Link
            to={`/${currentUser?.role}/Shootcalendor`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs group"
          >
            <span>Full Calendar</span>
            <FiChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-emerald-500" />
          </Link>
        </div>
      </div>

      {/* ─── Metric Pills Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-4">
        <div
          onClick={() => setActiveTab("all")}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/30"
              : "bg-slate-50/50 dark:bg-[#111927] border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Shoots
            </span>
            <FiCalendar size={13} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.total}
          </p>
        </div>

        <div
          onClick={() => setActiveTab("today")}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/30"
              : "bg-slate-50/50 dark:bg-[#111927] border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today
            </span>
            <div className={`w-2 h-2 rounded-full ${metrics.today > 0 ? "bg-emerald-500 animate-ping" : "bg-slate-300 dark:bg-slate-600"}`} />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.today}
          </p>
        </div>

        <div
          onClick={() => setActiveTab("upcoming")}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/30"
              : "bg-slate-50/50 dark:bg-[#111927] border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming
            </span>
            <FiClock size={13} className="text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.upcoming}
          </p>
        </div>

        <div
          onClick={() => setActiveTab("confirmed")}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeTab === "confirmed"
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/30"
              : "bg-slate-50/50 dark:bg-[#111927] border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Confirmed
            </span>
            <FiCheckCircle size={13} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.confirmed}
          </p>
        </div>

        <div
          onClick={() => setActiveTab("all")}
          className="col-span-2 sm:col-span-1 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111927] hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.inProgress}
          </p>
        </div>
      </div>

      {/* ─── Search & Tab Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Shoots" },
            { id: "today", label: "Today" },
            { id: "upcoming", label: "Upcoming" },
            { id: "thisWeek", label: "This Week" },
            { id: "confirmed", label: "Confirmed" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-xs shadow-emerald-500/20 font-black"
                    : "bg-slate-100/80 dark:bg-[#131d2e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Live Search */}
        <div className="relative min-w-[220px] max-w-xs">
         
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shoot, client, crew..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700/80 rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <FiX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Shoots Cards Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading shoot schedules...</p>
        </div>
      ) : filteredShoots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 dark:bg-[#111927]/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-500/20">
            <FiCalendar size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Shoots Found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4 font-medium">
            {searchQuery
              ? `No shoots match "${searchQuery}". Try clearing search.`
              : activeTab !== "all"
              ? "No shoots found under this category."
              : "No shoots are currently scheduled on your calendar."}
          </p>
          <div className="flex items-center gap-2">
            {(searchQuery || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              to={`/${currentUser?.role}/Shootcalendor`}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Open Shoot Calendar
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredShoots.slice(0, 6).map((shoot) => {
            const statusStyle = getStatusStyles(shoot.status);
            const isVideo = (shoot.shootType || "").toLowerCase().includes("video");
            const relativeDate = getRelativeDateLabel(shoot.schedule?.shootDate);

            const formattedDate = shoot.schedule?.shootDate
              ? format(new Date(shoot.schedule.shootDate), "EEE, MMM d, yyyy")
              : "Date TBD";

            return (
              <div
                key={shoot._id}
                onClick={() => setSelectedShootForModal(shoot)}
                className={`bg-white dark:bg-[#131d2e] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${statusStyle.cardBorder}`}
              >
                <div>
                  {/* Top Row: Date Pill & Status Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-[#1a2538] text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/80">
                        <FiCalendar size={12} className="text-emerald-500 shrink-0" />
                        {formattedDate}
                      </span>
                      {relativeDate && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${relativeDate.color}`}>
                          {relativeDate.text}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {shoot.status}
                    </span>
                  </div>

                  {/* Shoot Title & Client */}
                  <div className="mb-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {shoot.shootTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      <FiBriefcase size={12} className="shrink-0 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {shoot.client?.companyName || "Internal / No Client"}
                      </span>
                    </div>
                  </div>

                  {/* Time & Location Row */}
                  <div className="space-y-1.5 mb-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <FiClock size={12} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-[11.5px]">
                        {shoot.schedule?.startTime || "Time TBD"}
                        {shoot.schedule?.endTime && ` – ${shoot.schedule.endTime}`}
                      </span>
                    </div>

                    {shoot.location && (
                      <div className="flex items-center gap-1.5 truncate">
                        <FiMapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate text-[11.5px]">{shoot.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Crew & Type Row */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                  {/* Crew Info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {shoot.assignedTo?.name ? shoot.assignedTo.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                        {shoot.assignedTo?.name || "Unassigned"}
                      </p>
                      {shoot.shootTeam && shoot.shootTeam.length > 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                          +{shoot.shootTeam.length} crew {shoot.shootTeam.length === 1 ? "member" : "members"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shoot Type Pill */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-[#1a2538] text-slate-600 dark:text-slate-300 shrink-0">
                    {isVideo ? <FiVideo size={10} className="text-blue-500" /> : <FiCamera size={10} className="text-purple-500" />}
                    {shoot.shootType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to full calendar when there are more than 6 shoots */}
      {filteredShoots.length > 6 && (
        <div className="flex justify-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            to={`/${currentUser?.role}/Shootcalendor`}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View all {filteredShoots.length} scheduled shoots in calendar</span>
            <FiChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* ─── Shoot Quick View Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedShootForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShootForModal(null)}
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
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {selectedShootForModal.shootType}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyles(selectedShootForModal.status).badge}`}>
                      {selectedShootForModal.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedShootForModal.shootTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Client: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedShootForModal.client?.companyName || "None"}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedShootForModal(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Schedule & Location Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#131d2e] border border-slate-200/80 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Date & Time
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiCalendar size={13} className="text-emerald-500" />
                      {selectedShootForModal.schedule?.shootDate
                        ? format(new Date(selectedShootForModal.schedule.shootDate), "EEE, MMM d, yyyy")
                        : "Date TBD"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <FiClock size={12} />
                      {selectedShootForModal.schedule?.startTime || "Time TBD"}
                      {selectedShootForModal.schedule?.endTime && ` - ${selectedShootForModal.schedule.endTime}`}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Location
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiMapPin size={13} className="text-rose-500" />
                      {selectedShootForModal.location || "Location TBD"}
                    </p>
                    {selectedShootForModal.transport && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        Transport: {selectedShootForModal.transport}
                      </p>
                    )}
                  </div>
                </div>

                {/* Crew & Team */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Production Crew & Assignees
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111927]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Assigned Lead:</span>
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FiUser size={13} className="text-emerald-500" />
                        {selectedShootForModal.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>

                    {selectedShootForModal.shootTeam && selectedShootForModal.shootTeam.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block mb-1.5">
                          Shoot Team Members:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedShootForModal.shootTeam.map((member, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-[#182338] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                            >
                              {member.name || member}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description or Notes if any */}
                {(selectedShootForModal.description || selectedShootForModal.notes) && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Shoot Details & Notes
                    </h4>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-[#131d2e] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedShootForModal.description || selectedShootForModal.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131d2e]/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShootForModal(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShootForModal(null);
                    navigate(`/${currentUser?.role}/Shootcalendor`);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
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

export default ShootCalendarOverview;
