import React from "react";
import {
  FiCalendar,
  FiBarChart2,
  FiImage,
  FiPlay,
  FiZap,
  FiAlertCircle,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";
import postImg from "../../assets/post.png";
import reelsImg from "../../assets/reels.png";
import storyImg from "../../assets/story.png";
import riskImg from "../../assets/risk.png";
import qcImg from "../../assets/qc.png";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SmTaskCards = ({
  selectedClient = "All",
  selectedMonth,
  selectedYear,
  hasActiveFilters = false,
  commitmentOverview = {
    totalDeliverablesPublished: 0,
    totalDeliverablesCommitted: 0,
    deliverablesProgressPct: 0,
    totalPostsCommitted: 0,
    totalPostsPublished: 0,
    postsProgressPct: 0,
    totalReelsCommitted: 0,
    totalReelsPublished: 0,
    reelsProgressPct: 0,
    totalStoriesCommitted: 0,
    totalStoriesPublished: 0,
    storiesProgressPct: 0,
    atRiskCount: 0,
    awaitingApprovalCount: 0,
  },
  onOpenPendingCommitment,
  atRiskOnly,
  setAtRiskOnly,
  selectedStatus,
  setSelectedStatus,
  setCurrentPage,
}) => {
  const monthName = MONTH_NAMES[selectedMonth - 1] || "";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Section Header: Title, Subtitle, Overall Deliverables summary & Client Modal Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40 shrink-0">
            <FiCalendar size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {selectedClient !== "All"
                  ? `${selectedClient} Commitments`
                  : `${monthName} Commitments`}
              </h3>
              {selectedClient !== "All" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Filtered by Client
                </span>
              )}
              {hasActiveFilters && selectedClient === "All" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Filtered View
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {selectedClient !== "All"
                ? `Tracking deliverables for ${selectedClient} • ${monthName} ${selectedYear}`
                : `Track your deliverables across clients • ${monthName} ${selectedYear}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Deliverables summary badge */}
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-slate-400 font-medium">Deliverables:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {commitmentOverview?.totalDeliverablesPublished || 0}
            </span>
            <span>/</span>
            <span>{commitmentOverview?.totalDeliverablesCommitted || 0}</span>
            <span className="text-slate-400 font-normal">
              ({commitmentOverview?.deliverablesProgressPct || 0}%)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenPendingCommitment) onOpenPendingCommitment();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
          >
            <FiBarChart2 size={14} className="text-indigo-500" />
            <span>View by client</span>
          </button>
        </div>
      </div>

      {/* 5-Card Metrics Grid: Posts, Reels, Stories, At Risk, Awaiting Approval */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Card 1: Posts Progress Card */}
        <div className="group relative bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700/60 p-4 rounded-3xl flex flex-col justify-between shadow-[0_2px_12px_-4px_rgba(16,185,129,0.06)] hover:shadow-md transition-all duration-300 overflow-hidden min-h-[148px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40 shrink-0">
                <FiImage size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-[17px] font-black text-slate-900 dark:text-white leading-none block truncate">
                  {commitmentOverview?.totalPostsCommitted || 0} Posts
                </span>
                <span className="text-[11px] text-slate-400 block font-medium mt-1">committed</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 block leading-none">
                {commitmentOverview?.totalPostsPublished || 0}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium mt-1">published</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {commitmentOverview?.postsProgressPct || 0}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, commitmentOverview?.postsProgressPct || 0)}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 -mr-1 -mb-2 flex items-end">
              <img
                src={postImg}
                alt="Posts Mascot"
                className="h-[74px] sm:h-[80px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Reels Progress Card */}
        <div className="group relative bg-white dark:bg-slate-900 border border-purple-100/90 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700/60 p-4 rounded-3xl flex flex-col justify-between shadow-[0_2px_12px_-4px_rgba(168,85,247,0.06)] hover:shadow-md transition-all duration-300 overflow-hidden min-h-[148px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/40 shrink-0">
                <FiPlay size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-[17px] font-black text-slate-900 dark:text-white leading-none block truncate">
                  {commitmentOverview?.totalReelsCommitted || 0} Reels
                </span>
                <span className="text-[11px] text-slate-400 block font-medium mt-1">committed</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 block leading-none">
                {commitmentOverview?.totalReelsPublished || 0}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium mt-1">published</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {commitmentOverview?.reelsProgressPct || 0}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, commitmentOverview?.reelsProgressPct || 0)}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 -mr-1 -mb-2 flex items-end">
              <img
                src={reelsImg}
                alt="Reels Mascot"
                className="h-[74px] sm:h-[80px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Stories Progress Card */}
        <div className="group relative bg-white dark:bg-slate-900 border border-amber-100/90 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700/60 p-4 rounded-3xl flex flex-col justify-between shadow-[0_2px_12px_-4px_rgba(245,158,11,0.06)] hover:shadow-md transition-all duration-300 overflow-hidden min-h-[148px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/40 shrink-0">
                <FiZap size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-[17px] font-black text-slate-900 dark:text-white leading-none block truncate">
                  {commitmentOverview?.totalStoriesCommitted || 0} Stories
                </span>
                <span className="text-[11px] text-slate-400 block font-medium mt-1">committed</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm sm:text-base font-black text-amber-500 dark:text-amber-400 block leading-none">
                {commitmentOverview?.totalStoriesPublished || 0}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium mt-1">published</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {commitmentOverview?.storiesProgressPct || 0}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, commitmentOverview?.storiesProgressPct || 0)}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 -mr-1 -mb-2 flex items-end">
              <img
                src={storyImg}
                alt="Stories Mascot"
                className="h-[74px] sm:h-[80px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 4: At Risk Card (Interactive Filter Toggle) */}
        <div
          onClick={() => {
            if (setAtRiskOnly) setAtRiskOnly((prev) => !prev);
          }}
          title={atRiskOnly ? "Click to clear At risk filter" : "Click to view only At risk tasks"}
          className={`group relative bg-white dark:bg-slate-900 border p-4 rounded-3xl flex flex-col justify-between transition-all duration-300 cursor-pointer select-none overflow-hidden min-h-[148px] ${
            atRiskOnly
              ? "border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/30 bg-rose-50/20 shadow-md"
              : "border-rose-100/90 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-700/60 shadow-[0_2px_12px_-4px_rgba(244,63,94,0.06)] hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-800/40 shrink-0">
                <FiAlertCircle size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-[17px] font-black text-rose-600 dark:text-rose-400 leading-none block truncate">
                  {commitmentOverview?.atRiskCount || 0} At risk
                </span>
                <span className="text-[11px] text-slate-400 block font-medium mt-1">due &le; 24h</span>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 transition-colors ${
                atRiskOnly
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60"
              }`}
            >
              {atRiskOnly ? "Active" : "Action"}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="pt-2 border-t border-rose-100/80 dark:border-rose-900/40 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <span>{atRiskOnly ? "Clear filter" : "Filter at-risk"}</span>
                <FiArrowRight
                  size={13}
                  className={`transition-transform duration-200 ${
                    atRiskOnly ? "rotate-180" : "group-hover:translate-x-1"
                  }`}
                />
              </div>
            </div>
            <div className="shrink-0 -mr-1 -mb-2 flex items-end">
              <img
                src={riskImg}
                alt="At risk Mascot"
                className="h-[74px] sm:h-[80px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Awaiting Approval Card (Interactive Status Filter Toggle) */}
        <div
          onClick={() => {
            if (setSelectedStatus) {
              setSelectedStatus((prev) => (prev === "In QC" ? "All" : "In QC"));
            }
            if (setCurrentPage) setCurrentPage(1);
          }}
          title={selectedStatus === "In QC" ? "Click to clear In QC filter" : "Click to view In QC tasks"}
          className={`group relative bg-white dark:bg-slate-900 border p-4 rounded-3xl flex flex-col justify-between transition-all duration-300 cursor-pointer select-none overflow-hidden min-h-[148px] ${
            selectedStatus === "In QC"
              ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 bg-amber-50/20 shadow-md"
              : "border-amber-100/90 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700/60 shadow-[0_2px_12px_-4px_rgba(245,158,11,0.06)] hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/40 shrink-0">
                <FiClock size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-[17px] font-black text-amber-600 dark:text-amber-400 leading-none block truncate">
                  {commitmentOverview?.awaitingApprovalCount || 0} In QC
                </span>
                <span className="text-[11px] text-slate-400 block font-medium mt-1">awaiting approval</span>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 transition-colors ${
                selectedStatus === "In QC"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60"
              }`}
            >
              {selectedStatus === "In QC" ? "Active" : "Review"}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="pt-2 border-t border-amber-100/80 dark:border-amber-900/40 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>{selectedStatus === "In QC" ? "Clear filter" : "Filter In QC"}</span>
                <FiArrowRight
                  size={13}
                  className={`transition-transform duration-200 ${
                    selectedStatus === "In QC" ? "rotate-180" : "group-hover:translate-x-1"
                  }`}
                />
              </div>
            </div>
            <div className="shrink-0 -mr-1 -mb-2 flex items-end">
              <img
                src={qcImg}
                alt="In QC Mascot"
                className="h-[74px] sm:h-[80px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmTaskCards;
