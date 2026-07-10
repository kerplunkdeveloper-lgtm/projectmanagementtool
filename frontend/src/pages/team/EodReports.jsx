import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetTasksQuery, useGetProjectsQuery } from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import {
  getDesignerEodReports,
  createDesignerEodReport,
  updateDesignerEodReport,
} from "../../features/eodReports/designerEodReportSlice";
import {
  FiCalendar,
  FiClock,
  FiLink,
  FiUser,
  FiAlertCircle,
  FiTool,
  FiPhone,
  FiCheckCircle,
} from "react-icons/fi";

// Helper: get priority badge colors based on priority value
const getPriorityStyle = (priority) => {
  const p = priority?.toLowerCase() || "";
  if (p.includes("top high"))
    return "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30";
  if (p.includes("high"))
    return "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30";
  if (p.includes("medium"))
    return "bg-blue-55/60 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
  if (p.includes("low"))
    return "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
  return "bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
};

const formatElapsed = (startTime, endTime) => {
  if (!startTime) return "";
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const elapsed = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

// Helper: map task board status to EOD status enum
const mapTaskStatusToEodStatus = (status) => {
  return status || "Pending";
};

const getStatusBadgeStyle = (status) => {
  const s = (status || "Pending").toUpperCase();
  switch (s) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
    case "IN PROGRESS":
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-600 border-blue-200/50 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/30";
    case "IN-REVIEW":
    case "IN REVIEW":
    case "IN_REVIEW":
      return "bg-purple-50 text-purple-600 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
    case "ON HOLD":
    case "ON_HOLD":
      return "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
    case "REJECTED":
      return "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
    default: // Pending
      return "bg-slate-50 text-slate-655 border border-slate-200/60 dark:bg-slate-900/10 dark:text-slate-400 dark:border-slate-800/60";
  }
};

const calculateTotalLoggedTime = (tasks) => {
  let totalMinutes = 0;
  tasks.forEach((t) => {
    const timeStr = t.time || "";
    const hoursMatch = timeStr.match(/(\d+)\s*h/i);
    const minsMatch = timeStr.match(/(\d+)\s*m/i);
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    }
    if (minsMatch) {
      totalMinutes += parseInt(minsMatch[1], 10);
    }
  });
  
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
};

