/**
 * Timezone-safe local date utilities for formatting and parsing dates
 * without unwanted UTC offset shifts (e.g. in Asia/Kolkata UTC+05:30).
 */

/**
 * Formats a Date object or date-like value into a "YYYY-MM-DD" string
 * using the user's local timezone.
 *
 * @param {Date|string|number} d
 * @returns {string} "YYYY-MM-DD" or "" if invalid
 */
export const formatLocalDateKey = (d) => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object or date-like value into a "HH:mm" time string
 * using the user's local timezone.
 *
 * @param {Date|string|number} d
 * @param {string} fallback
 * @returns {string} "HH:mm"
 */
export const formatLocalTimeKey = (d, fallback = "18:00") => {
  if (!d) return fallback;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return fallback;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

/**
 * Parses a "YYYY-MM-DD" string and optional "HH:mm" time string into a Date object
 * in the local timezone without ISO/UTC shifting.
 *
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {string} [timeStr="12:00"] "HH:mm"
 * @returns {Date|null}
 */
export const parseLocalDateTime = (dateStr, timeStr = "12:00") => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;

  let hh = 12;
  let mm = 0;
  if (timeStr && typeof timeStr === "string") {
    const timeParts = timeStr.split(":").map(Number);
    if (!isNaN(timeParts[0])) hh = timeParts[0];
    if (!isNaN(timeParts[1])) mm = timeParts[1];
  }

  const d = new Date(year, month - 1, day, hh, mm, 0, 0);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Parses a "YYYY-MM-DD" date-only string into a local Date object.
 *
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {boolean} endOfDay whether to set to 23:59:59.999
 * @returns {Date|null}
 */
export const parseLocalDateOnly = (dateStr, endOfDay = false) => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;

  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};
