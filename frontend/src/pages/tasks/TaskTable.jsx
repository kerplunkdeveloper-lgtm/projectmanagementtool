import React from "react";
import { FiEdit2 } from "react-icons/fi";

const STATUS_STYLE = {
  pending:   "text-blue-500 bg-blue-50 border-blue-200",
  assigned:  "text-blue-500 bg-blue-50 border-blue-200",
  "in-progress": "text-amber-500 bg-amber-50 border-amber-200",
  review:    "text-amber-500 bg-amber-50 border-amber-200",
  completed: "text-emerald-500 bg-emerald-50 border-emerald-200",
  done:      "text-emerald-500 bg-emerald-50 border-emerald-200",
};

const PRIORITY_DOT = {
  urgent: "bg-rose-500", high: "bg-rose-500",
  medium: "bg-amber-500", low: "bg-emerald-500",
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600", "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",   "bg-emerald-100 text-emerald-600",
  "bg-blue-100 text-blue-600",     "bg-purple-100 text-purple-600",
];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const formatDue = (dateStr) => {
  if (!dateStr) return "No Date";
  const date = new Date(dateStr), today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return "Today";
  if (date < today) {
    const days = Math.ceil((today - date) / 86400000);
    return <span className="text-rose-500 font-semibold">{days}d ago</span>;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getStatusKey = (status) => {
  const s = status?.toLowerCase() || "";
  return Object.keys(STATUS_STYLE).find((k) => s.includes(k)) || "pending";
};

const TaskTable = ({ tasks, onEdit, onDelete, onToggleComplete, canManage }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center shadow-sm">
        <p className="text-sm text-gray-400 font-medium">No tasks found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* TABLE HEADER */}
      <div className="hidden md:flex items-center px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <div className="w-[44%] text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-5">Task</div>
        <div className="w-[16%] text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignee</div>
        <div className="w-[14%] text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</div>
        <div className="w-[14%] text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</div>
        <div className="w-[10%] text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Due</div>
        <div className="w-[2%]" />
      </div>

      {/* ROWS */}
      <div className="divide-y divide-gray-50">
        {tasks.map((task) => {
          const isCompleted  = task.status?.toLowerCase() === "completed";
          const assigneeName = task.assignedTo?.name || "Unassigned";
          const clientName   =
            task.client?.companyName ||
            (typeof task.client === "string" ? task.client : "") ||
            task.project?.client?.companyName || "Internal";
          const statusKey = getStatusKey(task.status);

          return (
            <div
              key={task._id}
              onClick={() => onEdit(task)}
              className="flex flex-col md:flex-row md:items-center px-4 py-3 hover:bg-gray-50/60 transition-colors cursor-pointer group gap-2 md:gap-0"
            >
              {/* Priority + Task */}
              <div className="w-full md:w-[44%] flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || "bg-gray-300"}`} />
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task); }}
                  className="w-4 h-4 flex-shrink-0 rounded border border-slate-300 flex items-center justify-center text-white transition-all overflow-hidden bg-white hover:border-indigo-400"
                >
                  {isCompleted && (
                    <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
                <span className={`text-xs font-semibold truncate ${isCompleted ? "text-gray-400 line-through" : "text-slate-700"}`}>
                  {task.title}
                </span>
              </div>

              {/* Assignee */}
              <div className="w-full md:w-[16%] flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColor(assigneeName)}`}>
                  {assigneeName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] text-slate-500 truncate">{assigneeName}</span>
              </div>

              {/* Client */}
              <div className="w-full md:w-[14%]">
                <span className="text-[11px] text-gray-400 truncate block">{clientName}</span>
              </div>

              {/* Status */}
              <div className="w-full md:w-[14%]">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STATUS_STYLE[statusKey]}`}>
                  {task.status || "pending"}
                </span>
              </div>

              {/* Due */}
              <div className="w-full md:w-[10%] text-right">
                <span className="text-[11px] text-slate-400">{formatDue(task.dueDate)}</span>
              </div>

              {/* Edit */}
              <div className="w-[2%] flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  className="text-gray-300 hover:text-indigo-500 transition-colors p-1"
                >
                  <FiEdit2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskTable;
