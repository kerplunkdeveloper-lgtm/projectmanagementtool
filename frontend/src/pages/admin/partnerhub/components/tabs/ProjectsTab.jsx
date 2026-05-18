import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../../services/axiosInstance";
import { FiX } from "react-icons/fi";
import AddBusinessProjectModal from "../AddBusinessProjectModal";
import DeleteConfirmationModal from "../DeleteConfirmationModal";
import toast from 'react-hot-toast';

const formatINR = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const ProjectsTab = () => {
  const [projects, setProjects] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/business-projects');
      setProjects(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await axiosInstance.delete(`/business-projects/${projectToDelete._id}`);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project", err);
      toast.error("Failed to delete project");
    } finally {
      setProjectToDelete(null);
    }
  };

  const openEditModal = (project) => {
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const filteredProjects = projects.filter((project) => {
    return filterCategory === "All" || project.type === filterCategory;
  });

  return (
    <div className="bg-gradient-to-br from-[#eef2f9] to-[#fcefff] p-6 rounded-3xl min-h-[70vh] shadow-inner animate-fadeIn">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex bg-white/60 p-1 rounded-xl backdrop-blur-md shadow-sm">
          {["All", "Digital Marketing", "Website", "SEO"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`
                px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${
                  filterCategory === cat
                    ? "bg-[#7c5ff0] text-white shadow-md shadow-indigo-500/20"
                    : "text-[#64748b] hover:text-[#334155] hover:bg-white/50"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <button 
          onClick={openAddModal}
          className="bg-[#7c5ff0] hover:bg-[#6c4be0] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/30 transition-all flex items-center gap-1.5"
        >
          + Add Project
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-medium">No projects found.</div>
        ) : (
          filteredProjects.map((project) => {
            const revenue = project.revenue || 0;
            const cost = project.cost || 0;
            const profit = revenue - cost;
            const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
            
            const marginColor = margin >= 40 ? "text-[#059669]" : margin > 0 ? "text-[#d97706]" : "text-[#dc2626]";
            const profitColor = profit >= 0 ? "text-[#059669]" : "text-[#dc2626]";

            return (
              <div
                key={project._id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-white relative overflow-hidden"
              >
                {/* Left Blue Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3b82f6]"></div>

                {/* Left Content */}
                <div className="flex-1 pl-4 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[#1e293b] text-base font-extrabold">{project.name}</h3>
                    <span className="bg-[#dcfce7] text-[#166534] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border border-[#bbf7d0]">
                      {project.status.toUpperCase()}
                    </span>
                    <span className="text-[#3b82f6] text-xs font-semibold">
                      {project.type}
                    </span>
                  </div>
                  
                  {/* Employees */}
                  <div className="flex flex-wrap gap-2">
                    {project.employees && project.employees.length > 0 ? (
                      project.employees.map((emp) => (
                        <span key={emp._id} className="bg-[#f1f5f9] text-[#475569] text-[10px] px-2 py-0.5 rounded-md font-medium border border-[#e2e8f0] flex items-center gap-1">
                          {emp.name.split(' ')[0]} 
                          {emp.department && <span className="text-[#94a3b8]">| {emp.department.replace(' Team', '')}</span>}
                          {!emp.department && emp.role === 'admin' && <span className="text-[#94a3b8]">| Admin</span>}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#94a3b8] text-[10px] italic">No employees assigned</span>
                    )}
                  </div>
                </div>

                {/* Right Metrics */}
                <div className="flex items-center gap-6 mt-4 md:mt-0 px-2 md:px-6 py-2 bg-white/50 rounded-xl md:bg-transparent">
                  <div className="text-center">
                    <p className="text-[#94a3b8] text-[10px] font-semibold mb-1">Revenue</p>
                    <p className="text-[#059669] font-extrabold text-sm">{formatINR(revenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#94a3b8] text-[10px] font-semibold mb-1">Cost</p>
                    <p className="text-[#dc2626] font-extrabold text-sm">{formatINR(cost)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#94a3b8] text-[10px] font-semibold mb-1">Profit</p>
                    <p className={`${profitColor} font-extrabold text-sm`}>{formatINR(profit)}</p>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <p className="text-[#94a3b8] text-[10px] font-semibold mb-1">Margin</p>
                    <p className={`${marginColor} font-extrabold text-sm`}>{margin}%</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 md:mt-0 pl-2 md:pl-4 md:border-l border-slate-200">
                  <button 
                    onClick={() => openEditModal(project)}
                    className="px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#475569] rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => confirmDelete(project)}
                    className="w-8 h-8 flex items-center justify-center bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] rounded-lg shadow-sm hover:bg-[#fecaca] transition-colors"
                  >
                    <FiX size={14} strokeWidth={3} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      <AddBusinessProjectModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setProjectToEdit(null);
        }} 
        onProjectAdded={fetchProjects}
        projectToEdit={projectToEdit}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={projectToDelete?.name}
      />
    </div>
  );
};

export default ProjectsTab;
