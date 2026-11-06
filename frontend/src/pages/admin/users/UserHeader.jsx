import React from "react";
import {
  FiPlus,
  FiFilter,
  FiDownload,
  FiSearch,
  FiX,
  FiRotateCcw,
} from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa";
import SearchableDropdown from "../../../components/common/SearchableDropdown";

const UserHeader = ({
  users,
  setOpenModal,
  setEditUser,
  searchTerm,
  setSearchTerm,
  filterDept,
  setFilterDept,
  filterLocation,
  setFilterLocation,
  filterRelieved,
  setFilterRelieved,
  isReadOnly,
  canCreate,
  onExportExcel,
}) => {
  const getDeptPriority = (deptStr) => {
    const d = (deptStr || "").toLowerCase().trim();
    if (d === "hr" || d.includes("human resource")) return 1;
    if (d === "admin" || d.includes("managing partner")) return 2;
    if (
      d.includes("operation manager") ||
      d === "operations manager" ||
      d === "operationmanager"
    )
      return 3;
    if (d.includes("social media head") || d.includes("smm head")) return 4;
    if (
      d.includes("social media executive") ||
      d.includes("social media manager") ||
      d.includes("social media")
    )
      return 5;
    return 100;
  };

  const uniqueDepts = Array.from(
    new Set(
      (users || [])
        .map((u) => (u.department === "Social Media Manager" ? "Social Media Executive" : u.department))
        .filter((dept) => typeof dept === "string" && dept.trim() !== ""),
    ),
  ).sort((a, b) => {
    const pA = getDeptPriority(a);
    const pB = getDeptPriority(b);
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b);
  });

  const uniqueLocs = Array.from(
    new Set(
      (users || [])
        .map((u) => u.location)
        .filter((loc) => typeof loc === "string" && loc.trim() !== ""),
    ),
  ).sort();

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(filterDept) ||
    Boolean(filterLocation) ||
    (filterRelieved && filterRelieved !== "active");

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterDept("");
    setFilterLocation("");
    setFilterRelieved("active");
  };

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* ── MOBILE ACTIONS (Top Bar on Mobile) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-bold text-slate-800 dark:text-white">
            Users Directory
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors border-0"
            >
              <FiRotateCcw size={12} />
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial h-11 bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm text-sm font-bold active:scale-95 transition-all cursor-pointer border-0"
            title="Download Users Table in Excel"
          >
            <FiDownload size={15} />
            <span>Export</span>
          </button>

          {(canCreate !== undefined ? canCreate : !isReadOnly) && (
            <button
              type="button"
              onClick={() => {
                if (setEditUser) setEditUser(null);
                setOpenModal(true);
              }}
              className="flex-1 sm:flex-initial h-11 bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm text-sm font-bold active:scale-95 transition-all cursor-pointer border-0"
            >
              <FiPlus size={16} />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN SEARCH & FILTER BAR ── */}
      <div className=" flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3 relative z-30">
        {/* SEARCH INPUT */}
        <div className="relative flex items-center flex-1 h-11 bg-slate-100/90 dark:bg-[#1a2234] rounded-xl px-4 border border-slate-200/80 dark:border-0 transition-all focus-within:ring-2 focus-within:ring-blue-500/40">
          <FiSearch className="text-slate-400 dark:text-slate-300 shrink-0 mr-2.5" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full !bg-transparent !p-0 !border-0 text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer border-0"
              title="Clear search"
            >
              <FiX size={15} />
            </button>
          )}
        </div>

        {/* FILTERS CONTAINER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2.5">
          {/* DEPT FILTER (Searchable Dropdown with Search Box) */}
          <SearchableDropdown
            value={filterDept || "All"}
            onChange={(val) => setFilterDept(val === "All" ? "" : val)}
            options={uniqueDepts}
            allLabel="All Departments"
            placeholder="All Departments"
            searchPlaceholder="Search department..."
            emptyText="No departments found"
            icon={FiFilter}
            className="w-full lg:w-[195px] xl:w-[230px] shrink-0"
            menuWidth="w-full min-w-[220px]"
            buttonClassName={`w-full h-11 px-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-sm font-semibold ${
              filterDept
                ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                : "bg-slate-100/90 dark:bg-[#1a2234] border-slate-200/80 dark:border-transparent text-slate-700 dark:text-white hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          />

          {/* LOC FILTER */}
          <div className="flex items-center gap-2.5 h-11 px-4 bg-slate-100/90 dark:bg-[#1a2234] rounded-xl border border-slate-200/80 dark:border-0 lg:w-[175px] xl:w-[205px] shrink-0 transition-all">
            <FaMapMarkerAlt
              size={14}
              className="text-slate-400 dark:text-slate-300 shrink-0"
            />
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full !bg-transparent !p-0 !border-0 text-sm font-semibold text-slate-700 dark:text-white cursor-pointer appearance-none truncate outline-none"
            >
              <option value="" className="bg-white dark:bg-[#1a2234] text-slate-800 dark:text-white">
                All Locations
              </option>
              {uniqueLocs.map((l) => (
                <option
                  key={l}
                  value={l}
                  className="bg-white dark:bg-[#1a2234] text-slate-800 dark:text-white"
                >
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* RELIEVED FILTER */}
          <div className="flex items-center gap-2.5 h-11 px-4 bg-slate-100/90 dark:bg-[#1a2234] rounded-xl border border-slate-200/80 dark:border-0 lg:w-[140px] shrink-0 transition-all">
            <FiFilter
              size={15}
              className="text-slate-400 dark:text-slate-300 shrink-0"
            />
            <select
              value={filterRelieved}
              onChange={(e) => setFilterRelieved(e.target.value)}
              className="w-full !bg-transparent !p-0 !border-0 text-sm font-semibold text-slate-700 dark:text-white cursor-pointer appearance-none outline-none"
            >
              <option value="active" className="bg-white dark:bg-[#1a2234] text-slate-800 dark:text-white">
                Active
              </option>
              <option value="relieved" className="bg-white dark:bg-[#1a2234] text-slate-800 dark:text-white">
                Relieved
              </option>
              <option value="all" className="bg-white dark:bg-[#1a2234] text-slate-800 dark:text-white">
                All Users
              </option>
            </select>
          </div>

          {/* RESET BUTTON FOR DESKTOP */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="hidden lg:flex items-center gap-1.5 h-11 px-3.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2234] dark:hover:bg-[#222c42] text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0 cursor-pointer border-0"
              title="Reset all filters"
            >
              <FiRotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* DESKTOP ACTIONS (Right side on desktop) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onExportExcel}
            className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm text-sm font-bold active:scale-95 transition-all cursor-pointer shrink-0 border-0"
            title="Download Users Table in Excel"
          >
            <FiDownload size={15} />
            <span>Export</span>
          </button>

          {(canCreate !== undefined ? canCreate : !isReadOnly) && (
            <button
              type="button"
              onClick={() => {
                if (setEditUser) setEditUser(null);
                setOpenModal(true);
              }}
              className="h-11 bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm text-sm font-bold active:scale-95 transition-all cursor-pointer shrink-0 border-0"
            >
              <FiPlus size={16} />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
