import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEodReports } from "../../features/eodReports/eodReportSlice";
import { FiImage, FiFile, FiSearch, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiEye } from "react-icons/fi";

const AdminEodReports = () => {
  const dispatch = useDispatch();
  const { eodReports, loading } = useSelector((state) => state.eodReports);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState(1);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getEodReports());
  }, [dispatch]);

  const [imagePreview, setImagePreview] = useState(null);

  // Filter Logic
  const filteredReports = useMemo(() => {
    return eodReports.filter((report) => {
      // Search text in projectsWorkedOn, tasksCompleted, or user name
      const searchLower = searchQuery.toLowerCase();
      const proj = report.projectsWorkedOn || report.projectName || "";
      const task = report.tasksCompleted || report.description || "";
      const matchesSearch = 
        proj.toLowerCase().includes(searchLower) ||
        task.toLowerCase().includes(searchLower) ||
        report.user?.name?.toLowerCase().includes(searchLower);
      
      // Status Match
      const matchesStatus = statusFilter === "All" || (report.overallStatus || report.status) === statusFilter;
      
      // Date Match
      let matchesDate = true;
      if (dateFilter) {
        const reportDate = new Date(report.date).toISOString().split('T')[0];
        matchesDate = reportDate === dateFilter;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [eodReports, searchQuery, statusFilter, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const handleView = (report) => {
    setSelectedReport(report);
    setOpenViewModal(true);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "On Track":
      case "In Progress":
        return "bg-blue-50 text-blue-650 border border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "Delayed":
        return "bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      default:
        return "bg-slate-50 text-slate-655 border border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-450 dark:border-slate-500/20";
    }
  };

  const getStatusDotStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500";
      case "On Track":
      case "In Progress":
        return "bg-blue-500";
      case "Delayed":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight text-left">
            Team EOD Reports
          </h1>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center transition-colors">
          
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search by member, projects, or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* DATE FILTER */}
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert min-w-[160px]"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none min-w-[160px]"
              >
                <option value="All">All Statuses</option>
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Delayed">Delayed</option>
                <option value="Pending">Pending</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <FiChevronRight className="text-slate-400 rotate-90" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-[#111827] shadow-sm overflow-hidden transition-colors rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Team Member</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Projects Worked On</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Design Count</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Files Submitted</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Pending Tasks</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Reason for Pending</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Challenges Faced</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tomorrow Plan</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Support Needed</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Overall Status</th>

                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Fetching reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                          <FiFile className="text-slate-400 dark:text-slate-500" size={20} />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-2">No reports found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentReports.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      {/* DATE */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </p>
                      </td>

                      {/* USER */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {report.user?.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {report.user?.name || "Anonymous"}
                            </p>
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-semibold truncate mt-0.5">
                              {report.user?.role || "Team"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* PROJECT */}
                      <td className="px-5 py-3.5 max-w-[200px] truncate">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                          {report.projectsWorkedOn || report.projectName || "N/A"}
                        </span>
                      </td>








                      {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.designCount || "-"}
                        </p>
                      </td>

                         {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.filesSubmitted || "-"}
                        </p>
                      </td>

                           {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.pendingTasks || "-"}
                        </p>
                      </td>

                         {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.reasonForPending || "-"}
                        </p>
                      </td>

                        <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.challengesFaced || "-"}
                        </p>
                      </td>

                         {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.tomorrowPlan || "-"}
                        </p>
                      </td>

                         {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[260px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed truncate" title={report.tasksCompleted || report.description}>
                          {report.supportNeeded || "-"}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusBadgeStyle(report.overallStatus || report.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotStyle(report.overallStatus || report.status)}`}></span>
                          {report.overallStatus || report.status || "Completed"}
                        </span>
                      </td>

                    

                      {/* ACTIONS */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleView(report)}
                          title="View Details"
                          className="w-8 h-8 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all mx-auto"
                        >
                          <FiEye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && filteredReports.length > itemsPerPage && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, filteredReports.length)}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredReports.length}</span>
              </p>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft size={16} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[28px] h-7 px-2 rounded text-[12px] font-bold transition-colors ${
                            currentPage === page 
                              ? "bg-blue-600 text-white" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-1 text-[12px] text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DETAILS VIEW MODAL */}
        {openViewModal && selectedReport && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 w-full max-w-[640px] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="text-left">
                  <h2 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    EOD Report Details
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                    <FiCalendar size={12} />
                    Submitted by {selectedReport.user?.name || "Member"} on {new Date(selectedReport.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setOpenViewModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* DETAILS CONTENT */}
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-left">
                
                {/* User info header (for admin) */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                    {selectedReport.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-850 dark:text-slate-100">
                      {selectedReport.user?.name || "Anonymous Member"}
                    </p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                      {selectedReport.user?.role || "Team Member"} • {selectedReport.user?.email || ""}
                    </p>
                  </div>
                </div>

                {/* 2x2 Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Projects Worked On */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Projects Worked On</span>
                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{selectedReport.projectsWorkedOn || selectedReport.projectName || "N/A"}</p>
                  </div>

                  {/* Tasks Completed */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Tasks Completed</span>
                    <p className="text-[13.5px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">{selectedReport.tasksCompleted || selectedReport.description || "N/A"}</p>
                  </div>

                  {/* Design Count */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Design Count</span>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-bold">{selectedReport.designCount || "N/A"}</p>
                  </div>

                  {/* Files Submitted */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Files Submitted</span>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-bold truncate">{selectedReport.filesSubmitted || "N/A"}</p>
                  </div>

                  {/* Pending Tasks */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Pending Tasks</span>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">{selectedReport.pendingTasks || "None"}</p>
                  </div>

                  {/* Reason for Pending */}
                  {selectedReport.reasonForPending && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Reason for Pending</span>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">{selectedReport.reasonForPending}</p>
                    </div>
                  )}

                  {/* Challenges Faced */}
                  {selectedReport.challengesFaced && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Challenges Faced</span>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">{selectedReport.challengesFaced}</p>
                    </div>
                  )}

                  {/* Tomorrow Plan */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Tomorrow Plan</span>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed bg-blue-50/20 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/30 dark:border-blue-900/20">{selectedReport.tomorrowPlan}</p>
                  </div>

                  {/* Support Needed */}
                  {selectedReport.supportNeeded && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Support Needed</span>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">{selectedReport.supportNeeded}</p>
                    </div>
                  )}

                  {/* Overall Status */}
                  <div className="space-y-1.5 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Overall Status</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusBadgeStyle(selectedReport.overallStatus || selectedReport.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotStyle(selectedReport.overallStatus || selectedReport.status)}`}></span>
                      {selectedReport.overallStatus || selectedReport.status || "Completed"}
                    </span>
                  </div>
                </div>

                {/* Attachments Display */}
                {selectedReport.attachments?.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Attachments</span>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReport.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 overflow-hidden">
                          <div className="text-slate-400 dark:text-slate-500 shrink-0">
                            {att.fileType === "image" ? <FiImage size={18} /> : <FiFile size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <a 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[12px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 truncate block"
                            >
                              {att.filename}
                            </a>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5">{att.fileType || "File"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setOpenViewModal(false)}
                  className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[13px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* IMAGE PREVIEW MODAL */}
        {imagePreview && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setImagePreview(null)}>
            <div className="relative max-w-4xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setImagePreview(null)} 
                className="absolute -top-12 right-0 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all"
              >
                <FiX size={20} />
              </button>
              <img 
                src={imagePreview} 
                alt="Attachment Preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEodReports;