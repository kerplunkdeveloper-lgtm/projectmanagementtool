import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBookOpen,
  FiX,
  FiSearch,
  FiChevronDown,
  FiZap,
  FiUsers,
  FiUploadCloud,
  FiActivity,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";

const SEEN_KEY = "contentCalendarGuideSeen_v1";

// ─── Guide content ──────────────────────────────────────────────────────────
// Each item: { q: title, a: [lines], tone?: "rule" | "warn" | "tip" }
const SECTIONS = [
  {
    id: "start",
    label: "Quick start",
    icon: FiZap,
    items: [
      {
        q: "What shows on the Content Calendar?",
        a: [
          "Only commitment tasks (Commitment = Yes) that have a Publish Date or Due Date.",
          "Tasks of inactive clients are hidden automatically.",
        ],
      },
      {
        q: "Add a post",
        a: ["Click any empty date slot on the calendar to create a post for that day."],
        tone: "tip",
      },
      {
        q: "Reschedule a post",
        a: [
          "Drag a post card and drop it on another date.",
          "The original publish time is kept — only the date changes.",
        ],
        tone: "tip",
      },
      {
        q: "Filter the calendar",
        a: ["Use the filters to narrow by Client, Category, Content Type, Status and Assignee."],
      },
      {
        q: "Bulk delete",
        a: ["Turn on select mode, tick the posts you want, then use Delete. This cannot be undone."],
        tone: "warn",
      },
    ],
  },
  {
    id: "clients",
    label: "Client rules",
    icon: FiUsers,
    items: [
      {
        q: "Which clients appear in the client list?",
        a: [
          "Only registered, active clients.",
          "The client must have at least one Post, Reel or Story in its deliverables.",
          "Names typed only on tasks (e.g. spelling mistakes) are never listed.",
        ],
        tone: "rule",
      },
      {
        q: "A client is missing from the list",
        a: [
          "Check the client is Active on the Clients page.",
          "Check the client has Posts / Reels / Stories greater than 0.",
        ],
      },
    ],
  },
  {
    id: "import",
    label: "Import rules",
    icon: FiUploadCloud,
    items: [
      {
        q: "File format",
        a: [
          "Upload a .csv file. From Excel / Google Sheets use “Save as / Download → CSV”.",
          "Start from “Download Template” so the column headers are correct.",
        ],
        tone: "rule",
      },
      {
        q: "Required columns",
        a: ["Client Name and Task Title are required on every row."],
        tone: "rule",
      },
      {
        q: "Client Name must match exactly",
        a: [
          "Client Name must be an existing active client with Posts / Reels / Stories.",
          "New clients are never created from an import.",
          "If a name doesn't match (e.g. “Valli Vilas” instead of “Valli Villas”), the import is blocked and a popup shows the mistake with a suggested correct name.",
        ],
        tone: "warn",
      },
      {
        q: "All-or-nothing import",
        a: [
          "If even one row has a mistake, nothing is imported.",
          "In the popup you can pick the correct client, remove the invalid rows, or fix your file and upload again.",
        ],
        tone: "rule",
      },
      {
        q: "Dates & time",
        a: [
          "Dates: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY or Excel date numbers.",
          "Time: HH:MM (24-hour). If empty, 18:00 is used.",
          "If only one of Publish Date / Due Date is given, the other is set to the same day.",
        ],
      },
      {
        q: "Default values",
        a: [
          "Content Type: Post, Reels, Stories or Others Task — default Post.",
          "Platforms: comma separated (Instagram, Facebook…) — default Instagram.",
          "Priority: High, Medium or Low — default Medium.",
          "Unknown Status values become “Not started”.",
        ],
      },
    ],
  },
  {
    id: "status",
    label: "Status flow",
    icon: FiActivity,
    items: [
      {
        q: "Status stages",
        a: [
          "Not started → In progress → In QC → Scheduled → Completed / Live / Published.",
          "“Completed and wait Client Approval” and “Waiting for Response” are used while waiting on the client.",
        ],
      },
      {
        q: "Platform verification",
        a: [
          "When you mark a post as done, you may be asked to confirm which platforms it was actually posted on.",
          "Only confirm platforms that are really live.",
        ],
        tone: "warn",
      },
      {
        q: "At Risk & Overdue",
        a: [
          "At Risk: a post that isn't done yet and is due to publish within the next 24 hours.",
          "Overdue: the publish time has already passed and the post isn't done.",
        ],
      },
    ],
  },
  {
    id: "access",
    label: "Access",
    icon: FiShield,
    items: [
      {
        q: "Read-only roles",
        a: [
          "Admin, Operation Manager and Social Media Head can view the calendar but cannot add, edit, drag, delete or import posts.",
        ],
        tone: "rule",
      },
      {
        q: "Branch view",
        a: ["Admin and Operation Manager can switch between branches using the branch tabs."],
      },
    ],
  },
];

const TONE = {
  rule: {
    icon: FiCheckCircle,
    chip: "Rule",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900/60",
  },
  warn: {
    icon: FiAlertTriangle,
    chip: "Important",
    cls: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/60",
  },
  tip: {
    icon: FiInfo,
    chip: "Tip",
    cls: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/40 dark:border-sky-900/60",
  },
};

