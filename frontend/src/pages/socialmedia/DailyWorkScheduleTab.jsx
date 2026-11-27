import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  useDeferredValue,
} from "react";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiInfo,
  FiSend,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../services/axiosInstance";
import { TOTAL_SLOTS, getSlotPhase } from "./dailySchedule/scheduleConfig";
import {
  currentTimeMs,
  getTodayStr,
  shiftDateStr,
  formatLongDate,
  getSlotLiveState,
  isTooEarlyNow,
  computeScheduleStats,
  markSlotDone,
  markSlotPending,
  buildInitialScheduleState,
  sameId,
  isLeadershipUser,
  isSocialMediaExecutive,
  extractAvatarUrl,
  reconcileSchedule,
} from "./dailySchedule/scheduleUtils";
import ScheduleSkeleton, { ExecutivePickerSkeleton } from "./dailySchedule/ScheduleSkeleton";
import SlotCard from "./dailySchedule/SlotCard";
import SubmitDayModal from "./dailySchedule/SubmitDayModal";
import ExecutivePicker from "./dailySchedule/ExecutivePicker";
import DaySummary from "./dailySchedule/DaySummary";

const API = "/socialmedia-task-calendar/daily-schedule";
const CLOCK_TICK_MS = 30 * 1000;

// Module-level caches survive tab switches and unmounts, so revisiting a day renders instantly
const GLOBAL_SCHEDULE_CACHE = new Map();
const GLOBAL_EXECUTIVES_SUMMARY_CACHE = new Map();

// Unsent "reason for pending" drafts, per executive and date (per-viewer convenience only)
const draftKey = (userId, date) => `dws-submit-draft:${userId}:${date}`;
const readDraft = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || {};
  } catch {
    return {};
  }
};
const writeDraft = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};
const clearDraft = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "done", label: "Done" },
  { id: "ontime", label: "On-time" },
  { id: "early", label: "Early" },
  { id: "late", label: "Late" },
];

const matchesFilter = (slot, filter) => {
  switch (filter) {
    case "pending":
      return !slot.completed;
    case "done":
      return slot.completed;
    case "ontime":
      return slot.completed && slot.timingStatus === "on-time";
    case "early":
      return slot.completed && slot.timingStatus === "early";
    case "late":
      return slot.completed && slot.timingStatus === "delayed";
    default:
      return true;
  }
};

const matchesSearch = (slot, q) =>
  !q ||
  slot.title?.toLowerCase().includes(q) ||
  slot.timeRange?.toLowerCase().includes(q) ||
  slot.points?.some((p) => p.toLowerCase().includes(q)) ||
  slot.subtasks?.some((st) => st.text?.toLowerCase().includes(q));

