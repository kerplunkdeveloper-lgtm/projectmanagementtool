import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";
import { useSocketContext } from "../../context/SocketContext";
import { FiRefreshCw, FiUsers } from "react-icons/fi";

import { getUsers } from "../../features/users/userSlice";
import { getClients } from "../../features/clients/clientslice";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../features/api/apiSlice";

import {
  getDayWorkContext,
  calculateTaskProductivityForDate,
  formatTaskAssignedDate,
  getTaskCreatorInfo,
  getTaskSlotWeight,
} from "./utils/workloadUtils";

import WorkloadToolbar from "./components/WorkloadToolbar.jsx";
import WorkloadGridView from "./components/WorkloadGridView.jsx";
import WorkloadTableView from "./components/WorkloadTableView.jsx";
import WorkloadSkeleton from "./components/WorkloadSkeleton.jsx";
import TaskPreviewModal from "./components/TaskPreviewModal.jsx";
import WorkloadTaskTable from "./components/WorkloadTaskTable.jsx";

// ── Helper: classify a user into dept groups ─────────────────────────────────
const getUserDeptGroup = (u) => {
  const dept = (u.department || "").toLowerCase().trim();
  const role = (u.role || "").toLowerCase().trim();
  const isGD =
    dept.includes("graphic") ||
    dept.includes("design") ||
    dept === "designer" ||
    role.includes("designer") ||
    role === "graphic designer";
  const isCinema =
    dept.includes("cinema") ||
    dept.includes("video") ||
    dept.includes("edit") ||
    dept.includes("shoot") ||
    dept.includes("camera") ||
    role.includes("cinema") ||
    role.includes("video") ||
    role.includes("cinematog");
  return { isGD, isCinema };
};

