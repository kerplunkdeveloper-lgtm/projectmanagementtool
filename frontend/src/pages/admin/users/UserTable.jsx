import React from "react";
import { FiEdit2, FiTrash2, FiMail, FiShield, FiUsers, FiLogIn, FiSliders } from "react-icons/fi";
import { useSelector } from "react-redux";

const ROLE_STYLE = {
  admin:            "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  operationmanager: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
  team:             "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
};

const AVATAR_COLORS = [
  "from-violet-400 to-indigo-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
];

const avatarGrad = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const UserTable = ({ users, loading, handleDeleteUser, setOpenModal, setEditUser, handleImpersonate, isReadOnly, setOpenPermissionsModal, setPermissionsUser }) => {
  const handleEdit = (user) => { setEditUser(user); setOpenModal(true); };
  const handlePermissions = (user) => { setPermissionsUser(user); setOpenPermissionsModal(true); };
  const { user: currentUser } = useSelector((state) => state.auth);

  const userPerms = currentUser?.permissions?.['manage_users'];
  const canUpdate = currentUser?.role === 'admin' || userPerms === true || userPerms?.update;
  const canDelete = currentUser?.role === 'admin' || userPerms === true || userPerms?.delete;

  const rolesPerms = currentUser?.permissions?.['manage_roles'];
  const canManageRoles = currentUser?.role === 'admin' || rolesPerms === true || rolesPerms?.update;

  return (
    <div className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden bg-white dark:bg-[#0f172a] transition-all">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          {/* HEADER */}
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-800/30">
              {["User", "Email", "Role", "Department", !isReadOnly && "Actions"].filter(Boolean).map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={isReadOnly ? "4" : "5"} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-cyan-100 dark:border-slate-700 border-t-cyan-500 dark:border-t-cyan-400 rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 dark:text-slate-500">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : users?.length > 0 ? (
              users.map((user, idx) => (
                <tr key={user._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                  {/* USER */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGrad(user.name)} flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm`}>
                          {user?.profile?.profileImage?.url
                            ? <img src={user.profile.profileImage.url} alt="profile" className="w-full h-full object-cover" />
                            : user?.name?.charAt(0)
                          }
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500 border-2 border-white dark:border-[#0f172a]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">#{idx + 1}</p>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <FiMail size={11} className="text-gray-400 dark:text-slate-500 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-slate-300 truncate max-w-[180px]">{user.email}</span>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ROLE_STYLE[user.role] || ROLE_STYLE.team}`}>
                      <FiShield size={9} />
                      {user.role}
                    </span>
                  </td>

                  {/* DEPT */}
                  <td className="px-4 py-3">
                    {user.role === "team" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20">
                        <FiUsers size={9} /> {user.department}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-all"
                            title="Edit"
                          >
                            <FiEdit2 size={12} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all"
                            title="Delete"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                        {canManageRoles && (
                          <button
                            onClick={() => handlePermissions(user)}
                            className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all"
                            title="Roles & Permissions"
                          >
                            <FiSliders size={12} />
                          </button>
                        )}
                        {currentUser && currentUser.role === 'admin' && currentUser.id !== user._id && currentUser._id !== user._id && (
                          <button
                            onClick={() => handleImpersonate(user._id)}
                            className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-all"
                            title="Login As"
                          >
                            <FiLogIn size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isReadOnly ? "4" : "5"} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                      <FiUsers size={18} className="text-gray-300 dark:text-slate-500" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">No Users Found</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">Users will appear here once added.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;