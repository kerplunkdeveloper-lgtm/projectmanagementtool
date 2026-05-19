import React from "react";
import { FiEdit2, FiTrash2, FiMail, FiShield, FiUsers } from "react-icons/fi";

const ROLE_STYLE = {
  admin:            "bg-rose-50 text-rose-600 border-rose-200",
  operationmanager: "bg-violet-50 text-violet-600 border-violet-200",
  team:             "bg-cyan-50 text-cyan-600 border-cyan-200",
};

const AVATAR_COLORS = [
  "from-violet-400 to-indigo-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
];

const avatarGrad = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const UserTable = ({ users, loading, handleDeleteUser, setOpenModal, setEditUser }) => {
  const handleEdit = (user) => { setEditUser(user); setOpenModal(true); };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          {/* HEADER */}
          <thead>
            <tr className="border-b border-gray-100 bg-gradient-to-r
                          from-cyan-500
                          to-blue-600 ">
              {["User", "Email", "Role", "Department", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : users?.length > 0 ? (
              users.map((user, idx) => (
                <tr key={user._id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* USER */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGrad(user.name)} flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
                          {user?.profile?.profileImage?.url
                            ? <img src={user.profile.profileImage.url} alt="profile" className="w-full h-full object-cover" />
                            : user?.name?.charAt(0)
                          }
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{user.name}</p>
                        <p className="text-[10px] text-gray-400">#{idx + 1}</p>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <FiMail size={11} className="text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600 truncate max-w-[180px]">{user.email}</span>
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200">
                        <FiUsers size={9} /> {user.department}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(user)}
                        className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-all"
                        title="Edit"
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all"
                        title="Delete"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <FiUsers size={18} className="text-gray-300" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500">No Users Found</p>
                    <p className="text-[11px] text-gray-400">Users will appear here once added.</p>
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