const DailyWorkScheduleTab = ({ user: propUser, users: propUsers = [] }) => {
  const authUser = useSelector((state) => state.auth?.user);
  const currentUser = propUser || authUser;
  const isLeadership = useMemo(() => isLeadershipUser(currentUser), [currentUser]);
  // The login response stores the user id as `id` (not `_id`), so accept both
  const currentUserId = currentUser?._id || currentUser?.id || null;

  // ---------- Clock & date ----------
  // Live clock keeps "Today", "In progress" and early warnings correct while the tab stays open
  const [nowMs, setNowMs] = useState(currentTimeMs);
  useEffect(() => {
    const id = setInterval(() => setNowMs(currentTimeMs()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);
  const todayStr = getTodayStr(nowMs);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;
  const isFutureDate = selectedDate > todayStr;

  // ---------- Executives ----------
  const smExecutivesFromProps = useMemo(() => (propUsers || []).filter(isSocialMediaExecutive), [propUsers]);

  const [selectedExecutiveId, setSelectedExecutiveId] = useState(() =>
    isLeadership ? smExecutivesFromProps[0]?._id ?? null : currentUserId
  );
  const [executivesSummary, setExecutivesSummary] = useState(
    () => GLOBAL_EXECUTIVES_SUMMARY_CACHE.get(todayStr) || []
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const effectiveUserId = isLeadership ? selectedExecutiveId || currentUserId : currentUserId;

  const usersMap = useMemo(() => {
    const map = new Map();
    (propUsers || []).forEach((u) => {
      if (u._id) map.set(String(u._id), u);
      if (u.name) map.set(u.name.trim().toLowerCase(), u);
    });
    return map;
  }, [propUsers]);

  const getAvatarUrl = useCallback(
    (u) => {
      if (!u) return null;
      return (
        extractAvatarUrl(u) ||
        extractAvatarUrl(usersMap.get(String(u._id))) ||
        (u.name ? extractAvatarUrl(usersMap.get(u.name.trim().toLowerCase())) : null)
      );
    },
    [usersMap]
  );

  const pickerExecutives = useMemo(
    () =>
      executivesSummary.length > 0
        ? executivesSummary
        : smExecutivesFromProps.map((u) => ({ user: u, completedSlotsCount: 0, totalSlotsCount: TOTAL_SLOTS })),
    [executivesSummary, smExecutivesFromProps]
  );

  const viewedUser = useMemo(() => {
    if (!isLeadership) return currentUser;
    return pickerExecutives.find((e) => sameId(e.user?._id, effectiveUserId))?.user || currentUser;
  }, [isLeadership, pickerExecutives, effectiveUserId, currentUser]);

  // ---------- Schedule state ----------
  const [scheduleData, setScheduleData] = useState(
    () => GLOBAL_SCHEDULE_CACHE.get(`${effectiveUserId}_${todayStr}`) || buildInitialScheduleState(todayStr)
  );
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  // View key whose first load failed (shows a retry card instead of the skeleton)
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // When the viewed executive/date changes, show its cached (or blank) schedule immediately
  // and close any open submit dialog. Done during render, as React recommends for derived resets.
  const viewKey = `${effectiveUserId}_${selectedDate}`;
  const [renderedViewKey, setRenderedViewKey] = useState(viewKey);
  if (renderedViewKey !== viewKey) {
    setRenderedViewKey(viewKey);
    setScheduleData(GLOBAL_SCHEDULE_CACHE.get(viewKey) || buildInitialScheduleState(selectedDate));
    setIsSubmitOpen(false);
  }

  // Same for the executives summary when the date changes
  const [summaryDate, setSummaryDate] = useState(selectedDate);
  if (isLeadership && summaryDate !== selectedDate) {
    setSummaryDate(selectedDate);
    const cachedSummary = GLOBAL_EXECUTIVES_SUMMARY_CACHE.get(selectedDate);
    if (cachedSummary) setExecutivesSummary(cachedSummary);
  }

  // Latest values for stable event handlers (lets memoized cards skip re-rendering)
  const latestRef = useRef({});
  useLayoutEffect(() => {
    latestRef.current = { effectiveUserId, selectedDate, scheduleData, currentUser };
  });

  // Which schedule is on screen. Late responses for another executive/date are never shown.
  const viewRef = useRef({ userId: effectiveUserId, date: selectedDate });
  useLayoutEffect(() => {
    viewRef.current = { userId: effectiveUserId, date: selectedDate };
  }, [effectiveUserId, selectedDate]);
  const isViewing = (userId, date) => sameId(viewRef.current.userId, userId) && viewRef.current.date === date;

  // Per-schedule mutation queue: requests for one executive/date run in order and only the last
  // response is applied (it already reflects every earlier change).
  const mutationQueueRef = useRef(new Map());
  const hasPendingMutations = (cacheKey) => (mutationQueueRef.current.get(cacheKey)?.pending || 0) > 0;

  const patchExecutiveSummary = useCallback(
    (targetUserId, date, schedule) => {
      if (!isLeadership) return;
      const patch = (list) =>
        list.map((e) =>
          sameId(e.user?._id, targetUserId)
            ? {
                ...e,
                completedSlotsCount: schedule.completedSlotsCount,
                totalSlotsCount: schedule.totalSlotsCount || TOTAL_SLOTS,
                completionPercentage: schedule.completionPercentage,
                onTimeSlotsCount: schedule.onTimeSlotsCount,
                earlySlotsCount: schedule.earlySlotsCount || 0,
                delayedSlotsCount: schedule.delayedSlotsCount,
                hasStarted: schedule.completedSlotsCount > 0,
                isAllDone: schedule.completedSlotsCount >= (schedule.totalSlotsCount || TOTAL_SLOTS),
                isSubmitted: Boolean(schedule.isSubmitted),
                submittedAt: schedule.submittedAt || null,
              }
            : e
        );
      if (GLOBAL_EXECUTIVES_SUMMARY_CACHE.has(date)) {
        GLOBAL_EXECUTIVES_SUMMARY_CACHE.set(date, patch(GLOBAL_EXECUTIVES_SUMMARY_CACHE.get(date)));
      }
      if (viewRef.current.date === date) setExecutivesSummary(patch);
    },
    [isLeadership]
  );

  // Store a schedule and show it only if that executive/date is still on screen
  const commitSchedule = useCallback(
    (targetUserId, date, schedule) => {
      const key = `${targetUserId}_${date}`;
      const merged = reconcileSchedule(GLOBAL_SCHEDULE_CACHE.get(key), schedule);
      GLOBAL_SCHEDULE_CACHE.set(key, merged);
      if (isViewing(targetUserId, date)) setScheduleData(merged);
      patchExecutiveSummary(targetUserId, date, schedule);
    },
    [patchExecutiveSummary]
  );

  const fetchSchedule = useCallback(
    (targetUserId, date) => axiosInstance.get(`${API}?date=${date}&userId=${targetUserId}`),
    []
  );

  const resyncSchedule = useCallback(
    async (targetUserId, date) => {
      try {
        const res = await fetchSchedule(targetUserId, date);
        if (res.data?.success && res.data.schedule && !hasPendingMutations(`${targetUserId}_${date}`)) {
          commitSchedule(targetUserId, date, res.data.schedule);
        }
      } catch (err) {
        console.error("Failed to re-sync daily schedule:", err);
      }
    },
    [commitSchedule, fetchSchedule]
  );

  const runScheduleMutation = useCallback(
    ({ targetUserId, date, request, onSuccess, onSettled }) => {
      const cacheKey = `${targetUserId}_${date}`;
      const queue = mutationQueueRef.current;
      let entry = queue.get(cacheKey);
      if (!entry) {
        entry = { chain: Promise.resolve(), pending: 0 };
        queue.set(cacheKey, entry);
      }
      entry.pending += 1;

      const finish = () => {
        entry.pending -= 1;
        const isLast = entry.pending === 0;
        if (isLast && queue.get(cacheKey) === entry) queue.delete(cacheKey);
        return isLast;
      };

      entry.chain = entry.chain.then(async () => {
        try {
          const res = await request();
          const isLast = finish();
          if (res.data?.success && res.data.schedule) {
            if (isLast) commitSchedule(targetUserId, date, res.data.schedule);
            onSuccess?.(res);
          } else if (isLast) {
            resyncSchedule(targetUserId, date);
          }
        } catch (err) {
          const isLast = finish();
          console.error("Failed to update daily schedule:", err);
          toast.error(err?.response?.data?.message || "Failed to update schedule");
          if (isLast) resyncSchedule(targetUserId, date);
        } finally {
          onSettled?.();
        }
      });
      return entry.chain;
    },
    [commitSchedule, resyncSchedule]
  );

  // ---------- Fetching ----------
  // 1. Executives summary (leadership)
  useEffect(() => {
    if (!isLeadership) return;
    let isCancelled = false;

    (async () => {
      try {
        setIsLoadingSummary(true);
        const res = await axiosInstance.get(`${API}/executives-summary?date=${selectedDate}`);
        if (isCancelled || !res.data?.success) return;
        const summary = res.data.summary || [];
        GLOBAL_EXECUTIVES_SUMMARY_CACHE.set(selectedDate, summary);
        setExecutivesSummary(summary);
        setSelectedExecutiveId((prev) => prev || summary[0]?.user?._id || null);
      } catch (err) {
        if (!isCancelled) console.error("Failed to load executives summary:", err);
      } finally {
        if (!isCancelled) setIsLoadingSummary(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isLeadership, selectedDate, refreshKey]);

  // 2. Schedule for the viewed executive/date (instant cached render + background revalidation)
  useEffect(() => {
    if (!effectiveUserId) return;
    let isCancelled = false;
    const cacheKey = `${effectiveUserId}_${selectedDate}`;

    (async () => {
      try {
        setIsFetchingSchedule(true);
        const res = await fetchSchedule(effectiveUserId, selectedDate);
        // Skip while updates are in flight: their response is newer than this fetch
        if (!isCancelled && res.data?.success && res.data.schedule && !hasPendingMutations(cacheKey)) {
          const merged = reconcileSchedule(GLOBAL_SCHEDULE_CACHE.get(cacheKey), res.data.schedule);
          GLOBAL_SCHEDULE_CACHE.set(cacheKey, merged);
          setScheduleData(merged);
          setLoadErrorKey((k) => (k === cacheKey ? null : k));
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to load daily schedule:", err);
          if (GLOBAL_SCHEDULE_CACHE.has(cacheKey)) {
            toast.error(err?.response?.data?.message || "Couldn't refresh the schedule");
          } else {
            setLoadErrorKey(cacheKey);
          }
        }
      } finally {
        if (!isCancelled) setIsFetchingSchedule(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [effectiveUserId, selectedDate, refreshKey, fetchSchedule]);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const handlePrevDay = useCallback(() => setSelectedDate((d) => shiftDateStr(d, -1)), []);
  const handleNextDay = useCallback(() => setSelectedDate((d) => shiftDateStr(d, 1)), []);
  const handleSetToday = useCallback(() => setSelectedDate(getTodayStr()), []);

  // ---------- Slot actions (stable identities) ----------
  const getLiveSchedule = () => {
    const { effectiveUserId: userId, selectedDate: date, scheduleData: data } = latestRef.current;
    return { userId, date, current: GLOBAL_SCHEDULE_CACHE.get(`${userId}_${date}`) || data };
  };

  const blockIfReadOnly = (current, date) => {
    if (current?.isSubmitted) {
      toast.error("This day is submitted and read-only.");
      return true;
    }
    if (date > getTodayStr()) {
      toast.error("You cannot complete slots for a future date");
      return true;
    }
    return false;
  };

  const handleToggleSlot = useCallback(
    (slotId) => {
      const { userId, date, current } = getLiveSchedule();
      if (!userId || !current || blockIfReadOnly(current, date)) return;
      const slot = (current.slots || []).find((s) => s.slotId === slotId);
      if (!slot) return;

      const nextCompleted = !slot.completed;
      const now = currentTimeMs();
      const nowISO = new Date(now).toISOString();
      const userName = latestRef.current.currentUser?.name;

      const updatedSlots = current.slots.map((s) => {
        if (s.slotId !== slotId) return s;
        const base = nextCompleted ? markSlotDone(s, date, userName, now) : markSlotPending(s);
        return {
          ...base,
          subtasks: (s.subtasks || []).map((st) => ({
            ...st,
            completed: nextCompleted,
            completedAt: nextCompleted ? (st.completed ? st.completedAt : nowISO) : null,
          })),
        };
      });

      commitSchedule(userId, date, { ...current, slots: updatedSlots, ...computeScheduleStats(updatedSlots) });

      runScheduleMutation({
        targetUserId: userId,
        date,
        request: () => axiosInstance.patch(`${API}/toggle-slot`, { date, slotId, completed: nextCompleted, userId }),
        // The card updates instantly; only unusual timing gets a toast
        onSuccess: (res) => {
          if (!nextCompleted) return;
          const status = res.data?.updatedSlot?.timingStatus;
          if (status === "early") {
            toast(`"${slot.title}" marked Early. It isn't counted as on-time.`, { icon: "⚠️", id: `early-${slotId}` });
          } else if (status === "delayed") {
            toast(`"${slot.title}" completed late`, { icon: "⏱", id: `late-${slotId}` });
          }
        },
      });
    },
    [commitSchedule, runScheduleMutation]
  );

  const handleToggleSubtask = useCallback(
    (slotId, subtaskId) => {
      const { userId, date, current } = getLiveSchedule();
      if (!userId || !current || blockIfReadOnly(current, date)) return;
      const slot = (current.slots || []).find((s) => s.slotId === slotId);
      const subtask = slot?.subtasks?.find((st) => st.id === subtaskId);
      if (!slot || !subtask) return;

      const nextCompleted = !subtask.completed;
      const now = currentTimeMs();
      const userName = latestRef.current.currentUser?.name;

      const updatedSlots = current.slots.map((s) => {
        if (s.slotId !== slotId) return s;
        const subtasks = s.subtasks.map((st) =>
          st.id === subtaskId
            ? { ...st, completed: nextCompleted, completedAt: nextCompleted ? new Date(now).toISOString() : null }
            : st
        );
        const allDone = subtasks.length > 0 && subtasks.every((st) => st.completed);
        let next = { ...s, subtasks };
        if (allDone && !s.completed) next = markSlotDone(next, date, userName, now);
        else if (!allDone && s.completed) next = markSlotPending(next);
        return next;
      });

      commitSchedule(userId, date, { ...current, slots: updatedSlots, ...computeScheduleStats(updatedSlots) });

      runScheduleMutation({
        targetUserId: userId,
        date,
        request: () =>
          axiosInstance.patch(`${API}/toggle-subtask`, { date, slotId, subtaskId, completed: nextCompleted, userId }),
      });
    },
    [commitSchedule, runScheduleMutation]
  );

  // ---------- Submit / reopen ----------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMissingIds, setServerMissingIds] = useState([]);
  const [isReopening, setIsReopening] = useState(false);

  const currentDraftKey = effectiveUserId ? draftKey(effectiveUserId, selectedDate) : null;

  const openSubmit = useCallback(() => {
    setServerMissingIds([]);
    setIsSubmitOpen(true);
  }, []);
  const closeSubmit = useCallback(() => setIsSubmitOpen(false), []);
  const handleDraftChange = useCallback(
    (draft) => {
      if (currentDraftKey) writeDraft(currentDraftKey, draft);
    },
    [currentDraftKey]
  );

  const handleSubmitDay = useCallback(
    async (pendingReasons, note) => {
      const { effectiveUserId: userId, selectedDate: date } = latestRef.current;
      const cacheKey = `${userId}_${date}`;
      setIsSubmitting(true);
      try {
        // Let in-flight checkbox updates land first so the server validates the final state
        await mutationQueueRef.current.get(cacheKey)?.chain;
        const res = await axiosInstance.post(`${API}/submit`, { date, userId, pendingReasons, note });
        if (res.data?.success && res.data.schedule) {
          commitSchedule(userId, date, res.data.schedule);
          clearDraft(draftKey(userId, date));
          setIsSubmitOpen(false);
          toast.success("Day submitted");
        }
      } catch (err) {
        const data = err?.response?.data;
        setServerMissingIds(data?.missingSlotIds || []);
        toast.error(data?.message || "Failed to submit the day");
        if (err?.response?.status === 409) {
          setIsSubmitOpen(false);
          resyncSchedule(userId, date);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [commitSchedule, resyncSchedule]
  );

  const handleReopen = useCallback(async () => {
    const { effectiveUserId: userId, selectedDate: date } = latestRef.current;
    if (!window.confirm("Reopen this day? The executive will be able to edit and submit again.")) return;
    setIsReopening(true);
    try {
      const res = await axiosInstance.post(`${API}/reopen`, { date, userId });
      if (res.data?.success && res.data.schedule) {
        commitSchedule(userId, date, res.data.schedule);
        toast.success("Day reopened for editing");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reopen the day");
    } finally {
      setIsReopening(false);
    }
  }, [commitSchedule]);

  // ---------- Derived view ----------
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  const slots = useMemo(() => scheduleData?.slots || [], [scheduleData]);

  const filterCounts = useMemo(() => {
    const counts = {};
    FILTERS.forEach((f) => {
      counts[f.id] = slots.filter((s) => matchesFilter(s, f.id)).length;
    });
    return counts;
  }, [slots]);

  const displayedSlots = useMemo(
    () => slots.filter((s) => matchesFilter(s, statusFilter) && matchesSearch(s, deferredSearch)),
    [slots, statusFilter, deferredSearch]
  );

  const activeSlot = useMemo(
    () => (isToday ? slots.find((s) => getSlotLiveState(selectedDate, s, nowMs) === "active") : null),
    [isToday, slots, selectedDate, nowMs]
  );

  // Not loaded from the server yet: skeleton (or a retry card if the first load failed)
  const isPlaceholder = Boolean(scheduleData?._placeholder);
  const loadFailed = isPlaceholder && loadErrorKey === viewKey;
  const showSkeleton = isPlaceholder && !loadFailed;
  const isSubmitted = Boolean(scheduleData?.isSubmitted);
  const readOnly = isSubmitted || isFutureDate;
  const readOnlyReason = isSubmitted
    ? "This day is submitted and read-only"
    : isFutureDate
    ? "You cannot complete slots for a future date"
    : undefined;

  const pendingCount = slots.length - (scheduleData?.completedSlotsCount || 0);
  const showSubmitBar = !isPlaceholder && !isSubmitted && !isFutureDate;

  return (
    <div className="space-y-3 sm:space-y-4 pb-2">
      {/* Header */}
      <header className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/25 shrink-0">
            <FiClock size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Daily Work Schedule
              </h2>
              {(isFetchingSchedule || isLoadingSummary) && (
                <FiRefreshCw size={12} className="animate-spin text-indigo-500" aria-label="Syncing" />
              )}
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
              {isLeadership && (
                <>
                  Viewing <strong className="font-semibold text-indigo-600 dark:text-indigo-400">{viewedUser?.name || "Executive"}</strong>
                  <span className="mx-1.5 text-slate-300">•</span>
                </>
              )}
              {formatLongDate(selectedDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Previous day"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a253c]"
            >
              <FiChevronLeft size={15} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              aria-label="Select date"
              className="dws-field dws-date text-[11.5px] font-semibold"
            />
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${
                isToday
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a253c]"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              aria-label="Next day"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1a253c]"
            >
              <FiChevronRight size={15} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetchingSchedule}
            aria-label="Refresh"
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131d31] text-slate-500 hover:text-indigo-600 disabled:opacity-60"
          >
            <FiRefreshCw size={14} className={isFetchingSchedule ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {isLeadership && pickerExecutives.length === 0 && isLoadingSummary && <ExecutivePickerSkeleton />}
      {isLeadership && (pickerExecutives.length > 0 || !isLoadingSummary) && (
        <ExecutivePicker
          executives={pickerExecutives}
          selectedId={effectiveUserId}
          onSelect={setSelectedExecutiveId}
          getAvatarUrl={getAvatarUrl}
        />
      )}

      {showSkeleton ? (
        <ScheduleSkeleton />
      ) : loadFailed ? (
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl border border-rose-200 dark:border-rose-900/50 p-8 text-center">
          <FiAlertTriangle size={22} className="mx-auto text-rose-500 mb-2" />
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Couldn't load the schedule</p>
          <p className="text-[11.5px] text-slate-500 mt-0.5">Check your connection and try again.</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FiRefreshCw size={12} /> Retry
          </button>
        </div>
      ) : (
        <>
      <DaySummary
        schedule={scheduleData}
        activeSlot={activeSlot}
        isToday={isToday}
        isFutureDate={isFutureDate}
        canReopen={isLeadership}
        onReopen={handleReopen}
        reopening={isReopening}
        onOpenSubmit={openSubmit}
      />

      {/* Filters & search */}
      <div className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(f.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                }`}
              >
                {f.label}
                <span
                  className={`px-1.5 rounded-full text-[10px] tabular-nums ${
                    active ? "bg-white/20 dark:bg-slate-900/10" : "bg-slate-100 dark:bg-white/10"
                  }`}
                >
                  {filterCounts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-64">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search slots or tasks"
            aria-label="Search slots"
            className="dws-field dws-search w-full py-1.5 text-[12px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700"
            >
              <FiX size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {displayedSlots.length === 0 ? (
        <div className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center">
          <FiInfo size={22} className="mx-auto text-slate-400 mb-2" />
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">No matching slots</p>
          <p className="text-[11.5px] text-slate-400 mt-0.5">Try a different filter or search term.</p>
        </div>
      ) : (
        <ol className="pl-0.5">
          {displayedSlots.map((slot, index) => {
            const phase = getSlotPhase(slot.slotId);
            const nextSlot = displayedSlots[index + 1];
            const liveState = getSlotLiveState(selectedDate, slot, nowMs);
            return (
              <SlotCard
                key={slot.slotId}
                slot={slot}
                liveState={liveState}
                willBeEarly={!slot.completed && !readOnly && isTooEarlyNow(selectedDate, slot, nowMs)}
                readOnly={readOnly}
                readOnlyReason={readOnlyReason}
                isFirst={index === 0}
                isLast={index === displayedSlots.length - 1}
                phaseColor={phase.color}
                nextPhaseColor={nextSlot ? getSlotPhase(nextSlot.slotId).color : null}
                isSubmitted={isSubmitted}
                onToggleSlot={handleToggleSlot}
                onToggleSubtask={handleToggleSubtask}
              />
            );
          })}
        </ol>
      )}
        </>
      )}

      {/* Sticky submit bar */}
      {showSubmitBar && (
        <div className="sticky bottom-3 z-20">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-xl backdrop-blur">
            <p className="text-[12px] font-medium">
              <strong className="tabular-nums">{scheduleData.completedSlotsCount || 0}/{slots.length}</strong> done
              {pendingCount > 0 && (
                <span className="opacity-75"> · {pendingCount} pending need a reason</span>
              )}
            </p>
            <button
              type="button"
              onClick={openSubmit}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              <FiSend size={12} /> Submit day
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isSubmitOpen && (
          <SubmitDayModal
            key={`${effectiveUserId}_${selectedDate}`}
            schedule={scheduleData}
            initialDraft={currentDraftKey ? readDraft(currentDraftKey) : {}}
            onDraftChange={handleDraftChange}
            onClose={closeSubmit}
            onSubmit={handleSubmitDay}
            submitting={isSubmitting}
            serverMissingIds={serverMissingIds}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(DailyWorkScheduleTab);
