import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../../services/axiosInstance";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import toast from 'react-hot-toast';
import AddEmployeeModal from "../AddEmployeeModal";
import DeleteConfirmationModal from "../DeleteConfirmationModal";

const formatINR = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const TeamStrengthTab = () => {
  const [team, setTeam] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

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
      
      const userList = usersRes.data.data || usersRes.data;
      const projectList = projectsRes.data.data || [];
      
      setTeam(Array.isArray(userList) ? userList : []);
      setProjects(projectList);
    } catch (err) {
      console.error("Failed to fetch team data", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format role name
  const getDisplayRole = (user) => {
    if (user.role === 'admin') return "Managing Partner";
    if (user.role === 'operationmanager') return "Operations Manager";
    if (user.department) {
      let dept = user.department.replace(' Team', '');
      if (dept.includes('Social Media')) return 'Social Media Manager';
      if (dept.includes('Designer')) return 'Designer';
      if (dept.includes('SEO')) return 'SEO Specialist';
      if (dept.includes('Editor') || dept.includes('Cameraman') || dept.includes('Scriptwriter')) return 'Video Production';
      return dept;
    }
    return user.role;
  };

  const openAddModal = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEmployeeToEdit(employee);
    setIsModalOpen(true);
  };

  const confirmDelete = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await axiosInstance.delete(`/users/${employeeToDelete._id}`);
      toast.success("Employee deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to delete employee", err);
      toast.error("Failed to delete employee");
    } finally {
      setEmployeeToDelete(null);
    }
  };

  // Calculate team metrics
  const totalTeamStrength = team.length;
  const totalSalary = team.reduce((sum, member) => sum + (member.salary || 0), 0);
  const avgSalary = totalTeamStrength > 0 ? Math.round(totalSalary / totalTeamStrength) : 0;
  
  const totalRevenue = projects.reduce((sum, proj) => sum + (proj.revenue || 0), 0);
  const revenuePerEmployee = totalTeamStrength > 0 ? Math.round(totalRevenue / totalTeamStrength) : 0;

  // Row aggregations
  let totalCtcSum = 0;
  let totalProjectsSum = 0;
  let totalRevShareSum = 0;

  return (
    <div className="animate-fadeIn pb-10">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1 */}
        <div className="bg-[#f0f4ff] border border-[#dbeafe] rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#3b82f6]" />
          <h4 className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider mb-2">Total Team Strength</h4>
          <h2 className="text-[#0f172a] text-3xl font-extrabold">{totalTeamStrength}</h2>
          <p className="text-[#64748b] text-[11px] mt-1">Active employees</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#10b981]" />
          <h4 className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider mb-2">Total Salary Bill</h4>
          <h2 className="text-[#0f172a] text-3xl font-extrabold">{formatINR(totalSalary)}</h2>
          <p className="text-[#64748b] text-[11px] mt-1">Per month</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f59e0b]" />
          <h4 className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider mb-2">Avg Salary</h4>
          <h2 className="text-[#0f172a] text-3xl font-extrabold">{formatINR(avgSalary)}</h2>
          <p className="text-[#64748b] text-[11px] mt-1">Per employee</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#faf5ff] border border-[#f3e8ff] rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#8b5cf6]" />
          <h4 className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider mb-2">Revenue Per Employee</h4>
          <h2 className="text-[#0f172a] text-3xl font-extrabold">{formatINR(revenuePerEmployee)}</h2>
          <p className="text-[#64748b] text-[11px] mt-1">Monthly</p>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-8 py-5 border-b border-slate-100">
          <h3 className="text-[#1e293b] font-bold text-lg">Individual Employee Details & Project Allocation</h3>
          <button 
            onClick={openAddModal}
            className="mt-3 sm:mt-0 bg-[#7c5ff0] hover:bg-[#6c4be0] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/30 transition-all flex items-center gap-1.5"
          >
            <FiPlus size={16} /> Add Employee
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-8 uppercase">Employee</th>
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-4 uppercase">Salary</th>
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-4 uppercase">Overhead%</th>
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-4 uppercase">Ctc/Month</th>
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-4 uppercase">Capacity</th>
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-4 uppercase">Projects</th>
                <th className="text-left font-bold text-[11px] text-[#94a3b8] tracking-wider py-4 px-4 uppercase">Rev Share</th>
                <th className="py-4 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-10 text-slate-400 font-medium">Loading data...</td></tr>
              ) : team.map((member) => {
                const salary = member.salary || 0;
                const overhead = member.overheadPercent || 0;
                const ctc = salary > 0 ? salary + (salary * (overhead / 100)) : 0;
                totalCtcSum += ctc;

                const displayRole = getDisplayRole(member);
                const isPartner = member.role === 'admin';

                // Calculate projects and rev share
                const userProjects = projects.filter(p => p.employees && p.employees.some(e => e._id === member._id || e === member._id));
                const activeProjectsCount = userProjects.length;
                totalProjectsSum += activeProjectsCount;

                let revShare = 0;
                userProjects.forEach(p => {
                  const empCount = p.employees ? p.employees.length : 1;
                  revShare += (p.revenue || 0) / empCount;
                });
                totalRevShareSum += revShare;

                const avatarColor = 
                  isPartner ? "bg-[#e0e7ff] text-[#4f46e5]" : 
                  displayRole.includes('Operation') ? "bg-[#fce7f3] text-[#db2777]" : 
                  displayRole.includes('Social') ? "bg-[#dcfce7] text-[#166534]" : 
                  displayRole.includes('Design') ? "bg-[#fef3c7] text-[#d97706]" : 
                  "bg-[#f3e8ff] text-[#9333ea]";

                return (
                  <tr key={member._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#1e293b] font-bold text-sm">{member.name}</span>
                          <span className="text-[#94a3b8] text-[11px] font-medium">{displayRole}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 font-bold text-[#334155]">
                      {isPartner ? 'Partner' : formatINR(salary)}
                    </td>
                    
                    <td className="py-4 px-4 font-bold text-[#f59e0b]">
                      {overhead}%
                    </td>
                    
                    <td className="py-4 px-4 font-bold text-[#ef4444]">
                      {isPartner || ctc === 0 ? '—' : formatINR(ctc)}
                    </td>
                    
                    <td className="py-4 px-4 font-medium text-[#475569]">
                      {member.capacity || 0} clients
                    </td>
                    
                    <td className="py-4 px-4 font-medium text-[#3b82f6]">
                      {activeProjectsCount} active
                    </td>
                    
                    <td className="py-4 px-4 font-bold text-[#10b981]">
                      {isPartner || revShare === 0 ? '—' : formatINR(Math.round(revShare))}
                    </td>
                    
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(member)}
                          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-orange-400 hover:bg-orange-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FiEdit2 size={12} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(member)}
                          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer / Totals */}
            {!loading && (
              <tfoot className="bg-slate-50/80">
                <tr>
                  <td className="py-5 px-8 font-extrabold text-[#0f172a] text-sm uppercase">Total</td>
                  <td className="py-5 px-4 font-extrabold text-[#f59e0b] text-sm">{formatINR(totalSalary)}</td>
                  <td className="py-5 px-4"></td>
                  <td className="py-5 px-4 font-extrabold text-[#ef4444] text-sm">{formatINR(totalCtcSum)}</td>
                  <td className="py-5 px-4"></td>
                  <td className="py-5 px-4 font-extrabold text-[#3b82f6] text-sm">{totalProjectsSum}</td>
                  <td className="py-5 px-4 font-extrabold text-[#10b981] text-sm">{formatINR(Math.round(totalRevShareSum))}</td>
                  <td className="py-5 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <AddEmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEmployeeAdded={fetchData}
        employeeToEdit={employeeToEdit}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={employeeToDelete?.name}
      />

    </div>
  );
};

export default TeamStrengthTab;
