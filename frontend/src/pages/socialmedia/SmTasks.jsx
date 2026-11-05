import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGoogle,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
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
  FiChevronsLeft,
  FiChevronsRight,
  FiCalendar,
  FiX,
  FiPlay,
  FiImage,
  FiLayers,
  FiZap,
  FiVideo,
  FiMapPin,
  FiFileText,
  FiTarget,
  FiGrid,
  FiRotateCcw,
  FiCheck,
  FiChevronDown,
  FiDownload,
  FiBarChart2,
  FiClock,
  FiAlertCircle,
  FiMoreVertical,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ClientBadge from "../../components/common/ClientBadge";
import PendingCommitmentModal from "../../components/common/PendingCommitmentModal";
import { computeAllClientsCommitments } from "../../utils/smCommitmentUtils";
import {
  getSocialmediaTasks,
  getSocialmediaStats,
  updateSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";
import SmTaskFilters from "./SmTaskFilters";
import SmPlatformWarningModal from "./SmPlatformWarningModal";

const CATEGORIES = [
  "All",
  "Content Calendar",
  "Ad campaign check",
  "Google review reply",
  "Engagement monitor",
  "Platform qc",
  "Client app",
  "Influencer",
  "Client call",
  "Model arrangement",
  "Content kt",
  "Business development",
  "Competitor analysis",
  "Trend analysis",
  "Insight report",
];
const CONTENT_TYPES = [
  "All",
  "Post",
  "Reels",
  "Stories",
  "Others Task",
  "Reel",
  "Story",
  "Carousel",
  "GMB",
  "YouTube",
  "Blog",
  "Ad",
  "Other",
];
const COMMITMENT_STATUS_OPTIONS = [
  "Not started",
  "Inprogress",
  "QC",
  "Completed and wait CLient Approval",
  "Published Live",
];
const COMMITMENT_STATUSES = ["All", ...COMMITMENT_STATUS_OPTIONS];

const NON_COMMITMENT_STATUS_OPTIONS = [
  "Not started",
  "Inprogress",
  "Waiting for Response",
  "Completed",
];
const NON_COMMITMENT_STATUSES = ["All", ...NON_COMMITMENT_STATUS_OPTIONS];

const STATUSES = COMMITMENT_STATUSES;
const PRIORITIES = ["All", "High", "Medium", "Low"];
const COMMITMENTS = ["All", "Yes", "No"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

/**
 * Render Due Date badge based on task status & overdue days
 * If status is Live/Completed: green background with Live indicator
 * If status is NOT Live and due date is past/today: red background with overdue days count
 */
const renderDueDateBadge = (dueDate, status) => {
  if (!dueDate) return <span className="text-slate-400 font-medium">-</span>;

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return <span className="text-slate-400 font-medium">-</span>;

  const dateStr = formatDisplayDate(dueDate);

  // Status QC or Completed and wait client approval -> show "Waiting" below the date ("date kila")
  const s = (status || "").trim().toLowerCase();
  const isWaiting = s === "qc" || s === "in qc" || s.includes("client approval");
  if (isWaiting) {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
          {dateStr}
        </span>
        <span
          title={`Status: ${status} • Waiting`}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span>Waiting</span>
        </span>
      </div>
    );
  }

  const isLive = ["Live", "Completed", "Published", "Published Live"].includes(status);

  // Calculate day difference relative to start of today in local time
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.round((dueDayStart - todayStart) / (1000 * 60 * 60 * 24));

  // 1. Status Live / Completed: Green background badge
  if (isLive) {
    return (
      <span
        title={`Due: ${dateStr} • Status is ${status}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>{dateStr}</span>
        <span className="text-[9.5px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 pl-0.5">
          • {["Live", "Published", "Published Live"].includes(status) ? "Published Live" : "Done"}
        </span>
      </span>
    );
  }

  // 2. Not Live and Overdue (past due date): Red background badge with overdue days
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    const dayLabel = overdueDays === 1 ? "1d overdue" : `${overdueDays}d overdue`;
    return (
      <span
        title={`Due: ${dateStr} • Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
        <span>{dateStr}</span>
        <span className="text-[9.5px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400 pl-0.5">
          • {dayLabel}
        </span>
      </span>
    );
  }

  // 3. Not Live and Due Today: Red background badge
  if (diffDays === 0) {
    return (
      <span
        title={`Due today (${dateStr}) • Status is ${status || "Pending"}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
        <span>{dateStr}</span>
        <span className="text-[9.5px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400 pl-0.5">
          • Due today
        </span>
      </span>
    );
  }

  // 4. Future Due Date (not yet overdue)
  const dayLabel = diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays}d`;
  return (
    <span
      title={`Due in ${diffDays} days (${dateStr})`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 whitespace-nowrap"
    >
      <FiCalendar size={12} className="text-slate-400 shrink-0" />
      <span>{dateStr}</span>
      <span className="text-[10px] text-slate-400 font-medium pl-0.5">
        • {dayLabel}
      </span>
    </span>
  );
};

/**
 * Helper to check if a task is overdue (past due date and not Live/Completed, or status is Overdue)
 */
const isTaskOverdue = (task) => {
  if (!task) return false;
  const sSt = (task.status || "").trim().toLowerCase();
  if (["completed", "live", "published", "published live", "qc", "in qc"].includes(sSt) || sSt.includes("client approval")) return false;
  if (task.status === "Overdue") return true;

  const targetDate = task.dueDate || task.publishDate;
  if (!targetDate) return false;

  const due = new Date(targetDate);
  if (isNaN(due.getTime())) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

  return dueDayStart < todayStart;
};

// Helper to render platform icon
const getPlatformIcon = (platform) => {
  if (!platform) return null;
  const p = platform.trim().toLowerCase();
  if (p.includes("instagram")) return <FaInstagram className="text-[#E1306C] shrink-0" size={12} title="Instagram" />;
  if (p.includes("facebook")) return <FaFacebook className="text-[#1877F2] shrink-0" size={12} title="Facebook" />;
  if (p.includes("youtube")) return <FaYoutube className="text-[#FF0000] shrink-0" size={12} title="YouTube" />;
  if (p.includes("gmb") || p.includes("google")) return <FaGoogle className="text-[#4285F4] shrink-0" size={11} title="GMB" />;
  if (p.includes("twitter")) return <FaTwitter className="text-[#1DA1F2] shrink-0" size={12} title="Twitter / X" />;
  if (p.includes("linkedin")) return <FaLinkedin className="text-[#0A66C2] shrink-0" size={12} title="LinkedIn" />;
  return null;
};

// Rich Category Styling (Curated tag theme with colored dot for all categories)
const getCategoryStyle = (category) => {
  const cat = (category || "Content Calendar").trim().toLowerCase();
  switch (cat) {
    case "content calendar":
    case "content calendor":
    case "content":
    case "calendar":
      return {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-700 dark:text-indigo-300",
        border: "border-indigo-200/90 dark:border-indigo-800/60",
        dot: "bg-indigo-500",
      };
    case "ad campaign check":
    case "ads":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200/90 dark:border-rose-800/60",
        dot: "bg-rose-500",
      };
    case "google review reply":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/90 dark:border-emerald-800/60",
        dot: "bg-emerald-500",
      };
    case "engagement monitor":
    case "engagement":
      return {
        bg: "bg-pink-50 dark:bg-pink-950/40",
        text: "text-pink-700 dark:text-pink-300",
        border: "border-pink-200/90 dark:border-pink-800/60",
        dot: "bg-pink-500",
      };
    case "platform qc":
      return {
        bg: "bg-purple-50 dark:bg-purple-950/40",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200/90 dark:border-purple-800/60",
        dot: "bg-purple-500",
      };
    case "client app":
    case "client":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200/90 dark:border-amber-800/60",
        dot: "bg-amber-500",
      };
    case "influencer":
    case "inflener":
      return {
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        text: "text-cyan-700 dark:text-cyan-300",
        border: "border-cyan-200/90 dark:border-cyan-800/60",
        dot: "bg-cyan-500",
      };
    case "client call":
    case "clientcall":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200/90 dark:border-blue-800/60",
        dot: "bg-blue-500",
      };
    case "model arrangement":
    case "modal arrangement":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/40",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200/90 dark:border-orange-800/60",
        dot: "bg-orange-500",
      };
    case "content kt":
      return {
        bg: "bg-violet-50 dark:bg-violet-950/40",
        text: "text-violet-700 dark:text-violet-300",
        border: "border-violet-200/90 dark:border-violet-800/60",
        dot: "bg-violet-500",
      };
    case "business development":
    case "bussiness deve":
      return {
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-700 dark:text-teal-300",
        border: "border-teal-200/90 dark:border-teal-800/60",
        dot: "bg-teal-500",
      };
    case "competitor analysis":
      return {
        bg: "bg-red-50 dark:bg-red-950/40",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200/90 dark:border-red-800/60",
        dot: "bg-red-500",
      };
    case "trend analysis":
      return {
        bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
        text: "text-fuchsia-700 dark:text-fuchsia-300",
        border: "border-fuchsia-200/90 dark:border-fuchsia-800/60",
        dot: "bg-fuchsia-500",
      };
    case "insight report":
    case "reporting":
      return {
        bg: "bg-sky-50 dark:bg-sky-950/40",
        text: "text-sky-700 dark:text-sky-300",
        border: "border-sky-200/90 dark:border-sky-800/60",
        dot: "bg-sky-500",
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
      };
  }
};

// Rich Content Type Configuration (Pill badge with media format micro-icon)
const getContentTypeConfig = (contentType) => {
  const type = (contentType || "Post").trim().toLowerCase();
  switch (type) {
    case "reel":
    case "reels":
      return {
        bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
        text: "text-fuchsia-700 dark:text-fuchsia-300",
        border: "border-fuchsia-250 dark:border-fuchsia-800/60",
        icon: FiPlay,
        iconClass: "fill-fuchsia-600 dark:fill-fuchsia-400 text-fuchsia-600 dark:text-fuchsia-400",
      };
    case "story":
    case "stories":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800/60",
        icon: FiZap,
        iconClass: "text-amber-600 dark:text-amber-400 fill-amber-500/20",
      };
    case "others task":
    case "other":
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-700",
        icon: FiLayers,
        iconClass: "text-slate-500 dark:text-slate-400",
      };
      return {
        bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
        text: "text-fuchsia-700 dark:text-fuchsia-300",
        border: "border-fuchsia-250 dark:border-fuchsia-800/60",
        icon: FiPlay,
        iconClass: "fill-fuchsia-600 dark:fill-fuchsia-400 text-fuchsia-600 dark:text-fuchsia-400",
      };
    case "post":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800/60",
        icon: FiImage,
        iconClass: "text-blue-600 dark:text-blue-400",
      };
    case "carousel":
      return {
        bg: "bg-violet-50 dark:bg-violet-950/40",
        text: "text-violet-700 dark:text-violet-300",
        border: "border-violet-200 dark:border-violet-800/60",
        icon: FiLayers,
        iconClass: "text-violet-600 dark:text-violet-400",
      };
    case "story":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800/60",
        icon: FiZap,
        iconClass: "text-amber-600 dark:text-amber-400 fill-amber-500/20",
      };
    case "youtube":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200 dark:border-rose-800/60",
        icon: FiVideo,
        iconClass: "text-rose-600 dark:text-rose-400",
      };
    case "gmb":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-800/60",
        icon: FiMapPin,
        iconClass: "text-emerald-600 dark:text-emerald-400",
      };
    case "blog":
      return {
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        text: "text-cyan-700 dark:text-cyan-300",
        border: "border-cyan-200 dark:border-cyan-800/60",
        icon: FiFileText,
        iconClass: "text-cyan-600 dark:text-cyan-400",
      };
    case "ad":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/40",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800/60",
        icon: FiTarget,
        iconClass: "text-orange-600 dark:text-orange-400",
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-700",
        icon: FiGrid,
        iconClass: "text-slate-500",
      };
  }
};

