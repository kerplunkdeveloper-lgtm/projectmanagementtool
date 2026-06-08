import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
  FiX,
  FiPlus,
  FiTrash2,
  FiTag,
  FiUser,
} from "react-icons/fi";
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
} from "../../features/api/apiSlice";

// Fix for React 18+ StrictMode dropping issues with react-beautiful-dnd/@hello-pangea/dnd
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

// Task Title Input Component for real-time autosaving without cursor jumping
const TaskTitleInput = ({ task, handleTaskFieldChange, isCompleted }) => {
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleBlur = () => {
    if (title.trim() !== task.title) {
      handleTaskFieldChange(task._id, { title: title.trim() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full bg-transparent border-0 font-extrabold text-slate-800 dark:text-yellow-50 focus:ring-0 focus:outline-none p-0 text-sm ${
        isCompleted ? "line-through text-slate-400 font-semibold" : ""
      }`}
    />
  );
};

const Task = () => {
  const { user } = useSelector((state) => state.auth);
  
  const { data: tasks = [], isLoading: loading } = useGetTasksQuery(undefined, {
    skip: !user,
  });

  const [updateTaskTrigger] = useUpdateTaskMutation();

  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  // Continuous subtask input state inside the drawer
  const [drawerSubtaskTitle, setDrawerSubtaskTitle] = useState("");
  const subtaskInputRef = useRef(null);

  const currentUserId = user?._id || user?.id;

  // Filter tasks assigned to current user
  const myTasks = tasks.filter((task) => {
    const taskUserId = task.assignedTo?._id || task.assignedTo;
    return taskUserId === currentUserId;
  });

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Send to backend (optimistic UI is handled instantly by apiSlice.js onQueryStarted)
    updateTaskTrigger({ id: draggableId, taskData: { status: destination.droppableId } });
  };

  const filteredTasks = myTasks.filter((task) => {
    if (statusFilter === "All") return true;
    return task.status === statusFilter;
  });

  // Find currently selected task for drawer preview
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  // General field change update
  const handleTaskFieldChange = (taskId, fields) => {
    const sanitizedFields = { ...fields };
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;
    updateTaskTrigger({ id: taskId, taskData: sanitizedFields });
  };

  // Handle task status toggle (checkbox click)
  const handleToggleStatus = (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    updateTaskTrigger({ id: task._id, taskData: { status: newStatus } });
  };

  // Toggle subtask status
  const handleToggleSubtask = (task, subtask) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtask._id
        ? { ...sub, status: sub.status === "Completed" ? "Pending" : "Completed" }
        : sub
    );
    updateTaskTrigger({ id: task._id, taskData: { subtasks: updatedSubtasks } });
  };

  // Add subtask inside drawer (continuous typing helper)
  const handleAddSubtaskInDrawer = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!drawerSubtaskTitle || !drawerSubtaskTitle.trim() || !selectedTask) return;

      const newSubtask = {
        title: drawerSubtaskTitle.trim(),
        status: "Pending",
        priority: "Medium",
        dueDate: null,
      };

      const updatedSubtasks = [...(selectedTask.subtasks || []), newSubtask];
      updateTaskTrigger({ id: selectedTask._id, taskData: { subtasks: updatedSubtasks } });

      setDrawerSubtaskTitle("");
      
      // Auto refocus the input field for continuous addition
      setTimeout(() => {
        if (subtaskInputRef.current) {
          subtaskInputRef.current.focus();
        }
      }, 50);
    }
  };

  // Delete subtask
  const handleDeleteSubtask = (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.filter((sub) => sub._id !== subtaskId);
    updateTaskTrigger({ id: task._id, taskData: { subtasks: updatedSubtasks } });
  };

  // Update specific subtask fields (e.g. inline title edit, priority, due date)
  const handleUpdateSubtaskField = (task, subtaskId, fields) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtaskId ? { ...sub, ...fields } : sub
    );
    updateTaskTrigger({ id: task._id, taskData: { subtasks: updatedSubtasks } });
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40",
          dot: "bg-emerald-500",
          icon: FiCheckSquare,
        };
      case "In Progress":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40",
          dot: "bg-blue-500",
          icon: FiClock,
        };
      case "On Hold":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40",
          dot: "bg-amber-500",
          icon: FiAlertCircle,
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200/50 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800/40",
          dot: "bg-slate-400",
          icon: FiClock,
        };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/40";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40";
      case "Low":
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200/50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-yellow-50">My Assigned Tasks</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Manage, update, and track status of tasks assigned to you</p>
        </div>
        
        {/* Task counter stats */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Total: {myTasks.length}</span>
          </div>
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Completed: {myTasks.filter(t => t.status === "Completed").length}</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-2 overflow-x-auto pb-1 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm scrollbar-thin">
        {["All", "Pending", "In Progress", "Completed", "On Hold"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              statusFilter === status
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                : "bg-transparent text-slate-600 dark:text-slate-450 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* TASK LIST CONTAINER */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <FiCheckSquare size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-black theme-text-primary uppercase tracking-wider">No Tasks Found</h3>
          <p className="text-slate-400 text-[11px] font-semibold mt-1">You have no tasks assigned matching this criteria.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 items-stretch h-[calc(100vh-220px)] md:h-[calc(100vh-180px)]">
            {[
              { id: "Pending", title: "PENDING", dotColor: "bg-slate-400" },
              { id: "In Progress", title: "IN PROGRESS", dotColor: "bg-blue-500" },
              { id: "On Hold", title: "ON HOLD", dotColor: "bg-amber-500" },
              { id: "Completed", title: "COMPLETED", dotColor: "bg-emerald-500" },
            ].map(column => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id);
              return (
                <div key={column.id} className="bg-[#9ca3af] dark:bg-slate-800/80 rounded-2xl w-full md:min-w-[280px] md:w-1/4 p-3 flex flex-col flex-1 shrink-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                      <span className="font-extrabold text-[12px] text-white uppercase tracking-widest">{column.title}</span>
                    </div>
                    <span className="bg-white text-slate-800 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">{columnTasks.length}</span>
                  </div>
                  
                  {/* Droppable Area */}
                  <StrictModeDroppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[150px] overflow-y-auto overflow-x-hidden flex flex-col gap-3 rounded-xl p-1 custom-scrollbar ${snapshot.isDraggingOver ? 'bg-slate-500/30 dark:bg-slate-900/30' : ''}`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-[#0f172a] text-white p-3.5 rounded-xl border border-slate-700/50 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 scale-105 z-50' : ''}`}
                                onClick={() => setSelectedTaskId(task._id)}
                              >
                                {/* Checkbox and Title */}
                                <div className="flex items-start gap-3 mb-4">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                                    className={`w-4 h-4 mt-0.5 rounded-full border flex shrink-0 items-center justify-center transition-all ${
                                      task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-blue-400'
                                    }`}
                                  >
                                    {task.status === 'Completed' && <FiCheck size={10} className="text-white" />}
                                  </button>
                                  <span className={`text-xs font-bold leading-relaxed ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                    {task.title}
                                  </span>
                                </div>
                                
                                {/* Avatar, Assignee Dropdown and Priority */}
                                <div className="flex items-center justify-between mt-auto pt-2">
                                  <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg pr-3 py-1 pl-1 border border-slate-700/80">
                                    <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center text-[8px] font-black uppercase text-white shadow-sm shrink-0">
                                      {task.assignedTo?.name ? task.assignedTo.name.substring(0,2) : "UN"}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                                      {task.assignedTo?.name ? task.assignedTo.name.split(' ')[0] : "Unassigned"}
                                      <FiChevronDown size={10} className="text-slate-500" />
                                    </span>
                                  </div>
                                  <span className="bg-white text-slate-900 text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                                    {task.priority || "LOW"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </StrictModeDroppable>

                  {/* Add Task Button */}
                  <button className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-slate-400/80 text-white text-xs font-bold hover:bg-slate-500/30 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2">
                    <FiPlus size={14} /> Add task
                  </button>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* OFF-CANVAS PREVIEW DRAWER */}
      <AnimatePresence>
        {selectedTaskId && selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-150 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                    <FiCheckSquare size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-yellow-50 uppercase tracking-wider">
                      Task Workspace
                    </h2>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                      Preview & Modify Details
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Task Title
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-950 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <TaskTitleInput
                      task={selectedTask}
                      handleTaskFieldChange={handleTaskFieldChange}
                      isCompleted={selectedTask.status === "Completed"}
                    />
                  </div>
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiTag size={12} /> Status
                    </label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) =>
                        handleTaskFieldChange(selectedTask._id, { status: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiAlertCircle size={12} /> Priority
                    </label>
                    <select
                      value={selectedTask.priority || "Medium"}
                      onChange={(e) =>
                        handleTaskFieldChange(selectedTask._id, { priority: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Due Date Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Due Date
                    </label>
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Associated Project (Read-only badge style) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiBriefcase size={12} /> Project
                    </label>
                    <div className="w-full bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 truncate">
                      {selectedTask.project?.name || "Internal task"}
                    </div>
                  </div>
                </div>

                {/* Subtask Workspace */}
                <div className="space-y-3.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiCornerDownRight size={13} /> Subtasks Board
                  </label>

                  {/* Continuous subtask addition input */}
                  <div className="relative">
                    <input
                      type="text"
                      ref={subtaskInputRef}
                      value={drawerSubtaskTitle}
                      onChange={(e) => setDrawerSubtaskTitle(e.target.value)}
                      onKeyDown={handleAddSubtaskInDrawer}
                      placeholder="Add subtask and press Enter..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs font-semibold placeholder-slate-400 transition-all"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <FiPlus size={14} />
                    </div>
                  </div>

                  {/* Drawer subtask list items */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {!selectedTask.subtasks || selectedTask.subtasks.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 italic text-[11px] font-bold">
                        No subtasks assigned yet. Type above to add.
                      </div>
                    ) : (
                      selectedTask.subtasks.map((sub) => {
                        const isSubCompleted = sub.status === "Completed";
                        return (
                          <div
                            key={sub._id}
                            className="flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 group"
                          >
                            {/* Checkbox status toggle */}
                            <button
                              onClick={() => handleToggleSubtask(selectedTask, sub)}
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isSubCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-350 dark:border-slate-700 hover:border-emerald-500 text-transparent"
                              }`}
                            >
                              <FiCheck size={9} />
                            </button>

                            {/* Subtask editable title */}
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) =>
                                handleUpdateSubtaskField(selectedTask, sub._id, {
                                  title: e.target.value,
                                })
                              }
                              className={`flex-1 min-w-0 bg-transparent border-0 font-semibold text-xs text-slate-700 dark:text-slate-300 focus:ring-0 focus:outline-none p-0 ${
                                isSubCompleted ? "line-through text-slate-400 font-medium" : ""
                              }`}
                            />

                            {/* Subtask priority selector */}
                            <select
                              value={sub.priority || "Medium"}
                              onChange={(e) =>
                                handleUpdateSubtaskField(selectedTask, sub._id, {
                                  priority: e.target.value,
                                })
                              }
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border focus:outline-none cursor-pointer ${
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

                            {/* Subtask Delete */}
                            <button
                              onClick={() => handleDeleteSubtask(selectedTask, sub._id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors duration-150 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        );
                      })
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

export default Task;