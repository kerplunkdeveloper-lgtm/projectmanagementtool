import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../services/axiosInstance';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AssignEmployeeModal = ({ isOpen, onClose, onAssigned, initialEmployee }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    clientId: '',
    roleOnAccount: 'Account Manager',
    timeAllocation: ''
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialEmployee && users.length > 0) {
      setFormData(prev => ({ ...prev, employeeId: initialEmployee._id }));
    }
  }, [initialEmployee, users]);

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get('/business-projects')
      ]);
      setUsers(usersRes.data.data || usersRes.data || []);
      setProjects(projectsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const payload = {
        employeeId: formData.employeeId,
        // The backend currently only needs employeeId since timeAllocation isn't mapped in Schema yet,
        // but we pass them anyway in case the backend gets updated to support it.
        roleOnAccount: formData.roleOnAccount,
        timeAllocation: Number(formData.timeAllocation) || 0
      };

      await axiosInstance.post(`/business-projects/${formData.clientId}/assign`, payload);
      toast.success("Employee assigned successfully!");
      
      onAssigned();
      onClose();
      // Reset form (except employeeId if initialEmployee is passed)
      setFormData({
        employeeId: initialEmployee ? initialEmployee._id : '',
        clientId: '',
        roleOnAccount: 'Account Manager',
        timeAllocation: ''
      });
    } catch (err) {
      console.error('Error assigning employee:', err.response?.data || err);
      toast.error('Failed to assign employee: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getDisplayRole = (user) => {
    if (user.role === 'admin') return "Managing Partner";
    if (user.role === 'operationmanager') return "Operations Manager";
    if (user.department) return user.department.replace(' Team', '') + ' Manager';
    return user.role;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#cbd0e1] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-in-center">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#cbd0e1] border-b border-[#a7adcb]">
          <h2 className="text-[#1a2035] text-xl font-extrabold flex items-center gap-2">
            <span className="text-2xl">🔗</span> Assign Employee to Client
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#cbd0e1] flex-1 space-y-5">
          
          <div>
            <label className="block text-[#475569] text-sm font-bold mb-1.5">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
            >
              <option value="">Select Employee...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} — {getDisplayRole(u)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#475569] text-sm font-bold mb-1.5">
              Client <span className="text-rose-500">*</span>
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
            >
              <option value="">Select Client...</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#475569] text-sm font-bold mb-1.5">
              Role on this Account
            </label>
            <select
              name="roleOnAccount"
              value={formData.roleOnAccount}
              onChange={handleChange}
              className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
            >
              <option value="Account Manager">Account Manager</option>
              <option value="Designer">Designer</option>
              <option value="Developer">Developer</option>
              <option value="SEO Expert">SEO Expert</option>
              <option value="Video Editor">Video Editor</option>
              <option value="Content Writer">Content Writer</option>
            </select>
          </div>

          <div>
            <label className="block text-[#475569] text-sm font-bold mb-1.5">
              Time Allocation % <span className="text-[#64748b] text-[10px] font-medium">(% of this employee's time on this client)</span>
            </label>
            <input
              type="number"
              name="timeAllocation"
              value={formData.timeAllocation}
              onChange={handleChange}
              placeholder="e.g. 25"
              className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-[#cbd0e1] border-t border-[#a7adcb]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#f1f3f9] text-[#475569] font-bold hover:bg-white transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.employeeId || !formData.clientId || loading}
            className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white font-bold hover:bg-[#6c4be0] disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/30"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default AssignEmployeeModal;
