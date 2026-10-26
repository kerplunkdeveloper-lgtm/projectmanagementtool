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
} from "react-icons/fi";
import ClientBadge from "../../components/common/ClientBadge";
import {
  getSocialmediaTasks,
  getSocialmediaStats,
  updateSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";

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

  const handleOpenCalendar = () => {
    navigate(`/${role}/content-calendar`);
  };

  const handleEditTask = (task) => {
    setSelectedTaskForEdit(task);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedTaskForEdit(null);
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = (task, newStatus) => {
    dispatch(updateSocialmediaTask({ id: task._id, data: { status: newStatus } }));
  };

  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${task.taskTitle}"?`)) {
      dispatch(deleteSocialmediaTask(task._id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100  p-2 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            Social Media Manager
          </span>
          <h1 className="text-2xl  font-extrabold text-slate-900 dark:text-white tracking-tight">
            My tasks
          </h1>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all self-start sm:self-auto cursor-pointer"
        >
          <FiPlus size={16} className="stroke-[2.5]" />
          <span>+ New task</span>
        </button>
      </div>

      {/* Synchronized Banner (Image 1 style) */}
      <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <FiRepeat size={16} />
          </div>
          <p className="text-xs  text-emerald-900 dark:text-emerald-200 font-medium">
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

      {/* SaaS Filter Controls Toolbar - 2-Tier Clean Alignment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3.5">
        {/* Row 1: Search Input & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Prominent Search Input */}
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search tasks, clients, creators..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="toolbar-search-input w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* At Risk Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setAtRiskOnly(!atRiskOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-2 px-3.5 h-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                atRiskOnly
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>At risk</span>
            </button>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 h-[36px] rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors cursor-pointer shadow-2xs"
                title="Reset all active filters"
              >
                <FiRotateCcw size={13} />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filter Select Dropdowns with No Text Clipping & No Horizontal Scrollbars */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0 select-none">
            <FiFilter size={12} className="text-indigo-500" />
            <span>Filters:</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black leading-none">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {/* Client Filter - Searchable Dropdown */}
          <div className="relative" ref={clientDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsClientDropdownOpen(!isClientDropdownOpen);
                setClientSearchQuery("");
              }}
              className={`inline-flex items-center justify-between gap-2 px-3 h-[34px] rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                selectedClient !== "All"
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold"
                  : isClientDropdownOpen
                  ? "bg-slate-50 dark:bg-slate-800 border-blue-400 dark:border-blue-500 text-slate-900 dark:text-white"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
              title="Filter by Client"
            >
              <span className="truncate max-w-[120px]">
                {selectedClient === "All" ? "All clients" : selectedClient}
              </span>
              <FiChevronDown
                size={13}
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
                    <FiSearch size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
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
          {canFilterByCreatedBy && (
            <select
              value={selectedCreatedBy}
              onChange={(e) => {
                setSelectedCreatedBy(e.target.value);
                setCurrentPage(1);
              }}
              className={`toolbar-filter-select ${selectedCreatedBy !== "All" ? "is-active" : ""}`}
            >
              <option value="All">Created by (SMM)</option>
              {createdByOptions
                .filter((c) => c !== "All")
                .map((creator) => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
            </select>
          )}

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className={`toolbar-filter-select ${selectedCategory !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Category</option>
            {CATEGORIES.filter((c) => c !== "All").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

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

          {/* Comprehensive Date Filter Popover */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`inline-flex items-center justify-between gap-1.5 px-3 h-[34px] rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isDateFilterActive
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold"
                  : isDateDropdownOpen
                  ? "bg-slate-50 dark:bg-slate-800 border-blue-400 dark:border-blue-500 text-slate-900 dark:text-white"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
              title="Filter by Date"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                <FiCalendar size={13} className={isDateFilterActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                <span className="truncate">{dateFilterLabel}</span>
              </div>
              <FiChevronDown
                size={13}
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

        {/* Counter Info matching Image 1 - 100% Dynamic */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredTasks.length}</span> of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">{uniqueTasks.length}</span> tasks ·{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentCommitmentsCount}</span> are calendar
            commitments
          </div>
          {hasActiveFilters && (
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
              Filtered ({filteredTasks.length} of {uniqueTasks.length})
            </span>
          )}
        </div>
      </div>

      {/* Main Table (Matching 1st Image) */}
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
                <th className="py-3 px-3 bg-slate-100/50 dark:bg-slate-800/80 font-bold">Commitment</th>
                <th className="py-3 px-3 bg-slate-100/50 dark:bg-slate-800/80 font-bold">Calendar</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 italic">
                    Loading social media tasks...
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center">
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

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
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
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {formatDisplayDate(task.dueDate)}
                      </td>

                      {/* STATUS - Interactive quick-change dropdown */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                          className={`table-status-select cursor-pointer focus:ring-1 focus:ring-indigo-500 shadow-2xs ${
                            task.status === "In QC"
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

                      {/* COMMITMENT (Shaded column) */}
                      <td className="py-3 px-3 bg-slate-50/60 dark:bg-slate-800/40">
                        {task.commitment ? (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400">
                            <FiLock size={11} className="opacity-70" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                            <FiLock size={11} className="opacity-40" />
                            <span>No</span>
                          </span>
                        )}
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
                            title="Edit Task"
                          >
                            <FiEye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(task, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <FiTrash2 size={14} />
                          </button>
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
      />
    </div>
  );
};

export default SmTasks;
