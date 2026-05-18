// pages/Project.jsx

import React, {
  useEffect,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../features/projects/projectSlice";

import axiosInstance from "../../services/axiosInstance";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSearch,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Project = () => {

  const dispatch =
    useDispatch();

  const navigate = useNavigate();

  const {
    projects,
    loading,
  } = useSelector(
    (state) => state.projects
  );

  const { user } = useSelector((state) => state.auth);



  // ==========================================
  // STATES
  // ==========================================

  const [openModal, setOpenModal] =
    useState(false);

  const [editProject, setEditProject] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [clients, setClients] =
    useState([]);

  const [templates, setTemplates] =
    useState([]);

  const [formData, setFormData] =
    useState({
      title: "",

      client: "",

      template: "",

      type:
        "Monthly Retainer",

      priority: "medium",

      startDate: "",

      endDate: "",

      description: "",
    });



  // ==========================================
  // GET DATA
  // ==========================================

  useEffect(() => {

    dispatch(getProjects());

    fetchDropdownData();

  }, [dispatch]);



  // ==========================================
  // FETCH CLIENTS + TEMPLATES
  // ==========================================

  const fetchDropdownData =
    async () => {

      try {

        const clientRes =
          await axiosInstance.get(
            "/clients/all"
          );

        const templateRes =
          await axiosInstance.get(
            "/templates"
          );

        setClients(
          clientRes.data.data
        );

        setTemplates(
          templateRes.data.data
        );

      } catch (err) {

        console.log(err);
      }
    };



  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };



  // ==========================================
  // HANDLE SUBMIT
  // ==========================================

  const handleSubmit = (e) => {

    e.preventDefault();

    const payload = { ...formData };
    if (!payload.template) {
      delete payload.template;
    }

    if (editProject) {

      dispatch(
        updateProject({
          id: editProject._id,
          data: payload,
        })
      );

    } else {

      dispatch(
        createProject(payload)
      );
    }



    setOpenModal(false);

    setEditProject(null);



    setFormData({
      title: "",

      client: "",

      template: "",

      type:
        "Monthly Retainer",

      priority: "medium",

      startDate: "",

      endDate: "",

      description: "",
    });
  };



  // ==========================================
  // HANDLE EDIT
  // ==========================================

  const handleEdit = (
    project
  ) => {

    setEditProject(project);

    setFormData({

      title:
        project.title,

      client:
        project.client?._id || "",

      template:
        project.template?._id || "",

      type:
        project.type,

      priority:
        project.priority,

      startDate:
        project.startDate?.split(
          "T"
        )[0],

      endDate:
        project.endDate?.split(
          "T"
        )[0],

      description:
        project.description,
    });

    setOpenModal(true);
  };



  // ==========================================
  // FILTERED PROJECTS
  // ==========================================

  const filteredProjects =
    projects.filter((project) =>
      project.title
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );

  // Time-based progress calculator for UI realism
  const getProgress = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();
    if (now <= startDate) return 0;
    if (now >= endDate) return 100;
    return Math.round(((now - startDate) / (endDate - startDate)) * 100);
  };

  const getProgressColor = (progress) => {
    if (progress < 40) return "bg-blue-500";
    if (progress < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eff3fc] to-[#f4f0ff] px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-black text-[#1e293b]">All Projects</h1>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-[#475569] shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:font-medium"
              />
            </div>

            <select className="h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-[#475569] shadow-sm outline-none cursor-pointer flex-shrink-0 focus:border-indigo-400">
              <option>All Clients</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
            </select>
            
            <select className="h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-[#475569] shadow-sm outline-none cursor-pointer flex-shrink-0 focus:border-indigo-400">
              <option>All Statuses</option>
              <option>Active</option>
              <option>In Review</option>
              <option>At Risk</option>
            </select>
            
            <button
              onClick={() => {
                setOpenModal(true);
                setEditProject(null);
              }}
              className="h-10 flex items-center justify-center gap-2 px-5 rounded-xl bg-[#7c5ff0] text-white font-bold text-sm shadow-md hover:bg-[#6c4be0] transition-colors flex-shrink-0"
            >
              <FiPlus size={16} />
              New Project
            </button>
          </div>
        </div>

        {/* PROJECT LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold text-sm animate-pulse">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#f1f3f9] rounded-full flex items-center justify-center mb-4">
                <FiSearch size={24} className="text-[#94a3b8]" />
              </div>
              <h2 className="text-lg font-black text-[#1e293b]">No Projects Found</h2>
              <p className="text-[#64748b] mt-1 text-sm font-medium">Try adjusting your search criteria or add a new project.</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const clientName = project.client?.companyName || "Unknown Client";
              const progress = getProgress(project.startDate, project.endDate);
              const progressColor = getProgressColor(progress);
              
              // Status Styling
              let statusStyle = "bg-blue-50 text-blue-500 border-blue-100";
              const stat = project.status?.toUpperCase() || "ACTIVE";
              if (stat.includes("REVIEW")) statusStyle = "bg-amber-50 text-amber-600 border-amber-100";
              if (stat.includes("RISK") || stat.includes("DELAY")) statusStyle = "bg-rose-50 text-rose-500 border-rose-100";
              if (stat.includes("COMPLETED")) statusStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";

              return (
                <div key={project._id} className="bg-white rounded-[20px] p-4 flex flex-col xl:flex-row xl:items-center justify-between border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all gap-4 xl:gap-8">
                  
                  {/* Left: Avatar + Title */}
                  <div className="flex items-center gap-4 w-full xl:w-2/5 min-w-0">
                    <div className="w-14 h-14 bg-[#f8fafc] border border-slate-100 rounded-[14px] flex items-center justify-center font-black text-xl text-[#1e293b] flex-shrink-0 shadow-sm">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                      <h3 className="font-black text-[#1e293b] text-sm truncate" title={`${clientName} — ${project.title}`}>
                        {clientName} — {project.title}
                      </h3>
                      <p className="text-[#94a3b8] text-[11px] font-bold mt-1 truncate">
                        {project.type} - Started {project.startDate ? project.startDate.split('T')[0] : 'N/A'} - Due {project.endDate ? project.endDate.split('T')[0] : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Middle: Progress Bar */}
                  <div className="flex-1 flex items-center gap-4 w-full xl:w-auto">
                    <div className="h-2 flex-1 bg-[#f1f5f9] rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${progressColor} rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-[#94a3b8] text-xs font-black w-10 text-right">{progress}%</span>
                  </div>

                  {/* Right: Status + Tasks + Buttons */}
                  <div className="flex items-center justify-between xl:justify-end gap-6 w-full xl:w-[30%] min-w-[280px]">
                    <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase border tracking-wider ${statusStyle}`}>
                      {stat}
                    </span>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-[#94a3b8] text-[11px] font-bold">{project.tasks?.length || 0} tasks</span>
                      {/* Optional: Add overdue task logic here if available */}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(project)}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors"
                        title="Edit Project"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button 
                        onClick={() => dispatch(deleteProject(project._id))}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-colors"
                        title="Delete Project"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      <button 
                        onClick={() => navigate(`/${user?.role || 'admin'}/tasks`)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#475569] shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        View Tasks
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#f8fafc] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center border border-white/20">
              
              {/* HEADER */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-[#e2e8f0] bg-white">
                <h2 className="text-xl font-black text-[#1e293b]">
                  {editProject ? "Update Project" : "Create New Project"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-8 h-8 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] hover:text-[#475569] hover:bg-[#e2e8f0] transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                
                {/* Project Name */}
                <div>
                  <label className="block text-xs font-black text-[#64748b] mb-2">Project Name *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter project name..."
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2">Client *</label>
                    <select
                      name="client"
                      value={formData.client}
                      onChange={handleChange}
                      required
                      className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm shadow-sm cursor-pointer"
                    >
                      <option value="">Select client...</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>{client.companyName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm shadow-sm cursor-pointer"
                    >
                      <option>Monthly Retainer</option>
                      <option>Campaign</option>
                      <option>One-Time</option>
                      <option>Video Production</option>
                      <option>Internal Project</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm shadow-sm"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Template */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2">Apply Template</label>
                    <select
                      name="template"
                      value={formData.template}
                      onChange={handleChange}
                      className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm shadow-sm cursor-pointer"
                    >
                      <option value="">No template</option>
                      {templates.map((template) => (
                        <option key={template._id} value={template._id}>{template.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2">Priority Level</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full h-11 bg-white border border-[#e2e8f0] rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-bold text-sm shadow-sm cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-[#64748b] mb-2">Description</label>
                  <textarea
                    rows="3"
                    name="description"
                    placeholder="Briefly describe the project goals..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl p-4 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-[#1e293b] font-medium text-sm shadow-sm resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-[#e2e8f0] text-[#475569] font-bold text-sm bg-white hover:bg-[#f1f5f9] transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white font-bold text-sm shadow-md hover:bg-[#6c4be0] transition-colors"
                  >
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