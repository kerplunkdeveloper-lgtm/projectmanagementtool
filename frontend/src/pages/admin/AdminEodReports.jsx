import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEodReports } from "../../features/eodReports/eodReportSlice";
import { FiImage, FiFile, FiSearch, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight, FiChevronDown, FiX } from "react-icons/fi";

const AdminEodReports = () => {
  const dispatch = useDispatch();
  const { eodReports, loading } = useSelector((state) => state.eodReports);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getEodReports());
  }, [dispatch]);

  const [imagePreview, setImagePreview] = useState(null);

  // Filter Logic
  const filteredReports = useMemo(() => {
    return eodReports.filter((report) => {
      // Search text in projectName, description, or user name
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        report.projectName?.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        report.user?.name?.toLowerCase().includes(searchLower);
      
      // Status Match
      const matchesStatus = statusFilter === "All" || report.status === statusFilter;
      
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

  return (
    <div className="min-h-screen  py-6 px-4 sm:px-6 lg:px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className=" flex flex-col gap-2">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Team EOD Reports
          </h1>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl  p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center transition-colors">
          
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search by member, project, or description..."
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
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <FiChevronRight className="text-slate-400 rotate-90" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-[#111827] shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#0f172a]/50 ">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Team Member</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Project</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Attachments</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Fetching reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                          <FiFile className="text-slate-400 dark:text-slate-500" size={20} />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-2">No reports found.</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[12px]">Try adjusting your search or filters.</p>
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
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold truncate mt-0.5">
                              {report.user?.role || "Team"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* PROJECT */}
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                          {report.projectName || "N/A"}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 max-w-[300px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all" title={report.description}>
                          {report.description}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          report.status === "Completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                          report.status === "In Progress" ? "bg-blue-50 text-blue-600 border border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                          report.status === "On Hold" ? "bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
                          "bg-slate-50 text-slate-600 border border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            report.status === "Completed" ? "bg-emerald-500" :
                            report.status === "In Progress" ? "bg-blue-500" :
                            report.status === "On Hold" ? "bg-amber-500" : "bg-slate-400"
                          }`}></span>
                          {report.status || "Completed"}
                        </span>
                      </td>

                      {/* ATTACHMENTS */}
                      <td className="px-5 py-3.5">
                        {report.attachments?.length > 0 ? (
                          <div className="flex -space-x-1.5">
                            {report.attachments.map((att, i) => (
                              <a 
                                key={i} 
                                href={att.fileType === "image" ? "#" : att.url} 
                                target={att.fileType === "image" ? "_self" : "_blank"} 
                                rel="noopener noreferrer" 
                                title={att.filename}
                                onClick={(e) => {
                                  if (att.fileType === "image") {
                                    e.preventDefault();
                                    setImagePreview(att.url);
                                  }
                                }}
                                className="w-7 h-7 rounded-full border-2 border-white dark:border-[#111827] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:z-10 hover:scale-110 hover:shadow-sm transition-all">
                                {att.fileType === "image" ? <FiImage size={12} /> : <FiFile size={12} />}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION (Only shows if items > itemsPerPage) */}
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