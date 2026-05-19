import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../../services/axiosInstance";
import { FiPlus, FiX } from "react-icons/fi";
import AssignEmployeeModal from "../AssignEmployeeModal";
import toast from "react-hot-toast";

const formatINR = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const ClientSplitsTab = () => {
  const [team, setTeam] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Drag & Drop States
  const [draggingProjectId, setDraggingProjectId] = useState(null);
  const [draggingSourceEmployeeId, setDraggingSourceEmployeeId] = useState(null);
  const [dragOverEmployeeId, setDragOverEmployeeId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, projectsRes] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get('/business-projects')
      ]);
      setTeam(usersRes.data.data || usersRes.data || []);
      setProjects(projectsRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayRole = (user) => {
    if (user.role === 'admin') return "Managing Partner";
    if (user.role === 'operationmanager') return "Operations Manager";
    if (user.department) return user.department.replace(' Team', '') + ' Manager';
    return user.role;
  };

  const openAssignModal = (employee = null) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  // Drag & Drop Event Handlers
  const handleDragStart = (e, project, employeeId) => {
    setDraggingProjectId(project._id);
    setDraggingSourceEmployeeId(employeeId);
    e.dataTransfer.setData("projectId", project._id);
    e.dataTransfer.setData("sourceEmployeeId", employeeId || "unassigned");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingProjectId(null);
    setDraggingSourceEmployeeId(null);
    setDragOverEmployeeId(null);
  };

  const handleDragOver = (e, employeeId) => {
    e.preventDefault();
    if (dragOverEmployeeId !== employeeId) {
      setDragOverEmployeeId(employeeId);
    }
  };

  const handleDrop = async (e, targetEmployeeId) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("projectId") || draggingProjectId;
    const sourceEmployeeId = e.dataTransfer.getData("sourceEmployeeId") || draggingSourceEmployeeId;
    
    setDragOverEmployeeId(null);
    
    if (!projectId) return;
    
    // If dropped on the same column, do nothing
    if (sourceEmployeeId === targetEmployeeId) return;

    try {
      const project = projects.find(p => p._id === projectId);
      if (!project) return;

      let updatedEmployees = [...(project.employees || [])].map(emp => typeof emp === 'object' ? emp._id : emp);

      if (targetEmployeeId === "unassigned") {
        // Remove source employee from this project
        if (sourceEmployeeId && sourceEmployeeId !== "unassigned") {
          updatedEmployees = updatedEmployees.filter(id => id !== sourceEmployeeId);
        }
      } else {
        // Move to target employee:
        // Remove from source if assigned
        if (sourceEmployeeId && sourceEmployeeId !== "unassigned") {
          updatedEmployees = updatedEmployees.filter(id => id !== sourceEmployeeId);
        }
        // Add to target if not already there
        if (!updatedEmployees.includes(targetEmployeeId)) {
          updatedEmployees.push(targetEmployeeId);
        }
      }

      const res = await axiosInstance.put(`/business-projects/${projectId}`, {
        employees: updatedEmployees
      });

      if (res.data.success) {
        toast.success("Assignment updated successfully!");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update assignment via drag & drop", err);
      toast.error("Failed to update assignment");
    }
  };

  const handleUnassign = async (projectId, employeeId) => {
    try {
      const project = projects.find(p => p._id === projectId);
      if (!project) return;

      const updatedEmployees = [...(project.employees || [])]
        .map(emp => typeof emp === 'object' ? emp._id : emp)
        .filter(id => id !== employeeId);

      const res = await axiosInstance.put(`/business-projects/${projectId}`, {
        employees: updatedEmployees
      });

      if (res.data.success) {
        toast.success("Employee unassigned successfully!");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to unassign employee", err);
      toast.error("Failed to unassign employee");
    }
  };

  // Compute Cost Attribution Summary
  const totalActiveClients = projects.length;
  const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
  
  const totalCTC = team.reduce((sum, member) => {
    const salary = member.salary || 0;
    const overhead = member.overheadPercent || 0;
    return sum + (salary + (salary * overhead / 100));
  }, 0);
  
  const totalCost = totalCTC + 30000;
  const netProfit = totalRevenue - totalCost;

  // Filter unassigned projects
  const unassignedProjects = projects.filter(p => !p.employees || p.employees.length === 0);

  return (
    <div className="animate-fadeIn space-y-6 pb-10">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#eaeef6] p-4 rounded-xl shadow-sm border border-[#d1d5db]">
        <div className="flex justify-between items-center gap-20 mt-3 md:mt-0">
          <p className="text-[#64748b] text-[11px]  font-medium">Assign employees to clients using Drag and Drop or click the button below. CTC and cost-per-client are auto-calculated.</p>
          <button 
            onClick={() => openAssignModal()}
            className="px-4 py-2 bg-[#7c5ff0] text-white font-bold text-xs rounded-lg shadow-md shadow-indigo-500/30 hover:bg-[#6c4be0] transition-colors flex items-center gap-1.5"
          >
            <FiPlus size={16} /> Assign Employee
          </button>
        </div>
      </div>

      {/* Main Grid area */}
      <div className="bg-[#f1f3f9] rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
        <div className="flex overflow-x-auto min-h-[420px] snap-x custom-scrollbar pb-2">
          {loading ? (
            <div className="w-full flex items-center justify-center text-slate-500 font-bold py-20">Loading client splits...</div>
          ) : (
            <>
              {/* Unassigned Clients Column */}
              <div 
                onDragOver={(e) => handleDragOver(e, "unassigned")}
                onDragLeave={() => setDragOverEmployeeId(null)}
                onDrop={(e) => handleDrop(e, "unassigned")}
                className={`min-w-[250px] flex-1 border-r border-[#e2e8f0] snap-start flex flex-col bg-[#f1f5f9] transition-all duration-200 ${
                  dragOverEmployeeId === "unassigned" ? "bg-slate-200 ring-2 ring-dashed ring-slate-400 ring-inset" : ""
                }`}
              >
                {/* Column Header */}
                <div className="bg-[#475569] text-white text-center py-3 px-2 flex justify-center items-center gap-1.5">
                  <span className="text-xs">📋</span>
                  <h3 className="font-extrabold text-sm truncate">Unassigned Clients</h3>
                  <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {unassignedProjects.length}
                  </span>
                </div>
                
                <div className="bg-[#e2e8f0] text-center py-2 px-2 border-b border-white">
                  <p className="text-[#64748b] text-[11px] font-medium">Drag from here to assign</p>
                </div>
                
                <div className="bg-slate-100/50 text-center py-2 px-2 border-b border-white">
                  <p className="text-[#64748b] text-[11px] font-bold">Drop here to unassign</p>
                </div>

                {/* Clients List */}
                <div className="flex-1 p-3 space-y-2.5 min-h-[300px]">
                  {unassignedProjects.map(proj => (
                    <div 
                      key={proj._id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, proj, null)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white p-3 rounded-xl border border-[#cbd5e1] shadow-sm flex flex-col cursor-grab active:cursor-grabbing hover:border-slate-400 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 select-none ${
                        draggingProjectId === proj._id ? "opacity-40 border-dashed" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-slate-800 font-bold text-[13px] truncate">{proj.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase shrink-0">
                          {proj.type || 'Project'}
                        </span>
                      </div>
                      <span className="text-[#94a3b8] text-[10px] font-medium mt-1">
                        Value: {formatINR(proj.revenue || 0)}/mo
                      </span>
                    </div>
                  ))}
                  
                  {unassignedProjects.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl py-16">
                      <span className="text-2xl mb-1">🎉</span>
                      <p className="text-[11px] font-medium">All clients assigned!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Columns */}
              {team.map(employee => {
                // Calculate employee's assigned clients
                const assignedProjects = projects.filter(p => p.employees && p.employees.some(e => e._id === employee._id || e === employee._id));
                const activeProjectsCount = assignedProjects.length;
                
                // Time allocation logic (mocked logic if no DB field: 100% / number of projects, capped at 100%)
                const timeAlloc = activeProjectsCount > 0 ? Math.round(100 / activeProjectsCount) : 0;
                
                // CTC
                const salary = employee.salary || 0;
                const overhead = employee.overheadPercent || 0;
                const ctc = salary + (salary * overhead / 100);
                
                // Cost per project
                const costPerProject = activeProjectsCount > 0 ? Math.round(ctc / activeProjectsCount) : 0;

                return (
                  <div 
                    key={employee._id} 
                    onDragOver={(e) => handleDragOver(e, employee._id)}
                    onDragLeave={() => setDragOverEmployeeId(null)}
                    onDrop={(e) => handleDrop(e, employee._id)}
                    className={`min-w-[250px] flex-1 border-r border-[#e2e8f0] snap-start flex flex-col bg-[#f8fafc] transition-all duration-200 ${
                      dragOverEmployeeId === employee._id ? "bg-indigo-50/80 ring-2 ring-dashed ring-[#7c5ff0] ring-inset" : ""
                    }`}
                  >
                    
                    {/* Column Header */}
                    <div className="bg-[#7c5ff0] text-white text-center py-3 px-2">
                      <h3 className="font-extrabold text-sm truncate">{employee.name}</h3>
                    </div>
                    
                    <div className="bg-[#e4e6f2] text-center py-2 px-2 border-b border-white">
                      <p className="text-[#64748b] text-[11px] font-medium truncate">{getDisplayRole(employee)}</p>
                    </div>
                    
                    <div className="bg-[#fee2e2] text-center py-2 px-2 border-b border-white">
                      <p className="text-[#ef4444] text-[11px] font-bold">CTC: {formatINR(ctc)}</p>
                    </div>

                    {/* Clients List */}
                    <div className="flex-1 p-3 space-y-2.5 min-h-[300px]">
                      {assignedProjects.map(proj => (
                        <div 
                          key={proj._id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, proj, employee._id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col cursor-grab active:cursor-grabbing hover:border-[#7c5ff0] hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 relative group select-none ${
                            draggingProjectId === proj._id ? "opacity-40 border-dashed" : ""
                          }`}
                        >
                          {/* Unassign button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassign(proj._id, employee._id);
                            }}
                            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity duration-150 p-1 rounded-lg bg-slate-50 hover:bg-red-50 shadow-sm"
                            title="Unassign employee"
                          >
                            <FiX size={14} />
                          </button>

                          <span className="text-[#1e293b] font-bold text-[13px] truncate pr-6">{proj.name}</span>
                          <span className="text-[#94a3b8] text-[10px] font-medium mt-1">
                            {timeAlloc}% time · {formatINR(costPerProject)}/mo cost
                          </span>
                        </div>
                      ))}
                      
                      {/* Bottom Add button */}
                      <button 
                        onClick={() => openAssignModal(employee)}
                        className="w-full mt-2 py-2.5 flex items-center justify-center gap-1 text-[#94a3b8] text-xs font-bold bg-[#f1f3f9] hover:bg-[#e4e6f2] rounded-xl transition-colors border border-dashed border-[#cbd0e1]"
                      >
                        <FiPlus size={12} /> Assign
                      </button>
                    </div>

                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-[#1e293b] font-extrabold text-base mb-6 flex items-center gap-2">
          <span>💰</span> Cost Attribution Summary
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] text-center flex flex-col justify-center shadow-sm">
            <p className="text-[#94a3b8] text-xs font-bold mb-1.5 uppercase tracking-wider">Total Active Clients</p>
            <p className="text-[#3b82f6] text-3xl sm:text-4xl font-black">{totalActiveClients}</p>
          </div>
          
          <div className="bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] text-center flex flex-col justify-center shadow-sm">
            <p className="text-[#94a3b8] text-xs font-bold mb-1.5 uppercase tracking-wider">Total Revenue</p>
            <p className="text-[#10b981] text-2xl sm:text-3xl font-black">{formatINR(totalRevenue)}</p>
          </div>
          
          <div className="bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] text-center flex flex-col justify-center shadow-sm">
            <p className="text-[#94a3b8] text-xs font-bold mb-1.5 uppercase tracking-wider">Total Cost</p>
            <p className="text-[#ef4444] text-2xl sm:text-3xl font-black">{formatINR(totalCost)}</p>
          </div>
          
          <div className="bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] text-center flex flex-col justify-center shadow-sm">
            <p className="text-[#94a3b8] text-xs font-bold mb-1.5 uppercase tracking-wider">Net Profit</p>
            <p className="text-[#10b981] text-2xl sm:text-3xl font-black">{formatINR(netProfit)}</p>
          </div>
        </div>
      </div>

      <AssignEmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssigned={fetchData}
        initialEmployee={selectedEmployee}
      />

    </div>
  );
};

export default ClientSplitsTab;
