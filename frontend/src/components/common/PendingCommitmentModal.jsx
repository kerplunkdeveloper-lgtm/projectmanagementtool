// frontend/src/components/common/PendingCommitmentModal.jsx

import React, { useState, useMemo, useEffect } from "react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "pending", "completed"

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
    totalDeliverablesCommitted,
    totalDeliverablesPublished,
    deliverablesProgressPct,
    awaitingApprovalCount,
  } = useMemo(() => {
    return computeAllClientsCommitments(clients, tasks, currentMonth, currentYear);
  }, [clients, tasks, currentMonth, currentYear]);

  // Enriched summaries with SMM names
  const enrichedSummaries = useMemo(() => {
    return (clientSummaries || []).map((cs) => {
      const smmName = getClientSmmName(cs.client, cs.clientName);
      return {
        ...cs,
        smmName,
      };
    });
  }, [clientSummaries, tasks, usersMap]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return enrichedSummaries.filter((cs) => {
      // Search (by Client name, industry, or SMM name)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = cs.clientName.toLowerCase().includes(q);
        const matchInd = (cs.industry || "").toLowerCase().includes(q);
        const matchSmm = (cs.smmName || "").toLowerCase().includes(q);
        if (!matchName && !matchInd && !matchSmm) return false;
      }
      // Status filter
      if (activeFilter === "pending") {
        return cs.totalPendingDelivery > 0;
      }
      if (activeFilter === "completed") {
        return cs.totalPendingDelivery === 0 && cs.totalCommitted > 0;
      }
      return true;
    });
  }, [enrichedSummaries, searchQuery, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
              {monthName} {currentYear} • Pending Commitments
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

        {/* Global Metric Strips */}
        <div className="px-6 py-3.5 bg-slate-100/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Posts Progress
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalPostsPublished}/{totalPostsCommitted}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {postsProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${postsProgressPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Reels Progress
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalReelsPublished}/{totalReelsCommitted}
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {reelsProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${reelsProgressPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Deliverables
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {totalDeliverablesPublished}/{totalDeliverablesCommitted}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {deliverablesProgressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${deliverablesProgressPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Awaiting Approval
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {awaitingApprovalCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">In QC</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Pending client review</span>
          </div>
        </div>

        {/* Toolbar: Search & Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search client or SMM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-bold">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              All Clients ({clientSummaries.length})
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeFilter === "pending"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Pending ({clientSummaries.filter((c) => c.totalPendingDelivery > 0).length})
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeFilter === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Completed ({clientSummaries.filter((c) => c.totalPendingDelivery === 0 && c.totalCommitted > 0).length})
            </button>
          </div>
        </div>

        {/* Clients Commitment Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredSummaries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm italic">
              No clients found matching your filter.
            </div>
          ) : (
            filteredSummaries.map((item) => {
              const { client, clientName, color, industry, smmName, posts, reels, story, overallPct } = item;

              return (
                <div
                  key={item.clientId || clientName}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
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
                        {/* Client Name + Industry + SMM Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {clientName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {industry}
                          </span>

                          {/* Social Media Manager Name Badge next to each client */}
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
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Total Deliverables: <span className="font-bold text-slate-700 dark:text-slate-300">{item.totalCommitted} this month</span>
                        </span>
                      </div>
                    </div>

                    {/* Overall Progress Badge & Action */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.totalPosted} / {item.totalCommitted} delivered
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
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
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Filter tasks for this client"
                        >
                          <span>View Tasks</span>
                          <FiArrowUpRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Commitment Sections Grid: Posts, Reels, Stories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs">
                    {/* 1. POSTS COMMITMENT */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-extrabold text-blue-700 dark:text-blue-400">
                          <FiImage size={14} />
                          <span>Posts Commitment</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                          {posts.posted} / {posts.committed}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">No. of Post:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{posts.committed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">No. of Post posted:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{posts.posted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">in hand:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {posts.inHandNote}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Pending Posts:</span>
                          <span className={`font-bold ${posts.pending > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                            {posts.pending}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-slate-400">Last Post date:</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {posts.lastPostDate}
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${posts.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. REELS COMMITMENT */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-extrabold text-purple-700 dark:text-purple-400">
                          <FiPlay size={14} />
                          <span>Reels Commitment</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                          {reels.posted} / {reels.committed}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">No. of Reels:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{reels.committed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">No. of Reel posted:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{reels.posted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">In hand:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {reels.inHandNote}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Pending Reels:</span>
                          <span className={`font-bold ${reels.pending > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                            {reels.pending}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-slate-400">Last post date:</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {reels.lastPostDate}
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${reels.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. STORIES COMMITMENT */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-400">
                          <FiZap size={14} />
                          <span>Story Commitment</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                          {story.posted} / {story.committed}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">No. of story:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{story.committed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">No. of Story posted:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{story.posted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">in hand:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {story.inHandNote}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Pending Stories:</span>
                          <span className={`font-bold ${story.pending > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                            {story.pending}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-slate-400">Last Story date:</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {story.lastPostDate}
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${story.progressPct}%` }}
                        />
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
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingCommitmentModal;
