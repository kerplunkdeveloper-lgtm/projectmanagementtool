import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTasks, createTask, updateTask, deleteTask } from "../../features/tasks/taskSlice";
import { FiPlus, FiCheckSquare, FiSearch, FiFilter } from "react-icons/fi";
import TaskTable from "./TaskTable";
import TaskModal from "./TaskModal";
import { motion } from "framer-motion";

const TaskManagement = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    dispatch(getTasks());
  }, [dispatch]);

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
        await dispatch(updateTask({ id: selectedTask._id, taskData: formData })).unwrap();
      } else {
        await dispatch(createTask(formData)).unwrap();
      }
      setOpenModal(false);
    } catch (err) {
      // handled in slice
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await dispatch(deleteTask(id));
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const canManage = user?.role === 'admin' || user?.role === 'operationmanager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <FiCheckSquare size={26} />
              </div>
              Task Intelligence
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Orchestrate and optimize your team's productivity</p>
          </div>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95"
            >
              <FiPlus size={24} />
              Create Task
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="relative group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-xl group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by title or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white border border-gray-200 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-700 font-medium"
            />
          </div>

          <div className="relative group">
            <FiFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-xl group-focus-within:text-blue-600 transition-colors" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-14 pl-14 pr-10 rounded-2xl bg-white border border-gray-200 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-700 font-medium cursor-pointer appearance-none"
            >
              <option value="all">All Status Modes</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {loading && filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-[6px] border-blue-100 border-t-blue-500 rounded-full animate-spin shadow-lg"></div>
            <p className="text-slate-500 font-bold text-lg animate-pulse">Synchronizing tasks...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <TaskTable 
              tasks={filteredTasks} 
              onEdit={handleOpenEdit} 
              onDelete={handleDeleteTask}
              canManage={canManage}
            />
          </motion.div>
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
