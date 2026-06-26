import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getEodReports,
  createEodReport,
  updateEodReport,
} from "../../features/eodReports/eodReportSlice";
import { 
  FiPlus, FiEdit, FiX, FiPaperclip, FiTrash2, FiFile, FiImage, 
  FiSearch, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight 
} from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";

const EodReports = () => {
  const dispatch = useDispatch();
  const { eodReports, loading } = useSelector((state) => state.eodReports);
  
  const [openModal, setOpenModal] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    status: "Completed",
    attachments: [],
  });

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getEodReports());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await axiosInstance.post("/eod-reports/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const newAttachment = {
        url: res.data.data.url,
        filename: res.data.data.filename,
        fileType: res.data.data.fileType,
      };

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment],
      }));
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editReport) {
      dispatch(updateEodReport({ id: editReport._id, data: formData }));
    } else {
      dispatch(createEodReport(formData));
    }

    setOpenModal(false);
    setEditReport(null);
    setFormData({
      projectName: "",
      description: "",
      status: "Completed",
      attachments: [],
    });
  };

  const handleEdit = (report) => {
    setEditReport(report);
    setFormData({
      projectName: report.projectName || "",
      description: report.description || "",
      status: report.status || "Completed",
      attachments: report.attachments || [],
    });
    setOpenModal(true);
  };

  const [imagePreview, setImagePreview] = useState(null);

  // Filter Logic
  const filteredReports = useMemo(() => {
    return eodReports.filter((report) => {
      // Search text in projectName or description
      const matchesSearch = 
        report.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
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
    <div className="min-h-screen transition-colors duration-300">
      <div className="max-w-8xl mx-auto">
        {/* TOP ACTION & FILTER BAR */}
        <div className="bg-white dark:bg-slate-800 shadow-sm p-3 mb-6 flex flex-col lg:flex-row gap-3 justify-between items-center transition-colors rounded-xl">
          
          {/* FILTERS (LEFT) */}
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 flex-1">
            {/* SEARCH */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* DATE FILTER */}
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 text-[13px] font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert min-w-[150px] rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none min-w-[140px]"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <FiChevronRight className="text-slate-400 rotate-90" size={14} />
              </div>
            </div>
          </div>

          {/* ADD BUTTON (RIGHT) */}
          <div className="shrink-0 w-full lg:w-auto">
            <button
              onClick={() => {
                setOpenModal(true);
                setEditReport(null);
                setFormData({
                  projectName: "",
                  description: "",
                  status: "Completed",
                  attachments: [],
                });
              }}
              className="flex w-full lg:w-auto items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <FiPlus size={16} />
              New Report
            </button>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-[#111827] overflow-hidden transition-colors rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Project Name</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Attachments</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading...</p>
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
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentReports.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                          {report.projectName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[300px]">
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all" title={report.description}>
                          {report.description}
                        </p>
                      </td>
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
                          {report.status}
                        </span>
                      </td>
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
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleEdit(report)}
                          className="w-8 h-8 rounded-lg bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all mx-auto"
                        >
                          <FiEdit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION (Only shows if there are more items than itemsPerPage) */}
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

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 w-full max-w-[480px] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {editReport ? "Update Report" : "Daily Report"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Project Name</label>
                  <input
                    type="text"
                    name="projectName"
                    required
                    placeholder="E.g. Website Redesign..."
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows="3"
                    name="description"
                    required
                    placeholder="What did you work on today?"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</label>
                  <div className="relative">
                    <select
                      name="status"
                      required
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] font-medium text-slate-800 dark:text-slate-100 cursor-pointer appearance-none"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending">Pending</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FiChevronRight className="text-slate-400 rotate-90" size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Attachments</label>
                  
                  {formData.attachments.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3">
                      {formData.attachments.map((att, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="text-slate-400 dark:text-slate-500 shrink-0">
                              {att.fileType === "image" ? <FiImage size={14} /> : <FiFile size={14} />}
                            </div>
                            <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">{att.filename}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(i)}
                            className="shrink-0 p-1 rounded-md text-rose-500/70 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-2"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative w-full border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all flex flex-col items-center justify-center p-6 cursor-pointer group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                          <FiPaperclip size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                          {uploading ? "Uploading..." : "Click or drag file"}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">
                          Max 5MB (Images, PDF, Docs)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-[13px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium text-[13px] hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editReport ? "Update" : "Submit"}
                  </button>
                </div>
              </form>
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

export default EodReports;
