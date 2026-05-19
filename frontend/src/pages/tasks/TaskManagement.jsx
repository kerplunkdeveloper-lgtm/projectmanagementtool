import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTasks, createTask, updateTask, deleteTask } from "../../features/tasks/taskSlice";
import { FiPlus, FiCheckSquare } from "react-icons/fi";
import TaskTable from "./TaskTable";
import TaskKanban from "./TaskKanban";
import TaskModal from "./TaskModal";
import { AnimatePresence, motion } from "framer-motion";
import axiosInstance from "../../services/axiosInstance";

const TaskManagement = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((s) => s.tasks);
  const { user } = useSelector((s) => s.auth);

  const [openModal, setOpenModal]       = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [viewMode, setViewMode]         = useState("list");
  const [clients, setClients]           = useState([]);

  useEffect(() => { dispatch(getTasks()); fetchClients(); }, [dispatch]);

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get("/clients/all");
      const list = res.data.data || res.data;
      setClients(Array.isArray(list) ? list : []);
    } catch (err) { console.error(err); }
  };

  const handleOpenCreate = () => { setSelectedTask(null); setIsEditing(false); setOpenModal(true); };
  const handleOpenEdit   = (task) => { setSelectedTask(task); setIsEditing(true); setOpenModal(true); };

  const handleTaskSubmit = async (formData) => {
    try {
      if (isEditing) await dispatch(updateTask({ id: selectedTask._id, taskData: formData })).unwrap();
      else           await dispatch(createTask(formData)).unwrap();
      setOpenModal(false);
    } catch { /* handled in slice */ }
  };

  const handleToggleComplete = async (task) => {
    try {
      const status = task.status === "completed" ? "pending" : "completed";
      await dispatch(updateTask({ id: task._id, taskData: { status } })).unwrap();
    } catch (err) { console.log(err); }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Delete this task?")) await dispatch(deleteTask(id));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchSearch  = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus  = filterStatus === "all" || task.status === filterStatus;
    let   matchClient  = true;
    if (filterClient !== "all") {
      const cid = task.client?._id || task.client || task.project?.client?._id || task.project?.client || "";
      matchClient = cid === filterClient;
    }
    return matchSearch && matchStatus && matchClient;
  });

  const canManage = user?.role === "admin" || user?.role === "operationmanager";

  const SELECT = "h-9 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-400 shadow-sm cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r
                          from-cyan-500
                          to-blue-600 flex items-center justify-center">
                <FiCheckSquare size={14} className="text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">Task Management</h1>
            </div>
            <p className="text-xs text-gray-400 ml-9">{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Client Filter */}
            <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className={SELECT}>
              <option value="all">All Clients</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
            </select>

            {/* Status Filter */}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl p-1 h-9">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 h-full rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-indigo-500 text-white shadow-sm" : "text-indigo-500 hover:bg-indigo-100/50"}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                List
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 h-full rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === "kanban" ? "bg-indigo-500 text-white shadow-sm" : "text-indigo-500 hover:bg-indigo-100/50"}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Kanban
              </button>
            </div>

            {canManage && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r
                          from-cyan-500
                          to-blue-600 text-white font-semibold text-xs shadow-sm shadow-indigo-200 transition-all active:scale-95"
              >
                <FiPlus size={14} /> New Task
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading && filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading tasks...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {viewMode === "list" ? (
                <TaskTable
                  tasks={filteredTasks}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                  onToggleComplete={handleToggleComplete}
                  canManage={canManage}
                />
              ) : (
                <TaskKanban
                  tasks={filteredTasks}
                  onEdit={handleOpenEdit}
                  onToggleComplete={handleToggleComplete}
                  canManage={canManage}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <TaskModal
          open={openModal}
          setOpen={setOpenModal}
          onSubmit={handleTaskSubmit}
          initialData={selectedTask}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
};

export default TaskManagement;
