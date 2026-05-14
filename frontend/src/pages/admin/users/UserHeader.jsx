import React from "react";

import {
  FiPlus,
  FiUsers,
} from "react-icons/fi";

const UserHeader = ({
  setOpenModal,
}) => {

  return (
    <div
      className="
        flex flex-col md:flex-row
        md:items-center
        md:justify-between
        gap-5
        mb-8
      "
    >

      <div>

        <h1
          className="
            text-3xl md:text-4xl
            font-bold
            text-white
            flex items-center gap-3
          "
        >

          <FiUsers className="text-cyan-400" />

          User Management

        </h1>

        <p className="text-gray-400 mt-2">
          Manage all users
        </p>

      </div>

      <button
        onClick={() =>
          setOpenModal(true)
        }
        className="
          flex items-center gap-2

          px-6 py-3

          rounded-2xl

          bg-gradient-to-r
          from-cyan-500
          to-blue-600

          text-white
          font-semibold

          hover:scale-105

          transition-all duration-300
        "
      >

        <FiPlus />

        Add User

      </button>

    </div>
  );
};

export default UserHeader;