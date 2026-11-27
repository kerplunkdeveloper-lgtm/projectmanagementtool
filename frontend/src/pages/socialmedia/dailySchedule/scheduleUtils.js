import { DEFAULT_SCHEDULE_SLOTS, TOTAL_SLOTS } from "./scheduleConfig";

// Slot times are IST wall-clock times. Must match SCHEDULE_TZ_OFFSET_MINUTES on the backend,
// so the schedule behaves the same whatever timezone the viewer's device is set to.
const SCHEDULE_TZ_OFFSET_MINUTES = 330;
export const SCHEDULE_TIME_ZONE = "Asia/Kolkata";
const LATE_GRACE_MS = 15 * 60 * 1000; // after slot end
const EARLY_GRACE_MS = 10 * 60 * 1000; // before slot start, still counted on-time
export const MIN_REASON_LENGTH = 3; // must match backend
export const MAX_REASON_LENGTH = 500;
export const MAX_NOTE_LENGTH = 1000;

export const currentTimeMs = () => Date.now();

// ---------- Dates ----------

// "Today" (YYYY-MM-DD) in the schedule timezone
export const getTodayStr = (nowMs = currentTimeMs()) =>
  new Date(nowMs + SCHEDULE_TZ_OFFSET_MINUTES * 60 * 1000).toISOString().slice(0, 10);

// Add/subtract whole days from a YYYY-MM-DD string (timezone independent)
export const shiftDateStr = (dateStr, days) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

export const formatLongDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

// Absolute timestamp (ms) of a "HH:mm" slot time on a YYYY-MM-DD date in the schedule timezone
export const toScheduleTimestamp = (dateStr, timeStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = (timeStr || "00:00").split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min) - SCHEDULE_TZ_OFFSET_MINUTES * 60 * 1000;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: SCHEDULE_TIME_ZONE,
});
const exactTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: SCHEDULE_TIME_ZONE,
});

export const formatShortTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : timeFormatter.format(d);
};

export const formatExactTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : exactTimeFormatter.format(d);
};

export const formatSlotStart = (slot) => slot.timeRange?.split("–")[0]?.trim() || slot.startTime;

// ---------- Timing rules (same as backend) ----------
//   on-time = from 10 min before slot start up to slot end + 15 min grace
//   early   = more than 10 min before slot start (allowed, not counted on-time)
//   delayed = after slot end + 15 min grace

export const computeTimingStatus = (dateStr, slot, completedAtMs) => {
  const earlyLimit = toScheduleTimestamp(dateStr, slot.startTime) - EARLY_GRACE_MS;
  const graceEnd = toScheduleTimestamp(dateStr, slot.endTime) + LATE_GRACE_MS;
  if (completedAtMs < earlyLimit) return { isOnTime: false, timingStatus: "early" };
  if (completedAtMs <= graceEnd) return { isOnTime: true, timingStatus: "on-time" };
  return { isOnTime: false, timingStatus: "delayed" };
};

/**
 * Live state of a slot relative to "now":
 *   "done" | "active" | "upcoming" | "overdue"
 */
export const getSlotLiveState = (dateStr, slot, nowMs) => {
  if (slot.completed) return "done";
  const start = toScheduleTimestamp(dateStr, slot.startTime);
  const end = toScheduleTimestamp(dateStr, slot.endTime);
  if (nowMs < start) return "upcoming";
  if (nowMs < end) return "active";
  return "overdue";
};

export const isTooEarlyNow = (dateStr, slot, nowMs) =>
  nowMs < toScheduleTimestamp(dateStr, slot.startTime) - EARLY_GRACE_MS;

// ---------- Schedule state ----------

export const computeScheduleStats = (slots) => {
  const total = slots.length || TOTAL_SLOTS;
  let completed = 0;
  let onTime = 0;
  let early = 0;
  slots.forEach((s) => {
    if (!s.completed) return;
    completed += 1;
    if (s.timingStatus === "on-time") onTime += 1;
    else if (s.timingStatus === "early") early += 1;
  });
  return {
    completedSlotsCount: completed,
    totalSlotsCount: total,
    completionPercentage: Math.round((completed / total) * 100),
    onTimeSlotsCount: onTime,
    earlySlotsCount: early,
    delayedSlotsCount: completed - onTime - early,
  };
};

