import React from "react";
import { FiEdit2, FiTrash2, FiClock, FiAlertCircle } from "react-icons/fi";

const TaskTable = ({ tasks, onEdit, onDelete, canManage }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "in-progress": return "bg-blue-50 text-blue-600 border-blue-100";
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "on-hold": return "bg-slate-50 text-slate-500 border-slate-200";
      default: return "bg-slate-50 text-slate-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "text-rose-600 bg-rose-50 border-rose-100";
      case "high": return "text-orange-600 bg-orange-50 border-orange-100";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-100";
      case "low": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-all duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-gray-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initiative Details</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Context</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Lead</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Criticality</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks?.map((task) => (
              <tr key={task._id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-base">{task.title}</div>
                  <div className="text-xs text-slate-400 mt-1.5 font-medium truncate max-w-[220px] italic">
                    {task.description || "No tactical documentation provided."}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100 shadow-sm">
                    {task.project?.title || "Standalone"}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-200">
                      {task.assignedTo?.name?.charAt(0)}
                    </div>
                    <div className="text-sm text-slate-700 font-bold tracking-tight">{task.assignedTo?.name}</div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-sm ${getPriorityColor(task.priority)}`}>
                    <FiAlertCircle size={12} />
                    {task.priority}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2.5 text-slate-500 text-sm font-bold">
                    <FiClock size={16} className="text-blue-400" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Open Ended"}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onEdit(task)}
                      className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100 border border-transparent transition-all shadow-sm active:scale-90"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    {canManage && (
                      <button
                        onClick={() => onDelete(task._id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-transparent transition-all shadow-sm active:scale-90"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!tasks || tasks.length === 0) && (
        <div className="py-20 text-center bg-slate-50/30">
          <p className="text-slate-400 font-bold text-lg italic">Strategic roadmap is currently clear.</p>
        </div>
      )}
    </div>
  );
};

export default TaskTable;
