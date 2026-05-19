import React from "react";
import { FiPlus, FiUsers, FiSearch, FiFilter } from "react-icons/fi";

const DEPARTMENTS = [
  "Social Media Team", "Website Team", "Designer Team",
  "Editor Team", "Scriptwriter Team", "Cameraman Team", "SEO Team",
];

const UserHeader = ({ setOpenModal, searchTerm, setSearchTerm, filterDept, setFilterDept }) => (
  <div className="flex flex-col gap-3 mb-5">
    {/* TOP ROW */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-r
                          from-cyan-500
                          to-blue-600 flex items-center justify-center">
            <FiUsers size={14} className="text-white" />
          </div>
          <h1 className="text-lg  font-bold text-slate-800">User Management</h1>
        </div>
       
      </div>

      <button
        onClick={() => setOpenModal(true)}
        className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r
                          from-cyan-500
                          to-blue-600 text-white font-semibold text-sm shadow-sm shadow-cyan-200 transition-all active:scale-95"
      >
        <FiPlus size={16} /> Add User
      </button>
    </div>

    {/* FILTER ROW */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      {/* SEARCH */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1">
        <FiSearch size={13} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none text-xs text-gray-700 placeholder:text-gray-400 w-full"
        />
      </div>

      {/* DEPT FILTER */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 sm:w-52">
        <FiFilter size={12} className="text-gray-400 shrink-0" />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-transparent outline-none text-xs text-gray-700 w-full cursor-pointer"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
  </div>
);

export default UserHeader;