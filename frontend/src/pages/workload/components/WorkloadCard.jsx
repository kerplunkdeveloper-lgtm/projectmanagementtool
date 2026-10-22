import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiPlay,
  FiPauseCircle,
  FiBriefcase,
  FiChevronUp,
  FiChevronDown,
  FiCalendar,
  FiEye,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import {
  formatMsToHoursMinutes,
  getPriorityBadgeClass,
  getStatusBadgeClass,
  getTaskClientInfo,
  getTaskCreatorInfo,
  getWorkTypeMeta,
} from "../utils/workloadUtils";

// ==========================================
// MEMOIZED WORKLOAD CARD COMPONENT (GRID VIEW)
// Enhanced readability, bold typography & crisp layout
// ==========================================
const WorkloadCard = React.memo(({
  workload,
  isExpanded,
  onToggleExpand,
  onViewTask,
  selectedDepartment,
  cardIndex,
}) => {
  const {
    user: member,
    isOnline,
    displayTasks,
    sortedDisplayTasks,
    activeTasks,
    pendingTasks,
    onHoldTasks,
    workedMs,
    maxCapacityTasks,
    totalActiveTasksCount,
    effectiveSlots,
    totalWorkloadSlots,
    taskUtilizationPercent,
    cardTheme,
    availability,
  } = workload;

  return (
    <div
      className={`${cardTheme.cardBg} ${cardTheme.cardBorder} ${cardTheme.cardRing} rounded-2xl border shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full relative`}
    >
      {/* Top Dynamic Ambient Indicator Bar */}
      <div
        className={`h-2 w-full transition-all duration-300 ${cardTheme.isOverloaded
            ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 animate-pulse"
            : totalActiveTasksCount >= maxCapacityTasks
              ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
              : totalActiveTasksCount >= 6
                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
                : "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
          }`}
      />

      <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        {/* Top: Avatar, Info & Online / Activity Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {member.profile?.profileImage?.url ? (
                <img
                  src={member.profile.profileImage.url}
                  alt={member.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white font-black text-sm flex items-center justify-center ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-xs uppercase">
                  {member.name ? member.name.substring(0, 2) : "TM"}
                </div>
              )}

              {/* Real-time Online Indicator with Live Pulse */}
              {isOnline ? (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </span>
              ) : (
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-400 dark:bg-slate-600"
                  title="Offline"
                />
              )}
            </div>

            <div className="min-w-0">
              <h3
                className="text-[15px] sm:text-base font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug"
                title={member.name}
              >
                {member.name}
              </h3>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {cardIndex != null && (
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 rounded-md border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
                    #{cardIndex}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 truncate">
                  <span>{selectedDepartment === "Cinematographer" ? "🎬" : "🎨"}</span>
                  <span className="truncate">
                    {member.department || (selectedDepartment === "Cinematographer" ? "Cinematographer" : "Graphic Designer")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Online / Activity & Productivity Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1e293b]/70 dark:text-slate-400 dark:border-slate-700/60"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-slate-500"
                  }`}
              />
              {isOnline ? "Online" : "Offline"}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${availability.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${availability.dotClass}`} />
              {availability.label}
            </span>

            {/* Tracked Time Today */}
            {workedMs > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60 shadow-2xs"
                title="Total Time Worked Today"
              >
                <FiClock size={11} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{formatMsToHoursMinutes(workedMs)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Active Task Live Strip (Expanded height for crisp, clear visibility) */}
        <div className="min-h-[56px] flex items-center">
          {activeTasks.length > 0 ? (
            <div className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/80 dark:from-emerald-950/50 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <FiPlay className="animate-pulse" size={13} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 leading-tight">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded">
                      Active Task
                    </span>
                    {(() => {
                      const clientInfo = getTaskClientInfo(activeTasks[0]);
                      if (!clientInfo.name) return null;
                      return (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: clientInfo.color || "#10b981" }} />
                          {clientInfo.name}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate block text-xs sm:text-[13px] mt-1 leading-snug" title={activeTasks[0]?.title}>
                    {activeTasks[0]?.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTask(activeTasks[0]);
                }}
                className="shrink-0 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer hover:scale-105"
                title="Quick View Task Details"
              >
                <FiEye size={13} />
              </button>
            </div>
          ) : onHoldTasks.length > 0 ? (
            <div className="w-full px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-2.5 text-amber-800 dark:text-amber-200 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FiPauseCircle size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block leading-tight">
                    On Hold / Paused
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate block text-xs sm:text-[13px] mt-1 leading-snug" title={onHoldTasks[0]?.title}>
                    {onHoldTasks[0]?.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTask(onHoldTasks[0]);
                }}
                className="shrink-0 p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer hover:scale-105"
                title="View Paused Task"
              >
                <FiEye size={13} />
              </button>
            </div>
          ) : (
            <div className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a2234]/70 border border-slate-200 dark:border-slate-800/90 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <LuSparkles size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block leading-tight">
                  Ready For Work
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  0 active tasks • Open for new assignments
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Capacity Box */}
        <div className={`${cardTheme.meterBg} p-3 rounded-xl border space-y-2.5 transition-colors shadow-2xs`}>
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FiBriefcase className={cardTheme.isOverloaded ? "text-rose-500" : "text-indigo-600 dark:text-indigo-400"} size={14} />
              Workload Capacity (Max {maxCapacityTasks})
            </span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-black bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 ${cardTheme.capacityTextColor}`}>
              {effectiveSlots || totalActiveTasksCount} / {maxCapacityTasks} ({taskUtilizationPercent}%)
            </span>
          </div>

          {/* 8-Slot Visual Segmented Bar */}
          <div className="grid grid-cols-8 gap-1.5 py-0.5">
            {Array.from({ length: maxCapacityTasks }).map((_, index) => {
              const isFilled = index < Math.round(effectiveSlots || totalActiveTasksCount);
              return (
                <div
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-300 relative group/slot ${isFilled
                      ? `${cardTheme.slotFilledColor} shadow-xs ring-1 ring-white/20`
                      : "bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60"
                    }`}
                  title={`Slot ${index + 1}: ${isFilled ? "Occupied" : "Free"}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5 gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${cardTheme.badgeBg} shadow-2xs`}>
              {cardTheme.statusTag}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {cardTheme.isOverloaded
                ? `Exceeded by ${totalActiveTasksCount - maxCapacityTasks}`
                : `${Math.max(0, maxCapacityTasks - totalActiveTasksCount)} slot${maxCapacityTasks - totalActiveTasksCount === 1 ? "" : "s"} open`}
            </span>
          </div>
        </div>

        {/* 3-Column Task Counters with Large, Clear Numbers */}
        <div className="grid grid-cols-3 gap-2.5 pt-0.5">
          <div className="bg-emerald-50/90 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-center hover:scale-[1.02] transition-transform duration-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
              <FiPlay size={10} className="shrink-0" />
              <span>In Progress</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
              {activeTasks.length}
            </div>
          </div>

          <div className="bg-amber-50/90 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 text-center hover:scale-[1.02] transition-transform duration-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              <FiPauseCircle size={10} className="shrink-0" />
              <span>On Hold</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">
              {onHoldTasks.length}
            </div>
          </div>

          <div className="bg-slate-100/90 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center hover:scale-[1.02] transition-transform duration-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              <FiClock size={10} className="shrink-0" />
              <span>Not Started</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {pendingTasks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Expand Assigned Tasks Toggle */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0a0f1d]/70 p-3 px-4">
        <button
          onClick={() => onToggleExpand(member._id)}
          className="w-full flex items-center justify-between text-xs sm:text-[13px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors py-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FiBriefcase size={14} />
            <span>{isExpanded ? "Hide Assigned Tasks" : "View Assigned Tasks"}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {displayTasks.length}
            </span>
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </div>
        </button>

        {/* Expanded Task List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto space-y-2.5 pr-1"
            >
              {sortedDisplayTasks.length === 0 ? (
                <div className="py-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 italic">
                  No active tasks (In Progress, On Hold, or Not Started) assigned.
                </div>
              ) : (
                sortedDisplayTasks.map((task) => {
                  const clientInfo = getTaskClientInfo(task);
                  return (
                    <div
                      key={task._id}
                      className="bg-white dark:bg-[#111827] rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors shadow-2xs group/task"
                    >
                      {/* Top Bar: Client & Priority & Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Client Badge */}
                        {clientInfo.name ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-[150px] truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: clientInfo.color || "#6366f1" }}
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {clientInfo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            General Task
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          {task.workType && (() => {
                            const wtMeta = getWorkTypeMeta(task.workType);
                            return wtMeta ? (
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${wtMeta.badgeClass}`} title={`${wtMeta.label} (${wtMeta.avgTime})`}>
                                {wtMeta.icon} {wtMeta.label}
                              </span>
                            ) : null;
                          })()}
                          {task.priority && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getPriorityBadgeClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>

                      {/* Task Name & Quick View */}
                      <div className="flex items-start justify-between gap-2.5">
                        <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] leading-snug group-hover/task:text-indigo-600 dark:group-hover/task:text-indigo-400 transition-colors">
                          {task.title}
                        </h5>
                        <button
                          type="button"
                          onClick={() => onViewTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 shrink-0 cursor-pointer transition-colors"
                          title="View Task Details"
                        >
                          <FiEye size={14} />
                        </button>
                      </div>

                      {/* Bottom Info: Assigned Date, Creator & Productivity */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {task.assignedDateFormatted ? (
                            <span className="flex items-center gap-1 font-semibold whitespace-nowrap">
                              <FiCalendar size={12} className="text-indigo-500 shrink-0" />
                              <span>
                                Assigned: <strong className="text-slate-800 dark:text-slate-100">{task.assignedDateFormatted}</strong>
                              </span>
                            </span>
                          ) : null}

                          {/* Task Creator Name & Profile Image */}
                          {(() => {
                            const creator = task.creatorInfo || getTaskCreatorInfo(task);
                            if (!creator?.name) return null;
                            return (
                              <div
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 shadow-2xs max-w-[150px] truncate"
                                title={`Created by: ${creator.name}`}
                              >
                                <div className="relative shrink-0 w-4 h-4">
                                  {creator.avatarUrl ? (
                                    <img
                                      src={creator.avatarUrl}
                                      alt={creator.name}
                                      className="w-4 h-4 rounded-full object-cover border border-purple-300 dark:border-purple-700 shadow-2xs"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const fallback = e.currentTarget.parentElement?.querySelector(".creator-avatar-fallback");
                                        if (fallback) fallback.style.display = "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="creator-avatar-fallback w-4 h-4 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-[8px] items-center justify-center uppercase shadow-2xs"
                                    style={{ display: creator.avatarUrl ? "none" : "flex" }}
                                  >
                                    {creator.name.substring(0, 1)}
                                  </div>
                                </div>
                                <span className="font-bold text-purple-700 dark:text-purple-300 text-[11px] truncate">
                                  {creator.name}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {task.workedTodayMs > 0 && (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0 ml-auto text-xs">
                            <FiClock size={12} />
                            <span>Today: {formatMsToHoursMinutes(task.workedTodayMs)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default WorkloadCard;
