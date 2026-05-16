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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-gray-200 shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-slate-50/50">
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FiCheckSquare size={26} />
            </div>
            {isEditing ? "Modify Task" : "Assign Initiative"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-300 shadow-sm"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Task Identification *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g., Finalize Brand Identity"
              className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Project Alignment *</label>
              <select
                name="project"
                required
                value={formData.project}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
              >
                <option value="">Select Target Project</option>
                {projects?.map((project) => (
                  <option key={project._id} value={project._id}>{project.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Assignee Excellence *</label>
              <select
                name="assignedTo"
                required
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
              >
                <option value="">Select Team Member</option>
                {users?.filter(u => u.role === 'team').map((user) => (
                  <option key={user._id} value={user._id}>{user.name} — {user.department}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Operational Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Priority Level</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Action</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Commitment Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Briefing & Requirements</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detail the scope and objectives..."
              className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-5 pt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-10 py-4 rounded-2xl border border-gray-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg shadow-[0_15px_35px_rgba(37,99,235,0.3)] hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(37,99,235,0.4)] transition-all active:scale-95"
            >
              {isEditing ? "Update Strategy" : "Launch Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
