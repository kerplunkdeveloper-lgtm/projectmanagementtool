import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  FiEye,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import toast from "react-hot-toast";
import { getTaskCreatedDateKey, WORK_TYPES, getWorkTypeMeta } from "../utils/workloadUtils";

// ==========================================
// MEMOIZED INDIVIDUAL TASK ROW (60 FPS AUTOSAVE)
// ==========================================
const WorkloadTaskRow = React.memo(({
  task: t,
  rowIndex,
  isAdmin,
  assigneeList,
  priorityOptions,
  isRowUpdating,
  isRowJustSaved,
  getUserAvatarUrl,
  onAssigneeChange,
  onWorkTypeChange,
  onPriorityChange,
  onAutoSaveTitle,
  onViewTask,
}) => {
  const [localTitle, setLocalTitle] = useState(t.title || "");

  useEffect(() => {
    setLocalTitle(t.title || "");
  }, [t.title]);

  const clientObj = t._client;
  const smmObj = t._smm;
  const assigneeObj = t._assignee;
  const currentPriority = t.priority || "Medium";
  const priorityMeta =
    priorityOptions.find((p) => p.id === currentPriority) || priorityOptions[2];

  const statusColor = (t.status || "").toLowerCase().includes("progress")
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60"
    : (t.status || "").toLowerCase().includes("hold") || (t.status || "").toLowerCase().includes("pause")
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60"
      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  const handleBlurOrEnter = () => {
    if (localTitle.trim() && localTitle.trim() !== (t.title || "").trim()) {
      onAutoSaveTitle(t._id, localTitle.trim(), t.title);
    }
  };

  const smmAvatarUrl = typeof getUserAvatarUrl === "function" ? getUserAvatarUrl(smmObj) : null;
  const assigneeAvatarUrl = typeof getUserAvatarUrl === "function" ? getUserAvatarUrl(assigneeObj) : null;

  return (
    <tr
      className={`hover:bg-slate-50/80 dark:hover:bg-[#151c2e]/70 transition-colors ${isRowUpdating ? "opacity-60 pointer-events-none" : ""
        }`}
    >
      {/* 1. # Index */}
      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400 dark:text-slate-500">
        {rowIndex}
      </td>

      {/* 2. Created By / SMM */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0 w-7 h-7">
            {smmAvatarUrl ? (
              <img
                src={smmAvatarUrl}
                alt={smmObj?.name || "User"}
                className="w-7 h-7 rounded-full object-cover border border-purple-200 dark:border-purple-800/80 shadow-2xs"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="avatar-fallback w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-extrabold text-[11px] items-center justify-center uppercase shadow-2xs"
              style={{ display: smmAvatarUrl ? "none" : "flex" }}
            >
              {smmObj?.name ? smmObj.name.substring(0, 2) : "U"}
            </div>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[145px] block">
              {smmObj?.name || "—"}
            </span>
            {t._formattedCreatedDate && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                {t._formattedCreatedDate}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 3. Assignee */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0 w-7 h-7">
            {assigneeAvatarUrl ? (
              <img
                src={assigneeAvatarUrl}
                alt={assigneeObj?.name || "Assignee"}
                className="w-7 h-7 rounded-full object-cover border border-indigo-200 dark:border-indigo-800/80 shadow-2xs"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="avatar-fallback w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-extrabold text-[11px] items-center justify-center uppercase shadow-2xs"
              style={{ display: assigneeAvatarUrl ? "none" : "flex" }}
            >
              {assigneeObj?.name ? assigneeObj.name.substring(0, 2) : "U"}
            </div>
          </div>
          {isAdmin ? (
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[145px]">
              {assigneeObj?.name || "Unassigned"}
            </span>
          ) : (
            <select
              value={assigneeObj?._id || ""}
              onChange={(e) => onAssigneeChange(t, e.target.value)}
              className="w-full max-w-[140px] py-1 px-2 text-xs font-bold bg-slate-50 dark:bg-[#1a2234] text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate shadow-xs"
              title="Change Assignee (Autosaves)"
            >
              {assigneeList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </td>

      {/* 4. Client */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor:
                clientObj?.color ||
                t.clientColor ||
                (clientObj ? "#6366f1" : "transparent"),
            }}
          />
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">
            {clientObj?.companyName ||
              clientObj?.name ||
              t.clientName ||
              (typeof t.client === "string" ? t.client : "—")}
          </span>
        </div>
      </td>

      {/* 5. Work Type */}
      <td className="py-3 px-4">
        {(() => {
          const workTypeMeta = getWorkTypeMeta(t.workType);
          return isAdmin ? (
            workTypeMeta ? (
              <span
                className={`inline-flex items-center gap-1.5 py-1 px-2.5 text-[11px] font-bold rounded-lg border shadow-xs ${workTypeMeta.badgeClass}`}
                title={`Work Type: ${workTypeMeta.label} | Avg Time: ${workTypeMeta.avgTime} | Daily Output: ${workTypeMeta.realisticOutput}`}
              >
                <span>{workTypeMeta.icon}</span>
                <span className="truncate max-w-[130px]">{workTypeMeta.label}</span>
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-xs italic">—</span>
            )
          ) : (
            <select
              value={t.workType || ""}
              onChange={(e) => onWorkTypeChange(t, e.target.value)}
              className={`w-full max-w-[170px] py-1 px-2 text-xs font-bold rounded-lg border cursor-pointer truncate shadow-xs transition-all ${
                workTypeMeta
                  ? workTypeMeta.badgeClass
                  : "bg-slate-50 dark:bg-[#1a2234] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/80"
              }`}
              title={`Work Type (Autosaves) - ${workTypeMeta ? `${workTypeMeta.avgTime} • ${workTypeMeta.realisticOutput}` : "Click to set Work Type"}`}
            >
              <option value="">Select Work Type</option>
              <optgroup label="🎨 Graphic Design (Posters)">
                <option value="Simple static poster">🖼️ Simple static poster (30m • 10 posters/day)</option>
                <option value="Standard branded poster">🎨 Standard branded poster (45m • 8 posters/day)</option>
                <option value="Creative / campaign poster">✨ Creative / campaign poster (1.5h • 4 posters/day)</option>
              </optgroup>
              <optgroup label="🎬 Cinematography (Reels)">
                <option value="Simple reel edit">✂️ Simple reel edit (1h • 5 reels/day)</option>
                <option value="Standard reel edit">🎬 Standard reel edit (2h • 3 reels/day)</option>
                <option value="Heavy reel / motion graphics">🔥 Heavy reel / motion graphics (3h • 2 reels/day)</option>
              </optgroup>
            </select>
          );
        })()}
      </td>

      {/* 6. Task Name */}
      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[260px]">
              {t.title}
            </span>
            {t.subtasks && t.subtasks.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                {t.subtasks.length} sub
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="w-full px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-slate-100/90 dark:hover:bg-[#1a2234] focus:bg-white dark:focus:bg-[#0f172a] rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all truncate shadow-2xs"
              title="Click to edit task title (autosaves on Enter or blur)"
            />
            {t.subtasks && t.subtasks.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                {t.subtasks.length} sub
              </span>
            )}
          </div>
        )}
      </td>

      {/* 6. Priority */}
      <td className="py-3 px-4">
        {isAdmin ? (
          <span
            className={`inline-flex items-center gap-1 py-1 px-2.5 text-[11px] font-black rounded-lg border shadow-xs ${priorityMeta.badgeClass}`}
          >
            <span>{priorityMeta.icon}</span>
            <span>{priorityMeta.label}</span>
          </span>
        ) : (
          <select
            value={currentPriority}
            onChange={(e) => onPriorityChange(t, e.target.value)}
            className={`py-1 px-2.5 text-[11px] font-black rounded-lg border cursor-pointer shadow-xs transition-all ${priorityMeta.badgeClass}`}
            title="Change Priority (Autosaves)"
          >
            <option value="Top High">🔥 Top High</option>
            <option value="High">⚡ High</option>
            <option value="Medium">🔷 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        )}
      </td>

      {/* 7. Status Badge */}
      <td className="py-3 px-4">
        {isRowJustSaved ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
            <FiCheck size={12} />
            Saved
          </span>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusColor}`}>
            {t.status || "Not Started"}
          </span>
        )}
      </td>

      {/* 8. Action Preview Button */}
      <td className="py-3 px-3.5 text-center">
        <button
          type="button"
          onClick={() => onViewTask(t)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          title={isAdmin ? "Read Task Details (Modal)" : "View Task Details Modal"}
        >
          <FiEye size={15} />
        </button>
      </td>
    </tr>
  );
});

// ==========================================
// WORKLOAD TASK INLINE ENTRY & ALLOCATION TABLE
// ==========================================
const WorkloadTaskTable = ({
  tasks = [],
  users = [],
  clients = [],
  selectedDepartment = "Graphic Designer",
  currentUser,
  onViewTask,
  createTaskMutation,
  updateTaskMutation,
  refetchTasks,
}) => {
  // Active logged in user & Admin read-only detection
  const activeUser =
    currentUser ||
    (() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })();
  const activeUserId = (activeUser?._id || activeUser?.id)?.toString();
  const userRole = (activeUser?.role || "").toLowerCase().trim();
  const isAdmin =
    userRole === "admin" ||
    userRole === "operationmanager" ||
    userRole === "operation manager";

  // Inline New Task Entry State
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newWorkType, setNewWorkType] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [isSavingNew, setIsSavingNew] = useState(false);
  const newTitleInputRef = useRef(null);

  // Briefly track which row was just autosaved for visual checkmark: taskId
  const [savedRowId, setSavedRowId] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [showBenchmarkGuide, setShowBenchmarkGuide] = useState(false);

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterWorkType, setFilterWorkType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterSmm, setFilterSmm] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Priority definitions with distinct modern styling
  const PRIORITY_OPTIONS = useMemo(
    () => [
      {
        id: "Top High",
        label: "Top High",
        icon: "🔥",
        pillClass: "bg-rose-500 text-white font-extrabold shadow-xs shadow-rose-500/20",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60",
      },
      {
        id: "High",
        label: "High",
        icon: "⚡",
        pillClass: "bg-amber-500 text-white font-bold shadow-xs shadow-amber-500/20",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60",
      },
      {
        id: "Medium",
        label: "Medium",
        icon: "🔷",
        pillClass: "bg-sky-500 text-white font-bold shadow-xs shadow-sky-500/20",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60",
      },
      {
        id: "Low",
        label: "Low",
        icon: "🟢",
        pillClass: "bg-emerald-600 text-white font-medium shadow-xs shadow-emerald-500/20",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60",
      },
    ],
    []
  );

  // Map users by string ID for instant O(1) lookups
  const usersMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (u?._id) map.set(u._id.toString(), u);
    });
    return map;
  }, [users]);

  // Map clients by string ID
  const clientsMap = useMemo(() => {
    const map = new Map();
    (clients || []).forEach((c) => {
      if (c?._id) map.set(c._id.toString(), c);
    });
    return map;
  }, [clients]);

  // Map clients by company name lowercased for O(1) lookups
  const clientsByNameMap = useMemo(() => {
    const map = new Map();
    (clients || []).forEach((c) => {
      if (c?.companyName) {
        map.set(c.companyName.trim().toLowerCase(), c);
      }
    });
    return map;
  }, [clients]);

  // Social Media Managers list
  const smmList = useMemo(() => {
    const smms = (users || []).filter((u) => {
      if (u.employmentStatus === "relieved") return false;
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      const desig = (u.designation || "").toLowerCase().trim();
      return (
        dept.includes("social media") ||
        dept.includes("smm") ||
        role.includes("social media") ||
        role.includes("smm") ||
        role === "socialmediamanager" ||
        desig.includes("social media") ||
        desig.includes("smm")
      );
    });

    if (smms.length > 0) return smms;

    return (users || []).filter(
      (u) =>
        u.employmentStatus !== "relieved" &&
        (u.role === "admin" || u.role === "operationmanager")
    );
  }, [users]);

  // Assignee options list (Graphic Designers and Cinematographers)
  const assigneeList = useMemo(() => {
    const deptMembers = (users || []).filter((u) => {
      if (u.employmentStatus === "relieved") return false;
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      const isCinema =
        dept.includes("cinema") ||
        dept.includes("video") ||
        dept.includes("edit") ||
        dept.includes("shoot") ||
        dept.includes("camera") ||
        role.includes("cinema") ||
        role.includes("video") ||
        role.includes("cinematog");
      const isGD =
        dept.includes("graphic") ||
        dept.includes("design") ||
        dept === "designer" ||
        role.includes("designer") ||
        role === "graphic designer";
      return isCinema || isGD;
    });

    return deptMembers.length > 0
      ? deptMembers
      : (users || []).filter((u) => u.employmentStatus !== "relieved");
  }, [users]);

  // Helper to resolve task SMM / Creator
  const getTaskSmm = useCallback(
    (t) => {
      let creatorId = null;
      if (t.createdBy) {
        creatorId = (typeof t.createdBy === "object" ? t.createdBy?._id : t.createdBy)?.toString();
      }
      if (!creatorId) {
        const cObj = typeof t.client === "object" ? t.client : clientsMap.get(t.client?.toString());
        if (cObj?.assignedTo) {
          const list = Array.isArray(cObj.assignedTo) ? cObj.assignedTo : [cObj.assignedTo];
          const first = list.find(Boolean);
          if (first) {
            creatorId = (typeof first === "object" ? first._id : first)?.toString();
          }
        }
      }

      if (creatorId) {
        const fullCreator = usersMap.get(creatorId);
        if (fullCreator) {
          return typeof t.createdBy === "object" ? { ...t.createdBy, ...fullCreator } : fullCreator;
        }
      }

      if (typeof t.createdBy === "object" && t.createdBy?.name) {
        return t.createdBy;
      }
      return null;
    },
    [usersMap, clientsMap]
  );

  // Helper to resolve task Client
  const getTaskClient = useCallback(
    (t) => {
      if (t.client && typeof t.client === "object" && (t.client.companyName || t.client.name)) {
        return t.client;
      }
      if (t.project && typeof t.project === "object") {
        if (t.project.client && typeof t.project.client === "object" && (t.project.client.companyName || t.project.client.name)) {
          return t.project.client;
        }
        if (t.project.client) {
          const c = clientsMap.get(t.project.client.toString());
          if (c) return c;
        }
      }
      if (t.client) {
        const cId = typeof t.client === "object" ? t.client._id : t.client;
        const c = clientsMap.get(cId?.toString());
        if (c) return c;
      }
      if (t.subtasks && Array.isArray(t.subtasks)) {
        for (let i = 0; i < t.subtasks.length; i++) {
          const sub = t.subtasks[i];
          if (sub.client) {
            const subCId = typeof sub.client === "object" ? sub.client._id : sub.client;
            const c =
              typeof sub.client === "object" && (sub.client.companyName || sub.client.name)
                ? sub.client
                : clientsMap.get(subCId?.toString());
            if (c) return c;
          }
        }
      }
      if (t.clientName) {
        const found = clientsByNameMap.get(t.clientName.trim().toLowerCase());
        if (found) return found;
        return { companyName: t.clientName, color: t.clientColor || "#6366f1" };
      }
      return null;
    },
    [clientsMap, clientsByNameMap]
  );

  // Helper to resolve task Assignee
  const getTaskAssignee = useCallback(
    (t) => {
      if (!t.assignedTo) return null;
      const aId = (typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo)?.toString();
      if (aId) {
        const fullAssignee = usersMap.get(aId);
        if (fullAssignee) {
          return typeof t.assignedTo === "object" ? { ...t.assignedTo, ...fullAssignee } : fullAssignee;
        }
      }
      return typeof t.assignedTo === "object" ? t.assignedTo : null;
    },
    [usersMap]
  );

  // Helper to extract user profile image URL
  const getUserAvatarUrl = useCallback(
    (u) => {
      if (!u) return null;
      const uId = (typeof u === "object" ? u._id : u)?.toString();
      const fromMap = uId ? usersMap.get(uId) : null;
      const target = fromMap || u;

      const url =
        target?.profile?.profileImage?.url ||
        (typeof target?.profile?.profileImage === "string" ? target.profile.profileImage : null) ||
        target?.profileImage?.url ||
        (typeof target?.profileImage === "string" ? target.profileImage : null) ||
        target?.avatar?.url ||
        (typeof target?.avatar === "string" ? target.avatar : null) ||
        target?.profilePic ||
        u?.profile?.profileImage?.url ||
        (typeof u?.profile?.profileImage === "string" ? u.profile.profileImage : null) ||
        u?.profileImage?.url ||
        (typeof u?.profileImage === "string" ? u.profileImage : null) ||
        u?.avatar?.url ||
        (typeof u?.avatar === "string" ? u.avatar : null) ||
        u?.profilePic ||
        null;

      if (url && typeof url === "string" && url.trim().length > 0) {
        return url.trim();
      }
      return null;
    },
    [usersMap]
  );

  // Pre-process and enrich tasks ONCE when tasks or users change to eliminate lookups per cell/render
  const enrichedTasks = useMemo(() => {
    const list = tasks || [];
    return list.map((t) => {
      const clientObj = getTaskClient(t);
      const smmObj = getTaskSmm(t);
      const assigneeObj = getTaskAssignee(t);
      const createdDateKey = t.createdAt
        ? getTaskCreatedDateKey(t.createdAt)
        : (t.createdDate ? getTaskCreatedDateKey(t.createdDate) : (t.date ? getTaskCreatedDateKey(t.date) : ""));

      let formattedCreatedDate = "";
      if (t.createdAt) {
        try {
          formattedCreatedDate = format(new Date(t.createdAt), "dd MMM yyyy");
        } catch { }
      }

      return {
        ...t,
        _client: clientObj,
        _smm: smmObj,
        _assignee: assigneeObj,
        _createdDateKey: createdDateKey,
        _formattedCreatedDate: formattedCreatedDate,
      };
    });
  }, [tasks, getTaskClient, getTaskSmm, getTaskAssignee]);

  // ==========================================
  // AUTOSAVE HANDLERS
  // ==========================================

  // 1. AUTOSAVE INLINE NEW TASK (Disabled for Admin)
  const handleAutoSaveNewTask = async () => {
    if (isAdmin || !newTitle.trim() || isSavingNew) return;
    if (!newClient) {
      toast.error("Please select a client", { icon: "🏢" });
      return;
    }
    if (!newAssignee) {
      toast.error("Please select an assignee", { icon: "👤" });
      return;
    }
    try {
      setIsSavingNew(true);
      const titleToSave = newTitle.trim();
      // Determine department automatically based on chosen assignee
      const chosenUser = (users || []).find(
        (u) => (u._id?.toString() || u.id?.toString()) === newAssignee?.toString()
      );
      let taskDept = "Graphic Designer";
      if (chosenUser) {
        const d = (chosenUser.department || "").toLowerCase();
        const r = (chosenUser.role || "").toLowerCase();
        if (
          d.includes("cinema") ||
          d.includes("video") ||
          d.includes("edit") ||
          d.includes("shoot") ||
          r.includes("cinema") ||
          r.includes("video")
        ) {
          taskDept = "Cinematographer";
        }
      }

      await createTaskMutation({
        title: titleToSave,
        client: newClient,
        assignedTo: newAssignee,
        workType: newWorkType,
        priority: newPriority || "Medium",
        department: taskDept,
        createdBy: activeUser?._id,
        status: "Not Started",
      }).unwrap();

      toast.success(`Task "${titleToSave}" autosaved!`, { icon: "⚡" });
      setNewTitle("");
      setNewClient("");
      setNewAssignee("");
      setNewWorkType("");
      if (newTitleInputRef.current) newTitleInputRef.current.focus();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to autosave task");
    } finally {
      setIsSavingNew(false);
    }
  };

  // 2. AUTOSAVE EXISTING TASK TITLE (On Blur or Enter)
  const handleAutoSaveTaskTitle = useCallback(async (taskId, updatedTitle, originalTitle) => {
    if (isAdmin) return;
    if (
      !updatedTitle ||
      updatedTitle.trim() === (originalTitle || "").trim() ||
      !updatedTitle.trim()
    ) {
      return;
    }
    try {
      setUpdatingTaskId(taskId);
      await updateTaskMutation({
        id: taskId,
        taskData: { title: updatedTitle.trim() },
      }).unwrap();
      setSavedRowId(taskId);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success("Task title autosaved!", { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update title");
    } finally {
      setUpdatingTaskId(null);
    }
  }, [isAdmin, updateTaskMutation]);

  // 3. AUTOSAVE EXISTING TASK ASSIGNEE
  const handleAssigneeChange = useCallback(async (task, newAssigneeId) => {
    if (isAdmin) return;
    const currentId = typeof task.assignedTo === "object" ? task.assignedTo?._id : task.assignedTo;
    if (currentId?.toString() === newAssigneeId?.toString()) return;
    try {
      setUpdatingTaskId(task._id);
      await updateTaskMutation({
        id: task._id,
        taskData: { assignedTo: newAssigneeId },
      }).unwrap();
      const newU = usersMap.get(newAssigneeId);
      setSavedRowId(task._id);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success(`Assignee autosaved: ${newU?.name || "Member"}`, { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reassign task");
    } finally {
      setUpdatingTaskId(null);
    }
  }, [isAdmin, usersMap, updateTaskMutation]);

  // 4. AUTOSAVE EXISTING TASK WORK TYPE
  const handleWorkTypeChange = useCallback(async (task, newWorkTypeVal) => {
    if (isAdmin) return;
    if (task.workType === newWorkTypeVal) return;
    try {
      setUpdatingTaskId(task._id);
      await updateTaskMutation({
        id: task._id,
        taskData: { workType: newWorkTypeVal },
      }).unwrap();
      setSavedRowId(task._id);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success(`Work type autosaved: ${newWorkTypeVal || "None"}`, { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update work type");
    } finally {
      setUpdatingTaskId(null);
    }
  }, [isAdmin, updateTaskMutation]);

  // 5. AUTOSAVE EXISTING TASK PRIORITY
  const handlePriorityChange = useCallback(async (task, newPriorityVal) => {
    if (isAdmin) return;
    if (task.priority === newPriorityVal) return;
    try {
      setUpdatingTaskId(task._id);
      await updateTaskMutation({
        id: task._id,
        taskData: { priority: newPriorityVal },
      }).unwrap();
      setSavedRowId(task._id);
      setTimeout(() => setSavedRowId(null), 2000);
      toast.success(`Priority autosaved: ${newPriorityVal}`, { icon: "✓" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update priority");
    } finally {
      setUpdatingTaskId(null);
    }
  }, [isAdmin, updateTaskMutation]);

  // High-performance filter over pre-enriched tasks
  const filteredTasks = useMemo(() => {
    let list = enrichedTasks;

    // Non-Admin: strictly show ONLY tasks created by this user
    if (!isAdmin && activeUserId) {
      list = list.filter((t) => {
        const creatorId =
          typeof t.createdBy === "object"
            ? t.createdBy?._id?.toString()
            : t.createdBy?.toString();
        const smmId = t._smm?._id?.toString();
        const isNameMatch =
          t._smm?.name &&
          activeUser?.name &&
          t._smm.name.trim().toLowerCase() === activeUser.name.trim().toLowerCase();

        return (
          (creatorId && creatorId === activeUserId) ||
          (smmId && smmId === activeUserId) ||
          Boolean(isNameMatch)
        );
      });
    }

    // Filter by active department tab
    const isCinema = selectedDepartment === "Cinematographer";
    list = list.filter((t) => {
      const u = t._assignee;
      if (!u) {
        if (t.department) {
          return isCinema
            ? t.department.toLowerCase().includes("cinema")
            : (t.department.toLowerCase().includes("graphic") || t.department.toLowerCase().includes("design"));
        }
        return false;
      }
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      if (isCinema) {
        return (
          dept.includes("cinema") ||
          dept.includes("video") ||
          dept.includes("edit") ||
          dept.includes("shoot") ||
          dept.includes("camera") ||
          role.includes("cinema") ||
          role.includes("video") ||
          role.includes("cinematog")
        );
      }
      return (
        dept.includes("graphic") ||
        dept.includes("design") ||
        dept === "designer" ||
        role.includes("designer") ||
        role === "graphic designer"
      );
    });

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const title = (t.title || "").toLowerCase();
        const clientName = (t._client?.companyName || "").toLowerCase();
        return title.includes(q) || clientName.includes(q);
      });
    }

    // Filter by Client Dropdown
    if (filterClient !== "all") {
      list = list.filter((t) => {
        const cId = typeof t.client === "object" ? t.client?._id : t.client;
        return cId?.toString() === filterClient;
      });
    }

    // Filter by Work Type
    if (filterWorkType !== "all") {
      list = list.filter((t) => (t.workType || "").toLowerCase() === filterWorkType.toLowerCase());
    }

    // Filter by Priority
    if (filterPriority !== "all") {
      list = list.filter((t) => (t.priority || "Medium") === filterPriority);
    }

    // Filter by Assignee
    if (filterAssignee !== "all") {
      list = list.filter((t) => {
        const aId = typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
        return aId?.toString() === filterAssignee;
      });
    }

    // Filter by SMM (Applicable for Admin)
    if (isAdmin && filterSmm !== "all") {
      list = list.filter((t) => t._smm?._id?.toString() === filterSmm);
    }

    return list;
  }, [
    enrichedTasks,
    isAdmin,
    activeUserId,
    activeUser?.name,
    selectedDepartment,
    searchQuery,
    filterClient,
    filterWorkType,
    filterPriority,
    filterAssignee,
    filterSmm,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  return (
    <div className="overflow-hidden mt-20 space-y-4 transition-colors">
      {/* Table Section Header with Autosave Status / Admin Read-Only Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50 shadow-xs">
            <FiLayers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Workload Task Entry & Allocation
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                  <FiEye size={12} />
                  Read-Only Mode ({userRole === "admin" ? "Admin" : "Operation Manager"})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Autosave Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? `${userRole === "admin" ? "Admin" : "Operation Manager"} monitoring mode: View all tasks, clients, creators, assignees, and progress.`
                : `Showing only tasks created by you (${activeUser?.name || "You"}). Enter new tasks in the first row or edit cells to autosave.`}
            </p>
          </div>
        </div>

        {/* Quick helper tip & Benchmark Guide toggle */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowBenchmarkGuide((prev) => !prev)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showBenchmarkGuide
                ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                : "bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
            }`}
            title="Toggle Work Type Benchmark & Daily Output Reference Table"
          >
            <FiInfo size={13} className={showBenchmarkGuide ? "text-white" : "text-indigo-500"} />
            <span>{showBenchmarkGuide ? "Hide Work Type Guide" : "Workload Guide (Reference Table)"}</span>
          </button>

          {isAdmin ? (
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <FiEye size={13} className="text-indigo-500" />
              <span>Click <b>Action 👁️</b> to read full task details</span>
            </div>
          ) : (
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1.5">
              <LuSparkles size={13} />
              <span>Press <b>Enter ↵</b> in Task Name to autosave instantly</span>
            </div>
          )}
        </div>
      </div>

      {/* BENCHMARK REFERENCE CARD (MODAL / INLINE ACCORDION) */}
      {showBenchmarkGuide && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-purple-50/80 dark:from-[#131b2e] dark:via-[#111728] dark:to-[#17142b] border border-indigo-200/90 dark:border-indigo-800/80 shadow-md space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-indigo-200/70 dark:border-indigo-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white text-xs">📊</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  Standard Workload Benchmark & Realistic Daily Output Guidelines
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Calculated based on standard 8-hour workday capacity per designer / editor.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBenchmarkGuide(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <FiX size={15} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-indigo-200/60 dark:border-indigo-800/60 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-3">Work Type</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Average Time per Item</th>
                  <th className="py-2 px-3">Realistic Output / Designer / Day</th>
                  <th className="py-2 px-3 text-center">Workload Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100 dark:divide-slate-800/80 font-medium">
                {WORK_TYPES.map((wt) => (
                  <tr key={wt.id} className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{wt.icon}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{wt.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {wt.department}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {wt.avgTime}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-black text-indigo-700 dark:text-indigo-300">
                        {wt.realisticOutput}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${wt.badgeClass}`}>
                        {wt.weightSlots} {wt.weightSlots === 1 ? "slot" : "slots"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FILTER TOOLBAR FOR THE TABLE */}
      <div className="bg-slate-50 dark:bg-[#151923] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        {/* ROW 1: Search & Date & Actions Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Left: Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search task name or client..."
              className="w-full h-9 pl-9 pr-8 text-xs bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Right: Reset Filters */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Reset Filters */}
            {(searchQuery || filterClient !== "all" || filterWorkType !== "all" || filterPriority !== "all" || filterAssignee !== "all" || filterSmm !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterClient("all");
                  setFilterWorkType("all");
                  setFilterPriority("all");
                  setFilterAssignee("all");
                  setFilterSmm("all");
                  setCurrentPage(1);
                }}
                className="h-9 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0"
                title="Reset all filters to default"
              >
                <FiX size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Balanced Dropdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Client Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterClient}
              onChange={(e) => {
                setFilterClient(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Client"
            >
              <option value="all">🏢 All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterAssignee}
              onChange={(e) => {
                setFilterAssignee(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Assignee"
            >
              <option value="all">👥 All Assignees</option>
              {assigneeList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work Type Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterWorkType}
              onChange={(e) => {
                setFilterWorkType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Work Type"
            >
              <option value="all">⚡ All Work Types</option>
              <optgroup label="🎨 Graphic Design (Posters)">
                <option value="Simple static poster">🖼️ Simple static poster</option>
                <option value="Standard branded poster">🎨 Standard branded poster</option>
                <option value="Creative / campaign poster">✨ Creative / campaign poster</option>
              </optgroup>
              <optgroup label="🎬 Cinematography (Reels)">
                <option value="Simple reel edit">✂️ Simple reel edit</option>
                <option value="Standard reel edit">🎬 Standard reel edit</option>
                <option value="Heavy reel / motion graphics">🔥 Heavy reel / motion graphics</option>
              </optgroup>
            </select>
          </div>

          {/* Priority Filter Dropdown */}
          <div className="w-full">
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
              title="Filter by Priority"
            >
              <option value="all">🎯 All Priorities</option>
              <option value="Top High">🔥 Top High</option>
              <option value="High">⚡ High</option>
              <option value="Medium">🔷 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          {/* SMM / Creator Filter Dropdown */}
          <div className="w-full">
            {isAdmin ? (
              <select
                value={filterSmm}
                onChange={(e) => {
                  setFilterSmm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs truncate"
                title="Filter by Creator / SMM"
              >
                <option value="all">👤 All Creators / SMMs</option>
                {smmList.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="w-full h-9 flex items-center justify-center gap-1.5 px-3 text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-xs truncate"
                title="Showing only tasks created by you"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">Creator: {activeUser?.name || "You"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-[#131826] text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
              <th className="py-3 px-3.5 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[170px]">Created By</th>
              <th className="py-3 px-4 min-w-[170px]">Assignee</th>
              <th className="py-3 px-4 min-w-[160px]">Client</th>
              <th className="py-3 px-4 min-w-[190px]">Work Type</th>
              <th className="py-3 px-4 min-w-[240px]">Task Name</th>
              <th className="py-3 px-4 min-w-[130px]">Priority</th>
              <th className="py-3 px-4 min-w-[120px]">Status</th>
              <th className="py-3 px-3.5 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
            {/* INLINE NEW TASK ENTRY ROW (Only for non-Admin creators) */}
            {!isAdmin && (
              <tr className="bg-indigo-50/70 dark:bg-[#161d2e] border-b-2 border-indigo-200 dark:border-indigo-800/80 transition-colors">
                <td className="py-2.5 px-3.5 text-center">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs shadow-xs"
                    title="New Task Entry"
                  >
                    +
                  </span>
                </td>

                <td className="py-2.5 px-4">
                  {(() => {
                    const avatarUrl = getUserAvatarUrl(activeUser);
                    return (
                      <div
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-xs max-w-[170px]"
                        title={`Task will be entered by: ${activeUser?.name || "You"}`}
                      >
                        <div className="relative shrink-0 w-6 h-6">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={activeUser?.name || "You"}
                              className="w-6 h-6 rounded-full object-cover border border-purple-300 dark:border-purple-700 shadow-2xs"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-[10px] items-center justify-center shadow-2xs"
                            style={{ display: avatarUrl ? "none" : "flex" }}
                          >
                            {(activeUser?.name || "U")[0].toUpperCase()}
                          </div>
                        </div>
                        <span className="font-bold text-xs text-purple-700 dark:text-purple-300 truncate">
                          {activeUser?.name || "You"}
                        </span>
                        <span className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 shrink-0">
                          (You)
                        </span>
                      </div>
                    );
                  })()}
                </td>

                <td className="py-2.5 px-4">
                  {(() => {
                    const currentSelectedUser = newAssignee
                      ? assigneeList.find((u) => u._id?.toString() === newAssignee?.toString())
                      : null;
                    const avatarUrl = getUserAvatarUrl(currentSelectedUser);
                    return (
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0 w-6 h-6">
                          {currentSelectedUser ? (
                            <>
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={currentSelectedUser?.name || "Assignee"}
                                  className="w-6 h-6 rounded-full object-cover border border-indigo-300 dark:border-indigo-700 shadow-2xs"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                    if (fallback) fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="avatar-fallback w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black text-[10px] items-center justify-center uppercase shadow-2xs"
                                style={{ display: avatarUrl ? "none" : "flex" }}
                              >
                                {currentSelectedUser?.name ? currentSelectedUser.name.substring(0, 2) : "U"}
                              </div>
                            </>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 shadow-2xs">
                              👤
                            </div>
                          )}
                        </div>
                        <select
                          value={newAssignee}
                          onChange={(e) => setNewAssignee(e.target.value)}
                          className={`w-full max-w-[145px] py-1.5 px-2 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-xs truncate transition-all ${newAssignee
                              ? "bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 border-indigo-200 dark:border-indigo-800/80"
                              : "bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                            }`}
                          title="Select Assignee"
                        >
                          <option value="">Select Assignee</option>
                          {assigneeList.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </td>

                <td className="py-2.5 px-4">
                  <select
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className={`w-full max-w-[155px] py-1.5 px-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-xs truncate transition-all ${newClient
                        ? "bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 border-indigo-200 dark:border-indigo-800/80"
                        : "bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                      }`}
                    title="Select Client"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="py-2.5 px-4">
                  <select
                    value={newWorkType}
                    onChange={(e) => setNewWorkType(e.target.value)}
                    className={`w-full max-w-[185px] py-1.5 px-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-xs truncate transition-all ${
                      newWorkType
                        ? "bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 border-indigo-200 dark:border-indigo-800/80 font-bold"
                        : "bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}
                    title="Select Work Type (Workload benchmark)"
                  >
                    <option value="">Select Work Type</option>
                    <optgroup label="🎨 Graphic Design (Posters)">
                      <option value="Simple static poster">🖼️ Simple static poster (30m • 10 posters/day)</option>
                      <option value="Standard branded poster">🎨 Standard branded poster (45m • 8 posters/day)</option>
                      <option value="Creative / campaign poster">✨ Creative / campaign poster (1.5h • 4 posters/day)</option>
                    </optgroup>
                    <optgroup label="🎬 Cinematography (Reels)">
                      <option value="Simple reel edit">✂️ Simple reel edit (1h • 5 reels/day)</option>
                      <option value="Standard reel edit">🎬 Standard reel edit (2h • 3 reels/day)</option>
                      <option value="Heavy reel / motion graphics">🔥 Heavy reel / motion graphics (3h • 2 reels/day)</option>
                    </optgroup>
                  </select>
                </td>

                <td className="py-2.5 px-4">
                  <div className="relative flex items-center">
                    <input
                      ref={newTitleInputRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAutoSaveNewTask();
                        }
                      }}
                      onBlur={() => {
                        if (newTitle.trim()) handleAutoSaveNewTask();
                      }}
                      placeholder="+ Type new task name & press Enter to autosave..."
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-xl border border-indigo-300 dark:border-indigo-700/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600 placeholder:text-indigo-400/80 dark:placeholder:text-indigo-400/50 shadow-xs transition-all"
                    />
                    {isSavingNew && (
                      <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                        <FiRefreshCw size={11} className="animate-spin" />
                        <span>Saving...</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-2.5 px-4">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="py-1.5 px-2.5 text-xs font-black rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 cursor-pointer shadow-xs"
                    title="Select Priority"
                  >
                    <option value="Top High">🔥 Top High</option>
                    <option value="High">⚡ High</option>
                    <option value="Medium">🔷 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </td>

                <td className="py-2.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                    ⚡ Auto-save
                  </span>
                </td>

                <td className="py-2.5 px-3.5 text-center">
                  <button
                    type="button"
                    onClick={handleAutoSaveNewTask}
                    disabled={!newTitle.trim() || isSavingNew}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] disabled:opacity-30 cursor-pointer transition-all shadow-xs"
                    title="Save new task (or press Enter)"
                  >
                    <FiCheck size={12} />
                    <span>Save</span>
                  </button>
                </td>
              </tr>
            )}

            {/* EXISTING TASKS */}
            {paginatedTasks.map((t, idx) => {
              const rowIndex = (currentPage - 1) * itemsPerPage + idx + 1;
              return (
                <WorkloadTaskRow
                  key={t._id}
                  task={t}
                  rowIndex={rowIndex}
                  isAdmin={isAdmin}
                  assigneeList={assigneeList}
                  priorityOptions={PRIORITY_OPTIONS}
                  isRowUpdating={updatingTaskId === t._id}
                  isRowJustSaved={savedRowId === t._id}
                  getUserAvatarUrl={getUserAvatarUrl}
                  onAssigneeChange={handleAssigneeChange}
                  onWorkTypeChange={handleWorkTypeChange}
                  onPriorityChange={handlePriorityChange}
                  onAutoSaveTitle={handleAutoSaveTaskTitle}
                  onViewTask={onViewTask}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <b className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</b> to{" "}
            <b className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
            </b>{" "}
            of <b className="text-slate-800 dark:text-slate-200">{filteredTasks.length}</b> tasks
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pg
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadTaskTable;
