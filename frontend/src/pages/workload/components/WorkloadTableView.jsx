import React from "react";
import {
  FiPlay,
  FiPauseCircle,
  FiBriefcase,
  FiChevronUp,
  FiChevronDown,
  FiCalendar,
  FiEye,
  FiClock,
} from "react-icons/fi";
import { formatMsToHoursMinutes, getStatusBadgeClass, getTaskCreatorInfo } from "../utils/workloadUtils";

// ==========================================
// MEMOIZED WORKLOAD TABLE ROW COMPONENT
// ==========================================
const WorkloadTableRow = React.memo(({
  workload,
  isExpanded,
  onToggleExpand,
  onViewTask,
  selectedDepartment,
}) => {
  const {
    user: member,
    isOnline,
    displayTasks,
    sortedDisplayTasks,
    activeTasks,
    pendingTasks,
    onHoldTasks,
    maxCapacityTasks,
    totalActiveTasksCount,
    effectiveSlots,
    totalWorkloadSlots,
    taskUtilizationPercent,
    cardTheme,
    availability,
  } = workload;

  return (
    <React.Fragment>
      <tr
        className={`transition-colors group ${cardTheme.isOverloaded
            ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30"
            : "hover:bg-slate-50/80 dark:hover:bg-[#131b2e]/60"
          }`}
      >
        {/* 1. Member Column */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {member.profile?.profileImage?.url ? (
                <img
                  src={member.profile.profileImage.url}
                  alt={member.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-2xs">
                  {member.name ? member.name.substring(0, 2) : "TM"}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0f172a] ${isOnline ? "bg-emerald-500 shadow-xs" : "bg-slate-400 dark:bg-slate-600"
                  }`}
                title={isOnline ? "Online Now" : "Offline"}
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {member.name}
              </h4>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {member.department || (selectedDepartment === "Cinematographer" ? "Cinematographer" : "Graphic Designer")}
              </span>
            </div>
          </div>
        </td>

        {/* 2. Live Status & Current Task Column */}
        <td className="py-3 px-4 max-w-[260px]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${availability.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${availability.dotClass}`} />
                {availability.label}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                • {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {activeTasks.length > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                <FiPlay size={11} className="animate-pulse shrink-0" />
                <span className="truncate" title={activeTasks[0]?.title}>
                  {activeTasks[0]?.title}
                </span>
              </div>
            ) : onHoldTasks.length > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
                <FiPauseCircle size={12} className="shrink-0" />
                <span>Tasks paused / on break</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block">
                Available • Ready for tasks
              </span>
            )}
          </div>
        </td>

        {/* 3. Capacity (8 Slots) Column */}
        <td className="py-3 px-4">
          <div className="space-y-1.5 max-w-[190px]">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={`font-black ${cardTheme.capacityTextColor}`}>
                {effectiveSlots || totalActiveTasksCount} / {maxCapacityTasks} Load ({totalActiveTasksCount} tasks)
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {taskUtilizationPercent}%
              </span>
            </div>
            {/* 8-slot meter */}
            <div className="grid grid-cols-8 gap-1 py-0.5">
              {Array.from({ length: maxCapacityTasks }).map((_, index) => {
                const isFilled = index < Math.round(effectiveSlots || totalActiveTasksCount);
                return (
                  <div
                    key={index}
                    className={`h-2.5 rounded-full transition-all duration-200 ${isFilled ? cardTheme.slotFilledColor : cardTheme.slotEmptyColor
                      }`}
                    title={`Slot ${index + 1}: ${isFilled ? "Occupied" : "Free"}`}
                  />
                );
              })}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cardTheme.badgeBg}`}>
              {cardTheme.statusTag}
            </span>
          </div>
        </td>

        {/* 4. Tasks Breakdown Column */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]"
              title="In Progress"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{activeTasks.length} In Progress</span>
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-extrabold text-[11px]"
              title="On Hold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{onHoldTasks.length} On Hold</span>
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]"
              title="Not Started"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>{pendingTasks.length} Not Started</span>
            </span>
          </div>
        </td>

        {/* Actions Column */}
        <td className="py-3 px-4 text-right">
          <button
            type="button"
            onClick={() => onToggleExpand(member._id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isExpanded
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              }`}
          >
            <FiBriefcase size={13} />
            <span>Tasks ({displayTasks.length})</span>
            {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        </td>
      </tr>

      {/* Expanded Task Details Accordion Row */}
      {isExpanded && (
        <tr className="bg-slate-50/70 dark:bg-[#0a0f1d]/60 border-b border-slate-200/80 dark:border-slate-800/80">
          <td colSpan={5} className="p-4 pl-12">
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2">
              <div className="flex items-center justify-between pb-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Assigned Active Tasks for {member.name}:</span>
                <span className="text-[11px] font-normal">
                  Only In Progress, On Hold, and Not Started tasks shown
                </span>
              </div>

              {sortedDisplayTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-[#111827] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No active tasks assigned currently.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {sortedDisplayTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white dark:bg-[#111827] rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {task.assignedDateFormatted ? (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <FiCalendar size={11} className="text-indigo-500 shrink-0" />
                            <span>{task.assignedDateFormatted}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Active Task</span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getStatusBadgeClass(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug line-clamp-2">
                          {task.title}
                        </h5>
                        <button
                          type="button"
                          onClick={() => onViewTask(task)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                          title="View Task Details"
                        >
                          <FiEye size={13} />
                        </button>
                      </div>

                      {/* Bottom Info: Assigned Creator & Productivity */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 gap-2 flex-wrap">
                        {/* Task Creator Name & Profile Image */}
                        {(() => {
                          const creator = task.creatorInfo || getTaskCreatorInfo(task);
                          if (!creator?.name) return <span />;
                          return (
                            <div
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs max-w-[155px] truncate"
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
                              <span className="font-extrabold text-purple-700 dark:text-purple-300 text-[10px] truncate">
                                {creator.name}
                              </span>
                            </div>
                          );
                        })()}

                        {task.workedTodayMs > 0 && (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0 ml-auto">
                            <FiClock size={11} />
                            <span>Today: {formatMsToHoursMinutes(task.workedTodayMs)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

// ==========================================
// MEMOIZED WORKLOAD TABLE VIEW
// ==========================================
const WorkloadTableView = React.memo(({
  workloads,
  expandedUserIds,
  onToggleExpand,
  onViewTask,
  selectedDepartment,
}) => {
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-[#131b2e]/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4">Team Member</th>
              <th className="py-3.5 px-4">Live Status & Current Task</th>
              <th className="py-3.5 px-4 min-w-[190px]">Capacity (Max 8)</th>
              <th className="py-3.5 px-4">Tasks Breakdown</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {workloads.map((workload) => (
              <WorkloadTableRow
                key={workload.user._id}
                workload={workload}
                isExpanded={expandedUserIds.has(workload.user._id)}
                onToggleExpand={onToggleExpand}
                onViewTask={onViewTask}
                selectedDepartment={selectedDepartment}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default WorkloadTableView;
