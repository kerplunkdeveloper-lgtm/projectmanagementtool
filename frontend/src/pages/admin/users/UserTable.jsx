import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSocketContext } from "../../../context/SocketContext";
import {
  FiEdit2,
  FiTrash2,
  FiMail,
  FiShield,
  FiUsers,
  FiSliders,
  FiCopy,
  FiCheck,
  FiUserMinus,
  FiUserCheck,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useSelector } from "react-redux";

/* ─── Robust Avatar URL extractor ────────────────────────────── */
const getUserAvatarUrl = (user) => {
  if (!user) return null;
  const p = user.profile;
  const img =
    (typeof p?.profileImage === "object" ? p?.profileImage?.url : p?.profileImage) ||
    (typeof user.profileImage === "object" ? user.profileImage?.url : user.profileImage) ||
    p?.avatar ||
    p?.profilePic ||
    user.avatar ||
    user.profilePic;
  return typeof img === "string" && img.trim() ? img.trim() : null;
};

/* ─── Role badge configs ─────────────────────────────────────── */
const ROLE_STYLE = {
  admin: {
    badge:
      "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-transparent",
    dot: "bg-rose-500 dark:bg-rose-400",
    text: "Admin",
  },
  operationmanager: {
    badge:
      "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-transparent",
    dot: "bg-violet-500 dark:bg-violet-400",
    text: "Ops Manager",
  },
  team: {
    badge:
      "bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-transparent",
    dot: "bg-cyan-500 dark:bg-cyan-400",
    text: "Team Member",
  },
  humanresource: {
    badge:
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-transparent",
    dot: "bg-amber-500 dark:bg-amber-400",
    text: "Human Resource",
  },
  socialmediamanager: {
    badge:
      "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-transparent",
    dot: "bg-orange-500 dark:bg-orange-400",
    text: "Social Media Manager",
  },
  socialmediahead: {
    badge:
      "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-transparent",
    dot: "bg-orange-500 dark:bg-orange-400",
    text: "Social Media Manager",
  },
};

/* ─── Department badge colors ────────────────────────────────── */
const DEPT_KEYWORDS = [
  {
    key: "social media head",
    cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-transparent",
  },
  {
    key: "smm head",
    cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-transparent",
  },
  {
    key: "marketing",
    cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-transparent",
  },
  {
    key: "sales",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-transparent",
  },
  {
    key: "engineering",
    cls: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-transparent",
  },
  {
    key: "design",
    cls: "bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-transparent",
  },
  {
    key: "graphic",
    cls: "bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-transparent",
  },
  {
    key: "video",
    cls: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-transparent",
  },
  {
    key: "editor",
    cls: "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-transparent",
  },
  {
    key: "web",
    cls: "bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-transparent",
  },
  {
    key: "social",
    cls: "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-transparent",
  },
  {
    key: "seo",
    cls: "bg-lime-100 text-lime-700 border border-lime-200 dark:bg-lime-500/15 dark:text-lime-300 dark:border-transparent",
  },
  {
    key: "performance",
    cls: "bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-transparent",
  },
  {
    key: "hr",
    cls: "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-transparent",
  },
  {
    key: "finance",
    cls: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-transparent",
  },
];

const getDeptStyle = (dept) => {
  if (!dept) return "";
  const n = dept.toLowerCase().trim();
  const match = DEPT_KEYWORDS.find(({ key }) => n.includes(key));
  return (
    match?.cls ||
    "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-600/20 dark:text-slate-300 dark:border-transparent"
  );
};

/* ─── Avatar gradient pool ───────────────────────────────────── */
const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
];
const avatarGrad = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

