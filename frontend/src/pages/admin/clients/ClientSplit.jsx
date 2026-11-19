import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuSplit, LuUsers, LuMapPin } from "react-icons/lu";
import { useTheme } from "../../../context/ThemeContext";
import { getUsers } from "../../../features/users/userSlice";
import { getClientsAPI } from "../../../features/clients/clientApi";

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

const isDesigner = (u) => {
  if (!u) return false;
  const v = `${u.department || ""} ${u.designation || ""}`.toLowerCase();
  return v.includes("graphic") || v.includes("designer");
};

const ClientSplit = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((s) => s.users);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

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
    return [...m.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [activeClients]);

  // One column per executive: their active clients + designers working on those clients
  const columns = useMemo(() => {
    const executives = (users || []).filter(isSocialMediaExecutive);
    const map = new Map(
      executives.map((u) => [u._id.toString(), { user: u, clients: [], designers: new Map() }])
    );

    activeClients
      .filter((c) => branchFilter === "all" || (c.branch || "").trim().toLowerCase() === branchFilter)
      .forEach((c) => {
        const members = (Array.isArray(c.assignedTo) ? c.assignedTo : c.assignedTo ? [c.assignedTo] : [])
          .map((m) => usersById.get((m?._id || m)?.toString()) || (typeof m === "object" ? m : null))
          .filter(Boolean);
        const designers = members.filter(isDesigner);

        members.forEach((m) => {
          const col = map.get(m._id?.toString());
          if (!col) return;
          col.clients.push(c);
          designers.forEach((d) => col.designers.set(d._id.toString(), d.name));
        });
      });

    return [...map.values()]
      .filter((col) => branchFilter === "all" || col.clients.length > 0)
      .map((col) => {
        col.clients.sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""));
        return { ...col, shown: col.clients };
      })
      .sort((a, b) => b.clients.length - a.clients.length || a.user.name.localeCompare(b.user.name));
  }, [activeClients, users, usersById, branchFilter]);

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
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* Branch filter */}
      {branches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <LuMapPin className="w-3.5 h-3.5" />
            Branch
          </span>
          {[{ key: "all", label: "All", count: activeClients.length }, ...branches].map((b) => (
            <button
              key={b.key}
              onClick={() => setBranchFilter(b.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border ${
                branchFilter === b.key
                  ? `bg-[var(--color-brand-primary)] border-transparent ${onAccent}`
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--color-brand-primary)]"
              }`}
            >
              {b.label}
              <span className={`ml-1.5 ${branchFilter === b.key ? "opacity-80" : "text-slate-500 dark:text-slate-400"}`}>
                {b.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Premium sheet-style card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/60 dark:shadow-black/30 overflow-hidden">
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
                          className="cs-exec min-w-[130px] px-2.5 pt-2.5 pb-2 bg-slate-50 dark:bg-slate-900 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700 font-normal"
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
                  {/* Designers */}
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.user._id}
                        className="cs-designer px-2.5 py-1.5 bg-orange-50 dark:bg-orange-950/40 border-b-2 border-r last:border-r-0 border-b-orange-300 dark:border-b-orange-800/60 border-r-slate-200 dark:border-r-slate-700 font-normal"
                      >
                        {col.designers.size > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {[...col.designers.values()].map((n) => (
                              <span
                                key={n}
                                className="cs-pill px-1.5 py-px rounded-full text-[10px] font-bold text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/40"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="cs-dash text-[11px] text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </th>
                    ))}
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
                        return (
                          <td
                            key={col.user._id}
                            title={c?.companyName}
                            className="px-2.5 py-1.5 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700/70 text-[12px] text-slate-800 dark:text-slate-100"
                          >
                            {c ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="w-1 h-1 rounded-full shrink-0 bg-[var(--color-brand-primary)] opacity-60 group-hover:opacity-100 transition-opacity" />
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
    </div>
  );
};

export default ClientSplit;
