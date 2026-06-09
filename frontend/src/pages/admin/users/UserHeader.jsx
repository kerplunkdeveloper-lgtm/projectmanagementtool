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
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/20 flex items-center justify-center">
            <FiUsers size={14} className="text-blue-600 dark:text-[#e5ff00]" />
          </div>
          <h1 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white">User Management</h1>
        </div>
      </div>

      {!isReadOnly && (
        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 dark:bg-[#e5ff00] text-white dark:text-black px-5 py-3 rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 dark:shadow-[#e5ff00]/20  dark:hover:bg-[#ccff00] hover:-translate-y-0.5 hover:shadow-lg text-xs font-bold active:scale-95 transition-all cursor-pointer"
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