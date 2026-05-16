import React, { useState, useEffect } from "react";
import { FiX, FiCheckSquare } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";

const TaskModal = ({ open, setOpen, onSubmit, initialData, isEditing }) => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    if (open) {
      dispatch(getProjects());
      dispatch(getUsers());
      if (isEditing && initialData) {
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          project: initialData.project?._id || initialData.project || "",
          assignedTo: initialData.assignedTo?._id || initialData.assignedTo || "",
          status: initialData.status || "pending",
          priority: initialData.priority || "medium",
          dueDate: initialData.dueDate ? initialData.dueDate.split("T")[0] : "",
        });
      } else {
        setFormData({
          title: "",
          description: "",
          project: "",
          assignedTo: "",
          status: "pending",
          priority: "medium",
          dueDate: "",
        });
      }
    }
  }, [open, isEditing, initialData, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0D1B2A] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <FiCheckSquare size={24} />
            </div>
            {isEditing ? "Edit Task" : "Assign New Task"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-12 h-12 rounded-2xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Task Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Design UI Mockups"
              className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Project *</label>
              <select
                name="project"
                required
                value={formData.project}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="">Select Project</option>
                {projects?.map((project) => (
                  <option key={project._id} value={project._id}>{project.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Assign To *</label>
              <select
                name="assignedTo"
                required
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="">Select User</option>
                {users?.filter(u => u.role === 'team').map((user) => (
                  <option key={user._id} value={user._id}>{user.name} ({user.department})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all invert-calendar-icon"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Task details..."
              className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-14 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:scale-[1.02] shadow-xl shadow-indigo-500/20 transition-all"
            >
              {isEditing ? "Update Task" : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
