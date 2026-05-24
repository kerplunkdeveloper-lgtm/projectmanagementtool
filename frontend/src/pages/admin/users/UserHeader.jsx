import React from "react";
import { FiPlus, FiUsers, FiSearch, FiFilter } from "react-icons/fi";

const DEPARTMENTS = [
  "Social Media Team", "Website Team", "Designer Team",
  "Editor Team", "Scriptwriter Team", "Cameraman Team", "SEO Team",
];

const UserHeader = ({ setOpenModal, searchTerm, setSearchTerm, filterDept, setFilterDept, isReadOnly }) => (
  <div className="flex flex-col gap-3 mb-5">
    {/* TOP ROW */}
    <div className="flex justify-between items-center gap-3">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-r
                          from-cyan-500
                          to-blue-600 flex items-center justify-center">
            <FiUsers size={14} className="text-white" />
          </div>
          <h1 className="text-sm md:text-lg font-bold text-slate-800 dark:text-yellow-50">User Management</h1>
        </div>
      </div>

      {!isReadOnly && (
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-sm shadow-cyan-200 transition-all active:scale-95 shrink-0"
        >
          <FiPlus size={14} /> Add User
        </button>
      )}
    </div>

    {/* FILTER ROW */}
    <div className="flex flex-row items-center gap-2">
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
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-[140px] sm:w-52 shrink-0">
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