import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-hot-toast";
import {
  FiPlus,
  FiX,
  FiTrash2,
  FiMapPin,
  FiUser,
  FiVideo,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiClipboard,
  FiCheckSquare,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiEdit2,
  FiEye,
  FiGrid,
  FiSearch,
  FiList,
} from "react-icons/fi";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SHOOT_TYPES = [
  "Food Shoot",
  "Product Shoot",
  "Fashion Shoot",
  "Event Shoot",
  "Video Shoot",
  "Photo Shoot",
  "Other",
];

const SHOOT_STATUSES = [
  "Planned",
  "Confirmed",
  "In Progress",
  "Completed",
  "Pending Approval",
  "At Risk",
  "Cancelled",
];

// Helper to parse time string like "09:00 AM" and apply to a date
const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  if (!timeStr) return date;

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return date;
  let [, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper for status styling tokens supporting high-contrast Dark and Light modes
const getStatusStyles = (status) => {
  switch (status) {
    case "Confirmed":
      return {
        badgeBg:
          "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400",
        dot: "bg-emerald-500",
        pill: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 font-semibold",
        borderLeft: "border-l-emerald-500",
        chipBg:
          "bg-emerald-50/90 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30 shadow-xs",
      };
    case "In Progress":
      return {
        badgeBg:
          "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-400",
        dot: "bg-blue-500",
        pill: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 font-semibold",
        borderLeft: "border-l-blue-500",
        chipBg:
          "bg-blue-50/90 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-500/30 shadow-xs",
      };
    case "Planned":
      return {
        badgeBg:
          "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-400",
        dot: "bg-purple-500",
        pill: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 font-semibold",
        borderLeft: "border-l-purple-500",
        chipBg:
          "bg-purple-50/90 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/25 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-500/30 shadow-xs",
      };
    case "Pending Approval":
      return {
        badgeBg:
          "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400",
        dot: "bg-amber-500",
        pill: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 font-semibold",
        borderLeft: "border-l-amber-500",
        chipBg:
          "bg-amber-50/90 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-500/30 shadow-xs",
      };
    case "At Risk":
      return {
        badgeBg:
          "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-400",
        dot: "bg-rose-500",
        pill: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 font-semibold",
        borderLeft: "border-l-rose-500",
        chipBg:
          "bg-rose-50/90 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-500/30 shadow-xs",
      };
    case "Completed":
      return {
        badgeBg:
          "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30 text-teal-800 dark:text-teal-400",
        dot: "bg-teal-500",
        pill: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30 font-semibold",
        borderLeft: "border-l-teal-500",
        chipBg:
          "bg-teal-50/90 dark:bg-teal-500/15 hover:bg-teal-100 dark:hover:bg-teal-500/25 text-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-500/30 shadow-xs",
      };
    case "Cancelled":
      return {
        badgeBg:
          "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
        dot: "bg-slate-400 dark:bg-slate-500",
        pill: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600",
        borderLeft: "border-l-slate-400 dark:border-l-slate-500",
        chipBg:
          "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600",
      };
    default:
      return {
        badgeBg:
          "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300",
        dot: "bg-emerald-500",
        pill: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 font-semibold",
        borderLeft: "border-l-emerald-500",
        chipBg:
          "bg-emerald-50/90 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30 shadow-xs",
      };
  }
};

// Custom Toolbar with Month, Agenda, and List view switcher + Controls
const CustomToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  totalEventsCount,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
      {/* Left: Navigation and Date Heading */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-slate-100/80 dark:bg-[#131b2e] p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <button
            type="button"
            onClick={() => onNavigate("TODAY")}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            Today
          </button>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Previous"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Next"
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {label}
          </h2>
          <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/30 rounded-full shadow-xs">
            {totalEventsCount} {totalEventsCount === 1 ? "shoot" : "shoots"}
          </span>
        </div>
      </div>

      {/* Right: View Switcher (Month, Agenda, List) */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="bg-slate-100/80 dark:bg-[#131b2e] p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => onView("month")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              view === "month"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
            }`}
          >
            <FiCalendar size={14} />
            <span>Month</span>
          </button>

          <button
            type="button"
            onClick={() => onView("agenda")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              view === "agenda"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
            }`}
          >
            <FiClipboard size={14} />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => onView("list")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              view === "list"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
            }`}
          >
            <FiList size={14} />
            <span>List</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Event component in month view
const CustomEvent = ({ event }) => {
  const { resource } = event;
  const statusStyle = getStatusStyles(resource.status);

  return (
    <div
      className={`group relative flex items-center justify-between gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all shadow-xs overflow-hidden ${statusStyle.chipBg}`}
      title={`${resource.shootTitle} (${resource.schedule?.startTime || ""}) - ${resource.client?.companyName || ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dot}`} />
        <span className="text-[10px] font-bold opacity-80 shrink-0">
          {resource.schedule?.startTime?.replace(":00", "") || ""}
        </span>
        <span className="font-semibold truncate text-[11px]">
          {resource.shootTitle}
        </span>
      </div>

      {/* Action icons on hover */}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 bg-white/95 dark:bg-slate-800 px-1 py-0.5 rounded shadow-xs border border-gray-100 dark:border-slate-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            resource.onView && resource.onView();
          }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0.5 cursor-pointer"
          title="View Details"
        >
          <FiEye size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            resource.onEdit && resource.onEdit();
          }}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-0.5 cursor-pointer"
          title="Edit Shoot"
        >
          <FiEdit2 size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            resource.onDelete && resource.onDelete();
          }}
          className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 p-0.5 cursor-pointer"
          title="Delete Shoot"
        >
          <FiTrash2 size={11} />
        </button>
      </div>
    </div>
  );
};
// Rich Shoot List View Component for 'list' view
const ShootListView = ({
  shoots,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  hasActiveFilters,
  onResetFilters,
}) => {
  if (shoots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/20">
          <FiCalendar size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          No Shoots Found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {hasActiveFilters
            ? "No scheduled shoots match your current search and filter criteria."
            : "You don't have any shoots scheduled yet. Schedule your first shoot to get started!"}
        </p>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => onAddNew()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <FiPlus size={16} /> Schedule Shoot
          </button>
        </div>
      </div>
    );
  }

  // Sort shoots chronologically by date
  const sortedShoots = [...shoots].sort((a, b) => {
    const dateA = new Date(a.schedule?.shootDate || 0);
    const dateB = new Date(b.schedule?.shootDate || 0);
    return dateA - dateB;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111a2e] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <th className="py-3.5 px-4 rounded-l-xl">Date & Time</th>
            <th className="py-3.5 px-4">Shoot Title & Client</th>
            <th className="py-3.5 px-4">Type</th>
            <th className="py-3.5 px-4">Location</th>
            <th className="py-3.5 px-4">Lead Assignee</th>
            <th className="py-3.5 px-4">Budget</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 text-xs">
          {sortedShoots.map((shoot) => {
            const statusStyle = getStatusStyles(shoot.status);
            const isVideo = shoot.shootType?.toLowerCase().includes("video");
            const formattedDate = shoot.schedule?.shootDate
              ? format(new Date(shoot.schedule.shootDate), "EEE, MMM d, yyyy")
              : "Date TBD";

            return (
              <tr
                key={shoot._id}
                onClick={() => onView(shoot)}
                className="hover:bg-slate-50/80 dark:hover:bg-[#131b2e]/60 transition-colors cursor-pointer group"
              >
                {/* Date & Time */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <FiCalendar size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formattedDate}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <FiClock size={10} />
                        {shoot.schedule?.startTime || "Time TBD"}
                        {shoot.schedule?.endTime && ` - ${shoot.schedule.endTime}`}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Title & Client */}
                <td className="py-3.5 px-4 max-w-[220px]">
                  <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    {shoot.shootTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{shoot.client?.companyName || "Unknown"}</span>
                  </p>
                </td>

                {/* Type */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#131b2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
                    {isVideo ? (
                      <FiVideo size={12} className="text-blue-500" />
                    ) : (
                      <FiCamera size={12} className="text-purple-500" />
                    )}
                    {shoot.shootType}
                  </span>
                </td>

                {/* Location */}
                <td className="py-3.5 px-4 max-w-[160px]">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                    <FiMapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{shoot.location || "TBD"}</span>
                  </div>
                </td>

                {/* Lead Assignee */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center justify-center text-[10px]">
                      {shoot.assignedTo?.name ? shoot.assignedTo.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {shoot.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                </td>

                {/* Budget */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {shoot.estimatedBudget ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{shoot.estimatedBudget}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">-</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyle.badgeBg}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                    {shoot.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div
                    className="flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onView(shoot)}
                      className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <FiEye size={15} />
                    </button>
                    <button
                      onClick={() => onEdit(shoot)}
                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Shoot"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(shoot)}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Shoot"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Custom Month Date Header Component with clean day number and hover "+ Add"
const CustomMonthDateHeader = ({ date, label, onAddForDate }) => {
  const isToday = isSameDay(date, new Date());
  return (
    <div className="flex items-center justify-between px-2 py-1 group/header">
      <span
        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
          isToday
            ? "bg-emerald-500 text-white shadow-xs font-black ring-2 ring-emerald-400/30"
            : "text-slate-700 dark:text-slate-300 group-hover/header:text-emerald-500 dark:group-hover/header:text-emerald-400"
        }`}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddForDate && onAddForDate(date);
        }}
        className="opacity-0 group-hover/header:opacity-100 text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 p-1 rounded transition-all cursor-pointer"
        title="Add shoot for this date"
      >
        <FiPlus size={12} />
      </button>
    </div>
  );
};



