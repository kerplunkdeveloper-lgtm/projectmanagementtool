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
  FiList,
  FiGrid,
  FiTrendingUp,
  FiPieChart,
  FiMoreHorizontal,
  FiEdit2,
} from "react-icons/fi";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../features/tasks/taskSlice";
import { updateProject } from "../../features/projects/projectSlice";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};

// Task Title Input Component for autosaving inline without cursor jump
const TaskTitleInput = ({
  task,
  canToggle,
  handleTaskFieldChange,
  isCompleted,
}) => {
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
      className={`bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-400/50 w-full p-0 font-semibold text-slate-800 dark:text-slate-105 rounded px-1.5 py-0.5 ${
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 dark:bg-slate-900/50 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FiCornerDownRight className="text-slate-350 shrink-0" size={13} />
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
              : "border-slate-300 dark:border-slate-700 hover:border-blue-500 text-transparent hover:text-slate-400"
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
              handleSubtaskFieldChange(task, sub._id, {
                title: subTitle.trim(),
              });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.target.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-400/50 w-full p-0 font-medium text-slate-700 dark:text-slate-200 rounded px-1.5 py-0.5 text-xs ${
            isSubCompleted ? "line-through text-slate-400" : ""
          }`}
          disabled={!canToggleSub}
        />
      </div>

      <div
        className="flex items-center gap-3 shrink-0 text-[10px]"
        onClick={(e) => e.stopPropagation()}
      >
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
              className="bg-transparent border-0 font-medium text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 p-0.5 rounded cursor-pointer focus:outline-none"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-medium text-slate-600 dark:text-slate-400">
              {sub.assignedTo?.name || "Unassigned"}
            </span>
          )}
        </div>

        {/* Subtask Due Date */}
        <div className="flex items-center gap-1">
          {isAdminOrManager ? (
            <input
              type="date"
              value={
                sub.dueDate
                  ? new Date(sub.dueDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handleSubtaskFieldChange(task, sub._id, {
                  dueDate: e.target.value || null,
                })
              }
              className="bg-transparent border-0 hover:bg-slate-100 dark:hover:bg-slate-850 p-0.5 rounded cursor-pointer focus:outline-none text-[10px] text-slate-500 w-24"
            />
          ) : (
            <span className="text-[10px] text-slate-550 dark:text-slate-400">
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
  const [activeTab, setActiveTab] = useState("List"); // "List" | "Board" | "Timeline" | "Dashboard"
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean
  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState({}); // taskId -> string
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Live task ID for Drawer preview
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({}); // sectionName -> boolean
  const [openSectionMenu, setOpenSectionMenu] = useState(null); // sectionName
  const [editingSection, setEditingSection] = useState(null); // sectionName
  const [editSectionValue, setEditSectionValue] = useState("");

  const handleRenameSectionSubmit = (e, oldName) => {
    e.preventDefault();
    if (!editSectionValue.trim() || editSectionValue === oldName) {
      setEditingSection(null);
      return;
    }
    const newName = editSectionValue.trim();
    const currentSections = activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"];
    const updatedSections = currentSections.map(s => s === oldName ? newName : s);
    
    // Update project
    dispatch(updateProject({ id: activeProjectId, data: { sections: updatedSections } }));
    
    // Update all tasks in this section
    const tasksToUpdate = tasks.filter(t => t.section === oldName || (!t.section && oldName === "Recently assigned"));
    tasksToUpdate.forEach(t => {
      dispatch(updateTask({ id: t._id, taskData: { section: newName } }));
    });
    
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionName) => {
    if (window.confirm(`Are you sure you want to delete the section "${sectionName}" and ALL its tasks?`)) {
      const currentSections = activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"];
      const updatedSections = currentSections.filter(s => s !== sectionName);
      dispatch(updateProject({ id: activeProjectId, data: { sections: updatedSections } }));
      
      const tasksToDelete = tasks.filter(t => t.section === sectionName || (!t.section && sectionName === "Recently assigned"));
      tasksToDelete.forEach(t => {
        dispatch(deleteTask(t._id));
      });
    }
    setOpenSectionMenu(null);
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  // Add optimistic tasks state for dragging
  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Filter tasks for this project using localTasks for optimistic UI
  const activeProjectTasks = localTasks.filter(
    (t) => t.project?._id === activeProjectId || t.project === activeProjectId,
  );

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Optimistically update local UI
    const updatedTasks = localTasks.map((t) =>
      t._id === draggableId ? { ...t, section: destination.droppableId } : t,
    );
    setLocalTasks(updatedTasks);

    // Send to backend
    dispatch(
      updateTask({
        id: draggableId,
        taskData: { section: destination.droppableId },
      }),
    );
  };

  // Live selected task from Redux state
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  const handleAddSectionSubmit = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const currentSections = activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"];
    const updatedSections = [...currentSections, newSectionName.trim()];
    dispatch(
      updateProject({
        id: activeProjectId,
        data: { sections: updatedSections },
      })
    );
    setIsAddingSection(false);
    setNewSectionName("");
  };

  // Add Task directly to DB (autosave pattern)
  const handleAddTask = (sectionName = "Recently assigned") => {
    dispatch(
      createTask({
        title: "",
        project: activeProjectId,
        section: sectionName,
        assignedTo: null,
        dueDate: null,
        priority: "Medium",
        status: "Pending",
      }),
    );
    setTimeout(() => {
      dispatch(getTasks());
    }, 550);
  };

  // Add Task directly to DB with preselected status (Board view helper)
  const handleAddTaskWithStatus = (status) => {
    dispatch(
      createTask({
        title: "Add Task",
        project: activeProjectId,
        assignedTo: null,
        dueDate: null,
        priority: "Medium",
        status: status,
      }),
    );
    setTimeout(() => {
      dispatch(getTasks());
    }, 550);
  };

  // Update Task fields inline / autosave
  const handleTaskFieldChange = (taskId, fields) => {
    const sanitizedFields = { ...fields };
    if (sanitizedFields.assignedTo === "") sanitizedFields.assignedTo = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;

    dispatch(updateTask({ id: taskId, taskData: sanitizedFields }));
    setTimeout(() => {
      dispatch(getTasks());
    }, 550);
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
    dispatch(
      updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }),
    );
    setTimeout(() => {
      dispatch(getTasks());
    }, 550);
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
      sub._id === subtaskId ? { ...sub, ...sanitizedFields } : sub,
    );
    dispatch(
      updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }),
    );
    setTimeout(() => {
      dispatch(getTasks());
    }, 550);
  };

  // Delete Subtask
  const handleDeleteSubtask = (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.filter(
      (sub) => sub._id !== subtaskId,
    );
    dispatch(
      updateTask({ id: task._id, taskData: { subtasks: updatedSubtasks } }),
    );
    setTimeout(() => {
      dispatch(getTasks());
    }, 550);
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
      }, 550);
    }
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Dashboard calculations
  const totalTasks = activeProjectTasks.length;
  const completedTasks = activeProjectTasks.filter(
    (t) => t.status === "Completed",
  ).length;
  const incompleteTasks = activeProjectTasks.filter(
    (t) => t.status !== "Completed",
  ).length;

  // Overdue count calculation
  const overdueTasks = activeProjectTasks.filter((t) => {
    if (t.status === "Completed") return false;
    if (!t.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown of incomplete tasks for Bar Chart
  const pendingCount = activeProjectTasks.filter(
    (t) => t.status === "Pending",
  ).length;
  const inProgressCount = activeProjectTasks.filter(
    (t) => t.status === "In Progress",
  ).length;
  const onHoldCount = activeProjectTasks.filter(
    (t) => t.status === "On Hold",
  ).length;

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
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-[#e5ff00] rounded-xl focus:outline-none text-[11px] text-slate-700 dark:text-slate-300 transition-all font-semibold"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-700 dark:hover:bg-[#ccff00] text-white dark:text-black font-extrabold rounded-xl text-[10px] transition-colors shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/20 active:scale-95"
        >
          Add
        </button>
      </form>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative">
      {/* WORKSPACE HEADER & PROGRESS */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
          <div className="space-y-2 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-blue-550/10 dark:bg-[#e5ff00]/10 text-blue-600 dark:text-[#e5ff00] border border-blue-100 dark:border-[#e5ff00]/20 uppercase tracking-wide">
                Client : {activeProject.client?.companyName || "No Client"}
              </span>
              <span
                className={`text-[8px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(
                  activeProject.status,
                )}`}
              >
                {activeProject.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white truncate">
              {activeProject.name}
            </h1>
          </div>

          <div className="pt-1 w-full md:w-auto">
            <button
              onClick={() => navigate(`/${currentUser?.role}/projects`)}
              className="flex items-center justify-center w-full md:w-auto gap-2 px-4 py-2 font-bold text-xs rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111111] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#1a1a1a] shadow-sm transition-all"
            >
              <FiX size={16} />
              Exit Workspace
            </button>
          </div>
        </div>
      </div>

      {/* TAB SELECTOR - PREMIUM PILL DESIGN */}
      <div className="flex justify-center sm:justify-start mt-6 mb-2 overflow-hidden">
        <div className="bg-slate-100/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1 w-full overflow-x-auto hide-scrollbar sm:w-fit border border-slate-200/50 dark:border-white/5 shadow-inner">
          {["List", "Board", "Timeline", "Dashboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 rounded-xl shrink-0 ${
                activeTab === tab
                  ? "text-blue-600 dark:text-[#e5ff00] shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeWorkspaceTabPill"
                  className="absolute inset-0 bg-white dark:bg-[#111111] border border-transparent dark:border-[#e5ff00]/30 rounded-xl dark:shadow-[0_0_15px_rgba(229,255,0,0.15)]"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                {tab === "List" && <FiList size={14} className="shrink-0" />}
                {tab === "Board" && <FiGrid size={14} className="shrink-0" />}
                {tab === "Timeline" && <FiTrendingUp size={14} className="shrink-0" />}
                {tab === "Dashboard" && <FiPieChart size={14} className="shrink-0" />}
                <span>{tab}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[400px]">
        {activeTab === "List" && (
          <div className="overflow-hidden">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">
                Tasks List
              </h3>
              {isAdminOrManager && (
                <button
                  onClick={() => handleAddTask()}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] rounded-xl bg-blue-600 dark:bg-[#e5ff00] text-white dark:text-black shadow-lg shadow-blue-500/20 dark:shadow-[#e5ff00]/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 font-black uppercase tracking-wider"
                >
                  <FiPlus size={14} />
                  Add Task
                </button>
              )}
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#111111] rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-[#0a0a0a]/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap min-w-[240px]">Name</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap min-w-[140px]">Assignee</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap min-w-[120px]">Due Date</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap min-w-[120px]">Priority</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap min-w-[120px]">Status</th>
                    <th className="px-4 sm:px-6 py-3.5 text-center whitespace-nowrap min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {Array.from(new Set(activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"])).map((sectionName, sectionIndex) => {
                    const sectionTasks = activeProjectTasks.filter(
                      (t) => t.section === sectionName || (!t.section && sectionName === "Recently assigned")
                    );
                    const isSectionCollapsed = !!collapsedSections[sectionName];

                    return (
                      <React.Fragment key={`${sectionName}-${sectionIndex}`}>
                        {/* SECTION HEADER ROW */}
                        <tr className="bg-slate-50/80 dark:bg-[#1a1a1a]/40 border-y border-slate-200 dark:border-white/5 group">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSection(sectionName)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                  {isSectionCollapsed ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
                                </button>
                                {editingSection === sectionName ? (
                                  <form onSubmit={(e) => handleRenameSectionSubmit(e, sectionName)} className="ml-1">
                                    <input 
                                      autoFocus
                                      value={editSectionValue}
                                      onChange={e => setEditSectionValue(e.target.value)}
                                      onBlur={(e) => handleRenameSectionSubmit(e, sectionName)}
                                      className="text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 border border-blue-400 rounded px-2 py-0.5 outline-none"
                                    />
                                  </form>
                                ) : (
                                  <h3 
                                    className="font-black text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                                    onClick={() => toggleSection(sectionName)}
                                  >
                                    {sectionName} <span className="text-slate-400 font-medium ml-2">({sectionTasks.length})</span>
                                  </h3>
                                )}
                              </div>
                              {isAdminOrManager && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <button
                                    onClick={() => handleAddTask(sectionName)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-[#e5ff00] hover:text-blue-700 dark:hover:text-[#ccff00]"
                                  >
                                    <FiPlus size={12} /> Add Task
                                  </button>
                                  
                                  <div className="relative">
                                    <button 
                                      onClick={() => setOpenSectionMenu(openSectionMenu === sectionName ? null : sectionName)}
                                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-white/10"
                                    >
                                      <FiMoreHorizontal size={14} />
                                    </button>
                                    
                                    {openSectionMenu === sectionName && (
                                      <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-slate-100 dark:border-white/10 z-50 overflow-hidden">
                                        <button 
                                          onClick={() => { setEditingSection(sectionName); setEditSectionValue(sectionName); setOpenSectionMenu(null); }}
                                          className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                        >
                                          <FiEdit2 size={12} /> Rename
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteSection(sectionName)}
                                          className="w-full text-left px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                                        >
                                          <FiTrash2 size={12} /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* SECTION TASKS */}
                        {!isSectionCollapsed && (
                          sectionTasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic text-[10px]">
                              No tasks in this section.
                            </td>
                          </tr>
                        ) : (
                          sectionTasks.map((task) => {
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
                              className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer ${
                                isCompleted
                                  ? "bg-slate-50/30 text-slate-400 dark:text-slate-500"
                                  : "text-slate-800 dark:text-slate-100"
                              } ${selectedTaskId === task._id ? "bg-blue-50/40 dark:bg-[#e5ff00]/10" : ""}`}
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
                                          status: isCompleted
                                            ? "Pending"
                                            : "Completed",
                                        });
                                      }
                                    }}
                                    disabled={!canToggle}
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                      !canToggle
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer"
                                    } ${
                                      isCompleted
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "border-slate-300 dark:border-white/10 hover:border-blue-500 dark:hover:border-[#e5ff00] text-transparent hover:text-slate-400 dark:hover:text-[#e5ff00]"
                                    }`}
                                  >
                                    <FiCheck size={12} />
                                  </button>

                                  {/* Task Title Input */}
                                  <div className="flex-1">
                                    <TaskTitleInput
                                      task={task}
                                      canToggle={canToggle}
                                      handleTaskFieldChange={
                                        handleTaskFieldChange
                                      }
                                      isCompleted={isCompleted}
                                    />
                                  </div>

                                  {/* Subtask Expander Toggle */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskExpanded(task._id);
                                    }}
                                    className="text-slate-450 hover:text-blue-600 dark:hover:text-[#e5ff00] flex items-center gap-0.5 ml-2 text-[10px] font-extrabold shrink-0 uppercase tracking-wider"
                                  >
                                    {isExpanded ? (
                                      <FiChevronDown size={14} />
                                    ) : (
                                      <FiChevronRight size={14} />
                                    )}
                                    <span>
                                      Subtasks ({task.subtasks?.length || 0})
                                    </span>
                                  </button>
                                </div>
                              </td>

                              {/* Assignee Selection */}
                              <td className="px-6 py-3.5">
                                <div
                                  className="flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {task.assignedTo?.profileImage?.url ? (
                                    <img
                                      src={task.assignedTo.profileImage.url}
                                      alt={task.assignedTo.name}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                                    />
                                  ) : (
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] bg-gradient-to-br ${getAvatarColor(
                                        task.assignedTo?.name || "Unknown",
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
                                      value={
                                        task.assignedTo?._id ||
                                        task.assignedTo ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleTaskFieldChange(task._id, {
                                          assignedTo: e.target.value,
                                        })
                                      }
                                      className="bg-transparent border-0 font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-105 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                                    >
                                      <option value="">Unassigned</option>
                                      {users.map((u) => (
                                        <option key={u._id} value={u._id}>
                                          {u.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="font-semibold text-slate-750 dark:text-slate-350 px-1 py-0.5">
                                      {task.assignedTo?.name || "Unassigned"}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Due Date */}
                              <td className="px-6 py-3.5">
                                <div
                                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FiCalendar
                                    size={13}
                                    className="text-slate-400"
                                  />
                                  {isAdminOrManager ? (
                                    <input
                                      type="date"
                                      value={
                                        task.dueDate
                                          ? new Date(task.dueDate)
                                              .toISOString()
                                              .split("T")[0]
                                          : ""
                                      }
                                      onChange={(e) =>
                                        handleTaskFieldChange(task._id, {
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="bg-transparent border-0 hover:bg-slate-105 px-1 py-0.5 rounded cursor-pointer focus:outline-none text-xs text-slate-655 dark:text-slate-300"
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                      {task.dueDate
                                        ? new Date(
                                            task.dueDate,
                                          ).toLocaleDateString()
                                        : "N/A"}
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
                                        handleTaskFieldChange(task._id, {
                                          priority: e.target.value,
                                        })
                                      }
                                      className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                                        task.priority === "High"
                                          ? "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-800/40"
                                          : task.priority === "Medium"
                                            ? "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-800/40"
                                            : "bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-850 dark:text-slate-350 dark:border-slate-750"
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
                                      onChange={(e) =>
                                        handleTaskFieldChange(task._id, {
                                          status: e.target.value,
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                                        task.status === "Completed"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40"
                                          : task.status === "In Progress"
                                            ? "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-[#e5ff00]/10 dark:text-[#e5ff00] dark:border-[#e5ff00]/30"
                                            : "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-800/40"
                                      }`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">
                                        In Progress
                                      </option>
                                      <option value="Completed">
                                        Completed
                                      </option>
                                      <option value="On Hold">On Hold</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                        task.status === "Completed"
                                          ? "bg-emerald-55/10 text-emerald-600 border-emerald-200"
                                          : task.status === "In Progress"
                                            ? "bg-blue-55/10 text-blue-600 border-blue-200"
                                            : "bg-amber-55/10 text-amber-600 border-amber-200"
                                      }`}
                                    >
                                      {task.status || "Pending"}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Action Controls */}
                              <td className="px-6 py-3.5 text-center">
                                <div
                                  className="flex items-center justify-center gap-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {isAdminOrManager && (
                                    <button
                                      onClick={() =>
                                        toggleTaskExpanded(task._id)
                                      }
                                      className="text-slate-450 hover:text-indigo-600 font-extrabold text-[10px] uppercase tracking-wider"
                                      title="Manage Subtasks"
                                    >
                                      + Subtask
                                    </button>
                                  )}
                                  {isAdminOrManager && (
                                    <button
                                      onClick={() =>
                                        handleParentTaskDelete(task._id)
                                      }
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
                              <tr className="bg-slate-50/20 dark:bg-slate-900/10">
                                <td colSpan={6} className="pl-12 pr-6 py-3">
                                  <div className="space-y-2.5 border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-1">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                      Subtasks List
                                    </h4>

                                    {/* List existing subtasks */}
                                    {(task.subtasks || []).map((sub) => (
                                      <SubtaskRow
                                        key={sub._id}
                                        sub={sub}
                                        task={task}
                                        users={users}
                                        getAvatarColor={getAvatarColor}
                                        handleSubtaskFieldChange={
                                          handleSubtaskFieldChange
                                        }
                                        handleDeleteSubtask={
                                          handleDeleteSubtask
                                        }
                                        isAdminOrManager={isAdminOrManager}
                                        currentUser={currentUser}
                                      />
                                    ))}

                                    {/* Inline Add Subtask Form */}
                                    {isAdminOrManager && (
                                      <form
                                        onSubmit={(e) =>
                                          handleInlineAddSubtaskSubmit(e, task)
                                        }
                                        className="flex items-center gap-2 pt-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FiCornerDownRight
                                          className="text-slate-350"
                                          size={13}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Add subtask and press enter..."
                                          value={
                                            inlineSubtaskTitle[task._id] || ""
                                          }
                                          onChange={(e) =>
                                            setInlineSubtaskTitle((prev) => ({
                                              ...prev,
                                              [task._id]: e.target.value,
                                            }))
                                          }
                                          className="w-full max-w-sm px-3.5 py-1.5 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-[#e5ff00] rounded-xl focus:outline-none text-[11px] text-slate-655 dark:text-slate-300 font-semibold transition-colors"
                                        />
                                        <button
                                          type="submit"
                                          className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-[10px] font-bold transition-colors"
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
                      ))}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* ADD SECTION ROW */}
                  {isAdminOrManager && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 border-t-2 border-slate-100 dark:border-white/5">
                        {isAddingSection ? (
                          <form onSubmit={handleAddSectionSubmit} className="flex items-center gap-2">
                             <input type="text" autoFocus value={newSectionName} onChange={e=>setNewSectionName(e.target.value)} placeholder="New section name..." className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] text-slate-700 dark:text-white" />
                             <button type="submit" className="px-3 py-1.5 bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-700 dark:hover:bg-[#ccff00] text-white dark:text-black font-bold text-[10px] rounded-lg">Save</button>
                             <button type="button" onClick={()=>{setIsAddingSection(false); setNewSectionName("");}} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-[10px] rounded-lg">Cancel</button>
                          </form>
                        ) : (
                          <button onClick={()=>setIsAddingSection(true)} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#e5ff00] font-bold text-[11px] transition-colors">
                             <FiPlus size={14} /> Add Section
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Board" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">
                  Board
                </h3>
              </div>

              {/* Board Columns Grid */}
              <div className="flex gap-4 items-start overflow-x-auto pb-4 hide-scrollbar snap-x">
                {Array.from(new Set(activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"])).map(
                  (sectionName) => {
                    const columnTasks = activeProjectTasks.filter(
                      (t) => t.section === sectionName || (!t.section && sectionName === "Recently assigned"),
                    );

                    return (
                      <div
                        key={sectionName}
                        className="bg-slate-50/80 dark:bg-[#1a1a1a]/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col min-h-[380px] max-h-[700px] min-w-[280px] sm:min-w-[320px] snap-center shrink-0"
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white">
                              {sectionName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {columnTasks.length}
                          </span>
                        </div>

                        {/* Cards Container */}
                        <StrictModeDroppable droppableId={sectionName}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin rounded-xl p-1 transition-colors ${
                                snapshot.isDraggingOver
                                  ? "bg-slate-100/50 dark:bg-white/5 ring-1 ring-blue-400/30 dark:ring-[#e5ff00]/30"
                                  : ""
                              }`}
                            >
                              {columnTasks.map((task, index) => {
                                const isCompleted = task.status === "Completed";
                                return (
                                  <Draggable
                                    key={task._id}
                                    draggableId={task._id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={provided.draggableProps.style}
                                        onClick={() =>
                                          setSelectedTaskId(task._id)
                                        }
                                        className={`bg-white dark:bg-[#111111] p-3.5 rounded-xl border cursor-pointer space-y-3 relative group select-none ${
                                          snapshot.isDragging
                                            ? "shadow-2xl ring-2 ring-blue-500 dark:ring-[#e5ff00] scale-[1.03] z-50 border-blue-300 dark:border-[#e5ff00]"
                                            : "border-slate-150 dark:border-white/5 hover:shadow-md hover:border-slate-200 dark:hover:border-[#e5ff00]/50 transition-shadow transition-colors"
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          {/* Status Checkbox */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTaskFieldChange(task._id, {
                                                status: isCompleted
                                                  ? "Pending"
                                                  : "Completed",
                                              });
                                            }}
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                              isCompleted
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "border-slate-350 dark:border-white/10 hover:border-blue-500 dark:hover:border-[#e5ff00] text-transparent hover:text-slate-400 dark:hover:text-[#e5ff00]"
                                            }`}
                                          >
                                            <FiCheck size={10} />
                                          </button>

                                          {/* Title */}
                                          <span
                                            className={`text-xs font-bold leading-relaxed text-slate-850 dark:text-white pr-6 ${
                                              isCompleted
                                                ? "line-through text-slate-400 dark:text-slate-500"
                                                : ""
                                            }`}
                                          >
                                            {task.title}
                                          </span>
                                        </div>

                                        {/* Board Card Extra Data: Tags / Status */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-3">
                                          {/* Status Badge */}
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                                            task.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40" :
                                            task.status === "In Progress" ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-[#e5ff00]/10 dark:text-[#e5ff00] dark:border-[#e5ff00]/30" :
                                            task.status === "On Hold" ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40" :
                                            "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                                          }`}>
                                            {task.status || "Pending"}
                                          </span>

                                          {/* Priority Badge */}
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                                            task.priority === "High" ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40" :
                                            task.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40" :
                                            "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#1a1a1a] dark:text-slate-400 dark:border-white/5"
                                          }`}>
                                            {task.priority || "Medium"}
                                          </span>

                                          {/* Due Date */}
                                          {task.dueDate && (
                                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 dark:bg-[#1a1a1a] dark:border-white/10 dark:text-slate-400">
                                              <FiCalendar size={9} />
                                              {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                          )}
                                        </div>

                                        {/* Delete Action (visible on hover) */}
                                        {isAdminOrManager && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); if(window.confirm('Are you sure you want to delete this task?')) dispatch(deleteTask(task._id)); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50"
                                          >
                                            <FiTrash2 size={12} />
                                          </button>
                                        )}

                                        {/* Card Footer: Assignee */}
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                                          <div
                                            className="flex items-center gap-1.5 pt-1.5"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {/* Assignee Avatar */}
                                            {task.assignedTo ? (
                                              task.assignedTo.profileImage
                                                ?.url ? (
                                                <img
                                                  src={
                                                    task.assignedTo.profileImage
                                                      .url
                                                  }
                                                  alt={task.assignedTo.name}
                                                  className="w-5 h-5 rounded-full object-cover"
                                                  title={task.assignedTo.name}
                                                />
                                              ) : (
                                                <div
                                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black bg-gradient-to-br ${getAvatarColor(
                                                    task.assignedTo.name,
                                                  )}`}
                                                  title={task.assignedTo.name}
                                                >
                                                  {task.assignedTo.name
                                                    ?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("") || "U"}
                                                </div>
                                              )
                                            ) : (
                                              <div
                                                className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400"
                                                title="Unassigned"
                                              >
                                                <FiUser size={10} />
                                              </div>
                                            )}

                                            {isAdminOrManager && (
                                              <select
                                                value={
                                                  task.assignedTo?._id ||
                                                  task.assignedTo ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  handleTaskFieldChange(
                                                    task._id,
                                                    {
                                                      assignedTo:
                                                        e.target.value,
                                                    },
                                                  )
                                                }
                                                className="bg-transparent border-0 text-[10px] font-semibold text-slate-500 hover:text-slate-750 px-1 py-0.5 rounded cursor-pointer focus:outline-none"
                                              >
                                                <option value="">
                                                  Unassigned
                                                </option>
                                                {users.map((u) => (
                                                  <option
                                                    key={u._id}
                                                    value={u._id}
                                                  >
                                                    {u.name}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </StrictModeDroppable>

                        {/* Column Add Task Button */}
                        {isAdminOrManager && (
                          <button
                            onClick={() => handleAddTask(sectionName)}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-[#e5ff00] hover:bg-white dark:hover:bg-white/5 transition-colors font-bold text-xs"
                          >
                            <FiPlus size={14} />
                            Add task
                          </button>
                        )}
                      </div>
                    );
                  },
                )}

                {/* Add Section Column */}
                {isAdminOrManager && (
                  <div className="min-w-[280px] sm:min-w-[320px] snap-center shrink-0">
                    {isAddingSection ? (
                      <form onSubmit={handleAddSectionSubmit} className="bg-slate-50/80 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col gap-2">
                         <input type="text" autoFocus value={newSectionName} onChange={e=>setNewSectionName(e.target.value)} placeholder="New section name..." className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#111111] text-slate-700 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00]" />
                         <div className="flex gap-2">
                           <button type="submit" className="w-full py-1.5 bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-700 dark:hover:bg-[#ccff00] text-white dark:text-black font-bold text-[10px] rounded-lg">Save</button>
                           <button type="button" onClick={()=>{setIsAddingSection(false); setNewSectionName("");}} className="w-full py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-[10px] rounded-lg border border-slate-200 dark:border-white/10">Cancel</button>
                         </div>
                      </form>
                    ) : (
                      <button onClick={()=>setIsAddingSection(true)} className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#e5ff00] font-bold text-[13px] transition-colors w-full h-[60px] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5">
                         <FiPlus size={16} /> Add Section
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DragDropContext>
        )}

        {activeTab === "Timeline" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
               <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 shadow-sm">
                 <FiPlus size={12}/> Add task <FiChevronDown size={12} className="ml-1"/>
               </button>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <FiChevronRight className="rotate-180 cursor-pointer hover:text-slate-900 dark:hover:text-white" size={14} />
                  <span>Today</span>
                  <FiChevronRight className="cursor-pointer hover:text-slate-900 dark:hover:text-white" size={14} />
               </div>
            </div>

            <div className="flex border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111111] min-h-[500px]">
              {/* Timeline Left Sidebar (Sections) */}
              <div className="w-[200px] sm:w-[240px] border-r border-slate-200 dark:border-white/5 shrink-0 flex flex-col bg-white dark:bg-[#1a1a1a] z-10 pt-[46px]">
                {Array.from(new Set(activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"])).map((sectionName) => (
                  <React.Fragment key={sectionName}>
                    <div className="border-b border-slate-200 dark:border-white/5 h-10 flex items-center justify-between px-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-700 dark:text-slate-300">
                         <FiChevronDown size={14} className="text-slate-500" />
                         <span className="truncate">{sectionName}</span>
                      </div>
                      {isAdminOrManager && (
                        <button onClick={(e) => { e.stopPropagation(); handleAddTask(sectionName); }} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-[#e5ff00] rounded text-slate-400 transition-colors">
                           <FiPlus size={12} />
                        </button>
                      )}
                    </div>
                    {/* Render tasks under section in sidebar */}
                    {activeProjectTasks.filter(t => (t.section === sectionName || (!t.section && sectionName === "Recently assigned"))).map(task => (
                      <div key={`sidebar-${task._id}`} onClick={() => setSelectedTaskId(task._id)} className="border-b border-slate-100 dark:border-white/5 h-8 flex items-center px-3 pl-8 hover:bg-blue-50 dark:hover:bg-white/5 cursor-pointer">
                         <span className="truncate text-[10px] font-bold text-slate-600 dark:text-slate-400">{task.title}</span>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
                {isAdminOrManager && (
                  <div className="py-3 px-3 h-10 flex items-center">
                    <button onClick={()=>setIsAddingSection(true)} className="flex items-center gap-2 text-[11px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-[#e5ff00] transition-colors">
                      <FiPlus size={12} /> Add section
                    </button>
                  </div>
                )}
              </div>
              
              {/* Timeline Right Grid Area */}
              <div className="flex-1 overflow-x-auto relative hide-scrollbar">
                 {/* Timeline Header (Months & Weeks) */}
                 <div className="flex flex-col border-b border-slate-200 dark:border-white/5 min-w-[800px] bg-white dark:bg-[#1a1a1a] sticky top-0 z-20">
                    <div className="flex h-5 items-center">
                       <div className="w-1/2 px-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">May <span className="ml-2">June</span></div>
                    </div>
                    <div className="flex border-t border-slate-200 dark:border-white/5 h-6">
                       <div className="w-1/4 px-2 text-[10px] flex items-center font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-white/5 bg-[#f9f9f9] dark:bg-[#111111]">W23 <span className="ml-2">May 31 - 6</span></div>
                       <div className="w-1/4 px-2 text-[10px] flex items-center font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-white/5 bg-[#f9f9f9] dark:bg-[#111111]">W24 <span className="ml-2">7 - 13</span></div>
                       <div className="w-1/4 px-2 text-[10px] flex items-center font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-white/5 bg-[#f9f9f9] dark:bg-[#111111]">W25 <span className="ml-2">14 - 20</span></div>
                       <div className="w-1/4 px-2 text-[10px] flex items-center font-medium text-slate-500 dark:text-slate-400 bg-[#f9f9f9] dark:bg-[#111111]">W26 <span className="ml-2">21 - 27</span></div>
                    </div>
                 </div>
                 
                 {/* Timeline Body (Grid) */}
                 <div className="relative min-w-[800px] h-full w-full">
                    {/* Background grid */}
                    <div className="absolute inset-0 flex w-full pointer-events-none">
                      {[...Array(28)].map((_, i) => (
                        <div key={i} className={`flex-1 border-r border-slate-200 dark:border-white/5 h-full ${[5,6,12,13,19,20,26,27].includes(i) ? 'bg-slate-100/50 dark:bg-white/5' : ''}`} />
                      ))}
                    </div>

                    {/* Task Rows mapped parallel to sections */}
                    <div className="relative z-10 w-full flex flex-col pb-20">
                      {Array.from(new Set(activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"])).map((sectionName) => (
                        <React.Fragment key={`grid-${sectionName}`}>
                          <div className="h-10 border-b border-slate-200 dark:border-white/5 w-full" />
                          {activeProjectTasks.filter(t => (t.section === sectionName || (!t.section && sectionName === "Recently assigned"))).map(task => {
                             // Dynamic simulated positioning logic based on task ID for robust Gantt display without full D3/date engines
                             const hash = task._id ? task._id.charCodeAt(task._id.length - 1) % 20 : 0; 
                             const width = task._id ? 3 + (task._id.charCodeAt(task._id.length - 2) % 4) : 4;
                             
                             return (
                              <div key={`grid-task-${task._id}`} className="h-8 border-b border-slate-100 dark:border-white/5 w-full relative group">
                                <div 
                                  onClick={() => setSelectedTaskId(task._id)}
                                  style={{ left: `${(hash / 28) * 100}%`, width: `${(width / 28) * 100}%` }}
                                  className={`absolute top-1.5 h-5 rounded shadow-sm text-[9px] font-bold text-white px-1.5 flex items-center truncate cursor-pointer transition-transform hover:scale-[1.02] hover:brightness-110 ${
                                    task.status === 'Completed' ? 'bg-emerald-500' :
                                    task.status === 'In Progress' ? 'bg-blue-500' :
                                    task.status === 'On Hold' ? 'bg-amber-500' : 'bg-slate-400'
                                  }`}
                                >
                                  {task.title}
                                </div>
                                {isAdminOrManager && (
                                  <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this task?')) dispatch(deleteTask(task._id)); }} className="absolute right-4 top-1.5 opacity-0 group-hover:opacity-100 text-rose-500 p-1 bg-white dark:bg-[#111111] rounded z-20 hover:bg-rose-50 dark:hover:bg-white/5 border border-rose-100 dark:border-white/10 shadow-sm transition-opacity">
                                    <FiTrash2 size={10} />
                                  </button>
                                )}
                              </div>
                             )
                          })}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Today Line */}
                    <div className="absolute top-0 bottom-0 left-[35.7%] w-px bg-[#4f46e5] z-10 pointer-events-none" />
                    <div className="absolute -top-1 left-[35.7%] -translate-x-1/2 w-2 h-2 rounded-full bg-[#4f46e5] z-10 pointer-events-none" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Dashboard" && (
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">
              Dashboard Metrics
            </h3>

            {/* Stats Cards Grid - Premium Gradients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Total Completed */}
              <div className="relative overflow-hidden p-5 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#111111] border-slate-200 dark:border-white/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total completed tasks
                  </h4>
                  <div className="text-4xl font-black mt-4 drop-shadow-sm text-emerald-500 dark:text-emerald-400">
                    {completedTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> 1 Filter
                </div>
              </div>

              {/* Card 2: Total Incomplete */}
              <div className="relative overflow-hidden p-5 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#111111] border-slate-200 dark:border-white/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 dark:bg-[#e5ff00] rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total incomplete tasks
                  </h4>
                  <div className="text-4xl font-black mt-4 drop-shadow-sm text-blue-500 dark:text-[#e5ff00]">
                    {incompleteTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> 1 Filter
                </div>
              </div>

              {/* Card 3: Total Overdue */}
              <div className="relative overflow-hidden p-5 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#111111] border-slate-200 dark:border-white/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total overdue tasks
                  </h4>
                  <div className="text-4xl font-black mt-4 drop-shadow-sm text-rose-500 dark:text-rose-400">
                    {overdueTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> 1 Filter
                </div>
              </div>

              {/* Card 4: Total Tasks */}
              <div className="relative overflow-hidden p-5 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#111111] border-slate-200 dark:border-white/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-10"></div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total tasks
                  </h4>
                  <div className="text-4xl font-black mt-4 drop-shadow-sm text-slate-700 dark:text-white">
                    {totalTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> No Filters
                </div>
              </div>
            </div>

            {/* Reports Charts Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Chart 1: Total incomplete tasks by section (Status Breakdown) */}
              <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-[0_0_20px_rgba(229,255,0,0.05)] flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-200 dark:hover:border-[#e5ff00]/30">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-8">
                  Total incomplete tasks by section
                </h4>

                {/* Custom SVG Bar Chart */}
                <div className="flex-1 min-h-[220px] flex items-end justify-around pb-6 border-b border-slate-100 dark:border-white/5 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 opacity-30">
                    <div className="border-b border-slate-200 dark:border-white/10 w-full border-dashed" />
                    <div className="border-b border-slate-200 dark:border-white/10 w-full border-dashed" />
                    <div className="border-b border-slate-200 dark:border-white/10 w-full border-dashed" />
                  </div>

                  {/* Dynamic Section Bars */}
                  {Array.from(new Set(activeProject.sections?.length > 0 ? activeProject.sections : ["Recently assigned"])).map((sectionName, index) => {
                    const sectionIncompleteCount = activeProjectTasks.filter(
                      (t) => (t.section === sectionName || (!t.section && sectionName === "Recently assigned")) && t.status !== "Completed"
                    ).length;

                    return (
                      <div key={sectionName} className="flex flex-col items-center gap-2 z-10 w-16 group cursor-default shrink-0">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          {sectionIncompleteCount}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{
                            height: `${totalTasks > 0 ? Math.max((sectionIncompleteCount / totalTasks) * 140, 2) : 2}px`,
                          }}
                          transition={{ delay: index * 0.1 }}
                          className="w-10 rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400 dark:from-[#99cc00] dark:to-[#e5ff00] shadow-[0_0_15px_rgba(56,189,248,0.3)] dark:shadow-[0_0_15px_rgba(229,255,0,0.3)] transition-all duration-300 group-hover:brightness-125"
                        />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider pt-1 -rotate-45 origin-top-left mt-6 truncate w-16 text-right">
                          {sectionName.length > 10 ? sectionName.substring(0,10)+'...' : sectionName}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider pt-4 flex items-center justify-between">
                  <span>2 Filters Active</span>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-blue-600 dark:text-[#e5ff00] hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm">
                    View Details
                  </button>
                </div>
              </div>

              {/* Chart 2: Total tasks by completion status (Donut Chart) */}
              <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-[0_0_20px_rgba(229,255,0,0.05)] flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-200 dark:hover:border-[#e5ff00]/30">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-6">
                  Total tasks by completion status
                </h4>

                <div className="flex-1 flex items-center justify-center gap-10 py-4 border-b border-slate-100 dark:border-white/5">
                  {/* SVG Donut Chart */}
                  <div className="relative w-36 h-36 flex items-center justify-center filter drop-shadow-md">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      {/* Background circle */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="rgba(226, 232, 240, 0.4)" // Light slate for track
                        className="dark:stroke-white/5"
                        strokeWidth="3.5"
                      />
                      {/* Foreground Circle (Incomplete) */}
                      {totalTasks > 0 && (
                        <motion.circle
                          initial={{ strokeDasharray: `0 100` }}
                          animate={{
                            strokeDasharray: `${(incompleteTasks / totalTasks) * 100} ${100 - (incompleteTasks / totalTasks) * 100}`,
                          }}
                          transition={{
                            type: "tween",
                            ease: "easeOut",
                            duration: 1.5,
                          }}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="url(#gradientDonut)" // Premium gradient
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Define Gradients */}
                      <defs>
                        <linearGradient
                          id="gradientDonut"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#8b5cf6" className="dark:stop-color-[#99cc00]" />{" "}
                          {/* Violet 500 / Lime */}
                          <stop offset="100%" stopColor="#ec4899" className="dark:stop-color-[#e5ff00]" />{" "}
                          {/* Pink 500 / Neon Lime */}
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Middle Text */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-violet-600 to-pink-500 dark:from-[#99cc00] dark:to-[#e5ff00] drop-shadow-sm">
                        {incompleteTasks}
                      </span>
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-1">
                        Remaining
                      </span>
                    </motion.div>
                  </div>

                  {/* Legend details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 dark:from-[#99cc00] dark:to-[#e5ff00] shadow-sm shadow-violet-500/40 dark:shadow-[#e5ff00]/40 shrink-0" />
                      <div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Incomplete
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {incompleteTasks} Tasks
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/5 shadow-sm shrink-0 border border-slate-300 dark:border-white/10" />
                      <div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Completed
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {completedTasks} Tasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider pt-4 flex items-center justify-between">
                  <span>1 Filter Active</span>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-blue-600 dark:text-[#e5ff00] hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
              className="absolute inset-0 bg-[#111111]/70 backdrop-blur-sm"
            />

            {/* Side Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#111111] h-full shadow-2xl flex flex-col z-10 border-l border-slate-100 dark:border-white/5"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/20 flex items-center justify-center text-blue-600 dark:text-[#e5ff00] shadow-sm shrink-0">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Task Workspace Preview
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Real-time Editing & Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title Section (Autosaves on blur/enter) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Task Title
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-150 dark:border-white/10 rounded-xl focus-within:bg-white dark:focus-within:bg-[#111111] focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-[#e5ff00] transition-all">
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
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-[#0a0a0a]/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiTag size={12} /> Status
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.status || "Pending"}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            status: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      >
                        <option
                          value="Pending"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          Pending
                        </option>
                        <option
                          value="In Progress"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          In Progress
                        </option>
                        <option
                          value="Completed"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          Completed
                        </option>
                        <option
                          value="On Hold"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          On Hold
                        </option>
                      </select>
                    ) : (
                      <div
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold w-fit uppercase tracking-wider ${getStatusBadge(
                          selectedTask.status,
                        )}`}
                      >
                        {selectedTask.status || "Pending"}
                      </div>
                    )}
                  </div>

                  {/* Assignee Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiUser size={12} /> Assignee
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={
                          selectedTask.assignedTo?._id ||
                          selectedTask.assignedTo ||
                          ""
                        }
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            assignedTo: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      >
                        <option
                          value=""
                          className="dark:bg-[#111] dark:text-slate-200"
                        >
                          Unassigned
                        </option>
                        {users.map((u) => (
                          <option
                            key={u._id}
                            value={u._id}
                            className="dark:bg-[#111] dark:text-slate-200"
                          >
                            {u.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl">
                        {selectedTask.assignedTo?.profileImage?.url ? (
                          <img
                            src={selectedTask.assignedTo.profileImage.url}
                            alt={selectedTask.assignedTo.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br ${getAvatarColor(
                              selectedTask.assignedTo?.name || "U",
                            )}`}
                          >
                            {selectedTask.assignedTo?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {selectedTask.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Due Date Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Due Date
                    </label>
                    {isAdminOrManager ? (
                      <input
                        type="date"
                        value={
                          selectedTask.dueDate
                            ? new Date(selectedTask.dueDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            dueDate: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <FiClock className="text-slate-400" size={13} />
                        {selectedTask.dueDate
                          ? new Date(selectedTask.dueDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiClock size={12} /> Priority
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.priority || "Medium"}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            priority: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      >
                        <option
                          value="Low"
                          className="dark:bg-[#111] dark:text-slate-200"
                        >
                          Low
                        </option>
                        <option
                          value="Medium"
                          className="dark:bg-slate-955 dark:text-slate-200"
                        >
                          Medium
                        </option>
                        <option
                          value="High"
                          className="dark:bg-slate-955 dark:text-slate-200"
                        >
                          High
                        </option>
                      </select>
                    ) : (
                      <div
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold w-fit ${
                          selectedTask.priority === "High"
                            ? "bg-rose-550/10 text-rose-700 border-rose-200/50"
                            : selectedTask.priority === "Medium"
                              ? "bg-amber-550/10 text-amber-700 border-amber-200/50"
                              : "bg-slate-50 text-slate-605 border-slate-200"
                        }`}
                      >
                        {selectedTask.priority || "Medium"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtask workspace inside the preview drawer */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      Subtasks Workspace ({selectedTask.subtasks?.length || 0})
                    </h3>
                  </div>

                  {/* Continuous subtask addition input */}
                  {isAdminOrManager && (
                    <DrawerSubtaskForm task={selectedTask} />
                  )}

                  {/* Subtask list */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {selectedTask.subtasks?.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-55/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                        No subtasks created. Type above to add multiple subtasks
                        continuously.
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
