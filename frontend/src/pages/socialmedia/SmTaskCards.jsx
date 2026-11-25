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
  FiAlertTriangle,
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

// Circular "+N" badge shown when published exceeds committed
const EXTRA_BADGE_CLASS = "bg-red-600 ring-red-200 dark:ring-red-900 text-white animate-pulse";

const PublishedCount = ({ published = 0, committed = 0, theme, textClass }) => {
  const extra = Math.max(0, published - committed);
  return (
    <div className="text-right shrink-0">
      <div className="flex items-center justify-end gap-1.5">
        {extra > 0 && (
          <span
            title={`${extra} extra published beyond commitment`}
            className={`inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full ring-2 text-[11px] font-black leading-none shadow-sm ${EXTRA_BADGE_CLASS}`}
          >
            +{extra}
          </span>
        )}
        <span className={`text-base sm:text-lg font-black block leading-none ${textClass}`}>
          {published}
        </span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-1 whitespace-nowrap">
        published
      </span>
    </div>
  );
};

// Warning strip shown when published exceeds committed
const ExtraWarning = ({ published = 0, committed = 0, singular, plural }) => {
  const extra = Math.max(0, published - committed);
  if (extra <= 0) return null;
  return (
    <div
      role="alert"
      title={`${published} published vs ${committed} committed`}
      className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg bg-red-600 border border-red-700 text-white text-[11px] font-bold shadow-sm shadow-red-500/40 animate-pulse"
    >
      <FiAlertTriangle size={12} className="shrink-0" />
      <span className="truncate">
        +{extra} extra {extra === 1 ? singular : plural}
      </span>
    </div>
  );
};

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
  className = "",
}) => {
  const monthName = MONTH_NAMES[selectedMonth - 1] || "";

  return (
    <div className={`rounded-2xl shadow-xs space-y-4 ${className}`}>
      {/* Section Header: Title, Subtitle, Overall Deliverables summary & Client Modal Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-[#1e2a40]">
        <div className="flex items-center gap-3">

          <div>
            <div className="flex items-center gap-2 flex-wrap">
             
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
      {/* Mobile Swipe Hint */}
      <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-400 font-medium px-1">
        <span>Commitments summary</span>
        <span className="text-indigo-500 dark:text-indigo-400 font-semibold text-[10.5px]">Swipe cards →</span>
      </div>

      {/* 5-Card Metrics Carousel on Mobile / Grid on Desktop */}
      <div className="flex overflow-x-auto snap-x scrollbar-none pb-2 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:overflow-visible">
        {/* Card 1: Posts Progress Card (Emerald Theme) */}
        <div className="min-w-[270px] sm:min-w-0 flex-1 shrink-0 snap-start group relative bg-emerald-50/70 dark:bg-[#0c1a17] border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600 p-3.5 rounded-3xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden min-h-[128px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/90 dark:border-emerald-800/80 shrink-0 shadow-2xs">
                <FiImage size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none block truncate">
                  {commitmentOverview?.totalPostsCommitted || 0} Posts
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-1 whitespace-nowrap">committed</span>
              </div>
            </div>
            <PublishedCount
              published={commitmentOverview?.totalPostsPublished || 0}
              committed={commitmentOverview?.totalPostsCommitted || 0}
              theme="emerald"
              textClass="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <ExtraWarning
                published={commitmentOverview?.totalPostsPublished || 0}
                committed={commitmentOverview?.totalPostsCommitted || 0}
                singular="post"
                plural="posts"
              />
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {commitmentOverview?.postsProgressPct || 0}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-emerald-100/80 dark:bg-[#132823] rounded-full overflow-hidden border border-emerald-200/50 dark:border-emerald-900/60">
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
                className="h-[62px] sm:h-[68px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Reels Progress Card (Purple Theme) */}
        <div className="min-w-[270px] sm:min-w-0 flex-1 shrink-0 snap-start group relative bg-purple-50/70 dark:bg-[#150d24] border border-purple-200/80 dark:border-purple-800/60 hover:border-purple-400 dark:hover:border-purple-600 p-3.5 rounded-3xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden min-h-[128px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100/90 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/90 dark:border-purple-800/80 shrink-0 shadow-2xs">
                <FiPlay size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none block truncate">
                  {commitmentOverview?.totalReelsCommitted || 0} Reels
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-1 whitespace-nowrap">committed</span>
              </div>
            </div>
            <PublishedCount
              published={commitmentOverview?.totalReelsPublished || 0}
              committed={commitmentOverview?.totalReelsCommitted || 0}
              theme="purple"
              textClass="text-purple-600 dark:text-purple-400"
            />
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <ExtraWarning
                published={commitmentOverview?.totalReelsPublished || 0}
                committed={commitmentOverview?.totalReelsCommitted || 0}
                singular="reel"
                plural="reels"
              />
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {commitmentOverview?.reelsProgressPct || 0}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-purple-100/80 dark:bg-[#201538] rounded-full overflow-hidden border border-purple-200/50 dark:border-purple-900/60">
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
                className="h-[62px] sm:h-[68px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Stories Progress Card (Amber Theme) */}
        <div className="min-w-[270px] sm:min-w-0 flex-1 shrink-0 snap-start group relative bg-amber-50/70 dark:bg-[#1a140b] border border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 p-3.5 rounded-3xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden min-h-[128px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100/90 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/90 dark:border-amber-800/80 shrink-0 shadow-2xs">
                <FiZap size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none block truncate">
                  {commitmentOverview?.totalStoriesCommitted || 0} Stories
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-1 whitespace-nowrap">committed</span>
              </div>
            </div>
            <PublishedCount
              published={commitmentOverview?.totalStoriesPublished || 0}
              committed={commitmentOverview?.totalStoriesCommitted || 0}
              theme="amber"
              textClass="text-amber-500 dark:text-amber-400"
            />
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <ExtraWarning
                published={commitmentOverview?.totalStoriesPublished || 0}
                committed={commitmentOverview?.totalStoriesCommitted || 0}
                singular="story"
                plural="stories"
              />
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {commitmentOverview?.storiesProgressPct || 0}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-amber-100/80 dark:bg-[#291f10] rounded-full overflow-hidden border border-amber-200/50 dark:border-amber-900/60">
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
                className="h-[62px] sm:h-[68px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 4: At Risk Card (Rose Theme - Interactive Filter Toggle) */}
        <div
          onClick={() => {
            if (setAtRiskOnly) setAtRiskOnly((prev) => !prev);
          }}
          title={atRiskOnly ? "Click to clear At risk filter" : "Click to view only At risk tasks"}
          className={`min-w-[270px] sm:min-w-0 flex-1 shrink-0 snap-start group relative border p-3.5 rounded-3xl flex flex-col justify-between transition-all duration-300 cursor-pointer select-none overflow-hidden min-h-[128px] ${
            atRiskOnly
              ? "bg-rose-100/90 dark:bg-[#2c101b] border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/40 shadow-md"
              : "bg-rose-50/70 dark:bg-[#1f0d14] border-rose-200/80 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-600 shadow-xs hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100/90 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/90 dark:border-rose-800/80 shrink-0 shadow-2xs">
                <FiAlertCircle size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 leading-none block truncate">
                  {commitmentOverview?.atRiskCount || 0} At risk
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-1 whitespace-nowrap">due &le; 24h</span>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 transition-colors shadow-2xs ${
                atRiskOnly
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-100/90 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/90 dark:border-rose-800/70"
              }`}
            >
              {atRiskOnly ? "Active" : "Action"}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/60 flex items-center gap-1.5 text-[13px] font-bold text-rose-600 dark:text-rose-400">
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
                className="h-[62px] sm:h-[68px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Awaiting Approval Card (Warm Amber Theme - Interactive Status Filter Toggle) */}
        <div
          onClick={() => {
            if (setSelectedStatus) {
              setSelectedStatus((prev) => (prev === "In QC" || prev === "QC" ? "All" : "In QC"));
            }
            if (setCurrentPage) setCurrentPage(1);
          }}
          title={selectedStatus === "In QC" || selectedStatus === "QC" ? "Click to clear In QC filter" : "Click to view In QC tasks"}
          className={`min-w-[270px] sm:min-w-0 flex-1 shrink-0 snap-start group relative border p-3.5 rounded-3xl flex flex-col justify-between transition-all duration-300 cursor-pointer select-none overflow-hidden min-h-[128px] ${
            selectedStatus === "In QC" || selectedStatus === "QC"
              ? "bg-amber-100/90 dark:bg-[#291f10] border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40 shadow-md"
              : "bg-amber-50/70 dark:bg-[#1a140b] border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100/90 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/90 dark:border-amber-800/80 shrink-0 shadow-2xs">
                <FiClock size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 leading-none block truncate">
                  {commitmentOverview?.awaitingApprovalCount || 0} In QC
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-1 whitespace-nowrap">awaiting approval</span>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 transition-colors shadow-2xs ${
                selectedStatus === "In QC" || selectedStatus === "QC"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-100/90 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/70"
              }`}
            >
              {selectedStatus === "In QC" || selectedStatus === "QC" ? "Active" : "Review"}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2 pt-1">
            <div className="flex-1 min-w-0 pb-1">
              <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 flex items-center gap-1.5 text-[13px] font-bold text-amber-600 dark:text-amber-400">
                <span>{selectedStatus === "In QC" || selectedStatus === "QC" ? "Clear filter" : "Filter In QC"}</span>
                <FiArrowRight
                  size={13}
                  className={`transition-transform duration-200 ${
                    selectedStatus === "In QC" || selectedStatus === "QC" ? "rotate-180" : "group-hover:translate-x-1"
                  }`}
                />
              </div>
            </div>
            <div className="shrink-0 -mr-1 -mb-2 flex items-end">
              <img
                src={qcImg}
                alt="In QC Mascot"
                className="h-[62px] sm:h-[68px] w-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SmTaskCards);
