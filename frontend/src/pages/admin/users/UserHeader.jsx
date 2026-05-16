import React from "react";
import { FiPlus, FiUsers, FiSearch, FiFilter } from "react-icons/fi";

const UserHeader = ({
  setOpenModal,
  searchTerm,
  setSearchTerm,
  filterDept,
  setFilterDept,
}) => {
  const departments = [
    "Social Media Team",
    "Website Team",
    "Designer Team",
    "Editor Team",
    "Scriptwriter Team",
    "Cameraman Team",
    "SEO Team",
  ];

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* TOP ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex text-black items-center gap-3">
            <FiUsers className="text-cyan-400" />
            User Management
          </h1>
          <p className="text-gray-500 mt-2">Manage and monitor all users</p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 active:scale-95"
        >
          <FiPlus size={20} />
          Add New User
        </button>
      </div>

      {/* FILTER ROW */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
        {/* SEARCH */}
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4  rounded-2xl bg-white text-black shadow-xl border border-white/10 placeholder:text-gray-500 outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* DEPARTMENT FILTER */}
        <div className="relative w-full sm:w-64">
          <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white shadow-xl border border-white/10 text-black outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;