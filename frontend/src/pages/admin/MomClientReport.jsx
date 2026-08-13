import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGetTasksQuery, useGetProjectsQuery } from "../../features/api/apiSlice";
import { getUsers } from "../../features/users/userSlice";
import { FiFileText, FiClock, FiCheckCircle, FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ClientBadge from "../../components/common/ClientBadge";

const SimpleTimeTracker = ({
  startTime,
  endTime,
  status,
  pausedAt,
  autoPaused,
  savedPausedMs = 0,
  isBlocked,
  blockerPausedAt,
  blockerHistory,
  mode = "active",
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [blockedMs, setBlockedMs] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      let end;

      if (endTime) {
        end = new Date(endTime).getTime();
      } else if (status === "In Progress" && autoPaused) {
        end = pausedAt ? new Date(pausedAt).getTime() : Date.now();
      } else if (
        pausedAt &&
        ["On Hold", "Rejected", "In Review", "Correction"].includes(status)
      ) {
        end = new Date(pausedAt).getTime();
      } else {
        end = Date.now();
      }

      let totalPauseMs = 0;
      if (blockerHistory && blockerHistory.length > 0) {
        blockerHistory.forEach((item) => {
          if (item.pausedAt) {
            const p = new Date(item.pausedAt).getTime();
            let r = item.resumedAt
              ? new Date(item.resumedAt).getTime()
              : Date.now();
            if (r > end) r = end;
            if (r >= p) {
              totalPauseMs += r - p;
            }
          }
        });
      }

      if (isBlocked && blockerPausedAt) {
        const pauseStart = new Date(blockerPausedAt).getTime();
        if (pauseStart < end) {
          totalPauseMs += end - pauseStart;
        }
      }

      const totalElapsedMs = end - start - (savedPausedMs || 0) - totalPauseMs;
      return {
        active: Math.max(0, Math.floor(totalElapsedMs / 1000)),
        blocked: Math.max(0, Math.floor(totalPauseMs / 1000)),
      };
    };

    const update = () => {
      const { active, blocked } = calculateTime();
      setElapsed(active);
      setBlockedMs(blocked);
    };

    update();

    if (status === "In Progress" && !autoPaused && !endTime) {
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [
    startTime,
    endTime,
    pausedAt,
    autoPaused,
    status,
    isBlocked,
    blockerPausedAt,
    blockerHistory,
    savedPausedMs,
  ]);

  if (!startTime) {
    if (!status || status.toLowerCase() === "pending") {
      return (
        <span className="text-slate-455 dark:text-slate-500 font-semibold text-[11px]">
          Not started
        </span>
      );
    }
    return (
      <span className="text-slate-455 dark:text-slate-500 font-normal">—</span>
    );
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  };

  if (mode === "blocker") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-black border shadow-2xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
        {formatTime(blockedMs)}
      </span>
    );
  }

  const colorClasses =
    status === "In Progress"
      ? "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-955/30 dark:text-blue-400 dark:border-blue-900/30"
      : status === "In Review"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-550/10 dark:text-amber-400 dark:border-amber-550/30"
        : status === "On Hold"
          ? "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30"
          : status === "Completed"
            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
            : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-500/5 dark:text-slate-400 dark:border-slate-500/20";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-black border shadow-2xs ${colorClasses}`}
    >
      {formatTime(elapsed)}
    </span>
  );
};

