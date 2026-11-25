import { useEffect, useState } from "react";

export const PENDING_CODE_KEY = "sortedPendingRoomCode";

export const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
};

export const formatDateTime = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** "2d 4h", "3h 12m", "8m 05s" */
export const formatRemaining = (ms) => {
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
};

/** Ticking countdown. Ticks every second when under an hour, otherwise every 30s. */
export const useCountdown = (expiresAt) => {
  const target = expiresAt ? new Date(expiresAt).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  const remaining = target - now;
  const fast = remaining < 60 * 60 * 1000;
  useEffect(() => {
    if (!target) return undefined;
    const t = setInterval(() => setNow(Date.now()), fast ? 1000 : 30000);
    return () => clearInterval(t);
  }, [target, fast]);
  const level = remaining <= 0 ? "expired" : remaining < 10 * 60 * 1000 ? "critical" : fast ? "warning" : "ok";
  return { remaining, label: formatRemaining(remaining), level };
};

export const countdownClasses = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/60",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/60",
  critical: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/60",
  expired: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

/** "/team/rooms/abc" -> "/team" so links stay inside the user's role area. */
export const roleBasePath = (pathname = "") => {
  const first = pathname.split("/").filter(Boolean)[0];
  return first ? `/${first}` : "/";
};

/** Same role resolution the app uses in ProtectedRoute. */
export const effectiveRolePath = (user) => {
  if (!user) return "/";
  const dept = (user.department || "").toString().toLowerCase();
  const role = (user.role?.name || user.role || "").toString().toLowerCase().replace(/[\s_]+/g, "");
  if (dept.includes("social media head") || role === "socialmediamanager" || role === "socialmediahead") {
    return "/socialmediamanager";
  }
  if (role === "hr") return "/humanresource";
  return `/${role || "team"}`;
};

/**
 * Invite links carry the code in the URL fragment (#code=...), which browsers
 * never send to servers, so it doesn't end up in hosting/proxy logs.
 */
export const buildInviteLink = (code) => `${window.location.origin}/rooms/join#code=${encodeURIComponent(code)}`;

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
};

export const EXPIRY_PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "24 hours", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "7 days", minutes: 10080 },
];

export const availablePresets = (config) => {
  const max = (config?.maxExpiryHours || 168) * 60;
  const min = config?.minExpiryMinutes || 15;
  return EXPIRY_PRESETS.filter((p) => p.minutes <= max && p.minutes >= min);
};

export const getAvatarUrl = (u) => {
  const img = u?.profile?.profileImage;
  return (typeof img === "object" ? img?.url : img) || null;
};

export const initials = (name = "User") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
