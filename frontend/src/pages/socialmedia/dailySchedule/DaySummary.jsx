import { memo } from "react";
import { FiCheckCircle, FiClock, FiRotateCcw, FiZap, FiSend } from "react-icons/fi";
import { formatShortTime } from "./scheduleUtils";

const ProgressRing = ({ pct }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-21 h-21 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-100 dark:stroke-white/10" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className={`transition-[stroke-dashoffset] duration-500 ${pct === 100 ? "stroke-emerald-500" : "stroke-indigo-500"}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">{pct}%</span>
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">done</span>
      </div>
    </div>
  );
};

const Stat = ({ label, value, dot }) => (
  <div className="flex-1 min-w-18 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/3 px-3 py-2">
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
    <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight">{value}</div>
  </div>
);

const DaySummary = ({
  schedule,
  activeSlot,
  isToday,
  isFutureDate,
  canReopen,
  onReopen,
  reopening,
  onOpenSubmit,
}) => {
  const total = schedule.totalSlotsCount || schedule.slots?.length || 0;
  const done = schedule.completedSlotsCount || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const pending = total - done;

  return (
    <section className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing pct={pct} />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 dark:text-white">
              {done} of {total} slots completed
            </p>
            {isToday && activeSlot ? (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-blue-600 dark:text-blue-400">
                <FiZap size={11} /> Now: <span className="font-semibold truncate">{activeSlot.title}</span>
              </p>
            ) : isFutureDate ? (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-500">
                <FiClock size={11} /> Future date. Slots open on the day.
              </p>
            ) : (
              <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
                {pending > 0 ? `${pending} slot${pending > 1 ? "s" : ""} pending` : "All slots done"}
              </p>
            )}
            {isToday && activeSlot && (
              <p className="text-[10.5px] text-slate-400">{activeSlot.timeRange}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 flex-1">
          <Stat label="On-time" value={schedule.onTimeSlotsCount || 0} dot="bg-emerald-500" />
          <Stat label="Early" value={schedule.earlySlotsCount || 0} dot="bg-orange-500" />
          <Stat label="Late" value={schedule.delayedSlotsCount || 0} dot="bg-amber-500" />
          <Stat label="Pending" value={pending} dot="bg-rose-500" />
        </div>
      </div>

      {/* Submission status */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {schedule.isSubmitted ? (
          <div className="flex items-start gap-2">
            <FiCheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                Submitted at {formatShortTime(schedule.submittedAt)}
                {schedule.submittedByName ? ` by ${schedule.submittedByName}` : ""}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">This day is read-only.</p>
              {schedule.submissionNote && (
                <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-300 italic">“{schedule.submissionNote}”</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <FiSend size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">Not submitted yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {schedule.reopenedAt
                  ? `Reopened by ${schedule.reopenedByName || "manager"} at ${formatShortTime(schedule.reopenedAt)}. Submit again when done.`
                  : "At the end of the day, submit with a reason for each pending slot."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {schedule.isSubmitted && canReopen && (
            <button
              type="button"
              onClick={onReopen}
              disabled={reopening}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5 disabled:opacity-60"
            >
              {reopening ? (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiRotateCcw size={12} />
              )}
              Reopen day
            </button>
          )}
          {!schedule.isSubmitted && !isFutureDate && (
            <button
              type="button"
              onClick={onOpenSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11.5px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20"
            >
              <FiSend size={12} /> Submit day
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default memo(DaySummary);
