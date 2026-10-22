import React from "react";
import {
  FiList,
  FiGrid,
  FiX,
  FiRefreshCw,
  FiUsers,
  FiSearch,
} from "react-icons/fi";
import { LuPalette, LuVideo } from "react-icons/lu";
import { DEPARTMENT_TABS } from "../utils/workloadUtils";

// ==========================================
// WORKLOAD TOOLBAR & TOP CONTROLS COMPONENT
// ==========================================
const WorkloadToolbar = React.memo(({
  selectedDepartment,
  onSelectDepartment,
  departmentCounts = {},
  viewMode,
  onSetViewMode,
  searchTerm,
  onSearchChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  onRefresh,
  isFetching,
  hideDeptTabs = false,
  hideViewToggle = false,
}) => {
  const totalCount =
    (departmentCounts["Graphic Designer"] || 0) +
    (departmentCounts["Cinematographer"] || 0);

  return (
    <>
      <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Department Switcher Tabs OR Unified Team Badge */}
        {!hideDeptTabs ? (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-[#151923] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs shrink-0">
            {DEPARTMENT_TABS.map((tab) => {
              const isActive = selectedDepartment === tab.id;
              const count = departmentCounts[tab.id] || 0;
              const isCinema = tab.id === "Cinematographer";
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectDepartment(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer select-none ${isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                    }`}
                >
                  {isCinema ? (
                    <LuVideo size={14} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} />
                  ) : (
                    <LuPalette size={14} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs transition-colors ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-slate-100/90 to-slate-50/80 dark:from-[#151923] dark:to-[#1e293b]/70 border border-slate-200/80 dark:border-slate-800/80 shrink-0 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <FiUsers size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">Team Workload Hub</h1>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-none mt-0.5">
                {totalCount > 0 ? `${totalCount} Creative Team Members` : "Capacity & Productivity Tracker"}
              </p>
            </div>
          </div>
        )}

        {/* Right: View Toggle (Optional) + Search + Availability Filter + Date Navigator + Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
          {/* View Toggle: Grid / Table (rendered only when hideViewToggle is false) */}
          {!hideViewToggle && (
            <div className="flex items-center bg-slate-100 dark:bg-[#1e293b]/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
              <button
                type="button"
                onClick={() => onSetViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Multi-row Grid View"
              >
                <FiGrid size={13} />
                <span className="hidden sm:inline">Grid</span>
                <span className="sm:hidden">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => onSetViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Table View"
              >
                <FiList size={13} />
                <span className="hidden sm:inline">Table</span>
                <span className="sm:hidden">Table</span>
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56 lg:w-64">

            <input
              type="text"
              placeholder={hideDeptTabs ? "Search team member..." : (selectedDepartment === "Cinematographer" ? "Search cinematographer..." : "Search designer...")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1e293b]/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Availability Status Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => onAvailabilityFilterChange(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#1e293b]/60 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="online">🟢 Online Only</option>
            <option value="offline">⚪ Offline Only</option>
            <option value="busy">⚡ Busy (Working)</option>
            <option value="available">✨ Available (Idle)</option>
            <option value="paused">⏸️ On Break</option>
            <option value="overloaded">⚠️ Overloaded</option>
          </select>

          {/* Refresh Tasks */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-50 dark:bg-[#1e293b]/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0"
            title="Refresh Workload"
          >
            <FiRefreshCw size={14} className={isFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""} />
          </button>
        </div>
      </div>

      {/* Background sync progress bar */}
      {isFetching && (
        <div className="h-1 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full" />
        </div>
      )}
    </>
  );
});

export default WorkloadToolbar;
