import React from "react";
import { FiEdit2, FiTrash2, FiClock, FiAlertCircle } from "react-icons/fi";

const TaskTable = ({ tasks, onEdit, onDelete, canManage }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in-progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "on-hold": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "text-red-500";
      case "high": return "text-orange-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-[#111827]/50 backdrop-blur-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Task Info</th>
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Project</th>
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Assignee</th>
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Priority</th>
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
            <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {tasks?.map((task) => (
            <tr key={task._id} className="hover:bg-white/5 transition-colors group">
              <td className="px-6 py-5">
                <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{task.title}</div>
                <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{task.description}</div>
              </td>
              <td className="px-6 py-5">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                  {task.project?.title}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {task.assignedTo?.name?.charAt(0)}
                  </div>
                  <div className="text-sm text-gray-300 font-medium">{task.assignedTo?.name}</div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase ${getPriorityColor(task.priority)}`}>
                  <FiAlertCircle size={14} />
                  {task.priority}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <FiClock size={14} />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(task)}
                    className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  {canManage && (
                    <button
                      onClick={() => onDelete(task._id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
