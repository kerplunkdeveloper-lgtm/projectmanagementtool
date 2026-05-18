import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../services/axiosInstance';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AddEmployeeModal = ({ isOpen, onClose, onEmployeeAdded, employeeToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    roleText: '', // for "Role / Designation" UI
    salary: '',
    overheadPercent: '',
    department: 'Social Media Team',
    capacity: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        
        let roleText = 'Team Member';
        if (employeeToEdit.role === 'admin') roleText = 'Managing Partner';
        else if (employeeToEdit.role === 'operationmanager') roleText = 'Operations Manager';
        else if (employeeToEdit.department) roleText = employeeToEdit.department.replace(' Team', '') + ' Manager';

        setFormData({
          name: employeeToEdit.name || '',
          roleText: roleText,
          salary: employeeToEdit.salary || '',
          overheadPercent: employeeToEdit.overheadPercent || '',
          department: employeeToEdit.department || 'Social Media Team',
          capacity: employeeToEdit.capacity || ''
        });
      } else {
        setFormData({
          name: '',
          roleText: '',
          salary: '',
          overheadPercent: '',
          department: 'Social Media Team',
          capacity: ''
        });
      }
    }
  }, [isOpen, employeeToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Parse fields
      const salary = Number(formData.salary) || 0;
      const overheadPercent = Number(formData.overheadPercent) || 0;
      const capacity = Number(formData.capacity) || 0;

      // Determine backend role
      let backendRole = 'team';
      let backendDepartment = formData.department;
      
      const rt = formData.roleText.toLowerCase();
      if (rt.includes('partner') || rt.includes('admin')) {
        backendRole = 'admin';
        backendDepartment = undefined;
      } else if (rt.includes('operation') || rt.includes('manager')) {
        if (rt.includes('operation')) {
           backendRole = 'operationmanager';
           backendDepartment = undefined;
        }
      }

      const payload = {
        name: formData.name,
        role: backendRole,
        department: backendDepartment,
        salary,
        overheadPercent,
        capacity,
      };

      if (employeeToEdit) {
        await axiosInstance.put(`/users/${employeeToEdit._id}`, payload);
        toast.success("Employee updated successfully!");
      } else {
        // Mock email and password for new HR creation
        const email = formData.name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000) + '@v-square.com';
        payload.email = email;
        payload.password = "Password123!";
        
        await axiosInstance.post('/users', payload);
        toast.success("Employee added successfully!");
      }

      onEmployeeAdded();
      onClose();
    } catch (err) {
      console.error('Error saving employee:', err.response?.data || err);
      toast.error('Failed to save employee: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const departments = [
    "Social Media Team",
    "Website Team",
    "Designer Team",
    "Editor Team",
    "Scriptwriter Team",
    "Cameraman Team",
    "SEO Team"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#cbd0e1] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-in-center">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#cbd0e1] border-b border-[#a7adcb]">
          <h2 className="text-[#1a2035] text-xl font-extrabold flex items-center gap-2">
            <span className="text-2xl">👤</span> {employeeToEdit ? 'Edit Employee' : 'Add / Edit Employee'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#cbd0e1] flex-1 overflow-y-auto space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#475569] text-sm font-bold mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Lakshmi"
                className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[#475569] text-sm font-bold mb-1.5">
                Role / Designation
              </label>
              <input
                type="text"
                name="roleText"
                value={formData.roleText}
                onChange={handleChange}
                placeholder="e.g. Operations Manager"
                className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#475569] text-sm font-bold mb-1.5">
                Monthly Salary (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g. 25000"
                className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[#475569] text-sm font-bold mb-1.5">
                Company Overhead % <span className="text-[#64748b] text-[10px] font-medium">(PF, ESI, etc.)</span>
              </label>
              <input
                type="number"
                name="overheadPercent"
                value={formData.overheadPercent}
                onChange={handleChange}
                placeholder="15"
                className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#475569] text-sm font-bold mb-1.5">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d.replace(' Team', '')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#475569] text-sm font-bold mb-1.5">
              Max Clients (Capacity)
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="5"
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
            disabled={!formData.name || loading}
            className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white font-bold hover:bg-[#6c4be0] disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/30"
          >
            {loading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default AddEmployeeModal;
