import { memo } from "react";

const Bar = ({ className = "" }) => <div className={`rounded-md bg-slate-200/80 dark:bg-white/10 ${className}`} />;

const SlotSkeleton = ({ lines }) => (
  <li className="flex gap-3 sm:gap-4">
    <div className="flex flex-col items-center shrink-0 w-7">
      <div className="w-0.5 h-4 bg-slate-200 dark:bg-white/10" />
      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="w-0.5 grow bg-slate-200 dark:bg-white/10" />
    </div>
    <div className="grow mb-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200/80 dark:bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Bar className="h-3 w-24" />
            <Bar className="h-3 w-16 rounded-full" />
          </div>
          <Bar className="h-4 w-2/3" />
        </div>
        <Bar className="h-8 w-26 rounded-xl" />
      </div>
      <div className="mt-4 sm:pl-12 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-slate-200/80 dark:bg-white/10" />
            <Bar className={`h-3 ${i % 2 ? "w-1/2" : "w-3/4"}`} />
          </div>
        ))}
      </div>
    </div>
  </li>
);

/** Placeholder layout shown until the day's schedule arrives from the server. */
const ScheduleSkeleton = () => (
  <div className="space-y-3 sm:space-y-4 animate-pulse" aria-busy="true" aria-label="Loading daily schedule">
    {/* Summary */}
    <div className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-21 h-21 rounded-full border-[7px] border-slate-200 dark:border-white/10" />
          <div className="space-y-2">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 min-w-18 h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex justify-between">
        <Bar className="h-4 w-48" />
        <Bar className="h-7 w-28 rounded-xl" />
      </div>
    </div>

    {/* Filters */}
    <div className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-2.5 flex justify-between gap-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bar key={i} className="h-7 w-16 rounded-xl" />
        ))}
      </div>
      <Bar className="hidden md:block h-7 w-64 rounded-xl" />
    </div>

    {/* Slots */}
    <ol>
      {[2, 3, 2, 3, 2].map((lines, i) => (
        <SlotSkeleton key={i} lines={lines} />
      ))}
    </ol>
  </div>
);

export const ExecutivePickerSkeleton = () => (
  <div className="bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-white/10 p-3 sm:p-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-white/10" />
      <div className="space-y-1.5">
        <Bar className="h-3 w-40" />
        <Bar className="h-2.5 w-28" />
      </div>
    </div>
    <div className="flex gap-2 overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="shrink-0 w-48 h-15 rounded-xl bg-slate-100 dark:bg-white/5" />
      ))}
    </div>
  </div>
);

export default memo(ScheduleSkeleton);