/* ─── Tooltip action button (Memoized) ───────────────────────── */
const ActionBtn = React.memo(({ onClick, label, colorClass, children }) => (
  <div className="relative group/tip">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${colorClass}`}
    >
      {children}
    </button>
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-white bg-slate-900 dark:bg-slate-700 rounded-lg shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
      {label}
    </span>
  </div>
));

/* ─── Fast Individual Table Row (Desktop - Memoized) ──────────── */
const UserTableRow = React.memo(
  ({
    user,
    currentUser,
    isOnline,
    isReadOnly,
    isHr,
    isSMM,
    canUpdate,
    canDelete,
    canRelieve,
    canManageRoles,
    onEdit,
    onPermissions,
    onRequestRelieve,
    onRequestReactivate,
    onDeleteUser,
  }) => {
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPass, setCopiedPass] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [imgError, setImgError] = useState(false);

    const avatarUrl = useMemo(() => getUserAvatarUrl(user), [user]);

    useEffect(() => {
      setImgError(false);
    }, [avatarUrl]);

    const handleCopyEmail = useCallback(
      (e) => {
        e.stopPropagation();
        if (!user.email) return;
        navigator.clipboard.writeText(user.email);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      },
      [user.email],
    );

    const handleCopyPass = useCallback(
      (e) => {
        e.stopPropagation();
        if (!user.plainPassword) return;
        navigator.clipboard.writeText(user.plainPassword);
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      },
      [user.plainPassword],
    );

    const togglePassword = useCallback((e) => {
      e.stopPropagation();
      setShowPass((prev) => !prev);
    }, []);

    const roleCfg = ROLE_STYLE[user.role] || ROLE_STYLE.team;
    const isRelieved =
      user.employmentStatus === "relieved" ||
      user.accountStatus === "inactive";

    const isRowAdmin =
      user.role === "admin" ||
      user.role?.toLowerCase() === "admin" ||
      user.role?.toLowerCase()?.includes("admin") ||
      user.role?.toLowerCase() === "managingpartner" ||
      user.role?.toLowerCase() === "managing partner" ||
      user.department?.toLowerCase() === "admin" ||
      user.department?.toLowerCase()?.includes("managing partner");

    const hideActionsForUser =
      isRowAdmin && (isHr || currentUser?.role !== "admin");

    const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
    const rowUserId = (user._id || user.id)?.toString();
    const isSelf = currentUserId === rowUserId;

    return (
      <tr
        className={`group transition-colors duration-150 ${
          isRelieved
            ? "bg-slate-50/40 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 opacity-75"
            : "hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
        }`}
      >
        {/* ── USER ─────────────────────────────────── */}
        <td className="px-5 py-3.5 align-middle">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad(
                  user.name,
                )} flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-150 ${
                  isRelieved ? "grayscale" : ""
                }`}
              >
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={user.name || "User"}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              {/* Online indicator dot */}
              {!isRelieved && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 transition-colors duration-200 ${
                    isOnline ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
              )}
            </div>

            {/* Name */}
            <div>
              <p
                className={`text-[13px] font-bold leading-tight ${
                  isRelieved
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {user.name}
              </p>
            </div>
          </div>
        </td>

        {/* ── EMAIL ────────────────────────────────── */}
        {!isSMM && (
          <td className="px-5 py-3.5 align-middle">
            <div className="flex items-center gap-2">
              <FiMail
                size={12}
                className="text-slate-400 dark:text-slate-500 shrink-0"
              />
              <span className="text-[12.5px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                {user.email}
              </span>
              {/* Copy Email button */}
              <button
                type="button"
                onClick={handleCopyEmail}
                title="Copy email"
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150 cursor-pointer"
              >
                {copiedEmail ? (
                  <FiCheck size={11} className="text-emerald-500" />
                ) : (
                  <FiCopy size={11} />
                )}
              </button>
            </div>

            {user.plainPassword && !hideActionsForUser && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  PWD:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] font-semibold tracking-wide">
                  {showPass ? user.plainPassword : "••••••••"}
                </span>
                <button
                  type="button"
                  onClick={togglePassword}
                  title={showPass ? "Hide password" : "Show password"}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPass ? <FiEyeOff size={11} /> : <FiEye size={11} />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPass}
                  title="Copy password"
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedPass ? (
                    <FiCheck size={11} className="text-emerald-500" />
                  ) : (
                    <FiCopy size={11} />
                  )}
                </button>
              </div>
            )}
          </td>
        )}

        {/* ── LOCATION ─────────────────────────────── */}
        <td className="px-5 py-3.5 align-middle">
          {user.location ? (
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 dark:text-slate-300">
              <FaMapMarkerAlt size={14} className="text-red-500 shrink-0" />
              <span className="truncate max-w-[150px]">{user.location}</span>
            </div>
          ) : (
            <span className="text-slate-300 dark:text-slate-600 text-sm font-semibold">
              —
            </span>
          )}
        </td>

        {/* ── ROLE ─────────────────────────────────── */}
        {!isSMM && (
          <td className="px-5 py-3.5 align-middle">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-bold border ${roleCfg.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dot}`} />
              <FiShield size={10} />
              {roleCfg.text}
            </span>
          </td>
        )}

        {/* ── DEPARTMENT ───────────────────────────── */}
        <td className="px-5 py-3.5 align-middle">
          {user.department ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-bold border ${getDeptStyle(
                user.department,
              )}`}
            >
              <FiUsers size={10} />
              {user.department === "Social Media Manager" ? "Social Media Executive" : user.department}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600 text-sm font-semibold">
              —
            </span>
          )}
        </td>

        {/* ── STATUS ───────────────────────────────── */}
        <td className="px-5 py-3.5 align-middle">
          {isRelieved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-black border bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-400" />
              Relieved
            </span>
          ) : isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-black border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-transparent">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-black border bg-red-500 text-white border-red-500 dark:bg-red-500 dark:text-white dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-500" />
              Offline
            </span>
          )}
        </td>

        {/* ── ACTIONS ──────────────────────────────── */}
        {!isReadOnly && !isSMM && (
          <td className="px-5 py-3.5 align-middle">
            {hideActionsForUser ? (
              <span className="text-slate-300 dark:text-slate-600 text-sm font-semibold select-none">
                —
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {!isRelieved ? (
                  <>
                    {canUpdate && (
                      <ActionBtn
                        onClick={() => onEdit(user)}
                        label="Edit User"
                        colorClass="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/35"
                      >
                        <FiEdit2 size={13} />
                      </ActionBtn>
                    )}

                    {canManageRoles && (
                      <ActionBtn
                        onClick={() => onPermissions(user)}
                        label="Permissions"
                        colorClass="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/35"
                      >
                        <FiSliders size={13} />
                      </ActionBtn>
                    )}

                    {canRelieve && user.role !== "admin" && !isSelf && (
                      <ActionBtn
                        onClick={() => onRequestRelieve(user)}
                        label="Relieve User"
                        colorClass="bg-slate-200 text-slate-800 dark:bg-black dark:text-white"
                      >
                        <FiUserMinus size={13} />
                      </ActionBtn>
                    )}
                  </>
                ) : (
                  <>
                    {canRelieve && (
                      <ActionBtn
                        onClick={() => onRequestReactivate(user)}
                        label="Reactivate User"
                        colorClass="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/35"
                      >
                        <FiUserCheck size={13} />
                      </ActionBtn>
                    )}
                  </>
                )}

                {canDelete && (
                  <ActionBtn
                    onClick={() => onDeleteUser(user)}
                    label="Delete User"
                    colorClass="bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/35"
                  >
                    <FiTrash2 size={13} />
                  </ActionBtn>
                )}
              </div>
            )}
          </td>
        )}
      </tr>
    );
  },
);

/* ─── Premium Mobile Card Component (Memoized) ───────────────── */
const UserMobileCard = React.memo(
  ({
    user,
    currentUser,
    isOnline,
    isReadOnly,
    isHr,
    isSMM,
    canUpdate,
    canDelete,
    canRelieve,
    canManageRoles,
    onEdit,
    onPermissions,
    onRequestRelieve,
    onRequestReactivate,
    onDeleteUser,
  }) => {
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPass, setCopiedPass] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [imgError, setImgError] = useState(false);

    const avatarUrl = useMemo(() => getUserAvatarUrl(user), [user]);

    useEffect(() => {
      setImgError(false);
    }, [avatarUrl]);

    const handleCopyEmail = useCallback(
      (e) => {
        e.stopPropagation();
        if (!user.email) return;
        navigator.clipboard.writeText(user.email);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      },
      [user.email],
    );

    const handleCopyPass = useCallback(
      (e) => {
        e.stopPropagation();
        if (!user.plainPassword) return;
        navigator.clipboard.writeText(user.plainPassword);
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      },
      [user.plainPassword],
    );

    const togglePassword = useCallback((e) => {
      e.stopPropagation();
      setShowPass((prev) => !prev);
    }, []);

    const roleCfg = ROLE_STYLE[user.role] || ROLE_STYLE.team;
    const isRelieved =
      user.employmentStatus === "relieved" ||
      user.accountStatus === "inactive";

    const isRowAdmin =
      user.role === "admin" ||
      user.role?.toLowerCase() === "admin" ||
      user.role?.toLowerCase()?.includes("admin") ||
      user.role?.toLowerCase() === "managingpartner" ||
      user.role?.toLowerCase() === "managing partner" ||
      user.department?.toLowerCase() === "admin" ||
      user.department?.toLowerCase()?.includes("managing partner");

    const hideActionsForUser =
      isRowAdmin && (isHr || currentUser?.role !== "admin");

    const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
    const rowUserId = (user._id || user.id)?.toString();
    const isSelf = currentUserId === rowUserId;

    return (
      <div
        className={`bg-white dark:bg-[#111827] rounded-2xl p-4 border transition-all duration-200 shadow-sm space-y-3 ${
          isRelieved
            ? "border-slate-200/60 dark:border-slate-800/60 opacity-80"
            : "border-slate-200/90 dark:border-0 hover:border-slate-300"
        }`}
      >
        {/* Top: Avatar, Name & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGrad(
                  user.name,
                )} flex items-center justify-center text-white font-bold text-base overflow-hidden shadow-sm ${
                  isRelieved ? "grayscale" : ""
                }`}
              >
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={user.name || "User"}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              {!isRelieved && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111827] ${
                    isOnline ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
              )}
            </div>

            {/* Name & Role */}
            <div className="min-w-0">
              <h4
                className={`text-sm font-bold truncate leading-tight ${
                  isRelieved
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {user.name}
              </h4>
              {!isSMM && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${roleCfg.badge}`}
                  >
                    <FiShield size={9} />
                    {roleCfg.text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isRelieved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-700 dark:bg-[#1a2234] dark:text-slate-300 border border-slate-200 dark:border-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Relieved
              </span>
            ) : isOnline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-transparent">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-[#1a2234] dark:text-slate-400 border border-slate-200 dark:border-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Info Box: Email & Password */}
        <div className="bg-slate-50 dark:bg-[#1a2234] rounded-xl p-2.5 space-y-1.5 border border-slate-200/60 dark:border-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-300">
              <FiMail size={12} className="text-slate-400 shrink-0" />
              <span className="truncate text-xs font-medium">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 cursor-pointer"
              title="Copy email"
            >
              {copiedEmail ? (
                <FiCheck size={12} className="text-emerald-500" />
              ) : (
                <FiCopy size={12} />
              )}
            </button>
          </div>

          {user.plainPassword && !hideActionsForUser && (
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  PWD:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-xs">
                  {showPass ? user.plainPassword : "••••••••"}
                </span>
                <button
                  type="button"
                  onClick={togglePassword}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPass ? <FiEyeOff size={11} /> : <FiEye size={11} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleCopyPass}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                title="Copy password"
              >
                {copiedPass ? (
                  <FiCheck size={12} className="text-emerald-500" />
                ) : (
                  <FiCopy size={12} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Dept & Location tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {user.department && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border ${getDeptStyle(
                user.department,
              )}`}
            >
              <FiUsers size={10} />
              {user.department === "Social Media Manager" ? "Social Media Executive" : user.department}
            </span>
          )}

          {user.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <FaMapMarkerAlt size={10} className="text-red-500" />
              {user.location}
            </span>
          )}
        </div>

        {/* Action Buttons Row */}
        {!isReadOnly && !hideActionsForUser && !isSMM && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-1.5 flex-wrap">
            {!isRelieved ? (
              <>
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <FiEdit2 size={12} />
                    <span>Edit</span>
                  </button>
                )}

                {canManageRoles && (
                  <button
                    type="button"
                    onClick={() => onPermissions(user)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <FiSliders size={12} />
                    <span>Permissions</span>
                  </button>
                )}

                {canRelieve && user.role !== "admin" && !isSelf && (
                  <button
                    type="button"
                    onClick={() => onRequestRelieve(user)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <FiUserMinus size={12} />
                    <span>Relieve</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {canRelieve && (
                  <button
                    type="button"
                    onClick={() => onRequestReactivate(user)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <FiUserCheck size={12} />
                    <span>Reactivate</span>
                  </button>
                )}
              </>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDeleteUser(user)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <FiTrash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);

/* ═══════════════════════════════════════════════════════════════ */
const UserTable = React.memo(
  ({
    users,
    loading,
    handleDeleteUser,
    handleRequestRelieve,
    handleRequestReactivate,
    setOpenModal,
    setEditUser,
    isReadOnly,
    isSocialMediaManager = false,
    setOpenPermissionsModal,
    setPermissionsUser,
  }) => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const location = useLocation();

    // Online presence lookup - converted to a Set for instantaneous O(1) checks
    const { onlineUserIds, isOnline } = useSocketContext() || {
      onlineUserIds: [],
      isOnline: () => false,
    };

    const onlineSet = useMemo(() => {
      return new Set((onlineUserIds || []).map((id) => id?.toString()));
    }, [onlineUserIds]);

    const handleEdit = useCallback(
      (u) => {
        setEditUser(u);
        setOpenModal(true);
      },
      [setEditUser, setOpenModal],
    );

    const handlePermissions = useCallback(
      (u) => {
        setPermissionsUser(u);
        setOpenPermissionsModal(true);
      },
      [setPermissionsUser, setOpenPermissionsModal],
    );

    const deptLower = (currentUser?.department || "").toLowerCase();
    const roleLower = (currentUser?.role || "").toLowerCase();
    const isSMM = useMemo(
      () =>
        Boolean(isSocialMediaManager) ||
        location.pathname.includes("/socialmediamanager") ||
        roleLower === "socialmediamanager" ||
        roleLower === "socialmediahead" ||
        deptLower.includes("social media head"),
      [isSocialMediaManager, location.pathname, roleLower, deptLower]
    );

    const isHr = useMemo(
      () =>
        location.pathname.includes("/humanresource") ||
        roleLower === "humanresource" ||
        roleLower === "hr" ||
        deptLower.includes("hr") ||
        deptLower.includes("human resource"),
      [location.pathname, roleLower, deptLower],
    );

    const userPerms = currentUser?.permissions?.["manage_users"];
    const canUpdate = useMemo(
      () =>
        currentUser?.role === "admin" ||
        currentUser?.role === "operationmanager" ||
        userPerms === true ||
        Boolean(userPerms?.update) ||
        Boolean(userPerms?.write),
      [currentUser?.role, userPerms],
    );

    const canDelete = useMemo(
      () =>
        currentUser?.role === "admin" ||
        currentUser?.role === "operationmanager" ||
        userPerms === true ||
        Boolean(userPerms?.delete) ||
        Boolean(userPerms?.write),
      [currentUser?.role, userPerms],
    );

    const canRelieve = useMemo(
      () =>
        currentUser?.role === "admin" ||
        currentUser?.role === "operationmanager" ||
        userPerms === true ||
        Boolean(userPerms?.update) ||
        Boolean(userPerms?.write),
      [currentUser?.role, userPerms],
    );

    const rolesPerms = currentUser?.permissions?.["manage_roles"];
    const canManageRoles = useMemo(
      () =>
        currentUser?.role === "admin" ||
        currentUser?.role === "operationmanager" ||
        rolesPerms === true ||
        Boolean(rolesPerms?.update),
      [currentUser?.role, rolesPerms],
    );

    const colSpan = isSMM ? 4 : isReadOnly ? 6 : 7;

    return (
      <div className="w-full">
        {/* ── MOBILE CARD VIEW (Phones & small screens < md) ── */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 border border-slate-200 dark:border-0 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
                  Loading users…
                </span>
              </div>
            </div>
          ) : users?.length > 0 ? (
            users.map((user) => {
              const uid = (user._id || user.id)?.toString();
              const userIsOnline =
                onlineSet.has(uid) ||
                (isOnline && isOnline(uid)) ||
                user.presenceStatus === "online";

              return (
                <UserMobileCard
                  key={user._id || user.id}
                  user={user}
                  currentUser={currentUser}
                  isOnline={Boolean(userIsOnline)}
                  isReadOnly={isReadOnly}
                  isHr={isHr}
                  isSMM={isSMM}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  canRelieve={canRelieve}
                  canManageRoles={canManageRoles}
                  onEdit={handleEdit}
                  onPermissions={handlePermissions}
                  onRequestRelieve={handleRequestRelieve}
                  onRequestReactivate={handleRequestReactivate}
                  onDeleteUser={handleDeleteUser}
                />
              );
            })
          ) : (
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 border border-slate-200 dark:border-0 text-center">
              <div className="flex flex-col items-center gap-3.5 max-w-xs mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <FiUsers
                    size={22}
                    className="text-slate-400 dark:text-slate-500"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No users found
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Adjust your filters or add a new user.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW (Tablets & Desktops >= md) ── */}
        <div className="hidden md:block rounded-2xl overflow-hidden border border-slate-200 dark:border-0 bg-white dark:bg-[#111827] shadow-md dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              {/* ── HEADER ─────────────────────────────────────────── */}
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-100 dark:border-white/5">
                  {(isSMM
                    ? ["User", "Location", "Department", "Status"]
                    : [
                        "User",
                        "Email Address",
                        "Location",
                        "Role",
                        "Department",
                        "Status",
                        !isReadOnly && "Actions",
                      ]
                  )
                    .filter(Boolean)
                    .map((h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-left text-[12px] font-bold text-slate-400 dark:text-slate-500 select-none"
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>

              {/* ── BODY ───────────────────────────────────────────── */}
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
                          Loading users…
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : users?.length > 0 ? (
                  users.map((user) => {
                    const uid = (user._id || user.id)?.toString();
                    const userIsOnline =
                      onlineSet.has(uid) ||
                      (isOnline && isOnline(uid)) ||
                      user.presenceStatus === "online";

                    return (
                      <UserTableRow
                        key={user._id || user.id}
                        user={user}
                        currentUser={currentUser}
                        isOnline={Boolean(userIsOnline)}
                        isReadOnly={isReadOnly}
                        isHr={isHr}
                        isSMM={isSMM}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        canRelieve={canRelieve}
                        canManageRoles={canManageRoles}
                        onEdit={handleEdit}
                        onPermissions={handlePermissions}
                        onRequestRelieve={handleRequestRelieve}
                        onRequestReactivate={handleRequestReactivate}
                        onDeleteUser={handleDeleteUser}
                      />
                    );
                  })
                ) : (
                  /* Empty state */
                  <tr>
                    <td colSpan={colSpan} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3.5 max-w-xs mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <FiUsers
                            size={22}
                            className="text-slate-400 dark:text-slate-500"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            No users found
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Adjust your filters or add a new user.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
);

export default UserTable;
