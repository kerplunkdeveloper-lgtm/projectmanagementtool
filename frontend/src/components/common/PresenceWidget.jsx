import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetTasksQuery } from "../../features/api/apiSlice";

const PresenceWidget = ({ presence, layout = "floating" }) => {
  const { user } = useSelector((state) => state.auth);
  const { data: tasksData } = useGetTasksQuery(undefined, {
    pollingInterval: 30000,
  });

  const [productiveTime, setProductiveTime] = useState("");
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    if (!tasksData || !tasksData.data || !user) return;
    
    // Find any "In Progress" task for the current user
    const inProgressTask = tasksData.data.find(
      (t) =>
        t.status === "In Progress" &&
        (t.assignedTo?._id === user?._id || t.assignedTo === user?._id)
    );
    
    if (inProgressTask) {
      setActiveTask(inProgressTask);
    } else {
      setActiveTask(null);
    }
  }, [tasksData, user]);

  useEffect(() => {
    if (!activeTask) return;
    
    const interval = setInterval(() => {
      let totalMs = activeTask.totalLoggedMs || 0;
      
      if (!activeTask.pausedAt && activeTask.actualStartTime) {
        let sessionStart = new Date(activeTask.actualStartTime).getTime();
        const elapsed = Date.now() - sessionStart - (activeTask.totalPausedMs || 0);
        totalMs += Math.max(0, elapsed);
      }
      
      const totalMinutes = Math.floor(totalMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      setProductiveTime(`${hours}h ${mins}m`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTask]);

  if (!user) return null;

  // Do not show widget for management roles
  const hiddenRoles = ['admin', 'operation manager', 'social media manager', 'operationmanager', 'socialmediamanager'];
  if (user.role && hiddenRoles.includes(user.role.toLowerCase())) {
    return null;
  }

  const getPresenceDisplay = () => {
    switch (presence) {
      case "online": return { color: "text-emerald-500", dot: "bg-emerald-500 animate-pulse", text: "Online" };
      case "away": return { color: "text-amber-500", dot: "bg-amber-500", text: "Away" };
      case "offline": return { color: "text-rose-500", dot: "bg-rose-500", text: "Offline" };
      default: return { color: "text-slate-400", dot: "bg-slate-400", text: "Unknown" };
    }
  };

  const pDisplay = getPresenceDisplay();
  const isWorking = activeTask && !activeTask.pausedAt && !activeTask.autoPaused;
  const isPaused = activeTask && (activeTask.pausedAt || activeTask.autoPaused);

  if (layout === "navbar") {
    return (
      <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60 mr-2">
        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${pDisplay.color}`}>
          <span className={`w-2 h-2 rounded-full ${pDisplay.dot}`} />
          {pDisplay.text}
        </div>
        
        <div className="w-[1px] h-3 bg-slate-300 dark:bg-slate-600"></div>
        
        <div className="flex items-center gap-1.5">
          {isWorking ? (
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              ▶ Working {productiveTime && `(${productiveTime})`}
            </span>
          ) : isPaused ? (
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
              ⏸ Paused
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              ⏹ Not Working
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 w-64 pointer-events-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          User: {user.name}
        </span>
        <div className={`flex items-center gap-1.5 text-xs font-black ${pDisplay.color}`}>
          <span className={`w-2 h-2 rounded-full ${pDisplay.dot}`} />
          {pDisplay.text}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {isWorking ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold">
              ▶ Working
            </span>
          ) : isPaused ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
              ⏸ Paused
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold">
              ⏹ Not Working
            </span>
          )}
        </div>

        {activeTask && (
          <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              Active Task:
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-2">
              {activeTask.title}
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {activeTask.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] mt-1">
              <span className="text-slate-500 dark:text-slate-400">Productive Time:</span>
              <span className="font-black text-slate-800 dark:text-slate-200 font-mono">
                {productiveTime || "0h 0m"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceWidget;
