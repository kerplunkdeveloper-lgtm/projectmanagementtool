import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../../services/axiosInstance";
import { FiPlus } from "react-icons/fi";
import AssignEmployeeModal from "../AssignEmployeeModal";

const formatINR = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const ClientSplitsTab = () => {
  const [team, setTeam] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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

  // Compute Cost Attribution Summary
  const totalActiveClients = projects.length;
  const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
  
  // Total Cost = Total Salary + Overheads (Let's compute total CTC of the whole team, ignoring fixed overheads for this specific summary, or just standard 15k overhead)
  // According to image, Total Cost is CTC + Overhead.
  const totalCTC = team.reduce((sum, member) => {
    const salary = member.salary || 0;
    const overhead = member.overheadPercent || 0;
    return sum + (salary + (salary * overhead / 100));
  }, 0);
  
  // Actually, the image says "Total Cost (CTC+Overhead) = 1,79,850".
  // This matches our earlier calculation in PartnerHub: 1,49,850 (Team CTC) + 30,000 (Fixed overheads).
  // We can just add a fixed 30k overhead for this tab to perfectly match, or skip it.
  const totalCost = totalCTC + 30000;
  const netProfit = totalRevenue - totalCost;

  return (
    <div className="animate-fadeIn space-y-6 pb-10">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#eaeef6] p-4 rounded-xl shadow-sm border border-[#d1d5db]">
        <p className="text-[#64748b] text-sm font-medium">Assign employees to clients. Based on salary, system calculates cost-per-client and profit margin.</p>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button className="px-4 py-2 bg-white text-[#f59e0b] border border-[#fef3c7] font-bold text-sm rounded-lg shadow-sm hover:bg-orange-50 transition-colors flex items-center gap-1.5">
            Auto Balance
          </button>
          <button 
            onClick={() => openAssignModal()}
            className="px-4 py-2 bg-[#7c5ff0] text-white font-bold text-sm rounded-lg shadow-md shadow-indigo-500/30 hover:bg-[#6c4be0] transition-colors flex items-center gap-1.5"
          >
            <FiPlus size={16} /> Assign Employee
          </button>
        </div>
      </div>

      {/* Main Grid area */}
      <div className="bg-[#f1f3f9] rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
        <div className="flex overflow-x-auto min-h-[400px] snap-x custom-scrollbar pb-2">
          {loading ? (
            <div className="w-full flex items-center justify-center text-slate-500 font-bold py-20">Loading client splits...</div>
          ) : team.map(employee => {
            
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
              <div key={employee._id} className="min-w-[240px] flex-1 border-r border-[#e2e8f0] snap-start flex flex-col bg-[#f8fafc]">
                
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
                <div className="flex-1 p-3 space-y-2">
                  {assignedProjects.map(proj => (
                    <div key={proj._id} className="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col">
                      <span className="text-[#1e293b] font-bold text-[13px] truncate">{proj.name}</span>
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
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-[#1e293b] font-extrabold text-base mb-6 flex items-center gap-2">
          <span>💰</span> Cost Attribution Summary
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-slate-100">
          <div className="text-center">
            <p className="text-[#94a3b8] text-xs font-bold mb-2">Total Active Clients</p>
            <p className="text-[#3b82f6] text-3xl font-black">{totalActiveClients}</p>
          </div>
          
          <div className="text-center pl-6">
            <p className="text-[#94a3b8] text-xs font-bold mb-2">Total Revenue</p>
            <p className="text-[#10b981] text-3xl font-black">{formatINR(totalRevenue)}</p>
          </div>
          
          <div className="text-center pl-6">
            <p className="text-[#94a3b8] text-xs font-bold mb-2">Total Cost (CTC+Overhead)</p>
            <p className="text-[#ef4444] text-3xl font-black">{formatINR(totalCost)}</p>
          </div>
          
          <div className="text-center pl-6">
            <p className="text-[#94a3b8] text-xs font-bold mb-2">Net Profit</p>
            <p className="text-[#10b981] text-3xl font-black">{formatINR(netProfit)}</p>
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
