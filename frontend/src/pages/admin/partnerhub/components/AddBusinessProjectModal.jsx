import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../services/axiosInstance';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AddBusinessProjectModal = ({ isOpen, onClose, onProjectAdded, projectToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Digital Marketing',
    status: 'Active',
    revenue: '',
    duration: 'Ongoing / Retainer',
    employees: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (projectToEdit) {
        setFormData({
          name: projectToEdit.name || '',
          type: projectToEdit.type || 'Digital Marketing',
          status: projectToEdit.status || 'Active',
          revenue: projectToEdit.revenue || '',
          duration: projectToEdit.duration || 'Ongoing / Retainer',
          employees: projectToEdit.employees ? projectToEdit.employees.map(e => e._id || e) : []
        });
      } else {
        setFormData({
          name: '',
          type: 'Digital Marketing',
          status: 'Active',
          revenue: '',
          duration: 'Ongoing / Retainer',
          employees: []
        });
      }
    }
  }, [isOpen, projectToEdit]);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      // The API response depends on userController. Usually it's res.data.data
      const userList = res.data.data || res.data;
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSelection = (e) => {
    const options = e.target.options;
    const selectedEmployees = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedEmployees.push(options[i].value);
      }
    }
    setFormData((prev) => ({ ...prev, employees: selectedEmployees }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const dataToSubmit = {
        ...formData,
        revenue: Number(formData.revenue) || 0
      };

      if (projectToEdit) {
        await axiosInstance.put(`/business-projects/${projectToEdit._id}`, dataToSubmit);
        toast.success("Project updated successfully!");
      } else {
        await axiosInstance.post('/business-projects', dataToSubmit);
        toast.success("Project added successfully!");
      }

      onProjectAdded();
      onClose();
    } catch (err) {
      console.error('Error saving project:', err.response?.data || err);
      toast.error('Failed to save project: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-[#e4e6f2] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#e4e6f2] border-b border-[#cbd0e1]">
          <h2 className="text-[#1a2035] text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📁</span> {projectToEdit ? 'Edit' : 'Add'} Business Project
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-500 hover:text-slate-700 shadow-sm transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#cbd0e1]/30 flex-1 overflow-y-auto space-y-5">
          
          <div>
            <label className="block text-[#475569] text-sm font-semibold mb-1.5">
              Project / Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. V Square Website Redesign"
              className="w-full bg-[#f1f3f9] border-0 text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#475569] text-sm font-semibold mb-1.5">
                Project Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-[#f1f3f9] border-0 text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
              >
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Website">Website</option>
                <option value="SEO">SEO</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#475569] text-sm font-semibold mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#f1f3f9] border-0 text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#475569] text-sm font-semibold mb-1.5">
                Monthly Value (₹)
              </label>
              <input
                type="number"
                name="revenue"
                value={formData.revenue}
                onChange={handleChange}
                placeholder="e.g. 25000"
                className="w-full bg-[#f1f3f9] border-0 text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-[#475569] text-sm font-semibold mb-1.5">
                Project Duration
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full bg-[#f1f3f9] border-0 text-[#1e293b] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10"
              >
                <option value="Ongoing / Retainer">Ongoing / Retainer</option>
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#475569] text-sm font-semibold mb-1.5">
              Assign Employees
            </label>
            <select
              multiple
              name="employees"
              value={formData.employees}
              onChange={handleEmployeeSelection}
              className="w-full bg-[#e3e8f8] border-2 border-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 h-32 text-[#334155] font-medium custom-scrollbar"
            >
              {users.map(user => {
                let displayRole = "";
                if (user.role === 'admin') {
                  displayRole = "Managing Partner";
                } else if (user.role === 'operationmanager') {
                  displayRole = "Operations Manager";
                } else if (user.department) {
                  displayRole = user.department.replace(' Team', '');
                  if (displayRole.includes('Social Media')) displayRole = 'Social Media Manager';
                  else if (displayRole.includes('Designer')) displayRole = 'Designer';
                  else if (displayRole.includes('SEO')) displayRole = 'SEO Analyst';
                } else {
                  displayRole = user.role;
                }

                return (
                  <option key={user._id} value={user._id} className="py-1">
                    {user.name} {displayRole ? `— ${displayRole}` : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-[#64748b] text-xs mt-1.5 font-medium">Hold Ctrl/Cmd to select multiple</p>
          </div>

          {/* Profit Preview */}
          {Number(formData.revenue) > 0 && (
            <div className="bg-[#e4e6f2] rounded-xl p-4 border border-[#cbd0e1] flex items-center justify-between">
              <span className="text-[#1a2035] font-bold text-sm min-w-[100px]">Profit Preview</span>
              
              <div className="flex-1 flex items-center justify-around">
                <div className="text-center">
                  <p className="text-[#64748b] text-[10px] font-bold mb-0.5">Est. Cost</p>
                  <p className="text-[#dc2626] font-bold text-sm">
                    ₹{Math.round(Number(formData.revenue) * 0.30173).toLocaleString('en-IN')}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-[#64748b] text-[10px] font-bold mb-0.5">Profit</p>
                  <p className="text-[#059669] font-bold text-sm">
                    ₹{(Number(formData.revenue) - Math.round(Number(formData.revenue) * 0.30173)).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[#64748b] text-[10px] font-bold mb-0.5">Margin</p>
                  <p className="text-[#059669] font-bold text-sm">
                    {Math.round(((Number(formData.revenue) - Math.round(Number(formData.revenue) * 0.30173)) / Number(formData.revenue)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-[#cbd0e1]/50 border-t border-[#cbd0e1]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#f1f3f9] text-[#475569] font-bold hover:bg-white transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.type || loading}
            className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white font-bold hover:bg-[#6c4be0] disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/30"
          >
            {loading ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Add Project'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default AddBusinessProjectModal;