export default function ContentCalendarGuide({ isReadOnly = false }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("start");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState("start-0");
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true;
    }
  });
  const searchRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!seen) {
      setSeen(true);
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* storage unavailable */
      }
    }
  };

  // Search across every section
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out = [];
    SECTIONS.forEach((s) =>
      s.items.forEach((it, i) => {
        const hay = (it.q + " " + it.a.join(" ")).toLowerCase();
        if (hay.includes(q)) out.push({ ...it, key: `${s.id}-${i}`, section: s.label });
      })
    );
    return out;
  }, [query]);

  const current = SECTIONS.find((s) => s.id === active) || SECTIONS[0];
  const list = results ?? current.items.map((it, i) => ({ ...it, key: `${current.id}-${i}` }));

  return (
    <>
      {/* ================= FLOATING LAUNCHER ================= */}
      <motion.button
        type="button"
        onClick={handleOpen}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        aria-expanded={open}
        aria-label={open ? "Close Content Calendar guide" : "Open Content Calendar guide"}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[45] group flex items-center gap-2 h-12 pl-3.5 pr-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_12px_30px_-8px_rgba(16,185,129,0.65)] hover:shadow-[0_16px_36px_-8px_rgba(16,185,129,0.8)] transition-shadow cursor-pointer"
      >
        {!seen && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-400 border-2 border-white" />
          </span>
        )}
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
          {open ? <FiX size={16} /> : <FiBookOpen size={15} />}
        </span>
        <span className="text-[13px] font-bold tracking-wide hidden sm:inline">
          {open ? "Close" : "Guide"}
        </span>
      </motion.button>

      {/* ================= GUIDE PANEL ================= */}
      <AnimatePresence>
        {open && (
          <>
            {/* mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[44] bg-slate-900/40 backdrop-blur-[2px] sm:hidden"
            />
            <motion.aside
              role="dialog"
              aria-label="Content Calendar user guide"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => searchRef.current?.focus({ preventScroll: true })}
              className="fixed z-[45] inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-[88px] sm:w-[400px] max-h-[72vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e2a40] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] origin-bottom-right"
            >
              {/* Header */}
              <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">User guide</p>
                    <h2 className="text-[17px] font-extrabold leading-tight mt-0.5">Content Calendar — rules & help</h2>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isReadOnly ? "bg-white/15 border-white/30" : "bg-white text-emerald-700 border-white"
                    }`}
                  >
                    {isReadOnly ? "View only" : "Full access"}
                  </span>
                </div>
                {/* Search */}
                <div className="relative mt-3.5">
                 
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search rules, e.g. “import”, “client”"
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-white text-[12.5px] text-slate-800 placeholder:text-slate-400 border-0 outline-none focus:ring-2 focus:ring-white/60"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <FiX size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Section tabs */}
              {!results && (
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto border-b border-slate-100 dark:border-[#1e2a40] [scrollbar-width:none]">
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const isActive = s.id === active;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setActive(s.id);
                          setExpanded(`${s.id}-0`);
                        }}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors cursor-pointer ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 dark:bg-[#131d31] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#1e2a40] hover:border-emerald-400"
                        }`}
                      >
                        <Icon size={12} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {results && (
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 pb-1">
                    {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
                  </p>
                )}
                {list.length === 0 && (
                  <div className="py-10 text-center text-[12px] text-slate-500 dark:text-slate-400">
                    No matching rules. Try another word.
                  </div>
                )}
                {list.map((it) => {
                  const isOpen = results ? true : expanded === it.key;
                  const tone = it.tone ? TONE[it.tone] : null;
                  const ToneIcon = tone?.icon;
                  return (
                    <div
                      key={it.key}
                      className={`rounded-xl border transition-colors ${
                        isOpen
                          ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10"
                          : "border-slate-200 dark:border-[#1e2a40] bg-white dark:bg-[#0f172a]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => !results && setExpanded(isOpen ? "" : it.key)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left cursor-pointer"
                      >
                        {ToneIcon ? (
                          <ToneIcon className={`shrink-0 ${tone.cls.split(" ")[0]}`} size={14} />
                        ) : (
                          <span className="w-1.5 h-1.5 mx-[4px] rounded-full bg-emerald-500 shrink-0" />
                        )}
                        <span className="flex-1 text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{it.q}</span>
                        {results && (
                          <span className="text-[9.5px] font-semibold text-slate-400 shrink-0">{it.section}</span>
                        )}
                        {!results && (
                          <FiChevronDown
                            size={15}
                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 -mt-0.5">
                              {tone && (
                                <span className={`inline-block mb-2 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border ${tone.cls}`}>
                                  {tone.chip}
                                </span>
                              )}
                              <ul className="space-y-1.5">
                                {it.a.map((line, li) => (
                                  <li key={li} className="flex gap-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                                    <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-[#1e2a40] bg-slate-50/70 dark:bg-[#0f172a] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Press Esc to close</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sorted · Content Calendar</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