export const markSlotDone = (slot, dateStr, userName, nowMs) => ({
  ...slot,
  completed: true,
  completedAt: new Date(nowMs).toISOString(),
  completedByName: userName || "",
  pendingReason: "",
  ...computeTimingStatus(dateStr, slot, nowMs),
});

export const markSlotPending = (slot) => ({
  ...slot,
  completed: false,
  completedAt: null,
  completedBy: null,
  completedByName: "",
  isOnTime: false,
  timingStatus: "pending",
});

export const buildInitialScheduleState = (dateStr) => ({
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
    pendingReason: "",
    subtasks: slot.subtasks.map((st) => ({ ...st, completed: false, completedAt: null })),
  })),
  completedSlotsCount: 0,
  totalSlotsCount: TOTAL_SLOTS,
  completionPercentage: 0,
  onTimeSlotsCount: 0,
  earlySlotsCount: 0,
  delayedSlotsCount: 0,
  isSubmitted: false,
  submittedAt: null,
  submittedByName: "",
  submissionNote: "",
  _placeholder: true,
});

// ---------- Users ----------

export const sameId = (a, b) => a != null && b != null && String(a) === String(b);

// Must match isLeadershipUser in the backend controller
export const isLeadershipUser = (user) => {
  if (!user) return false;
  const role = (user.role || "").toLowerCase().replace(/[\s_]/g, "");
  const dept = (user.department || "").toLowerCase().trim();
  const desig = (user.designation || "").toLowerCase().trim();
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
};

export const isSocialMediaExecutive = (u) => {
  if (!u || u.employmentStatus === "relieved") return false;
  const dept = (u.department || "").toLowerCase().trim();
  const role = (u.role || "").toLowerCase().trim();
  const desig = (u.designation || "").toLowerCase().trim();
  return (
    dept.includes("social media") ||
    /\bsme\b/.test(dept) ||
    role.includes("social media") ||
    role.includes("smm") ||
    role === "socialmediamanager" ||
    role === "socialmediaexecutive" ||
    desig.includes("social media") ||
    desig.includes("smm")
  );
};

const backendBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

// Resolve an avatar URL from a user object, profile or raw string
export const extractAvatarUrl = (target) => {
  if (!target) return null;
  if (typeof target === "string") {
    const trimmed = target.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("/")) return backendBase ? `${backendBase}${trimmed}` : trimmed;
    return trimmed;
  }
  if (typeof target === "object") {
    if (typeof target.url === "string" && target.url.trim()) return extractAvatarUrl(target.url);
    return (
      extractAvatarUrl(target.profile?.profileImage) ||
      extractAvatarUrl(target.profileImage) ||
      extractAvatarUrl(target.avatar) ||
      extractAvatarUrl(target.profilePic)
    );
  }
  return null;
};

export const getInitials = (name) =>
  (name || "SM")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ---------- Structural sharing ----------
// Keep the previous object for every slot that did not change, so memoized cards skip
// re-rendering when a server response (or refetch) replaces the schedule.

const toTime = (v) => (v ? new Date(v).getTime() : 0);

const subtasksEqual = (a = [], b = []) =>
  a.length === b.length &&
  a.every(
    (st, i) =>
      st.id === b[i].id &&
      st.text === b[i].text &&
      Boolean(st.completed) === Boolean(b[i].completed) &&
      toTime(st.completedAt) === toTime(b[i].completedAt)
  );

const slotsEqual = (a, b) =>
  a.slotId === b.slotId &&
  a.title === b.title &&
  a.timeRange === b.timeRange &&
  a.benchmark === b.benchmark &&
  Boolean(a.completed) === Boolean(b.completed) &&
  a.timingStatus === b.timingStatus &&
  toTime(a.completedAt) === toTime(b.completedAt) &&
  (a.completedByName || "") === (b.completedByName || "") &&
  (a.pendingReason || "") === (b.pendingReason || "") &&
  subtasksEqual(a.subtasks, b.subtasks);

export const reconcileSchedule = (prev, next) => {
  if (!prev || !next || !Array.isArray(prev.slots) || !Array.isArray(next.slots)) return next;
  const prevById = new Map(prev.slots.map((s) => [s.slotId, s]));
  let allSame = prev.slots.length === next.slots.length;
  const slots = next.slots.map((s, i) => {
    const old = prevById.get(s.slotId);
    if (old && slotsEqual(old, s)) {
      if (prev.slots[i] !== old) allSame = false;
      return old;
    }
    allSame = false;
    return s;
  });
  return { ...next, slots: allSame ? prev.slots : slots };
};
