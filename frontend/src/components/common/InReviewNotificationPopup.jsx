import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetTasksQuery } from "../../features/api/apiSlice";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAlertCircle } from "react-icons/fi";

const InReviewNotificationPopup = () => {
  const { user } = useSelector((state) => state.auth);
  const { users = [] } = useSelector((state) => state.users || {});
  const { data: allTasks = [] } = useGetTasksQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds to keep fresh
  });

  const [isOpen, setIsOpen] = useState(false);

  // Check if current user is authorized (Admin, Operation Manager, or Social Media Manager)
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const role = user.role?.toLowerCase() || "";
    const dept = user.department?.toLowerCase() || "";
    return (
      role === "admin" ||
      role === "operationmanager" ||
      dept === "social media manager"
    );
  }, [user]);

  const currentUserId = user?._id || user?.id;

  // Filter tasks that are in review or revision (All for Admin/OpManager, createdBy only for others)
  const inReviewTasks = useMemo(() => {
    if (!isAuthorized || !currentUserId) return [];
    return allTasks.filter((task) => {
      const s = task.status?.toLowerCase() || "";
      const isReview = s.includes("review") || s.includes("revision");
      if (!isReview) return false;

      const role = user?.role?.toLowerCase() || "";
      if (role === "admin" || role === "operationmanager") {
        return true;
      }

      const creatorId = task.createdBy && typeof task.createdBy === "object"
        ? task.createdBy._id || task.createdBy.id
        : task.createdBy;
      return creatorId === currentUserId;
    });
  }, [allTasks, isAuthorized, currentUserId, user]);

  useEffect(() => {
    if (!isAuthorized || inReviewTasks.length === 0) {
      setIsOpen(false);
      return;
    }

    // Show popup immediately on mount/login if there are review tasks
    setIsOpen(true);

    // Set up 10-minute interval (10 * 60 * 1000 ms)
    const interval = setInterval(() => {
      if (inReviewTasks.length > 0) {
        setIsOpen(true);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthorized, inReviewTasks.length]);

  if (!isAuthorized || !isOpen || inReviewTasks.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-full p-1.5 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 pointer-events-auto relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg animate-pulse">
                <FiAlertCircle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">
                  Tasks In Review
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {inReviewTasks.length} {inReviewTasks.length === 1 ? "task" : "tasks"} pending approval
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Task List Container */}
          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1.5 custom-scrollbar">
            {inReviewTasks.map((task) => {
              const assigneeName =
                typeof task.assignedTo === "object"
                  ? task.assignedTo?.name
                  : "Unassigned";
              const assigneeImg =
                task.assignedTo?.profile?.profileImage?.url ||
                task.assignedTo?.profileImage?.url ||
                task.assignedTo?.profilePic ||
                null;

              const creatorObj = task.createdBy && typeof task.createdBy === "object"
                ? task.createdBy
                : users?.find((u) => u._id === task.createdBy);
              const creatorName = creatorObj?.name || "Unknown";
              const creatorImg =
                creatorObj?.profile?.profileImage?.url ||
                creatorObj?.profileImage?.url ||
                creatorObj?.profilePic ||
                null;

              const formattedDueDate = task.dueDate
                ? format(parseISO(task.dueDate), "MMM dd, yyyy")
                : "No Due Date";

              const getInitials = (name) => {
                if (!name) return "";
                return name.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              };

              return (
                <div
                  key={task._id}
                  className="p-3 bg-slate-50/50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex flex-col gap-2 hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-500/20">
                        {task.status}
                      </span>
                      <span className="text-[10px] text-slate-350 dark:text-slate-700">•</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        Due: {formattedDueDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 gap-2 mt-0.5">
                    {/* Creator */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">By:</span>
                      <div className="flex items-center gap-1">
                        {creatorImg ? (
                          <img
                            src={creatorImg}
                            alt={creatorName}
                            className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[7px] font-black ring-1 ring-slate-250">
                            {getInitials(creatorName)}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold truncate max-w-[80px]" title={creatorName}>
                          {creatorName}
                        </span>
                      </div>
                    </div>

                    {/* Assignee */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">To:</span>
                      <div className="flex items-center gap-1">
                        {assigneeImg ? (
                          <img
                            src={assigneeImg}
                            alt={assigneeName}
                            className="w-4 h-4 rounded-full object-cover ring-1 ring-indigo-400/30"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[7px] font-black ring-1 ring-indigo-400/20">
                            {getInitials(assigneeName)}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold truncate max-w-[80px]" title={assigneeName}>
                          {assigneeName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl text-[10px] font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InReviewNotificationPopup;
