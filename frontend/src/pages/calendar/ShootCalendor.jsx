import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import {
  FiPlus,
  FiX,
  FiTrash2,
  FiMapPin,
  FiUser,
  FiUsers,
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
  FiSun,
  FiCloudRain,
  FiWind,
  FiRefreshCw,
  FiCloud,
  FiDroplet,
} from "react-icons/fi";

// Weather code decoder for Open-Meteo free API
const getWeatherCodeInfo = (code) => {
  switch (code) {
    case 0:
      return { label: "Clear Sky", emoji: "☀️" };
    case 1:
    case 2:
      return { label: "Partly Cloudy", emoji: "⛅" };
    case 3:
      return { label: "Overcast", emoji: "☁️" };
    case 45:
    case 48:
      return { label: "Foggy / Mist", emoji: "🌫️" };
    case 51:
    case 53:
    case 55:
      return { label: "Light Drizzle", emoji: "🌦️" };
    case 61:
    case 63:
    case 65:
      return { label: "Rainy", emoji: "🌧️" };
    case 71:
    case 73:
    case 75:
      return { label: "Snow", emoji: "🌨️" };
    case 80:
    case 81:
    case 82:
      return { label: "Heavy Rain Showers", emoji: "🌧️" };
    case 95:
    case 96:
    case 99:
      return { label: "Thunderstorm", emoji: "⛈️" };
    default:
      return { label: "Clear / Pleasant", emoji: "☀️" };
  }
};

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

// Helper to convert any time string (12-hr AM/PM or 24-hr) to 24-hour format "HH:mm" for <input type="time" />
const to24Hour = (timeStr) => {
  if (!timeStr) return "09:00";
  const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) {
    let [, hours, minutes, period] = match12;
    let h = parseInt(hours, 10);
    const m = String(minutes).padStart(2, "0");
    if (period.toUpperCase() === "PM" && h < 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    return `${String(match24[1]).padStart(2, "0")}:${match24[2]}`;
  }
  return "09:00";
};

