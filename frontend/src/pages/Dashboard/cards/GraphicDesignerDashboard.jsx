import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGetTasksQuery } from "../../../features/api/apiSlice";
import { getDesignerEodReports } from "../../../features/eodReports/designerEodReportSlice";
import {
  format,
  isToday,
  isPast,
  parseISO,
  differenceInDays,
  isYesterday,
  isAfter,
  subDays,
  isSameMonth,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiAlertCircle,
  FiActivity,
  FiFilter,
  FiChevronDown,
  FiCheckCircle,
} from "react-icons/fi";

const GraphicDesignerDashboard = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const { projects } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);
  const { designerEodReports = [] } = useSelector((state) => state.designerEodReports || {});
  const { data: allTasks = [], isLoading } = useGetTasksQuery();

  const [dateFilter, setDateFilter] = useState("All Time");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    dispatch(getDesignerEodReports());
  }, [dispatch]);

  // 1. Filter Graphic Designers
  const designers = useMemo(() => {
    return (
      users?.filter(
        (u) =>
          u.department?.toLowerCase().includes("graphic") ||
          u.department?.toLowerCase().includes("design"),
      ) || []
    );
  }, [users]);

  const designerIds = useMemo(() => designers.map((d) => d._id), [designers]);

  // 2. Filter Tasks assigned to Graphic Designers + Date Filter
  const designerTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Check Assignee
      if (!task.assignedTo) return false;
      const assigneeId =
        typeof task.assignedTo === "object"
          ? task.assignedTo._id
          : task.assignedTo;
      if (!designerIds.includes(assigneeId)) return false;

      // Check Date
      if (dateFilter === "All Time") return true;
      if (!task.createdAt) return true; // fallback

      const taskDate = parseISO(task.createdAt);
      if (dateFilter === "Today") return isToday(taskDate);
      if (dateFilter === "Yesterday") return isYesterday(taskDate);
      if (dateFilter === "Last 7 Days")
        return isAfter(taskDate, subDays(new Date(), 7));
      if (dateFilter === "This Month") return isSameMonth(taskDate, new Date());

      return true;
    });
  }, [allTasks, designerIds, dateFilter]);

  // 3. Compute Metrics
  const metrics = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    let inRevision = 0;
    let clientApproval = 0;

    designerTasks.forEach((task) => {
      const status = task.status?.toLowerCase() || "";
      if (status === "completed") completed++;
      else if (status.includes("revision")) inRevision++;
      else if (status.includes("client") || status.includes("approval"))
        clientApproval++;
      else pending++;

      if (
        task.dueDate &&
        isPast(parseISO(task.dueDate)) &&
        status !== "completed"
      ) {
        overdue++;
      }
    });

    return {
      designersWorking: designers.length,
      tasksAssigned: designerTasks.length,
      completed,
      pending,
      overdue,
      inRevision,
      clientApproval,
    };
  }, [designerTasks, designers.length]);

  // 4. Board Data
  const boardColumns = [
    "Assigned",
    "In Progress",
    "Revision Pending",
    "Revision",
    "Approved",
    "Completed",
  ];
  const getColumnForTask = (task) => {
    const status = task.status || "Assigned";
    if (boardColumns.includes(status)) return status;
    if (status.toLowerCase().includes("progress")) return "In Progress";
    if (status.toLowerCase().includes("review")) return "Revision Pending";
    if (status.toLowerCase().includes("revision")) return "Revision";
    if (status.toLowerCase().includes("approve")) return "Approved";
    if (status.toLowerCase() === "completed") return "Completed";
    return "Assigned";
  };

  const tasksByColumn = useMemo(() => {
    const cols = {};
    boardColumns.forEach((c) => (cols[c] = []));
    designerTasks.forEach((task) => {
      const col = getColumnForTask(task);
      if (cols[col]) cols[col].push(task);
    });
    return cols;
  }, [designerTasks]);

  // 5. Team Performance
  const teamPerformance = useMemo(() => {
    return designers.map((designer) => {
      const myTasks = designerTasks.filter((t) => {
        if (!t.assignedTo) return false;
        const aId =
          typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo;
        return aId === designer._id;
      });

      let comp = 0;
      let pend = 0;
      let over = 0;
      let totalRevisions = 0;
      let totalLoggedMs = 0;

      myTasks.forEach((t) => {
        const s = t.status?.toLowerCase() || "";
        if (s === "completed") comp++;
        else pend++;
        if (t.dueDate && isPast(parseISO(t.dueDate)) && s !== "completed")
          over++;

        totalRevisions += t.revisions || 0;

        if (t.actualStartTime) {
          const start = new Date(t.actualStartTime).getTime();
          const end = t.actualEndTime ? new Date(t.actualEndTime).getTime() : Date.now();
          totalLoggedMs += Math.max(0, end - start);
        }
      });

      const avgRevisions = myTasks.length > 0 ? totalRevisions / myTasks.length : 0;
      const totalHours = totalLoggedMs / (1000 * 60 * 60);

      // Find today's EOD report for this designer
      const todayStr = new Date().toISOString().split("T")[0];
      const designerReport = designerEodReports?.find((report) => {
        const rUserId = typeof report.user === "object" ? report.user?._id : report.user;
        if (rUserId !== designer._id) return false;
        const reportDate = new Date(report.date).toISOString().split("T")[0];
        return reportDate === todayStr;
      });

      let lastSubmittedStr = "Not submitted";
      if (designerReport) {
        if (designerReport.isDraft) {
          lastSubmittedStr = "Draft";
        } else {
          lastSubmittedStr = format(new Date(designerReport.updatedAt), "h:mm a");
        }
      }

      return {
        id: designer._id,
        name: designer.name,
        profileImage: designer.profilePic || designer.profileImage || designer.avatar || (designer.profile && designer.profile.profilePic),
        assigned: myTasks.length,
        completed: comp,
        pending: pend,
        overdue: over,
        avgRevisions,
        totalHours,
        lastSubmitted: lastSubmittedStr,
      };
    });
  }, [designers, designerTasks, designerEodReports]);

  // 6. Client Progress
  const clientProgress = useMemo(() => {
    const cp = {};
    designerTasks.forEach((task) => {
      let clientId = task.client;
      if (typeof clientId === "object" && clientId?._id)
        clientId = clientId._id;
      if (!clientId && task.project) {
        const projId =
          typeof task.project === "object" ? task.project._id : task.project;
        const proj = projects?.find((p) => p._id === projId);
        clientId = proj?.client?._id || proj?.client;
      }
      if (!clientId) return;

      if (!cp[clientId]) {
        cp[clientId] = {
          id: clientId,
          pending: 0,
          completed: 0,
          dueToday: 0,
          delayed: 0,
          revision: 0,
        };
      }

      const s = task.status?.toLowerCase() || "";
      if (s === "completed") cp[clientId].completed++;
      else {
        cp[clientId].pending++;
        if (s.includes("revision")) cp[clientId].revision++;
        if (task.dueDate) {
          if (isToday(parseISO(task.dueDate))) cp[clientId].dueToday++;
          if (isPast(parseISO(task.dueDate))) cp[clientId].delayed++;
        }
      }
    });

    return Object.values(cp).map((c) => {
      const cl = clients?.find((cl) => cl._id === c.id);
      return { ...c, name: cl?.name || cl?.companyName || "Unknown Client" };
    });
  }, [designerTasks, projects, clients]);

  // 7. Delayed Projects/Tasks
  const delayedTasks = useMemo(() => {
    return designerTasks
      .filter(
        (t) =>
          t.dueDate &&
          isPast(parseISO(t.dueDate)) &&
          t.status?.toLowerCase() !== "completed",
      )
      .map((t) => {
        let diff = differenceInDays(new Date(), parseISO(t.dueDate));
        return {
          ...t,
          daysDelayed:
            diff === 0 ? "Same day" : diff + (diff === 1 ? " day" : " days"),
        };
      });
  }, [designerTasks]);

  if (isLoading) {
    return (
      <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full flex items-center justify-center text-slate-400 font-mono text-sm tracking-widest uppercase shadow-inner border border-slate-200 dark:border-slate-800">
        Initializing Designer Board...
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-[#0b1120] space-y-8 font-sans mt-8 overflow-visible transition-colors duration-300 relative">
      {/* Decorative Blur Backgrounds for Dark Mode Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none hidden dark:block">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div className="space-y-1">
          <h2 className="text-xl lg:text-xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
              <FiActivity className="text-emerald-600 dark:text-emerald-400 text-xl" />
            </div>
            Graphic Designer Board
          </h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase pl-12">
            Real-time analytics & task tracking
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm backdrop-blur-md"
          >
            <FiFilter className="text-indigo-500 dark:text-indigo-400" />
            {dateFilter}
            <FiChevronDown
              className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden backdrop-blur-xl"
                >
                  {[
                    "Today",
                    "Yesterday",
                    "Last 7 Days",
                    "This Month",
                    "All Time",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setDateFilter(option);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${dateFilter === option ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Premium Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 relative z-10">
        {[
          {
            label: "Designers",
            value: metrics.designersWorking,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-blue-100 dark:border-blue-500/30 dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
          },
          {
            label: "Tasks Assigned",
            value: metrics.tasksAssigned,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-indigo-100 dark:border-indigo-500/30 dark:shadow-[0_0_15px_rgba(99,102,241,0.15)]",
          },
          {
            label: "Completed",
            value: metrics.completed,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-emerald-100 dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
          },
          {
            label: "Pending",
            value: metrics.pending,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-amber-100 dark:border-amber-500/30 dark:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
          },
          {
            label: "Overdue",
            value: metrics.overdue,
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-rose-100 dark:border-rose-500/30 dark:shadow-[0_0_15px_rgba(244,63,94,0.15)]",
          },
          {
            label: "In Revision",
            value: metrics.inRevision,
            color: "text-fuchsia-600 dark:text-fuchsia-400",
            bg: "bg-fuchsia-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-fuchsia-100 dark:border-fuchsia-500/30 dark:shadow-[0_0_15px_rgba(217,70,239,0.15)]",
          },
          {
            label: "Client Approval",
            value: metrics.clientApproval,
            color: "text-cyan-600 dark:text-cyan-400",
            bg: "bg-cyan-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-[#050b14] border-cyan-100 dark:border-cyan-500/30 dark:shadow-[0_0_15px_rgba(6,182,212,0.15)]",
          },
        ].map((m, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border ${m.bg} shadow-sm dark:shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 backdrop-blur-md`}
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span
              className={`text-3xl font-black ${m.color} relative z-10 drop-shadow-sm`}
            >
              {m.value}
            </span>
            <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 tracking-widest uppercase mt-1.5 leading-tight relative z-10">
              {m.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Pulse Line */}
      <div className="flex gap-1 h-4 w-full items-center relative z-10 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
        {Array.from({ length: 60 }).map((_, i) => {
          let color = "bg-slate-200 dark:bg-slate-800";
          const ratio = i / 60;
          if (ratio < metrics.completed / (metrics.tasksAssigned || 1))
            color =
              "bg-emerald-400 dark:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
          else if (
            ratio <
            (metrics.completed + metrics.pending) / (metrics.tasksAssigned || 1)
          )
            color = "bg-amber-400 dark:bg-amber-500";
          else if (
            ratio <
            (metrics.completed + metrics.pending + metrics.overdue) /
              (metrics.tasksAssigned || 1)
          )
            color = "bg-rose-400 dark:bg-rose-500";
          return (
            <div
              key={i}
              className={`flex-1 h-full rounded-full ${color} transition-colors duration-500 opacity-80 hover:opacity-100`}
            />
          );
        })}
      </div>

      {/* Live Task Board */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-base font-black text-slate-800 dark:text-white tracking-wide uppercase">
            Live Task Board
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE SYNC
          </span>
        </div>
        <div className="flex overflow-x-auto gap-5 pb-6 snap-x hide-scrollbar">
          {boardColumns.map((col, i) => (
            <div
              key={i}
              className="min-w-[280px] w-[280px] flex-shrink-0 snap-start bg-slate-50 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col max-h-[450px] shadow-sm"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-white dark:bg-transparent rounded-t-2xl">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-widest uppercase">
                  {col}
                </span>
                <span className="text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {tasksByColumn[col].length}
                </span>
              </div>
              <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                <AnimatePresence>
                  {tasksByColumn[col].map((task) => {
                    let projName = "No Project";
                    if (task.project) {
                      const pId =
                        typeof task.project === "object"
                          ? task.project._id
                          : task.project;
                      const p = projects?.find((x) => x._id === pId);
                      projName = p?.name || "Unknown";
                    }

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={task._id}
                        className="bg-white dark:bg-[#1e293b]/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all shadow-sm hover:shadow-md relative group"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600 rounded-l-xl opacity-80" />
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 truncate pl-2">
                          {projName}
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-100 leading-snug pl-2">
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <div
                            className={`mt-3 pl-2 flex items-center gap-1.5 text-[11px] font-bold ${isPast(parseISO(task.dueDate)) && task.status !== "Completed" ? "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded w-fit" : "text-slate-500 dark:text-slate-400"}`}
                          >
                            <FiClock size={12} />
                            {format(parseISO(task.dueDate), "MMM dd, yyyy")}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* Team Performance */}
        <div className="bg-white dark:bg-[#0f172a]/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm dark:shadow-xl">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-transparent flex justify-between items-center">
            <h3 className="text-sm font-medium  text-slate-800 dark:text-white tracking-widest ">
              Designer performance
            </h3>
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              today
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/80">
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Designer
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Assigned
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Completed
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Pending
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Revisions
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Hours
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Delay
                  </th>
                  <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Last Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {teamPerformance.map((tp) => (
                  <tr
                    key={tp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      {tp.profileImage ? (
                        <img src={tp.profileImage} alt={tp.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-900/90 dark:bg-blue-950 flex items-center justify-center text-white text-[9px] font-extrabold tracking-wider">
                          {getInitials(tp.name)}
                        </div>
                      )}
                      {tp.name}
                    </td>
                    <td className="p-4 text-sm font-black text-slate-600 dark:text-slate-300">
                      {tp.assigned}
                    </td>
                    <td className="p-4 text-sm font-black text-slate-600 dark:text-slate-300">
                      {tp.completed}
                    </td>
                    <td className="p-4 text-sm font-black text-slate-600 dark:text-slate-300">
                      {tp.pending}
                    </td>
                    <td className="p-4 text-sm font-black text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2.5 min-w-[110px]">
                        <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              tp.avgRevisions <= 1.5
                                ? "bg-emerald-600 dark:bg-emerald-500"
                                : tp.avgRevisions <= 3.0
                                ? "bg-amber-600 dark:bg-amber-500"
                                : "bg-rose-600 dark:bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(100, (tp.avgRevisions / 5) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {tp.avgRevisions.toFixed(1)} avg
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-black text-slate-600 dark:text-slate-300">
                      {tp.totalHours.toFixed(1)}h
                    </td>
                    <td className={`p-4 text-sm font-black ${tp.overdue > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                      {tp.overdue}
                    </td>
                    <td className={`p-4 text-xs font-bold ${tp.lastSubmitted === "Not submitted" ? "text-slate-400 dark:text-slate-500 font-semibold" : "text-slate-700 dark:text-slate-300"}`}>
                      {tp.lastSubmitted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delayed Projects & Bottlenecks */}
      <div className="bg-white dark:bg-[#0f172a]/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm dark:shadow-xl relative z-10">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/80 flex items-center gap-3 bg-slate-50 dark:bg-transparent">
          <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
            <FiAlertCircle className="text-lg" />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-widest uppercase">
            Delayed Projects & Bottlenecks
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {delayedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-emerald-500 dark:text-emerald-400">
              <FiCheckCircle className="text-4xl mb-3 opacity-50" />
              <p className="text-sm font-black tracking-widest uppercase">
                Zero Delays!
              </p>
            </div>
          ) : (
            delayedTasks.slice(0, 5).map((task) => {
              let projName = "No Project";
              if (task.project) {
                const pId =
                  typeof task.project === "object"
                    ? task.project._id
                    : task.project;
                const p = projects?.find((x) => x._id === pId);
                projName = p?.name || "Unknown";
              }
              return (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 rounded-xl border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-500/10 shadow-sm dark:shadow-none transition-transform hover:-translate-y-0.5"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {projName} —{" "}
                      <span className="text-slate-500 dark:text-slate-400">
                        {task.title}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                      {task.status}
                    </p>
                  </div>
                  <div className="text-xs font-black text-rose-600 dark:text-rose-300 bg-white dark:bg-rose-500/20 px-4 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 shadow-sm">
                    {task.daysDelayed}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphicDesignerDashboard;