// ── Build workload stats for a single user ────────────────────────────────────
const buildUserWorkload = (u, tasksByUserMap, dayWorkCtx, usersMap, nowMs) => {
  const userIdStr = u._id?.toString();
  const assignedTasks = tasksByUserMap.get(userIdStr) || [];

  let workedMs = 0;
  const productivityMap = new Map();
  for (let i = 0; i < assignedTasks.length; i++) {
    const t = assignedTasks[i];
    const prod = calculateTaskProductivityForDate(t, dayWorkCtx, nowMs);
    workedMs += prod;
    if (t._id) productivityMap.set(t._id.toString(), prod);
  }

  const activeTasks = [];
  const onHoldTasks = [];
  const pendingTasks = [];
  const displayTasks = [];

  for (let i = 0; i < assignedTasks.length; i++) {
    const t = assignedTasks[i];
    const status = t.status || "";
    const sLower = status.toLowerCase().trim();

    if (status === "In Progress" && !t.autoPaused) activeTasks.push(t);
    else if (status === "On Hold" || (status === "In Progress" && t.autoPaused)) onHoldTasks.push(t);
    else if (status === "Not Started" || status === "To Do" || status === "Pending") pendingTasks.push(t);

    if (
      !sLower.includes("complete") &&
      !sLower.includes("done") &&
      !sLower.includes("review") &&
      !sLower.includes("reject") &&
      !sLower.includes("correct") &&
      (
        sLower.includes("progress") ||
        sLower.includes("hold") ||
        sLower.includes("pause") ||
        sLower.includes("not started") ||
        sLower.includes("to do") ||
        sLower.includes("todo") ||
        sLower.includes("pending")
      )
    ) displayTasks.push(t);
  }

  const sortedDisplayTasks = displayTasks
    .map((task) => ({
      ...task,
      workedTodayMs: productivityMap.get(task._id?.toString()) || 0,
      assignedDateFormatted: formatTaskAssignedDate(task),
      creatorInfo: getTaskCreatorInfo(task, usersMap),
    }))
    .sort((a, b) => {
      const w = (s) => {
        const sl = (s || "").toLowerCase();
        if (sl.includes("progress")) return 1;
        if (sl.includes("hold") || sl.includes("pause")) return 2;
        return 3;
      };
      return w(a.status) - w(b.status);
    });

  const maxCapacityTasks = 8;
  const totalActiveTasksCount = displayTasks.length;
  let totalWorkloadSlots = 0;
  for (let i = 0; i < displayTasks.length; i++) totalWorkloadSlots += getTaskSlotWeight(displayTasks[i]);
  const roundedWorkloadSlots = Math.round(totalWorkloadSlots * 10) / 10;
  const effectiveSlots = roundedWorkloadSlots > 0 ? roundedWorkloadSlots : totalActiveTasksCount;
  const taskUtilizationPercent = Math.min(150, Math.round((effectiveSlots / maxCapacityTasks) * 100));
  const openSlots = Math.max(0, Math.round((maxCapacityTasks - effectiveSlots) * 10) / 10);

  let cardTheme = {
    cardBg: "bg-white dark:bg-[#0f172a]/95",
    cardBorder: "border-slate-200/90 dark:border-slate-800",
    cardRing: "",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    meterBg: "bg-slate-50/90 dark:bg-[#1e293b]/60 border-slate-200/80 dark:border-slate-800/80",
    slotFilledColor: "bg-emerald-500",
    slotEmptyColor: "bg-slate-200 dark:bg-slate-800",
    capacityTextColor: "text-emerald-600 dark:text-emerald-400",
    isOverloaded: false,
    statusTag: `${openSlots} Slots Open`,
  };
  if (effectiveSlots > maxCapacityTasks) {
    const excess = Math.round((effectiveSlots - maxCapacityTasks) * 10) / 10;
    cardTheme = { cardBg: "bg-rose-50/95 dark:bg-[#200d11]", cardBorder: "border-rose-300 dark:border-rose-800/80", cardRing: "ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10", badgeBg: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800", meterBg: "bg-rose-100/70 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60", slotFilledColor: "bg-rose-500", slotEmptyColor: "bg-rose-200/60 dark:bg-rose-950/40", capacityTextColor: "text-rose-600 dark:text-rose-400", isOverloaded: true, statusTag: `⚠️ Overloaded (+${excess} load)` };
  } else if (effectiveSlots >= 7.5) {
    cardTheme = { cardBg: "bg-indigo-50/40 dark:bg-[#121630]", cardBorder: "border-indigo-200/90 dark:border-indigo-800/80", cardRing: "ring-1 ring-indigo-500/30", badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-800", meterBg: "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/50", slotFilledColor: "bg-indigo-500", slotEmptyColor: "bg-slate-200 dark:bg-slate-800", capacityTextColor: "text-indigo-600 dark:text-indigo-400", isOverloaded: false, statusTag: `Full Capacity (${effectiveSlots}/8)` };
  } else if (effectiveSlots >= 5.5) {
    cardTheme = { cardBg: "bg-amber-50/30 dark:bg-[#1e170c]", cardBorder: "border-amber-200/90 dark:border-amber-800/80", cardRing: "ring-1 ring-amber-500/20", badgeBg: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800", meterBg: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50", slotFilledColor: "bg-amber-500", slotEmptyColor: "bg-slate-200 dark:bg-slate-800", capacityTextColor: "text-amber-600 dark:text-amber-400", isOverloaded: false, statusTag: `High Load (${openSlots} left)` };
  }

  return {
    user: u, userIdStr, assignedTasks, displayTasks, sortedDisplayTasks,
    activeTasks, pendingTasks, onHoldTasks, workedMs, maxCapacityTasks,
    totalActiveTasksCount, effectiveSlots, totalWorkloadSlots: roundedWorkloadSlots,
    taskUtilizationPercent, cardTheme,
  };
};

// ==========================================
// MAIN WORKLOAD COMPONENT (HIGH PERFORMANCE)
// ==========================================
const Workload = () => {
  const dispatch = useDispatch();

  const { users = [], loading: usersLoading } = useSelector((state) => state.users);
  const { clients = [] } = useSelector((state) => state.clients);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [createTaskMutation] = useCreateTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();

  // Department Tab: "Graphic Designer" | "Cinematographer"
  const [selectedDepartment, setSelectedDepartment] = useState("Graphic Designer");

  // View mode: "grid" (Multi-row Grid - default) | "table" (Table View) with persistence
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem("workload_view_mode_v2");
      if (saved === "table" || saved === "grid") return saved;
      return "grid";
    } catch {
      return "grid";
    }
  });

  const handleSetViewMode = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("workload_view_mode_v2", mode);
    } catch {}
  }, []);

  const {
    data: tasksData = [],
    isLoading: tasksLoading,
    isFetching: tasksFetching,
    isError: tasksIsError,
    isSuccess: tasksIsSuccess,
    refetch: refetchTasks,
  } = useGetTasksQuery(
    { active_only: true, minimal: true },
    { refetchOnMountOrArgChange: false, refetchOnFocus: false, refetchOnReconnect: true }
  );

  const { onlineUserIds = [], userPresence = {} } = useSocketContext() || {};
  const onlineUserIdsSet = useMemo(() => new Set((onlineUserIds || []).map((id) => id?.toString())), [onlineUserIds]);


  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [expandedUserIds, setExpandedUserIds] = useState(() => new Set());
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);

  useEffect(() => {
    if ((!users || users.length === 0) && !usersLoading) dispatch(getUsers());
    if (!clients || clients.length === 0) dispatch(getClients());
  }, [dispatch, users?.length, clients?.length, usersLoading]);

  // Split users into GD and Cinema groups
  const { gdUsers, cinemaUsers } = useMemo(() => {
    const gd = [];
    const cinema = [];
    (users || []).forEach((u) => {
      if (u.employmentStatus === "relieved") return;
      const { isGD, isCinema } = getUserDeptGroup(u);
      if (isGD) gd.push(u);
      if (isCinema) cinema.push(u);
    });
    return { gdUsers: gd, cinemaUsers: cinema };
  }, [users]);

  // Task map
  const tasksByUserMap = useMemo(() => {
    const map = new Map();
    const seenMap = new Map();
    const add = (userId, task) => {
      if (!userId) return;
      const sId = userId.toString();
      let arr = map.get(sId); let seen = seenMap.get(sId);
      if (!arr) { arr = []; seen = new Set(); map.set(sId, arr); seenMap.set(sId, seen); }
      if (!seen.has(task._id)) { seen.add(task._id); arr.push(task); }
    };
    for (const t of (tasksData || [])) {
      if (!t) continue;
      const aid = typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
      if (aid) add(aid, t);
      for (const sub of (t.subtasks || [])) {
        const sid = typeof sub.assignedTo === "object" ? sub.assignedTo?._id : sub.assignedTo;
        if (sid) add(sid, t);
      }
    }
    return map;
  }, [tasksData]);

  const usersMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => { if (u?._id) m.set(u._id.toString(), u); });
    return m;
  }, [users]);

  const dayWorkCtx = useMemo(() => getDayWorkContext(new Date()), []);

  // Build workload stats for ALL users (both groups)
  const allUserWorkloads = useMemo(() => {
    const nowMs = Date.now();
    const buildGroup = (list) => list.map((u) => buildUserWorkload(u, tasksByUserMap, dayWorkCtx, usersMap, nowMs));
    return { gd: buildGroup(gdUsers), cinema: buildGroup(cinemaUsers) };
  }, [gdUsers, cinemaUsers, tasksByUserMap, dayWorkCtx, usersMap]);

  // Attach real-time socket presence
  const withPresence = useCallback((base) => {
    const isOnline =
      onlineUserIdsSet.has(base.userIdStr) ||
      userPresence[base.userIdStr]?.status === "online" ||
      userPresence[base.userIdStr]?.status === "away" ||
      base.user.presenceStatus === "online";

    let availability = {
      label: isOnline ? "Online (Available)" : "Offline",
      status: isOnline ? "online" : "offline",
      badgeClass: isOnline
        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60"
        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1e293b]/70 dark:text-slate-400 dark:border-slate-700/60",
      dotClass: isOnline ? "bg-sky-500" : "bg-slate-400 dark:bg-slate-500",
    };
    if (base.activeTasks.length > 0) {
      availability = { label: "Busy (Working)", status: "busy", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60", dotClass: "bg-emerald-500 animate-ping" };
    } else if (base.onHoldTasks.length > 0) {
      availability = { label: "On Break / Paused", status: "paused", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60", dotClass: "bg-amber-500" };
    }
    return { ...base, isOnline, availability };
  }, [onlineUserIdsSet, userPresence]);

  const liveWorkloads = useMemo(() => ({
    gd: allUserWorkloads.gd.map(withPresence),
    cinema: allUserWorkloads.cinema.map(withPresence),
  }), [allUserWorkloads, withPresence]);

  // Apply search + availability filter to each group
  const applyFilter = useCallback((list) => {
    let l = list;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      l = l.filter(w => w.user.name?.toLowerCase().includes(q) || w.user.email?.toLowerCase().includes(q) || w.user.department?.toLowerCase().includes(q));
    }
    if (availabilityFilter === "all") return l;
    if (availabilityFilter === "online") return l.filter(w => w.isOnline);
    if (availabilityFilter === "offline") return l.filter(w => !w.isOnline);
    if (availabilityFilter === "busy") return l.filter(w => w.availability.status === "busy");
    if (availabilityFilter === "paused") return l.filter(w => w.availability.status === "paused");
    if (availabilityFilter === "available") return l.filter(w => w.isOnline && w.activeTasks.length === 0 && w.onHoldTasks.length === 0);
    if (availabilityFilter === "overloaded") return l.filter(w => w.cardTheme.isOverloaded);
    return l.filter(w => w.availability.status === availabilityFilter);
  }, [searchTerm, availabilityFilter]);

  const finalWorkloads = useMemo(() => ({
    gd: applyFilter(liveWorkloads.gd),
    cinema: applyFilter(liveWorkloads.cinema),
  }), [liveWorkloads, applyFilter]);

  // Current active workloads based on selected tab
  const currentWorkloads = useMemo(() => {
    return selectedDepartment === "Cinematographer" ? finalWorkloads.cinema : finalWorkloads.gd;
  }, [selectedDepartment, finalWorkloads]);

  // Dept counts for toolbar tabs
  const departmentCounts = useMemo(() => ({
    "Graphic Designer": gdUsers.length,
    Cinematographer: cinemaUsers.length,
  }), [gdUsers.length, cinemaUsers.length]);

  const toggleExpandUser = useCallback((userId) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  }, []);

  const toggleAllExpand = useCallback((expand) => {
    setExpandedUserIds(() => {
      if (expand) {
        return new Set(currentWorkloads.map((w) => w.user._id));
      }
      return new Set();
    });
  }, [currentWorkloads]);



  const handleOpenTaskModal = useCallback((task) => setSelectedTaskModal(task), []);
  const handleCloseTaskModal = useCallback(() => setSelectedTaskModal(null), []);

  const hasCachedUsers = users && users.length > 0;
  const hasCachedTasks = tasksIsSuccess || (tasksData && tasksData.length > 0);
  const isInitialLoading = (!hasCachedUsers && usersLoading) || (tasksLoading && !hasCachedTasks);
  const isBackgroundRefetching = tasksFetching && !tasksLoading && hasCachedTasks;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070b14] p-4 sm:p-6 lg:p-8 space-y-6 font-inter text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <style>{`
        @keyframes wl-loadbar {
          0%   { transform: translateX(-200%); }
          50%  { transform: translateX(100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      {/* 1. Toolbar with Department Tabs & Table/Card View Toggle */}
      <WorkloadToolbar
        selectedDepartment={selectedDepartment}
        onSelectDepartment={setSelectedDepartment}
        departmentCounts={departmentCounts}
        viewMode={viewMode}
        onSetViewMode={handleSetViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        availabilityFilter={availabilityFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        onRefresh={refetchTasks}
        isFetching={tasksFetching}
      />

      {/* Background refetch indicator */}
      {isBackgroundRefetching && (
        <div className="h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden -mt-3" aria-hidden="true">
          <div className="h-full w-1/3 bg-indigo-500/60 dark:bg-indigo-400/50 rounded-full" style={{ animation: "wl-loadbar 1.8s ease-in-out infinite" }} />
        </div>
      )}

      {/* 2. Main content for Selected Department */}
      {isInitialLoading ? (
        <WorkloadSkeleton viewMode={viewMode} count={6} />
      ) : tasksIsError && !hasCachedTasks ? (
        <div className="bg-white dark:bg-[#0f172a]/90 rounded-2xl p-10 text-center border border-rose-200 dark:border-rose-900/50 space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
            <FiRefreshCw size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Failed to load workload data</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">There was an issue fetching the latest workload tasks. Please try refreshing.</p>
          </div>
          <button onClick={() => refetchTasks()} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2">
            <FiRefreshCw size={12} /><span>Retry</span>
          </button>
        </div>
      ) : currentWorkloads.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a]/90 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800/90 space-y-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50">
            <FiUsers size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No {selectedDepartment} Members Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">No team members match the current search or filter criteria in this department.</p>
          </div>
          <button onClick={() => { setSearchTerm(""); setAvailabilityFilter("all"); }} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
            Reset Filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        <WorkloadTableView
          workloads={currentWorkloads}
          expandedUserIds={expandedUserIds}
          onToggleExpand={toggleExpandUser}
          onViewTask={handleOpenTaskModal}
          selectedDepartment={selectedDepartment}
        />
      ) : (
        <WorkloadGridView
          workloads={currentWorkloads}
          expandedUserIds={expandedUserIds}
          onToggleExpand={toggleExpandUser}
          onToggleAllExpand={toggleAllExpand}
          onViewTask={handleOpenTaskModal}
          selectedDepartment={selectedDepartment}
        />
      )}

      {/* 3. Workload Task Allocation Table */}
      <WorkloadTaskTable
        tasks={tasksData}
        users={users}
        clients={clients}
        selectedDepartment={selectedDepartment}
        currentUser={currentUser}
        onViewTask={handleOpenTaskModal}
        createTaskMutation={createTaskMutation}
        updateTaskMutation={updateTaskMutation}
        refetchTasks={refetchTasks}
      />

      {/* 4. Task Preview Modal */}
      <AnimatePresence>
        {selectedTaskModal && (
          <TaskPreviewModal task={selectedTaskModal} onClose={handleCloseTaskModal} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workload;