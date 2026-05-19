import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getProjects, createProject, updateProject, deleteProject,
} from "../../features/projects/projectSlice";
import axiosInstance from "../../services/axiosInstance";
import { FiPlus, FiEdit, FiTrash2, FiX, FiSearch, FiLayers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const STATUS_STYLE = {
  Active:     "bg-blue-50 text-blue-600 border-blue-200",
  "In Review":"bg-amber-50 text-amber-600 border-amber-200",
  "At Risk":  "bg-rose-50 text-rose-600 border-rose-200",
  Completed:  "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const PRIORITY_DOT = { low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-rose-500" };

const getProgress = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start).getTime(), e = new Date(end).getTime(), n = Date.now();
  if (n <= s) return 0; if (n >= e) return 100;
  return Math.round(((n - s) / (e - s)) * 100);
};

const Project = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading } = useSelector((s) => s.projects);
  const { user } = useSelector((s) => s.auth);

  const [openModal, setOpenModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    title: "", client: "", template: "", type: "Monthly Retainer",
    status: "Active", priority: "medium", startDate: "", endDate: "", description: "",
  });

  useEffect(() => { dispatch(getProjects()); fetchDropdownData(); }, [dispatch]);

  const fetchDropdownData = async () => {
    try {
      const [cr, tr] = await Promise.all([
        axiosInstance.get("/clients/all"),
        axiosInstance.get("/templates"),
      ]);
      setClients(cr.data.data); setTemplates(tr.data.data);
    } catch (err) { console.log(err); }
  };

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.template) delete payload.template;
    if (editProject) dispatch(updateProject({ id: editProject._id, data: payload }));
    else dispatch(createProject(payload));
    setOpenModal(false); setEditProject(null);
    setFormData({ title: "", client: "", template: "", type: "Monthly Retainer", status: "Active", priority: "medium", startDate: "", endDate: "", description: "" });
  };

  const handleEdit = (project) => {
    setEditProject(project);
    setFormData({
      title: project.title, client: project.client?._id || "",
      template: project.template?._id || "", type: project.type,
      status: project.status || "Active", priority: project.priority,
      startDate: project.startDate?.split("T")[0], endDate: project.endDate?.split("T")[0],
      description: project.description,
    });
    setOpenModal(true);
  };

  const filtered = projects.filter((p) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SELECT = "w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-700 cursor-pointer";
  const INPUT  = "w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-700";
  const LABEL  = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <FiLayers size={14} className="text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">All Projects</h1>
            </div>
            <p className="text-xs text-gray-400 ml-9">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-52">
              <FiSearch size={13} className="text-gray-400 shrink-0" />
              <input
                type="text" placeholder="Search projects..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-xs text-gray-700 placeholder:text-gray-400 w-full"
              />
            </div>
            <button
              onClick={() => { setOpenModal(true); setEditProject(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-200 transition-all active:scale-95"
            >
              <FiPlus size={16} /> New Project
            </button>
          </div>
        </div>

        {/* PROJECT LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading projects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <FiLayers size={22} className="text-gray-300" />
            </div>
            <h2 className="text-sm font-bold text-slate-600">No Projects Found</h2>
            <p className="text-xs text-gray-400 mt-1">{searchTerm ? "Try a different search" : "Create your first project"}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((project) => {
              const clientName = project.client?.companyName || "Unknown";
              const progress = getProgress(project.startDate, project.endDate);
              const stat = project.status || "Active";
              const statusStyle = STATUS_STYLE[stat] || STATUS_STYLE.Active;
              const progColor = progress < 40 ? "bg-blue-500" : progress < 70 ? "bg-amber-500" : "bg-emerald-500";

              return (
                <div key={project._id} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

                  {/* Left: Avatar + Info */}
                  <div className="flex items-center gap-3 xl:w-[38%] min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-base flex-shrink-0">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[project.priority] || "bg-gray-300"}`} />
                        <h3 className="text-sm font-bold text-slate-800 truncate">{clientName} — {project.title}</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">
                        {project.type} · {project.startDate?.split("T")[0]} → {project.endDate?.split("T")[0]}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 flex-1 xl:min-w-0">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${progColor} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 w-8 text-right shrink-0">{progress}%</span>
                  </div>

                  {/* Right: Status + Tasks + Actions */}
                  <div className="flex items-center gap-3 justify-between xl:justify-end xl:shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>{stat}</span>
                    <span className="text-[10px] text-gray-400">{project.tasks?.length || 0} tasks</span>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(project)} className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-all" title="Edit">
                        <FiEdit size={12} />
                      </button>
                      <button onClick={() => dispatch(deleteProject(project._id))} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all" title="Delete">
                        <FiTrash2 size={12} />
                      </button>
                      <button onClick={() => navigate(`/${user?.role || "admin"}/tasks`)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-slate-600 hover:bg-gray-50 transition-all">
                        Tasks
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 z-50">
            <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-slate-50/60">
                <h2 className="text-sm font-bold text-slate-800">
                  {editProject ? "✏️ Update Project" : "✨ New Project"}
                </h2>
                <button onClick={() => setOpenModal(false)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                  <FiX size={14} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[78vh] overflow-y-auto">
                <div>
                  <label className={LABEL}>Project Name *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Enter project name" className={INPUT} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Client *</label>
                    <select name="client" required value={formData.client} onChange={handleChange} className={SELECT}>
                      <option value="">Select client...</option>
                      {clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={SELECT}>
                      <option>Monthly Retainer</option>
                      <option>One Time Project</option>
                      <option>Internal Project</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={SELECT}>
                      <option>Active</option>
                      <option>In Review</option>
                      <option>At Risk</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className={SELECT}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>End Date</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={INPUT} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Template</label>
                    <select name="template" value={formData.template} onChange={handleChange} className={SELECT}>
                      <option value="">No template</option>
                      {templates.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div /> {/* spacer */}
                </div>

                <div>
                  <label className={LABEL}>Description</label>
                  <textarea rows="2" name="description" value={formData.description} onChange={handleChange} placeholder="Brief project description..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-700 resize-none" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50 transition-all">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 transition-all active:scale-95">
                    {editProject ? "Save Changes" : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Project;