import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../../services/axiosInstance";
import toast from 'react-hot-toast';

const formatINR = (amount) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

const FinancialsTab = () => {
  const [team, setTeam] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Edit State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [editFormData, setEditFormData] = useState({
    revenue: '',
    type: 'Digital Marketing',
    status: 'Active',
    employees: []
  });
  const [updating, setUpdating] = useState(false);

  // Scenario Calculator State
  const [scenario, setScenario] = useState({
    name: '',
    revenue: '',
    employeesNeeded: '',
    type: 'Digital Marketing'
  });

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

  // --- Calculations ---
  const FIXED_OVERHEAD = 30000;
  const totalProjectsCount = projects.length;
  const fixedOverheadPerProject = totalProjectsCount > 0 ? FIXED_OVERHEAD / totalProjectsCount : 0;

  let totalTeamCTC = 0;
  const employeeStats = team.map(emp => {
    const salary = emp.salary || 0;
    const overhead = emp.overheadPercent || 0;
    const ctc = salary + (salary * overhead / 100);
    totalTeamCTC += ctc;

    const assignedProjects = projects.filter(p => p.employees && p.employees.some(e => e._id === emp._id || e === emp._id));
    const activeCount = assignedProjects.length;
    const costPerProj = activeCount > 0 ? ctc / activeCount : 0;

    return { ...emp, ctc, activeCount, costPerProj };
  });

  let sumRevenue = 0;
  let sumCost = 0;

  const projectList = projects.map(proj => {
    let projCost = fixedOverheadPerProject;
    if (proj.employees) {
      proj.employees.forEach(empId => {
        const emp = employeeStats.find(e => e._id === (empId._id || empId));
        if (emp) {
          projCost += emp.costPerProj;
        }
      });
    }

    const rev = proj.revenue || 0;
    const profit = rev - projCost;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;

    sumRevenue += rev;
    sumCost += projCost;

    return { ...proj, computedCost: projCost, computedProfit: profit, computedMargin: margin };
  }).sort((a, b) => b.computedProfit - a.computedProfit);

  const netProfit = sumRevenue - sumCost;
  const overallMargin = sumRevenue > 0 ? Math.round((netProfit / sumRevenue) * 100) : 0;

  // Scenario Calculation
  const scenRev = Number(scenario.revenue) || 0;
  const scenEmp = Number(scenario.employeesNeeded) || 0;
  // Assume avg CTC for new employee based on current team avg
  const avgCTC = team.length > 0 ? totalTeamCTC / team.length : 25000; 
  const scenCost = scenEmp * avgCTC;
  const scenProfit = scenRev - scenCost;

  // Handlers
  const handleProjectSelect = (e) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    const proj = projects.find(p => p._id === pid);
    if (proj) {
      setEditFormData({
        revenue: proj.revenue || 0,
        type: proj.type || 'Digital Marketing',
        status: proj.status || 'Active',
        employees: proj.employees ? proj.employees.map(emp => emp._id || emp) : []
      });
    } else {
      setEditFormData({ revenue: '', type: 'Digital Marketing', status: 'Active', employees: [] });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setEditFormData(prev => ({ ...prev, employees: selected }));
  };

  const handleQuickUpdate = async () => {
    if (!selectedProjectId) return;
    try {
      setUpdating(true);
      await axiosInstance.put(`/business-projects/${selectedProjectId}`, {
        revenue: Number(editFormData.revenue),
        type: editFormData.type,
        status: editFormData.status,
        employees: editFormData.employees
      });
      toast.success("Project updated successfully!");
      setSelectedProjectId('');
      setEditFormData({ revenue: '', type: 'Digital Marketing', status: 'Active', employees: [] });
      fetchData();
    } catch (err) {
      toast.error("Failed to update project");
    } finally {
      setUpdating(false);
    }
  };

  // Compute live preview for edit panel
  let previewCost = fixedOverheadPerProject;
  editFormData.employees.forEach(empId => {
    const emp = employeeStats.find(e => e._id === empId);
    if (emp) {
      previewCost += emp.costPerProj;
    }
  });
  const previewRev = Number(editFormData.revenue) || 0;
  const previewProfit = previewRev - previewCost;
  const previewMargin = previewRev > 0 ? Math.round((previewProfit / previewRev) * 100) : 0;


  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-bold">Loading financials...</div>;
  }

  return (
    <div className="animate-fadeIn space-y-6 pb-10">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl p-6 border-t-4 border-[#34d399] shadow-sm">
          <h4 className="text-[#94a3b8] text-[11px] font-extrabold uppercase tracking-wider mb-2">Gross Revenue</h4>
          <h2 className="text-[#0f172a] text-3xl font-black">{formatINR(sumRevenue)}</h2>
          <p className="text-[#64748b] text-[11px] mt-1">All active projects</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-6 border-t-4 border-[#ef4444] shadow-sm">
          <h4 className="text-[#94a3b8] text-[11px] font-extrabold uppercase tracking-wider mb-2">Total Expenses</h4>
          <h2 className="text-[#0f172a] text-3xl font-black">{formatINR(sumCost)}</h2>
          <p className="text-[#64748b] text-[11px] mt-1">CTC + Overhead</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl p-6 border-t-4 border-[#8b5cf6] shadow-sm">
          <h4 className="text-[#94a3b8] text-[11px] font-extrabold uppercase tracking-wider mb-2">Net Profit</h4>
          <h2 className="text-[#10b981] text-3xl font-black">{formatINR(netProfit)}</h2>
          <p className="text-[#64748b] text-[11px] mt-1 flex items-center gap-1">
            Margin: {overallMargin}% 
            {overallMargin >= 20 ? '🟢' : overallMargin >= 10 ? '🟡' : '🔴'}
          </p>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Project-wise Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-[#1e293b] font-bold text-sm">Project-wise Revenue & Cost</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-[#94a3b8] text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-6 text-left font-bold">Project</th>
                  <th className="py-3 px-6 text-right font-bold">Revenue</th>
                  <th className="py-3 px-6 text-right font-bold">Cost</th>
                  <th className="py-3 px-6 text-right font-bold">Profit</th>
                  <th className="py-3 px-6 text-right font-bold">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projectList.map(proj => (
                  <tr key={proj._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1e293b] text-[13px]">{proj.name}</span>
                        <span className="text-[#94a3b8] text-[10px]">{proj.type} - {proj.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-[#10b981]">{formatINR(proj.revenue)}</td>
                    <td className="py-3 px-6 text-right font-bold text-[#ef4444]">{formatINR(proj.computedCost)}</td>
                    <td className={`py-3 px-6 text-right font-bold ${proj.computedProfit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {formatINR(proj.computedProfit)}
                    </td>
                    <td className={`py-3 px-6 text-right font-bold text-[12px] ${proj.computedMargin >= 20 ? 'text-[#10b981]' : proj.computedMargin > 0 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                      {Math.round(proj.computedMargin)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80">
                <tr>
                  <td className="py-4 px-6 font-extrabold text-[#0f172a] text-[12px] uppercase">TOTAL</td>
                  <td className="py-4 px-6 text-right font-extrabold text-[#10b981]">{formatINR(sumRevenue)}</td>
                  <td className="py-4 px-6 text-right font-extrabold text-[#ef4444]">{formatINR(sumCost)}</td>
                  <td className="py-4 px-6 text-right font-extrabold text-[#10b981]">{formatINR(netProfit)}</td>
                  <td className="py-4 px-6 text-right font-extrabold text-[#10b981]">{overallMargin}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Quick Edit Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 h-fit">
          <h3 className="text-[#1e293b] font-bold text-sm mb-6">Add / Edit Project Value</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold mb-1.5">Select Project</label>
              <select 
                value={selectedProjectId}
                onChange={handleProjectSelect}
                className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1em_1em] pr-10"
              >
                <option value="">Choose project...</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProjectId && (
              <div className="animate-fadeIn space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#64748b] text-[11px] font-bold mb-1.5">Monthly Value (₹)</label>
                    <input 
                      type="number"
                      name="revenue"
                      value={editFormData.revenue}
                      onChange={handleEditChange}
                      className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748b] text-[11px] font-bold mb-1.5">Project Type</label>
                    <select 
                      name="type"
                      value={editFormData.type}
                      onChange={handleEditChange}
                      className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1em_1em] pr-10"
                    >
                      <option>Digital Marketing</option>
                      <option>Website</option>
                      <option>SEO</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#64748b] text-[11px] font-bold mb-1.5">Assigned Employees</label>
                    <select
                      multiple
                      value={editFormData.employees}
                      onChange={handleEmployeeSelect}
                      className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-xs h-[100px] custom-scrollbar"
                    >
                      {team.map(emp => {
                        let roleText = emp.role;
                        if (emp.role === 'admin') roleText = 'Managing Partner';
                        else if (emp.role === 'operationmanager') roleText = 'Operations Manager';
                        else if (emp.department) roleText = emp.department.replace(' Team', '') + ' Manager';
                        return (
                          <option key={emp._id} value={emp._id} className="py-1">{emp.name} — {roleText}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#64748b] text-[11px] font-bold mb-1.5">Status</label>
                    <select 
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditChange}
                      className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1em_1em] pr-10"
                    >
                      <option>Active</option>
                      <option>Completed</option>
                      <option>On Hold</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#fafafa] border border-slate-100 rounded-xl p-4 mt-2">
                  <p className="text-[#94a3b8] text-[11px] font-bold mb-3">Calculated for this project:</p>
                  <div className="flex justify-between px-2">
                    <div className="text-center">
                      <p className="text-[#94a3b8] text-[10px] font-bold mb-0.5">Cost</p>
                      <p className="text-[#ef4444] font-black text-lg">{formatINR(previewCost)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#94a3b8] text-[10px] font-bold mb-0.5">Profit</p>
                      <p className={`font-black text-lg ${previewProfit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {formatINR(previewProfit)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#94a3b8] text-[10px] font-bold mb-0.5">Margin</p>
                      <p className={`font-black text-lg ${previewMargin >= 20 ? 'text-[#10b981]' : previewMargin > 0 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                        {previewMargin}%
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleQuickUpdate}
                  disabled={updating}
                  className="w-full mt-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save & Recalculate'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Profit Scenario Calculator */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[#1e293b] font-bold text-sm flex items-center gap-2">
            <span>📊</span> Profit Scenario Calculator
          </h3>
          <span className="text-[#94a3b8] text-[11px] font-medium hidden sm:block">Add a hypothetical project to see impact on profit</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-[#64748b] text-[10px] font-bold mb-1.5">Project Name</label>
            <input 
              type="text" 
              placeholder="New client name"
              value={scenario.name}
              onChange={e => setScenario(s => ({...s, name: e.target.value}))}
              className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[#64748b] text-[10px] font-bold mb-1.5">Monthly Value (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 30000"
              value={scenario.revenue}
              onChange={e => setScenario(s => ({...s, revenue: e.target.value}))}
              className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[#64748b] text-[10px] font-bold mb-1.5">Employees Needed</label>
            <input 
              type="number" 
              placeholder="e.g. 2"
              value={scenario.employeesNeeded}
              onChange={e => setScenario(s => ({...s, employeesNeeded: e.target.value}))}
              className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[#64748b] text-[10px] font-bold mb-1.5">Project Type</label>
            <select 
              value={scenario.type}
              onChange={e => setScenario(s => ({...s, type: e.target.value}))}
              className="w-full bg-[#f8fafc] border border-slate-200 text-[#1e293b] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1em_1em] pr-10"
            >
              <option>Digital Marketing</option>
              <option>Website</option>
              <option>SEO</option>
            </select>
          </div>
        </div>

        {/* Calculator Output */}
        {scenRev > 0 && scenEmp > 0 && (
          <div className="mt-8 animate-fadeIn space-y-6">
            
            {/* Project Specific Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#fafafa] border border-[#f1f3f9] rounded-2xl py-6 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-2">Project Revenue</span>
                <span className="text-[#10b981] text-2xl font-black">{formatINR(scenRev)}</span>
              </div>
              <div className="bg-[#fafafa] border border-[#f1f3f9] rounded-2xl py-6 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-2">Est. Project Cost</span>
                <span className="text-[#ef4444] text-2xl font-black">{formatINR(scenCost)}</span>
              </div>
              <div className="bg-[#fafafa] border border-[#f1f3f9] rounded-2xl py-6 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-2">Project Margin</span>
                <span className={`text-2xl font-black ${scenProfit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {scenRev > 0 ? Math.round((scenProfit / scenRev) * 100) : 0}%
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Company Impact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
              <div>
                <span className="text-[#94a3b8] text-[11px] font-bold mb-1 block">Company profit BEFORE</span>
                <span className="text-[#10b981] text-xl font-bold">{formatINR(netProfit)}</span>
              </div>
              <div>
                <span className="text-[#94a3b8] text-[11px] font-bold mb-1 block">Company profit AFTER</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${netProfit + scenProfit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {formatINR(netProfit + scenProfit)}
                  </span>
                  <span className="text-[#10b981] text-sm font-bold">
                    ({sumRevenue + scenRev > 0 ? Math.round(((netProfit + scenProfit) / (sumRevenue + scenRev)) * 100) : 0}% margin)
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Message */}
            <div className="px-4 mt-2">
              {scenProfit < 0 ? (
                <p className="text-[#ef4444] text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                  Unprofitable at this rate — either price higher or reduce resources.
                </p>
              ) : (scenRev > 0 && Math.round((scenProfit / scenRev) * 100) < 20) ? (
                <p className="text-[#f59e0b] text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  Low margin project — proceed with caution or optimize resources.
                </p>
              ) : (
                <p className="text-[#10b981] text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  Highly profitable scenario — excellent margin!
                </p>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default FinancialsTab;
