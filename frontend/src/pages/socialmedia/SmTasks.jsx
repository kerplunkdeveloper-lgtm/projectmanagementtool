import React, { useState, useEffect, useMemo, useRef } from "react";
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
import SmTaskCards from "./SmTaskCards";
import SmTaskFilters from "./SmTaskFilters";

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
  const isLive = status === "Live" || status === "Completed";

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
          • {status === "Live" ? "Live" : "Done"}
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
  if (["Completed", "Live"].includes(task.status)) return false;
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

// Rich Category Styling (Curated tag theme with colored dot)
const getCategoryStyle = (category) => {
  const cat = (category || "Content").trim().toLowerCase();
  switch (cat) {
    case "content":
      return {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-700 dark:text-indigo-300",
        border: "border-indigo-200/90 dark:border-indigo-800/60",
        dot: "bg-indigo-500",
      };
    case "copy":
      return {
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-700 dark:text-teal-300",
        border: "border-teal-200/90 dark:border-teal-800/60",
        dot: "bg-teal-500",
      };
    case "posting":
      return {
        bg: "bg-sky-50 dark:bg-sky-950/40",
        text: "text-sky-700 dark:text-sky-300",
        border: "border-sky-200/90 dark:border-sky-800/60",
        dot: "bg-sky-500",
      };
    case "engagement":
      return {
        bg: "bg-pink-50 dark:bg-pink-950/40",
        text: "text-pink-700 dark:text-pink-300",
        border: "border-pink-200/90 dark:border-pink-800/60",
        dot: "bg-pink-500",
      };
    case "client":
      return {
        bg: "bg-purple-50 dark:bg-purple-950/40",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200/90 dark:border-purple-800/60",
        dot: "bg-purple-500",
      };
    case "ads":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200/90 dark:border-rose-800/60",
        dot: "bg-rose-500",
      };
    case "strategy":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200/90 dark:border-amber-800/60",
        dot: "bg-amber-500",
      };
    case "reporting":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/90 dark:border-emerald-800/60",
        dot: "bg-emerald-500",
      };
    case "calendar":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200/90 dark:border-blue-800/60",
        dot: "bg-blue-500",
      };
    case "audit":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/40",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200/90 dark:border-orange-800/60",
        dot: "bg-orange-500",
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

// Helper to identify Social Media Managers
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
    desig.includes("social media") ||
    desig.includes("smm")
  );
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

  // Role check: Only admin and operation manager can see all users' tasks and filter by Created By
  const userRoleClean = (user?.role || role || "").toLowerCase().replace(/[\s_]/g, "");
  const canFilterByCreatedBy = userRoleClean === "admin" || userRoleClean === "operationmanager";
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedContentType, setSelectedContentType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCommitment, setSelectedCommitment] = useState("All");

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

  // Dynamic unique creators list for Admin & Operation Manager filter - ONLY Social Media Managers
  const createdByOptions = useMemo(() => {
    const nameMap = new Map();

    // 1. All active Social Media Managers in users list
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
          if (["Completed", "Live"].includes(task.status)) return false;
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
  ]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;

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



  const hasActiveFilters = useMemo(() => {
    return (
      selectedClient !== "All" ||
      selectedCreatedBy !== "All" ||
      selectedCategory !== "All" ||
      selectedContentType !== "All" ||
      selectedStatus !== "All" ||
      selectedPriority !== "All" ||
      selectedCommitment !== "All" ||
      dateFilterPreset !== "All" ||
      Boolean(customStartDate) ||
      Boolean(customEndDate) ||
      atRiskOnly ||
      searchQuery.trim().length > 0
    );
  }, [
    selectedClient,
    selectedCreatedBy,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedPriority,
    selectedCommitment,
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
    setSelectedCategory("All");
    setSelectedContentType("All");
    setSelectedStatus("All");
    setSelectedPriority("All");
    setSelectedCommitment("All");
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

  const handleQuickStatusChange = (task, newStatus) => {
    if (isReadOnly) return;
    dispatch(updateSocialmediaTask({ id: task._id, data: { status: newStatus } }));
  };

  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    if (window.confirm(`Are you sure you want to delete "${task.taskTitle}"?`)) {
      dispatch(deleteSocialmediaTask(task._id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-2 space-y-6">
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
          {/* Month Selector Dropdown (Image 1) */}
          <div className="relative">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {[-2, -1, 0, 1, 2].map((offset) => {
                const d = new Date(currentNow.getFullYear(), currentNow.getMonth() + offset, 1);
                const m = d.getMonth() + 1;
                const y = d.getFullYear();
                return (
                  <option key={`${y}-${m}`} value={`${y}-${m}`}>
                    {MONTH_NAMES[m - 1]} {y}
                  </option>
                );
              })}
            </select>
            <FiCalendar
              size={13}
              className="absolute left-[-1]  top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <FiChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <FiPlus size={15} className="stroke-[2.5]" />
              <span>Create task</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Banner (Image 1 style) */}
      <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
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
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:textwhite0 hover:text-emerald-800 dark:hover:textwhite0 transition-colors shrink-0 whitespace-nowrap self-end md:self-auto cursor-pointer"
        >
          <span>Open calendar</span>
          <FiArrowRight size={14} />
        </button>
      </div>

      {/* Commitments Overview Section (Cards) */}
      <SmTaskCards
        selectedClient={selectedClient}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        hasActiveFilters={hasActiveFilters}
        commitmentOverview={commitmentOverview}
        onOpenPendingCommitment={() => setIsPendingCommitmentOpen(true)}
        atRiskOnly={atRiskOnly}
        setAtRiskOnly={setAtRiskOnly}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        setCurrentPage={setCurrentPage}
      />

      {/* Reference Matching Filter UI Container */}
      <SmTaskFilters
        searchQuery={searchQuery}
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
        contentTypes={CONTENT_TYPES}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statuses={STATUSES}
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
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
                  <th className="py-3 px-3 bg-slate-100/50 dark:bg-slate-800/80 font-bold">Calendar</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {loading && tasks.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 italic">
                      Loading social media tasks...
                    </td>
                  </tr>
                ) : paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center">
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
                        <td className="py-3 px-4">
                          {(() => {
                            const clientObj = getClientObject(task);
                            return (
                              <ClientBadge
                                client={clientObj}
                                size="md"
                                className="!text-[11px] !py-1 !px-2.5 rounded-lg font-bold shadow-2xs max-w-[170px]"
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
                                <span className="truncate max-w-[90px]">{task.category || "Content"}</span>
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
                                <span className="truncate max-w-[85px]">{task.contentType || "Post"}</span>
                              </span>
                            );
                          })()}
                        </td>

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
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={creator.name}>
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
                          <select
                            value={task.status}
                            disabled={isReadOnly}
                            onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                            className={`table-status-select ${isReadOnly ? "cursor-default opacity-90" : "cursor-pointer"} focus:ring-1 focus:ring-indigo-500 shadow-2xs ${task.status === "In QC"
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
      </div>
      );
};

      export default SmTasks;
