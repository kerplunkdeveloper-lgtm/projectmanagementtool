import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getEodReports,
  createEodReport,
  updateEodReport,
  deleteEodReport,
} from "../../features/eodReports/eodReportSlice";
import {
  getDesignerEodReports,
  createDesignerEodReport,
  updateDesignerEodReport,
  deleteDesignerEodReport,
} from "../../features/eodReports/designerEodReportSlice";
import { useGetTasksQuery } from "../../features/api/apiSlice";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiEye,
  FiPaperclip,
  FiFile,
  FiImage,
  FiClock,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";

const EodReports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isDesigner =
    user?.department === "Graphic Designer" ||
    user?.department === "Designer Team";

  const { eodReports: generalReports, loading: generalLoading } = useSelector(
    (state) => state.eodReports,
  );
  const { designerEodReports: designerReports, loading: designerLoading } =
    useSelector((state) => state.designerEodReports);
  const { data: tasks = [] } = useGetTasksQuery(undefined, {
    skip: !user,
  });

  const reportsList = isDesigner ? designerReports : generalReports;
  const loading = isDesigner ? designerLoading : generalLoading;
  const totalColumnsCount = isDesigner ? 13 : 11;

  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [unsavedRows, setUnsavedRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [uploadingRowId, setUploadingRowId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const tableContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (tableContainerRef.current) {
      setTimeout(() => {
        tableContainerRef.current.scrollTo({
          top: tableContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, scrollToBottom]);

  useEffect(() => {
    if (unsavedRows.length > 0) {
      scrollToBottom();
    }
  }, [unsavedRows.length, scrollToBottom]);

  useEffect(() => {
    if (isDesigner) {
      dispatch(getDesignerEodReports());
    } else {
      dispatch(getEodReports());
    }
  }, [dispatch, isDesigner]);

  const myActiveTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task) => {
      const taskUserId = task.assignedTo?._id || task.assignedTo;
      const currentUserId = user?._id || user?.id;
      const isAssigned = taskUserId === currentUserId;

      const isNotCompleted = task.status !== "Completed";
      const isCompletedToday =
        task.status === "Completed" &&
        task.updatedAt &&
        new Date(task.updatedAt).toDateString() === new Date().toDateString();

      return isAssigned && (isNotCompleted || isCompletedToday);
    });
  }, [tasks, user]);

  useEffect(() => {
    if (reportsList && myActiveTasks.length > 0) {
      const todayStr = new Date().toDateString();
      const submittedTaskNames = reportsList
        .filter((report) => new Date(report.date).toDateString() === todayStr)
        .map((report) => (report.projectsWorkedOn || "").toLowerCase().trim());

      const prefilled = [];
      myActiveTasks.forEach((task) => {
        const taskTitleClean = (task.title || "").toLowerCase().trim();
        if (!submittedTaskNames.includes(taskTitleClean)) {
          prefilled.push({
            tempId: `task-${task._id}`,
            taskSourceId: task._id,
            date: task.createdAt || new Date(),
            clientName: task.project?.client?.companyName || "",
            projectsWorkedOn: task.title || "",
            designCount: "",
            filesSubmitted: "",
            pendingTasks: "",
            reasonForPending: "",
            timeSpentToday: "",
            challengesFaced: "",
            tomorrowPlan: "",
            supportNeeded: "",
            overallStatus: "On Track",
            attachments: [],
            isPreFilled: true,
          });
        }
      });

      setUnsavedRows((prev) => {
        if (prev.length === 0) {
          return prefilled;
        }
        const existingTaskIds = prev.map((r) => r.tempId);
        const filteredPrefilled = prefilled.filter(
          (r) => !existingTaskIds.includes(r.tempId),
        );
        return [...prev, ...filteredPrefilled];
      });
    }
  }, [myActiveTasks, reportsList]);

  const addBlankRow = () => {
    setUnsavedRows((prev) => [
      ...prev,
      {
        tempId: `blank-${Date.now()}-${Math.random()}`,
        date: new Date(),
        clientName: "",
        projectsWorkedOn: "",
        designCount: "",
        filesSubmitted: "",
        pendingTasks: "",
        reasonForPending: "",
        timeSpentToday: "",
        challengesFaced: "",
        tomorrowPlan: "",
        supportNeeded: "",
        overallStatus: "On Track",
        attachments: [],
        isPreFilled: false,
      },
    ]);
  };

  const handleUnsavedChange = (tempId, field, value) => {
    setUnsavedRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleEditChange = (e) => {
    setEditRow({ ...editRow, [e.target.name]: e.target.value });
  };

  const handleCellFileUpload = async (e, rowId, isNewRow) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setUploadingRowId(rowId);
    const data = new FormData();
    data.append("file", file);

    try {
      const uploadUrl = isDesigner
        ? "/designer-eod-reports/upload"
        : "/eod-reports/upload";
      const res = await axiosInstance.post(uploadUrl, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newAttachment = {
        url: res.data.data.url,
        filename: res.data.data.filename,
        fileType: res.data.data.fileType,
      };

      if (isNewRow) {
        setUnsavedRows((prev) =>
          prev.map((row) =>
            row.tempId === rowId
              ? { ...row, attachments: [...row.attachments, newAttachment] }
              : row,
          ),
        );
      } else {
        setEditRow((prev) => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      }
      toast.success("File attached successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading file");
    } finally {
      setUploadingRowId(null);
    }
  };

  const saveUnsavedRow = async (tempId) => {
    const row = unsavedRows.find((r) => r.tempId === tempId);
    if (!row) return;

    if (
      !row.clientName ||
      !row.projectsWorkedOn ||
      !row.timeSpentToday ||
      !row.tomorrowPlan
    ) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    if (isDesigner && !row.designCount) {
      toast.error("Please fill in number of designs completed *");
      return;
    }

    const payload = { ...row };
    const taskDate = getTaskCreationDate(row.projectsWorkedOn);
    if (taskDate) {
      payload.date = taskDate;
    }
    delete payload.tempId;
    delete payload.isPreFilled;
    delete payload.taskSourceId;
    if (!isDesigner) {
      delete payload.designCount;
      delete payload.filesSubmitted;
    }

    try {
      if (isDesigner) {
        await dispatch(createDesignerEodReport(payload)).unwrap();
      } else {
        await dispatch(createEodReport(payload)).unwrap();
      }
      setUnsavedRows((prev) => prev.filter((r) => r.tempId !== tempId));
    } catch (err) {
      toast.error(err || "Failed to save EOD report");
    }
  };

  const saveEditedRow = async (id) => {
    if (
      !editRow.clientName ||
      !editRow.projectsWorkedOn ||
      !editRow.timeSpentToday ||
      !editRow.tomorrowPlan
    ) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    if (isDesigner && !editRow.designCount) {
      toast.error("Please fill in number of designs completed *");
      return;
    }

    const payload = { ...editRow };
    const taskDate = getTaskCreationDate(editRow.projectsWorkedOn);
    if (taskDate) {
      payload.date = taskDate;
    }
    if (!isDesigner) {
      delete payload.designCount;
      delete payload.filesSubmitted;
    }

    try {
      if (isDesigner) {
        await dispatch(updateDesignerEodReport({ id, data: payload })).unwrap();
      } else {
        await dispatch(updateEodReport({ id, data: payload })).unwrap();
      }
      setEditingId(null);
      setEditRow(null);
    } catch (err) {
      toast.error(err || "Failed to update EOD report");
    }
  };

  const deleteUnsavedRow = (tempId) => {
    setUnsavedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const handleDeleteRow = (id) => {
    if (window.confirm("Are you sure you want to delete this EOD entry?")) {
      if (isDesigner) {
        dispatch(deleteDesignerEodReport(id));
      } else {
        dispatch(deleteEodReport(id));
      }
    }
  };

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
        return "bg-blue-50 text-blue-655 border border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "Delayed":
        return "bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      case "Blocked":
        return "bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      default:
        return "bg-slate-50 text-slate-655 border border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-450 dark:border-slate-500/20";
    }
  };

  const getTrackedTimeForTitle = useCallback((title) => {
    if (!title) return null;
    const task = tasks.find(
      (t) => (t.title || "").toLowerCase().trim() === title.toLowerCase().trim()
    );
    if (!task || !task.actualStartTime) return null;
    const start = new Date(task.actualStartTime).getTime();
    const end = task.actualEndTime ? new Date(task.actualEndTime).getTime() : Date.now();
    const elapsed = Math.max(0, Math.floor((end - start) / 1000));
    if (elapsed <= 0) return null;
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [tasks]);

  const getTaskCreationDate = useCallback((title) => {
    if (!title) return null;
    const task = tasks.find(
      (t) => (t.title || "").toLowerCase().trim() === title.toLowerCase().trim()
    );
    return task ? task.createdAt : null;
  }, [tasks]);

  // UNIFIED ROWS CALCULATOR
  // Keeps rows perfectly on the same line index when transition occurs from unsaved to saved.
  const unifiedRows = useMemo(() => {
    const finalRows = [];
    const processedReportIds = new Set();
    const processedUnsavedIds = new Set();

    // 1. Match tasks from myActiveTasks in order:
    myActiveTasks.forEach((task) => {
      const taskTitleClean = (task.title || "").toLowerCase().trim();

      const savedReport = (reportsList || []).find(
        (r) =>
          (r.projectsWorkedOn || "").toLowerCase().trim() === taskTitleClean,
      );

      if (savedReport) {
        finalRows.push({
          ...savedReport,
          isSaved: true,
          keyId: savedReport._id,
        });
        processedReportIds.add(savedReport._id);
      } else {
        const unsavedRow = unsavedRows.find((r) => r.taskSourceId === task._id);
        if (unsavedRow) {
          finalRows.push({
            ...unsavedRow,
            isSaved: false,
            keyId: unsavedRow.tempId,
          });
          processedUnsavedIds.add(unsavedRow.tempId);
        }
      }
    });

    // 2. Add remaining saved reports (not matched to active tasks)
    (reportsList || []).forEach((report) => {
      if (!processedReportIds.has(report._id)) {
        finalRows.push({ ...report, isSaved: true, keyId: report._id });
      }
    });

    // 3. Add remaining unsaved custom/blank rows
    unsavedRows.forEach((row) => {
      if (!processedUnsavedIds.has(row.tempId) && !row.isPreFilled) {
        finalRows.push({ ...row, isSaved: false, keyId: row.tempId });
      }
    });

    return finalRows;
  }, [reportsList, myActiveTasks, unsavedRows]);

  const unsubmittedRows = useMemo(() => {
    return unifiedRows.filter((row) => !row.isSaved);
  }, [unifiedRows]);

  const submittedRows = useMemo(() => {
    return unifiedRows.filter((row) => row.isSaved);
  }, [unifiedRows]);

  const itemsPerPage = 4;

  const totalPages = Math.ceil(submittedRows.length / itemsPerPage);

  const paginatedSubmittedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return submittedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [submittedRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className="min-h-screen py-5  transition-colors duration-300">
      <div className="max-w-[100%] mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider shadow-sm shadow-emerald-500/10 uppercase">
                EOD Spreadsheet
              </span>
              {isDesigner && (
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider shadow-sm uppercase">
                  Designer Panel
                </span>
              )}
            </div>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1.5">
              Daily End of Day Reports
            </h1>
           
          </div>

          {!isDesigner && (
            <button
              onClick={addBlankRow}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:scale-[0.98]"
            >
              <FiPlus size={14} className="stroke-[3]" />
              Add Blank Row
            </button>
          )}
        </div>

        {/* TABLE 1: UNSUBMITTED / PENDING REPORTS */}
        <div className="bg-white dark:bg-[#111827] shadow-lg rounded-xl border border-slate-200/80 dark:border-slate-800/85 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">
                Unsubmitted EOD Reports
              </h2>
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-250/20">
                {unsubmittedRows.length} Pending
              </span>
            </div>
            {!isDesigner && (
              <button
                onClick={addBlankRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <FiPlus size={13} className="stroke-[3]" />
                Add Blank Row
              </button>
            )}
          </div>

          <div className="overflow-auto custom-scrollbar max-h-[400px] border border-slate-200/60 dark:border-slate-800/60 rounded-lg bg-white dark:bg-black">
            <table className="eod-grid-table text-left table-auto w-full">
              <thead>
                <tr className="sticky top-0 z-10 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="w-[45px] min-w-[45px] text-center bg-slate-100/50 dark:bg-slate-850/50 py-3"></th>
                  <th className="min-w-[120px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="min-w-[180px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Name *</th>
                  <th className="min-w-[280px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projects Worked On *</th>
                  {isDesigner && (
                    <>
                      <th className="min-w-[160px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Designs Completed *</th>
                      <th className="min-w-[220px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted Links</th>
                    </>
                  )}
                  <th className="min-w-[200px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Tasks</th>
                  <th className="min-w-[200px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason for Pending</th>
                  <th className="min-w-[130px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time Spent *</th>
                  <th className="min-w-[200px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Challenges Faced</th>
                  <th className="min-w-[280px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tomorrow Plan *</th>
                  <th className="min-w-[180px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Support Needed</th>
                  <th className="min-w-[160px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Status *</th>
                  <th className="min-w-[95px] px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {unsubmittedRows.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumnsCount + 2} className="text-center py-10 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
                      No unsubmitted EOD reports. All task reports have been submitted.
                    </td>
                  </tr>
                ) : (
                  unsubmittedRows.map((row, index) => {
                    const excelIndex = index + 1;
                    const trackedTime = getTrackedTimeForTitle(row.projectsWorkedOn);
                    return (
                      <tr key={row.keyId} className="bg-emerald-50/5 dark:bg-emerald-950/5 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-colors group">
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 text-center text-[10px] text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-850/50 select-none py-3">{excelIndex}</td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 px-3 py-3 text-xs text-slate-550 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-850/30 font-semibold select-none">
                          {new Date(row.date || new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.clientName} onChange={(e) => handleUnsavedChange(row.keyId, "clientName", e.target.value)} placeholder="Client *" disabled={row.isPreFilled} className="eod-grid-input" />
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.projectsWorkedOn} onChange={(e) => handleUnsavedChange(row.keyId, "projectsWorkedOn", e.target.value)} placeholder="Task Name *" disabled={row.isPreFilled} className="eod-grid-input font-semibold" />
                        </td>
                        {isDesigner && (
                          <>
                            <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                              <input type="text" value={row.designCount} onChange={(e) => handleUnsavedChange(row.keyId, "designCount", e.target.value)} placeholder="Count *" className="eod-grid-input font-semibold" />
                            </td>
                            <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                              <input type="text" value={row.filesSubmitted} onChange={(e) => handleUnsavedChange(row.keyId, "filesSubmitted", e.target.value)} placeholder="Links (optional)" className="eod-grid-input text-blue-600 dark:text-blue-400" />
                            </td>
                          </>
                        )}
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.pendingTasks} onChange={(e) => handleUnsavedChange(row.keyId, "pendingTasks", e.target.value)} placeholder="Pending work" className="eod-grid-input" />
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.reasonForPending} onChange={(e) => handleUnsavedChange(row.keyId, "reasonForPending", e.target.value)} placeholder="Reason" className="eod-grid-input" />
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <div className="flex flex-col items-start gap-1 p-1">
                            <input type="text" value={row.timeSpentToday} onChange={(e) => handleUnsavedChange(row.keyId, "timeSpentToday", e.target.value)} placeholder="Hours *" className="eod-grid-input font-bold" />
                            {trackedTime && (
                              <button type="button" onClick={() => handleUnsavedChange(row.keyId, "timeSpentToday", trackedTime)} className="inline-flex items-center gap-1 text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-150 dark:border-indigo-900/40 transition-all cursor-pointer whitespace-nowrap" title="Click to apply hours tracked in My Tasks">
                                <FiClock size={10} /> Use Tracked: {trackedTime}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.challengesFaced} onChange={(e) => handleUnsavedChange(row.keyId, "challengesFaced", e.target.value)} placeholder="Challenges" className="eod-grid-input" />
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.tomorrowPlan} onChange={(e) => handleUnsavedChange(row.keyId, "tomorrowPlan", e.target.value)} placeholder="Tomorrow plan *" className="eod-grid-input" />
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <input type="text" value={row.supportNeeded} onChange={(e) => handleUnsavedChange(row.keyId, "supportNeeded", e.target.value)} placeholder="Support needed" className="eod-grid-input" />
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <select value={row.overallStatus} onChange={(e) => handleUnsavedChange(row.keyId, "overallStatus", e.target.value)} className="eod-grid-select">
                            <option value="On Track">On Track</option>
                            <option value="Completed">Completed</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </td>
                        <td className="p-1.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button type="button" onClick={() => saveUnsavedRow(row.keyId)} title="Save to database" className="w-6.5 h-6.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-sm hover:scale-[1.05]">
                              <FiCheck size={14} className="stroke-[2.5]" />
                            </button>
                            <button type="button" onClick={() => deleteUnsavedRow(row.keyId)} title="Discard row" className="w-6.5 h-6.5 rounded-lg bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center justify-center transition-all shadow-sm hover:scale-[1.05]">
                              <FiX size={14} className="stroke-[2.5]" />
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
        </div>

        {/* TABLE 2: SUBMITTED EOD REPORTS WITH PAGINATION */}
        <div className="bg-white dark:bg-[#111827] shadow-lg rounded-xl border border-slate-200/80 dark:border-slate-800/85 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">
                Submitted EOD Reports
              </h2>
              <span className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-250/20">
                {submittedRows.length} Saved
              </span>
            </div>
          </div>

          <div className="overflow-auto custom-scrollbar max-h-[500px] border border-slate-200/60 dark:border-slate-800/60 rounded-lg bg-white dark:bg-black">
            <table className="eod-grid-table text-left table-auto w-full">
              <thead>
                <tr className="sticky top-0 z-10 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="w-[45px] min-w-[45px] text-center bg-slate-100/50 dark:bg-slate-850/50 py-3"></th>
                  <th className="min-w-[120px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="min-w-[180px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Name *</th>
                  <th className="min-w-[280px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projects Worked On *</th>
                  {isDesigner && (
                    <>
                      <th className="min-w-[160px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Designs Completed *</th>
                      <th className="min-w-[220px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted Links</th>
                    </>
                  )}
                  <th className="min-w-[200px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Tasks</th>
                  <th className="min-w-[200px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason for Pending</th>
                  <th className="min-w-[130px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time Spent *</th>
                  <th className="min-w-[200px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Challenges Faced</th>
                  <th className="min-w-[280px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tomorrow Plan *</th>
                  <th className="min-w-[180px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Support Needed</th>
                  <th className="min-w-[160px] border-r border-slate-200/80 dark:border-slate-800/80 px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Status *</th>
                  <th className="min-w-[95px] px-3.5 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={totalColumnsCount + 2} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-slate-350 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Loading database records...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSubmittedRows.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumnsCount + 2} className="text-center py-10 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
                      No submitted EOD reports found.
                    </td>
                  </tr>
                ) : (
                  paginatedSubmittedRows.map((row, index) => {
                    const isEditing = editingId === row.keyId;
                    const excelIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    const trackedTime = getTrackedTimeForTitle(row.projectsWorkedOn);

                    if (isEditing) {
                      return (
                        <tr key={row.keyId} className="bg-amber-500/5 dark:bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 text-center text-[10px] text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-850/50 select-none py-3">{excelIndex}</td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 px-3 py-3 text-xs text-slate-550 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-850/30 font-semibold select-none">
                            {new Date(getTaskCreationDate(editRow.projectsWorkedOn) || editRow.date || new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="clientName" value={editRow.clientName} onChange={handleEditChange} disabled={isDesigner} className="eod-grid-input" />
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="projectsWorkedOn" value={editRow.projectsWorkedOn} onChange={handleEditChange} disabled={isDesigner} className="eod-grid-input font-semibold" />
                          </td>
                          {isDesigner && (
                            <>
                              <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                                <input type="text" name="designCount" value={editRow.designCount} onChange={handleEditChange} className="eod-grid-input font-semibold" />
                              </td>
                              <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                                <input type="text" name="filesSubmitted" value={editRow.filesSubmitted} onChange={handleEditChange} className="eod-grid-input text-blue-600 dark:text-blue-400" />
                              </td>
                            </>
                          )}
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="pendingTasks" value={editRow.pendingTasks} onChange={handleEditChange} className="eod-grid-input" />
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="reasonForPending" value={editRow.reasonForPending} onChange={handleEditChange} className="eod-grid-input" />
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <div className="flex flex-col items-start gap-1 p-1">
                              <input type="text" name="timeSpentToday" value={editRow.timeSpentToday} onChange={handleEditChange} className="eod-grid-input font-bold" />
                              {trackedTime && (
                                <button type="button" onClick={() => setEditRow({ ...editRow, timeSpentToday: trackedTime })} className="inline-flex items-center gap-1 text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-150 dark:border-indigo-900/40 transition-all cursor-pointer whitespace-nowrap" title="Click to apply hours tracked in My Tasks">
                                  <FiClock size={10} /> Use Tracked: {trackedTime}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="challengesFaced" value={editRow.challengesFaced} onChange={handleEditChange} className="eod-grid-input" />
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="tomorrowPlan" value={editRow.tomorrowPlan} onChange={handleEditChange} className="eod-grid-input" />
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <input type="text" name="supportNeeded" value={editRow.supportNeeded} onChange={handleEditChange} className="eod-grid-input" />
                          </td>
                          <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                            <select name="overallStatus" value={editRow.overallStatus} onChange={handleEditChange} className="eod-grid-select">
                              <option value="On Track">On Track</option>
                              <option value="Completed">Completed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Delayed">Delayed</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          </td>
                          <td className="p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button type="button" onClick={() => saveEditedRow(row.keyId)} title="Save Updates" className="w-6.5 h-6.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-sm hover:scale-[1.05]">
                                <FiCheck size={14} className="stroke-[2.5]" />
                              </button>
                              <button type="button" onClick={() => { setEditingId(null); setEditRow(null); }} title="Cancel" className="w-6.5 h-6.5 rounded-lg bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center justify-center transition-all shadow-sm hover:scale-[1.05]">
                                <FiX size={14} className="stroke-[2.5]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={row.keyId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 text-center text-[10px] text-slate-400 font-bold bg-slate-50/30 dark:bg-slate-850/30 select-none"><div className="eod-grid-value-cell justify-center">{excelIndex}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0 text-slate-500 dark:text-slate-400 font-semibold select-none">
                          <div className="eod-grid-value-cell">
                            {new Date(getTaskCreationDate(row.projectsWorkedOn) || row.date || row.createdAt || new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell font-bold text-slate-800 dark:text-slate-250 truncate max-w-[180px]">{row.clientName || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell font-bold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">{row.projectsWorkedOn || "-"}</div></td>
                        {isDesigner && (
                          <>
                            <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell font-bold text-center justify-center">{row.designCount || "-"}</div></td>
                            <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                              <div className="eod-grid-value-cell text-blue-600 dark:text-blue-400 truncate max-w-[220px]">
                                {row.filesSubmitted ? <a href={row.filesSubmitted} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-1"><FiPaperclip size={10} /> Link</a> : "-"}
                              </div>
                            </td>
                          </>
                        )}
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{row.pendingTasks || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{row.reasonForPending || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell font-bold text-slate-800 dark:text-slate-250">{row.timeSpentToday || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell text-slate-655 dark:text-slate-400 truncate max-w-[200px]">{row.challengesFaced || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell text-slate-655 dark:text-slate-400 truncate max-w-[280px]">{row.tomorrowPlan || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0"><div className="eod-grid-value-cell text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{row.supportNeeded || "-"}</div></td>
                        <td className="border-r border-slate-200/60 dark:border-slate-800/60 p-0">
                          <div className="eod-grid-value-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${getStatusBadgeStyle(row.overallStatus)}`}>{row.overallStatus || "Completed"}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleView(row)} title="View Details" className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><FiEye size={13} className="stroke-[2.5]" /></button>
                            <button onClick={() => { setEditingId(row.keyId); setEditRow({ ...row }); }} title="Edit Entry" className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"><FiEdit2 size={13} className="stroke-[2.5]" /></button>
                            <button onClick={() => handleDeleteRow(row.keyId)} title="Delete Entry" className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"><FiTrash2 size={13} className="stroke-[2.5]" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION UI */}
          {!loading && submittedRows.length > itemsPerPage && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, submittedRows.length)}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{submittedRows.length}</span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
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
                          type="button"
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
                  type="button"
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

        {openViewModal && selectedReport && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 w-full max-w-[600px] rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="text-left">
                  <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {isDesigner ? "Designer " : ""}EOD Report Entry Details
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-555 font-semibold mt-0.5">
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
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar text-left text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">
                      Client Name
                    </span>
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {selectedReport.clientName || "-"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                      Projects Worked On (Task Name)
                    </span>
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {selectedReport.projectsWorkedOn || "-"}
                    </p>
                  </div>

                  {selectedReport.designCount !== undefined && (
                    <div>
                      <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                        Designs Completed
                      </span>
                      <p className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {selectedReport.designCount || "-"}
                      </p>
                    </div>
                  )}
                  {selectedReport.filesSubmitted !== undefined && (
                    <div>
                      <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                        Links Submitted
                      </span>
                      <p className="text-[12px] font-bold text-slate-700 dark:text-slate-350 mt-0.5 truncate">
                        {selectedReport.filesSubmitted || "-"}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                      Pending Tasks
                    </span>
                    <p className="text-[12.5px] font-medium text-slate-750 dark:text-slate-300 mt-0.5 whitespace-pre-line leading-relaxed">
                      {selectedReport.pendingTasks || "None"}
                    </p>
                  </div>
                  {selectedReport.reasonForPending && (
                    <div className="sm:col-span-2">
                      <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                        Reason for Pending Work
                      </span>
                      <p className="text-[12.5px] font-medium text-slate-750 dark:text-slate-300 mt-0.5">
                        {selectedReport.reasonForPending}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                      Time Spent Today
                    </span>
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedReport.timeSpentToday || "-"}
                    </p>
                  </div>
                  {selectedReport.challengesFaced && (
                    <div className="sm:col-span-2">
                      <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                        Challenges Faced
                      </span>
                      <p className="text-[12.5px] font-medium text-slate-750 dark:text-slate-300 mt-0.5">
                        {selectedReport.challengesFaced}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                      Tomorrow Plan
                    </span>
                    <p className="text-[12.5px] font-medium text-slate-750 dark:text-slate-300 mt-0.5 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      {selectedReport.tomorrowPlan}
                    </p>
                  </div>
                  {selectedReport.supportNeeded && (
                    <div className="sm:col-span-2">
                      <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                        Support Needed
                      </span>
                      <p className="text-[12.5px] font-medium text-slate-750 dark:text-slate-300 mt-0.5">
                        {selectedReport.supportNeeded}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-black text-slate-455 dark:text-slate-555 uppercase tracking-widest block">
                      Overall Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${getStatusBadgeStyle(selectedReport.overallStatus)}`}
                    >
                      {selectedReport.overallStatus || "Completed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setOpenViewModal(false)}
                  className="px-4 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-650 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EodReports;
