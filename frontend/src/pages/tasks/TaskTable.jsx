import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const TaskTable = ({
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
  canManage,
}) => {
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("pending") || s.includes("assigned"))
      return "text-blue-500 bg-blue-50 border-blue-200";
    if (s.includes("progress") || s.includes("review"))
      return "text-amber-500 bg-amber-50 border-amber-200";
    if (s.includes("completed") || s.includes("done"))
      return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (s.includes("hold") || s.includes("overdue") || s.includes("risk"))
      return "text-rose-500 bg-rose-50 border-rose-200";
    return "text-slate-500 bg-slate-50 border-slate-200";
  };

  const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase() || "";
    if (p === "urgent" || p === "high") return "bg-rose-500";
    if (p === "medium") return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-indigo-100 text-indigo-600",
      "bg-rose-100 text-rose-600",
      "bg-amber-100 text-amber-600",
      "bg-emerald-100 text-emerald-600",
      "bg-blue-100 text-blue-600",
      "bg-purple-100 text-purple-600",
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return "No Date";
    const date = new Date(dateStr);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    if (isToday) return "Today";

    // Check if overdue
    if (date < today && !isToday) {
      const diffTime = Math.abs(today - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return (
        <span className="text-rose-500 font-bold">{diffDays} days ago</span>
      );
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/50">
        <div className="w-[45%] flex items-center gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-4 text-center">
            P
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Task
          </div>
        </div>
        <div className="w-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Assignee
        </div>
        <div className="w-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Client
        </div>
        <div className="w-[12%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Status
        </div>
        <div className="w-[10%] text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
          Due
        </div>
        <div className="w-[3%]"></div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-50/50">
        {!tasks || tasks.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold text-sm">No tasks found.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status?.toLowerCase() === "completed";
            const clientName =
              task.client?.companyName ||
              (typeof task.client === 'string' ? task.client : '') ||
              task.project?.client?.companyName ||
              (typeof task.project?.client === 'string' ? task.project?.client : '') ||
              task.project?.title ||
              "Internal";
            const assigneeName = task.assignedTo?.name || "Unassigned";

            // Subtask logic (assuming backend might return it, else fallback to 0/0)
            const totalSubtasks = task.subtasks?.length || 0;
            const completedSubtasks =
              task.subtasks?.filter((st) => st.isCompleted).length || 0;
            const subtaskText =
              totalSubtasks > 0
                ? `(${completedSubtasks}/${totalSubtasks})`
                : "";

            return (
              <div
                key={task._id}
                onClick={() => onEdit(task)}
                className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                {/* Priority & Task Name */}
                <div className="w-full md:w-[45%] flex items-center gap-4 mb-3 md:mb-0">
                  <div className="w-4 flex justify-center flex-shrink-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`}
                    ></div>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleComplete) onToggleComplete(task);
                      }}
                      className="w-5 h-5 flex-shrink-0 rounded-[6px] border border-slate-300 flex items-center justify-center text-white transition-all overflow-hidden bg-white hover:border-indigo-400"
                    >
                      {isCompleted && (
                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        </div>
                      )}
                    </button>
                    <div className="min-w-0">
                      <span
                        className={`text-[13px] font-bold truncate ${isCompleted ? "text-slate-400 line-through" : "text-[#475569]"}`}
                      >
                        {task.title}{" "}
                        {subtaskText && (
                          <span className="text-slate-400 text-xs ml-1 font-semibold">
                            {subtaskText}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignee */}
                <div className="w-full md:w-[15%] flex items-center gap-2 mb-2 md:mb-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${getAvatarColor(assigneeName)}`}
                  >
                    {assigneeName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-600 truncate">
                    {assigneeName}
                  </span>
                </div>

                {/* Client */}
                <div className="w-full md:w-[15%] mb-2 md:mb-0">
                  <span className="text-xs font-bold text-slate-400 truncate block">
                    {clientName}
                  </span>
                </div>

                {/* Status */}
                <div className="w-full md:w-[12%] mb-2 md:mb-0">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(task.status)}`}
                  >
                    {task.status || "ASSIGNED"}
                  </span>
                </div>

                {/* Due Date */}
                <div className="w-full md:w-[10%] text-right mb-2 md:mb-0">
                  <span className="text-[11px] font-bold text-slate-500">
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>

                {/* Edit Icon */}
                <div className="w-full md:w-[3%] flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskTable;