const renderUserAvatarSmall = (u, sizeClass = "w-6 h-6 text-[8px]") => {
  if (!u) return null;
  const avatarUrl =
    (typeof u.profile?.profileImage === "object"
      ? u.profile?.profileImage?.url
      : u.profile?.profileImage) ||
    (typeof u.profileImage === "object"
      ? u.profileImage?.url
      : u.profileImage) ||
    u.profilePic ||
    u.avatar ||
    u.profile?.profilePic ||
    u.profile?.avatar;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={u.name || "User"}
        className={`${sizeClass} rounded-full object-cover border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0`}
      />
    );
  }

  const initials = (u.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const AVATAR_COLORS = [
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
  ];
  const colorClass =
    AVATAR_COLORS[((u.name || "U").charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black border border-white/10 shadow-2xs shrink-0`}
    >
      {initials}
    </div>
  );
};

const getStatusStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "pending" || s === "to do") {
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
  if (s === "in progress") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
  }
  if (s === "on hold") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
  }
  if (s === "in review") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
  }
  if (s === "completed" || s === "done") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";
  }
  if (s === "correction") {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
  }
  if (s === "rejected") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const getPriorityStyle = (priority) => {
  const p = (priority || "").toLowerCase();
  if (p === "top high") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-bold";
  }
  if (p === "high") {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-bold";
  }
  if (p === "medium") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const MomClientReport = () => {
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery(undefined, {
    skip: !user,
  });

  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery(undefined, {
    skip: !user,
  });

  const [dateFilter, setDateFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [localCheckedTasks, setLocalCheckedTasks] = useState(new Set());

  const handleToggleCheck = (taskId) => {
    setLocalCheckedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if ((task.contentType || "").toUpperCase() !== "MOM") return false;

      const assigneeId = task.assignedTo?._id || task.assignedTo;
      if (assigneeFilter && assigneeId !== assigneeFilter) return false;

      const projId = task.project?._id || task.project;
      const projectObj = projects.find((p) => p._id === projId);
      const clientObj = task.project?.client?.companyName ? task.project.client : projectObj?.client;
      const clientId = clientObj?._id || clientObj;
      
      if (clientFilter && clientId !== clientFilter) return false;

      if (dateFilter) {
        const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
        if (taskDate !== dateFilter) return false;
      }

      return true;
    });
  }, [tasks, users, projects, dateFilter, assigneeFilter, clientFilter]);

  const uniqueAssignees = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      if ((task.contentType || "").toUpperCase() === "MOM") {
        const id = task.assignedTo?._id || task.assignedTo;
        if (id && !map.has(id)) {
           const name = typeof task.assignedTo === "object" ? task.assignedTo.name : users?.find(u => (u._id || u.id) === id)?.name || "Unknown";
           map.set(id, { id, name });
        }
      }
    });
    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [tasks, users]);

  const uniqueClients = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      if ((task.contentType || "").toUpperCase() === "MOM") {
        const projId = task.project?._id || task.project;
        const projectObj = projects.find((p) => p._id === projId);
        const clientObj = task.project?.client?.companyName ? task.project.client : projectObj?.client;
        const clientId = clientObj?._id || clientObj;
        const clientName = clientObj?.companyName || "Unknown Client";
        if (clientId && !map.has(clientId)) {
           map.set(clientId, { id: clientId, name: clientName });
        }
      }
    });
    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [tasks, projects]);

  const handleAdjustDate = (days) => {
    let d;
    if (dateFilter) {
      const [year, month, day] = dateFilter.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date();
    }
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    setDateFilter(`${y}-${m}-${dayStr}`);
  };

  const handleSetToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    setDateFilter(`${y}-${m}-${dayStr}`);
  };

  const getDisplayDate = () => {
    if (!dateFilter) return "Select Date";
    const [year, month, day] = dateFilter.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const loading = tasksLoading || projectsLoading;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#020710] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-md">
        <div className="bg-white/20 p-2 rounded-lg">
          <FiFileText size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">MOM Client Report</h1>
          <p className="text-xs font-medium text-indigo-100">Social Media Team - MOM Tasks Overview</p>
        </div>
      </div>
      
      <div className="px-6 py-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-4 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[150px] shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">All Assignees</option>
              {uniqueAssignees.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[150px] shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">All Clients</option>
              {uniqueClients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDateFilter("")}
              className="px-4 py-2 bg-[#f0f5fa] dark:bg-slate-800 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
            >
              All Dates
            </button>
            <button
              onClick={handleSetToday}
              className="px-4 py-2 bg-[#f0f5fa] dark:bg-slate-800 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Today
            </button>

            <div 
              className="relative group cursor-pointer" 
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input[type="date"]');
                if (input && typeof input.showPicker === 'function') {
                  input.showPicker();
                }
              }}
            >
              <div className="flex items-center gap-3 px-4 py-2 bg-[#f0f5fa] dark:bg-slate-800 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 rounded-xl transition-colors min-w-[150px] justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-emerald-500" size={16} />
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">
                    {getDisplayDate()}
                  </span>
                </div>
                <FiChevronDown className="text-slate-400" size={14} />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center bg-[#f0f5fa] dark:bg-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => handleAdjustDate(-1)}
                className="px-3 py-2 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <FiChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-600"></div>
              <button
                onClick={() => handleAdjustDate(1)}
                className="px-3 py-2 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <FiChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-slate-500 text-sm font-medium animate-pulse">Loading reports...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#151b2b] border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 w-24 text-center">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Check</span>
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Assignee</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Client Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Task Title</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Start Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">End Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Time Tracker</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No MOM tasks found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const assigneeId = task.assignedTo?._id || task.assignedTo;
                      const assigneeName = typeof task.assignedTo === "object" ? task.assignedTo?.name : (users?.find(u => (u._id || u.id) === assigneeId)?.name || "Unknown");
                      
                      const projId = task.project?._id || task.project;
                      const projectObj = projects.find((p) => p._id === projId);
                      const clientObj = task.project?.client?.companyName ? task.project.client : projectObj?.client;
                      const clientName = clientObj?.companyName || "Unknown Client";
                      
                      const assigneeUserObj = typeof task.assignedTo === "object" ? task.assignedTo : users?.find(u => (u._id || u.id) === assigneeId);

                      const isCompleted = task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "done";

                      return (
                        <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleToggleCheck(task._id)}
                                className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors ${
                                  (isCompleted || localCheckedTasks.has(task._id))
                                    ? "bg-emerald-500 text-white border-emerald-500" 
                                    : "border-2 border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {(isCompleted || localCheckedTasks.has(task._id)) && <FiCheckCircle size={12} strokeWidth={3} />}
                              </button>
                              {(isCompleted || localCheckedTasks.has(task._id)) && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Checked</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                              {renderUserAvatarSmall(assigneeUserObj, "w-7 h-7 text-[9px]")}
                              <span>{assigneeName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {clientObj ? <ClientBadge client={clientObj} /> : clientName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                            {task.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {task.startDate ? new Date(task.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className={`px-2 py-1 rounded-md ${getPriorityStyle(task.priority)}`}>
                              {task.priority || "Medium"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <SimpleTimeTracker 
                              startTime={task.startTime}
                              endTime={task.endTime}
                              status={task.status}
                              pausedAt={task.pausedAt}
                              autoPaused={task.autoPaused}
                              savedPausedMs={task.savedPausedMs}
                              isBlocked={task.isBlocked}
                              blockerPausedAt={task.blockerPausedAt}
                              blockerHistory={task.blockerHistory}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-center">
                            <span className={`px-2 py-1 rounded-md ${getStatusStyle(task.status)} font-bold`}>
                              {task.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomClientReport;
