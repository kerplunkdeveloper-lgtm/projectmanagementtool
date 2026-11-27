import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiX, FiSend, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { MIN_REASON_LENGTH, MAX_REASON_LENGTH, MAX_NOTE_LENGTH } from "./scheduleUtils";

const QUICK_REASONS = [
  "Waiting for client approval",
  "Waiting for designer / videographer",
  "Client meeting or call ran over",
  "Content or inputs not received",
  "Handled an urgent client request",
  "Technical / tool issue",
];

/**
 * End-of-day submission. Every slot left incomplete needs a reason before the day can be submitted.
 * Rendered only while open (parent mounts it), so its state starts fresh from the saved draft each time.
 */
const SubmitDayModal = ({ schedule, initialDraft, onDraftChange, onClose, onSubmit, submitting, serverMissingIds }) => {
  const pendingSlots = useMemo(() => (schedule.slots || []).filter((s) => !s.completed), [schedule.slots]);
  const [reasons, setReasons] = useState(() => {
    const init = {};
    pendingSlots.forEach((s) => {
      init[s.slotId] = initialDraft?.reasons?.[s.slotId] ?? s.pendingReason ?? "";
    });
    return init;
  });
  const [note, setNote] = useState(initialDraft?.note || schedule.submissionNote || "");
  const [showErrors, setShowErrors] = useState(false);
  const firstFieldRef = useRef(null);

  const missingIds = useMemo(
    () => pendingSlots.filter((s) => (reasons[s.slotId] || "").trim().length < MIN_REASON_LENGTH).map((s) => s.slotId),
    [pendingSlots, reasons]
  );
  const missingSet = useMemo(
    () => new Set(showErrors ? [...missingIds, ...(serverMissingIds || [])] : serverMissingIds || []),
    [showErrors, missingIds, serverMissingIds]
  );

  // Persist the draft (debounced) so nothing typed is lost if the modal is closed
  useEffect(() => {
    const id = setTimeout(() => onDraftChange({ reasons, note }), 300);
    return () => clearTimeout(id);
  }, [reasons, note, onDraftChange]);

  // Lock page scroll and focus the first field while open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const setReason = (slotId, value) => setReasons((prev) => ({ ...prev, [slotId]: value.slice(0, MAX_REASON_LENGTH) }));

  const applyQuickReason = (slotId, text) =>
    setReasons((prev) => {
      const current = (prev[slotId] || "").trim();
      if (current.toLowerCase().includes(text.toLowerCase())) return prev;
      return { ...prev, [slotId]: (current ? `${current}. ${text}` : text).slice(0, MAX_REASON_LENGTH) };
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (missingIds.length > 0) {
      setShowErrors(true);
      document.getElementById(`reason-${missingIds[0]}`)?.focus();
      return;
    }
    const trimmed = {};
    pendingSlots.forEach((s) => {
      trimmed[s.slotId] = reasons[s.slotId].trim();
    });
    onSubmit(trimmed, note.trim());
  };

  const done = schedule.completedSlotsCount || 0;
  const total = schedule.totalSlotsCount || schedule.slots?.length || 0;

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !submitting && onClose()}
      />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-day-title"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0c1220] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 id="submit-day-title" className="text-base font-bold text-slate-900 dark:text-white">
              Submit today's schedule
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
              {done} of {total} slots completed.{" "}
              {pendingSlots.length > 0
                ? `Add a reason for each of the ${pendingSlots.length} pending slot${pendingSlots.length > 1 ? "s" : ""}.`
                : "Everything is done."}{" "}
              Once you submit, the day can't be edited.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {pendingSlots.length === 0 ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300">
              <FiCheckCircle size={18} className="shrink-0" />
              All {total} slots are complete. Great work!
            </div>
          ) : (
            pendingSlots.map((slot, idx) => {
              const value = reasons[slot.slotId] || "";
              const hasError = missingSet.has(slot.slotId);
              return (
                <div
                  key={slot.slotId}
                  className={`rounded-2xl border p-3.5 space-y-2.5 ${
                    hasError
                      ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20"
                      : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/3"
                  }`}
                >
                  <label htmlFor={`reason-${slot.slotId}`} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {slot.title}
                        </span>
                        <span className="block text-[10.5px] text-slate-500 dark:text-slate-400">{slot.timeRange}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400 tabular-nums">
                      {value.length}/{MAX_REASON_LENGTH}
                    </span>
                  </label>

                  <textarea
                    id={`reason-${slot.slotId}`}
                    ref={idx === 0 ? firstFieldRef : undefined}
                    rows={2}
                    value={value}
                    onChange={(e) => setReason(slot.slotId, e.target.value)}
                    placeholder="Reason for pending *"
                    aria-invalid={hasError}
                    className={`dws-field ${hasError ? "dws-field-error" : ""} block w-full resize-y px-3 py-2 text-[12.5px] leading-relaxed`}
                  />

                  {hasError && (
                    <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      <FiAlertTriangle size={11} /> Please add a reason (at least {MIN_REASON_LENGTH} characters).
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REASONS.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => applyQuickReason(slot.slotId, text)}
                        className="px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:bg-[#131d31] dark:border-white/10 dark:text-slate-300 dark:hover:bg-indigo-950/40 transition-colors"
                      >
                        + {text}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 space-y-2">
            <label htmlFor="eod-note" className="block text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
              End-of-day note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="eod-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
              placeholder="Highlights, blockers or anything your manager should know"
              className="dws-field block w-full resize-y px-3 py-2 text-[12.5px] leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/2 rounded-b-2xl">
          <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
            {missingIds.length > 0
              ? `${missingIds.length} reason${missingIds.length > 1 ? "s" : ""} missing`
              : "Ready to submit"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl text-[12px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/20"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSend size={13} />
              )}
              Submit day
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
};

export default SubmitDayModal;
