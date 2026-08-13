import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getEodReports, deleteEodReport } from "../../features/eodReports/eodReportSlice";
import { getDesignerEodReports, deleteDesignerEodReport } from "../../features/eodReports/designerEodReportSlice";
import { getUsers } from "../../features/users/userSlice";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiImage,
  FiFile,
  FiSearch,
  FiCalendar,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEye,
  FiInfo,
  FiChevronDown,
  FiTrash2,
  FiUsers,
  FiCheckCircle,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";

const getContentTypeStyle = (contentType) => {
  if (!contentType)
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const type = contentType.toLowerCase().trim();
  if (type.includes("reel")) {
    return "bg-pink-50 text-pink-650 border border-pink-200/50 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20";
  }
  if (type.includes("static") || type.includes("single")) {
    return "bg-sky-50 text-sky-650 border border-sky-200/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20";
  }
  if (type.includes("video")) {
    return "bg-violet-50 text-violet-650 border border-violet-200/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20";
  }
  if (type.includes("carousel") || type.includes("slider")) {
    return "bg-amber-50 text-amber-650 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
  }
  if (type.includes("story")) {
    return "bg-emerald-50 text-emerald-650 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
  }
  if (type.includes("logo") || type.includes("brand")) {
    return "bg-indigo-50 text-indigo-650 border border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20";
  }
  return "bg-slate-50 text-slate-655 border border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-450 dark:border-slate-500/20";
};