// Helper to convert 24-hour "HH:mm" to 12-hour "hh:mm AM/PM" for storage & display
const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr) return "";
  const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) return timeStr;
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = String(match24[2]).padStart(2, "0");
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${period}`;
  }
  return timeStr;
};

// Helper to parse time string (12-hr or 24-hr) and apply to a Date
const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  if (!timeStr) return date;

  const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) {
    let [, hours, minutes, period] = match12;
    let h = parseInt(hours, 10);
    let m = parseInt(minutes, 10);
    if (period.toUpperCase() === "PM" && h < 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    date.setHours(h, m, 0, 0);
    return date;
  }

  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    let m = parseInt(match24[2], 10);
    date.setHours(h, m, 0, 0);
    return date;
  }

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
        cardBorder:
          "border-emerald-300/80 dark:border-emerald-500/35 hover:border-emerald-400 dark:hover:border-emerald-400/80 shadow-emerald-500/5",
        cardBg: "bg-emerald-50/20 dark:bg-emerald-950/15",
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
        cardBorder:
          "border-blue-300/80 dark:border-blue-500/35 hover:border-blue-400 dark:hover:border-blue-400/80 shadow-blue-500/5",
        cardBg: "bg-blue-50/20 dark:bg-blue-950/15",
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
        cardBorder:
          "border-purple-300/80 dark:border-purple-500/35 hover:border-purple-400 dark:hover:border-purple-400/80 shadow-purple-500/5",
        cardBg: "bg-purple-50/20 dark:bg-purple-950/15",
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
        cardBorder:
          "border-amber-300/80 dark:border-amber-500/35 hover:border-amber-400 dark:hover:border-amber-400/80 shadow-amber-500/5",
        cardBg: "bg-amber-50/20 dark:bg-amber-950/15",
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
        cardBorder:
          "border-rose-300/80 dark:border-rose-500/35 hover:border-rose-400 dark:hover:border-rose-400/80 shadow-rose-500/5",
        cardBg: "bg-rose-50/20 dark:bg-rose-950/15",
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
        cardBorder:
          "border-teal-300/80 dark:border-teal-500/35 hover:border-teal-400 dark:hover:border-teal-400/80 shadow-teal-500/5",
        cardBg: "bg-teal-50/20 dark:bg-teal-950/15",
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
        cardBorder:
          "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
        cardBg: "bg-slate-100/40 dark:bg-slate-800/30",
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
        cardBorder:
          "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
        cardBg: "bg-slate-50/20 dark:bg-slate-800/20",
        chipBg:
          "bg-emerald-50/90 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30 shadow-xs",
      };
  }
};

// Custom Toolbar with Month, Agenda, and List view switcher + Controls
const CustomToolbar = React.memo(({
  label,
  date,
  currentDate,
  onNavigate,
  onView,
  view,
  shoots = [],
}) => {
  const activeDate = date || currentDate || new Date();
  const targetYear = activeDate.getFullYear();
  const targetMonth = activeDate.getMonth();

  // Count how many shoots are in this specific month
  const monthShootsCount = React.useMemo(() => {
    if (!Array.isArray(shoots)) return 0;
    return shoots.filter((shoot) => {
      const rawDate = shoot?.schedule?.shootDate;
      if (!rawDate) return false;
      if (typeof rawDate === "string") {
        const parts = rawDate.split("T")[0].split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          return y === targetYear && m === targetMonth;
        }
      }
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    }).length;
  }, [shoots, targetYear, targetMonth]);

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
          {monthShootsCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-0.5 theme-bg-accent-subtle theme-text-accent border theme-border-accent rounded-full shadow-xs flex items-center gap-1.5 transition-all">
              <span className="w-1.5 h-1.5 rounded-full theme-bg-accent" />
              {monthShootsCount} {monthShootsCount === 1 ? "shoot" : "shoots"}
            </span>
          )}
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
                ? "theme-bg-accent text-white shadow-sm"
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
                ? "theme-bg-accent text-white shadow-sm"
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
                ? "theme-bg-accent text-white shadow-sm"
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
});

// Custom Event in month view - Full Overview Rich Card
const CustomEvent = React.memo(({ event }) => {
  const { resource } = event;
  const statusStyle = getStatusStyles(resource.status);
  const canEdit = resource.canEdit;
  const canDelete = resource.canDelete;

  const startTime = resource.schedule?.startTime || "";
  const endTime = resource.schedule?.endTime || "";
  const timeStr =
    startTime && endTime ? `${startTime} - ${endTime}` : startTime || "All Day";

  const leadName =
    resource.assignedTo?.name ||
    (typeof resource.assignedTo === "string" ? resource.assignedTo : "") ||
    "Unassigned";

  const teamNames =
    Array.isArray(resource.shootTeam) && resource.shootTeam.length > 0
      ? resource.shootTeam
          .map((m) => m?.name || (typeof m === "string" ? m : ""))
          .filter(Boolean)
          .join(", ")
      : "";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        resource.onView && resource.onView();
      }}
      className={`group relative flex flex-col gap-1.5 p-2 rounded-xl border text-xs transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer mb-2 overflow-hidden bg-white/95 dark:bg-[#0e1726]/95 ${
        statusStyle.cardBorder || "border-slate-200 dark:border-slate-700"
      } hover:-translate-y-0.5`}
    >
      {/* Top Header: Time & Shoot Type */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dot}`} />
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate">
            {timeStr}
          </span>
        </div>
        {resource.shootType && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#192338] text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200/50 dark:border-slate-700/50">
            {resource.shootType}
          </span>
        )}
      </div>

      {/* Full Shoot Title View */}
      <div className="text-left">
        <h4 className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-snug break-words">
          {resource.shootTitle}
        </h4>
        {resource.client?.companyName && (
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {resource.client.companyName}
          </p>
        )}
      </div>

      {/* Team Info: Lead & Shoot Team */}
      <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <FiUser size={11} className="text-emerald-500 shrink-0" />
          <span className="font-bold text-slate-400 dark:text-slate-500">
            Lead:
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {leadName}
          </span>
        </div>

        {teamNames && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <FiUsers size={11} className="text-blue-500 shrink-0" />
            <span className="font-bold text-slate-400 dark:text-slate-500">
              Crew:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {teamNames}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action Row: Status Pill & View/Edit/Delete Actions */}
      <div
        className="flex items-center justify-between pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/80"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${statusStyle.pill}`}
        >
          {resource.status}
        </span>

        {/* View, Edit, Delete icon buttons based on roles & permissions */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#141d2e] px-1.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resource.onView && resource.onView();
            }}
            className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
            title="View Details (Read)"
          >
            <FiEye size={12} />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resource.onEdit && resource.onEdit();
              }}
              className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
              title="Edit Shoot (Update)"
            >
              <FiEdit2 size={12} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resource.onDelete && resource.onDelete();
              }}
              className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
              title="Delete Shoot (Delete)"
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Rich Shoot List View Component for 'list' view
const ShootListView = React.memo(({
  shoots,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  hasActiveFilters,
  onResetFilters,
  canCreate = false,
  canEditShoot = () => false,
  canDeleteShoot = () => false,
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
          {canCreate && (
            <button
              onClick={() => onAddNew()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl theme-bg-accent text-white shadow-md hover:opacity-95 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FiPlus size={16} /> Schedule Shoot
            </button>
          )}
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
            const canEdit = canEditShoot(shoot);
            const canDelete = canDeleteShoot(shoot);

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
                        {shoot.schedule?.endTime &&
                          ` - ${shoot.schedule.endTime}`}
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
                    Client:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {shoot.client?.companyName || "Unknown"}
                    </span>
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
                      {shoot.assignedTo?.name
                        ? shoot.assignedTo.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {shoot.assignedTo?.name || "Unassigned"}
                      </span>
                      {shoot.shootTeam && shoot.shootTeam.length > 0 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          +{shoot.shootTeam.length} team{" "}
                          {shoot.shootTeam.length === 1 ? "member" : "members"}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Budget */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {shoot.estimatedBudget ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{shoot.estimatedBudget}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      -
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyle.badgeBg}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${statusStyle.dot}`}
                    />
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
                      title="View Details (Read)"
                    >
                      <FiEye size={15} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEdit(shoot)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Shoot (Update)"
                      >
                        <FiEdit2 size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(shoot)}
                        className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Shoot (Delete)"
                      >
                        <FiTrash2 size={15} />
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
  );
});

