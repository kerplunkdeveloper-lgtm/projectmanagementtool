import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../../services/axiosInstance";
import { FiEdit2, FiPlus, FiTrash2, FiUsers, FiDollarSign, FiPercent, FiTrendingUp } from "react-icons/fi";
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

  const totalTeamStrength = team.length;
  const totalSalary = team.reduce((sum, member) => sum + (member.salary || 0), 0);
  const avgSalary = totalTeamStrength > 0 ? Math.round(totalSalary / totalTeamStrength) : 0;
  
  const totalRevenue = projects.reduce((sum, proj) => sum + (proj.revenue || 0), 0);
  const revenuePerEmployee = totalTeamStrength > 0 ? Math.round(totalRevenue / totalTeamStrength) : 0;

  let totalCtcSum = 0;
  let totalProjectsSum = 0;
  let totalRevShareSum = 0;

  return (
    <div className="animate-fadeIn space-y-4">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Team Strength</h4>
            <FiUsers size={12} className="text-blue-500" />
          </div>
          <h2 className="text-[#0f172a] text-xl font-extrabold">{totalTeamStrength}</h2>
          <p className="text-[#64748b] text-[10px] mt-0.5">Active employees</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Salary Bill</h4>
            <FiDollarSign size={12} className="text-emerald-500" />
          </div>
          <h2 className="text-[#0f172a] text-xl font-extrabold">{formatINR(totalSalary)}</h2>
          <p className="text-[#64748b] text-[10px] mt-0.5">Per month</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Avg Salary</h4>
            <FiPercent size={12} className="text-amber-500" />
          </div>
          <h2 className="text-[#0f172a] text-xl font-extrabold">{formatINR(avgSalary)}</h2>
          <p className="text-[#64748b] text-[10px] mt-0.5">Per employee</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500" />
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Revenue Share</h4>
            <FiTrendingUp size={12} className="text-purple-500" />
          </div>
          <h2 className="text-[#0f172a] text-xl font-extrabold">{formatINR(revenuePerEmployee)}</h2>
          <p className="text-[#64748b] text-[10px] mt-0.5">Per employee</p>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-2 border-b border-slate-100">
          <div>
            <h3 className="text-slate-800 font-bold text-sm">Employee Allocations</h3>
            <p className="text-[10px] text-gray-400">Monthly salaries, overheads & rev-shares</p>
          </div>
          <button 
            onClick={openAddModal}
            className="w-full sm:w-auto bg-[#7c5ff0] hover:bg-[#6c4be0] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
          >
            <FiPlus size={14} /> Add Employee
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-4 uppercase">Employee</th>
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-3 uppercase">Salary</th>
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-3 uppercase">Overhead%</th>
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-3 uppercase">Ctc/Month</th>
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-3 uppercase">Capacity</th>
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-3 uppercase">Projects</th>
                <th className="text-left font-bold text-[9px] text-slate-400 tracking-wider py-2 px-3 uppercase">Rev Share</th>
                <th className="py-2 px-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400 font-medium">Loading data...</td></tr>
              ) : team.map((member) => {
                const salary = member.salary || 0;
                const overhead = member.overheadPercent || 0;
                const ctc = salary > 0 ? salary + (salary * (overhead / 100)) : 0;
                totalCtcSum += ctc;

                const displayRole = getDisplayRole(member);
                const isPartner = member.role === 'admin';

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
                  isPartner ? "bg-indigo-50 text-indigo-600" : 
                  displayRole.includes('Operation') ? "bg-pink-50 text-pink-600" : 
                  displayRole.includes('Social') ? "bg-emerald-50 text-emerald-600" : 
                  displayRole.includes('Design') ? "bg-amber-50 text-amber-600" : 
                  "bg-purple-50 text-purple-600";

                return (
                  <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-slate-800 font-bold text-xs truncate max-w-[140px]">{member.name}</span>
                          <span className="text-gray-400 text-[10px] truncate max-w-[140px]">{displayRole}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-2.5 px-3 font-bold text-slate-700">
                      {isPartner ? 'Partner' : formatINR(salary)}
                    </td>
                    
                    <td className="py-2.5 px-3 font-bold text-amber-600">
                      {overhead}%
                    </td>
                    
                    <td className="py-2.5 px-3 font-bold text-rose-600">
                      {isPartner || ctc === 0 ? '—' : formatINR(ctc)}
                    </td>
                    
                    <td className="py-2.5 px-3 font-semibold text-slate-500">
                      {member.capacity || 0} clients
                    </td>
                    
                    <td className="py-2.5 px-3 font-semibold text-blue-500">
                      {activeProjectsCount} active
                    </td>
                    
                    <td className="py-2.5 px-3 font-bold text-emerald-600">
                      {isPartner || revShare === 0 ? '—' : formatINR(Math.round(revShare))}
                    </td>
                    
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button 
                          onClick={() => openEditModal(member)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-amber-500 bg-amber-50/20 hover:bg-amber-50 hover:border-amber-200 transition-all"
                        >
                          <FiEdit2 size={11} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(member)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-rose-500 bg-rose-50/20 hover:bg-rose-50 hover:border-rose-200 transition-all"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer / Totals */}
            {!loading && (
              <tfoot className="bg-slate-50/50">
                <tr className="font-extrabold text-slate-800 text-xs border-t border-slate-100">
                  <td className="py-3 px-4 uppercase tracking-wider">Total</td>
                  <td className="py-3 px-3 text-amber-600">{formatINR(totalSalary)}</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-rose-600">{formatINR(totalCtcSum)}</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-blue-600">{totalProjectsSum}</td>
                  <td className="py-3 px-3 text-emerald-600">{formatINR(Math.round(totalRevShareSum))}</td>
                  <td className="py-3 px-3"></td>
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
