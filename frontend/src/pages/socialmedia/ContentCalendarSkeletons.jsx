import { memo } from "react";

// Skeleton placeholders for the Content Calendar. They mirror the real layouts
// (same grid, paddings and min-heights) so nothing jumps when data arrives.
// The shimmer comes from the `.skel` class in index.css.

const Bar = ({ className = "" }) => <div className={`skel ${className}`} />;

// Deterministic "random" widths so the skeleton looks natural but never flickers between renders
const pick = (i, options) => options[i % options.length];

export const MetricCardsSkeleton = memo(function MetricCardsSkeleton() {
  return (
    <div aria-hidden="true" className="flex overflow-x-auto scrollbar-none pb-2 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:overflow-visible">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[270px] sm:min-w-0 flex-1 shrink-0 p-3.5 rounded-3xl border border-slate-200/80 dark:border-[#1e2a40] bg-white dark:bg-[#0b101d] min-h-[128px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Bar className="w-9 h-9 rounded-xl" />
              <div className="space-y-2">
                <Bar className="h-4 w-20" />
                <Bar className="h-3 w-14 skel-soft" />
              </div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <Bar className="h-5 w-8" />
              <Bar className="h-3 w-12 skel-soft" />
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <Bar className="h-2 w-full rounded-full skel-soft" />
            <Bar className="h-3 w-2/3 skel-soft" />
          </div>
        </div>
      ))}
    </div>
  );
});

// Month grid: header row is real (rendered by the page); this fills the 7×N day cells.
export const MonthGridSkeleton = memo(function MonthGridSkeleton({ cells = 35 }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-[#1a2438] border-b border-slate-200 dark:border-[#1e2a40]"
    >
      {Array.from({ length: cells }).map((_, i) => {
        const posts = pick(i, [2, 1, 3, 0, 2, 1, 0, 3, 1, 2]);
        return (
          <div key={i} className="min-h-[175px] sm:min-h-[195px] p-2.5 flex flex-col bg-white dark:bg-[#0b101d]">
            <div className="flex items-center justify-between mb-2.5">
              <Bar className="w-6 h-6 rounded-full" />
              {posts > 0 && <Bar className="w-8 h-3.5 skel-soft" />}
            </div>
            <div className="space-y-2">
              {Array.from({ length: posts }).map((__, j) => (
                <div key={j} className="rounded-xl border border-slate-100 dark:border-[#1a2438] p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Bar className="h-3.5 w-10 rounded-md" />
                    <Bar className="h-3 w-8 skel-soft" />
                  </div>
                  <Bar className={`h-3 ${pick(i + j, ["w-full", "w-5/6", "w-4/5"])}`} />
                  <div className="flex items-center gap-1.5">
                    <Bar className="w-4 h-4 rounded-full skel-soft" />
                    <Bar className="h-2.5 w-14 skel-soft" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// Week view: 7 day columns with a few post cards each
export const WeekSkeleton = memo(function WeekSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-50 dark:bg-[#0b101d] p-3 rounded-xl border border-slate-200 dark:border-[#1e2a40] min-h-[220px] flex flex-col"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5 mb-2">
            <Bar className="h-3 w-8" />
            <Bar className="h-3 w-12 skel-soft" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: pick(i, [2, 3, 1, 2, 3, 1, 2]) }).map((__, j) => (
              <div key={j} className="rounded-lg bg-white dark:bg-[#0f1626] border border-slate-100 dark:border-[#1a2438] p-2 space-y-1.5">
                <Bar className="h-3.5 w-12 rounded-md" />
                <Bar className={`h-3 ${pick(i + j, ["w-full", "w-4/5", "w-11/12"])}`} />
                <Bar className="h-2.5 w-16 skel-soft" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

// List view rows
export const ListSkeleton = memo(function ListSkeleton({ rows = 6, showCheckbox = false }) {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#1e2a40] border-l-4 border-l-slate-200 dark:border-l-[#22314d] flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {showCheckbox && <Bar className="w-4 h-4 rounded shrink-0" />}
            <div className="w-14 shrink-0 flex flex-col items-center gap-1.5">
              <Bar className="h-3.5 w-11" />
              <Bar className="h-2.5 w-9 skel-soft" />
            </div>
            <div className="space-y-2 min-w-0 flex-1">
              <Bar className={`h-3.5 ${pick(i, ["w-2/3", "w-1/2", "w-3/5"])}`} />
              <div className="flex items-center gap-2">
                <Bar className="h-3 w-20 skel-soft" />
                <Bar className="h-4 w-12 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Bar className="w-6 h-6 rounded-full" />
            <Bar className="h-3 w-16 skel-soft" />
            <Bar className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
});

// Inline text placeholder (e.g. "Showing N posts · M clients")
export const InlineTextSkeleton = ({ className = "w-32" }) => (
  <span aria-hidden="true" className={`skel inline-block h-3 align-middle ${className}`} />
);
