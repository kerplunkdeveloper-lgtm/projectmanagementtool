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
  FiRefreshCw,
  FiList,
  FiGrid,
} from "react-icons/fi";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../services/axiosInstance";
import { useSocketContext } from "../../../context/SocketContext";

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
  const clientsFromStore = useSelector((state) => state.clients?.clients || []);
  const { socket } = useSocketContext() || {};

  const [shoots, setShoots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "today", "upcoming", "thisWeek", "confirmed"
  const [selectedClient, setSelectedClient] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShootForModal, setSelectedShootForModal] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const userRole = (currentUser?.role?.name || currentUser?.role || "")
    .toString()
    .toLowerCase()
    .trim();
  const isSuperOrAdmin =
    userRole === "admin" ||
    userRole === "operationmanager" ||
    userRole === "operation manager";

  const shootPerms =
    currentUser?.permissions?.manage_shoots ||
    currentUser?.permissions?.shoot_calendar ||
    {};
  const isLegacyTrue =
    currentUser?.permissions?.manage_shoots === true ||
    currentUser?.permissions?.shoot_calendar === true;
  const hasReadPerm = isSuperOrAdmin || isLegacyTrue || !!shootPerms.read;

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
    if (hasReadPerm) {
      fetchShoots();
    }
  }, [hasReadPerm]);

  // Real-time live update listener via shared socket
  useEffect(() => {
    if (!hasReadPerm || !socket) return;

    const onShootUpdate = () => fetchShoots();
    socket.on("shoot_created", onShootUpdate);
    socket.on("shoot_updated", onShootUpdate);

    return () => {
      socket.off("shoot_created", onShootUpdate);
      socket.off("shoot_updated", onShootUpdate);
    };
  }, [hasReadPerm, socket]);

  // Filter shoots allowed for the user's role
  const allowedShoots = useMemo(() => {
    return shoots;
  }, [shoots]);

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

  // Dynamic client options
  const clientOptions = useMemo(() => {
    const map = new Map();
    clientsFromStore.forEach((c) => {
      if (c.companyName) {
        map.set(c.companyName.trim().toLowerCase(), c.companyName.trim());
      }
    });
    allowedShoots.forEach((s) => {
      if (s.client?.companyName) {
        map.set(s.client.companyName.trim().toLowerCase(), s.client.companyName.trim());
      }
    });
    return Array.from(map.values()).sort();
  }, [clientsFromStore, allowedShoots]);

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

    // Client filter
    if (selectedClient !== "all") {
      const cl = selectedClient.toLowerCase();
      list = list.filter((s) => (s.client?.companyName || "").toLowerCase() === cl);
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

    // Sort recent date first (latest date first)
    list.sort((a, b) => {
      const dateA = new Date(a.schedule?.shootDate || 0).getTime();
      const dateB = new Date(b.schedule?.shootDate || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.schedule?.startTime || "").localeCompare(a.schedule?.startTime || "");
    });

    return list;
  }, [allowedShoots, activeTab, selectedClient, searchQuery]);

  const hasActiveFilters =
    activeTab !== "all" ||
    selectedClient !== "all" ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setActiveTab("all");
    setSelectedClient("all");
    setSearchQuery("");
  };

  const canCreate =
    isSuperOrAdmin ||
    isLegacyTrue ||
    !!shootPerms.write;

  if (!hasReadPerm) {
    return null;
  }

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
                  Shoot Calendar Overview
                </h2>
                {metrics.today > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {metrics.today} Today
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Production schedules & crew allocations
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
              onClick={fetchShoots}
              title="Refresh Shoots"
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>

            {canCreate && (
              <button
                type="button"
                onClick={() => navigate(`/${currentUser?.role}/Shootcalendor`)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg theme-bg-accent text-white shadow-2xs hover:opacity-95 transition-all cursor-pointer"
              >
                <FiPlus size={12} /> Schedule
              </button>
            )}

            <Link
              to={`/${currentUser?.role}/Shootcalendor`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
            >
              <span>Full Calendar</span>
              <FiChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform theme-text-accent" />
            </Link>
          </div>
        </div>

        {/* ─── Minimalist Metric Chips Ribbon ─────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap my-3">
          {[
            { id: "all", label: "All Shoots", count: metrics.total },
            { id: "today", label: "Today", count: metrics.today },
            { id: "upcoming", label: "Upcoming", count: metrics.upcoming },
            { id: "confirmed", label: "Confirmed", count: metrics.confirmed },
            { id: "inProgress", label: "In Progress", count: metrics.inProgress },
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

        {/* ─── Minimalist Filter Bar: Client & Search ─────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3.5">
          {/* Client Selector Filter */}
          <div className="relative shrink-0 sm:max-w-[160px] w-full">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full text-[11px] font-semibold py-1.5 pl-2.5 pr-6 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer truncate"
            >
              <option value="all">🏢 All Clients</option>
              {clientOptions.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
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
              placeholder="Search shoot title, client, crew..."
              className="w-full pl-7 pr-6 py-1.5 text-[11px] bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700/80 rounded-lg font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
            <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Loading shoots...</p>
          </div>
        ) : filteredShoots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 dark:bg-[#111927]/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/20">
              <FiCalendar size={18} />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Shoots Found
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-0.5 mb-3 font-medium">
              {hasActiveFilters
                ? "No shoots match your current search or filters."
                : "No shoots scheduled right now."}
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
                  <th className="py-2 px-3">Date & Time</th>
                  <th className="py-2 px-3">Shoot & Client</th>
                  <th className="py-2 px-3 hidden sm:table-cell">Type</th>
                  <th className="py-2 px-3 hidden md:table-cell">Lead</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredShoots.slice(0, 5).map((shoot) => {
                  const statusStyle = getStatusStyles(shoot.status);
                  const isVideo = (shoot.shootType || "").toLowerCase().includes("video");
                  const relativeDate = getRelativeDateLabel(shoot.schedule?.shootDate);
                  const formattedDate = shoot.schedule?.shootDate
                    ? format(new Date(shoot.schedule.shootDate), "EEE, MMM d")
                    : "Date TBD";

                  return (
                    <tr
                      key={shoot._id}
                      onClick={() => setSelectedShootForModal(shoot)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162235] transition-colors cursor-pointer group"
                    >
                      {/* Date & Time */}
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
                            {shoot.schedule?.startTime || "Time TBD"}
                            {shoot.schedule?.endTime && ` - ${shoot.schedule.endTime}`}
                          </span>
                        </div>
                      </td>

                      {/* Shoot & Client */}
                      <td className="py-2 px-3">
                        <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[220px]">
                          <span className="font-bold text-slate-900 dark:text-white text-[11.5px] truncate group-hover:text-emerald-500 transition-colors">
                            {shoot.shootTitle}
                          </span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                            {shoot.client?.companyName || "Internal / General"}
                          </span>
                        </div>
                      </td>

                      {/* Shoot Type */}
                      <td className="py-2 px-3 hidden sm:table-cell whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-[#1a2538] text-slate-700 dark:text-slate-300">
                          {isVideo ? (
                            <FiVideo size={10} className="text-blue-500 shrink-0" />
                          ) : (
                            <FiCamera size={10} className="text-purple-500 shrink-0" />
                          )}
                          <span>{shoot.shootType || "Shoot"}</span>
                        </span>
                      </td>

                      {/* Lead */}
                      <td className="py-2 px-3 hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[9px] shrink-0">
                            {shoot.assignedTo?.name ? shoot.assignedTo.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                            {shoot.assignedTo?.name || "Unassigned"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${statusStyle.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{shoot.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── GRID / CARDS VIEW ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredShoots.slice(0, 4).map((shoot, index) => {
              const statusStyle = getStatusStyles(shoot.status);
              const isVideo = (shoot.shootType || "").toLowerCase().includes("video");
              const relativeDate = getRelativeDateLabel(shoot.schedule?.shootDate);
              const formattedDate = shoot.schedule?.shootDate
                ? format(new Date(shoot.schedule.shootDate), "EEE, MMM d")
                : "Date TBD";
              const isFirstActive = index === 0;

              return (
                <div
                  key={shoot._id}
                  onClick={() => setSelectedShootForModal(shoot)}
                  className={`bg-white dark:bg-[#131d2e] rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between group ${statusStyle.cardBorder} ${
                    isFirstActive
                      ? "border-emerald-500/80 dark:border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <FiCalendar size={11} className="text-emerald-500" />
                        {formattedDate}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle.badge}`}>
                        {shoot.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                      {shoot.shootTitle}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {shoot.client?.companyName || "Internal / General"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 text-[10px] text-slate-500">
                    <span className="truncate">{shoot.assignedTo?.name || "Unassigned"}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{shoot.shootType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Minimalist Footer ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          Showing {Math.min(filteredShoots.length, viewMode === "table" ? 5 : 4)} of {filteredShoots.length} shoots
        </span>
        <Link
          to={`/${currentUser?.role}/Shootcalendor`}
          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          <span>Open Full Calendar</span>
          <FiChevronRight size={12} />
        </Link>
      </div>

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
