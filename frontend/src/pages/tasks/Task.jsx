import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiClock,
  FiCheckSquare,
  FiAlertCircle,
  FiCalendar,
  FiBriefcase,
  FiCornerDownRight,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { getTasks, updateTask } from "../../features/tasks/taskSlice";

const Task = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    dispatch(getTasks());
  }, [dispatch]);

  const currentUserId = user?._id || user?.id;

  // Filter tasks assigned to current user
  const myTasks = tasks.filter((task) => {
    const taskUserId = task.assignedTo?._id || task.assignedTo;
    return taskUserId === currentUserId;
  });

  const filteredTasks = myTasks.filter((task) => {
    if (statusFilter === "All") return true;
    return task.status === statusFilter;
  });

  // Handle task status toggle
  const handleToggleStatus = (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    dispatch(updateTask({ id: task._id, taskData: { status: newStatus } }));
  };

  // Handle task status update via dropdown
  const handleStatusChange = (taskId, newStatus) => {
    dispatch(updateTask({ id: taskId, taskData: { status: newStatus } }));
  };

  // Toggle subtask status
  const handleToggleSubtask = (task, subtask) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtask._id
        ? { ...sub, status: sub.status === "Completed" ? "Pending" : "Completed" }
        : sub
    );
    dispatch(updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }));
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
          dot: "bg-emerald-500",
          icon: FiCheckSquare,
        };
      case "In Progress":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/50",
          dot: "bg-blue-500",
          icon: FiClock,
        };
      case "On Hold":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/50",
          dot: "bg-amber-500",
          icon: FiAlertCircle,
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200/50",
          dot: "bg-slate-400",
          icon: FiClock,
        };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">My Assigned Tasks</h1>
          <p className="text-slate-500 text-[10px] mt-1">Manage, update, and track status of tasks assigned to you</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-2 overflow-x-auto pb-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        {["All", "Pending", "In Progress", "Completed", "On Hold"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              statusFilter === status
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* TASK LIST TABLE */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <FiCheckSquare size={40} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-700">No Tasks Found</h3>
          <p className="text-slate-400 text-sm mt-1">You have no tasks assigned matching this criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4 w-12 text-center">Status Toggle</th>
                  <th className="px-6 py-4">Task Details</th>
                  <th className="px-6 py-4">Associated Project</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 w-40">Status Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  const statusStyle = getStatusStyle(task.status);
                  const isExpanded = !!expandedTasks[task._id];

                  return (
                    <React.Fragment key={task._id}>
                      <tr className={`hover:bg-slate-50/50 transition-colors ${isCompleted ? "bg-slate-50/30 text-slate-400" : "text-slate-800"}`}>
                        {/* Checkbox Trigger */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(task)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-300 hover:border-emerald-500 text-transparent hover:text-slate-400"
                            }`}
                          >
                            <FiCheck size={12} />
                          </button>
                        </td>

                        {/* Title & Subtask Expander */}
                        <td className="px-6 py-4 font-extrabold">
                          <div className="flex flex-col gap-1">
                            <span className={isCompleted ? "line-through text-slate-400 font-semibold" : "text-slate-800"}>
                              {task.title}
                            </span>
                            {task.subtasks?.length > 0 && (
                              <button
                                onClick={() => toggleTaskExpanded(task._id)}
                                className="text-slate-400 hover:text-blue-600 flex items-center gap-0.5 text-[10px] font-bold w-fit"
                              >
                                {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                                <span>Subtasks ({task.subtasks.length})</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Associated Project */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-blue-600 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100">
                            <FiBriefcase size={12} />
                            {task.project?.name || "No Associated Project"}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                            <FiCalendar size={12} />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Due Date"}
                          </span>
                        </td>

                        {/* Status Selection */}
                        <td className="px-6 py-4">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${statusStyle.bg}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </td>
                      </tr>

                      {/* Subtasks Expanded list */}
                      {isExpanded && task.subtasks?.length > 0 && (
                        <tr className="bg-slate-50/20">
                          <td></td>
                          <td colSpan={4} className="px-6 py-3">
                            <div className="space-y-2 border-l-2 border-slate-100 pl-4 py-1">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Subtasks</h4>
                              {task.subtasks.map((sub) => {
                                const isSubCompleted = sub.status === "Completed";
                                return (
                                  <div
                                    key={sub._id}
                                    className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/60 shadow-sm max-w-xl"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <FiCornerDownRight className="text-slate-300" size={13} />
                                      {/* Subtask Checkbox */}
                                      <button
                                        onClick={() => handleToggleSubtask(task, sub)}
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                          isSubCompleted
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-slate-300 hover:border-emerald-500 text-transparent hover:text-slate-400"
                                        }`}
                                      >
                                        <FiCheck size={10} />
                                      </button>
                                      <span className={`font-semibold text-xs text-slate-700 ${isSubCompleted ? "line-through text-slate-400 font-medium" : ""}`}>
                                        {sub.title}
                                      </span>
                                    </div>

                                    {/* Subtask Due Date */}
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold pr-2">
                                      <FiCalendar className="text-slate-400" size={11} />
                                      {sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : "N/A"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;