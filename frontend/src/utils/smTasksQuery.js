// Builds the query for GET /socialmedia-task-calendar/paged from the SM Tasks filter state.
// Date presets are resolved here, in the browser's local time zone, and sent as ISO
// boundaries so the server matches exactly what the user sees as "today", "this week"...

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
// "YYYY-MM-DD" from a date input → local Date
const parseLocalDay = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const isAllPreset = (p) => !p || p === "All" || p === "All Time";

/**
 * @returns {object} filter params WITHOUT page/limit (use it as the "filters changed" key too)
 */
export function buildSmTasksFilterParams(f, now = new Date()) {
  const params = {
    search: f.search?.trim() || undefined,
    clientName: f.selectedClient !== "All" ? f.selectedClient : undefined,
    createdBy: f.canFilterByCreatedBy && f.selectedCreatedBy !== "All" ? f.selectedCreatedBy : undefined,
    category: f.selectedCategory !== "All" ? f.selectedCategory : undefined,
    contentType: f.selectedContentType !== "All" ? f.selectedContentType : undefined,
    status: f.selectedStatus !== "All" ? f.selectedStatus : undefined,
    priority: f.selectedPriority !== "All" ? f.selectedPriority : undefined,
    commitment: f.selectedCommitment !== "All" ? f.selectedCommitment : undefined,
    atRisk: f.atRiskOnly ? "true" : undefined,
    branch: f.branch || undefined,
    // SME tab → newest first; Commitment tab → by date ascending
    sort:
      f.selectedCommitment === "No"
        ? "created_desc"
        : f.dateFilterField === "due"
          ? "due_asc"
          : "publish_asc",
  };

  const preset = f.dateFilterPreset;
  const dateActive = !isAllPreset(preset) || f.customStartDate || f.customEndDate;

  const hasMonth =
    f.selectedMonth && f.selectedYear && f.selectedMonth !== "all" && f.selectedYear !== "all";

  // Commitment tab, a single date picked in the calendar: only tasks publishing that day
  if (f.activeTab === "commitment" && hasMonth && f.selectedDay && !dateActive) {
    const day = new Date(Number(f.selectedYear), Number(f.selectedMonth) - 1, Number(f.selectedDay));
    params.dateFields = "publish";
    params.dateFrom = startOfDay(day).toISOString();
    params.dateTo = endOfDay(day).toISOString();
  }
  // Month selector applies on the Commitment tab when no other date filter is active
  else if (
    f.activeTab === "commitment" &&
    f.selectedMonth && f.selectedYear &&
    f.selectedMonth !== "all" && f.selectedYear !== "all" &&
    !dateActive
  ) {
    const y = Number(f.selectedYear);
    const m = Number(f.selectedMonth);
    params.monthFrom = new Date(y, m - 1, 1, 0, 0, 0, 0).toISOString();
    params.monthTo = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    params.monthField = f.dateFilterField === "publish" ? "publish" : "any";
  }

  if (dateActive) {
    params.dateFields =
      f.activeTab === "sme"
        ? "due,created"
        : f.dateFilterField === "publish"
          ? "publish"
          : f.dateFilterField === "due"
            ? "due"
            : "publish,due,created";

    let from = null;
    let to = null;
    if (preset === "Today") {
      from = startOfDay(now);
      to = endOfDay(now);
    } else if (preset === "Yesterday") {
      from = startOfDay(addDays(now, -1));
      to = endOfDay(addDays(now, -1));
    } else if (preset === "Tomorrow") {
      from = startOfDay(addDays(now, 1));
      to = endOfDay(addDays(now, 1));
    } else if (preset === "This Week") {
      const dow = now.getDay();
      const mon = startOfDay(addDays(now, dow === 0 ? -6 : 1 - dow));
      from = mon;
      to = endOfDay(addDays(mon, 6));
    } else if (preset === "This Month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (preset === "Overdue") {
      params.overdue = "true";
    } else if (preset === "Custom" || f.customStartDate || f.customEndDate) {
      if (f.customStartDate && f.customEndDate) {
        from = startOfDay(parseLocalDay(f.customStartDate));
        to = endOfDay(parseLocalDay(f.customEndDate));
      } else if (f.customStartDate) {
        from = startOfDay(parseLocalDay(f.customStartDate));
        to = endOfDay(parseLocalDay(f.customStartDate));
      } else if (f.customEndDate) {
        to = endOfDay(parseLocalDay(f.customEndDate));
      }
    }
    if (from) params.dateFrom = from.toISOString();
    if (to) params.dateTo = to.toISOString();
  }

  // Drop empty values so equivalent filter states produce the same cache key
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
  return params;
}
