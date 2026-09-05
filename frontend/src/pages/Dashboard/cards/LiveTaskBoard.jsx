import React, { useState, useMemo } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLayers,
  FiFilter,
  FiSearch,
  FiX,
  FiFileText,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

const getPriorityStyle = (priority) => {
  const p = priority?.toLowerCase() || "";
  if (p.includes("top high"))
    return "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 font-black";
  if (p.includes("high"))
    return "bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 font-black";
  if (p.includes("medium"))
    return "bg-sky-50 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/40 font-black";
  if (p.includes("low"))
    return "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 font-black";
  return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold";
};

const getDaysRemaining = (dueDateStr, referenceDate = new Date()) => {
  if (!dueDateStr) return null;
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  const refDate = new Date(referenceDate);
  refDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - refDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDeadlineBadgeText = (dueDateStr, status, selectedDate) => {
  if (!dueDateStr) return "";
  const days = getDaysRemaining(dueDateStr, selectedDate);
  const isCompleted =
    status?.toLowerCase() === "completed" ||
    status?.toLowerCase().includes("approve");
  if (isCompleted) return "Completed";

  if (days < 0) {
    const absDays = Math.abs(days);
    return `${absDays} ${absDays === 1 ? "day" : "days"} overdue`;
  } else if (days === 0) {
    return "Due Today";
  } else if (days === 1) {
    return "Due Tomorrow";
  } else {
    return `${days} days to go`;
  }
};

const splitTasksByDateCategory = (columnTasks, colName, selectedDate) => {
  const isCompletedCol = colName.toLowerCase() === "completed";

  const selStart = startOfDay(selectedDate || new Date());
  const selEnd = endOfDay(selectedDate || new Date());

  const previousTasks = [];
  const todayTasks = [];
  const upcomingTasks = [];

  const parseVal = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === "string") {
      const p = parseISO(v);
      if (!isNaN(p.getTime())) return p;
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  columnTasks.forEach((t) => {
    let taskDate = null;
    if (isCompletedCol) {
      taskDate =
        parseVal(t.completedAt) ||
        parseVal(t.updatedAt) ||
        parseVal(t.dueDate) ||
        parseVal(t.createdAt);
    } else {
      taskDate =
        parseVal(t.dueDate) || parseVal(t.startDate) || parseVal(t.createdAt);
    }

    if (!taskDate || isNaN(taskDate.getTime())) {
      todayTasks.push(t);
      return;
    }

    if (isSameDay(taskDate, selectedDate || new Date())) {
      todayTasks.push(t);
    } else if (isBefore(taskDate, selStart)) {
      previousTasks.push(t);
    } else if (isAfter(taskDate, selEnd)) {
      upcomingTasks.push(t);
    } else {
      todayTasks.push(t);
    }
  });

  upcomingTasks.sort((a, b) => {
    const dA = a.dueDate ? new Date(a.dueDate) : new Date(0);
    const dB = b.dueDate ? new Date(b.dueDate) : new Date(0);
    return dA - dB;
  });

  return { previousTasks, todayTasks, upcomingTasks };
};

const getSectionConfig = (colName, type) => {
  const colLower = colName.toLowerCase();

  let prevTitle = `Prev ${colName}`;
  let todayTitle = `Today ${colName}`;
  let upcomingTitle = `Upcoming ${colName}`;

  if (colLower === "overall overdue") {
    prevTitle = "Prev Overdue";
    todayTitle = "Due Today";
    upcomingTitle = "Upcoming Due";
  } else if (colLower === "in progress") {
    prevTitle = "Prev In Progress";
    todayTitle = "Today In Progress";
    upcomingTitle = "Upcoming In Progress";
  } else if (colLower === "on hold") {
    prevTitle = "Prev On Hold";
    todayTitle = "Today On Hold";
    upcomingTitle = "Upcoming On Hold";
  } else if (colLower === "in review") {
    prevTitle = "Prev In Review";
    todayTitle = "Today In Review";
    upcomingTitle = "Upcoming In Review";
  } else if (colLower === "completed") {
    prevTitle = "Prev Completed";
    todayTitle = "Today Completed";
    upcomingTitle = "Upcoming Completed";
  } else if (colLower === "pending") {
    prevTitle = "Prev Not Started";
    todayTitle = "Today Not Started";
    upcomingTitle = "Upcoming Not Started";
  }

  if (type === "prev") {
    return {
      title: prevTitle,
      badgeContainer:
        "bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/40",
      titleColor: "text-rose-700 dark:text-rose-300 font-extrabold tracking-wider",
      countBadge:
        "text-white bg-rose-600 dark:bg-rose-500 font-black shadow-xs",
      emptyText: `No previous ${colName.toLowerCase()} tasks`,
    };
  }
  if (type === "today") {
    return {
      title: todayTitle,
      badgeContainer:
        "bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/40",
      titleColor: "text-amber-800 dark:text-amber-300 font-extrabold tracking-wider",
      countBadge:
        "text-white bg-amber-600 dark:bg-amber-500 font-black shadow-xs",
      emptyText: `No ${colName.toLowerCase()} tasks today`,
    };
  }
  return {
    title: upcomingTitle,
    badgeContainer:
      "bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/40",
    titleColor: "text-sky-800 dark:text-sky-300 font-extrabold tracking-wider",
    countBadge:
      "text-white bg-sky-600 dark:bg-sky-500 font-black shadow-xs",
    emptyText: `No upcoming ${colName.toLowerCase()} tasks`,
  };
};

const TaskCard = React.memo(({ task, selectedDate, designers, clients, projects }) => {
  let clientName = "No Client";
  if (task.client) {
    const cId =
      typeof task.client === "object" ? task.client._id : task.client;
    const c =
      clients?.find((x) => x._id === cId) ||
      (typeof task.client === "object" ? task.client : null);
    clientName = c?.companyName || c?.name || "Unknown Client";
  } else if (task.project) {
    const pId =
      typeof task.project === "object" ? task.project._id : task.project;
    const p =
      projects?.find((x) => x._id === pId) ||
      (typeof task.project === "object" ? task.project : null);
    if (p && p.client) {
      const cId = typeof p.client === "object" ? p.client?._id : p.client;
      const c =
        clients?.find((x) => x._id === cId) ||
        (typeof p.client === "object" ? p.client : null);
      clientName = c?.companyName || c?.name || "Unknown Client";
    }
  }

  const aId = task.assignedTo
    ? typeof task.assignedTo === "object"
      ? task.assignedTo._id
      : task.assignedTo
    : null;
  const assignedUser = aId
    ? designers.find((d) => d._id === aId) ||
      (task.assignedTo && typeof task.assignedTo === "object"
        ? task.assignedTo
        : null)
    : null;
  const assignedByName = task.createdBy
    ? typeof task.createdBy === "object"
      ? task.createdBy.name
      : null
    : null;

  const profileImg =
    assignedUser?.profile?.profileImage?.url ||
    assignedUser?.profileImage?.url ||
    null;
  const initials = (assignedUser?.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const creatorInitials = (assignedByName || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isCompleted =
    task.status?.toLowerCase() === "completed" ||
    task.status?.toLowerCase().includes("approve");
  const completedDate = task.completedAt
    ? new Date(task.completedAt)
    : task.updatedAt
      ? new Date(task.updatedAt)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-[#131d2e] hover:bg-slate-50 dark:hover:bg-[#18263c] p-3.5 rounded-2xl border border-slate-200/90 dark:border-[#2a3850] hover:border-indigo-400 dark:hover:border-indigo-400/80 transition-all duration-200 shadow-xs hover:shadow-md relative group backdrop-blur-md flex flex-col gap-2.5 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-l-2xl opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Title row: icon + name */}
      <div className="flex items-start gap-2 pl-1 min-w-0">
        <FiFileText
          size={15}
          className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-[2px]"
        />
        <p
          className="text-[12.5px] font-bold text-[#0f172a] dark:text-[#f8fafc] leading-snug break-words"
          title={task.title}
        >
          {task.title}
        </p>
      </div>

      {/* Completion Date Badge — shown prominently for completed tasks */}
      {isCompleted && completedDate && !isNaN(completedDate.getTime()) && (
        <div className="pl-1">
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-600 dark:bg-emerald-600 text-white border border-emerald-500/40 shadow-xs w-full justify-center">
            <FiCheckCircle size={11} className="shrink-0" />
            <span>Completed: {format(completedDate, "MMM dd, h:mm a")}</span>
            {isSameDay(completedDate, new Date()) && (
              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
            )}
          </span>
        </div>
      )}

      {/* Due Date & Deadline Badge — shown for non-completed tasks */}
      {!isCompleted && task.dueDate && (
        <div className="pl-1 flex items-center justify-between gap-1">
          <span
            className={`shrink-0 flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg ${(() => {
              const days = getDaysRemaining(task.dueDate, selectedDate);
              if (days < 0)
                return "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40";
              if (days === 0)
                return "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40";
              if (days === 1)
                return "text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-500/40";
              return "text-[#334155] dark:text-[#cbd5e1] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
            })()}`}
          >
            <FiClock size={10} className="shrink-0" />
            <span>{format(parseISO(task.dueDate), "MMM dd")}</span>
            <span className="opacity-40 font-normal">|</span>
            <span className="truncate max-w-[140px]">
              {getDeadlineBadgeText(task.dueDate, task.status, selectedDate)}
            </span>
          </span>
        </div>
      )}

      {/* Project and Priority Info */}
      <div className="flex items-center justify-between gap-2 pl-1">
        <span
          className="text-[10.5px] font-bold text-[#334155] dark:text-[#f1f5f9] bg-[#f1f5f9] dark:bg-[#1e2b40] border border-slate-200 dark:border-[#334460] px-2.5 py-1 rounded-lg truncate max-w-[190px] shadow-2xs"
          title={clientName}
        >
          {clientName}
        </span>
        {task.priority && (
          <span
            className={`px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider shrink-0 shadow-2xs ${getPriorityStyle(task.priority)}`}
          >
            {task.priority}
          </span>
        )}
      </div>

      {/* Assigned User */}
      {(assignedUser || assignedByName) && (
        <div className="pl-1 pt-2 border-t border-slate-100 dark:border-[#223149] flex items-center justify-between gap-2">
          {/* Assigned To — left */}
          {assignedUser ? (
            <div
              className="flex items-center gap-1.5 min-w-0"
              title={`Assigned to: ${assignedUser.name}`}
            >
              {profileImg ? (
                <img
                  src={profileImg}
                  alt={assignedUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-400/50 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold ring-1 ring-indigo-400/40 shrink-0">
                  {initials}
                </div>
              )}
              <span className="text-[11.5px] font-bold text-[#0f172a] dark:text-[#f8fafc] truncate">
                {assignedUser.name}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Assigned By — right */}
          {assignedByName && (
            <div
              className="flex items-center gap-1.5 shrink-0"
              title={`Assigned by: ${assignedByName}`}
            >
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center text-[8.5px] font-bold ring-1 ring-amber-400/40 shrink-0">
                {creatorInitials || "SM"}
              </div>
              <span className="text-[10px] font-medium text-[#475569] dark:text-[#cbd5e1] truncate max-w-[85px]">
                {assignedByName}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

const LiveTaskBoard = ({
  designerTasks = [],
  designers = [],
  projects = [],
  clients = [],
  selectedDate = new Date(),
  targetDept = "Graphic Designer",
}) => {
  const boardColumns = useMemo(
    () => [
      "Overall Overdue",
      "Not Started",
      "In Progress",
      "On Hold",
      "IN REVIEW",
      "Completed",
    ],
    [],
  );

  const [boardFilter, setBoardFilter] = useState({
    search: "",
    assignee: "All",
    priority: "All",
    client: "All",
  });
  const [showBoardFilter, setShowBoardFilter] = useState(false);

  const getColumnForTask = (task) => {
    const status = task.status || "Not Started";

    if (boardColumns.includes(status)) return status;
    if (status.toLowerCase().includes("progress")) return "In Progress";
    if (status.toLowerCase().includes("hold")) return "On Hold";
    if (status.toLowerCase().includes("review")) return "IN REVIEW";
    if (status.toLowerCase().includes("revision")) return "IN REVIEW";
    if (status.toLowerCase().includes("reject")) return "Rejected";
    if (status.toLowerCase().includes("approve")) return "Completed";
    if (status.toLowerCase() === "completed") return "Completed";
    if (status.toLowerCase() === "assigned") return "Not Started";
    return "Not Started";
  };

  // Apply board-level filters to designerTasks
  const boardFilteredTasks = useMemo(() => {
    return designerTasks.filter((task) => {
      // Search filter
      if (boardFilter.search.trim()) {
        const q = boardFilter.search.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(q);
        const projId =
          typeof task.project === "object" ? task.project?._id : task.project;
        const proj = projects?.find((p) => p._id === projId);
        const projMatch = proj?.name?.toLowerCase().includes(q);
        if (!titleMatch && !projMatch) return false;
      }
      // Assignee filter
      if (boardFilter.assignee !== "All") {
        const aId =
          typeof task.assignedTo === "object"
            ? task.assignedTo?._id
            : task.assignedTo;
        if (aId !== boardFilter.assignee) return false;
      }
      // Priority filter
      if (boardFilter.priority !== "All") {
        if ((task.priority || "Medium") !== boardFilter.priority) return false;
      }
      // Client filter
      if (boardFilter.client !== "All") {
        let cId =
          typeof task.client === "object" ? task.client?._id : task.client;
        if (!cId && task.project) {
          const projId =
            typeof task.project === "object" ? task.project?._id : task.project;
          const proj = projects?.find((p) => p._id === projId);
          cId =
            typeof proj?.client === "object" ? proj?.client?._id : proj?.client;
        }
        if (cId !== boardFilter.client) return false;
      }
      return true;
    });
  }, [designerTasks, boardFilter, projects]);

  const tasksByColumn = useMemo(() => {
    const cols = {};
    boardColumns.forEach((c) => (cols[c] = []));
    boardFilteredTasks.forEach((task) => {
      const col = getColumnForTask(task);
      if (cols[col]) cols[col].push(task);

      // Mirror incomplete tasks that have a due date in the Overall Overdue column
      const isCompletedOrRejected =
        task.status?.toLowerCase() === "completed" ||
        task.status?.toLowerCase().includes("approve") ||
        task.status?.toLowerCase().includes("reject") ||
        task.status?.toLowerCase().includes("cancel");
      if (!isCompletedOrRejected && task.dueDate) {
        const daysRemaining = getDaysRemaining(task.dueDate, selectedDate);
        if (daysRemaining !== null) {
          cols["Overall Overdue"].push(task);
        }
      }
    });
    return cols;
  }, [boardFilteredTasks, selectedDate, boardColumns]);

  return (
    <div className="relative z-10 space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            <FiLayers
              className="text-indigo-500 dark:text-indigo-400"
              size={18}
            />
            Live Task Board
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE SYNC
          </span>
          {/* Active filter count badge */}
          {(() => {
            const activeCount = [
              boardFilter.search.trim() !== "",
              boardFilter.assignee !== "All",
              boardFilter.priority !== "All",
              boardFilter.client !== "All",
            ].filter(Boolean).length;
            return activeCount > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-black bg-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                <FiFilter size={9} />
                {activeCount} filter{activeCount > 1 ? "s" : ""} active
              </span>
            ) : null;
          })()}
        </div>

        {/* Filter toggle + Column Scroll Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowBoardFilter((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showBoardFilter
                ? "bg-indigo-500 text-white border-indigo-600 shadow-md"
                : "sidebar-bg text-slate-600 dark:text-slate-300 hover:text-indigo-600"
            }`}
            title="Toggle Board Filters"
          >
            <FiFilter size={13} />
            Filter
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sidebar-bg px-2.5 py-1 rounded-lg">
            {boardColumns.length} Columns
          </span>
        </div>
      </div>

      {/* Board Filter Panel */}
      {showBoardFilter && (
        <div className="bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-[#2a3850] rounded-2xl p-4 shadow-md">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Search Task
              </label>
              <div className="relative">
                <FiSearch
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={boardFilter.search}
                  onChange={(e) =>
                    setBoardFilter((f) => ({ ...f, search: e.target.value }))
                  }
                  placeholder="Search by task or project..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-[#1a2538] border border-slate-200 dark:border-[#2e3e56] rounded-lg text-[#0f172a] dark:text-[#f8fafc] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* Assignee */}
            <div className="min-w-[140px]">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Assignee
              </label>
              <select
                value={boardFilter.assignee}
                onChange={(e) =>
                  setBoardFilter((f) => ({ ...f, assignee: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-[#1a2538] border border-slate-200 dark:border-[#2e3e56] rounded-lg text-[#0f172a] dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-indigo-400/50 cursor-pointer"
              >
                <option value="All">All Designers</option>
                {designers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="min-w-[120px]">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                value={boardFilter.priority}
                onChange={(e) =>
                  setBoardFilter((f) => ({ ...f, priority: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-[#1a2538] border border-slate-200 dark:border-[#2e3e56] rounded-lg text-[#0f172a] dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-indigo-400/50 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Top High">🔴 Top High</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🔵 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            {/* Client */}
            <div className="min-w-[140px]">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Client
              </label>
              <select
                value={boardFilter.client}
                onChange={(e) =>
                  setBoardFilter((f) => ({ ...f, client: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-[#1a2538] border border-slate-200 dark:border-[#2e3e56] rounded-lg text-[#0f172a] dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-indigo-400/50 cursor-pointer"
              >
                <option value="All">All Clients</option>
                {clients?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear All */}
            {(boardFilter.search ||
              boardFilter.assignee !== "All" ||
              boardFilter.priority !== "All" ||
              boardFilter.client !== "All") && (
              <button
                onClick={() =>
                  setBoardFilter({
                    search: "",
                    assignee: "All",
                    priority: "All",
                    client: "All",
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer self-end"
              >
                <FiX size={11} />
                Clear All
              </button>
            )}

            {/* Task count indicator */}
            <div className="self-end ml-auto">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {boardFilteredTasks.length}
                </span>{" "}
                / {designerTasks.length} tasks
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Columns (Scrollable on Mobile, Stretched on Desktop) */}
      <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 pt-1 px-0.5 custom-scrollbar w-full min-h-[400px]">
        {boardColumns.map((col, i) => {
          let colBg = "bg-slate-100 dark:bg-[#131d2e]";
          let boardBg = "bg-slate-50/50 dark:bg-[#0b1220]";
          let colBorder = "border-slate-200 dark:border-[#223149]";
          let textCol = "text-[#0f172a] dark:text-[#f8fafc]";
          let countBg = "bg-slate-200 dark:bg-slate-700";
          let countText = "text-[#0f172a] dark:text-[#ffffff]";

          const lowerCol = col.toLowerCase();
          const isOverdueCol = lowerCol === "overall overdue";

          if (isOverdueCol) {
            colBg = "bg-rose-50/90 dark:bg-[#1a121e]";
            boardBg = "bg-rose-50/20 dark:bg-[#0b1220]";
            textCol = "text-rose-700 dark:text-rose-300";
            colBorder = "border-rose-200 dark:border-rose-900/50";
            countBg = "bg-rose-600 dark:bg-rose-500";
            countText = "text-white font-black";
          } else if (lowerCol === "pending" || lowerCol === "not started") {
            colBg = "bg-teal-50/90 dark:bg-[#0f1d1f]";
            boardBg = "bg-teal-50/20 dark:bg-[#0b1220]";
            textCol = "text-teal-700 dark:text-teal-300";
            colBorder = "border-teal-200 dark:border-teal-900/50";
            countBg = "bg-teal-600 dark:bg-teal-500";
            countText = "text-white font-black";
          } else if (lowerCol === "in progress") {
            colBg = "bg-sky-50/90 dark:bg-[#0e1b29]";
            boardBg = "bg-sky-50/20 dark:bg-[#0b1220]";
            textCol = "text-sky-700 dark:text-sky-300";
            colBorder = "border-sky-200 dark:border-sky-900/50";
            countBg = "bg-sky-600 dark:bg-sky-500";
            countText = "text-white font-black";
          } else if (lowerCol === "on hold") {
            colBg = "bg-fuchsia-50/90 dark:bg-[#1b1122]";
            boardBg = "bg-fuchsia-50/20 dark:bg-[#0b1220]";
            textCol = "text-fuchsia-700 dark:text-fuchsia-300";
            colBorder = "border-fuchsia-200 dark:border-fuchsia-900/50";
            countBg = "bg-fuchsia-600 dark:bg-fuchsia-500";
            countText = "text-white font-black";
          } else if (lowerCol === "in review") {
            colBg = "bg-amber-50/90 dark:bg-[#1d170f]";
            boardBg = "bg-amber-50/20 dark:bg-[#0b1220]";
            textCol = "text-amber-700 dark:text-amber-300";
            colBorder = "border-amber-200 dark:border-amber-900/50";
            countBg = "bg-amber-600 dark:bg-amber-500";
            countText = "text-white font-black";
          } else if (lowerCol === "completed") {
            colBg = "bg-emerald-50/90 dark:bg-[#0d1c16]";
            boardBg = "bg-emerald-50/20 dark:bg-[#0b1220]";
            textCol = "text-emerald-700 dark:text-emerald-300";
            colBorder = "border-emerald-200 dark:border-emerald-900/50";
            countBg = "bg-emerald-600 dark:bg-emerald-500";
            countText = "text-white font-black";
          } else if (lowerCol === "rejected") {
            colBg = "bg-rose-50/90 dark:bg-[#1a121e]";
            boardBg = "bg-rose-50/20 dark:bg-[#0b1220]";
            textCol = "text-rose-700 dark:text-rose-300";
            colBorder = "border-rose-200 dark:border-rose-900/50";
            countBg = "bg-rose-600 dark:bg-rose-500";
            countText = "text-white font-black";
          }

          const columnTasks = tasksByColumn[col] || [];
          const { previousTasks, todayTasks, upcomingTasks } =
            splitTasksByDateCategory(columnTasks, col, selectedDate);

          const prevConfig = getSectionConfig(col, "prev");
          const todayConfig = getSectionConfig(col, "today");
          const upcomingConfig = getSectionConfig(col, "upcoming");

          const isCompletedCol = lowerCol === "completed";

          if (!isCompletedCol) {
            return (
              <div
                key={i}
                className={`flex-1 min-w-[320px] md:min-w-[350px] shrink-0 ${boardBg} backdrop-blur-md rounded-2xl border ${colBorder} flex flex-col max-h-[600px] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden`}
              >
                <div
                  className={`p-3 px-3.5 border-b flex flex-col gap-2 rounded-t-2xl backdrop-blur-md ${colBg} ${colBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black tracking-wider uppercase truncate max-w-[70%] ${textCol}`}
                      title={col}
                    >
                      {col}
                    </span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full shrink-0 shadow-xs ${countBg} ${countText}`}
                    >
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Header breakdown pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 whitespace-nowrap shadow-2xs"
                      title={prevConfig.title}
                    >
                      Prev: {previousTasks.length}
                    </span>
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 whitespace-nowrap shadow-2xs"
                      title={todayConfig.title}
                    >
                      Today: {todayTasks.length}
                    </span>
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/40 whitespace-nowrap shadow-2xs"
                      title={upcomingConfig.title}
                    >
                      Upcoming: {upcomingTasks.length}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                  <div className="space-y-3">
                    {/* Previous Section */}
                    <div className="space-y-1.5">
                      <div
                        className={`flex items-center justify-between px-2 py-1 rounded-lg border ${prevConfig.badgeContainer}`}
                      >
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider truncate ${prevConfig.titleColor}`}
                        >
                          {prevConfig.title}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${prevConfig.countBadge}`}
                        >
                          {previousTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {previousTasks.length > 0 ? (
                            previousTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                selectedDate={selectedDate}
                                designers={designers}
                                clients={clients}
                                projects={projects}
                              />
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-1.5">
                              {prevConfig.emptyText}
                            </p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Today Section */}
                    <div className="space-y-1.5">
                      <div
                        className={`flex items-center justify-between px-2 py-1 rounded-lg border ${todayConfig.badgeContainer}`}
                      >
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider truncate ${todayConfig.titleColor}`}
                        >
                          {todayConfig.title}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${todayConfig.countBadge}`}
                        >
                          {todayTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {todayTasks.length > 0 ? (
                            todayTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                selectedDate={selectedDate}
                                designers={designers}
                                clients={clients}
                                projects={projects}
                              />
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-1.5">
                              {todayConfig.emptyText}
                            </p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Upcoming Section */}
                    <div className="space-y-1.5">
                      <div
                        className={`flex items-center justify-between px-2 py-1 rounded-lg border ${upcomingConfig.badgeContainer}`}
                      >
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider truncate ${upcomingConfig.titleColor}`}
                        >
                          {upcomingConfig.title}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${upcomingConfig.countBadge}`}
                        >
                          {upcomingTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {upcomingTasks.length > 0 ? (
                            upcomingTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                selectedDate={selectedDate}
                                designers={designers}
                                clients={clients}
                                projects={projects}
                              />
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-1.5">
                              {upcomingConfig.emptyText}
                            </p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`flex-1 min-w-[320px] md:min-w-[350px] shrink-0 ${boardBg} backdrop-blur-md rounded-2xl border ${colBorder} flex flex-col max-h-[600px] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden`}
            >
              <div
                className={`p-3 px-3.5 border-b flex items-center justify-between rounded-t-2xl backdrop-blur-md ${colBg} ${colBorder}`}
              >
                <span
                  className={`text-xs font-black tracking-wider uppercase truncate max-w-[75%] ${textCol}`}
                  title={col}
                >
                  {col}
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full shrink-0 shadow-xs ${countBg} ${countText}`}
                >
                  {todayTasks.length}
                </span>
              </div>

              <div className="p-2.5 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                <AnimatePresence>
                  {todayTasks.length > 0 ? (
                    todayTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        selectedDate={selectedDate}
                        designers={designers}
                        clients={clients}
                        projects={projects}
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
                        {todayConfig.emptyText}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(LiveTaskBoard);
