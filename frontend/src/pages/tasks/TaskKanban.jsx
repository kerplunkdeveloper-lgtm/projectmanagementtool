import React from "react";
import { FiEdit2 } from "react-icons/fi";

const COLUMNS = [
  { id: "pending",     title: "Pending",     bg: "bg-slate-50",   border: "border-slate-200", header: "text-slate-600",   dot: "bg-slate-400" },
  { id: "in-progress", title: "In Progress", bg: "bg-blue-50",    border: "border-blue-200",  header: "text-blue-600",    dot: "bg-blue-500" },
  { id: "review",      title: "Review",      bg: "bg-amber-50",   border: "border-amber-200", header: "text-amber-600",   dot: "bg-amber-500" },
  { id: "completed",   title: "Completed",   bg: "bg-emerald-50", border: "border-emerald-200",header: "text-emerald-600",dot: "bg-emerald-500" },
];

const PRIORITY_DOT = { urgent: "bg-rose-500", high: "bg-rose-500", medium: "bg-amber-500", low: "bg-emerald-500" };
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600", "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",   "bg-emerald-100 text-emerald-600",
];
const avatarColor = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const TaskKanban = ({ tasks, onEdit, onToggleComplete }) => (
  <div className="flex items-start gap-3 overflow-x-auto pb-3 min-h-[60vh]">
    {COLUMNS.map((col) => {
      const colTasks = tasks.filter((t) => {
        const s = t.status?.toLowerCase() || "pending";
        if (col.id === "pending")     return s.includes("pending") || s.includes("assigned");
        if (col.id === "in-progress") return s.includes("progress");
        if (col.id === "review")      return s.includes("review") || s.includes("hold");
        if (col.id === "completed")   return s.includes("completed") || s.includes("done");
        return false;
      });

      return (
        <div key={col.id} className={`flex-shrink-0 w-64 sm:w-72 rounded-2xl p-3 flex flex-col gap-2.5 ${col.bg} border ${col.border}`}>
          {/* COLUMN HEADER */}
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${col.header}`}>{col.title}</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
              {colTasks.length}
            </span>
          </div>

          {/* CARDS */}
          {colTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[11px] text-gray-400">No tasks</p>
            </div>
          ) : (
            colTasks.map((task) => {
              const isCompleted  = task.status?.toLowerCase() === "completed";
              const assigneeName = task.assignedTo?.name || "Unassigned";
              const clientName   =
                task.client?.companyName ||
                (typeof task.client === "string" ? task.client : "") ||
                task.project?.client?.companyName || "Internal";

              return (
                <div
                  key={task._id}
                  onClick={() => onEdit(task)}
                  className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  {/* TOP ROW */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority] || "bg-gray-300"}`} />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate max-w-[110px]">
                        {clientName}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task); }}
                      className="w-4 h-4 rounded border border-slate-200 flex items-center justify-center bg-white hover:border-indigo-400 transition-all overflow-hidden flex-shrink-0"
                    >
                      {isCompleted && (
                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* TITLE */}
                  <h4 className={`text-xs font-semibold mb-3 line-clamp-2 leading-snug ${isCompleted ? "text-gray-400 line-through" : "text-slate-700"}`}>
                    {task.title}
                  </h4>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${avatarColor(assigneeName)}`}>
                        {assigneeName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{assigneeName.split(" ")[0]}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                      className="text-gray-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FiEdit2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    })}
  </div>
);

export default TaskKanban;