const EodReports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { designerEodReports, loading: reportLoading } = useSelector((state) => state.designerEodReports);

  const { data: allTasks = [], isLoading: tasksLoading } = useGetTasksQuery();
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();

  // State fields
  const [tasksState, setTasksState] = useState([]);
  const [daySummary, setDaySummary] = useState({
    toolsIssues: "",
    clientCalls: "",
    anythingElseOps: "",
  });
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [overallStatus, setOverallStatus] = useState("On Track");
  const [reportId, setReportId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch users and designer EOD report for today
  useEffect(() => {
    dispatch(getUsers());
    const todayStr = new Date().toISOString().split("T")[0];
    dispatch(getDesignerEodReports({ date: todayStr }));
  }, [dispatch]);

  // Filter tasks assigned to me
  const myTasks = React.useMemo(() => {
    return allTasks.filter((task) => {
      const assigneeId = task.assignedTo?._id || task.assignedTo;
      return assigneeId === (user?._id || user?.id);
    });
  }, [allTasks, user]);

  // Generate task display ID (e.g. WBLT1)
  const getTaskDisplayId = (task) => {
    if (!task || !task._id) return "";
    
    const projId = task.project?._id || task.project;
    const projectObj = projects.find((p) => p._id === projId);
    
    const projChar = (projectObj?.name || task.project?.name || "P").charAt(0).toUpperCase();
    
    const client = projectObj?.client || task.project?.client;
    const clientName = client?.companyName || "";
    const clientChars = clientName ? clientName.substring(0, 2).toUpperCase().padEnd(2, "X") : "XX";

    const projectTasks = allTasks.filter(
      (t) => (t.project?._id || t.project) === projId
    );

    const sortedByCreation = [...projectTasks].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a._id || "").localeCompare(b._id || "");
    });

    const idx = sortedByCreation.findIndex((t) => t._id === task._id);
    const num = idx !== -1 ? idx + 1 : 1;
    return `${projChar}${clientChars}T${num}`;
  };

  // Find today's report
  const todayReport = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return designerEodReports?.find((report) => {
      const reportDate = new Date(report.date).toISOString().split("T")[0];
      return reportDate === todayStr;
    });
  }, [designerEodReports]);

  // Reviewers list (admin and operation managers)
  const reviewers = React.useMemo(() => {
    return users.filter((u) => u.role === "admin" || u.role === "operationmanager");
  }, [users]);

  // Populate form state when EOD Report or tasks load
  useEffect(() => {
    if (todayReport) {
      setReportId(todayReport._id);
      setIsSubmitted(!todayReport.isDraft);
      setDaySummary({
        toolsIssues: todayReport.daySummary?.toolsIssues || "",
        clientCalls: todayReport.daySummary?.clientCalls || "",
        anythingElseOps: todayReport.daySummary?.anythingElseOps || "",
      });
      setTomorrowPlan(todayReport.tomorrowPlan || "");
      setOverallStatus(todayReport.overallStatus || "On Track");

      if (todayReport.tasks && todayReport.tasks.length > 0) {
        setTasksState(
          todayReport.tasks.map((t) => {
            const correspondingTask = myTasks.find((mt) => mt._id === (t.taskId?._id || t.taskId));
            const actualStatus = correspondingTask ? mapTaskStatusToEodStatus(correspondingTask.status) : (t.statusAtEod || "Pending");
            const taskCode = correspondingTask ? getTaskDisplayId(correspondingTask) : "";
            
            return {
              id: t.taskId || t._id,
              taskId: t.taskId?._id || t.taskId || t._id,
              title: t.title,
              project: t.project,
              priority: t.priority,
              contentType: t.contentType || "",
              client: t.client,
              revision: t.revisions || 0,
              time: t.loggedTime || "",
              statusAtEod: actualStatus,
              outputLink: t.outputLink || "",
              reason: t.reason || "",
              nextAction: t.nextAction || "",
              reviewedBy: t.reviewedBy?._id || t.reviewedBy || "",
              code: taskCode,
            };
          })
        );
      }
    } else if (myTasks.length > 0) {
      setTasksState(
        myTasks.map((t) => {
          const clientName = t.project?.client?.companyName || "Internal";
          const projectName = t.project?.name || "Internal";
          const elapsedStr = formatElapsed(t.actualStartTime, t.actualEndTime);
          const taskCode = getTaskDisplayId(t);

          return {
            id: t._id,
            taskId: t._id,
            title: t.title,
            project: projectName,
            priority: t.priority,
            contentType: t.contentType || "",
            client: clientName,
            revision: t.revisions || 0,
            time: elapsedStr,
            statusAtEod: mapTaskStatusToEodStatus(t.status),
            outputLink: "",
            reason: "",
            nextAction: "",
            reviewedBy: "",
            code: taskCode,
          };
        })
      );
      setReportId(null);
      setIsSubmitted(false);
    }
  }, [todayReport, myTasks, projects]);

  // Sync task status, code, and elapsed time dynamically from allTasks/myTasks
  useEffect(() => {
    if (myTasks.length > 0 && tasksState.length > 0 && projects.length > 0) {
      setTasksState((prev) =>
        prev.map((t) => {
          const correspondingTask = myTasks.find((mt) => mt._id === t.taskId);
          if (correspondingTask) {
            const mappedStatus = mapTaskStatusToEodStatus(correspondingTask.status);
            const elapsedStr = formatElapsed(correspondingTask.actualStartTime, correspondingTask.actualEndTime);
            const taskCode = getTaskDisplayId(correspondingTask);
            
            if (
              t.statusAtEod !== mappedStatus ||
              t.time !== elapsedStr ||
              t.code !== taskCode
            ) {
              return {
                ...t,
                statusAtEod: mappedStatus,
                time: elapsedStr,
                code: taskCode,
              };
            }
          }
          return t;
        })
      );
    }
  }, [myTasks, projects]);

  const updateTask = (taskId, field, value) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const handleSave = async (isDraftSubmit) => {
    const payload = {
      date: new Date().toISOString(),
      isDraft: isDraftSubmit,
      tasks: tasksState.map((t) => ({
        taskId: t.taskId,
        title: t.title,
        project: t.project,
        priority: t.priority,
        contentType: t.contentType,
        client: t.client,
        revisions: t.revision,
        loggedTime: t.time,
        statusAtEod: t.statusAtEod,
        outputLink: t.outputLink,
        reason: t.reason,
        nextAction: t.nextAction,
        reviewedBy: t.reviewedBy || undefined,
      })),
      daySummary,
      tomorrowPlan,
      overallStatus,
    };

    try {
      if (reportId) {
        await dispatch(updateDesignerEodReport({ id: reportId, data: payload })).unwrap();
      } else {
        await dispatch(createDesignerEodReport(payload)).unwrap();
      }
      const todayStr = new Date().toISOString().split("T")[0];
      dispatch(getDesignerEodReports({ date: todayStr }));
    } catch (err) {
      console.error("Failed to save report:", err);
    }
  };

  // Dynamic stats
  const totalTasks = tasksState.length;
  const completedCount = tasksState.filter((t) => t.statusAtEod === "Completed").length;
  const rejectedCount = tasksState.filter((t) => t.statusAtEod === "Rejected").length;
  const inProgressCount = tasksState.filter((t) => t.statusAtEod === "In Progress").length;
  const onHoldCount = tasksState.filter((t) => t.statusAtEod === "On Hold").length;
  const inReviewCount = tasksState.filter((t) => ["IN-REVIEW", "In Review", "IN-Review"].includes(t.statusAtEod)).length;
  const pendingCount = Math.max(0, totalTasks - completedCount - rejectedCount - inProgressCount - onHoldCount - inReviewCount);

  if (tasksLoading || reportLoading || projectsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading your EOD task data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl  mx-auto">
      {/* Header Card */}
      <div className="theme-bg-card  ">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-md font-bold theme-text-primary text-left">
              Today's Tasks — {user?.name || "Member"}  
            </h1>
            <p className="theme-text-secondary text-xs font-semibold mt-1 text-left">
              Review and submit EOD reports for tasks assigned to you today.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border theme-border px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 self-start lg:self-auto">
            <FiCalendar className="shrink-0 text-slate-400" />
            <span className="font-semibold text-xs">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {tasksState.length === 0 ? (
        <div className="mt-8 theme-bg-card border border-dashed theme-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 border theme-border">
            <FiCheckCircle size={22} />
          </div>
          <h3 className="font-bold theme-text-primary mt-4 text-sm">No Active Tasks</h3>
          <p className="text-xs theme-text-secondary mt-1 max-w-xs">
            You don't have any tasks assigned for today. Go to Tasks board to pick up new work.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tasksState.map((task) => (
            <div
              key={task.id}
              className="theme-bg-card border theme-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 text-left"
            >
              {/* Task Top Meta info */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-sm theme-text-primary">
                    {task.code ? `${task.code} ` : ""}{task.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span className="bg-slate-100 text-slate-600 border border-slate-200/40 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {task.client}
                    </span>
                    {task.contentType && (
                      <span className="bg-purple-50 text-purple-650 border border-purple-200/30 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {task.contentType}
                      </span>
                    )}
                    {task.time && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-150 rounded-md text-[10px] font-bold dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                        <FiClock size={10} className="shrink-0" />
                        <span>Time spent: {task.time}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span
                    className={`${getPriorityStyle(
                      task.priority
                    )} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Rev. {task.revision}
                  </span>
                </div>
              </div>

              {/* Form Layout: Perfectly aligned fields inside EOD cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t theme-border">
                {/* EOD Status */}
                <div>
                  <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                    Status
                  </label>
                  <div
                    className={`w-full mt-1.5 border rounded-xl px-3 py-2.5 text-xs font-semibold select-none flex items-center justify-between transition-all duration-300 ${getStatusBadgeStyle(task.statusAtEod)}`}
                  >
                    <span>{task.statusAtEod || "Pending"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Derived from task status on Task board
                  </p>
                </div>

                {/* Reviewer select */}
                <div>
                  <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                    Reviewed By
                  </label>
                  <select
                    className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                    value={task.reviewedBy}
                    onChange={(e) => updateTask(task.id, "reviewedBy", e.target.value)}
                    disabled={isSubmitted}
                  >
                    <option value="">Select Reviewer</option>
                    {reviewers.map((rev) => (
                      <option key={rev._id} value={rev._id}>
                        {rev.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic field rows depending on the status */}
                {task.statusAtEod === "Completed" ? (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                      Output Link
                    </label>
                    <div className="relative mt-1.5">
                      <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        type="url"
                        placeholder="Paste output link (e.g. Figma, Behance, Drive)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                        value={task.outputLink || ""}
                        onChange={(e) => updateTask(task.id, "outputLink", e.target.value)}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                        Reason for {task.statusAtEod}
                      </label>
                      <input
                        type="text"
                        placeholder={`Why is it ${task.statusAtEod.toLowerCase()}?`}
                        className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                        value={task.reason || ""}
                        onChange={(e) => updateTask(task.id, "reason", e.target.value)}
                        disabled={isSubmitted}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                        Next Action
                      </label>
                      <input
                        type="text"
                        placeholder="What is the next plan?"
                        className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                        value={task.nextAction || ""}
                        onChange={(e) => updateTask(task.id, "nextAction", e.target.value)}
                        disabled={isSubmitted}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================
                      DAY SUMMARY
      ========================================= */}
      <div className="theme-bg-card border theme-border rounded-2xl mt-8 p-6 text-left shadow-sm">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div>
            <h2 className="text-md font-bold theme-text-primary">EOD REPORT</h2>
           
          </div>
          <span className="text-[10px] font-bold text-slate-400 ">
            Submitted once, covers all tasks
          </span>
        </div>

        {/* eod card  */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2 mb-3">
          {/* Completed Card */}
          <div className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/15 dark:to-emerald-900/5 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 block">
              {completedCount}
            </span>
            <span className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-450/80 mt-1 block">
              Completed
            </span>
          </div>

          {/* In Progress Card */}
          <div className="bg-gradient-to-br from-blue-50/60 to-blue-100/30 dark:from-blue-950/15 dark:to-blue-900/5 border border-blue-100/50 dark:border-blue-900/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-2xl font-bold tracking-tight text-blue-650 dark:text-blue-400 block">
              {inProgressCount}
            </span>
            <span className="text-[11px] font-semibold text-blue-800/80 dark:text-blue-450/80 mt-1 block">
              In Progress
            </span>
          </div>

          {/* In Review Card */}
          <div className="bg-gradient-to-br from-purple-50/60 to-purple-100/30 dark:from-purple-950/15 dark:to-purple-900/5 border border-purple-100/50 dark:border-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-2xl font-bold tracking-tight text-purple-650 dark:text-purple-400 block">
              {inReviewCount}
            </span>
            <span className="text-[11px] font-semibold text-purple-800/80 dark:text-purple-450/80 mt-1 block">
              In Review
            </span>
          </div>

          {/* On Hold Card */}
          <div className="bg-gradient-to-br from-amber-50/60 to-amber-100/30 dark:from-amber-950/15 dark:to-amber-900/5 border border-amber-100/50 dark:border-amber-900/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 block">
              {onHoldCount}
            </span>
            <span className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-450/80 mt-1 block">
              On Hold
            </span>
          </div>

          {/* Rejected Card */}
          <div className="bg-gradient-to-br from-rose-50/60 to-rose-100/30 dark:from-rose-950/15 dark:to-rose-900/5 border border-rose-100/50 dark:border-rose-900/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-2xl font-bold tracking-tight text-rose-650 dark:text-rose-455 block">
              {rejectedCount}
            </span>
            <span className="text-[11px] font-semibold text-rose-800/80 dark:text-rose-450/80 mt-1 block">
              Rejected
            </span>
          </div>

          {/* Total Logged Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/30 dark:to-slate-800/10 border border-slate-200/50 dark:border-slate-850 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-2xl font-bold tracking-tight theme-text-primary block">
              {calculateTotalLoggedTime(tasksState)}
            </span>
            <span className="text-[11px] font-semibold theme-text-secondary mt-1 block">
              Total Logged
            </span>
          </div>
        </div>

        {/* Dynamic Task Summary List */}
        <div className="border-t theme-border  text-left">
          {/* Completed Today Section */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Completed Today
            </h3>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/40">
              {tasksState.filter((t) => t.statusAtEod === "Completed").length === 0 ? (
                <p className="text-xs theme-text-secondary py-3 italic">No tasks completed today.</p>
              ) : (
                tasksState
                  .filter((t) => t.statusAtEod === "Completed")
                  .map((task) => (
                    <div key={task.id} className="flex justify-between items-center py-3 text-xs">
                      <span className="font-semibold theme-text-primary text-left">
                        {task.client}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="theme-text-secondary font-medium">
                          {task.title} completed
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-650 border border-purple-100/30 text-[10px] font-semibold dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30">
                          {task.revision} {task.revision === 1 ? "revision" : "revisions"}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Pending / In Progress Section */}
          <div className="mt-4 border-t theme-border ">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Pending / In Progress
            </h3>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/40">
              {tasksState.filter((t) => t.statusAtEod !== "Completed").length === 0 ? (
                <p className="text-xs theme-text-secondary py-3 italic">No pending tasks today.</p>
              ) : (
                tasksState
                  .filter((t) => t.statusAtEod !== "Completed")
                  .map((task) => (
                    <div key={task.id} className="flex justify-between items-center py-3 text-xs">
                      <span className="font-semibold theme-text-primary text-left">
                        {task.client ? `${task.client} ` : ""}{task.title}
                      </span>
                      <span className="theme-text-secondary font-medium">
                        Pending {task.reason ? `— ${task.reason}` : ""}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <div>
            <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
              Tools / Resource Issues
            </label>
            <div className="relative mt-2">
              <FiTool className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                placeholder="e.g Photoshop crashing"
                value={daySummary.toolsIssues}
                onChange={(e) => setDaySummary({ ...daySummary, toolsIssues: e.target.value })}
                disabled={isSubmitted}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
              Client Calls / Briefings
            </label>
            <div className="relative mt-2">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                placeholder="e.g BlackThunder brief"
                value={daySummary.clientCalls}
                onChange={(e) => setDaySummary({ ...daySummary, clientCalls: e.target.value })}
                disabled={isSubmitted}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
              Overall Today's status
            </label>
            <div className="relative mt-2">
              <FiAlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                value={overallStatus}
                onChange={(e) => setOverallStatus(e.target.value)}
                disabled={isSubmitted}
              >
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
              Anything Else Ops Should Know
            </label>
            <textarea
              rows={4}
              placeholder="Operational difficulties, approvals pending etc..."
              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none font-semibold"
              value={daySummary.anythingElseOps}
              onChange={(e) => setDaySummary({ ...daySummary, anythingElseOps: e.target.value })}
              disabled={isSubmitted}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
              Tomorrow Plan
            </label>
            <textarea
              rows={4}
              placeholder="What tasks do you plan to work on tomorrow?"
              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none font-semibold"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              disabled={isSubmitted}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 mt-8 border-t theme-border pt-6">
          <p className="text-xs font-semibold theme-text-secondary">
            {completedCount + pendingCount + rejectedCount} of {totalTasks} tasks logged
          </p>

          {!isSubmitted ? (
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={() => handleSave(true)}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border theme-border theme-text-primary font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave(false)}
                className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/10 cursor-pointer"
              >
                Submit EOD Report
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold">
              <FiCheckCircle />
              Report Submitted for Today
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EodReports;
