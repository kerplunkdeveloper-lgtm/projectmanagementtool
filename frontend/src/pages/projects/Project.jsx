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
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Inactive":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700";
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
    <div className=" space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800  dark:text-yellow-50 ">All Projects Management</h1>
          <p className="text-slate-500 text-[10px] mt-1">Comprehensive directory of current projects and clients</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200 shrink-0"
          >
            <FiPlus size={18} />
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
            className="w-full pl-11 pr-4  py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 transition-all"
          />
        </div>
        <div className="relative shrink-0 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-5 py-3 pr-11 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm md:min-w-[140px] transition-all"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <FiChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* TABLE VIEW OF PROJECTS */}
      {projectsLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <FiInfo size={40} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-700">No Projects Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try updating your filters or search options.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <tr className="text-slate-505 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-center">View</th>
                  {isAdmin && <th className="px-6 py-4 text-center w-36">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-extrabold text-slate-800  dark:text-yellow-50">
                      {project.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-600 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100">
                        {project.client?.companyName || "No Client"}
                      </span>
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
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span>{completed}/{total} Tasks</span>
                              <span className="text-blue-600 font-extrabold">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full rounded-full transition-all duration-350"
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
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors border border-blue-100 hover:border-blue-600 whitespace-nowrap"
                      >
                        View Tasks
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            onClick={(e) => handleOpenEdit(e, project)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
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
                ))}
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            {/* Side Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800  dark:text-yellow-50">Add New Project</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Project Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  {/* Client Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients.map((c) => (
                          <option key={c._id} value={c._id}>
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
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            {/* Side Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800  dark:text-yellow-50">Edit Project</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Modify Settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  {/* Client Select field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={editClientId}
                        onChange={(e) => setEditClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients.map((c) => (
                          <option key={c._id} value={c._id}>
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
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50/60 border border-slate-155 focus:outline-none focus:border-blue-500 focus:bg-white text-sm text-slate-700 cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
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