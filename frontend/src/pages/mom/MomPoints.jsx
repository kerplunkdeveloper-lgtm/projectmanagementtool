import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiPlus,
  FiTrash2,
  FiFileText,
  FiMoreHorizontal,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiColumns,
  FiClock,
  FiChevronDown,
  FiUser,
  FiEyeOff,
  FiMoreVertical,
  FiLock,
  FiCheck,
  FiLoader,
  FiDownload,
} from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { getClientBranding } from "../../components/common/ClientBadge";

const momTypes = [
  "Task / Action",
  "Client Decision",
  "Follow-up",
  "Discussion",
  "Information",
  "Client Feedback",
  "Design Change",
  "Content Requirement",
  "Correction",
  "Approval / Decision",
  "Issue / Blocker",
];
const priorities = ["Low", "Medium", "High"];
const statuses = [
  "Not Started",
  "Inprogress",
  "In-Review",
  "Completed",
  "Rejected",
];

const formatId = (id) => {
  if (!id) return "MOM-XXXX";
  return `MOM${id.substring(id.length - 4).toUpperCase()}`;
};

const getProfileImage = (u) => {
  if (!u) return null;
  return (
    (typeof u.profile?.profileImage === "object"
      ? u.profile?.profileImage?.url
      : u.profile?.profileImage) ||
    (typeof u.profileImage === "object"
      ? u.profileImage?.url
      : u.profileImage)
  );
};

