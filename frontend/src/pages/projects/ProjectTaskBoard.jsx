import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiX,
  FiPlus,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiTrash2,
  FiCornerDownRight,
  FiBriefcase,
  FiTag,
  FiClock,
  FiList,
  FiGrid,
  FiTrendingUp,
  FiPieChart,
  FiMoreHorizontal,
  FiEdit2,
  FiPaperclip,
  FiSend,
  FiFile,
  FiCheckCircle,
  FiAlertTriangle,
  FiLayers,
  FiSliders,
  FiSearch,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import toast from "react-hot-toast";

import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../../features/api/apiSlice";
import { updateProject } from "../../features/projects/projectSlice";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ProjectIcon from "../../components/common/ProjectIcon";

const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};

// Task Title Input Component for autosaving inline without cursor jump
const TaskTitleInput = ({
  task,
  canToggle,
  handleTaskFieldChange,
  isCompleted,
  onEnter,
}) => {
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => {
        if (title.trim() && title !== task.title) {
          handleTaskFieldChange(task._id, { title: title.trim() });
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (title.trim() && title !== task.title) {
            handleTaskFieldChange(task._id, { title: title.trim() });
          }
          if (onEnter) {
            onEnter();
          }
          e.target.blur();
        }
      }}
      placeholder="Write a task here..."
      className={`bg-transparent  outline-none w-full p-0 font-semibold text-slate-800 dark:text-white px-0 py-0 text-[11px] ${
        isCompleted ? "line-through text-slate-450 dark:text-slate-500" : ""
      }`}
      disabled={!canToggle}
    />
  );
};

// Subtask Row Component for the Drawer subtasks list
const SubtaskRow = ({
  sub,
  task,
  users,
  getAvatarColor,
  handleSubtaskFieldChange,
  handleDeleteSubtask,
  isAdminOrManager,
  currentUser,
  subIdx,
  handleSubtaskEnterKey,
  shouldAutoFocus,
  onAutoFocused,
}) => {
  const isSubCompleted = sub.status === "Completed";
  const canToggleSub =
    isAdminOrManager ||
    sub.assignedTo?._id === currentUser?._id ||
    sub.assignedTo === currentUser?._id;
  const [subTitle, setSubTitle] = useState(sub.title);

  useEffect(() => {
    setSubTitle(sub.title);
  }, [sub.title]);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 transition-all group relative">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Circular Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canToggleSub) {
              handleSubtaskFieldChange(task, sub._id, {
                status: isSubCompleted ? "Pending" : "Completed",
              });
            }
          }}
          disabled={!canToggleSub}
          className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
            !canToggleSub ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${
            isSubCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-[#e5ff00] text-transparent hover:text-slate-400 dark:hover:text-[#e5ff00]"
          }`}
        >
          <FiCheck size={9} />
        </button>

        {/* Subtask Title Input */}
        <input
          ref={(el) => {
            if (shouldAutoFocus && el) {
              el.focus();
              el.select();
              onAutoFocused();
            }
          }}
          type="text"
          value={subTitle}
          onChange={(e) => setSubTitle(e.target.value)}
          onBlur={() => {
            const trimmed = subTitle.trim();
            if (trimmed !== sub.title) {
              handleSubtaskFieldChange(task, sub._id, {
                title: trimmed,
              });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (handleSubtaskEnterKey) {
                handleSubtaskEnterKey(task, subIdx, subTitle, true);
              } else {
                e.target.blur();
              }
            }
          }}
          placeholder="Write a subtask..."
          className={`bg-transparent border-0 focus:outline-none focus:ring-0 w-full p-0 font-bold rounded text-[12px] placeholder-slate-400 dark:placeholder-slate-600 transition-all ${
            isSubCompleted
              ? "line-through text-slate-400 dark:text-slate-500 font-normal"
              : "text-slate-800 dark:text-slate-200"
          }`}
          disabled={!canToggleSub}
        />
      </div>

      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Start Date Picker */}
        <div
          className="relative h-6 flex items-center justify-center transition-all cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            const input = e.currentTarget.querySelector('input[type="date"]');
            if (input && typeof input.showPicker === "function") {
              input.showPicker();
            }
          }}
        >
          {sub.startDate ? (
            <div className="flex items-center gap-1 px-1.5 py-2 rounded-md border border-blue-200 dark:border-blue-900/60 hover:border-blue-350 dark:hover:border-blue-500/40 text-blue-700 dark:text-blue-300 text-[9px] font-semibold bg-blue-50 dark:bg-blue-950/30 transition-all">
              <FiCalendar
                size={8}
                className="text-blue-500 dark:text-blue-400 mr-1"
              />
              <span>
                S:{" "}
                {new Date(sub.startDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {isAdminOrManager && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubtaskFieldChange(task, sub._id, {
                      startDate: null,
                    });
                  }}
                  className="ml-1 text-blue-400 hover:text-rose-500 transition-colors cursor-pointer relative z-10"
                >
                  <FiX size={10} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-2 rounded-md border border-dashed border-blue-200 dark:border-blue-900/40 text-blue-500/70 dark:text-blue-500/50 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 dark:hover:border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10 transition-all text-[9px] font-bold">
              <FiCalendar size={9} />
              <span>+ Start</span>
            </div>
          )}
          {isAdminOrManager && (
            <input
              type="date"
              value={
                sub.startDate
                  ? new Date(sub.startDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handleSubtaskFieldChange(task, sub._id, {
                  startDate: e.target.value || null,
                })
              }
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          )}
        </div>

        {/* End Date Picker */}
        <div
          className="relative h-6 flex items-center justify-center transition-all cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            const input = e.currentTarget.querySelector('input[type="date"]');
            if (input && typeof input.showPicker === "function") {
              input.showPicker();
            }
          }}
        >
          {sub.dueDate ? (
            <div className="flex items-center gap-1 px-1.5 py-2 rounded-md border border-rose-200 dark:border-rose-900/60 hover:border-rose-350 dark:hover:border-rose-500/40 text-rose-700 dark:text-rose-305 text-[9px] font-semibold bg-rose-50 dark:bg-rose-950/30 transition-all">
              <FiCalendar
                size={8}
                className="text-rose-555 dark:text-rose-400 mr-1"
              />
              <span>
                E:{" "}
                {new Date(sub.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {isAdminOrManager && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubtaskFieldChange(task, sub._id, { dueDate: null });
                  }}
                  className="ml-1 text-rose-400 hover:text-rose-550 transition-colors cursor-pointer relative z-10"
                >
                  <FiX size={10} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-2 rounded-md border border-dashed border-rose-200 dark:border-rose-900/40 text-rose-500/70 dark:text-rose-500/50 hover:border-rose-400 hover:text-rose-700 dark:hover:text-rose-400 dark:hover:border-rose-500/40 bg-rose-50/20 dark:bg-rose-955/10 transition-all text-[9px] font-bold">
              <FiCalendar size={9} />
              <span>+ End</span>
            </div>
          )}
          {isAdminOrManager && (
            <input
              type="date"
              value={
                sub.dueDate
                  ? new Date(sub.dueDate).toISOString().split("T")[0]
                  : ""
              }
              min={
                sub.startDate
                  ? new Date(sub.startDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handleSubtaskFieldChange(task, sub._id, {
                  dueDate: e.target.value || null,
                })
              }
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          )}
        </div>

        {/* Assignee Picker (Always Visible) */}
        <div className="flex items-center gap-1.5">
          <AssigneeDropdown
            selectedUser={sub.assignedTo}
            users={users}
            onChange={(userId) =>
              handleSubtaskFieldChange(task, sub._id, {
                assignedTo: userId,
              })
            }
            isAdminOrManager={isAdminOrManager}
            getAvatarColor={getAvatarColor}
            size="sm"
          />
          {sub.assignedTo && isAdminOrManager && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSubtaskFieldChange(task, sub._id, { assignedTo: null });
              }}
              className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors hover:bg-slate-200 dark:hover:bg-white/10 shrink-0 relative z-10"
              title="Clear Assignee"
            >
              <FiX size={10} />
            </button>
          )}
        </div>

        {/* Delete Button (Always Visible) */}
        {isAdminOrManager && (
          <button
            onClick={() => handleDeleteSubtask(task, sub._id)}
            className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900/50 bg-white dark:bg-[#111111] transition-all cursor-pointer"
            title="Delete Subtask"
          >
            <FiTrash2 size={11} />
          </button>
        )}

        {/* Right Chevron (Always Visible) */}
        <div className="text-slate-300 dark:text-slate-600 pl-0.5">
          <FiChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};

const AssigneeDropdown = ({
  selectedUser,
  users,
  onChange,
  isAdminOrManager,
  getAvatarColor,
  align = "left",
  size = "md"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // w-56 is 14rem = 224px
      
      // Check if left alignment would go off-screen
      let left = rect.left + window.scrollX;
      if (rect.left + dropdownWidth > window.innerWidth) {
        // Right align instead: align right edge of dropdown with right edge of trigger
        left = rect.right - dropdownWidth + window.scrollX;
      }
      
      setCoords({
        top: rect.bottom + window.scrollY,
        left: left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.closest(".assignee-dropdown-portal")
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedUserObj = typeof selectedUser === "string"
    ? users.find((u) => u._id === selectedUser)
    : selectedUser;

  const handleSelect = (user) => {
    onChange(user ? user._id : null);
    setIsOpen(false);
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";
  };

  const renderTrigger = () => {
    if (size === "sm") {
      return (
        <div
          onClick={() => isAdminOrManager && setIsOpen(!isOpen)}
          className={`relative w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-indigo-900 flex items-center justify-center text-slate-400 dark:text-indigo-400/75 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-[#e5ff00] dark:hover:border-[#e5ff00]/40 bg-white dark:bg-[#111111] transition-all ${
            isAdminOrManager ? "cursor-pointer" : "cursor-not-allowed"
          } overflow-hidden`}
        >
          {selectedUserObj ? (
            selectedUserObj.profileImage?.url ? (
              <img
                src={selectedUserObj.profileImage.url}
                alt={selectedUserObj.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br ${getAvatarColor(
                  selectedUserObj.name || "U"
                )}`}
              >
                {getInitials(selectedUserObj.name)}
              </div>
            )
          ) : (
            <FiUser size={11} />
          )}
        </div>
      );
    }

    if (size === "lg") {
      return (
        <button
          type="button"
          disabled={!isAdminOrManager}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 ${
            isAdminOrManager ? "cursor-pointer hover:border-slate-350 dark:hover:border-white/20" : "cursor-not-allowed"
          } focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedUserObj ? (
              <>
                {selectedUserObj.profileImage?.url ? (
                  <img
                    src={selectedUserObj.profileImage.url}
                    alt={selectedUserObj.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br shrink-0 ${getAvatarColor(
                      selectedUserObj.name || "U"
                    )}`}
                  >
                    {getInitials(selectedUserObj.name)}
                  </div>
                )}
                <span className="truncate">
                  {selectedUserObj.name}{" "}
                  {selectedUserObj.department && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 font-normal">
                      ({selectedUserObj.department})
                    </span>
                  )}
                </span>
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
            )}
          </div>
          <FiChevronDown size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
        </button>
      );
    }

    if (selectedUserObj) {
      return (
        <div
          onClick={() => isAdminOrManager && setIsOpen(!isOpen)}
          className={`group/assigned relative flex items-center gap-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 px-1.5 py-2 rounded-lg border border-indigo-100/80 dark:border-indigo-900/50 transition-colors ${
            isAdminOrManager ? "cursor-pointer" : "cursor-not-allowed"
          }`}
        >
          {selectedUserObj.profileImage?.url ? (
            <img
              src={selectedUserObj.profileImage.url}
              alt={selectedUserObj.name}
              className="w-4.5 h-4.5 rounded-full object-cover border border-indigo-100 dark:border-indigo-900 shrink-0"
            />
          ) : (
            <div
              className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-white font-bold text-[8px] bg-gradient-to-br shrink-0 ${getAvatarColor(
                selectedUserObj.name || "Unknown"
              )}`}
            >
              {getInitials(selectedUserObj.name)}
            </div>
          )}
          <span className="text-[9px] font-semibold text-indigo-700 dark:text-indigo-300 max-w-[80px] truncate">
            {selectedUserObj.name}
          </span>
          {isAdminOrManager && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="relative z-20 p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors hover:bg-slate-200 dark:hover:bg-white/10 shrink-0"
              title="Clear Assignee"
            >
              <FiX size={10} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => isAdminOrManager && setIsOpen(!isOpen)}
        className={`group/assign relative w-5 h-5 flex items-center justify-center ${
          isAdminOrManager ? "cursor-pointer" : "cursor-not-allowed"
        }`}
      >
        <div className="w-5 h-5 rounded-full border border-dashed border-slate-350 dark:border-indigo-900/60 flex items-center justify-center text-slate-400 dark:text-indigo-400/80 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-[#e5ff00] transition-colors bg-white dark:bg-slate-905">
          <FiUser size={10} className="group-hover/assign:hidden" />
          <FiPlus size={10} className="hidden group-hover/assign:block text-blue-500 dark:text-[#e5ff00]" />
        </div>
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left w-full">
      {renderTrigger()}

      {isOpen && createPortal(
        <div
          style={{
            position: "absolute",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 999999,
          }}
          className={`assignee-dropdown-portal mt-1 w-56 rounded-xl bg-white dark:bg-[#151518] border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 max-h-60 overflow-y-auto ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5"
          >
            <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
              <FiX size={10} />
            </div>
            <span>Unassigned</span>
          </button>

          {users.map((u) => {
            const isSelected = selectedUserObj?._id === u._id;
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => handleSelect(u)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                  isSelected
                    ? "text-blue-600 dark:text-[#e5ff00] bg-blue-50/30 dark:bg-[#e5ff00]/5"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {u.profileImage?.url ? (
                    <img
                      src={u.profileImage.url}
                      alt={u.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-100 dark:border-white/5"
                    />
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br shrink-0 ${getAvatarColor(
                        u.name || "U"
                      )}`}
                    >
                      {getInitials(u.name)}
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <span className="truncate">{u.name}</span>
                    {u.department && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal truncate">
                        {u.department}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <FiCheck size={12} className="text-blue-600 dark:text-[#e5ff00] shrink-0" />
                )}
              </button>
            );
          })}
        </div>, document.body
      )}
    </div>
  );
};

