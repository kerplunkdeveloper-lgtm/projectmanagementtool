import React from "react";

// =========================================================================
// GRAPHIC DESIGNER DASHBOARD SKELETON LOADER
// Premium smooth shimmer loading animation with dark mode support
// =========================================================================

const Shimmer = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden bg-slate-250/70 dark:bg-slate-800/80 rounded-lg ${className}`}
    style={{ isolation: "isolate" }}
  >
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"
      style={{
        animation: "dashboard-shimmer 1.5s ease-in-out infinite",
        transform: "translateX(-100%)",
      }}
    />
  </div>
);

export const GraphicDesignerDashboardSkeleton = ({
  targetDept = "Graphic Designer",
}) => {
  const metricCards = [
    {
      border: "border-blue-200/70 dark:border-blue-800/40",
      bg: "bg-blue-50/70 dark:bg-blue-950/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      border: "border-indigo-200/70 dark:border-indigo-800/40",
      bg: "bg-indigo-50/70 dark:bg-indigo-950/20",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    },
    {
      border: "border-teal-200/70 dark:border-teal-800/40",
      bg: "bg-teal-50/70 dark:bg-teal-950/20",
      iconBg: "bg-teal-100 dark:bg-teal-900/50",
    },
    {
      border: "border-sky-200/70 dark:border-sky-800/40",
      bg: "bg-sky-50/70 dark:bg-sky-950/20",
      iconBg: "bg-sky-100 dark:bg-sky-900/50",
    },
    {
      border: "border-fuchsia-200/70 dark:border-fuchsia-800/40",
      bg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/20",
      iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
    },
    {
      border: "border-amber-200/70 dark:border-amber-800/40",
      bg: "bg-amber-50/70 dark:bg-amber-950/20",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
    },
    {
      border: "border-emerald-200/70 dark:border-emerald-800/40",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      border: "border-rose-200/70 dark:border-rose-800/40",
      bg: "bg-rose-50/70 dark:bg-rose-950/20",
      iconBg: "bg-rose-100 dark:bg-rose-900/50",
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#0b1120] py-4 md:py-4 px-0 md:px-0 space-y-7 font-sans select-none transition-colors">
      <style>{`
        @keyframes dashboard-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes dashboard-pulse-glow {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 0.45; }
        }
      `}</style>

      {/* 1. Header & Date Controls Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/70 dark:bg-emerald-500/20 rounded-xl">
            <div className="w-5 h-5 rounded-md bg-emerald-500/30" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shimmer className="h-6 w-52 rounded-lg" />
              <Shimmer className="h-4 w-16 rounded-full" />
            </div>
            <Shimmer className="h-3 w-36 rounded" />
          </div>
        </div>

        {/* Date Filter & Navigator Group Skeleton */}
        <div className="flex items-center gap-2">
          <Shimmer className="h-9 w-20 rounded-xl" />
          <Shimmer className="h-9 w-36 rounded-xl" />
          <div className="flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <Shimmer className="h-9 w-9 rounded-none border-r border-slate-200 dark:border-slate-800" />
            <Shimmer className="h-9 w-9 rounded-none" />
          </div>
        </div>
      </div>

      {/* 2. 8 KPI Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-2">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl ${card.bg} border ${card.border} shadow-2xs flex flex-col justify-between h-[106px] relative overflow-hidden`}
          >
            <div className="flex items-center justify-between gap-1">
              <Shimmer className="h-3 w-14 rounded" />
              <div className={`w-6 h-6 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                <div className="w-3 h-3 rounded-full bg-slate-300/60 dark:bg-slate-600/60" />
              </div>
            </div>
            <div className="space-y-1.5 mt-auto">
              <Shimmer className="h-6 w-10 rounded-md" />
              <div className="flex items-center gap-1.5">
                <Shimmer className="h-2.5 w-12 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Team Daily Performance & Work Logs Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-xl">
        {/* Table Header / Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-indigo-500/30" />
            </div>
            <div className="space-y-1">
              <Shimmer className="h-4.5 w-64 rounded-md" />
              <Shimmer className="h-3 w-40 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Shimmer className="h-8 w-36 rounded-xl" />
            <Shimmer className="h-8 w-24 rounded-xl" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
            >
              {/* Designer Avatar & Details */}
              <div className="flex items-center gap-3 w-56 shrink-0">
                <div className="relative">
                  <Shimmer className="w-10 h-10 rounded-full shrink-0" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Shimmer className="h-3.5 w-28 rounded" />
                  <Shimmer className="h-2.5 w-20 rounded" />
                </div>
              </div>

              {/* Working Hours / Shift Pill */}
              <div className="hidden sm:flex items-center gap-2">
                <Shimmer className="h-6 w-28 rounded-lg" />
              </div>

              {/* Status Breakdown Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <Shimmer className="h-6 w-16 rounded-lg bg-teal-100/40 dark:bg-teal-950/30" />
                <Shimmer className="h-6 w-16 rounded-lg bg-sky-100/40 dark:bg-sky-950/30" />
                <Shimmer className="h-6 w-16 rounded-lg bg-amber-100/40 dark:bg-amber-950/30" />
                <Shimmer className="h-6 w-16 rounded-lg bg-emerald-100/40 dark:bg-emerald-950/30" />
              </div>

              {/* Progress Bar & Action Button */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-24 space-y-1 hidden lg:block">
                  <div className="flex justify-between">
                    <Shimmer className="h-2 w-8 rounded" />
                    <Shimmer className="h-2 w-6 rounded" />
                  </div>
                  <Shimmer className="h-1.5 w-full rounded-full" />
                </div>
                <Shimmer className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Daily Status Breakdown & Trend Analysis Skeletons (2 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Chart: Status Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-indigo-500/30" />
              <Shimmer className="h-4 w-40 rounded" />
            </div>
            <Shimmer className="h-6 w-20 rounded-lg" />
          </div>
          {/* Chart placeholder */}
          <div className="h-48 flex items-end justify-between gap-4 pt-6 px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            {[40, 75, 55, 90, 60, 30].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full max-w-[40px] bg-slate-200 dark:bg-slate-800 rounded-t-lg relative overflow-hidden"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
                    style={{
                      animation: "dashboard-shimmer 1.5s ease-in-out infinite",
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
                <Shimmer className="h-2.5 w-8 rounded" />
              </div>
            ))}
          </div>
          {/* Legend row */}
          <div className="flex items-center justify-center gap-4 flex-wrap pt-1">
            <Shimmer className="h-3 w-16 rounded-full" />
            <Shimmer className="h-3 w-16 rounded-full" />
            <Shimmer className="h-3 w-16 rounded-full" />
            <Shimmer className="h-3 w-16 rounded-full" />
          </div>
        </div>

        {/* Right Chart: Productivity Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
              <Shimmer className="h-4 w-44 rounded" />
            </div>
            <Shimmer className="h-7 w-32 rounded-xl" />
          </div>
          {/* Line chart curved wave placeholder */}
          <div className="h-48 flex items-center justify-center relative rounded-xl bg-slate-50/60 dark:bg-slate-950/30 overflow-hidden border border-slate-100 dark:border-slate-800/80">
            <svg
              className="w-full h-full text-slate-200 dark:text-slate-800"
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M0,100 C100,20 200,120 300,50 C400,0 450,80 500,40 L500,150 L0,150 Z"
                fill="currentColor"
                fillOpacity="0.35"
              />
              <path
                d="M0,100 C100,20 200,120 300,50 C400,0 450,80 500,40"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-xs border border-slate-200 dark:border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Loading metrics & trends...
                </span>
              </div>
            </div>
          </div>
          {/* Bottom stats row */}
          <div className="flex items-center justify-between pt-1">
            <Shimmer className="h-3 w-28 rounded" />
            <Shimmer className="h-3 w-20 rounded" />
          </div>
        </div>
      </div>

      {/* 5. Live Task Board Columns Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="h-4 w-32 rounded" />
            <Shimmer className="h-5 w-8 rounded-full" />
          </div>
          <Shimmer className="h-7 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {["Not Started", "In Progress", "In Review", "On Hold", "Completed"].map((title, colIdx) => (
            <div
              key={colIdx}
              className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400/50 dark:bg-slate-600" />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{title}</span>
                </div>
                <Shimmer className="h-4 w-6 rounded-full" />
              </div>

              <div className="space-y-2.5">
                {[1, 2].map((card) => (
                  <div
                    key={card}
                    className="p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <Shimmer className="h-3.5 w-14 rounded-md" />
                      <Shimmer className="h-3.5 w-12 rounded-full" />
                    </div>
                    <div className="space-y-1.5">
                      <Shimmer className="h-3.5 w-4/5 rounded" />
                      <Shimmer className="h-3 w-2/3 rounded" />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      <Shimmer className="h-3 w-16 rounded" />
                      <Shimmer className="w-6 h-6 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraphicDesignerDashboardSkeleton;

