import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiCheckCircle,
  FiCheck,
  FiCalendar,
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
} from "react-icons/fi";
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

const DailyWorkScheduleTab = ({ user: propUser, users: propUsers = [] }) => {
  const authState = useSelector((state) => state.auth);
  const currentUser = propUser || authState?.user;

  // In-memory cache to prevent redundant fetches and make tab/date/executive switching 0ms instantaneous
  const scheduleCacheRef = useRef(new Map());

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
  const [executivesSummary, setExecutivesSummary] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Target executive user being viewed
  const effectiveUserId = useMemo(() => {
    if (isLeadership && selectedExecutiveId) {
      return selectedExecutiveId;
    }
    return currentUser?._id;
  }, [isLeadership, selectedExecutiveId, currentUser]);

  // Initialize schedule with instant default template (0ms first paint!)
  const [scheduleData, setScheduleData] = useState(() => buildInitialScheduleState(todayStr));
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(null);

  // Filter & Search inside the schedule
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch executives summary (only runs when selectedDate or isLeadership changes - no infinite loop!)
  useEffect(() => {
    if (!isLeadership) return;
    let isCancelled = false;

    const loadExecutivesSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const res = await axiosInstance.get(
          `/socialmedia-task-calendar/daily-schedule/executives-summary?date=${selectedDate}`
        );
        if (!isCancelled && res.data?.success) {
          const summary = res.data.summary || [];
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

    // A. Check in-memory cache first for INSTANT 0ms load
    if (scheduleCacheRef.current.has(cacheKey)) {
      setScheduleData(scheduleCacheRef.current.get(cacheKey));
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
          scheduleCacheRef.current.set(cacheKey, freshData);
          setScheduleData(freshData);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to load daily schedule:", err);
          // If not in cache and failed, ensure standard template is visible
          if (!scheduleCacheRef.current.has(cacheKey)) {
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
    scheduleCacheRef.current.set(cacheKey, optimisticSchedule);
    setIsUpdatingSlot(slotId);

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
        scheduleCacheRef.current.set(cacheKey, serverSchedule);

        if (nextCompleted) {
          toast.success(`✓ "${slot.title}" completed!`);
        } else {
          toast(`Unchecked "${slot.title}"`, { icon: "↩️" });
        }

        // Silently update leadership executive pill
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
      scheduleCacheRef.current.set(cacheKey, previousSchedule);
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
        scheduleCacheRef.current.set(cacheKey, serverSchedule);
      }
    } catch (err) {
      console.error("Failed to update subtask:", err);
      toast.error("Failed to update subtask");
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
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP HEADER & CALENDAR DATE FILTER BAR */}
      <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title & Executive context */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
              <FiClock size={16} className="stroke-[2.5]" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily Work Schedule
            </h2>
            {isLeadership ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <FiShield size={10} />
                <span>Leadership Audit Mode</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <FiCheckCircle size={10} />
                <span>Executive Routine Tracker</span>
              </span>
            )}
            {isFetchingSchedule && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-500 animate-pulse pl-1">
                <FiRefreshCw size={11} className="animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isLeadership
              ? `Viewing schedule for: `
              : `Tick your routine deliverables on daily basis. All check timestamps are verified in real time.`}
            {isLeadership && (
              <strong className="text-slate-800 dark:text-slate-200 font-bold ml-1">
                {currentlyViewedUser?.name || "Selected Executive"}
              </strong>
            )}
            <span className="text-slate-400 dark:text-slate-500 ml-2">
              • {formattedDateHeader}
            </span>
          </p>
        </div>

        {/* Right: Daily Wise Calendar Filter Navigation */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Previous Day Button */}
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer shadow-2xs"
            title="Previous Day"
          >
            <FiChevronLeft size={16} />
          </button>

          {/* Date Picker Input */}
          <div className="relative inline-flex items-center">
            <FiCalendar
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleSetToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              selectedDate === todayStr
                ? "bg-indigo-600 text-white shadow-indigo-500/20"
                : "border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338]"
            }`}
          >
            Today
          </button>

          {/* Next Day Button */}
          <button
            type="button"
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer shadow-2xs"
            title="Next Day"
          >
            <FiChevronRight size={16} />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              scheduleCacheRef.current.clear();
              toast.success("Cache refreshed");
              // Force reload
              const targetUserId = effectiveUserId;
              axiosInstance
                .get(`/socialmedia-task-calendar/daily-schedule?date=${selectedDate}&userId=${targetUserId}`)
                .then((res) => {
                  if (res.data?.success) setScheduleData(res.data.schedule);
                });
            }}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131d31] text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer shadow-2xs"
            title="Refresh Schedule Cache"
          >
            <FiRefreshCw size={14} className={isFetchingSchedule ? "animate-spin text-indigo-500" : ""} />
          </button>
        </div>
      </div>

      {/* 2. LEADERSHIP EXECUTIVE SELECTOR CAROUSEL (ADMIN, OP MANAGER, SM HEAD) */}
      {isLeadership && (
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-4 shadow-xs border border-purple-200/80 dark:border-purple-900/40 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FiUser className="text-purple-600 dark:text-purple-400" size={15} />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Social Media Executives ({executivesSummary.length || smExecutivesFromProps.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Click an executive to verify their check-in times & on-time accuracy
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
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

              return (
                <button
                  key={execUser?._id}
                  type="button"
                  onClick={() => setSelectedExecutiveId(execUser?._id)}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-purple-50 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20 shadow-xs"
                      : "bg-slate-50 dark:bg-[#131d31] border-slate-200/70 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#182338]"
                  }`}
                >
                  {/* Executive Initials */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-2xs">
                      {execUser?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("") || "SM"}
                    </div>
                    {isAllDone ? (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] ring-2 ring-white dark:ring-[#131d31]">
                        ✓
                      </span>
                    ) : hasStarted ? (
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#131d31] animate-pulse" />
                    ) : null}
                  </div>

                  {/* Executive Info & Progress */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {execUser?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span
                        className={`font-black px-1.5 py-0.2 rounded ${
                          isAllDone
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : hasStarted
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {exec.completedSlotsCount || 0} / 15 ({exec.completionPercentage || 0}%)
                      </span>
                      {exec.onTimeSlotsCount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          • {exec.onTimeSlotsCount} on-time
                        </span>
                      )}
                      {exec.delayedSlotsCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
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

      {/* 3. PROGRESS & PERFORMANCE STATS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Completed Slots */}
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FiCheckCircle size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {scheduleData?.completedSlotsCount || 0} / 15
            </div>
          </div>
        </div>

        {/* Card 2: Completion Percentage */}
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FiTrendingUp size={20} className="stroke-[2.5]" />
          </div>
          <div className="w-full">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {scheduleData?.completionPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${scheduleData?.completionPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: On-Time Ticks */}
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FiClock size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">On-Time Updates</div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">
              {scheduleData?.onTimeSlotsCount || 0}
            </div>
          </div>
        </div>

        {/* Card 4: Delayed / Pending */}
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Late Updates</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
              {scheduleData?.delayedSlotsCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* 4. FILTER BAR & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0c1220] p-3 rounded-2xl border border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (15)` },
            { id: "completed", label: `Completed (${scheduleData?.completedSlotsCount || 0})` },
            { id: "pending", label: `Pending (${15 - (scheduleData?.completedSlotsCount || 0)})` },
            { id: "ontime", label: `On-Time (${scheduleData?.onTimeSlotsCount || 0})` },
            { id: "delayed", label: `Late (${scheduleData?.delayedSlotsCount || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs"
                  : "bg-slate-100 dark:bg-[#131d31] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search routine or slot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#131d31] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 5. THE 15 SCHEDULE SLOTS TIMELINE LIST (Instant 0ms layout!) */}
      <div className="space-y-3">
        {displayedSlots.length === 0 ? (
          <div className="bg-white dark:bg-[#0c1220] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-white/10">
            <FiInfo size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No matching routine slots found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try changing your search term or filter selection.
            </p>
          </div>
        ) : (
          displayedSlots.map((slot, index) => {
            const isCompleted = Boolean(slot.completed);
            const isCurrentSlot = activeSlotIdNow === slot.slotId;
            const isUpdating = isUpdatingSlot === slot.slotId;
            const isOnTime = slot.timingStatus === "on-time" || slot.timingStatus === "early";

            return (
              <motion.div
                key={slot.slotId}
                layout
                initial={false}
                className={`relative rounded-2xl p-4 sm:p-5 border transition-all ${
                  isCompleted
                    ? "bg-white dark:bg-[#0c1220] border-emerald-300 dark:border-emerald-800/60 shadow-2xs"
                    : isCurrentSlot
                    ? "bg-white dark:bg-[#0c1220] border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                    : "bg-white dark:bg-[#0c1220] border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Time & Slot Number Badge */}
                  <div className="flex items-start gap-3 shrink-0 md:w-64">
                    {/* Number Indicator */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrentSlot
                          ? "bg-blue-600 text-white animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="space-y-1">
                      {/* Time Range */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#131d31] font-mono text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10">
                        <FiClock size={12} className="text-slate-400 shrink-0" />
                        <span>{slot.timeRange}</span>
                      </div>

                      {/* Timing Verification Stamp */}
                      <div>
                        {isCompleted ? (
                          isOnTime ? (
                            <span
                              title={`Checked on time at ${formatExactTime(slot.completedAt)}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>✓ On-Time ({formatShortTime(slot.completedAt)})</span>
                            </span>
                          ) : (
                            <span
                              title={`Checked at ${formatExactTime(slot.completedAt)} (Delayed update)`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>⏱ Late Update ({formatShortTime(slot.completedAt)})</span>
                            </span>
                          )
                        ) : isCurrentSlot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>⚡ Active Slot Now</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#131d31] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Title & Subtasks / Checklist points */}
                  <div className="flex-1 space-y-2.5">
                    {/* Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm sm:text-base font-extrabold transition-colors ${
                          isCompleted
                            ? "text-slate-900 dark:text-white line-through decoration-emerald-500/50"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {slot.title}
                      </h4>
                      {isCompleted && (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Subtasks Interactive Checklist */}
                    {Array.isArray(slot.subtasks) && slot.subtasks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {slot.subtasks.map((st) => {
                          const isSubDone = Boolean(st.completed);
                          return (
                            <div
                              key={st.id}
                              onClick={(e) => handleToggleSubtask(slot, st, e)}
                              className={`flex items-start gap-2.5 text-xs rounded-xl p-1.5 -ml-1.5 transition-colors cursor-pointer select-none ${
                                isSubDone
                                  ? "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <button
                                type="button"
                                className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                  isSubDone
                                    ? "bg-emerald-500 text-white"
                                    : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131d31] hover:border-indigo-500"
                                }`}
                              >
                                {isSubDone && <FiCheck size={11} className="stroke-[3]" />}
                              </button>
                              <span
                                className={`leading-snug ${
                                  isSubDone ? "line-through text-slate-400 dark:text-slate-500" : "font-medium"
                                }`}
                              >
                                {st.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Benchmark Callout (e.g. for Competitor Scan / Story Posting) */}
                    {slot.benchmark && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-[11px] font-bold text-purple-800 dark:text-purple-300 mt-1">
                        <FiInfo size={12} className="text-purple-600 shrink-0" />
                        <span>Benchmark: {slot.benchmark}</span>
                      </div>
                    )}

                    {/* Completion Audit Log Footer */}
                    {isCompleted && slot.completedAt && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 pt-1">
                        <FiCheckCircle size={11} className="text-emerald-500 shrink-0" />
                        <span>
                          Checked at <strong>{formatExactTime(slot.completedAt)}</strong>
                          {slot.completedByName ? ` by ${slot.completedByName}` : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Big Interactive Checkbox Button */}
                  <div className="shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleSlot(slot)}
                      className={`group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 ${
                        isCompleted
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                          : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 dark:bg-[#131d31] dark:text-slate-200 dark:border-white/10 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                      }`}
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isCompleted ? (
                        <>
                          <FiCheckCircle size={15} className="stroke-[2.5]" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <FiSquare size={14} className="stroke-[2.5] text-slate-400 group-hover:text-emerald-600" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(DailyWorkScheduleTab);