const ProjectTaskBoard = ({
  activeProjectId,
  activeProject,
  currentUser,
  users,
  isAdminOrManager,
  getStatusBadge,
  getAvatarColor,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // RTK Query hooks
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery();
  const [createTaskMutation] = useCreateTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();
  const [deleteTaskMutation] = useDeleteTaskMutation();

  // Local State
  const [activeTab, setActiveTab] = useState("List"); // "List" | "Board" | "Timeline" | "Dashboard"
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [checkedProjects, setCheckedProjects] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean
  const [timelineOffsetWeeks, setTimelineOffsetWeeks] = useState(0);
  const [editingDateTaskId, setEditingDateTaskId] = useState(null);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [activeDateSelectionField, setActiveDateSelectionField] =
    useState("start"); // "start" | "due"

  // Helper to format date range beautifully (e.g. Jun 2 - 4)
  const formatDateRange = (startStr, endStr) => {
    if (!startStr && !endStr) return "";

    const options = { month: "short", day: "numeric" };

    if (startStr && !endStr) {
      const start = new Date(startStr);
      return start.toLocaleDateString(undefined, options);
    }

    if (!startStr && endStr) {
      const end = new Date(endStr);
      return end.toLocaleDateString(undefined, options);
    }

    const start = new Date(startStr);
    const end = new Date(endStr);

    const startMonth = start.toLocaleDateString(undefined, { month: "short" });
    const endMonth = end.toLocaleDateString(undefined, { month: "short" });

    const startDay = start.getDate();
    const endDay = end.getDate();

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear) {
      return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    }

    if (startMonth !== endMonth) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }

    return `${startMonth} ${startDay} - ${endDay}`;
  };

  const getCalendarDays = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Start of the calendar grid (might be in the previous month)
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const days = [];
    const temp = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return days;
  };

  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState({}); // taskId -> string
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Live task ID for Drawer preview
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({}); // sectionName -> boolean
  const [openSectionMenu, setOpenSectionMenu] = useState(null); // sectionName
  const [editingSection, setEditingSection] = useState(null); // sectionName
  const [editSectionValue, setEditSectionValue] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [autoFocusSubtaskIdx, setAutoFocusSubtaskIdx] = useState(null);
  const [autoFocusDrawerSubtaskIdx, setAutoFocusDrawerSubtaskIdx] =
    useState(null);

  // Filter & Sort State
  const [filterSearch, setFilterSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all"); // "all" | "unassigned" | userId
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "Pending" | "In Progress" | "Completed" | "On Hold"
  const [filterPriority, setFilterPriority] = useState("all"); // "all" | "Low" | "Medium" | "High"
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [sortBy, setSortBy] = useState("none"); // "none" | "name" | "startDate" | "dueDate" | "priority" | "status"
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRenameSectionSubmit = async (e, oldName) => {
    e.preventDefault();
    if (!editSectionValue.trim() || editSectionValue === oldName) {
      setEditingSection(null);
      return;
    }
    const newName = editSectionValue.trim();
    const currentSections =
      activeProject.sections?.length > 0
        ? activeProject.sections
        : ["Recent assignment"];
    const updatedSections = currentSections.map((s) =>
      s === oldName ? newName : s,
    );

    try {
      // Update project
      await dispatch(
        updateProject({
          id: activeProjectId,
          data: { sections: updatedSections },
        }),
      ).unwrap();

      // Update all tasks in this section
      const tasksToUpdate = tasks.filter(
        (t) =>
          t.section === oldName ||
          (!t.section && oldName === "Recent assignment"),
      );
      await Promise.all(
        tasksToUpdate.map((t) =>
          updateTaskMutation({ id: t._id, taskData: { section: newName } }).unwrap(),
        ),
      );
    } catch (err) {
      console.error("Failed to rename section:", err);
    }

    setEditingSection(null);
  };

  const handleDeleteSection = async (sectionName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the section "${sectionName}" and ALL its tasks?`,
      )
    ) {
      const currentSections =
        activeProject.sections?.length > 0
          ? activeProject.sections
          : ["Recent assignment"];
      const updatedSections = currentSections.filter((s) => s !== sectionName);

      try {
        await dispatch(
          updateProject({
            id: activeProjectId,
            data: { sections: updatedSections },
          }),
        ).unwrap();

        const tasksToDelete = tasks.filter(
          (t) =>
            t.section === sectionName ||
            (!t.section && sectionName === "Recent assignment"),
        );
        await Promise.all(
          tasksToDelete.map((t) => deleteTaskMutation(t._id).unwrap()),
        );
      } catch (err) {
        console.error("Failed to delete section:", err);
      }
    }
    setOpenSectionMenu(null);
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Add optimistic tasks state for dragging
  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Filter tasks for this project using localTasks for optimistic UI
  const activeProjectTasks = localTasks.filter(
    (t) => t.project?._id === activeProjectId || t.project === activeProjectId,
  );

  const filteredTasks = activeProjectTasks.filter((task) => {
    // 1. Search text (matches title)
    if (
      filterSearch &&
      !task.title?.toLowerCase().includes(filterSearch.toLowerCase())
    ) {
      return false;
    }
    // 2. Assignee filter
    if (filterAssignee !== "all") {
      if (filterAssignee === "unassigned") {
        if (task.assignedTo) return false;
      } else {
        const assignedId = task.assignedTo?._id || task.assignedTo;
        if (assignedId !== filterAssignee) return false;
      }
    }
    // 3. Status filter
    if (filterStatus !== "all" && task.status !== filterStatus) {
      return false;
    }
    // 4. Priority filter
    if (filterPriority !== "all" && task.priority !== filterPriority) {
      return false;
    }
    // 5. Date filter (Start Date & End Date range match)
    if (filterStartDate) {
      if (!task.startDate) return false;
      const tStart = new Date(task.startDate).setHours(0, 0, 0, 0);
      const fStart = new Date(filterStartDate).setHours(0, 0, 0, 0);
      if (tStart < fStart) return false;
    }
    if (filterEndDate) {
      if (!task.dueDate) return false;
      const tDue = new Date(task.dueDate).setHours(0, 0, 0, 0);
      const fEnd = new Date(filterEndDate).setHours(0, 0, 0, 0);
      if (tDue > fEnd) return false;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "none") return 0;

    let valA, valB;
    if (sortBy === "name") {
      valA = a.title?.toLowerCase() || "";
      valB = b.title?.toLowerCase() || "";
    } else if (sortBy === "startDate") {
      valA = a.startDate ? new Date(a.startDate).getTime() : 0;
      valB = b.startDate ? new Date(b.startDate).getTime() : 0;
    } else if (sortBy === "dueDate") {
      valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    } else if (sortBy === "priority") {
      const pMap = { Low: 1, Medium: 2, High: 3 };
      valA = pMap[a.priority] || 0;
      valB = pMap[b.priority] || 0;
    } else if (sortBy === "status") {
      const sMap = { Pending: 1, "In Progress": 2, "On Hold": 3, Completed: 4 };
      valA = sMap[a.status] || 0;
      valB = sMap[b.status] || 0;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Optimistically update local UI
    const updatedTasks = localTasks.map((t) =>
      t._id === draggableId ? { ...t, section: destination.droppableId } : t,
    );
    setLocalTasks(updatedTasks);

    // Send to backend
    try {
      await updateTaskMutation({
        id: draggableId,
        taskData: { section: destination.droppableId },
      }).unwrap();
    } catch (err) {
      console.error("Failed to drag and drop task:", err);
    }
  };

  // Live selected task from localTasks state
  const selectedTask = localTasks.find((t) => t._id === selectedTaskId);

  const handleAddSectionSubmit = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const currentSections =
      activeProject.sections?.length > 0
        ? activeProject.sections
        : ["Recent assignment"];
    const updatedSections = [...currentSections, newSectionName.trim()];
    dispatch(
      updateProject({
        id: activeProjectId,
        data: { sections: updatedSections },
      }),
    );
    setIsAddingSection(false);
    setNewSectionName("");
  };

  // Add Task directly to DB (autosave pattern)
  const handleAddTask = async (sectionName) => {
    const resolvedSectionName = sectionName || (activeProject?.sections?.length > 0 ? activeProject.sections[0] : "Recent assignment");
    const tempId = "temp-" + Date.now();
    const tempTask = {
      _id: tempId,
      title: "",
      project: activeProjectId,
      section: resolvedSectionName,
      assignedTo: null,
      dueDate: null,
      priority: "Medium",
      status: "Pending",
      createdAt: new Date().toISOString(),
      subtasks: [],
      comments: [],
      attachments: [],
      createdBy: currentUser,
    };

    setFocusedTaskId(tempId);
    setLocalTasks((prev) => [...prev, tempTask]);

    try {
      const response = await createTaskMutation({
        title: "",
        project: activeProjectId,
        section: resolvedSectionName,
        assignedTo: null,
        dueDate: null,
        priority: "Medium",
        status: "Pending",
      }).unwrap();

      if (response && response.data) {
        setLocalTasks((prev) =>
          prev.map((t) => (t._id === tempId ? response.data : t))
        );
      }
    } catch (err) {
      console.error("Failed to add task:", err);
      setLocalTasks((prev) => prev.filter((t) => t._id !== tempId));
    }
  };

  // Auto-create a default task if the project has 0 tasks
  useEffect(() => {
    if (!activeProjectId || !isAdminOrManager || tasksLoading) return;

    if (checkedProjects[activeProjectId]) return;

    const projectTasksCount = tasks.filter(
      (t) =>
        t.project?._id === activeProjectId || t.project === activeProjectId,
    ).length;

    if (projectTasksCount === 0) {
      const defaultSection =
        activeProject?.sections?.length > 0
          ? activeProject.sections[0]
          : "Recent assignment";
      handleAddTask(defaultSection);
    }

    setCheckedProjects((prev) => ({ ...prev, [activeProjectId]: true }));
  }, [
    activeProjectId,
    tasks,
    tasksLoading,
    activeProject,
    isAdminOrManager,
    checkedProjects,
  ]);

  // Add Task directly to DB with preselected status (Board view helper)
  const handleAddTaskWithStatus = async (status) => {
    const tempId = "temp-" + Date.now();
    const defaultSection =
      activeProject?.sections?.length > 0
        ? activeProject.sections[0]
        : "Recent assignment";

    const tempTask = {
      _id: tempId,
      title: "Add Task",
      project: activeProjectId,
      section: defaultSection,
      assignedTo: null,
      dueDate: null,
      priority: "Medium",
      status: status,
      createdAt: new Date().toISOString(),
      subtasks: [],
      comments: [],
      attachments: [],
      createdBy: currentUser,
    };

    setFocusedTaskId(tempId);
    setLocalTasks((prev) => [...prev, tempTask]);

    try {
      const response = await createTaskMutation({
        title: "Add Task",
        project: activeProjectId,
        assignedTo: null,
        dueDate: null,
        priority: "Medium",
        status: status,
      }).unwrap();

      if (response && response.data) {
        setLocalTasks((prev) =>
          prev.map((t) => (t._id === tempId ? response.data : t))
        );
      }
    } catch (err) {
      console.error("Failed to add task:", err);
      setLocalTasks((prev) => prev.filter((t) => t._id !== tempId));
    }
  };

  // Update Task fields inline / autosave
  const handleTaskFieldChange = async (taskId, fields) => {
    const sanitizedFields = { ...fields };
    if (sanitizedFields.assignedTo === "") sanitizedFields.assignedTo = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;
    if (sanitizedFields.startDate === "") sanitizedFields.startDate = null;

    // If startDate is being set, auto-clear dueDate if it falls before the new startDate
    if (sanitizedFields.startDate) {
      const currentTask = localTasks.find((t) => t._id === taskId);
      if (currentTask?.dueDate) {
        const newStart = new Date(sanitizedFields.startDate);
        const existingEnd = new Date(currentTask.dueDate);
        newStart.setHours(0, 0, 0, 0);
        existingEnd.setHours(0, 0, 0, 0);
        if (existingEnd < newStart) {
          sanitizedFields.dueDate = null;
        }
      }
    }

    // If dueDate is being set, ensure it is not before startDate
    if (sanitizedFields.dueDate) {
      const currentTask = localTasks.find((t) => t._id === taskId);
      const startRef = sanitizedFields.startDate || currentTask?.startDate;
      if (startRef) {
        const start = new Date(startRef);
        const end = new Date(sanitizedFields.dueDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        if (end < start) {
          return; // Block invalid end date
        }
      }
    }

    setLocalTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...sanitizedFields } : t))
    );

    if (String(taskId).startsWith("temp-")) {
      return;
    }

    try {
      await updateTaskMutation({
        id: taskId,
        taskData: sanitizedFields,
      }).unwrap();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Add Comment Handler
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    const commentData = {
      user: currentUser?._id,
      text: newComment.trim(),
      createdAt: new Date(),
    };

    // Dispatch to DB
    try {
      await updateTaskMutation({
        id: selectedTask._id,
        taskData: {
          comments: [
            ...(selectedTask.comments || []).map((c) => ({
              user: c.user?._id || c.user,
              text: c.text,
              createdAt: c.createdAt,
            })),
            commentData,
          ],
        },
      }).unwrap();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }

    setNewComment("");
  };

  // Upload Attachment Handler
  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      toast.loading("Uploading attachment...", { id: "upload" });

      const config = {
        headers: {
          Authorization: `Bearer ${currentUser?.token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axiosInstance.post(
        "/messages/upload",
        formData,
        config,
      );

      if (data.success) {
        const attachmentData = {
          url: data.data.url,
          filename: data.data.filename,
          fileType: data.data.fileType,
          uploadedBy: currentUser?._id,
          uploadedAt: new Date(),
        };

        await updateTaskMutation({
          id: selectedTask._id,
          taskData: {
            attachments: [
              ...(selectedTask.attachments || []).map((a) => ({
                ...a,
                uploadedBy: a.uploadedBy?._id || a.uploadedBy,
              })),
              attachmentData,
            ],
          },
        }).unwrap();

        toast.success("Attachment uploaded successfully!", { id: "upload" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload attachment", { id: "upload" });
    } finally {
      setIsUploading(false);
      e.target.value = null; // reset input
    }
  };

  // Add subtask (continuous addition helper)
  const handleAddSubtask = async (task, subtaskTitle) => {
    if (!subtaskTitle || !subtaskTitle.trim()) return;

    const newSubtask = {
      title: subtaskTitle.trim(),
      status: "Pending",
      assignedTo: null,
      startDate: null,
      dueDate: null,
      priority: "Medium",
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    try {
      await updateTaskMutation({
        id: task._id,
        taskData: { subtasks: updatedSubtasks },
      }).unwrap();
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  // Add subtask from inline form in table
  const handleInlineAddSubtaskSubmit = (e, task) => {
    e.preventDefault();
    const title = inlineSubtaskTitle[task._id];
    if (!title || !title.trim()) return;

    handleAddSubtask(task, title);
    setInlineSubtaskTitle((prev) => ({ ...prev, [task._id]: "" }));
  };

  // Update specific subtask fields
  const handleSubtaskFieldChange = async (task, subtaskId, updatedFields) => {
    const sanitizedFields = { ...updatedFields };
    if (sanitizedFields.assignedTo === "") sanitizedFields.assignedTo = null;
    if (sanitizedFields.startDate === "") sanitizedFields.startDate = null;
    if (sanitizedFields.dueDate === "") sanitizedFields.dueDate = null;

    const currentSub = task.subtasks?.find((s) => s._id === subtaskId);

    // If startDate is being set, auto-clear dueDate if it falls before the new startDate
    if (sanitizedFields.startDate && currentSub?.dueDate) {
      const newStart = new Date(sanitizedFields.startDate);
      const existingEnd = new Date(currentSub.dueDate);
      newStart.setHours(0, 0, 0, 0);
      existingEnd.setHours(0, 0, 0, 0);
      if (existingEnd < newStart) {
        sanitizedFields.dueDate = null;
      }
    }

    // If dueDate is being set, ensure it is not before startDate
    if (sanitizedFields.dueDate) {
      const startRef = sanitizedFields.startDate || currentSub?.startDate;
      if (startRef) {
        const start = new Date(startRef);
        const end = new Date(sanitizedFields.dueDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        if (end < start) {
          return; // Block invalid end date
        }
      }
    }

    const updatedSubtasks = task.subtasks.map((sub) =>
      sub._id === subtaskId ? { ...sub, ...sanitizedFields } : sub,
    );
    try {
      await updateTaskMutation({
        id: task._id,
        taskData: { subtasks: updatedSubtasks },
      }).unwrap();
    } catch (err) {
      console.error("Failed to update subtask:", err);
    }
  };

  // Insert new subtask on Enter key press
  const handleSubtaskEnterKey = async (
    task,
    subIdx,
    currentVal,
    isDrawer = false,
  ) => {
    // 1. Prepare subtasks array and update current subtask title if it changed
    const updatedSubtasks = (task.subtasks || []).map((s, idx) =>
      idx === subIdx ? { ...s, title: currentVal } : s,
    );

    // 2. Insert new subtask right after subIdx
    const newSubtask = {
      title: "",
      status: "Pending",
      assignedTo: null,
      startDate: null,
      dueDate: null,
      priority: "Medium",
    };
    updatedSubtasks.splice(subIdx + 1, 0, newSubtask);

    // 3. Set auto-focus index state
    if (isDrawer) {
      setAutoFocusDrawerSubtaskIdx(subIdx + 1);
    } else {
      setAutoFocusSubtaskIdx(subIdx + 1);
    }

    // 4. Save to backend
    try {
      await updateTaskMutation({
        id: task._id,
        taskData: { subtasks: updatedSubtasks },
      }).unwrap();
    } catch (err) {
      console.error("Failed to insert subtask on Enter:", err);
    }
  };

  // Add subtask via plus button in the table row
  const handleAddSubtaskViaButton = async (task) => {
    // Expand the parent task
    setExpandedTasks((prev) => ({ ...prev, [task._id]: true }));

    const newSubtask = {
      title: "",
      status: "Pending",
      assignedTo: null,
      startDate: null,
      dueDate: null,
      priority: "Medium",
    };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];

    // Auto focus the new subtask (at the end of the array)
    setAutoFocusSubtaskIdx((task.subtasks || []).length);

    try {
      await updateTaskMutation({
        id: task._id,
        taskData: { subtasks: updatedSubtasks },
      }).unwrap();
    } catch (err) {
      console.error("Failed to add subtask via button:", err);
    }
  };

  // Delete Subtask
  const handleDeleteSubtask = async (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.filter(
      (sub) => sub._id !== subtaskId,
    );
    try {
      await updateTaskMutation({
        id: task._id,
        taskData: { subtasks: updatedSubtasks },
      }).unwrap();
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  // Delete parent Task
  const handleParentTaskDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      try {
        await deleteTaskMutation(taskId).unwrap();
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    }
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Dashboard calculations
  const totalTasks = activeProjectTasks.length;
  const completedTasks = activeProjectTasks.filter(
    (t) => t.status === "Completed",
  ).length;
  const incompleteTasks = activeProjectTasks.filter(
    (t) => t.status !== "Completed",
  ).length;

  // Overdue count calculation
  const overdueTasks = activeProjectTasks.filter((t) => {
    if (t.status === "Completed") return false;
    if (!t.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown of incomplete tasks for Bar Chart
  const pendingCount = activeProjectTasks.filter(
    (t) => t.status === "Pending",
  ).length;
  const inProgressCount = activeProjectTasks.filter(
    (t) => t.status === "In Progress",
  ).length;
  const onHoldCount = activeProjectTasks.filter(
    (t) => t.status === "On Hold",
  ).length;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 md:px-0 relative">
      {/* WORKSPACE HEADER & PROGRESS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-4 mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3 min-w-0 w-full lg:w-1/4 order-1 lg:order-none">
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-3">
              <div>
                {/* Breadcrumb Back Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 transition-colors"
                >
                  <FiChevronLeft size={16} />
                </button>
              </div>
              <ProjectIcon
                name={activeProject.name}
                size="lg"
                className="shadow-md"
              />
              <div className="flex items-center gap-2 min-w-0 truncate">
                <h1 className="text-lg sm:text-[15px] font-bold text-slate-800 dark:text-white truncate">
                {activeProject.name}
                </h1>
                {activeProject?.client?.companyName && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 shrink-0">
                    {activeProject.client.companyName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>


      {/* ACTION HEADER: ADD TASK & TABS SELECTOR */}

        {/* Left Side: Spacer to keep Tab Selector centered */}


        {/* Center: Tab Selector - High-end, Premium Design */}
        <div className="flex items-center justify-center w-full lg:w-auto order-2 lg:order-none shrink-0">
          <div className="bg-slate-100/80 dark:bg-[#121212] p-1 rounded-full flex items-center gap-1.5 border border-slate-200/60 dark:border-transparent shadow-inner backdrop-blur-md">
            {["List", "Board", "Timeline", "Dashboard"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-2 sm:px-4 py-1.5 text-[9px] sm:text-[11px] font-bold  tracking-wider transition-all duration-300 rounded-full shrink-0 cursor-pointer ${
                    isActive
                      ? "text-[var(--color-active-tab-text)]"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-[#e5ff00]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeWorkspaceTabPill"
                      className="absolute inset-0 bg-blue-600 dark:bg-[#e5ff00] rounded-full shadow-lg"
                      style={{ zIndex: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 26,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tab === "List" && (
                      <FiList
                        size={12.5}
                        className={`shrink-0 transition-colors duration-300 ${
                          isActive
                            ? "text-[var(--color-active-tab-text)]"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    )}
                    {tab === "Board" && (
                      <FiGrid
                        size={12.5}
                        className={`shrink-0 transition-colors duration-300 ${
                          isActive
                            ? "text-[var(--color-active-tab-text)]"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    )}
                    {tab === "Timeline" && (
                      <FiTrendingUp
                        size={12.5}
                        className={`shrink-0 transition-colors duration-300 ${
                          isActive
                            ? "text-[var(--color-active-tab-text)]"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    )}
                    {tab === "Dashboard" && (
                      <FiPieChart
                        size={12.5}
                        className={`shrink-0 transition-colors duration-300 ${
                          isActive
                            ? "text-[var(--color-active-tab-text)]"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    )}
                    <span>{tab}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-active-tab-text)]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Filter & Sort Popover Dropdowns */}
        <div className="flex items-center justify-between lg:justify-end gap-2 w-full lg:w-1/4 order-3 lg:order-none relative">
          {activeTab === "List" ? (
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              {/* Filter Trigger Button */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    setIsSortOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    isFilterOpen ||
                    filterSearch ||
                    filterAssignee !== "all" ||
                    filterStatus !== "all" ||
                    filterPriority !== "all" ||
                    filterStartDate ||
                    filterEndDate
                      ? "bg-blue-50 dark:bg-[#e5ff00]/10 border-blue-200 dark:border-transparent text-blue-600 dark:text-[#e5ff00]"
                      : "bg-white dark:bg-[#111] border-slate-200/80 dark:border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                    <line x1="9" y1="18" x2="15" y2="18" />
                  </svg>
                  <span>Filter</span>
                  {(filterSearch ||
                    filterAssignee !== "all" ||
                    filterStatus !== "all" ||
                    filterPriority !== "all" ||
                    filterStartDate ||
                    filterEndDate) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-[#e5ff00]" />
                  )}
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute left-0 md:left-auto md:right-0 mt-3 w-80 bg-white/95 dark:bg-[#121215]/95 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-5 z-50 space-y-4 backdrop-blur-xl max-h-[480px] overflow-y-auto custom-scrollbar select-none"
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-blue-500/10 dark:bg-[#e5ff00]/10 flex items-center justify-center">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600 dark:text-[#e5ff00]">
                              <line x1="4" y1="6" x2="20" y2="6" />
                              <line x1="6" y1="12" x2="18" y2="12" />
                              <line x1="9" y1="18" x2="15" y2="18" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Filters</span>
                        </div>
                        {(filterSearch || filterAssignee !== "all" || filterStatus !== "all" || filterPriority !== "all" || filterStartDate || filterEndDate) && (
                          <button
                            onClick={() => {
                              setFilterSearch("");
                              setFilterAssignee("all");
                              setFilterStatus("all");
                              setFilterPriority("all");
                              setFilterStartDate("");
                              setFilterEndDate("");
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Search */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Search</label>
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-550" size={12} />
                          <input
                            type="text"
                            placeholder="Type to search tasks..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50/50 dark:bg-[#18181b]/50 border border-slate-200/60 dark:border-white/10 focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] text-slate-800 dark:text-slate-200 transition-all placeholder-slate-450 dark:placeholder-slate-550"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Status</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: "all", label: "All", color: "bg-slate-400" },
                            { name: "Pending", label: "Pending", color: "bg-amber-500" },
                            { name: "In Progress", label: "In Progress", color: "bg-blue-500" },
                            { name: "Completed", label: "Completed", color: "bg-emerald-500" },
                            { name: "On Hold", label: "On Hold", color: "bg-rose-500" }
                          ].map((status) => (
                            <button
                              key={status.name}
                              onClick={() => setFilterStatus(status.name)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                                filterStatus === status.name
                                  ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                                  : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              {status.name !== "all" && (
                                <span className={`w-1.5 h-1.5 rounded-full ${status.color} shrink-0`} />
                              )}
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Priority</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: "all", label: "All", color: "bg-slate-400" },
                            { name: "Low", label: "Low", color: "bg-slate-400" },
                            { name: "Medium", label: "Medium", color: "bg-amber-500" },
                            { name: "High", label: "High", color: "bg-rose-500" }
                          ].map((priority) => (
                            <button
                              key={priority.name}
                              onClick={() => setFilterPriority(priority.name)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                                filterPriority === priority.name
                                  ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                                  : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              {priority.name !== "all" && (
                                <span className={`w-1.5 h-1.5 rounded-full ${priority.color} shrink-0`} />
                              )}
                              {priority.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Assignee</label>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                          <button
                            onClick={() => setFilterAssignee("all")}
                            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                              filterAssignee === "all"
                                ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                                : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setFilterAssignee("unassigned")}
                            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                              filterAssignee === "unassigned"
                                ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                                : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Unassigned
                          </button>
                          {users.map((u) => (
                            <button
                              key={u._id}
                              onClick={() => setFilterAssignee(u._id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                                filterAssignee === u._id
                                  ? "bg-blue-600 border-blue-600 text-white dark:bg-[#e5ff00] dark:border-[#e5ff00] dark:text-black shadow-md shadow-blue-500/10 dark:shadow-[#e5ff00]/10"
                                  : "bg-slate-50/50 border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-600 dark:bg-[#e5ff00]/20 dark:text-[#e5ff00] flex items-center justify-center text-[7px] font-extrabold shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                              <span>{u.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-white/5 pt-3">
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-[#18181b]/50 border border-slate-200/60 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-500 transition-all focus-within:border-blue-550 dark:focus-within:border-[#e5ff00]">
                            <FiCalendar size={11} className="shrink-0 text-slate-400 dark:text-slate-550" />
                            <input
                              type="date"
                              value={filterStartDate}
                              onChange={(e) => setFilterStartDate(e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-0 w-full"
                              title="Start Date"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-[#18181b]/50 border border-slate-200/60 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-slate-500 transition-all focus-within:border-blue-550 dark:focus-within:border-[#e5ff00]">
                            <FiCalendar size={11} className="shrink-0 text-slate-400 dark:text-slate-550" />
                            <input
                              type="date"
                              value={filterEndDate}
                              onChange={(e) => setFilterEndDate(e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-0 w-full"
                              title="End Date"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Trigger Button */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => {
                    setIsSortOpen(!isSortOpen);
                    setIsFilterOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    isSortOpen || sortBy !== "none"
                      ? "bg-blue-50 dark:bg-[#e5ff00]/10 border-blue-200 dark:border-transparent text-blue-600 dark:text-[#e5ff00]"
                      : "bg-white dark:bg-[#111] border-slate-200/80 dark:border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <line x1="17" y1="4" x2="17" y2="20" />
                    <polyline points="13 8 17 4 21 8" />
                    <line x1="7" y1="20" x2="7" y2="4" />
                    <polyline points="3 16 7 20 11 16" />
                  </svg>
                  <span>Sort</span>
                  {sortBy !== "none" && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-[#e5ff00] ml-0.5">
                      ({sortOrder === "asc" ? "▲" : "▼"})
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#111] border border-slate-200/80 dark:border-transparent rounded-2xl shadow-2xl p-2.5 z-50 space-y-1.5 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2 px-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-white  tracking-wider">
                          Sort By
                        </span>
                        {sortBy !== "none" && (
                          <button
                            onClick={() => {
                              setSortBy("none");
                              setSortOrder("asc");
                            }}
                            className="text-[10px] font-bold  text-rose-500 hover:text-rose-600 cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="space-y-1 pt-1">
                        {[
                          { id: "none", label: "No Sort" },
                          { id: "name", label: "Name" },
                          { id: "startDate", label: "Start Date" },
                          { id: "dueDate", label: "End Date" },
                          { id: "priority", label: "Priority" },
                          { id: "status", label: "Status" },
                        ].map((option) => {
                          const isSelected = sortBy === option.id;
                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                if (isSelected) {
                                  // Toggle sort order
                                  setSortOrder((prev) =>
                                    prev === "asc" ? "desc" : "asc",
                                  );
                                } else {
                                  setSortBy(option.id);
                                  setSortOrder("asc");
                                }
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50 dark:bg-[#e5ff00]/10 text-blue-600 dark:text-[#e5ff00]"
                                  : "text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5"
                              }`}
                            >
                              <span>{option.label}</span>
                              {isSelected && (
                                <span className="text-[10px] font-bold ">
                                  {sortOrder === "asc" ? "▲ Asc" : "▼ Desc"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[400px]">
        {activeTab === "List" && (
          <div className="space-y-6 pt-3">
            {Array.from(
              new Set(
                activeProject.sections?.length > 0
                  ? activeProject.sections
                  : ["Recent assignment"],
              ),
            ).map((sectionName, sectionIndex) => {
              const sectionTasks = sortedTasks.filter(
                (t) =>
                  t.section === sectionName ||
                  (!t.section && sectionName === "Recent assignment"),
              );
              const isSectionCollapsed = !!collapsedSections[sectionName];

              return (
                <div
                  key={`${sectionName}-${sectionIndex}`}
                  className="bg-white dark:bg-[#111111]/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-4"
                >
                  {/* SECTION HEADER BLOCK */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      {/* Play/triangle icon that rotates */}
                      <button
                        onClick={() => toggleSection(sectionName)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center p-0.5 rounded cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={`w-3.5 h-3.5 text-slate-550 transition-transform duration-200 ${isSectionCollapsed ? "" : "rotate-90"}`}
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      {editingSection === sectionName ? (
                        <form
                          onSubmit={(e) =>
                            handleRenameSectionSubmit(
                              e,
                              sectionName,
                            )
                          }
                          className="ml-1"
                        >
                          <input
                            autoFocus
                            value={editSectionValue}
                            onChange={(e) =>
                              setEditSectionValue(e.target.value)
                            }
                            onBlur={(e) =>
                              handleRenameSectionSubmit(
                                e,
                                sectionName,
                              )
                            }
                            className="text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-400 rounded px-2 py-1 outline-none text-slate-800 dark:text-white"
                          />
                        </form>
                      ) : (
                        <h3
                          className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-355 hover:text-blue-600 dark:hover:text-[#e5ff00] transition-colors cursor-pointer select-none"
                          onClick={() => toggleSection(sectionName)}
                        >
                          {sectionName}
                          <span className="ml-2 bg-blue-100/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/30 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {sectionTasks.length}
                          </span>
                        </h3>
                      )}
                    </div>

                    {isAdminOrManager && (
                      <div className="flex items-center gap-2">
                        {/* Add Task button */}
                        <button
                          onClick={() => handleAddTask(sectionName)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 rounded-lg transition-all cursor-pointer hover:shadow-sm"
                        >
                          <FiPlus size={11} />
                          <span>Add Task</span>
                        </button>

                        {/* Action button */}
                        <div className="relative">
                          {sectionName !== "Recent assignment" && (
                            <button
                              onClick={() =>
                                setOpenSectionMenu(
                                  openSectionMenu === sectionName
                                    ? null
                                    : sectionName,
                                )
                              }
                              className="p-1 bg-slate-100/60 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <FiMoreHorizontal size={13} />
                            </button>
                          )}

                          {sectionName !== "Recent assignment" &&
                            openSectionMenu === sectionName && (
                              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#151518] rounded-lg shadow-lg border border-slate-100 dark:border-white/10 z-50 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setEditingSection(sectionName);
                                    setEditSectionValue(
                                      sectionName,
                                    );
                                    setOpenSectionMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                                >
                                  <FiEdit2 size={12} /> Rename
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSection(sectionName)
                                  }
                                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/30 flex items-center gap-2 cursor-pointer"
                                >
                                  <FiTrash2 size={12} /> Delete
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION TABLE */}
                  {!isSectionCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px] border border-slate-200 dark:border-slate-800/80">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 tracking-wider text-[12px]">
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[240px]">
                              Name
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[140px]">
                              Client
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[140px]">
                              Assignee
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[130px]">
                              Content Type
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[120px]">
                              Start Date
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[120px]">
                              End Date
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[120px]">
                              Priority
                            </th>
                            <th className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-[120px]">
                              Status
                            </th>
                            <th className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-center whitespace-nowrap min-w-[80px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[11px]">
                          {sectionTasks.length === 0 ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="px-4 py-4 text-center text-slate-400 italic text-[10px] border-b border-slate-200 dark:border-slate-800"
                              >
                                No tasks in this section.
                              </td>
                            </tr>
                          ) : (
                            sectionTasks.map((task, taskIndex) => {
                              const isExpanded = !!expandedTasks[task._id];
                              const isCompleted = task.status === "Completed";
                              const canToggle =
                                isAdminOrManager ||
                                task.assignedTo?._id === currentUser?._id ||
                                task.assignedTo === currentUser?._id;

                              const isSelected = selectedTaskId === task._id;
                              const rowBg = isSelected
                                ? "bg-blue-50/40 dark:bg-[#e5ff00]/10"
                                : isCompleted
                                  ? "bg-slate-50/30 text-slate-400 dark:text-slate-500"
                                  : taskIndex % 2 === 0
                                    ? "bg-white dark:bg-slate-800/40 text-slate-800 dark:text-slate-100"
                                    : "bg-slate-50/40 dark:bg-slate-900/10 text-slate-800 dark:text-slate-100";

                              return (
                                <React.Fragment key={task._id}>
                                  {/* Parent Task Row */}
                                  <tr
                                    onClick={() => setSelectedTaskId(task._id)}
                                    className={`group cursor-pointer transition-colors ${rowBg} hover:bg-blue-50/20 dark:hover:bg-[#e5ff00]/5`}
                                  >
                                    {/* Name Field with Circle Checkbox */}
                                    <td
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 font-semibold"
                                    >
                                      <div className="flex items-center gap-2.5 w-full">
                                        {/* Expand/Collapse Chevron (only if subtasks exist) */}
                                        {task.subtasks?.length > 0 ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleTaskExpanded(task._id);
                                            }}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                                            title={
                                              isExpanded
                                                ? "Collapse Subtasks"
                                                : "Expand Subtasks"
                                            }
                                          >
                                            {isExpanded ? (
                                              <FiChevronDown size={12} />
                                            ) : (
                                              <FiChevronRight size={12} />
                                            )}
                                          </button>
                                        ) : (
                                          <div className="w-5 shrink-0" />
                                        )}

                                        {/* Circle Checkbox */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (canToggle) {
                                              handleTaskFieldChange(task._id, {
                                                status: isCompleted
                                                  ? "Pending"
                                                  : "Completed",
                                              });
                                            }
                                          }}
                                          disabled={!canToggle}
                                          className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                            !canToggle
                                              ? "cursor-not-allowed opacity-50"
                                              : "cursor-pointer"
                                          } ${
                                            isCompleted
                                              ? "bg-emerald-500 border-emerald-500 text-white"
                                              : "border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-[#e5ff00] text-transparent hover:text-slate-400 dark:hover:text-[#e5ff00]"
                                          }`}
                                        >
                                          <FiCheck size={9} />
                                        </button>

                                        {/* Task Title contentEditable Span */}
                                        <div className="flex-grow min-w-0">
                                          <span
                                            ref={(el) => {
                                              if (el && focusedTaskId === task._id) {
                                                el.focus();
                                                setFocusedTaskId(null);
                                              }
                                            }}
                                            contentEditable={canToggle}
                                            suppressContentEditableWarning={
                                              true
                                            }
                                            placeholder="Write a task here..."
                                            onBlur={(e) => {
                                              const val =
                                                e.target.innerText.trim();
                                              if (val !== task.title) {
                                                handleTaskFieldChange(
                                                  task._id,
                                                  { title: val },
                                                );
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.target.blur();
                                                handleAddTask(
                                                  task.section ||
                                                    "Recent assignment",
                                                );
                                              }
                                            }}
                                            className={`font-semibold text-slate-800 dark:text-white text-[11px] cursor-text outline-none block min-h-[16px] w-full ${
                                              isCompleted
                                                ? "line-through text-slate-450 dark:text-slate-555 font-bold"
                                                : ""
                                            }`}
                                          >
                                            {task.title}
                                          </span>
                                        </div>

                                        {/* Subtask Count Badge (static, click opens drawer) */}
                                        {task.subtasks?.length > 0 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTaskId(task._id);
                                            }}
                                            title={`${task.subtasks.length} subtask${task.subtasks.length !== 1 ? "s" : ""} — open details`}
                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 text-[8.5px] font-bold shrink-0 hover:bg-blue-50 dark:hover:bg-[#e5ff00]/10 hover:text-blue-600 dark:hover:text-[#e5ff00] hover:border-blue-200 dark:hover:border-[#e5ff00]/20 transition-all cursor-pointer"
                                          >
                                            <FiCornerDownRight size={8} />
                                            {task.subtasks.length}
                                          </button>
                                        )}

                                        {/* Detail Drawer Open Arrow */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTaskId(task._id);
                                          }}
                                          className="ml-auto shrink-0 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-[#e5ff00] p-0.5 rounded hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                          title="Open Task Details"
                                        >
                                          <FiChevronRight size={14} />
                                        </button>
                                      </div>
                                    </td>

                                    {/* Client Column */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-355 font-medium">
                                      {activeProject?.client?.companyName || "N/A"}
                                    </td>

                                    {/* Assignee Selection */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800">
                                      <div
                                        className="flex items-center gap-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <AssigneeDropdown
                                          selectedUser={task.assignedTo}
                                          users={users}
                                          onChange={(userId) =>
                                            handleTaskFieldChange(task._id, {
                                              assignedTo: userId,
                                            })
                                          }
                                          isAdminOrManager={isAdminOrManager}
                                          getAvatarColor={getAvatarColor}
                                          size="md"
                                        />
                                      </div>
                                    </td>

                                    {/* Content Type Column */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800">
                                      <div onClick={(e) => e.stopPropagation()}>
                                        {isAdminOrManager ? (
                                          <select
                                            value={task.contentType || ""}
                                            onChange={(e) =>
                                              handleTaskFieldChange(task._id, {
                                                contentType: e.target.value,
                                              })
                                            }
                                            className={`badge-select ${
                                              task.contentType === "Video"
                                                ? "badge-type-video"
                                                : task.contentType === "Image"
                                                  ? "badge-type-image"
                                                  : task.contentType === "Carousel"
                                                    ? "badge-type-carousel"
                                                    : task.contentType === "Reel"
                                                      ? "badge-type-reel"
                                                      : task.contentType === "Post"
                                                        ? "badge-type-post"
                                                        : task.contentType === "Story"
                                                          ? "badge-type-story"
                                                          : "badge-type-none"
                                            }`}
                                          >
                                            <option value="">None</option>
                                            <option value="Video">Video</option>
                                            <option value="Image">Image</option>
                                            <option value="Carousel">Carousel</option>
                                            <option value="Reel">Reel</option>
                                            <option value="Post">Post</option>
                                            <option value="Story">Story</option>
                                          </select>
                                        ) : (
                                          <span
                                            className={`badge-span ${
                                              task.contentType === "Video"
                                                ? "badge-type-video"
                                                : task.contentType === "Image"
                                                  ? "badge-type-image"
                                                  : task.contentType === "Carousel"
                                                    ? "badge-type-carousel"
                                                    : task.contentType === "Reel"
                                                      ? "badge-type-reel"
                                                      : task.contentType === "Post"
                                                        ? "badge-type-post"
                                                        : task.contentType === "Story"
                                                          ? "badge-type-story"
                                                          : "badge-type-none"
                                            }`}
                                          >
                                            {task.contentType || "None"}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Start Date */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800">
                                      <div
                                        className="relative h-6 flex items-center justify-start transition-all cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const input =
                                            e.currentTarget.querySelector(
                                              'input[type="date"]',
                                            );
                                          if (
                                            input &&
                                            typeof input.showPicker ===
                                              "function"
                                          ) {
                                            input.showPicker();
                                          }
                                        }}
                                      >
                                        {task.startDate ? (
                                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900/60 hover:border-blue-350 dark:hover:border-blue-500/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold bg-blue-50 dark:bg-blue-955/30 transition-all">
                                            <FiCalendar
                                              size={10}
                                              className="text-blue-500 dark:text-blue-400"
                                            />
                                            <span>
                                              {new Date(
                                                task.startDate,
                                              ).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </span>
                                            {isAdminOrManager && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTaskFieldChange(
                                                    task._id,
                                                    { startDate: null },
                                                  );
                                                }}
                                                className="ml-1 text-blue-400 hover:text-rose-500 relative z-10 transition-colors cursor-pointer"
                                              >
                                                <FiX size={10} />
                                              </button>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-dashed border-blue-200 dark:border-blue-900/40 text-blue-500/70 dark:text-blue-500/50 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 dark:hover:border-blue-500/40 bg-blue-50/20 dark:bg-blue-955/10 transition-all text-[9px] font-bold">
                                            <FiCalendar size={10} />
                                            <span>+ Start Date</span>
                                          </div>
                                        )}
                                        {isAdminOrManager && (
                                          <input
                                            type="date"
                                            value={
                                              task.startDate
                                                ? new Date(task.startDate)
                                                    .toISOString()
                                                    .split("T")[0]
                                                : ""
                                            }
                                            onChange={(e) =>
                                              handleTaskFieldChange(task._id, {
                                                startDate:
                                                  e.target.value || null,
                                              })
                                            }
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          />
                                        )}
                                      </div>
                                    </td>

                                    {/* End Date */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800">
                                      <div
                                        className="relative h-6 flex items-center justify-start transition-all cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const input =
                                            e.currentTarget.querySelector(
                                              'input[type="date"]',
                                            );
                                          if (
                                            input &&
                                            typeof input.showPicker ===
                                              "function"
                                          ) {
                                            input.showPicker();
                                          }
                                        }}
                                      >
                                        {task.dueDate ? (
                                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-900/60 hover:border-rose-350 dark:hover:border-rose-500/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold bg-rose-50 dark:bg-rose-955/30 transition-all">
                                            <FiCalendar
                                              size={10}
                                              className="text-rose-555 dark:text-rose-400"
                                            />
                                            <span>
                                              {new Date(
                                                task.dueDate,
                                              ).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </span>
                                            {isAdminOrManager && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTaskFieldChange(
                                                    task._id,
                                                    { dueDate: null },
                                                  );
                                                }}
                                                className="ml-1 text-rose-455 hover:text-rose-500 relative z-10 transition-colors cursor-pointer"
                                              >
                                                <FiX size={10} />
                                              </button>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-dashed border-rose-200 dark:border-rose-900/40 text-rose-500/70 dark:text-rose-500/50 hover:border-rose-400 hover:text-rose-700 dark:hover:text-rose-400 dark:hover:border-rose-500/40 bg-rose-50/20 dark:bg-rose-955/10 transition-all text-[9px] font-bold">
                                            <FiCalendar size={10} />
                                            <span>+ End Date</span>
                                          </div>
                                        )}
                                        {isAdminOrManager && (
                                          <input
                                            type="date"
                                            value={
                                              task.dueDate
                                                ? new Date(task.dueDate)
                                                    .toISOString()
                                                    .split("T")[0]
                                                : ""
                                            }
                                            min={
                                              task.startDate
                                                ? new Date(task.startDate)
                                                    .toISOString()
                                                    .split("T")[0]
                                                : ""
                                            }
                                            onChange={(e) =>
                                              handleTaskFieldChange(task._id, {
                                                dueDate: e.target.value || null,
                                              })
                                            }
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          />
                                        )}
                                      </div>
                                    </td>

                                    {/* Priority */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800">
                                      <div onClick={(e) => e.stopPropagation()}>
                                        {isAdminOrManager ? (
                                          <select
                                            value={task.priority || "Medium"}
                                            onChange={(e) =>
                                              handleTaskFieldChange(task._id, {
                                                priority: e.target.value,
                                              })
                                            }
                                            className={`badge-select ${
                                              task.priority === "High"
                                                ? "badge-priority-high"
                                                : task.priority === "Medium"
                                                  ? "badge-priority-medium"
                                                  : "badge-priority-low"
                                            }`}
                                          >
                                            <option value="Low">Low</option>
                                            <option value="Medium">
                                              Medium
                                            </option>
                                            <option value="High">High</option>
                                          </select>
                                        ) : (
                                          <span
                                            className={`badge-span ${
                                              task.priority === "High"
                                                ? "badge-priority-high"
                                                : task.priority === "Medium"
                                                  ? "badge-priority-medium"
                                                  : "badge-priority-low"
                                            }`}
                                          >
                                            {task.priority || "Medium"}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-3 py-2 border-r border-b border-slate-200 dark:border-slate-800">
                                      <div onClick={(e) => e.stopPropagation()}>
                                        {isAdminOrManager ? (
                                          <select
                                            value={task.status || "Pending"}
                                            onChange={(e) =>
                                              handleTaskFieldChange(task._id, {
                                                status: e.target.value,
                                              })
                                            }
                                            className={`badge-select ${
                                              task.status === "Completed"
                                                ? "badge-status-completed"
                                                : task.status === "In Progress"
                                                  ? "badge-status-in-progress"
                                                  : task.status === "On Hold"
                                                    ? "badge-status-on-hold"
                                                    : "badge-status-pending"
                                            }`}
                                          >
                                            <option value="Pending">
                                              Pending
                                            </option>
                                            <option value="In Progress">
                                              In Progress
                                            </option>
                                            <option value="Completed">
                                              Completed
                                            </option>
                                            <option value="On Hold">
                                              On Hold
                                            </option>
                                          </select>
                                        ) : (
                                          <span
                                            className={`badge-span ${
                                              task.status === "Completed"
                                                ? "badge-status-completed"
                                                : task.status === "In Progress"
                                                  ? "badge-status-in-progress"
                                                  : task.status === "On Hold"
                                                    ? "badge-status-on-hold"
                                                    : "badge-status-pending"
                                            }`}
                                          >
                                            {task.status || "Pending"}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Action Controls */}
                                    <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-center">
                                      <div
                                        className="flex items-center justify-center gap-2.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {isAdminOrManager && (
                                          <>
                                            <button
                                              onClick={() =>
                                                handleAddSubtaskViaButton(task)
                                              }
                                              className="text-slate-450 hover:text-blue-500 dark:hover:text-[#e5ff00] transition-colors p-1 flex items-center gap-0.5 text-[9px] font-bold cursor-pointer"
                                              title="Add Subtask"
                                            >
                                              <FiPlus size={11} />
                                              <span>Subtask</span>
                                            </button>

                                            <button
                                              onClick={() =>
                                                handleParentTaskDelete(task._id)
                                              }
                                              className="text-slate-450 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                              title="Delete Task"
                                            >
                                              <FiTrash2 size={12} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>

                                  {isExpanded && (
                                    <>
                                      {(task.subtasks || []).map(
                                        (sub, subIdx) => {
                                          const isSubCompleted =
                                            sub.status === "Completed";
                                          const canToggleSub =
                                            isAdminOrManager ||
                                            sub.assignedTo?._id ===
                                              currentUser?._id ||
                                            sub.assignedTo === currentUser?._id;
                                          const rowBgSub = isSubCompleted
                                            ? "bg-slate-100/40 text-slate-400 dark:text-slate-550/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                            : "bg-slate-50/70 dark:bg-slate-900/45 text-slate-800 dark:text-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]";

                                          return (
                                            <tr
                                              key={sub._id || subIdx}
                                              className={`group/subrow transition-colors ${rowBgSub} hover:bg-blue-50/10 dark:hover:bg-[#e5ff00]/5`}
                                            >
                                              {/* 1. Name Column */}
                                              <td
                                                className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800 font-semibold pl-10"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <div className="flex items-center gap-2 w-full pl-4 border-l border-slate-150 dark:border-slate-850">
                                                  <FiCornerDownRight
                                                    className="text-slate-450 shrink-0"
                                                    size={11}
                                                  />

                                                  {/* Subtask Checkbox */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (canToggleSub) {
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            status:
                                                              isSubCompleted
                                                                ? "Pending"
                                                                : "Completed",
                                                          },
                                                        );
                                                      }
                                                    }}
                                                    disabled={!canToggleSub}
                                                    className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                                      !canToggleSub
                                                        ? "cursor-not-allowed opacity-50"
                                                        : "cursor-pointer"
                                                    } ${
                                                      isSubCompleted
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-[#e5ff00] text-transparent hover:text-slate-400 dark:hover:text-[#e5ff00]"
                                                    }`}
                                                  >
                                                    <FiCheck size={8} />
                                                  </button>

                                                  {/* Subtask Title Input */}
                                                  <span
                                                    ref={(el) => {
                                                      if (
                                                        autoFocusSubtaskIdx ===
                                                          subIdx &&
                                                        el
                                                      ) {
                                                        el.focus();
                                                        const range =
                                                          document.createRange();
                                                        range.selectNodeContents(
                                                          el,
                                                        );
                                                        const sel =
                                                          window.getSelection();
                                                        sel.removeAllRanges();
                                                        sel.addRange(range);
                                                        setAutoFocusSubtaskIdx(
                                                          null,
                                                        );
                                                      }
                                                    }}
                                                    contentEditable={
                                                      canToggleSub
                                                    }
                                                    suppressContentEditableWarning={
                                                      true
                                                    }
                                                    placeholder="Write a subtask..."
                                                    onBlur={(e) => {
                                                      const val =
                                                        e.target.innerText.trim();
                                                      if (val !== sub.title) {
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            title: val,
                                                          },
                                                        );
                                                      }
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleSubtaskEnterKey(
                                                          task,
                                                          subIdx,
                                                          e.target.innerText,
                                                          false,
                                                        );
                                                      }
                                                    }}
                                                    className={`outline-none w-full font-bold text-slate-700 dark:text-white text-[11px] block min-h-[16px] cursor-text ${
                                                      isSubCompleted
                                                        ? "line-through text-slate-450 dark:text-slate-550"
                                                        : ""
                                                    }`}
                                                  >
                                                    {sub.title}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedTaskId(
                                                        task._id,
                                                      );
                                                      setTimeout(() => {
                                                        const el =
                                                          document.getElementById(
                                                            "drawer-subtasks-section",
                                                          );
                                                        if (el) {
                                                          el.scrollIntoView({
                                                            behavior: "smooth",
                                                            block: "start",
                                                          });
                                                        }
                                                      }, 350);
                                                    }}
                                                    className="shrink-0 text-slate-400 dark:text-slate-555 hover:text-blue-500 dark:hover:text-[#e5ff00] p-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-all opacity-0 group-hover/subrow:opacity-100 cursor-pointer ml-auto"
                                                    title="Open Details & View Subtasks"
                                                  >
                                                    <FiChevronRight size={12} />
                                                  </button>
                                                </div>
                                              </td>

                                              {/* 2. Client Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800 text-slate-450 opacity-60">
                                                {activeProject?.client?.companyName || "N/A"}
                                              </td>

                                              {/* 3. Assignee Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800">
                                                <div
                                                  className="flex items-center gap-1.5"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <AssigneeDropdown
                                                    selectedUser={sub.assignedTo}
                                                    users={users}
                                                    onChange={(userId) =>
                                                      handleSubtaskFieldChange(
                                                        task,
                                                        sub._id,
                                                        {
                                                          assignedTo: userId,
                                                        },
                                                      )
                                                    }
                                                    isAdminOrManager={isAdminOrManager}
                                                    getAvatarColor={getAvatarColor}
                                                    size="md"
                                                  />
                                                </div>
                                              </td>

                                              {/* 4. Content Type Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                  {isAdminOrManager ? (
                                                    <select
                                                      value={sub.contentType || ""}
                                                      onChange={(e) =>
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            contentType:
                                                              e.target.value,
                                                          },
                                                        )
                                                      }
                                                      className={`badge-select ${
                                                        sub.contentType === "Video"
                                                          ? "badge-type-video"
                                                          : sub.contentType ===
                                                              "Image"
                                                            ? "badge-type-image"
                                                            : sub.contentType ===
                                                                "Carousel"
                                                              ? "badge-type-carousel"
                                                              : sub.contentType ===
                                                                  "Reel"
                                                                ? "badge-type-reel"
                                                                : sub.contentType ===
                                                                    "Post"
                                                                  ? "badge-type-post"
                                                                  : sub.contentType ===
                                                                      "Story"
                                                                    ? "badge-type-story"
                                                                    : "badge-type-none"
                                                      }`}
                                                    >
                                                      <option value="">None</option>
                                                      <option value="Video">
                                                        Video
                                                      </option>
                                                      <option value="Image">
                                                        Image
                                                      </option>
                                                      <option value="Carousel">
                                                        Carousel
                                                      </option>
                                                      <option value="Reel">
                                                        Reel
                                                      </option>
                                                      <option value="Post">
                                                        Post
                                                      </option>
                                                      <option value="Story">
                                                        Story
                                                      </option>
                                                    </select>
                                                  ) : (
                                                    <span
                                                      className={`badge-span ${
                                                        sub.contentType === "Video"
                                                          ? "badge-type-video"
                                                          : sub.contentType ===
                                                              "Image"
                                                            ? "badge-type-image"
                                                            : sub.contentType ===
                                                                "Carousel"
                                                              ? "badge-type-carousel"
                                                              : sub.contentType ===
                                                                  "Reel"
                                                                ? "badge-type-reel"
                                                                : sub.contentType ===
                                                                    "Post"
                                                                  ? "badge-type-post"
                                                                  : sub.contentType ===
                                                                      "Story"
                                                                    ? "badge-type-story"
                                                                    : "badge-type-none"
                                                      }`}
                                                    >
                                                      {sub.contentType || "None"}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              {/* 5. Start Date Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800">
                                                <div
                                                  className="relative h-6 flex items-center justify-start transition-all cursor-pointer"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const input =
                                                      e.currentTarget.querySelector(
                                                        'input[type="date"]',
                                                      );
                                                    if (
                                                      input &&
                                                      typeof input.showPicker ===
                                                        "function"
                                                    ) {
                                                      input.showPicker();
                                                    }
                                                  }}
                                                >
                                                  {sub.startDate ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900/60 hover:border-blue-350 dark:hover:border-blue-500/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/30 transition-all">
                                                      <FiCalendar
                                                        size={10}
                                                        className="text-blue-500 dark:text-blue-400"
                                                      />
                                                      <span>
                                                        {new Date(
                                                          sub.startDate,
                                                        ).toLocaleDateString(
                                                          undefined,
                                                          {
                                                            month: "short",
                                                            day: "numeric",
                                                          },
                                                        )}
                                                      </span>
                                                      {isAdminOrManager && (
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSubtaskFieldChange(
                                                              task,
                                                              sub._id,
                                                              {
                                                                startDate: null,
                                                              },
                                                            );
                                                          }}
                                                          className="ml-1 text-blue-400 hover:text-rose-500 relative z-10 transition-colors cursor-pointer"
                                                        >
                                                          <FiX size={10} />
                                                        </button>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-dashed border-blue-200 dark:border-blue-900/40 text-blue-500/70 dark:text-blue-500/50 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 dark:hover:border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10 transition-all text-[9px] font-bold">
                                                      <FiCalendar size={10} />
                                                      <span>+ Start Date</span>
                                                    </div>
                                                  )}
                                                  {isAdminOrManager && (
                                                    <input
                                                      type="date"
                                                      value={
                                                        sub.startDate
                                                          ? new Date(
                                                              sub.startDate,
                                                            )
                                                              .toISOString()
                                                              .split("T")[0]
                                                          : ""
                                                      }
                                                      onChange={(e) =>
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            startDate:
                                                              e.target.value ||
                                                              null,
                                                          },
                                                        )
                                                      }
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                  )}
                                                </div>
                                              </td>

                                              {/* 6. End Date Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800">
                                                <div
                                                  className="relative h-6 flex items-center justify-start transition-all cursor-pointer"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const input =
                                                      e.currentTarget.querySelector(
                                                        'input[type="date"]',
                                                      );
                                                    if (
                                                      input &&
                                                      typeof input.showPicker ===
                                                        "function"
                                                    ) {
                                                      input.showPicker();
                                                    }
                                                  }}
                                                >
                                                  {sub.dueDate ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-900/60 hover:border-rose-350 dark:hover:border-rose-500/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold bg-rose-50 dark:bg-rose-955/30 transition-all">
                                                      <FiCalendar
                                                        size={10}
                                                        className="text-rose-555 dark:text-rose-400"
                                                      />
                                                      <span>
                                                        {new Date(
                                                          sub.dueDate,
                                                        ).toLocaleDateString(
                                                          undefined,
                                                          {
                                                            month: "short",
                                                            day: "numeric",
                                                          },
                                                        )}
                                                      </span>
                                                      {isAdminOrManager && (
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSubtaskFieldChange(
                                                              task,
                                                              sub._id,
                                                              { dueDate: null },
                                                            );
                                                          }}
                                                          className="ml-1 text-rose-455 hover:text-rose-500 relative z-10 transition-colors cursor-pointer"
                                                        >
                                                          <FiX size={10} />
                                                        </button>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-dashed border-rose-200 dark:border-rose-900/40 text-rose-500/70 dark:text-rose-555 hover:border-rose-400 hover:text-rose-700 dark:hover:text-rose-400 dark:hover:border-rose-500/40 bg-rose-50/20 dark:bg-rose-955/10 transition-all text-[9px] font-bold">
                                                      <FiCalendar size={10} />
                                                      <span>+ End Date</span>
                                                    </div>
                                                  )}
                                                  {isAdminOrManager && (
                                                    <input
                                                      type="date"
                                                      value={
                                                        sub.dueDate
                                                          ? new Date(
                                                              sub.dueDate,
                                                            )
                                                              .toISOString()
                                                              .split("T")[0]
                                                          : ""
                                                      }
                                                      min={
                                                        sub.startDate
                                                          ? new Date(
                                                              sub.startDate,
                                                            )
                                                              .toISOString()
                                                              .split("T")[0]
                                                          : ""
                                                      }
                                                      onChange={(e) =>
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            dueDate:
                                                              e.target.value ||
                                                              null,
                                                          },
                                                        )
                                                      }
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                  )}
                                                </div>
                                              </td>

                                              {/* 7. Priority Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800">
                                                <div
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  {isAdminOrManager ? (
                                                    <select
                                                      value={
                                                        sub.priority || "Medium"
                                                      }
                                                      onChange={(e) =>
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            priority:
                                                              e.target.value,
                                                          },
                                                        )
                                                      }
                                                      className={`badge-select ${
                                                        sub.priority === "High"
                                                          ? "badge-priority-high"
                                                          : sub.priority ===
                                                              "Medium"
                                                            ? "badge-priority-medium"
                                                            : "badge-priority-low"
                                                      }`}
                                                    >
                                                      <option value="Low">
                                                        Low
                                                      </option>
                                                      <option value="Medium">
                                                        Medium
                                                      </option>
                                                      <option value="High">
                                                        High
                                                      </option>
                                                    </select>
                                                  ) : (
                                                    <span
                                                      className={`badge-span ${
                                                        sub.priority === "High"
                                                          ? "badge-priority-high"
                                                          : sub.priority ===
                                                              "Medium"
                                                            ? "badge-priority-medium"
                                                            : "badge-priority-low"
                                                      }`}
                                                    >
                                                      {sub.priority || "Medium"}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              {/* 8. Status Column */}
                                              <td className="px-3 py-1 border-r border-b border-slate-200 dark:border-slate-800">
                                                <div
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  {isAdminOrManager ? (
                                                    <select
                                                      value={
                                                        sub.status || "Pending"
                                                      }
                                                      onChange={(e) =>
                                                        handleSubtaskFieldChange(
                                                          task,
                                                          sub._id,
                                                          {
                                                            status:
                                                              e.target.value,
                                                          },
                                                        )
                                                      }
                                                      className={`badge-select ${
                                                        sub.status ===
                                                        "Completed"
                                                          ? "badge-status-completed"
                                                          : sub.status ===
                                                              "In Progress"
                                                            ? "badge-status-in-progress"
                                                            : sub.status ===
                                                                "On Hold"
                                                              ? "badge-status-on-hold"
                                                              : "badge-status-pending"
                                                      }`}
                                                    >
                                                      <option value="Pending">
                                                        Pending
                                                      </option>
                                                      <option value="In Progress">
                                                        In Progress
                                                      </option>
                                                      <option value="Completed">
                                                        Completed
                                                      </option>
                                                      <option value="On Hold">
                                                        On Hold
                                                      </option>
                                                    </select>
                                                  ) : (
                                                    <span
                                                      className={`badge-span ${
                                                        sub.status ===
                                                        "Completed"
                                                          ? "badge-status-completed"
                                                          : sub.status ===
                                                              "In Progress"
                                                            ? "badge-status-in-progress"
                                                            : sub.status ===
                                                                "On Hold"
                                                              ? "badge-status-on-hold"
                                                              : "badge-status-pending"
                                                      }`}
                                                    >
                                                      {sub.status || "Pending"}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              {/* 9. Actions Column */}
                                              <td className="px-3 py-1 border-b border-slate-200 dark:border-slate-800 text-center">
                                                <div
                                                  className="flex items-center justify-center gap-2.5 opacity-0 group-hover/subrow:opacity-100 transition-opacity"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  {isAdminOrManager && (
                                                    <button
                                                      onClick={() =>
                                                        handleDeleteSubtask(
                                                          task,
                                                          sub._id,
                                                        )
                                                      }
                                                      className="text-slate-455 hover:text-red-500 transition-colors p-1"
                                                      title="Delete Subtask"
                                                    >
                                                      <FiTrash2 size={12} />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        },
                                      )}
                                    </>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ADD SECTION AT THE BOTTOM */}
            {isAdminOrManager && (
              <div className="bg-slate-50/40 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-start">
                {isAddingSection ? (
                  <form
                    onSubmit={handleAddSectionSubmit}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={newSectionName}
                      onChange={(e) =>
                        setNewSectionName(e.target.value)
                      }
                      placeholder="New section name..."
                      className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00] text-slate-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-700 dark:hover:bg-[#ccff00] text-white dark:text-black font-bold text-[10px] rounded-lg cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionName("");
                      }}
                      className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-[10px] rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingSection(true)}
                    className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#e5ff00] font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    <FiPlus size={14} /> Add Section
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "Board" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-4 ">
              {/* Board Columns Grid */}
              <div className="flex gap-4 items-start overflow-x-auto pb-4 hide-scrollbar snap-x">
                {Array.from(
                  new Set(
                    activeProject.sections?.length > 0
                      ? activeProject.sections
                      : ["Recent assignment"],
                  ),
                ).map((sectionName) => {
                  const columnTasks = activeProjectTasks.filter(
                    (t) =>
                      t.section === sectionName ||
                      (!t.section && sectionName === "Recent assignment"),
                  );

                  return (
                    <div
                      key={sectionName}
                      className="bg-slate-50/80 dark:bg-[#1a1a1a]/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col min-h-[380px] max-h-[700px] min-w-[280px] sm:min-w-[320px] snap-center shrink-0"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                            {sectionName}
                          </h4>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-2 rounded-lg bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <StrictModeDroppable droppableId={sectionName}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin rounded-xl p-1 transition-colors ${
                              snapshot.isDraggingOver
                                ? "bg-slate-100/50 dark:bg-white/5 ring-1 ring-blue-400/30 dark:ring-[#e5ff00]/30"
                                : ""
                            }`}
                          >
                            {columnTasks.map((task, index) => {
                              const isCompleted = task.status === "Completed";
                              return (
                                <Draggable
                                  key={task._id}
                                  draggableId={task._id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={provided.draggableProps.style}
                                      onClick={() =>
                                        setSelectedTaskId(task._id)
                                      }
                                      className={`bg-white dark:bg-[#111111] p-2.5 rounded-xl border cursor-pointer space-y-2 relative group select-none ${
                                        snapshot.isDragging
                                          ? "shadow-2xl ring-2 ring-blue-500 dark:ring-[#e5ff00] scale-[1.03] z-50 border-blue-300 dark:border-[#e5ff00]"
                                          : "border-slate-150 dark:border-white/5 hover:shadow-md hover:border-slate-200 dark:hover:border-[#e5ff00]/50 transition-shadow transition-colors"
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        {/* Status Checkbox */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTaskFieldChange(task._id, {
                                              status: isCompleted
                                                ? "Pending"
                                                : "Completed",
                                            });
                                          }}
                                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                            isCompleted
                                              ? "bg-emerald-500 border-emerald-500 text-white"
                                              : "border-slate-350 dark:border-slate-650 hover:border-blue-500 dark:hover:border-[#e5ff00] text-transparent hover:text-slate-400 dark:hover:text-[#e5ff00]"
                                          }`}
                                        >
                                          <FiCheck size={9} />
                                        </button>

                                        {/* Title */}
                                        <span
                                          className={`text-[11px] font-bold leading-normal text-slate-855 dark:text-white pr-6 ${
                                            isCompleted
                                              ? "line-through text-slate-400 dark:text-slate-500"
                                              : ""
                                          }`}
                                        >
                                          {task.title}
                                        </span>
                                      </div>

                                      {/* Board Card Extra Data: Tags / Status */}
                                      <div className="flex flex-wrap items-center gap-1 mt-1.5 mb-2">
                                        {/* Status Badge */}
                                        <span
                                          className={`text-[8px] font-bold  tracking-wider px-1 py-2 rounded-md border ${
                                            task.status === "Completed"
                                              ? "bg-emerald-55/10 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40"
                                              : task.status === "In Progress"
                                                ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-[#e5ff00]/10 dark:text-[#e5ff00] dark:border-[#e5ff00]/30"
                                                : task.status === "On Hold"
                                                  ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40"
                                                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                                          }`}
                                        >
                                          {task.status || "Pending"}
                                        </span>

                                        {/* Priority Badge */}
                                        <span
                                          className={`text-[8px] font-bold  tracking-wider px-1 py-2 rounded-md border ${
                                            task.priority === "High"
                                              ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/40"
                                              : task.priority === "Medium"
                                                ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:border-amber-900/40"
                                                : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#1a1a1a] dark:text-slate-400 dark:border-white/5"
                                          }`}
                                        >
                                          {task.priority || "Medium"}
                                        </span>

                                        {/* Due Date */}
                                        {task.dueDate && (
                                          <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-2 rounded-md bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-300">
                                            <FiCalendar
                                              size={8}
                                              className="text-rose-505 dark:text-rose-400"
                                            />
                                            {new Date(
                                              task.dueDate,
                                            ).toLocaleDateString("en-GB", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </span>
                                        )}
                                      </div>

                                      {/* Delete Action (visible on hover) */}
                                      {isAdminOrManager && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleParentTaskDelete(task._id);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1.5 right-1.5 p-1 text-rose-500 bg-rose-50 dark:bg-rose-905/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50"
                                        >
                                          <FiTrash2 size={11} />
                                        </button>
                                      )}

                                      {/* Card Footer: Assignee */}
                                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800/60">
                                        <div
                                          className="flex items-center gap-1 pt-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <AssigneeDropdown
                                            selectedUser={task.assignedTo}
                                            users={users}
                                            onChange={(userId) =>
                                              handleTaskFieldChange(task._id, {
                                                assignedTo: userId,
                                              })
                                            }
                                            isAdminOrManager={isAdminOrManager}
                                            getAvatarColor={getAvatarColor}
                                            size="md"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </StrictModeDroppable>

                      {/* Column Add Task Button */}
                      {isAdminOrManager && (
                        <button
                          onClick={() => handleAddTask(sectionName)}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-[#e5ff00] hover:bg-white dark:hover:bg-white/5 transition-colors font-bold text-xs"
                        >
                          <FiPlus size={14} />
                          Add task
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Section Column */}
                {isAdminOrManager && (
                  <div className="min-w-[280px] sm:min-w-[320px] snap-center shrink-0">
                    {isAddingSection ? (
                      <form
                        onSubmit={handleAddSectionSubmit}
                        className="bg-slate-50/80 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col gap-2"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="New section name..."
                          className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#111111] text-slate-700 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#e5ff00]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-blue-600 dark:bg-[#e5ff00] hover:bg-blue-700 dark:hover:bg-[#ccff00] text-white dark:text-black font-bold text-[10px] rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingSection(false);
                              setNewSectionName("");
                            }}
                            className="w-full py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-[10px] rounded-lg border border-slate-200 dark:border-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsAddingSection(true)}
                        className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#e5ff00] font-bold text-[13px] transition-colors w-full h-[60px] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <FiPlus size={16} /> Add Section
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DragDropContext>
        )}

        {activeTab === "Timeline" &&
          (() => {
            // Date helpers self-contained
            const todayDate = new Date();
            const baseDate = new Date(
              todayDate.getFullYear(),
              todayDate.getMonth(),
              todayDate.getDate(),
            );
            // Shift timeline by the timelineOffsetWeeks state
            const timelineStart = new Date(
              baseDate.getTime() +
                timelineOffsetWeeks * 7 * 24 * 60 * 60 * 1000 -
                7 * 24 * 60 * 60 * 1000,
            );

            const getWeekRange = (weekIndex) => {
              const start = new Date(
                timelineStart.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000,
              );
              const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
              // Calculate simple ISO week number or close approximation
              const d = new Date(
                Date.UTC(
                  start.getFullYear(),
                  start.getMonth(),
                  start.getDate(),
                ),
              );
              const dayNum = d.getUTCDay() || 7;
              d.setUTCDate(d.getUTCDate() + 4 - dayNum);
              const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
              const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);

              return {
                label: `Week ${weekNo}`,
                dates: `${start.toLocaleDateString("en-US", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`,
              };
            };

            const activeSections = Array.from(
              new Set(
                activeProject.sections?.length > 0
                  ? activeProject.sections
                  : ["Recent assignment"],
              ),
            );

            return (
              <div className="space-y-4">
                {/* Timeline Action Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimelineOffsetWeeks((prev) => prev - 1)}
                      className="p-1 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-650 dark:text-slate-355 cursor-pointer"
                      title="Previous Week"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setTimelineOffsetWeeks(0)}
                      className="px-2.5 py-1 text-[9px] font-bold  tracking-wider rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-650 dark:text-slate-355 cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setTimelineOffsetWeeks((prev) => prev + 1)}
                      className="p-1 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-650 dark:text-slate-355 cursor-pointer"
                      title="Next Week"
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </div>

                  <span className="text-[10px] font-bold  tracking-wider text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-[#141414] px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5">
                    {timelineStart.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Main Timeline Card Container */}
                <div className="flex border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#070b13] rounded-2xl overflow-hidden min-h-[500px] shadow-sm">
                  {/* Timeline Left Sidebar (Sections & Tasks list) */}
                  <div className="w-[180px] sm:w-[220px] border-r border-slate-200 dark:border-white/5 shrink-0 flex flex-col bg-slate-50/50 dark:bg-[#0b101c]/40 z-10 pt-[52px]">
                    {activeSections.map((sectionName) => (
                      <React.Fragment key={sectionName}>
                        <div className="border-b border-slate-200 dark:border-white/5 h-10 flex items-center justify-between px-3 bg-slate-100/40 dark:bg-[#161616]/30">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-350">
                            <FiChevronDown
                              size={12}
                              className="text-slate-400"
                            />
                            <span className="truncate">{sectionName}</span>
                          </div>
                          {isAdminOrManager && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTask(sectionName);
                              }}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-[#e5ff00] rounded text-slate-400 transition-colors cursor-pointer"
                            >
                              <FiPlus size={11} />
                            </button>
                          )}
                        </div>
                        {/* Render tasks under section in sidebar */}
                        {activeProjectTasks
                          .filter(
                            (t) =>
                              t.section === sectionName ||
                              (!t.section &&
                                sectionName === "Recent assignment"),
                          )
                          .map((task) => (
                            <div
                              key={`sidebar-${task._id}`}
                              onClick={() => setSelectedTaskId(task._id)}
                              className="border-b border-slate-100 dark:border-white/5 h-8 flex items-center px-3 pl-6 hover:bg-blue-50/50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 mr-1.5 ${
                                  task.status === "Completed"
                                    ? "bg-emerald-500"
                                    : task.status === "In Progress"
                                      ? "bg-blue-500 dark:bg-[#e5ff00]"
                                      : task.status === "On Hold"
                                        ? "bg-amber-500"
                                        : "bg-slate-400"
                                }`}
                              />
                              <span className="truncate text-[9.5px] font-bold text-slate-655 dark:text-white">
                                {task.title || "Untitled Task"}
                              </span>
                            </div>
                          ))}
                      </React.Fragment>
                    ))}
                    {isAdminOrManager && (
                      <div className="py-3 px-3 h-10 flex items-center">
                        <button
                          onClick={() => setIsAddingSection(true)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-[#e5ff00] transition-colors cursor-pointer"
                        >
                          <FiPlus size={11} /> Add section
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timeline Right Grid Area */}
                  <div className="flex-1 overflow-x-auto relative hide-scrollbar">
                    {/* Timeline Header (Months & Weeks) */}
                    <div className="flex flex-col border-b border-slate-200 dark:border-white/5 min-w-[800px] bg-slate-50 dark:bg-[#090d16] sticky top-0 z-20">
                      <div className="flex h-13">
                        {[0, 1, 2, 3].map((weekIdx) => {
                          const weekData = getWeekRange(weekIdx);
                          return (
                            <div
                              key={weekIdx}
                              className="w-1/4 px-3 flex flex-col justify-center border-r border-slate-200 dark:border-white/5"
                            >
                              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350">
                                {weekData.label}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                                {weekData.dates}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline Body (Grid) */}
                    <div className="relative min-w-[800px] h-full w-full">
                      {/* Background grid */}
                      <div className="absolute inset-0 flex w-full pointer-events-none">
                        {[...Array(28)].map((_, i) => {
                          const cellDate = new Date(
                            timelineStart.getTime() + i * 24 * 60 * 60 * 1000,
                          );
                          const isWeekend =
                            cellDate.getDay() === 0 || cellDate.getDay() === 6;
                          const isTodayCell =
                            cellDate.toDateString() === baseDate.toDateString();
                          return (
                            <div
                              key={i}
                              className={`flex-1 border-r border-slate-200/50 dark:border-white/5 h-full ${
                                isWeekend
                                  ? "bg-slate-50/[0.15] dark:bg-white/[0.02]"
                                  : ""
                              } ${isTodayCell ? "bg-blue-50/10 dark:bg-[#e5ff00]/5" : ""}`}
                            />
                          );
                        })}
                      </div>

                      {/* Task Rows mapped parallel to sections */}
                      <div className="relative z-10 w-full flex flex-col pb-20">
                        {activeSections.map((sectionName) => (
                          <React.Fragment key={`grid-${sectionName}`}>
                            <div className="h-10 border-b border-slate-200 dark:border-white/5 w-full" />
                            {activeProjectTasks
                              .filter(
                                (t) =>
                                  t.section === sectionName ||
                                  (!t.section &&
                                    sectionName === "Recent assignment"),
                              )
                              .map((task) => {
                                // Calculate real date-based positioning
                                const taskStart = task.startDate
                                  ? new Date(task.startDate)
                                  : new Date(baseDate);
                                const taskEnd = task.dueDate
                                  ? new Date(task.dueDate)
                                  : new Date(
                                      taskStart.getTime() + 24 * 60 * 60 * 1000,
                                    );

                                const startOffsetMs =
                                  taskStart.getTime() - timelineStart.getTime();
                                let startOffsetDays =
                                  startOffsetMs / (1000 * 60 * 60 * 24);

                                const durationMs =
                                  taskEnd.getTime() - taskStart.getTime();
                                let durationDays = Math.ceil(
                                  durationMs / (1000 * 60 * 60 * 24),
                                );
                                if (durationDays <= 0) durationDays = 1;

                                // Bounds constraint for 28-day window
                                let showOnTimeline = true;
                                if (
                                  startOffsetDays + durationDays < 0 ||
                                  startOffsetDays > 28
                                ) {
                                  showOnTimeline = false;
                                }

                                // Constrain bar within the visible 28 columns
                                if (showOnTimeline) {
                                  if (startOffsetDays < 0) {
                                    durationDays = Math.max(
                                      1,
                                      durationDays + startOffsetDays,
                                    );
                                    startOffsetDays = 0;
                                  }
                                  if (startOffsetDays + durationDays > 28) {
                                    durationDays = 28 - startOffsetDays;
                                  }
                                }

                                const leftPercent =
                                  (startOffsetDays / 28) * 100;
                                const widthPercent = (durationDays / 28) * 100;

                                return (
                                  <div
                                    key={`grid-task-${task._id}`}
                                    className="h-8 border-b border-slate-100 dark:border-white/5 w-full relative group"
                                  >
                                    {showOnTimeline && (
                                      <div
                                        onClick={() =>
                                          setSelectedTaskId(task._id)
                                        }
                                        style={{
                                          left: `${leftPercent}%`,
                                          width: `${widthPercent}%`,
                                        }}
                                        className={`absolute top-1 h-6 rounded-lg shadow-sm text-[9.5px] font-bold px-2 flex items-center justify-between truncate cursor-pointer transition-all hover:scale-[1.01] hover:brightness-105 ${
                                          task.status === "Completed"
                                            ? "bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                            : task.status === "In Progress"
                                              ? "bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/20 text-blue-700 dark:text-[#e5ff00]"
                                              : task.status === "On Hold"
                                                ? "bg-amber-55 dark:bg-amber-550/15 border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
                                                : "bg-slate-50 dark:bg-slate-500/15 border border-slate-200 dark:border-slate-500/20 text-slate-600 dark:text-slate-400"
                                        }`}
                                        title={`${task.title || "Untitled Task"} (${task.startDate ? new Date(task.startDate).toLocaleDateString() : "No Start"} - ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Due Date"})`}
                                      >
                                        <span className="truncate pr-1">
                                          {task.title || "Untitled Task"}
                                        </span>
                                      </div>
                                    )}
                                    {isAdminOrManager && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleParentTaskDelete(task._id);
                                        }}
                                        className="absolute right-4 top-1 opacity-0 group-hover:opacity-100 text-rose-500 p-1 bg-white dark:bg-[#161616] rounded z-20 hover:bg-rose-50 dark:hover:bg-white/5 border border-rose-100 dark:border-white/10 shadow-sm transition-opacity cursor-pointer"
                                      >
                                        <FiTrash2 size={10} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Today Line */}
                      {timelineOffsetWeeks === 0 && (
                        <>
                          <div className="absolute top-0 bottom-0 left-[25%] w-px bg-blue-500 dark:bg-[#e5ff00]/60 z-10 pointer-events-none" />
                          <div className="absolute -top-1 left-[25%] -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-[#e5ff00] z-10 pointer-events-none" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {activeTab === "Dashboard" && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold  tracking-wider text-slate-400 dark:text-white">
              Dashboard Metrics
            </h3>

            {/* Stats Cards Grid - Premium Gradients & Glows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Total Completed */}
              <div className="relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#070b13] border-slate-200/60 dark:border-white/5 shadow-lg shadow-slate-100/40 dark:shadow-none hover:shadow-xl group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-20 pointer-events-none" />
                <FiCheckCircle
                  size={24}
                  className="text-emerald-500/40 dark:text-emerald-400/25 absolute top-5 right-5 pointer-events-none"
                />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold  tracking-wider text-slate-500 dark:text-slate-400">
                    Completed tasks
                  </h4>
                  <div className="text-4xl font-bold mt-4 drop-shadow-sm text-emerald-500 dark:text-emerald-400">
                    {completedTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[9px] font-bold  tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> 1 Filter
                </div>
              </div>

              {/* Card 2: Total Incomplete */}
              <div className="relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#070b13] border-slate-200/60 dark:border-white/5 shadow-lg shadow-slate-100/40 dark:shadow-none hover:shadow-xl group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 dark:bg-[#e5ff00] rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-20 pointer-events-none" />
                <FiClock
                  size={24}
                  className="text-blue-550/40 dark:text-[#e5ff00]/25 absolute top-5 right-5 pointer-events-none"
                />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold  tracking-wider text-slate-500 dark:text-slate-400">
                    Incomplete tasks
                  </h4>
                  <div className="text-4xl font-bold mt-4 drop-shadow-sm text-blue-500 dark:text-[#e5ff00]">
                    {incompleteTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[9px] font-bold  tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> 1 Filter
                </div>
              </div>

              {/* Card 3: Total Overdue */}
              <div className="relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#070b13] border-slate-200/60 dark:border-white/5 shadow-lg shadow-slate-100/40 dark:shadow-none hover:shadow-xl group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-20 pointer-events-none" />
                <FiAlertTriangle
                  size={24}
                  className="text-rose-500/40 dark:text-rose-450/25 absolute top-5 right-5 pointer-events-none"
                />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold  tracking-wider text-slate-500 dark:text-slate-400">
                    Overdue tasks
                  </h4>
                  <div className="text-4xl font-bold mt-4 drop-shadow-sm text-rose-500 dark:text-rose-455">
                    {overdueTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[9px] font-bold  tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> 1 Filter
                </div>
              </div>

              {/* Card 4: Total Tasks */}
              <div className="relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#070b13] border-slate-200/60 dark:border-white/5 shadow-lg shadow-slate-100/40 dark:shadow-none hover:shadow-xl group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 dark:opacity-10 pointer-events-none" />
                <FiLayers
                  size={24}
                  className="text-slate-500/40 dark:text-white/20 absolute top-5 right-5 pointer-events-none"
                />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold  tracking-wider text-slate-500 dark:text-slate-400">
                    Total tasks
                  </h4>
                  <div className="text-4xl font-bold mt-4 drop-shadow-sm text-slate-700 dark:text-white">
                    {totalTasks}
                  </div>
                </div>
                <div className="relative z-10 text-[9px] font-bold  tracking-wider mt-4 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <FiClock size={11} /> No Filters
                </div>
              </div>
            </div>

            {/* Reports Charts Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Chart 1: Total incomplete tasks by section (Status Breakdown) */}
              <div className="bg-white dark:bg-[#070b13] p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-300 dark:hover:border-[#e5ff00]/30">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100  tracking-wider mb-8">
                  Total incomplete tasks by section
                </h4>

                {/* Custom SVG Bar Chart */}
                <div className="flex-1 min-h-[220px] flex items-end justify-around pb-6 border-b border-slate-200/50 dark:border-white/5 relative overflow-x-auto hide-scrollbar gap-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 opacity-30">
                    <div className="border-b border-slate-200 dark:border-white/10 w-full border-dashed" />
                    <div className="border-b border-slate-200 dark:border-white/10 w-full border-dashed" />
                    <div className="border-b border-slate-200 dark:border-white/10 w-full border-dashed" />
                  </div>

                  {/* Dynamic Section Bars */}
                  {Array.from(
                    new Set(
                      activeProject.sections?.length > 0
                        ? activeProject.sections
                        : ["Recent assignment"],
                    ),
                  ).map((sectionName, index) => {
                    const sectionIncompleteCount = activeProjectTasks.filter(
                      (t) =>
                        (t.section === sectionName ||
                          (!t.section &&
                            sectionName === "Recent assignment")) &&
                        t.status !== "Completed",
                    ).length;

                    return (
                      <div
                        key={sectionName}
                        className="flex flex-col items-center gap-2 z-10 w-20 group cursor-default shrink-0"
                      >
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-405 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          {sectionIncompleteCount}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{
                            height: `${totalTasks > 0 ? Math.max((sectionIncompleteCount / totalTasks) * 140, 2) : 2}px`,
                          }}
                          transition={{ delay: index * 0.1 }}
                          className="w-10 rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400 dark:from-[#99cc00] dark:to-[#e5ff00] shadow-[0_0_15px_rgba(56,189,248,0.3)] dark:shadow-[0_0_15px_rgba(229,255,0,0.3)] transition-all duration-300 group-hover:brightness-125"
                        />
                        <span
                          className="text-[9px] font-bold  tracking-wider text-slate-500 dark:text-slate-400 mt-2 text-center w-full truncate"
                          title={sectionName}
                        >
                          {sectionName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550  tracking-wider pt-4 flex items-center justify-between">
                  <span>2 Filters Active</span>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-blue-600 dark:text-[#e5ff00] hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm">
                    View Details
                  </button>
                </div>
              </div>

              {/* Chart 2: Total tasks by completion status (Donut Chart) */}
              <div className="bg-white dark:bg-[#070b13] p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-300 dark:hover:border-[#e5ff00]/30">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100  tracking-wider mb-6">
                  Total tasks by completion status
                </h4>

                <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-10 py-4 border-b border-slate-200/50 dark:border-white/5">
                  {/* SVG Donut Chart */}
                  <div className="relative w-36 h-36 flex items-center justify-center filter drop-shadow-md">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      {/* Background circle */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="rgba(226, 232, 240, 0.4)" // Light slate for track
                        className="dark:stroke-white/5"
                        strokeWidth="3.5"
                      />

                      {/* Completed Segment */}
                      {totalTasks > 0 && completedTasks > 0 && (
                        <motion.circle
                          initial={{ strokeDasharray: `0 100` }}
                          animate={{
                            strokeDasharray: `${(completedTasks / totalTasks) * 100} ${100 - (completedTasks / totalTasks) * 100}`,
                          }}
                          transition={{
                            type: "tween",
                            ease: "easeOut",
                            duration: 1.5,
                          }}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="url(#gradientCompleted)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Foreground Circle (Incomplete Segment) */}
                      {totalTasks > 0 && incompleteTasks > 0 && (
                        <motion.circle
                          initial={{
                            strokeDasharray: `0 100`,
                            strokeDashoffset: 0,
                          }}
                          animate={{
                            strokeDasharray: `${(incompleteTasks / totalTasks) * 100} ${100 - (incompleteTasks / totalTasks) * 100}`,
                            strokeDashoffset: -(
                              (completedTasks / totalTasks) *
                              100
                            ),
                          }}
                          transition={{
                            type: "tween",
                            ease: "easeOut",
                            duration: 1.5,
                          }}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke="url(#gradientIncomplete)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Define Gradients */}
                      <defs>
                        <linearGradient
                          id="gradientIncomplete"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--color-incomplete-start)"
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-incomplete-end)"
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradientCompleted"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--color-completed-start)"
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-completed-end)"
                          />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Middle Text */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    >
                      <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-violet-600 to-pink-500 dark:from-[#99cc00] dark:to-[#e5ff00] drop-shadow-sm">
                        {incompleteTasks}
                      </span>
                      <span className="text-[8px] font-bold  text-slate-400 mt-1">
                        Remaining
                      </span>
                    </motion.div>
                  </div>

                  {/* Legend details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-550 to-pink-500 dark:from-[#99cc00] dark:to-[#e5ff00] shadow-sm shadow-violet-500/40 dark:shadow-[#e5ff00]/40 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400  tracking-wider block">
                          Incomplete
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {incompleteTasks} Tasks
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500/80 dark:to-emerald-500 shadow-sm shrink-0 border border-emerald-100 dark:border-white/10" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400  tracking-wider block">
                          Completed
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {completedTasks} Tasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550  tracking-wider pt-4 flex items-center justify-between">
                  <span>1 Filter Active</span>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-blue-600 dark:text-[#e5ff00] hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OFFCANVAS TASK DETAILS DRAWER */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-[#111111]/70 backdrop-blur-sm"
            />

            {/* Side Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#111111] h-full shadow-2xl flex flex-col z-10 border-l border-slate-100 dark:border-white/5"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-[#e5ff00]/10 border border-blue-100 dark:border-[#e5ff00]/20 flex items-center justify-center text-blue-600 dark:text-[#e5ff00] shadow-sm shrink-0">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100  tracking-wider">
                      Task Workspace Preview
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold  tracking-wider mt-0.5">
                      Real-time Editing & Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title Section (Autosaves on blur/enter) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400  tracking-wider">
                    Task Title
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-[#0a0a0a]/50 border border-slate-150 dark:border-white/10 rounded-xl focus-within:bg-white dark:focus-within:bg-[#111111] focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-[#e5ff00] transition-all">
                    <TaskTitleInput
                      task={selectedTask}
                      canToggle={
                        isAdminOrManager ||
                        selectedTask.assignedTo?._id === currentUser?._id ||
                        selectedTask.assignedTo === currentUser?._id ||
                        selectedTask.createdBy?._id === currentUser?._id ||
                        selectedTask.createdBy === currentUser?._id
                      }
                      handleTaskFieldChange={handleTaskFieldChange}
                      isCompleted={selectedTask.status === "Completed"}
                    />
                  </div>
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-[#0a0a0a]/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiTag size={12} /> Status
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.status || "Pending"}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            status: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      >
                        <option
                          value="Pending"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          Pending
                        </option>
                        <option
                          value="In Progress"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          In Progress
                        </option>
                        <option
                          value="Completed"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          Completed
                        </option>
                        <option
                          value="On Hold"
                          className="dark:bg-slate-950 dark:text-slate-200"
                        >
                          On Hold
                        </option>
                      </select>
                    ) : (
                      <div
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold w-fit  tracking-wider ${getStatusBadge(
                          selectedTask.status,
                        )}`}
                      >
                        {selectedTask.status || "Pending"}
                      </div>
                    )}
                  </div>

                  {/* Assignee Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiUser size={12} /> Assignee
                    </label>
                    <AssigneeDropdown
                      selectedUser={selectedTask.assignedTo}
                      users={users}
                      onChange={(userId) =>
                        handleTaskFieldChange(selectedTask._id, {
                          assignedTo: userId,
                        })
                      }
                      isAdminOrManager={isAdminOrManager}
                      getAvatarColor={getAvatarColor}
                      size="lg"
                    />
                  </div>

                  {/* Start Date Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> Start Date
                    </label>
                    {isAdminOrManager ? (
                      <input
                        type="date"
                        value={
                          selectedTask.startDate
                            ? new Date(selectedTask.startDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            startDate: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-955/30 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300">
                        <FiCalendar
                          className="text-blue-500 dark:text-blue-400"
                          size={13}
                        />
                        {selectedTask.startDate
                          ? new Date(
                              selectedTask.startDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* End Date (Due Date) Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiCalendar size={12} /> End Date
                    </label>
                    {isAdminOrManager ? (
                      <input
                        type="date"
                        value={
                          selectedTask.dueDate
                            ? new Date(selectedTask.dueDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        min={
                          selectedTask.startDate
                            ? new Date(selectedTask.startDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            dueDate: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-305">
                        <FiClock
                          className="text-rose-555 dark:text-rose-400"
                          size={13}
                        />
                        {selectedTask.dueDate
                          ? new Date(selectedTask.dueDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400  tracking-wider flex items-center gap-1.5">
                      <FiClock size={12} /> Priority
                    </label>
                    {isAdminOrManager ? (
                      <select
                        value={selectedTask.priority || "Medium"}
                        onChange={(e) =>
                          handleTaskFieldChange(selectedTask._id, {
                            priority: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00]"
                      >
                        <option
                          value="Low"
                          className="dark:bg-[#111] dark:text-slate-200"
                        >
                          Low
                        </option>
                        <option
                          value="Medium"
                          className="dark:bg-slate-955 dark:text-slate-200"
                        >
                          Medium
                        </option>
                        <option
                          value="High"
                          className="dark:bg-slate-955 dark:text-slate-200"
                        >
                          High
                        </option>
                      </select>
                    ) : (
                      <div
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold w-fit ${
                          selectedTask.priority === "High"
                            ? "bg-rose-550/10 text-rose-700 border-rose-200/50"
                            : selectedTask.priority === "Medium"
                              ? "bg-amber-550/10 text-amber-700 border-amber-200/50"
                              : "bg-slate-50 text-slate-605 border-slate-200"
                        }`}
                      >
                        {selectedTask.priority || "Medium"}
                      </div>
                    )}
                  </div>
                </div>
                {/* ── Asana-style Subtask Workspace ── */}
                <div
                  id="drawer-subtasks-section"
                  className="pt-4 border-t border-slate-100 dark:border-white/5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Subtasks
                      </h3>
                      <span className="px-2 py-2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        {
                          (selectedTask.subtasks || []).filter(
                            (s) => s.status === "Completed",
                          ).length
                        }
                        /{selectedTask.subtasks?.length || 0}
                      </span>
                      {isAdminOrManager && (
                        <button
                          onClick={async () => {
                            const updatedSubtasks = [
                              ...(selectedTask.subtasks || []),
                            ];
                            const newSubtask = {
                              title: "",
                              status: "Pending",
                              assignedTo: null,
                              dueDate: null,
                              priority: "Medium",
                            };
                            updatedSubtasks.push(newSubtask);
                            setAutoFocusDrawerSubtaskIdx(
                              updatedSubtasks.length - 1,
                            );
                            try {
                              await updateTaskMutation({
                                id: selectedTask._id,
                                taskData: { subtasks: updatedSubtasks },
                              }).unwrap();
                            } catch (err) {
                              console.error("Failed to add subtask:", err);
                            }
                          }}
                          className="p-1 hover:bg-slate-150 dark:hover:bg-white/5 rounded text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-[#e5ff00] transition-colors cursor-pointer"
                          title="Add subtask"
                        >
                          <FiPlus size={16} />
                        </button>
                      )}
                    </div>
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-350 transition-colors">
                      <FiSliders size={14} />
                    </button>
                  </div>

                  {/* Subtask rows — Asana style */}
                  <div className="rounded-xl border border-slate-150 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0b0b0b] divide-y divide-slate-100/80 dark:divide-white/5 shadow-md shadow-slate-100 dark:shadow-none">
                    {/* Empty state */}
                    {(!selectedTask.subtasks ||
                      selectedTask.subtasks.length === 0) && (
                      <div className="flex flex-col items-center gap-2 py-8 text-slate-450 dark:text-slate-550">
                        <FiCornerDownRight size={22} strokeWidth={1.5} />
                        <span className="text-[11px] font-semibold">
                          No subtasks yet
                        </span>
                        <span className="text-[10px] opacity-70">
                          Add a subtask below to break this task down
                        </span>
                      </div>
                    )}

                    {/* Subtask rows */}
                    {(selectedTask.subtasks || []).map((sub, subIdx) => {
                      const isSubDone = sub.status === "Completed";
                      const canEdit =
                        isAdminOrManager ||
                        sub.assignedTo?._id === currentUser?._id ||
                        sub.assignedTo === currentUser?._id;
                      return (
                        <SubtaskRow
                          key={sub._id || subIdx}
                          sub={sub}
                          task={selectedTask}
                          users={users}
                          getAvatarColor={getAvatarColor}
                          handleSubtaskFieldChange={handleSubtaskFieldChange}
                          handleDeleteSubtask={handleDeleteSubtask}
                          isAdminOrManager={isAdminOrManager}
                          currentUser={currentUser}
                          subIdx={subIdx}
                          handleSubtaskEnterKey={handleSubtaskEnterKey}
                          shouldAutoFocus={autoFocusDrawerSubtaskIdx === subIdx}
                          onAutoFocused={() =>
                            setAutoFocusDrawerSubtaskIdx(null)
                          }
                        />
                      );
                    })}

                    {/* Add Subtask trigger button at bottom */}
                    {isAdminOrManager && (
                      <button
                        onClick={async () => {
                          const updatedSubtasks = [
                            ...(selectedTask.subtasks || []),
                          ];
                          const newSubtask = {
                            title: "",
                            status: "Pending",
                            assignedTo: null,
                            dueDate: null,
                            priority: "Medium",
                          };
                          updatedSubtasks.push(newSubtask);
                          setAutoFocusDrawerSubtaskIdx(
                            updatedSubtasks.length - 1,
                          );
                          try {
                            await updateTaskMutation({
                              id: selectedTask._id,
                              taskData: { subtasks: updatedSubtasks },
                            }).unwrap();
                          } catch (err) {
                            console.error("Failed to add subtask:", err);
                          }
                        }}
                        className="w-full text-left px-3.5 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-[#e5ff00] hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all flex items-center gap-1.5 cursor-pointer border-t border-slate-100 dark:border-white/5"
                      >
                        <FiPlus size={12} />
                        Add subtask
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments & Attachments */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-bold text-slate-500  tracking-wider">
                    Discussion & Attachments
                  </h3>

                  {/* Attachments List */}
                  {selectedTask.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTask.attachments.map((att) => (
                        <a
                          key={att._id || att.url}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-55 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-blue-600 dark:text-[#e5ff00] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <FiFile size={12} /> {att.filename}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                    {selectedTask.comments?.map((comment, idx) => (
                      <div key={idx} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-[#e5ff00]/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-700 dark:text-[#e5ff00]">
                          {comment.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {comment.user?.name || "Unknown User"}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-655 dark:text-slate-400 bg-slate-50 dark:bg-[#111] p-2 rounded-lg rounded-tl-none border border-slate-100 dark:border-white/5">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedTask.comments?.length === 0 && (
                      <div className="text-[10px] text-slate-400 italic">
                        No comments yet.
                      </div>
                    )}
                  </div>

                  {/* Add Comment / File Input */}
                  {(() => {
                    const isAssignee =
                      selectedTask.assignedTo?._id === currentUser?._id ||
                      selectedTask.assignedTo === currentUser?._id;
                    const isCreator =
                      selectedTask.createdBy?._id === currentUser?._id ||
                      selectedTask.createdBy === currentUser?._id;
                    const canInteract =
                      isAdminOrManager || isAssignee || isCreator;

                    return (
                      canInteract && (
                        <div className="flex items-end gap-2 mt-2">
                          <div className="flex-1 relative">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#e5ff00] resize-none min-h-[40px]"
                              rows={1}
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="file"
                              id="task-attachment"
                              className="hidden"
                              onChange={handleUploadAttachment}
                              disabled={isUploading}
                            />
                            <label
                              htmlFor="task-attachment"
                              className={`p-2 text-slate-400 hover:text-blue-600 dark:hover:text-[#e5ff00] cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors ${isUploading ? "opacity-55 cursor-not-allowed" : ""}`}
                            >
                              <FiPaperclip size={14} />
                            </label>
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim() || isUploading}
                              className="p-2 bg-blue-600 dark:bg-[#e5ff00] text-white dark:text-black rounded-lg disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-[#ccff00] transition-colors"
                            >
                              <FiSend size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectTaskBoard;
