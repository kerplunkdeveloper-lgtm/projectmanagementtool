import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";

const TaskOverviewTab = lazy(() => import("./TaskOverviewTab"));

const TabLoadingFallback = () => (
  <div className="flex items-center justify-center p-12 space-x-2">
    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading status overview...</span>
  </div>
);

const TaskOverview = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Common quick date filter state passed to TaskOverviewTab
  const [dateFilter, setDateFilter] = useState(() => {
    try {
      const saved = localStorage.getItem("task_date_filter");
      return saved || "All";
    } catch {
      return "All";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("task_date_filter", dateFilter);
    } catch (e) {
      console.error("Failed to save date filter:", e);
    }
  }, [dateFilter]);

  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dateDropdownRef = useRef(null);
  const [filteredOverviewCount, setFilteredOverviewCount] = useState(null);

  const [isActiveOnly, setIsActiveOnly] = useState(true);

  const { data: tasks = [], isLoading: loading } = useGetTasksQuery(
    isActiveOnly ? { active_only: true } : undefined,
    { skip: !user }
  );

  const { data: projects = [] } = useGetProjectsQuery(undefined, {
    skip: !user,
  });

  return (
    <div className="px-0 py-1 space-y-4 pb-16">
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 px-2 pb-3 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-black text-slate-900 dark:text-[#f8fafc] tracking-tight">
              Status Overview
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {filteredOverviewCount !== null ? filteredOverviewCount : tasks.length} Tasks
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] mt-0.5">
            Live cross-project status monitoring, stage progression, and operational delivery metrics
          </p>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2 shrink-0">
         

          {/* Portal target for right-side actions (like Export / Hide Column) */}
          <div id="task-actions-portal" className="flex items-center gap-2 shrink-0" />
        </div>
      </div>

      <Suspense fallback={<TabLoadingFallback />}>
        <TaskOverviewTab
          tasks={tasks}
          projects={projects}
          currentUserId={currentUserId}
          user={user}
          loading={loading}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showDateDropdown={showDateDropdown}
          setShowDateDropdown={setShowDateDropdown}
          dateDropdownRef={dateDropdownRef}
          onFilteredCountChange={setFilteredOverviewCount}
        />
      </Suspense>
    </div>
  );
};

export default TaskOverview;
