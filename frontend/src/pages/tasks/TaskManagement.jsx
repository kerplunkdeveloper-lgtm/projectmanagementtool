import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../features/tasks/taskSlice";
import { FiPlus, FiCheckSquare, FiSearch, FiFilter } from "react-icons/fi";
import TaskTable from "./TaskTable";
import TaskKanban from "./TaskKanban";
import TaskModal from "./TaskModal";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../services/axiosInstance";

const TaskManagement = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [viewMode, setViewMode] = useState("list"); // 'list' or 'kanban'
  const [clients, setClients] = useState([]);
  const [filterClient, setFilterClient] = useState("all");

  useEffect(() => {
    dispatch(getTasks());
    fetchClients();
  }, [dispatch]);

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get("/clients/all");
      const clientList = res.data.data || res.data;
      setClients(Array.isArray(clientList) ? clientList : []);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setIsEditing(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedTask(task);
    setIsEditing(true);
    setOpenModal(true);
  };

  const handleTaskSubmit = async (formData) => {
    try {
      if (isEditing) {
        await dispatch(
          updateTask({ id: selectedTask._id, taskData: formData }),
        ).unwrap();
      } else {
        await dispatch(createTask(formData)).unwrap();
      }
      setOpenModal(false);
    } catch (err) {
      // handled in slice
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedStatus =
        task.status === "completed" ? "pending" : "completed";
      await dispatch(
        updateTask({ id: task._id, taskData: { status: updatedStatus } }),
      ).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await dispatch(deleteTask(id));
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;

    // Client matching logic
    let matchesClient = true;
    if (filterClient !== "all") {
      const taskClientId =
        task.client?._id || task.client || task.project?.client?._id || task.project?.client || "";
      matchesClient = taskClientId === filterClient;
    }

    return matchesSearch && matchesStatus && matchesClient;
  });

  const canManage = user?.role === "admin" || user?.role === "operationmanager";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1e293b]">
              Task Management
            </h1>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {/* Filter Dropdowns */}
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400 shadow-sm appearance-none min-w-[120px]"
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.companyName}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400 shadow-sm appearance-none min-w-[120px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* View Toggles */}
            <div className="flex items-center bg-indigo-100 p-1 rounded-xl h-10 ml-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 h-full rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === "list" ? "bg-indigo-500 text-white shadow-sm" : "text-indigo-600 hover:bg-indigo-200/50"}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
                List
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 h-full rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === "kanban" ? "bg-indigo-500 text-white shadow-sm" : "text-indigo-600 hover:bg-indigo-200/50"}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  ></path>
                </svg>
                Kanban
              </button>
            </div>

            {canManage && (
              <button
                onClick={handleOpenCreate}
                className="ml-2 h-10 px-5 rounded-xl bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                + New Task
              </button>
            )}
          </div>
        </div>

        {loading && filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-[6px] border-blue-100 border-t-blue-500 rounded-full animate-spin shadow-lg"></div>
            <p className="text-slate-500 font-bold text-lg animate-pulse">
              Synchronizing tasks...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
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
