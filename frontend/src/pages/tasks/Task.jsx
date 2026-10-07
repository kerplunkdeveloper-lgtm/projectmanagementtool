import React, { useState, useEffect, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";

const MyTasksTab = lazy(() => import("./MyTasksTab"));

const TabLoadingFallback = () => (
  <div className="flex items-center justify-center p-12 space-x-2">
    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading tasks...</span>
  </div>
);

const Task = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Common quick date filter state passed to MyTasksTab
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

  const { data: tasks = [], isLoading: loading } = useGetTasksQuery(
    undefined,
    { skip: !user }
  );

  const { data: projects = [] } = useGetProjectsQuery(undefined, {
    skip: !user,
  });

  return (
    <div className="px-0 py-1 space-y-4 pb-16">
      <Suspense fallback={<TabLoadingFallback />}>
        <MyTasksTab
          tasks={tasks}
          projects={projects}
          currentUserId={currentUserId}
          user={user}
          loading={loading}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      </Suspense>
    </div>
  );
};

export default Task;
