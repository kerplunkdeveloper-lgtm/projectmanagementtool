import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import { getClients } from "../../features/clients/clientslice";
import { LuPalette, LuVideo } from "react-icons/lu";

import TaskOverviewTab from "./TaskOverviewTab";

const EMPTY_ARRAY = [];

const TaskOverview = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUsers());
    dispatch(getClients());
  }, [dispatch]);

  // Common department tab filter state passed to TaskOverviewTab
  const [departmentFilter, setDepartmentFilter] = useState("Graphic Designer");

  // Common quick date filter state passed to TaskOverviewTab
  const [dateFilter, setDateFilter] = useState(() => {
    try {
      const saved = localStorage.getItem("task_date_filter");
      if (saved && saved !== "All") return saved;
      return "Today";
    } catch {
      return "Today";
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

  const { data: tasks = EMPTY_ARRAY, isLoading: loading } = useGetTasksQuery(
    undefined,
    { skip: !user }
  );

  const { data: projects = EMPTY_ARRAY } = useGetProjectsQuery(undefined, {
    skip: !user,
  });

  return (
    <div className="px-0 py-1 space-y-4 pb-16">
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 px-2 pb-3 pt-1">
        {/* Left Section: Department Tabs + Header Filters */}
        <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
          {/* Department Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-[#151923] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs shrink-0">
            {[
              { id: "Graphic Designer", label: "Graphic Designer", icon: LuPalette },
              { id: "Cinematographer", label: "Cinematographer", icon: LuVideo },
            ].map((tab) => {
              const isActive =
                departmentFilter === tab.id ||
                (tab.id === "Cinematographer" &&
                  departmentFilter?.toLowerCase().includes("cinematographer"));
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDepartmentFilter(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon
                    size={14}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Portal target for Date, Client, Assignee, Created By, Status Filters */}
          <div id="task-header-filters-portal" className="flex items-center gap-2 flex-wrap min-w-0" />
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Portal target for right-side actions (like Export / Hide Column) */}
          <div id="task-actions-portal" className="flex items-center gap-2 shrink-0" />
        </div>
      </div>

        <TaskOverviewTab
          tasks={tasks}
          projects={projects}
          currentUserId={currentUserId}
          user={user}
          loading={loading}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showDateDropdown={showDateDropdown}
          setShowDateDropdown={setShowDateDropdown}
          dateDropdownRef={dateDropdownRef}
        />
    </div>
  );
};

export default TaskOverview;
