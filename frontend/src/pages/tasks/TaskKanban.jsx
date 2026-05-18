import React from "react";
import { FiEdit2, FiCheckSquare } from "react-icons/fi";

const TaskKanban = ({ tasks, onEdit, onToggleComplete }) => {
  const columns = [
    { id: "pending", title: "Pending", color: "bg-slate-100", headerColor: "text-slate-600" },
    { id: "in-progress", title: "In Progress", color: "bg-blue-50", headerColor: "text-blue-600" },
    { id: "review", title: "Review", color: "bg-amber-50", headerColor: "text-amber-600" },
    { id: "completed", title: "Completed", color: "bg-emerald-50", headerColor: "text-emerald-600" }
  ];

  const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase() || "";
    if (p === "urgent" || p === "high") return "bg-rose-500";
    if (p === "medium") return "bg-amber-500";
    return "bg-emerald-500";
  };
  
  const getAvatarColor = (name) => {
    const colors = ["bg-indigo-100 text-indigo-600", "bg-rose-100 text-rose-600", "bg-amber-100 text-amber-600", "bg-emerald-100 text-emerald-600"];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  return (
    <div className="flex items-start gap-6 overflow-x-auto pb-4 h-full min-h-[60vh] custom-scrollbar">
      {columns.map(col => {
        const colTasks = tasks.filter(t => {
          const status = t.status?.toLowerCase() || "pending";
          if (col.id === "pending") return status.includes("pending") || status.includes("assigned");
          if (col.id === "in-progress") return status.includes("progress");
          if (col.id === "review") return status.includes("review") || status.includes("hold");
          if (col.id === "completed") return status.includes("completed") || status.includes("done");
          return false;
        });

        return (
          <div key={col.id} className={`flex-shrink-0 w-80 rounded-2xl p-4 flex flex-col gap-4 ${col.color} border border-white/50 shadow-sm`}>
            <div className="flex items-center justify-between px-1">
              <h3 className={`font-black uppercase tracking-wider text-sm ${col.headerColor}`}>{col.title}</h3>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm">{colTasks.length}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {colTasks.map(task => {
                const isCompleted = task.status?.toLowerCase() === "completed";
                const assigneeName = task.assignedTo?.name || "Unassigned";
                const clientName = task.project?.client?.companyName || task.project?.title || "Internal";

                return (
                  <div 
                    key={task._id} 
                    onClick={() => onEdit(task)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[120px]">{clientName}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleComplete) onToggleComplete(task);
                        }}
                        className="w-5 h-5 flex-shrink-0 rounded-[6px] border border-slate-300 flex items-center justify-center text-white transition-all overflow-hidden bg-white hover:border-indigo-400"
                      >
                        {isCompleted && <div className="w-full h-full bg-emerald-500 flex items-center justify-center"><FiCheckSquare size={12} /></div>}
                      </button>
                    </div>
                    
                    <h4 className={`text-[13px] font-bold mb-4 line-clamp-2 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${getAvatarColor(assigneeName)}`}>
                          {assigneeName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{assigneeName.split(' ')[0]}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }} 
                        className="text-slate-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskKanban;
