import React from "react";

import {
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

const UserTable = ({
  users,
  loading,
  handleDeleteUser,
  setOpenModal,
  setEditUser,
}) => {

  const handleEdit = (user) => {

    setEditUser(user);

    setOpenModal(true);

  };

  return (

    <div
      className="
        overflow-x-auto
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-xl
      "
    >

      <table
        className="
          w-full
          min-w-[900px]
        "
      >

        <thead>

          <tr
            className="
              border-b
              border-white/10
            "
          >

            <th className="px-6 py-5 text-left text-gray-300">
              User
            </th>

            <th className="px-6 py-5 text-left text-gray-300">
              Email
            </th>

            <th className="px-6 py-5 text-left text-gray-300">
              Role
            </th>

            <th className="px-6 py-5 text-left text-gray-300">
              Department
            </th>

            <th className="px-6 py-5 text-left text-gray-300">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {loading ? (

            <tr>

              <td
                colSpan="5"
                className="
                  text-center
                  py-10
                  text-white
                "
              >
                Loading...
              </td>

            </tr>

          ) : users?.length > 0 ? (

            users.map((user) => (

              <tr
                key={user._id}
                className="
                  border-b
                  border-white/5
                  hover:bg-white/5
                  transition
                "
              >

                {/* USER */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        w-12 h-12
                        rounded-full
                        bg-gradient-to-r
                        from-cyan-400
                        to-blue-600
                        flex
                        items-center
                        justify-center
                        text-white
                        font-bold
                        overflow-hidden
                      "
                    >
                      {user?.profile?.profileImage?.url ? (
                        <img
                          src={user.profile.profileImage.url}
                          alt="profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0)
                      )}
                    </div>

                    <h3
                      className="
                        text-white
                        font-semibold
                      "
                    >

                      {user.name}

                    </h3>

                  </div>

                </td>

                {/* EMAIL */}

                <td
                  className="
                    px-6 py-5
                    text-gray-300
                  "
                >

                  {user.email}

                </td>

                {/* ROLE */}

                <td className="px-6 py-5">

                  <span
                    className={`
                      px-4 py-2
                      rounded-xl
                      text-sm
                      font-medium

                      ${
                        user.role ===
                        "admin"
                          ? `
                            bg-red-500/20
                            text-red-300
                          `
                          : `
                            bg-cyan-500/20
                            text-cyan-300
                          `
                      }
                    `}
                  >

                    {user.role}

                  </span>

                </td>

                {/* DEPARTMENT */}

                <td
                  className="
                    px-6 py-5
                    text-gray-300
                  "
                >

                  {
                    user.role === "team"
                      ? (
                        user.department
                      )
                      : (
                        <span className="text-gray-500">
                          —
                        </span>
                      )
                  }

                </td>

                {/* ACTIONS */}

                <td className="px-6 py-5">

                  <div className="flex gap-3">

                    {/* EDIT */}

                    <button
                      onClick={() =>
                        handleEdit(user)
                      }
                      className="
                        w-11 h-11
                        rounded-xl
                        bg-yellow-500/20
                        text-yellow-400
                        flex
                        items-center
                        justify-center
                        hover:scale-105
                        transition
                      "
                    >

                      <FiEdit2 />

                    </button>

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        handleDeleteUser(
                          user
                        )
                      }
                      className="
                        w-11 h-11
                        rounded-xl
                        bg-red-500/20
                        text-red-400
                        flex
                        items-center
                        justify-center
                        hover:scale-105
                        transition
                      "
                    >

                      <FiTrash2 />

                    </button>

                  </div>

                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan="5"
                className="
                  text-center
                  py-10
                  text-gray-400
                "
              >

                No Users Found

              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  );
};

export default UserTable;