// Custom Month Date Header Component with clean day number and hover "+ Add"
const CustomMonthDateHeader = React.memo(({ date, label, onAddForDate, canCreate }) => {
  const isToday = isSameDay(date, new Date());
  return (
    <div className="flex items-center justify-between px-2 py-1 group/header">
      <span
        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
          isToday
            ? "theme-bg-accent text-white shadow-xs font-black ring-2 ring-current/25"
            : "text-slate-700 dark:text-slate-300 group-hover/header:theme-text-accent"
        }`}
      >
        {label}
      </span>
      {canCreate && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddForDate && onAddForDate(date);
          }}
          className="opacity-0 group-hover/header:opacity-100 text-slate-400 dark:text-slate-400 hover:theme-text-accent hover:theme-bg-accent-subtle p-1 rounded transition-all cursor-pointer"
          title="Add shoot for this date (Write)"
        >
          <FiPlus size={12} />
        </button>
      )}
    </div>
  );
});

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
  const [liveWeather, setLiveWeather] = useState(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isCustomShootType, setIsCustomShootType] = useState(false);

  // Dynamically compute all shoot types including custom types from existing shoots
  const allShootTypes = React.useMemo(() => {
    const set = new Set(SHOOT_TYPES);
    shoots.forEach((s) => {
      if (s.shootType && s.shootType.trim()) {
        set.add(s.shootType.trim());
      }
    });
    return Array.from(set);
  }, [shoots]);

  const [formData, setFormData] = useState({
    client: "",
    shootTitle: "",
    shootType: "Food Shoot",
    description: "",
    shootDate: "",
    startTime: "09:00",
    endTime: "13:00",
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

  const fetchLiveWeather = async (customLoc = null) => {
    setIsFetchingWeather(true);
    try {
      let lat = 13.0827; // Default Chennai latitude
      let lon = 80.2707; // Default Chennai longitude
      let locName = "Current Location";

      const searchLoc = customLoc || formData.location;

      if (searchLoc && searchLoc.trim()) {
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              searchLoc.trim(),
            )}&count=1&language=en&format=json`,
          );
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            locName = geoData.results[0].name;
          }
        } catch (geoErr) {
          console.warn("Geocoding failed, using fallback coordinates", geoErr);
        }
      } else if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          locName = "Your GPS Location";
        } catch (posErr) {
          // fallback
        }
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
      );
      const weatherData = await weatherRes.json();

      if (weatherData && weatherData.current) {
        const {
          temperature_2m,
          relative_humidity_2m,
          weather_code,
          wind_speed_10m,
        } = weatherData.current;
        const info = getWeatherCodeInfo(weather_code);
        const weatherString = `${info.emoji} ${Math.round(
          temperature_2m,
        )}°C ${info.label} (${locName} - Hum: ${relative_humidity_2m}%, Wind: ${Math.round(
          wind_speed_10m,
        )} km/h)`;

        setLiveWeather({
          temp: Math.round(temperature_2m),
          label: info.label,
          emoji: info.emoji,
          humidity: relative_humidity_2m,
          wind: Math.round(wind_speed_10m),
          location: locName,
          fullString: weatherString,
        });

        setFormData((prev) => ({
          ...prev,
          weather: weatherString,
        }));
        toast.success(
          `Live weather: ${info.emoji} ${Math.round(temperature_2m)}°C ${info.label}`,
        );
      }
    } catch (err) {
      console.error("Failed to fetch live weather", err);
      toast.error(
        "Could not fetch real-time weather. Please check connection.",
      );
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const fetchShoots = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/shoot-calendar");
      setShoots(data.data || []);
    } catch (error) {
      toast.error("Failed to fetch shoots");
      console.error(error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/users");
      setUsers(data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/clients");
      setClients(data.data || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [shootsRes, clientsRes, usersRes] = await Promise.all([
        axiosInstance.get("/shoot-calendar"),
        axiosInstance.get("/clients"),
        axiosInstance.get("/users"),
      ]);
      setShoots(shootsRes.data?.data || []);
      setClients(clientsRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      toast.error("Failed to fetch shoot calendar data");
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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

    socket.on("shoot_created", fetchShoots);
    socket.on("shoot_updated", fetchShoots);

    return () => {
      socket.disconnect();
    };
  }, [currentUser, fetchShoots]);

  // Helper to extract id safely from object or string
  const getEntityId = (entity) => {
    if (!entity) return "";
    if (typeof entity === "object") {
      return String(entity._id || entity.id || "");
    }
    return String(entity);
  };

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const userRole = (currentUser?.role?.name || currentUser?.role || "")
    .toString()
    .toLowerCase()
    .trim();

  // Roles Definition:
  // admin: Full Access (Read All, Write/Create, Update All, Delete All)
  // operationmanager: Full Access (Read All, Write/Create, Update All, Delete All)
  // team: Role-restricted Access:
  //   - Read: View shoots where assigned as Lead, in shootTeam, or Creator
  //   - Write/Create: Restricted to Admin and Operations Manager
  //   - Update/Edit: Assigned Lead or Creator can update shoot details
  //   - Delete: Restricted to Admin and Operations Manager
  const isSuperOrAdmin =
    userRole === "admin" ||
    userRole === "operationmanager" ||
    userRole === "operation manager";

  // Granular permissions from User Permissions modal
  const shootPerms =
    currentUser?.permissions?.manage_shoots ||
    currentUser?.permissions?.shoot_calendar;

  const hasFullShootsPerm =
    isSuperOrAdmin ||
    currentUser?.permissions?.manage_shoots === true ||
    currentUser?.permissions?.shoot_calendar === true;

  const hasReadPerm =
    hasFullShootsPerm ||
    Boolean(shootPerms?.read) ||
    Boolean(shootPerms?.write) ||
    Boolean(shootPerms?.update) ||
    Boolean(shootPerms?.delete);

  const hasWritePerm =
    hasFullShootsPerm || Boolean(shootPerms?.write);

  const hasUpdatePerm =
    hasFullShootsPerm || Boolean(shootPerms?.update);

  const hasDeletePerm =
    hasFullShootsPerm || Boolean(shootPerms?.delete);

  // Permissions
  const canCreate = hasWritePerm;

  const canEditShoot = useCallback((shoot) => {
    if (!shoot) return false;
    return hasUpdatePerm;
  }, [hasUpdatePerm]);

  const canDeleteShoot = useCallback((shoot) => {
    if (!shoot) return false;
    return hasDeletePerm;
  }, [hasDeletePerm]);

  const canReadShoot = useCallback((shoot) => {
    if (!shoot) return false;
    if (hasReadPerm) return true;
    if (!currentUserId) return false;
    const isCreator = getEntityId(shoot.createdBy) === currentUserId;
    const isAssigned = getEntityId(shoot.assignedTo) === currentUserId;
    const inTeam =
      Array.isArray(shoot.shootTeam) &&
      shoot.shootTeam.some((member) => getEntityId(member) === currentUserId);
    return isCreator || isAssigned || inTeam;
  }, [hasReadPerm, currentUserId]);

  const handleInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === "select-multiple") {
      const values = Array.from(selectedOptions, (option) => option.value);
      setFormData((prev) => ({ ...prev, [name]: values }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openModal = useCallback((shoot = null, prefilledDate = null) => {
    if (shoot) {
      if (!canEditShoot(shoot)) {
        toast.error(
          "Permission denied: You do not have permission to edit this shoot",
        );
        return;
      }
      setSelectedShoot(shoot);
      setIsCustomShootType(
        shoot.shootType && !SHOOT_TYPES.includes(shoot.shootType)
          ? true
          : false,
      );
      setFormData({
        client: shoot.client?._id || shoot.client || "",
        shootTitle: shoot.shootTitle,
        shootType: shoot.shootType || "Food Shoot",
        description: shoot.description || "",
        shootDate: shoot.schedule?.shootDate
          ? new Date(shoot.schedule.shootDate).toISOString().split("T")[0]
          : "",
        startTime: to24Hour(shoot.schedule?.startTime || "09:00"),
        endTime: to24Hour(shoot.schedule?.endTime || "13:00"),
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
      if (!canCreate) {
        toast.error(
          "Permission denied: You do not have permission to schedule shoots",
        );
        return;
      }
      setSelectedShoot(null);
      setIsCustomShootType(false);
      const defaultDateStr = prefilledDate
        ? format(prefilledDate, "yyyy-MM-dd")
        : new Date().toISOString().split("T")[0];

      setFormData({
        client: "",
        shootTitle: "",
        shootType: "Food Shoot",
        description: "",
        shootDate: defaultDateStr,
        startTime: "09:00",
        endTime: "13:00",
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
  }, [canEditShoot, canCreate]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedShoot(null);
    setIsCustomShootType(false);
  }, []);

  const handleSelectSlot = useCallback(({ start }) => {
    if (!canCreate) {
      toast.error(
        "Permission denied: You do not have permission to schedule shoots",
      );
      return;
    }
    openModal(null, start);
  }, [canCreate, openModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedShoot && !canEditShoot(selectedShoot)) {
      toast.error(
        "Permission denied: You do not have permission to edit this shoot",
      );
      return;
    }
    if (!selectedShoot && !canCreate) {
      toast.error(
        "Permission denied: You do not have permission to schedule shoots",
      );
      return;
    }

    if (!formData.client) {
      toast.error("Please select a client for this shoot");
      return;
    }

    if (!formData.shootTitle || !formData.shootTitle.trim()) {
      toast.error("Please enter a shoot title");
      return;
    }

    if (!formData.shootDate) {
      toast.error("Please select a shoot date");
      return;
    }

    setLoading(true);

    const formattedStartTime =
      formatTimeTo12Hour(formData.startTime) || "09:00 AM";
    const formattedEndTime =
      formatTimeTo12Hour(formData.endTime) || "01:00 PM";

    const payload = {
      client: formData.client,
      shootTitle: formData.shootTitle.trim(),
      shootType: formData.shootType || "Food Shoot",
      description: formData.description || "",
      schedule: {
        shootDate: formData.shootDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      },
      status: formData.status || "Planned",
      location: formData.location || "",
      assignedTo: formData.assignedTo ? formData.assignedTo : null,
      shootTeam: Array.isArray(formData.shootTeam)
        ? formData.shootTeam.filter(Boolean)
        : [],
      purpose: formData.purpose || "",
      contentUse: formData.contentUse || "",
      weather: formData.weather || "",
      transport: formData.transport || "",
      estimatedBudget: isSuperOrAdmin
        ? (formData.estimatedBudget !== "" && formData.estimatedBudget !== undefined ? Number(formData.estimatedBudget) : undefined)
        : selectedShoot?.estimatedBudget,
      clientContact: {
        name: formData.clientContactName || "",
        phone: formData.clientContactPhone || "",
      },
      shootSchedule: (formData.shootSchedule || []).filter((s) => s.time || s.task),
      checklist: (formData.checklist || []).filter((c) => c.task),
      notes: formData.notes || "",
      specialInstructions: formData.specialInstructions || "",
      createdBy: currentUser?._id || currentUser?.id,
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
    if (!canDeleteShoot(selectedShoot)) {
      toast.error(
        "Permission denied: You do not have permission to delete shoots",
      );
      return;
    }
    if (!window.confirm("Are you sure you want to delete this shoot?")) return;

    try {
      await axiosInstance.delete(`/shoot-calendar/${selectedShoot._id}`);
      toast.success("Shoot deleted");
      fetchShoots();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete shoot");
      console.error(error);
    }
  };

  const handleDeleteShoot = useCallback(async (shoot) => {
    if (!canDeleteShoot(shoot)) {
      toast.error(
        "Permission denied: You do not have permission to delete shoots",
      );
      return;
    }
    if (!window.confirm("Are you sure you want to delete this shoot?")) return;

    try {
      await axiosInstance.delete(`/shoot-calendar/${shoot._id}`);
      toast.success("Shoot deleted");
      fetchShoots();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete shoot");
      console.error(error);
    }
  }, [canDeleteShoot, fetchShoots]);

  const openViewOffcanvas = useCallback((shoot) => {
    setViewShoot(shoot);
    setIsViewOpen(true);
  }, []);

  const closeViewOffcanvas = useCallback(() => {
    setIsViewOpen(false);
    setViewShoot(null);
  }, []);

  // Shoots allowed for current user role:
  // Admins & Operation Managers see all shoots.
  // Team members see shoots where they are Assigned To (Lead), in the Shoot Team, or Creator.
  const userAllowedShoots = useMemo(() => {
    return shoots.filter(canReadShoot);
  }, [shoots, canReadShoot]);

  // Filter shoots based on client, status, shoot type, and search query
  const filteredShoots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return userAllowedShoots.filter((shoot) => {
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
      if (
        selectedShootTypeFilter &&
        shoot.shootType !== selectedShootTypeFilter
      ) {
        return false;
      }

      // Search query filter (matches title, client, location, type, lead, or team members)
      if (q) {
        const titleMatch = shoot.shootTitle?.toLowerCase().includes(q);
        const clientMatch = shoot.client?.companyName?.toLowerCase().includes(q);
        const locationMatch = shoot.location?.toLowerCase().includes(q);
        const typeMatch = shoot.shootType?.toLowerCase().includes(q);
        const leadMatch = shoot.assignedTo?.name?.toLowerCase().includes(q);
        const teamMatch =
          Array.isArray(shoot.shootTeam) &&
          shoot.shootTeam.some((m) =>
            (m?.name || (typeof m === "string" ? m : ""))
              .toLowerCase()
              .includes(q),
          );
        if (
          !titleMatch &&
          !clientMatch &&
          !locationMatch &&
          !typeMatch &&
          !leadMatch &&
          !teamMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [userAllowedShoots, selectedClientFilter, selectedStatusFilter, selectedShootTypeFilter, searchQuery]);

  // Transform data for react-big-calendar with attached permissions
  const events = useMemo(() => {
    return filteredShoots.map((shoot) => {
      const dateStr = shoot.schedule?.shootDate
        ? new Date(shoot.schedule.shootDate).toISOString().split("T")[0]
        : "";

      let start = new Date();
      let end = new Date();

      if (dateStr) {
        start = parseDateTime(dateStr, shoot.schedule?.startTime);
        end = parseDateTime(dateStr, shoot.schedule?.endTime);
      }

      const canEdit = canEditShoot(shoot);
      const canDelete = canDeleteShoot(shoot);

      return {
        id: shoot._id,
        title: shoot.shootTitle,
        start,
        end,
        allDay: currentView === "month",
        resource: {
          ...shoot,
          canEdit,
          canDelete,
          onEdit: () => openModal(shoot),
          onDelete: () => handleDeleteShoot(shoot),
          onView: () => openViewOffcanvas(shoot),
        },
      };
    });
  }, [filteredShoots, currentView, canEditShoot, canDeleteShoot, openModal, handleDeleteShoot, openViewOffcanvas]);

  const eventStyleGetter = useCallback(() => {
    return {
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: "1px",
      },
    };
  }, []);

  const minTime = useMemo(() => {
    const t = new Date();
    t.setHours(7, 0, 0);
    return t;
  }, []);

  const maxTime = useMemo(() => {
    const t = new Date();
    t.setHours(21, 0, 0);
    return t;
  }, []);

  const statusCounts = useMemo(() => {
    const counts = {
      Confirmed: 0,
      "In Progress": 0,
      Planned: 0,
      Completed: 0,
      "Pending Approval": 0,
      "At Risk": 0,
    };
    userAllowedShoots.forEach((s) => {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    });
    return counts;
  }, [userAllowedShoots]);

  const getCount = useCallback(
    (status) => statusCounts[status] || 0,
    [statusCounts]
  );

  const totalShoots = userAllowedShoots.length;

  // Premium Gradient Metric cards with glowing top accents and interactive status filtering
  const statsCards = useMemo(() => {
    const getPercentage = (count) =>
      totalShoots === 0 ? "0%" : `${((count / totalShoots) * 100).toFixed(0)}%`;

    return [
      {
        title: "Total Shoots",
        value: totalShoots,
        statusKey: "",
        subtitle: "All recorded",
        icon: <FiCalendar size={18} />,
        gradientLight:
          "from-indigo-500/10 via-purple-500/5 to-white/95 border-indigo-200/80 hover:border-indigo-400/80",
        gradientDark:
          "dark:from-indigo-950/45 dark:via-purple-950/25 dark:to-[#0c1322] dark:border-indigo-500/30 dark:hover:border-indigo-400/60",
        topHighlight: "before:via-indigo-400/70",
        iconContainer:
          "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        badgeClass:
          "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-500/30",
        glowHover: "hover:shadow-lg hover:shadow-indigo-500/10",
        activeRing: "ring-2 ring-indigo-500/90 shadow-md shadow-indigo-500/15",
      },
      {
        title: "Confirmed",
        value: statusCounts["Confirmed"] || 0,
        statusKey: "Confirmed",
        subtitle: getPercentage(statusCounts["Confirmed"] || 0),
        icon: <FiCheckCircle size={18} />,
        gradientLight:
          "from-emerald-500/10 via-teal-500/5 to-white/95 border-emerald-200/80 hover:border-emerald-400/80",
        gradientDark:
          "dark:from-emerald-950/45 dark:via-teal-950/25 dark:to-[#0c1322] dark:border-emerald-500/30 dark:hover:border-emerald-400/60",
        topHighlight: "before:via-emerald-400/70",
        iconContainer:
          "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        badgeClass:
          "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/30",
        glowHover: "hover:shadow-lg hover:shadow-emerald-500/10",
        activeRing: "ring-2 ring-emerald-500/90 shadow-md shadow-emerald-500/15",
      },
      {
        title: "In Progress",
        value: statusCounts["In Progress"] || 0,
        statusKey: "In Progress",
        subtitle: getPercentage(statusCounts["In Progress"] || 0),
        icon: <FiClock size={18} />,
        gradientLight:
          "from-sky-500/10 via-blue-500/5 to-white/95 border-sky-200/80 hover:border-sky-400/80",
        gradientDark:
          "dark:from-sky-950/45 dark:via-blue-950/25 dark:to-[#0c1322] dark:border-sky-500/30 dark:hover:border-sky-400/60",
        topHighlight: "before:via-sky-400/70",
        iconContainer:
          "bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/20",
        badgeClass:
          "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-500/30",
        glowHover: "hover:shadow-lg hover:shadow-sky-500/10",
        activeRing: "ring-2 ring-sky-500/90 shadow-md shadow-sky-500/15",
      },
      {
        title: "Planned",
        value: statusCounts["Planned"] || 0,
        statusKey: "Planned",
        subtitle: getPercentage(statusCounts["Planned"] || 0),
        icon: <FiClipboard size={18} />,
        gradientLight:
          "from-purple-500/10 via-fuchsia-500/5 to-white/95 border-purple-200/80 hover:border-purple-400/80",
        gradientDark:
          "dark:from-purple-950/45 dark:via-fuchsia-950/25 dark:to-[#0c1322] dark:border-purple-500/30 dark:hover:border-purple-400/60",
        topHighlight: "before:via-purple-400/70",
        iconContainer:
          "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20",
        badgeClass:
          "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-500/30",
        glowHover: "hover:shadow-lg hover:shadow-purple-500/10",
        activeRing: "ring-2 ring-purple-500/90 shadow-md shadow-purple-500/15",
      },
      {
        title: "Completed",
        value: statusCounts["Completed"] || 0,
        statusKey: "Completed",
        subtitle: getPercentage(statusCounts["Completed"] || 0),
        icon: <FiCheckSquare size={18} />,
        gradientLight:
          "from-teal-500/10 via-emerald-500/5 to-white/95 border-teal-200/80 hover:border-teal-400/80",
        gradientDark:
          "dark:from-teal-950/45 dark:via-emerald-950/25 dark:to-[#0c1322] dark:border-teal-500/30 dark:hover:border-teal-400/60",
        topHighlight: "before:via-teal-400/70",
        iconContainer:
          "bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/20",
        badgeClass:
          "bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-500/30",
        glowHover: "hover:shadow-lg hover:shadow-teal-500/10",
        activeRing: "ring-2 ring-teal-500/90 shadow-md shadow-teal-500/15",
      },
      {
        title: "Pending Approval",
        value: statusCounts["Pending Approval"] || 0,
        statusKey: "Pending Approval",
        subtitle: getPercentage(statusCounts["Pending Approval"] || 0),
        icon: <FiAlertCircle size={18} />,
        gradientLight:
          "from-amber-500/10 via-orange-500/5 to-white/95 border-amber-200/80 hover:border-amber-400/80",
        gradientDark:
          "dark:from-amber-950/45 dark:via-orange-950/25 dark:to-[#0c1322] dark:border-amber-500/30 dark:hover:border-amber-400/60",
        topHighlight: "before:via-amber-400/70",
        iconContainer:
          "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20",
        badgeClass:
          "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/30",
        glowHover: "hover:shadow-lg hover:shadow-amber-500/10",
        activeRing: "ring-2 ring-amber-500/90 shadow-md shadow-amber-500/15",
      },
      {
        title: "At Risk",
        value: statusCounts["At Risk"] || 0,
        statusKey: "At Risk",
        subtitle: getPercentage(statusCounts["At Risk"] || 0),
        icon: <FiAlertTriangle size={18} />,
        gradientLight:
          "from-rose-500/10 via-red-500/5 to-white/95 border-rose-200/80 hover:border-rose-400/80",
        gradientDark:
          "dark:from-rose-950/45 dark:via-red-950/25 dark:to-[#0c1322] dark:border-rose-500/30 dark:hover:border-rose-400/60",
        topHighlight: "before:via-rose-400/70",
        iconContainer:
          "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20",
        badgeClass:
          "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/30",
        glowHover: "hover:shadow-lg hover:shadow-rose-500/10",
        activeRing: "ring-2 ring-rose-500/90 shadow-md shadow-rose-500/15",
      },
    ];
  }, [totalShoots, statusCounts]);

  const hasActiveFilters =
    selectedClientFilter ||
    selectedStatusFilter ||
    selectedShootTypeFilter ||
    searchQuery;

  const handleResetFilters = useCallback(() => {
    setSelectedClientFilter("");
    setSelectedStatusFilter("");
    setSelectedShootTypeFilter("");
    setSearchQuery("");
  }, []);

  const handleToolbarNavigate = useCallback((action) => {
    if (action === "TODAY") {
      setCurrentDate(new Date());
    } else if (action === "PREV") {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setMonth(next.getMonth() - 1);
        return next;
      });
    } else if (action === "NEXT") {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setMonth(next.getMonth() + 1);
        return next;
      });
    }
  }, []);

  const calendarComponents = useMemo(
    () => ({
      toolbar: (toolbarProps) => (
        <CustomToolbar
          {...toolbarProps}
          currentDate={currentDate}
          shoots={filteredShoots}
          onView={(v) => setCurrentView(v)}
        />
      ),
      event: (eventProps) => <CustomEvent {...eventProps} />,
      month: {
        dateHeader: (dateHeaderProps) => (
          <CustomMonthDateHeader
            {...dateHeaderProps}
            canCreate={canCreate}
            onAddForDate={(date) => openModal(null, date)}
          />
        ),
      },
    }),
    [currentDate, filteredShoots, canCreate, openModal]
  );

  return (
    <div className="max-w-8xl mx-auto min-h-[calc(100vh-64px)] flex flex-col pt-5 pb-6 text-slate-900 dark:text-slate-100">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 px-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2.5 theme-bg-accent text-white rounded-xl shadow-md transition-all">
              <FiCalendar size={22} />
            </span>
            Shoot Calendar
          </h1>
        </div>

        {canCreate && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 theme-bg-accent text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:opacity-95 text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FiPlus size={18} /> Schedule Shoot
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5 px-5 shrink-0">
        {statsCards.map((card, idx) => {
          const isSelected =
            card.statusKey && selectedStatusFilter === card.statusKey;

          return (
            <div
              key={idx}
              onClick={() => {
                if (card.statusKey) {
                  setSelectedStatusFilter((prev) =>
                    prev === card.statusKey ? "" : card.statusKey,
                  );
                } else {
                  setSelectedStatusFilter("");
                }
              }}
              className={`relative overflow-hidden text-left rounded-2xl p-3.5 border transition-all duration-300 cursor-pointer bg-gradient-to-br ${card.gradientLight} ${card.gradientDark} ${card.glowHover} hover:-translate-y-0.5 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent ${card.topHighlight} before:to-transparent ${
                isSelected ? card.activeRing : "hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${card.iconContainer}`}
                >
                  {card.icon}
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${card.badgeClass}`}
                >
                  {card.subtitle}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    {card.value}
                  </h3>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#0c1322] mx-5 mb-4 p-2 flex flex-wrap items-center justify-between gap-3">
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
            <option value="" className="dark:bg-[#131b2e] dark:text-slate-100">
              All Clients
            </option>
            {clients.map((client) => (
              <option
                key={client._id}
                value={client._id}
                className="dark:bg-[#131b2e] dark:text-slate-100"
              >
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
            <option value="" className="dark:bg-[#131b2e] dark:text-slate-100">
              All Shoot Types
            </option>
            {allShootTypes.map((type) => (
              <option
                key={type}
                value={type}
                className="dark:bg-[#131b2e] dark:text-slate-100"
              >
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
            <option value="" className="dark:bg-[#131b2e] dark:text-slate-100">
              All Statuses
            </option>
            {SHOOT_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
                className="dark:bg-[#131b2e] dark:text-slate-100"
              >
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
      <div className="flex-1 bg-white dark:bg-[#0c1322] p-5 rounded-2xl  flex flex-col mx-5 mb-5 min-h-[1300px]">
        <div className="w-full flex flex-col h-full">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            /* Calendar Global Reset */
            .rbc-calendar { font-family: inherit; min-height: 1200px !important; height: auto !important; }
            .rbc-month-view { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff; min-height: 1200px !important; height: auto !important; }
            .rbc-month-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
            .rbc-header { padding: 12px 6px !important; font-size: 11px !important; font-weight: 800 !important; color: #64748b !important; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: none !important; border-left: 1px solid #e2e8f0 !important; }
            .rbc-header:first-child { border-left: none !important; }
            .rbc-day-bg { border-left: 1px solid #e2e8f0 !important; transition: background 0.15s ease; min-height: 240px !important; }
            .rbc-day-bg:hover { background-color: #f8fafc; }
            .rbc-month-row { border-top: 1px solid #e2e8f0 !important; min-height: 240px !important; flex: 1 0 240px !important; overflow: visible !important; }
            .rbc-row-content { min-height: 240px !important; z-index: 4; }
            .rbc-off-range-bg { background: #fafafa !important; opacity: 0.6; }
            .rbc-today { background-color: rgba(16, 185, 129, 0.04) !important; }
            .rbc-event { background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; }
            .rbc-event:focus { outline: none !important; }
            
            /* Agenda View */
            .rbc-agenda-view { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff; }
            .rbc-agenda-view table { font-size: 13px; }
            .rbc-agenda-date-cell, .rbc-agenda-time-cell { font-weight: 600; color: #334155; padding: 12px 16px !important; }
            .rbc-agenda-event-cell { padding: 12px 16px !important; }
            
            /* Event row formatting in month */
            .rbc-row-segment { padding: 2px 4px !important; overflow: visible !important; }
            .rbc-show-more { font-size: 11px !important; font-weight: 800 !important; color: #10b981 !important; padding: 3px 8px; border-radius: 8px; background: rgba(16, 185, 129, 0.12); margin-top: 4px; display: inline-block; cursor: pointer; }
            
            /* ================= DARK MODE STYLING ================= */
            .dark .rbc-month-view { border: 1px solid #1e293b; background: #0c1322; min-height: 1200px !important; height: auto !important; }
            .dark .rbc-month-header { background: #111a2e; border-bottom: 1px solid #1e293b; }
            .dark .rbc-header { color: #94a3b8 !important; background: #111a2e !important; font-size: 11px !important; font-weight: 800 !important; border-left: 1px solid #1e293b !important; }
            .dark .rbc-day-bg { border-left: 1px solid #1e293b !important; min-height: 240px !important; }
            .dark .rbc-day-bg:hover { background-color: rgba(30, 41, 59, 0.45); }
            .dark .rbc-month-row { border-top: 1px solid #1e293b !important; min-height: 240px !important; flex: 1 0 240px !important; }
            .dark .rbc-row-content { min-height: 240px !important; }
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
                date={currentDate}
                currentDate={currentDate}
                onNavigate={handleToolbarNavigate}
                onView={(v) => setCurrentView(v)}
                view={currentView}
                shoots={filteredShoots}
              />
              <ShootListView
                shoots={filteredShoots}
                onView={openViewOffcanvas}
                onEdit={openModal}
                onDelete={handleDeleteShoot}
                onAddNew={() => openModal()}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
                canCreate={canCreate}
                canEditShoot={canEditShoot}
                canDeleteShoot={canDeleteShoot}
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
              selectable={canCreate}
              onSelectSlot={handleSelectSlot}
              style={{ height: "auto", minHeight: "1200px", border: "none" }}
              onSelectEvent={(event) => openViewOffcanvas(event.resource)}
              eventPropGetter={eventStyleGetter}
              components={calendarComponents}
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
                <div className="w-2 h-2 rounded-full bg-rose-500"></div> At Risk
                ({getCount("At Risk")})
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
              💡 Tip: Click any date slot to quickly schedule a shoot for that
              day
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
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div>{" "}
                    Core Details
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm cursor-pointer"
                      >
                        <option value="" className="dark:bg-[#131b2e]">
                          Select a client
                        </option>
                        {clients.map((client) => (
                          <option
                            key={client._id}
                            value={client._id}
                            className="dark:bg-[#131b2e]"
                          >
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                        placeholder="e.g. Diwali Special Video"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Shoot Type <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomShootType(!isCustomShootType);
                            if (
                              !isCustomShootType &&
                              (!formData.shootType ||
                                SHOOT_TYPES.includes(formData.shootType))
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                shootType: "",
                              }));
                            }
                          }}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {isCustomShootType
                            ? "← Choose from list"
                            : "+ Add Custom Type"}
                        </button>
                      </div>

                      {isCustomShootType ? (
                        <div className="relative">
                          <input
                            type="text"
                            name="shootType"
                            required
                            value={formData.shootType}
                            onChange={handleInputChange}
                            className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                            placeholder="Enter custom shoot type (e.g. Reels Shoot, Podcast, Drone)"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <select
                          name="shootType"
                          required
                          value={formData.shootType}
                          onChange={(e) => {
                            if (e.target.value === "__CUSTOM__") {
                              setIsCustomShootType(true);
                              setFormData((prev) => ({
                                ...prev,
                                shootType: "",
                              }));
                            } else {
                              handleInputChange(e);
                            }
                          }}
                          className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm cursor-pointer"
                        >
                          {allShootTypes.map((type) => (
                            <option
                              key={type}
                              value={type}
                              className="dark:bg-[#131b2e]"
                            >
                              {type}
                            </option>
                          ))}
                          <option
                            value="__CUSTOM__"
                            className="dark:bg-[#131b2e] font-bold text-emerald-600 dark:text-emerald-400"
                          >
                            + Custom Shoot Type...
                          </option>
                        </select>
                      )}
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
                          className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm cursor-pointer"
                        >
                          {SHOOT_STATUSES.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="dark:bg-[#131b2e]"
                            >
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
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div>{" "}
                    Schedule & Location
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        required
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                        placeholder="e.g. Studio A, ECR Road, Chennai"
                      />
                    </div>
                  </div>
                </div>

                {/* Team & Resources */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div>{" "}
                    Team & Resources
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm cursor-pointer"
                      >
                        <option value="" className="dark:bg-[#131b2e]">
                          Select Assignee
                        </option>
                        {users.map((user) => (
                          <option
                            key={user._id}
                            value={user._id}
                            className="dark:bg-[#131b2e]"
                          >
                            {user.name} {user.department ? `(${user.department})` : user.role ? `(${user.role})` : ""}
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm custom-scrollbar"
                        size="3"
                      >
                        {users.map((user) => (
                          <option
                            key={user._id}
                            value={user._id}
                            className="p-1.5 mb-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-[#131b2e]"
                          >
                            {user.name} {user.department ? `(${user.department})` : user.role ? `(${user.role})` : ""}
                          </option>
                        ))}
                      </select>
                      {formData.shootTeam?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {formData.shootTeam.map((userId) => {
                            const u = users.find(
                              (usr) =>
                                String(usr._id || usr.id) === String(userId),
                            );
                            return (
                              <span
                                key={userId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-2xs"
                              >
                                <span>{u ? u.name : "Member"}</span>
                                {u?.department && (
                                  <span className="text-[10px] font-normal opacity-80">
                                    ({u.department})
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      shootTeam: prev.shootTeam.filter(
                                        (id) => String(id) !== String(userId),
                                      ),
                                    }))
                                  }
                                  className="text-emerald-700/60 dark:text-emerald-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 cursor-pointer font-bold"
                                  title="Remove member"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                        placeholder="e.g. Agency Vehicle required"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Estimated Budget (₹)
                        </label>
                        {!isSuperOrAdmin && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            (Admin / Op. Manager Only)
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        name="estimatedBudget"
                        value={formData.estimatedBudget}
                        onChange={handleInputChange}
                        disabled={!isSuperOrAdmin}
                        className={`w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm ${
                          !isSuperOrAdmin
                            ? "opacity-60 cursor-not-allowed bg-slate-100/90 dark:bg-slate-800/80"
                            : ""
                        }`}
                        placeholder="8500"
                      />
                    </div>
                  </div>
                </div>

                {/* Scope & Details */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div>{" "}
                    Scope & Details
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                        placeholder="e.g. Instagram, Facebook"
                      />
                    </div>

                    {/* Weather / Environment with Live Weather integration */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Weather / Environment
                        </label>
                        <button
                          type="button"
                          onClick={() => fetchLiveWeather()}
                          disabled={isFetchingWeather}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/70 dark:border-amber-800/60 px-3 py-1 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
                          title="Fetch current live weather for your location"
                        >
                          <FiRefreshCw
                            size={12}
                            className={isFetchingWeather ? "animate-spin" : ""}
                          />
                          <span>
                            {isFetchingWeather
                              ? "Detecting Live Weather..."
                              : "Detect Live Weather"}
                          </span>
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          name="weather"
                          value={formData.weather}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
                          placeholder="e.g. ☀️ 32°C Clear Sky (Indoor AC / Outdoor Clear)"
                        />
                      </div>

                      {/* Quick Weather Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">
                          Quick Presets:
                        </span>
                        {[
                          {
                            label: "☀️ Sunny / Clear",
                            val: "☀️ Clear & Sunny (Outdoor)",
                          },
                          {
                            label: "⛅ Partly Cloudy",
                            val: "⛅ Partly Cloudy (Soft Light)",
                          },
                          {
                            label: "🌧️ Rainy / Drizzle",
                            val: "🌧️ Rainy / Overcast (Cover Needed)",
                          },
                          { label: "🏢 Studio AC", val: "🏢 Indoor AC Studio" },
                          {
                            label: "🌅 Golden Hour",
                            val: "🌅 Golden Hour Outdoor (5 PM - 6:30 PM)",
                          },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                weather: preset.val,
                              }))
                            }
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#151f33] dark:hover:bg-[#1e2a44] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Contact */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full"></div>{" "}
                    Client Contact
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
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
                        className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-2xs text-sm"
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
                      className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all shadow-2xs text-sm"
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
                      className="w-full border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 bg-slate-50/60 dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all shadow-2xs text-sm"
                      placeholder="e.g. Focus on new menu items. Capture close-ups for reels."
                    ></textarea>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] flex justify-between items-center shrink-0">
              {selectedShoot && canDeleteShoot(selectedShoot) ? (
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
                  className="px-6 py-2.5 theme-bg-accent text-white rounded-xl font-bold transition-all shadow-md hover:opacity-95 disabled:opacity-70 flex items-center gap-2 text-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
                  Client:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {viewShoot.client?.companyName || "Unknown"}
                  </span>
                </p>
              </div>

              {/* Schedule */}
              <div className="bg-slate-50 dark:bg-[#131b2e] rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <FiClock className="text-emerald-500 dark:text-emerald-400" />{" "}
                  Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
                      Date
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {viewShoot.schedule?.shootDate
                        ? new Date(
                            viewShoot.schedule.shootDate,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
                      Time
                    </p>
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
                    <span className="text-slate-500 dark:text-slate-400">
                      Assigned To (Lead)
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {viewShoot.assignedTo?.name || "Unassigned"}
                      {viewShoot.assignedTo?.department && (
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          ({viewShoot.assignedTo.department})
                        </span>
                      )}
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
                            className="px-2.5 py-1 bg-slate-100 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium inline-flex items-center gap-1"
                          >
                            <span>{member.name || member}</span>
                            {member.department && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                ({member.department})
                              </span>
                            )}
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
              {canEditShoot(viewShoot) ? (
                <button
                  onClick={() => {
                    const s = viewShoot;
                    closeViewOffcanvas();
                    openModal(s);
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <FiEdit2 size={16} /> Edit Shoot
                </button>
              ) : (
                <div className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-slate-800">
                  👁️ View-only mode (Read Permission)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShootCalendor;
