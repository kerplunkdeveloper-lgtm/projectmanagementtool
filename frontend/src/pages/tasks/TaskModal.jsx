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
    client: "",
    project: "",
    assignedTo: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    estimatedHours: "",
    tags: []
  });

  const availableTags = ["SMM", "SEO", "Ads", "Video", "Brand"];

  useEffect(() => {
    if (open) {
      dispatch(getProjects());
      dispatch(getUsers());
      if (isEditing && initialData) {
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          client: initialData.project?.client?._id || "",
          project: initialData.project?._id || initialData.project || "",
          assignedTo: initialData.assignedTo?._id || initialData.assignedTo || "",
          status: initialData.status || "pending",
          priority: initialData.priority || "medium",
          dueDate: initialData.dueDate ? initialData.dueDate.split("T")[0] : "",
          estimatedHours: initialData.estimatedHours || "",
          tags: initialData.tags || []
        });
      } else {
        setFormData({
          title: "",
          description: "",
          client: "",
          project: "",
          assignedTo: "",
          status: "pending",
          priority: "medium",
          dueDate: "",
          estimatedHours: "",
          tags: []
        });
      }
    }
  }, [open, isEditing, initialData, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleTag = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-[#8c93a1]/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
        <div className="bg-[#b3b9c5] w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-[#c2c8d3]">
            <h2 className="text-xl font-black text-[#1e293b]">{formData.title || "Untitled Task"}</h2>
            <div className="flex items-center gap-4">
              <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                {formData.status}
              </span>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-[#e2e8f0]/50 hover:bg-[#e2e8f0] flex items-center justify-center text-slate-500 transition-colors">
                 <FiX size={18} />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-7 bg-[#b3b9c5]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
               <div>
                 <p className="text-[13px] font-semibold text-[#475569] mb-1.5">Client / Project</p>
                 <p className="text-sm font-bold text-slate-700 truncate">{projects?.find(p => p._id === formData.project)?.title || "Standalone"}</p>
               </div>
               <div>
                 <p className="text-[13px] font-semibold text-[#475569] mb-1.5">Priority</p>
                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${formData.priority === 'low' ? 'bg-emerald-100 text-emerald-600' : formData.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                   <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                   {formData.priority}
                 </div>
               </div>
               <div>
                 <p className="text-[13px] font-semibold text-[#475569] mb-1.5">Assignee</p>
                 <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-black shadow-sm">
                      {users?.find(u => u._id === formData.assignedTo)?.name?.charAt(0) || "U"}
                   </div>
                   <span className="text-sm font-bold text-slate-700 truncate">{users?.find(u => u._id === formData.assignedTo)?.name || "Unassigned"}</span>
                 </div>
               </div>
               <div>
                 <p className="text-[13px] font-semibold text-[#475569] mb-1.5">Due Date</p>
                 <p className="text-sm font-bold text-slate-700">{formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : "No Date"}</p>
               </div>
            </div>

            <div>
              <p className="text-[13px] font-semibold text-[#475569] mb-1.5">Description</p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full bg-[#f8fafc] border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner resize-none font-medium"
              />
            </div>
            
            <div>
              <p className="text-[13px] font-semibold text-[#475569] mb-2.5">Workflow Stage</p>
              <div className="flex flex-wrap items-center gap-2">
                {['created', 'assigned', 'in-progress', 'internal-review', 'client-approval', 'completed'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`px-4 py-2 rounded-[2rem] text-[12px] font-black uppercase tracking-wider transition-all border shadow-sm ${formData.status === status ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-transparent border-[#c2c8d3] text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                  >
                    {status.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#c2c8d3] pt-7">
              <p className="text-[13px] font-semibold text-[#475569] mb-2">Subtasks</p>
              <p className="text-sm font-medium text-slate-400/80 mb-3">No subtasks. Click below to add one.</p>
              <button type="button" className="px-4 py-2 bg-[#f8fafc] rounded-xl text-[12px] font-bold text-slate-600 shadow-sm hover:bg-white transition-all">+ Add Subtask</button>
            </div>

            <div className="border-t border-[#c2c8d3] pt-7">
              <p className="text-[13px] font-semibold text-[#475569] mb-2">Checklist</p>
              <p className="text-sm font-medium text-slate-400/80">No checklist items for this task.</p>
            </div>
            
            <div className="border-t border-[#c2c8d3] pt-7">
              <p className="text-[13px] font-semibold text-[#475569] mb-2">Comments</p>
              <p className="text-sm font-medium text-slate-400/80 mb-3">No comments yet.</p>
              <div className="flex items-center gap-2 bg-[#f8fafc] p-2 rounded-2xl shadow-inner">
                <input type="text" placeholder="Add a comment or @mention..." className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium text-slate-700 placeholder:text-slate-400" />
                <button type="button" className="px-6 py-2.5 bg-[#7c5ff0] text-white rounded-xl text-[13px] font-bold shadow-md hover:bg-[#6b4ce6] transition-all">Post</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-[#b3b9c5] flex justify-between items-center border-t border-[#c2c8d3]">
            <button type="button" className="px-6 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 text-[13px] font-bold hover:bg-rose-500/20 transition-all border border-rose-500/20">Delete Task</button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="px-8 py-2.5 rounded-xl bg-[#f8fafc] text-[#475569] text-[13px] font-bold shadow-sm transition-all hover:bg-white">Close</button>
              <button type="button" onClick={handleSubmit} className="px-8 py-2.5 rounded-xl bg-[#7c5ff0] text-white text-[13px] font-bold shadow-md transition-all hover:bg-[#6b4ce6]">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#8c93a1]/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
      <div className="bg-[#b3b9c5] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 bg-[#b3b9c5] border-b border-[#c2c8d3]">
          <h2 className="text-xl font-black text-[#1e293b] flex items-center gap-2">
            <span className="text-2xl font-light">+</span> Create New Task
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#e2e8f0]/50 hover:bg-[#e2e8f0] flex items-center justify-center text-slate-500 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#b3b9c5]">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Task Name */}
            <div>
              <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Task Name *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., ABC Restaurant — Instagram Reel Draft"
                className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner placeholder:text-slate-400"
              />
            </div>

            {/* Client & Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Client *</label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select client...</option>
                  <option value="nexus">Nexus Corp</option>
                  <option value="abc">ABC Restaurant</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Project</label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select project...</option>
                  {projects?.map((project) => (
                    <option key={project._id} value={project._id}>{project.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assign To & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Assign To</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select member...</option>
                  {users?.filter(u => u.role === 'team').map((user) => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date & Estimated Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Estimated Hours</label>
                <input
                  type="text"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  placeholder="e.g., 3"
                  className="w-full h-10 bg-[#f8fafc] border-none rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Description</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Task details, references, instructions..."
                className="w-full bg-[#f8fafc] border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[13px] font-semibold text-[#475569] mb-2">Tags</label>
              <div className="flex flex-wrap items-center gap-2">
                {availableTags.map((tag) => {
                  const isActive = formData.tags.includes(tag);
                  let colors = "";
                  if (tag === "SMM") colors = "bg-indigo-100 text-indigo-500";
                  if (tag === "SEO") colors = "bg-emerald-100 text-emerald-500";
                  if (tag === "Ads") colors = "bg-amber-100 text-amber-500";
                  if (tag === "Video") colors = "bg-pink-100 text-pink-500";
                  if (tag === "Brand") colors = "bg-orange-100 text-orange-500";
                  
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isActive ? 'ring-2 ring-offset-1 ring-[#8c93a1]' : 'opacity-80 hover:opacity-100'
                      } ${colors}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-[#b3b9c5] flex justify-end gap-3 border-t border-[#c2c8d3]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-[#f1f5f9] text-[#475569] text-[13px] font-bold hover:bg-white shadow-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white text-[13px] font-bold shadow-md hover:bg-[#6b4ce6] transition-all"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
