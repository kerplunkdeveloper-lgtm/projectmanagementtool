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
    <div className="p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FiCheckSquare size={30} />
            </div>
            Task Management
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Centralized task allocation and tracking</p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all active:scale-95"
          >
            <FiPlus size={24} />
            Create Task
          </button>
        )}
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="relative group">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search tasks or assignees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        <div className="relative">
          <FiFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer appearance-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
      </div>

      {loading && filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center h-64">
           <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
  );
};

export default TaskManagement;
