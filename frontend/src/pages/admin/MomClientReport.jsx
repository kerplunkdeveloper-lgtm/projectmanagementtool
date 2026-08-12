import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGetTasksQuery, useGetProjectsQuery } from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import { FiFileText, FiClock, FiCheckCircle } from "react-icons/fi";

const getStatusStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "pending" || s === "to do") {
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
  if (s === "in progress") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
  }
  if (s === "on hold") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
  }
  if (s === "in review") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
  }
  if (s === "completed" || s === "done") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";
  }
  if (s === "correction") {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
  }
  if (s === "rejected") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const getPriorityStyle = (priority) => {
  const p = (priority || "").toLowerCase();
  if (p === "top high") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-bold";
  }
  if (p === "high") {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-bold";
  }
  if (p === "medium") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const MomClientReport = () => {
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery(undefined, {
    skip: !user,
  });

  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery(undefined, {
    skip: !user,
  });

  const [dateFilter, setDateFilter] = useState("");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if ((task.contentType || "").toUpperCase() !== "MOM") return false;

      const creatorId = task.createdBy?._id || task.createdBy;
      const creatorUserObj = typeof task.createdBy === "object" ? task.createdBy : users?.find(u => (u._id || u.id) === creatorId);
      
      const assigneeId = task.assignedTo?._id || task.assignedTo;
      const assignedUserObj = typeof task.assignedTo === "object" ? task.assignedTo : users?.find(u => (u._id || u.id) === assigneeId);

      const creatorDept = (creatorUserObj?.department || "").toLowerCase();
      const assigneeDept = (assignedUserObj?.department || "").toLowerCase();

      const isSocialMedia = creatorDept.includes("social media") || assigneeDept.includes("social media");
      
      if (!isSocialMedia) return false;

      if (dateFilter) {
        const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
        if (taskDate !== dateFilter) return false;
      }

      return true;
    });
  }, [tasks, users, dateFilter]);

  const loading = tasksLoading || projectsLoading;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#020710] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-md">
        <div className="bg-white/20 p-2 rounded-lg">
          <FiFileText size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">MOM Client Report</h1>
          <p className="text-xs font-medium text-indigo-100">Social Media Team - MOM Tasks Overview</p>
        </div>
      </div>
      
      <div className="px-6 py-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="flex justify-end mb-4">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-sm text-slate-700 dark:text-slate-300"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-slate-500 text-sm font-medium animate-pulse">Loading reports...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#151b2b] border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Assignee</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Client Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Task Title</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No MOM tasks found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const assigneeId = task.assignedTo?._id || task.assignedTo;
                      const assigneeName = typeof task.assignedTo === "object" ? task.assignedTo?.name : (users?.find(u => (u._id || u.id) === assigneeId)?.name || "Unknown");
                      
                      const projId = task.project?._id || task.project;
                      const projectObj = projects.find((p) => p._id === projId);
                      const clientObj = task.project?.client?.companyName ? task.project.client : projectObj?.client;
                      const clientName = clientObj?.companyName || "Unknown Client";

                      return (
                        <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {assigneeName}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {clientName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                            {task.title}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className={`px-2 py-1 rounded-md ${getPriorityStyle(task.priority)}`}>
                              {task.priority || "Medium"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-center">
                            <span className={`px-2 py-1 rounded-md ${getStatusStyle(task.status)} font-bold`}>
                              {task.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomClientReport;