// Helper to identify Social Media Executives
const isSocialMediaManager = (u) => {
  if (!u) return false;
  if (u.employmentStatus === "relieved") return false;
  const dept = (u.department || "").toLowerCase().trim();
  const role = (u.role || "").toLowerCase().trim();
  const desig = (u.designation || "").toLowerCase().trim();
  return (
    dept.includes("social media") ||
    dept.includes("smm") ||
    role.includes("social media") ||
    role.includes("smm") ||
    role === "socialmediamanager" ||
    role === "socialmediaexecutive" ||
    desig.includes("social media") ||
    desig.includes("smm")
  );
};

const getDisplayStatusForTask = (task, selectedCommitment) => {
  const isComm = Boolean(task?.commitment) || selectedCommitment === "Yes";
  const st = task?.status || "Not started";
  if (isComm) {
    if (st === "Live" || st === "Published" || st === "Published Live") return "Published Live";
    if (st === "In QC" || st === "QC") return "QC";
    if (st === "In progress" || st === "Inprogress") return "Inprogress";
    if ((st || "").toLowerCase().includes("client approval")) return "Completed and wait CLient Approval";
    return st;
  } else {
    if (st === "In progress" || st === "Inprogress") return "Inprogress";
    return st;
  }
};

const getTableStatusStyle = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("not started")) {
    return "bg-slate-100 text-slate-700 dark:bg-[#131d31] dark:text-slate-200 border-slate-200 dark:border-white/10";
  }
  if (s.includes("inprogress") || s.includes("in progress")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300";
  }
  if (s === "qc" || s.includes("in qc")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300";
  }
  if (s.includes("client approval") || s.includes("approval")) {
    return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 font-semibold";
  }
  if (s.includes("waiting for response") || s.includes("response")) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 font-semibold";
  }
  if (s.includes("published live") || s.includes("published") || s === "live") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 font-bold";
  }
  if (s.includes("completed")) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 font-bold";
  }
  if (s.includes("overdue")) {
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-[#131d31] dark:text-slate-200 border-slate-200 dark:border-white/10";
};

const SmTasks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "admin";
  const { theme, accentColor = "emerald" } = useTheme();
  const isLightAccent = ["neon-green", "lime"].includes(accentColor);

  const { tasks, totalCount, commitmentsCount, loading } = useSelector(
    (state) => state.socialmediaTasks
  );
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  // Role check: Admin, Operation Manager, and Social Media Manager can see all users' tasks and filter by Created By
  const userRoleClean = (user?.role || role || "").toLowerCase().replace(/[\s_]/g, "");
  const deptLower = (user?.department || "").toLowerCase();
  const isSocialMediaManagerRole =
    userRoleClean === "socialmediamanager" ||
    userRoleClean === "socialmediahead" ||
    deptLower.includes("social media head");

  const canFilterByCreatedBy =
    userRoleClean === "admin" ||
    userRoleClean === "operationmanager" ||
    isSocialMediaManagerRole;
  const isReadOnly = userRoleClean === "admin" || userRoleClean === "operationmanager";

  // Month & Commitments state (Image 1 style)
  const currentNow = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentNow.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentNow.getFullYear());
  const [isPendingCommitmentOpen, setIsPendingCommitmentOpen] = useState(false);

  // Lookup map for users by ID and lowercase name for fast profile matching
  const usersMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (u?._id) map.set(u._id.toString(), u);
      if (u?.name) map.set(u.name.trim().toLowerCase(), u);
    });
    return map;
  }, [users]);

  // Helper to resolve client object for ClientBadge
  const getClientObject = (task) => {
    if (task.client && typeof task.client === "object" && task.client.companyName) {
      return {
        ...task.client,
        color: task.client.color || task.clientColor || "#6366f1",
      };
    }
    const matched = clients.find(
      (c) =>
        (task.client && c._id === task.client) ||
        (task.clientName && c.companyName?.trim().toLowerCase() === task.clientName?.trim().toLowerCase())
    );
    if (matched) {
      return {
        ...matched,
        color: matched.color || task.clientColor || "#6366f1",
      };
    }
    return {
      companyName: task.clientName || "Client",
      color: task.clientColor || "#6366f1",
      icon: "FaRegBuilding",
    };
  };

  // Helper to resolve creator name, profile avatar, and fallback initials
  const getCreatorInfo = (task) => {
    const createdByObj = task.createdBy && typeof task.createdBy === "object" ? task.createdBy : null;
    const createdById = (task.createdBy && typeof task.createdBy === "string" ? task.createdBy : createdByObj?._id)?.toString();
    const createdByName = createdByObj?.name || task.createdByName || task.assigneeName || "";

    const matchedUser =
      (createdById && usersMap.get(createdById)) ||
      (createdByName && usersMap.get(createdByName.trim().toLowerCase())) ||
      createdByObj;

    const name = matchedUser?.name || createdByName || "Admin";

    const avatarUrl =
      matchedUser?.profile?.profileImage?.url ||
      (typeof matchedUser?.profile?.profileImage === "string" ? matchedUser.profile.profileImage : null) ||
      matchedUser?.profileImage?.url ||
      (typeof matchedUser?.profileImage === "string" ? matchedUser.profileImage : null) ||
      matchedUser?.profilePic ||
      matchedUser?.avatar?.url ||
      (typeof matchedUser?.avatar === "string" ? matchedUser.avatar : null) ||
      createdByObj?.profile?.profileImage?.url ||
      (typeof createdByObj?.profile?.profileImage === "string" ? createdByObj.profile.profileImage : null) ||
      createdByObj?.profileImage?.url ||
      null;

    const initials = (name || "U")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

    return {
      name,
      avatarUrl: avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null,
      initials,
    };
  };

  // Filter States
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("Content Calendar");
  const [selectedContentType, setSelectedContentType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCommitment, setSelectedCommitment] = useState("Yes");

  // Comprehensive Date Filter States
  const [dateFilterPreset, setDateFilterPreset] = useState("All"); // "All", "Today", "Tomorrow", "This Week", "This Month", "Overdue", "Custom"
  const [dateFilterField, setDateFieldType] = useState("any"); // "any" (Publish or Due), "publish", "due"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [platformWarningModal, setPlatformWarningModal] = useState({
    isOpen: false,
    task: null,
    targetStatus: "",
  });
  const [activePlatformMenuTaskId, setActivePlatformMenuTaskId] = useState(null);

  useEffect(() => {
    const handleOutside = () => setActivePlatformMenuTaskId(null);
    if (activePlatformMenuTaskId) {
      document.addEventListener("click", handleOutside);
    }
    return () => document.removeEventListener("click", handleOutside);
  }, [activePlatformMenuTaskId]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileViewMode, setMobileViewMode] = useState("cards");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Initial fetch of dynamic data
  useEffect(() => {
    dispatch(getSocialmediaTasks());
    dispatch(getSocialmediaStats());
    if (!clients || clients.length === 0) dispatch(getClients());
    if (!users || users.length === 0) dispatch(getUsers());
  }, [dispatch]);

  // Dynamic month options for top month dropdown selector
  const monthOptions = useMemo(() => {
    const map = new Map();
    for (let offset = -12; offset <= 6; offset++) {
      const d = new Date(currentNow.getFullYear(), currentNow.getMonth() + offset, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const key = `${y}-${m}`;
      map.set(key, { year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}` });
    }
    (tasks || []).forEach((t) => {
      const primary = (dateFilterField === "publish" && t.publishDate)
        ? t.publishDate
        : (t.dueDate || t.publishDate || t.createdAt);
      if (primary) {
        const d = new Date(primary);
        if (!isNaN(d.getTime())) {
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          const key = `${y}-${m}`;
          if (!map.has(key)) {
            map.set(key, { year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}` });
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [tasks]);

  // Sync monthly stats when month changes
  useEffect(() => {
    if (selectedMonth && selectedYear && selectedMonth !== "all" && selectedYear !== "all") {
      dispatch(getSocialmediaStats({ year: selectedYear, month: selectedMonth }));
    } else {
      dispatch(getSocialmediaStats());
    }
  }, [dispatch, selectedMonth, selectedYear]);

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

  // Dynamic unique creators list for Admin & Operation Manager filter - ONLY Social Media Executives
  const createdByOptions = useMemo(() => {
    const nameMap = new Map();

    // 1. All active Social Media Executives in users list
    (users || []).forEach((u) => {
      if (u.name && u.name.trim() && isSocialMediaManager(u)) {
        nameMap.set(u.name.trim().toLowerCase(), u.name.trim());
      }
    });

    // 2. Also check uniqueTasks: if creator is matched to an SMM user
    uniqueTasks.forEach((t) => {
      const cId = (t.createdBy?._id || t.createdBy)?.toString();
      const matched =
        (cId && usersMap.get(cId)) ||
        (t.createdBy?.name && usersMap.get(t.createdBy.name.trim().toLowerCase())) ||
        (t.createdByName && usersMap.get(t.createdByName.trim().toLowerCase()));

      if (matched && isSocialMediaManager(matched)) {
        nameMap.set(matched.name.trim().toLowerCase(), matched.name.trim());
      }
    });

    return ["All", ...Array.from(nameMap.values()).sort((a, b) => a.localeCompare(b))];
  }, [uniqueTasks, users, usersMap]);

  // Client-side filtering
  const filteredTasks = useMemo(() => {
    return uniqueTasks.filter((task) => {
      // Top Month Filter: Strictly filter table tasks by selected month & year
      if (selectedMonth && selectedYear && selectedMonth !== "all" && selectedYear !== "all") {
        if (dateFilterPreset === "All" && !customStartDate && !customEndDate) {
          const primaryDate =
            dateFilterField === "publish" && task.publishDate
              ? task.publishDate
              : (task.dueDate || task.publishDate || task.createdAt);

          if (!primaryDate) return false;
          const d = new Date(primaryDate);
          if (isNaN(d.getTime())) return false;
          if (d.getFullYear() !== selectedYear || (d.getMonth() + 1) !== selectedMonth) {
            return false;
          }
        }
      }
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

      // Created By Filter:
      // Regular users only see tasks created by themselves.
      // Admin and Operation Manager can see all users' tasks and optionally filter.
      if (!canFilterByCreatedBy) {
        const currentUserId = user?._id || user?.id;
        const currentUserNameLower = (user?.name || "").trim().toLowerCase();

        const taskCreatorId =
          typeof task.createdBy === "object"
            ? task.createdBy?._id?.toString()
            : task.createdBy?.toString();
        const taskCreatedByNameLower = (task.createdByName || "").trim().toLowerCase();

        const creator = getCreatorInfo(task);
        const resolvedCreatorNameLower = (creator?.name || "").trim().toLowerCase();

        const isMine =
          (currentUserId && taskCreatorId === currentUserId.toString()) ||
          (currentUserNameLower && taskCreatedByNameLower === currentUserNameLower) ||
          (currentUserNameLower && resolvedCreatorNameLower === currentUserNameLower);

        if (!isMine) return false;
      } else if (selectedCreatedBy !== "All") {
        const creator = getCreatorInfo(task);
        const creatorNameLower = (creator?.name || "").trim().toLowerCase();
        const targetLower = selectedCreatedBy.trim().toLowerCase();
        const taskCreatedByNameLower = (task.createdByName || "").trim().toLowerCase();
        const taskAssigneeLower = (task.assigneeName || "").trim().toLowerCase();

        const matchesCreator =
          creatorNameLower === targetLower ||
          taskCreatedByNameLower === targetLower ||
          taskAssigneeLower === targetLower;

        if (!matchesCreator) return false;
      }

      // Category
      if (selectedCategory !== "All") {
        const catLower = (task.category || "").trim().toLowerCase();
        const selCatLower = selectedCategory.trim().toLowerCase();
        if (selCatLower === "content calendar" || selCatLower === "content calendor") {
          const isCal =
            catLower === "content calendar" ||
            catLower === "content calendor" ||
            catLower === "content" ||
            Boolean(task.commitment);
          if (!isCal) return false;
        } else if (catLower !== selCatLower) {
          return false;
        }
      }

      // Content Type
      if (selectedContentType !== "All") {
        const ctLower = (task.contentType || "").trim().toLowerCase();
        const selCtLower = selectedContentType.trim().toLowerCase();
        if (selCtLower === "reels" || selCtLower === "reel") {
          if (ctLower !== "reels" && ctLower !== "reel") return false;
        } else if (selCtLower === "stories" || selCtLower === "story") {
          if (ctLower !== "stories" && ctLower !== "story") return false;
        } else if (selCtLower === "post") {
          if (ctLower !== "post") return false;
        } else if (selCtLower === "others task" || selCtLower === "other" || selCtLower === "others") {
          if (ctLower && ctLower !== "others task" && ctLower !== "other" && ctLower !== "others") {
            return false;
          }
        } else if (ctLower !== selCtLower) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== "All") {
        const normSelected = selectedStatus.toLowerCase().trim();
        const normTaskStatus = (task.status || "Not started").toLowerCase().trim();

        let match = false;
        if (normSelected === "published live") {
          match = ["published live", "published", "live"].includes(normTaskStatus);
        } else if (normSelected === "qc" || normSelected === "in qc") {
          match = ["qc", "in qc"].includes(normTaskStatus) || normTaskStatus.includes("client approval");
        } else if (normSelected === "inprogress") {
          match = ["inprogress", "in progress"].includes(normTaskStatus);
        } else if (normSelected.includes("client approval")) {
          match = normTaskStatus.includes("client approval");
        } else if (normSelected === "waiting for response") {
          match = ["waiting for response", "waiting for responce"].includes(normTaskStatus);
        } else if (normSelected === "completed") {
          match = normTaskStatus === "completed";
        } else {
          match = normTaskStatus === normSelected;
        }

        if (!match) return false;
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
        if (["Completed", "Live", "Published", "Published Live", "Completed and wait CLient Approval", "Completed and wait Client Approval"].includes(task.status)) return false;
        const targetDate = task.publishDate || task.dueDate;
        if (!targetDate) return false;
        const diffHours = (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours > 24) return false;
      }

      // Comprehensive Date filter
      if (dateFilterPreset !== "All" || customStartDate || customEndDate) {
        const getDatesToTest = (t) => {
          if (dateFilterField === "publish") return [t.publishDate].filter(Boolean);
          if (dateFilterField === "due") return [t.dueDate].filter(Boolean);
          return [t.publishDate, t.dueDate].filter(Boolean);
        };

        const targetDates = getDatesToTest(task);
        if (targetDates.length === 0) return false;

        const getLocalDate = (d) => {
          if (!d) return "";
          const date = new Date(d);
          if (isNaN(date.getTime())) return "";
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        const now = new Date();
        const todayStr = getLocalDate(now);

        if (dateFilterPreset === "Today") {
          const matches = targetDates.some((d) => getLocalDate(d) === todayStr);
          if (!matches) return false;
        } else if (dateFilterPreset === "Tomorrow") {
          const tom = new Date(now);
          tom.setDate(tom.getDate() + 1);
          const tomStr = getLocalDate(tom);
          const matches = targetDates.some((d) => getLocalDate(d) === tomStr);
          if (!matches) return false;
        } else if (dateFilterPreset === "This Week") {
          const dayOfWeek = now.getDay();
          const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const mon = new Date(now);
          mon.setDate(now.getDate() + diffToMon);
          mon.setHours(0, 0, 0, 0);

          const sun = new Date(mon);
          sun.setDate(mon.getDate() + 6);
          sun.setHours(23, 59, 59, 999);

          const matches = targetDates.some((d) => {
            const time = new Date(d).getTime();
            return time >= mon.getTime() && time <= sun.getTime();
          });
          if (!matches) return false;
        } else if (dateFilterPreset === "This Month") {
          const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

          const matches = targetDates.some((d) => {
            const time = new Date(d).getTime();
            return time >= startMonth.getTime() && time <= endMonth.getTime();
          });
          if (!matches) return false;
        } else if (dateFilterPreset === "Overdue") {
          if (["Completed", "Live", "Published"].includes(task.status)) return false;
          const hasOverdue = targetDates.some((d) => new Date(d).getTime() < now.getTime());
          if (!hasOverdue) return false;
        } else if (dateFilterPreset === "Custom" || customStartDate || customEndDate) {
          const matches = targetDates.some((d) => {
            const dateStr = getLocalDate(d);
            if (customStartDate && customEndDate) {
              return dateStr >= customStartDate && dateStr <= customEndDate;
            }
            if (customStartDate) {
              return dateStr === customStartDate;
            }
            if (customEndDate) {
              return dateStr <= customEndDate;
            }
            return true;
          });
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [
    uniqueTasks,
    searchQuery,
    selectedClient,
    selectedCreatedBy,
    canFilterByCreatedBy,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedPriority,
    selectedCommitment,
    atRiskOnly,
    dateFilterPreset,
    dateFilterField,
    customStartDate,
    customEndDate,
    usersMap,
    selectedMonth,
    selectedYear,
  ]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));

  // Dynamic Page numbers with ellipsis for pagination
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Filtered clients matching current selection (client, category, creator)
  const relevantClients = useMemo(() => {
    let list = clients || [];

    if (selectedClient !== "All") {
      const match = list.filter(
        (c) => c.companyName?.trim().toLowerCase() === selectedClient.trim().toLowerCase()
      );
      if (match.length > 0) return match;

      // Fallback: build from task info if client not in clients array
      const foundTask = uniqueTasks.find(
        (t) => (t.clientName || "").trim().toLowerCase() === selectedClient.trim().toLowerCase()
      );
      return [
        {
          _id: foundTask?.client?._id || foundTask?.client || selectedClient,
          companyName: selectedClient,
          color: foundTask?.clientColor || "#6366f1",
          industry: foundTask?.category || "General",
          posts: 0,
          reels: 0,
          story: 0,
        },
      ];
    }

    if (selectedCategory !== "All") {
      const catLower = selectedCategory.trim().toLowerCase();
      const clientsWithCategory = new Set(
        uniqueTasks
          .filter((t) => (t.category || "").trim().toLowerCase() === catLower && t.clientName)
          .map((t) => t.clientName.trim().toLowerCase())
      );
      const filtered = list.filter(
        (c) =>
          (c.industry && c.industry.trim().toLowerCase() === catLower) ||
          clientsWithCategory.has((c.companyName || "").trim().toLowerCase())
      );
      if (filtered.length > 0) list = filtered;
    }

    if (!canFilterByCreatedBy) {
      const myClientNames = new Set(
        filteredTasks.map((t) => (t.clientName || "").trim().toLowerCase()).filter(Boolean)
      );
      if (myClientNames.size > 0) {
        list = list.filter((c) => myClientNames.has((c.companyName || "").trim().toLowerCase()));
      }
    } else if (selectedCreatedBy !== "All") {
      const creatorClientNames = new Set(
        filteredTasks.map((t) => (t.clientName || "").trim().toLowerCase()).filter(Boolean)
      );
      if (creatorClientNames.size > 0) {
        list = list.filter((c) => creatorClientNames.has((c.companyName || "").trim().toLowerCase()));
      }
    }

    return list;
  }, [
    clients,
    uniqueTasks,
    filteredTasks,
    selectedClient,
    selectedCategory,
    selectedCreatedBy,
    canFilterByCreatedBy,
  ]);

  // Dynamically compute commitment overview based on current active filters
  const isRestrictedToClients = selectedClient !== "All";
  const commitmentOverview = useMemo(() => {
    return computeAllClientsCommitments(
      relevantClients,
      filteredTasks,
      selectedMonth,
      selectedYear,
      isRestrictedToClients
    );
  }, [relevantClients, filteredTasks, selectedMonth, selectedYear, isRestrictedToClients]);

  const currentCommitmentsCount = useMemo(() => {
    return filteredTasks.filter((t) => t.commitment).length;
  }, [filteredTasks]);

  const totalCommitmentsCount = useMemo(() => {
    return uniqueTasks.filter((t) => Boolean(t.commitment)).length;
  }, [uniqueTasks]);

  const totalNonCommitmentsCount = useMemo(() => {
    return uniqueTasks.filter((t) => !t.commitment).length;
  }, [uniqueTasks]);



  const hasActiveFilters = useMemo(() => {
    const isCategoryFiltered =
      selectedCommitment === "Yes"
        ? false
        : selectedCategory !== "All";

    const isContentTypeFiltered =
      selectedCommitment === "No"
        ? false
        : selectedContentType !== "All";

    return (
      selectedClient !== "All" ||
      selectedCreatedBy !== "All" ||
      isCategoryFiltered ||
      isContentTypeFiltered ||
      selectedStatus !== "All" ||
      selectedPriority !== "All" ||
      dateFilterPreset !== "All" ||
      Boolean(customStartDate) ||
      Boolean(customEndDate) ||
      atRiskOnly ||
      searchQuery.trim().length > 0
    );
  }, [
    selectedClient,
    selectedCreatedBy,
    selectedCommitment,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedPriority,
    dateFilterPreset,
    customStartDate,
    customEndDate,
    atRiskOnly,
    searchQuery,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedClient !== "All") count++;
    if (canFilterByCreatedBy && selectedCreatedBy !== "All") count++;
    if (selectedCategory !== "All") count++;
    if (selectedContentType !== "All") count++;
    if (selectedStatus !== "All") count++;
    if (selectedPriority !== "All") count++;
    if (selectedCommitment !== "All") count++;
    if (dateFilterPreset !== "All" || customStartDate || customEndDate) count++;
    if (atRiskOnly) count++;
    return count;
  }, [
    selectedClient,
    selectedCreatedBy,
    canFilterByCreatedBy,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedPriority,
    selectedCommitment,
    dateFilterPreset,
    customStartDate,
    customEndDate,
    atRiskOnly,
  ]);

  const handleResetFilters = () => {
    setSelectedClient("All");
    setSelectedCreatedBy("All");
    if (selectedCommitment === "Yes") {
      setSelectedCategory("Content Calendar");
      setSelectedContentType("All");
    } else {
      setSelectedCategory("All");
      setSelectedContentType("Others Task");
    }
    setSelectedStatus("All");
    setSelectedPriority("All");
    setSelectedCommitment(selectedCommitment);
    setDateFilterPreset("All");
    setDateFilterField("any");
    setCustomStartDate("");
    setCustomEndDate("");
    setAtRiskOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    if (!filteredTasks || filteredTasks.length === 0) {
      toast.error("No tasks to export");
      return;
    }

    const headers = [
      "Task Code",
      "Task Title",
      "Client",
      "Category",
      "Content Type",
      "Status",
      "Priority",
      "QC Status",
      "Commitment",
      "On Calendar",
      "Publish Date",
      "Due Date",
      "Created By",
      "Assignee",
      "Notes",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredTasks.map((task) => {
      const clientName =
        task.clientName ||
        (typeof task.client === "object" ? task.client?.companyName : "") ||
        "General";
      const creator = getCreatorInfo(task)?.name || "Admin";
      const assignee =
        task.assigneeName ||
        (typeof task.assignee === "object" ? task.assignee?.name : "") ||
        "Unassigned";

      let pubStr = "-";
      if (task.publishDate) {
        try {
          const d = new Date(task.publishDate);
          pubStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
          ).padStart(2, "0")}`;
        } catch {
          pubStr = String(task.publishDate);
        }
      }

      let dueStr = "-";
      if (task.dueDate) {
        try {
          const d = new Date(task.dueDate);
          dueStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
        } catch {
          dueStr = String(task.dueDate);
        }
      }

      return [
        escapeCsv(task.taskCode || ""),
        escapeCsv(task.taskTitle || ""),
        escapeCsv(clientName),
        escapeCsv(task.category || "Content"),
        escapeCsv(task.contentType || "Post"),
        escapeCsv(task.status || "Not started"),
        escapeCsv(task.priority || "Medium"),
        escapeCsv(task.qc || "-"),
        escapeCsv(task.commitment ? "Yes" : "No"),
        escapeCsv(task.onCalendar ? "Yes" : "No"),
        escapeCsv(pubStr),
        escapeCsv(dueStr),
        escapeCsv(creator),
        escapeCsv(assignee),
        escapeCsv(task.notes || ""),
      ].join(",");
    });

    const csvContent =
      "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const todayStr = new Date().toISOString().split("T")[0];
    const fileName = `Content_Calendar_Tasks_${todayStr}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredTasks.length} tasks to Excel!`);
  };

  const handleOpenCalendar = () => {
    navigate(`/${role}/content-calendar`);
  };

  const handleEditTask = (task) => {
    setSelectedTaskForEdit(task);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    if (isReadOnly) return;
    setSelectedTaskForEdit(null);
    setIsModalOpen(true);
  };

  const ALL_PLATFORMS_LIST = [
    { id: "Instagram", name: "Instagram", icon: FaInstagram, color: "#E1306C" },
    { id: "Facebook", name: "Facebook", icon: FaFacebook, color: "#1877F2" },
    { id: "YouTube", name: "YouTube", icon: FaYoutube, color: "#FF0000" },
    { id: "GMB", name: "GMB", icon: FaGoogle, color: "#4285F4" },
    { id: "Twitter", name: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
    { id: "LinkedIn", name: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
  ];

  const handleTogglePlatformSubtask = async (task, platformId, e) => {
    if (e) e.stopPropagation();
    if (!task || !task._id || isReadOnly) return;

    const currentCompleted = Array.isArray(task.completedPlatforms) ? task.completedPlatforms : [];
    const isCompleted = currentCompleted.some((p) => p.toLowerCase() === platformId.toLowerCase());

    const newCompleted = isCompleted
      ? currentCompleted.filter((p) => p.toLowerCase() !== platformId.toLowerCase())
      : [...currentCompleted, platformId];

    const currentPlatforms = Array.isArray(task.platforms) && task.platforms.length > 0
      ? task.platforms
      : (task.platform ? [task.platform] : []);
    
    const newPlatforms = currentPlatforms.some((p) => p.toLowerCase() === platformId.toLowerCase())
      ? currentPlatforms
      : [...currentPlatforms, platformId];

    try {
      await dispatch(
        updateSocialmediaTask({
          id: task._id,
          data: {
            completedPlatforms: newCompleted,
            platforms: newPlatforms,
          },
        })
      ).unwrap();

      if (!isCompleted) {
        toast.success(`✓ ${platformId} marked as completed`);
      } else {
        toast(`Unchecked ${platformId}`, { icon: "↩️" });
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update platform status");
    }
  };

  const handleTogglePlatformAssignment = async (task, platformId) => {
    if (!task || !task._id || isReadOnly) return;

    const currentPlatforms = Array.isArray(task.platforms) && task.platforms.length > 0
      ? task.platforms
      : (task.platform ? [task.platform] : ["Instagram"]);

    const exists = currentPlatforms.some((p) => p.toLowerCase() === platformId.toLowerCase());
    let updatedPlatforms;
    let updatedCompleted = Array.isArray(task.completedPlatforms) ? [...task.completedPlatforms] : [];

    if (exists) {
      updatedPlatforms = currentPlatforms.filter((p) => p.toLowerCase() !== platformId.toLowerCase());
      updatedCompleted = updatedCompleted.filter((p) => p.toLowerCase() !== platformId.toLowerCase());
    } else {
      updatedPlatforms = [...currentPlatforms, platformId];
    }

    try {
      await dispatch(
        updateSocialmediaTask({
          id: task._id,
          data: {
            platforms: updatedPlatforms,
            completedPlatforms: updatedCompleted,
            platform: updatedPlatforms[0] || "",
          },
        })
      ).unwrap();
      toast.success(exists ? `Removed ${platformId}` : `Added ${platformId} sub-task`);
    } catch (err) {
      toast.error(err?.message || "Failed to update platform assignment");
    }
  };

  const renderPlatformSubtasks = (task) => {
    const isCal =
      (task.category || "").trim().toLowerCase() === "content calendar" ||
      (task.category || "").trim().toLowerCase() === "content calendor" ||
      (task.category || "").trim().toLowerCase() === "content" ||
      Boolean(task.commitment);

    if (!isCal) {
      return (
        <span className="text-[11px] text-slate-400 font-medium italic">
          -
        </span>
      );
    }

    const assignedPlatforms = Array.isArray(task.platforms) && task.platforms.length > 0
      ? task.platforms
      : (task.platform ? [task.platform] : ["Instagram"]);

    const targetPlatforms = assignedPlatforms;
    const completedPlatforms = Array.isArray(task.completedPlatforms) ? task.completedPlatforms : [];
    const completedCount = targetPlatforms.filter((p) =>
      completedPlatforms.some((cp) => cp.toLowerCase() === p.toLowerCase())
    ).length;
    const totalCount = targetPlatforms.length;
    const allDone = totalCount > 0 && completedCount === totalCount;
    const isMenuOpen = activePlatformMenuTaskId === task._id;

    return (
      <div className="flex flex-col gap-1.5 py-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {/* Subtask Progress Bar & Badge */}
        <div className="flex items-center justify-between gap-1.5 text-[10px]">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Platforms
          </span>
          <span
            className={`px-1.5 py-0.2 rounded-md font-extrabold text-[9px] ${
              allDone
                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                : completedCount > 0
                  ? "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {completedCount}/{totalCount} {allDone ? "✓ All Done" : "Posted"}
          </span>
        </div>

        {/* Interactive Checkbox Chips (Tick & Icon Only - Better UI/UX) */}
        <div className="grid grid-cols-3 gap-1.5 w-fit">
          {targetPlatforms.map((platId) => {
            const platObj = ALL_PLATFORMS_LIST.find((p) => p.id.toLowerCase() === platId.toLowerCase()) || {
              id: platId,
              name: platId,
              icon: FiLayers,
              color: "#6366f1",
            };
            const IconComp = platObj.icon;
            const isCompleted = completedPlatforms.some((cp) => cp.toLowerCase() === platId.toLowerCase());

            return (
              <button
                key={platId}
                type="button"
                disabled={isReadOnly}
                onClick={(e) => handleTogglePlatformSubtask(task, platObj.id, e)}
                title={
                  isCompleted
                    ? `✓ ${platObj.name} (Posted - Click to uncheck)`
                    : `○ ${platObj.name} (Pending - Click to mark posted)`
                }
                className={`group/plat relative inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-150 cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300/90 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs hover:bg-emerald-100 hover:scale-105"
                    : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-105 shadow-2xs"
                } active:scale-95 disabled:cursor-not-allowed`}
              >
                {/* Tick Checkbox Indicator */}
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] transition-colors shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-600 text-white shadow-2xs"
                      : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 group-hover/plat:border-emerald-400 text-transparent"
                  }`}
                >
                  <FiCheck className="stroke-[3]" size={10} />
                </span>

                {/* Platform Icon */}
                <IconComp
                  size={13}
                  className={`shrink-0 transition-opacity ${
                    isCompleted ? "opacity-100" : "opacity-75 group-hover/plat:opacity-100"
                  }`}
                  style={{ color: platObj.color }}
                />
              </button>
            );
          })}

          {/* Quick Add Platform Subtask Button */}
          {!isReadOnly && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePlatformMenuTaskId(isMenuOpen ? null : task._id);
                }}
                className="w-full h-full min-h-[25px] min-w-[36px] rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 flex items-center justify-center text-[11px] transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Add or remove platforms from this task"
              >
                <FiPlus size={12} className="stroke-[2.5]" />
              </button>

              {/* Popover */}
              {isMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-48 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1.5 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>Manage Platforms</span>
                    <button
                      type="button"
                      onClick={() => setActivePlatformMenuTaskId(null)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <FiX size={11} />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto py-0.5 space-y-0.5 text-xs">
                    {ALL_PLATFORMS_LIST.map((plat) => {
                      const IconComp = plat.icon;
                      const isAssigned = targetPlatforms.some((p) => p.toLowerCase() === plat.id.toLowerCase());
                      const isCompleted = completedPlatforms.some((p) => p.toLowerCase() === plat.id.toLowerCase());

                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => handleTogglePlatformAssignment(task, plat.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs font-semibold ${
                            isAssigned
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <IconComp size={12} style={{ color: plat.color }} />
                            <span>{plat.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${isAssigned ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                            {isAssigned ? (isCompleted ? "✓ Done" : "Target") : "+ Add"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleQuickStatusChange = (task, newStatus) => {
    if (isReadOnly || !task || !task._id) return;

    const isComm =
      Boolean(task.commitment) ||
      selectedCommitment === "Yes" ||
      (task.category || "").trim().toLowerCase() === "content calendar" ||
      (task.category || "").trim().toLowerCase() === "content calendor" ||
      (task.category || "").trim().toLowerCase() === "content";

    // Verification required for: QC, Completed and wait CLient Approval, Published Live
    const s = (newStatus || "").trim().toLowerCase();
    const isVerificationStatus =
      s === "qc" ||
      s === "in qc" ||
      s.includes("client approval") ||
      s === "published live" ||
      s === "live" ||
      s === "published";

    if (isComm && isVerificationStatus) {
      const assignedPlatforms =
        Array.isArray(task.platforms) && task.platforms.length > 0
          ? task.platforms
          : task.platform
          ? [task.platform]
          : [];

      const completedPlatforms = Array.isArray(task.completedPlatforms)
        ? task.completedPlatforms
        : [];
      const untickedPlatforms = assignedPlatforms.filter(
        (p) => !completedPlatforms.some((cp) => cp.toLowerCase() === p.toLowerCase())
      );

      if (untickedPlatforms.length > 0) {
        setPlatformWarningModal({
          isOpen: true,
          task,
          targetStatus: newStatus,
        });
        return;
      }
    }

    dispatch(updateSocialmediaTask({ id: task._id, data: { status: newStatus } }));
    toast.success(`Status updated to "${newStatus}"`);
  };

  const handleConfirmPlatformWarning = async ({ task, targetStatus, completedPlatforms }) => {
    try {
      await dispatch(
        updateSocialmediaTask({
          id: task._id,
          data: {
            status: targetStatus,
            completedPlatforms,
          },
        })
      ).unwrap();
      toast.success(`✓ Status updated to "${targetStatus}"`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setPlatformWarningModal({ isOpen: false, task: null, targetStatus: "" });
    }
  };

  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    if (window.confirm(`Are you sure you want to delete "${task.taskTitle}"?`)) {
      dispatch(deleteSocialmediaTask(task._id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-3 sm:p-5 space-y-3.5 sm:space-y-6">
      {/* Top Header - Matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            Social Media Tasks
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Social Media Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Plan, track and deliver all your social media content in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Month Selector Dropdown */}
          <div className="relative inline-flex items-center">
            <FiCalendar
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
            />
            <select
              value={selectedMonth === "all" ? "all" : `${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                if (e.target.value === "all") {
                  setSelectedYear("all");
                  setSelectedMonth("all");
                } else {
                  const [y, m] = e.target.value.split("-").map(Number);
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "2.15rem" }}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-8 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Months</option>
              {monthOptions.map((opt) => (
                <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FiChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
            />
          </div>

          {isReadOnly ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs shadow-2xs">
              <FiLock size={13} />
              <span>Read Only</span>
            </div>
          ) : (
            <button
              onClick={handleCreateNew}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <FiPlus size={15} className="stroke-[2.5]" />
              <span>Create task</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Banner (Image 1 style) */}
      <div className="hidden sm:flex bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-800/50 rounded-2xl p-4 flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-white flex items-center justify-center shrink-0">
            <FiRepeat size={16} />
          </div>
          <p className="text-xs text-emerald-900 dark:text-white font-medium">
            <span className="font-bold">Every row here is also a calendar card.</span> Give a task a publish date and
            it drops onto the content calendar in that slot — no second entry, no "add to calendar" step.
          </p>
        </div>

        <button
          onClick={handleOpenCalendar}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors shrink-0 whitespace-nowrap self-end md:self-auto cursor-pointer"
        >
          <span>Open calendar</span>
          <FiArrowRight size={14} />
        </button>
      </div>

      {/* Premium Segmented Tab Navigation: Commitment vs SME tasks  */}
      <div className="bg-white/95 dark:bg-[#0c1220] backdrop-blur-md rounded-2xl p-2.5 shadow-sm border border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
        {/* Sleek Segmented Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex items-center p-1.5 bg-slate-100/90 dark:bg-[#131d31] rounded-2xl border border-slate-200/70 dark:border-white/10 gap-1.5 shadow-inner relative">
          {/* Tab 1: Commitment */}
          <button
            type="button"
            onClick={() => {
              setSelectedCommitment("Yes");
              setSelectedCategory("Content Calendar");
              setSelectedContentType("All");
              setCurrentPage(1);
            }}
            className={`group relative inline-flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200 cursor-pointer ${
              selectedCommitment === "Yes"
                ? (isLightAccent ? "text-slate-950 font-black" : "text-white")
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {selectedCommitment === "Yes" && (
              <motion.div
                layoutId="activeSmTaskTab"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "var(--color-brand-gradient, var(--accent-gradient))",
                  boxShadow: "0 4px 16px var(--btn-glow-shadow, rgba(0,0,0,0.25))",
                }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <div
                className={`p-1 rounded-lg transition-colors ${
                  selectedCommitment === "Yes"
                    ? "bg-white/20 text-current"
                    : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300/80 dark:group-hover:bg-white/20"
                }`}
              >
                <FiLock size={13} className="stroke-[2.5]" />
              </div>
              <span>Commitment</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black transition-all ${
                  selectedCommitment === "Yes"
                    ? (isLightAccent ? "bg-black/15 text-slate-950" : "bg-white/25 text-white backdrop-blur-xs")
                    : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10"
                }`}
              >
                {totalCommitmentsCount}
              </span>
            </div>
          </button>

          {/* Tab 2: SME tasks  */}
          <button
            type="button"
            onClick={() => {
              setSelectedCommitment("No");
              setSelectedCategory("All");
              setSelectedContentType("Others Task");
              setCurrentPage(1);
            }}
            className={`group relative inline-flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200 cursor-pointer ${
              selectedCommitment === "No"
                ? (isLightAccent ? "text-slate-950 font-black" : "text-white")
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {selectedCommitment === "No" && (
              <motion.div
                layoutId="activeSmTaskTab"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "var(--color-brand-gradient, var(--accent-gradient))",
                  boxShadow: "0 4px 16px var(--btn-glow-shadow, rgba(0,0,0,0.25))",
                }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <div
                className={`p-1 rounded-lg transition-colors ${
                  selectedCommitment === "No"
                    ? "bg-white/20 text-current"
                    : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300/80 dark:group-hover:bg-white/20"
                }`}
              >
                <FiLayers size={13} className="stroke-[2.5]" />
              </div>
              <span>SME tasks </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black transition-all ${
                  selectedCommitment === "No"
                    ? (isLightAccent ? "bg-black/15 text-slate-950" : "bg-white/25 text-white backdrop-blur-xs")
                    : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10"
                }`}
              >
                {totalNonCommitmentsCount}
              </span>
            </div>
          </button>
        </div>

        {/* Live Filter Indicator Pill */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131d31] border border-slate-200/80 dark:border-white/10">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--accent-color, #10b981)" }}
          />
          <span className="text-slate-700 dark:text-slate-200">
            {selectedCommitment === "Yes" ? (
              <>
                Showing <strong style={{ color: "var(--accent-color, #10b981)" }} className="font-bold">{filteredTasks.length}</strong> Content Calendar Commitments
              </>
            ) : (
              <>
                Showing <strong style={{ color: "var(--accent-color, #3b82f6)" }} className="font-bold">{filteredTasks.length}</strong> Non-commitment &amp; Ad-hoc Tasks
              </>
            )}
          </span>
        </div>
      </div>

      {/* Reference Matching Filter UI Container */}
      <SmTaskFilters
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={CATEGORIES}
        setSearchQuery={setSearchQuery}
        onExportExcel={handleExportExcel}
        atRiskOnly={atRiskOnly}
        setAtRiskOnly={setAtRiskOnly}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientOptions={clientOptions}
        canFilterByCreatedBy={canFilterByCreatedBy}
        selectedCreatedBy={selectedCreatedBy}
        setSelectedCreatedBy={setSelectedCreatedBy}
        createdByOptions={createdByOptions}
        user={user}
        selectedContentType={selectedContentType}
        setSelectedContentType={setSelectedContentType}
        contentTypes={
          selectedCommitment === "Yes"
            ? ["All", "Post", "Reels", "Stories"]
            : ["All", "Others Task"]
        }
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statuses={selectedCommitment === "Yes" ? COMMITMENT_STATUSES : NON_COMMITMENT_STATUSES}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        priorities={PRIORITIES}
        selectedCommitment={selectedCommitment}
        setSelectedCommitment={setSelectedCommitment}
        commitments={COMMITMENTS}
        dateFilterPreset={dateFilterPreset}
        setDateFilterPreset={setDateFilterPreset}
        dateFilterField={dateFilterField}
        setDateFieldType={setDateFieldType}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        filteredCount={filteredTasks.length}
        totalCount={uniqueTasks.length}
        currentCommitmentsCount={currentCommitmentsCount}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        setCurrentPage={setCurrentPage}
      />

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#0c1220] rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#131d31] text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <th className="py-3 px-3 text-center whitespace-nowrap w-12 font-bold text-slate-500 dark:text-slate-400">Sl.No</th>
                  <th className="py-3 px-4 min-w-[200px]">Task</th>
                  <th className="py-3 px-4 whitespace-nowrap">Client</th>
                  <th className="py-3 px-3 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3 whitespace-nowrap">Content Type</th>
                  {selectedCommitment !== "No" && (
                    <th className="py-3 px-3.5 font-bold whitespace-nowrap">Platforms</th>
                  )}
                  <th className="py-3 px-4 whitespace-nowrap">Created by</th>
                  <th className="py-3 px-3 whitespace-nowrap">Due Date</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 whitespace-nowrap">Priority</th>
                  {selectedCommitment !== "No" && (
                    <>
                      <th className="py-3 px-3 whitespace-nowrap">QC</th>
                      <th className="py-3 px-4 bg-slate-100/60 dark:bg-[#182338] text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap">Publish Date</th>
                      <th className="py-3 px-3 bg-slate-100/60 dark:bg-[#182338] text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap">Commitment</th>
                      <th className="py-3 px-3 bg-slate-100/60 dark:bg-[#182338] text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap">Calendar</th>
                    </>
                  )}
                  <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {loading && tasks.length === 0 ? (
                  <tr>
                    <td colSpan={selectedCommitment === "No" ? 10 : 15} className="py-12 text-center text-slate-400 italic">
                      Loading social media tasks...
                    </td>
                  </tr>
                ) : paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={selectedCommitment === "No" ? 10 : 15} className="py-12 text-center">
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
                  paginatedTasks.map((task, index) => {
                    const clientColor = task.clientColor || "#6366f1";
                    const isOverdue = isTaskOverdue(task);

                    return (
                      <tr
                        key={task._id}
                        className={`transition-colors group cursor-pointer ${isOverdue
                            ? "overdue-row-blink border-l-4 border-l-rose-500 hover:border-l-rose-600"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          }`}
                        onClick={() => handleEditTask(task)}
                      >
                        {/* SL.NO */}
                        <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        {/* TASK NAME with Left Accent Line */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-1 h-5 rounded-full shrink-0"
                              style={{ backgroundColor: clientColor }}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white leading-snug block">
                                {task.taskTitle}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CLIENT */}
                        <td className="py-3 px-4">
                          {(() => {
                            const clientObj = getClientObject(task);
                            return (
                              <ClientBadge
                                client={clientObj}
                                size="md"
                                className="!text-[11px] !py-1 !px-2.5 rounded-lg font-bold shadow-2xs whitespace-nowrap [&>span]:!max-w-none"
                              />
                            );
                          })()}
                        </td>

                        {/* CATEGORY (Sleek Tag Badge with Dot) */}
                        <td className="py-3 px-3">
                          {(() => {
                            const catStyle = getCategoryStyle(task.category);
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors shadow-2xs ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catStyle.dot}`} />
                                <span className="whitespace-nowrap">{task.category || "Content"}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* CONTENT TYPE (Pill Badge with Format Micro-Icon) */}
                        <td className="py-3 px-3">
                          {(() => {
                            const typeCfg = getContentTypeConfig(task.contentType);
                            const TypeIcon = typeCfg.icon;
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs transition-colors ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                              >
                                <TypeIcon className={`w-3 h-3 shrink-0 ${typeCfg.iconClass}`} />
                                <span className="whitespace-nowrap">{task.contentType || "Post"}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* PLATFORMS SUB-TASKS (Checklist with ticks) */}
                        {selectedCommitment !== "No" && (
                          <td className="py-3 px-3">
                            {renderPlatformSubtasks(task)}
                          </td>
                        )}

                        {/* CREATED BY */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {(() => {
                            const creator = getCreatorInfo(task);
                            return (
                              <div className="flex items-center gap-2.5">
                                <div className="relative shrink-0 w-6 h-6">
                                  {creator.avatarUrl ? (
                                    <img
                                      src={creator.avatarUrl}
                                      alt={creator.name}
                                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                        if (fallback) fallback.style.display = "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] items-center justify-center uppercase shadow-2xs"
                                    style={{ display: creator.avatarUrl ? "none" : "flex" }}
                                  >
                                    {creator.initials}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap" title={creator.name}>
                                  {creator.name}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* DUE DATE */}
                        <td className="py-3 px-3">
                          {renderDueDateBadge(task.dueDate, task.status)}
                        </td>

                        {/* STATUS - Interactive quick-change dropdown */}
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const isComm = Boolean(task.commitment) || selectedCommitment === "Yes";
                            const currentDisplayStatus = getDisplayStatusForTask(task, selectedCommitment);
                            const options = isComm ? COMMITMENT_STATUS_OPTIONS : NON_COMMITMENT_STATUS_OPTIONS;
                            return (
                              <select
                                value={currentDisplayStatus}
                                disabled={isReadOnly}
                                onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                                className={`table-status-select ${isReadOnly ? "cursor-default opacity-90" : "cursor-pointer"} focus:ring-1 focus:ring-indigo-500 shadow-2xs font-semibold ${getTableStatusStyle(currentDisplayStatus)}`}
                              >
                                {options.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </td>

                        {/* PRIORITY */}
                        <td className="py-3 px-3 font-bold">
                          {task.priority === "High" && <span className="text-rose-600 dark:text-rose-400">High</span>}
                          {task.priority === "Medium" && <span className="text-amber-600 dark:text-amber-400">Medium</span>}
                          {task.priority === "Low" && <span className="text-slate-500 dark:text-slate-400">Low</span>}
                        </td>

                        {/* Columns visible only in Commitment: QC, Publish Date, Commitment, Calendar */}
                        {selectedCommitment !== "No" && (
                          <>
                            {/* QC */}
                            <td className="py-3 px-3 whitespace-nowrap">
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
                            <td className="py-3 px-4 bg-slate-50/60 dark:bg-[#131d31]/50 font-mono text-[11px] text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap">
                              {formatPublishDateTime(task.publishDate)}
                            </td>

                            {/* COMMITMENT (Shaded column) */}
                            <td className="py-3 px-3 bg-slate-50/60 dark:bg-[#131d31]/50 whitespace-nowrap">
                              {task.commitment ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                                  <FiLock size={10} className="shrink-0" />
                                  <span>Yes</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 dark:bg-[#182338] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                  No
                                </span>
                              )}
                            </td>

                            {/* CALENDAR (Shaded column) */}
                            <td className="py-3 px-3 bg-slate-50/60 dark:bg-[#131d31]/50 whitespace-nowrap">
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
                          </>
                        )}

                        {/* ACTIONS */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditTask(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={isReadOnly ? "View Task" : "Edit Task"}
                            >
                              <FiEye size={15} />
                            </button>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTask(task, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Note, Entries Info, Page Size & Pagination */}
          <div className="px-5 py-4 bg-slate-50/90 dark:bg-[#0c1220] border-t border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-300">
            {/* Left: Row range & Items per page dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Showing{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredTasks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredTasks.length}
                </span>{" "}
                tasks
              </span>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">per page</span>
              </div>
            </div>

            {/* Right: Page Navigation with Numbers & Prev/Next */}
            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-[#182338] shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronsLeft size={14} />
              </button>

              {/* Previous Page */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-[#182338] shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={14} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold select-none">
                        …
                      </span>
                    );
                  }
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={isActive ? { background: "var(--color-brand-gradient, var(--accent-gradient))" } : {}}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? (isLightAccent ? "text-slate-950 font-black shadow-sm ring-1 ring-black/20" : "text-white shadow-sm ring-1 ring-white/20")
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e2a40] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131d31]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-[#182338] shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronRight size={14} />
              </button>

              {/* Last Page */}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-[#182338] shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Task Creation / Edit Modal */}
        <SmTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTaskForEdit}
          isReadOnly={isReadOnly}
        />

        {/* Pending Commitment Modal (Detailed Client Breakdown) */}
        <PendingCommitmentModal
          isOpen={isPendingCommitmentOpen}
          onClose={() => setIsPendingCommitmentOpen(false)}
          clients={clients}
          tasks={tasks}
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          onSelectClient={(clientName) => {
            setSelectedClient(clientName);
            setCurrentPage(1);
          }}
          onCreateTaskForClient={isReadOnly ? null : (clientObj) => {
            setSelectedTaskForEdit({
              client: clientObj?._id,
              clientName: clientObj?.companyName,
              clientColor: clientObj?.color,
            });
            setIsModalOpen(true);
          }}
        />

        {/* Platform Verification Warning Modal */}
        <SmPlatformWarningModal
          isOpen={platformWarningModal.isOpen}
          onClose={() =>
            setPlatformWarningModal({ isOpen: false, task: null, targetStatus: "" })
          }
          task={platformWarningModal.task}
          targetStatus={platformWarningModal.targetStatus}
          onConfirm={handleConfirmPlatformWarning}
        />
      </div>
      );
};

      export default React.memo(SmTasks);
