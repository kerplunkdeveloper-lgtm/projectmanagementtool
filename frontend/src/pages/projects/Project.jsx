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
  FiEdit2,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiCornerDownRight,
  FiBriefcase,
} from "react-icons/fi";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
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
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State for creating project
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Active");

  // Form State for editing project
  const [editProjectId, setEditProjectId] = useState("");
  const [editName, setEditName] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  // Interactive inline state
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean
  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState({}); // taskId -> string

  // Form State for creating task inline
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [draftTasks, setDraftTasks] = useState([]);
  const [activeAssigneeDropdownId, setActiveAssigneeDropdownId] = useState(null);

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

  // Handle Open Edit Modal
  const handleOpenEdit = (e, project) => {
    e.stopPropagation();
    setEditProjectId(project._id);
    setEditName(project.name);
    setEditClientId(project.client?._id || project.client || "");
    setEditStatus(project.status);
    setShowEditModal(true);
  };

  // Submit Edit Project
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editName || !editClientId) return;
    dispatch(
      updateProject({
        id: editProjectId,
        data: {
          name: editName,
          client: editClientId,
          status: editStatus,
        },
      })
    );
    setShowEditModal(false);
  };

  // Handle Delete Project
  const handleProjectDelete = (e, projectId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      dispatch(deleteProject(projectId));
    }
  };

  // Add Draft Task Row Inline in table
  const handleAddDraftTask = () => {
    const newDraft = {
      id: "draft_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      title: "",
      assignedTo: "",
      dueDate: "",
      priority: "Medium",
    };
    setDraftTasks((prev) => [...prev, newDraft]);
  };

  // Update a draft task's specific field
  const updateDraftField = (draftId, field, value) => {
    setDraftTasks((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, [field]: value } : d))
    );
  };

  // Discard a draft task
  const removeDraftTask = (draftId) => {
    setDraftTasks((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Save a draft task to database
  const saveDraftTask = async (draftId, autoCreateNext = false) => {
    const draft = draftTasks.find((d) => d.id === draftId);
    if (!draft || !draft.title.trim()) return;

    try {
      await dispatch(
        createTask({
          title: draft.title.trim(),
          description: "",
          project: activeProjectId,
          assignedTo: draft.assignedTo || null,
          dueDate: draft.dueDate || null,
          priority: draft.priority || "Medium",
          status: draft.status || "Pending",
        })
      ).unwrap();

      // Remove saved draft
      setDraftTasks((prev) => prev.filter((d) => d.id !== draftId));
      
      // Reload tasks
      dispatch(getTasks());

      if (autoCreateNext) {
        setTimeout(() => {
          handleAddDraftTask();
        }, 100);
      }
    } catch (err) {
      console.error("Failed to save draft task:", err);
    }
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
    const sanitizedFields = { ...fields };
    if (sanitizedFields.assignedTo === "") sanitizedFields.assignedTo = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;

    dispatch(updateTask({ id: taskId, taskData: sanitizedFields }));
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
      assignedTo: null,
      dueDate: null,
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* WORKSPACE HEADER & PROGRESS */}
        {(() => {
          const totalTasks = activeProjectTasks.length;
          const completedTasks = activeProjectTasks.filter((t) => t.status === "Completed").length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div>
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                      Client : {activeProject.client?.companyName || "No Client"}
                    </span>
                    <span className={`text-[8px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(activeProject.status)}`}>
                      {activeProject.status}
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-slate-800">{activeProject.name}</h1>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => navigate(`/${currentUser?.role}/projects`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200  text-slate-600 bg-blue-600 text-white font-bold text-xs transition-all w-fit"
                  >
                    <FiX size={16} />
                    Exit Workspace
                  </button>
                </div>

                </div>
              </div>

            
           
          );
        })()}

        {/* TASK MANAGEMENT BOARD TABLE */}
        <div className="overflow-hidden">
          <div className=" border-b border-slate-100 flex mb-5 items-center justify-between">
            {isAdminOrManager && (
              <button
                onClick={handleAddDraftTask}
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
                {activeProjectTasks.length === 0 && draftTasks.length === 0 ? (
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

                          {/* Priority Column */}
                          <td className="px-6 py-3.5">
                            {isAdminOrManager ? (
                              <select
                                value={task.priority || "Medium"}
                                onChange={(e) => handleTaskFieldChange(task._id, { priority: e.target.value })}
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
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                task.priority === "High"
                                  ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                  : task.priority === "Medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}>
                                {task.priority || "Medium"}
                              </span>
                            )}
                          </td>

                          {/* Status Column */}
                          <td className="px-6 py-3.5">
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
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                task.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                  : task.status === "In Progress"
                                  ? "bg-blue-50 text-blue-700 border-blue-200/50"
                                  : "bg-amber-50 text-amber-700 border-amber-200/50"
                              }`}>
                                {task.status || "Pending"}
                              </span>
                            )}
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
                            <td colSpan={6} className="pl-12 pr-6 py-3">
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
                  })}

                {/* Inline Draft Task Rows */}
                {draftTasks.map((draft, idx) => (
                  <tr key={draft.id} className="bg-white hover:bg-slate-50/30 transition-colors border-b border-slate-100">
                    {/* Name Column */}
                    <td className="px-6 py-3 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-350 flex-shrink-0">
                          <FiCheck size={11} className="opacity-0" />
                        </div>
                        <input
                          type="text"
                          placeholder={idx % 3 === 0 ? "e.g. Determine project goal" : idx % 3 === 1 ? "e.g. Schedule kickoff meeting" : "e.g. Set final deadline"}
                          value={draft.title}
                          onChange={(e) => updateDraftField(draft.id, "title", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveDraftTask(draft.id, true);
                            }
                          }}
                          className="bg-transparent border-0 focus:outline-none focus:ring-0 text-xs font-semibold text-slate-700 placeholder-slate-300 w-full p-0 min-w-[200px]"
                          autoFocus
                        />
                      </div>
                    </td>

                    {/* Assignee Column */}
                    <td className="px-6 py-3">
                      <div className="relative flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveAssigneeDropdownId(activeAssigneeDropdownId === draft.id ? null : draft.id)}
                          className="w-7 h-7 rounded-full border border-dashed border-slate-350 hover:border-blue-500 bg-white flex items-center justify-center cursor-pointer transition-all relative group"
                        >
                          {draft.assignedTo ? (
                            (() => {
                              const selectedUser = users.find((u) => u._id === draft.assignedTo);
                              if (selectedUser?.profileImage?.url) {
                                return (
                                  <img
                                    src={selectedUser.profileImage.url}
                                    alt={selectedUser.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                );
                              }
                              return (
                                <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold text-[8px] bg-gradient-to-br ${getAvatarColor(selectedUser?.name || "U")}`}>
                                  {selectedUser?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                                </div>
                              );
                            })()
                          ) : (
                            <FiUser className="text-slate-450 group-hover:hidden" size={12} />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-full opacity-0 group-hover:opacity-100 text-blue-600 font-extrabold text-xs transition-opacity pointer-events-none">
                            +
                          </span>
                        </button>

                        {activeAssigneeDropdownId === draft.id && (
                          <div className="absolute left-0 top-9 bg-white border border-slate-200 rounded-xl shadow-xl z-30 min-w-[180px] py-1.5 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              Assign Task To
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateDraftField(draft.id, "assignedTo", "");
                                setActiveAssigneeDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-semibold text-slate-500 flex items-center gap-2 border-b border-slate-50"
                            >
                              <div className="w-4 h-4 rounded-full border border-dashed border-slate-350 flex items-center justify-center text-slate-400 text-[10px]">
                                ✕
                              </div>
                              <span>Unassigned</span>
                            </button>
                            {users.map((u) => (
                              <button
                                key={u._id}
                                type="button"
                                onClick={() => {
                                  updateDraftField(draft.id, "assignedTo", u._id);
                                  setActiveAssigneeDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                              >
                                {u.profileImage?.url ? (
                                  <img src={u.profileImage.url} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br ${getAvatarColor(u.name)}`}>
                                    {u.name.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                )}
                                <span className="truncate">{u.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Due Date Column */}
                    <td className="px-6 py-3">
                      {draft.dueDate ? (
                        <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-150 bg-blue-50/50 text-[10px] font-extrabold text-blue-600 hover:bg-blue-50 transition-all cursor-pointer w-fit">
                          <FiCalendar size={11} />
                          <span>{new Date(draft.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                          <input
                            type="date"
                            value={draft.dueDate}
                            onChange={(e) => updateDraftField(draft.id, "dueDate", e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="relative w-7 h-7 rounded-full border border-dashed border-slate-350 hover:border-blue-500 bg-white flex items-center justify-center cursor-pointer transition-all">
                          <FiCalendar className="text-slate-450" size={12} />
                          <input
                            type="date"
                            value={draft.dueDate}
                            onChange={(e) => updateDraftField(draft.id, "dueDate", e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </td>

                    {/* Priority Column */}
                    <td className="px-6 py-3">
                      <select
                        value={draft.priority || "Medium"}
                        onChange={(e) => updateDraftField(draft.id, "priority", e.target.value)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                          draft.priority === "High"
                            ? "bg-rose-50 text-rose-700 border-rose-200/50"
                            : draft.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border-amber-200/50"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-3">
                      <select
                        value={draft.status || "Pending"}
                        onChange={(e) => updateDraftField(draft.id, "status", e.target.value)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                          draft.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                            : draft.status === "In Progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200/50"
                            : "bg-amber-50 text-amber-700 border-amber-200/50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => saveDraftTask(draft.id)}
                          className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-wider"
                          title="Save Task"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => removeDraftTask(draft.id)}
                          className="text-slate-450 hover:text-red-500 transition-colors p-1"
                          title="Cancel"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
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
    <div className=" space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">All Projects</h1>
          <p className="text-slate-500 text-[10px] mt-1">Comprehensive directory of current projects and clients</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200 shrink-0"
          >
            <FiPlus size={18} />
            Create Project
          </button>
        )}
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
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
        <div className="relative shrink-0 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-5 py-3 pr-11 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm md:min-w-[140px] transition-all"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <FiChevronDown size={14} />
          </div>
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
                <tr className="bg-slate-50 text-slate-505 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progress</th>
                  {isAdmin && <th className="px-6 py-4 text-center w-36">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    onClick={() => navigate(`/${currentUser?.role}/projects?id=${project._id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-extrabold text-slate-800">
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
                    <td className="px-6 py-4">
                      {(() => {
                        const projectTasks = tasks.filter((t) => t.project?._id === project._id || t.project === project._id);
                        const total = projectTasks.length;
                        const completed = projectTasks.filter((t) => t.status === "Completed").length;
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return (
                          <div className="flex flex-col gap-1.5 max-w-[160px]">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span>{completed}/{total} Tasks</span>
                              <span className="text-blue-600 font-extrabold">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full rounded-full transition-all duration-350"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            onClick={(e) => handleOpenEdit(e, project)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="Edit Project"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleProjectDelete(e, project._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Delete Project"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PROJECT OFFCANVAS DRAWER */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            {/* Side Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">Add New Project</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Project Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  {/* Client Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Status Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT PROJECT OFFCANVAS DRAWER */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            {/* Side Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">Edit Project</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Modify Settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  {/* Client Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={editClientId}
                        onChange={(e) => setEditClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Status Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    Save Changes
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