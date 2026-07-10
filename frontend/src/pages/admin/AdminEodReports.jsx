import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEodReports } from "../../features/eodReports/eodReportSlice";
import { getDesignerEodReports } from "../../features/eodReports/designerEodReportSlice";
import { FiImage, FiFile, FiSearch, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiEye } from "react-icons/fi";

const AdminEodReports = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("general"); // "general" or "designer"

  const { eodReports, loading: generalLoading } = useSelector((state) => state.eodReports);
  const { designerEodReports, loading: designerLoading } = useSelector((state) => state.designerEodReports);

  const reportsList = activeTab === "designer" ? designerEodReports : eodReports;
  const loading = activeTab === "designer" ? designerLoading : generalLoading;

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState(1);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (activeTab === "designer") {
      dispatch(getDesignerEodReports());
    } else {
      dispatch(getEodReports());
    }
  }, [dispatch, activeTab]);

  const [imagePreview, setImagePreview] = useState(null);

  // Filter Logic
  const filteredReports = useMemo(() => {
    return (reportsList || []).filter((report) => {
      const searchLower = searchQuery.toLowerCase();
      let client = report.clientName || "";
      let task = report.projectsWorkedOn || "";
      
      if (activeTab === "designer" && report.tasks) {
        client = report.tasks.map(t => t.client).filter(Boolean).join(" ");
        task = report.tasks.map(t => `${t.title} ${t.project}`).filter(Boolean).join(" ");
      }

      const matchesSearch = 
        client.toLowerCase().includes(searchLower) ||
        task.toLowerCase().includes(searchLower) ||
        report.user?.name?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === "All" || report.overallStatus === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const reportDate = new Date(report.date).toISOString().split('T')[0];
        matchesDate = reportDate === dateFilter;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [reportsList, searchQuery, statusFilter, dateFilter, activeTab]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change or when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, activeTab]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "On Track":
      case "In Progress":
        return "bg-blue-50 text-blue-650 border border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "Delayed":
        return "bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      case "Blocked":
        return "bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
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
      case "Blocked":
        return "bg-amber-550";
      default:
        return "bg-slate-400";
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setOpenViewModal(true);
  };

  const totalColumnsCount = activeTab === "designer" ? 13 : 11;

  return (
    <div className="min-h-screen py-6  transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* HEADER & TAB SWITCHER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight text-left">
            Team EOD Reports
          </h1>

          {/* Premium Tab Bar */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl max-w-xs self-start md:self-auto border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "general"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              General Reports
            </button>
            <button
              onClick={() => setActiveTab("designer")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "designer"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Designer Reports
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center transition-colors border border-slate-100 dark:border-slate-700/40">
          
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search by member, client, project, or task..."
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
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none min-w-[160px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.85em_0.85em]"
              >
                <option value="All">All Statuses</option>
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Delayed">Delayed</option>
                <option value="Blocked">Blocked</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-[#111827] shadow-sm overflow-hidden transition-colors rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Team Member</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Client Name</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Projects Worked On (Task Name)</th>
                  {activeTab === "designer" && (
                    <>
                      <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Number of Designs Completed</th>
                      <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Submitted Links</th>
                    </>
                  )}
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Pending Tasks</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Reason for Pending</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Time Spent Today</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Challenges Faced</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tomorrow Plan</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Overall Status</th>
                  <th className="px-5 py-3.5 min-w-[200px] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={totalColumnsCount} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Fetching reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumnsCount} className="text-center py-16">
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {report.user?.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {report.user?.name || "Anonymous"}
                            </p>
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-semibold truncate mt-0.5">
                              {report.user?.department || report.user?.role || "Team"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td className="px-5 py-3.5 max-w-[150px] truncate" title={activeTab === "designer" && report.tasks ? [...new Set(report.tasks.map(t => t.client).filter(Boolean))].join(', ') : report.clientName}>
                        <span className="text-[13px] font-bold text-slate-850 dark:text-slate-200">
                          {activeTab === "designer" && report.tasks 
                            ? [...new Set(report.tasks.map(t => t.client).filter(Boolean))].join(', ') || report.clientName || "-" 
                            : report.clientName || "-"}
                        </span>
                      </td>

                      {/* PROJECTS WORKED ON (TASK NAME) */}
                      <td className="px-5 py-3.5 max-w-[200px] truncate" title={activeTab === "designer" && report.tasks ? [...new Set(report.tasks.map(t => t.project).filter(Boolean))].join(', ') : report.projectsWorkedOn}>
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                          {activeTab === "designer" && report.tasks 
                            ? [...new Set(report.tasks.map(t => t.project).filter(Boolean))].join(', ') || report.projectsWorkedOn || "-" 
                            : report.projectsWorkedOn || "N/A"}
                        </span>
                      </td>

                      {/* DESIGNER SPECIFIC FIELDS */}
                      {activeTab === "designer" && (
                        <>
                          <td className="px-5 py-3.5 max-w-[150px] truncate">
                            <span className="text-slate-655 dark:text-slate-400 text-[13px] leading-relaxed">
                              {report.tasks 
                                ? report.tasks.filter(t => t.statusAtEod === 'Completed').length 
                                : report.designCount || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px] truncate" title={report.tasks ? report.tasks.map(t => t.outputLink).filter(Boolean).join(', ') : report.filesSubmitted}>
                            <span className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed">
                              {report.tasks 
                                ? report.tasks.map(t => t.outputLink).filter(Boolean).join(', ') || "-" 
                                : report.filesSubmitted || "-"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* PENDING TASKS */}
                      <td className="px-5 py-3.5 max-w-[150px] truncate" title={activeTab === "designer" && report.tasks ? report.tasks.filter(t => t.statusAtEod !== 'Completed').map(t => t.title).join(', ') : report.pendingTasks}>
                        {activeTab === "designer" && report.tasks 
                          ? report.tasks.filter(t => t.statusAtEod !== 'Completed').map(t => t.title).join(', ') || "None" 
                          : report.pendingTasks || "-"}
                      </td>

                      {/* REASON FOR PENDING */}
                      <td className="px-5 py-3.5 max-w-[150px] truncate" title={activeTab === "designer" && report.tasks ? report.tasks.filter(t => t.reason).map(t => `${t.title}: ${t.reason}`).join(' | ') : report.reasonForPending}>
                        {activeTab === "designer" && report.tasks 
                          ? report.tasks.filter(t => t.reason).map(t => `${t.title}: ${t.reason}`).join(' | ') || "None" 
                          : report.reasonForPending || "-"}
                      </td>

                      {/* TIME SPENT */}
                      <td className="px-5 py-3.5 max-w-[100px] truncate" title={activeTab === "designer" && report.tasks ? report.tasks.map(t => t.loggedTime).filter(Boolean).join(', ') : report.timeSpentToday}>
                        {activeTab === "designer" && report.tasks 
                          ? report.tasks.map(t => t.loggedTime).filter(Boolean).join(', ') || "0m" 
                          : report.timeSpentToday || "-"}
                      </td>

                      {/* CHALLENGES */}
                      <td className="px-5 py-3.5 max-w-[150px] truncate">
                        {report.challengesFaced || "-"}
                      </td>

                      {/* TOMORROW PLAN */}
                      <td className="px-5 py-3.5 max-w-[150px] truncate">
                        {report.tomorrowPlan || "-"}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusBadgeStyle(report.overallStatus)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotStyle(report.overallStatus)}`}></span>
                          {report.overallStatus || "Completed"}
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
                    {activeTab === "designer" ? "Designer " : ""}EOD Report Details
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
                
                {/* User info header */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                    {selectedReport.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-855 dark:text-slate-100">
                      {selectedReport.user?.name || "Anonymous Member"}
                    </p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                      {selectedReport.user?.department || selectedReport.user?.role || "Team Member"} • {selectedReport.user?.email || ""}
                    </p>
                  </div>
                </div>                {/* DETAILS CONTENT */}
                {activeTab === "designer" && selectedReport.tasks && selectedReport.tasks.length > 0 ? (
                  <div className="space-y-5">
                    {/* Visual Progress / Stats */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Completed</span>
                        <span className="text-md font-extrabold text-emerald-600 dark:text-emerald-400">
                          {selectedReport.tasks.filter(t => t.statusAtEod === "Completed").length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Pending</span>
                        <span className="text-md font-extrabold text-amber-600 dark:text-amber-400">
                          {selectedReport.tasks.filter(t => t.statusAtEod === "Pending").length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Rejected</span>
                        <span className="text-md font-extrabold text-rose-600 dark:text-rose-400">
                          {selectedReport.tasks.filter(t => t.statusAtEod === "Rejected").length}
                        </span>
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Logged Tasks</span>
                      <div className="space-y-4">
                        {selectedReport.tasks.map((task, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                              task.statusAtEod === "Completed"
                                ? "bg-emerald-500"
                                : task.statusAtEod === "Rejected"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`} />

                            <div className="flex justify-between items-start gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                  {task.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                  Proj: {task.project || "Internal"} • Client: {task.client || "None"}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                task.statusAtEod === "Completed"
                                  ? "bg-emerald-55 text-emerald-600 border border-emerald-200/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : task.statusAtEod === "Rejected"
                                  ? "bg-rose-55 text-rose-650 border border-rose-200/40 dark:bg-rose-955/40 dark:text-rose-400"
                                  : "bg-amber-55 text-amber-600 border border-amber-200/40 dark:bg-amber-955/40 dark:text-amber-400"
                              }`}>
                                {task.statusAtEod}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-[11px]">
                              <div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">Time Logged</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{task.loggedTime || "0m"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">Content Type</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{task.contentType || "IMAGE"}</span>
                              </div>
                              {task.outputLink && (
                                <div className="col-span-2">
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">Output Link</span>
                                  <a href={task.outputLink} target="_blank" rel="noopener noreferrer" className="text-indigo-650 hover:underline font-bold truncate block">
                                    {task.outputLink}
                                  </a>
                                </div>
                              )}
                              {task.reason && (
                                <div className="col-span-2 bg-amber-50/50 dark:bg-amber-955/10 p-2 rounded text-amber-700 dark:text-amber-400 font-semibold border border-amber-100/30">
                                  <span className="text-[9px] text-amber-550 dark:text-amber-500 uppercase tracking-wider block font-extrabold">Reason</span>
                                  {task.reason}
                                </div>
                              )}
                              {task.feedback && (
                                <div className="col-span-2 bg-rose-50/50 dark:bg-rose-955/10 p-2 rounded text-rose-700 dark:text-rose-400 font-semibold border border-rose-100/30">
                                  <span className="text-[9px] text-rose-550 dark:text-rose-500 uppercase tracking-wider block font-extrabold">Supervisor Feedback</span>
                                  {task.feedback}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational Summary */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60 space-y-3">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block border-b border-slate-200/60 pb-1.5">Operational Summary</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Tools / Resource Issues</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{selectedReport.daySummary?.toolsIssues || "None"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Client Calls Attended</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{selectedReport.daySummary?.clientCalls || "None"}</span>
                        </div>
                        {selectedReport.daySummary?.anythingElseOps && (
                          <div className="col-span-2">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Additional Operations Notes</span>
                            <p className="font-semibold text-slate-655 dark:text-slate-300 mt-0.5">{selectedReport.daySummary.anythingElseOps}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tomorrow Plan */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Tomorrow Plan</span>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed bg-blue-50/20 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/30 dark:border-blue-900/20">{selectedReport.tomorrowPlan}</p>
                    </div>

                    {/* Overall Status */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Overall Status</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusBadgeStyle(selectedReport.overallStatus)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotStyle(selectedReport.overallStatus)}`}></span>
                        {selectedReport.overallStatus || "Completed"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Client Name */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Client Name</span>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{selectedReport.clientName || "-"}</p>
                    </div>

                    {/* Projects Worked On */}
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Projects Worked On (Task Name)</span>
                      <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{selectedReport.projectsWorkedOn || "N/A"}</p>
                    </div>

                    {/* Design Count & Files Submitted (If designer) */}
                    {selectedReport.designCount !== undefined && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Number of Designs Completed</span>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-bold">{selectedReport.designCount || "N/A"}</p>
                      </div>
                    )}

                    {selectedReport.filesSubmitted !== undefined && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Submitted Links</span>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-bold truncate">{selectedReport.filesSubmitted || "N/A"}</p>
                      </div>
                    )}

                    {/* Pending Tasks */}
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Pending Tasks</span>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">{selectedReport.pendingTasks || "None"}</p>
                    </div>

                    {/* Reason for Pending */}
                    {selectedReport.reasonForPending && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Reason for Pending Work</span>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">{selectedReport.reasonForPending}</p>
                      </div>
                    )}

                    {/* Time Spent Today */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Time Spent Today</span>
                      <p className="text-[13px] text-slate-705 dark:text-slate-300 font-bold">{selectedReport.timeSpentToday || "N/A"}</p>
                    </div>

                    {/* Challenges Faced */}
                    {selectedReport.challengesFaced && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Challenges Faced</span>
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
                        <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Support Needed</span>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">{selectedReport.supportNeeded}</p>
                      </div>
                    )}

                    {/* Overall Status */}
                    <div className="space-y-1.5 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Overall Status</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusBadgeStyle(selectedReport.overallStatus)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotStyle(selectedReport.overallStatus)}`}></span>
                        {selectedReport.overallStatus || "Completed"}
                      </span>
                    </div>
                  </div>
                )}

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
                              className="text-[12px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-650 truncate block"
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