const ShootCalendor = () => {
  const currentUser = useSelector((state) => state.auth?.user);
  const [shoots, setShoots] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedShootTypeFilter, setSelectedShootTypeFilter] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewShoot, setViewShoot] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    client: "",
    shootTitle: "",
    shootType: "Food Shoot",
    description: "",
    shootDate: "",
    startTime: "09:00 AM",
    endTime: "01:00 PM",
    status: "Planned",
    location: "",
    assignedTo: "",
    shootTeam: [],
    purpose: "",
    contentUse: "",
    weather: "",
    transport: "",
    estimatedBudget: "",
    clientContactName: "",
    clientContactPhone: "",
    shootSchedule: [{ time: "", task: "" }],
    checklist: [{ task: "", isCompleted: false }],
    notes: "",
    specialInstructions: "",
  });

  useEffect(() => {
    fetchShoots();
    fetchClients();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axiosInstance.get("/users");
      setUsers(data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await axiosInstance.get("/clients");
      setClients(data.data || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const fetchShoots = async () => {
    try {
      const { data } = await axiosInstance.get("/shoot-calendar");
      setShoots(data.data || []);
    } catch (error) {
      toast.error("Failed to fetch shoots");
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === "select-multiple") {
      const values = Array.from(selectedOptions, (option) => option.value);
      setFormData((prev) => ({ ...prev, [name]: values }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openModal = (shoot = null, prefilledDate = null) => {
    if (shoot) {
      setSelectedShoot(shoot);
      setFormData({
        client: shoot.client?._id || shoot.client || "",
        shootTitle: shoot.shootTitle,
        shootType: shoot.shootType,
        description: shoot.description || "",
        shootDate: shoot.schedule?.shootDate
          ? new Date(shoot.schedule.shootDate).toISOString().split("T")[0]
          : "",
        startTime: shoot.schedule?.startTime || "09:00 AM",
        endTime: shoot.schedule?.endTime || "01:00 PM",
        status: shoot.status || "Planned",
        location: shoot.location || "",
        assignedTo: shoot.assignedTo?._id || shoot.assignedTo || "",
        shootTeam: shoot.shootTeam?.map((u) => u._id || u) || [],
        purpose: shoot.purpose || "",
        contentUse: shoot.contentUse || "",
        weather: shoot.weather || "",
        transport: shoot.transport || "",
        estimatedBudget: shoot.estimatedBudget || "",
        clientContactName: shoot.clientContact?.name || "",
        clientContactPhone: shoot.clientContact?.phone || "",
        shootSchedule: shoot.shootSchedule?.length
          ? shoot.shootSchedule
          : [{ time: "", task: "" }],
        checklist: shoot.checklist?.length
          ? shoot.checklist
          : [{ task: "", isCompleted: false }],
        notes: shoot.notes || "",
        specialInstructions: shoot.specialInstructions || "",
      });
    } else {
      setSelectedShoot(null);
      const defaultDateStr = prefilledDate
        ? format(prefilledDate, "yyyy-MM-dd")
        : new Date().toISOString().split("T")[0];

      setFormData({
        client: "",
        shootTitle: "",
        shootType: "Food Shoot",
        description: "",
        shootDate: defaultDateStr,
        startTime: "09:00 AM",
        endTime: "01:00 PM",
        status: "Planned",
        location: "",
        assignedTo: "",
        shootTeam: [],
        purpose: "",
        contentUse: "",
        weather: "",
        transport: "",
        estimatedBudget: "",
        clientContactName: "",
        clientContactPhone: "",
        shootSchedule: [{ time: "", task: "" }],
        checklist: [{ task: "", isCompleted: false }],
        notes: "",
        specialInstructions: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShoot(null);
  };

  const handleSelectSlot = ({ start }) => {
    openModal(null, start);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      client: formData.client,
      shootTitle: formData.shootTitle,
      shootType: formData.shootType,
      description: formData.description,
      schedule: {
        shootDate: formData.shootDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
      status: formData.status,
      location: formData.location,
      assignedTo: formData.assignedTo,
      shootTeam: formData.shootTeam,
      purpose: formData.purpose,
      contentUse: formData.contentUse,
      weather: formData.weather,
      transport: formData.transport,
      estimatedBudget: formData.estimatedBudget,
      clientContact: {
        name: formData.clientContactName,
        phone: formData.clientContactPhone,
      },
      shootSchedule: formData.shootSchedule.filter((s) => s.time || s.task),
      checklist: formData.checklist.filter((c) => c.task),
      notes: formData.notes,
      specialInstructions: formData.specialInstructions,
      createdBy: currentUser?._id,
    };

    try {
      if (selectedShoot) {
        await axiosInstance.put(
          `/shoot-calendar/${selectedShoot._id}`,
          payload,
        );
        toast.success("Shoot updated successfully");
      } else {
        await axiosInstance.post("/shoot-calendar", payload);
        toast.success("Shoot created successfully");
      }
      fetchShoots();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving shoot");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShoot) return;
    if (!window.confirm("Are you sure you want to delete this shoot?")) return;

    try {
      await axiosInstance.delete(`/shoot-calendar/${selectedShoot._id}`);
      toast.success("Shoot deleted");
      fetchShoots();
      closeModal();
    } catch (error) {
      toast.error("Failed to delete shoot");
      console.error(error);
    }
  };

  const handleDeleteShoot = async (shoot) => {
    if (!window.confirm("Are you sure you want to delete this shoot?")) return;

    try {
      await axiosInstance.delete(`/shoot-calendar/${shoot._id}`);
      toast.success("Shoot deleted");
      fetchShoots();
    } catch (error) {
      toast.error("Failed to delete shoot");
      console.error(error);
    }
  };

  const openViewOffcanvas = (shoot) => {
    setViewShoot(shoot);
    setIsViewOpen(true);
  };

  const closeViewOffcanvas = () => {
    setIsViewOpen(false);
    setViewShoot(null);
  };

  // Filter shoots based on client, status, shoot type, search query, and user permissions
  const filteredShoots = shoots.filter((shoot) => {
    // Client filter
    if (
      selectedClientFilter &&
      shoot.client?._id !== selectedClientFilter &&
      shoot.client !== selectedClientFilter
    ) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter && shoot.status !== selectedStatusFilter) {
      return false;
    }

    // Shoot Type filter
    if (selectedShootTypeFilter && shoot.shootType !== selectedShootTypeFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = shoot.shootTitle?.toLowerCase().includes(q);
      const clientMatch = shoot.client?.companyName?.toLowerCase().includes(q);
      const locationMatch = shoot.location?.toLowerCase().includes(q);
      const typeMatch = shoot.shootType?.toLowerCase().includes(q);
      const leadMatch = shoot.assignedTo?.name?.toLowerCase().includes(q);
      if (!titleMatch && !clientMatch && !locationMatch && !typeMatch && !leadMatch) {
        return false;
      }
    }

    // Role-based visibility
    if (
      currentUser?.role &&
      currentUser.role !== "admin" &&
      currentUser.role !== "operationmanager"
    ) {
      const currentUserId = String(currentUser._id);

      const isCreator =
        String(shoot.createdBy?._id || shoot.createdBy) === currentUserId;
      const isAssigned =
        String(shoot.assignedTo?._id || shoot.assignedTo) === currentUserId;
      const inTeam = shoot.shootTeam?.some(
        (member) => String(member?._id || member) === currentUserId,
      );

      if (!isCreator && !isAssigned && !inTeam) {
        return false;
      }
    }

    return true;
  });

  // Transform data for react-big-calendar
  const events = filteredShoots.map((shoot) => {
    const dateStr = shoot.schedule?.shootDate
      ? new Date(shoot.schedule.shootDate).toISOString().split("T")[0]
      : "";

    let start = new Date();
    let end = new Date();

    if (dateStr) {
      start = parseDateTime(dateStr, shoot.schedule?.startTime);
      end = parseDateTime(dateStr, shoot.schedule?.endTime);
    }

    return {
      id: shoot._id,
      title: shoot.shootTitle,
      start,
      end,
      allDay: currentView === "month",
      resource: {
        ...shoot,
        onEdit: () => openModal(shoot),
        onDelete: () => handleDeleteShoot(shoot),
        onView: () => openViewOffcanvas(shoot),
      },
    };
  });

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: "1px",
      },
    };
  };

  const minTime = new Date();
  minTime.setHours(7, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(21, 0, 0);

  const totalShoots = shoots.length;
  const getCount = (status) =>
    shoots.filter((s) => s.status === status).length;
  const getPercentage = (count) =>
    totalShoots === 0 ? "0%" : `${((count / totalShoots) * 100).toFixed(0)}%`;

  // Professional Metric cards with crisp tinted icons, clean dark backgrounds, and subtle borders
  const statsCards = [
    {
      title: "Total Shoots",
      value: totalShoots,
      statusKey: "",
      subtitle: "All recorded",
      icon: <FiCalendar size={18} className="text-indigo-500" />,
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Confirmed",
      value: getCount("Confirmed"),
      statusKey: "Confirmed",
      subtitle: getPercentage(getCount("Confirmed")),
      icon: <FiCheckCircle size={18} className="text-emerald-500" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "In Progress",
      value: getCount("In Progress"),
      statusKey: "In Progress",
      subtitle: getPercentage(getCount("In Progress")),
      icon: <FiClock size={18} className="text-blue-500" />,
      iconBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Planned",
      value: getCount("Planned"),
      statusKey: "Planned",
      subtitle: getPercentage(getCount("Planned")),
      icon: <FiClipboard size={18} className="text-purple-500" />,
      iconBg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Completed",
      value: getCount("Completed"),
      statusKey: "Completed",
      subtitle: getPercentage(getCount("Completed")),
      icon: <FiCheckSquare size={18} className="text-teal-500" />,
      iconBg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "Pending Approval",
      value: getCount("Pending Approval"),
      statusKey: "Pending Approval",
      subtitle: getPercentage(getCount("Pending Approval")),
      icon: <FiAlertCircle size={18} className="text-amber-500" />,
      iconBg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "At Risk",
      value: getCount("At Risk"),
      statusKey: "At Risk",
      subtitle: getPercentage(getCount("At Risk")),
      icon: <FiAlertTriangle size={18} className="text-rose-500" />,
      iconBg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  const hasActiveFilters =
    selectedClientFilter || selectedStatusFilter || selectedShootTypeFilter || searchQuery;

  const handleResetFilters = () => {
    setSelectedClientFilter("");
    setSelectedStatusFilter("");
    setSelectedShootTypeFilter("");
    setSearchQuery("");
  };

  return (
    <div className="max-w-8xl mx-auto min-h-[calc(100vh-64px)] flex flex-col pt-5 pb-6 text-slate-900 dark:text-slate-100">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 px-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs shadow-emerald-500/30">
              <FiCalendar size={22} />
            </span>
            Shoot Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage, schedule and monitor video & photography shoots across clients
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-emerald-500/25 text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <FiPlus size={18} /> Schedule Shoot
          </button>
        </div>
      </div>

      {/* Interactive Stats Cards (Clickable to Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5 px-5 shrink-0">
        {statsCards.map((card, idx) => {
          const isSelected =
            selectedStatusFilter === card.statusKey &&
            (card.statusKey !== "" || (!selectedStatusFilter && card.statusKey === ""));
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedStatusFilter((prev) =>
                  prev === card.statusKey ? "" : card.statusKey,
                );
              }}
              className={`text-left rounded-2xl p-3.5 shadow-xs border transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 bg-white dark:bg-[#0c1322] ${
                isSelected
                  ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-400/40 dark:ring-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/25"
                  : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg}`}
                >
                  {card.icon}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#131b2e] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80 shadow-xs">
                  {card.subtitle}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                  {card.value}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#0c1322] mx-5 mb-4 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[280px]">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shoots, clients, locations..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-[#131b2e] hover:bg-slate-100/70 dark:hover:bg-[#162038] focus:bg-white dark:focus:bg-[#131b2e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Client Filter */}
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#131b2e] hover:bg-slate-100/70 dark:hover:bg-[#162038] focus:bg-white dark:focus:bg-[#131b2e] text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-w-[150px] cursor-pointer"
          >
            <option value="" className="dark:bg-[#131b2e] dark:text-slate-100">All Clients</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id} className="dark:bg-[#131b2e] dark:text-slate-100">
                {client.companyName}
              </option>
            ))}
          </select>

          {/* Shoot Type Filter */}
          <select
            value={selectedShootTypeFilter}
            onChange={(e) => setSelectedShootTypeFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#131b2e] hover:bg-slate-100/70 dark:hover:bg-[#162038] focus:bg-white dark:focus:bg-[#131b2e] text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-w-[140px] cursor-pointer"
          >
            <option value="" className="dark:bg-[#131b2e] dark:text-slate-100">All Shoot Types</option>
            {SHOOT_TYPES.map((type) => (
              <option key={type} value={type} className="dark:bg-[#131b2e] dark:text-slate-100">
                {type}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#131b2e] hover:bg-slate-100/70 dark:hover:bg-[#162038] focus:bg-white dark:focus:bg-[#131b2e] text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-w-[130px] cursor-pointer"
          >
            <option value="" className="dark:bg-[#131b2e] dark:text-slate-100">All Statuses</option>
            {SHOOT_STATUSES.map((status) => (
              <option key={status} value={status} className="dark:bg-[#131b2e] dark:text-slate-100">
                {status}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/60 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <FiX size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Main Calendar Card */}
      <div className="flex-1 bg-white dark:bg-[#0c1322] p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 flex flex-col mx-5 mb-5 min-h-[750px]">
        <div className="w-full flex flex-col h-full">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            /* Calendar Global Reset */
            .rbc-calendar { font-family: inherit; }
            .rbc-month-view { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff; }
            .rbc-month-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
            .rbc-header { padding: 10px 4px !important; font-size: 11px !important; font-weight: 700 !important; color: #64748b !important; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: none !important; border-left: 1px solid #e2e8f0 !important; }
            .rbc-header:first-child { border-left: none !important; }
            .rbc-day-bg { border-left: 1px solid #e2e8f0 !important; transition: background 0.15s ease; }
            .rbc-day-bg:hover { background-color: #f8fafc; }
            .rbc-month-row { border-top: 1px solid #e2e8f0 !important; min-height: 110px !important; }
            .rbc-off-range-bg { background: #fafafa !important; opacity: 0.6; }
            .rbc-today { background-color: rgba(16, 185, 129, 0.04) !important; }
            
            /* Agenda View */
            .rbc-agenda-view { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff; }
            .rbc-agenda-view table { font-size: 13px; }
            .rbc-agenda-date-cell, .rbc-agenda-time-cell { font-weight: 600; color: #334155; padding: 12px 16px !important; }
            .rbc-agenda-event-cell { padding: 12px 16px !important; }
            
            /* Event row formatting in month */
            .rbc-row-segment { padding: 2px 4px !important; }
            .rbc-show-more { font-size: 11px !important; font-weight: 700 !important; color: #10b981 !important; padding: 2px 6px; border-radius: 6px; background: rgba(16, 185, 129, 0.1); margin-top: 2px; display: inline-block; }
            
            /* ================= DARK MODE STYLING ================= */
            .dark .rbc-month-view { border: 1px solid #1e293b; background: #0c1322; }
            .dark .rbc-month-header { background: #111a2e; border-bottom: 1px solid #1e293b; }
            .dark .rbc-header { color: #94a3b8 !important; background: #111a2e !important; font-size: 11px !important; font-weight: 700 !important; border-left: 1px solid #1e293b !important; }
            .dark .rbc-day-bg { border-left: 1px solid #1e293b !important; }
            .dark .rbc-day-bg:hover { background-color: rgba(30, 41, 59, 0.45); }
            .dark .rbc-month-row { border-top: 1px solid #1e293b !important; }
            .dark .rbc-off-range-bg { background: #080d1a !important; opacity: 0.6; }
            .dark .rbc-today { background-color: rgba(16, 185, 129, 0.08) !important; }
            
            .dark .rbc-agenda-view { border: 1px solid #1e293b; background: #0c1322; }
            .dark .rbc-agenda-view table.rbc-agenda-table thead > tr > th { color: #94a3b8; background: #111a2e; border-bottom: 1px solid #1e293b; padding: 10px 14px; font-weight: 700; }
            .dark .rbc-agenda-view table.rbc-agenda-table tbody > tr > td { border-top: 1px solid #1e293b; color: #f1f5f9; }
            .dark .rbc-agenda-date-cell, .dark .rbc-agenda-time-cell { color: #cbd5e1 !important; border-color: #1e293b; font-weight: 600; }
            .dark .rbc-agenda-event-cell { color: #f8fafc !important; border-color: #1e293b; }
            .dark .rbc-show-more { color: #34d399 !important; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }
          `,
            }}
          />

          {currentView === "list" ? (
            <div className="flex flex-col h-full">
              <CustomToolbar
                label={format(currentDate, "MMMM yyyy")}
                onNavigate={(action) => {
                  if (action === "TODAY") {
                    setCurrentDate(new Date());
                  } else if (action === "PREV") {
                    const prev = new Date(currentDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentDate(prev);
                  } else if (action === "NEXT") {
                    const next = new Date(currentDate);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentDate(next);
                  }
                }}
                onView={(v) => setCurrentView(v)}
                view={currentView}
                totalEventsCount={filteredShoots.length}
              />
              <ShootListView
                shoots={filteredShoots}
                onView={openViewOffcanvas}
                onEdit={openModal}
                onDelete={handleDeleteShoot}
                onAddNew={() => openModal()}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={(newView) => setCurrentView(newView)}
              date={currentDate}
              onNavigate={(newDate) => setCurrentDate(newDate)}
              views={["month", "agenda"]}
              step={30}
              timeslots={2}
              min={minTime}
              max={maxTime}
              selectable={true}
              onSelectSlot={handleSelectSlot}
              style={{ height: "100%", minHeight: "680px", border: "none" }}
              onSelectEvent={(event) => openViewOffcanvas(event.resource)}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: (toolbarProps) => (
                  <CustomToolbar
                    {...toolbarProps}
                    onView={(v) => setCurrentView(v)}
                    totalEventsCount={filteredShoots.length}
                  />
                ),
                event: (eventProps) => <CustomEvent {...eventProps} />,
                month: {
                  dateHeader: (dateHeaderProps) => (
                    <CustomMonthDateHeader
                      {...dateHeaderProps}
                      onAddForDate={(date) => openModal(null, date)}
                    />
                  ),
                },
              }}
            />
          )}

          {/* Interactive Legend & Quick Status Summary */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                Status Filter:
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatusFilter((prev) =>
                    prev === "Confirmed" ? "" : "Confirmed",
                  )
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatusFilter === "Confirmed"
                    ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-600 font-bold text-emerald-900 dark:text-emerald-200"
                    : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                Confirmed ({getCount("Confirmed")})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatusFilter((prev) =>
                    prev === "In Progress" ? "" : "In Progress",
                  )
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatusFilter === "In Progress"
                    ? "bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-600 font-bold text-blue-900 dark:text-blue-200"
                    : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> In
                Progress ({getCount("In Progress")})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatusFilter((prev) =>
                    prev === "Planned" ? "" : "Planned",
                  )
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatusFilter === "Planned"
                    ? "bg-purple-50 dark:bg-purple-950/80 border-purple-300 dark:border-purple-600 font-bold text-purple-900 dark:text-purple-200"
                    : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>{" "}
                Planned ({getCount("Planned")})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatusFilter((prev) =>
                    prev === "Pending Approval" ? "" : "Pending Approval",
                  )
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatusFilter === "Pending Approval"
                    ? "bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-600 font-bold text-amber-900 dark:text-amber-200"
                    : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>{" "}
                Pending Approval ({getCount("Pending Approval")})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatusFilter((prev) =>
                    prev === "At Risk" ? "" : "At Risk",
                  )
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatusFilter === "At Risk"
                    ? "bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-600 font-bold text-rose-900 dark:text-rose-200"
                    : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-rose-500"></div> At
                Risk ({getCount("At Risk")})
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatusFilter((prev) =>
                    prev === "Completed" ? "" : "Completed",
                  )
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatusFilter === "Completed"
                    ? "bg-teal-50 dark:bg-teal-950/80 border-teal-300 dark:border-teal-600 font-bold text-teal-900 dark:text-teal-200"
                    : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>{" "}
                Completed ({getCount("Completed")})
              </button>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              💡 Tip: Click any date slot to quickly schedule a shoot for that day
            </div>
          </div>
        </div>
      </div>

      {/* Schedule / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0c1322] shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                  <FiCalendar size={18} />
                </span>
                {selectedShoot ? "Edit Shoot Details" : "Schedule New Shoot"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-[#131b2e] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-2 transition-all cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto bg-slate-50/50 dark:bg-[#080d1a]">
              <form
                id="shoot-form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Core Details */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div> Core Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="client"
                        required
                        value={formData.client}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="" className="dark:bg-[#131b2e]">Select a client</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id} className="dark:bg-[#131b2e]">
                            {client.companyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Shoot Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="shootTitle"
                        required
                        value={formData.shootTitle}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Diwali Special Video"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Shoot Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="shootType"
                        required
                        value={formData.shootType}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {SHOOT_TYPES.map((type) => (
                          <option key={type} value={type} className="dark:bg-[#131b2e]">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedShoot && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                          {SHOOT_STATUSES.map((status) => (
                            <option key={status} value={status} className="dark:bg-[#131b2e]">
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule & Location */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div> Schedule & Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="shootDate"
                        required
                        value={formData.shootDate}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="09:00 AM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="endTime"
                        required
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="01:00 PM"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Studio A, ECR Road, Chennai"
                      />
                    </div>
                  </div>
                </div>

                {/* Team & Resources */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div> Team & Resources
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Assigned To (Lead)
                      </label>
                      <select
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="" className="dark:bg-[#131b2e]">Select Assignee</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id} className="dark:bg-[#131b2e]">
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between items-center">
                        Shoot Team
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                          Hold Ctrl/Cmd for multiple
                        </span>
                      </label>
                      <select
                        name="shootTeam"
                        multiple
                        value={formData.shootTeam}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all custom-scrollbar"
                        size="3"
                      >
                        {users.map((user) => (
                          <option
                            key={user._id}
                            value={user._id}
                            className="p-1.5 mb-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-[#131b2e]"
                          >
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Transport Needs
                      </label>
                      <input
                        type="text"
                        name="transport"
                        value={formData.transport}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Agency Vehicle required"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Estimated Budget (₹)
                      </label>
                      <input
                        type="number"
                        name="estimatedBudget"
                        value={formData.estimatedBudget}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="8500"
                      />
                    </div>
                  </div>
                </div>

                {/* Scope & Details */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div> Scope & Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Purpose
                      </label>
                      <input
                        type="text"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Menu Photos & Reels"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Content Use
                      </label>
                      <input
                        type="text"
                        name="contentUse"
                        value={formData.contentUse}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Instagram, Facebook"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Weather / Environment
                      </label>
                      <input
                        type="text"
                        name="weather"
                        value={formData.weather}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Indoor / Outdoor Clear"
                      />
                    </div>
                  </div>
                </div>

                {/* Client Contact */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div> Client Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="clientContactName"
                        value={formData.clientContactName}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Name of SPOC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        name="clientContactPhone"
                        value={formData.clientContactPhone}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all"
                      placeholder="Additional details about the shoot..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Special Instructions / Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all"
                      placeholder="e.g. Focus on new menu items. Capture close-ups for reels."
                    ></textarea>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] flex justify-between items-center shrink-0">
              {selectedShoot ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold cursor-pointer"
                >
                  <FiTrash2 size={16} /> Delete Shoot
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131b2e] rounded-xl font-bold transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="shoot-form"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 flex items-center gap-2 text-sm cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Shoot Details"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Offcanvas */}
      {isViewOpen && viewShoot && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity">
          <div className="bg-white dark:bg-[#0c1322] border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 text-slate-900 dark:text-slate-100">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0c1322] sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                  <FiCalendar size={18} />
                </span>
                Shoot Details
              </h2>
              <button
                onClick={closeViewOffcanvas}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-[#131b2e] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-2 transition-all cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-6">
              {/* Status and Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-md">
                    {viewShoot.status}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-[#131b2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 text-xs font-bold rounded-md">
                    {viewShoot.shootType}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {viewShoot.shootTitle}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Client: <span className="font-semibold text-slate-700 dark:text-slate-200">{viewShoot.client?.companyName || "Unknown"}</span>
                </p>
              </div>

              {/* Schedule */}
              <div className="bg-slate-50 dark:bg-[#131b2e] rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <FiClock className="text-emerald-500 dark:text-emerald-400" /> Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Date</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {viewShoot.schedule?.shootDate
                        ? new Date(
                            viewShoot.schedule.shootDate,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Time</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {viewShoot.schedule?.startTime} -{" "}
                      {viewShoot.schedule?.endTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 dark:bg-[#131b2e] p-2 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/80">
                    <FiMapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                      Location
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {viewShoot.location || "TBD"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 dark:bg-[#131b2e] p-2 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/80">
                    <FiUser size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                      Client Contact
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {viewShoot.clientContact?.name || "N/A"}
                      {viewShoot.clientContact?.phone &&
                        ` (${viewShoot.clientContact.phone})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  Team
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Assigned To (Lead)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {viewShoot.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                  {viewShoot.shootTeam?.length > 0 && (
                    <div className="text-sm">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">
                        Shoot Team
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {viewShoot.shootTeam.map((member, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium"
                          >
                            {member.name || member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              {(viewShoot.description || viewShoot.notes) && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    Additional Details
                  </h3>
                  {viewShoot.description && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                        Description
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#131b2e] p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 whitespace-pre-wrap">
                        {viewShoot.description}
                      </p>
                    </div>
                  )}
                  {viewShoot.notes && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                        Special Instructions
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#131b2e] p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 whitespace-pre-wrap">
                        {viewShoot.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] flex gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  closeViewOffcanvas();
                  openModal(viewShoot);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <FiEdit2 size={16} /> Edit Shoot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShootCalendor;
