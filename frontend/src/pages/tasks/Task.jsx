import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import MyTasksTab from "./MyTasksTab";

const QUICK_LIMIT = 50;
const EMPTY_TASKS = [];

const Task = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;
  const dispatch = useDispatch();

  const { users = [] } = useSelector((state) => state.users || {});

  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getUsers());
    }
  }, [dispatch, users]);

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

  // Full list (can be slow for users with many tasks)
  const { data: fullTasks, isLoading: fullLoading } = useGetTasksQuery(
    { my_tasks: true },
    { skip: !user }
  );

  // Fast first paint: newest 50 tasks, shown until the full list arrives.
  // Skipped entirely when the full list is already cached.
  const { data: quickTasks } = useGetTasksQuery(
    { my_tasks: true, limit: QUICK_LIMIT },
    { skip: !user || !!fullTasks }
  );

  const tasks = fullTasks || quickTasks || EMPTY_TASKS;
  const loading = !fullTasks && !quickTasks && fullLoading;
  const partialLoading = !fullTasks && !!quickTasks;

  const { data: projects = [] } = useGetProjectsQuery(
    { minimal: true },
    { skip: !user }
  );

  return (
    <div className="px-0 py-1 space-y-4 pb-16">
      <MyTasksTab
        tasks={tasks}
        projects={projects}
        currentUserId={currentUserId}
        user={user}
        loading={loading}
        partialLoading={partialLoading}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />
    </div>
  );
};

export default Task;
