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
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiPlus,
  FiTrash2,
  FiTag,
  FiUser,
  FiPaperclip,
  FiSend,
  FiFile,
  FiFilter,
  FiList,
  FiGrid,
  FiSearch,
  FiMessageSquare,
} from "react-icons/fi";
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
  useGetProjectsQuery,
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

const TimeTracker = ({ startTime, endTime, status }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
      const end = endTime ? new Date(endTime).getTime() : Date.now();
      return Math.max(0, Math.floor((end - start) / 1000));
    };

    setElapsed(calculateElapsed());

    if (status === "In Progress" && !endTime) {
      const interval = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, status]);

  if (!startTime && status !== "In Progress") return null;
  if (!startTime && status === "In Progress") return (
    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-[#e5ff00] dark:border-[#e5ff00]/30 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#e5ff00] animate-pulse"></span>
      Starting...
    </div>
  );

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const timeString = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;

  return (
    <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider ${
      status === "In Progress" && !endTime
        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-[#e5ff00] dark:border-[#e5ff00]/30 shadow-sm" 
        : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
    }`}>
      {status === "In Progress" && !endTime ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#e5ff00] animate-pulse"></span>
      ) : (
        <FiClock size={10} />
      )}
      {timeString}
    </div>
  );
};

const CreatedTime = ({ time }) => {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (!time) {
      setFormatted("—");
      return;
    }

    const date = new Date(time);
    if (isNaN(date.getTime())) {
      setFormatted("—");
      return;
    }

    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    setFormatted(`${day} ${month} ${year} ${hours}:${minutes} ${ampm}`);
  }, [time]);

  return <span>{formatted}</span>;
};

const Task = () => {
  const { user } = useSelector((state) => state.auth);

  const { data: tasks = [], isLoading: loading } = useGetTasksQuery(undefined, {
    skip: !user,
  });

  const { data: projects = [] } = useGetProjectsQuery(undefined, {
    skip: !user,
  });

  const [updateTaskTrigger] = useUpdateTaskMutation();

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dueDate-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openDropdown, setOpenDropdown] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [viewType, setViewType] = useState("list");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (sectionName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

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

  // Get unique projects for dropdown filter
  const uniqueProjects = React.useMemo(() => {
    const projectsMap = {};
    myTasks.forEach((t) => {
      if (t.project) {
        const pId = t.project._id || t.project;
        const projObj = projects.find((p) => p._id === pId);
        const pName = projObj?.name || t.project.name || "Internal";
        projectsMap[pId] = pName;
      }
    });
    return Object.entries(projectsMap).map(([id, name]) => ({ id, name }));
  }, [myTasks, projects]);

  // Date formatter helper: DD MMM YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "No Date";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "No Date";
    const day = date.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Date and Time formatter helper: DD MMM YYYY HH:MM AM/PM
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    const day = date.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
  };

  // Filter tasks without status filter for counts
  const filteredTasksWithoutStatus = React.useMemo(() => {
    return myTasks.filter((task) => {
      // Status filter
      // Priority filter
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      // Project filter
      const taskProjectId = task.project?._id || task.project;
      const matchesProject =
        projectFilter === "All" || taskProjectId === projectFilter;

      // Search term
      const projectObj = projects.find((p) => p._id === taskProjectId);
      const projectName = projectObj?.name || task.project?.name || "";
      const clientName = projectObj?.client?.companyName || task.project?.client?.companyName || "";
      const matchesSearch =
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesPriority && matchesProject && matchesSearch;
    });
  }, [myTasks, priorityFilter, projectFilter, searchTerm, projects]);

  const counts = React.useMemo(() => {
    const res = { All: filteredTasksWithoutStatus.length, Pending: 0, "In Progress": 0, Completed: 0, "On Hold": 0 };
    filteredTasksWithoutStatus.forEach((t) => {
      const status = t.status || "Pending";
      if (res[status] !== undefined) {
        res[status]++;
      }
    });
    return res;
  }, [filteredTasksWithoutStatus]);

  const filteredTasks = filteredTasksWithoutStatus;

  // Sort tasks
  const sortedTasks = React.useMemo(() => {
    const tasksCopy = [...filteredTasks];
    tasksCopy.sort((a, b) => {
      if (sortBy === "title-asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "title-desc") {
        return (b.title || "").localeCompare(a.title || "");
      }
      if (sortBy === "startDate-asc") {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate) - new Date(b.startDate);
      }
      if (sortBy === "startDate-desc") {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(b.startDate) - new Date(a.startDate);
      }
      if (sortBy === "dueDate-asc") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === "dueDate-desc") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      if (sortBy === "priority-high") {
        const prioMap = { High: 3, Medium: 2, Low: 1, undefined: 0, null: 0 };
        return (prioMap[b.priority] || 0) - (prioMap[a.priority] || 0);
      }
      if (sortBy === "priority-low") {
        const prioMap = { High: 3, Medium: 2, Low: 1, undefined: 0, null: 0 };
        return (prioMap[a.priority] || 0) - (prioMap[b.priority] || 0);
      }
      return 0;
    });
    return tasksCopy;
  }, [filteredTasks, sortBy]);

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, projectFilter, searchTerm, sortBy]);

  const totalItems = sortedTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Paginated tasks
  const paginatedTasks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTasks, currentPage, itemsPerPage]);

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
        comments: [
          ...(selectedTask.comments || []).map((c) => ({
            user: c.user?._id || c.user,
            text: c.text,
            createdAt: c.createdAt,
          })),
          commentData,
        ],
      },
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
          Authorization: `Bearer ${user?.token || localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axiosInstance.post(
        "/messages/upload",
        formData,
        config,
      );

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
            attachments: [
              ...(selectedTask.attachments || []).map((a) => ({
                ...a,
                uploadedBy: a.uploadedBy?._id || a.uploadedBy,
              })),
              attachmentData,
            ],
          },
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

  // Handle task status change from dropdown or drag-drop
  const handleStatusChange = (taskId, newStatus) => {
    updateTaskTrigger({ id: taskId, taskData: { status: newStatus } });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      const task = tasks.find((t) => t._id === taskId);
      if (task && task.status !== newStatus) {
        handleStatusChange(taskId, newStatus);
      }
    }
    setDraggedTaskId(null);
  };

  // Toggle subtask status
  const handleToggleSubtask = (task, subtask) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtask._id
        ? {
            ...sub,
            status: sub.status === "Completed" ? "Pending" : "Completed",
          }
        : sub,
    );
    updateTaskTrigger({
      id: task._id,
      taskData: { subtasks: updatedSubtasks },
    });
  };

  // Add subtask inside drawer (continuous typing helper)
  const handleAddSubtaskInDrawer = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!drawerSubtaskTitle || !drawerSubtaskTitle.trim() || !selectedTask)
        return;

      const newSubtask = {
        title: drawerSubtaskTitle.trim(),
        status: "Pending",
        priority: "Medium",
        dueDate: null,
      };

      const updatedSubtasks = [...(selectedTask.subtasks || []), newSubtask];
      updateTaskTrigger({
        id: selectedTask._id,
        taskData: { subtasks: updatedSubtasks },
      });

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
    const updatedSubtasks = task.subtasks.filter(
      (sub) => sub._id !== subtaskId,
    );
    updateTaskTrigger({
      id: task._id,
      taskData: { subtasks: updatedSubtasks },
    });
  };

  // Update specific subtask fields (e.g. inline title edit, priority, due date)
  const handleUpdateSubtaskField = (task, subtaskId, fields) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtaskId ? { ...sub, ...fields } : sub,
    );
    updateTaskTrigger({
      id: task._id,
      taskData: { subtasks: updatedSubtasks },
    });
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return {
          bg: "!bg-emerald-50 !text-emerald-700 !border-emerald-200 dark:!bg-emerald-500/20 dark:!text-emerald-300 dark:!border-emerald-500/40",
          dot: "bg-emerald-500",
          icon: FiCheckSquare,
        };
      case "In Progress":
        return {
          bg: "!bg-blue-50 !text-blue-700 !border-blue-200 dark:!bg-blue-500/20 dark:!text-blue-300 dark:!border-blue-500/40",
          dot: "bg-blue-500",
          icon: FiClock,
        };
      case "On Hold":
        return {
          bg: "!bg-amber-50 !text-amber-700 !border-amber-200 dark:!bg-amber-500/20 dark:!text-amber-300 dark:!border-amber-500/40",
          dot: "bg-amber-500",
          icon: FiAlertCircle,
        };
      default:
        return {
          bg: "!bg-slate-50 !text-slate-600 !border-slate-200 dark:!bg-slate-500/20 dark:!text-slate-300 dark:!border-slate-500/40",
          dot: "bg-slate-400",
          icon: FiClock,
        };
    }
  };

  const getSectionStyle = (name) => {
    switch (name) {
      case "Recent assignment":
        return {
          dot: "bg-blue-500 dark:bg-blue-400",
          text: "text-blue-700 dark:text-blue-400",
          bg: "bg-blue-50/60 dark:bg-blue-950/20",
          border: "border-blue-100 dark:border-blue-950",
        };
      case "To Do":
      case "Todo":
        return {
          dot: "bg-indigo-500 dark:bg-indigo-400",
          text: "text-indigo-700 dark:text-indigo-400",
          bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
          border: "border-indigo-100 dark:border-indigo-950",
        };
      case "In Progress":
        return {
          dot: "bg-amber-500 dark:bg-amber-400",
          text: "text-amber-700 dark:text-amber-400",
          bg: "bg-amber-50/60 dark:bg-amber-950/20",
          border: "border-amber-100 dark:border-amber-950",
        };
      case "Completed":
      case "Done":
        return {
          dot: "bg-emerald-500 dark:bg-emerald-400",
          text: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
          border: "border-emerald-100 dark:border-emerald-950",
        };
      default:
        const colors = [
          {
            dot: "bg-purple-500 dark:bg-purple-400",
            text: "text-purple-700 dark:text-purple-400",
            bg: "bg-purple-50/60 dark:bg-purple-950/20",
            border: "border-purple-100 dark:border-purple-950",
          },
          {
            dot: "bg-pink-500 dark:bg-pink-400",
            text: "text-pink-700 dark:text-pink-400",
            bg: "bg-pink-50/60 dark:bg-pink-950/20",
            border: "border-pink-100 dark:border-pink-950",
          },
          {
            dot: "bg-teal-500 dark:bg-teal-400",
            text: "text-teal-700 dark:text-teal-400",
            bg: "bg-teal-50/60 dark:bg-teal-950/20",
            border: "border-teal-100 dark:border-teal-950",
          },
          {
            dot: "bg-cyan-500 dark:bg-cyan-400",
            text: "text-cyan-700 dark:text-cyan-400",
            bg: "bg-cyan-50/60 dark:bg-cyan-950/20",
            border: "border-cyan-100 dark:border-cyan-950",
          },
          {
            dot: "bg-orange-500 dark:bg-orange-400",
            text: "text-orange-700 dark:text-orange-400",
            bg: "bg-orange-50/60 dark:bg-orange-950/20",
            border: "border-orange-100 dark:border-orange-950",
          },
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-600";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-600";
      case "Low":
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";
    }
  };

  return (
    <div className="p-1 space-y-4 pb-16">
      {/* UNIFIED HEADER & CONTROLS */}

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-2 relative z-20">

        {/* Center: View Toggle */}
        <div className="flex bg-slate-50 dark:bg-black p-1 rounded-xl shrink-0 w-full xl:w-auto mx-auto justify-center">
          <button
            onClick={() => setViewType("list")}
            className={`flex items-center justify-center gap-2 px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === "list" ? "bg-white dark:bg-[#0f172a] text-blue-600 dark:text-[#e5ff00] shadow-sm border theme-border-accent" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <FiList size={14} /> List
          </button>
          <button
            onClick={() => setViewType("kanban")}
            className={`flex items-center justify-center gap-2 px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === "kanban" ? "bg-white dark:bg-[#0f172a] text-blue-600 dark:text-[#e5ff00] shadow-sm border theme-border-accent" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <FiGrid size={14} /> Kanban
          </button>
        </div>

        {/* Right: Filter & Sort Actions */}
        <div
          className="flex items-center justify-end gap-2.5 w-full xl:w-auto"
          ref={filterRef}
        >
          {/* Filter Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === "filter" ? null : "filter")
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border dark:border-0 ${
                openDropdown === "filter" ||
                priorityFilter !== "All" ||
                projectFilter !== "All"
                  ? "bg-blue-50 dark:bg-[#e5ff00]/10 border-blue-200 dark:border-transparent text-blue-700 dark:text-[#e5ff00]"
                  : "bg-white dark:bg-black border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <FiFilter size={14} />
              Filter
              {(priorityFilter !== "All" ||
                projectFilter !== "All") && (
                <span className="flex items-center justify-center bg-blue-600 dark:bg-[#e5ff00] text-white dark:text-black text-[9px] w-4 h-4 rounded-full ml-1 font-black">
                  {
                    [priorityFilter, projectFilter].filter(
                      (f) => f !== "All",
                    ).length
                  }
                </span>
              )}
            </button>

            {/* Filter Popover Content */}
            <AnimatePresence>
              {openDropdown === "filter" && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-[#121215]/95 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-5 z-50 space-y-4 backdrop-blur-xl max-h-[480px] overflow-y-auto custom-scrollbar select-none origin-top-right flex flex-col"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-500/10 dark:bg-[#e5ff00]/10 flex items-center justify-center">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600 dark:text-[#e5ff00]">
                          <line x1="4" y1="6" x2="20" y2="6" />
                          <line x1="6" y1="12" x2="18" y2="12" />
                          <line x1="9" y1="18" x2="15" y2="18" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Filters</span>
                    </div>
                    {(priorityFilter !== "All" || projectFilter !== "All") && (
                      <button
                        onClick={() => {
                          setPriorityFilter("All");
                          setProjectFilter("All");
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Priority</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: "All", label: "All Priorities", color: "bg-slate-400" },
                        { name: "Low", label: "Low", color: "bg-slate-400" },
                        { name: "Medium", label: "Medium", color: "bg-amber-500" },
                        { name: "High", label: "High", color: "bg-rose-500" }
                      ].map((priority) => (
                        <button
                          key={priority.name}
                          onClick={() => setPriorityFilter(priority.name)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                            priorityFilter === priority.name
                              ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                              : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          {priority.name !== "All" && (
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.color} shrink-0`} />
                          )}
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Project</label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      <button
                        onClick={() => setProjectFilter("All")}
                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                          projectFilter === "All"
                            ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                            : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        All Projects
                      </button>
                      {uniqueProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProjectFilter(p.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                            projectFilter === p.id
                              ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                              : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-600 dark:bg-[#e5ff00]/20 dark:text-[#e5ff00] flex items-center justify-center text-[7px] font-extrabold shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === "sort" ? null : "sort")
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border dark:border-0 ${
                openDropdown === "sort"
                  ? "bg-blue-50 dark:bg-[#e5ff00]/10 border-blue-200 dark:border-transparent text-blue-700 dark:text-[#e5ff00]"
                  : "bg-white dark:bg-black border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <FiList size={14} /> Sort By
            </button>

            {/* Sort Popover Content */}
            <AnimatePresence>
              {openDropdown === "sort" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-0 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 p-2 origin-top-right flex flex-col"
                >
                  {[
                    { value: "dueDate-asc", label: "End Date (Nearest)" },
                    { value: "dueDate-desc", label: "End Date (Furthest)" },
                    { value: "startDate-asc", label: "Start Date (Oldest)" },
                    { value: "startDate-desc", label: "Start Date (Newest)" },
                    { value: "priority-high", label: "Priority (High-Low)" },
                    { value: "priority-low", label: "Priority (Low-High)" },
                    { value: "title-asc", label: "Title (A-Z)" },
                    { value: "title-desc", label: "Title (Z-A)" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`flex items-center justify-between w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                        sortBy === option.value
                          ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-[#e5ff00]"
                          : "text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      {option.label}
                      {sortBy === option.value && <FiCheck size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* TASK LIST CONTAINER */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <FiCheckSquare
            size={36}
            className="mx-auto text-slate-300 dark:text-slate-600"
          />
          <h3 className="mt-4 text-sm font-black text-slate-800 dark:text-slate-200  tracking-wider">
            No Tasks Found
          </h3>
          <p className="text-slate-400 text-[11px] font-semibold mt-1">
            You have no tasks assigned matching this criteria.
          </p>
        </div>
      ) : viewType === "kanban" ? (
        <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-thin px-2">
          {["Pending", "In Progress", "On Hold", "Completed"].map(
            (colStatus) => {
              const colTasks = filteredTasks.filter(
                (t) => t.status === colStatus,
              );
              const style = getStatusStyle(colStatus);

              return (
                <div
                  key={colStatus}
                  className={`flex-shrink-0 w-[300px] sm:w-[340px] flex flex-col rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-4 transition-colors duration-300 ${draggedTaskId ? "border-dashed border-blue-300 dark:border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, colStatus)}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shadow-sm ${style.dot}`}
                      ></span>
                      {colStatus}
                    </h3>
                    <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 h-full min-h-[200px]">
                    {colTasks.length === 0 ? (
                      <div className="bg-white/50 dark:bg-[#0f172a]/30 border-2 border-slate-200/50 dark:border-slate-800/40 border-dashed rounded-2xl h-32 flex flex-col items-center justify-center text-center px-4 transition-colors">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                          Drop tasks here
                        </span>
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isCompleted = task.status === "Completed";
                        return (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task._id)}
                            onDragEnd={() => setDraggedTaskId(null)}
                            className={`bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/60 transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-3 ${
                              draggedTaskId === task._id
                                ? "opacity-50 scale-95 border-blue-500"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase ${getPriorityStyle(task.priority || "Medium")}`}
                              >
                                {task.priority || "Medium"}
                              </span>
                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/40 font-extrabold text-[9px] whitespace-nowrap tracking-wider">
                                  <FiCalendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              )}
                            </div>
                            <h4
                              className={`text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""}`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center justify-between pt-4 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40">
                                  <FiBriefcase size={10} />
                                  {(() => {
                                    const projId = task.project?._id || task.project;
                                    const projectObj = projects.find(p => p._id === projId);
                                    return projectObj?.name || task.project?.name || "Internal";
                                  })()}
                                </span>
                                {(() => {
                                  const projId = task.project?._id || task.project;
                                  const projectObj = projects.find(p => p._id === projId);
                                  const clientCompanyName = projectObj?.client?.companyName || task.project?.client?.companyName;
                                  if (clientCompanyName) {
                                    return (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 shrink-0">
                                        {clientCompanyName}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              {task.subtasks?.length > 0 && (
                                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <FiCheckSquare
                                    size={11}
                                    className={
                                      task.subtasks.filter(
                                        (s) => s.status === "Completed",
                                      ).length === task.subtasks.length
                                        ? "text-emerald-500"
                                        : ""
                                    }
                                  />
                                  {
                                    task.subtasks.filter(
                                      (s) => s.status === "Completed",
                                    ).length
                                  }
                                  /{task.subtasks.length}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#070b13] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-200/60 dark:border-[#1e293b]/50 transition-all">
           
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1300px] text-left border-collapse table-auto border-0">
              <thead>
                <tr className="bg-slate-50/20 dark:bg-[#0f172a]/30 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider border-b border-slate-200/60 dark:border-[#1e293b]/50">
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-24">
                    Priority
                  </th>
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 min-w-[180px] w-[220px]">
                    Task Name
                  </th>
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-36">
                    Client
                  </th>
                  <th className="px-3 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-32">
                    Content-type
                  </th>
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-44">
                    Status Mode
                  </th>
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-32">
                    Start Date
                  </th>
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-32">
                    End Date
                  </th>
                  <th className="px-6 py-2 border-r border-slate-200/60 dark:border-[#1e293b]/40 w-44">
                    Assigned By
                  </th>
                  <th className="px-6 py-2 w-48">
                    Created Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(() => {
                  const sections = [
                    { id: "Pending", label: "Not started", color: "bg-slate-400", tasks: sortedTasks.filter(t => (t.status || "Pending") === "Pending") },
                    { id: "In Progress", label: "In Progress", color: "bg-blue-500", tasks: sortedTasks.filter(t => t.status === "In Progress") },
                    { id: "On Hold", label: "On Hold", color: "bg-amber-500", tasks: sortedTasks.filter(t => t.status === "On Hold") },
                    { id: "Completed", label: "Completed", color: "bg-emerald-500", tasks: sortedTasks.filter(t => t.status === "Completed") }
                  ];

                  const hasTasks = sections.some(s => s.tasks.length > 0);

                  if (!hasTasks) {
                    return (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-8 text-center text-slate-450 dark:text-slate-500 font-bold bg-slate-50/5 dark:bg-slate-900/5 text-xs"
                        >
                          No tasks found.
                        </td>
                      </tr>
                    );
                  }

                  return sections.map((section, sectionIdx) => {
                    const isSectionCollapsed = !!collapsedSections[section.id];
                    return (
                      <React.Fragment key={section.id}>
                        {/* Spacer Row between sections */}
                        {sectionIdx > 0 && (
                          <tr className="h-12 select-none pointer-events-none theme-bg-main">
                            <td 
                              colSpan={9} 
                              className="h-6 theme-bg-main border-t border-b border-slate-200/60 dark:border-[#1e293b]/50"
                            ></td>
                          </tr>
                        )}
                        {/* Section Header Row */}
                        <tr 
                          className="cursor-pointer select-none transition-colors theme-bg-accent-ultrasubtle dark:!bg-[color-mix(in_srgb,var(--accent-color-dark)_15%,#070b13)]"
                          onClick={() => toggleSection(section.id)}
                        >
                          <td 
                            colSpan={9} 
                            className="p-0 border-b border-slate-200/40 dark:border-[#1e293b]/30 relative theme-bg-accent-ultrasubtle dark:!bg-[color-mix(in_srgb,var(--accent-color-dark)_15%,#070b13)]"
                          >
                            <div className="sticky left-0 flex items-center gap-2 px-6 py-2.5 theme-bg-accent-ultrasubtle dark:!bg-[color-mix(in_srgb,var(--accent-color-dark)_15%,#070b13)] backdrop-blur-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] z-20 w-fit">
                              <FiChevronDown 
                                size={14} 
                                className={`text-slate-400 dark:text-white transition-transform duration-200 ${isSectionCollapsed ? "-rotate-90" : ""}`} 
                              />
                              <span className={`w-2 h-2 rounded-full ${section.color}`} />
                              <span className="text-xs font-black tracking-tight text-slate-700 dark:text-white uppercase tracking-wider">
                                {section.label}
                              </span>
                              <span className="bg-slate-200/50 dark:bg-white/20 text-slate-650 dark:text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {section.tasks.length}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Task Rows under this section */}
                        {!isSectionCollapsed && (
                          section.tasks.length > 0 ? (
                            section.tasks.map((task) => {
                              const isCompleted = task.status === "Completed";
                              const statusStyle = getStatusStyle(task.status);
                              const isExpanded = !!expandedTasks[task._id];

                              return (
                                <React.Fragment key={task._id}>
                                  <tr
                                    className={`hover:bg-slate-50/40 dark:hover:bg-[#1e293b]/20 transition-colors group ${
                                      isCompleted
                                        ? "bg-slate-50/20 text-slate-400 dark:text-slate-500"
                                        : "text-slate-700 dark:text-slate-200"
                                    }`}
                                  >
                                    {/* Priority Badge */}
                                    <td className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40">
                                      <span
                                        className={`px-2 py-0.5 rounded-lg border text-[13px] font-extrabold tracking-wider ${getPriorityStyle(task.priority || "Medium")}`}
                                      >
                                        {task.priority || "Medium"}
                                      </span>
                                    </td>

                                    {/* Title & Subtasks Dropdown */}
                                    <td className="px-6 py-2 font-bold border-r border-b border-slate-200/60 dark:border-[#1e293b]/40">
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`text-xs ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-white"}`}
                                        >
                                          {task.title}
                                        </span>
                                        {task.subtasks?.length > 0 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleTaskExpanded(task._id);
                                            }}
                                            className="text-slate-405 hover:text-blue-600 flex items-center gap-0.5 text-[10px] font-extrabold shrink-0"
                                          >
                                            {isExpanded ? (
                                              <FiChevronDown size={14} />
                                            ) : (
                                              <FiChevronRight size={14} />
                                            )}
                                            <span>
                                              Subtasks ({task.subtasks.length})
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    </td>

                                    {/* Client Name */}
                                    <td className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40">
                                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 px-2 py-0.5 rounded-md">
                                        {(() => {
                                           const projId = task.project?._id || task.project;
                                           const projectObj = projects.find(p => p._id === projId);
                                           return projectObj?.client?.companyName || task.project?.client?.companyName || "No Client";
                                         })()}
                                      </span>
                                    </td>

                                    {/* Content-type */}
                                    <td className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-800/80 ${
                                          task.contentType === "Post"
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                            : task.contentType === "Story"
                                              ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                        }`}
                                      >
                                        {task.contentType || "None"}
                                      </span>
                                    </td>

                                    {/* Status Select */}
                                    <td
                                      className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40 w-44"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex flex-col items-start gap-1 w-full">
                                        <select
                                          value={task.status}
                                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border tracking-wider cursor-pointer w-full text-left transition-colors focus:outline-none ${statusStyle.bg}`}
                                        >
                                          <option value="Pending" className="bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200">Pending</option>
                                          <option value="In Progress" className="bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200">In Progress</option>
                                          <option value="Completed" className="bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200">Completed</option>
                                          <option value="On Hold" className="bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200">On Hold</option>
                                        </select>
                                        <TimeTracker 
                                          startTime={task.actualStartTime} 
                                          endTime={task.actualEndTime} 
                                          status={task.status} 
                                        />
                                      </div>
                                    </td>

                                    {/* Due Date */}
                                    <td className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40 w-32">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                                          task.startDate
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20"
                                            : "text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-[#1e293b]/40"
                                        }`}
                                      >
                                        <FiCalendar size={11} />
                                        {formatDate(task.startDate)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40 w-32">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                                          task.dueDate
                                            ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/20"
                                            : "text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-[#1e293b]/40"
                                        }`}
                                      >
                                        <FiCalendar size={11} />
                                        {formatDate(task.dueDate)}
                                      </span>
                                    </td>

                                    {/* Assignee */}
                                    <td className="px-6 py-2 border-r border-b border-slate-200/60 dark:border-[#1e293b]/40">
                                      {task.createdBy ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/35 flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-400 overflow-hidden">
                                            {task.createdBy.profile?.profileImage?.url || task.createdBy.profileImage?.url ? (
                                              <img src={task.createdBy.profile?.profileImage?.url || task.createdBy.profileImage.url} alt={task.createdBy.name} className="w-full h-full object-cover" />
                                            ) : (
                                              task.createdBy.name?.charAt(0).toUpperCase()
                                            )}
                                          </div>
                                          <span className="font-semibold text-slate-707 dark:text-slate-355">{task.createdBy.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 dark:text-slate-600">—</span>
                                      )}
                                    </td>

                                    {/* Created Time */}
                                    <td className="px-6 py-2 border-b border-slate-200/60 dark:border-[#1e293b]/40">
                                      <span className="text-slate-500 dark:text-white font-semibold">
                                        <CreatedTime time={task.createdAt} />
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Expanded Subtasks List */}
                                  {isExpanded &&
                                    task.subtasks?.length > 0 &&
                                    task.subtasks.map((sub, subIdx) => {
                                      const isSubCompleted =
                                        sub.status === "Completed";
                                      const subStatusStyle = getStatusStyle(
                                        sub.status,
                                      );
                                      return (
                                        <tr
                                          key={sub._id || subIdx}
                                          className={`bg-slate-50/5 dark:bg-[#111827]/15 hover:bg-slate-50/20 dark:hover:bg-[#1e293b]/25 transition-colors border-b border-slate-100/60 dark:border-[#1e293b]/30 ${
                                            isSubCompleted
                                              ? "text-slate-400 dark:text-slate-500"
                                              : "text-slate-700 dark:text-slate-200"
                                          }`}
                                        >
                                            

                                          {/* 2. Priority */}
                                          <td className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <span
                                              className={`px-2 py-0.5 rounded-lg border text-[9px] font-extrabold tracking-wider uppercase ${getPriorityStyle(sub.priority || "Medium")}`}
                                            >
                                              {sub.priority || "Medium"}
                                            </span>
                                          </td>

                                          {/* 3. Subtask Title */}
                                          <td className="px-6 py-1.5 font-bold border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <div className="flex items-center gap-2 pl-4 border-l-2 border-slate-200 dark:border-[#1e293b]/50">
                                              <FiCornerDownRight
                                                className="text-slate-400 shrink-0"
                                                size={12}
                                              />
                                              <span
                                                className={`text-xs truncate ${isSubCompleted ? "line-through text-slate-400 dark:text-slate-500 font-medium" : "text-slate-700 dark:text-white"}`}
                                              >
                                                {sub.title}
                                              </span>
                                            </div>
                                          </td>

                                          {/* Subtask Client */}
                                          <td className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                                              {(() => {
                                                const projId = task.project?._id || task.project;
                                                const projectObj = projects.find(p => p._id === projId);
                                                return projectObj?.client?.companyName || task.project?.client?.companyName || "No Client";
                                              })()}
                                            </span>
                                          </td>

                                          {/* Content-type */}
                                          <td className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <span
                                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-800/80 ${
                                                sub.contentType === "Post"
                                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                                  : sub.contentType === "Story"
                                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                              }`}
                                            >
                                              {sub.contentType || "None"}
                                            </span>
                                          </td>

                                          {/* 4. Status Mode */}
                                          <td
                                            className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30 w-36"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="flex flex-col items-start gap-1 w-full">
                                              <div className="relative w-full">
                                                <button
                                                  onClick={() => setOpenDropdown(openDropdown === sub._id ? null : sub._id)}
                                                  className={`flex items-center justify-between px-2 py-0.5 text-[9px] font-extrabold rounded-lg border tracking-wider cursor-pointer w-full text-left transition-colors ${subStatusStyle.bg}`}
                                                >
                                                  <span>{sub.status === "Pending" ? "Not started" : sub.status === "Completed" ? "Done" : sub.status}</span>
                                                  <FiChevronDown size={8} className={`transition-transform duration-200 ${openDropdown === sub._id ? "rotate-180" : ""}`} />
                                                </button>

                                                {openDropdown === sub._id && (
                                                  <>
                                                    <div
                                                      className="fixed inset-0 z-40 cursor-default"
                                                      onClick={() => setOpenDropdown(null)}
                                                    />
                                                    <div className="absolute left-0 mt-1 w-max min-w-full bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-lg p-1 z-50">
                                                      {[
                                                        { name: "Pending", label: "Not started", color: "bg-slate-400" },
                                                        { name: "In Progress", label: "In Progress", color: "bg-blue-500" },
                                                        { name: "Completed", label: "Done", color: "bg-emerald-500" },
                                                        { name: "On Hold", label: "On Hold", color: "bg-amber-500" }
                                                      ].map((opt) => (
                                                        <button
                                                          key={opt.name}
                                                          onClick={() => {
                                                            const updatedSubtasks = task.subtasks.map((s) =>
                                                              s._id === sub._id ? { ...s, status: opt.name } : s
                                                            );
                                                            handleTaskFieldChange(task._id, { subtasks: updatedSubtasks });
                                                            setOpenDropdown(null);
                                                          }}
                                                          className={`flex items-center gap-1.5 w-full text-left px-2 py-1 rounded-lg text-[9px] font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                                                            sub.status === opt.name
                                                              ? "text-blue-600 dark:text-[#e5ff00]"
                                                              : "text-slate-700 dark:text-slate-350"
                                                          }`}
                                                        >
                                                          <span className={`w-1 h-1 rounded-full ${opt.color}`} />
                                                          <span>{opt.label}</span>
                                                        </button>
                                                      ))}
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                              <TimeTracker 
                                                startTime={sub.actualStartTime} 
                                                endTime={sub.actualEndTime} 
                                                status={sub.status} 
                                              />
                                            </div>
                                          </td>

                                          {/* Start Date */}
                                          <td className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <span
                                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                                                sub.startDate
                                                  ? "bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30"
                                                  : "text-slate-400 dark:text-slate-655 border border-dashed border-slate-200 dark:border-[#1e293b]/40"
                                              }`}
                                            >
                                              <FiCalendar size={11} />
                                              {formatDate(sub.startDate)}
                                            </span>
                                          </td>

                                          {/* 5. Due Date */}
                                          <td className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <span
                                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                                                sub.dueDate
                                                  ? "bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30"
                                                  : "text-slate-400 dark:text-slate-650 border border-dashed border-slate-200 dark:border-[#1e293b]/40"
                                              }`}
                                            >
                                              <FiCalendar size={11} />
                                              {formatDate(sub.dueDate)}
                                            </span>
                                          </td>

                                          {/* 7. Assignee */}
                                          <td className="px-6 py-1.5 border-r border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            {task.createdBy ? (
                                              <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/35 flex items-center justify-center text-[9px] font-black text-blue-700 dark:text-blue-400 overflow-hidden">
                                                  {task.createdBy.profile?.profileImage?.url || task.createdBy.profileImage?.url ? (
                                                    <img src={task.createdBy.profile?.profileImage?.url || task.createdBy.profileImage.url} alt={task.createdBy.name} className="w-full h-full object-cover" />
                                                  ) : (
                                                    task.createdBy.name?.charAt(0).toUpperCase()
                                                  )}
                                                </div>
                                                <span className="font-semibold text-slate-707 dark:text-slate-355">{task.createdBy.name}</span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-405 dark:text-slate-600">—</span>
                                            )}
                                          </td>

                                          {/* 8. Created Time */}
                                          <td className="px-6 py-1.5 border-b border-slate-100/60 dark:border-[#1e293b]/30">
                                            <span className="text-slate-400">—</span>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  }
                                </React.Fragment>
                              );
                            })
                          ) : (
                            <tr className="bg-slate-50/10 dark:bg-slate-900/5 text-slate-450 dark:text-slate-500">
                              <td colSpan={10} className="px-6 py-3 text-center border-b border-slate-200/60 dark:border-[#1e293b]/30 text-xs font-semibold italic">
                                No tasks in {section.label}
                              </td>
                            </tr>
                          )
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

            {/* Pagination Controls (disabled as list view shows all tasks grouped by section) */}
            {false && totalItems > itemsPerPage && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0f172a]/40 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Side: Info */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Showing{" "}
                  <span className="font-extrabold text-slate-850 dark:text-white">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                  </span>{" "}
                  to{" "}
                  <span className="font-extrabold text-slate-850 dark:text-white">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of{" "}
                  <span className="font-extrabold text-slate-850 dark:text-white">
                    {totalItems}
                  </span>{" "}
                  tasks
                </div>

                {/* Right Side: Page buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className={`h-8 w-8 rounded-xl border text-[10px] font-bold flex items-center justify-center transition-all ${
                        currentPage === 1
                          ? "border-slate-205 dark:border-slate-800/80 text-slate-350 dark:text-slate-700 cursor-not-allowed"
                          : "border-slate-205 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-[#e5ff00]/5 text-slate-700 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#e5ff00] hover:text-blue-600 dark:hover:text-[#e5ff00] active:scale-90 cursor-pointer shadow-sm"
                      }`}
                    >
                      <FiChevronLeft size={14} className="stroke-[2.5]" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        const isSelected = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 rounded-xl border text-[10px] font-extrabold flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md"
                                : "border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-[#e5ff00]/5 hover:border-blue-400 dark:hover:border-[#e5ff00] hover:text-blue-600 dark:hover:text-[#e5ff00] active:scale-90 cursor-pointer shadow-sm"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`h-8 w-8 rounded-xl border text-[10px] font-bold flex items-center justify-center transition-all ${
                        currentPage === totalPages
                          ? "border-slate-205 dark:border-slate-800/80 text-slate-350 dark:text-slate-700 cursor-not-allowed"
                          : "border-slate-205 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-[#e5ff00]/5 text-slate-700 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#e5ff00] hover:text-blue-600 dark:hover:text-[#e5ff00] active:scale-90 cursor-pointer shadow-sm"
                      }`}
                    >
                      <FiChevronRight size={14} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Cards List View (Removed as user requested responsive table for all devices) */}
            <div className="hidden">
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
                        <span
                          className={`text-xs font-bold text-slate-800 dark:text-slate-200 ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""}`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Dropdown status */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task._id, e.target.value)
                          }
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg border  tracking-wider cursor-pointer ${statusStyle.bg}`}
                        >
                          <option
                            value="Pending"
                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          >
                            Pending
                          </option>
                          <option
                            value="In Progress"
                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          >
                            In Progress
                          </option>
                          <option
                            value="Completed"
                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          >
                            Completed
                          </option>
                          <option
                            value="On Hold"
                            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          >
                            On Hold
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Meta Section */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Project */}
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold  tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                        <FiBriefcase size={10} />
                        {task.project?.name || "Internal"}
                      </span>

                      {/* Priority */}
                      <span
                        className={`px-1.5 py-0.5 rounded-md border text-[8px] font-black  tracking-wider ${getPriorityStyle(task.priority || "Medium")}`}
                      >
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
                          {isExpanded ? (
                            <FiChevronDown size={12} />
                          ) : (
                            <FiChevronRight size={12} />
                          )}
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
                                <span
                                  className={`text-[11px] text-slate-700 dark:text-slate-300 font-semibold ${isSubCompleted ? "line-through text-slate-400" : ""}`}
                                >
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
        )}

      {/* OFF-CANVAS PREVIEW DRAWER */}
      <AnimatePresence>
        {false && (
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
              className="relative w-full max-w-md bg-white dark:bg-[#0f172a] h-full shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col z-10 border-l border-slate-100 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                    <FiCheckSquare size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-yellow-50  tracking-wider">
                      Task Workspace
                    </h2>
                    <p className="text-[10px] text-slate-450 font-bold  tracking-wider mt-0.5">
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
                  <label className="text-[10px] font-black text-slate-400  tracking-wider">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiTag size={12} /> Status
                    </label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) =>
                        handleTaskFieldChange(selectedTask._id, {
                          status: e.target.value,
                        })
                      }
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${getStatusStyle(selectedTask.status).bg}`}
                    >
                      <option
                        value="Pending"
                        className={getStatusStyle("Pending").bg}
                      >
                        Pending
                      </option>
                      <option
                        value="In Progress"
                        className={getStatusStyle("In Progress").bg}
                      >
                        In Progress
                      </option>
                      <option
                        value="Completed"
                        className={getStatusStyle("Completed").bg}
                      >
                        Completed
                      </option>
                      <option
                        value="On Hold"
                        className={getStatusStyle("On Hold").bg}
                      >
                        On Hold
                      </option>
                    </select>
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiAlertCircle size={12} /> Priority
                    </label>
                    <select
                      value={selectedTask.priority || "Medium"}
                      onChange={(e) =>
                        handleTaskFieldChange(selectedTask._id, {
                          priority: e.target.value,
                        })
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
                    <label className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Start Date
                    </label>
                    <input
                      type="date"
                      value={
                        selectedTask.startDate
                          ? new Date(selectedTask.startDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleTaskFieldChange(selectedTask._id, {
                          startDate: e.target.value,
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* End Date (Due Date) Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> End Date
                    </label>
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Associated Project (Read-only badge style) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiBriefcase size={12} /> Project
                    </label>
                    <div className="w-full bg-slate-100/60 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 truncate">
                      {selectedTask.project?.name || "Internal task"}
                    </div>
                  </div>
                </div>

                {/* Comments & Attachments */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
                    Discussion & Attachments
                  </h3>

                  {/* Attachments List */}
                  {selectedTask.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTask.attachments.map((att) => (
                        <a
                          key={att._id || att.url}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
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
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {comment.user?.name || "Unknown User"}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg rounded-tl-none border border-slate-100 dark:border-slate-700">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedTask.comments?.length === 0 && (
                      <div className="text-[10px] text-slate-400 italic">
                        No comments yet.
                      </div>
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
                      <label
                        htmlFor="my-task-attachment"
                        className={`p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
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
                  <label className="text-[10px] font-black text-slate-400  tracking-wider flex items-center gap-1.5">
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
                    {!selectedTask.subtasks ||
                    selectedTask.subtasks.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 italic text-[11px] font-bold">
                        No subtasks assigned yet. Type above to add.
                      </div>
                    ) : (
                      selectedTask.subtasks.map((sub) => {
                        const isSubCompleted = sub.status === "Completed";
                        const subStatusStyle = getStatusStyle(sub.status);
                        return (
                          <div
                            key={sub._id}
                            className="bg-slate-50/75 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3 group"
                          >
                            {/* Top row: Checkbox, Title, Delete */}
                            <div className="flex items-center gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={() =>
                                  handleToggleSubtask(selectedTask, sub)
                                }
                                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  isSubCompleted
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-slate-350 dark:border-slate-700 hover:border-emerald-500 text-transparent"
                                }`}
                              >
                                <FiCheck size={10} />
                              </button>

                              {/* Editable Title */}
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) =>
                                  handleUpdateSubtaskField(
                                    selectedTask,
                                    sub._id,
                                    {
                                      title: e.target.value,
                                    },
                                  )
                                }
                                className={`flex-1 min-w-0 bg-transparent border-0 font-extrabold text-xs text-slate-800 dark:text-white focus:ring-0 focus:outline-none p-0 ${
                                  isSubCompleted
                                    ? "line-through text-slate-400 font-medium"
                                    : ""
                                }`}
                              />

                              {/* Delete */}
                              <button
                                onClick={() =>
                                  handleDeleteSubtask(selectedTask, sub._id)
                                }
                                className="text-slate-400 hover:text-rose-600 transition-colors duration-150 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>

                            {/* Bottom row: Status, Priority, Start Date, End Date */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              {/* Status Select */}
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Status
                                </label>
                                <select
                                  value={sub.status || "Pending"}
                                  onChange={(e) =>
                                    handleUpdateSubtaskField(
                                      selectedTask,
                                      sub._id,
                                      {
                                        status: e.target.value,
                                      },
                                    )
                                  }
                                  className={`w-full px-2 py-1 text-[9px] font-extrabold rounded-lg border tracking-wider cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${subStatusStyle.bg}`}
                                >
                                  <option
                                    value="Pending"
                                    className={getStatusStyle("Pending").bg}
                                  >
                                    Pending
                                  </option>
                                  <option
                                    value="In Progress"
                                    className={getStatusStyle("In Progress").bg}
                                  >
                                    In Progress
                                  </option>
                                  <option
                                    value="Completed"
                                    className={getStatusStyle("Completed").bg}
                                  >
                                    Completed
                                  </option>
                                  <option
                                    value="On Hold"
                                    className={getStatusStyle("On Hold").bg}
                                  >
                                    On Hold
                                  </option>
                                </select>
                              </div>

                              {/* Priority Select */}
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                                  Priority
                                </label>
                                <select
                                  value={sub.priority || "Medium"}
                                  onChange={(e) =>
                                    handleUpdateSubtaskField(
                                      selectedTask,
                                      sub._id,
                                      {
                                        priority: e.target.value,
                                      },
                                    )
                                  }
                                  className={`w-full px-2 py-1 text-[9px] font-extrabold rounded-lg border focus:outline-none cursor-pointer ${
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
                              </div>

                              {/* Start Date Picker */}
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-wider">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={
                                    sub.startDate
                                      ? new Date(sub.startDate)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleUpdateSubtaskField(
                                      selectedTask,
                                      sub._id,
                                      {
                                        startDate: e.target.value || null,
                                      },
                                    )
                                  }
                                  className="w-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200/50 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-lg px-2 py-1 text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                                />
                              </div>

                              {/* End Date Picker */}
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-wider">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={
                                    sub.dueDate
                                      ? new Date(sub.dueDate)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleUpdateSubtaskField(
                                      selectedTask,
                                      sub._id,
                                      {
                                        dueDate: e.target.value || null,
                                      },
                                    )
                                  }
                                  className="w-full bg-rose-50 dark:bg-rose-500/20 border border-rose-200/50 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 rounded-lg px-2 py-1 text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors cursor-pointer"
                                />
                              </div>
                            </div>
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
