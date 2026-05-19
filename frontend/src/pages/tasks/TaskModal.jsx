import React, { useState, useEffect } from "react";
import { FiX, FiCheckSquare } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getProjects } from "../../features/projects/projectSlice";
import { getUsers } from "../../features/users/userSlice";
import axiosInstance from "../../services/axiosInstance";

const TAGS = ["SMM", "SEO", "Ads", "Video", "Brand"];
const TAG_COLORS = {
  SMM: "bg-indigo-100 text-indigo-600", SEO: "bg-emerald-100 text-emerald-600",
  Ads: "bg-amber-100 text-amber-600",   Video: "bg-pink-100 text-pink-600",
  Brand: "bg-orange-100 text-orange-600",
};
const WORKFLOW = ["created","assigned","in-progress","internal-review","client-approval","completed"];

const INPUT  = "w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-700";
const SELECT = INPUT + " cursor-pointer appearance-none";
const LABEL  = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

const TaskModal = ({ open, setOpen, onSubmit, initialData, isEditing }) => {
  const dispatch = useDispatch();
  const { projects } = useSelector((s) => s.projects);
  const { users }    = useSelector((s) => s.users);
  const [clients, setClients] = useState([]);

  const [formData, setFormData] = useState({
    title: "", description: "", client: "", project: "",
    assignedTo: "", status: "pending", priority: "medium",
    dueDate: "", estimatedHours: "", tags: [],
  });

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get("/clients/all");
      const list = res.data.data || res.data;
      setClients(Array.isArray(list) ? list : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!open) return;
    dispatch(getProjects()); dispatch(getUsers()); fetchClients();
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title || "", description: initialData.description || "",
        client: initialData.project?.client?._id || "",
        project: initialData.project?._id || initialData.project || "",
        assignedTo: initialData.assignedTo?._id || initialData.assignedTo || "",
        status: initialData.status || "pending", priority: initialData.priority || "medium",
        dueDate: initialData.dueDate ? initialData.dueDate.split("T")[0] : "",
        estimatedHours: initialData.estimatedHours || "", tags: initialData.tags || [],
      });
    } else {
      setFormData({ title: "", description: "", client: "", project: "", assignedTo: "", status: "pending", priority: "medium", dueDate: "", estimatedHours: "", tags: [] });
    }
  }, [open, isEditing, initialData, dispatch]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const toggleTag = (tag) => setFormData((p) => ({
    ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
  }));

  const handleSubmit = (e) => {
    e?.preventDefault();
    const payload = { ...formData };
    if (!payload.project) delete payload.project;
    if (!payload.client)  delete payload.client;
    if (!payload.assignedTo) delete payload.assignedTo;
    onSubmit(payload);
  };

  if (!open) return null;

  /* ── EDIT VIEW ── */
  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3">
        <div className="bg-white w-full max-w-xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-slate-50/60">
            <div className="min-w-0 flex-1 mr-3">
              <h2 className="text-sm font-bold text-slate-800 truncate">{formData.title || "Untitled Task"}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide mt-0.5 ${
                formData.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                formData.status?.includes("progress") ? "bg-blue-50 text-blue-600" :
                "bg-slate-100 text-slate-500"
              }`}>{formData.status}</span>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
              <FiX size={14} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {/* Meta info 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 mb-1">Project</p>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {projects?.find((p) => p._id === formData.project)?.title || "Standalone"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 mb-1">Priority</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  formData.priority === "low" ? "bg-emerald-100 text-emerald-600" :
                  formData.priority === "medium" ? "bg-amber-100 text-amber-600" :
                  "bg-rose-100 text-rose-600"
                }`}>
                  <div className="w-1 h-1 rounded-full bg-current" />
                  {formData.priority}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 mb-1">Assignee</p>
                <p className="text-xs font-semibold text-slate-700">
                  {users?.find((u) => u._id === formData.assignedTo)?.name || "Unassigned"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 mb-1">Due Date</p>
                <p className="text-xs font-semibold text-slate-700">
                  {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No Date"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={LABEL}>Description</label>
              <textarea name="description" rows="2" value={formData.description} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-700 resize-none" />
            </div>

            {/* Workflow Stage */}
            <div>
              <label className={LABEL}>Workflow Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {WORKFLOW.map((s) => (
                  <button key={s} type="button" onClick={() => setFormData((p) => ({ ...p, status: s }))}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all capitalize ${
                      formData.status === s
                        ? "bg-indigo-100 text-indigo-600 border-indigo-200"
                        : "bg-white text-slate-400 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {s.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button type="button" className="px-3 py-1.5 rounded-lg text-rose-500 bg-rose-50 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all">
              Delete Task
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-1.5 rounded-lg border border-gray-200 text-slate-600 text-xs font-semibold hover:bg-gray-50 transition-all">
                Close
              </button>
              <button type="button" onClick={handleSubmit} className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── CREATE VIEW ── */
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <FiCheckSquare size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Create New Task</h2>
          </div>
          <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
            <FiX size={14} />
          </button>
        </div>

        {/* FORM */}
        <form id="task-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto flex-1">

          {/* Title */}
          <div>
            <label className={LABEL}>Task Name *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange}
              placeholder="e.g. ABC Restaurant — Instagram Reel Draft"
              className={INPUT} />
          </div>

          {/* Client + Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Client</label>
              <select name="client" value={formData.client} onChange={handleChange} className={SELECT}>
                <option value="">Select client...</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Project</label>
              <select name="project" value={formData.project} onChange={handleChange} className={SELECT}>
                <option value="">Select project...</option>
                {projects?.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          {/* Assign + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Assign To</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={SELECT}>
                <option value="">Select member...</option>
                {users?.filter((u) => u.role === "team").map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className={SELECT}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          {/* Due + Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Due Date</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Est. Hours</label>
              <input type="text" name="estimatedHours" value={formData.estimatedHours} onChange={handleChange} placeholder="e.g. 3" className={INPUT} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>Description</label>
            <textarea name="description" rows="2" value={formData.description} onChange={handleChange}
              placeholder="Task details, references, instructions..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-700 resize-none" />
          </div>

          {/* Tags */}
          <div>
            <label className={LABEL}>Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    formData.tags.includes(tag)
                      ? `${TAG_COLORS[tag]} border-transparent ring-2 ring-offset-1 ring-indigo-300`
                      : "bg-white text-slate-400 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 text-xs font-semibold hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="submit" form="task-form" className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all active:scale-95">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
