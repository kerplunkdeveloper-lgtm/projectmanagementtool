import React, { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enIN from "date-fns/locale/en-IN";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

import {
  FiCalendar,
  FiInstagram,
  FiVideo,
  FiLayers,
  FiTarget,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiUser,
  FiGrid,
  FiList,
  FiPhone,
} from "react-icons/fi";

import { getClients } from "../../features/clients/clientslice";
import { getEvents } from "../../features/events/eventSlice";
import { getClientIconComponent } from "../../utils/clientHelpers";

const locales = { "en-IN": enIN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const TYPE_CONFIG = {
  Post: {
    color: "#3b82f6",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
    dot: "bg-blue-500",
    icon: FiInstagram,
  },
  Reel: {
    color: "#ef4444",
    bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40",
    dot: "bg-red-500",
    icon: FiVideo,
  },
  Story: {
    color: "#8b5cf6",
    bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40",
    dot: "bg-violet-500",
    icon: FiLayers,
  },
  Ad: {
    color: "#f59e0b",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    dot: "bg-amber-500",
    icon: FiTarget,
  },
  Report: {
    color: "#10b981",
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
    icon: FiFileText,
  },
  "Birthday Celebration": {
    color: "#ec4899",
    bg: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/40",
    dot: "bg-pink-500",
    icon: FiCalendar,
  },
};

const ContentCalcendor = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { clients, loading: clientsLoading } = useSelector((s) => s.clients);
  const { events, loading: eventsLoading } = useSelector((s) => s.events);

  const [activeClientId, setActiveClientId] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientTabSearch, setClientTabSearch] = useState("");
  const [viewMode, setViewMode] = useState("month"); // 'month', 'week', 'agenda'

  useEffect(() => {
    dispatch(getClients());
    dispatch(getEvents());
  }, [dispatch]);

  // Determine assigned clients for the current logged-in user
  const assignedClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    if (!user) return clients;

    const userId = user._id || user.id;
    const isElevated = user.role === "admin" || user.role === "operationmanager";

    if (isElevated) return clients;

    const userAssigned = clients.filter((c) => {
      if (!c.assignedTo) return false;
      if (Array.isArray(c.assignedTo)) {
        return c.assignedTo.some((item) => {
          if (typeof item === "string") return item === userId;
          return item?._id === userId || item?.id === userId;
        });
      }
      if (typeof c.assignedTo === "string") return c.assignedTo === userId;
      return c.assignedTo?._id === userId || c.assignedTo?.id === userId;
    });

    // Fallback to all clients if no explicit assignment exists in DB for this team user
    return userAssigned.length > 0 ? userAssigned : clients;
  }, [clients, user]);

  // Auto select first client when assignedClients loads
  useEffect(() => {
    if (assignedClients.length > 0 && !activeClientId) {
      setActiveClientId(assignedClients[0]._id);
    }
  }, [assignedClients, activeClientId]);

  // Filter client tabs based on clientTabSearch query
  const filteredClientTabs = useMemo(() => {
    if (!clientTabSearch.trim()) return assignedClients;
    const q = clientTabSearch.toLowerCase();
    return assignedClients.filter(
      (c) =>
        c.companyName?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.spoc?.toLowerCase().includes(q)
    );
  }, [assignedClients, clientTabSearch]);

  // Selected Active Client Object
  const activeClient = useMemo(() => {
    if (!assignedClients || assignedClients.length === 0) return null;
    return clients.find((c) => c._id === activeClientId) || assignedClients[0] || null;
  }, [clients, activeClientId, assignedClients]);

  // Count scheduled events per client
  const clientEventCounts = useMemo(() => {
    const counts = {};
    if (events && Array.isArray(events)) {
      events.forEach((e) => {
        const cId = e.client?._id || e.client;
        if (cId) {
          counts[cId] = (counts[cId] || 0) + 1;
        }
      });
    }
    return counts;
  }, [events]);

  // Filter events for active client + search + type filter
  const clientEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    let list = events;

    const targetClientId = activeClientId || (assignedClients[0] ? assignedClients[0]._id : null);

    if (targetClientId) {
      list = list.filter((e) => {
        const eClientId = e.client?._id || e.client;
        return eClientId === targetClientId;
      });
    }

    if (selectedTypeFilter !== "All") {
      list = list.filter((e) => e.type === selectedTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.type?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [events, activeClientId, assignedClients, selectedTypeFilter, searchQuery]);

  // Format events for react-big-calendar
  const calendarFormattedEvents = useMemo(() => {
    return clientEvents.map((e) => {
      const start = new Date(e.date);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return { ...e, start, end };
    });
  }, [clientEvents]);

  // Deliverables progress stats for current active client
  const deliverablesStats = useMemo(() => {
    if (!activeClient) return null;

    const currentMonthEvents = clientEvents.filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const postsCount = currentMonthEvents.filter((e) => e.type === "Post").length;
    const reelsCount = currentMonthEvents.filter((e) => e.type === "Reel").length;
    const storyCount = currentMonthEvents.filter((e) => e.type === "Story").length;

    const postsTarget = activeClient.posts || 0;
    const reelsTarget = activeClient.reels || 0;
    const storyTarget = activeClient.story || 0;

    return {
      posts: { count: postsCount, target: postsTarget },
      reels: { count: reelsCount, target: reelsTarget },
      stories: { count: storyCount, target: storyTarget },
      totalScheduled: currentMonthEvents.length,
    };
  }, [activeClient, clientEvents]);

  // Calendar Event styling
  const eventStyleGetter = (event) => {
    const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.Post;
    return {
      style: {
        backgroundColor: config.color,
        borderRadius: "6px",
        color: "#ffffff",
        border: "none",
        fontSize: "0.725rem",
        fontWeight: "600",
        boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
        padding: "2px 6px",
      },
    };
  };

  // Custom Event Component for react-big-calendar
  const CustomEvent = ({ event }) => {
    const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.Post;
    const IconComp = config.icon || FiCalendar;

    return (
      <div className="flex flex-col h-full overflow-hidden text-left leading-tight py-0.5">
        <div className="flex items-center gap-1 font-bold truncate">
          <IconComp size={10} className="shrink-0 opacity-90" />
          <span className="text-[10px] font-extrabold truncate">{event.title}</span>
        </div>
      </div>
    );
  };

  // Custom Toolbar Component
  const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate("PREV");
    const goToNext = () => toolbar.onNavigate("NEXT");
    const goToCurrent = () => toolbar.onNavigate("TODAY");

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        {/* Navigation Buttons matching 1st Reference Image */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={goToBack}
            className="px-5 py-2.5 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white text-xs font-extrabold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
          >
            &lt; Prev
          </button>
          <button
            type="button"
            onClick={goToCurrent}
            className="px-5 py-2.5 rounded-2xl bg-slate-200/90 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-extrabold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="px-5 py-2.5 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white text-xs font-extrabold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
          >
            Next &gt;
          </button>
        </div>

        {/* Calendar Month/Year Title */}
        <h2 className="text-base font-black text-slate-900 dark:text-white capitalize">
          {toolbar.label}
        </h2>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto min-h-screen">
      {/* ─── Top Header Section ─────────────────────────────────── */}
      

      {/* ─── Assigned Clients Tabs (Reference Image Pill Design) ─── */}
      <div className="py-2">
        {clientsLoading ? (
          <div className="flex items-center gap-3 overflow-x-auto py-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : assignedClients.length === 0 ? (
          <div className="p-4 text-xs text-slate-400 font-semibold">
            No assigned clients found.
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1.5 px-1">
            {/* Individual Client Pill Tabs matching Reference Image */}
            {filteredClientTabs.map((client) => {
              const isActive = activeClientId === client._id;
              const count = clientEventCounts[client._id] || 0;

              return (
                <button
                  key={client._id}
                  onClick={() => setActiveClientId(client._id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-200 shrink-0 cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                    isActive
                      ? "bg-[#38a5e4] text-white shadow-md shadow-sky-500/25"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span>{client.companyName}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Active Client Overview & Deliverables Target Card ───── */}
      {activeClient && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeClient._id}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner"
                style={{
                  backgroundColor: `${activeClient.color || "#3b82f6"}18`,
                  color: activeClient.color || "#3b82f6",
                  border: `1px solid ${activeClient.color || "#3b82f6"}40`,
                }}
              >
                {React.createElement(getClientIconComponent(activeClient.icon), {
                  size: 22,
                })}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeClient.companyName}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {activeClient.industry || "Client"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  {activeClient.spoc && (
                    <span className="flex items-center gap-1">
                      <FiUser className="text-slate-400" size={12} /> SPOC:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {activeClient.spoc}
                      </strong>
                    </span>
                  )}
                  {activeClient.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <FiPhone className="text-slate-400" size={12} />{" "}
                      {activeClient.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">
                Deliverable Progress (This Month):
              </span>
            </div>
          </div>

          {/* Deliverables Targets Progress Grid */}
          {deliverablesStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Posts Target Card */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 dark:text-blue-400">
                    <FiInstagram size={14} />
                    <span>Posts</span>
                  </div>
                  <span className="text-xs font-black text-blue-900 dark:text-blue-300">
                    {deliverablesStats.posts.count} / {deliverablesStats.posts.target}
                  </span>
                </div>
                <div className="w-full bg-blue-200/60 dark:bg-blue-900/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        deliverablesStats.posts.target > 0
                          ? Math.min(
                              100,
                              (deliverablesStats.posts.count /
                                deliverablesStats.posts.target) *
                                100
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Reels Target Card */}
              <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-red-700 dark:text-red-400">
                    <FiVideo size={14} />
                    <span>Reels</span>
                  </div>
                  <span className="text-xs font-black text-red-900 dark:text-red-300">
                    {deliverablesStats.reels.count} / {deliverablesStats.reels.target}
                  </span>
                </div>
                <div className="w-full bg-red-200/60 dark:bg-red-900/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        deliverablesStats.reels.target > 0
                          ? Math.min(
                              100,
                              (deliverablesStats.reels.count /
                                deliverablesStats.reels.target) *
                                100
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Stories Target Card */}
              <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-violet-700 dark:text-violet-400">
                    <FiLayers size={14} />
                    <span>Stories</span>
                  </div>
                  <span className="text-xs font-black text-violet-900 dark:text-violet-300">
                    {deliverablesStats.stories.count} / {deliverablesStats.stories.target}
                  </span>
                </div>
                <div className="w-full bg-violet-200/60 dark:bg-violet-900/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        deliverablesStats.stories.target > 0
                          ? Math.min(
                              100,
                              (deliverablesStats.stories.count /
                                deliverablesStats.stories.target) *
                                100
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Calendar Filters & Main View ───────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-xs space-y-4">


        {/* Big Calendar Component */}
        <div className="content-calendar-wrapper min-h-[620px] relative">
          {eventsLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs z-10">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-2" />
              <span className="text-xs font-bold text-slate-500">Loading events...</span>
            </div>
          ) : null}

          <Calendar
            localizer={localizer}
            events={calendarFormattedEvents}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar,
            }}
            style={{ height: 650 }}
            className="dark:text-slate-200"
          />
        </div>
      </div>

      {/* Custom Styles for react-big-calendar dark mode support */}
      <style>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border-color: rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          overflow: hidden;
        }
        .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view {
          border-color: rgba(30, 41, 59, 1);
        }
        .rbc-header {
          padding: 10px 4px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .dark .rbc-header {
          color: #94a3b8;
          border-bottom-color: #1e293b;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #f1f5f9;
        }
        .dark .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #1e293b;
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #f1f5f9;
        }
        .dark .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #1e293b;
        }
        .rbc-off-range-bg {
          background: rgba(248, 250, 252, 0.6);
        }
        .dark .rbc-off-range-bg {
          background: rgba(15, 23, 42, 0.4);
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.06);
        }
        .dark .rbc-today {
          background-color: rgba(59, 130, 246, 0.12);
        }
        .rbc-event {
          padding: 2px 4px;
        }
        .rbc-agenda-table th, .rbc-agenda-table td {
          padding: 8px 12px;
          font-size: 0.825rem;
        }
        .dark .rbc-agenda-table th {
          border-bottom-color: #1e293b;
        }
        .dark .rbc-agenda-table td {
          border-top-color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default ContentCalcendor;