import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiPlus,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiTrash2,
  FiCornerDownRight,
  FiBriefcase,
  FiTag,
  FiClock,
} from "react-icons/fi";

import { getTasks, createTask, updateTask, deleteTask } from "../../features/tasks/taskSlice";

// Task Title Input Component for autosaving inline without cursor jump
const TaskTitleInput = ({ task, canToggle, handleTaskFieldChange, isCompleted }) => {
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={() => {
        if (title.trim() && title !== task.title) {
          handleTaskFieldChange(task._id, { title: title.trim() });
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={`bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-400/50 w-full p-0 font-semibold text-slate-800 dark:text-yellow-50 rounded px-1.5 py-0.5 ${
        isCompleted ? "line-through text-slate-400" : ""
      }`}
      disabled={!canToggle}
    />
  );
};

// Subtask Row Component for the Drawer subtasks list
const SubtaskRow = ({
  sub,
  task,
  users,
  getAvatarColor,
  handleSubtaskFieldChange,
  handleDeleteSubtask,
  isAdminOrManager,
  currentUser,
}) => {
  const isSubCompleted = sub.status === "Completed";
  const canToggleSub =
    isAdminOrManager ||
    sub.assignedTo?._id === currentUser?._id ||
    sub.assignedTo === currentUser?._id;
  const [subTitle, setSubTitle] = useState(sub.title);

  useEffect(() => {
    setSubTitle(sub.title);
  }, [sub.title]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FiCornerDownRight className="text-slate-300 shrink-0" size={13} />
        {/* Subtask Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canToggleSub) {
              handleSubtaskFieldChange(task, sub._id, {
                status: isSubCompleted ? "Pending" : "Completed",
              });
            }
          }}
          disabled={!canToggleSub}
          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
            !canToggleSub ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${
            isSubCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-300 hover:border-blue-500 text-transparent hover:text-slate-400"
          }`}
        >
          <FiCheck size={10} />
        </button>

        {/* Subtask Title Input */}
        <input
          type="text"
          value={subTitle}
          onChange={(e) => setSubTitle(e.target.value)}
          onBlur={() => {
            if (subTitle.trim() && subTitle !== sub.title) {
              handleSubtaskFieldChange(task, sub._id, { title: subTitle.trim() });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.target.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-400/50 w-full p-0 font-medium text-slate-700 dark:text-yellow-50 rounded px-1.5 py-0.5 text-xs ${
            isSubCompleted ? "line-through text-slate-400" : ""
          }`}
          disabled={!canToggleSub}
        />
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[10px]" onClick={(e) => e.stopPropagation()}>
        {/* Subtask Assignee */}
        <div className="flex items-center gap-1">
          {isAdminOrManager ? (
            <select
              value={sub.assignedTo?._id || sub.assignedTo || ""}
              onChange={(e) =>
                handleSubtaskFieldChange(task, sub._id, {
                  assignedTo: e.target.value || null,
                })
              }
              className="bg-transparent border-0 font-medium text-slate-600 hover:bg-slate-100 p-0.5 rounded cursor-pointer focus:outline-none"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-medium text-slate-600">
              {sub.assignedTo?.name || "Unassigned"}
            </span>
          )}
        </div>

        {/* Subtask Due Date */}
        <div className="flex items-center gap-1">
          {isAdminOrManager ? (
            <input
              type="date"
              value={sub.dueDate ? new Date(sub.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                handleSubtaskFieldChange(task, sub._id, {
                  dueDate: e.target.value || null,
                })
              }
              className="bg-transparent border-0 hover:bg-slate-100 p-0.5 rounded cursor-pointer focus:outline-none text-[10px] text-slate-500 w-24"
            />
          ) : (
            <span className="text-[10px] text-slate-500">
              {sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : "N/A"}
            </span>
          )}
        </div>

        {/* Subtask Priority */}
        <div className="flex items-center">
          {isAdminOrManager ? (
            <select
              value={sub.priority || "Medium"}
              onChange={(e) =>
                handleSubtaskFieldChange(task, sub._id, {
                  priority: e.target.value,
                })
              }
              className={`px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold border focus:outline-none cursor-pointer ${
                sub.priority === "High"
                  ? "bg-rose-50 text-rose-700 border-rose-200/50"
                  : sub.priority === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200/50"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          ) : (
            <span
              className={`px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold border ${
                sub.priority === "High"
                  ? "bg-rose-50 text-rose-700 border-rose-200/50"
                  : sub.priority === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200/50"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {sub.priority || "Medium"}
            </span>
          )}
        </div>

        {/* Delete Subtask */}
        {isAdminOrManager && (
          <button
            onClick={() => handleDeleteSubtask(task, sub._id)}
            className="text-slate-400 hover:text-red-500 p-0.5 transition-colors"
            title="Delete Subtask"
          >
            <FiTrash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

const ProjectTaskBoard = ({
  activeProjectId,
  activeProject,
  currentUser,
  users,
  isAdminOrManager,
  getStatusBadge,
  getAvatarColor,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State
  const { tasks } = useSelector((state) => state.tasks);

  // Local State
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean
  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState({}); // taskId -> string
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Live task ID for Drawer preview

  // Filter tasks for this project
  const activeProjectTasks = tasks.filter(
    (t) => t.project?._id === activeProjectId || t.project === activeProjectId
  );

  // Live selected task from Redux state
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  // Add Task directly to DB (autosave pattern)
  const handleAddTask = () => {
    dispatch(
      createTask({
        title: "Add Task",
        project: activeProjectId,
        assignedTo: null,
        dueDate: null,
        priority: "Medium",
        status: "Pending",
      })
    );
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Update Task fields inline / autosave
  const handleTaskFieldChange = (taskId, fields) => {
    const sanitizedFields = { ...fields };
    if (sanitizedFields.assignedTo === "") sanitizedFields.assignedTo = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;

    dispatch(updateTask({ id: taskId, taskData: sanitizedFields }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Add subtask (continuous addition helper)
  const handleAddSubtask = (task, subtaskTitle) => {
    if (!subtaskTitle || !subtaskTitle.trim()) return;

    const newSubtask = {
      title: subtaskTitle.trim(),
      status: "Pending",
      assignedTo: null,
      dueDate: null,
      priority: "Medium",
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    dispatch(updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Add subtask from inline form in table
  const handleInlineAddSubtaskSubmit = (e, task) => {
    e.preventDefault();
    const title = inlineSubtaskTitle[task._id];
    if (!title || !title.trim()) return;

    handleAddSubtask(task, title);
    setInlineSubtaskTitle((prev) => ({ ...prev, [task._id]: "" }));
  };

  // Update specific subtask fields
  const handleSubtaskFieldChange = (task, subtaskId, updatedFields) => {
    const sanitizedFields = { ...updatedFields };
    if (sanitizedFields.assignedTo === "") sanitizedFields.assignedTo = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;

    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtaskId ? { ...sub, ...sanitizedFields } : sub
    );
    dispatch(updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Delete Subtask
  const handleDeleteSubtask = (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.filter((sub) => sub._id !== subtaskId);
    dispatch(updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Delete parent Task
  const handleParentTaskDelete = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      dispatch(deleteTask(taskId));
      setTimeout(() => {
        dispatch(getTasks());
      }, 500);
    }
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const totalTasks = activeProjectTasks.length;
  const completedTasks = activeProjectTasks.filter((t) => t.status === "Completed").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Drawer Subtask continuous form
  const DrawerSubtaskForm = ({ task }) => {
    const [title, setTitle] = useState("");
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!title.trim()) return;
      handleAddSubtask(task, title);
      setTitle("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
        <FiCornerDownRight className="text-slate-350 shrink-0" size={14} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Type subtask name and press Enter..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-[11px] text-slate-700 transition-all font-semibold"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-[10px] transition-colors shadow-md shadow-blue-500/10 active:scale-95"
        >
          Add
        </button>
      </form>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* WORKSPACE HEADER & PROGRESS */}
      <div>
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                Client : {activeProject.client?.companyName || "No Client"}
              </span>
              <span
                className={`text-[8px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(
                  activeProject.status
                )}`}
              >
                {activeProject.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-800 dark:text-yellow-50">{activeProject.name}</h1>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate(`/${currentUser?.role}/projects`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-blue-600 text-white font-bold text-xs transition-all w-fit"
            >
              <FiX size={16} />
              Exit Workspace
            </button>
          </div>
        </div>
      </div>

      {/* TASK MANAGEMENT BOARD TABLE */}
      <div className="overflow-hidden">
        <div className="border-b border-slate-100 flex mb-5 items-center justify-between">
          {isAdminOrManager && (
            <button
              onClick={handleAddTask}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-blue-400 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200"
            >
              <FiPlus size={18} />
              Add Task
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Assignee</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {activeProjectTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No tasks assigned to this project yet. Click "+ Add task" to get started.
                  </td>
                </tr>
              ) : (
                <>
                  {activeProjectTasks.map((task) => {
                    const isExpanded = !!expandedTasks[task._id];
                    const isCompleted = task.status === "Completed";
                    const canToggle =
                      isAdminOrManager ||
                      task.assignedTo?._id === currentUser?._id ||
                      task.assignedTo === currentUser?._id;

                    return (
                      <React.Fragment key={task._id}>
                        {/* Parent Task Row */}
                        <tr
                          onClick={() => setSelectedTaskId(task._id)}
                          className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${
                            isCompleted ? "bg-slate-50/30 text-slate-400" : "text-slate-800 dark:text-yellow-50"
                          } ${selectedTaskId === task._id ? "bg-blue-50/40" : ""}`}
                        >
                          {/* Name Field with Circle Checkbox */}
                          <td className="px-6 py-3.5 font-semibold">
                            <div className="flex items-center gap-3">
                              {/* Circle Checkbox */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canToggle) {
                                    handleTaskFieldChange(task._id, {
                                      status: isCompleted ? "Pending" : "Completed",
                                    });
                                  }
                                }}
                                disabled={!canToggle}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  !canToggle ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                } ${
                                  isCompleted
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-slate-300 hover:border-blue-500 text-transparent hover:text-slate-400"
                                }`}
                              >
                                <FiCheck size={12} />
                              </button>

                              {/* Task Title Input */}
                              <div className="flex-1">
                                <TaskTitleInput
                                  task={task}
                                  canToggle={canToggle}
                                  handleTaskFieldChange={handleTaskFieldChange}
                                  isCompleted={isCompleted}
                                />
                              </div>

                              {/* Subtask Expander Toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskExpanded(task._id);
                                }}
                                className="text-slate-400 hover:text-blue-600 flex items-center gap-0.5 ml-2 text-[10px] font-bold"
                              >
                                {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                <span>Subtasks ({task.subtasks?.length || 0})</span>
                              </button>
                            </div>
                          </td>

                          {/* Assignee Selection */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {task.assignedTo?.profileImage?.url ? (
                                <img
                                  src={task.assignedTo.profileImage.url}
                                  alt={task.assignedTo.name}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-100"
                                />
                              ) : (
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] bg-gradient-to-br ${getAvatarColor(
                                    task.assignedTo?.name || "Unknown"
                                  )}`}
                                >
                                  {task.assignedTo?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "U"}
                                </div>
                              )}
                              {isAdminOrManager ? (
                                <select
                                  value={task.assignedTo?._id || task.assignedTo || ""}
                                  onChange={(e) =>
                                    handleTaskFieldChange(task._id, { assignedTo: e.target.value })
                                  }
                                  className="bg-transparent border-0 font-semibold text-slate-700 hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Unassigned</option>
                                  {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                      {u.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-semibold text-slate-700 px-1 py-0.5">
                                  {task.assignedTo?.name || "Unassigned"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Due Date */}
                          <td className="px-6 py-3.5">
                            <div
                              className="flex items-center gap-2 text-slate-500 font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiCalendar size={13} className="text-slate-400" />
                              {isAdminOrManager ? (
                                <input
                                  type="date"
                                  value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                                  onChange={(e) =>
                                    handleTaskFieldChange(task._id, { dueDate: e.target.value })
                                  }
                                  className="bg-transparent border-0 hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer focus:outline-none text-xs text-slate-600"
                                />
                              ) : (
                                <span className="text-xs text-slate-600">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="px-6 py-3.5">
                            <div onClick={(e) => e.stopPropagation()}>
                              {isAdminOrManager ? (
                                <select
                                  value={task.priority || "Medium"}
                                  onChange={(e) =>
                                    handleTaskFieldChange(task._id, { priority: e.target.value })
                                  }
                                  className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                                    task.priority === "High"
                                      ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                      : task.priority === "Medium"
                                      ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                    task.priority === "High"
                                      ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                      : task.priority === "Medium"
                                      ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {task.priority || "Medium"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-3.5">
                            <div onClick={(e) => e.stopPropagation()}>
                              {isAdminOrManager ? (
                                <select
                                  value={task.status || "Pending"}
                                  onChange={(e) => handleTaskFieldChange(task._id, { status: e.target.value })}
                                  className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                                    task.status === "Completed"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                      : task.status === "In Progress"
                                      ? "bg-blue-50 text-blue-700 border-blue-200/50"
                                      : "bg-amber-50 text-amber-700 border-amber-200/50"
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                    task.status === "Completed"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                      : task.status === "In Progress"
                                      ? "bg-blue-50 text-blue-700 border-blue-200/50"
                                      : "bg-amber-50 text-amber-700 border-amber-200/50"
                                  }`}
                                >
                                  {task.status || "Pending"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Controls */}
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                              {isAdminOrManager && (
                                <button
                                  onClick={() => toggleTaskExpanded(task._id)}
                                  className="text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-wider"
                                  title="Manage Subtasks"
                                >
                                  + Subtask
                                </button>
                              )}
                              {isAdminOrManager && (
                                <button
                                  onClick={() => handleParentTaskDelete(task._id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                  title="Delete Task"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Inline Subtasks Workspace (Chevron Expanded) */}
                        {isExpanded && (
                          <tr className="bg-slate-50/20">
                            <td colSpan={6} className="pl-12 pr-6 py-3">
                              <div className="space-y-2.5 border-l-2 border-slate-100 pl-4 py-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                  Subtasks
                                </h4>

                                {/* List existing subtasks */}
                                {(task.subtasks || []).map((sub) => (
                                  <SubtaskRow
                                    key={sub._id}
                                    sub={sub}
                                    task={task}
                                    users={users}
                                    getAvatarColor={getAvatarColor}
                                    handleSubtaskFieldChange={handleSubtaskFieldChange}
                                    handleDeleteSubtask={handleDeleteSubtask}
                                    isAdminOrManager={isAdminOrManager}
                                    currentUser={currentUser}
                                  />
                                ))}

                                {/* Inline Add Subtask Form */}
                                {isAdminOrManager && (
                                  <form
                                    onSubmit={(e) => handleInlineAddSubtaskSubmit(e, task)}
                                    className="flex items-center gap-2 pt-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiCornerDownRight className="text-slate-300" size={13} />
                                    <input
                                      type="text"
                                      placeholder="Add subtask..."
                                      value={inlineSubtaskTitle[task._id] || ""}
                                      onChange={(e) =>
                                        setInlineSubtaskTitle((prev) => ({
                                          ...prev,
                                          [task._id]: e.target.value,
                                        }))
                                      }
                                      className="w-full max-w-sm px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-[11px] text-slate-650"
                                    />
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-[10px]"
                                    >
                                      Add
                                    </button>
                                  </form>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFCANVAS TASK DETAILS DRAWER */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />

            {/* Side Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 dark:text-yellow-50">
                      Task Workspace Preview
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Real-time Editing & Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title Section (Autosaves on blur/enter) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Task Title
                  </label>
                  <TaskTitleInput
                    task={selectedTask}
                    canToggle={
                      isAdminOrManager ||
                      selectedTask.assignedTo?._id === currentUser?._id ||
                      selectedTask.assignedTo === currentUser?._id
                    }
                    handleTaskFieldChange={handleTaskFieldChange}
                    isCompleted={selectedTask.status === "Completed"}
                  />
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiTag size={12} /> Status
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.status || "Pending"}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, { status: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <div
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold w-fit uppercase tracking-wider ${getStatusBadge(
                          selectedTask.status
                        )}`}
                      >
                        {selectedTask.status || "Pending"}
                      </div>
                    )}
                  </div>

                  {/* Assignee Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiUser size={12} /> Assignee
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.assignedTo?._id || selectedTask.assignedTo || ""}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, { assignedTo: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl">
                        {selectedTask.assignedTo?.profileImage?.url ? (
                          <img
                            src={selectedTask.assignedTo.profileImage.url}
                            alt={selectedTask.assignedTo.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br ${getAvatarColor(
                              selectedTask.assignedTo?.name || "U"
                            )}`}
                          >
                            {selectedTask.assignedTo?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-700">
                          {selectedTask.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Due Date Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Due Date
                    </label>
                    {isAdminOrManager ? (
                      <input
                        type="date"
                        value={
                          selectedTask.dueDate
                            ? new Date(selectedTask.dueDate).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, { dueDate: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                        <FiClock className="text-slate-400" size={13} />
                        {selectedTask.dueDate
                          ? new Date(selectedTask.dueDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiClock size={12} /> Priority
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.priority || "Medium"}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, { priority: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    ) : (
                      <div
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold w-fit ${
                          selectedTask.priority === "High"
                            ? "bg-rose-50 text-rose-700 border-rose-200/50"
                            : selectedTask.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border-amber-200/50"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {selectedTask.priority || "Medium"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtask workspace inside the preview drawer */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      Subtasks Workspace ({selectedTask.subtasks?.length || 0})
                    </h3>
                  </div>

                  {/* Continuous subtask addition input */}
                  {isAdminOrManager && <DrawerSubtaskForm task={selectedTask} />}

                  {/* Subtask list */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {selectedTask.subtasks?.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                        No subtasks created. Type above to add multiple subtasks continuously.
                      </div>
                    ) : (
                      selectedTask.subtasks.map((sub) => (
                        <SubtaskRow
                          key={sub._id}
                          sub={sub}
                          task={selectedTask}
                          users={users}
                          getAvatarColor={getAvatarColor}
                          handleSubtaskFieldChange={handleSubtaskFieldChange}
                          handleDeleteSubtask={handleDeleteSubtask}
                          isAdminOrManager={isAdminOrManager}
                          currentUser={currentUser}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectTaskBoard;
