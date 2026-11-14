import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiCheckCircle,
  FiCheck,
 
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiTrendingUp,
  FiSquare,
  FiInfo,
  FiShield,
  FiSearch,
  FiTarget,
  FiZap,
  FiMonitor,
  FiBarChart2,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaUsers,
  FaListUl,
  FaHandshake,
  FaCalendarAlt,
  FaLightbulb,
  FaImage,
  FaFileAlt,
} from "react-icons/fa";
import { HiOutlineShieldCheck, HiOutlineUserGroup } from "react-icons/hi2";
import toast from "react-hot-toast";
import axiosInstance from "../../services/axiosInstance";

// 15 Standard Routine Slots (Available client-side for INSTANT 0ms First Paint)
const DEFAULT_SCHEDULE_SLOTS = [
  {
    slotId: "slot-1",
    timeRange: "9:00 – 9:15 AM",
    startTime: "09:00",
    endTime: "09:15",
    title: "WhatsApp Group Review",
    points: [
      "Check all client WhatsApp groups.",
      "Review new requests, updates, approvals and pending requirements.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-1-sub-1", text: "Check all client WhatsApp groups" },
      { id: "slot-1-sub-2", text: "Review new requests, updates, approvals & pending requirements" },
    ],
  },
  {
    slotId: "slot-2",
    timeRange: "9:15 – 9:30 AM",
    startTime: "09:15",
    endTime: "09:30",
    title: "Designer & Videographer Work Allocation",
    points: [
      "Assign designer and videographer tasks.",
      "Review previous-day pending works.",
      "Schedule and prioritise today’s deliverables.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-2-sub-1", text: "Assign designer and videographer tasks" },
      { id: "slot-2-sub-2", text: "Review previous-day pending works" },
      { id: "slot-2-sub-3", text: "Schedule and prioritise today’s deliverables" },
    ],
  },
  {
    slotId: "slot-3",
    timeRange: "9:30 – 9:45 AM",
    startTime: "09:30",
    endTime: "09:45",
    title: "Social Media Work Update",
    points: [
      "Review and update SM tasks client-wise.",
      "Ensure all tasks are properly sorted and prioritised for each client.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-3-sub-1", text: "Review and update SM tasks client-wise" },
      { id: "slot-3-sub-2", text: "Ensure all tasks are properly sorted and prioritised for each client" },
    ],
  },
  {
    slotId: "slot-4",
    timeRange: "9:45 – 10:30 AM",
    startTime: "09:45",
    endTime: "10:30",
    title: "Story Posting & Engagement",
    points: [
      "Add and schedule the day’s stories.",
      "Ensure 1 CTA link is included.",
      "Add 1 quiz or poll-based story for engagement.",
    ],
    benchmark: "Must include 1 CTA link + 1 quiz/poll-based story",
    subtasks: [
      { id: "slot-4-sub-1", text: "Add and schedule the day’s stories" },
      { id: "slot-4-sub-2", text: "Ensure 1 CTA link is included" },
      { id: "slot-4-sub-3", text: "Add 1 quiz or poll-based story for engagement" },
    ],
  },
  {
    slotId: "slot-5",
    timeRange: "10:30 – 11:30 AM",
    startTime: "10:30",
    endTime: "11:30",
    title: "Social Media Analytics Review",
    points: [
      "Capture and review story and post analytics.",
      "Analyse the last 3 posts: Likes, Comments, Reach/engagement, Follower growth.",
      "Identify content that is performing well and areas that need improvement.",
    ],
    benchmark: "Review story analytics & last 3 posts performance metrics",
    subtasks: [
      { id: "slot-5-sub-1", text: "Capture and review story and post analytics" },
      { id: "slot-5-sub-2", text: "Analyse last 3 posts: Likes, Comments, Reach, Follower growth" },
      { id: "slot-5-sub-3", text: "Identify high-performing content & improvement areas" },
    ],
  },
  {
    slotId: "slot-6",
    timeRange: "11:30 AM – 1:00 PM",
    startTime: "11:30",
    endTime: "13:00",
    title: "Client Follow-ups & Execution",
    points: [
      "Review pending tasks for each client.",
      "Follow up on pending approvals and requirements.",
      "Execute MOM-based action points.",
      "Plan campaigns and offers for each client.",
      "Review and respond to GMB reviews.",
    ],
    benchmark: "MOM execution & GMB review replies",
    subtasks: [
      { id: "slot-6-sub-1", text: "Review pending tasks for each client" },
      { id: "slot-6-sub-2", text: "Follow up on pending approvals & requirements" },
      { id: "slot-6-sub-3", text: "Execute MOM-based action points" },
      { id: "slot-6-sub-4", text: "Plan campaigns and offers for each client" },
      { id: "slot-6-sub-5", text: "Review and respond to GMB reviews" },
    ],
  },
  {
    slotId: "slot-7",
    timeRange: "1:00 – 1:30 PM",
    startTime: "13:00",
    endTime: "13:30",
    title: "First-Half Designer Work Review",
    points: [
      "Check all designers’ first-half work.",
      "Review completed, pending and ongoing tasks.",
      "Update and organise work status client-wise.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-7-sub-1", text: "Check all designers’ first-half work" },
      { id: "slot-7-sub-2", text: "Review completed, pending and ongoing tasks" },
      { id: "slot-7-sub-3", text: "Update and organise work status client-wise" },
    ],
  },
  {
    slotId: "slot-8",
    timeRange: "2:15 – 2:30 PM",
    startTime: "14:15",
    endTime: "14:30",
    title: "Second-Half Work Planning",
    points: [
      "Plan and assign second-half tasks for designers and videographers.",
      "Re-prioritise urgent and deadline-based deliverables.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-8-sub-1", text: "Plan & assign 2nd-half tasks for designers and videographers" },
      { id: "slot-8-sub-2", text: "Re-prioritise urgent and deadline deliverables" },
    ],
  },
  {
    slotId: "slot-9",
    timeRange: "2:30 – 3:30 PM",
    startTime: "14:30",
    endTime: "15:30",
    title: "Competitor Deep Scan",
    points: [
      "Research relevant competitors and identify: Offers, Content hooks, Campaign ideas, Collaborations, Trending strategies.",
    ],
    benchmark: "1 India-level competitor | 1 Global competitor | 3 Local competitors",
    subtasks: [
      { id: "slot-9-sub-1", text: "1 India-level competitor scan (Offers, Hooks, Campaigns)" },
      { id: "slot-9-sub-2", text: "1 Global competitor scan (Collaborations, Trends)" },
      { id: "slot-9-sub-3", text: "3 Local competitors scan (Regional trends & strategies)" },
    ],
  },
  {
    slotId: "slot-10",
    timeRange: "3:30 – 4:00 PM",
    startTime: "15:30",
    endTime: "16:00",
    title: "Growth & Client Account Review",
    points: [
      "DM 3 Micro/Nano barter influencers per client for collaborations.",
      "Plan story additions, discount/gift-based collaborations.",
      "Conduct website audit.",
      "Check GMB updates and reviews.",
      "Update Instagram Highlights.",
      "Cross-check Facebook.",
      "QC the last 1 week of posts.",
      "Review sales reports.",
      "Handle client calls and follow-ups.",
    ],
    benchmark: "DM 3 Micro/Nano barter influencers per client",
    subtasks: [
      { id: "slot-10-sub-1", text: "DM 3 Micro/Nano barter influencers per client" },
      { id: "slot-10-sub-2", text: "Plan story additions & discount/gift collaborations" },
      { id: "slot-10-sub-3", text: "Conduct website audit & check GMB updates" },
      { id: "slot-10-sub-4", text: "Update Instagram Highlights & cross-check Facebook" },
      { id: "slot-10-sub-5", text: "QC last 1 week of posts & review sales reports" },
      { id: "slot-10-sub-6", text: "Handle client calls and follow-ups" },
    ],
  },
  {
    slotId: "slot-11",
    timeRange: "4:15 – 5:00 PM",
    startTime: "16:15",
    endTime: "17:00",
    title: "Next-Day Content Planning",
    points: [
      "Plan next day’s story sequence.",
      "Brainstorm hooks for reels.",
      "Prepare the next day’s reel plan.",
      "Prepare tomorrow’s post caption.",
      "Research relevant reel trends and content formats.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-11-sub-1", text: "Plan next day’s story sequence" },
      { id: "slot-11-sub-2", text: "Brainstorm hooks for reels & reel plan" },
      { id: "slot-11-sub-3", text: "Prepare tomorrow’s post caption" },
      { id: "slot-11-sub-4", text: "Research relevant reel trends and content formats" },
    ],
  },
  {
    slotId: "slot-12",
    timeRange: "5:00 – 5:15 PM",
    startTime: "17:00",
    endTime: "17:15",
    title: "Designer & Videographer Work Review",
    points: [
      "Check the day’s completed and pending work.",
      "Ensure priority deliverables are on track.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-12-sub-1", text: "Check the day’s completed and pending work" },
      { id: "slot-12-sub-2", text: "Ensure priority deliverables are on track" },
    ],
  },
  {
    slotId: "slot-13",
    timeRange: "5:15 – 5:30 PM",
    startTime: "17:15",
    endTime: "17:30",
    title: "Final QC & Client Group Update",
    points: [
      "QC today’s post.",
      "Share the approved post/content in the respective client group.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-13-sub-1", text: "QC today’s post thoroughly" },
      { id: "slot-13-sub-2", text: "Share approved post/content in respective client WhatsApp group" },
    ],
  },
  {
    slotId: "slot-14",
    timeRange: "5:30 – 5:45 PM",
    startTime: "17:30",
    endTime: "17:45",
    title: "EOD Reporting",
    points: [
      "Prepare and share EOD reports for all client groups.",
      "Mention completed, pending and carry-forward tasks.",
    ],
    benchmark: "Completed, pending & carry-forward tasks breakdown",
    subtasks: [
      { id: "slot-14-sub-1", text: "Prepare and share EOD reports for all client groups" },
      { id: "slot-14-sub-2", text: "Mention completed, pending and carry-forward tasks" },
    ],
  },
  {
    slotId: "slot-15",
    timeRange: "5:45 – 6:00 PM",
    startTime: "17:45",
    endTime: "18:00",
    title: "Daily Team Meeting",
    points: [
      "Review the day’s execution.",
      "Discuss pending/blocked tasks.",
      "Confirm priorities and responsibilities for the next day.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-15-sub-1", text: "Review the day’s execution" },
      { id: "slot-15-sub-2", text: "Discuss pending / blocked tasks" },
      { id: "slot-15-sub-3", text: "Confirm priorities & responsibilities for next day" },
    ],
  },
];

