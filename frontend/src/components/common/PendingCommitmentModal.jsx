// frontend/src/components/common/PendingCommitmentModal.jsx

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiX,
  FiSearch,
  FiClock,
  FiCalendar,
  FiPlay,
  FiImage,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowUpRight,
  FiPlus,
  FiLayers,
  FiUser,
  FiFilter,
  FiCheck,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { computeAllClientsCommitments } from "../../utils/smCommitmentUtils";
import { getUsers } from "../../features/users/userSlice";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to identify Social Media Managers
const isSocialMediaManager = (u) => {
  if (!u) return false;
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
};

const PendingCommitmentModal = ({
  isOpen,
  onClose,
  clients = [],
  tasks = [],
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  onSelectClient = null,
  onCreateTaskForClient = null,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux auth user & users list for role check and SMM name resolution
  const { user } = useSelector((state) => state.auth);
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getUsers());
    }
  }, [dispatch, users]);

  // Role check: Admin and Operation Manager should NOT see + Task button
  const userRole = (user?.role || "").toLowerCase().replace(/[\s_]/g, "");
  const isAdminOrOperationManager = userRole === "admin" || userRole === "operationmanager";

  // Fast user lookup map by ID and lowercase name
  const usersMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (u?._id) map.set(u._id.toString(), u);
      if (u?.name) map.set(u.name.trim().toLowerCase(), u);
    });
    return map;
  }, [users]);

  // Helper to resolve Social Media Manager name for a given client
  const getClientSmmName = (client, clientName) => {
    if (!client && !clientName) return null;
    const clientId = client?._id?.toString();
    const cNameLower = (clientName || client?.companyName || "").trim().toLowerCase();

    // 1. Check client.assignedTo for an explicitly designated SMM
    const assignedList = Array.isArray(client?.assignedTo)
      ? client.assignedTo
      : client?.assignedTo
      ? [client.assignedTo]
      : [];

    for (const member of assignedList) {
      const memberId = (member?._id || member)?.toString();
      const memberObj =
        (memberId && usersMap.get(memberId)) ||
        (member?.name && usersMap.get(member.name.trim().toLowerCase())) ||
        (typeof member === "object" ? member : null);
      if (memberObj && isSocialMediaManager(memberObj)) {
        return memberObj.name;
      }
    }

    // 2. Look in tasks for this client to find creators/assignees who are SMM
    const relevantTasks = (tasks || []).filter((t) => {
      const tId = (t.client?._id || t.client)?.toString();
      const tName = (t.clientName || t.client?.companyName || "").trim().toLowerCase();
      return (clientId && tId === clientId) || (cNameLower && tName === cNameLower);
    });

    for (const t of relevantTasks) {
      const cId = (t.createdBy?._id || t.createdBy)?.toString();
      const creatorObj =
        (cId && usersMap.get(cId)) ||
        (t.createdBy?.name && usersMap.get(t.createdBy.name.trim().toLowerCase())) ||
        (t.createdByName && usersMap.get(t.createdByName.trim().toLowerCase())) ||
        (t.assigneeName && usersMap.get(t.assigneeName.trim().toLowerCase())) ||
        (typeof t.createdBy === "object" ? t.createdBy : null);

      if (creatorObj && isSocialMediaManager(creatorObj)) {
        return creatorObj.name;
      }
    }

    // 3. Fallback: Any assigned member who is not Admin/Operation Manager
    for (const member of assignedList) {
      const memberId = (member?._id || member)?.toString();
      const memberObj =
        (memberId && usersMap.get(memberId)) ||
        (member?.name && usersMap.get(member.name.trim().toLowerCase())) ||
        (typeof member === "object" ? member : null);
      const roleClean = (memberObj?.role || "").toLowerCase().replace(/[\s_]/g, "");
      if (memberObj?.name && roleClean !== "admin" && roleClean !== "operationmanager") {
        return memberObj.name;
      }
    }

    // 4. Fallback: Check task creator/assignee who is not Admin
    for (const t of relevantTasks) {
      const creatorName = t.createdBy?.name || t.createdByName || t.assigneeName;
      if (
        creatorName &&
        !["admin", "operation manager", "administrator"].includes(creatorName.toLowerCase().trim())
      ) {
        return creatorName;
      }
    }

    return null;
  };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "pending", "completed", "live"

  const monthName = MONTH_NAMES[currentMonth - 1] || "Current Month";

  // Compute all clients' commitments
  const {
    clientSummaries,
    totalPostsCommitted,
    totalPostsPublished,
    postsProgressPct,
    totalReelsCommitted,
    totalReelsPublished,
    reelsProgressPct,
    totalStoriesCommitted,
    totalStoriesPublished,
    storiesProgressPct,
    totalDeliverablesCommitted,
    totalDeliverablesPublished,
    deliverablesProgressPct,
    awaitingApprovalCount,
  } = useMemo(() => {
    return computeAllClientsCommitments(clients, tasks, currentMonth, currentYear);
  }, [clients, tasks, currentMonth, currentYear]);

  // Enriched summaries with SMM names, task breakdown, and live/completed status flags
  const enrichedSummaries = useMemo(() => {
    return (clientSummaries || []).map((cs) => {
      const smmName = getClientSmmName(cs.client, cs.clientName);

      const allClientTasks = [
        ...(cs.posts?.tasks || []),
        ...(cs.reels?.tasks || []),
        ...(cs.story?.tasks || []),
      ];

      // Tasks explicitly marked as Live
      const liveTasks = allClientTasks.filter(
        (t) => (t.status || "").trim().toLowerCase() === "live"
      );

      // Tasks marked as Completed
      const completedTasks = allClientTasks.filter(
        (t) => (t.status || "").trim().toLowerCase() === "completed"
      );

      // Tasks in QC awaiting approval
      const inQcTasks = allClientTasks.filter(
        (t) => (t.status || "").trim().toLowerCase() === "in qc"
      );

      const liveTasksCount = liveTasks.length;
      const completedTasksCount = completedTasks.length;
      const inQcTasksCount = inQcTasks.length;

      // Has active Live tasks OR published deliverables
      const hasLiveTasks = liveTasksCount > 0 || cs.totalPosted > 0;

      // Monthly commitment completely fulfilled
      const isCommitmentCompleted = cs.totalPendingDelivery === 0 && cs.totalCommitted > 0;

      // Has pending deliverables still to be published
      const hasPendingDelivery = cs.totalPendingDelivery > 0;

      return {
        ...cs,
        smmName,
        allClientTasks,
        liveTasksCount,
        completedTasksCount,
        inQcTasksCount,
        hasLiveTasks,
        isCommitmentCompleted,
        hasPendingDelivery,
      };
    });
  }, [clientSummaries, tasks, usersMap]);

  // Counts for top tabs
  const tabCounts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let live = 0;

    enrichedSummaries.forEach((cs) => {
      if (cs.hasPendingDelivery) pending++;
      if (cs.isCommitmentCompleted) completed++;
      if (cs.hasLiveTasks) live++;
    });

    return {
      all: enrichedSummaries.length,
      pending,
      completed,
      live,
    };
  }, [enrichedSummaries]);

  // Check if any non-default filter is active
  const isFilterActive = searchQuery.trim() !== "" || activeTab !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
  };

  // Filtered & Sorted summaries
  const filteredSummaries = useMemo(() => {
    const result = enrichedSummaries.filter((cs) => {
      // 1. Search (by Client name, industry, or SMM name)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (cs.clientName || "").toLowerCase().includes(q);
        const matchInd = (cs.industry || "").toLowerCase().includes(q);
        const matchSmm = (cs.smmName || "").toLowerCase().includes(q);
        if (!matchName && !matchInd && !matchSmm) return false;
      }

      // 2. Primary Tab filter: All, Pending, Completed, Live
      if (activeTab === "pending" && !cs.hasPendingDelivery) return false;
      if (activeTab === "completed" && !cs.isCommitmentCompleted) return false;
      if (activeTab === "live" && !cs.hasLiveTasks) return false;

      return true;
    });

    // Default sorting: most pending deliverables first
    return [...result].sort((a, b) => {
      return (b.totalPendingDelivery || 0) - (a.totalPendingDelivery || 0);
    });
  }, [enrichedSummaries, searchQuery, activeTab]);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="relative w-[96vw] max-w-6xl max-h-[90vh] my-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Client Deliverables Commitment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {monthName} {currentYear} • Deliverables & Commitments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status of posts, reels, and stories committed vs published across each client.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Global Metric Strips (5 cards: Posts, Reels, Stories, Total, In QC) */}
        <div className="px-6 py-3.5 bg-slate-100/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          
          {/* 1. Posts Progress */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Posts Progress
              </span>
              <span className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                <FiImage size={11} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalPostsPublished}/{totalPostsCommitted}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {postsProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${postsProgressPct}%` }}
              />
            </div>
          </div>

          {/* 2. Reels Progress */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Reels Progress
              </span>
              <span className="w-5 h-5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">
                <FiPlay size={11} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalReelsPublished}/{totalReelsCommitted}
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {reelsProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${reelsProgressPct}%` }}
              />
            </div>
          </div>

          {/* 3. Stories Progress (Added next to Reels card!) */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Stories Progress
              </span>
              <span className="w-5 h-5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
                <FiZap size={11} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalStoriesPublished}/{totalStoriesCommitted}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {storiesProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${storiesProgressPct}%` }}
              />
            </div>
          </div>

          {/* 4. Total Deliverables */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Deliverables
              </span>
              <span className="w-5 h-5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                <FiLayers size={11} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalDeliverablesPublished}/{totalDeliverablesCommitted}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {deliverablesProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${deliverablesProgressPct}%` }}
              />
            </div>
          </div>

          {/* 5. Awaiting Approval / QC */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Awaiting Approval
              </span>
              <span className="w-5 h-5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs">
                <FiClock size={11} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {awaitingApprovalCount}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                In QC
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-2 truncate">Pending client review</span>
          </div>
        </div>

        {/* Toolbar: Tabs & Search */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          
          {/* Primary Status Tabs: All Clients, Pending, Completed, Live */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold w-full sm:w-auto scrollbar-none">
            {/* All Clients */}
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750"
              }`}
            >
              <span>All Clients</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                activeTab === "all"
                  ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}>
                {tabCounts.all}
              </span>
            </button>

            {/* Pending */}
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750"
              }`}
            >
              <span>Pending</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                activeTab === "pending"
                  ? "bg-black/20 text-white"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
              }`}>
                {tabCounts.pending}
              </span>
            </button>

            {/* Completed */}
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750"
              }`}
            >
              <span>Completed</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                activeTab === "completed"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
              }`}>
                {tabCounts.completed}
              </span>
            </button>

            {/* Live */}
            <button
              type="button"
              onClick={() => setActiveTab("live")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "live"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeTab === "live" ? "bg-white" : "bg-teal-400"
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  activeTab === "live" ? "bg-white" : "bg-teal-500"
                }`} />
              </span>
              <span>Live</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                activeTab === "live"
                  ? "bg-white/20 text-white"
                  : "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400"
              }`}>
                {tabCounts.live}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72 shrink-0">
           
            <input
              type="text"
              placeholder="Search client, industry, or SMM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                title="Clear search"
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Clients Commitment Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredSummaries.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FiFilter size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                No clients match your filter
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Try adjusting your search query, switching tabs, or resetting filters to view all commitments.
              </p>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            filteredSummaries.map((item) => {
              const {
                client,
                clientName,
                color,
                industry,
                smmName,
                posts,
                reels,
                story,
                overallPct,
                hasLiveTasks,
                isCommitmentCompleted,
                liveTasksCount,
              } = item;

              return (
                <div
                  key={item.clientId || clientName}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                  style={{ borderLeftWidth: "4.5px", borderLeftColor: color }}
                >
                  {/* Client Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-2xs shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {clientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        {/* Client Name + Industry + SMM Badge + Status Chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {clientName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {industry}
                          </span>

                          {/* Social Media Manager Name Badge */}
                          {smmName ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/60 shadow-2xs whitespace-nowrap"
                              title={`Social Media Manager: ${smmName}`}
                            >
                              <FiUser size={12} className="text-indigo-500 shrink-0" />
                              <span className="text-[9.5px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-extrabold">
                                SMM:
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {smmName}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap"
                              title="No Social Media Manager assigned"
                            >
                              <FiUser size={11} className="text-slate-400 shrink-0" />
                              <span>SMM: Unassigned</span>
                            </span>
                          )}

                          {/* Live Status indicator pill if client has Live tasks */}
                          {hasLiveTasks && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                              <span>Live Active</span>
                            </span>
                          )}

                          {/* Completed indicator pill */}
                          {isCommitmentCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                              <FiCheck size={11} className="text-emerald-500" />
                              <span>100% Done</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-medium">
                          Total Deliverables:{" "}
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {item.totalCommitted} this month
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Overall Progress Badge & Actions */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.totalPosted} / {item.totalCommitted} delivered
                        </div>
                        <div className={`text-[10px] font-bold ${
                          overallPct === 100
                            ? "text-emerald-600 dark:text-emerald-400"
                            : overallPct > 50
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {overallPct}% complete
                        </div>
                      </div>

                      {/* + Task button: HIDDEN for Admin and Operation Manager */}
                      {!isAdminOrOperationManager && onCreateTaskForClient && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onCreateTaskForClient(client);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition-colors text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Create task for this client"
                        >
                          <FiPlus size={13} />
                          <span>Task</span>
                        </button>
                      )}

                      {onSelectClient && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectClient(clientName);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Filter tasks for this client"
                        >
                          <span>View Tasks</span>
                          <FiArrowUpRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Commitment Sections Grid: Posts, Reels, Stories with better UI/UX */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs">
                    
                    {/* 1. POSTS COMMITMENT */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 transition-all hover:border-emerald-300 dark:hover:border-emerald-800/60">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-extrabold text-emerald-700 dark:text-emerald-400">
                          <span className="w-5 h-5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 flex items-center justify-center text-xs">
                            <FiImage size={12} />
                          </span>
                          <span>Posts Commitment</span>
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {posts.posted} / {posts.committed}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Committed:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{posts.committed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Published / Live:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{posts.posted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">In hand:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {posts.inHandNote}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Pending:</span>
                          <span className={`font-bold px-1.5 py-0.2 rounded text-[10.5px] ${
                            posts.pending > 0
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {posts.pending} {posts.pending === 0 ? "✓ Met" : "left"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-slate-400 text-[10px]">Last post date:</span>
                          <span className="font-mono text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
                            {posts.lastPostDate}
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{posts.progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${posts.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. REELS COMMITMENT */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 transition-all hover:border-purple-300 dark:hover:border-purple-800/60">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-extrabold text-purple-700 dark:text-purple-400">
                          <span className="w-5 h-5 rounded-lg bg-purple-100/70 dark:bg-purple-950/70 flex items-center justify-center text-xs">
                            <FiPlay size={12} />
                          </span>
                          <span>Reels Commitment</span>
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {reels.posted} / {reels.committed}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Committed:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{reels.committed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Published / Live:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{reels.posted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">In hand:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {reels.inHandNote}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Pending:</span>
                          <span className={`font-bold px-1.5 py-0.2 rounded text-[10.5px] ${
                            reels.pending > 0
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {reels.pending} {reels.pending === 0 ? "✓ Met" : "left"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-slate-400 text-[10px]">Last post date:</span>
                          <span className="font-mono text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
                            {reels.lastPostDate}
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{reels.progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${reels.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. STORIES COMMITMENT (Enhanced UI/UX right next to Reels card!) */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 transition-all hover:border-amber-300 dark:hover:border-amber-800/60">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-400">
                          <span className="w-5 h-5 rounded-lg bg-amber-100/70 dark:bg-amber-950/70 flex items-center justify-center text-xs">
                            <FiZap size={12} />
                          </span>
                          <span>Stories Commitment</span>
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {story.posted} / {story.committed}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Committed:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{story.committed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Published / Live:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{story.posted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">In hand:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {story.inHandNote}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Pending:</span>
                          <span className={`font-bold px-1.5 py-0.2 rounded text-[10.5px] ${
                            story.pending > 0
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {story.pending} {story.pending === 0 ? "✓ Met" : "left"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-slate-400 text-[10px]">Last story date:</span>
                          <span className="font-mono text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
                            {story.lastPostDate}
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{story.progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${story.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Deliverables are synchronized in real-time with the Client database and Content Calendar tasks.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PendingCommitmentModal;