// --- STYLING HELPERS ---
const getTypeColor = (t) => {
  switch (t) {
    case "Task / Action":
      return "bg-purple-100 text-purple-700";
    case "Client Decision":
      return "bg-blue-100 text-blue-700";
    case "Follow-up":
      return "bg-emerald-100 text-emerald-700";
    case "Issue / Blocker":
      return "bg-rose-100 text-rose-700";
    case "Discussion":
      return "bg-cyan-100 text-cyan-700";
    case "Information":
      return "bg-slate-100 text-slate-700";
    case "Client Feedback":
      return "bg-orange-100 text-orange-700";
    case "Design Change":
      return "bg-pink-100 text-pink-700";
    case "Content Requirement":
      return "bg-indigo-100 text-indigo-700";
    case "Correction":
      return "bg-amber-100 text-amber-700";
    case "Approval / Decision":
      return "bg-teal-100 text-teal-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPriorityColor = (p) => {
  switch (p) {
    case "High":
      return "bg-red-100 text-red-700 border-red-200";
    case "Medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Low":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getStatusColor = (s) => {
  switch (s) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Inprogress":
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "In-Review":
    case "In Review":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Not Started":
    case "Not started":
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "On Hold":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Rejected":
    case "Cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const MomPoints = () => {
  const { user } = useSelector((state) => state.auth);
  const [moms, setMoms] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  // Selection
  const [selectedMoms, setSelectedMoms] = useState({});
  const [openAssigneeDropdown, setOpenAssigneeDropdown] = useState(null);

  // Filters
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCreatedBy, filterAssignedTo, filterStatus]);

  // Inline Adding
  const [inlineAdding, setInlineAdding] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const inlineInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [momsRes, clientsRes, usersRes] = await Promise.all([
        axiosInstance.get("/moms"),
        axiosInstance.get("/clients"),
        axiosInstance.get("/users"),
      ]);
      setMoms(momsRes.data.data || []);
      setClients(clientsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const deptLower = user?.department?.toLowerCase() || "";
  const isCurrentUserSocialMedia =
    deptLower.includes("social manager") ||
    deptLower.includes("social media manager") ||
    deptLower.includes("social media executive");
  const isCurrentUserAdminOrOp =
    user?.role === "admin" || user?.role === "operationmanager";

  const assignableUsers = useMemo(() => users.filter((u) => {
    if (isCurrentUserAdminOrOp) {
      const targetDept = u.department?.toLowerCase() || "";
      return (
        targetDept.includes("social manager") ||
        targetDept.includes("social media manager") ||
        targetDept.includes("social media executive") ||
        u.role === "admin" || 
        u.role === "operationmanager"
      );
    } else if (isCurrentUserSocialMedia) {
      return u._id === user?._id || u.id === user?.id;
    }
    // Default fallback
    return true;
  }), [users, isCurrentUserAdminOrOp, isCurrentUserSocialMedia, user]);

  const handleUpdateField = async (id, field, value) => {
    const previousMoms = [...moms];
    
    let optimisticValue = value;
    if (field === "client" && value) {
      optimisticValue = clients.find((c) => c._id === value) || value;
    } else if (field === "assignedTo" && value) {
      optimisticValue = users.find((u) => u._id === value) || value;
    }

    setMoms(moms.map((m) => (m._id === id ? { ...m, [field]: optimisticValue } : m)));

    try {
      let payload = { [field]: value };
      if (value === "") {
        if (field === "assignedTo" || field === "client") {
          if (field === "client") return;
        }
      }
      await axiosInstance.put(`/moms/${id}`, payload);
      if (field === "client" || field === "assignedTo") {
        fetchData(false);
      }
    } catch (error) {
      toast.error("Failed to update");
      setMoms(previousMoms);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this MOM point?"))
      return;
    try {
      await axiosInstance.delete(`/moms/${id}`);
      toast.success("MOM point deleted");
      setMoms(moms.filter((m) => m._id !== id));
    } catch (error) {
      toast.error("Failed to delete MOM point");
    }
  };

  const handleInlineAddSubmit = async (e) => {
    e.preventDefault();
    if (!inlineTitle.trim()) {
      setInlineAdding(false);
      return;
    }

    const payload = {
      title: inlineTitle,
      momType: "Task / Action",
      priority: "Medium",
      status: "Not Started",
    };

    if (isCurrentUserSocialMedia) {
      payload.assignedTo = user?._id || user?.id;
    }

    try {
      const res = await axiosInstance.post("/moms", payload);
      toast.success("MOM point created");
      setInlineTitle("");
      fetchData(); // reload
    } catch (err) {
      toast.error("Failed to create MOM point");
    }
  };


  const filteredMoms = useMemo(() => moms.filter((mom) => {
    if (filterCreatedBy && (mom.createdBy?._id || mom.createdBy) !== filterCreatedBy) return false;
    if (filterAssignedTo && (mom.assignedTo?._id || mom.assignedTo) !== filterAssignedTo) return false;
    if (filterStatus && mom.status !== filterStatus) return false;
    return true;
  }), [moms, filterCreatedBy, filterAssignedTo, filterStatus]);

  const totalPages = Math.ceil(filteredMoms.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMoms = useMemo(() => filteredMoms.slice(indexOfFirstItem, indexOfLastItem), [filteredMoms, indexOfFirstItem, indexOfLastItem]);

  const handleDownloadExcel = () => {
    if (filteredMoms.length === 0) {
      toast.error("No MOM points to download.");
      return;
    }

    const headers = ["Title", "Client", "MOM Type", "Created By", "Assigned To", "Start Date", "End Date", "Status", "Priority"];
    
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const csvRows = [];
    csvRows.push(headers.join(","));

    filteredMoms.forEach((mom) => {
      const row = [
        escapeCSV(mom.title),
        escapeCSV(mom.client?.companyName || ""),
        escapeCSV(mom.momType),
        escapeCSV(mom.createdBy?.name || ""),
        escapeCSV(mom.assignedTo?.name || ""),
        escapeCSV(mom.startDate ? new Date(mom.startDate).toLocaleDateString() : ""),
        escapeCSV(mom.endDate ? new Date(mom.endDate).toLocaleDateString() : ""),
        escapeCSV(mom.status),
        escapeCSV(mom.priority),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MOM_Points_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full max-w-8xl mx-auto px-2 md:px-0 relative">
      <div className="flex flex-col theme-bg-accent text-white rounded-xl shadow-md lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white tracking-tight">
            MOM Points
          </h1>
        </div>
        <div className="flex items-center justify-end gap-2"> 
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-[12px] font-bold cursor-pointer transition-all shadow-sm hover:bg-emerald-100 active:scale-95 shrink-0"
          >
            <FiDownload size={14} className="stroke-[3]" />
            <span>Download to Excel</span>
          </button>
          
          <button
            onClick={() => {
              setInlineAdding(true);
              setTimeout(() => {
                if (inlineInputRef.current) inlineInputRef.current.focus();
              }, 100);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white theme-text-primary text-[12px] font-bold cursor-pointer transition-all shadow-md shrink-0 hover:opacity-90 active:scale-95"
          >
            <FiPlus size={14} className="stroke-[3]" />
            <span>Add MOM Point</span>
          </button>
        </div>
      </div>

      {/* FILTERS FOR ADMIN */}
      {user?.role === "admin" && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 theme-bg-card border theme-border rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />
            <span className="text-xs font-semibold theme-text-secondary">Filters:</span>
          </div>
          <select 
            value={filterCreatedBy} 
            onChange={e => setFilterCreatedBy(e.target.value)}
            className="text-xs border theme-border rounded-md px-2 py-1.5 theme-bg-element theme-text-primary outline-none"
          >
            <option value="">All Creators</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>

          <select 
            value={filterAssignedTo} 
            onChange={e => setFilterAssignedTo(e.target.value)}
            className="text-xs border theme-border rounded-md px-2 py-1.5 theme-bg-element theme-text-primary outline-none"
          >
            <option value="">All Assignees</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border theme-border rounded-md px-2 py-1.5 theme-bg-element theme-text-primary outline-none"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          {(filterCreatedBy || filterAssignedTo || filterStatus) && (
            <button 
              onClick={() => { setFilterCreatedBy(""); setFilterAssignedTo(""); setFilterStatus(""); }}
              className="text-xs text-red-500 hover:text-red-600 font-medium ml-auto px-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="min-h-[400px] relative">
        <div className={`overflow-x-auto overflow-y-auto h-[calc(100vh-220px)] min-h-[400px] w-full bg-white dark:bg-[#111115] border border-slate-200 dark:border-slate-800  relative scrollbar-thin ${openAssigneeDropdown ? 'pb-[250px]' : ''}`}>
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="py-3.5">
              <tr className="bg-slate-50 dark:bg-[#16161b] text-slate-700 dark:text-slate-300 tracking-wider text-[12px]">
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[250px] md:min-w-[80px]">
                  Title
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[140px]">
                  Client
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[140px]">
                  MOM Type
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[150px]">
                  Created By
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[150px]">
                  Assignee
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[90px]">
                  Start Date
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[90px]">
                  End Date
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 whitespace-nowrap min-w-[120px]">
                  Status
                </th>
                <th className="px-3 py-1 border-b border-slate-200 dark:border-white/5 text-center whitespace-nowrap min-w-[80px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {/* Inline Add Row */}
              <tr className="border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#111115] hover:bg-slate-50/50">
                <td
                  className="px-3 py-1 border-b border-slate-200 dark:border-white/5 min-w-[250px] md:min-w-[400px]"
                  style={{ borderLeft: "2.5px solid #6366f1" }}
                >
                  <div className="flex items-center gap-2 w-full pl-6">
                    {inlineAdding ? (
                      <form onSubmit={handleInlineAddSubmit} className="w-full">
                        <input
                          ref={inlineInputRef}
                          type="text"
                          placeholder="Type MOM point title and press Enter..."
                          value={inlineTitle}
                          onChange={(e) => setInlineTitle(e.target.value)}
                          onBlur={() => {
                            setTimeout(() => {
                              if (inlineTitle.trim()) {
                                handleInlineAddSubmit({
                                  preventDefault: () => {},
                                });
                              } else {
                                setInlineAdding(false);
                              }
                            }, 150);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setInlineTitle("");
                              setInlineAdding(false);
                            }
                          }}
                          className="w-full bg-transparent text-[11px] font-semibold text-slate-800 dark:text-white outline-none border-b-2 border-blue-500 dark:border-[#3b82f6] pb-1 placeholder-slate-450 transition-all focus:border-blue-600"
                        />
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-450 dark:text-slate-400 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            setInlineAdding(true);
                            setTimeout(() => {
                              if (inlineInputRef.current)
                                inlineInputRef.current.focus();
                            }, 100);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-955/30 text-slate-500 hover:text-blue-600 transition-all cursor-pointer font-bold"
                        >
                          <FiPlus size={12} className="stroke-[3]" />
                          <span>Add MOM Point</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td
                  colSpan="8"
                  className="px-3 py-1 border-b border-slate-200 dark:border-white/5 bg-transparent"
                ></td>
              </tr>

              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <FiLoader
                      size={24}
                      className="animate-spin text-blue-500 mx-auto mb-2"
                    />
                    <span className="text-slate-500 text-sm font-medium">
                      Loading MOM points...
                    </span>
                  </td>
                </tr>
              ) : (filteredMoms.length === 0) ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <span className="text-slate-500 text-sm font-medium">
                      No MOM points found.
                    </span>
                  </td>
                </tr>
              ) : (
                currentMoms.map((mom, index, arr) => {
                  const isUnread = (mom.assignedTo?._id === user?._id || mom.assignedTo === user?._id) && mom.isRead === false;
                  const isNearBottom = index >= arr.length - 3 && arr.length > 3;
                  return (
                  <tr
                    key={mom._id}
                    onClick={() => {
                      if (isUnread) handleUpdateField(mom._id, "isRead", true);
                    }}
                    className={`border-b border-slate-200 dark:border-white/5 ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-[#111115]'} hover:bg-slate-50 dark:hover:bg-white/[0.02] group transition-colors cursor-default`}
                  >
                    {/* Title */}
                    <td
                      className="px-3 py-1 font-semibold min-w-[250px] md:min-w-[400px] relative"
                      style={{ borderLeft: "2.5px solid #6366f1" }}
                    >
                      {isUnread && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 w-full pl-6">
                        <div className="flex-grow min-w-0 flex items-center gap-1.5">
                          <span
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              const val = e.target.innerText.trim();
                              if (val !== mom.title) {
                                handleUpdateField(mom._id, "title", val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            className="font-semibold text-slate-800 dark:text-white text-[11px] cursor-text outline-none block min-h-[16px] w-full"
                          >
                            {mom.title}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-3 py-1 font-medium">
                      <div className="relative inline-block w-full">
                        <select
                          value={mom.client?._id || mom.client || ""}
                          onChange={(e) =>
                            handleUpdateField(mom._id, "client", e.target.value)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        >
                          <option value="">Select Client</option>
                          {clients.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.companyName}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const branding = getClientBranding(mom.client);
                          return (
                            <div 
                              className={`flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold whitespace-nowrap shadow-sm transition-all border shrink-0 text-black dark:text-white ${branding.bgClass} ${branding.textClass} ${branding.borderClass}`}
                              style={{
                                backgroundColor: mom.client ? `${branding.color}15` : '#eef2ff',
                                borderColor: mom.client ? `${branding.color}30` : '#c7d2fe',
                              }}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <div 
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: mom.client ? branding.color : '#4338ca' }}
                                ></div>
                                <span className="truncate max-w-[100px]" style={{ color: mom.client ? branding.color : '#4338ca' }}>
                                  {mom.client?.companyName || "Select client"}
                                </span>
                              </div>
                              <FiChevronDown
                                size={10}
                                className="opacity-60 shrink-0"
                                style={{ color: mom.client ? branding.color : '#4338ca' }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* MOM Type */}
                    <td className="px-3 py-1 font-medium">
                      <div className="relative inline-block w-full">
                        <select
                          value={mom.momType || ""}
                          onChange={(e) =>
                            handleUpdateField(
                              mom._id,
                              "momType",
                              e.target.value,
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        >
                          {momTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <div
                          className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${getTypeColor(mom.momType)}`}
                        >
                          <span className="truncate">{mom.momType}</span>
                          <FiChevronDown size={10} className="opacity-70 shrink-0" />
                        </div>
                      </div>
                    </td>

                    {/* Created By */}
                    <td className="px-3 py-1 font-medium">
                      <div className="flex items-center gap-1.5">
                        {mom.createdBy ? (
                          <>
                            {getProfileImage(mom.createdBy) ? (
                              <img
                                src={getProfileImage(mom.createdBy)}
                                alt={mom.createdBy.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                {mom.createdBy.name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </div>
                            )}
                            <div className="flex flex-col justify-center">
                              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[90px] leading-tight">
                                {mom.createdBy.name || "Unknown"}
                              </span>
                              {mom.createdBy.department && (
                                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[90px] leading-tight">
                                  {mom.createdBy.department}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-1 font-medium">
                      <div className="relative inline-block w-full">
                        <div 
                          onClick={() => {
                            if (!isCurrentUserSocialMedia) setOpenAssigneeDropdown(openAssigneeDropdown === mom._id ? null : mom._id)
                          }}
                          className={`${isCurrentUserSocialMedia ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5'} flex items-center gap-1.5 p-1 rounded-md transition-colors`}
                        >
                          {mom.assignedTo ? (
                            <>
                              {getProfileImage(mom.assignedTo) ? (
                                <img
                                  src={getProfileImage(mom.assignedTo)}
                                  alt={mom.assignedTo.name}
                                  className="w-6 h-6 rounded-full object-cover shadow-sm shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                                  {mom.assignedTo.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col justify-center text-left">
                                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px] leading-tight">
                                  {mom.assignedTo.name}
                                </span>
                                {mom.assignedTo.department && (
                                  <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px] leading-tight">
                                    {mom.assignedTo.department}
                                  </span>
                                )}
                              </div>
                              {!isCurrentUserSocialMedia && <FiChevronDown size={12} className="text-slate-400 ml-1 shrink-0" />}
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-slate-300 text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors text-[10px] font-bold">
                              <FiUser size={12} />
                              <span>+ Assignee</span>
                            </div>
                          )}
                        </div>

                        {/* CUSTOM DROPDOWN LIST */}
                        {openAssigneeDropdown === mom._id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenAssigneeDropdown(null)} 
                            ></div>
                            <div className={`absolute left-0 w-56 bg-white dark:bg-[#1a1a1f] border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.2)] z-[100] overflow-hidden ${isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                                <div 
                                  onClick={() => {
                                    handleUpdateField(mom._id, "assignedTo", "");
                                    setOpenAssigneeDropdown(null);
                                  }}
                                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-100 dark:border-white/5"
                                >
                                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                    <FiUser size={14} />
                                  </div>
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Unassigned</span>
                                </div>

                                {assignableUsers.map((u) => (
                                  <div 
                                    key={u._id}
                                    onClick={() => {
                                      handleUpdateField(mom._id, "assignedTo", u._id);
                                      setOpenAssigneeDropdown(null);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                  >
                                    {getProfileImage(u) ? (
                                      <img src={getProfileImage(u)} alt={u.name} className="w-7 h-7 rounded-full object-cover shadow-sm shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shadow-sm shrink-0">
                                        {u.name?.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {u.name}
                                        {(u._id === user?._id || u.id === user?.id) && " (You)"}
                                      </span>
                                      <span className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                        {u.department || u.role}
                                      </span>
                                    </div>
                                    {mom.assignedTo?._id === u._id && (
                                      <FiCheck size={14} className="text-indigo-600 shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Start Date */}
                    <td className="px-3 py-1">
                      <div className="relative h-6 flex items-center justify-start transition-all cursor-pointer">
                        {mom.startDate ? (
                          <div className="flex items-center flex-nowrap gap-1 px-1.5 py-0.5 rounded-md border border-blue-300 text-blue-800 text-[9.5px] font-bold bg-blue-100 shadow-2xs">
                            <span className="whitespace-nowrap">
                              {new Date(mom.startDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-dashed border-blue-600 text-blue-600 bg-blue-50 text-[8px] font-bold">
                            <FiCalendar size={9.5} />
                            <span>+ Start Date</span>
                          </div>
                        )}
                        <input
                          type="date"
                          value={
                            mom.startDate ? mom.startDate.split("T")[0] : ""
                          }
                          onChange={(e) =>
                            handleUpdateField(
                              mom._id,
                              "startDate",
                              e.target.value || null,
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                        />
                      </div>
                    </td>

                    {/* End Date */}
                    <td className="px-3 py-1">
                      <div className="relative h-6 flex items-center justify-start transition-all cursor-pointer">
                        {mom.endDate ? (
                          <div className="flex items-center flex-nowrap gap-1 px-1.5 py-0.5 rounded-md border border-rose-300 text-rose-800 text-[9.5px] font-bold bg-rose-100 shadow-2xs">
                            <span className="whitespace-nowrap">
                              {new Date(mom.endDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-dashed border-rose-300 text-rose-600 bg-rose-50 text-[8px] font-bold">
                            <FiCalendar size={9.5} />
                            <span>+ End Date</span>
                          </div>
                        )}
                        <input
                          type="date"
                          value={mom.endDate ? mom.endDate.split("T")[0] : ""}
                          onChange={(e) =>
                            handleUpdateField(
                              mom._id,
                              "endDate",
                              e.target.value || null,
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-1 font-medium">
                      <div className="relative inline-block w-full">
                        <select
                          value={mom.status || "Not Started"}
                          onChange={(e) =>
                            handleUpdateField(mom._id, "status", e.target.value)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <div
                          className={`flex items-center justify-between gap-1.5 px-2.5 py-0.5 rounded-xl text-[10px] font-black whitespace-nowrap border ${getStatusColor(mom.status || "Not Started")} uppercase tracking-wider`}
                        >
                          <span className="truncate">
                            {mom.status || "Not Started"}
                          </span>
                          <FiChevronDown size={10} className="opacity-70 shrink-0" />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-1 text-center font-medium">
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => handleDelete(mom._id)}
                          className="p-1 border border-transparent rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {filteredMoms.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111115] rounded-xl mt-4 shadow-sm">
            <div className="flex items-center text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200 mx-1">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-700 dark:text-slate-200 mx-1">{Math.min(indexOfLastItem, filteredMoms.length)}</span> of <span className="font-bold text-slate-700 dark:text-slate-200 mx-1">{filteredMoms.length}</span> entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1.5 px-2 hidden sm:flex">
                {totalPages <= 7 ? (
                  [...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11.5px] font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {i + 1}
                    </button>
                  ))
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomPoints;