// Helper to format date as YYYY-MM-DD
const formatDateToISO = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Helper to format time (e.g. 09:12:30 AM)
const formatExactTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatShortTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// 4-Phase Timeline Color Mapping matching the Reference Image:
// Phase 1 (Green): Slots 1 - 3 (9:00 - 9:45 AM)
// Phase 2 (Sky Blue): Slots 4 - 5 (9:45 - 11:30 AM)
// Phase 3 (Indigo/Purple): Slots 6 - 7 (11:30 AM - 1:30 PM)
// Phase 4 (Amber/Golden): Slots 8 - 15 (2:15 - 6:00 PM)
const getSlotTimelineConfig = (slotId) => {
  const num = parseInt((slotId || "").replace("slot-", ""), 10) || 1;
  if (num <= 3) {
    return {
      num,
      lineColor: "#10b981",
      borderColor: "border-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      pulseColor: "ring-emerald-400/30",
      phaseLabel: "Morning Setup",
    };
  } else if (num <= 5) {
    return {
      num,
      lineColor: "#0284c7",
      borderColor: "border-sky-500",
      textColor: "text-sky-600 dark:text-sky-400",
      pulseColor: "ring-sky-400/30",
      phaseLabel: "Posting & Analytics",
    };
  } else if (num <= 7) {
    return {
      num,
      lineColor: "#4f46e5",
      borderColor: "border-indigo-600",
      textColor: "text-indigo-600 dark:text-indigo-400",
      pulseColor: "ring-indigo-400/30",
      phaseLabel: "Execution & Review",
    };
  } else {
    return {
      num,
      lineColor: "#d97706",
      borderColor: "border-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      pulseColor: "ring-amber-400/30",
      phaseLabel: "Execution & EOD",
    };
  }
};

