import { memo } from "react";
import { FiCheck, FiClock, FiZap, FiTarget, FiAlertCircle, FiLock } from "react-icons/fi";
import { SLOT_ACTIVITY_ICONS, DEFAULT_SLOT_ICON, getSlotNumber } from "./scheduleConfig";
import { formatShortTime, formatExactTime, formatSlotStart } from "./scheduleUtils";

const BADGE_BASE =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap";

const StatusBadge = ({ slot, liveState, isSubmitted }) => {
  if (slot.completed) {
    const time = formatShortTime(slot.completedAt);
    if (slot.timingStatus === "on-time") {
      return (
        <span className={`${BADGE_BASE} bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800`}>
          <FiCheck size={10} className="stroke-3" /> On-time · {time}
        </span>
      );
    }
    if (slot.timingStatus === "early") {
      return (
        <span
          title="Marked more than 10 minutes before the slot started"
          className={`${BADGE_BASE} bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800`}
        >
          <FiAlertCircle size={10} /> Early · {time}
        </span>
      );
    }
    return (
      <span className={`${BADGE_BASE} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800`}>
        <FiClock size={10} /> Late · {time}
      </span>
    );
  }
  if (isSubmitted) {
    return (
      <span className={`${BADGE_BASE} bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800`}>
        Not done
      </span>
    );
  }
  if (liveState === "active") {
    return (
      <span className={`${BADGE_BASE} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800`}>
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-blue-500 opacity-60 animate-ping" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-blue-500" />
        </span>
        In progress
      </span>
    );
  }
  if (liveState === "upcoming") {
    return (
      <span className={`${BADGE_BASE} bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-white/10`}>
        <FiClock size={10} /> Upcoming
      </span>
    );
  }
  return (
    <span className={`${BADGE_BASE} bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800`}>
      Overdue
    </span>
  );
};

const cardTone = (slot, liveState, isSubmitted) => {
  if (slot.completed) {
    return slot.timingStatus === "on-time"
      ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/15"
      : "border-amber-200 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/15";
  }
  if (isSubmitted) return "border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10";
  if (liveState === "active") {
    return "border-blue-300 bg-white ring-4 ring-blue-500/10 shadow-sm dark:border-blue-700 dark:bg-[#0f182b]";
  }
  if (liveState === "overdue") return "border-rose-200 bg-white dark:border-rose-900/50 dark:bg-[#0c1220]";
  return "border-slate-200 bg-white dark:border-white/10 dark:bg-[#0c1220]";
};

