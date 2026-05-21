import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiUser,
  FiCalendar,
  FiSearch,
  FiInfo,
  FiX,
  FiTrash2,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiCornerDownRight,
  FiBriefcase,
} from "react-icons/fi";

import {
  getProjects,
  createProject,
} from "../../features/projects/projectSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import { getTasks, createTask, updateTask, deleteTask } from "../../features/tasks/taskSlice";

const Project = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeProjectId = searchParams.get("id");

  // Redux State
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { tasks } = useSelector((state) => state.tasks);
  const { user: currentUser } = useSelector((state) => state.auth);

  // Local State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for creating project
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Active");

  // Interactive inline state
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean
  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState({}); // taskId -> string

  // Load Data
  useEffect(() => {
    dispatch(getProjects());
    dispatch(getClients());
    dispatch(getUsers());
    dispatch(getTasks());
  }, [dispatch]);

  // Set default client selection once clients are loaded
  useEffect(() => {
    if (clients && clients.length > 0 && !clientId) {
      setClientId(clients[0]._id);
    }
  }, [clients, clientId]);

  const isAdmin = currentUser?.role === "admin";
  const isAdminOrManager = currentUser?.role === "admin" || currentUser?.role === "operationmanager";

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle modal trigger
  const handleOpenCreate = () => {
    setName("");
    setClientId(clients[0]?._id || "");
    setStatus("Active");
    setShowCreateModal(true);
  };

  // Submit Create Project
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name || !clientId) return;
    dispatch(
      createProject({
        name,
        client: clientId,
        status,
      })
    );
    setShowCreateModal(false);
  };

  // Submit Task Creation Inline
  const handleInlineTaskSubmit = (e) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;

    dispatch(
      createTask({
        title: inlineTaskTitle,
        description: "",
        project: activeProjectId,
        assignedTo: currentUser?._id || users[0]?._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default 7 days
        status: "Pending",
      })
    );
    setInlineTaskTitle("");
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Update Task fields inline
  const handleTaskFieldChange = (taskId, fields) => {
    dispatch(updateTask({ id: taskId, taskData: fields }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Add subtask inline
  const handleAddSubtaskSubmit = (e, task) => {
    e.preventDefault();
    const title = inlineSubtaskTitle[task._id];
    if (!title || !title.trim()) return;

    const newSubtask = {
      title: title.trim(),
      status: "Pending",
      assignedTo: currentUser?._id || users[0]?._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    dispatch(updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }));

    setInlineSubtaskTitle((prev) => ({ ...prev, [task._id]: "" }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 500);
  };

  // Update specific subtask fields
  const handleSubtaskFieldChange = (task, subtaskId, updatedFields) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtaskId ? { ...sub, ...updatedFields } : sub
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
      dispatch(deleteTask(taskId));
      setTimeout(() => {
        dispatch(getTasks());
      }, 500);
    }
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Avatar gradient color generator based on name
  const getAvatarColor = (name) => {
    const colors = [
      "from-blue-500 to-indigo-500",
      "from-emerald-500 to-teal-500",
      "from-violet-500 to-purple-500",
      "from-pink-500 to-rose-500",
      "from-amber-500 to-orange-500",
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Inactive":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Active workspace settings
  const activeProject = projects.find((p) => p._id === activeProjectId);
  const activeProjectTasks = tasks.filter((t) => t.project?._id === activeProjectId || t.project === activeProjectId);

  // VIEW 1: ACTIVE PROJECT TASK BOARD WORKSPACE
  if (activeProjectId && activeProject) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* WORKSPACE HEADER & PROGRESS */}
        {(() => {
          const totalTasks = activeProjectTasks.length;
          const completedTasks = activeProjectTasks.filter((t) => t.status === "Completed").length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                      {activeProject.client?.companyName || "No Client"}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(activeProject.status)}`}>
                      {activeProject.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-800">{activeProject.name}</h1>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => navigate(`/${currentUser?.role}/projects`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all w-fit"
                  >
                    <FiX size={16} />
                    Exit Workspace
                  </button>
                </div>
              </div>

              {/* PROGRESS CARD */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4 min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Project Progress</h3>
                    <p className="text-slate-500 text-xs mt-1 font-bold">{completedTasks} / {totalTasks} Tasks</p>
                  </div>
                  <span className="text-2xl font-black text-blue-600">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* TASK MANAGEMENT BOARD TABLE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">Task Board</h2>
              <p className="text-slate-500 text-xs mt-1">Manage and assign tasks or subtasks inline</p>
            </div>
            {isAdminOrManager && (
              <button
                onClick={() => {
                  document.getElementById("inline-task-input")?.focus();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 shadow-lg shadow-zinc-900/10 active:scale-95 transition-all"
              >
                <FiPlus size={14} />
                Add tasks
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
                  <th className="px-6 py-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeProjectTasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No tasks assigned to this project yet. Use the "Add task" input at the bottom to get started.
                    </td>
                  </tr>
                ) : (
                  activeProjectTasks.map((task) => {
                    const isExpanded = !!expandedTasks[task._id];
                    const isCompleted = task.status === "Completed";

                    const canToggle = isAdminOrManager || task.assignedTo?._id === currentUser?._id || task.assignedTo === currentUser?._id;

                    return (
                      <React.Fragment key={task._id}>
                        {/* Parent Task Row */}
                        <tr className={`hover:bg-slate-50/50 transition-colors group ${isCompleted ? "bg-slate-50/30 text-slate-400" : "text-slate-800"}`}>
                          {/* Name Field with Circle Checkbox */}
                          <td className="px-6 py-3.5 font-semibold">
                            <div className="flex items-center gap-3">
                              {/* Circle Checkbox */}
                              <button
                                onClick={() =>
                                  canToggle &&
                                  handleTaskFieldChange(task._id, {
                                    status: isCompleted ? "Pending" : "Completed",
                                  })
                                }
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

                              {/* Task Title */}
                              <span className={isCompleted ? "line-through text-slate-400" : ""}>
                                {task.title}
                              </span>

                              {/* Subtask Expander Badge */}
                              <button
                                onClick={() => toggleTaskExpanded(task._id)}
                                className="text-slate-400 hover:text-blue-600 flex items-center gap-0.5 ml-2 text-[10px] font-bold"
                              >
                                {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                <span>Subtasks ({task.subtasks?.length || 0})</span>
                              </button>
                            </div>
                          </td>

                          {/* Assignee Selection (Inline Dropdown) */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              {task.assignedTo?.profileImage?.url ? (
                                <img
                                  src={task.assignedTo.profileImage.url}
                                  alt={task.assignedTo.name}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-100"
                                />
                              ) : (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] bg-gradient-to-br ${getAvatarColor(task.assignedTo?.name || "Unknown")}`}>
                                  {task.assignedTo?.name?.split(" ").map((n) => n[0]).join("") || "U"}
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

                          {/* Due Date (Inline Date Picker) */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
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

                          {/* Action Controls */}
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-3">
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

                        {/* Subtasks Expanded Workspace */}
                        {isExpanded && (
                          <tr className="bg-slate-50/20">
                            <td colSpan={4} className="pl-12 pr-6 py-3">
                              <div className="space-y-2.5 border-l-2 border-slate-100 pl-4 py-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Subtasks</h4>

                                {/* Existing Subtasks */}
                                {(task.subtasks || []).map((sub) => {
                                  const isSubCompleted = sub.status === "Completed";
                                  const canToggleSub = isAdminOrManager || sub.assignedTo?._id === currentUser?._id || sub.assignedTo === currentUser?._id;
                                  return (
                                    <div
                                      key={sub._id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/60 shadow-sm"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <FiCornerDownRight className="text-slate-300" size={13} />
                                        {/* Subtask Checkbox */}
                                        <button
                                          onClick={() =>
                                            canToggleSub &&
                                            handleSubtaskFieldChange(task, sub._id, {
                                              status: isSubCompleted ? "Pending" : "Completed",
                                            })
                                          }
                                          disabled={!canToggleSub}
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                            !canToggleSub ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                          } ${
                                            isSubCompleted
                                              ? "bg-emerald-500 border-emerald-500 text-white"
                                              : "border-slate-300 hover:border-blue-500 text-transparent hover:text-slate-400"
                                          }`}
                                        >
                                          <FiCheck size={10} />
                                        </button>
                                        <span className={`font-semibold text-slate-700 ${isSubCompleted ? "line-through text-slate-400" : ""}`}>
                                          {sub.title}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-4 text-[10px]">
                                        {/* Subtask Assignee */}
                                        <div className="flex items-center gap-1.5">
                                          <FiUser className="text-slate-400" size={12} />
                                          {isAdminOrManager ? (
                                            <select
                                              value={sub.assignedTo?._id || sub.assignedTo || ""}
                                              onChange={(e) =>
                                                handleSubtaskFieldChange(task, sub._id, {
                                                  assignedTo: e.target.value,
                                                })
                                              }
                                              className="bg-transparent border-0 font-medium text-slate-600 hover:bg-slate-100 p-0.5 rounded cursor-pointer focus:outline-none"
                                            >
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
                                        <div className="flex items-center gap-1.5">
                                          <FiCalendar className="text-slate-400" size={12} />
                                          {isAdminOrManager ? (
                                            <input
                                              type="date"
                                              value={sub.dueDate ? new Date(sub.dueDate).toISOString().split("T")[0] : ""}
                                              onChange={(e) =>
                                                handleSubtaskFieldChange(task, sub._id, {
                                                  dueDate: e.target.value,
                                                })
                                              }
                                              className="bg-transparent border-0 hover:bg-slate-100 p-0.5 rounded cursor-pointer focus:outline-none text-[10px] text-slate-500"
                                            />
                                          ) : (
                                            <span className="text-[10px] text-slate-500">
                                              {sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : "N/A"}
                                            </span>
                                          )}
                                        </div>

                                        {/* Delete Subtask */}
                                        {isAdminOrManager && (
                                          <button
                                            onClick={() => handleDeleteSubtask(task, sub._id)}
                                            className="text-slate-400 hover:text-red-500 p-0.5"
                                            title="Delete Subtask"
                                          >
                                            <FiTrash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Add Subtask Form */}
                                {isAdminOrManager && (
                                  <form
                                    onSubmit={(e) => handleAddSubtaskSubmit(e, task)}
                                    className="flex items-center gap-2 pt-1.5"
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
                                      className="w-full max-w-sm px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-[11px] text-slate-600"
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
                  })
                )}

                {/* Inline Add Task Row */}
                {isAdminOrManager && (
                  <tr className="bg-slate-50/10">
                    <td colSpan={4} className="px-6 py-4">
                      <form onSubmit={handleInlineTaskSubmit} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-300">
                          <FiPlus size={10} />
                        </div>
                        <input
                          id="inline-task-input"
                          type="text"
                          placeholder="Add task..."
                          value={inlineTaskTitle}
                          onChange={(e) => setInlineTaskTitle(e.target.value)}
                          className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs font-semibold text-slate-700 placeholder-slate-400"
                        />
                      </form>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: DEFAULT PROJECT DIRECTORY TABLE
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">All Projects</h1>
          <p className="text-slate-500 text-[10px] mt-1">Comprehensive directory of current projects and clients</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200"
          >
            <FiPlus size={18} />
            Create Project
          </button>
        )}
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {["All", "Active", "On Hold", "Completed", "Inactive"].map((status) => (
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
      </div>

      {/* TABLE VIEW OF PROJECTS */}
      {projectsLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <FiInfo size={40} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-700">No Projects Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try updating your filters or search options.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    onClick={() => navigate(`/${currentUser?.role}/projects?id=${project._id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-extrabold text-slate-800 group-hover:text-blue-600">
                      {project.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-600 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100">
                        {project.client?.companyName || "No Client"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-xl font-black text-slate-800">Add New Project</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Project Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Client Details</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 text-sm text-slate-700 cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 text-sm text-slate-700 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/10"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Project;