import { FiCheckCircle, FiUser } from "react-icons/fi";

const TYPES = [
  { key: "posts", label: "Posts", bar: "bg-emerald-500" },
  { key: "reels", label: "Reels", bar: "bg-purple-500" },
  { key: "story", label: "Stories", bar: "bg-amber-500" },
];

// Posts / Reels / Stories cell: "12 / 120", progress bar, pending
function TypeCell({ label, bar, stat }) {
  const committed = stat?.committed || 0;
  const published = stat?.posted || 0;
  const pending = Math.max(0, committed - published);
  const extra = Math.max(0, published - committed);
  const pct = committed > 0 ? Math.min(100, Math.round((published / committed) * 100)) : published > 0 ? 100 : 0;
  const nothing = committed === 0 && published === 0;

  return (
    <div className={`min-w-[140px] flex-1 ${nothing ? "opacity-50" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
          {published}
          <span className="text-slate-400 font-bold"> / {committed}</span>
        </span>
      </div>
      <div className="h-1.5 mt-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[10px] font-bold tabular-nums">
        {nothing ? (
          <span className="text-slate-400">No commitment</span>
        ) : extra > 0 ? (
          <span className="text-rose-600 dark:text-rose-400">+{extra} extra published</span>
        ) : pending > 0 ? (
          <span className="text-amber-600 dark:text-amber-400">{pending} pending</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle size={10} /> Done
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Horizontal list of client commitments for the Pending Commitment modal:
 *   ● Client (SMM name) | Posts | Reels | Stories | Pending
 * `rows` are the modal's already-filtered client summaries (computeAllClientsCommitments shape).
 */
export default function CommitmentListView({ rows = [], onRowClick }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-[#1e2a40] bg-white dark:bg-[#0b101d] overflow-hidden">
      {/* Column header (desktop) */}
      <div className="hidden md:flex items-center gap-5 px-4 py-2 bg-slate-50 dark:bg-[#0f1729] border-b border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
        <span className="w-56 shrink-0">Client · SMM</span>
        <span className="flex-1">Posts</span>
        <span className="flex-1">Reels</span>
        <span className="flex-1">Stories</span>
        <span className="w-20 text-right">Pending</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {rows.map((cs) => {
          const pending = cs.totalPendingDelivery || 0;
          const Row = onRowClick ? "button" : "div";
          return (
            <Row
              key={cs.client?._id || cs.clientName}
              {...(onRowClick
                ? { type: "button", onClick: () => onRowClick(cs), title: `View ${cs.clientName} in the calendar` }
                : {})}
              className={`w-full text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-5 px-4 py-3 transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" : ""
              }`}
            >
              {/* Client + SMM */}
              <div className="md:w-56 shrink-0 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cs.color || cs.client?.color || "#6366f1" }}
                  />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{cs.clientName}</span>
                </div>
                <div className="mt-1 ml-[18px] flex items-center gap-1 text-[10px] font-semibold min-w-0">
                  <FiUser size={10} className="shrink-0 text-slate-400" />
                  {cs.smmName ? (
                    <span className="truncate text-indigo-600 dark:text-indigo-300">{cs.smmName}</span>
                  ) : (
                    <span className="italic text-slate-400">No SMM assigned</span>
                  )}
                </div>
              </div>

              {/* Posts / Reels / Stories */}
              <div className="flex flex-1 flex-wrap sm:flex-nowrap gap-4 sm:gap-5 min-w-0">
                {TYPES.map((t) => (
                  <TypeCell key={t.key} label={t.label} bar={t.bar} stat={cs[t.key]} />
                ))}
              </div>

              {/* Total pending */}
              <div className="shrink-0 md:w-20 md:text-right">
                {pending > 0 ? (
                  <span className="inline-flex flex-col md:items-end">
                    <span className="text-base font-black text-amber-600 dark:text-amber-400 leading-none tabular-nums">
                      {pending}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">pending</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <FiCheckCircle size={13} /> All done
                  </span>
                )}
              </div>
            </Row>
          );
        })}
      </div>
    </div>
  );
}
