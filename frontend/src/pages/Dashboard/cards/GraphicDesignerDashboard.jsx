import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetTasksQuery } from "../../../features/api/apiSlice";
import { format, isToday, isPast, parseISO, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import { FiClock, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiUser, FiActivity } from "react-icons/fi";

const GraphicDesignerDashboard = () => {
  const { users } = useSelector((state) => state.users);
  const { projects } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);
  const { data: allTasks = [], isLoading } = useGetTasksQuery();

  // 1. Filter Graphic Designers
  const designers = useMemo(() => {
    return users?.filter(
      (u) =>
        u.department?.toLowerCase().includes("graphic") ||
        u.department?.toLowerCase().includes("design")
    ) || [];
  }, [users]);

  const designerIds = useMemo(() => designers.map((d) => d._id), [designers]);

  // 2. Filter Tasks assigned to Graphic Designers
  const designerTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (!task.assignedTo) return false;
      const assigneeId = typeof task.assignedTo === "object" ? task.assignedTo._id : task.assignedTo;
      return designerIds.includes(assigneeId);
    });
  }, [allTasks, designerIds]);

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
      else if (status.includes("client") || status.includes("approval")) clientApproval++;
      else pending++;

      if (task.dueDate && isPast(parseISO(task.dueDate)) && status !== "completed") {
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
  const boardColumns = ["Assigned", "In Progress", "Revision Pending", "Revision", "Approved", "Completed"];
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
        const aId = typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo;
        return aId === designer._id;
      });
      let comp = 0;
      let pend = 0;
      let over = 0;
      myTasks.forEach((t) => {
        const s = t.status?.toLowerCase() || "";
        if (s === "completed") comp++;
        else pend++;
        if (t.dueDate && isPast(parseISO(t.dueDate)) && s !== "completed") over++;
      });
      return {
        id: designer._id,
        name: designer.name,
        assigned: myTasks.length,
        completed: comp,
        pending: pend,
        overdue: over,
      };
    });
  }, [designers, designerTasks]);

  // 6. Client Progress
  const clientProgress = useMemo(() => {
    const cp = {};
    designerTasks.forEach((task) => {
      let clientId = task.client;
      if (typeof clientId === "object" && clientId?._id) clientId = clientId._id;
      if (!clientId && task.project) {
        // try to get from project
        const projId = typeof task.project === "object" ? task.project._id : task.project;
        const proj = projects?.find((p) => p._id === projId);
        clientId = proj?.client?._id || proj?.client;
      }
      if (!clientId) return;

      if (!cp[clientId]) {
        cp[clientId] = { id: clientId, pending: 0, completed: 0, dueToday: 0, delayed: 0, revision: 0 };
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

    return Object.values(cp).map(c => {
      const cl = clients?.find(cl => cl._id === c.id);
      return { ...c, name: cl?.name || cl?.companyName || "Unknown Client" };
    });
  }, [designerTasks, projects, clients]);

  // 7. Delayed Projects/Tasks
  const delayedTasks = useMemo(() => {
    return designerTasks
      .filter((t) => t.dueDate && isPast(parseISO(t.dueDate)) && t.status?.toLowerCase() !== "completed")
      .map(t => {
        let diff = differenceInDays(new Date(), parseISO(t.dueDate));
        return {
          ...t,
          daysDelayed: diff === 0 ? "Same day" : diff + (diff === 1 ? " day" : " days")
        };
      });
  }, [designerTasks]);


  if (isLoading) {
    return <div className="animate-pulse h-96 bg-slate-800/50 rounded-2xl w-full flex items-center justify-center text-slate-400 font-mono text-sm tracking-widest uppercase">Initializing Designer Board...</div>;
  }

  return (
    <div className=" border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 shadow-xl dark:shadow-2xl space-y-8 font-sans mt-8 overflow-hidden transition-colors duration-300">
      
      {/* Header & Pulse Tracker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <FiActivity className="text-emerald-500 dark:text-emerald-400" />
            Graphic Designer Board
          </h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Live updates across all projects</p>
        </div>
        <div className="flex gap-1 h-3 flex-1 max-w-xl justify-end items-center">
          {/* Simulated pulse grid based on task count */}
          {Array.from({ length: 40 }).map((_, i) => {
            let color = "bg-slate-200 dark:bg-slate-800/50";
            if (i < metrics.completed / 2) color = "bg-emerald-400 dark:bg-emerald-500/80";
            else if (i < (metrics.completed + metrics.pending) / 2) color = "bg-amber-400 dark:bg-amber-500/80";
            else if (i < (metrics.completed + metrics.pending + metrics.overdue) / 2) color = "bg-rose-400 dark:bg-rose-500/80";
            return (
              <div key={i} className={`w-3 h-full rounded-sm ${color} border border-slate-300 dark:border-black/20`} />
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Designers", value: metrics.designersWorking, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30" },
          { label: "Tasks Assigned", value: metrics.tasksAssigned, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30" },
          { label: "Completed", value: metrics.completed, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30" },
          { label: "Pending", value: metrics.pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30" },
          { label: "Overdue", value: metrics.overdue, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30" },
          { label: "In Revision", value: metrics.inRevision, color: "text-fuchsia-600 dark:text-fuchsia-400", bg: "bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-900/20 dark:border-fuchsia-800/30" },
          { label: "Client Approval", value: metrics.clientApproval, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 border-cyan-100 dark:bg-cyan-900/20 dark:border-cyan-800/30" },
        ].map((m, i) => (
          <div key={i} className={`flex flex-col p-3 rounded-xl border ${m.bg} shadow-sm dark:shadow-inner relative overflow-hidden group`}>
            {/* Elegant dark mode gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className={`text-2xl font-black ${m.color} relative z-10`}>{m.value}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1 leading-tight relative z-10">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Live Task Board */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Live Task Board</h3>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-widest">REAL-TIME</span>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
          {boardColumns.map((col, i) => (
            <div key={i} className="min-w-[240px] w-[240px] flex-shrink-0 snap-start bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col max-h-[400px]">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-white/50 dark:bg-transparent rounded-t-xl">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 tracking-widest uppercase">{col}</span>
                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{tasksByColumn[col].length}</span>
              </div>
              <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                {tasksByColumn[col].map((task) => {
                  let projName = "No Project";
                  if (task.project) {
                     const pId = typeof task.project === 'object' ? task.project._id : task.project;
                     const p = projects?.find(x => x._id === pId);
                     projName = p?.name || "Unknown";
                  }
                  
                  return (
                    <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} key={task._id} className="bg-white dark:bg-[#1e293b] p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-md relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-500 opacity-50" />
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 truncate pl-2">{projName}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug pl-2">{task.title}</p>
                      {task.dueDate && (
                        <div className={`mt-3 pl-2 flex items-center gap-1.5 text-[10px] font-bold ${isPast(parseISO(task.dueDate)) && task.status !== 'Completed' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500'}`}>
                          <FiClock size={10} />
                          {format(parseISO(task.dueDate), "MMM dd")}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-none">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-transparent">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Team Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Designer</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Assigned</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Completed</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Pending</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {teamPerformance.map((tp) => (
                  <tr key={tp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-200">{tp.name}</td>
                    <td className="p-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{tp.assigned}</td>
                    <td className="p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">{tp.completed}</td>
                    <td className="p-3 text-xs font-bold text-amber-600 dark:text-amber-400">{tp.pending}</td>
                    <td className="p-3 text-xs font-bold text-rose-600 dark:text-rose-400">{tp.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client-wise Progress */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-none">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-transparent">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Client-wise Progress</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Client</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Pending</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Completed</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Due Today</th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Delayed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {clientProgress.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-200">{cp.name}</td>
                    <td className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300">{cp.pending}</td>
                    <td className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300">{cp.completed}</td>
                    <td className="p-3 text-xs font-bold text-amber-600 dark:text-amber-400">{cp.dueToday}</td>
                    <td className="p-3 text-xs font-bold text-rose-600 dark:text-rose-400">{cp.delayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delayed Projects & Bottlenecks */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2 bg-slate-50/50 dark:bg-transparent">
          <FiAlertCircle className="text-rose-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Delayed Projects & Bottlenecks</h3>
        </div>
        <div className="p-4 space-y-3">
          {delayedTasks.length === 0 ? (
            <p className="text-xs text-slate-500 font-bold">No delayed tasks currently.</p>
          ) : (
            delayedTasks.slice(0, 5).map(task => {
              let projName = "No Project";
              if (task.project) {
                 const pId = typeof task.project === 'object' ? task.project._id : task.project;
                 const p = projects?.find(x => x._id === pId);
                 projName = p?.name || "Unknown";
              }
              return (
                <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-500/5 shadow-sm dark:shadow-none">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{projName} — <span className="text-slate-500 dark:text-slate-400">{task.title}</span></h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{task.status}</p>
                  </div>
                  <div className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">
                    {task.daysDelayed}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default GraphicDesignerDashboard;
