import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
  useUpdateTaskMutation,
} from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { calculateTaskProductivityForDate } from "../Dashboard/cards/GraphicDesignerDashboard";
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
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60",
    },
    {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60",
    },
    {
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
    },
    {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
    },
    {
      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
    },
    {
      bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60",
    },
    {
      bg: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60",
    },
    {
      bg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800/60",
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

const formatMsToDuration = (ms) => {
  if (!ms || ms <= 0) return "0s";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatElapsed = (
  startTime,
  endTime,
  pausedAt,
  totalPausedMs = 0,
  status = "",
  autoPaused = false,
) => {
  if (!startTime) return "";
  const start = new Date(startTime).getTime();
  const end = endTime
    ? new Date(endTime).getTime()
    : status === "In Progress" && autoPaused
      ? pausedAt
        ? new Date(pausedAt).getTime()
        : Date.now()
      : pausedAt && status !== "In Progress"
        ? new Date(pausedAt).getTime()
        : Date.now();

  const paused = totalPausedMs || 0;

  const elapsed = Math.max(0, Math.floor((end - start - paused) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const getTaskInprogressTime = (task, selDateObj) => {
  if (!task) return "0s";
  if (task.actualStartTime) {
    const end =
      task.actualEndTime ||
      task.completedAt ||
      task.reviewStartedAt ||
      task.lastReviewStartedAt ||
      task.pausedAt ||
      null;
    const timeStr = formatElapsed(
      task.actualStartTime,
      end,
      task.pausedAt,
      task.totalPausedMs,
      task.status,
      task.autoPaused,
    );
    if (timeStr && timeStr !== "0s") return timeStr;
  }
  const loggedMs = calculateTaskProductivityForDate(task, selDateObj);
  if (loggedMs > 0) {
    return formatMsToDuration(loggedMs);
  }
  return task.time || "0s";
};

const LiveTimeTracker = ({ task, allTasks, isSubmitted, selectedDate }) => {
  const selDateObj = React.useMemo(() => {
    if (!selectedDate) return new Date();
    return typeof selectedDate === "string"
      ? parseISO(selectedDate)
      : selectedDate;
  }, [selectedDate]);

  const originalTask = React.useMemo(() => {
    return allTasks.find((t) => t._id === (task.taskId || task.id));
  }, [allTasks, task]);

  const calculateCurrentMs = React.useCallback(() => {
    const target = originalTask || task;
    if (!target) return 0;
    return calculateTaskProductivityForDate(target, selDateObj);
  }, [originalTask, task, selDateObj]);

  const [elapsedStr, setElapsedStr] = React.useState(() => {
    const ms = calculateCurrentMs();
    return ms > 0 ? formatMsToDuration(ms) : task.time || "0s";
  });

  React.useEffect(() => {
    if (isSubmitted) {
      setElapsedStr(task.time || "0s");
      return;
    }

    const updateDisplay = () => {
      const ms = calculateCurrentMs();
      setElapsedStr(ms > 0 ? formatMsToDuration(ms) : task.time || "0s");
    };

    updateDisplay();

    const target = originalTask || task;
    const isRunning =
      target &&
      target.status === "In Progress" &&
      !target.actualEndTime &&
      !target.autoPaused;

    if (isRunning) {
      const interval = setInterval(updateDisplay, 1000);
      return () => clearInterval(interval);
    }
  }, [
    allTasks,
    task,
    isSubmitted,
    selectedDate,
    originalTask,
    calculateCurrentMs,
  ]);

  return <span className="whitespace-nowrap">{elapsedStr}</span>;
};

// Helper: map task board status to EOD status enum
const mapTaskStatusToEodStatus = (status) => {
  return status || "Pending";
};

// Helper: Priority sorting order (In Review = 1, In Progress = 2, Pending = 3, Completed = 4)
const getStatusPriority = (status) => {
  const s = (status || "Pending").toUpperCase();
  if (s.includes("REVIEW")) return 1;
  if (s.includes("PROGRESS")) return 2;
  if (s === "PENDING") return 3;
  if (s === "COMPLETED") return 4;
  return 5;
};

const getCardBgStyle = (status) => {
  const s = (status || "Pending").toUpperCase();
  switch (s) {
    case "COMPLETED":
      return "bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800";
    case "IN PROGRESS":
    case "IN_PROGRESS":
      return "bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800";
    case "IN-REVIEW":
    case "IN REVIEW":
    case "IN_REVIEW":
      return "bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800";
    case "ON HOLD":
    case "ON_HOLD":
      return "bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 shadow-xs";
    case "REJECTED":
      return "bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 shadow-xs";
    default: // Pending
      return "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700";
  }
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
      return "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
    case "ON HOLD":
    case "ON_HOLD":
      return "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
    case "REJECTED":
      return "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
    default: // Pending
      return "bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-slate-900/10 dark:text-slate-400 dark:border-slate-800/60";
  }
};

const getStatusTextColor = (status) => {
  const s = (status || "Pending").toUpperCase();
  switch (s) {
    case "COMPLETED":
      return "text-emerald-700 dark:text-emerald-400";
    case "IN PROGRESS":
    case "IN_PROGRESS":
      return "text-blue-700 dark:text-blue-400";
    case "IN-REVIEW":
    case "IN REVIEW":
    case "IN_REVIEW":
      return "text-amber-700 dark:text-amber-400";
    case "ON HOLD":
    case "ON_HOLD":
      return "text-amber-700 dark:text-amber-400";
    case "REJECTED":
      return "text-rose-700 dark:text-rose-400";
    default: // Pending
      return "text-slate-600 dark:text-slate-400";
  }
};

const calculateTotalLoggedTime = (tasks, allTasks = [], selectedDate) => {
  const selDateObj = selectedDate ? parseISO(selectedDate) : new Date();
  let totalMs = 0;

  (tasks || []).forEach((t) => {
    const originalTask = (allTasks || []).find(
      (at) => at._id === (t.taskId?._id || t.taskId || t.id || t._id),
    );
    const target = originalTask || t;

    const msToday = calculateTaskProductivityForDate(target, selDateObj);
    if (msToday > 0) {
      totalMs += msToday;
    } else {
      const timeStr = t.time || "";
      const hoursMatch = timeStr.match(/(\d+)\s*h/i);
      const minsMatch = timeStr.match(/(\d+)\s*m/i);
      const secsMatch = timeStr.match(/(\d+)\s*s/i);

      let mins = 0;
      if (hoursMatch) mins += parseInt(hoursMatch[1], 10) * 60;
      if (minsMatch) mins += parseInt(minsMatch[1], 10);
      if (secsMatch && !hoursMatch && !minsMatch) {
        const secs = parseInt(secsMatch[1], 10);
        if (secs > 0) mins += Math.ceil(secs / 60);
      }
      totalMs += mins * 60 * 1000;
    }
  });

  if (totalMs <= 0) return "0m";

  const totalMinutes = Math.floor(totalMs / (1000 * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
};

const EodReports = () => {
  const dispatch = useDispatch();
  const [updateTaskTrigger] = useUpdateTaskMutation();
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

  // Filter tasks assigned to me that belong to the selected date.
  // Rule: a task appears in EOD ONLY if actual work/productivity happened on that date,
  // OR if it is actively In Progress right now (today only).
  // completedAt / actualEndTime alone is NOT sufficient — a task completed on a date
  // with zero productivity on that date must NOT appear in EOD for that date.
  const myTasks = React.useMemo(() => {
    const selDateObj = selectedDate ? parseISO(selectedDate) : new Date();

    const getLocalDateStr = (date) => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return allTasks.filter((task) => {
      const assigneeId = task.assignedTo?._id || task.assignedTo;
      const isAssignedToMe = assigneeId === (user?._id || user?.id);
      if (!isAssignedToMe) return false;

      if (getLocalDateStr(task.startDate) === selectedDate) return true;
      if (getLocalDateStr(task.dueDate) === selectedDate) return true;
      if (getLocalDateStr(task.completedAt) === selectedDate) return true;
      if (getLocalDateStr(task.createdAt) === selectedDate) return true;
      if (getLocalDateStr(task.actualStartTime) === selectedDate) return true;
      if (getLocalDateStr(task.updatedAt) === selectedDate) return true;

      const loggedMsToday = calculateTaskProductivityForDate(task, selDateObj);
      if (loggedMsToday > 0) return true;

      const todayStr = getLocalDateStr(new Date());
      const isSelectedToday = selectedDate === todayStr;
      const isActivelyRunningNow =
        isSelectedToday &&
        task.status === "In Progress" &&
        !task.actualEndTime &&
        !task.autoPaused;

      if (isActivelyRunningNow) return true;

      return false;
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
    const selDateObj = selectedDate ? parseISO(selectedDate) : new Date();

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
        const myTaskIdsSet = new Set(
          myTasks.map((mt) => (mt._id || mt.id).toString()),
        );

        const savedTasks = todayReport.tasks
          .filter((t) => {
            if (!todayReport.isDraft) return true; // Keep exact history for submitted reports
            const tId = (t.taskId?._id || t.taskId || t._id)?.toString();
            return myTaskIdsSet.has(tId);
          })
          .map((t) => {
            const correspondingTask = myTasks.find(
              (mt) => mt._id === (t.taskId?._id || t.taskId),
            );
            const actualStatus = t.statusAtEod
              ? t.statusAtEod
              : correspondingTask
                ? mapTaskStatusToEodStatus(correspondingTask.status)
                : "Pending";
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
              !todayReport.isDraft && t.reviewedBy
                ? typeof t.reviewedBy === "object"
                  ? t.reviewedBy._id
                  : t.reviewedBy
                : creator && typeof creator === "object"
                  ? creator._id
                  : creator || "";

            const calculatedTimeStr = correspondingTask
              ? getTaskInprogressTime(correspondingTask, selDateObj)
              : "0s";

            return {
              id: t.taskId || t._id,
              taskId: t.taskId?._id || t.taskId || t._id,
              title: t.title,
              project: t.project,
              priority: t.priority,
              contentType: t.contentType || "",
              client: t.client,
              revision: correspondingTask
                ? correspondingTask.revisions || 0
                : t.revisions || 0,
              time: !todayReport.isDraft
                ? t.loggedTime || t.time || calculatedTimeStr
                : calculatedTimeStr !== "0s"
                  ? calculatedTimeStr
                  : t.loggedTime || calculatedTimeStr,
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

        // Merge any tasks from myTasks that were not in the saved report tasks
        const savedTaskIds = new Set(
          savedTasks.map((t) =>
            (t.taskId?._id || t.taskId || t.id || t._id).toString(),
          ),
        );
        const newUnsavedTasks = myTasks.filter(
          (mt) => !savedTaskIds.has(mt._id.toString()),
        );

        const unsavedMapped = newUnsavedTasks.map((t) => {
          const clientName = t.project?.client?.companyName || "Internal";
          const projectName = t.project?.name || "Internal";
          const elapsedStr = getTaskInprogressTime(t, selDateObj);
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
            const elapsedStr = getTaskInprogressTime(t, selDateObj);
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
          const elapsedStr = getTaskInprogressTime(t, selDateObj);
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
      const selDateObj = selectedDate ? parseISO(selectedDate) : new Date();

      setTasksState((prev) =>
        prev.map((t) => {
          const correspondingTask = myTasks.find((mt) => mt._id === t.taskId);
          if (correspondingTask) {
            const mappedStatus = mapTaskStatusToEodStatus(
              correspondingTask.status,
            );
            const calculatedTimeStr = getTaskInprogressTime(
              correspondingTask,
              selDateObj,
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

            const taskRevision = correspondingTask.revisions || 0;

            const targetStatus = t.statusAtEod || mappedStatus;
            const targetTime =
              isSubmitted && t.time
                ? t.time
                : calculatedTimeStr !== "0s"
                  ? calculatedTimeStr
                  : t.time || calculatedTimeStr;
            const targetReviewedBy =
              isSubmitted && t.reviewedBy ? t.reviewedBy : creatorId;

            if (
              t.statusAtEod !== targetStatus ||
              t.time !== targetTime ||
              t.code !== taskCode ||
              t.reviewedBy !== targetReviewedBy ||
              t.assignedByName !== creatorName ||
              t.revision !== taskRevision
            ) {
              return {
                ...t,
                statusAtEod: targetStatus,
                time: targetTime,
                code: taskCode,
                reviewedBy: targetReviewedBy,
                assignedByName: creatorName,
                revision: taskRevision,
              };
            }
          }
          return t;
        }),
      );
    }
  }, [myTasks, projects, users, selectedDate, isSubmitted]);

  // Automatically calculate overallStatus from tasksState
  useEffect(() => {
    if (tasksState.length > 0) {
      const hasPending = tasksState.some(
        (t) => !["Completed", "In Review"].includes(t.statusAtEod),
      );
      const allCompletedOrInReview = tasksState.every((t) =>
        ["Completed", "In Review"].includes(t.statusAtEod),
      );

      if (hasPending) {
        setOverallStatus("Delayed");
      } else if (allCompletedOrInReview) {
        setOverallStatus("Completed");
      } else {
        setOverallStatus("On Track");
      }
    } else {
      if (todayReport && todayReport.overallStatus) {
        setOverallStatus(todayReport.overallStatus);
      } else {
        setOverallStatus("None");
      }
    }
  }, [tasksState, todayReport]);

  const updateTask = (taskId, field, value) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
    );
  };

  const handleSave = async (isDraftSubmit) => {
    // Validation on Submission (Not Draft)
    if (!isDraftSubmit) {
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

  // Helper to format date string
  const getLocalDateStr = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayCompletedTasks = React.useMemo(() => {
    return tasksState.filter((t) => {
      if (t.statusAtEod !== "Completed") return false;
      const compDate = getLocalDateStr(
        t.completedAt || t.updatedAt || t.createdAt,
      );
      return !compDate || compDate === selectedDate;
    });
  }, [tasksState, selectedDate]);

  const previousCompletedTasks = React.useMemo(() => {
    return tasksState.filter((t) => {
      if (t.statusAtEod !== "Completed") return false;
      const compDate = getLocalDateStr(
        t.completedAt || t.updatedAt || t.createdAt,
      );
      return compDate && compDate < selectedDate;
    });
  }, [tasksState, selectedDate]);

  const todayCompletedCount = todayCompletedTasks.length;
  const previousCompletedCount = previousCompletedTasks.length;
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
  const inReviewCount = tasksState.filter(
    (t) => t.statusAtEod === "In Review",
  ).length;
  const revisionCount = tasksState.filter((t) =>
    ["Revision", "Revision Pending"].includes(t.statusAtEod),
  ).length;
  const pendingCount = Math.max(
    0,
    totalTasks -
      completedCount -
      rejectedCount -
      inProgressCount -
      onHoldCount -
      inReviewCount -
      revisionCount,
  );

  const dynamicPlans = tasksState.map((task) => {
    const actionWord =
      task.statusAtEod === "Completed" ? "Complete" : "Continue";
    const clientPart = task.client ? `${task.client} ` : "";
    const titlePart = task.title || "";
    return `${actionWord} ${clientPart}${titlePart}`;
  });

  const completedTasks = React.useMemo(
    () => tasksState.filter((t) => t.statusAtEod === "Completed"),
    [tasksState],
  );

  const todayProductivityTasks = React.useMemo(
    () =>
      tasksState
        .filter((t) => t.statusAtEod !== "Completed")
        .sort(
          (a, b) =>
            getStatusPriority(a.statusAtEod) -
            getStatusPriority(b.statusAtEod),
        ),
    [tasksState],
  );

  const renderTaskCard = (task) => {
    const assignerUser = users.find((u) => u._id === task.reviewedBy);
    const assignerName =
      assignerUser?.name || task.assignedByName || "Admin";

    const isCompleted = task.statusAtEod === "Completed";
    const isInProgress = task.statusAtEod === "In Progress";
    const isInReview = ["In Review", "In-Review", "IN_REVIEW"].includes(
      task.statusAtEod,
    );

    return (
      <div
        key={task.id}
        className={`${getCardBgStyle(
          task.statusAtEod,
        )} rounded-xl p-4 sm:p-4.5 shadow-xs hover:shadow-md transition-all duration-200 text-left relative overflow-hidden group`}
      >
        {/* Top colored accent glow bar */}
        <div
          className={`h-1 w-full -mt-4 -mx-4 sm:-mt-4.5 sm:-mx-4.5 mb-3.5 transition-all duration-200 ${
            isCompleted
              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
              : isInProgress
                ? "bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500"
                : isInReview
                  ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                  : "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600"
          }`}
        />

        {/* Task Top Meta Info Header */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.code && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[9.5px] font-black border tracking-wider select-none shrink-0 ${getTaskCodeStyle(task.code).bg}`}
                >
                  [{task.code}]
                </span>
              )}
              <h3 className="font-bold text-xs theme-text-primary flex items-center gap-1 min-w-0 truncate">
                <FiFileText
                  className="text-slate-400 dark:text-slate-500 shrink-0"
                  size={13}
                />
                <span className="italic font-bold text-slate-800 dark:text-slate-100 truncate">
                  {task.title}
                </span>
              </h3>
            </div>

            {/* Sub-tags Row */}
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              <span className="bg-slate-100/90 text-slate-650 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 text-[9.5px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                {task.client}
              </span>
              {task.contentType && (
                <span className="bg-purple-100/80 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50 text-[9.5px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {task.contentType}
                </span>
              )}
              {task.time && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100/80 text-blue-700 border border-blue-200/60 rounded-md text-[9.5px] font-black dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50 whitespace-nowrap shrink-0">
                  <FiClock size={10} className="shrink-0 text-blue-500" />
                  <LiveTimeTracker
                    task={task}
                    allTasks={allTasks}
                    isSubmitted={isSubmitted}
                    selectedDate={selectedDate}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right priority & revision info */}
          <div className="text-right shrink-0 flex flex-col items-end gap-1">
            <span
              className={`${getPriorityStyle(
                task.priority,
              )} text-[9.5px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider`}
            >
              {task.priority}
            </span>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Rev. {task.revision || 0}
            </span>
          </div>
        </div>

        {/* Status & Assigned By Row */}
        <div className="flex justify-between items-center mt-3 pt-2.5 border-t theme-border text-[10.5px]">
          {/* Status Row */}
          <div className="flex items-center gap-1">
            <span className="font-bold theme-text-secondary uppercase tracking-wider text-[9.5px]">
              Status:
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide ${getStatusBadgeStyle(task.statusAtEod)}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted
                    ? "bg-emerald-500"
                    : isInProgress
                      ? "bg-blue-500 animate-pulse"
                      : isInReview
                        ? "bg-amber-500"
                        : "bg-slate-400"
                }`}
              />
              {task.statusAtEod || "Pending"}
            </span>
          </div>

          {/* Assigned By Row */}
          <div className="flex items-center gap-1">
            <span className="font-bold theme-text-secondary uppercase tracking-wider text-[9.5px]">
            By:
            </span>
            <span className="font-bold theme-text-primary text-[10.5px] leading-tight">
              {assignerName}
            </span>
          </div>
        </div>

        {/* Dynamic Reason & Next Action Fields / In Review Full Width Thank You */}
        {!isCompleted && (
          <div className="mt-2.5 pt-2.5 border-t theme-border">
            {isInReview ? (
              <div className="w-full flex items-center justify-center gap-2 bg-amber-500/15 dark:bg-amber-950/50 border border-amber-500/30 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 rounded-lg px-3 py-2 text-xs font-extrabold shadow-2xs">
                <span className="text-sm">😁</span>
                <span>Thank you!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Reason for {task.statusAtEod}
                  </label>
                  <input
                    type="text"
                    placeholder={`Why ${task.statusAtEod.toLowerCase()}?`}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                    value={task.reason || ""}
                    onChange={(e) =>
                      updateTask(task.id, "reason", e.target.value)
                    }
                    disabled={isSubmitted}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Next Action
                  </label>
                  <input
                    type="text"
                    placeholder="Next plan..."
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                    value={task.nextAction || ""}
                    onChange={(e) =>
                      updateTask(task.id, "nextAction", e.target.value)
                    }
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
                ? "Review and submit EOD reports for tasks due today."
                : `Review and submit EOD reports for tasks due on ${safeFormatDate(selectedDate)}.`}
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

      {/* Task Cards Grid / Sections */}
      {tasksState.length === 0 ? (
        <div className="mt-8 theme-bg-card border border-dashed theme-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 border theme-border">
            <FiCheckCircle size={22} />
          </div>
          <h3 className="font-bold theme-text-primary mt-4 text-sm">
            {selectedDate === getLocalDateString()
              ? "Today no task due"
              : "No tasks due for this date"}
          </h3>
          <p className="text-xs theme-text-secondary mt-1 max-w-xs">
            {selectedDate === getLocalDateString()
              ? "You don't have any tasks due today. Go to Tasks board to check your schedule."
              : `You didn't have any tasks due on ${safeFormatDate(selectedDate)}.`}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {/* TODAY PRODUCTIVITY CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-xs font-bold theme-text-primary uppercase tracking-wider">
                  Today Productivity Cards
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {todayProductivityTasks.length}
                </span>
              </div>
            </div>

            {todayProductivityTasks.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-3.5 text-xs theme-text-secondary text-left font-medium">
                No active productivity tasks currently in progress or pending.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {todayProductivityTasks.map((task) => renderTaskCard(task))}
              </div>
            )}
          </div>

          {/* TODAY COMPLETED CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3 pt-3.5 border-t theme-border">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold theme-text-primary uppercase tracking-wider">
                  Today Completed Cards
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {todayCompletedTasks.length}
                </span>
              </div>
            </div>

            {todayCompletedTasks.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-3.5 text-xs theme-text-secondary text-left font-medium">
                No tasks completed today yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {todayCompletedTasks.map((task) => renderTaskCard(task))}
              </div>
            )}
          </div>

          {/* PREVIOUS COMPLETED CARDS */}
          {previousCompletedTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 pt-3.5 border-t theme-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <h2 className="text-xs font-bold theme-text-primary uppercase tracking-wider">
                    Previous Completed Cards
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {previousCompletedTasks.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {previousCompletedTasks.map((task) => renderTaskCard(task))}
              </div>
            </div>
          )}
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
          </div>{" "}
          {/* eod summary cards  */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-4 mb-5">
            {/* 1. In Review Card */}
            <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/5 dark:to-transparent border border-amber-500/30 dark:border-amber-500/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-6 -mt-6 blur-md group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                  {inReviewCount}
                </span>
                <FiClock className="text-amber-500/60 text-lg group-hover:text-amber-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black text-amber-700/90 dark:text-amber-300/90 uppercase tracking-widest mt-2 block relative z-10">
                In Review
              </span>
            </div>

            {/* 2. In Progress Card */}
            <div className="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/5 dark:to-transparent border border-blue-500/30 dark:border-blue-500/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-6 -mt-6 blur-md group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                  {inProgressCount}
                </span>
                <FiTool className="text-blue-500/60 text-lg group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black text-blue-700/90 dark:text-blue-300/90 uppercase tracking-widest mt-2 block relative z-10">
                In Progress
              </span>
            </div>

            {/* 3. Pending Card */}
            <div className="bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/5 dark:to-transparent border border-indigo-500/30 dark:border-indigo-500/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full -mr-6 -mt-6 blur-md group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  {pendingCount}
                </span>
                <FiCalendar className="text-indigo-500/60 text-lg group-hover:text-indigo-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black text-indigo-700/90 dark:text-indigo-300/90 uppercase tracking-widest mt-2 block relative z-10">
                Pending
              </span>
            </div>

            {/* 4. Today Completed Card */}
            <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5 dark:to-transparent border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-6 -mt-6 blur-md group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {todayCompletedCount}
                </span>
                <FiCheckCircle className="text-emerald-500/60 text-lg group-hover:text-emerald-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black text-emerald-700/90 dark:text-emerald-300/90 uppercase tracking-widest mt-2 block relative z-10">
                Today Completed
              </span>
            </div>

            {/* 5. Previous Completed Card */}
            <div className="bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent dark:from-teal-500/20 dark:via-teal-500/5 dark:to-transparent border border-teal-500/30 dark:border-teal-500/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/10 rounded-full -mr-6 -mt-6 blur-md group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-2xl font-black tracking-tight text-teal-600 dark:text-teal-400">
                  {previousCompletedCount}
                </span>
                <FiCheckCircle className="text-teal-500/60 text-lg group-hover:text-teal-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black text-teal-700/90 dark:text-teal-300/90 uppercase tracking-widest mt-2 block relative z-10">
                Previous Completed
              </span>
            </div>

            {/* 6. Total Logged Card */}
            <div className="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-500/5 dark:to-transparent border border-purple-500/30 dark:border-purple-500/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-6 -mt-6 blur-md group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-lg font-black tracking-tight text-purple-600 dark:text-purple-400 truncate">
                  {calculateTotalLoggedTime(tasksState, allTasks, selectedDate)}
                </span>
                <FiClock className="text-purple-500/60 text-lg group-hover:text-purple-500 transition-colors shrink-0 ml-1" />
              </div>
              <span className="text-[10px] font-black text-purple-700/90 dark:text-purple-300/90 uppercase tracking-widest mt-2 block relative z-10">
                Total Time Taken
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider block">
                Issues faced
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
                Overall Status
              </label>
              <div className="relative mt-2">
                <div
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold select-none flex items-center justify-between transition-all duration-300 ${
                    overallStatus === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      : overallStatus === "On Track"
                        ? "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/30"
                        : overallStatus === "Delayed"
                          ? "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                          : "bg-slate-50 text-slate-655 border border-slate-200/60 dark:bg-slate-900/10 dark:text-slate-400 dark:border-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        overallStatus === "Completed"
                          ? "bg-emerald-500"
                          : overallStatus === "On Track"
                            ? "bg-blue-500"
                            : overallStatus === "Delayed"
                              ? "bg-rose-500"
                              : "bg-slate-400"
                      }`}
                    />
                    <span>{overallStatus}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-extrabold">
                    Auto
                  </span>
                </div>
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
