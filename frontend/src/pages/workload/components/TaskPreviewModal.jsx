import React from "react";
import { motion } from "framer-motion";
import { FiBriefcase, FiX } from "react-icons/fi";
import ClientBadge from "../../../components/common/ClientBadge.jsx";
import {
  getPriorityBadgeClass,
  getStatusBadgeClass,
  getTaskCreatorInfo,
  getWorkTypeMeta,
} from "../utils/workloadUtils";

// ==========================================
// MEMOIZED TASK PREVIEW MODAL
// ==========================================
const TaskPreviewModal = React.memo(({ task, onClose }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FiBriefcase className="text-indigo-500 dark:text-indigo-400" size={18} />
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Task Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Task Title
            </label>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {task.title}
            </p>
          </div>

          {task.client && (
            <div>
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Client
              </label>
              <ClientBadge client={task.client} size="md" />
            </div>
          )}

          {/* Created By details */}
          {(() => {
            const creator = task.creatorInfo || getTaskCreatorInfo(task);
            if (!creator?.name) return null;
            return (
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Created By
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#1e293b]/70 border border-slate-200/80 dark:border-slate-700/70">
                  <div className="relative shrink-0 w-6 h-6">
                    {creator.avatarUrl ? (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.name}
                        className="w-6 h-6 rounded-full object-cover border border-purple-300 dark:border-purple-700 shadow-2xs"
                      />
                    ) : null}
                    <div
                      className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-[10px] flex items-center justify-center uppercase shadow-2xs"
                      style={{ display: creator.avatarUrl ? "none" : "flex" }}
                    >
                      {creator.name.substring(0, 1)}
                    </div>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {creator.name}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Work Type & Benchmark Info */}
          {(() => {
            const wtMeta = getWorkTypeMeta(task.workType);
            if (!wtMeta) return null;
            return (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a2234] border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Work Type
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${wtMeta.badgeClass}`}>
                    {wtMeta.weightSlots} {wtMeta.weightSlots === 1 ? "slot" : "slots"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{wtMeta.icon}</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {wtMeta.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      ⏱️ Avg Time: <b className="text-slate-700 dark:text-slate-300">{wtMeta.avgTime}</b> • 🎯 Output: <b className="text-indigo-600 dark:text-indigo-400">{wtMeta.realisticOutput}</b>
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Status
              </label>
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Priority
              </label>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase border ${getPriorityBadgeClass(
                    task.priority
                  )}`}
                >
                  {task.priority || "Medium"}
                </span>
              </div>
            </div>
          </div>

          {task.description && (
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Description
              </label>
              <p className="text-slate-700 dark:text-slate-200 mt-1 bg-slate-50 dark:bg-[#1e293b]/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/70 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
});

export default TaskPreviewModal;
