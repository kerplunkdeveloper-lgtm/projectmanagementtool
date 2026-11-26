import { useEffect, useRef, useState } from "react";
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Calendar filter: ‹ [📅 26 Nov 2026 ▾] ›
 * Popover shows a date-wise month calendar. Pick a date to filter that day, or
 * "Whole month" for the full month. Clicking the month title switches to a
 * 12-month grid for quick jumps.
 *
 * Props:
 *  - year, month (1-12) — or "all"
 *  - day: 1-31 or null (null = whole month)
 *  - onChange(year, month, day) — day null for whole month; ("all", "all", null) for all months
 *  - allowAll: show "All months" (default true)
 */
export default function CalendarFilterPicker({ year, month, day = null, onChange, allowAll = true }) {
  const now = new Date();
  const isAll = month === "all" || year === "all" || !month || !year;
  const selYear = isAll ? now.getFullYear() : Number(year);
  const selMonth = isAll ? now.getMonth() + 1 : Number(month);
  const selDay = isAll ? null : day ? Number(day) : null;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("days"); // "days" | "months"
  const [view, setView] = useState({ y: selYear, m: selMonth }); // month shown in the popover
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setView({ y: selYear, m: selMonth });
      setMode("days");
    }
    setOpen((o) => !o);
  };

  // Outer arrows: step a day when a date is selected, otherwise a month
  const step = (delta) => {
    if (selDay) {
      const d = new Date(selYear, selMonth - 1, selDay + delta);
      onChange(d.getFullYear(), d.getMonth() + 1, d.getDate());
    } else {
      const d = new Date(selYear, selMonth - 1 + delta, 1);
      onChange(d.getFullYear(), d.getMonth() + 1, null);
    }
  };

  const shiftView = (delta) => {
    if (mode === "months") {
      setView((v) => ({ ...v, y: v.y + delta }));
    } else {
      const d = new Date(view.y, view.m - 1 + delta, 1);
      setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
    }
  };

  const choose = (y, m, d) => {
    onChange(y, m, d);
    setOpen(false);
  };

  // Day grid for the viewed month (leading blanks keep weekdays aligned; no other-month dates)
  const firstDow = new Date(view.y, view.m - 1, 1).getDay();
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const label = isAll
    ? "All months"
    : selDay
      ? `${selDay} ${MONTHS_SHORT[selMonth - 1]} ${selYear}`
      : `${MONTHS_SHORT[selMonth - 1]} ${selYear}`;

  const outerNav =
    "w-7 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors cursor-pointer";
  const innerNav =
    "w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[#182338] cursor-pointer";

  return (
    <div ref={ref} className={`relative shrink-0 ${open ? "z-50" : "z-10"}`}>
      <div className="inline-flex items-center h-8 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => step(-1)}
          className={outerNav}
          title={selDay ? "Previous day" : "Previous month"}
          aria-label={selDay ? "Previous day" : "Previous month"}
        >
          <FiChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-2 min-w-[118px] text-xs font-bold text-blue-700 dark:text-blue-300 border-x border-blue-200 dark:border-blue-800/70 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
          title="Pick a date or month"
        >
          <FiCalendar size={12} />
          <span className="whitespace-nowrap">{label}</span>
          <FiChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          className={outerNav}
          title={selDay ? "Next day" : "Next month"}
          aria-label={selDay ? "Next day" : "Next month"}
        >
          <FiChevronRight size={14} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 mt-1.5 w-72 p-3 rounded-2xl bg-white dark:bg-[#0f1729] border border-slate-200 dark:border-white/10 shadow-xl"
        >
          {/* Header: ‹ November 2026 › (click title → month grid) */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shiftView(-1)} className={innerNav} aria-label="Previous">
              <FiChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setMode((md) => (md === "days" ? "months" : "days"))}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-black text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#182338] cursor-pointer"
              title={mode === "days" ? "Choose another month" : "Back to dates"}
            >
              {mode === "days" ? `${MONTHS_LONG[view.m - 1]} ${view.y}` : view.y}
              <FiChevronDown size={12} className={`text-slate-400 transition-transform ${mode === "months" ? "rotate-180" : ""}`} />
            </button>
            <button type="button" onClick={() => shiftView(1)} className={innerNav} aria-label="Next">
              <FiChevronRight size={14} />
            </button>
          </div>

          {mode === "days" ? (
            <>
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 py-1">
                    {w.slice(0, 2)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <div key={`b${i}`} aria-hidden="true" />;
                  const isSelected = !isAll && selDay === d && selMonth === view.m && selYear === view.y;
                  const isToday =
                    d === now.getDate() && view.m === now.getMonth() + 1 && view.y === now.getFullYear();
                  const dow = (firstDow + d - 1) % 7;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => choose(view.y, view.m, d)}
                      aria-pressed={isSelected}
                      aria-label={`${d} ${MONTHS_LONG[view.m - 1]} ${view.y}`}
                      className={`h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : isToday
                            ? "border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100"
                            : `border-transparent hover:bg-slate-100 dark:hover:bg-[#182338] ${
                                dow === 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"
                              }`
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_SHORT.map((name, i) => {
                const m = i + 1;
                const isViewed = view.m === m;
                const isCurrent = view.y === now.getFullYear() && i === now.getMonth();
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setView({ y: view.y, m });
                      setMode("days");
                    }}
                    className={`relative h-9 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      isViewed
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#182338]"
                    }`}
                  >
                    {name}
                    {isCurrent && !isViewed && (
                      <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Shortcuts */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => choose(view.y, view.m, null)}
              className={`text-xs font-bold cursor-pointer hover:underline ${
                !isAll && !selDay && selMonth === view.m && selYear === view.y
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              title={`All of ${MONTHS_LONG[view.m - 1]} ${view.y}`}
            >
              Whole month
            </button>
            <button
              type="button"
              onClick={() => choose(now.getFullYear(), now.getMonth() + 1, now.getDate())}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Today
            </button>
            {allowAll && (
              <button
                type="button"
                onClick={() => choose("all", "all", null)}
                className={`text-xs font-bold cursor-pointer hover:underline ${
                  isAll ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                All months
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
