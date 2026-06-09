import React, { useState, useEffect, useRef } from "react";
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
  FiX,
  FiPlus,
  FiTrash2,
  FiTag,
  FiUser,
  FiPaperclip,
  FiSend,
  FiFile,
} from "react-icons/fi";
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
} from "../../features/api/apiSlice";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";

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

  // Comments and Attachments
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  // Find currently selected task for drawer preview
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  // General field change update
  const handleTaskFieldChange = (taskId, fields) => {
    const sanitizedFields = { ...fields };
    if (sanitizedFields.startDate === "") sanitizedFields.startDate = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;
    updateTaskTrigger({ id: taskId, taskData: sanitizedFields });
  };

  // Add Comment Handler
  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    const commentData = {
      user: currentUserId, // We just need the ID to save it
      text: newComment.trim(),
      createdAt: new Date(),
    };
    
    updateTaskTrigger({
      id: selectedTask._id,
      taskData: {
        comments: [...(selectedTask.comments || []).map(c => ({ user: c.user?._id || c.user, text: c.text, createdAt: c.createdAt })), commentData]
      }
    });
    
    setNewComment("");
  };

  // Upload Attachment Handler
  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      toast.loading("Uploading attachment...", { id: "upload" });
      
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token || localStorage.getItem('token')}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axiosInstance.post("/messages/upload", formData, config);
      
      if (data.success) {
        const attachmentData = {
          url: data.data.url,
          filename: data.data.filename,
          fileType: data.data.fileType,
          uploadedBy: currentUserId,
          uploadedAt: new Date(),
        };

        updateTaskTrigger({
          id: selectedTask._id,
          taskData: {
            attachments: [...(selectedTask.attachments || []).map(a => ({ ...a, uploadedBy: a.uploadedBy?._id || a.uploadedBy })), attachmentData]
          }
        });

        toast.success("Attachment uploaded successfully!", { id: "upload" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload attachment", { id: "upload" });
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
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
    <div className="p-4 sm:p-6 space-y-6  pb-16">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3.5 w-12 text-center">Status</th>
                  <th className="px-6 py-3.5">Task Name</th>
                  <th className="px-6 py-3.5">Associated Project</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5 w-44">Status Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  const statusStyle = getStatusStyle(task.status);
                  const isExpanded = !!expandedTasks[task._id];

                  return (
                    <React.Fragment key={task._id}>
                      <tr 
                        onClick={() => setSelectedTaskId(task._id)}
                        className={`hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors cursor-pointer group ${
                          isCompleted ? "bg-slate-50/20 text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                        } ${selectedTaskId === task._id ? "bg-blue-50/30 dark:bg-blue-950/20" : ""}`}
                      >
                        {/* Checkbox Status Toggle */}
                        <td className="px-6 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleStatus(task)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent hover:text-slate-400"
                            }`}
                          >
                            <FiCheck size={11} />
                          </button>
                        </td>

                        {/* Title & Subtasks Dropdown */}
                        <td className="px-6 py-3.5 font-bold">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs ${isCompleted ? "line-through" : ""}`}>
                              {task.title}
                            </span>
                            {task.subtasks?.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskExpanded(task._id);
                                }}
                                className="text-slate-400 hover:text-blue-600 flex items-center gap-0.5 text-[10px] font-extrabold shrink-0"
                              >
                                {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                <span>Subtasks ({task.subtasks.length})</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Project Badge */}
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40">
                            <FiBriefcase size={11} />
                            {task.project?.name || "Internal"}
                          </span>
                        </td>

                        {/* Priority Badge */}
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider ${getPriorityStyle(task.priority || "Medium")}`}>
                            {task.priority || "Medium"}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                            <FiCalendar size={12} />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                          </span>
                        </td>

                        {/* Status Select */}
                        <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
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

                      {/* Expanded Subtasks List (Table Row) */}
                      {isExpanded && task.subtasks?.length > 0 && (
                        <tr className="bg-slate-50/20 dark:bg-slate-900/10">
                          <td></td>
                          <td colSpan={5} className="px-6 py-3">
                            <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-1">
                              {task.subtasks.map((sub) => {
                                const isSubCompleted = sub.status === "Completed";
                                return (
                                  <div
                                    key={sub._id}
                                    className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100/60 dark:border-slate-800/60 shadow-sm max-w-xl"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <FiCornerDownRight className="text-slate-350" size={13} />
                                      {/* Subtask Checkbox */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleSubtask(task, sub);
                                        }}
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                          isSubCompleted
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent hover:text-slate-400"
                                        }`}
                                      >
                                        <FiCheck size={10} />
                                      </button>
                                      <span className={`font-semibold text-xs text-slate-700 dark:text-slate-300 ${isSubCompleted ? "line-through text-slate-400 dark:text-slate-500 font-medium" : ""}`}>
                                        {sub.title}
                                      </span>
                                    </div>

                                    {/* Subtask Priority Badge */}
                                    <div className="flex items-center gap-2 pr-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                                        sub.priority === "High"
                                          ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                          : sub.priority === "Medium"
                                          ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                          : "bg-slate-50 text-slate-600 border-slate-200"
                                      }`}>
                                        {sub.priority || "Medium"}
                                      </span>
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

            {/* Mobile Cards List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "Completed";
                const isExpanded = !!expandedTasks[task._id];
                const statusStyle = getStatusStyle(task.status);

                return (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    className={`p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer ${
                      isCompleted ? "bg-slate-50/20" : ""
                    } ${selectedTaskId === task._id ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
                  >
                    {/* Header: Checkbox status and name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(task);
                          }}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isCompleted
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent"
                          }`}
                        >
                          <FiCheck size={11} />
                        </button>
                        <span className={`text-xs font-bold text-slate-800 dark:text-slate-200 ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                          {task.title}
                        </span>
                      </div>

                      {/* Dropdown status */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider cursor-pointer ${statusStyle.bg}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>
                    </div>

                    {/* Meta Section */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Project */}
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                        <FiBriefcase size={10} />
                        {task.project?.name || "Internal"}
                      </span>

                      {/* Priority */}
                      <span className={`px-1.5 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider ${getPriorityStyle(task.priority || "Medium")}`}>
                        {task.priority || "Medium"}
                      </span>

                      {/* Date */}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                          <FiCalendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}

                      {/* Subtask button toggle */}
                      {task.subtasks?.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskExpanded(task._id);
                          }}
                          className="ml-auto text-slate-400 hover:text-blue-600 flex items-center gap-0.5 text-[9px] font-extrabold shrink-0"
                        >
                          {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                          <span>Subtasks ({task.subtasks.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Subtasks listing */}
                    {isExpanded && task.subtasks?.length > 0 && (
                      <div className="mt-2 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                        {task.subtasks.map((sub) => {
                          const isSubCompleted = sub.status === "Completed";
                          return (
                            <div
                              key={sub._id}
                              className="flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100/60 dark:border-slate-800/60 text-[11px] font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSubtask(task, sub);
                                  }}
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                                    isSubCompleted
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent"
                                  }`}
                                >
                                  <FiCheck size={8} />
                                </button>
                                <span className={`text-[11px] text-slate-700 dark:text-slate-300 font-semibold ${isSubCompleted ? "line-through text-slate-400" : ""}`}>
                                  {sub.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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

                  {/* Start Date Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Start Date
                    </label>
                    <input
                      type="date"
                      value={
                        selectedTask.startDate
                          ? new Date(selectedTask.startDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleTaskFieldChange(selectedTask._id, { startDate: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* End Date (Due Date) Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> End Date
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

                {/* Comments & Attachments */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Discussion & Attachments
                  </h3>
                  
                  {/* Attachments List */}
                  {selectedTask.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTask.attachments.map(att => (
                        <a key={att._id || att.url} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <FiFile size={12} /> {att.filename}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                    {selectedTask.comments?.map((comment, idx) => (
                      <div key={idx} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                          {comment.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{comment.user?.name || "Unknown User"}</span>
                            <span className="text-[9px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg rounded-tl-none border border-slate-100 dark:border-slate-700">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedTask.comments?.length === 0 && (
                      <div className="text-[10px] text-slate-400 italic">No comments yet.</div>
                    )}
                  </div>

                  {/* Add Comment / File Input */}
                  <div className="flex items-end gap-2 mt-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[40px]"
                        rows={1}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input 
                        type="file" 
                        id="my-task-attachment" 
                        className="hidden" 
                        onChange={handleUploadAttachment} 
                        disabled={isUploading}
                      />
                      <label htmlFor="my-task-attachment" className={`p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <FiPaperclip size={14} />
                      </label>
                      <button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isUploading}
                        className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        <FiSend size={14} />
                      </button>
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