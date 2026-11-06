import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGoogle,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiSearch,
  FiPlus,
  FiFilter,
  FiGrid,
  FiList,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiCheck,
  FiTrendingUp,
  FiX,
  FiLayers,
  FiMenu,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiLock,
  FiEye,
  FiDownload,
  FiPlay,
  FiImage,
  FiVideo,
  FiFilm,
  FiZap,
  FiBarChart2,
  FiTarget,
  FiArrowRight,
  FiUpload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSocialmediaTasks,
  getSocialmediaStats,
  rescheduleSocialmediaTask,
  deleteSocialmediaTask,
  updateSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import SmTaskModal from "./SmTaskModal";
import SmTaskCards from "./SmTaskCards";
import SmPlatformWarningModal from "./SmPlatformWarningModal";
import SmImportExcelModal from "./SmImportExcelModal";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import PendingCommitmentModal from "../../components/common/PendingCommitmentModal";
import {
  computeAllClientsCommitments,
  computeSingleClientCommitments,
  formatCommitmentDate,
} from "../../utils/smCommitmentUtils";
import { formatLocalDateKey } from "../../utils/dateUtils";
import calendarMascotImg from "../../../public/assets/calendorchar.png";

const ALL_PLATFORMS_MAP = [
  { id: "Instagram", name: "Instagram", icon: FaInstagram, color: "#E1306C" },
  { id: "Facebook", name: "Facebook", icon: FaFacebook, color: "#1877F2" },
  { id: "YouTube", name: "YouTube", icon: FaYoutube, color: "#FF0000" },
  { id: "GMB", name: "GMB", icon: FaGoogle, color: "#4285F4" },
  { id: "Twitter", name: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
  { id: "LinkedIn", name: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORIES = [
  "All",
  "Content Calendar",
  "Content Creation",
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
  "Reel",
  "Story",
];
const STATUSES = [
  "All",
  "Not started",
  "Inprogress",
  "QC",
  "Completed and wait CLient Approval",
  "Published Live",
];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const COMMITMENTS = ["All", "Yes", "No"];

// Full Page Centered Loading Component with 3D Mascot Character Animation & Ambient Glow
const FullPageCalendarLoader = ({ monthName = "", year = "" }) => {
  return (
    <motion.div
      key="calendar-fullpage-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#060a14]/90 backdrop-blur-md overflow-hidden select-none pointer-events-auto"
    >
      {/* Ambient Floating Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1s]" />

      {/* Main Glassmorphic Centered Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: -10 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md p-7 sm:p-9 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1e2a40] shadow-2xl shadow-indigo-500/20 backdrop-blur-xl flex flex-col items-center text-center overflow-hidden"
      >
        {/* Subtle decorative top neon bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* 3D Mascot Character Hero with Floating Animation and Glowing Aura */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Ambient Outer Aura Glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-pink-500/20 blur-2xl animate-pulse pointer-events-none" />

          {/* Mascot Image with Gentle Bobbing / Floating Motion */}
          <motion.div
            animate={{
              y: [0, -7, 0],
              rotate: [0, 1.2, -1.2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-indigo-500/25 shadow-2xl shadow-indigo-500/30 bg-[#0f172a] flex items-center justify-center border border-indigo-500/30"
          >
            <img
              src={calendarMascotImg}
              alt="Content Calendar Mascot"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Title & Status Chip */}
        <div className="space-y-1.5 mb-5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Loading Calendar</span>
            <span className="flex gap-0.5 ml-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
            </span>
          </h3>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs">
            Organizing deliverables & publishing schedule for{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {monthName} {year}
            </span>
          </p>
        </div>

        {/* Smooth Gradient Progress Bar */}
        <div className="w-full max-w-xs h-2 bg-slate-200/80 dark:bg-[#162033] border border-slate-200/80 dark:border-[#23334d] rounded-full overflow-hidden relative mb-5 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            initial={{ x: "-100%", width: "45%" }}
            animate={{ x: "260%" }}
            transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
          />
        </div>

        {/* Status Micro-checklist Indicators */}
        <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Posts & Reels</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse [animation-delay:0.2s]" />
            <span className="text-slate-600 dark:text-slate-300">Deliverables</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse [animation-delay:0.4s]" />
            <span className="text-slate-600 dark:text-slate-300">QC Status</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ContentCalendar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "admin";
  const userRoleClean = (user?.role || role || "").toLowerCase().replace(/[\s_]/g, "");
  const deptLower = (user?.department || "").toLowerCase();
  const isSocialMediaManagerRole =
    userRoleClean === "socialmediamanager" ||
    userRoleClean === "socialmediahead" ||
    deptLower.includes("social media head");

  const isPrivileged =
    userRoleClean === "admin" ||
    userRoleClean === "operationmanager" ||
    isSocialMediaManagerRole;
  const canFilterBySMM = isPrivileged;
  const isReadOnly = userRoleClean === "admin" || userRoleClean === "operationmanager";

  const { tasks, stats, loading } = useSelector((state) => state.socialmediaTasks);
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  // Helper to extract clean avatar image URL from various User/Profile structures
  const extractAvatarUrl = useCallback((target) => {
    if (!target) return null;
    if (typeof target === "string") {
      const trimmed = target.trim();
      if (trimmed.startsWith("http")) return trimmed;
      if (trimmed.startsWith("/")) {
        const backendBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return backendBase ? `${backendBase}${trimmed}` : trimmed;
      }
      return trimmed;
    }
    if (typeof target === "object") {
      if (typeof target.url === "string" && target.url.trim()) return extractAvatarUrl(target.url);
      if (target.profile?.profileImage) return extractAvatarUrl(target.profile.profileImage);
      if (target.profileImage) return extractAvatarUrl(target.profileImage);
      if (target.avatar) return extractAvatarUrl(target.avatar);
      if (target.profilePic) return extractAvatarUrl(target.profilePic);
    }
    return null;
  }, []);

  // Fast user lookup map for creator profile images and names
  const usersMap = useMemo(() => {
    const map = new Map();
    if (user) {
      if (user._id) map.set(user._id.toString(), user);
      if (user.id) map.set(user.id.toString(), user);
      if (user.name) map.set(user.name.trim().toLowerCase(), user);
    }
    (users || []).forEach((u) => {
      if (u._id) map.set(u._id.toString(), u);
      if (u.id) map.set(u.id.toString(), u);
      if (u.name) map.set(u.name.trim().toLowerCase(), u);
    });
    return map;
  }, [users, user]);

  // Resolve user information (prefer assigned member, fallback to creator)
  const getUserInfo = useCallback(
    (task) => {
      const assignee = task?.assignee;
      const createdBy = task?.createdBy;

      const aId = (typeof assignee === "object" ? assignee?._id : assignee)?.toString();
      const aName = (typeof assignee === "object" ? assignee?.name : null) || task?.assigneeName;

      const cId = (typeof createdBy === "object" ? createdBy?._id : createdBy)?.toString();
      const cName = (typeof createdBy === "object" ? createdBy?.name : null) || task?.createdByName;

      const hasValidAssignee = aName && aName !== "Unassigned" && aName.trim().length > 0;

      let targetUser = null;
      let resolvedName = "";
      let isAssignee = false;

      if (hasValidAssignee) {
        targetUser =
          (aId && usersMap.get(aId)) ||
          (aName && usersMap.get(aName.trim().toLowerCase())) ||
          (typeof assignee === "object" ? assignee : null);
        resolvedName = targetUser?.name || aName;
        isAssignee = true;
      }

      if (!resolvedName || resolvedName === "Unassigned") {
        targetUser =
          (cId && usersMap.get(cId)) ||
          (cName && usersMap.get(cName.trim().toLowerCase())) ||
          (typeof createdBy === "object" ? createdBy : null);
        resolvedName =
          targetUser?.name ||
          cName ||
          (typeof createdBy === "string" ? createdBy : null) ||
          "Admin";
        isAssignee = false;
      }

      const avatarUrl =
        extractAvatarUrl(targetUser) ||
        extractAvatarUrl(hasValidAssignee ? assignee : null) ||
        extractAvatarUrl(createdBy) ||
        null;

      const initials = (resolvedName || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("") || "U";

      return {
        name: resolvedName,
        avatarUrl,
        initials,
        isAssignee,
      };
    },
    [usersMap, extractAvatarUrl]
  );

  // Backward compatible alias for existing logic
  const getCreatorInfo = getUserInfo;

  // Month & Year state (Dynamic current date)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("Month"); // "Month" | "Week" | "List"

  // Filter States
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("Content Calendar");
  const [selectedContentType, setSelectedContentType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedAssignee, setSelectedAssignee] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [isContentTypeOpen, setIsContentTypeOpen] = useState(false);
  const contentTypeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentTypeRef.current && !contentTypeRef.current.contains(event.target)) {
        setIsContentTypeOpen(false);
      }
    };
    if (isContentTypeOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isContentTypeOpen]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [initialDateForCreate, setInitialDateForCreate] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Day popover / expanded list modal
  const [selectedDayPosts, setSelectedDayPosts] = useState(null);

  // Drag and Drop
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Table View State
  const [tableSearch, setTableSearch] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 15;

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

  const renderDueDateBadge = (dueDate, status) => {
    if (!dueDate) return <span className="text-slate-400 font-medium">-</span>;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return <span className="text-slate-400 font-medium">-</span>;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${due.getDate()} ${months[due.getMonth()]}`;

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

    const isLive = status === "Live" || status === "Completed" || status === "Published" || status === "Published Live";
    if (isLive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap">
          {dateStr}
        </span>
      );
    }

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const diffDays = Math.round((startDue - startToday) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      const dayLabel = overdueDays === 1 ? "1d overdue" : `${overdueDays}d overdue`;
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>{dateStr}</span>
          <span className="font-extrabold text-[10px] uppercase tracking-wider opacity-90">• {dayLabel}</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>{dateStr}</span>
          <span className="font-extrabold text-[10px] uppercase tracking-wider opacity-90">• Due today</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {dateStr}
      </span>
    );
  };

  const handleTogglePlatformSubtask = async (task, platformId, e) => {
    if (e) e.stopPropagation();
    if (!task || !task._id || isReadOnly) return;

    const currentCompleted = Array.isArray(task.completedPlatforms)
      ? task.completedPlatforms
      : [];
    const isCompleted = currentCompleted.some(
      (p) => p.toLowerCase() === platformId.toLowerCase()
    );

    const newCompleted = isCompleted
      ? currentCompleted.filter((p) => p.toLowerCase() !== platformId.toLowerCase())
      : [...currentCompleted, platformId];

    try {
      await dispatch(
        updateSocialmediaTask({
          id: task._id,
          data: {
            completedPlatforms: newCompleted,
          },
        })
      ).unwrap();

      if (!isCompleted) {
        toast.success(`✓ ${platformId} marked as completed`);
      } else {
        toast(`Unchecked ${platformId}`, { icon: "↩️" });
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update platform tick");
    }
  };

  const handleQuickStatusChange = async (task, newStatus) => {
    if (!task || !task._id || isReadOnly) return;

    const s = (newStatus || "").trim().toLowerCase();
    const isVerificationStatus =
      s === "qc" ||
      s === "in qc" ||
      s.includes("client approval") ||
      s === "published live" ||
      s === "live" ||
      s === "published";

    if (isVerificationStatus) {
      const assigned =
        Array.isArray(task.platforms) && task.platforms.length > 0
          ? task.platforms
          : task.platform
          ? [task.platform]
          : [];
      const completed = Array.isArray(task.completedPlatforms)
        ? task.completedPlatforms
        : [];
      const unticked = assigned.filter(
        (p) => !completed.some((cp) => cp.toLowerCase() === p.toLowerCase())
      );
      if (unticked.length > 0) {
        setPlatformWarningModal({
          isOpen: true,
          task,
          targetStatus: newStatus,
        });
        return;
      }
    }

    try {
      await dispatch(updateSocialmediaTask({ id: task._id, data: { status: newStatus } })).unwrap();
      toast.success(`Status updated to "${newStatus}"`);
      dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
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
      dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setPlatformWarningModal({ isOpen: false, task: null, targetStatus: "" });
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const realTodayStr = formatLocalDateKey(new Date());

  const [initialLoading, setInitialLoading] = useState(true);

  // Pending Commitments & Calendar Date State
  const [isPendingCommitmentOpen, setIsPendingCommitmentOpen] = useState(false);
  const [platformWarningModal, setPlatformWarningModal] = useState({
    isOpen: false,
    task: null,
    targetStatus: "",
  });
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState(realTodayStr);
  const [mobileCalView, setMobileCalView] = useState("agenda");
  const [showMetricsMobile, setShowMetricsMobile] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // (commitmentOverview moved after calendarTasks for dynamic filter reactivity)

  // Fetch dynamic tasks and stats
  useEffect(() => {
    dispatch(getSocialmediaTasks({ year: currentYear, month: currentMonth + 1 }))
      .finally(() => setInitialLoading(false));
    dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch, currentYear, currentMonth]);

  const isCalendarLoading = loading || initialLoading;

  // Ensure tasks are unique by document _id without deleting valid posts with the same title
  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return (tasks || []).filter((t) => {
      const key = t._id ? t._id.toString() : JSON.stringify(t);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tasks]);

  // Dynamic client options (alphabetically sorted)
  const clientOptions = useMemo(() => {
    const set = new Set();
    clients.forEach((c) => {
      if (c.companyName) set.add(c.companyName.trim());
    });
    uniqueTasks.forEach((t) => {
      if (t.clientName) set.add(t.clientName.trim());
    });
    const sorted = Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return ["All", ...sorted];
  }, [clients, uniqueTasks]);

  // Helper to identify Social Media Executives
  const isSocialMediaManager = useCallback((u) => {
    if (!u) return false;
    if (u.employmentStatus === "relieved") return false;
    const dept = (u.department || "").toLowerCase().trim();
    const role = (u.role || "").toLowerCase().trim();
    const desig = (u.designation || "").toLowerCase().trim();
    return (
      dept.includes("social media") ||
      dept.includes("social manager") ||
      dept.includes("smm") ||
      role.includes("social media") ||
      role.includes("smm") ||
      role === "socialmediamanager" ||
      role === "socialmediaexecutive" ||
      desig.includes("social media") ||
      desig.includes("smm")
    );
  }, []);

  // Dynamic creator / assignee options - ONLY Social Media Executives
  const assigneeOptions = useMemo(() => {
    const nameMap = new Map();

    // 1. All active Social Media Executives in users list
    (users || []).forEach((u) => {
      if (u.name && u.name.trim() && isSocialMediaManager(u)) {
        nameMap.set(u.name.trim().toLowerCase(), u.name.trim());
      }
    });

    // 2. Also check uniqueTasks: if creator or assignee is matched to an SMM user
    uniqueTasks.forEach((t) => {
      const cId = (t.createdBy?._id || t.createdBy)?.toString();
      const aId = (t.assignee?._id || t.assignee)?.toString();
      const matched =
        (cId && usersMap.get(cId)) ||
        (aId && usersMap.get(aId)) ||
        (t.createdBy?.name && usersMap.get(t.createdBy.name.trim().toLowerCase())) ||
        (t.createdByName && usersMap.get(t.createdByName.trim().toLowerCase())) ||
        (t.assignee?.name && usersMap.get(t.assignee.name.trim().toLowerCase())) ||
        (t.assigneeName && usersMap.get(t.assigneeName.trim().toLowerCase()));

      if (matched && isSocialMediaManager(matched)) {
        nameMap.set(matched.name.trim().toLowerCase(), matched.name.trim());
      }
    });

    // 3. Current user if SMM
    if (user && isSocialMediaManager(user) && user.name && user.name.trim()) {
      nameMap.set(user.name.trim().toLowerCase(), user.name.trim());
    }

    const sorted = Array.from(nameMap.values()).sort((a, b) => a.localeCompare(b));
    return ["All", ...sorted];
  }, [users, uniqueTasks, usersMap, user, isSocialMediaManager]);

  // Filtered tasks for calendar (ONLY Commitment: Yes tasks with publishDate)
  const calendarTasks = useMemo(() => {
    return uniqueTasks.filter((task) => {
      // Must be a commitment (Yes) and have a publishDate or dueDate to be shown on the calendar!
      if (!task.commitment) return false;
      if (!task.publishDate && !task.dueDate) return false;

      // Regular users see tasks created by OR assigned to themselves.
      // Admin and Operation Manager can see all users' tasks.
      if (!isPrivileged) {
        const currentUserId = (user?._id || user?.id)?.toString();
        const currentUserNameLower = (user?.name || "").trim().toLowerCase();

        const taskCreatorId =
          (typeof task.createdBy === "object"
            ? task.createdBy?._id?.toString()
            : task.createdBy?.toString()) || "";
        const taskAssigneeId =
          (typeof task.assignee === "object"
            ? task.assignee?._id?.toString()
            : task.assignee?.toString()) || "";
        const taskCreatedByNameLower = (task.createdByName || "").trim().toLowerCase();
        const taskAssigneeNameLower = (task.assigneeName || "").trim().toLowerCase();

        const creator = getCreatorInfo(task);
        const resolvedCreatorNameLower = (creator?.name || "").trim().toLowerCase();

        const isMine =
          (currentUserId && (taskCreatorId === currentUserId || taskAssigneeId === currentUserId)) ||
          (currentUserNameLower && (
            taskCreatedByNameLower === currentUserNameLower ||
            taskAssigneeNameLower === currentUserNameLower ||
            resolvedCreatorNameLower === currentUserNameLower
          ));

        if (!isMine) return false;
      }

      if (selectedClient !== "All" && task.clientName !== selectedClient) return false;
      if (selectedCategory && selectedCategory !== "All") {
        const isSelCal = selectedCategory === "Content Calendar" || selectedCategory === "Content" || selectedCategory === "Content calendor";
        const isTaskCal = !task.category || task.category === "Content Calendar" || task.category === "Content" || task.category === "Content calendor";
        if (!isSelCal || !isTaskCal) {
          if (task.category !== selectedCategory) return false;
        }
      }
      if (selectedContentType !== "All") {
        const selCtLower = selectedContentType.toLowerCase().trim();
        const taskCtLower = (task.contentType || "").toLowerCase().trim();
        if (selCtLower === "reel" || selCtLower === "reels") {
          if (taskCtLower !== "reel" && taskCtLower !== "reels") return false;
        } else if (selCtLower === "story" || selCtLower === "stories") {
          if (taskCtLower !== "story" && taskCtLower !== "stories") return false;
        } else if (selCtLower === "post" || selCtLower === "posts") {
          if (taskCtLower !== "post" && taskCtLower !== "posts") return false;
        } else {
          if (taskCtLower !== selCtLower) return false;
        }
      }
      if (selectedStatus !== "All") {
        const normSelected = selectedStatus.toLowerCase().trim();
        const normTaskStatus = (task.status || "Not started").toLowerCase().trim();

        let match = false;
        if (normSelected === "published live") {
          match = ["published live", "published", "live", "completed"].includes(normTaskStatus);
        } else if (normSelected === "qc" || normSelected === "in qc") {
          match = ["qc", "in qc"].includes(normTaskStatus);
        } else if (normSelected === "inprogress" || normSelected === "in progress") {
          match = ["inprogress", "in progress"].includes(normTaskStatus);
        } else if (normSelected.includes("client approval") || normSelected === "completed and wait client approval") {
          match = normTaskStatus.includes("client approval");
        } else if (normSelected === "not started") {
          match = ["not started", "draft", ""].includes(normTaskStatus);
        } else {
          match = normTaskStatus === normSelected;
        }

        if (!match) return false;
      }
      if (isPrivileged && selectedAssignee !== "All") {
        const creator = task.createdBy?.name || task.createdByName;
        const assignee = task.assignee?.name || task.assigneeName;
        const creatorInfo = getCreatorInfo(task);
        const selectedLower = selectedAssignee.trim().toLowerCase();

        const matchesCreator = creator && creator.trim().toLowerCase() === selectedLower;
        const matchesAssignee = assignee && assignee.trim().toLowerCase() === selectedLower;
        const matchesResolved = creatorInfo?.name && creatorInfo.name.trim().toLowerCase() === selectedLower;

        if (!matchesCreator && !matchesAssignee && !matchesResolved) return false;
      }
      if (selectedPriority !== "All" && task.priority !== selectedPriority) return false;


      if (atRiskOnly) {
        if (!task.commitment) return false;
        if (["Completed", "Live"].includes(task.status)) return false;
        const targetDate = task.publishDate || task.dueDate;
        if (!targetDate) return false;
        const diffHours = (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours < 0 || diffHours > 24) return false;
      }

      return true;
    });
  }, [
    uniqueTasks,
    isPrivileged,
    user,
    getCreatorInfo,
    selectedClient,
    selectedCategory,
    selectedContentType,
    selectedStatus,
    selectedAssignee,
    selectedPriority,
    atRiskOnly,
  ]);

    const relevantClients = useMemo(() => {
    if (selectedClient === "All") return clients;
    return (clients || []).filter(
      (c) => (c.companyName || "").trim().toLowerCase() === selectedClient.trim().toLowerCase()
    );
  }, [clients, selectedClient]);

  const tasksForCommitments = useMemo(() => {
    let list = uniqueTasks || [];
    if (selectedClient !== "All") {
      list = list.filter((t) => t.clientName === selectedClient);
    }
    if (isPrivileged && selectedAssignee !== "All") {
      const selectedLower = selectedAssignee.trim().toLowerCase();
      list = list.filter((t) => {
        const creator = t.createdBy?.name || t.createdByName;
        const assignee = t.assignee?.name || t.assigneeName;
        const creatorInfo = getCreatorInfo(t);
        return (
          (creator && creator.trim().toLowerCase() === selectedLower) ||
          (assignee && assignee.trim().toLowerCase() === selectedLower) ||
          (creatorInfo?.name && creatorInfo.name.trim().toLowerCase() === selectedLower)
        );
      });
    }
    return list;
  }, [uniqueTasks, selectedClient, isPrivileged, selectedAssignee, getCreatorInfo]);

  // Compute live commitments across all clients (posts, reels, deliverables) - 2nd Reference Image
  const commitmentOverview = useMemo(() => {
    return computeAllClientsCommitments(
      relevantClients,
      tasksForCommitments,
      currentMonth + 1,
      currentYear,
      selectedClient !== "All"
    );
  }, [relevantClients, tasksForCommitments, currentMonth, currentYear, selectedClient]);

  const hasActiveFilters = Boolean(
    selectedClient !== "All" ||
    (selectedCategory !== "All" && selectedCategory !== "Content Calendar") ||
    selectedContentType !== "All" ||
    selectedStatus !== "All" ||
    (isPrivileged && selectedAssignee !== "All") ||
    selectedPriority !== "All" ||
    atRiskOnly
  );

  // 5 KPI Metric Cards - dynamically calculated when Admin/Operation Manager filters by Created By  or Client
  const displayStats = useMemo(() => {
    const isFilteredByUser = isPrivileged && selectedAssignee !== "All";
    const isFilteredByClient = selectedClient !== "All";

    if (isFilteredByUser || isFilteredByClient) {
      const selectedLower = selectedAssignee.trim().toLowerCase();
      const now = new Date();
      const nowTime = now.getTime();

      const userMonthlyCommitments = uniqueTasks.filter((t) => {
        if (!t.commitment) return false;
        if (!t.publishDate) return false;

        const pDate = new Date(t.publishDate);
        if (isNaN(pDate.getTime())) return false;
        if (pDate.getFullYear() !== currentYear || pDate.getMonth() !== currentMonth) {
          return false;
        }

        if (isFilteredByClient && t.clientName !== selectedClient) {
          return false;
        }

        if (isFilteredByUser) {
          const creator = t.createdBy?.name || t.createdByName;
          const assignee = t.assignee?.name || t.assigneeName;
          const creatorInfo = getCreatorInfo(t);

          const matchesCreator = creator && creator.trim().toLowerCase() === selectedLower;
          const matchesAssignee = assignee && assignee.trim().toLowerCase() === selectedLower;
          const matchesResolved = creatorInfo?.name && creatorInfo.name.trim().toLowerCase() === selectedLower;

          if (!matchesCreator && !matchesAssignee && !matchesResolved) return false;
        }

        return true;
      });

      const totalCommitments = userMonthlyCommitments.length;

      const completedCount = userMonthlyCommitments.filter((t) =>
        ["Completed", "Live", "Published", "Published Live"].includes(t.status)
      ).length;

      const overdueCount = userMonthlyCommitments.filter((t) => {
        if (["Completed", "Live", "Published", "Published Live"].includes(t.status)) return false;
        const pub = new Date(t.publishDate);
        return pub.getTime() < nowTime || t.status === "Overdue";
      }).length;

      const pendingCount = userMonthlyCommitments.filter((t) => {
        if (!["In QC", "QC", "Scheduled", "In progress", "Inprogress", "Not started", "Completed and wait CLient Approval"].includes(t.status)) return false;
        const pub = new Date(t.publishDate);
        return pub.getTime() >= nowTime;
      }).length;

      const atRiskCount = userMonthlyCommitments.filter((t) => {
        if (["Completed", "Live", "Published", "Published Live", "Completed and wait CLient Approval"].includes(t.status)) return false;
        const targetDate = t.publishDate || t.dueDate;
        if (!targetDate) return false;
        const diffHours = (new Date(targetDate).getTime() - nowTime) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 24;
      }).length;

      const achievement = totalCommitments > 0
        ? parseFloat(((completedCount / totalCommitments) * 100).toFixed(1))
        : 0;

      return {
        commitments: totalCommitments,
        completed: completedCount,
        pending: pendingCount,
        overdue: overdueCount,
        atRisk: atRiskCount,
        achievement,
      };
    }

    return {
      commitments: stats?.commitments ?? 0,
      completed: stats?.completed ?? 0,
      pending: stats?.pending ?? 0,
      overdue: stats?.overdue ?? 0,
      atRisk: stats?.atRisk ?? 0,
      achievement: stats?.achievement ?? 0,
    };
  }, [
    isPrivileged,
    selectedAssignee,
    selectedClient,
    uniqueTasks,
    currentYear,
    currentMonth,
    stats,
    getCreatorInfo,
  ]);

  // Filtered tasks for Table View (with dedicated search)
  const tableFilteredTasks = useMemo(() => {
    let list = calendarTasks;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter((t) => {
        const creator = getCreatorInfo(t);
        return (
          t.taskTitle?.toLowerCase().includes(q) ||
          t.clientName?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.contentType?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q) ||
          creator?.name?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [calendarTasks, tableSearch, getCreatorInfo]);

  const tableTotalPages = Math.ceil(tableFilteredTasks.length / itemsPerPage) || 1;
  const tablePaginatedTasks = useMemo(() => {
    const start = (tablePage - 1) * itemsPerPage;
    return tableFilteredTasks.slice(start, start + itemsPerPage);
  }, [tableFilteredTasks, tablePage]);

  // Calendar month grid calculation (Sunday start matching Image 2)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const firstDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      days.push({
        date: dateObj,
        dayNumber: d,
        isCurrentMonth: false,
        dateKey: formatLocalDateKey(dateObj),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      days.push({
        date: dateObj,
        dayNumber: i,
        isCurrentMonth: true,
        dateKey: formatLocalDateKey(dateObj),
      });
    }

    // Next month padding to fill multiple of 7
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const dateObj = new Date(currentYear, currentMonth + 1, i);
        days.push({
          date: dateObj,
          dayNumber: i,
          isCurrentMonth: false,
          dateKey: formatLocalDateKey(dateObj),
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // Calendar week view days calculation (Sunday to Saturday matching Image 2)
  const currentWeekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 (Sun) to 6 (Sat)

    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + i);
      weekDays.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        monthShort: MONTH_NAMES[dayDate.getMonth()].slice(0, 3),
        year: dayDate.getFullYear(),
        dateKey: formatLocalDateKey(dayDate),
        isToday: formatLocalDateKey(dayDate) === realTodayStr,
      });
    }

    return weekDays;
  }, [currentDate, currentMonth, currentYear, realTodayStr]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    calendarTasks.forEach((task) => {
      const targetDate = task.publishDate || task.dueDate;
      if (!targetDate) return;
      const key = formatLocalDateKey(targetDate);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => new Date(a.publishDate || a.dueDate) - new Date(b.publishDate || b.dueDate));
    });

    return map;
  }, [calendarTasks]);

  // Navigate months or weeks depending on active viewMode
  const handlePrev = () => {
    if (viewMode === "Week") {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7);
        return next;
      });
    } else {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "Week") {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
      });
    } else {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open modal to create a task on that day
  const handleAddPostOnDate = (dateObj) => {
    if (isReadOnly) return;
    setSelectedTaskForEdit(null);
    setInitialDateForCreate(dateObj);
    setIsModalOpen(true);
  };

  const handleCardClick = (task, e) => {
    e.stopPropagation();
    setSelectedTaskForEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    if (window.confirm(`Delete "${task.taskTitle}"?`)) {
      dispatch(deleteSocialmediaTask(task._id)).then(() => {
        dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
      });
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    if (isReadOnly) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e) => {
    if (isReadOnly) return;
    e.preventDefault();
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (isReadOnly || !draggedTaskId) return;

    const task = tasks.find((t) => t._id === draggedTaskId);
    if (!task) return;

    const origDate = task.publishDate ? new Date(task.publishDate) : new Date();
    const newPublishDate = new Date(targetDate);
    newPublishDate.setHours(origDate.getHours(), origDate.getMinutes(), 0, 0);

    dispatch(
      rescheduleSocialmediaTask({
        id: draggedTaskId,
        data: {
          publishDate: newPublishDate,
        },
      })
    ).then(() => {
      dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
    });
    setDraggedTaskId(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
  };

  const handleExportExcel = () => {
    if (!calendarTasks || calendarTasks.length === 0) {
      toast.error("No content calendar posts to export");
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
      "Publish Date",
      "Due Date",
      "Creator",
      "Assignee",
      "Notes",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = calendarTasks.map((task) => {
      const clientName = task.clientName || task.client?.companyName || "General";
      const creator = getCreatorInfo(task)?.name || "Admin";
      const assignee = task.assigneeName || task.assignee?.name || "Unassigned";

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
        escapeCsv(pubStr),
        escapeCsv(dueStr),
        escapeCsv(creator),
        escapeCsv(assignee),
        escapeCsv(task.notes || ""),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const todayStr = new Date().toISOString().split("T")[0];
    const fileName = `Content_Calendar_${MONTH_NAMES[currentMonth]}_${currentYear}_${todayStr}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${calendarTasks.length} calendar posts to Excel!`);
  };

  // Status card styling helper: returns clearly visible, elegant pastel backgrounds & borders per status
  const getStatusCardStyles = (status = "", isAtRisk = false) => {
    if (isAtRisk) {
      return {
        card: "bg-[#feebee] dark:bg-[#280d13] border-rose-200 dark:border-rose-900/60 hover:bg-[#fed9de] dark:hover:bg-[#35121a] hover:border-rose-300 dark:hover:border-rose-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70",
        dot: "bg-rose-500 animate-pulse",
        divider: "border-rose-200/80 dark:border-rose-900/40",
        label: "Risk",
      };
    }

    const s = (status || "").trim().toLowerCase();

    if (s.includes("published live") || s === "live" || s === "completed" || s === "published") {
      return {
        card: "bg-[#e6f9ee] dark:bg-[#072418] border-emerald-200 dark:border-emerald-900/60 hover:bg-[#d5f5e2] dark:hover:bg-[#0c3323] hover:border-emerald-300 dark:hover:border-emerald-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/70",
        dot: "bg-emerald-400",
        divider: "border-emerald-200/80 dark:border-emerald-900/40",
        label: "Live",
      };
    }
    if (s === "qc" || s === "in qc") {
      return {
        card: "bg-[#fef7e3] dark:bg-[#261c0a] border-amber-200 dark:border-amber-900/60 hover:bg-[#fdeec4] dark:hover:bg-[#34260f] hover:border-amber-300 dark:hover:border-amber-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70",
        dot: "bg-amber-400",
        divider: "border-amber-200/80 dark:border-amber-900/40",
        label: "QC",
      };
    }
    if (s.includes("client approval") || s.includes("approval")) {
      return {
        card: "bg-[#f3e8ff] dark:bg-[#201335] border-purple-200 dark:border-purple-900/60 hover:bg-[#ede0fe] dark:hover:bg-[#2a1a45] hover:border-purple-300 dark:hover:border-purple-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-purple-100 dark:bg-purple-950/90 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-800/70",
        dot: "bg-purple-400",
        divider: "border-purple-200/80 dark:border-purple-900/40",
        label: "Approval",
      };
    }
    if (s === "inprogress" || s === "in progress") {
      return {
        card: "bg-[#eef0fe] dark:bg-[#151936] border-indigo-200 dark:border-indigo-900/60 hover:bg-[#e0e4fe] dark:hover:bg-[#1e234a] hover:border-indigo-300 dark:hover:border-indigo-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-indigo-100 dark:bg-indigo-950/90 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/70",
        dot: "bg-indigo-400",
        divider: "border-indigo-200/80 dark:border-indigo-900/40",
        label: "In Prog",
      };
    }
    if (s === "scheduled") {
      return {
        card: "bg-[#e8f4fd] dark:bg-[#0a2139] border-sky-200 dark:border-sky-900/60 hover:bg-[#d8edfd] dark:hover:bg-[#0e2e4e] hover:border-sky-300 dark:hover:border-sky-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-sky-100 dark:bg-sky-950/90 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/70",
        dot: "bg-sky-400",
        divider: "border-sky-200/80 dark:border-sky-900/40",
        label: "Sched",
      };
    }
    if (s === "overdue") {
      return {
        card: "bg-[#feebee] dark:bg-[#280d13] border-rose-200 dark:border-rose-900/60 hover:bg-[#fed9de] dark:hover:bg-[#35121a] hover:border-rose-300 dark:hover:border-rose-700/70 shadow-2xs hover:shadow-xs",
        badge: "bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70",
        dot: "bg-rose-500 animate-pulse",
        divider: "border-rose-200/80 dark:border-rose-900/40",
        label: "Risk",
      };
    }

    return {
      card: "bg-[#f8fafc] dark:bg-[#131b2e] border-slate-200 dark:border-[#202d44] hover:bg-slate-100 dark:hover:bg-[#18233a] hover:border-slate-300 dark:hover:border-[#2b3c5a] shadow-2xs hover:shadow-xs",
      badge: "bg-slate-100 dark:bg-[#1e2a40] text-slate-700 dark:text-[#cbd5e1] border-slate-200 dark:border-[#2c3d5b]",
      dot: "bg-slate-400",
      divider: "border-slate-200/80 dark:border-[#1e2a40]",
      label: "Draft",
    };
  };

  // Status badge styling helper
  const renderStatusBadge = (status, isAtRisk = false) => {
    const style = getStatusCardStyles(status, isAtRisk);
    return (
      <span
        className={`inline-flex items-center gap-1 text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded border uppercase shadow-2xs ${style.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
        <span>{style.label}</span>
      </span>
    );
  };

  const formatCardTime = (dateVal) => {
    if (!dateVal) return "12:00";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "12:00";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // Content type badge style helper
  const getPlatformIcon = (platform) => {
    if (!platform) return null;
    const p = platform.trim().toLowerCase();
    if (p.includes("instagram")) return <FaInstagram className="text-[#E1306C] shrink-0" size={11} title="Instagram" />;
    if (p.includes("facebook")) return <FaFacebook className="text-[#1877F2] shrink-0" size={11} title="Facebook" />;
    if (p.includes("youtube")) return <FaYoutube className="text-[#FF0000] shrink-0" size={11} title="YouTube" />;
    if (p.includes("gmb") || p.includes("google")) return <FaGoogle className="text-[#4285F4] shrink-0" size={10} title="Google My Business" />;
    if (p.includes("twitter")) return <FaTwitter className="text-[#1DA1F2] shrink-0" size={11} title="Twitter / X" />;
    if (p.includes("linkedin")) return <FaLinkedin className="text-[#0A66C2] shrink-0" size={11} title="LinkedIn" />;
    return null;
  };

  const getContentTypeStyle = (contentType) => {
    const type = (contentType || "Post").trim().toLowerCase();
    switch (type) {
      case "reel":
      case "reels":
        return {
          bg: "bg-fuchsia-50 dark:bg-[#290d2e] text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-900/70",
          label: "REEL",
        };
      case "story":
      case "stories":
        return {
          bg: "bg-amber-50 dark:bg-[#2d1b06] text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/70",
          label: "STORY",
        };
      case "others task":
      case "other":
        return {
          bg: "bg-slate-100 dark:bg-[#1a2333] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2b3c5a]",
          label: "TASK",
        };
        return {
          bg: "bg-fuchsia-50 dark:bg-[#290d2e] text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-900/70",
          label: "REEL",
        };
      case "post":
        return {
          bg: "bg-blue-50 dark:bg-[#0c223d] text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/70",
          label: "POST",
        };
      case "carousel":
        return {
          bg: "bg-violet-50 dark:bg-[#1f1238] text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/70",
          label: "CAROUSEL",
        };
      case "story":
        return {
          bg: "bg-amber-50 dark:bg-[#2d1b06] text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/70",
          label: "STORY",
        };
      case "youtube":
        return {
          bg: "bg-rose-50 dark:bg-[#2b0c14] text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/70",
          label: "YT",
        };
      case "gmb":
        return {
          bg: "bg-emerald-50 dark:bg-[#09261a] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/70",
          label: "GMB",
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-[#1a2333] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2b3c5a]",
          label: (contentType || "POST").toUpperCase(),
        };
    }
  };



  const outletContext = useOutletContext() || {};
  const setSidebarOpen = outletContext?.setSidebarOpen;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100  p-3 space-y-3.5 sm:space-y-6 relative">
      {/* Full Page Centered Loading Animation */}
      <AnimatePresence>
        {isCalendarLoading && (
          <FullPageCalendarLoader
            monthName={MONTH_NAMES[currentMonth]}
            year={currentYear}
          />
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {setSidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Open Sidebar"
            >
              <FiMenu size={18} />
            </button>
          )}
          <div>
            <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              Social Media Calendar
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {viewMode === "Week" && currentWeekDays.length === 7
                ? `${currentWeekDays[0].dayNumber} ${currentWeekDays[0].monthShort} – ${currentWeekDays[6].dayNumber} ${currentWeekDays[6].monthShort} ${currentWeekDays[6].year}`
                : `${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </h1>
          </div>
        </div>

        {/* Navigation & View switcher */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Month/Week selector navigation */}
          <div className="flex items-center bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e2a40] rounded-xl p-0.5 shadow-xs">
            <button
              onClick={handlePrev}
              disabled={isCalendarLoading}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer disabled:opacity-40"
              title={viewMode === "Week" ? "Previous Week" : "Previous Month"}
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              disabled={isCalendarLoading}
              className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#182338] rounded-lg transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap text-center"
              title="Click to return to Current Month"
            >
              {MONTH_NAMES[currentMonth]}
            </button>
            <button
              onClick={handleNext}
              disabled={isCalendarLoading}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer disabled:opacity-40"
              title={viewMode === "Week" ? "Next Week" : "Next Month"}
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {(currentMonth !== new Date().getMonth() || currentYear !== new Date().getFullYear()) && (
            <button
              type="button"
              onClick={handleToday}
              disabled={isCalendarLoading}
              className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Return to Today"
            >
              Today
            </button>
          )}

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => {
              dispatch(getSocialmediaTasks({ year: currentYear, month: currentMonth + 1 }));
              dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
            }}
            disabled={isCalendarLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1e2a40] bg-white dark:bg-[#0c1220] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#182338] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Calendar"
          >
            <FiRefreshCw size={14} className={isCalendarLoading ? "animate-spin text-indigo-500" : ""} />
          </button>

          {/* View Mode Switcher (Matching 2nd Reference Image) */}
          <div className="flex items-center bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e2a40] rounded-xl p-1 shadow-xs">
            {["Month", "Week", "List"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-slate-100 dark:bg-[#182338] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {isReadOnly ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
              <FiLock size={13} />
              <span>Read Only</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs cursor-pointer"
                title="Import Commitment Posts via Excel / CSV"
              >
                <FiUpload size={14} />
                <span>Import Excel</span>
              </button>
              <button
                onClick={() => handleAddPostOnDate(new Date())}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
              >
                <FiPlus size={14} />
                <span>Add Post</span>
              </button>
            </div>
          )}

          <button
            onClick={() => navigate(`/${userRoleClean || "admin"}/sm-tasks`)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1e2a40] bg-white dark:bg-[#0c1220] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#182338] transition-colors shadow-xs cursor-pointer"
          >
            <FiList size={14} />
            <span>Task Table</span>
          </button>
        </div>
      </div>

      {/* Mobile Metrics Toggle Pill */}
      <div className="sm:hidden flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setShowMetricsMobile(!showMetricsMobile)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            showMetricsMobile
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          }`}
        >
          <FiBarChart2 size={13} className="text-indigo-500" />
          <span>{showMetricsMobile ? "Hide Metrics" : "Show Monthly Deliverables"}</span>
          <FiChevronDown size={13} className={`transition-transform duration-200 ${showMetricsMobile ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* 2nd Reference Image: Commitments Overview Section (Cards) */}
      <div className={showMetricsMobile ? "block" : "hidden sm:block"}>
      <SmTaskCards
        selectedClient={selectedClient}
        selectedMonth={currentMonth + 1}
        selectedYear={currentYear}
        hasActiveFilters={hasActiveFilters}
        commitmentOverview={commitmentOverview}
        onOpenPendingCommitment={() => setIsPendingCommitmentOpen(true)}
        atRiskOnly={atRiskOnly}
        setAtRiskOnly={setAtRiskOnly}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        setCurrentPage={setTablePage}
      />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0b101d] border border-slate-200/80 dark:border-[#1e2a40] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 relative z-30">
        <div className="flex flex-wrap items-center gap-2">
          {/* All Clients (Dynamic DB Clients with Search Box) */}
          <SearchableDropdown
            value={selectedClient}
            onChange={(val) => setSelectedClient(val)}
            options={clientOptions.filter((c) => c !== "All")}
            allLabel="All clients"
            placeholder="Client"
            searchPlaceholder="Search clients..."
            emptyText="No clients found"
            menuWidth="w-64 sm:w-72"
            buttonClassName="toolbar-filter-btn"
          />

          {/* Category - Fixed as Content Calendar without dropdown icon */}
          <div
            className="toolbar-filter-btn inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 select-none cursor-default !justify-center"
            title="Category: Content Calendar"
          >
            <span>Content Calendar</span>
          </div>

          {/* Content Type (Post, Reel, Story with icons) */}
          <div className="relative" ref={contentTypeRef}>
            <button
              type="button"
              onClick={() => setIsContentTypeOpen((prev) => !prev)}
              className={`toolbar-filter-btn inline-flex items-center justify-between gap-2 cursor-pointer transition-all ${
                selectedContentType !== "All"
                  ? "!border-blue-500 !bg-blue-50/50 dark:!bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                  : ""
              }`}
            >
              {(() => {
                if (selectedContentType === "Post") {
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                      <FiImage size={13} className="text-blue-500 stroke-[2.5]" />
                      <span>Post</span>
                    </span>
                  );
                }
                if (selectedContentType === "Reel" || selectedContentType === "Reels") {
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-pink-600 dark:text-pink-400">
                      <FiFilm size={13} className="text-pink-500 stroke-[2.5]" />
                      <span>Reel</span>
                    </span>
                  );
                }
                if (selectedContentType === "Story" || selectedContentType === "Stories") {
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <FiZap size={13} className="text-amber-500 fill-amber-500" />
                      <span>Story</span>
                    </span>
                  );
                }
                return <span>Content type</span>;
              })()}
              <FiChevronDown
                size={13}
                className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                  isContentTypeOpen ? "rotate-180 text-blue-500" : ""
                }`}
              />
            </button>

            {/* Custom Content Type Dropdown Menu */}
            {isContentTypeOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 z-50 bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100">
                {/* Option 1: All */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContentType("All");
                    setIsContentTypeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    selectedContentType === "All"
                      ? "bg-slate-100 dark:bg-[#182338] text-slate-900 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#182338]/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#182338] flex items-center justify-center text-slate-400">
                      <FiGrid size={12} />
                    </div>
                    <span>All Content types</span>
                  </div>
                  {selectedContentType === "All" && (
                    <FiCheck size={14} className="text-emerald-500 stroke-[3]" />
                  )}
                </button>

                {/* Option 2: Post */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContentType("Post");
                    setIsContentTypeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                    selectedContentType === "Post"
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FiImage size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-bold">Post</span>
                  </div>
                  {selectedContentType === "Post" && (
                    <FiCheck size={14} className="text-blue-600 stroke-[3]" />
                  )}
                </button>

                {/* Option 3: Reel */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContentType("Reel");
                    setIsContentTypeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                    selectedContentType === "Reel" || selectedContentType === "Reels"
                      ? "bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-pink-50/50 dark:hover:bg-pink-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400">
                      <FiFilm size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-bold">Reel</span>
                  </div>
                  {(selectedContentType === "Reel" || selectedContentType === "Reels") && (
                    <FiCheck size={14} className="text-pink-600 stroke-[3]" />
                  )}
                </button>

                {/* Option 4: Story */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContentType("Story");
                    setIsContentTypeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                    selectedContentType === "Story" || selectedContentType === "Stories"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <FiZap size={13} className="fill-amber-500 text-amber-600" />
                    </div>
                    <span className="font-bold">Story</span>
                  </div>
                  {(selectedContentType === "Story" || selectedContentType === "Stories") && (
                    <FiCheck size={14} className="text-amber-600 stroke-[3]" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Status (From Reference Image 2: Not started, Inprogress, QC, Completed and wait CLient Approval, Published Live) */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`toolbar-filter-select ${selectedStatus !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Status</option>
            {STATUSES.filter((c) => c !== "All").map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* SMM / Created By Filter with Search Box */}
          {canFilterBySMM && (
            <SearchableDropdown
              value={selectedAssignee}
              onChange={(val) => setSelectedAssignee(val)}
              options={assigneeOptions.filter((a) => a !== "All")}
              allLabel="Created By "
              placeholder="Created By "
              searchPlaceholder="Search creator / SMM..."
              emptyText="No user found"
              menuWidth="w-64 sm:w-72"
              buttonClassName="toolbar-filter-btn"
            />
          )}

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={`toolbar-filter-select ${selectedPriority !== "All" ? "is-active" : ""}`}
          >
            <option value="All">Priority</option>
            {PRIORITIES.filter((p) => p !== "All").map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>


          {/* At Risk Pill Button */}
          <button
            type="button"
            onClick={() => setAtRiskOnly(!atRiskOnly)}
            className={`toolbar-filter-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              atRiskOnly
                ? "!bg-rose-500/15 dark:!bg-rose-950/60 !text-rose-600 dark:!text-rose-300 !border-rose-400 dark:!border-rose-700/80 shadow-xs"
                : ""
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>At risk</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/70 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold">
              {displayStats.atRisk ?? 0}
            </span>
          </button>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="toolbar-filter-btn !bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-600 shadow-sm inline-flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
            title="Export filtered content calendar to Excel"
          >
            <FiDownload size={13} />
            <span>Export to Excel</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {isCalendarLoading ? (
            <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Loading calendar tasks...
            </span>
          ) : (
            <>
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{calendarTasks.length}</span>{" "}
              posts ·{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{new Set(calendarTasks.map((t) => t.clientName).filter(Boolean)).size}</span> clients
            </>
          )}
        </div>
      </div>

      {/* VIEW MODES: MONTH | WEEK | LIST */}
      <div className="space-y-4">
        {/* 1. MONTH VIEW (Full Width View) */}
        {viewMode === "Month" && (
          <div className="w-full bg-white dark:bg-[#080d19] border border-slate-200/80 dark:border-[#1e2a40] rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[1050px] 2xl:min-w-full">
                {/* Days of Week Header (Sun to Sat matching Image 2) */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#1e2a40] bg-slate-50 dark:bg-[#0c1222] text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center py-2.5">
                  {WEEK_DAYS.map((day) => (
                    <div key={day} className="px-1 truncate">{day}</div>
                  ))}
                </div>

                {/* Days Grid Cells */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-[#1a2438] border-b border-slate-200 dark:border-[#1e2a40]">
                  {calendarDays.map((dayItem, index) => {
                    const dateKey = dayItem.dateKey;
                    const postsForDay = tasksByDate[dateKey] || [];
                    const isToday = dayItem.dateKey === realTodayStr;
                    const isSelectedDay =
                      dayItem.dateKey === selectedCalendarDateKey || (isToday && !selectedCalendarDateKey);

                    const displayedPosts = postsForDay.slice(0, 3);
                    const remainingCount = postsForDay.length - displayedPosts.length;

                    return (
                      <div
                        key={index}
                        onDragOver={!isReadOnly ? handleDragOver : undefined}
                        onDrop={!isReadOnly ? (e) => handleDrop(e, dayItem.date) : undefined}
                        onClick={() => {
                          setSelectedCalendarDateKey(dayItem.dateKey);
                          if (!isReadOnly) handleAddPostOnDate(dayItem.date);
                        }}
                        className={`min-h-[175px] sm:min-h-[195px] p-2 flex flex-col justify-between transition-all relative ${
                          isReadOnly ? "cursor-default" : "cursor-pointer"
                        } ${
                          isSelectedDay
                            ? "ring-2 ring-emerald-500/80 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/25 z-10 shadow-xs"
                            : dayItem.isCurrentMonth
                            ? "bg-white dark:bg-[#0b101d]"
                            : "bg-slate-50/50 dark:bg-[#060a12] text-slate-400"
                        } hover:bg-slate-50/80 dark:hover:bg-[#121a2c] group`}
                      >
                        {/* Cell Top Bar */}
                        <div
                          className="flex items-center justify-between mb-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-transform ${
                                isToday
                                  ? "bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-500/30"
                                  : dayItem.isCurrentMonth
                                  ? "text-slate-800 dark:text-slate-200 font-extrabold"
                                  : "text-slate-400 font-medium"
                              }`}
                            >
                              {dayItem.dayNumber}
                            </span>

                            {postsForDay.length > 0 && dayItem.isCurrentMonth && (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                {postsForDay.length} {postsForDay.length === 1 ? "post" : "posts"}
                              </span>
                            )}
                          </div>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleAddPostOnDate(dayItem.date)}
                              className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title={`Add post on ${dayItem.dayNumber} ${MONTH_NAMES[currentMonth]}`}
                            >
                              <FiPlus size={13} />
                            </button>
                          )}
                        </div>

                        {/* Posts Cards inside cell */}
                        <div className="space-y-1.5 flex-1 overflow-hidden">
                          {displayedPosts.map((post) => {
                            const clientColor = post.clientColor || "#6366f1";
                            const postDiffHours = post.publishDate
                              ? (new Date(post.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                              : -1;
                            const isRisk =
                              !["Completed", "Live"].includes(post.status) &&
                              postDiffHours >= 0 &&
                              postDiffHours <= 24;
                            const typeStyle = getContentTypeStyle(post.contentType);
                            const statusStyle = getStatusCardStyles(post.status, isRisk);
                            const userInfo = getUserInfo(post);

                            return (
                              <div
                                key={post._id}
                                draggable={!isReadOnly}
                                onDragStart={!isReadOnly ? (e) => handleDragStart(e, post._id) : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCalendarDateKey(dayItem.dateKey);
                                  handleCardClick(post, e);
                                }}
                                className={`p-2 rounded-xl border ${statusStyle.card} hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group/card flex flex-col justify-between gap-1.5 shadow-2xs`}
                                style={{ borderLeftWidth: "3.5px", borderLeftColor: clientColor }}
                              >
                                {/* Top Row: Time + Content Type Pill */}
                                <div className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[10px] shrink-0">
                                      {formatCardTime(post.publishDate)}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide border shrink-0 ${typeStyle.bg} inline-flex items-center gap-1`}
                                    >
                                      <span>{typeStyle.label}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Middle Row: Client - Content Type */}
                                <div
                                  className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight truncate"
                                  title={`${post.clientName} - ${post.contentType}${post.taskTitle ? ` : ${post.taskTitle}` : ""}`}
                                >
                                  {post.clientName} - {post.contentType}
                                </div>

                                {/* Task Title */}
                                {post.taskTitle ? (
                                  <div className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate" title={post.taskTitle}>
                                    {post.taskTitle}
                                  </div>
                                ) : null}

                                {/* Dynamic Platforms Checklist (Only platforms assigned to this task with Tick option) */}
                                {(() => {
                                  const assigned = Array.isArray(post.platforms) && post.platforms.length > 0
                                    ? post.platforms
                                    : (post.platform ? [post.platform] : []);
                                  const completed = Array.isArray(post.completedPlatforms)
                                    ? post.completedPlatforms
                                    : [];

                                  if (assigned.length === 0) return null;

                                  return (
                                    <div
                                      className="grid grid-cols-3 gap-1.5 w-fit pt-0.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {assigned.map((platId) => {
                                        const platObj = ALL_PLATFORMS_MAP.find(
                                          (p) => p.id.toLowerCase() === platId.toLowerCase()
                                        ) || {
                                          id: platId,
                                          name: platId,
                                          icon: FiLayers,
                                          color: "#6366f1",
                                        };
                                        const IconComp = platObj.icon;
                                        const isTicked = completed.some(
                                          (cp) => cp.toLowerCase() === platId.toLowerCase()
                                        );

                                        return (
                                          <button
                                            key={platId}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={(e) => handleTogglePlatformSubtask(post, platId, e)}
                                            title={
                                              isTicked
                                                ? `✓ ${platObj.name} (Posted/Ticked - Click to untick)`
                                                : `○ ${platObj.name} (Pending post - Click to tick)`
                                            }
                                            className={`group/tick relative inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-150 cursor-pointer ${
                                              isTicked
                                                ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300/90 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs hover:bg-emerald-100 hover:scale-105"
                                                : "bg-white dark:bg-[#131d31] border-slate-200 dark:border-white/10 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-105 shadow-2xs"
                                            } active:scale-95 disabled:cursor-not-allowed`}
                                          >
                                            {/* Tick Checkbox Indicator */}
                                            <span
                                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[8.5px] transition-colors shrink-0 ${
                                                isTicked
                                                  ? "bg-emerald-500 border-emerald-600 text-white shadow-2xs"
                                                  : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 group-hover/tick:border-emerald-400 text-transparent"
                                              }`}
                                            >
                                              <FiCheck className="stroke-[3]" size={9} />
                                            </span>

                                            {/* Platform Icon */}
                                            <IconComp
                                              size={12}
                                              className={`shrink-0 transition-opacity ${
                                                isTicked ? "opacity-100" : "opacity-80 group-hover/tick:opacity-100"
                                              }`}
                                              style={{ color: platObj.color }}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

                                {/* Bottom Row: User Profile & Name + Risk Badge on right side + Client indicator dot */}
                                <div
                                  className={`pt-1 border-t ${statusStyle.divider || "border-slate-100 dark:border-slate-800/80"} flex items-center justify-between gap-1 text-[10px]`}
                                >
                                  <div
                                    className="flex items-center gap-1.5 min-w-0 flex-1"
                                    title={`${userInfo.isAssignee ? "Assigned to" : "Created by"}: ${userInfo.name}`}
                                  >
                                    <div className="relative shrink-0 w-4 h-4 rounded-full overflow-hidden ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-2xs">
                                      {userInfo.avatarUrl ? (
                                        <img
                                          src={userInfo.avatarUrl}
                                          alt={userInfo.name}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            const fb = e.currentTarget.parentElement?.querySelector(".cal-card-fallback");
                                            if (fb) fb.style.display = "flex";
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="cal-card-fallback w-full h-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-extrabold text-[7.5px] items-center justify-center uppercase shadow-2xs"
                                        style={{ display: userInfo.avatarUrl ? "none" : "flex" }}
                                      >
                                        {userInfo.initials}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                      {userInfo.name}
                                    </span>
                                  </div>

                                  {/* Right side of User Name: Risk badge + Client indicator dot */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {renderStatusBadge(post.status, isRisk)}
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs ring-1 ring-white dark:ring-slate-900"
                                      style={{ backgroundColor: clientColor }}
                                      title={`Client: ${post.clientName}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* "+X more" button */}
                        {remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayPosts({
                                date: dayItem.date,
                                posts: postsForDay,
                              });
                            }}
                            className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline pt-1 text-left block w-full cursor-pointer transition-colors"
                          >
                            +{remainingCount} more
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* 2. TABLE VIEW (All Data Easy to View & Manage) */}
      {viewMode === "Table" && (
        <div className="bg-white dark:bg-[#080d19] border border-slate-200/80 dark:border-[#1e2a40] rounded-2xl shadow-sm p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#182338]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setTablePage(1);
                  }}
                  placeholder="Search tasks, clients, SMM..."
                  className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-[#151d2e] border border-slate-200 dark:border-[#22314d] rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 sm:w-72"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong className="text-slate-800 dark:text-slate-100">{tableFilteredTasks.length}</strong> posts for {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleAddPostOnDate(new Date())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <FiPlus size={14} />
                <span>Create Post</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-[#1e2a40]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#1e2a40] bg-slate-50 dark:bg-[#0c1220] text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Content Type</th>
                  <th className="py-3 px-4">SMM / Assignee</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-4 bg-slate-100/50 dark:bg-[#101726] font-bold">Publish Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">QC</th>
                  <th className="py-3 px-3">Commitment</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#182338] font-medium">
                {tablePaginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 italic">
                      No posts found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  tablePaginatedTasks.map((t) => {
                    const creator = getCreatorInfo(t);
                    const typeStyle = getContentTypeStyle(t.contentType);

                    return (
                      <tr
                        key={t._id}
                        onClick={() => handleCardClick(t)}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#101726] transition-colors cursor-pointer group"
                      >
                        {/* Task Title */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-6 rounded-full shrink-0"
                              style={{ backgroundColor: t.clientColor || "#6366f1" }}
                            />
                            <div className="truncate font-bold text-slate-900 dark:text-slate-100 text-xs" title={t.taskTitle}>
                              {t.taskTitle || "Untitled Post"}
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="py-3 px-4 font-semibold">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-[140px]"
                            style={{
                              color: t.clientColor || "#6366f1",
                              borderColor: `${t.clientColor || "#6366f1"}40`,
                              backgroundColor: `${t.clientColor || "#6366f1"}12`,
                            }}
                            title={t.clientName}
                          >
                            {t.clientName || "Unknown"}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#131d31] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                            {t.category || "Content"}
                          </span>
                        </td>

                        {/* Content Type */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${typeStyle.bg}`}>
                            {typeStyle.label}
                          </span>
                        </td>

                        {/* SMM / Assignee */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                              {creator.avatarUrl ? (
                                <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                              ) : (
                                creator.initials
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                              {creator.name}
                            </span>
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="py-3 px-3">
                          {renderDueDateBadge(t.dueDate, t.status)}
                        </td>

                        {/* Publish Date */}
                        <td className="py-3 px-4 bg-slate-50/60 dark:bg-[#0e1524] font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                          {formatPublishDateTime(t.publishDate)}
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={
                              ["Live", "Published", "Published Live", "Completed"].includes(t.status)
                                ? "Published Live"
                                : ["In QC", "QC"].includes(t.status)
                                ? "QC"
                                : (t.status || "").toLowerCase().includes("client approval")
                                ? "Completed and wait CLient Approval"
                                : ["In progress", "Inprogress"].includes(t.status)
                                ? "Inprogress"
                                : t.status || "Not started"
                            }
                            disabled={isReadOnly}
                            onChange={(e) => handleQuickStatusChange(t, e.target.value)}
                            className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs ${
                              ["Live", "Published", "Published Live", "Completed"].includes(t.status)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                : ["In QC", "QC"].includes(t.status)
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                : (t.status || "").toLowerCase().includes("client approval")
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                                : ["In progress", "Inprogress"].includes(t.status)
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#131d31] dark:text-slate-300 dark:border-white/10"
                            }`}
                          >
                            {STATUSES.filter((s) => s !== "All").map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              t.priority === "High"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                : t.priority === "Medium"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-[#131d31] dark:text-slate-300"
                            }`}
                          >
                            {t.priority || "Medium"}
                          </span>
                        </td>

                        {/* QC */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {t.qc || "-"}
                          </span>
                        </td>

                        {/* Commitment */}
                        <td className="py-3 px-3">
                          {t.commitment ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">No</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(t);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit post"
                            >
                              <FiEdit2 size={13} />
                            </button>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTask(t, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Delete post"
                              >
                                <FiTrash2 size={13} />
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

          {/* Table Pagination */}
          {tableTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {tablePage} of {tableTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={tablePage === 1}
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131d31] font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  disabled={tablePage === tableTotalPages}
                  onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131d31] font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. WEEK VIEW */}
      {viewMode === "Week" && (
        <div className="bg-white dark:bg-[#080d19] border border-slate-200/80 dark:border-[#1e2a40] rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Weekly Content Schedule
            </h3>
            <span className="text-xs text-slate-400">
              {isReadOnly ? "Read-only schedule view" : "Click any slot to add post"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
            {currentWeekDays.map((dayItem, idx) => {
              const postsForDay = tasksByDate[dayItem.dateKey] || [];
              return (
                <div
                  key={idx}
                  onDragOver={!isReadOnly ? handleDragOver : undefined}
                  onDrop={!isReadOnly ? (e) => handleDrop(e, dayItem.date) : undefined}
                  onClick={!isReadOnly ? () => handleAddPostOnDate(dayItem.date) : undefined}
                  className={`bg-slate-50 dark:bg-[#0b101d] p-3 rounded-xl border ${
                    dayItem.isToday
                      ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/25"
                      : "border-slate-200 dark:border-[#1e2a40]"
                  } min-h-[220px] flex flex-col justify-between ${
                    isReadOnly ? "cursor-default" : "cursor-pointer"
                  } hover:border-blue-400 transition-colors`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10/50 mb-2">
                    <span className={`text-xs font-black uppercase ${dayItem.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
                      {WEEK_DAYS[idx]}
                    </span>
                    <span className={`text-xs font-bold ${dayItem.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {dayItem.dayNumber} {dayItem.monthShort}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {postsForDay.map((p) => {
                      const creator = getCreatorInfo(p);
                      const typeStyle = getContentTypeStyle(p.contentType);
                      const pDiffHours = p.publishDate
                        ? (new Date(p.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                        : -1;
                      const isRisk =
                        !["Completed", "Live"].includes(p.status) &&
                        pDiffHours >= 0 &&
                        pDiffHours <= 24;
                      const statusStyle = getStatusCardStyles(p.status, isRisk);

                      return (
                        <div
                          key={p._id}
                          draggable={!isReadOnly}
                          onDragStart={!isReadOnly ? (e) => handleDragStart(e, p._id) : undefined}
                          onClick={(e) => handleCardClick(p, e)}
                          className={`p-2 rounded-xl border ${statusStyle.card} text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1.5`}
                          style={{ borderLeftWidth: "3.5px", borderLeftColor: p.clientColor || "#6366f1" }}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                                {formatCardTime(p.publishDate)}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide border ${typeStyle.bg}`}>
                                {typeStyle.label}
                              </span>
                            </div>
                            <div className="shrink-0">
                              {renderStatusBadge(p.status, isRisk)}
                            </div>
                          </div>

                          <div className="font-bold text-[11px] text-slate-900 dark:text-white leading-snug line-clamp-2" title={p.taskTitle || p.clientName}>
                            {p.taskTitle || "Untitled Task"}
                          </div>

                          <div className={`flex items-center justify-between pt-1 border-t ${statusStyle.divider} text-[10px]`}>
                            <span className="font-bold truncate max-w-[70px]" style={{ color: p.clientColor || "#6366f1" }} title={p.clientName}>
                              {p.clientName}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 max-w-[95px]" title={`${creator.isAssignee ? "Assigned to" : "Created by"}: ${creator.name}`}>
                              <div className="relative shrink-0 w-4 h-4 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs">
                                {creator.avatarUrl ? (
                                  <img
                                    src={creator.avatarUrl}
                                    alt={creator.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fb = e.currentTarget.parentElement?.querySelector(".cal-week-fallback");
                                      if (fb) fb.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="cal-week-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[7.5px] items-center justify-center uppercase shadow-2xs"
                                  style={{ display: creator.avatarUrl ? "none" : "flex" }}
                                >
                                  {creator.initials}
                                </div>
                              </div>
                              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate">{creator.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {postsForDay.length === 0 && (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                        No posts scheduled
                      </div>
                    )}
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPostOnDate(dayItem.date);
                      }}
                      className="w-full mt-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FiPlus size={12} /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LIST VIEW */}
      {viewMode === "List" && (
        <div className="bg-white dark:bg-[#080d19] border border-slate-200/80 dark:border-[#1e2a40] rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Planned Social Media Posts ({calendarTasks.length})
            </h3>
            {!isReadOnly && (
              <button
                onClick={() => handleAddPostOnDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <FiPlus size={14} /> Add Post
              </button>
            )}
          </div>

          <div className="space-y-2">
            {calendarTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">
                No scheduled posts found for this month.
              </div>
            ) : (
              calendarTasks.map((task) => {
                const creator = getCreatorInfo(task);
                const typeStyle = getContentTypeStyle(task.contentType);
                const taskDiffHours = task.publishDate
                  ? (new Date(task.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                  : -1;
                const isRisk =
                  !["Completed", "Live"].includes(task.status) &&
                  taskDiffHours >= 0 &&
                  taskDiffHours <= 24;
                const statusStyle = getStatusCardStyles(task.status, isRisk);

                return (
                  <div
                    key={task._id}
                    onClick={(e) => handleCardClick(task, e)}
                    className={`p-3.5 rounded-xl border ${statusStyle.card} hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3`}
                    style={{ borderLeftWidth: "4px", borderLeftColor: task.clientColor || "#6366f1" }}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-14 text-center shrink-0">
                        <div className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {formatCardTime(task.publishDate)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(task.publishDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs" style={{ color: task.clientColor || "#6366f1" }}>
                            {task.clientName}
                          </span>
                          <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${typeStyle.bg}`}>
                            {typeStyle.label}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                          {task.taskTitle || "Untitled Task"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Creator Profile Chip */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#131d31] border border-slate-200/80 dark:border-white/10" title={`${creator.isAssignee ? "Assigned to" : "Created by"}: ${creator.name}`}>
                        <div className="relative w-5 h-5 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-2xs">
                          {creator.avatarUrl ? (
                            <img
                              src={creator.avatarUrl}
                              alt={creator.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".cal-list-fallback");
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="cal-list-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[8px] items-center justify-center uppercase shadow-2xs"
                            style={{ display: creator.avatarUrl ? "none" : "flex" }}
                          >
                            {creator.initials}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 max-w-[90px] truncate">
                          {creator.name}
                        </span>
                      </div>

                      {renderStatusBadge(task.status, isRisk)}

                      <button
                        type="button"
                        onClick={() => handleCardClick(task, { stopPropagation: () => {} })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title={isReadOnly ? "View post details" : "Edit post"}
                      >
                        {isReadOnly ? <FiEye size={14} /> : <FiEdit2 size={14} />}
                      </button>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(task, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          title="Delete post"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      </div>

      {/* Day Overview Popover / Modal when clicking "+X more" */}
      {selectedDayPosts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-[#1e2a40] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Scheduled Posts
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedDayPosts.date.getDate()} {MONTH_NAMES[selectedDayPosts.date.getMonth()]}{" "}
                  {selectedDayPosts.date.getFullYear()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayPosts(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayPosts.posts.map((post) => {
                const creator = getCreatorInfo(post);
                const typeStyle = getContentTypeStyle(post.contentType);
                const popDiffHours = post.publishDate
                  ? (new Date(post.publishDate).getTime() - Date.now()) / (1000 * 60 * 60)
                  : -1;
                const isRisk =
                  !["Completed", "Live"].includes(post.status) &&
                  popDiffHours >= 0 &&
                  popDiffHours <= 24;
                const statusStyle = getStatusCardStyles(post.status, isRisk);

                return (
                  <div
                    key={post._id}
                    onClick={(e) => {
                      setSelectedDayPosts(null);
                      handleCardClick(post, e);
                    }}
                    className={`p-3 rounded-xl border ${statusStyle.card} hover:shadow-xs transition-all cursor-pointer space-y-2`}
                    style={{ borderLeftWidth: "4px", borderLeftColor: post.clientColor || "#6366f1" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {formatCardTime(post.publishDate)}
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${typeStyle.bg}`}>
                          {typeStyle.label}
                        </span>
                      </div>
                      <div>{renderStatusBadge(post.status, isRisk)}</div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {post.taskTitle || "Untitled Task"}
                    </div>

                    <div className={`flex items-center justify-between pt-1.5 border-t ${statusStyle.divider} text-xs`}>
                      <span className="font-bold text-[11px]" style={{ color: post.clientColor || "#6366f1" }}>
                        {post.clientName}
                      </span>
                      <div className="flex items-center gap-1.5" title={`${creator.isAssignee ? "Assigned to" : "Created by"}: ${creator.name}`}>
                        <div className="relative w-4.5 h-4.5 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-2xs">
                          {creator.avatarUrl ? (
                            <img
                              src={creator.avatarUrl}
                              alt={creator.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".cal-modal-fallback");
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="cal-modal-fallback w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[8px] items-center justify-center uppercase shadow-2xs"
                            style={{ display: creator.avatarUrl ? "none" : "flex" }}
                          >
                            {creator.initials}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{creator.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isReadOnly && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const d = selectedDayPosts.date;
                    setSelectedDayPosts(null);
                    handleAddPostOnDate(d);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlus size={14} /> Add new post
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <SmTaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        task={selectedTaskForEdit}
        initialDate={initialDateForCreate}
        isReadOnly={isReadOnly}
        initialCommitment={true}
      />

      {/* Pending Commitment Modal (Detailed Client Breakdown) */}
      <PendingCommitmentModal
        isOpen={isPendingCommitmentOpen}
        onClose={() => setIsPendingCommitmentOpen(false)}
        clients={clients}
        tasks={tasks}
        currentMonth={currentMonth + 1}
        currentYear={currentYear}
        onSelectClient={(clientName) => {
          setSelectedClient(clientName);
        }}
        onCreateTaskForClient={isReadOnly ? null : (clientObj) => {
          setSelectedTaskForEdit({
            client: clientObj?._id,
            clientName: clientObj?.companyName,
            clientColor: clientObj?.color,
          });
          setInitialDateForCreate(new Date());
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

      {/* Excel / CSV Commitment Import Modal */}
      <SmImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        clients={clients}
        users={users}
        onSuccess={(meta) => {
          if (meta?.targetMonth !== undefined && meta.targetMonth !== currentMonth) {
            const nextYear = meta.targetYear || currentYear;
            const nextMonth = meta.targetMonth;
            setCurrentDate(new Date(nextYear, nextMonth, 1));
            dispatch(getSocialmediaTasks({ year: nextYear, month: nextMonth + 1 }));
            dispatch(getSocialmediaStats({ year: nextYear, month: nextMonth + 1 }));
          } else {
            dispatch(getSocialmediaTasks({ year: currentYear, month: currentMonth + 1 }));
            dispatch(getSocialmediaStats({ year: currentYear, month: currentMonth + 1 }));
          }
          // Reset filters so newly imported posts immediately show up
          setSelectedClient("All");
          setSelectedAssignee("All");
          setSelectedStatus("All");
          setSelectedCategory("Content Calendar");
          setSelectedContentType("All");
        }}
      />
    </div>
  );
};

export default ContentCalendar;
