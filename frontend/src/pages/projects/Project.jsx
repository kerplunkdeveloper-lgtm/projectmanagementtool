import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiInfo,
  FiX,
  FiTrash2,
  FiEdit2,
  FiChevronDown,
  FiBriefcase,
} from "react-icons/fi";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../features/projects/projectSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import { getTasks } from "../../features/tasks/taskSlice";
import { getPortfolios } from "../../features/portfolio/portfolioSlice";
import ProjectTaskBoard from "./ProjectTaskBoard";

const Project = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeProjectId = searchParams.get("id");

  // Redux State
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { tasks } = useSelector((state) => state.tasks);
  const { portfolios = [] } = useSelector((state) => state.portfolios);
  const { user: currentUser } = useSelector((state) => state.auth);

  // Local State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State for creating project
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Active");

  // Form State for editing project
  const [editProjectId, setEditProjectId] = useState("");
  const [editName, setEditName] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  // Load Data
  useEffect(() => {
    dispatch(getProjects());
    dispatch(getClients());
    dispatch(getUsers());
    dispatch(getTasks());
    dispatch(getPortfolios());
  }, [dispatch]);

  // Set default client selection once clients are loaded
  useEffect(() => {
    if (clients && clients.length > 0 && !clientId) {
      setClientId(clients[0]._id);
    }
  }, [clients, clientId]);

  const isAdmin = currentUser?.role === "admin";
  const isAdminOrManager = currentUser?.role === "admin" || currentUser?.role === "operationmanager";

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle modal trigger
  const handleOpenCreate = () => {
    setName("");
    setClientId(clients[0]?._id || "");
    setStatus("Active");
    setShowCreateModal(true);
  };

  // Submit Create Project
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name || !clientId) return;
    dispatch(
      createProject({
        name,
        client: clientId,
        status,
      })
    );
    setShowCreateModal(false);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (e, project) => {
    e.stopPropagation();
    setEditProjectId(project._id);
    setEditName(project.name);
    setEditClientId(project.client?._id || project.client || "");
    setEditStatus(project.status);
    setShowEditModal(true);
  };

  // Submit Edit Project
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editName || !editClientId) return;
    dispatch(
      updateProject({
        id: editProjectId,
        data: {
          name: editName,
          client: editClientId,
          status: editStatus,
        },
      })
    );
    setShowEditModal(false);
  };

  // Handle Delete Project
  const handleProjectDelete = (e, projectId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      dispatch(deleteProject(projectId));
    }
  };

  // Avatar gradient color generator based on name
  const getAvatarColor = (name) => {
    const colors = [
      "from-blue-500 to-indigo-500",
      "from-emerald-500 to-teal-500",
      "from-violet-500 to-purple-500",
      "from-pink-500 to-rose-500",
      "from-amber-500 to-orange-500",
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20";
      case "Completed":
        return "bg-blue-50 dark:bg-[#e5ff00]/10 text-blue-700 dark:text-[#e5ff00] border-blue-200/50 dark:border-[#e5ff00]/20";
      case "On Hold":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20";
      case "Inactive":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  // Active workspace settings
  const activeProject = projects.find((p) => p._id === activeProjectId);

  // VIEW 1: ACTIVE PROJECT TASK BOARD WORKSPACE
  if (activeProjectId && activeProject) {
    return (
      <ProjectTaskBoard
        activeProjectId={activeProjectId}
        activeProject={activeProject}
        currentUser={currentUser}
        users={users}
        isAdminOrManager={isAdminOrManager}
        getStatusBadge={getStatusBadge}
        getAvatarColor={getAvatarColor}
      />
    );
  }

  // VIEW 2: DEFAULT PROJECT DIRECTORY TABLE
  return (
    <div className=" space-y-6 ">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">All Projects Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">Comprehensive directory of current projects and clients</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] rounded-xl bg-blue-600 dark:bg-[#e5ff00] text-white dark:text-black shadow-lg shadow-blue-500/20 dark:shadow-[#e5ff00]/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 font-black uppercase tracking-wider shrink-0"
          >
            <FiPlus size={14} />
            Create Project
          </button>
        )}
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-1 relative">
         
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-white/5 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#1a1a1a] text-sm text-slate-700 dark:text-white transition-all"
          />
        </div>
        <div className="relative shrink-0 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-5 py-3 pr-11 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-white hover:border-slate-300 dark:hover:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] cursor-pointer shadow-sm md:min-w-[140px] transition-all"
          >
            <option value="All" className="dark:bg-[#111111]">All Status</option>
            <option value="Active" className="dark:bg-[#111111]">Active</option>
            <option value="On Hold" className="dark:bg-[#111111]">On Hold</option>
            <option value="Completed" className="dark:bg-[#111111]">Completed</option>
            <option value="Inactive" className="dark:bg-[#111111]">Inactive</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <FiChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* TABLE VIEW OF PROJECTS */}
      {projectsLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#e5ff00]"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#111111] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
          <FiInfo size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-white">No Projects Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try updating your filters or search options.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-[#1a1a1a] dark:to-[#1a1a1a] dark:border-b dark:border-white/5">
                <tr className="text-slate-505 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Portfolio</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-center">View</th>
                  {isAdmin && <th className="px-6 py-4 text-center w-36">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs bg-white dark:bg-[#0a0a0a]">
                {filteredProjects.map((project) => {
                  const projectPortfolio = portfolios.find(port => 
                    (port.projectIds || []).some(id => 
                      (typeof id === 'object' && id !== null ? id._id === project._id : id === project._id)
                    )
                  );

                  return (
                    <tr
                      key={project._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/5 even:bg-slate-50/30 dark:even:bg-[#111111]/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-white">
                        {project.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600 dark:text-[#e5ff00] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/20">
                          {project.client?.companyName || "No Client"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {projectPortfolio ? (
                          <span 
                            className="font-bold text-[10px] px-2 py-0.5 rounded-lg border uppercase tracking-wider"
                            style={{
                              backgroundColor: `${projectPortfolio.color}15`,
                              borderColor: `${projectPortfolio.color}40`,
                              color: projectPortfolio.color
                            }}
                          >
                            {projectPortfolio.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-[10px] italic uppercase tracking-wider font-bold">
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const projectTasks = tasks.filter((t) => t.project?._id === project._id || t.project === project._id);
                          const total = projectTasks.length;
                          const completed = projectTasks.filter((t) => t.status === "Completed").length;
                          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                          return (
                            <div className="flex flex-col gap-1.5 max-w-[160px]">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-505 bg-transparent">
                                <span>{completed}/{total} Tasks</span>
                                <span className="text-blue-600 dark:text-[#e5ff00] font-extrabold">{percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-[#1a1a1a] border border-transparent dark:border-white/5 h-2 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-[#99cc00] dark:to-[#e5ff00] h-full rounded-full transition-all duration-350 dark:shadow-[0_0_8px_rgba(229,255,0,0.6)]"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/${currentUser?.role}/projects?id=${project._id}`)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-[#1a1a1a] dark:text-[#e5ff00] dark:hover:bg-[#e5ff00] dark:hover:text-black rounded-lg text-[11px] font-bold transition-colors border border-blue-100 hover:border-blue-600 dark:border-white/10 dark:hover:border-[#e5ff00] whitespace-nowrap"
                        >
                          View Tasks
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              onClick={(e) => handleOpenEdit(e, project)}
                              className="text-slate-400 hover:text-blue-600 dark:hover:text-[#e5ff00] transition-colors p-1"
                              title="Edit Project"
                            >
                              <FiEdit2 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleProjectDelete(e, project._id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Delete Project"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PROJECT OFFCANVAS DRAWER */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-[#111111]/70 backdrop-blur-[2px]"
            />
            {/* Side Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111111] h-full shadow-2xl flex flex-col z-10 border-l border-slate-100 dark:border-white/5"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/20 flex items-center justify-center text-blue-600 dark:text-[#e5ff00]">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 dark:text-white">Add New Project</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Project Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-155 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#111111] text-sm text-slate-700 dark:text-white placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  {/* Client Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-155 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#111111] text-sm text-slate-700 dark:text-white cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients.map((c) => (
                          <option key={c._id} value={c._id} className="dark:bg-[#111111]">
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Status Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-155 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#111111] text-sm text-slate-700 dark:text-white cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active" className="dark:bg-[#111111]">Active</option>
                        <option value="On Hold" className="dark:bg-[#111111]">On Hold</option>
                        <option value="Completed" className="dark:bg-[#111111]">Completed</option>
                        <option value="Inactive" className="dark:bg-[#111111]">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-500 dark:hover:bg-[#ccff00] text-white dark:text-black text-sm font-bold shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/20 active:scale-95 transition-all"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT PROJECT OFFCANVAS DRAWER */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-[#111111]/70 backdrop-blur-[2px]"
            />
            {/* Side Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111111] h-full shadow-2xl flex flex-col z-10 border-l border-slate-100 dark:border-white/5"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-[#e5ff00]/10 border border-amber-100 dark:border-[#e5ff00]/20 flex items-center justify-center text-amber-600 dark:text-[#e5ff00]">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 dark:text-white">Edit Project</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Modify Settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-155 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#111111] text-sm text-slate-700 dark:text-white placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  {/* Client Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={editClientId}
                        onChange={(e) => setEditClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-155 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#111111] text-sm text-slate-700 dark:text-white cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients.map((c) => (
                          <option key={c._id} value={c._id} className="dark:bg-[#111111]">
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Status Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-155 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] focus:bg-white dark:focus:bg-[#111111] text-sm text-slate-700 dark:text-white cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active" className="dark:bg-[#111111]">Active</option>
                        <option value="On Hold" className="dark:bg-[#111111]">On Hold</option>
                        <option value="Completed" className="dark:bg-[#111111]">Completed</option>
                        <option value="Inactive" className="dark:bg-[#111111]">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-500 dark:hover:bg-[#ccff00] text-white dark:text-black text-sm font-bold shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/20 active:scale-95 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Project;