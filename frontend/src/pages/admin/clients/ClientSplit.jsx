import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  LuSplit,
  LuUsers,
  LuMapPin,
  LuGripVertical,
  LuArrowRight,
  LuArrowRightLeft,
  LuX,
  LuCircleCheck,
  LuHistory,
  LuLayoutGrid,
  LuSearch,
} from "react-icons/lu";
import toast from "react-hot-toast";
import { useTheme } from "../../../context/ThemeContext";
import { getUsers } from "../../../features/users/userSlice";
import { getClientsAPI, reassignClientAPI, getClientSplitHistoryAPI } from "../../../features/clients/clientApi";
import { clientReassigned } from "../../../features/clients/clientslice";

// Same rule as the backend: only admin / operation manager / finance can move clients
const canReassignClients = (u) => {
  if (!u) return false;
  const role = (u.role || "").toLowerCase();
  const dept = (u.department || "").toLowerCase();
  return (
    role === "admin" ||
    role === "operationmanager" ||
    role === "operation manager" ||
    role === "finance" ||
    role === "accountant" ||
    dept.includes("finance") ||
    dept.includes("account")
  );
};

// Social Media Executives only (Social Media Head / Manager are excluded)
const isSocialMediaExecutive = (u) => {
  if (!u || u.employmentStatus === "relieved") return false;
  const dept = (u.department || "").toLowerCase();
  const role = (u.role || "").toLowerCase();
  const desig = (u.designation || "").toLowerCase();

  const isExecutive = dept.includes("executive") || desig.includes("executive");
  const isHead =
    !isExecutive &&
    (role === "socialmediamanager" ||
      role === "socialmediahead" ||
      [dept, desig].some((v) => v.includes("head") || v.includes("manager")));
  if (isHead) return false;

  return (
    dept.includes("social media") ||
    dept.includes("smm") ||
    role.includes("social media") ||
    role === "socialmediamanager" ||
    role === "socialmediaexecutive" ||
    desig.includes("social media") ||
    desig.includes("smm")
  );
};

const getAvatar = (u) => {
  const img = u?.profile?.profileImage || u?.profileImage;
  const url = typeof img === "object" ? img?.url : img;
  return typeof url === "string" && url.trim() ? url : null;
};

const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "SM";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";
const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

// "Today", "Yesterday", "3 days ago" ...
const relativeDay = (d) => {
  if (!d) return "";
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(new Date(d))) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return "";
};


