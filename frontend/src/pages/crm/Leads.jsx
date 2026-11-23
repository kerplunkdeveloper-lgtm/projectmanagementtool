import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  FiSearch,
  FiX,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiPhone,
  FiMail,
  FiMapPin,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiExternalLink,
  FiInbox,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiZap,
  FiCheckCircle,
  FiFilter,
} from "react-icons/fi";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { useSocketContext } from "../../context/SocketContext";
import { getUsers } from "../../features/users/userSlice";
import {
  getLeads,
  getLeadStats,
  getMetaStatus,
  updateLead,
  deleteLead,
  syncLeadsFromMeta,
  importLeads,
  exportLeadsCsv,
} from "../../services/leadService";

// ---------- constants & helpers ----------

const STATUSES = ["New", "Contacted", "Follow Up", "Qualified", "Converted", "Lost"];

const STATUS_STYLES = {
  New: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
  Contacted: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60",
  "Follow Up": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  Qualified: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
  Converted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  Lost: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
};

const STATUS_DOT = {
  New: "bg-sky-500",
  Contacted: "bg-violet-500",
  "Follow Up": "bg-amber-500",
  Qualified: "bg-indigo-500",
  Converted: "bg-emerald-500",
  Lost: "bg-rose-500",
};

const PAGE_SIZES = [25, 50, 100];

const KNOWN_FIELDS = new Set(["full_name", "first_name", "last_name", "email", "phone_number", "phone", "city"]);

const prettyFieldName = (name = "") =>
  name
    .replace(/_/g, " ")
    .replace(/\?$/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];
const avatarColor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const whatsappLink = (phone = "") => {
  const digits = phone.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
};

const safeDate = (d) => {
  const dt = d ? new Date(d) : null;
  return dt && !isNaN(dt.getTime()) ? dt : null;
};

const PlatformBadge = ({ platform }) => {
  const p = (platform || "").toLowerCase();
  if (p === "ig" || p === "instagram") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60">
        <FaInstagram size={11} /> Instagram
      </span>
    );
  }
  if (p === "fb" || p === "facebook") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
        <FaFacebook size={11} /> Facebook
      </span>
    );
  }
  if (!p) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      {platform}
    </span>
  );
};

// Minimal CSV/TSV parser (handles quoted fields, escaped quotes, newlines in quotes)
const parseDelimited = (text) => {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delim = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((v) => String(v).trim() !== ""));
  if (nonEmpty.length < 2) return [];
  const BOM = String.fromCharCode(0xfeff); // Excel/Sheets CSVs may start with a byte-order mark
  const headers = nonEmpty[0].map((h) => String(h).split(BOM).join("").trim());
  return nonEmpty.slice(1).map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? ""])));
};

// ---------- small UI pieces ----------

const StatCard = ({ icon: Icon, label, value, sub, accent, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0b1220] hover:shadow-md ${
      active
        ? "border-indigo-400 ring-2 ring-indigo-400/30 dark:border-indigo-500"
        : "border-slate-200/80 dark:border-[#1e2a40] hover:border-slate-300 dark:hover:border-slate-600"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={15} />
      </span>
    </div>
    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value ?? "—"}</div>
    {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>}
  </button>
);

const SortHeader = ({ label, field, sortBy, sortDir, onSort, className = "" }) => {
  const active = sortBy === field;
  return (
    <th className={`py-3 px-4 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 ${
          active ? "text-slate-800 dark:text-slate-100" : ""
        }`}
      >
        {label}
        <span className="flex flex-col -space-y-1">
          <FiChevronUp size={10} className={active && sortDir === "asc" ? "opacity-100" : "opacity-30"} />
          <FiChevronDown size={10} className={active && sortDir === "desc" ? "opacity-100" : "opacity-30"} />
        </span>
      </button>
    </th>
  );
};

