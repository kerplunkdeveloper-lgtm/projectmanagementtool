import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import MyTasksTab from "./MyTasksTab";

const Task = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;
  const dispatch = useDispatch();

  const { users = [] } = useSelector((state) => state.users || {});

  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getUsers());
    }
  }, [dispatch, users?.length]);

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
    { my_tasks: true },
    { skip: !user }
  );

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
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />
    </div>
  );
};

export default Task;
