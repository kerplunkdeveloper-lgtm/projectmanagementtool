import React, {
  useEffect,
  useState,
} from "react";

import {
  FiX,
} from "react-icons/fi";

const UserModal = ({
  openModal,
  setOpenModal,
  handleCreateUser,
  handleUpdateUser,
  editUser,
  setEditUser,
}) => {

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "team",
      department: "",
    });

  useEffect(() => {

    if (editUser) {

      setFormData({
        name: editUser.name || "",
        email: editUser.email || "",
        password: "",
        role: editUser.role || "team",
        department:
          editUser.department || "",
      });

    } else {

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "team",
        department: "",
      });

    }

  }, [editUser]);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,

      // Clear department if role changes
      ...(name === "role" &&
        value !== "team"
        ? { department: "" }
        : {}),
    }));

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    if (editUser) {

      handleUpdateUser(formData);

    } else {

      handleCreateUser(formData);

    }

  };

  const handleClose = () => {

    setOpenModal(false);

    setEditUser(null);

  };

  if (!openModal) return null;

  return (

    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        backdrop-blur-sm
        flex items-center
        justify-center
        p-4
      "
    >

      <div
        className="
          w-full
          max-w-lg
          rounded-3xl
          border border-white/10
          bg-[#0D1B2A]
          p-6 md:p-8
        "
      >

        {/* Header */}

        <div
          className="
            flex items-center
            justify-between
            mb-8
          "
        >

          <h2
            className="
              text-2xl
              font-bold
              text-white
            "
          >

            {editUser
              ? "Update User"
              : "Add User"}

          </h2>

          <button
            onClick={handleClose}
            className="
              w-10 h-10
              rounded-xl
              bg-white/10
              text-white
              flex items-center
              justify-center
              hover:bg-white/20
              transition
            "
          >

            <FiX className="w-5 h-5" />

          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Name */}

          <input
            type="text"
            name="name"
            required
            value={formData.name}
            placeholder="Name"
            onChange={handleChange}
            className="
              w-full h-12
              rounded-2xl
              bg-white/5
              border border-white/10
              px-4
              text-white
              outline-none
            "
          />

          {/* Email */}

          <input
            type="email"
            name="email"
            required
            value={formData.email}
            placeholder="Email"
            onChange={handleChange}
            className="
              w-full h-12
              rounded-2xl
              bg-white/5
              border border-white/10
              px-4
              text-white
              outline-none
            "
          />

          {/* Password */}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="
              w-full h-12
              rounded-2xl
              bg-white/5
              border border-white/10
              px-4
              text-white
              outline-none
            "
          />

          {/* Role */}

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="
              w-full h-12
              rounded-2xl
              bg-white/5
              border border-white/10
              px-4
              text-blue-400
              outline-none
            "
          >

            <option value="team">
              Team
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="operationmanager">
              Operation Manager
            </option>

          </select>

          {/* Department */}

          {
            formData.role ===
              "team" && (

              <select
                name="department"
                value={
                  formData.department
                }
                onChange={
                  handleChange
                }
                required
                className="
                  w-full h-12
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  px-4
                  text-blue-400
                  outline-none
                "
              >

                <option value="">
                  Select Department
                </option>

                <option value="Social Media Team">
                  Social Media Team
                </option>

                <option value="Website Team">
                  Website Team
                </option>

                <option value="Designer Team">
                  Designer Team
                </option>

                <option value="Editor Team">
                  Editor Team
                </option>

                <option value="Scriptwriter Team">
                  Scriptwriter Team
                </option>

                <option value="Cameraman Team">
                  Cameraman Team
                </option>

                <option value="SEO Team">
                  SEO Team
                </option>

              </select>

            )
          }

          {/* Submit Button */}

          <button
            type="submit"
            className="
              w-full h-12
              rounded-2xl
              bg-gradient-to-r
              from-cyan-500
              to-blue-600
              text-white
              font-semibold
              hover:scale-[1.01]
              transition
            "
          >

            {editUser
              ? "Update User"
              : "Create User"}

          </button>

        </form>

      </div>

    </div>

  );
};

export default UserModal;