const ClientSplit = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((s) => s.users);
  const { user: currentUser } = useSelector((s) => s.auth);
  const canDrag = canReassignClients(currentUser);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  // Drag & drop: { clientId, fromUserId } while dragging; dropTarget = executive column id
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);

  // Right-side tab: "split" (board) | "history" (move history table)
  const [view, setView] = useState("split");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyOrder, setHistoryOrder] = useState("recent"); // "recent" | "past"
  const [historySearch, setHistorySearch] = useState("");

  // Load the move history the first time the History tab is opened
  useEffect(() => {
    if (view !== "history" || historyLoaded) return;
    let alive = true;
    setHistoryLoading(true);
    setHistoryError("");
    (async () => {
      try {
        const res = await getClientSplitHistoryAPI();
        if (alive) {
          setHistory(res?.data || []);
          setHistoryLoaded(true);
        }
      } catch (e) {
        if (alive) setHistoryError(e?.response?.data?.message || "Failed to load move history");
      } finally {
        if (alive) setHistoryLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [view, historyLoaded]);

  const historyRows = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const rows = history.map((h) => ({
      ...h,
      clientLabel: h.clientName || "Unknown client",
      fromLabel: h.fromUser?.name || h.fromUserName || "Unknown",
      toLabel: h.toUser?.name || h.toUserName || "Unknown",
      byLabel: h.movedBy?.name || h.movedByName || "-",
    }));
    const filtered = q
      ? rows.filter((r) =>
          [r.clientLabel, r.fromLabel, r.toLabel, r.byLabel, r.branch].some((v) => (v || "").toLowerCase().includes(q))
        )
      : rows;
    return filtered.sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return historyOrder === "recent" ? diff : -diff;
    });
  }, [history, historyOrder, historySearch]);

  // Close the confirm modal with Escape
  useEffect(() => {
    if (!pendingMove) return;
    const onKey = (e) => e.key === "Escape" && setPendingMove(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingMove]);

  useEffect(() => {
    if (!users || users.length === 0) dispatch(getUsers());
  }, [dispatch, users]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getClientsAPI();
        if (alive) setClients(res?.data || []);
      } catch (e) {
        if (alive) setError(e?.response?.data?.message || "Failed to load clients");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const usersById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => u?._id && m.set(u._id.toString(), u));
    return m;
  }, [users]);

  const activeClients = useMemo(
    () => clients.filter((c) => (c.status || "Active") !== "Inactive"),
    [clients]
  );

  // Branch options (case-insensitive) with active client counts
  const branches = useMemo(() => {
    const m = new Map();
    activeClients.forEach((c) => {
      const label = (c.branch || "").trim();
      if (!label) return;
      const key = label.toLowerCase();
      const cur = m.get(key) || { key, label, count: 0 };
      cur.count += 1;
      m.set(key, cur);
    });
    // Fixed order: Pondicherry first, then Chennai, then any others alphabetically
    const rank = (k) => {
      if (k.startsWith("pond")) return 0;
      if (k.startsWith("chennai")) return 1;
      return 2;
    };
    return [...m.values()].sort((a, b) => rank(a.key) - rank(b.key) || a.label.localeCompare(b.label));
  }, [activeClients]);

  // No "All" option — default to the first branch (Pondicherry)
  const activeBranch = branches.some((b) => b.key === branchFilter) ? branchFilter : branches[0]?.key || "all";

  // One column per executive: their active clients
  const columns = useMemo(() => {
    const executives = (users || []).filter(isSocialMediaExecutive);
    const map = new Map(executives.map((u) => [u._id.toString(), { user: u, clients: [] }]));

    activeClients
      .filter((c) => activeBranch === "all" || (c.branch || "").trim().toLowerCase() === activeBranch)
      .forEach((c) => {
        const members = (Array.isArray(c.assignedTo) ? c.assignedTo : c.assignedTo ? [c.assignedTo] : [])
          .map((m) => usersById.get((m?._id || m)?.toString()) || (typeof m === "object" ? m : null))
          .filter(Boolean);

        members.forEach((m) => {
          const col = map.get(m._id?.toString());
          if (!col) return;
          col.clients.push(c);
        });
      });

    return [...map.values()]
      // Hide executives with no clients in the selected branch
      .filter((col) => col.clients.length > 0)
      .map((col) => {
        col.clients.sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""));
        return { ...col, shown: col.clients };
      })
      .sort((a, b) => b.clients.length - a.clients.length || a.user.name.localeCompare(b.user.name));
  }, [activeClients, users, usersById, activeBranch]);

  const handleDrop = async (toUserId) => {
    const drag = dragging;
    setDragging(null);
    setDropTarget(null);
    if (!drag || drag.fromUserId === toUserId) return;

    const client = clients.find((c) => c._id === drag.clientId);
    if (!client) return;
    const assignedIds = (Array.isArray(client.assignedTo) ? client.assignedTo : [client.assignedTo])
      .filter(Boolean)
      .map((m) => (m?._id || m).toString());
    if (assignedIds.includes(toUserId)) {
      toast.error(`${client.companyName} is already with this executive`);
      return;
    }

    // Ask for confirmation in the custom modal
    setPendingMove({
      client,
      assignedIds,
      fromUserId: drag.fromUserId,
      toUserId,
      fromUser: usersById.get(drag.fromUserId),
      toUser: usersById.get(toUserId),
    });
  };

  const confirmMove = async () => {
    const move = pendingMove;
    setPendingMove(null);
    if (!move) return;
    const { client, assignedIds, toUserId } = move;
    const drag = { fromUserId: move.fromUserId };
    const toName = move.toUser?.name || "new executive";

    // Optimistic update, rolled back on failure
    const prev = clients;
    const nextAssigned = [...assignedIds.filter((id) => id !== drag.fromUserId), toUserId];
    setClients((list) => list.map((c) => (c._id === client._id ? { ...c, assignedTo: nextAssigned } : c)));
    setSavingId(client._id);
    try {
      const res = await reassignClientAPI(client._id, drag.fromUserId, toUserId);
      if (res?.data) {
        setClients((list) => list.map((c) => (c._id === client._id ? res.data : c)));
        dispatch(clientReassigned(res.data));
      }
      // Keep the History tab in sync without refetching
      if (res?.history && historyLoaded) {
        setHistory((list) => [
          {
            ...res.history,
            fromUser: move.fromUser ? { _id: move.fromUser._id, name: move.fromUser.name } : res.history.fromUser,
            toUser: move.toUser ? { _id: move.toUser._id, name: move.toUser.name } : res.history.toUser,
            movedBy: currentUser ? { _id: currentUser._id, name: currentUser.name } : res.history.movedBy,
          },
          ...list,
        ]);
      }
      const moved = (res?.movedTasks || 0) + (res?.movedSubtasks || 0);
      toast.success(`${client.companyName} moved to ${toName}${moved ? ` · ${moved} open task(s) reassigned` : ""}`);
    } catch (e) {
      setClients(prev);
      toast.error(e?.response?.data?.message || "Failed to move client");
    } finally {
      setSavingId(null);
    }
  };

  // Props that make every cell of an executive column a drop zone
  const dropProps = (userId) =>
    canDrag
      ? {
          onDragOver: (e) => {
            if (!dragging) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTarget !== userId) setDropTarget(userId);
          },
          onDrop: (e) => {
            e.preventDefault();
            handleDrop(userId);
          },
        }
      : {};

  const colHighlight = (userId) =>
    dragging && dropTarget === userId && dragging.fromUserId !== userId
      ? "!bg-[color-mix(in_srgb,var(--color-brand-primary)_14%,transparent)]"
      : "";

  // Light accent colors need dark text on the gradient for readable contrast
  const { accentColor } = useTheme();
  const onAccent = ["neon-green", "lime"].includes(accentColor) ? "text-slate-900" : "text-white";

  const rowCount = Math.max(0, ...columns.map((c) => c.shown.length));
  const totalClients = columns.reduce((n, c) => n + c.clients.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 p-3 sm:p-4 lg:p-5 space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg bg-[image:var(--btn-gradient-bg)] flex items-center justify-center shadow-sm ${onAccent}`}>
            <LuSplit className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Client Split
            </h1>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Active clients handled by each Social Media Executive.
              {canDrag && " Drag a client to another executive to reassign it."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tabs: board / move history */}
          <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            {[
              { key: "split", label: "Client Split", icon: LuLayoutGrid },
              { key: "history", label: "Split Moved History", icon: LuHistory },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                  view === t.key
                    ? `bg-[image:var(--btn-gradient-bg)] ${onAccent} shadow-sm`
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="font-bold text-slate-900 dark:text-white">{columns.length}</span>{" "}
            <span className="text-slate-600 dark:text-slate-300">Executives</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="font-bold text-slate-900 dark:text-white">{totalClients}</span>{" "}
            <span className="text-slate-600 dark:text-slate-300">Clients</span>
          </div>
        </div>
      </div>

      {/* Split moved history */}
      {view === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/60 dark:shadow-black/30 overflow-hidden">
          <div className={`relative px-4 py-2 bg-[image:var(--btn-gradient-bg)] ${onAccent} flex items-center justify-between overflow-hidden`}>
            <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-2">
              <LuHistory className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase">Split Moved History</span>
            </div>
            <span className="relative text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/15">
              {historyRows.length} {historyRows.length === 1 ? "Move" : "Moves"}
            </span>
          </div>

          {/* Toolbar: order + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center p-0.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 w-fit">
              {[
                { key: "recent", label: "Recent" },
                { key: "past", label: "Past" },
              ].map((o) => (
                <button
                  key={o.key}
                  onClick={() => setHistoryOrder(o.key)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                    historyOrder === o.key
                      ? `bg-[var(--color-brand-primary)] ${onAccent}`
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search client or executive..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="p-12 text-center text-[12px] text-slate-400 animate-pulse">Loading move history...</div>
          ) : historyError ? (
            <div className="p-12 text-center text-[12px] text-rose-500">{historyError}</div>
          ) : historyRows.length === 0 ? (
            <div className="p-12 text-center text-[12px] text-slate-400">
              {history.length === 0 ? "No clients have been moved yet." : "No moves match your search."}
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-260px)]">
              <table className="w-full border-separate border-spacing-0 text-left text-[12px]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {["#", "Date & Time", "Client", "Branch", "From", "", "To", "Moved By", "Tasks Moved"].map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((r, i) => {
                    const rel = relativeDay(r.createdAt);
                    const tasks = (r.movedTasks || 0) + (r.movedSubtasks || 0);
                    return (
                      <tr
                        key={r._id || i}
                        className="even:bg-slate-50/60 dark:even:bg-white/[0.02] hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_7%,transparent)] transition-colors"
                      >
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">{formatDate(r.createdAt)}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatTime(r.createdAt)}
                            {rel && <span className="ml-1.5 text-[var(--color-brand-primary)] font-semibold">· {rel}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 font-semibold text-slate-900 dark:text-white">
                          {r.clientLabel}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {r.branch || "-"}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center">
                              {initials(r.fromLabel)}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200">{r.fromLabel}</span>
                          </span>
                        </td>
                        <td className="px-1 py-2 border-b border-slate-200 dark:border-slate-700/70">
                          <LuArrowRight className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                        </td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-6 h-6 rounded-full bg-[image:var(--btn-gradient-bg)] ${onAccent} text-[9px] font-bold flex items-center justify-center`}>
                              {initials(r.toLabel)}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">{r.toLabel}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {r.byLabel}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300">
                          {tasks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Branch filter */}
      {view === "split" && branches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <LuMapPin className="w-3.5 h-3.5" />
            Branch
          </span>
          {branches.map((b) => (
            <button
              key={b.key}
              onClick={() => setBranchFilter(b.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border ${
                activeBranch === b.key
                  ? `bg-[var(--color-brand-primary)] border-transparent ${onAccent}`
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--color-brand-primary)]"
              }`}
            >
              {b.label}
              <span className={`ml-1.5 ${activeBranch === b.key ? "opacity-80" : "text-slate-500 dark:text-slate-400"}`}>
                {b.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Premium sheet-style card */}
      <div className={`${view === "split" ? "" : "hidden"} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/60 dark:shadow-black/30 overflow-hidden`}>
        {loading ? (
          <div className="p-12 text-center text-[12px] text-slate-400 animate-pulse">Loading clients...</div>
        ) : error ? (
          <div className="p-12 text-center text-[12px] text-rose-500">{error}</div>
        ) : columns.length === 0 ? (
          <div className="p-12 text-center text-[12px] text-slate-400">No matching executives or clients.</div>
        ) : (
          <>
            {/* Title bar */}
            <div className={`relative px-4 py-2 bg-[image:var(--btn-gradient-bg)] ${onAccent} flex items-center justify-between overflow-hidden`}>
              <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-2">
                <LuUsers className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase">SM Team</span>
              </div>
              <span className="relative text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/15">
                {totalClients} Active Clients
              </span>
            </div>

            <div className="overflow-auto max-h-[calc(100vh-200px)]">
              <table className="client-split-table w-full border-separate border-spacing-0 text-center">
                <thead className="sticky top-0 z-10">
                  {/* Executive names */}
                  <tr>
                    {columns.map((col) => {
                      const src = getAvatar(col.user);
                      return (
                        <th
                          key={col.user._id}
                          {...dropProps(col.user._id.toString())}
                          className={`cs-exec min-w-[130px] px-2.5 pt-2.5 pb-2 bg-slate-50 dark:bg-slate-900 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700 font-normal transition-colors ${colHighlight(col.user._id.toString())}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {src ? (
                              <img
                                src={src}
                                alt={col.user.name}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--color-brand-primary)]/30"
                              />
                            ) : (
                              <div className={`cs-avatar ${onAccent === "text-slate-900" ? "cs-avatar-dark" : ""} w-8 h-8 rounded-full bg-[image:var(--btn-gradient-bg)] ${onAccent} text-[10px] font-bold flex items-center justify-center shadow-sm`}>
                                {initials(col.user.name)}
                              </div>
                            )}
                            <div className="cs-name text-[12px] font-bold text-slate-900 dark:text-white leading-tight">
                              {col.user.name}
                            </div>
                            <span className="cs-chip text-[10px] font-semibold px-1.5 py-px rounded-full text-slate-700 dark:text-slate-100 bg-[color-mix(in_srgb,var(--color-brand-primary)_18%,transparent)]">
                              {col.clients.length} {col.clients.length === 1 ? "client" : "clients"}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount }).map((_, i) => (
                    <tr
                      key={i}
                      className="group even:bg-slate-50/60 dark:even:bg-white/[0.02] hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_7%,transparent)] transition-colors"
                    >
                      {columns.map((col) => {
                        const c = col.shown[i];
                        const colId = col.user._id.toString();
                        const isDraggingThis = dragging?.clientId === c?._id && dragging?.fromUserId === colId;
                        return (
                          <td
                            key={col.user._id}
                            title={c?.companyName}
                            {...dropProps(colId)}
                            className={`px-2.5 py-1.5 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700/70 text-[12px] text-slate-800 dark:text-slate-100 transition-colors ${colHighlight(colId)}`}
                          >
                            {c ? (
                              <div
                                draggable={canDrag && savingId !== c._id}
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData("text/plain", c._id);
                                  setDragging({ clientId: c._id, fromUserId: colId });
                                }}
                                onDragEnd={() => {
                                  setDragging(null);
                                  setDropTarget(null);
                                }}
                                className={`flex items-center justify-center gap-1.5 rounded-md ${
                                  canDrag ? "cursor-grab active:cursor-grabbing hover:bg-white/60 dark:hover:bg-white/5" : ""
                                } ${isDraggingThis ? "opacity-40" : ""} ${savingId === c._id ? "animate-pulse" : ""}`}
                              >
                                {canDrag ? (
                                  <LuGripVertical className="w-3 h-3 shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <span className="w-1 h-1 rounded-full shrink-0 bg-[var(--color-brand-primary)] opacity-60 group-hover:opacity-100 transition-opacity" />
                                )}
                                <span className="font-medium truncate max-w-[130px]">{c.companyName}</span>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Move confirmation modal */}
      {pendingMove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setPendingMove(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-client-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`relative px-5 py-4 bg-[image:var(--btn-gradient-bg)] ${onAccent} overflow-hidden`}>
              <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuArrowRightLeft className="w-4 h-4" />
                  <h2 id="move-client-title" className="text-sm font-bold tracking-tight">
                    Reassign Client
                  </h2>
                </div>
                <button
                  onClick={() => setPendingMove(null)}
                  className="p-1 rounded-md hover:bg-black/10 cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Client */}
              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Client
                </div>
                <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                  {pendingMove.client.companyName}
                </div>
                {pendingMove.client.branch && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <LuMapPin className="w-3 h-3" />
                    {pendingMove.client.branch}
                  </div>
                )}
              </div>

              {/* From -> To */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3">
                {[
                  { label: "From", user: pendingMove.fromUser },
                  null,
                  { label: "To", user: pendingMove.toUser },
                ].map((side, idx) =>
                  side === null ? (
                    <div
                      key="arrow"
                      className={`shrink-0 w-8 h-8 rounded-full bg-[image:var(--btn-gradient-bg)] ${onAccent} flex items-center justify-center shadow-sm`}
                    >
                      <LuArrowRight className="w-4 h-4" />
                    </div>
                  ) : (
                    <div key={idx} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                      {getAvatar(side.user) ? (
                        <img
                          src={getAvatar(side.user)}
                          alt={side.user?.name}
                          className={`w-10 h-10 rounded-full object-cover ring-2 ${
                            side.label === "To" ? "ring-[var(--color-brand-primary)]" : "ring-slate-200 dark:ring-slate-700"
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            side.label === "To"
                              ? `bg-[image:var(--btn-gradient-bg)] ${onAccent}`
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
                          }`}
                        >
                          {initials(side.user?.name)}
                        </div>
                      )}
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{side.label}</div>
                      <div className="text-[12px] font-bold text-slate-900 dark:text-white truncate max-w-full">
                        {side.user?.name || "Unknown"}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* What happens */}
              <ul className="space-y-1.5 text-[12px] text-slate-600 dark:text-slate-300">
                {[
                  `Client page will show ${pendingMove.toUser?.name || "the new executive"} instead of ${pendingMove.fromUser?.name || "the old executive"}`,
                  "All projects of this client move automatically",
                  "Open tasks are reassigned · completed tasks keep their history",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <LuCircleCheck className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--color-brand-primary)]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setPendingMove(null)}
                className="px-4 py-1.5 rounded-lg text-[12px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                autoFocus
                onClick={confirmMove}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[image:var(--btn-gradient-bg)] ${onAccent} shadow-sm hover:opacity-90 cursor-pointer transition-opacity inline-flex items-center gap-1.5`}
              >
                <LuArrowRightLeft className="w-3.5 h-3.5" />
                Move Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSplit;