const SlotCard = ({
  slot,
  liveState,
  willBeEarly,
  readOnly,
  readOnlyReason,
  isFirst,
  isLast,
  phaseColor,
  nextPhaseColor,
  isSubmitted,
  onToggleSlot,
  onToggleSubtask,
}) => {
  const num = getSlotNumber(slot.slotId);
  const activity = SLOT_ACTIVITY_ICONS[slot.slotId] || { ...DEFAULT_SLOT_ICON, Icon: FiClock };
  const ActivityIcon = activity.Icon;
  const subtasks = slot.subtasks || [];
  const doneSubtasks = subtasks.filter((st) => st.completed).length;
  const isDone = Boolean(slot.completed);
  const disabled = readOnly;

  const buttonTitle = readOnly
    ? readOnlyReason
    : willBeEarly
    ? `Starts at ${formatSlotStart(slot)}. Marking now is counted as Early (not on-time).`
    : undefined;

  return (
    <li className="relative flex gap-3 sm:gap-4">
      {/* Timeline rail */}
      <div className="relative flex flex-col items-center shrink-0 w-7" aria-hidden="true">
        <div className={`w-0.5 h-4 ${isFirst ? "opacity-0" : ""}`} style={{ backgroundColor: phaseColor }} />
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold border-2 transition-colors ${
            isDone ? "text-white" : "bg-white text-slate-600 dark:bg-[#0c1220] dark:text-slate-300"
          } ${liveState === "active" && !isDone ? "ring-4 ring-blue-500/15" : ""}`}
          style={{ borderColor: phaseColor, backgroundColor: isDone ? phaseColor : undefined }}
        >
          {isDone ? <FiCheck size={13} className="stroke-3" /> : num}
        </div>
        <div
          className={`w-0.5 grow ${isLast ? "opacity-0" : ""}`}
          style={{
            background:
              nextPhaseColor && nextPhaseColor !== phaseColor
                ? `linear-gradient(to bottom, ${phaseColor}, ${nextPhaseColor})`
                : phaseColor,
          }}
        />
      </div>

      {/* Card */}
      <article
        className={`grow min-w-0 mb-3 rounded-2xl border p-3.5 sm:p-4 transition-[border-color,background-color,box-shadow] duration-200 ${cardTone(
          slot,
          liveState,
          isSubmitted
        )}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${activity.bgClass}`}
            >
              <ActivityIcon size={16} className={activity.iconColor} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                  {slot.timeRange}
                </span>
                <StatusBadge slot={slot} liveState={liveState} isSubmitted={isSubmitted} />
              </div>
              <h4
                className={`mt-0.5 text-[13.5px] sm:text-sm font-bold leading-snug ${
                  isDone ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"
                }`}
              >
                {slot.title}
              </h4>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            title={buttonTitle}
            onClick={() => onToggleSlot(slot.slotId)}
            className={`shrink-0 self-start inline-flex items-center justify-center gap-1.5 min-w-26 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold border transition-[background-color,border-color,color,transform] duration-150 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed ${
              isDone
                ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-80"
                : "bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-[#131d31] dark:border-white/15 dark:text-slate-200 dark:hover:bg-emerald-950/40 disabled:opacity-50"
            }`}
          >
            {readOnly && !isDone ? (
              <>
                <FiLock size={12} /> Locked
              </>
            ) : isDone ? (
              <>
                <FiCheck size={13} className="stroke-3" /> Done
              </>
            ) : (
              <>
                <FiCheck size={13} /> Mark done
              </>
            )}
          </button>
        </div>

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div className="mt-3 pl-0 sm:pl-12">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Checklist</span>
              <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                {doneSubtasks}/{subtasks.length}
              </span>
            </div>
            <ul className="space-y-0.5">
              {subtasks.map((st) => (
                <li key={st.id}>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => onToggleSubtask(slot.slotId, st.id)}
                    className="group w-full flex items-start gap-2 text-left rounded-lg px-1.5 py-1 -mx-1.5 transition-colors hover:bg-slate-900/4 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-[background-color,border-color,transform] duration-150 group-active:scale-90 ${
                        st.completed
                          ? "bg-emerald-500 text-white"
                          : "border border-slate-300 bg-white group-hover:border-emerald-500 dark:border-slate-600 dark:bg-[#131d31]"
                      }`}
                    >
                      {st.completed && <FiCheck size={10} className="stroke-3" />}
                    </span>
                    <span
                      className={`text-[12px] leading-snug ${
                        st.completed
                          ? "text-slate-400 line-through dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {st.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benchmark / audit / reason */}
        {(slot.benchmark || (isDone && slot.completedAt) || (!isDone && slot.pendingReason)) && (
          <div className="mt-3 sm:pl-12 flex flex-col gap-1.5">
            {slot.benchmark && (
              <div className="inline-flex items-start gap-1.5 self-start px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-[11px] font-medium text-violet-800 dark:bg-violet-950/30 dark:border-violet-800/50 dark:text-violet-300">
                <FiTarget size={12} className="shrink-0 mt-px" />
                <span>Benchmark: {slot.benchmark}</span>
              </div>
            )}
            {!isDone && slot.pendingReason && (
              <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11.5px] text-rose-800 dark:bg-rose-950/30 dark:border-rose-800/50 dark:text-rose-300">
                <span className="font-semibold">Reason for pending: </span>
                {slot.pendingReason}
              </div>
            )}
            {isDone && slot.completedAt && (
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Completed at <strong className="font-semibold text-slate-700 dark:text-slate-200">{formatExactTime(slot.completedAt)}</strong>
                {slot.completedByName ? ` by ${slot.completedByName}` : ""}
              </p>
            )}
          </div>
        )}

        {willBeEarly && !readOnly && (
          <p className="mt-2 sm:pl-12 flex items-center gap-1 text-[10.5px] text-slate-400">
            <FiZap size={10} /> Starts at {formatSlotStart(slot)}. If you mark it now, it counts as Early, not on-time.
          </p>
        )}
      </article>
    </li>
  );
};

export default memo(SlotCard);