// Exact 15 Activity Icons and Capsule Styles matching the Reference Image
const SLOT_ACTIVITY_ICONS = {
  "slot-1": {
    Icon: FaWhatsapp,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
  },
  "slot-2": {
    Icon: FaUsers,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-3": {
    Icon: FaListUl,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-4": {
    Icon: FiTarget,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60",
  },
  "slot-5": {
    Icon: FiBarChart2,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-6": {
    Icon: FaHandshake,
    iconColor: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
  },
  "slot-7": {
    Icon: FiMonitor,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-8": {
    Icon: FaCalendarAlt,
    iconColor: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60",
  },
  "slot-9": {
    Icon: FiSearch,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800/60",
  },
  "slot-10": {
    Icon: FiTrendingUp,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
  },
  "slot-11": {
    Icon: FaLightbulb,
    iconColor: "text-amber-500 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
  },
  "slot-12": {
    Icon: FaImage,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-13": {
    Icon: HiOutlineShieldCheck,
    iconColor: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60",
  },
  "slot-14": {
    Icon: FaFileAlt,
    iconColor: "text-amber-800 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
  },
  "slot-15": {
    Icon: HiOutlineUserGroup,
    iconColor: "text-purple-700 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60",
  },
};

const buildInitialScheduleState = (dateStr) => ({
  date: dateStr,
  slots: DEFAULT_SCHEDULE_SLOTS.map((slot) => ({
    ...slot,
    completed: false,
    completedAt: null,
    completedBy: null,
    completedByName: "",
    isOnTime: false,
    timingStatus: "pending",
    notes: "",
    subtasks: slot.subtasks.map((st) => ({
      ...st,
      completed: false,
      completedAt: null,
    })),
  })),
  completedSlotsCount: 0,
  totalSlotsCount: 15,
  completionPercentage: 0,
  onTimeSlotsCount: 0,
  delayedSlotsCount: 0,
});

const isSocialMediaExecutive = (u) => {
  if (!u || u.employmentStatus === "relieved") return false;
  const dept = (u.department || "").toLowerCase().trim();
  const role = (u.role || "").toLowerCase().trim();
  const desig = (u.designation || "").toLowerCase().trim();
  return (
    dept.includes("social media") ||
    dept.includes("sme") ||
    role.includes("social media") ||
    role.includes("smm") ||
    role === "socialmediamanager" ||
    role === "socialmediaexecutive" ||
    desig.includes("social media") ||
    desig.includes("smm")
  );
};

// Persistent Module-Level Caches across tab changes & unmounts (0ms instant recall)
const GLOBAL_SCHEDULE_CACHE = new Map();
const GLOBAL_EXECUTIVES_SUMMARY_CACHE = new Map();

// High Performance Stagger Container for Smooth UI Entry
const timelineContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.01,
    },
  },
};

// Fluid Spring Physics Card Transition
const slotCardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