const StatusSelect = ({ value, onChange, size = "sm" }) => (
  <div className="relative inline-flex">
    <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${STATUS_DOT[value] || "bg-slate-400"}`} />
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none pl-5 pr-6 rounded-lg border font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
        size === "sm" ? "py-1 text-[11px]" : "py-1.5 text-xs"
      } ${STATUS_STYLES[value] || ""}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
          {s}
        </option>
      ))}
    </select>
    <FiChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
  </div>
);

// ---------- main page ----------

const Leads = () => {
  const dispatch = useDispatch();
  const { socket } = useSocketContext() || {};
  const usersState = useSelector((s) => s.users);
  const users = useMemo(() => usersState?.users || [], [usersState?.users]);

  // data
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [metaStatus, setMetaStatus] = useState(null);

  // query state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [formId, setFormId] = useState("All");
  const [campaign, setCampaign] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [assignedTo, setAssignedTo] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [limit, setLimit] = useState(25);

  // Page resets to 1 whenever any filter/sort changes: the page is stored together with the
  // filter set it belongs to, so a changed filter set reads as page 1 (no reset effect needed).
  const filterKey = JSON.stringify([search, status, formId, campaign, platform, assignedTo, from, to, sortBy, sortDir, limit]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (updater) =>
    setPageState((ps) => {
      const cur = ps.key === filterKey ? ps.page : 1;
      return { key: filterKey, page: typeof updater === "function" ? updater(cur) : updater };
    });

  // ui state
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightIds, setHighlightIds] = useState(() => new Set());

  useEffect(() => {
    if (!users.length) dispatch(getUsers());
  }, [dispatch, users.length]);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryParams = useMemo(
    () => ({ search, status, formId, campaign, platform, assignedTo, from, to, sortBy, sortDir, page, limit }),
    [search, status, formId, campaign, platform, assignedTo, from, to, sortBy, sortDir, page, limit]
  );

  // "loading" = the rows on screen don't belong to the current filter set yet.
  // A background refresh (refreshLeads) keeps the same key, so it doesn't flash a loader.
  const requestKey = JSON.stringify(queryParams);
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== requestKey;
  const [reloadTick, setReloadTick] = useState(0);
  const refreshLeads = useCallback(() => setReloadTick((t) => t + 1), []);
  const [statsTick, setStatsTick] = useState(0);
  const refreshStats = useCallback(() => setStatsTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false; // ignore out-of-order responses when filters change quickly
    getLeads(queryParams)
      .then((res) => {
        if (cancelled) return;
        setLeads(res.data || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || "Failed to load leads");
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [queryParams, requestKey, reloadTick]);

  useEffect(() => {
    let cancelled = false;
    getLeadStats()
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch(() => {}); // stats are non-critical
    return () => {
      cancelled = true;
    };
  }, [statsTick]);

  useEffect(() => {
    getMetaStatus()
      .then((r) => setMetaStatus(r.data))
      .catch(() => {});
  }, []);

  // Live: new lead from the Meta webhook
  useEffect(() => {
    if (!socket) return;
    const onNewLead = (lead) => {
      toast.success(`New lead: ${lead.fullName || lead.phone || "Unknown"}${lead.formName ? ` · ${lead.formName}` : ""}`, {
        icon: "🎯",
        duration: 5000,
      });
      setHighlightIds((prev) => new Set(prev).add(lead._id));
      setTimeout(() => {
        setHighlightIds((prev) => {
          const next = new Set(prev);
          next.delete(lead._id);
          return next;
        });
      }, 8000);
      refreshLeads();
      refreshStats();
      setMetaStatus((m) => (m ? { ...m, lastWebhookAt: new Date().toISOString() } : m));
    };
    socket.on("lead:new", onNewLead);
    return () => socket.off("lead:new", onNewLead);
  }, [socket, refreshLeads, refreshStats]);

  // ---------- actions ----------

  const patchLeadLocal = (id, data) => {
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, ...data } : l)));
    setSelected((s) => (s && s._id === id ? { ...s, ...data } : s));
  };

  const handleUpdate = async (lead, data, successMsg) => {
    const prev = { ...lead };
    patchLeadLocal(lead._id, data); // optimistic
    try {
      const res = await updateLead(lead._id, data);
      patchLeadLocal(lead._id, res.data);
      if (successMsg) toast.success(successMsg, { id: `lead-${lead._id}` });
      if (data.status) refreshStats();
    } catch (err) {
      patchLeadLocal(lead._id, prev);
      toast.error(err.response?.data?.message || "Failed to update lead");
    }
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete lead "${lead.fullName || lead.phone || lead.email}"? This cannot be undone.`)) return;
    try {
      await deleteLead(lead._id);
      toast.success("Lead deleted");
      setSelected(null);
      refreshLeads();
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete lead");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const t = toast.loading("Syncing leads from Meta (last 90 days)…");
    try {
      const res = await syncLeadsFromMeta(90);
      const { created, updated, forms, errors } = res.data || {};
      toast.success(`Synced ${forms} form(s): ${created} new, ${updated} updated`, { id: t });
      if (errors?.length) toast.error(errors.slice(0, 3).join("\n"), { duration: 8000 });
      refreshLeads();
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed", { id: t });
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportLeadsCsv({ search, status, formId, campaign, platform, assignedTo, from, to });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir(field === "submittedAt" ? "desc" : "asc");
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("All");
    setFormId("All");
    setCampaign("All");
    setPlatform("All");
    setAssignedTo("All");
    setFrom("");
    setTo("");
  };

  const activeFilterCount = [formId, campaign, platform, assignedTo].filter((v) => v !== "All").length + (from ? 1 : 0) + (to ? 1 : 0);
  const hasAnyFilter = activeFilterCount > 0 || status !== "All" || search;

  const assignableUsers = useMemo(
    () =>
      users
        .filter((u) => u.employmentStatus !== "relieved" && u.accountStatus !== "inactive")
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [users]
  );

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(total, page * limit);

  const selectCls =
    "px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer";

  // ---------- render ----------

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Leads</h1>
            {metaStatus && (
              <span
                title={
                  metaStatus.configured
                    ? metaStatus.lastWebhookAt
                      ? `Last lead received ${formatDistanceToNowStrict(new Date(metaStatus.lastWebhookAt))} ago`
                      : "Connected — waiting for the first webhook since the server started"
                    : "META_PAGE_ACCESS_TOKEN is not set on the server"
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  metaStatus.configured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${metaStatus.configured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {metaStatus.configured ? "Meta connected" : "Meta not connected"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Facebook &amp; Instagram lead-form submissions arrive here automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !metaStatus?.configured}
            title={metaStatus?.configured ? "Pull leads from Meta for the last 90 days (fills any gaps)" : "Configure Meta on the server first"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FiRefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            Sync from Meta
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#16213a] cursor-pointer"
          >
            <FiUpload size={13} /> Import Sheet
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#16213a] disabled:opacity-50 cursor-pointer"
          >
            <FiDownload size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          icon={FiUsers}
          label="Total leads"
          value={stats?.total}
          sub="All time"
          accent="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
          active={status === "All" && !hasAnyFilter}
          onClick={resetFilters}
        />
        <StatCard
          icon={FiZap}
          label="Today"
          value={stats?.today}
          sub={stats ? `${stats.last7} in last 7 days` : ""}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
          active={from === format(new Date(), "yyyy-MM-dd") && to === from}
          onClick={() => {
            const d = format(new Date(), "yyyy-MM-dd");
            setFrom(d);
            setTo(d);
          }}
        />
        <StatCard
          icon={FiInbox}
          label="New"
          value={stats?.statusCounts?.New}
          sub="Not contacted yet"
          accent="bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300"
          active={status === "New"}
          onClick={() => setStatus(status === "New" ? "All" : "New")}
        />
        <StatCard
          icon={FiCalendar}
          label="Follow up"
          value={stats?.statusCounts?.["Follow Up"]}
          sub="Needs a call back"
          accent="bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300"
          active={status === "Follow Up"}
          onClick={() => setStatus(status === "Follow Up" ? "All" : "Follow Up")}
        />
        <StatCard
          icon={FiTrendingUp}
          label="Qualified"
          value={stats?.statusCounts?.Qualified}
          sub="Good prospects"
          accent="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
          active={status === "Qualified"}
          onClick={() => setStatus(status === "Qualified" ? "All" : "Qualified")}
        />
        <StatCard
          icon={FiCheckCircle}
          label="Converted"
          value={stats?.statusCounts?.Converted}
          sub={
            stats?.total
              ? `${(((stats.statusCounts?.Converted || 0) / stats.total) * 100).toFixed(1)}% conversion`
              : ""
          }
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
          active={status === "Converted"}
          onClick={() => setStatus(status === "Converted" ? "All" : "Converted")}
        />
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-[#080d19] border border-slate-200/80 dark:border-[#1e2a40] rounded-2xl shadow-sm overflow-hidden">
        {/* Status tabs */}
        <div className="flex items-center gap-1 px-3 pt-3 overflow-x-auto scrollbar-thin border-b border-slate-100 dark:border-[#182338]">
          {["All", ...STATUSES].map((s) => {
            const count = s === "All" ? stats?.total : stats?.statusCounts?.[s];
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`relative shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg cursor-pointer transition-colors ${
                  active
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {s !== "All" && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />}
                {s}
                <span
                  className={`px-1.5 rounded-full text-[10px] tabular-nums ${
                    active ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {count ?? 0}
                </span>
                {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="p-3 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, phone, email, city, campaign…"
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#22314d] bg-slate-50 dark:bg-[#0f1729] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                  showFilters || activeFilterCount
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200"
                }`}
              >
                <FiFilter size={13} /> Filters
                {activeFilterCount > 0 && (
                  <span className="px-1.5 rounded-full bg-indigo-600 text-white text-[10px]">{activeFilterCount}</span>
                )}
              </button>
              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer px-1"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
              <select value={formId} onChange={(e) => setFormId(e.target.value)} className={selectCls}>
                <option value="All">All forms</option>
                {(stats?.forms || []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.count})
                  </option>
                ))}
              </select>
              <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className={selectCls}>
                <option value="All">All campaigns</option>
                {(stats?.campaigns || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectCls}>
                <option value="All">All platforms</option>
                {(stats?.platforms || []).map((p) => (
                  <option key={p} value={p}>
                    {p === "fb" ? "Facebook" : p === "ig" ? "Instagram" : p}
                  </option>
                ))}
              </select>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={selectCls}>
                <option value="All">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={selectCls} title="From date" />
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={selectCls} title="To date" />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-t border-slate-100 dark:border-[#182338]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/90 dark:bg-[#0c1220] text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-[#1e2a40]">
                <SortHeader label="Lead" field="fullName" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
                <th className="py-3 px-4 min-w-[190px]">Contact</th>
                <SortHeader label="Form / Campaign" field="campaignName" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
                <SortHeader label="Platform" field="platform" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Received" field="submittedAt" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="min-w-[130px]" />
                <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="py-3 px-4 min-w-[150px]">Assigned</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#182338]">
              {loading && leads.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className={`h-3.5 rounded bg-slate-100 dark:bg-slate-800 ${j === 0 ? "w-36" : "w-20"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <FiInbox size={20} />
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {hasAnyFilter ? "No leads match these filters" : "No leads yet"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {hasAnyFilter
                        ? "Try clearing a filter or searching for something else."
                        : "New Meta lead-form submissions will appear here. Use Sync from Meta or Import Sheet to bring in older ones."}
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const submitted = safeDate(l.submittedAt);
                  const wa = whatsappLink(l.phone);
                  const isFresh = highlightIds.has(l._id);
                  return (
                    <tr
                      key={l._id}
                      onClick={() => setSelected(l)}
                      className={`group cursor-pointer transition-colors ${
                        isFresh
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30"
                          : "hover:bg-slate-50/80 dark:hover:bg-[#0f1729]"
                      } ${loading ? "opacity-60" : ""}`}
                    >
                      {/* Lead */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(l.fullName || l._id)} text-white text-[11px] font-black flex items-center justify-center shadow-xs`}>
                            {initialsOf(l.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px] flex items-center gap-1.5">
                              {l.fullName || <span className="text-slate-400 font-medium italic">No name</span>}
                              {isFresh && (
                                <span className="px-1.5 py-px rounded text-[9px] font-black uppercase bg-emerald-500 text-white">New</span>
                              )}
                            </div>
                            {l.city && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                <FiMapPin size={10} /> {l.city}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {l.phone ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${l.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 tabular-nums"
                              >
                                {l.phone}
                              </a>
                              {wa && (
                                <a
                                  href={wa}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Open WhatsApp"
                                  className="text-emerald-500 hover:text-emerald-600"
                                >
                                  <FaWhatsapp size={13} />
                                </a>
                              )}
                            </div>
                          ) : null}
                          {l.email ? (
                            <a
                              href={`mailto:${l.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 truncate max-w-[200px]"
                            >
                              {l.email}
                            </a>
                          ) : null}
                          {!l.phone && !l.email && <span className="text-slate-400">—</span>}
                        </div>
                      </td>

                      {/* Form / Campaign */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[220px]" title={l.formName}>
                          {l.formName || "—"}
                        </div>
                        {l.campaignName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]" title={l.campaignName}>
                            {l.campaignName}
                          </div>
                        )}
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PlatformBadge platform={l.platform} />
                      </td>

                      {/* Received */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {submitted ? (
                          <>
                            <div className="font-semibold text-slate-700 dark:text-slate-200">{format(submitted, "d MMM yyyy")}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {format(submitted, "h:mm a")} · {formatDistanceToNowStrict(submitted)} ago
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusSelect value={l.status} onChange={(v) => handleUpdate(l, { status: v }, `Status → ${v}`)} />
                      </td>

                      {/* Assigned */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={l.assignedTo?._id || l.assignedTo || ""}
                          onChange={(e) => {
                            const u = assignableUsers.find((x) => x._id === e.target.value);
                            handleUpdate(
                              l,
                              { assignedTo: e.target.value || null },
                              u ? `Assigned to ${u.name}` : "Unassigned"
                            );
                          }}
                          className="w-full max-w-[160px] px-2 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-[#22314d] bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {assignableUsers.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(l);
                            }}
                            title="Open details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                          >
                            <FiExternalLink size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(l);
                            }}
                            title="Delete lead"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 dark:border-[#182338] text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-100 tabular-nums">{startIdx}–{endIdx}</strong> of{" "}
              <strong className="text-slate-800 dark:text-slate-100 tabular-nums">{total}</strong>
            </span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#22314d] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#16213a] cursor-pointer disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={14} />
            </button>
            <span className="px-2 tabular-nums">
              Page <strong className="text-slate-800 dark:text-slate-100">{page}</strong> / {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#22314d] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#16213a] cursor-pointer disabled:cursor-not-allowed"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <LeadDrawer
          key={selected._id}
          lead={selected}
          users={assignableUsers}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onDone={() => {
            setImportOpen(false);
            refreshLeads();
            refreshStats();
          }}
        />
      )}
    </div>
  );
};

// ---------- detail drawer ----------

const DetailRow = ({ label, value }) =>
  value ? (
    <div className="flex justify-between gap-4 py-1.5 text-xs">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-100 text-right break-words min-w-0">{value}</span>
    </div>
  ) : null;

// Rendered with key={lead._id}, so local draft state resets when a different lead is opened
const LeadDrawer = ({ lead, users, onClose, onUpdate, onDelete }) => {
  const [notes, setNotes] = useState(lead.notes || "");
  const followUp = lead.followUpDate ? String(lead.followUpDate).slice(0, 10) : "";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submitted = safeDate(lead.submittedAt);
  const wa = whatsappLink(lead.phone);
  const otherAnswers = (lead.fieldData || []).filter((f) => !KNOWN_FIELDS.has(String(f.name).toLowerCase()));
  const notesDirty = notes !== (lead.notes || "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full bg-white dark:bg-[#0b101d] border-l border-slate-200 dark:border-[#1e2a40] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#182338]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(lead.fullName || lead._id)} text-white font-black flex items-center justify-center`}>
                {initialsOf(lead.fullName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-900 dark:text-white truncate">{lead.fullName || "No name"}</h2>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {submitted ? `${format(submitted, "d MMM yyyy, h:mm a")} · ${formatDistanceToNowStrict(submitted)} ago` : ""}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <a
              href={lead.phone ? `tel:${lead.phone}` : undefined}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                lead.phone
                  ? "border-slate-200 dark:border-[#22314d] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#16213a]"
                  : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 pointer-events-none"
              }`}
            >
              <FiPhone size={13} /> Call
            </a>
            <a
              href={wa || undefined}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                wa
                  ? "border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                  : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 pointer-events-none"
              }`}
            >
              <FaWhatsapp size={13} /> WhatsApp
            </a>
            <a
              href={lead.email ? `mailto:${lead.email}` : undefined}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                lead.email
                  ? "border-slate-200 dark:border-[#22314d] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#16213a]"
                  : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 pointer-events-none"
              }`}
            >
              <FiMail size={13} /> Email
            </a>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Pipeline */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pipeline</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Status</span>
                <div>
                  <StatusSelect value={lead.status} size="md" onChange={(v) => onUpdate(lead, { status: v }, `Status → ${v}`)} />
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Follow-up date</span>
                <input
                  type="date"
                  value={followUp}
                  onChange={(e) => {
                    onUpdate(lead, { followUpDate: e.target.value || null }, e.target.value ? "Follow-up date set" : "Follow-up cleared");
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Assigned to</span>
              <select
                value={lead.assignedTo?._id || lead.assignedTo || ""}
                onChange={(e) => {
                  const u = users.find((x) => x._id === e.target.value);
                  onUpdate(lead, { assignedTo: e.target.value || null }, u ? `Assigned to ${u.name}` : "Unassigned");
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Call summary, requirements, budget…"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#22314d] bg-white dark:bg-[#0f1729] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y"
              />
              {notesDirty && (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setNotes(lead.notes || "")} className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate(lead, { notes }, "Notes saved")}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    Save notes
                  </button>
                </div>
              )}
            </label>
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Contact</h3>
            <div className="divide-y divide-slate-100 dark:divide-[#182338]">
              <DetailRow label="Phone" value={lead.phone} />
              <DetailRow label="Email" value={lead.email} />
              <DetailRow label="City" value={lead.city} />
            </div>
          </section>

          {/* Form answers */}
          {otherAnswers.length > 0 && (
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Form answers</h3>
              <div className="space-y-2">
                {otherAnswers.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1729] border border-slate-100 dark:border-[#1a2438]">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{prettyFieldName(f.name)}</div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-100 mt-0.5 break-words">{f.value || "—"}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Attribution */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Source</h3>
            <div className="divide-y divide-slate-100 dark:divide-[#182338]">
              <DetailRow label="Platform" value={<PlatformBadge platform={lead.platform} />} />
              <DetailRow label="Form" value={lead.formName} />
              <DetailRow label="Campaign" value={lead.campaignName} />
              <DetailRow label="Ad set" value={lead.adsetName} />
              <DetailRow label="Ad" value={lead.adName} />
              <DetailRow label="Organic" value={lead.isOrganic ? "Yes" : null} />
              <DetailRow
                label="Added via"
                value={
                  { meta_webhook: "Meta (live)", meta_sync: "Meta sync", import: "Sheet import", manual: "Manual" }[lead.source] || lead.source
                }
              />
              <DetailRow label="Meta lead ID" value={lead.leadgenId} />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#182338] flex justify-between">
          <button
            type="button"
            onClick={() => onDelete(lead)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <FiTrash2 size={13} /> Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#22314d] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#16213a] cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};

// ---------- import modal ----------

const ImportModal = ({ onClose, onDone }) => {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      toast.error("Please upload a .csv file (Google Sheets → File → Download → CSV)");
      return;
    }
    const text = await file.text();
    const parsed = parseDelimited(text);
    if (parsed.length === 0) {
      toast.error("No rows found in this file");
      return;
    }
    setRows(parsed);
    setFileName(file.name);
  };

  const headers = rows.length ? Object.keys(rows[0]) : [];

  const doImport = async () => {
    setImporting(true);
    try {
      const res = await importLeads(rows);
      const { created, updated, skipped } = res.data || {};
      toast.success(`Imported: ${created} new, ${updated} updated, ${skipped} skipped`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={importing ? undefined : onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-[#1e2a40] rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Import leads from Google Sheet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              In your leads sheet: <strong>File → Download → Comma-separated values (.csv)</strong>, then upload it here.
              Leads already in the system (same Meta lead ID) are updated, not duplicated.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={importing} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <FiX size={18} />
          </button>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="border-2 border-dashed border-slate-200 dark:border-[#22314d] rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
        >
          <FiUpload className="mx-auto text-slate-400" size={22} />
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">
            {fileName || "Drop your .csv here or click to choose"}
          </div>
          {rows.length > 0 && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{rows.length} rows ready to import</div>
          )}
          <input ref={inputRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>

        {rows.length > 0 && (
          <div className="overflow-auto max-h-56 rounded-xl border border-slate-100 dark:border-[#1a2438]">
            <table className="w-full text-[11px] whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-[#0c1220] sticky top-0">
                <tr>
                  {headers.slice(0, 8).map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#182338]">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {headers.slice(0, 8).map((h) => (
                      <td key={h} className="px-3 py-1.5 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                        {r[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={importing} className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={doImport}
            disabled={!rows.length || importing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {importing && <FiRefreshCw size={12} className="animate-spin" />}
            Import {rows.length ? `${rows.length} leads` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leads;
