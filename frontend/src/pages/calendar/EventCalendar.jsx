import React, { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enIN } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useDispatch, useSelector } from "react-redux";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../../features/calendarEvents/calendarEventSlice";
import {
  FiPlus,
  FiCalendar,
  FiTrash2,
  FiUsers,
  FiGift,
  FiSun,
  FiStar,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";
import EventCalendarModal from "./EventCalendarModal";
import toast from "react-hot-toast";

const locales = { "en-IN": enIN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CATEGORY_CONFIG = {
  "Client Meeting": { color: "#3b82f6", icon: FiUsers, label: "Client Meeting" },
  Birthday: { color: "#ec4899", icon: FiGift, label: "Birthday" },
  "Team Outing": { color: "#8b5cf6", icon: FiSun, label: "Team Outing" },
  Holiday: { color: "#10b981", icon: FiStar, label: "Holiday" },
  Personal: { color: "#f59e0b", icon: FiUser, label: "Personal" },
  Other: { color: "#6366f1", icon: FiCalendar, label: "Other" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

const EventCalendar = () => {
  const dispatch = useDispatch();
  const { events, loading } = useSelector((s) => s.calendarEvents);

  const [openModal, setOpenModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(ALL_CATEGORIES));
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(getCalendarEvents());
  }, [dispatch]);

  // Toggle a single category filter
  const toggleFilter = (cat) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  // Select all / clear all filters
  const toggleAllFilters = () => {
    if (activeFilters.size === ALL_CATEGORIES.length) {
      setActiveFilters(new Set());
    } else {
      setActiveFilters(new Set(ALL_CATEGORIES));
    }
  };

  // Map events for calendar + apply filters
  const calendarEvents = useMemo(() => {
    return events
      .filter((e) => activeFilters.has(e.category))
      .map((e) => {
        const start = new Date(e.date);
        const end = e.endDate
          ? new Date(e.endDate)
          : new Date(start.getTime() + 60 * 60 * 1000);
        return { ...e, start, end, allDay: e.allDay || false };
      });
  }, [events, activeFilters]);

  // Count events per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    ALL_CATEGORIES.forEach((c) => (counts[c] = 0));
    events.forEach((e) => {
      if (counts[e.category] !== undefined) counts[e.category]++;
    });
    return counts;
  }, [events]);

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent({ start });
    setIsEditing(false);
    setOpenModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setOpenModal(true);
  };

  const handleEventSubmit = async (formData) => {
    try {
      if (isEditing) {
        await dispatch(
          updateCalendarEvent({ id: selectedEvent._id, eventData: formData })
        ).unwrap();
        toast.success("Event Updated");
      } else {
        await dispatch(createCalendarEvent(formData)).unwrap();
        toast.success("Event Created");
      }
      setOpenModal(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await dispatch(deleteCalendarEvent(selectedEvent._id)).unwrap();
      toast.success("Event Deleted");
      setOpenModal(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(err || "Failed to delete");
    }
  };

  // Custom event styling based on category
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: CATEGORY_CONFIG[event.category]?.color || "#6366f1",
      borderRadius: "8px",
      color: "white",
      border: "none",
      fontSize: "0.7rem",
      padding: "0",
      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    },
  });

  // Custom event renderer
  const CustomEvent = ({ event }) => {
    const conf = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.Other;
    const Icon = conf.icon;
    return (
      <div className="flex flex-col px-1.5 py-0.5 h-full overflow-hidden text-left">
        <div className="flex items-center gap-1 font-bold truncate">
          <span className="text-[9px] opacity-80 shrink-0">
            <Icon size={10} />
          </span>
          <span className="truncate text-[10px] leading-tight font-semibold">
            {event.title}
          </span>
        </div>
        {event.client?.companyName && (
          <div className="text-[8px] opacity-70 truncate">
            {event.client.companyName}
          </div>
        )}
      </div>
    );
  };

  // Custom toolbar
  const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate("PREV");
    const goToNext = () => toolbar.onNavigate("NEXT");
    const goToCurrent = () => toolbar.onNavigate("TODAY");
    const toggleView = (view) => toolbar.onView(view);

    return (
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5 p-1">
        {/* Navigation */}
        <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
          <button
            onClick={goToBack}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer hover:shadow-xs active:scale-95"
            title="Previous"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            onClick={goToCurrent}
            className="px-3 py-1 rounded-lg text-xs font-extrabold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/30 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer hover:shadow-xs active:scale-95"
            title="Next"
          >
            <FiChevronRight size={16} />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-yellow-50 uppercase tracking-wider">
          {toolbar.label}
        </h2>

        {/* View Switchers */}
        <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
          {toolbar.views.map((v) => {
            const isActive = toolbar.view === v;
            return (
              <button
                key={v}
                onClick={() => toggleView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold capitalize transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto">
      <div className="py-4 sm:py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <FiCalendar size={15} className="text-white" />
              </div>
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-800 dark:text-yellow-50">
                Calendar
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-400 ml-10 hidden xs:block">
              Manage all your events — meetings, birthdays & more
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-semibold rounded-xl transition-all active:scale-95 ${
                showFilters
                  ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <FiFilter size={13} />
              Filter
              {activeFilters.size < ALL_CATEGORIES.length && (
                <span className="ml-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilters.size}
                </span>
              )}
            </button>

            {/* New Event */}
            <button
              onClick={() => {
                setSelectedEvent(null);
                setIsEditing(false);
                setOpenModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md"
            >
              <FiPlus size={14} /> New Event
            </button>
          </div>
        </div>

        {/* CATEGORY FILTER CHIPS */}
        {showFilters && (
          <div className="mb-4 p-3 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-700/50 animate-[slideDown_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Filter by Category
              </span>
              <button
                onClick={toggleAllFilters}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {activeFilters.size === ALL_CATEGORIES.length
                  ? "Clear All"
                  : "Select All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const isActive = activeFilters.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleFilter(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "text-white border-transparent shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 opacity-60 hover:opacity-80"
                    }`}
                    style={
                      isActive ? { backgroundColor: conf.color } : undefined
                    }
                  >
                    <Icon size={12} />
                    {cat}
                    <span
                      className={`ml-0.5 text-[9px] font-bold ${
                        isActive
                          ? "text-white/70"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    >
                      ({categoryCounts[cat]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-xs text-slate-400 font-medium">
              Loading events...
            </span>
          </div>
        )}

        {/* CALENDAR */}
        <div
          className="rounded-2xl p-3 sm:p-5 shadow-sm"
          style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
        >
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{ event: CustomEvent, toolbar: CustomToolbar }}
            views={["month", "week", "day"]}
            className="event-calendar"
          />
        </div>

        {/* CATEGORY LEGEND (bottom) */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 px-2">
          {ALL_CATEGORIES.map((cat) => {
            const conf = CATEGORY_CONFIG[cat];
            const Icon = conf.icon;
            return (
              <div
                key={cat}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: conf.color }}
                />
                <Icon size={10} className="opacity-60" />
                <span>{cat}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* EVENT MODAL */}
      <EventCalendarModal
        open={openModal}
        setOpen={setOpenModal}
        onSubmit={handleEventSubmit}
        initialData={selectedEvent}
        isEditing={isEditing}
        onDelete={handleDeleteEvent}
      />

      <style>{`
        .event-calendar { color: #1e293b; }
        .dark .event-calendar { color: #cbd5e1; }

        .event-calendar .rbc-month-view,
        .event-calendar .rbc-time-view {
          border: 1px solid #f1f5f9 !important;
          border-radius: 12px;
          overflow: hidden;
        }
        .dark .event-calendar .rbc-month-view,
        .dark .event-calendar .rbc-time-view {
          border: 1px solid #1e293b !important;
          background-color: #0f172a;
        }

        .event-calendar .rbc-header {
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.65rem;
          padding: 8px 0;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-header {
          color: #94a3b8;
          background: #1e293b;
          border-bottom: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-header + .rbc-header {
          border-left: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-header + .rbc-header {
          border-left: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-day-bg {
          background-color: #ffffff;
        }
        .dark .event-calendar .rbc-day-bg {
          background-color: #0f172a;
        }
        .event-calendar .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-month-row {
          border-top: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-month-row {
          border-top: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-today {
          background-color: #eff6ff !important;
        }
        .dark .event-calendar .rbc-today {
          background-color: rgba(99, 102, 241, 0.08) !important;
        }

        .event-calendar .rbc-off-range-bg {
          background-color: #f8fafc !important;
        }
        .dark .event-calendar .rbc-off-range-bg {
          background-color: #0b0f19 !important;
        }

        .event-calendar .rbc-event {
          padding: 2px 4px !important;
          margin-top: 1px !important;
          transition: all 0.2s ease;
        }
        .event-calendar .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18) !important;
          filter: brightness(1.08);
        }

        .event-calendar .rbc-event-content {
          font-size: 11px;
          font-weight: 600;
        }

        .event-calendar .rbc-time-header {
          background: #f8fafc;
        }
        .dark .event-calendar .rbc-time-header {
          background: #1e293b;
        }

        .event-calendar .rbc-time-header-content {
          border-left: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-time-header-content {
          border-left: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-time-content {
          border-top: 2px solid #f1f5f9 !important;
          background: #ffffff;
        }
        .dark .event-calendar .rbc-time-content {
          border-top: 2px solid #1e293b !important;
          background: #0f172a;
        }

        .event-calendar .rbc-time-gutter {
          background: #ffffff;
        }
        .dark .event-calendar .rbc-time-gutter {
          background: #0f172a;
        }

        .event-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-time-slot {
          border-top: 1px solid #f8fafc !important;
        }
        .dark .event-calendar .rbc-time-slot {
          border-top: 1px solid #152033 !important;
        }

        .event-calendar .rbc-day-slot {
          background: #ffffff;
        }
        .dark .event-calendar .rbc-day-slot {
          background: #0f172a;
        }

        .event-calendar .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f1f5f9 !important;
        }
        .dark .event-calendar .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #1e293b !important;
        }

        .event-calendar .rbc-show-more {
          font-weight: 750;
          color: #6366f1;
          font-size: 10px;
          text-transform: uppercase;
          background: transparent;
        }
        .dark .event-calendar .rbc-show-more {
          color: #818cf8;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EventCalendar;