// Compact Executive Avatar Component with profile image & initials fallback
const ExecutiveAvatar = ({ user, avatarUrl, isAllDone, hasStarted }) => {
  const [imgError, setImgError] = useState(false);
  const initials = (user?.name || "SM")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showImage = Boolean(avatarUrl && !imgError);

  return (
    <div className="relative shrink-0">
      {showImage ? (
        <img
          src={avatarUrl}
          alt={user?.name || "Executive"}
          onError={() => setImgError(true)}
          className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full object-cover ring-1 ring-slate-200/90 dark:ring-white/20 shadow-2xs"
        />
      ) : (
        <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-[9.5px] sm:text-[10px] flex items-center justify-center uppercase shadow-2xs ring-1 ring-white/30">
          {initials}
        </div>
      )}

      {/* Mini Status Indicator Dot */}
      {isAllDone ? (
        <span
          title="All 15 tasks completed"
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6.5px] font-black ring-1 ring-white dark:ring-[#0c1220]"
        >
          ✓
        </span>
      ) : hasStarted ? (
        <span
          title="In progress"
          className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-[#0c1220] animate-pulse"
        />
      ) : (
        <span
          title="Pending"
          className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-1 ring-white dark:ring-[#0c1220]"
        />
      )}
    </div>
  );
};

const DailyWorkScheduleTab = ({ user: propUser, users: propUsers = [] }) => {
  const authState = useSelector((state) => state.auth);
  const currentUser = propUser || authState?.user;

  // In-memory cache to prevent redundant fetches and make tab/date/executive switching 0ms instantaneous
  const scheduleCacheRef = useRef(new Map());

  // Carousel ref for smooth left/right horizontal scrolling
  const carouselRef = useRef(null);
  const scrollCarousel = (offset) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Extract clean avatar URL from user object or profile
  const extractAvatarUrl = useCallback((target) => {
    if (!target) return null;
    if (typeof target === "string") {
      const trimmed = target.trim();
      if (!trimmed) return null;
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

  // Lookup map for fast profile photo and user details resolution
  const usersMap = useMemo(() => {
    const map = new Map();
    (propUsers || []).forEach((u) => {
      if (u._id) map.set(u._id.toString(), u);
      if (u.id) map.set(u.id.toString(), u);
      if (u.name) map.set(u.name.trim().toLowerCase(), u);
    }); 
    return map;
  }, [propUsers]);

  // Robust resolver for executive profile picture
  const getExecutiveAvatarUrl = useCallback(
    (execUser) => {
      if (!execUser) return null;
      const direct = extractAvatarUrl(execUser);
      if (direct) return direct;

      if (execUser._id && usersMap.has(execUser._id.toString())) {
        const fromFound = extractAvatarUrl(usersMap.get(execUser._id.toString()));
        if (fromFound) return fromFound;
      }

      if (execUser.name && usersMap.has(execUser.name.trim().toLowerCase())) {
        const fromFound = extractAvatarUrl(usersMap.get(execUser.name.trim().toLowerCase()));
        if (fromFound) return fromFound;
      }

      return null;
    },
    [extractAvatarUrl, usersMap]
  );

  // Determine user leadership status
  const isLeadership = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || "").toLowerCase().replace(/[\s_]/g, "");
    const dept = (currentUser.department || "").toLowerCase().trim();
    const desig = (currentUser.designation || "").toLowerCase().trim();

    return (
      role === "admin" ||
      role === "operationmanager" ||
      role === "socialmediamanager" ||
      role === "socialmediahead" ||
      dept.includes("admin") ||
      dept.includes("operation") ||
      dept.includes("social media head") ||
      desig.includes("social media head") ||
      (dept.includes("social media") && (role.includes("head") || desig.includes("head") || role.includes("manager")))
    );
  }, [currentUser]);

  // Date State (Defaults to Today)
  const todayStr = useMemo(() => formatDateToISO(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Pre-extract Social Media Executives from propUsers (Redux) immediately for instant executive picker
  const smExecutivesFromProps = useMemo(() => {
    if (!propUsers || propUsers.length === 0) return [];
    return propUsers.filter(isSocialMediaExecutive);
  }, [propUsers]);

  // Initial executive ID selection (0ms latency!)
  const initialExecutiveId = useMemo(() => {
    if (isLeadership) {
      if (smExecutivesFromProps.length > 0) return smExecutivesFromProps[0]._id;
      return null;
    }
    return currentUser?._id;
  }, [isLeadership, smExecutivesFromProps, currentUser]);

  const [selectedExecutiveId, setSelectedExecutiveId] = useState(initialExecutiveId);
  const [executivesSummary, setExecutivesSummary] = useState(() => {
    if (GLOBAL_EXECUTIVES_SUMMARY_CACHE.has(todayStr)) {
      return GLOBAL_EXECUTIVES_SUMMARY_CACHE.get(todayStr);
    }
    return [];
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Target executive user being viewed
  const effectiveUserId = useMemo(() => {
    if (isLeadership && selectedExecutiveId) {
      return selectedExecutiveId;
    }
    return currentUser?._id;
  }, [isLeadership, selectedExecutiveId, currentUser]);

  // Active executive user object for header context display
  const activeExecutiveUser = useMemo(() => {
    if (!isLeadership) return currentUser;
    if (selectedExecutiveId) {
      const execObj = executivesSummary.find((e) => e.user?._id === selectedExecutiveId);
      if (execObj?.user) return execObj.user;
      const foundInProps = smExecutivesFromProps.find((u) => u._id === selectedExecutiveId);
      if (foundInProps) return foundInProps;
    }
    return currentUser;
  }, [isLeadership, selectedExecutiveId, executivesSummary, smExecutivesFromProps, currentUser]);

  // Initialize schedule with instant module cache or default template (0ms first paint!)
  const [scheduleData, setScheduleData] = useState(() => {
    const cacheKey = `${initialExecutiveId || currentUser?._id}_${todayStr}`;
    if (GLOBAL_SCHEDULE_CACHE.has(cacheKey)) {
      return GLOBAL_SCHEDULE_CACHE.get(cacheKey);
    }
    return buildInitialScheduleState(todayStr);
  });
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(null);

  // Filter & Search inside the schedule
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch executives summary (only runs when selectedDate or isLeadership changes - no infinite loop!)
  useEffect(() => {
    if (!isLeadership) return;
    let isCancelled = false;

    // A. 0ms instant render from module cache if available
    if (GLOBAL_EXECUTIVES_SUMMARY_CACHE.has(selectedDate)) {
      setExecutivesSummary(GLOBAL_EXECUTIVES_SUMMARY_CACHE.get(selectedDate));
    }

    // B. Revalidate silently in background
    const loadExecutivesSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const res = await axiosInstance.get(
          `/socialmedia-task-calendar/daily-schedule/executives-summary?date=${selectedDate}`
        );
        if (!isCancelled && res.data?.success) {
          const summary = res.data.summary || [];
          GLOBAL_EXECUTIVES_SUMMARY_CACHE.set(selectedDate, summary);
          setExecutivesSummary(summary);

          // If no executive selected yet, select the first one
          setSelectedExecutiveId((prev) => {
            if (!prev && summary.length > 0) {
              return summary[0]?.user?._id;
            }
            return prev;
          });
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to load executives summary:", err);
      } finally {
        if (!isCancelled) setIsLoadingSummary(false);
      }
    };

    loadExecutivesSummary();
    return () => {
      isCancelled = true;
    };
  }, [isLeadership, selectedDate]);

  // 2. Fetch specific schedule with SWR Cache (Instant render + silent background revalidation)
  useEffect(() => {
    if (!effectiveUserId) return;
    let isCancelled = false;
    const cacheKey = `${effectiveUserId}_${selectedDate}`;

    // A. Check in-memory module cache first for INSTANT 0ms load
    if (GLOBAL_SCHEDULE_CACHE.has(cacheKey)) {
      setScheduleData(GLOBAL_SCHEDULE_CACHE.get(cacheKey));
    } else {
      // Immediate clean baseline for target date (avoids showing stale previous date/user)
      setScheduleData(buildInitialScheduleState(selectedDate));
    }

    // B. Fetch fresh data in background
    const loadSchedule = async () => {
      try {
        setIsFetchingSchedule(true);
        const res = await axiosInstance.get(
          `/socialmedia-task-calendar/daily-schedule?date=${selectedDate}&userId=${effectiveUserId}`
        );
        if (!isCancelled && res.data?.success && res.data.schedule) {
          const freshData = res.data.schedule;
          GLOBAL_SCHEDULE_CACHE.set(cacheKey, freshData);
          setScheduleData(freshData);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to load daily schedule:", err);
          if (!GLOBAL_SCHEDULE_CACHE.has(cacheKey)) {
            setScheduleData(buildInitialScheduleState(selectedDate));
          }
        }
      } finally {
        if (!isCancelled) setIsFetchingSchedule(false);
      }
    };

    loadSchedule();
    return () => {
      isCancelled = true;
    };
  }, [effectiveUserId, selectedDate]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateToISO(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateToISO(d));
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  // Toggle Slot Completion (Optimistic 0ms UI update)
  const handleToggleSlot = async (slot) => {
    if (!scheduleData) return;
    const targetUserId = effectiveUserId;
    const slotId = slot.slotId;
    const nextCompleted = !slot.completed;
    const cacheKey = `${targetUserId}_${selectedDate}`;

    // Optimistic UI update
    const previousSchedule = { ...scheduleData };
    const nowISO = new Date().toISOString();

    const updatedSlots = (scheduleData.slots || []).map((s) => {
      if (s.slotId === slotId) {
        return {
          ...s,
          completed: nextCompleted,
          completedAt: nextCompleted ? nowISO : null,
          completedByName: nextCompleted ? currentUser?.name : "",
          timingStatus: nextCompleted ? "on-time" : "pending",
          isOnTime: nextCompleted,
          subtasks: (s.subtasks || []).map((st) => ({
            ...st,
            completed: nextCompleted,
            completedAt: nextCompleted ? nowISO : null,
          })),
        };
      }
      return s;
    });

    const newCompletedCount = updatedSlots.filter((s) => s.completed).length;
    const optimisticSchedule = {
      ...scheduleData,
      slots: updatedSlots,
      completedSlotsCount: newCompletedCount,
      completionPercentage: Math.round((newCompletedCount / 15) * 100),
    };

    setScheduleData(optimisticSchedule);
    GLOBAL_SCHEDULE_CACHE.set(cacheKey, optimisticSchedule);
    setIsUpdatingSlot(slotId);

    // Optimistically update executive selector badge in 0ms!
    if (isLeadership) {
      setExecutivesSummary((prev) =>
        prev.map((e) => {
          if (e.user?._id === targetUserId) {
            return {
              ...e,
              completedSlotsCount: newCompletedCount,
              completionPercentage: Math.round((newCompletedCount / 15) * 100),
              isAllDone: newCompletedCount >= 15,
            };
          }
          return e;
        })
      );
    }

    try {
      const res = await axiosInstance.patch(
        "/socialmedia-task-calendar/daily-schedule/toggle-slot",
        {
          date: selectedDate,
          slotId,
          completed: nextCompleted,
          userId: targetUserId,
        }
      );

      if (res.data?.success) {
        const serverSchedule = res.data.schedule;
        setScheduleData(serverSchedule);
        GLOBAL_SCHEDULE_CACHE.set(cacheKey, serverSchedule);

        if (nextCompleted) {
          toast.success(`✓ "${slot.title}" completed!`);
        } else {
          toast(`Unchecked "${slot.title}"`, { icon: "↩️" });
        }

        // Reconcile leadership executive pill with server calculations
        if (isLeadership) {
          setExecutivesSummary((prev) =>
            prev.map((e) => {
              if (e.user?._id === targetUserId) {
                return {
                  ...e,
                  completedSlotsCount: serverSchedule.completedSlotsCount,
                  completionPercentage: serverSchedule.completionPercentage,
                  onTimeSlotsCount: serverSchedule.onTimeSlotsCount,
                  delayedSlotsCount: serverSchedule.delayedSlotsCount,
                  isAllDone: serverSchedule.completedSlotsCount >= 15,
                };
              }
              return e;
            })
          );
        }
      }
    } catch (err) {
      console.error("Failed to update slot:", err);
      toast.error(err?.response?.data?.message || "Failed to update slot status");
      // Rollback
      setScheduleData(previousSchedule);
      GLOBAL_SCHEDULE_CACHE.set(cacheKey, previousSchedule);
    } finally {
      setIsUpdatingSlot(null);
    }
  };

  // Toggle Subtask Completion (Optimistic 0ms UI update)
  const handleToggleSubtask = async (slot, subtask, e) => {
    if (e) e.stopPropagation();
    if (!scheduleData) return;
    const targetUserId = effectiveUserId;
    const slotId = slot.slotId;
    const subtaskId = subtask.id;
    const nextCompleted = !subtask.completed;
    const cacheKey = `${targetUserId}_${selectedDate}`;

    // 0ms Optimistic Subtask UI update
    const previousSchedule = { ...scheduleData };
    const nowISO = new Date().toISOString();

    const updatedSlots = (scheduleData.slots || []).map((s) => {
      if (s.slotId === slotId) {
        return {
          ...s,
          subtasks: (s.subtasks || []).map((st) => {
            if (st.id === subtaskId) {
              return {
                ...st,
                completed: nextCompleted,
                completedAt: nextCompleted ? nowISO : null,
              };
            }
            return st;
          }),
        };
      }
      return s;
    });

    const optimisticSchedule = { ...scheduleData, slots: updatedSlots };
    setScheduleData(optimisticSchedule);
    GLOBAL_SCHEDULE_CACHE.set(cacheKey, optimisticSchedule);

    try {
      const res = await axiosInstance.patch(
        "/socialmedia-task-calendar/daily-schedule/toggle-subtask",
        {
          date: selectedDate,
          slotId,
          subtaskId,
          completed: nextCompleted,
          userId: targetUserId,
        }
      );

      if (res.data?.success) {
        const serverSchedule = res.data.schedule;
        setScheduleData(serverSchedule);
        GLOBAL_SCHEDULE_CACHE.set(cacheKey, serverSchedule);
      }
    } catch (err) {
      console.error("Failed to update subtask:", err);
      toast.error("Failed to update subtask");
      setScheduleData(previousSchedule);
      GLOBAL_SCHEDULE_CACHE.set(cacheKey, previousSchedule);
    }
  };

  // Formatted date string for header
  const formattedDateHeader = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return selectedDate;
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  // Current active slot check based on now
  const activeSlotIdNow = useMemo(() => {
    if (selectedDate !== todayStr) return null;
    const now = new Date();
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();

    const found = (scheduleData?.slots || []).find((s) => {
      const [sh, sm] = (s.startTime || "00:00").split(":").map(Number);
      const [eh, em] = (s.endTime || "23:59").split(":").map(Number);
      return currentTotalMin >= sh * 60 + sm && currentTotalMin <= eh * 60 + em;
    });

    return found?.slotId || null;
  }, [selectedDate, todayStr, scheduleData]);

  // Filtered Slots for Display
  const displayedSlots = useMemo(() => {
    if (!scheduleData?.slots) return [];
    return scheduleData.slots.filter((slot) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = slot.title?.toLowerCase().includes(q);
        const matchesTime = slot.timeRange?.toLowerCase().includes(q);
        const matchesPoints = slot.points?.some((p) => p.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTime && !matchesPoints) return false;
      }

      if (statusFilter === "completed" && !slot.completed) return false;
      if (statusFilter === "pending" && slot.completed) return false;
      if (statusFilter === "ontime" && (!slot.completed || slot.timingStatus === "delayed")) return false;
      if (statusFilter === "delayed" && (!slot.completed || slot.timingStatus !== "delayed")) return false;

      return true;
    });
  }, [scheduleData, statusFilter, searchQuery]);

  // Resolved user being inspected
  const currentlyViewedUser = useMemo(() => {
    if (isLeadership && selectedExecutiveId) {
      const execObj = executivesSummary.find((e) => e.user?._id === selectedExecutiveId);
      if (execObj?.user) return execObj.user;
      const propFound = smExecutivesFromProps.find((u) => u._id === selectedExecutiveId);
      if (propFound) return propFound;
    }
    return currentUser;
  }, [isLeadership, selectedExecutiveId, executivesSummary, smExecutivesFromProps, currentUser]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 1. TOP HEADER & CALENDAR DATE FILTER BAR */}
      <div className="bg-white dark:bg-[#0c1220] rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Title & Executive context */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xs shadow-indigo-500/20">
              <FiClock size={15} className="stroke-[2.5]" />
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daily Work Schedule
            </h2>
           
            {isFetchingSchedule && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 animate-pulse pl-1">
                <FiRefreshCw size={10} className="animate-spin" />
                <span>Syncing live...</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {isLeadership ? (
                <>
                  Viewing:{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {activeExecutiveUser?.name || "Executive"}
                  </strong>
                </>
              ) : (
                "Complete routine checklist slots on-time"
              )}
            </span>
            <span className="text-slate-400 dark:text-slate-500 mx-1.5">•</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={selectedDate}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="inline-block text-slate-500 dark:text-slate-400 font-medium"
              >
                {formattedDateHeader}
              </motion.span>
            </AnimatePresence>
          </p>
        </div>

        {/* Right: Daily Wise Calendar Filter Navigation */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          <div className="inline-flex items-center bg-slate-100/90 dark:bg-[#131d31] p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10 gap-0.5 shadow-inner">
            {/* Previous Day Button */}
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a253c] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Previous Day"
            >
              <FiChevronLeft size={14} />
            </button>

            {/* Date Picker Input */}
            <div className="relative inline-flex items-center">
        
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="pl-6 pr-2 py-0.5 rounded-lg bg-white dark:bg-[#0c1220] border border-slate-200/70 dark:border-white/10 text-[11px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                selectedDate === todayStr
                  ? "bg-indigo-600 text-white shadow-indigo-500/25"
                  : "bg-white dark:bg-[#0c1220] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#182338]"
              }`}
            >
              Today
            </button>

            {/* Next Day Button */}
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a253c] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Next Day"
            >
              <FiChevronRight size={14} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              GLOBAL_SCHEDULE_CACHE.clear();
              GLOBAL_EXECUTIVES_SUMMARY_CACHE.clear();
              toast.success("Schedule refreshed");
              const targetUserId = effectiveUserId;
              axiosInstance
                .get(`/socialmedia-task-calendar/daily-schedule?date=${selectedDate}&userId=${targetUserId}`)
                .then((res) => {
                  if (res.data?.success) {
                    GLOBAL_SCHEDULE_CACHE.set(`${targetUserId}_${selectedDate}`, res.data.schedule);
                    setScheduleData(res.data.schedule);
                  }
                });
            }}
            className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131d31] text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-[#182338] transition-colors cursor-pointer shadow-2xs"
            title="Refresh Schedule"
          >
            <FiRefreshCw size={13} className={isFetchingSchedule ? "animate-spin text-indigo-500" : ""} />
          </button>
        </div>
      </div>

      {/* Sleek Ambient Sync Progress Bar */}
      <div className="h-0.5 w-full bg-transparent overflow-hidden rounded-full -mt-2">
        {(isFetchingSchedule || isLoadingSummary) && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          />
        )}
      </div>

      {/* 2. LEADERSHIP EXECUTIVE SELECTOR CAROUSEL (ADMIN, OP MANAGER, SM HEAD) */}
      {isLeadership && (
        <div className="bg-white dark:bg-[#0c1220] rounded-xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FiUser size={11} className="stroke-[2.5]" />
              </span>
              <h3 className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Social Media Executives ({executivesSummary.length || smExecutivesFromProps.length})
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-[9.5px] text-slate-400 font-medium">
                Click executive to verify check-ins
              </span>
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => scrollCarousel(-220)}
                  className="w-5.5 h-5.5 rounded-md border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] hover:bg-slate-100 dark:hover:bg-[#182338] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <FiChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(220)}
                  className="w-5.5 h-5.5 rounded-md border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] hover:bg-slate-100 dark:hover:bg-[#182338] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <FiChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {(executivesSummary.length > 0 ? executivesSummary : smExecutivesFromProps.map((u) => ({
              user: u,
              completedSlotsCount: 0,
              completionPercentage: 0,
              onTimeSlotsCount: 0,
              delayedSlotsCount: 0,
            }))).map((exec) => {
              const execUser = exec.user || exec;
              const isSelected = selectedExecutiveId === execUser?._id;
              const isAllDone = exec.completedSlotsCount >= 15;
              const hasStarted = exec.completedSlotsCount > 0;
              const avatarUrl = getExecutiveAvatarUrl(execUser);

              return (
                <button
                  key={execUser?._id}
                  type="button"
                  onClick={() => setSelectedExecutiveId(execUser?._id)}
                  className={`group relative flex items-center gap-2 py-1 px-2 sm:px-2.5 rounded-lg border text-left transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 ring-1.5 ring-indigo-500/25 shadow-xs scale-[1.01]"
                      : "bg-slate-50/70 dark:bg-[#131d31] border-slate-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-[#19243a] hover:border-slate-300"
                  }`}
                >
                  {/* Executive Avatar with Profile Image + Fallback Initials */}
                  <ExecutiveAvatar
                    user={execUser}
                    avatarUrl={avatarUrl}
                    isAllDone={isAllDone}
                    hasStarted={hasStarted}
                  />

                  {/* Executive Info & Mini Progress Pill */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap truncate max-w-[90px] sm:max-w-[110px] block leading-tight">
                      {execUser?.name}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] leading-none whitespace-nowrap">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[8.5px] ${
                          isAllDone
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : hasStarted
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300"
                            : "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {exec.completedSlotsCount || 0} / 15 ({exec.completionPercentage || 0}%)
                      </span>
                      {exec.onTimeSlotsCount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[8.5px]">
                          • {exec.onTimeSlotsCount} on-time
                        </span>
                      )}
                      {exec.delayedSlotsCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-[8.5px]">
                          • {exec.delayedSlotsCount} late
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. FILTER BAR & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-[#0c1220] p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Slots", count: 15 },
            { id: "completed", label: "Completed", count: scheduleData?.completedSlotsCount || 0 },
            { id: "pending", label: "Pending", count: 15 - (scheduleData?.completedSlotsCount || 0) },
            { id: "ontime", label: "On-Time", count: scheduleData?.onTimeSlotsCount || 0 },
            { id: "delayed", label: "Late", count: scheduleData?.delayedSlotsCount || 0 },
          ].map((tab) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                  : "bg-slate-100 dark:bg-[#131d31] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#19243a]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white dark:bg-black/10 dark:text-slate-950"
                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Search Input with proper FiSearch icon */}
        <div className="relative w-full sm:w-64">
         
          <input
            type="text"
            placeholder="Search routine or slot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-[#131d31] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* 5. THE 15 SCHEDULE SLOTS TIMELINE LIST (Continuous Rail & Reference Image Time Area) */}
      <motion.div
        layout
        variants={timelineContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative pl-1 sm:pl-2"
      >
        <AnimatePresence mode="popLayout">
          {displayedSlots.length === 0 ? (
            <motion.div
              key="empty-schedule-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0c1220] rounded-xl p-8 text-center border border-slate-200/80 dark:border-white/10"
            >
              <FiInfo size={24} className="mx-auto text-slate-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                No matching routine slots found
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try changing your search term or filter selection.
              </p>
            </motion.div>
          ) : (
            displayedSlots.map((slot, index) => {
              const isCompleted = Boolean(slot.completed);
              const isCurrentSlot = activeSlotIdNow === slot.slotId;
              const isUpdating = isUpdatingSlot === slot.slotId;
              const isOnTime = slot.timingStatus === "on-time" || slot.timingStatus === "early";
              const config = getSlotTimelineConfig(slot.slotId);
              const nextSlot = displayedSlots[index + 1];
              const nextConfig = nextSlot ? getSlotTimelineConfig(nextSlot.slotId) : null;
              const activityMeta = SLOT_ACTIVITY_ICONS[slot.slotId] || {
                Icon: FiClock,
                iconColor: "text-slate-600 dark:text-slate-400",
                bgClass: "bg-slate-100 dark:bg-[#131d31] border-slate-200 dark:border-white/10",
              };
              const ActivityIcon = activityMeta.Icon;

              return (
                <motion.div
                  layout="position"
                  key={slot.slotId}
                  variants={slotCardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative flex items-stretch gap-2 sm:gap-3 pb-2.5 sm:pb-3 group"
                >
                  {/* Continuous Left Timeline Rail */}
                  <div className="relative flex flex-col items-center shrink-0 w-5 self-stretch">
                    {/* Top Line Segment (connects from top down to ring node) */}
                    <div
                      className={`w-[2px] shrink-0 ${index === 0 ? "opacity-0" : ""}`}
                      style={{
                        backgroundColor: config.lineColor,
                        height: "17px",
                      }}
                    />

                    {/* Circular Ring Node */}
                    <div
                      className={`w-[13px] h-[13px] rounded-full border-[2px] bg-white dark:bg-[#0c1220] z-10 shrink-0 shadow-2xs transition-all duration-200 group-hover:scale-110 ${
                        config.borderColor
                      } ${isCurrentSlot ? `ring-3 ${config.pulseColor} scale-105` : ""}`}
                      title={`${config.phaseLabel} (${slot.timeRange})`}
                    />

                    {/* Bottom Line Segment */}
                    <div
                      className={`w-[2px] grow ${
                        index === displayedSlots.length - 1 ? "opacity-0" : ""
                      }`}
                      style={{
                        background:
                          nextConfig && nextConfig.lineColor !== config.lineColor
                            ? `linear-gradient(to bottom, ${config.lineColor}, ${nextConfig.lineColor})`
                            : config.lineColor,
                      }}
                    />
                  </div>

                  {/* Main Schedule Card */}
                  <motion.div
                    layout
                    initial={false}
                    className={`grow min-w-0 relative rounded-xl p-3 sm:p-3.5 border transition-all ${
                      isCompleted
                        ? isOnTime
                          ? "bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/60 shadow-2xs hover:border-emerald-400"
                          : "bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/60 shadow-2xs hover:border-amber-400"
                        : isCurrentSlot
                        ? "bg-red-50/65 dark:bg-red-950/20 border-red-300 dark:border-red-800/60 ring-2 ring-red-400/40 shadow-sm"
                        : "bg-red-50/50 dark:bg-red-950/15 border-red-200/80 dark:border-red-900/40 shadow-2xs hover:border-red-300 dark:hover:border-red-800/50 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      {/* Left Column: Time Area (Capsule Pill + Verification Badge) */}
                      <div className="flex flex-col items-start gap-1.5 shrink-0 md:w-48">
                        {/* Time Capsule Pill */}
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#edf2fc] dark:bg-[#151f33] border border-[#dbe6f6] dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow">
                          <span className="font-bold text-[11px] sm:text-xs text-[#0f172a] dark:text-slate-100 tracking-tight whitespace-nowrap">
                            {slot.timeRange}
                          </span>
                        </div>

                        {/* Timing Verification Stamp & Slot Number */}
                        <div className="flex items-center gap-1.5 flex-wrap pl-0.5">
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            Slot {config.num}
                          </span>

                          {isCompleted ? (
                            isOnTime ? (
                              <span
                                title={`Checked on time at ${formatExactTime(slot.completedAt)}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>✓ On-Time ({formatShortTime(slot.completedAt)})</span>
                              </span>
                            ) : (
                              <span
                                title={`Checked at ${formatExactTime(slot.completedAt)} (Delayed update)`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>⏱ Late ({formatShortTime(slot.completedAt)})</span>
                              </span>
                            )
                          ) : isCurrentSlot ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700 animate-pulse">
                              <FiZap size={9} className="text-blue-600 dark:text-blue-400" />
                              <span>Active Now</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Column: Activity Icon & Task Details */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-start gap-2.5">
                          {/* Activity Icon Capsule */}
                          <div
                            className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${activityMeta.bgClass}`}
                            title={slot.title}
                          >
                            <ActivityIcon size={15} className={activityMeta.iconColor} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Title */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-xs sm:text-[13px] font-bold transition-colors ${
                                  isCompleted
                                    ? "text-slate-800 dark:text-slate-200 line-through decoration-emerald-500/50"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {slot.title}
                              </h4>
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                  <FiCheck size={9} className="stroke-[3]" />
                                  <span>Done</span>
                                </span>
                              )}
                            </div>

                            {/* Subtasks Interactive Checklist */}
                            {Array.isArray(slot.subtasks) && slot.subtasks.length > 0 && (
                              <div className="space-y-1 pt-0.5">
                                {slot.subtasks.map((st) => {
                                  const isSubDone = Boolean(st.completed);
                                  return (
                                    <motion.div
                                      whileHover={{ x: 2 }}
                                      whileTap={{ scale: 0.98 }}
                                      key={st.id}
                                      onClick={(e) => handleToggleSubtask(slot, st, e)}
                                      className={`group/sub flex items-start gap-2 text-[11px] sm:text-[11.5px] rounded-lg p-1 -ml-1 transition-colors cursor-pointer select-none ${
                                        isSubDone
                                          ? "text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
                                          : "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
                                      }`}
                                    >
                                      <div
                                        className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center transition-all shrink-0 ${
                                          isSubDone
                                            ? "bg-emerald-500 text-white shadow-2xs shadow-emerald-500/20"
                                            : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131d31] group-hover/sub:border-indigo-500"
                                        }`}
                                      >
                                        {isSubDone && <FiCheck size={9} className="stroke-[3]" />}
                                      </div>
                                      <span
                                        className={`leading-snug ${
                                          isSubDone ? "line-through text-slate-400 dark:text-slate-500" : "font-normal"
                                        }`}
                                      >
                                        {st.text}
                                      </span>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Benchmark Callout */}
                            {slot.benchmark && (
                              <div className="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 text-[10px] font-semibold text-purple-900 dark:text-purple-300 mt-0.5">
                                <FiTarget size={11} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                <span>Benchmark: {slot.benchmark}</span>
                              </div>
                            )}

                            {/* Completion Audit Log Footer */}
                            {isCompleted && slot.completedAt && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 pt-0.5">
                                <FiCheckCircle size={11} className="text-emerald-500 shrink-0" />
                                <span>
                                  Completed at <strong className="text-slate-700 dark:text-slate-200">{formatExactTime(slot.completedAt)}</strong>
                                  {slot.completedByName ? ` by ${slot.completedByName}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Interactive Checkbox Button */}
                      <div className="shrink-0 self-end md:self-center">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleSlot(slot)}
                          className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 ${
                            isCompleted
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                              : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300/80 dark:bg-[#131d31] dark:text-slate-200 dark:border-white/10 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                          }`}
                        >
                          {isUpdating ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isCompleted ? (
                            <>
                              <FiCheckCircle size={13} className="stroke-[2.5]" />
                              <span>Done</span>
                            </>
                          ) : (
                            <>
                              <FiCheck size={12} className="stroke-[2.5] text-slate-400 group-hover:text-emerald-600 transition-colors" />
                              <span>Mark Done</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default React.memo(DailyWorkScheduleTab);
