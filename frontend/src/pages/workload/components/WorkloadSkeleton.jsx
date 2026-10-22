import React from "react";

// ==========================================
// WORKLOAD SKELETON LOADER - PREMIUM SHIMMER
// ==========================================

// Shimmer block reusable component
const Shimmer = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700/60 rounded-lg ${className}`}
    style={{ isolation: "isolate" }}
  >
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/8 to-transparent"
      style={{
        animation: "workload-shimmer 1.6s ease-in-out infinite",
        transform: "translateX(-100%)",
      }}
    />
  </div>
);

// Single table skeleton row
const TableSkeletonRow = ({ delay = 0 }) => (
  <div
    className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/60"
    style={{ opacity: 0, animation: `workload-fadein 0.4s ease forwards ${delay}ms` }}
  >
    {/* Avatar + Name */}
    <div className="flex items-center gap-3 w-[22%] min-w-[150px]">
      <Shimmer className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-4/5 rounded" />
        <Shimmer className="h-2.5 w-1/2 rounded" />
      </div>
    </div>
    {/* Status */}
    <div className="w-[20%] space-y-1.5">
      <Shimmer className="h-5 w-28 rounded-full" />
      <Shimmer className="h-2.5 w-36 rounded" />
    </div>
    {/* Capacity meter */}
    <div className="w-[25%] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Shimmer className="h-2.5 w-20 rounded" />
        <Shimmer className="h-2.5 w-8 rounded" />
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="flex-1 h-2.5 rounded-full" />
        ))}
      </div>
      <Shimmer className="h-4 w-20 rounded-md" />
    </div>
    {/* Tasks breakdown */}
    <div className="flex items-center gap-1.5 w-[22%]">
      <Shimmer className="h-5 w-20 rounded-lg" />
      <Shimmer className="h-5 w-16 rounded-lg" />
      <Shimmer className="h-5 w-20 rounded-lg" />
    </div>
    {/* Action */}
    <div className="ml-auto shrink-0">
      <Shimmer className="h-7 w-24 rounded-xl" />
    </div>
  </div>
);

// Single grid skeleton card
const GridSkeletonCard = ({ delay = 0 }) => (
  <div
    className="bg-white dark:bg-[#0f172a]/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    style={{ opacity: 0, animation: `workload-fadein 0.4s ease forwards ${delay}ms` }}
  >
    <div className="p-5 space-y-4">
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        <Shimmer className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-3/4 rounded" />
          <Shimmer className="h-3 w-1/2 rounded" />
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
      {/* Status banner */}
      <Shimmer className="h-8 w-full rounded-xl" />
      {/* Capacity meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="h-3 w-10 rounded" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="flex-1 h-3 rounded-full" />
          ))}
        </div>
      </div>
      {/* Stats chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Shimmer className="h-5 w-20 rounded-lg" />
        <Shimmer className="h-5 w-16 rounded-lg" />
        <Shimmer className="h-5 w-20 rounded-lg" />
      </div>
    </div>
    {/* Footer button */}
    <div className="px-5 pb-4">
      <Shimmer className="h-8 w-full rounded-xl" />
    </div>
  </div>
);

const WorkloadSkeleton = ({ viewMode = "table", count = 6 }) => {
  if (viewMode === "table") {
    return (
      <>
        <style>{`
          @keyframes workload-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes workload-fadein {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes workload-loadbar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
        <div className="bg-white dark:bg-[#0f172a]/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table header shimmer */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-[#131b2e]/90">
            <div className="flex items-center gap-8">
              <Shimmer className="h-3 w-24 rounded" />
              <Shimmer className="h-3 w-32 rounded" />
              <Shimmer className="h-3 w-20 rounded" />
              <Shimmer className="h-3 w-28 rounded" />
            </div>
            <Shimmer className="h-3 w-14 rounded" />
          </div>
          {/* Rows */}
          {Array.from({ length: count }).map((_, i) => (
            <TableSkeletonRow key={i} delay={i * 70} />
          ))}
          {/* Loading progress bar */}
          <div className="h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full w-1/3 bg-indigo-400/70 dark:bg-indigo-500/60 rounded-full"
              style={{ animation: "workload-loadbar 1.8s ease-in-out infinite" }}
            />
          </div>
        </div>
      </>
    );
  }

  if (viewMode === "slider") {
    return (
      <>
        <style>{`
          @keyframes workload-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes workload-fadein {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes workload-loadbar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
        <div className="space-y-4">
          {/* Header shimmer */}
          <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shimmer className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <Shimmer className="h-4 w-44 rounded" />
                <Shimmer className="h-2.5 w-64 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shimmer className="h-8 w-28 rounded-xl" />
              <Shimmer className="h-8 w-16 rounded-xl" />
              <Shimmer className="h-8 w-8 rounded-xl" />
              <Shimmer className="h-8 w-8 rounded-xl" />
            </div>
          </div>

          {/* Slider track shimmer (single line) */}
          <div className="flex gap-5 overflow-hidden items-start py-2.5 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[360px] sm:w-[380px] shrink-0">
                <GridSkeletonCard delay={i * 70} />
              </div>
            ))}
          </div>

          {/* Bottom progress bar shimmer */}
          <div className="h-1.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full w-1/3 bg-indigo-400/70 dark:bg-indigo-500/60 rounded-full"
              style={{ animation: "workload-loadbar 1.8s ease-in-out infinite" }}
            />
          </div>
        </div>
      </>
    );
  }

  // Grid view skeleton
  return (
    <>
      <style>{`
        @keyframes workload-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes workload-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes workload-loadbar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full w-1/3 bg-indigo-400/70 dark:bg-indigo-500/60 rounded-full"
            style={{ animation: "workload-loadbar 1.8s ease-in-out infinite" }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {Array.from({ length: count }).map((_, i) => (
            <GridSkeletonCard key={i} delay={i * 70} />
          ))}
        </div>
      </div>
    </>
  );
};

export default WorkloadSkeleton;
