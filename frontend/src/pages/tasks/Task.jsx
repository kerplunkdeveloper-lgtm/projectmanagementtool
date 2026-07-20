import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { BiFile } from "react-icons/bi";
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
  useDeleteTaskMutation,
} from "../../features/api/apiSlice";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";
import ClientBadge from "../../components/common/ClientBadge";
import { getClientIconComponent } from "../../utils/clientHelpers";

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

const TimeTracker = ({
  startTime,
  endTime,
  status,
  isBlocked,
  blockerPausedAt,
  blockerHistory,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [blockedMs, setBlockedMs] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      const end = endTime ? new Date(endTime).getTime() : Date.now();

      let totalPauseMs = 0;
      if (blockerHistory && blockerHistory.length > 0) {
        blockerHistory.forEach((item) => {
          if (item.pausedAt && item.resumedAt) {
            const p = new Date(item.pausedAt).getTime();
            const r = new Date(item.resumedAt).getTime();
            if (r >= p) {
              totalPauseMs += r - p;
            }
          }
        });
      }

      if (isBlocked && blockerPausedAt) {
        const pauseStart = new Date(blockerPausedAt).getTime();
        const currentPause = Date.now() - pauseStart;
        if (currentPause > 0) {
          totalPauseMs += currentPause;
        }
      }

      const totalElapsedMs = end - start - totalPauseMs;
      return {
        active: Math.max(0, Math.floor(totalElapsedMs / 1000)),
        blocked: Math.max(0, Math.floor(totalPauseMs / 1000)),
      };
    };

    const update = () => {
      const { active, blocked } = calculateTime();
      setElapsed(active);
      setBlockedMs(blocked);
    };

    update();

    if (status === "In Progress" && !endTime) {
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, status, isBlocked, blockerPausedAt, blockerHistory]);

  if (!startTime && status !== "In Progress") return null;
  if (!startTime && status === "In Progress")
    return (
      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-[#3b82f6] dark:border-[#3b82f6]/30 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#3b82f6] animate-pulse"></span>
        Starting...
      </div>
    );

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  };

  const activeStr = formatTime(elapsed);
  const blockedStr = formatTime(blockedMs);
  const totalStr = formatTime(elapsed + blockedMs);

  return (
    <div className="flex flex-col gap-1 w-[120px] text-[9px] font-bold tracking-wide">
      <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400">
        <span>Active:</span>
        <span>{activeStr}</span>
      </div>
      {(blockedMs > 0 || isBlocked) && (
        <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 px-1.5 py-0.5 rounded text-orange-700 dark:text-orange-400">
          <span>Blocked:</span>
          <span>{blockedStr}</span>
        </div>
      )}
      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600/50 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-100 shadow-sm">
        <span>Total:</span>
        <span>{totalStr}</span>
      </div>
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
  const [deleteTask] = useDeleteTaskMutation();
  const [selectedTasks, setSelectedTasks] = useState([]);

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
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

  // Blocker Modal states
  const [blockerModalTask, setBlockerModalTask] = useState(null);
  const [blockerType, setBlockerType] = useState("Client Call");
  const [blockerDescription, setBlockerDescription] = useState("");
  const [blockerExpectedTime, setBlockerExpectedTime] = useState("15 mins");
  const [blockerPriority, setBlockerPriority] = useState("Normal");

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

  // Get unique clients for dropdown filter
  const uniqueClients = React.useMemo(() => {
    const clientsMap = {};
    myTasks.forEach((t) => {
      const projId = t.project?._id || t.project;
      const projectObj = projects.find((p) => p._id === projId);
      const client = projectObj?.client || t.project?.client;
      if (client) {
        const cId = client._id || client.id;
        clientsMap[cId] = {
          id: cId,
          name: client.companyName || "No Company Name",
          color: client.color || "#3b82f6",
          icon: client.icon || "FaRegBuilding",
        };
      }
    });
    return Object.values(clientsMap);
  }, [myTasks, projects]);

  const getTaskDisplayId = (task) => {
    if (!task || !task._id) return "";

    // Find the project object from projects array
    const projId = task.project?._id || task.project;
    const projectObj = projects.find((p) => p._id === projId);

    // Project Name first character (upper case, fallback to 'P')
    const projChar = (projectObj?.name || task.project?.name || "P")
      .charAt(0)
      .toUpperCase();

    // Client Name first 2 characters (upper case, fallback to 'XX')
    const client = projectObj?.client || task.project?.client;
    const clientName = client?.companyName || "";
    const clientChars = clientName
      ? clientName.substring(0, 2).toUpperCase().padEnd(2, "X")
      : "XX";

    // Get all tasks for this project
    const projectTasks = tasks.filter(
      (t) => (t.project?._id || t.project) === projId,
    );

    // Sort stably by createdAt or _id
    const sortedByCreation = [...projectTasks].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a._id || "").localeCompare(b._id || "");
    });

    const idx = sortedByCreation.findIndex((t) => t._id === task._id);
    const num = idx !== -1 ? idx + 1 : 1;
    return `${projChar}${clientChars}T${num}`;
  };

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
    return `${day} ${month}`;
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
      // Priority filter
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      // Project filter
      const taskProjectId = task.project?._id || task.project;
      const matchesProject =
        projectFilter === "All" || taskProjectId === projectFilter;

      // Client filter
      const projectObj = projects.find((p) => p._id === taskProjectId);
      const clientObj = projectObj?.client || task.project?.client;
      const clientId = clientObj?._id || clientObj?.id;
      const matchesClient = clientFilter === "All" || clientId === clientFilter;

      // Search term
      const projectName = projectObj?.name || task.project?.name || "";
      const clientName = clientObj?.companyName || "";
      const matchesSearch =
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesPriority && matchesProject && matchesClient && matchesSearch
      );
    });
  }, [
    myTasks,
    priorityFilter,
    projectFilter,
    clientFilter,
    searchTerm,
    projects,
  ]);

  const counts = React.useMemo(() => {
    const res = {
      All: filteredTasksWithoutStatus.length,
      Pending: 0,
      "In Progress": 0,
      Completed: 0,
      "On Hold": 0,
    };
    filteredTasksWithoutStatus.forEach((t) => {
      const status = t.status || "Pending";
      if (res[status] !== undefined) {
        res[status]++;
      }
    });
    return res;
  }, [filteredTasksWithoutStatus]);

  const filteredTasks = React.useMemo(() => {
    const list = filteredTasksWithoutStatus.filter((task) => {
      return statusFilter === "All" || task.status === statusFilter;
    });
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [filteredTasksWithoutStatus, statusFilter]);

  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Paginated tasks
  const paginatedTasks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // sortedTasks alias for list view
  const sortedTasks = filteredTasks;

  // Find currently selected task for drawer preview
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  // General field change update
  const handleTaskFieldChange = (taskId, fields) => {
    const sanitizedFields = { ...fields };
    if (sanitizedFields.startDate === "") sanitizedFields.startDate = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;
    updateTaskTrigger({ id: taskId, taskData: sanitizedFields });
  };

  // Blocker handlers
  const handleOpenBlockerModal = (task) => {
    setBlockerModalTask(task);
    setBlockerType("Client Call");
    setBlockerDescription("");
    setBlockerExpectedTime("15 mins");
    setBlockerPriority("Normal");
  };

  const handleSubmitBlocker = () => {
    if (!blockerModalTask) return;
    if (!blockerDescription.trim()) {
      toast.error("Please enter a blocker description");
      return;
    }

    const fields = {
      isBlocked: true,
      blockerType,
      blockerDescription: blockerDescription.trim(),
      blockerExpectedTime,
      blockerPriority,
      blockerPausedAt: new Date().toISOString(),
    };

    handleTaskFieldChange(blockerModalTask._id, fields);
    setSelectedTaskId(blockerModalTask._id);
    setBlockerModalTask(null);
    toast.success("Task paused - Blocker added");
  };

  const handleResumeTask = (task) => {
    const pausedAt = task.blockerPausedAt || new Date().toISOString();
    const resumedAt = new Date().toISOString();
    const totalPauseMinutes = Math.max(
      1,
      Math.round(
        (new Date(resumedAt).getTime() - new Date(pausedAt).getTime()) / 60000,
      ),
    );

    const newHistoryItem = {
      blockerType: task.blockerType || "Unknown",
      blockerDescription:
        task.blockerDescription || task.blockerReason || "No details",
      blockerExpectedTime: task.blockerExpectedTime || "Unknown",
      blockerPriority: task.blockerPriority || "Normal",
      pausedAt: pausedAt,
      resumedAt: resumedAt,
      totalPauseMinutes: totalPauseMinutes,
    };

    const updatedHistory = [...(task.blockerHistory || []), newHistoryItem];

    const fields = {
      isBlocked: false,
      blockerResumedAt: resumedAt,
      blockerHistory: updatedHistory,
      status: "In Progress", // resume to In Progress
    };

    handleTaskFieldChange(task._id, fields);
    toast.success("Task resumed successfully!");
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

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTasks.length} selected task(s)?`)) {
      try {
        await Promise.all(selectedTasks.map(id => deleteTask(id).unwrap()));
        setSelectedTasks([]);
        toast.success("Tasks deleted successfully!");
      } catch (err) {
        toast.error("Failed to delete some tasks");
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTasks(sortedTasks.map(t => t._id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const getStatusStyle = (status, isBlocked) => {
    if (isBlocked) {
      return {
        bg: "!bg-orange-50/90 !text-orange-700 !border-orange-200 dark:!bg-orange-950/40 dark:!text-orange-400 dark:!border-orange-900/40",
        dot: "bg-orange-500",
        icon: FiAlertCircle,
      };
    }
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
      case "IN-REVIEW":
      case "In Review":
      case "IN-Review":
        return {
          bg: "!bg-sky-50 !text-sky-700 !border-sky-200 dark:!bg-sky-500/20 dark:!text-sky-350 dark:!border-sky-500/40",
          dot: "bg-sky-500",
          icon: FiClock,
        };
      case "Rejected":
        return {
          bg: "!bg-rose-50 !text-rose-700 !border-rose-200 dark:!bg-rose-500/20 dark:!text-rose-350 dark:!border-rose-500/40",
          dot: "bg-rose-500",
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
      case "General":
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
      case "Top High":
        return "badge-priority-top-high";
      case "High":
        return "badge-priority-high";
      case "Medium":
        return "badge-priority-medium";
      case "Low":
        return "badge-priority-low";
      default:
        return "badge-priority-medium";
    }
  };

  return (
    <div className="px-0 py-1 space-y-4 pb-16">
      {/* UNIFIED HEADER & CONTROLS */}

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white dark:bg-[#11131e] p-2 relative z-20">
        {/* Left: Bulk Actions */}
        <div className="flex items-center w-full xl:w-auto min-h-[36px]">
          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{selectedTasks.length} selected</span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-xs font-bold shadow-sm"
              >
                <FiTrash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Center: View Toggle */}
        <div className="flex bg-slate-50 dark:bg-black p-1 rounded-xl shrink-0 w-full xl:w-auto mx-auto justify-center">
          <button
            onClick={() => setViewType("list")}
            className={`flex items-center justify-center gap-2 px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === "list" ? "bg-white dark:bg-[#11131e] text-blue-600 dark:text-[#3b82f6] shadow-sm border theme-border-accent" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <FiList size={14} /> List
          </button>
          <button
            onClick={() => setViewType("kanban")}
            className={`flex items-center justify-center gap-2 px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === "kanban" ? "bg-white dark:bg-[#11131e] text-blue-600 dark:text-[#3b82f6] shadow-sm border theme-border-accent" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <FiGrid size={14} /> Kanban
          </button>
        </div>

        {/* Right: Filter Action */}
        <div className="flex items-center justify-end gap-2.5 w-full xl:w-auto">
          <button
            onClick={() => setFilterPanelOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              priorityFilter !== "All" ||
              projectFilter !== "All" ||
              statusFilter !== "All" ||
              clientFilter !== "All"
                ? "bg-blue-50 dark:bg-[#3b82f6]/10 border-blue-200 dark:border-[#3b82f6]/30 text-blue-700 dark:text-[#3b82f6]"
                : "bg-white dark:bg-black border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <FiFilter size={14} />
            Filter
            {(priorityFilter !== "All" ||
              projectFilter !== "All" ||
              statusFilter !== "All" ||
              clientFilter !== "All") && (
              <span className="flex items-center justify-center bg-blue-600 dark:bg-[#3b82f6] text-white dark:text-black text-[9px] w-4 h-4 rounded-full font-black">
                {
                  [
                    priorityFilter,
                    projectFilter,
                    statusFilter,
                    clientFilter,
                  ].filter((f) => f !== "All").length
                }
              </span>
            )}
          </button>
        </div>
      </div>

      {/* OFFCANVAS FILTER PANEL */}
      <AnimatePresence>
        {filterPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterPanelOpen(false)}
              className="fixed inset-0 z-40 bg-transparent"
            />
            {/* Offcanvas Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.28 }}
              className="fixed top-0 right-0 h-full w-[320px] z-50 bg-white dark:bg-[#0b0f1a] border-l border-slate-200 dark:border-white/5 shadow-2xl flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-[#3b82f6]/10 flex items-center justify-center">
                    <FiFilter
                      size={13}
                      className="text-blue-600 dark:text-[#3b82f6]"
                    />
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Filters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(priorityFilter !== "All" ||
                    projectFilter !== "All" ||
                    statusFilter !== "All" ||
                    clientFilter !== "All") && (
                    <button
                      onClick={() => {
                        setPriorityFilter("All");
                        setProjectFilter("All");
                        setStatusFilter("All");
                        setClientFilter("All");
                      }}
                      className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setFilterPanelOpen(false)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto sidebar-scrollbar p-5 space-y-6">
                {/* Status */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        name: "All",
                        label: "All Statuses",
                        color: "bg-slate-400",
                      },
                      {
                        name: "Pending",
                        label: "Pending",
                        color: "bg-slate-400",
                      },
                      {
                        name: "In Progress",
                        label: "In Progress",
                        color: "bg-amber-500",
                      },
                      {
                        name: "IN-REVIEW",
                        label: "In Review",
                        color: "bg-sky-500",
                      },
                      {
                        name: "Completed",
                        label: "Completed",
                        color: "bg-emerald-500",
                      },
                      {
                        name: "On Hold",
                        label: "On Hold",
                        color: "bg-rose-500",
                      },
                      {
                        name: "Rejected",
                        label: "Rejected",
                        color: "bg-red-500",
                      },
                    ].map((st) => (
                      <button
                        key={st.name}
                        onClick={() => setStatusFilter(st.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all border ${
                          statusFilter === st.name
                            ? "bg-blue-600 border-blue-600 text-white dark:bg-[#3b82f6] dark:border-[#3b82f6] dark:text-black shadow-md"
                            : "bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#3b82f6]/40"
                        }`}
                      >
                        {st.name !== "All" && (
                          <span
                            className={`w-2 h-2 rounded-full ${st.color} shrink-0`}
                          />
                        )}
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-white/5" />

                {/* Priority */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        name: "All",
                        label: "All Priorities",
                        color: "bg-slate-400",
                      },
                      { name: "Low", label: "Low", color: "bg-slate-400" },
                      {
                        name: "Medium",
                        label: "Medium",
                        color: "bg-amber-500",
                      },
                      { name: "High", label: "High", color: "bg-rose-500" },
                      {
                        name: "Top High",
                        label: "Top High",
                        color: "bg-purple-600",
                      },
                    ].map((priority) => (
                      <button
                        key={priority.name}
                        onClick={() => setPriorityFilter(priority.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all border ${
                          priorityFilter === priority.name
                            ? "bg-blue-600 border-blue-600 text-white dark:bg-[#3b82f6] dark:border-[#3b82f6] dark:text-black shadow-md"
                            : "bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#3b82f6]/40"
                        }`}
                      >
                        {priority.name !== "All" && (
                          <span
                            className={`w-2 h-2 rounded-full ${priority.color} shrink-0`}
                          />
                        )}
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-white/5" />

                {/* Client */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Client
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setClientFilter("All")}
                      className={`w-full text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                        clientFilter === "All"
                          ? "bg-blue-600 border-blue-600 text-white dark:bg-[#3b82f6] dark:border-[#3b82f6] dark:text-black"
                          : "bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                      }`}
                    >
                      All Clients
                    </button>
                    {uniqueClients.map((c) => {
                      const ClientIcon = getClientIconComponent(c.icon);
                      const isSelected = clientFilter === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setClientFilter(c.id)}
                          className={`w-full flex items-center gap-2 text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                            isSelected
                              ? "text-white dark:text-black font-extrabold"
                              : "text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#3b82f6]/40"
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? c.color
                              : "transparent",
                            borderColor: isSelected
                              ? c.color
                              : "rgba(148, 163, 184, 0.1)",
                          }}
                        >
                          <span
                            className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0"
                            style={{
                              backgroundColor: isSelected
                                ? "rgba(255, 255, 255, 0.2)"
                                : `${c.color}15`,
                              color: isSelected ? "#ffffff" : c.color,
                            }}
                          >
                            <ClientIcon size={10} />
                          </span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-white/5" />

                {/* Project */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Project
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setProjectFilter("All")}
                      className={`w-full text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                        projectFilter === "All"
                          ? "bg-blue-600 border-blue-600 text-white dark:bg-[#3b82f6] dark:border-[#3b82f6] dark:text-black"
                          : "bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                      }`}
                    >
                      All Projects
                    </button>
                    {uniqueProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProjectFilter(p.id)}
                        className={`w-full flex items-center gap-2 text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                          projectFilter === p.id
                            ? "bg-blue-600 border-blue-600 text-white dark:bg-[#3b82f6] dark:border-[#3b82f6] dark:text-black"
                            : "bg-slate-50 border-slate-200 dark:bg-white/[0.03] dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-600 dark:bg-[#3b82f6]/20 dark:text-[#3b82f6] flex items-center justify-center text-[8px] font-extrabold shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => setFilterPanelOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 dark:bg-[#3b82f6] text-white dark:text-black text-xs font-black uppercase tracking-wider hover:bg-blue-700 dark:hover:bg-[#3b82f6]/90 transition-colors"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TASK LIST CONTAINER */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#11131e] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
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
          {[
            "Pending",
            "In Progress",
            "IN-REVIEW",
            "On Hold",
            "Completed",
            "Rejected",
          ].map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => {
              if (colStatus === "IN-REVIEW") {
                return (
                  t.status === "IN-REVIEW" ||
                  t.status === "In Review" ||
                  t.status === "IN-Review"
                );
              }
              return t.status === colStatus;
            });
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
                    <div className="bg-white/50 dark:bg-[#11131e]/30 border-2 border-slate-200/50 dark:border-slate-800/40 border-dashed rounded-2xl h-32 flex flex-col items-center justify-center text-center px-4 transition-colors">
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
                          className={`bg-white dark:bg-[#11131e] shadow-sm hover:shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/60 transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-3 ${
                            draggedTaskId === task._id
                              ? "opacity-50 scale-95 border-blue-500"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase ${getPriorityStyle(task.priority || "Medium")}`}
                              >
                                {task.priority || "Medium"}
                              </span>
                              {task.isBlocked && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/40 font-extrabold text-[8.5px] whitespace-nowrap tracking-wider uppercase animate-pulse">
                                  <FiAlertCircle size={9} /> Blocked
                                </span>
                              )}
                            </div>
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
                            className={`text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug flex flex-col gap-1.5 ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""}`}
                          >
                            <span>{task.title}</span>
                            {task.isBlocked && task.blockerReason && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-450 italic font-semibold normal-case bg-rose-500/5 dark:bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-950/40">
                                Blocker: {task.blockerReason}
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center justify-between pt-4 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40">
                                <FiBriefcase size={10} />
                                {(() => {
                                  const projId =
                                    task.project?._id || task.project;
                                  const projectObj = projects.find(
                                    (p) => p._id === projId,
                                  );
                                  return (
                                    projectObj?.name ||
                                    task.project?.name ||
                                    "Internal"
                                  );
                                })()}
                              </span>
                              {(() => {
                                const projId =
                                  task.project?._id || task.project;
                                const projectObj = projects.find(
                                  (p) => p._id === projId,
                                );
                                const client =
                                  projectObj?.client || task.project?.client;
                                if (client?.companyName) {
                                  return (
                                    <ClientBadge client={client} size="sm" />
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
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f111a] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-200 dark:border-slate-800/80 transition-all">
            <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-200px)] min-h-[500px] w-full scrollbar-thin">
              <table className="w-full min-w-[1300px] text-left border-collapse table-auto border border-slate-200/70 dark:border-transparent">
                <thead>
                  <tr className="sticky top-0 z-20 uppercase text-center bg-slate-50 dark:bg-[#11131e] text-slate-500 dark:text-slate-400 text-[10.5px] sm:text-[9px] font-black tracking-wider border-b border-slate-200/70 dark:border-transparent shadow-sm">
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-16">
                      ID
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-20">
                      Priority
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent min-w-[180px] whitespace-nowrap">
                      Task Name
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent min-w-[250px] md:min-w-[400px] w-auto whitespace-nowrap">
                      Content Copy
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-24">
                      Client
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 whitespace-nowrap">
                      Content-type
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-48 min-w-[180px]">
                      Status
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 min-w-[125px]">
                      Blocker
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 whitespace-nowrap">
                      Time tracker
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-28">
                      Revision
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32">
                      Start Date
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32">
                      End Date
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-44">
                      Assigned By
                    </th>
                    <th className="px-3 py-2 border border-slate-200/70 dark:border-transparent min-w-[200px] w-56">
                      Created Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {sortedTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="px-6 py-8 text-center text-slate-450 dark:text-slate-500 font-bold bg-slate-50/5 dark:bg-slate-900/5 text-xs"
                      >
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    sortedTasks.map((task) => {
                      const isCompleted = task.status === "Completed";
                      const statusStyle = getStatusStyle(
                        task.status,
                        task.isBlocked,
                      );
                      const isExpanded = !!expandedTasks[task._id];

                      return (
                        <React.Fragment key={task._id}>
                          <tr
                            className={`hover:bg-slate-50/40 dark:hover:bg-[#1a1d2d] transition-colors group cursor-pointer ${
                              isCompleted
                                ? "bg-slate-50/20 text-slate-400 dark:text-slate-500"
                                : task.priority === "Top High"
                                  ? "row-priority-top-high text-slate-700 dark:text-slate-200"
                                  : "text-slate-700 dark:text-slate-200"
                            }`}
                            onClick={() => setSelectedTaskId(task._id)}
                          >
                            {/* ID */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent font-bold text-[11px] text-slate-500 dark:text-slate-400 text-center">
                              {getTaskDisplayId(task)}
                            </td>

                            {/* Priority Badge */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent text-center">
                              <span
                                className={`inline-block text-center w-16  py-2 text-[11px] sm:text-[10px] rounded-[15px] font-bold uppercase whitespace-nowrap ${getPriorityStyle(task.priority || "Medium")}`}
                              >
                                {task.priority || "Medium"}
                              </span>
                            </td>

                            {/* Title & Subtasks Dropdown */}
                            <td className="px-3 py-2 font-bold border border-slate-200/70 dark:border-transparent text-left">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-xs sm:text-[11px] ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-white"}`}
                                >
                                  <span className="flex items-center gap-1 text-[12.5px] sm:text-[12px] whitespace-nowrap">
                                    <BiFile /> {task.title}
                                  </span>
                                </span>
                                {task.isBlocked && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/45 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] sm:text-[10px] font-black tracking-wider uppercase animate-pulse shrink-0"
                                    title={task.blockerReason || "Blocked"}
                                  >
                                    <FiAlertCircle size={10} /> Blocked
                                  </span>
                                )}
                                {task.subtasks?.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskExpanded(task._id);
                                    }}
                                    className="text-slate-405 hover:text-blue-600 flex items-center gap-0.5 text-xs sm:text-[10px] font-extrabold shrink-0"
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

                            {/* Content Copy */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent">
                              <div className="text-xs sm:text-[11px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap break-words min-w-[200px] w-full">
                                {task.contentCopy || <span className="text-slate-400 italic font-normal">—</span>}
                              </div>
                            </td>

                            {/* Client Name */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent text-center">
                              {(() => {
                                const projId =
                                  task.project?._id || task.project;
                                const projectObj = projects.find(
                                  (p) => p._id === projId,
                                );
                                const client =
                                  projectObj?.client || task.project?.client;
                                if (client) {
                                  return (
                                    <ClientBadge client={client} size="sm" />
                                  );
                                }
                                return (
                                  <span className="text-slate-400 italic text-xs sm:text-[10px]">
                                    No Client
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Content-type */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent whitespace-nowrap text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-xs sm:text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap ${(() => {
                                  const t = (
                                    task.contentType || ""
                                  ).toUpperCase();
                                  switch (t) {
                                    case "VIDEO":
                                    case "WEBSITE":
                                      return "badge-type-video";
                                    case "IMAGE":
                                    case "SEO":
                                      return "badge-type-image";
                                    case "CAROUSEL":
                                    case "VIDEO SHOOT":
                                      return "badge-type-carousel";
                                    case "REEL":
                                      return "badge-type-reel";
                                    case "POST":
                                      return "badge-type-post";
                                    case "STORY":
                                      return "badge-type-story";
                                    default:
                                      return "badge-type-none";
                                  }
                                })()}`}
                              >
                                {task.contentType || "None"}
                              </span>
                            </td>

                            {/* Status Select */}
                            <td
                              className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-48 min-w-[180px] text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {task.isBlocked ? (
                                <div className="px-2.5 py-1 text-[11px] sm:text-[9.5px] font-black rounded-full border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  Paused - Blocked
                                </div>
                              ) : (
                                <div className="relative w-full group">
                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      handleStatusChange(
                                        task._id,
                                        e.target.value,
                                      )
                                    }
                                    className={`appearance-none pl-2.5 pr-6 py-0.5 text-[11px] sm:text-[9.5px] font-bold rounded-full border-2 cursor-pointer w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm hover:shadow ${statusStyle.bg}`}
                                  >
                                    <option
                                      value="Pending"
                                      className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                                    >
                                      Pending
                                    </option>
                                    <option
                                      value="In Progress"
                                      className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                                    >
                                      In Progress
                                    </option>
                                    <option
                                      value="IN-REVIEW"
                                      className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                                    >
                                      In Review
                                    </option>
                                    {task.status === "Completed" && (
                                      <option
                                        value="Completed"
                                        className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                                      >
                                        Completed
                                      </option>
                                    )}
                                    <option
                                      value="On Hold"
                                      className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                                    >
                                      On Hold
                                    </option>
                                    {task.status === "Rejected" && (
                                      <option
                                        value="Rejected"
                                        className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                                      >
                                        Rejected
                                      </option>
                                    )}
                                  </select>
                                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                                    <FiChevronDown size={9} strokeWidth={2.5} />
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Blocker Column */}
                            <td
                              className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 min-w-[125px] hover:relative hover:z-50 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-col gap-1.5 w-full">
                                {task.isBlocked ? (
                                  <div className="space-y-1.5 p-2 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-950/40 rounded-2xl">
                                    <div className="flex justify-between items-center gap-1.5">
                                      <span
                                        className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/45 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-450 text-[10px] sm:text-[8.5px] font-black uppercase tracking-wider truncate max-w-[100px]"
                                        title={task.blockerType}
                                      >
                                        {task.blockerType}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[8px] font-black uppercase ${task.blockerPriority === "Urgent" ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent"}`}
                                      >
                                        {task.blockerPriority}
                                      </span>
                                    </div>
                                    <p
                                      className="text-xs sm:text-[10px] text-slate-600 dark:text-slate-400 font-medium italic line-clamp-2 leading-tight"
                                      title={task.blockerDescription}
                                    >
                                      "{task.blockerDescription}"
                                    </p>
                                    <div className="flex justify-between items-center text-[10px] sm:text-[8.5px] font-bold text-slate-450 dark:text-slate-500">
                                      <span>
                                        ⏳ Exp: {task.blockerExpectedTime}
                                      </span>
                                      <span>
                                        Paused:{" "}
                                        {formatDate(task.blockerPausedAt)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleResumeTask(task)}
                                      className="w-full mt-1 flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-[9px] font-black tracking-wider uppercase bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/10 hover:shadow transition-all cursor-pointer"
                                    >
                                      ✅ Resume Work
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleOpenBlockerModal(task)
                                      }
                                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[9.5px] sm:text-[8px] font-black tracking-wider uppercase bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600/50 text-slate-700 dark:text-slate-200 hover:border-rose-500 hover:text-rose-500 transition-all w-full text-center cursor-pointer shadow-sm whitespace-nowrap"
                                    >
                                      <FiPlus size={10} /> Add Blocker
                                    </button>
                                    {task.blockerHistory &&
                                      task.blockerHistory.length > 0 && (
                                        <div className="relative group/history mt-1 text-center">
                                          <span className="inline-flex items-center gap-1 text-xs sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 hover:text-rose-500 cursor-pointer transition-colors">
                                            ⏱️ Pause History (
                                            {task.blockerHistory.length})
                                          </span>
                                          {/* Tooltip containing details */}
                                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/history:block z-50 w-64 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 text-left space-y-2 pointer-events-none transition-all">
                                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-1 flex justify-between">
                                              <span>Pause Log</span>
                                              <span>
                                                Total Pauses:{" "}
                                                {task.blockerHistory.length}
                                              </span>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-thin pr-1">
                                              {task.blockerHistory.map(
                                                (hist, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="text-[10px] space-y-0.5 border-b border-slate-50 dark:border-slate-900/50 pb-1.5 last:border-0 last:pb-0"
                                                  >
                                                    <div className="flex justify-between font-black text-slate-700 dark:text-slate-350">
                                                      <span className="text-rose-600 dark:text-rose-400">
                                                        {hist.blockerType}
                                                      </span>
                                                      <span className="text-slate-500">
                                                        {hist.totalPauseMinutes}{" "}
                                                        mins
                                                      </span>
                                                    </div>
                                                    {hist.blockerDescription && (
                                                      <p className="text-slate-500 dark:text-slate-450 italic line-clamp-2">
                                                        "
                                                        {
                                                          hist.blockerDescription
                                                        }
                                                        "
                                                      </p>
                                                    )}
                                                    <div className="text-[8px] text-slate-400 dark:text-slate-500 flex justify-between">
                                                      <span>
                                                        In:{" "}
                                                        {formatDateTime(
                                                          hist.pausedAt,
                                                        )}
                                                      </span>
                                                      <span>
                                                        Out:{" "}
                                                        {formatDateTime(
                                                          hist.resumedAt,
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Timer Column */}
                            <td
                              className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 whitespace-nowrap text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TimeTracker
                                startTime={task.actualStartTime}
                                endTime={task.actualEndTime}
                                status={task.status}
                                isBlocked={task.isBlocked}
                                blockerPausedAt={task.blockerPausedAt}
                                blockerHistory={task.blockerHistory}
                              />
                            </td>

                            {/* Revision Column */}
                            <td
                              className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-28 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-center items-center gap-1.5">
                                <span className="font-extrabold text-[11px] text-slate-800 dark:text-yellow-50 text-center">
                                  {task.revisions || 0}
                                </span>
                                {(task.revisions || 0) > 3 && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] animate-pulse"
                                    title="More than 3 revisions"
                                  />
                                )}
                              </div>
                            </td>

                            {/* Start Date */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-[10px] font-bold whitespace-nowrap ${
                                  task.startDate
                                    ? "bg-blue-200 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20"
                                    : "text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-[#1e293b]/40"
                                }`}
                              >
                                <FiCalendar size={11} />
                                {formatDate(task.startDate)}
                              </span>
                            </td>
                            {/* End Date */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent w-32 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-[10px] font-bold whitespace-nowrap ${
                                  task.dueDate
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/20"
                                    : "text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-[#1e293b]/40"
                                }`}
                              >
                                <FiCalendar size={11} />
                                {formatDate(task.dueDate)}
                              </span>
                            </td>

                            {/* Assigned By */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent text-center">
                              {task.createdBy ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/35 flex items-center justify-center text-[9px] font-black text-blue-700 dark:text-blue-400 overflow-hidden">
                                    {task.createdBy.profile?.profileImage
                                      ?.url ||
                                    task.createdBy.profileImage?.url ? (
                                      <img
                                        src={
                                          task.createdBy.profile?.profileImage
                                            ?.url ||
                                          task.createdBy.profileImage.url
                                        }
                                        alt={task.createdBy.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      task.createdBy.name
                                        ?.charAt(0)
                                        .toUpperCase()
                                    )}
                                  </div>
                                  <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                                    {task.createdBy.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Created Time */}
                            <td className="px-3 py-2 border border-slate-200/70 dark:border-transparent text-center">
                              <span className="text-slate-500 dark:text-white font-semibold text-[11px]">
                                <CreatedTime time={task.createdAt} />
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Subtasks */}
                          {isExpanded &&
                            task.subtasks?.length > 0 &&
                            task.subtasks.map((sub, subIdx) => {
                              const isSubCompleted = sub.status === "Completed";
                              const subStatusStyle = getStatusStyle(sub.status);
                              return (
                                <tr
                                  key={sub._id || subIdx}
                                  className={`bg-slate-50/5 dark:bg-[#131522] hover:bg-slate-50/20 dark:hover:bg-[#1c1f30] transition-colors border-b border-slate-200/70 dark:border-transparent ${
                                    isSubCompleted
                                      ? "text-slate-400 dark:text-slate-500"
                                      : "text-slate-700 dark:text-slate-200"
                                  }`}
                                >
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent">
                                    <span
                                      className={`px-2 py-0.5 rounded-lg border text-[10px] sm:text-[9px] font-extrabold tracking-wider uppercase ${getPriorityStyle(sub.priority || "Medium")}`}
                                    >
                                      {sub.priority || "Medium"}
                                    </span>
                                  </td>
                                  {/* Subtask ID */}
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent font-mono font-bold text-[10px] sm:text-[9.5px] text-slate-400 dark:text-slate-500">
                                    {getTaskDisplayId(task)}.{subIdx + 1}
                                  </td>
                                  <td className="px-6 py-1.5 font-bold border-b border-slate-200/70 dark:border-transparent">
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
                                  <td className="px-3 py-2 border-b border-slate-200/70 dark:border-transparent">
                                    <div className="text-xs sm:text-[11px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap break-words min-w-[200px] w-full">
                                      {sub.contentCopy || <span className="text-slate-400 italic font-normal">—</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent" />
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent" />
                                  <td
                                    className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent w-44"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex flex-col items-start gap-1 w-full">
                                      <div className="relative w-full">
                                        <button
                                          onClick={() =>
                                            setOpenDropdown(
                                              openDropdown === sub._id
                                                ? null
                                                : sub._id,
                                            )
                                          }
                                          className={`flex items-center justify-between px-2 py-0.5 text-[10.5px] sm:text-[9px] font-extrabold rounded-lg border tracking-wider cursor-pointer w-full text-left transition-colors ${subStatusStyle.bg}`}
                                        >
                                          <span>
                                            {sub.status === "Pending"
                                              ? "Not started"
                                              : sub.status === "Completed"
                                                ? "Done"
                                                : sub.status}
                                          </span>
                                          <FiChevronDown
                                            size={8}
                                            className={`transition-transform duration-200 ${openDropdown === sub._id ? "rotate-180" : ""}`}
                                          />
                                        </button>
                                        {openDropdown === sub._id && (
                                          <>
                                            <div
                                              className="fixed inset-0 z-40 cursor-default"
                                              onClick={() =>
                                                setOpenDropdown(null)
                                              }
                                            />
                                            <div className="absolute left-0 mt-1 w-max min-w-full bg-white dark:bg-[#11131e] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-lg p-1 z-50">
                                              {[
                                                {
                                                  name: "Pending",
                                                  label: "Not started",
                                                  color: "bg-slate-400",
                                                },
                                                {
                                                  name: "In Progress",
                                                  label: "In Progress",
                                                  color: "bg-blue-500",
                                                },
                                                {
                                                  name: "IN-REVIEW",
                                                  label: "In Review",
                                                  color: "bg-sky-500",
                                                },
                                                {
                                                  name: "Completed",
                                                  label: "Done",
                                                  color: "bg-emerald-500",
                                                },
                                                {
                                                  name: "On Hold",
                                                  label: "On Hold",
                                                  color: "bg-amber-500",
                                                },
                                                {
                                                  name: "Rejected",
                                                  label: "Rejected",
                                                  color: "bg-red-500",
                                                },
                                              ].map((opt) => (
                                                <button
                                                  key={opt.name}
                                                  onClick={() => {
                                                    const updatedSubtasks =
                                                      task.subtasks.map((s) =>
                                                        s._id === sub._id
                                                          ? {
                                                              ...s,
                                                              status: opt.name,
                                                            }
                                                          : s,
                                                      );
                                                    handleTaskFieldChange(
                                                      task._id,
                                                      {
                                                        subtasks:
                                                          updatedSubtasks,
                                                      },
                                                    );
                                                    setOpenDropdown(null);
                                                  }}
                                                  className={`flex items-center gap-1.5 w-full text-left px-2 py-1 rounded-lg text-[10.5px] sm:text-[9px] font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${sub.status === opt.name ? "text-blue-600 dark:text-[#3b82f6]" : "text-slate-700 dark:text-slate-350"}`}
                                                >
                                                  <span
                                                    className={`w-1 h-1 rounded-full ${opt.color}`}
                                                  />
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
                                        isBlocked={false}
                                        blockerPausedAt={null}
                                        blockerHistory={[]}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent" />
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent" />
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-[10px] font-bold ${sub.startDate ? "bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-655 border border-dashed border-slate-200 dark:border-[#1e293b]/40"}`}
                                    >
                                      <FiCalendar size={11} />
                                      {formatDate(sub.startDate)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-[10px] font-bold ${sub.dueDate ? "bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30" : "text-slate-400 dark:text-slate-650 border border-dashed border-slate-200 dark:border-[#1e293b]/40"}`}
                                    >
                                      <FiCalendar size={11} />
                                      {formatDate(sub.dueDate)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent">
                                    <span className="text-gray-405 dark:text-slate-600">
                                      —
                                    </span>
                                  </td>
                                  <td className="px-6 py-1.5 border-b border-slate-200/70 dark:border-transparent">
                                    <span className="text-slate-400">—</span>
                                  </td>
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls (disabled as list view shows all tasks grouped by section) */}
          {false && totalItems > itemsPerPage && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#11131e]/40 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                        : "border-slate-205 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-[#3b82f6]/5 text-slate-700 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#3b82f6] hover:text-blue-600 dark:hover:text-[#3b82f6] active:scale-90 cursor-pointer shadow-sm"
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
                              ? "bg-blue-600 border-blue-600 text-white dark:bg-[#3b82f6] dark:border-[#3b82f6] dark:text-black shadow-md"
                              : "border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-[#3b82f6]/5 hover:border-blue-400 dark:hover:border-[#3b82f6] hover:text-blue-600 dark:hover:text-[#3b82f6] active:scale-90 cursor-pointer shadow-sm"
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
                        : "border-slate-205 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-[#3b82f6]/5 text-slate-700 dark:text-slate-400 hover:border-blue-400 dark:hover:border-[#3b82f6] hover:text-blue-600 dark:hover:text-[#3b82f6] active:scale-90 cursor-pointer shadow-sm"
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
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold px-1 py-0.5 rounded mr-1.5">
                          {getTaskDisplayId(task)}
                        </span>
                        {task.title}
                      </span>
                    </div>

                    {/* Dropdown status */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="relative"
                    >
                      <div className="relative group min-w-[100px]">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task._id, e.target.value)
                          }
                          className={`appearance-none pl-3 pr-7 py-1 text-[10px] font-bold rounded-full border cursor-pointer w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm hover:shadow ${statusStyle.bg}`}
                        >
                          <option
                            value="Pending"
                            className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                          >
                            Pending
                          </option>
                          <option
                            value="In Progress"
                            className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                          >
                            In Progress
                          </option>
                          {task.status === "Completed" && (
                            <option
                              value="Completed"
                              className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                            >
                              Completed
                            </option>
                          )}
                          <option
                            value="On Hold"
                            className="bg-white dark:bg-[#11131e] text-slate-700 dark:text-slate-200"
                          >
                            On Hold
                          </option>
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                          <FiChevronDown size={12} strokeWidth={3} />
                        </div>
                      </div>
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
        {selectedTask && (
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
              className="relative w-full max-w-2xl bg-white dark:bg-[#0f111a] h-full shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col z-10 border-l border-slate-100 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#0c121e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                    <FiCheckSquare size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-white tracking-wider">
                      Task Workspace
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider mt-0.5">
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

                {/* Read-Only Task Details List */}
                <div className="bg-slate-50 dark:bg-[#111827] rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <FiCheckSquare size={100} />
                  </div>
                  
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700 relative z-10">
                    <div className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black tracking-wider uppercase">
                      {getTaskDisplayId(selectedTask)}
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                      {selectedTask.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs relative z-10">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Priority</span>
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${getPriorityStyle(selectedTask.priority || "Medium")}`}>
                        {selectedTask.priority || "Medium"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Client</span>
                      <div className="font-bold text-slate-700 dark:text-white mt-1">
                        {(() => {
                          const projId = selectedTask.project?._id || selectedTask.project;
                          const projectObj = projects.find((p) => p._id === projId);
                          const client = projectObj?.client || selectedTask.project?.client;
                          if (client) {
                            return <ClientBadge client={client} size="sm" />;
                          }
                          return <span className="text-slate-400 italic font-normal">—</span>;
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Project</span>
                      <span className="font-bold text-slate-700 dark:text-white truncate block mt-1.5">
                        {selectedTask.project?.name || "Internal task"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Content Type</span>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap ${(() => {
                            const t = (selectedTask.title || "").toLowerCase();
                            if (t.includes("reel")) return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
                            if (t.includes("post") || t.includes("carousel")) return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
                            if (t.includes("story")) return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
                            if (t.includes("youtube") || t.includes("thumbnail")) return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
                            return "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20";
                          })()}`}
                        >
                          {(() => {
                            const t = (selectedTask.title || "").toLowerCase();
                            if (t.includes("reel")) return "Reel";
                            if (t.includes("post") || t.includes("carousel")) return "Post";
                            if (t.includes("story")) return "Story";
                            if (t.includes("youtube") || t.includes("thumbnail")) return "YouTube";
                            return "Image";
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned By</span>
                      <span className="font-bold text-slate-700 dark:text-white">
                        {selectedTask.createdBy?.name || "Unknown"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Timeline & Revisions</span>
                      <span className="font-bold text-slate-700 dark:text-white text-[10px]">
                        {selectedTask.startDate ? formatDate(selectedTask.startDate) : "N/A"} → {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : "N/A"}
                        <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
                        <span className="text-rose-500 font-black">{selectedTask.revisions || 0} Rev</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-1 gap-4 bg-slate-50/50 dark:bg-[#111827] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80">
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
                        value="IN-REVIEW"
                        className={getStatusStyle("IN-REVIEW").bg}
                      >
                        In Review
                      </option>
                      {selectedTask.status === "Completed" && (
                        <option
                          value="Completed"
                          className={getStatusStyle("Completed").bg}
                        >
                          Completed
                        </option>
                      )}
                      <option
                        value="On Hold"
                        className={getStatusStyle("On Hold").bg}
                      >
                        On Hold
                      </option>
                      <option
                        value="Rejected"
                        className={getStatusStyle("Rejected").bg}
                      >
                        Rejected
                      </option>
                    </select>
                  </div>
                </div>

                {/* Blocker Settings */}
                <div className="p-4 bg-rose-500/5 dark:bg-[#111827] border border-rose-200/50 dark:border-rose-900/30 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5 uppercase">
                      <FiAlertCircle size={14} /> Blocker & Pause Control
                    </label>
                    {selectedTask.isBlocked ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[9px] font-black uppercase tracking-wider animate-pulse">
                        Paused - Blocked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenBlockerModal(selectedTask)}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer shadow-sm"
                      >
                        + Add Blocker
                      </button>
                    )}
                  </div>

                  {selectedTask.isBlocked && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            Blocker Type
                          </span>
                          <div className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 font-extrabold rounded-xl">
                            {selectedTask.blockerType || "Client Call"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            Priority
                          </span>
                          <div
                            className={`px-2.5 py-1.5 border font-extrabold rounded-xl ${selectedTask.blockerPriority === "Urgent" ? "bg-red-550/10 dark:bg-red-950/30 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400" : "bg-slate-55/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"}`}
                          >
                            {selectedTask.blockerPriority || "Normal"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          Blocker Description
                        </span>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-805 rounded-xl text-slate-650 dark:text-slate-350 italic font-medium leading-relaxed">
                          "
                          {selectedTask.blockerDescription ||
                            selectedTask.blockerReason ||
                            "No description provided"}
                          "
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                            Expected Time
                          </span>
                          <span className="font-bold text-slate-750 dark:text-slate-300">
                            ⏳ {selectedTask.blockerExpectedTime || "15 mins"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                            Paused Since
                          </span>
                          <span className="font-bold text-slate-750 dark:text-slate-300">
                            📅 {formatDateTime(selectedTask.blockerPausedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResumeTask(selectedTask)}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all cursor-pointer"
                      >
                        ✅ Resume Work
                      </button>
                    </div>
                  )}

                  {/* Historical Pauses */}
                  {selectedTask.blockerHistory &&
                    selectedTask.blockerHistory.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          Pause History ({selectedTask.blockerHistory.length})
                        </span>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                          {selectedTask.blockerHistory.map((hist, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-xl space-y-1"
                            >
                              <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-rose-600 dark:text-rose-455 uppercase">
                                  {hist.blockerType}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  {hist.totalPauseMinutes} mins
                                </span>
                              </div>
                              {hist.blockerDescription && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-455 italic">
                                  "{hist.blockerDescription}"
                                </p>
                              )}
                              <div className="text-[8px] text-slate-400 dark:text-slate-500 flex justify-between">
                                <span>In: {formatDateTime(hist.pausedAt)}</span>
                                <span>
                                  Out: {formatDateTime(hist.resumedAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

            
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD BLOCKER MODAL */}
      <AnimatePresence>
        {blockerModalTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBlockerModalTask(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#11131e] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <FiAlertCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                      Add Task Blocker
                    </h3>
                    <p className="text-[10px] text-slate-450 font-bold dark:text-slate-400 mt-0.5 truncate max-w-[250px]">
                      {blockerModalTask.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBlockerModalTask(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Blocker Type Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Blocker Type *
                </label>
                <select
                  value={blockerType}
                  onChange={(e) => setBlockerType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors cursor-pointer"
                >
                  <option value="Client Call">Client Call</option>
                  <option value="Urgent New Task">Urgent New Task</option>
                  <option value="Client Revision">Client Revision</option>
                  <option value="Internal Meeting">Internal Meeting</option>
                  <option value="Waiting for Content">
                    Waiting for Content
                  </option>
                  <option value="Waiting for Approval">
                    Waiting for Approval
                  </option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blocker Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Blocker Description *
                </label>
                <textarea
                  value={blockerDescription}
                  onChange={(e) => setBlockerDescription(e.target.value)}
                  placeholder="e.g. Blackthunder client requested urgent offer poster change. Existing poster work paused."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-550 transition-colors placeholder:text-slate-450"
                />
              </div>

              {/* Expected Time Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Expected Time *
                </label>
                <select
                  value={blockerExpectedTime}
                  onChange={(e) => setBlockerExpectedTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors cursor-pointer"
                >
                  <option value="15 mins">15 mins</option>
                  <option value="30 mins">30 mins</option>
                  <option value="1 hour">1 hour</option>
                  <option value="More than 1 hour">More than 1 hour</option>
                </select>
              </div>

              {/* Priority Select */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Priority *
                </label>
                <div className="flex gap-4">
                  {["Normal", "Urgent"].map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      <input
                        type="radio"
                        name="blockerPriority"
                        value={p}
                        checked={blockerPriority === p}
                        onChange={() => setBlockerPriority(p)}
                        className="text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setBlockerModalTask(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBlocker}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-rose-600/10 hover:shadow-lg transition-all"
                >
                  Add Blocker
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Task;
