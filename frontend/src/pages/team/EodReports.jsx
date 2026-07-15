import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import { format } from "date-fns";
import toast from "react-hot-toast";
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
  FiX,
  FiEdit2,
  FiFileText,
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

// Helper: get unique, high-contrast style for each task code
const getTaskCodeStyle = (code) => {
  if (!code) return { bg: "", text: "" };
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    {
      bg: "bg-indigo-50/80 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
    },
    {
      bg: "bg-rose-50/80 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
    },
    {
      bg: "bg-amber-50/80 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    },
    {
      bg: "bg-emerald-50/80 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    },
    {
      bg: "bg-blue-50/80 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    },
    {
      bg: "bg-purple-50/80 text-purple-650 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
    },
    {
      bg: "bg-cyan-50/80 text-cyan-600 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30",
    },
    {
      bg: "bg-fuchsia-50/80 text-fuchsia-600 border-fuchsia-200 dark:bg-fuchsia-950/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30",
    },
  ];
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
};

const safeFormatDate = (dateStr, formatPattern = "MMM dd, yyyy") => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  try {
    return format(date, formatPattern);
  } catch (e) {
    return dateStr;
  }
};

const safeFormatDateTime = (timeStr, formatPattern = "MMM dd, yyyy h:mm a") => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) {
    return "";
  }
  try {
    return format(date, formatPattern);
  } catch (e) {
    return "";
  }
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
  const { designerEodReports, loading: reportLoading } = useSelector(
    (state) => state.designerEodReports,
  );

  const {
    data: allTasks = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useGetTasksQuery();
  const { data: projects = [], isLoading: projectsLoading } =
    useGetProjectsQuery();

  // State fields
  const [tasksState, setTasksState] = useState([]);
  const [daySummary, setDaySummary] = useState({
    toolsIssues: "None",
    clientCalls: "",
    anythingElseOps: "",
  });
  const [tomorrowPlan, setTomorrowPlan] = useState("None");
  const [overallStatus, setOverallStatus] = useState("On Track");
  const [reportId, setReportId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Fetch users and designer EOD report
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(getDesignerEodReports({ date: selectedDate }));
    }
  }, [dispatch, selectedDate]);

  // Filter tasks assigned to me for the selected date
  const myTasks = React.useMemo(() => {
    return allTasks.filter((task) => {
      const assigneeId = task.assignedTo?._id || task.assignedTo;
      const isAssignedToMe = assigneeId === (user?._id || user?.id);
      if (!isAssignedToMe) return false;

      // Filter strictly by selectedDate
      if (!task.createdAt) return false;

      const taskDate = new Date(task.createdAt);
      const year = taskDate.getFullYear();
      const month = String(taskDate.getMonth() + 1).padStart(2, "0");
      const day = String(taskDate.getDate()).padStart(2, "0");
      const taskDateStr = `${year}-${month}-${day}`;

      return taskDateStr === selectedDate;
    });
  }, [allTasks, user, selectedDate]);

  // Generate task display ID (e.g. WBLT1)
  const getTaskDisplayId = (task) => {
    if (!task || !task._id) return "";

    const projId = task.project?._id || task.project;
    const projectObj = projects.find((p) => p._id === projId);

    const projChar = (projectObj?.name || task.project?.name || "P")
      .charAt(0)
      .toUpperCase();

    const client = projectObj?.client || task.project?.client;
    const clientName = client?.companyName || "";
    const clientChars = clientName
      ? clientName.substring(0, 2).toUpperCase().padEnd(2, "X")
      : "XX";

    const projectTasks = allTasks.filter(
      (t) => (t.project?._id || t.project) === projId,
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

  // Find report for the selected date
  const todayReport = React.useMemo(() => {
    return designerEodReports?.find((report) => {
      const reportDate = new Date(report.date).toISOString().split("T")[0];
      return reportDate === selectedDate;
    });
  }, [designerEodReports, selectedDate]);

  // Populate form state when EOD Report or tasks load
  useEffect(() => {
    if (todayReport) {
      setReportId(todayReport._id);
      setIsSubmitted(!todayReport.isDraft);
      setDaySummary({
        toolsIssues: todayReport.daySummary?.toolsIssues || "None",
        clientCalls: todayReport.daySummary?.clientCalls || "",
        anythingElseOps: todayReport.daySummary?.anythingElseOps || "",
      });
      setTomorrowPlan(todayReport.tomorrowPlan || "None");
      setOverallStatus(todayReport.overallStatus || "On Track");

      if (todayReport.tasks && todayReport.tasks.length > 0) {
        const savedTasks = todayReport.tasks.map((t) => {
          const correspondingTask = myTasks.find(
            (mt) => mt._id === (t.taskId?._id || t.taskId),
          );
          const actualStatus = correspondingTask
            ? mapTaskStatusToEodStatus(correspondingTask.status)
            : t.statusAtEod || "Pending";
          const taskCode = correspondingTask
            ? getTaskDisplayId(correspondingTask)
            : "";

          const creator = correspondingTask?.createdBy || t.reviewedBy;
          const creatorName =
            creator && typeof creator === "object"
              ? creator.name
              : users.find(
                  (u) =>
                    u._id ===
                    (typeof creator === "string" ? creator : creator?._id),
                )?.name || "Admin";
          const creatorId =
            creator && typeof creator === "object"
              ? creator._id
              : creator || "";

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
            reviewedBy: creatorId,
            assignedByName: creatorName,
            code: taskCode,
            createdAt: correspondingTask?.createdAt || t.createdAt,
          };
        });

        // Merge any new tasks from myTasks that are not in the saved report tasks
        const savedTaskIds = new Set(
          todayReport.tasks.map((t) =>
            (t.taskId?._id || t.taskId || t._id).toString(),
          ),
        );
        const newUnsavedTasks = myTasks.filter(
          (mt) => !savedTaskIds.has(mt._id.toString()),
        );

        const unsavedMapped = newUnsavedTasks.map((t) => {
          const clientName = t.project?.client?.companyName || "Internal";
          const projectName = t.project?.name || "Internal";
          const elapsedStr = formatElapsed(t.actualStartTime, t.actualEndTime);
          const taskCode = getTaskDisplayId(t);

          const creator = t.createdBy;
          const creatorName =
            creator && typeof creator === "object"
              ? creator.name
              : users.find(
                  (u) =>
                    u._id ===
                    (typeof creator === "string" ? creator : creator?._id),
                )?.name || "Admin";
          const creatorId =
            creator && typeof creator === "object"
              ? creator._id
              : creator || "";

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
            reviewedBy: creatorId,
            assignedByName: creatorName,
            code: taskCode,
            createdAt: t.createdAt,
          };
        });

        setTasksState([...savedTasks, ...unsavedMapped]);
      } else if (myTasks.length > 0) {
        setTasksState(
          myTasks.map((t) => {
            const clientName = t.project?.client?.companyName || "Internal";
            const projectName = t.project?.name || "Internal";
            const elapsedStr = formatElapsed(
              t.actualStartTime,
              t.actualEndTime,
            );
            const taskCode = getTaskDisplayId(t);

            const creator = t.createdBy;
            const creatorName =
              creator && typeof creator === "object"
                ? creator.name
                : users.find(
                    (u) =>
                      u._id ===
                      (typeof creator === "string" ? creator : creator?._id),
                  )?.name || "Admin";
            const creatorId =
              creator && typeof creator === "object"
                ? creator._id
                : creator || "";

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
              reviewedBy: creatorId,
              assignedByName: creatorName,
              code: taskCode,
              createdAt: t.createdAt,
            };
          }),
        );
      } else {
        setTasksState([]);
      }
    } else if (myTasks.length > 0) {
      setTasksState(
        myTasks.map((t) => {
          const clientName = t.project?.client?.companyName || "Internal";
          const projectName = t.project?.name || "Internal";
          const elapsedStr = formatElapsed(t.actualStartTime, t.actualEndTime);
          const taskCode = getTaskDisplayId(t);

          const creator = t.createdBy;
          const creatorName =
            creator && typeof creator === "object"
              ? creator.name
              : users.find(
                  (u) =>
                    u._id ===
                    (typeof creator === "string" ? creator : creator?._id),
                )?.name || "Admin";
          const creatorId =
            creator && typeof creator === "object"
              ? creator._id
              : creator || "";

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
            reviewedBy: creatorId,
            assignedByName: creatorName,
            code: taskCode,
            createdAt: t.createdAt,
          };
        }),
      );
      setDaySummary({
        toolsIssues: "None",
        clientCalls: "",
        anythingElseOps: "",
      });
      setTomorrowPlan("None");
      setOverallStatus("None");
      setReportId(null);
      setIsSubmitted(false);
    } else {
      // Reset form state for a fresh date with no tasks and no report
      setTasksState([]);
      setDaySummary({
        toolsIssues: "None",
        clientCalls: "",
        anythingElseOps: "",
      });
      setTomorrowPlan("None");
      setOverallStatus("None");
      setReportId(null);
      setIsSubmitted(false);
    }
  }, [todayReport, myTasks, projects, users]);

  // Sync task status, code, and elapsed time dynamically from allTasks/myTasks
  useEffect(() => {
    if (myTasks.length > 0 && tasksState.length > 0 && projects.length > 0) {
      setTasksState((prev) =>
        prev.map((t) => {
          const correspondingTask = myTasks.find((mt) => mt._id === t.taskId);
          if (correspondingTask) {
            const mappedStatus = mapTaskStatusToEodStatus(
              correspondingTask.status,
            );
            const elapsedStr = formatElapsed(
              correspondingTask.actualStartTime,
              correspondingTask.actualEndTime,
            );
            const taskCode = getTaskDisplayId(correspondingTask);

            const creator = correspondingTask.createdBy;
            const creatorName =
              creator && typeof creator === "object"
                ? creator.name
                : users.find(
                    (u) =>
                      u._id ===
                      (typeof creator === "string" ? creator : creator?._id),
                  )?.name || "Admin";
            const creatorId =
              creator && typeof creator === "object"
                ? creator._id
                : creator || "";

            if (
              t.statusAtEod !== mappedStatus ||
              t.time !== elapsedStr ||
              t.code !== taskCode ||
              t.reviewedBy !== creatorId ||
              t.assignedByName !== creatorName
            ) {
              return {
                ...t,
                statusAtEod: mappedStatus,
                time: elapsedStr,
                code: taskCode,
                reviewedBy: creatorId,
                assignedByName: creatorName,
              };
            }
          }
          return t;
        }),
      );
    }
  }, [myTasks, projects, users]);

  const updateTask = (taskId, field, value) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
    );
  };

  const handleSave = async (isDraftSubmit) => {
    // Validation on Submission (Not Draft)
    if (!isDraftSubmit) {
      if (
        !daySummary.toolsIssues ||
        daySummary.toolsIssues.trim() === "" ||
        daySummary.toolsIssues === "None"
      ) {
        toast.error("please fill fields");
        return;
      }

      if (!overallStatus || overallStatus.trim() === "") {
        toast.error("Overall Status cannot be empty.");
        return;
      }

      if (
        !tomorrowPlan ||
        tomorrowPlan === "None" ||
        tomorrowPlan.trim() === ""
      ) {
        toast.error("Tomorrow Plan cannot be 'None' or empty.");
        return;
      }
    }

    const payload = {
      date: selectedDate,
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
        createdAt: t.createdAt,
      })),
      daySummary,
      tomorrowPlan,
      overallStatus,
    };

    try {
      if (reportId) {
        await dispatch(
          updateDesignerEodReport({ id: reportId, data: payload }),
        ).unwrap();
        toast.success(
          isDraftSubmit
            ? "Draft updated successfully!"
            : "EOD Report submitted successfully!",
        );
      } else {
        await dispatch(createDesignerEodReport(payload)).unwrap();
        toast.success(
          isDraftSubmit
            ? "Draft saved successfully!"
            : "EOD Report submitted successfully!",
        );
      }
      dispatch(getDesignerEodReports({ date: selectedDate }));
      refetchTasks();
    } catch (err) {
      console.error("Failed to save report:", err);
      toast.error(err.message || "Failed to save EOD Report");
    }
  };

  // Dynamic stats
  const totalTasks = tasksState.length;
  const completedCount = tasksState.filter(
    (t) => t.statusAtEod === "Completed",
  ).length;
  const rejectedCount = tasksState.filter(
    (t) => t.statusAtEod === "Rejected",
  ).length;
  const inProgressCount = tasksState.filter(
    (t) => t.statusAtEod === "In Progress",
  ).length;
  const onHoldCount = tasksState.filter(
    (t) => t.statusAtEod === "On Hold",
  ).length;
  const inReviewCount = tasksState.filter((t) =>
    ["IN-REVIEW", "In Review", "IN-Review"].includes(t.statusAtEod),
  ).length;
  const pendingCount = Math.max(
    0,
    totalTasks -
      completedCount -
      rejectedCount -
      inProgressCount -
      onHoldCount -
      inReviewCount,
  );

  const dynamicPlans = tasksState.map((task) => {
    const actionWord =
      task.statusAtEod === "Completed" ? "Complete" : "Continue";
    const clientPart = task.client ? `${task.client} ` : "";
    const titlePart = task.title || "";
    return `${actionWord} ${clientPart}${titlePart}`;
  });

  if (tasksLoading || reportLoading || projectsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">
          Loading your EOD task data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl  mx-auto">
      {/* Header Card */}
      <div className="theme-bg-card  ">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-left">
            <h1 className="text-md font-bold theme-text-primary text-left">
              {selectedDate === getLocalDateString()
                ? "Today's Tasks"
                : `Tasks for ${safeFormatDate(selectedDate)}`}{" "}
              — {user?.name || "Member"}
            </h1>
            <p className="theme-text-secondary text-xs font-semibold mt-1 text-left">
              {selectedDate === getLocalDateString()
                ? "Review and submit EOD reports for tasks assigned to you today."
                : `Review and submit EOD reports for tasks assigned to you on ${safeFormatDate(selectedDate)}.`}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border theme-border px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 self-start lg:self-auto shadow-sm">
            <FiCalendar className="shrink-0 text-indigo-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {tasksState.length === 0 ? (
        <div className="mt-8 theme-bg-card border border-dashed theme-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 border theme-border">
            <FiCheckCircle size={22} />
          </div>
          <h3 className="font-bold theme-text-primary mt-4 text-sm">
            {selectedDate === getLocalDateString()
              ? "Today no task assigned"
              : "No tasks assigned for this date"}
          </h3>
          <p className="text-xs theme-text-secondary mt-1 max-w-xs">
            {selectedDate === getLocalDateString()
              ? "You don't have any tasks assigned for today. Go to Tasks board to pick up new work."
              : `You didn't have any tasks assigned on ${safeFormatDate(selectedDate)}.`}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tasksState.map((task) => (
            <div
              key={task.id}
              className="theme-bg-card border theme-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-0.5 relative overflow-hidden"
            >
              {/* Task Top Meta info */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-sm theme-text-primary flex items-center gap-2 flex-wrap leading-relaxed">
                    {task.code && (
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border tracking-wider select-none ${getTaskCodeStyle(task.code).bg}`}
                      >
                        [{task.code}]
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 ml-0.5">
                      <FiFileText
                        className="text-slate-400 dark:text-slate-500 shrink-0"
                        size={14}
                      />
                      <span className="italic font-semibold text-slate-700 dark:text-slate-200">
                        {task.title}
                      </span>
                    </span>
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
                    {task.createdAt && (
                      <span className="bg-slate-50 text-slate-500 border border-slate-200/60 dark:bg-slate-900/10 dark:text-slate-400 dark:border-slate-800/60 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Created: {safeFormatDateTime(task.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span
                    className={`${getPriorityStyle(
                      task.priority,
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

                {/* Assigned By (Read-Only) */}
                <div>
                  <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                    Assigned By
                  </label>
                  <div className="w-full mt-1.5 bg-slate-50 border border-slate-200 dark:bg-[#0f172a] dark:border-white/5 rounded-xl px-3 py-2.5 text-xs theme-text-primary font-semibold select-none">
                    {task.assignedByName || "Admin"}
                  </div>
                </div>

                {/* Dynamic field rows depending on the status */}
                {task.statusAtEod !== "Completed" && (
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
                        onChange={(e) =>
                          updateTask(task.id, "reason", e.target.value)
                        }
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
                        onChange={(e) =>
                          updateTask(task.id, "nextAction", e.target.value)
                        }
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
      {(tasksState.length > 0 || todayReport) && (
        <div className="theme-bg-card border theme-border rounded-2xl mt-8 p-6 text-left shadow-sm">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
            <div>
              <h2 className="text-md font-bold theme-text-primary">
                EOD REPORT
              </h2>
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
            {/* Completed Section */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                Completed Tasks
              </h3>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/40">
                {tasksState.filter((t) => t.statusAtEod === "Completed")
                  .length === 0 ? (
                  <p className="text-xs theme-text-secondary py-3 italic">
                    No tasks completed.
                  </p>
                ) : (
                  tasksState
                    .filter((t) => t.statusAtEod === "Completed")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex justify-between items-center py-3 text-xs"
                      >
                        <span className="font-semibold theme-text-primary text-left">
                          {task.client}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="theme-text-secondary font-medium">
                            {task.title} completed
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-650 border border-purple-100/30 text-[10px] font-semibold dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30">
                            {task.revision}{" "}
                            {task.revision === 1 ? "revision" : "revisions"}
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
                {tasksState.filter((t) => t.statusAtEod !== "Completed")
                  .length === 0 ? (
                  <p className="text-xs theme-text-secondary py-3 italic">
                    No pending tasks.
                  </p>
                ) : (
                  tasksState
                    .filter((t) => t.statusAtEod !== "Completed")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex justify-between items-center py-3 text-xs"
                      >
                        <span className="font-semibold theme-text-primary text-left">
                          {task.client ? `${task.client} ` : ""}
                          {task.title}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                Issues faced <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                  value={
                    daySummary.toolsIssues === "None"
                      ? "None"
                      : [
                            "Client content received late",
                            "Software / tool issue",
                            "Power / internet issue",
                          ].includes(daySummary.toolsIssues)
                        ? daySummary.toolsIssues
                        : "Other"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setDaySummary({ ...daySummary, toolsIssues: "" });
                    } else {
                      setDaySummary({ ...daySummary, toolsIssues: val });
                    }
                  }}
                  disabled={isSubmitted}
                >
                  <option value="None">None</option>
                  <option value="Client content received late">
                    Client content received late
                  </option>
                  <option value="Software / tool issue">
                    Software / tool issue
                  </option>
                  <option value="Power / internet issue">
                    Power / internet issue
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {daySummary.toolsIssues !== "None" &&
                ![
                  "Client content received late",
                  "Software / tool issue",
                  "Power / internet issue",
                ].includes(daySummary.toolsIssues) && (
                  <div className="relative mt-2">
                    <input
                      type="text"
                      placeholder="Specify other issue..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                      value={daySummary.toolsIssues}
                      onChange={(e) =>
                        setDaySummary({
                          ...daySummary,
                          toolsIssues: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    />
                    {!isSubmitted && (
                      <button
                        type="button"
                        onClick={() =>
                          setDaySummary({ ...daySummary, toolsIssues: "None" })
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                )}
            </div>

            {/* Overall Status */}
            <div>
              <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                Overall Status <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                  value={overallStatus}
                  onChange={(e) => setOverallStatus(e.target.value)}
                  disabled={isSubmitted}
                >
                  <option value="On Track">On Track</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
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
                onChange={(e) =>
                  setDaySummary({
                    ...daySummary,
                    anythingElseOps: e.target.value,
                  })
                }
                disabled={isSubmitted}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                Tomorrow Plan <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                value={
                  tomorrowPlan === "None"
                    ? "None"
                    : dynamicPlans.includes(tomorrowPlan)
                      ? tomorrowPlan
                      : "Other"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Other") {
                    setTomorrowPlan("");
                  } else if (val === "None") {
                    setTomorrowPlan("None");
                  } else {
                    setTomorrowPlan(val);
                  }
                }}
                disabled={isSubmitted}
              >
                <option value="None">None</option>
                {dynamicPlans.map((plan, idx) => (
                  <option key={idx} value={plan}>
                    {plan}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {tomorrowPlan !== "None" &&
                (!tomorrowPlan || !dynamicPlans.includes(tomorrowPlan)) && (
                  <div className="relative mt-2">
                    <textarea
                      rows={3}
                      placeholder="What tasks do you plan to work on tomorrow?"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-10 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none font-semibold"
                      value={tomorrowPlan}
                      onChange={(e) => setTomorrowPlan(e.target.value)}
                      disabled={isSubmitted}
                    />
                    {!isSubmitted && (
                      <button
                        type="button"
                        onClick={() => setTomorrowPlan("None")}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-5 mt-8 border-t theme-border pt-6">
            <p className="text-xs font-semibold theme-text-secondary">
              {completedCount + pendingCount + rejectedCount} of {totalTasks}{" "}
              tasks logged
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
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto justify-center">
                  <FiCheckCircle />
                  Report Submitted for{" "}
                  {selectedDate === getLocalDateString()
                    ? "Today"
                    : safeFormatDate(selectedDate)}
                </div>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FiEdit2 size={12} />
                  Re-edit Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EodReports;
