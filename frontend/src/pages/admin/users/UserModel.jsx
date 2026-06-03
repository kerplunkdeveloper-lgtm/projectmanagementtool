import React, { useEffect, useState } from "react";
import { FiX, FiUsers } from "react-icons/fi";

const DEPARTMENTS = [
  "Social Media Team", "Website Team", "Designer Team",
  "Editor Team", "Scriptwriter Team", "Cameraman Team", "SEO Team",
];

const UserModal = ({ openModal, setOpenModal, handleCreateUser, handleUpdateUser, editUser, setEditUser }) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "team", department: "" });

  useEffect(() => {
    setFormData(editUser
      ? { name: editUser.name || "", email: editUser.email || "", password: "", role: editUser.role || "team", department: editUser.department || "" }
      : { name: "", email: "", password: "", role: "team", department: "" }
    );
  }, [editUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value, ...(name === "role" && value !== "team" ? { department: "" } : {}) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editUser ? handleUpdateUser(formData) : handleCreateUser(formData);
  };

  const handleClose = () => {
    setOpenModal(false); setEditUser(null);
    setFormData({ name: "", email: "", password: "", role: "team", department: "" });
  };

  if (!openModal) return null;

  const INPUT = "w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm text-slate-700";
  const LABEL = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg dashboard-btn-primary flex items-center justify-center">
              <FiUsers size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-yellow-50">
              {editUser ? "Update User" : "Add New User"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className={LABEL}>Full Name <span className="normal-case text-red-600">*</span></label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Enter user name" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Email <span className="normal-case text-red-600">*</span></label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Enter user email id" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Password <span className="normal-case text-red-600">*</span> {editUser && <span className="normal-case text-gray-400">(leave blank to keep)</span>}</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter user password" className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Role <span className="normal-case text-red-600">*</span></label>
              <select name="role" value={formData.role} onChange={handleChange} className={INPUT + " cursor-pointer"}>
                <option value="team">Team</option>
                <option value="admin">Admin</option>
                <option value="operationmanager">Op. Manager</option>
              </select>
            </div>

            {formData.role === "team" && (
              <div>
                <label className={LABEL}>Department <span className="normal-case text-red-600">*</span></label>
                <select name="department" value={formData.department} onChange={handleChange} required className={INPUT + " cursor-pointer"}>
                  <option value="">Select...</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl dashboard-btn-primary text-white font-bold text-xs shadow-sm  transition-all active:scale-95">
              {editUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;