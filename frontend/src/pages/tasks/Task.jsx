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
  FiGrid,
  FiTrendingUp,
  FiPieChart,
  FiList,
} from "react-icons/fi";
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
  useUpdateUserMutation,
} from "../../features/api/apiSlice";

// ─── Fix for React 18 StrictMode + @hello-pangea/dnd ───────────────────────
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

// ─── Controlled title input (prevents cursor jump) ─────────────────────────
const TaskTitleInput = ({ task, handleTaskFieldChange, isCompleted }) => {
  const [title, setTitle] = useState(task.title);
  useEffect(() => { setTitle(task.title); }, [task.title]);

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={() => { if (title.trim() !== task.title) handleTaskFieldChange(task._id, { title: title.trim() }); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
      className={`w-full bg-transparent border-0 font-extrabold text-slate-800 dark:text-yellow-50 focus:ring-0 focus:outline-none p-0 text-sm ${isCompleted ? "line-through text-slate-400 font-semibold" : ""}`}
    />
  );
};

// ─── Board status columns config ───────────────────────────────────────────
const BOARD_COLUMNS = [
  { id: "Pending",     title: "PENDING",     dotColor: "bg-slate-400"  },
  { id: "In Progress", title: "IN PROGRESS", dotColor: "bg-blue-500"   },
  { id: "On Hold",     title: "ON HOLD",     dotColor: "bg-amber-500"  },
  { id: "Completed",   title: "COMPLETED",   dotColor: "bg-emerald-500"},
];

const Task = () => {
  const { user } = useSelector((state) => state.auth);

  const { data: tasks = [], isLoading: loading } = useGetTasksQuery(undefined, {
    skip: !user,
  });

  const [updateTaskTrigger] = useUpdateTaskMutation();
  const [updateUserTrigger] = useUpdateUserMutation();

  const [activeTab, setActiveTab]           = useState("LIST");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [statusFilter, setStatusFilter]     = useState("All");
  const [expandedTasks, setExpandedTasks]   = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerSubtaskTitle, setDrawerSubtaskTitle] = useState("");
  const subtaskInputRef = useRef(null);

  // ── OPTIMISTIC BOARD STATE ────────────────────────────────────────────────
  // We keep a local map of { taskId: status } so board columns update
  // immediately on drag without waiting for the API round-trip.
  const [boardStatusOverrides, setBoardStatusOverrides] = useState({});

  // Reset overrides whenever fresh server data arrives
  useEffect(() => { setBoardStatusOverrides({}); }, [tasks]);

  const currentUserId = user?._id || user?.id;

  // Tasks assigned to current user
  const myTasks = tasks.filter((task) => {
    const taskUserId = task.assignedTo?._id || task.assignedTo;
    return taskUserId === currentUserId;
  });

  // Apply optimistic status overrides for board rendering
  const myTasksWithOverrides = myTasks.map((t) =>
    boardStatusOverrides[t._id]
      ? { ...t, status: boardStatusOverrides[t._id] }
      : t
  );

  const defaultSections = ["Recently assigned", "Do today", "Do next week", "Do later"];
  const [userSections, setUserSections] = useState(
    user?.taskSections?.length > 0 ? user.taskSections : defaultSections
  );

  useEffect(() => {
    if (user?.taskSections?.length > 0) setUserSections(user.taskSections);
  }, [user]);

  // ── DRAG END ──────────────────────────────────────────────────────────────
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    if (activeTab === "LIST") {
      // draggableId format: "list-{taskId}"
      const taskId    = draggableId.replace(/^list-/, "");
      const newSection = destination.droppableId.replace(/^list-/, "");
      updateTaskTrigger({ id: taskId, taskData: { section: newSection } });
    }

    if (activeTab === "BOARD") {
      // draggableId format: "board-{taskId}"
      const taskId    = draggableId.replace(/^board-/, "");
      const newStatus = destination.droppableId.replace(/^board-/, "");

      // 1️⃣  Optimistic local update — columns re-render immediately
      setBoardStatusOverrides((prev) => ({ ...prev, [taskId]: newStatus }));

      // 2️⃣  Persist to server
      updateTaskTrigger({ id: taskId, taskData: { status: newStatus } });
    }
  };

  // Status filter only applied to LIST view
  const filteredTasks = myTasks.filter((task) => {
    if (statusFilter === "All") return true;
    return task.status === statusFilter;
  });

  const toggleSection = (section) =>
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleAddSection = async () => {
    const newSection = prompt("Enter section name:");
    if (newSection && newSection.trim() && !userSections.includes(newSection.trim())) {
      const updated = [...userSections, newSection.trim()];
      setUserSections(updated);
      await updateUserTrigger({ id: "me", data: { taskSections: updated } });
    }
  };

  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  const handleTaskFieldChange = (taskId, fields) => {
    const sanitized = { ...fields };
    if (sanitized.dueDate === "") sanitized.dueDate = null;
    updateTaskTrigger({ id: taskId, taskData: sanitized });
  };

  const handleToggleStatus = (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    updateTaskTrigger({ id: task._id, taskData: { status: newStatus } });
  };

  const handleToggleSubtask = (task, subtask) => {
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtask._id
        ? { ...sub, status: sub.status === "Completed" ? "Pending" : "Completed" }
        : sub
    );
    updateTaskTrigger({ id: task._id, taskData: { subtasks: updatedSubtasks } });
  };

  const handleAddSubtaskInDrawer = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!drawerSubtaskTitle.trim() || !selectedTask) return;
    const newSubtask = { title: drawerSubtaskTitle.trim(), status: "Pending", priority: "Medium", dueDate: null };
    updateTaskTrigger({
      id: selectedTask._id,
      taskData: { subtasks: [...(selectedTask.subtasks || []), newSubtask] },
    });
    setDrawerSubtaskTitle("");
    setTimeout(() => subtaskInputRef.current?.focus(), 50);
  };

  const handleDeleteSubtask = (task, subtaskId) => {
    updateTaskTrigger({
      id: task._id,
      taskData: { subtasks: task.subtasks.filter((sub) => sub._id !== subtaskId) },
    });
  };

  const handleUpdateSubtaskField = (task, subtaskId, fields) => {
    updateTaskTrigger({
      id: task._id,
      taskData: {
        subtasks: task.subtasks.map((sub) =>
          sub._id === subtaskId ? { ...sub, ...fields } : sub
        ),
      },
    });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-16">

      {/* TAB BAR */}
      <div className="flex overflow-x-auto bg-[#f1f5f9] dark:bg-[#1e293b] rounded-full p-1 border border-slate-200 dark:border-slate-700/50 w-max mb-6">
        {[
          { id: "LIST",      icon: <FiList      size={14} /> },
          { id: "BOARD",     icon: <FiGrid      size={14} /> },
          { id: "TIMELINE",  icon: <FiTrendingUp size={14} /> },
          { id: "DASHBOARD", icon: <FiPieChart  size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-full text-[12px] font-black tracking-widest transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm dark:bg-[#0f172a] dark:text-blue-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.id}
          </button>
        ))}
      </div>

      {/* HEADING + STATS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-yellow-50">
          {activeTab} VIEW
        </h1>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Total: {myTasks.length}
          </div>
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Completed: {myTasks.filter((t) => t.status === "Completed").length}
          </div>
        </div>
      </div>

      {/* FILTER BAR — only relevant for LIST */}
      {activeTab === "LIST" && (
        <div className="flex gap-2 overflow-x-auto pb-1 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm scrollbar-thin">
          {["All", "Pending", "In Progress", "Completed", "On Hold"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                statusFilter === status
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        // ── Single DragDropContext per active tab ─────────────────────────
        // Key forces a full remount when switching tabs, preventing any
        // stale droppable registrations between LIST and BOARD.
        <DragDropContext key={activeTab} onDragEnd={handleDragEnd}>

          {/* ══════════════════ LIST VIEW ══════════════════ */}
          {activeTab === "LIST" && (
            <div className="flex flex-col gap-6 pb-20">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <FiCheckSquare size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
                  <h3 className="mt-4 text-sm font-black theme-text-primary uppercase tracking-wider">No Tasks Found</h3>
                </div>
              ) : (
                <>
                  {userSections.map((section) => {
                    const sectionTasks = filteredTasks.filter(
                      (t) => (t.section || "Recently assigned") === section
                    );
                    const isCollapsed = collapsedSections[section];

                    return (
                      <div key={section} className="flex flex-col">
                        <div
                          className="flex items-center gap-2 mb-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                          onClick={() => toggleSection(section)}
                        >
                          <FiChevronDown
                            className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                          />
                          <h3 className="font-extrabold text-[13px] tracking-wide">{section}</h3>
                          <span className="text-[10px] text-slate-400 font-bold ml-2">{sectionTasks.length}</span>
                        </div>

                        {!isCollapsed && (
                          <StrictModeDroppable droppableId={`list-${section}`}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`pl-6 space-y-1 min-h-[10px] pb-2 transition-colors ${
                                  snapshot.isDraggingOver
                                    ? "bg-slate-50 dark:bg-slate-800/30 rounded-lg"
                                    : ""
                                }`}
                              >
                                {sectionTasks.map((task, index) => (
                                  // ✅ Prefixed draggableId: "list-{id}"
                                  <Draggable key={task._id} draggableId={`list-${task._id}`} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={provided.draggableProps.style}
                                        onClick={() => setSelectedTaskId(task._id)}
                                        className={`group flex items-center justify-between p-2.5 rounded-lg border-b cursor-pointer ${
                                          snapshot.isDragging
                                            ? "shadow-lg bg-white dark:bg-slate-800 ring-1 ring-blue-500 scale-[1.01] z-50 border-transparent"
                                            : "border-slate-100 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80 transition-colors"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                              task.status === "Completed"
                                                ? "bg-emerald-500 border-emerald-500"
                                                : "border-slate-400 dark:border-slate-500 hover:border-blue-400"
                                            }`}
                                          >
                                            {task.status === "Completed" && <FiCheck size={10} className="text-white" />}
                                          </button>
                                          <span
                                            className={`text-[13px] font-bold ${
                                              task.status === "Completed"
                                                ? "line-through text-slate-400"
                                                : "text-slate-800 dark:text-slate-100"
                                            }`}
                                          >
                                            {task.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-[10px] font-black uppercase text-slate-400">{task.status}</span>
                                          <span className="text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{task.priority}</span>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </StrictModeDroppable>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddSection}
                    className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mt-2 text-xs font-bold ml-6 transition-colors"
                  >
                    <FiPlus size={14} /> Add section
                  </button>
                </>
              )}
            </div>
          )}

          {/* ══════════════════ BOARD VIEW ══════════════════ */}
          {activeTab === "BOARD" && (
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 items-stretch h-[calc(100vh-220px)] md:h-[calc(100vh-180px)]">
              {BOARD_COLUMNS.map((column) => {
                // ✅ Use overrides-applied task list for accurate column membership
                const columnTasks = myTasksWithOverrides.filter(
                  (t) => t.status === column.id
                );

                return (
                  <div
                    key={column.id}
                    className="bg-white dark:bg-slate-900 w-full md:min-w-[280px] md:w-1/4 p-3 flex flex-col flex-1 shrink-0"
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                        <span className="font-extrabold text-[12px] text-slate-800 dark:text-white uppercase tracking-widest">
                          {column.title}
                        </span>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* ✅ droppableId: "board-{status}" */}
                    <StrictModeDroppable droppableId={`board-${column.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[150px] overflow-y-auto overflow-x-hidden flex flex-col gap-3 rounded-xl p-1 transition-colors custom-scrollbar ${
                            snapshot.isDraggingOver
                              ? "bg-slate-50 dark:bg-slate-800/40 ring-1 ring-blue-400/30"
                              : ""
                          }`}
                        >
                          {columnTasks.map((task, index) => (
                            // ✅ Prefixed draggableId: "board-{id}"
                            <Draggable key={task._id} draggableId={`board-${task._id}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style}
                                  onClick={() => setSelectedTaskId(task._id)}
                                  className={`bg-white dark:bg-[#0f172a] p-4 rounded-2xl border cursor-pointer select-none ${
                                    snapshot.isDragging
                                      ? "shadow-2xl ring-2 ring-blue-500 scale-[1.03] z-50 border-blue-300 dark:border-blue-700"
                                      : "border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <div className="mb-4">
                                    <span className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-snug block">
                                      {task.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg pr-3 py-1.5 pl-1.5 border border-slate-200 dark:border-slate-700/80">
                                      <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center text-[8px] font-black uppercase text-white shadow-sm shrink-0">
                                        {task.assignedTo?.name
                                          ? task.assignedTo.name.substring(0, 2)
                                          : "UN"}
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        {task.assignedTo?.name
                                          ? task.assignedTo.name.split(" ")[0]
                                          : "Unassigned"}
                                        <FiChevronDown size={12} className="text-slate-400" />
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-black px-2.5 py-1.5 rounded shadow-sm uppercase tracking-wider ${
                                        task.priority === "High"
                                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                                          : task.priority === "Medium"
                                          ? "bg-orange-50 text-orange-600 border border-orange-100"
                                          : "bg-slate-50 text-slate-600 border border-slate-200"
                                      }`}
                                    >
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

                    <button className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                      <FiPlus size={14} /> Add task
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </DragDropContext>
      )}

      {/* ══════════════ TASK DRAWER ══════════════ */}
      <AnimatePresence>
        {selectedTaskId && selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-150 dark:border-slate-800"
            >
              {/* Drawer header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                    <FiCheckSquare size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-yellow-50 uppercase tracking-wider">
                      Task Workspace
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
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

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Task Title</label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-950 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <TaskTitleInput
                      task={selectedTask}
                      handleTaskFieldChange={handleTaskFieldChange}
                      isCompleted={selectedTask.status === "Completed"}
                    />
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiTag size={12} /> Status
                    </label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleTaskFieldChange(selectedTask._id, { status: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiAlertCircle size={12} /> Priority
                    </label>
                    <select
                      value={selectedTask.priority || "Medium"}
                      onChange={(e) => handleTaskFieldChange(selectedTask._id, { priority: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Due Date
                    </label>
                    <input
                      type="date"
                      value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => handleTaskFieldChange(selectedTask._id, { dueDate: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiBriefcase size={12} /> Project
                    </label>
                    <div className="w-full bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 truncate">
                      {selectedTask.project?.name || "Internal task"}
                    </div>
                  </div>
                </div>

                {/* Subtasks */}
                <div className="space-y-3.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiCornerDownRight size={13} /> Subtasks Board
                  </label>

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

                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => handleUpdateSubtaskField(selectedTask, sub._id, { title: e.target.value })}
                              className={`flex-1 min-w-0 bg-transparent border-0 font-semibold text-xs text-slate-700 dark:text-slate-300 focus:ring-0 focus:outline-none p-0 ${
                                isSubCompleted ? "line-through text-slate-400 font-medium" : ""
                              }`}
                            />

                            <select
                              value={sub.priority || "Medium"}
                              onChange={(e) => handleUpdateSubtaskField(selectedTask, sub._id, { priority: e.target.value })}
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