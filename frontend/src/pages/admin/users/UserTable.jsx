import React from "react";

import {
  FiEdit2,
  FiTrash2,
  FiMail,
  FiShield,
  FiUsers,
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
        relative

        overflow-hidden

        rounded-[32px]

        border
        border-gray-200

        bg-white

        shadow-[0_20px_60px_rgba(15,23,42,0.08)]
      "
    >
      {/* PREMIUM BACKGROUND EFFECT */}
      <div
        className="
          absolute
          top-0
          right-0

          w-80
          h-80

          rounded-full

          bg-blue-100/60

          blur-3xl
        "
      />

      <div
        className="
          absolute
          bottom-0
          left-0

          w-72
          h-72

          rounded-full

          bg-cyan-100/50

          blur-3xl
        "
      />

      {/* TABLE WRAPPER */}
      <div className="overflow-x-auto relative z-10">
        <table
          className="
            w-full
            min-w-[950px]
          "
        >
          {/* HEADER */}
          <thead>
            <tr
              className="
                border-b
                border-gray-200

                bg-gradient-to-r
                from-slate-50
                via-white
                to-slate-50
              "
            >
              <th
                className="
                  px-6
                  py-5

                  text-left

                  text-sm
                  font-bold

                  text-slate-700
                "
              >
                User
              </th>

              <th
                className="
                  px-6
                  py-5

                  text-left

                  text-sm
                  font-bold

                  text-slate-700
                "
              >
                Email
              </th>

              <th
                className="
                  px-6
                  py-5

                  text-left

                  text-sm
                  font-bold

                  text-slate-700
                "
              >
                Role
              </th>

              <th
                className="
                  px-6
                  py-5

                  text-left

                  text-sm
                  font-bold

                  text-slate-700
                "
              >
                Department
              </th>

              <th
                className="
                  px-6
                  py-5

                  text-left

                  text-sm
                  font-bold

                  text-slate-700
                "
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="
                    py-16
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      gap-4
                    "
                  >
                    <div
                      className="
                        w-14
                        h-14

                        rounded-full

                        border-[5px]
                        border-blue-100
                        border-t-blue-500

                        animate-spin
                      "
                    />

                    <p
                      className="
                        text-slate-500
                        font-medium
                      "
                    >
                      Loading users...
                    </p>
                  </div>
                </td>
              </tr>
            ) : users?.length > 0 ? (
              users.map((user, index) => (
                <tr
                  key={user._id}
                  className="
                    border-b
                    border-gray-100

                    hover:bg-slate-50/80

                    transition-all
                    duration-300
                  "
                >
                  {/* USER */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {/* IMAGE */}
                      <div
                        className="
                          relative

                          flex-shrink-0
                        "
                      >
                        <div
                          className="
                            absolute
                            inset-0

                            rounded-full

                            bg-gradient-to-r
                            from-blue-400
                            via-cyan-400
                            to-indigo-500

                            blur-md
                            opacity-40
                          "
                        />

                        <div
                          className="
                            relative

                            w-14
                            h-14

                            rounded-full

                            overflow-hidden

                            border-[3px]
                            border-white

                            shadow-lg

                            bg-gradient-to-r
                            from-blue-500
                            to-cyan-500

                            flex
                            items-center
                            justify-center

                            text-white
                            font-bold
                            text-lg
                          "
                        >
                          {user?.profile?.profileImage
                            ?.url ? (
                            <img
                              src={
                                user.profile
                                  .profileImage.url
                              }
                              alt="profile"
                              className="
                                  w-full
                                  h-full
                                  object-cover
                                "
                            />
                          ) : (
                            user?.name?.charAt(0)
                          )}
                        </div>

                        {/* ONLINE DOT */}
                        <div
                          className="
                            absolute
                            bottom-0
                            right-0

                            w-4
                            h-4

                            rounded-full

                            bg-emerald-500

                            border-2
                            border-white
                          "
                        />
                      </div>

                      {/* INFO */}
                      <div>
                        <h3
                          className="
                            text-slate-800
                            font-bold
                            text-[15px]
                          "
                        >
                          {user.name}
                        </h3>

                        <p
                          className="
                            text-gray-500
                            text-sm
                          "
                        >
                          User ID : #
                          {index + 1}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="px-6 py-5">
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          w-10
                          h-10

                          rounded-xl

                          bg-blue-50

                          flex
                          items-center
                          justify-center

                          text-blue-600
                        "
                      >
                        <FiMail size={18} />
                      </div>

                      <div>
                        <p
                          className="
                            text-slate-700
                            font-medium
                          "
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-6 py-5">
                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-2

                        px-4
                        py-2

                        rounded-2xl

                        text-sm
                        font-semibold

                        shadow-sm

                        ${
                          user.role === "admin"
                            ? `
                              bg-red-50
                              text-red-600
                              border
                              border-red-100
                            `
                            : `
                              bg-cyan-50
                              text-cyan-700
                              border
                              border-cyan-100
                            `
                        }
                      `}
                    >
                      <FiShield />

                      {user.role}
                    </span>
                  </td>

                  {/* DEPARTMENT */}
                  <td className="px-6 py-5">
                    {user.role === "team" ? (
                      <div
                        className="
                          inline-flex
                          items-center
                          gap-2

                          px-4
                          py-2

                          rounded-2xl

                          bg-violet-50

                          border
                          border-violet-100

                          text-violet-700
                          text-sm
                          font-semibold
                        "
                      >
                        <FiUsers />

                        {user.department}
                      </div>
                    ) : (
                      <span
                        className="
                          text-gray-400
                          font-medium
                        "
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {/* EDIT */}
                      <button
                        onClick={() =>
                          handleEdit(user)
                        }
                        className="
                          group

                          relative

                          w-12
                          h-12

                          rounded-2xl

                          bg-gradient-to-r
                          from-amber-400
                          to-orange-500

                          text-white

                          flex
                          items-center
                          justify-center

                          shadow-lg
                          shadow-orange-200

                          hover:scale-110
                          hover:-translate-y-1

                          transition-all
                          duration-300
                        "
                      >
                        <FiEdit2 size={18} />

                        <div
                          className="
                            absolute
                            inset-0

                            rounded-2xl

                            bg-white/20

                            opacity-0
                            group-hover:opacity-100

                            transition-all
                          "
                        />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() =>
                          handleDeleteUser(user)
                        }
                        className="
                          group

                          relative

                          w-12
                          h-12

                          rounded-2xl

                          bg-gradient-to-r
                          from-rose-500
                          to-red-600

                          text-white

                          flex
                          items-center
                          justify-center

                          shadow-lg
                          shadow-red-200

                          hover:scale-110
                          hover:-translate-y-1

                          transition-all
                          duration-300
                        "
                      >
                        <FiTrash2 size={18} />

                        <div
                          className="
                            absolute
                            inset-0

                            rounded-2xl

                            bg-white/20

                            opacity-0
                            group-hover:opacity-100

                            transition-all
                          "
                        />
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
                    py-20
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                    "
                  >
                    <div
                      className="
                        w-24
                        h-24

                        rounded-full

                        bg-slate-100

                        flex
                        items-center
                        justify-center

                        mb-5
                      "
                    >
                      <FiUsers
                        size={42}
                        className="
                          text-slate-400
                        "
                      />
                    </div>

                    <h2
                      className="
                        text-2xl
                        font-bold

                        text-slate-700
                      "
                    >
                      No Users Found
                    </h2>

                    <p
                      className="
                        mt-2

                        text-gray-500
                      "
                    >
                      Users will appear here once
                      added.
                    </p>
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