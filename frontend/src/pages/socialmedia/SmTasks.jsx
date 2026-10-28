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
import SearchableDropdown from "../../components/common/SearchableDropdown";

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
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const clientDropdownRef = useRef(null);
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
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close popover dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setIsClientDropdownOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setIsDateDropdownOpen(false);
      }
    };
    if (isClientDropdownOpen || isDateDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClientDropdownOpen, isDateDropdownOpen]);

  const dateFilterLabel = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `${customStartDate} → ${customEndDate}`;
    }
    if (customStartDate) {
      return `Date: ${customStartDate}`;
    }
    if (dateFilterPreset !== "All") {
      return `Date: ${dateFilterPreset}`;
    }
    return "Date";
  }, [dateFilterPreset, customStartDate, customEndDate]);

  const isDateFilterActive = useMemo(() => {
    return dateFilterPreset !== "All" || Boolean(customStartDate) || Boolean(customEndDate);
  }, [dateFilterPreset, customStartDate, customEndDate]);

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

  // Filtered client options matching search box inside dropdown
  const filteredClientOptions = useMemo(() => {
    const list = clientOptions.filter((c) => c !== "All");
    if (!clientSearchQuery.trim()) return list;
    const q = clientSearchQuery.trim().toLowerCase();
    return list.filter((c) => c.toLowerCase().includes(q));
  }, [clientOptions, clientSearchQuery]);

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
    setIsClientDropdownOpen(false);
    setClientSearchQuery("");
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
    setIsDateDropdownOpen(false);
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
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <FiRepeat size={16} />
          </div>
          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
            <span className="font-bold">Every row here is also a calendar card.</span> Give a task a publish date and
            it drops onto the content calendar in that slot — no second entry, no "add to calendar" step.
          </p>
        </div>

        <button
          onClick={handleOpenCalendar}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-100 transition-colors shrink-0 whitespace-nowrap self-end md:self-auto cursor-pointer"
        >
          <span>Open calendar</span>
          <FiArrowRight size={14} />
        </button>
      </div>

      {/* Commitments Overview Section (Posts, Reels, Stories & Health Monitors) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Section Header: Title, Subtitle, Overall Deliverables summary & Client Modal Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40 shrink-0">
              <FiCalendar size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {selectedClient !== "All"
                    ? `${selectedClient} Commitments`
                    : `${MONTH_NAMES[selectedMonth - 1]} Commitments`}
                </h3>
                {selectedClient !== "All" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Filtered by Client
                  </span>
                )}
                {hasActiveFilters && selectedClient === "All" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Filtered View
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {selectedClient !== "All"
                  ? `Tracking deliverables for ${selectedClient} • ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                  : `Track your deliverables across clients • ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Deliverables summary badge */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-slate-400 font-medium">Deliverables:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {commitmentOverview.totalDeliverablesPublished}
              </span>
              <span>/</span>
              <span>{commitmentOverview.totalDeliverablesCommitted}</span>
              <span className="text-slate-400 font-normal">
                ({commitmentOverview.deliverablesProgressPct}%)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPendingCommitmentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
            >
              <FiBarChart2 size={14} className="text-indigo-500" />
              <span>View by client</span>
            </button>
          </div>
        </div>

        {/* 5-Card Metrics Grid: Posts, Reels, Stories, At Risk, Awaiting Approval */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* Card 1: Posts Progress Card */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                  <FiImage size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-base font-black text-slate-900 dark:text-white leading-none block truncate">
                    {commitmentOverview.totalPostsCommitted} Posts
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">committed</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block leading-none">
                  {commitmentOverview.totalPostsPublished}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">published</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-bold text-slate-400">Progress</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  {commitmentOverview.postsProgressPct}%
                </span>
              </div>
              <div className="h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, commitmentOverview.postsProgressPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Reels Progress Card */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/40 shrink-0">
                  <FiPlay size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-base font-black text-slate-900 dark:text-white leading-none block truncate">
                    {commitmentOverview.totalReelsCommitted} Reels
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">committed</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-purple-600 dark:text-purple-400 block leading-none">
                  {commitmentOverview.totalReelsPublished}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">published</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-bold text-slate-400">Progress</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  {commitmentOverview.reelsProgressPct}%
                </span>
              </div>
              <div className="h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, commitmentOverview.reelsProgressPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Stories Progress Card (NEW) */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/60 p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40 shrink-0">
                  <FiZap size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-base font-black text-slate-900 dark:text-white leading-none block truncate">
                    {commitmentOverview.totalStoriesCommitted} Stories
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">committed</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 block leading-none">
                  {commitmentOverview.totalStoriesPublished}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">published</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-bold text-slate-400">Progress</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  {commitmentOverview.storiesProgressPct}%
                </span>
              </div>
              <div className="h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, commitmentOverview.storiesProgressPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: At Risk Card (Interactive Filter Toggle) */}
          <div
            onClick={() => setAtRiskOnly((prev) => !prev)}
            title={atRiskOnly ? "Click to clear At risk filter" : "Click to view only At risk tasks"}
            className={`border p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 space-y-2.5 cursor-pointer select-none ${atRiskOnly
                ? "bg-rose-100/70 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/40"
                : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-800"
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FiAlertCircle size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-base font-black text-rose-600 dark:text-rose-400 leading-none block truncate">
                    {commitmentOverview.atRiskCount} At risk
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">due &le; 24h</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${atRiskOnly
                    ? "bg-rose-600 text-white"
                    : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
                  }`}
              >
                {atRiskOnly ? "Active" : "Action"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-rose-100 dark:border-rose-900/30">
              <span>{atRiskOnly ? "Clear filter" : "Filter at-risk"}</span>
              <FiArrowRight size={12} className={atRiskOnly ? "rotate-180" : ""} />
            </div>
          </div>

          {/* Card 5: Awaiting Approval Card (Interactive Status Filter Toggle) */}
          <div
            onClick={() => {
              setSelectedStatus((prev) => (prev === "In QC" ? "All" : "In QC"));
              setCurrentPage(1);
            }}
            title={selectedStatus === "In QC" ? "Click to clear In QC filter" : "Click to view In QC tasks"}
            className={`border p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 space-y-2.5 cursor-pointer select-none ${selectedStatus === "In QC"
                ? "bg-amber-100/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/40"
                : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800"
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FiClock size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 leading-none block truncate">
                    {commitmentOverview.awaitingApprovalCount} In QC
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">awaiting approval</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${selectedStatus === "In QC"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                  }`}
              >
                {selectedStatus === "In QC" ? "Active" : "Review"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 pt-1 border-t border-amber-100 dark:border-amber-900/30">
              <span>{selectedStatus === "In QC" ? "Clear filter" : "Filter In QC"}</span>
              <FiArrowRight size={12} className={selectedStatus === "In QC" ? "rotate-180" : ""} />
            </div>
          </div>
        </div>
      </div>

      {/* Reference Matching Filter UI Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Search Input & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80 md:w-96">
           
            <input
              type="text"
              placeholder="Search tasks, clients, creators..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-[13px] font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Action Controls: Export to Excel + At Risk Toggle */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-xs sm:text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-sm shadow-blue-500/25 shrink-0"
              title="Export filtered tasks to Excel"
            >
              <FiDownload size={14} className="stroke-[2.5]" />
              <span>Export to Excel</span>
            </button>

            {/* At Risk Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setAtRiskOnly(!atRiskOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-2 px-3.5 h-10 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer border shrink-0 shadow-2xs ${
                atRiskOnly
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300"
              }`}
              title="Filter tasks at risk (due in <= 24 hours)"
            >
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/60 shrink-0"></span>
              </span>
              <span>At risk</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Pills Row */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* FILTERS: Label */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 select-none mr-1">
            <FiFilter size={14} className="text-blue-500" />
            <span>FILTERS:</span>
          </div>

          {/* Client Filter - Searchable Dropdown */}
          <div className="relative" ref={clientDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsClientDropdownOpen(!isClientDropdownOpen);
                setClientSearchQuery("");
              }}
              className={`toolbar-filter-btn ${selectedClient !== "All" ? "is-active" : ""}`}
              title="Filter by Client"
            >
              <span className="truncate max-w-[120px]">
                {selectedClient === "All" ? "All clients" : selectedClient}
              </span>
              <FiChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                  isClientDropdownOpen ? "rotate-180 text-blue-500" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu with Search Box */}
            {isClientDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {/* Search Box */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="client-dropdown-search-input w-full"
                      autoFocus
                    />
                    {clientSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setClientSearchQuery("")}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear"
                      >
                        <FiX size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Clients Options List */}
                <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar text-xs">
                  {/* All clients option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient("All");
                      setCurrentPage(1);
                      setIsClientDropdownOpen(false);
                      setClientSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      selectedClient === "All"
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>All clients</span>
                    {selectedClient === "All" && <FiCheck size={13} className="text-blue-600 shrink-0" />}
                  </button>

                  {/* Filtered Clients */}
                  {filteredClientOptions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                      No clients found
                    </div>
                  ) : (
                    filteredClientOptions.map((client) => {
                      const isSelected = selectedClient === client;
                      return (
                        <button
                          key={client}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client);
                            setCurrentPage(1);
                            setIsClientDropdownOpen(false);
                            setClientSearchQuery("");
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="truncate pr-2">{client}</span>
                          {isSelected && <FiCheck size={13} className="text-blue-600 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Created by Filter (Admin & Operation Manager only - Social Media Managers) */}
          {canFilterByCreatedBy ? (
            <SearchableDropdown
              value={selectedCreatedBy}
              onChange={(val) => {
                setSelectedCreatedBy(val);
                setCurrentPage(1);
              }}
              options={createdByOptions.filter((c) => c !== "All")}
              allLabel="Created by (SMM)"
              placeholder="Created by (SMM)"
              searchPlaceholder="Search creator..."
              emptyText="No creators found"
              menuWidth="w-64"
              buttonClassName="toolbar-filter-btn"
            />
          ) : (
            <div
              className="toolbar-filter-btn cursor-default select-none opacity-85"
              title="Viewing tasks created by you"
            >
              <span className="truncate max-w-[130px]">{user?.name || "Created by (SMM)"}</span>
              <FiChevronDown size={14} className="text-slate-400 shrink-0" />
            </div>
          )}

    

          {/* Content Type Filter */}
          <select
            value={selectedContentType}
            onChange={(e) => {
              setSelectedContentType(e.target.value);
              setCurrentPage(1);
            }}
            className={`toolbar-filter-select ${selectedContentType !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Content type</option>
            {CONTENT_TYPES.filter((c) => c !== "All").map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className={`toolbar-filter-select ${selectedStatus !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Status</option>
            {STATUSES.filter((c) => c !== "All").map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
            className={`toolbar-filter-select ${selectedPriority !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Priority</option>
            {PRIORITIES.filter((c) => c !== "All").map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          {/* Commitment Filter */}
          <select
            value={selectedCommitment}
            onChange={(e) => {
              setSelectedCommitment(e.target.value);
              setCurrentPage(1);
            }}
            className={`toolbar-filter-select ${selectedCommitment !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Commitment</option>
            {COMMITMENTS.filter((c) => c !== "All").map((com) => (
              <option key={com} value={com}>
                {com}
              </option>
            ))}
          </select>

          {/* Date Filter Popover */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`toolbar-filter-btn ${isDateFilterActive ? "is-active" : ""}`}
              title="Filter by Date"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                <FiCalendar size={13} className={isDateFilterActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                <span className="truncate">{dateFilterLabel}</span>
              </div>
              <FiChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                  isDateDropdownOpen ? "rotate-180 text-blue-500" : ""
                }`}
              />
            </button>

            {/* Date Filter Popover Menu */}
            {isDateDropdownOpen && (
              <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-72 sm:w-80 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                    <FiCalendar size={14} className="text-indigo-500" />
                    <span>Filter by Date</span>
                  </div>
                  {isDateFilterActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterPreset("All");
                        setCustomStartDate("");
                        setCustomEndDate("");
                        setCurrentPage(1);
                      }}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Reset date
                    </button>
                  )}
                </div>

                {/* Target Date Field (Any Date vs Publish Date vs Due Date) */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Match Date Field
                  </span>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => { setDateFieldType("any"); setCurrentPage(1); }}
                      className={`py-1 rounded-lg transition-all cursor-pointer ${
                        dateFilterField === "any"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Any Date
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDateFieldType("publish"); setCurrentPage(1); }}
                      className={`py-1 rounded-lg transition-all cursor-pointer ${
                        dateFilterField === "publish"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDateFieldType("due"); setCurrentPage(1); }}
                      className={`py-1 rounded-lg transition-all cursor-pointer ${
                        dateFilterField === "due"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Due Date
                    </button>
                  </div>
                </div>

                {/* Quick Presets Grid */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick Presets
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: "All", label: "All Dates" },
                      { id: "Today", label: "Today" },
                      { id: "Tomorrow", label: "Tomorrow" },
                      { id: "This Week", label: "This Week" },
                      { id: "This Month", label: "This Month" },
                      { id: "Overdue", label: "Overdue" },
                    ].map((p) => {
                      const isSelected = dateFilterPreset === p.id && !customStartDate && !customEndDate;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setDateFilterPreset(p.id);
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setCurrentPage(1);
                            if (p.id !== "Custom") {
                              setIsDateDropdownOpen(false);
                            }
                          }}
                          className={`py-1.5 px-2 rounded-xl text-center font-semibold transition-all cursor-pointer border shadow-2xs ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-extrabold"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pick Date or Range
                    </span>
                    {(customStartDate || customEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStartDate("");
                          setCustomEndDate("");
                          setDateFilterPreset("All");
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Clear inputs
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        From / Specific
                      </span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          setDateFilterPreset("Custom");
                          setCurrentPage(1);
                        }}
                        className="date-filter-picker-input w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        To (Optional)
                      </span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          setDateFilterPreset("Custom");
                          setCurrentPage(1);
                        }}
                        className="date-filter-picker-input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Done Button */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDateDropdownOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Meta Info (Showing X of Y tasks · Z are calendar commitments) */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="font-bold text-slate-900 dark:text-white">{filteredTasks.length}</strong> of{" "}
            <strong className="font-bold text-slate-900 dark:text-white">{uniqueTasks.length}</strong> tasks ·{" "}
            <strong className="font-bold text-blue-600 dark:text-blue-400">{currentCommitmentsCount}</strong> are calendar commitments
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              title="Reset all active filters"
            >
              <FiRotateCcw size={12} />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
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