const calculateTotalLoggedTime = (report) => {
  if (!report.tasks || !Array.isArray(report.tasks)) {
    return report.timeSpentToday || "-";
  }

  let totalMinutes = 0;
  report.tasks.forEach((t) => {
    if (!t.loggedTime) return;
    const timeStr = t.loggedTime.toLowerCase().trim();
    let hours = 0;
    let minutes = 0;

    if (/^\d+(\.\d+)?$/.test(timeStr)) {
      hours = parseFloat(timeStr);
    } else {
      const hMatch = timeStr.match(/(\d+(\.\d+)?)\s*h/);
      if (hMatch) {
        hours = parseFloat(hMatch[1]);
      } else {
        const hourWordMatch = timeStr.match(/(\d+(\.\d+)?)\s*hour/);
        if (hourWordMatch) hours = parseFloat(hourWordMatch[1]);
      }

      const mMatch = timeStr.match(/(\d+)\s*m/);
      if (mMatch) {
        minutes = parseInt(mMatch[1], 10);
      } else {
        const minWordMatch = timeStr.match(/(\d+)\s*min/);
        if (minWordMatch) minutes = parseInt(minWordMatch[1], 10);
      }
    }

    totalMinutes += hours * 60 + minutes;
  });

  if (totalMinutes === 0) {
    return report.timeSpentToday || "-";
  }

  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const isTaskCompleted = (t) => {
  if (!t || !t.statusAtEod) return false;
  const s = t.statusAtEod.trim().toLowerCase();
  return s === "completed" || s === "in review" || s === "in-review" || s === "in_review";
};

const AdminEodReports = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { eodReports, loading: generalLoading } = useSelector(
    (state) => state.eodReports,
  );
  const { designerEodReports, loading: designerLoading } = useSelector(
    (state) => state.designerEodReports,
  );
  const { users: allUsers } = useSelector((state) => state.users || {});

  const [activeTab, setActiveTab] = useState(() => {
    return (
      searchParams.get("tab") ||
      sessionStorage.getItem("admin_eod_tab") ||
      "All Departments"
    );
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState(() => {
    return (
      searchParams.get("search") ||
      sessionStorage.getItem("admin_eod_search") ||
      ""
    );
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return (
      searchParams.get("status") ||
      sessionStorage.getItem("admin_eod_status") ||
      "All"
    );
  });
  const [clientFilter, setClientFilter] = useState(() => {
    return (
      searchParams.get("client") ||
      sessionStorage.getItem("admin_eod_client") ||
      "All"
    );
  });
  const getLocalDateStr = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    return (
      searchParams.get("date") ||
      sessionStorage.getItem("admin_eod_selectedDate") ||
      getLocalDateStr()
    );
  });
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = searchParams.get("page");
    const pageFromStorage = sessionStorage.getItem("admin_eod_page");
    return parseInt(pageFromUrl || pageFromStorage || "1", 10) || 1;
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, target: null });
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 10;

  const isInitialMount = useRef(true);

  // Sync state changes to searchParams & sessionStorage
  useEffect(() => {
    const params = {};
    if (activeTab && activeTab !== "All Departments") params.tab = activeTab;
    if (searchQuery) params.search = searchQuery;
    if (statusFilter && statusFilter !== "All") params.status = statusFilter;
    if (clientFilter && clientFilter !== "All") params.client = clientFilter;
    if (selectedDate) params.date = selectedDate;
    if (currentPage && currentPage > 1) params.page = currentPage.toString();

    setSearchParams(params, { replace: true });

    sessionStorage.setItem("admin_eod_tab", activeTab);
    sessionStorage.setItem("admin_eod_search", searchQuery);
    sessionStorage.setItem("admin_eod_status", statusFilter);
    sessionStorage.setItem("admin_eod_client", clientFilter);
    sessionStorage.setItem("admin_eod_selectedDate", selectedDate);
    sessionStorage.setItem("admin_eod_page", currentPage.toString());
  }, [
    activeTab,
    searchQuery,
    statusFilter,
    clientFilter,
    selectedDate,
    currentPage,
    setSearchParams,
  ]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest("#dept-filter-dropdown-container")) {
        setShowDeptDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateStr(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateStr(d));
  };

  const handleSetToday = () => {
    setSelectedDate(getLocalDateStr());
  };

  useEffect(() => {
    dispatch(getEodReports());
    dispatch(getDesignerEodReports());
    dispatch(getUsers());
  }, [dispatch]);

  // Group reports by User Department
  const groupedDepartments = useMemo(() => {
    const groups = {};

    const allDesigner = designerEodReports || [];
    const allGeneral = eodReports || [];

    // All Departments contains all designer reports + general reports sorted by date
    groups["All Departments"] = [...allDesigner, ...allGeneral].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    // Initialize Graphic Designer & Videographer tabs
    groups["Graphic Designer"] = allDesigner;
    groups["Videographer"] = [];

    // Collect and initialize all department keys from registered users (allUsers)
    if (Array.isArray(allUsers)) {
      allUsers.forEach((u) => {
        if (!u.department || !u.department.trim()) return;
        let dept = u.department.trim();
        const deptLower = dept.toLowerCase();
        if (deptLower === "videographer" || deptLower === "video editor") {
          dept = "Videographer";
        } else if (deptLower === "graphic designer" || deptLower === "designer") {
          dept = "Graphic Designer";
        }
        if (!groups[dept]) {
          groups[dept] = [];
        }
      });
    }

    // Group general reports under user's department
    allGeneral.forEach((report) => {
      let dept = report.user?.department || "General";
      const deptLower = dept.trim().toLowerCase();
      if (deptLower === "videographer" || deptLower === "video editor") {
        dept = "Videographer";
      } else if (deptLower === "graphic designer" || deptLower === "designer") {
        dept = "Graphic Designer";
      }
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(report);
    });

    return groups;
  }, [eodReports, designerEodReports, allUsers]);

  // Generate department list:
  // 1st: "All Departments", 2nd: "Graphic Designer", 3rd: "Videographer", 4th: "Social Media Manager"
  // "Managing Partner" and "Operation Manager" are removed.
  // "Mobile Developer" is placed last.
  const departmentsList = useMemo(() => {
    const excludedKeywords = [
      "managing partner",
      "managingpartner",
      "operation manager",
      "operationmanager",
      "operations manager",
      "operationsmanager",
    ];

    const isMobileDev = (d) => {
      const lower = (d || "").trim().toLowerCase();
      return lower.includes("mobile");
    };

    const isSocialMedia = (d) => {
      const lower = (d || "").trim().toLowerCase();
      return lower.includes("social media");
    };

    const isExcluded = (d) => {
      const lower = (d || "").trim().toLowerCase();
      return excludedKeywords.some((ex) => lower.includes(ex));
    };

    // Find Social Media key if present in groupedDepartments or allUsers
    const socialMediaKey =
      Object.keys(groupedDepartments).find((d) => isSocialMedia(d)) ||
      ((allUsers || []).some((u) => isSocialMedia(u.department || u.role))
        ? "Social Media Manager"
        : null);

    const defaultDepts = ["All Departments", "Graphic Designer", "Videographer"];
    if (socialMediaKey) {
      defaultDepts.push(socialMediaKey);
    }

    // Filter remaining department keys
    const remainingDepts = Object.keys(groupedDepartments)
      .filter((d) => {
        if (defaultDepts.includes(d)) return false;
        if (isExcluded(d)) return false;
        if (isMobileDev(d)) return false;
        if (isSocialMedia(d)) return false;
        return true;
      })
      .sort();

    // Find Mobile Developer key if present
    const mobileDevKey = Object.keys(groupedDepartments).find((d) => isMobileDev(d));

    const result = [...defaultDepts, ...remainingDepts];

    if (mobileDevKey) {
      result.push(mobileDevKey);
    } else {
      const hasMobileUser = (allUsers || []).some((u) => isMobileDev(u.department || u.role));
      if (hasMobileUser) {
        result.push("Mobile Developer");
      }
    }

    return result;
  }, [groupedDepartments, allUsers]);

  // Extract unique clients based on the active tab's reports
  const uniqueClients = useMemo(() => {
    const reports = groupedDepartments[activeTab] || [];
    const clientsSet = new Set();
    reports.forEach((report) => {
      if (report.tasks && Array.isArray(report.tasks)) {
        report.tasks.forEach((t) => {
          if (t.client) clientsSet.add(t.client.trim());
        });
      } else if (report.clientName) {
        clientsSet.add(report.clientName.trim());
      }
    });
    return Array.from(clientsSet).sort();
  }, [groupedDepartments, activeTab]);

  // Helper to apply current search, status, client, and date filters
  const applyFilters = (reportsList) => {
    if (!reportsList || !Array.isArray(reportsList)) return [];
    return reportsList.filter((report) => {
      const searchLower = searchQuery.toLowerCase();
      let client = report.clientName || "";
      let task = report.projectsWorkedOn || "";

      if (report.tasks && Array.isArray(report.tasks)) {
        client = report.tasks
          .map((t) => t.client)
          .filter(Boolean)
          .join(" ");
        task = report.tasks
          .map((t) => `${t.title} ${t.project}`)
          .filter(Boolean)
          .join(" ");
      }

      const matchesSearch =
        client.toLowerCase().includes(searchLower) ||
        task.toLowerCase().includes(searchLower) ||
        (report.user?.name || "").toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "All" || report.overallStatus === statusFilter;

      // Client filter matches
      let matchesClient = true;
      if (clientFilter !== "All") {
        if (report.tasks && Array.isArray(report.tasks)) {
          matchesClient = report.tasks.some(
            (t) => t.client && t.client.trim() === clientFilter
          );
        } else {
          matchesClient = report.clientName && report.clientName.trim() === clientFilter;
        }
      }

      let matchesDate = true;
      if (selectedDate) {
        const reportDate = new Date(report.date);
        const reportYear = reportDate.getFullYear();
        const reportMonth = String(reportDate.getMonth() + 1).padStart(2, "0");
        const reportDay = String(reportDate.getDate()).padStart(2, "0");
        const reportDateStr = `${reportYear}-${reportMonth}-${reportDay}`;

        matchesDate = reportDateStr === selectedDate;
      }

      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });
  };

  // Filter reports of active department
  const filteredReports = useMemo(() => {
    const reports = groupedDepartments[activeTab] || [];
    return applyFilters(reports);
  }, [
    groupedDepartments,
    activeTab,
    searchQuery,
    statusFilter,
    clientFilter,
    selectedDate,
  ]);

  // Dynamic department counts based on active date/status/search filters
  const departmentCounts = useMemo(() => {
    const counts = {};
    Object.keys(groupedDepartments).forEach((dept) => {
      const deptReports = groupedDepartments[dept] || [];
      counts[dept] = applyFilters(deptReports).length;
    });
    return counts;
  }, [
    groupedDepartments,
    searchQuery,
    statusFilter,
    clientFilter,
    selectedDate,
  ]);

  // Total registered users count in active department from users database
  const totalUsersCount = useMemo(() => {
    const userSet = new Set();
    const activeTabLower = (activeTab || "").trim().toLowerCase();

    if (Array.isArray(allUsers) && allUsers.length > 0) {
      allUsers.forEach((u) => {
        const uDept = (u.department || "").trim().toLowerCase();
        const uRole = (u.role || "").trim().toLowerCase();
        const uKey = (u._id || u.id || u.email || u.name || "").toString();

        if (!uKey) return;

        if (activeTab === "All Departments") {
          userSet.add(uKey);
        } else if (activeTab === "Graphic Designer") {
          if (
            uDept === "graphic designer" ||
            uDept === "designer" ||
            uRole === "graphic designer" ||
            uRole === "designer"
          ) {
            userSet.add(uKey);
          }
        } else if (activeTab === "Videographer") {
          if (
            uDept === "videographer" ||
            uDept === "video editor" ||
            uRole === "videographer" ||
            uRole === "video editor"
          ) {
            userSet.add(uKey);
          }
        } else {
          if (uDept === activeTabLower || uRole === activeTabLower) {
            userSet.add(uKey);
          }
        }
      });
      return userSet.size;
    }

    // Fallback if allUsers array is not yet populated
    const deptReports = groupedDepartments[activeTab] || [];
    deptReports.forEach((r) => {
      const uKey = (r.user?._id || r.user?.id || r.user?.name || r.user || "").toString();
      if (uKey) userSet.add(uKey);
    });

    return userSet.size;
  }, [allUsers, groupedDepartments, activeTab]);

  // Dynamic department user label (e.g. Total Designers, Total Videographers, Total Teammates)
  const totalUsersLabel = useMemo(() => {
    if (!activeTab || activeTab === "All Departments") return "Total Teammates";
    if (activeTab === "Graphic Designer") return "Total Designers";
    if (activeTab === "Videographer") return "Total Videographers";
    if (activeTab === "Digital Marketing") return "Total Digital Marketers";
    if (activeTab.toLowerCase().includes("user") || activeTab.toLowerCase().includes("team")) {
      return `Total ${activeTab}`;
    }
    return `Total ${activeTab}s`;
  }, [activeTab]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = useMemo(() => {
    return filteredReports.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredReports, currentPage, itemsPerPage]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter, clientFilter, selectedDate]);

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
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setOpenViewModal(true);
  };

  const handleDelete = (report) => {
    setDeleteConfirm({ show: true, target: report });
  };

  const confirmDeleteAction = async () => {
    setDeleting(true);
    try {
      if (deleteConfirm.target === "bulk") {
        const designerIdsSet = new Set((designerEodReports || []).map((r) => r._id));
        await Promise.all(
          selectedIds.map((id) => {
            if (designerIdsSet.has(id)) {
              return dispatch(deleteDesignerEodReport({ id, silent: true })).unwrap();
            } else {
              return dispatch(deleteEodReport({ id, silent: true })).unwrap();
            }
          })
        );
        toast.success("EOD Reports deleted successfully");
        setSelectedIds([]);
      } else if (deleteConfirm.target) {
        const targetReport = deleteConfirm.target;
        const id = targetReport._id;
        const isDesigner =
          (designerEodReports || []).some((r) => r._id === id) ||
          targetReport.tasks !== undefined;

        if (isDesigner) {
          await dispatch(deleteDesignerEodReport(id)).unwrap();
        } else {
          await dispatch(deleteEodReport(id)).unwrap();
        }
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
      setDeleteConfirm({ show: false, target: null });
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const loading =
    activeTab === "Graphic Designer"
      ? designerLoading
      : activeTab === "All Departments"
        ? designerLoading || generalLoading
        : generalLoading;
  const totalColumnsCount =
    activeTab === "Graphic Designer" || activeTab === "All Departments" ? 15 : 14;

  return (
    <div className="min-h-screen py-6 transition-colors duration-300">
      <div className="max-w-8xl mx-auto">
        
        {/* HEADER SECTION (Title, Dropdown & Date Navigation) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          {/* Left: Title & Department Selector */}
          <div className="flex flex-wrap items-center gap-4">
           

            {/* Department Dropdown Selector */}
            <div id="dept-filter-dropdown-container" className="relative">
              <button
                type="button"
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs transition-all cursor-pointer min-w-[190px] justify-between h-[38px]"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  {activeTab}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {departmentCounts[activeTab] || 0}
                  </span>
                  <FiChevronDown className="text-slate-400 dark:text-slate-500" size={14} />
                </div>
              </button>

              {showDeptDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/50 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-155">
                  <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-750 mb-1">
                    Select Department
                  </div>
                  {departmentsList.map((dept) => {
                    const count = departmentCounts[dept] || 0;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setActiveTab(dept);
                          setClientFilter("All");
                          setShowDeptDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          activeTab === dept
                            ? "bg-blue-50/50 dark:bg-blue-500/10 text-blue-650 dark:text-blue-400 font-extrabold"
                            : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === dept ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                          {dept}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          activeTab === dept
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Date Navigation Filter (Reference Image Style) */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 w-full sm:w-auto">
            {/* Today Button */}
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer h-[38px] ${
                selectedDate === getLocalDateStr()
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Today
            </button>

            {/* Date Picker Button */}
            <div className="relative">
              <button 
                type="button"
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 rounded-xl flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs cursor-pointer h-[38px]"
              >
                <FiCalendar className="text-emerald-500 dark:text-emerald-400" size={14} />
                <span>
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <FiChevronDown className="text-slate-400 dark:text-slate-500" size={12} />
              </button>
              <input
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
              />
            </div>

            {/* Prev / Next buttons group */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 rounded-xl overflow-hidden divide-x divide-slate-200 dark:divide-slate-750 shadow-xs h-[38px]">
              <button
                type="button"
                onClick={handlePrevDay}
                className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-355 cursor-pointer transition-all active:scale-95"
              >
                <FiChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-355 cursor-pointer transition-all active:scale-95"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {/* Card 1: Registered Users */}
          <div className="bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100/85 dark:border-indigo-900/30 p-4 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest text-left">
                {totalUsersLabel}
              </span>
              <FiUsers className="text-indigo-500/80 dark:text-indigo-450/80 shrink-0" size={16} />
            </div>
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 text-left mt-2">
              {totalUsersCount}
            </span>
          </div>

          {/* Card 2: Total Reports */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest text-left">
                Total Reports
              </span>
              <FiFile className="text-slate-500/80 dark:text-slate-450/80 shrink-0" size={16} />
            </div>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 text-left mt-2">
              {filteredReports.length}
            </span>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/85 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-emerald-650 dark:text-emerald-450 uppercase tracking-widest text-left">
                Completed
              </span>
              <FiCheckCircle className="text-emerald-500/80 dark:text-emerald-450/80 shrink-0" size={16} />
            </div>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 text-left mt-2">
              {
                filteredReports.filter((r) => r.overallStatus === "Completed")
                  .length
              }
            </span>
          </div>

          {/* Card 4: Active / On Track */}
          <div className="bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/85 dark:border-blue-900/30 p-4 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-blue-650 dark:text-blue-400 uppercase tracking-widest text-left">
                Active / On Track
              </span>
              <FiActivity className="text-blue-500/80 dark:text-blue-450/80 shrink-0" size={16} />
            </div>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300 text-left mt-2">
              {
                filteredReports.filter(
                  (r) =>
                    r.overallStatus === "On Track" ||
                    r.overallStatus === "In Progress",
                ).length
              }
            </span>
          </div>

          {/* Card 5: Delayed / Blocked */}
          <div className="bg-rose-50/40 dark:bg-rose-950/15 border border-rose-100/85 dark:border-rose-900/30 p-4 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-rose-650 dark:text-rose-450 uppercase tracking-widest text-left">
                Delayed / Blocked
              </span>
              <FiAlertCircle className="text-rose-500/80 dark:text-rose-455/80 shrink-0" size={16} />
            </div>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 text-left mt-2">
              {
                filteredReports.filter(
                  (r) =>
                    r.overallStatus === "Delayed" ||
                    r.overallStatus === "Blocked",
                ).length
              }
            </span>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center transition-colors border border-slate-100 dark:border-slate-700/40">
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search by teammate, client, project, or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* STATUS FILTER */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none min-w-[160px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.85em_0.85em]"
              >
                <option value="All">All Statuses</option>
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            {/* CLIENT FILTER */}
            <div className="relative w-full sm:w-auto">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none min-w-[160px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.85em_0.85em]"
              >
                <option value="All">All Clients</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-[#111827] shadow-sm overflow-hidden transition-colors rounded-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1000px] text-left border-collapse border border-slate-200 dark:border-slate-850 [&_th]:border [&_th]:border-slate-200 [&_th]:dark:border-slate-850 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-slate-850">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#0f172a]/50 ">
                  <th className="px-4 py-3 text-center w-12 min-w-[48px]">
                    <input
                      type="checkbox"
                      checked={
                        currentReports.length > 0 &&
                        currentReports.every((r) => selectedIds.includes(r._id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = currentReports.map((r) => r._id);
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = currentReports.map((r) => r._id);
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="rounded border-slate-350 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer transition-all"
                    />
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                    Date
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Team Member
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Client Name
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Task Name
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Task Assigned by
                  </th>

                  {(activeTab === "Graphic Designer" || activeTab === "All Departments") && (
                    <>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        Total Completed Designs
                      </th>
                    </>
                  )}
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Pending Tasks
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Reason for Pending
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[320px]">
                    Tomorrow Plan
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Total Time Spent
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Overall Status
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Last Submitted
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td
                      colSpan={totalColumnsCount}
                      className="text-center py-16"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                          Fetching EOD reports...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={totalColumnsCount}
                      className="text-center py-16"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                          <FiFile
                            className="text-slate-400 dark:text-slate-500"
                            size={16}
                          />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-xs mt-2">
                          No reports found.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentReports.map((report) => (
                    <tr
                      key={report._id}
                      className={`transition-colors group no-hover-row ${
                        report.overallStatus?.trim() === "On Track"
                          ? "bg-yellow-300 dark:bg-yellow-600"
                          : report.overallStatus?.trim() === "Completed"
                            ? "bg-emerald-200 dark:bg-emerald-600"
                            : report.overallStatus?.trim() === "Delayed"
                              ? "bg-rose-200 dark:bg-rose-200"
                              : ""
                      }`}
                    >
                      {/* CHECKBOX */}
                      <td className="px-4 py-3 text-center w-12 min-w-[48px]">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(report._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, report._id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== report._id));
                            }
                          }}
                          className="rounded border-slate-350 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer transition-all"
                        />
                      </td>

                      {/* DATE */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(report.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </td>

                      {/* TEAM MEMBER */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0 overflow-hidden">
                            {report.user?.profile?.profileImage?.url ? (
                              <img
                                src={report.user.profile.profileImage.url}
                                alt={report.user?.name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              report.user?.name?.charAt(0) || "U"
                            )}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate text-left">
                              {report.user?.name || "Anonymous"}
                            </p>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-bold truncate mt-0.5 text-left">
                              {report.user?.department ||
                                report.user?.role ||
                                "Team"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT NAME */}
                      <td
                        className="px-5 py-3 max-w-[150px] truncate text-left"
                        title={
                          report.tasks
                            ? [
                                ...new Set(
                                  report.tasks
                                    .map((t) => t.client)
                                    .filter(Boolean),
                                ),
                              ].join(", ")
                            : report.clientName
                        }
                      >
                        <span className="text-xs font-semibold text-slate-855 dark:text-slate-200">
                          {report.tasks
                            ? [
                                ...new Set(
                                  report.tasks
                                    .map((t) => t.client)
                                    .filter(Boolean),
                                ),
                              ].join(", ") || "-"
                            : report.clientName || "-"}
                        </span>
                      </td>

                      {/* TASK NAME */}
                      <td className="px-5 py-3 max-w-[280px] text-left">
                        {report.tasks && Array.isArray(report.tasks) ? (
                          <div className="flex flex-col gap-1.5">
                            {report.tasks.map((t, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 min-w-0"
                              >
                                <span
                                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                                  title={t.title}
                                >
                                  {t.title || "-"}
                                </span>
                                {t.contentType && (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${getContentTypeStyle(t.contentType)}`}
                                  >
                                    {t.contentType}
                                  </span>
                                )}
                              </div>
                            ))}
                            {report.tasks.length === 0 && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        ) : (
                          <span
                            className="text-xs font-semibold text-slate-805 dark:text-slate-200 block truncate"
                            title={report.projectsWorkedOn}
                          >
                            {report.projectsWorkedOn || "-"}
                          </span>
                        )}
                      </td>

                      {/* TASK ASSIGNED BY */}
                      <td className="px-5 py-3 text-left whitespace-nowrap">
                        {report.tasks && Array.isArray(report.tasks) && report.tasks[0]?.reviewedBy ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold shadow-sm shrink-0 overflow-hidden">
                              {report.tasks[0].reviewedBy?.profile?.profileImage?.url ? (
                                <img
                                  src={report.tasks[0].reviewedBy.profile.profileImage.url}
                                  alt={report.tasks[0].reviewedBy?.name || "User"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (report.tasks[0].reviewedBy?.name || "U").charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {[
                                ...new Set(
                                  report.tasks
                                    .map((t) => t.reviewedBy?.name)
                                    .filter(Boolean),
                                ),
                              ].join(", ") || "-"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* DYNAMIC DESIGNER SPECIFIC FIELDS */}
                      {(activeTab === "Graphic Designer" || activeTab === "All Departments") && (
                        <>
                          <td className="px-5 py-3 text-left">
                            <span className="text-slate-655 dark:text-slate-400 text-xs">
                              {report.tasks
                                ? `${report.tasks.filter(isTaskCompleted).length} / ${report.tasks.length}`
                                : report.designCount || "-"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* PENDING TASKS */}
                      <td
                        className="px-5 py-3 min-w-[200px] max-w-[220px] truncate text-left text-xs text-slate-700 dark:text-slate-355"
                        title={
                          report.tasks
                            ? report.tasks
                                .filter((t) => !isTaskCompleted(t))
                                .map((t) => t.title)
                                .join(", ")
                            : report.pendingTasks
                        }
                      >
                        {report.tasks
                          ? report.tasks
                              .filter((t) => !isTaskCompleted(t))
                              .map((t) => t.title)
                              .join(", ") || "None"
                          : report.pendingTasks || "-"}
                      </td>

                      {/* REASON FOR PENDING */}
                      <td
                        className="px-5 py-3 max-w-[150px] truncate text-left text-xs text-slate-500 dark:text-slate-400"
                        title={
                          report.tasks
                            ? report.tasks
                                .filter((t) => t.reason)
                                .map((t) => `${t.title}: ${t.reason}`)
                                .join(" | ")
                            : report.reasonForPending
                        }
                      >
                        {report.tasks
                          ? report.tasks
                              .filter((t) => t.reason)
                              .map((t) => `${t.title}: ${t.reason}`)
                              .join(" | ") || "None"
                          : report.reasonForPending || "-"}
                      </td>

                      {/* TOMORROW PLAN */}
                      <td
                        className="px-5 py-3 min-w-[320px] max-w-[360px] truncate text-left text-xs text-slate-500 dark:text-slate-400"
                        title={report.tomorrowPlan}
                      >
                        {report.tomorrowPlan || "-"}
                      </td>

                      {/* TOTAL TIME SPENT */}
                      <td className="px-5 py-3 text-left whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-violet-50 text-violet-700 border border-violet-200/50 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                          {calculateTotalLoggedTime(report)}
                        </span>
                      </td>

                      {/* OVERALL STATUS */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        {report.overallStatus ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeStyle(report.overallStatus)}`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full mr-1.5 ${getStatusDotStyle(report.overallStatus)}`}
                            ></span>
                            {report.overallStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            —
                          </span>
                        )}
                      </td>

                      {/* LAST SUBMITTED */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-605 dark:text-slate-350">
                          {report.updatedAt || report.createdAt ? (
                            <>
                              <span className="block">
                                {new Date(report.updatedAt || report.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                                {new Date(report.updatedAt || report.createdAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </p>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleView(report)}
                            title="View Details"
                            className="w-7 h-7 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <FiEye size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(report)}
                            title="Delete Report"
                            className="w-7 h-7 rounded-lg bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
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
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(currentPage * itemsPerPage, filteredReports.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {filteredReports.length}
                </span>{" "}
                entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <FiChevronLeft size={14} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[24px] h-6 px-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            currentPage === page
                              ? "bg-blue-650 text-white"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="px-1 text-[11px] text-slate-400"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <FiChevronRight size={14} />
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
                  <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {selectedReport.tasks ? "Graphic Designer " : ""}EOD Report
                    Details
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                    <FiCalendar size={11} />
                    Submitted on{" "}
                    {new Date(selectedReport.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setOpenViewModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* DETAILS CONTENT */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-left">
                {/* User Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 overflow-hidden">
                    {selectedReport.user?.profile?.profileImage?.url ? (
                      <img
                        src={selectedReport.user.profile.profileImage.url}
                        alt={selectedReport.user?.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedReport.user?.name?.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-855 dark:text-slate-100">
                      {selectedReport.user?.name || "Anonymous Member"}
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                      {selectedReport.user?.department || "Team Member"} •{" "}
                      {selectedReport.user?.email || ""}
                    </p>
                  </div>
                </div>

                {selectedReport.tasks && selectedReport.tasks.length > 0 ? (
                  /* GRAPHIC DESIGNER BREAKDOWN */
                  <div className="space-y-4">
                    {/* Visual Stats */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                          Completed
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450">
                          {
                            selectedReport.tasks.filter(isTaskCompleted).length
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                          Pending
                        </span>
                        <span className="text-sm font-extrabold text-amber-600 dark:text-amber-450">
                          {
                            selectedReport.tasks.filter(
                              (t) =>
                                !isTaskCompleted(t) &&
                                t.statusAtEod !== "Rejected",
                            ).length
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                          Rejected
                        </span>
                        <span className="text-sm font-extrabold text-rose-600 dark:text-rose-450">
                          {
                            selectedReport.tasks.filter(
                              (t) => t.statusAtEod === "Rejected",
                            ).length
                          }
                        </span>
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                        Logged Tasks
                      </span>
                      <div className="space-y-3">
                        {selectedReport.tasks.map((task, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 relative overflow-hidden"
                          >
                            <div
                              className={`absolute top-0 left-0 bottom-0 w-1 ${
                                isTaskCompleted(task)
                                  ? "bg-emerald-500"
                                  : task.statusAtEod === "Rejected"
                                    ? "bg-rose-500"
                                    : "bg-amber-500"
                              }`}
                            />

                            <div className="flex justify-between items-start gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {task.title}
                                  </h4>
                                  {task.contentType && (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getContentTypeStyle(task.contentType)}`}
                                    >
                                      {task.contentType}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                  • Client: {task.client || "None"}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  isTaskCompleted(task)
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200/40"
                                    : task.statusAtEod === "Rejected"
                                      ? "bg-rose-50 text-rose-600 border border-rose-200/40"
                                      : "bg-amber-50 text-amber-600 border border-amber-200/40"
                                }`}
                              >
                                {task.statusAtEod}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-[10px]">
                              <div>
                                <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">
                                  Time Spent
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-350">
                                  {task.loggedTime || "0m"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">
                                  Content Type
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-350">
                                  {task.contentType || "IMAGE"}
                                </span>
                              </div>
                              {task.outputLink && (
                                <div className="col-span-2">
                                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">
                                    Output Link
                                  </span>
                                  <a
                                    href={task.outputLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline font-bold truncate block"
                                  >
                                    {task.outputLink}
                                  </a>
                                </div>
                              )}
                              {task.reason && (
                                <div className="col-span-2 bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded text-amber-700 dark:text-amber-400 font-semibold">
                                  <span className="text-[8px] text-amber-600 uppercase tracking-wider block font-black">
                                    Reason
                                  </span>
                                  {task.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational Summary */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60 space-y-2">
                      <span className="text-[9px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block border-b border-slate-200/60 pb-1">
                        Operational Summary
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">
                            Tools Issues
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-350">
                            {selectedReport.daySummary?.toolsIssues || "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">
                            Client Calls
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-350">
                            {selectedReport.daySummary?.clientCalls || "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* GENERAL EOD BREAKDOWN */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Client Name
                      </span>
                      <p className="text-slate-800 dark:text-slate-200">
                        {selectedReport.clientName || "-"}
                      </p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Projects Worked On (Task Name)
                      </span>
                      <p className="text-slate-800 dark:text-slate-200">
                        {selectedReport.projectsWorkedOn || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Time Spent Today
                      </span>
                      <p className="text-slate-800 dark:text-slate-200">
                        {selectedReport.timeSpentToday || "-"}
                      </p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Pending Tasks
                      </span>
                      <p className="text-slate-655 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {selectedReport.pendingTasks || "None"}
                      </p>
                    </div>

                    {selectedReport.reasonForPending && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          Reason for Pending
                        </span>
                        <p className="text-slate-655 dark:text-slate-300">
                          {selectedReport.reasonForPending}
                        </p>
                      </div>
                    )}

                    {selectedReport.challengesFaced && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          Challenges Faced
                        </span>
                        <p className="text-slate-655 dark:text-slate-300">
                          {selectedReport.challengesFaced}
                        </p>
                      </div>
                    )}

                    {selectedReport.supportNeeded && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          Support Needed
                        </span>
                        <p className="text-slate-655 dark:text-slate-300">
                          {selectedReport.supportNeeded}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Common fields (Tomorrow plan and attachments) */}
                <div className="space-y-1 pt-2">
                  <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                    Tomorrow's Plan
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed bg-blue-50/20 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/30 dark:border-blue-900/20">
                    {selectedReport.tomorrowPlan}
                  </p>
                </div>

                {selectedReport.attachments?.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                      Attachments
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReport.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 overflow-hidden"
                        >
                          <div className="text-slate-400 dark:text-slate-500 shrink-0">
                            {att.fileType === "image" ? (
                              <FiImage size={15} />
                            ) : (
                              <FiFile size={15} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-550 truncate block text-left"
                            >
                              {att.filename}
                            </a>
                            <span className="text-[8px] text-slate-400 uppercase tracking-wider block mt-0.5 text-left">
                              {att.fileType || "File"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall status display */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                    Overall Status:
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeStyle(selectedReport.overallStatus)}`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full mr-1.5 ${getStatusDotStyle(selectedReport.overallStatus)}`}
                    ></span>
                    {selectedReport.overallStatus || "Completed"}
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setOpenViewModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BULK ACTION FLOATING BAR */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-6 left-1/2 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Reports Selected
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-850" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setDeleteConfirm({ show: true, target: "bulk" })}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:shadow-rose-500/20 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <FiTrash2 size={12} />
                  Delete Selected
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRMATION MODAL */}
        <AnimatePresence>
          {deleteConfirm.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !deleting && setDeleteConfirm({ show: false, target: null })}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mb-4 ring-4 ring-rose-500/10">
                  <FiTrash2 size={22} className="animate-pulse" />
                </div>

                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                  {deleteConfirm.target === "bulk" ? "Confirm Bulk Deletion" : "Confirm Deletion"}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {deleteConfirm.target === "bulk"
                    ? `Are you sure you want to permanently delete the ${selectedIds.length} selected EOD reports? This action will remove them from the database and cannot be undone.`
                    : "Are you sure you want to delete this EOD report? This action will permanently remove the record from the database and cannot be undone."}
                </p>

                <div className="flex items-center gap-3 w-full">
                  <button
                    disabled={deleting}
                    onClick={() => setDeleteConfirm({ show: false, target: null })}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleting}
                    onClick={confirmDeleteAction}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-rose-500/20 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? (
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Yes, Delete"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminEodReports;
