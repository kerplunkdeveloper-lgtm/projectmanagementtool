import { memo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiUsers, FiCheckCircle } from "react-icons/fi";
import { getInitials, sameId } from "./scheduleUtils";
import { TOTAL_SLOTS } from "./scheduleConfig";

const Avatar = ({ name, url }) => {
  const [failedUrl, setFailedUrl] = useState(null);
  if (url && failedUrl !== url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setFailedUrl(url)}
        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/15"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white text-[10.5px] font-bold flex items-center justify-center">
      {getInitials(name)}
    </div>
  );
};

const ExecutiveChip = memo(({ exec, avatarUrl, isSelected, onSelect }) => {
  const user = exec.user || {};
  const total = exec.totalSlotsCount || TOTAL_SLOTS;
  const done = exec.completedSlotsCount || 0;
  const pct = Math.round((done / total) * 100);

  return (
    <button
      type="button"
      onClick={() => onSelect(user._id)}
      aria-pressed={isSelected}
      className={`shrink-0 w-48 flex items-center gap-2.5 p-2 rounded-xl border text-left transition-colors ${
        isSelected
          ? "bg-indigo-50 border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-500"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#131d31] dark:border-white/10 dark:hover:bg-[#19243a]"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar name={user.name} url={avatarUrl} />
        {exec.isSubmitted && (
          <span
            title="Day submitted"
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#131d31]"
          >
            <FiCheckCircle size={9} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">{user.name}</span>
          <span className="shrink-0 text-[10px] font-bold text-slate-500 tabular-nums">
            {done}/{total}
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${pct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[9.5px] font-semibold">
          {exec.isSubmitted ? (
            <span className="text-emerald-600 dark:text-emerald-400">Submitted</span>
          ) : (
            <span className="text-slate-400">Not submitted</span>
          )}
          {exec.delayedSlotsCount > 0 && <span className="text-amber-600">· {exec.delayedSlotsCount} late</span>}
          {exec.earlySlotsCount > 0 && <span className="text-orange-600">· {exec.earlySlotsCount} early</span>}
        </div>
      </div>
    </button>
  );
});
ExecutiveChip.displayName = "ExecutiveChip";

const ExecutivePicker = ({ executives, selectedId, onSelect, getAvatarUrl }) => {
  const scrollRef = useRef(null);
  const scrollBy = (offset) => scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  const submittedCount = executives.filter((e) => e.isSubmitted).length;

  return (
    <section className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
            <FiUsers size={14} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-bold text-slate-900 dark:text-white">Social Media Executives</h3>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              {executives.length} executives · {submittedCount} submitted
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-240)}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center"
          >
            <FiChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(240)}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {executives.length === 0 ? (
        <p className="text-[12px] text-slate-500 py-2">No social media executives found.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {executives.map((exec) => (
            <ExecutiveChip
              key={exec.user?._id}
              exec={exec}
              avatarUrl={getAvatarUrl(exec.user)}
              isSelected={sameId(selectedId, exec.user?._id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default memo(ExecutivePicker);
