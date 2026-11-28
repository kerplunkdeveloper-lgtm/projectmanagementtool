import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams, useLocation, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  FiEdit2,
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
  FiDownload,
  FiBarChart2,
  FiClock,
  FiAlertCircle,
  FiMoreVertical,
  FiMenu,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ClientBadge from "../../components/common/ClientBadge";
import PendingCommitmentModal from "../../components/common/PendingCommitmentModal";
import BranchTabs from "../../components/common/BranchTabs";
import { useBranchTab, useBranchFilter } from "../../hooks/useBranchFilter";
import { buildSmTasksFilterParams } from "../../utils/smTasksQuery";

// Stable empty array so memo dependencies do not change on every render
const EMPTY_ARRAY = [];
import {
  getSocialmediaTasksPage,
  makePagedTasksKey,
  makeTasksKey,
  getSocialmediaStats,
  updateSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import {
  getSocialmediaTasksAPI,
  getSocialmediaTasksPagedAPI,
  getSocialmediaTaskByIdAPI,
} from "../../features/socialmediaTasks/socialmediaTaskApi";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";
import SmTaskFilters from "./SmTaskFilters";
import SmPlatformWarningModal from "./SmPlatformWarningModal";
import DailyWorkScheduleTab from "./DailyWorkScheduleTab";

const CATEGORIES = [
  "All",
  "Content Calendar",
  "Content Creation",
  "Meeting",
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

/**
 * Render Due Date badge based on task status & overdue days
 * If status is Live/Completed: green background with Live indicator
 * If status is NOT Live and due date is past/today: red background with overdue days count
 */
const renderDueDateBadge = (dueDate, status, dateOnly = false) => {
  if (!dueDate) return <span className="text-slate-400 font-medium">-</span>;

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return <span className="text-slate-400 font-medium">-</span>;

  const dateStr = formatDisplayDate(dueDate);

  // Status QC or Completed and wait client approval -> show "Waiting" below the date ("date kila")
  const s = (status || "").trim().toLowerCase();
  const isWaiting = s === "qc" || s === "in qc" || s.includes("client approval");
  if (isWaiting && !dateOnly) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
          {dateStr}
        </span>
        <span
          title={`Status: ${status} • Waiting`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs whitespace-nowrap"
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
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>{dateStr}</span>
        {!dateOnly && (
          <span className="text-[9px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 pl-0.5">
            • {["Live", "Published", "Published Live"].includes(status) ? "Published Live" : "Done"}
          </span>
        )}
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
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
        <span>{dateStr}</span>
        {!dateOnly && (
          <span className="text-[9px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400 pl-0.5">
            • {dayLabel}
          </span>
        )}
      </span>
    );
  }

  // 3. Not Live and Due Today: Red background badge
  if (diffDays === 0) {
    return (
      <span
        title={`Due today (${dateStr}) • Status is ${status || "Pending"}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
        <span>{dateStr}</span>
        {!dateOnly && (
          <span className="text-[9px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400 pl-0.5">
            • Due today
          </span>
        )}
      </span>
    );
  }

  // 4. Future Due Date (not yet overdue)
  const dayLabel = diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays}d`;
  return (
    <span
      title={`Due in ${diffDays} days (${dateStr})`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 dark:bg-[#162033] text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-[#2b3a55] whitespace-nowrap"
    >
      <FiCalendar size={11} className="text-slate-400 shrink-0" />
      <span>{dateStr}</span>
      {!dateOnly && (
        <span className="text-[9px] text-slate-400 font-medium pl-0.5">
          • {dayLabel}
        </span>
      )}
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
    case "content creation":
      return {
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-700 dark:text-teal-300",
        border: "border-teal-200/90 dark:border-teal-800/60",
        dot: "bg-teal-500",
      };
    case "meeting":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/90 dark:border-emerald-800/60",
        dot: "bg-emerald-500",
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
        bg: "bg-slate-100 dark:bg-[#162033]",
        text: "text-slate-700 dark:text-slate-200",
        border: "border-slate-200 dark:border-[#2b3a55]",
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
        bg: "bg-slate-100 dark:bg-[#162033]",
        text: "text-slate-700 dark:text-slate-200",
        border: "border-slate-200 dark:border-[#2b3a55]",
        icon: FiLayers,
        iconClass: "text-slate-500 dark:text-slate-300",
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
        bg: "bg-slate-100 dark:bg-[#162033]",
        text: "text-slate-700 dark:text-slate-200",
        border: "border-slate-200 dark:border-[#2b3a55]",
        icon: FiGrid,
        iconClass: "text-slate-500 dark:text-slate-300",
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
  // Soft tinted badge style (light bg + dark same-hue text + thin border),
  // matching the Due Date badge. Hex + "!" so global select styles / theme can't override.
  if (s.includes("not started")) {
    return "!bg-[#fff1f2] !text-[#be123c] !border !border-solid !border-[#fecdd3] dark:!bg-[rgba(136,19,55,0.35)] dark:!text-[#fda4af] dark:!border-[rgba(190,18,60,0.45)]";
  }
  if (s.includes("inprogress") || s.includes("in progress")) {
    return "!bg-[#eff6ff] !text-[#1d4ed8] !border !border-solid !border-[#bfdbfe] dark:!bg-[rgba(30,58,138,0.35)] dark:!text-[#93c5fd] dark:!border-[rgba(37,99,235,0.45)]";
  }
  if (s === "qc" || s.includes("in qc") || s.includes("client approval") || s.includes("approval")) {
    return "!bg-[#fffbeb] !text-[#b45309] !border !border-solid !border-[#fde68a] dark:!bg-[rgba(120,53,15,0.35)] dark:!text-[#fcd34d] dark:!border-[rgba(217,119,6,0.45)]";
  }
  if (s.includes("waiting for response") || s.includes("response")) {
    return "!bg-[#faf5ff] !text-[#7e22ce] !border !border-solid !border-[#e9d5ff] dark:!bg-[rgba(88,28,135,0.35)] dark:!text-[#d8b4fe] dark:!border-[rgba(147,51,234,0.45)]";
  }
  if (s.includes("published live") || s.includes("published") || s === "live" || s.includes("completed")) {
    return "!bg-[#ecfdf5] !text-[#047857] !border !border-solid !border-[#a7f3d0] dark:!bg-[rgba(6,78,59,0.35)] dark:!text-[#6ee7b7] dark:!border-[rgba(5,150,105,0.45)]";
  }
  if (s.includes("overdue")) {
    return "!bg-[#fff1f2] !text-[#e11d48] !border !border-solid !border-[#fecdd3] dark:!bg-[rgba(136,19,55,0.35)] dark:!text-[#fda4af] dark:!border-[rgba(190,18,60,0.45)]";
  }
  return "!bg-[#f8fafc] !text-[#334155] !border !border-solid !border-[#e2e8f0] dark:!bg-[rgba(30,41,59,0.6)] dark:!text-[#cbd5e1] dark:!border-[rgba(255,255,255,0.1)]";
};

const SmTasks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const outletContext = useOutletContext() || {};
  const setSidebarOpen = outletContext?.setSidebarOpen;
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "admin";
  const { theme, accentColor = "emerald" } = useTheme();
  const isLightAccent = ["neon-green", "lime"].includes(accentColor);

  const { tasks, loading, tasksKey, pageMeta, mutationVersion, error: tasksError } = useSelector(
    (state) => state.socialmediaTasks
  );
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || EMPTY_ARRAY;

  // Branch tabs (Pondicherry / Chennai) for Admin & Operation Manager
  const branchRoleClean = (user?.role || role || "").toLowerCase().replace(/[\s_]/g, "");
  const canSwitchBranch = branchRoleClean === "admin" || branchRoleClean === "operationmanager";
  const [branchTab, setBranchTab] = useBranchTab();
  const { isClientInBranch, isTaskInBranch } = useBranchFilter(clients, branchTab, canSwitchBranch);

  // Active clients list (strictly exclude inactive clients, and filter by selected branch tab)
  const activeClients = useMemo(() => {
    return (clients || []).filter(
      (c) => (c.status || "Active").toLowerCase() !== "inactive" && isClientInBranch(c)
    );
  }, [clients, isClientInBranch]);

  // (Inactive-client and branch filtering of tasks now happens on the server — see /paged)
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || EMPTY_ARRAY;

  // Role check: Admin, Operation Manager, and Social Media Manager can see all users' tasks and filter by Created By
  const userRoleClean = (user?.role || role || "").toLowerCase().replace(/[\s_]/g, "");
  const deptLower = (user?.department || "").toLowerCase();
  const isSocialMediaManagerRole =
    userRoleClean === "socialmediamanager" ||
    userRoleClean === "socialmediahead" ||
    deptLower.includes("social media head");

  const isSocialMediaHead = useMemo(() => {
    const r = (user?.role?.name || user?.role || "").toString().toLowerCase().trim();
    const desig = (user?.designation || "").toString().toLowerCase().trim();
    const dept = (user?.department || "").toString().toLowerCase().trim();
    return (
      r.includes("social media head") ||
      desig.includes("social media head") ||
      dept.includes("social media head") ||
      (dept.includes("social media") && (r.includes("head") || desig.includes("head")))
    );
  }, [user]);

  const canFilterByCreatedBy =
    userRoleClean === "admin" ||
    userRoleClean === "operationmanager" ||
    isSocialMediaManagerRole;
  const isReadOnly = userRoleClean === "admin" || userRoleClean === "operationmanager";
  const isAdminOrOpManager =
    userRoleClean === "admin" ||
    userRoleClean === "operationmanager" ||
    (user?.role?.name || user?.role || "").toString().toLowerCase().includes("admin") ||
    (user?.role?.name || user?.role || "").toString().toLowerCase().includes("operation");

  // Month & Commitments state (Image 1 style)
  const currentNow = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentNow.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentNow.getFullYear());
  // Commitment tab: a specific publish date within the month (null = whole month)
  const [selectedDay, setSelectedDay] = useState(null);
  const [isPendingCommitmentOpen, setIsPendingCommitmentOpen] = useState(false);
  const [pendingModalTasks, setPendingModalTasks] = useState([]);

  // Fetch all commitment tasks for the selected month when PendingCommitmentModal opens
  // (uniqueTasks only holds the 10 paginated rows for the current table page).
  useEffect(() => {
    if (!isPendingCommitmentOpen) return;
    let cancelled = false;
    const params = { commitment: "true" };
    if (selectedMonth && selectedYear && selectedMonth !== "all" && selectedYear !== "all") {
      params.month = selectedMonth;
      params.year = selectedYear;
    }
    getSocialmediaTasksAPI(params)
      .then((res) => {
        if (cancelled) return;
        const list = (res?.data || []).filter((t) => isTaskInBranch(t));
        setPendingModalTasks(list);
      })
      .catch(() => {
        if (!cancelled) setPendingModalTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isPendingCommitmentOpen, selectedMonth, selectedYear, isTaskInBranch, mutationVersion]);

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

  // Query param tab detection (e.g. from notification click: ?tab=sme or ?tab=daily)
  const tabParam = (searchParams.get("tab") || location.state?.tab || "").toLowerCase();
  const initialTabIsDaily =
    tabParam === "daily" ||
    tabParam === "schedule" ||
    tabParam === "daily-schedule" ||
    tabParam === "dailyworkschedule";
  const initialTabIsSme =
    !initialTabIsDaily &&
    (tabParam === "sme" || tabParam === "sme-tasks" || tabParam === "smetasks");

  const [activeTab, setActiveTab] = useState(
    initialTabIsDaily ? "daily" : initialTabIsSme ? "sme" : "commitment"
  );

  // Filter States
  const [selectedClient, setSelectedClient] = useState("All");

  // Reset client filter when the branch tab changes (skip first render)
  const branchTabMountedRef = useRef(false);
  useEffect(() => {
    if (!branchTabMountedRef.current) {
      branchTabMountedRef.current = true;
      return;
    }
    setSelectedClient("All");
  }, [branchTab]);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState(
    initialTabIsSme || initialTabIsDaily ? "All" : "Content Calendar"
  );
  const [selectedContentType, setSelectedContentType] = useState(
    initialTabIsSme ? "Others Task" : "All"
  );
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCommitment, setSelectedCommitment] = useState(
    initialTabIsSme ? "No" : initialTabIsDaily ? "All" : "Yes"
  );

  const hideCommitmentAction =
    isAdminOrOpManager || (activeTab === "commitment" && isSocialMediaHead);

  // Comprehensive Date Filter States - Separate for Commitment and SME Tabs
  const [commitmentDatePreset, setCommitmentDatePreset] = useState("All");
  // Commitment tab date filters ("Today", "This Week"…) match the PUBLISH date by default —
  // a commitment is "today" when it goes live today. Any Date / Due Date stay selectable.
  const [commitmentDateField, setCommitmentDateField] = useState("publish");
  const [commitmentStartDate, setCommitmentStartDate] = useState("");
  const [commitmentEndDate, setCommitmentEndDate] = useState("");

  const [smeDatePreset, setSmeDatePreset] = useState("All Time");
  const [smeDateField, setSmeDateField] = useState("due");
  const [smeStartDate, setSmeStartDate] = useState("");
  const [smeEndDate, setSmeEndDate] = useState("");

  const isSmeTab = activeTab === "sme";
  const dateFilterPreset = isSmeTab ? smeDatePreset : commitmentDatePreset;
  const setDateFilterPreset = isSmeTab ? setSmeDatePreset : setCommitmentDatePreset;
  const dateFilterField = isSmeTab ? smeDateField : commitmentDateField;
  const setDateFieldType = isSmeTab ? setSmeDateField : setCommitmentDateField;
  const customStartDate = isSmeTab ? smeStartDate : commitmentStartDate;
  const setCustomStartDate = isSmeTab ? setSmeStartDate : setCommitmentStartDate;
  const customEndDate = isSmeTab ? smeEndDate : commitmentEndDate;
  const setCustomEndDate = isSmeTab ? setSmeEndDate : setCommitmentEndDate;

  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    target: null, // single task object
    tabName: "Commitment",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [platformWarningModal, setPlatformWarningModal] = useState({
    isOpen: false,
    task: null,
    targetStatus: "",
  });
  const [activePlatformMenuTaskId, setActivePlatformMenuTaskId] = useState(null);

  // Open a task from a notification link. It may not be on the current page, so fetch it by id.
  const openLinkedTask = (taskId) => {
    if (!taskId) return;
    getSocialmediaTaskByIdAPI(taskId)
      .then((res) => {
        if (res?.data) {
          setSelectedTaskForEdit(res.data);
          setIsModalOpen(true);
        }
      })
      .catch(() => toast.error("Couldn't open the linked task"));
  };

  // Automatically activate tab and open modal if taskId is passed via notification link
  useEffect(() => {
    const tabParam = (searchParams.get("tab") || location.state?.tab || "").toLowerCase();
    if (
      tabParam === "daily" ||
      tabParam === "schedule" ||
      tabParam === "daily-schedule" ||
      tabParam === "dailyworkschedule"
    ) {
      setActiveTab("daily");
      setSelectedCommitment("All");
      setSelectedCategory("All");
      setSelectedContentType("All");
      setDateFilterPreset("Today");
      setCurrentPage(1);

      openLinkedTask(searchParams.get("taskId") || searchParams.get("id"));
    } else if (tabParam === "sme" || tabParam === "sme-tasks" || tabParam === "smetasks") {
      setActiveTab("sme");
      setSelectedCommitment("No");
      setSelectedCategory("All");
      setSelectedContentType("Others Task");
      setDateFilterPreset("All");
      setAtRiskOnly(false);
      setCurrentPage(1);

      openLinkedTask(searchParams.get("taskId") || searchParams.get("id"));
    } else if (tabParam === "commitment") {
      setActiveTab("commitment");
      setSelectedCommitment("Yes");
      setSelectedCategory("Content Calendar");
      setSelectedContentType("All");
      setDateFilterPreset("All");
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.state]);

  useEffect(() => {
    const handleOutside = () => setActivePlatformMenuTaskId(null);
    if (activePlatformMenuTaskId) {
      document.addEventListener("click", handleOutside);
    }
    return () => document.removeEventListener("click", handleOutside);
  }, [activePlatformMenuTaskId]);

  // ─── Server-side filtering + pagination ───────────────────────────────────
  // The table used to download EVERY task and filter/sort/paginate in the browser.
  // Now the server does it and returns only the visible page.

  // Debounce search so typing doesn't fire a request per keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filterParams = useMemo(
    () =>
      buildSmTasksFilterParams({
        activeTab,
        search: debouncedSearch,
        selectedClient,
        selectedCreatedBy,
        canFilterByCreatedBy,
        selectedCategory,
        selectedContentType,
        selectedStatus,
        selectedPriority,
        selectedCommitment,
        atRiskOnly,
        // Commitment tab filters by the month picker only (no date presets there);
        // a preset left over from another tab must not override the month.
        dateFilterPreset: activeTab === "commitment" ? "All" : dateFilterPreset,
        dateFilterField: activeTab === "commitment" ? "publish" : dateFilterField,
        customStartDate: activeTab === "commitment" ? "" : customStartDate,
        customEndDate: activeTab === "commitment" ? "" : customEndDate,
        selectedMonth,
        selectedYear,
        selectedDay,
        branch: canSwitchBranch ? branchTab : undefined,
      }),
    [
      activeTab, debouncedSearch, selectedClient, selectedCreatedBy, canFilterByCreatedBy,
      selectedCategory, selectedContentType, selectedStatus, selectedPriority, selectedCommitment,
      atRiskOnly, dateFilterPreset, dateFilterField, customStartDate, customEndDate,
      selectedMonth, selectedYear, selectedDay, canSwitchBranch, branchTab,
    ]
  );
  const filtersKey = makeTasksKey(filterParams);

  // Pagination: the page number belongs to a filter combination, so changing any filter
  // goes back to page 1 automatically (without an extra request for the old page).
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const currentPage = pageState.key === filtersKey ? pageState.page : 1;
  const setCurrentPage = (next) => {
    setPageState((prev) => {
      const cur = prev.key === filtersKey ? prev.page : 1;
      const value = typeof next === "function" ? next(cur) : next;
      return { key: filtersKey, page: Math.max(1, Number(value) || 1) };
    });
  };
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const pagedQuery = useMemo(
    () => ({ ...filterParams, page: currentPage, limit: itemsPerPage }),
    [filterParams, currentPage, itemsPerPage]
  );
  const currentListKey = makePagedTasksKey(pagedQuery);
  const hasPageData = tasksKey === currentListKey;
  const listLoadFailed = !hasPageData && !loading && Boolean(tasksError);
  const showSkeleton = !hasPageData && !listLoadFailed;
  const isRefreshing = loading && hasPageData;

  // Fetch the visible page (and refetch after any create/update/delete)
  useEffect(() => {
    if (activeTab === "daily") return;
    dispatch(getSocialmediaTasksPage(pagedQuery));
  }, [dispatch, pagedQuery, activeTab, mutationVersion]);

  // Clients & users (for dropdowns / avatars) are loaded once
  useEffect(() => {
    if (!clients || clients.length === 0) dispatch(getClients());
    if (!users || users.length === 0) dispatch(getUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const filteredTotal = hasPageData ? pageMeta?.total || 0 : 0;
  const totalPages = Math.max(1, hasPageData ? pageMeta?.totalPages || 1 : 1);

  // A delete can leave the current page empty — step back to the last existing page
  if (hasPageData && pageMeta && pageMeta.total > 0 && currentPage > pageMeta.totalPages) {
    setPageState({ key: filtersKey, page: pageMeta.totalPages });
  }


  // Sync monthly stats when month or branch changes
  useEffect(() => {
    const branchParam = canSwitchBranch ? { branch: branchTab } : {};
    if (selectedMonth && selectedYear && selectedMonth !== "all" && selectedYear !== "all") {
      dispatch(getSocialmediaStats({ year: selectedYear, month: selectedMonth, ...branchParam }));
    } else {
      dispatch(getSocialmediaStats(branchParam));
    }
  }, [dispatch, selectedMonth, selectedYear, canSwitchBranch, branchTab]);

  // Dynamic unique client list from real DB clients & tasks (strictly excluding inactive clients)
  const clientOptions = useMemo(() => {
    const set = new Set();
    activeClients.forEach((c) => {
      if (c.companyName) set.add(c.companyName);
    });
    set.add("Others");
    return ["All", ...Array.from(set)];
  }, [activeClients]);

  // Deduplicate tasks by document _id (NOT by title — different tasks can share the same title)
  // and filter out inactive client tasks
  const uniqueTasks = useMemo(() => {
    if (!hasPageData) return [];
    const seen = new Set();
    return (tasks || []).filter((t) => {
      const key = t._id ? t._id.toString() : JSON.stringify(t);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tasks, hasPageData]);

  // Dynamic unique creators list for Admin & Operation Manager filter - ONLY Social Media Executives
  const createdByOptions = useMemo(() => {
    const nameMap = new Map();

    // 1. All active Social Media Executives in users list
    (users || []).forEach((u) => {
      if (u.name && u.name.trim() && isSocialMediaManager(u)) {
        nameMap.set(u.name.trim().toLowerCase(), u.name.trim());
      }
    });

    return ["All", ...Array.from(nameMap.values()).sort((a, b) => a.localeCompare(b))];
  }, [users]);

  // Rows for the visible page come straight from the server (already filtered + sorted)
  const paginatedTasks = uniqueTasks;

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

  const currentCommitmentsCount = hasPageData ? pageMeta?.filteredCommitments || 0 : 0;

  const hasActiveFilters = useMemo(() => {
    const isCategoryFiltered =
      activeTab === "commitment"
        ? false
        : selectedCategory !== "All";

    const isContentTypeFiltered =
      activeTab === "sme"
        ? false
        : selectedContentType !== "All";

    // Commitment tab has no date presets (month picker only), so they never count there
    const isDateFiltered =
      activeTab === "commitment"
        ? false
        : activeTab === "daily"
          ? dateFilterPreset !== "Today"
          : (dateFilterPreset !== "All" && dateFilterPreset !== "All Time") ||
            Boolean(customStartDate) ||
            Boolean(customEndDate);

    return (
      selectedClient !== "All" ||
      selectedCreatedBy !== "All" ||
      isCategoryFiltered ||
      isContentTypeFiltered ||
      selectedStatus !== "All" ||
      selectedPriority !== "All" ||
      isDateFiltered ||
      (activeTab !== "sme" && atRiskOnly) ||
      searchQuery.trim().length > 0
    );
  }, [
    activeTab,
    selectedClient,
    selectedCreatedBy,
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
    if (activeTab !== "commitment" && ((dateFilterPreset !== "All" && dateFilterPreset !== "All Time") || customStartDate || customEndDate)) count++;
    if (activeTab !== "sme" && atRiskOnly) count++;
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
    if (activeTab === "commitment") {
      setSelectedCategory("Content Calendar");
      setSelectedContentType("All");
      setSelectedCommitment("Yes");
      setCommitmentDatePreset("All");
      setCommitmentDateField("publish");
      setSelectedDay(null);
      setCommitmentStartDate("");
      setCommitmentEndDate("");
    } else if (activeTab === "sme") {
      setSelectedCategory("All");
      setSelectedContentType("Others Task");
      setSelectedCommitment("No");
      setSmeDatePreset("All Time");
      setSmeDateField("due");
      setSmeStartDate("");
      setSmeEndDate("");
    } else {
      setSelectedCategory("All");
      setSelectedContentType("All");
      setSelectedCommitment("All");
    }
    setSelectedStatus("All");
    setSelectedPriority("All");
    setCustomStartDate("");
    setCustomEndDate("");
    setAtRiskOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleExportExcel = async () => {
    let filteredTasks;
    const toastId = toast.loading("Preparing export…");
    try {
      const res = await getSocialmediaTasksPagedAPI({ ...filterParams, all: 1 });
      filteredTasks = res?.data || [];
      toast.dismiss(toastId);
    } catch {
      toast.error("Export failed — please try again", { id: toastId });
      return;
    }
    if (filteredTasks.length === 0) {
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
    if (isReadOnly || (isSocialMediaHead && activeTab === "commitment")) return;
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
    if (!task || !task._id || isReadOnly || isSocialMediaHead) return;

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
          optimistic: true, // instant tick, auto-rollback on failure
          silent: true,
        })
      ).unwrap();

      if (!isCompleted) {
        toast.success(`✓ ${platformId} marked as completed`, { id: `plat-${task._id}` });
      } else {
        toast(`Unchecked ${platformId}`, { icon: "↩️", id: `plat-${task._id}` });
      }
    } catch {
      // Error toast already shown by the thunk; optimistic change has been rolled back.
    }
  };

  const handleTogglePlatformAssignment = async (task, platformId) => {
    if (!task || !task._id || isReadOnly || isSocialMediaHead) return;

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
          optimistic: true, // instant UI, auto-rollback on failure
          silent: true,
        })
      ).unwrap();
      toast.success(exists ? `Removed ${platformId}` : `Added ${platformId} sub-task`, { id: `plat-${task._id}` });
    } catch {
      // Error toast already shown by the thunk; optimistic change has been rolled back.
    }
  };

  const renderPlatformSubtasks = (task) => {
    const isCal =
      task.commitment !== undefined
        ? Boolean(task.commitment)
        : ((task.category || "").trim().toLowerCase() === "content calendar" ||
          (task.category || "").trim().toLowerCase() === "content calendor" ||
          (task.category || "").trim().toLowerCase() === "content");

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
      <div className="flex flex-col gap-1 py-0.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {/* Subtask Progress Bar & Badge */}
        <div className="flex items-center justify-between gap-1 text-[9.5px]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Platforms
          </span>
          <span
            className={`px-1.5 py-0.2 rounded-md font-extrabold text-[8.5px] ${allDone
              ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              : completedCount > 0
                ? "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                : "bg-slate-100 dark:bg-[#162033] text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-[#2b3a55]"
              }`}
          >
            {completedCount}/{totalCount} {allDone ? "✓ All Done" : "Posted"}
          </span>
        </div>

        {/* Interactive Checkbox Chips (Tick & Icon Only - Better UI/UX) */}
        <div className="grid grid-cols-3 gap-1 w-fit">
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
                disabled={isReadOnly || isSocialMediaHead}
                onClick={(e) => handleTogglePlatformSubtask(task, platObj.id, e)}
                title={
                  isCompleted
                    ? `✓ ${platObj.name} (Posted - Click to uncheck)`
                    : `○ ${platObj.name} (Pending - Click to mark posted)`
                }
                className={`group/plat relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all duration-150 cursor-pointer ${isCompleted
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300/90 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs hover:bg-emerald-100 hover:scale-105"
                  : "bg-white dark:bg-[#111827] border-slate-200 dark:border-[#2b3a55] text-slate-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-[#1f2937] hover:scale-105 shadow-2xs"
                  } active:scale-95 disabled:cursor-not-allowed`}
              >
                {/* Tick Checkbox Indicator */}
                <span
                  className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] transition-colors shrink-0 ${isCompleted
                    ? "bg-emerald-500 border-emerald-600 text-white shadow-2xs"
                    : "border-slate-300 dark:border-[#374151] bg-slate-50 dark:bg-[#0b1120] group-hover/plat:border-emerald-400 text-transparent"
                    }`}
                >
                  <FiCheck className="stroke-[3]" size={9} />
                </span>

                {/* Platform Icon */}
                <IconComp
                  size={12}
                  className={`shrink-0 transition-opacity ${isCompleted ? "opacity-100" : "opacity-75 group-hover/plat:opacity-100"
                    }`}
                  style={{ color: platObj.color }}
                />
              </button>
            );
          })}

          {/* Quick Add Platform Subtask Button */}
          {!isReadOnly && !isSocialMediaHead && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePlatformMenuTaskId(isMenuOpen ? null : task._id);
                }}
                className="w-full h-full min-h-[22px] min-w-[30px] rounded-md border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-[#1e293b] text-slate-400 hover:text-indigo-600 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Add or remove platforms from this task"
              >
                <FiPlus size={11} className="stroke-[2.5]" />
              </button>

              {/* Popover */}
              {isMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-48 z-50 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#2b3a55] rounded-xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95"
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
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs font-semibold ${isAssigned
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
    const isComm =
      Boolean(task?.commitment) ||
      selectedCommitment === "Yes" ||
      (task?.category || "").trim().toLowerCase() === "content calendar" ||
      (task?.category || "").trim().toLowerCase() === "content calendor" ||
      (task?.category || "").trim().toLowerCase() === "content";

    if (isReadOnly || (isSocialMediaHead && isComm) || !task || !task._id) return;

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

  const handleToggleSmeTaskCompleted = async (task, e) => {
    e.stopPropagation();
    if (isReadOnly || !task || !task._id) return;
    const isCompleted = (task.status || "").trim().toLowerCase() === "completed";
    const nextStatus = isCompleted ? "Not started" : "Completed";
    try {
      await dispatch(
        updateSocialmediaTask({
          id: task._id,
          data: { status: nextStatus },
        })
      ).unwrap();
      toast.success(
        isCompleted
          ? `Task marked as "${nextStatus}"`
          : `✓ Task marked as Completed!`
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const isCommitmentTab = selectedCommitment !== "No";

  const handleDeleteTask = (task, e) => {
    if (e) e.stopPropagation();
    const isComm =
      Boolean(task?.commitment) ||
      activeTab === "commitment" ||
      selectedCommitment === "Yes" ||
      (task?.category || "").trim().toLowerCase() === "content calendar" ||
      (task?.category || "").trim().toLowerCase() === "content calendor" ||
      (task?.category || "").trim().toLowerCase() === "content";

    if (isReadOnly || (isSocialMediaHead && isComm)) return;
    setDeleteConfirm({
      show: true,
      target: task,
      tabName: activeTab === "daily" ? "Daily work Schedule" : (activeTab === "commitment" ? "Commitment" : "SME"),
    });
  };

  const handleConfirmDelete = async () => {
    if (isDeleting || !deleteConfirm.target?._id) return;
    setIsDeleting(true);
    try {
      const targetId = deleteConfirm.target._id;
      await dispatch(deleteSocialmediaTask(targetId)).unwrap();
      setDeleteConfirm({ show: false, target: null, tabName: "" });
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-3 sm:p-5 space-y-3.5 sm:space-y-6">
      {/* Segmented Tab Navigation: Commitment vs SME tasks vs Daily work Schedule */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Mobile Sidebar toggle + Sleek Compact Segmented Switcher */}
        <div className="flex items-center gap-2">
          {setSidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer shrink-0"
              title="Open Sidebar"
            >
              <FiMenu size={18} />
            </button>
          )}

          <div className="w-full sm:w-auto inline-flex items-center p-1 bg-slate-100/90 dark:bg-[#111927] rounded-xl border border-slate-200/80 dark:border-white/10 gap-1 shadow-2xs relative">
            {/* Tab 1: Commitment */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("commitment");
                setSelectedCommitment("Yes");
                setSelectedCategory("Content Calendar");
                setSelectedContentType("All");
                setCurrentPage(1);
              }}
              className={`group relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all duration-150 cursor-pointer ${
                activeTab === "commitment"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-500/60 shadow-2xs font-extrabold"
                  : "border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <FiLock
                size={12}
                className={`stroke-[2.5] transition-colors ${
                  activeTab === "commitment"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
              />
              <span className="whitespace-nowrap">Commitment</span>
              {activeTab === "commitment" && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block ml-0.5" />
              )}
            </button>

            {/* Tab 2: SME tasks */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("sme");
                setSelectedCommitment("No");
                setSelectedCategory("All");
                setSelectedContentType("Others Task");
                setAtRiskOnly(false);
                setCurrentPage(1);
              }}
              className={`group relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all duration-150 cursor-pointer ${
                activeTab === "sme"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-500/60 shadow-2xs font-extrabold"
                  : "border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <FiLayers
                size={12}
                className={`stroke-[2.5] transition-colors ${
                  activeTab === "sme"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
              />
              <span className="whitespace-nowrap">SME tasks</span>
              {activeTab === "sme" && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block ml-0.5" />
              )}
            </button>

            {/* Tab 3: Daily work Schedule */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("daily");
                setSelectedCommitment("All");
                setSelectedCategory("All");
                setSelectedContentType("All");
                setCurrentPage(1);
              }}
              className={`group relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all duration-150 cursor-pointer ${
                activeTab === "daily"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-500/60 shadow-2xs font-extrabold"
                  : "border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <FiClock
                size={12}
                className={`stroke-[2.5] transition-colors ${
                  activeTab === "daily"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
              />
              <span className="whitespace-nowrap">Daily work Schedule</span>
              {activeTab === "daily" && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Right Actions: Month Filter, Create Task, and Open Calendar */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">

          {/* Branch Tabs (Admin / Operation Manager only) */}
          {canSwitchBranch && activeTab !== "daily" && (
            <BranchTabs value={branchTab} onChange={setBranchTab} />
          )}

          {/* Create Task Button (or Read-only View badge) */}
          {activeTab !== "daily" && (
            isReadOnly || (isSocialMediaHead && activeTab === "commitment") ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs shadow-2xs">
                <FiLock size={13} />
                <span>Read-only View</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <FiPlus size={14} className="stroke-[2.5]" />
                <span>Create task</span>
              </button>
            )
          )}

          {/* Open Calendar Button */}
          <AnimatePresence>
            {activeTab === "commitment" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={handleOpenCalendar}
                className="group relative p-[1.5px] overflow-hidden rounded-xl shrink-0 cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-transform"
                title="Open Social Media Calendar"
              >
                {/* Spinning Neon Border Beam */}
                <span
                  className="absolute -inset-[150%] animate-spin pointer-events-none"
                  style={{
                    animationDuration: "3s",
                    background:
                      "conic-gradient(from 0deg, transparent 0%, #10b981 25%, transparent 50%, #34d399 75%, transparent 100%)",
                  }}
                />

                {/* Inner Button Content */}
                <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10.5px] bg-emerald-50 dark:bg-[#072518] text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-100 dark:group-hover:bg-[#0c3826] transition-colors whitespace-nowrap">
                  <FiCalendar size={12} className="text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                  <span>Open calendar</span>
                  <FiArrowRight size={12} className="text-emerald-600 dark:text-emerald-400 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Month Heading - Commitment tab only; follows the month filter */}
      {activeTab === "commitment" && (
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          <FiCalendar size={16} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          {selectedMonth === "all" || selectedYear === "all"
            ? "All Months"
            : new Date(selectedYear, selectedMonth - 1, 1).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
        </h2>
      )}

      {/* Tab Content Display */}
      {activeTab === "daily" ? (
        <DailyWorkScheduleTab user={user} users={users} />
      ) : (
        <>
          {/* Reference Matching Filter UI Container */}
          <SmTaskFilters
            activeTab={activeTab}
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
              activeTab === "commitment"
                ? ["All", "Post", "Reels", "Stories"]
                : activeTab === "sme"
                  ? ["All", "Others Task"]
                  : ["All", "Post", "Reels", "Stories", "Others Task"]
            }
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            statuses={activeTab === "sme" ? NON_COMMITMENT_STATUSES : COMMITMENT_STATUSES}
            selectedCommitment={selectedCommitment}
            setSelectedCommitment={setSelectedCommitment}
            commitments={COMMITMENTS}
            dateFilterPreset={dateFilterPreset}
            setDateFilterPreset={setDateFilterPreset}
            dateFilterField={dateFilterField}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedDay={selectedDay}
            onMonthChange={(y, m, d) => {
              setSelectedYear(y);
              setSelectedMonth(m);
              setSelectedDay(d ?? null);
            }}
            setDateFieldType={setDateFieldType}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            filteredCount={filteredTotal}
            totalCount={hasPageData ? pageMeta?.totalAll || 0 : 0}
            currentCommitmentsCount={currentCommitmentsCount}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            setCurrentPage={setCurrentPage}
          />

          {/* Main Table Container */}
          <div className="bg-white dark:bg-[#0c1220] rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 overflow-hidden relative">
            {/* Shimmer loading bar when refetching */}
            {isRefreshing && (
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
                <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse w-full" />
              </div>
            )}


            <div className="overflow-x-auto">
              <table
                className={`w-full text-left leading-tight ${
                  selectedCommitment !== "No"
                    ? "text-[10px] [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-1.5"
                    : "text-[11px]"
                }`}
              >
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#131d31] text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    {selectedCommitment === "No" && (
                      <th className="py-2.5 px-2 text-center whitespace-nowrap w-10 font-bold text-slate-500 dark:text-slate-400">Sl.No</th>
                    )}
                    <th className={`py-2.5 px-3 ${selectedCommitment === "No" ? "min-w-[180px]" : "min-w-[150px]"}`}>Task</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Client</th>
                    {selectedCommitment === "No" && (
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Category</th>
                    )}
                    <th className="py-2.5 px-2.5 whitespace-nowrap">Content Type</th>
                    {selectedCommitment !== "No" && (
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Pillars</th>
                    )}
                    {selectedCommitment !== "No" && (
                      <th className="py-2.5 px-2.5 font-bold whitespace-nowrap">Platforms</th>
                    )}
                    <th className="py-2.5 px-3 whitespace-nowrap">Created by</th>
                    {selectedCommitment === "No" && (
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Due Date</th>
                    )}
                    {selectedCommitment !== "No" && (
                      <th className="py-2.5 px-3 bg-slate-100/60 dark:bg-[#182338] text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap">Publish Date</th>
                    )}
                    <th className="py-2.5 px-2 text-center whitespace-nowrap w-[90px]">Status</th>
                    {selectedCommitment === "No" && (
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Priority</th>
                    )}
                    <th className="py-2.5 px-3 min-w-[160px] max-w-[240px] whitespace-nowrap">Notes &amp; Brief</th>
                    {/* Commitment tab: Due Date sits at the end, plain (Publish Date is the main date) */}
                    {selectedCommitment !== "No" && (
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Due Date</th>
                    )}
                    {!hideCommitmentAction && (
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {showSkeleton ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr
                        key={`sm-task-skeleton-${idx}`}
                        className="animate-pulse border-b border-slate-100 dark:border-slate-800/60"
                      >
                        {/* Sl.No (SME tasks only) */}
                        {selectedCommitment === "No" && (
                          <td className="py-2 px-2 text-center">
                            <div className="h-3 w-4 bg-slate-200 dark:bg-slate-700/60 rounded mx-auto" />
                          </td>
                        )}

                        {/* Task */}
                        <td className="py-2 px-3">
                          <div className="space-y-1">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-36" />
                            <div className="h-2 bg-slate-200 dark:bg-slate-700/40 rounded w-24" />
                          </div>
                        </td>

                        {/* Client */}
                        <td className="py-2 px-3">
                          <div className="h-4.5 w-20 bg-slate-200 dark:bg-slate-700/60 rounded-full" />
                        </td>

                        {/* Category */}
                        {selectedCommitment === "No" && (
                          <td className="py-2 px-2.5">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-16" />
                          </td>
                        )}

                        {/* Content Type */}
                        <td className="py-2 px-2.5">
                          <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700/60 rounded-full" />
                        </td>

                        {/* Pillars (if Commitment) */}
                        {selectedCommitment !== "No" && (
                          <td className="py-2 px-2.5">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-16" />
                          </td>
                        )}

                        {/* Platforms (if Commitment) */}
                        {selectedCommitment !== "No" && (
                          <td className="py-2 px-2.5">
                            <div className="flex gap-1">
                              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/60" />
                              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/60" />
                              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/60" />
                            </div>
                          </td>
                        )}

                        {/* Created by */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4.5 h-4.5 rounded-full bg-slate-200 dark:bg-slate-700/60 shrink-0" />
                            <div className="h-2.5 bg-slate-200 dark:bg-slate-700/60 rounded w-14" />
                          </div>
                        </td>

                        {/* Due Date (SME tab position) */}
                        {selectedCommitment === "No" && (
                          <td className="py-2 px-2.5">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-14" />
                          </td>
                        )}

                        {/* Publish Date */}
                        {selectedCommitment !== "No" && (
                          <td className="py-2 px-3 bg-slate-100/30 dark:bg-[#182338]/30">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-14" />
                          </td>
                        )}

                        {/* Status */}
                        <td className="py-2 px-2.5">
                          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700/60 rounded-md" />
                        </td>

                        {/* Priority */}
                        {selectedCommitment === "No" && (
                          <td className="py-2 px-2">
                            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700/60 rounded-full mx-auto" />
                          </td>
                        )}

                        {/* Notes & Brief Skeleton */}
                        <td className="py-2 px-3">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-28" />
                        </td>

                        {/* Due Date (Commitment tab position: last) */}
                        {selectedCommitment !== "No" && (
                          <td className="py-2 px-2.5">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-14" />
                          </td>
                        )}

                        {/* Action */}
                        {!hideCommitmentAction && (
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700/60" />
                              <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700/60" />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : paginatedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={selectedCommitment === "No" ? (hideCommitmentAction ? 10 : 11) : (hideCommitmentAction ? 10 : 11)} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-[#162033] flex items-center justify-center text-blue-500 mb-3">
                            <FiCalendar size={22} />
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {activeTab === "daily" ? "No tasks scheduled for this date" : activeTab === "sme" ? "No SME tasks found" : "No commitment tasks found"}
                          </p>
                          <p className="text-xs text-slate-400 mb-4 max-w-sm text-center">
                            {activeTab === "daily" ? "Check back later or adjust the date filter above." : "Create your first social media task or plan directly on the Content Calendar."}
                          </p>
                          {(!isReadOnly && (!isSocialMediaHead || activeTab !== "commitment")) && (
                            <button
                              onClick={handleCreateNew}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                              + Create First Task
                            </button>
                          )}
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
                          className={`transition-colors group ${
                            isOverdue
                              ? "overdue-row-blink border-l-4 border-l-rose-500 hover:border-l-rose-600"
                              : "hover:bg-slate-50/80 dark:hover:bg-[#162033]/60"
                          }`}
                        >
                          {/* SL.NO (SME tasks only) */}
                          {selectedCommitment === "No" && (
                            <td className="py-2 px-2 text-center font-bold text-slate-500 dark:text-slate-400 font-mono text-[10px] whitespace-nowrap">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                          )}

                          {/* TASK NAME with Left Accent Line & SME Completion Checkbox */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-1 h-4 rounded-full shrink-0"
                                style={{ backgroundColor: clientColor }}
                              />

                              {/* SME Task Completion Checkbox */}
                              {(selectedCommitment === "No" || !task.commitment) && (
                                <button
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={(e) => handleToggleSmeTaskCompleted(task, e)}
                                  title={
                                    (task.status || "").trim().toLowerCase() === "completed"
                                      ? "Completed! Click to mark as Not started"
                                      : "Click to mark as Completed"
                                  }
                                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${(task.status || "").trim().toLowerCase() === "completed"
                                    ? "bg-emerald-500 border-emerald-600 text-white shadow-2xs hover:bg-emerald-600"
                                    : "border-slate-300 dark:border-[#374151] bg-white dark:bg-[#0b1120] text-transparent hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/20 shadow-2xs"
                                    } active:scale-95 disabled:cursor-not-allowed`}
                                >
                                  <FiCheck className="stroke-[3]" size={10} />
                                </button>
                              )}

                              <div className="min-w-0">
                                <span
                                  className={`font-bold leading-tight block text-[11px] transition-colors ${(task.status || "").trim().toLowerCase() === "completed" &&
                                    (selectedCommitment === "No" || !task.commitment)
                                    ? "text-slate-400 dark:text-slate-500 line-through"
                                    : "text-slate-900 dark:text-white"
                                    }`}
                                >
                                  {task.taskTitle}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* CLIENT */}
                          <td className="py-2 px-3">
                            {(() => {
                              const clientObj = getClientObject(task);
                              return (
                                <ClientBadge
                                  client={clientObj}
                                  size="sm"
                                  className="!text-[9.5px] !py-0.5 !px-2 rounded-md font-bold shadow-2xs whitespace-nowrap [&>span]:!max-w-none"
                                />
                              );
                            })()}
                          </td>

                          {/* CATEGORY (Sleek Tag Badge with Dot) */}
                          {selectedCommitment === "No" && (
                            <td className="py-2 px-2.5">
                              {(() => {
                                const catStyle = getCategoryStyle(task.category);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold border transition-colors shadow-2xs ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catStyle.dot}`} />
                                    <span className="whitespace-nowrap">{task.category || "Content"}</span>
                                  </span>
                                );
                              })()}
                            </td>
                          )}

                          {/* CONTENT TYPE (Pill Badge with Format Micro-Icon) */}
                          <td className="py-2 px-2.5">
                            {(() => {
                              const typeCfg = getContentTypeConfig(task.contentType);
                              const TypeIcon = typeCfg.icon;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border shadow-2xs transition-colors ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                                >
                                  <TypeIcon className={`w-2.5 h-2.5 shrink-0 ${typeCfg.iconClass}`} />
                                  <span className="whitespace-nowrap">{task.contentType || "Post"}</span>
                                </span>
                              );
                            })()}
                          </td>

                          {/* PILLARS (Commitment only) */}
                          {selectedCommitment !== "No" && (
                            <td className="py-2 px-2.5 max-w-[140px]">
                              {task.pillars && task.pillars.trim() ? (
                                <span
                                  className="text-slate-700 dark:text-slate-200 font-semibold line-clamp-2 leading-snug block"
                                  title={task.pillars}
                                >
                                  {task.pillars}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">-</span>
                              )}
                            </td>
                          )}

                          {/* PLATFORMS SUB-TASKS (Checklist with ticks) */}
                          {selectedCommitment !== "No" && (
                            <td className="py-2 px-2.5">
                              {renderPlatformSubtasks(task)}
                            </td>
                          )}

                          {/* CREATED BY */}
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {(() => {
                              const creator = getCreatorInfo(task);
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="relative shrink-0 w-5 h-5">
                                    {creator.avatarUrl ? (
                                      <img
                                        src={creator.avatarUrl}
                                        alt={creator.name}
                                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                                        loading="lazy"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                          if (fallback) fallback.style.display = "flex";
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className="avatar-fallback w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[9px] items-center justify-center uppercase shadow-2xs"
                                      style={{ display: creator.avatarUrl ? "none" : "flex" }}
                                    >
                                      {creator.initials}
                                    </div>
                                  </div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-[10px]" title={creator.name}>
                                    {creator.name}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* DUE DATE — SME tab: coloured badge (it is the main deadline there) */}
                          {selectedCommitment === "No" && (
                            <td className="py-2 px-2.5">
                              {renderDueDateBadge(task.dueDate, task.status)}
                            </td>
                          )}

                          {/* Columns visible only in Commitment: Publish Date */}
                          {selectedCommitment !== "No" && (
                            <td className="py-2 px-2.5">
                              {/* Same colour rules as Due Date (green done, red overdue/today), date only */}
                              {renderDueDateBadge(task.publishDate, task.status, true)}
                            </td>
                          )}

                          {/* STATUS - Interactive quick-change dropdown or Compact Read-only badge */}
                          <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const isComm = Boolean(task.commitment) || selectedCommitment === "Yes";
                              const currentDisplayStatus = getDisplayStatusForTask(task, selectedCommitment);
                              const options = isComm ? COMMITMENT_STATUS_OPTIONS : NON_COMMITMENT_STATUS_OPTIONS;
                              const isStatusDisabled = isReadOnly || (isSocialMediaHead && isComm);

                              if (isStatusDisabled) {
                                const s = (currentDisplayStatus || "").trim();
                                let line1 = s;
                                let line2 = "";

                                const sLower = s.toLowerCase();
                                if (sLower.includes("client approval")) {
                                  line1 = "Client approval";
                                  line2 = "Pending";
                                } else if (sLower.includes("waiting for response") || sLower.includes("response")) {
                                  line1 = "Waiting for";
                                  line2 = "Response";
                                } else if (sLower.includes("published live") || sLower.includes("published")) {
                                  line1 = "Published";
                                  line2 = "Live";
                                } else if (sLower.includes("not started")) {
                                  line1 = "Not";
                                  line2 = "Started";
                                } else if (sLower.includes("in progress") || sLower === "inprogress") {
                                  line1 = "In";
                                  line2 = "Progress";
                                }

                                return (
                                  <div
                                    className={`inline-flex flex-col items-center justify-center text-center px-2 py-0.5 rounded-md border shadow-2xs cursor-default mx-auto ${getTableStatusStyle(currentDisplayStatus)}`}
                                    style={{ minWidth: "70px", maxWidth: "105px" }}
                                    title={currentDisplayStatus}
                                  >
                                    <span className="text-[9px] font-bold leading-tight whitespace-nowrap">
                                      {line1}
                                    </span>
                                    {line2 && (
                                      <span className="text-[8px] font-extrabold leading-tight opacity-90 whitespace-nowrap uppercase tracking-wider">
                                        {line2}
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <select
                                  value={currentDisplayStatus}
                                  disabled={isStatusDisabled}
                                  onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                                  className={`table-status-select ${isStatusDisabled ? "cursor-default opacity-90" : "cursor-pointer"} text-[9.5px] py-1 px-1.5 max-w-[110px] rounded-md border focus:ring-1 focus:ring-indigo-500 shadow-2xs font-semibold ${getTableStatusStyle(currentDisplayStatus)}`}
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
                          {selectedCommitment === "No" && (
                            <td className="py-2 px-2 text-center font-bold text-[10px]">
                              {task.priority === "High" && <span className="text-rose-600 dark:text-rose-400">High</span>}
                              {task.priority === "Medium" && <span className="text-amber-600 dark:text-amber-400">Medium</span>}
                              {task.priority === "Low" && <span className="text-slate-500 dark:text-slate-400">Low</span>}
                            </td>
                          )}

                          {/* Notes & Brief - Visible in both Commitment and SME tasks tabs */}
                          {(
                            <td className="py-2 px-3 max-w-[240px]">
                              {task.notes && task.notes.trim() ? (
                                <span
                                  className="text-slate-600 dark:text-slate-300 text-[10px] line-clamp-2 leading-relaxed block"
                                  title={task.notes}
                                >
                                  {task.notes}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">-</span>
                              )}
                            </td>
                          )}

                          {/* DUE DATE — Commitment tab: last column, plain text (no colour) */}
                          {selectedCommitment !== "No" && (
                            <td className="py-2 px-2.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatDisplayDate(task.dueDate)}
                            </td>
                          )}

                          {/* ACTIONS */}
                          {!hideCommitmentAction && (
                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const isComm = Boolean(task.commitment) || selectedCommitment === "Yes";
                                const isRowReadOnly = isReadOnly || (isSocialMediaHead && isComm);
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditTask(task)}
                                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      title={isRowReadOnly ? "View Task" : "Edit Task"}
                                    >
                                      <FiEdit2 size={13} />
                                    </button>
                                    {!isRowReadOnly && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteTask(task, e)}
                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                        title="Delete Task"
                                      >
                                        <FiTrash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          )}
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
                    {filteredTotal > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(currentPage * itemsPerPage, filteredTotal)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {filteredTotal}
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
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
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
        </>
      )}

      {/* Task Creation / Edit Modal */}
      <SmTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTaskForEdit}
        isReadOnly={isReadOnly || (isSocialMediaHead && Boolean(selectedTaskForEdit?.commitment))}
        initialCommitment={isSocialMediaHead ? false : activeTab !== "sme"}
      />

      {/* Pending Commitment Modal (Detailed Client Breakdown) */}
      {isPendingCommitmentOpen && (
      <PendingCommitmentModal
        isOpen={isPendingCommitmentOpen}
        onClose={() => setIsPendingCommitmentOpen(false)}
        clients={activeClients}
        tasks={pendingModalTasks}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        onSelectClient={(clientName) => {
          setSelectedClient(clientName);
          setCurrentPage(1);
        }}
        onCreateTaskForClient={isReadOnly || isSocialMediaHead ? null : (clientObj) => {
          setSelectedTaskForEdit({
            client: clientObj?._id,
            clientName: clientObj?.companyName,
            clientColor: clientObj?.color,
          });
          setIsModalOpen(true);
        }}
      />
      )}

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

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirm({ show: false, target: null, tabName: "" })}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-2xl border border-slate-200/80 dark:border-white/10 z-10 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mb-4 ring-4 ring-rose-500/10">
                <FiTrash2 size={22} className="animate-pulse" />
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                Delete {deleteConfirm.tabName} Task
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Are you sure you want to permanently delete "{deleteConfirm.target?.taskTitle}"? This action cannot be undone.
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirm({ show: false, target: null, tabName: "" })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-rose-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(SmTasks);
