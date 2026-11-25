// Single source of truth for client services and how they are billed.
// `value` is what gets stored in Client.service (keep existing values stable —
// other pages filter on them).

export const PROJECT_TYPES = {
  RECURRING: "Recurring",
  ONE_TIME: "One-time",
};

export const SERVICE_CATALOG = [
  // Recurring (ongoing, billed per cycle)
  { value: "Digital Marketing", label: "Digital Marketing (DM)", type: PROJECT_TYPES.RECURRING },
  { value: "SEO", label: "SEO (Ongoing)", type: PROJECT_TYPES.RECURRING },
  { value: "Content Marketing", label: "Content Marketing", type: PROJECT_TYPES.RECURRING },
  // One-time (fixed scope, start → end)
  { value: "Branding & Identity", label: "Branding & Identity", type: PROJECT_TYPES.ONE_TIME },
  { value: "Website", label: "Website Development", type: PROJECT_TYPES.ONE_TIME },
  { value: "Video Production", label: "Video Production", type: PROJECT_TYPES.ONE_TIME },
  { value: "Additional work", label: "Additional Work", type: PROJECT_TYPES.ONE_TIME },
  { value: "Others", label: "Others", type: PROJECT_TYPES.ONE_TIME },
];

export const BILLING_CYCLES = ["Monthly", "Quarterly", "Half-yearly", "Yearly"];
export const ONE_TIME_TIMELINES = ["Fixed Duration", "Open (TBD)"];

export const getServiceMeta = (value) =>
  SERVICE_CATALOG.find((s) => s.value === value) || {
    value,
    label: value,
    type: PROJECT_TYPES.ONE_TIME,
  };

export const getServiceLabel = (value) => getServiceMeta(value).label;

const toDateInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

/** Default schedule for a freshly-selected service. */
export const createServiceDetail = (value, startDate) => {
  const meta = getServiceMeta(value);
  return meta.type === PROJECT_TYPES.RECURRING
    ? { name: value, type: meta.type, billingCycle: "Monthly", startDate: startDate || "", endDate: "" }
    : { name: value, type: meta.type, timeline: "Fixed Duration", startDate: startDate || "", endDate: "" };
};

/**
 * Build editable serviceDetails for a client. Older clients only have
 * `service: [String]`, so we synthesise details from that list.
 */
export const normalizeServiceDetails = (client) => {
  const names = Array.isArray(client?.service)
    ? client.service
    : client?.service
      ? [client.service]
      : [];
  const existing = Array.isArray(client?.serviceDetails) ? client.serviceDetails : [];
  const fallbackStart = toDateInput(client?.onboardingDate);

  return names.map((name) => {
    const found = existing.find((d) => d.name === name);
    const base = createServiceDetail(name, fallbackStart);
    if (!found) return base;
    return {
      ...base,
      ...found,
      type: getServiceMeta(name).type,
      startDate: toDateInput(found.startDate) || fallbackStart,
      endDate: toDateInput(found.endDate),
    };
  });
};

/** "Recurring" | "One-time" | "Hybrid" | "" based on the selected services. */
export const deriveProjectType = (details = []) => {
  const hasRecurring = details.some((d) => d.type === PROJECT_TYPES.RECURRING);
  const hasOneTime = details.some((d) => d.type === PROJECT_TYPES.ONE_TIME);
  if (hasRecurring && hasOneTime) return "Hybrid";
  if (hasRecurring) return PROJECT_TYPES.RECURRING;
  if (hasOneTime) return PROJECT_TYPES.ONE_TIME;
  return "";
};

/** Returns an error message, or null when the schedule is valid. */
export const validateServiceDetails = (details = []) => {
  if (!details.length) return "Please select at least one service";
  for (const d of details) {
    const label = getServiceLabel(d.name);
    if (!d.startDate) return `${label}: start date is required`;
    const needsEnd = d.type === PROJECT_TYPES.ONE_TIME && d.timeline !== "Open (TBD)";
    if (needsEnd && !d.endDate) return `${label}: end date is required for a fixed-duration project`;
    if (d.endDate && new Date(d.endDate) < new Date(d.startDate)) {
      return `${label}: end date cannot be before start date`;
    }
  }
  return null;
};

/**
 * Which project types a client has: { recurring, oneTime }.
 * Falls back to the plain `service` list for clients saved before serviceDetails existed.
 */
export const getClientProjectFlags = (client) => {
  const details =
    Array.isArray(client?.serviceDetails) && client.serviceDetails.length
      ? client.serviceDetails
      : (Array.isArray(client?.service) ? client.service : client?.service ? [client.service] : []).map(
          (name) => ({ name, type: getServiceMeta(name).type }),
        );
  return {
    recurring: details.some((d) => d.type === PROJECT_TYPES.RECURRING),
    oneTime: details.some((d) => d.type === PROJECT_TYPES.ONE_TIME),
  };
};

/** Short schedule text for a service, used in table tooltips. */
export const describeServiceSchedule = (detail) => {
  if (!detail) return "";
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const end = detail.endDate
    ? fmt(detail.endDate)
    : detail.type === PROJECT_TYPES.RECURRING
      ? "Ongoing"
      : "TBD";
  const range = `${fmt(detail.startDate) || "—"} → ${end}`;
  return detail.type === PROJECT_TYPES.RECURRING
    ? `Recurring · ${detail.billingCycle || "Monthly"} · ${range}`
    : `One-time · ${detail.timeline || "Fixed Duration"} · ${range}`;
};
