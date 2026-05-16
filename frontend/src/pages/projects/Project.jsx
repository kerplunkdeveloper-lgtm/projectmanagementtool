// pages/Project.jsx

import React, {
  useEffect,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../features/projects/projectSlice";

import axiosInstance from "../../services/axiosInstance";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSearch,
} from "react-icons/fi";

const Project = () => {

  const dispatch =
    useDispatch();

  const {
    projects,
    loading,
  } = useSelector(
    (state) => state.projects
  );



  // ==========================================
  // STATES
  // ==========================================

  const [openModal, setOpenModal] =
    useState(false);

  const [editProject, setEditProject] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [clients, setClients] =
    useState([]);

  const [templates, setTemplates] =
    useState([]);

  const [formData, setFormData] =
    useState({
      title: "",

      client: "",

      template: "",

      type:
        "Monthly Retainer",

      priority: "medium",

      startDate: "",

      endDate: "",

      description: "",
    });



  // ==========================================
  // GET DATA
  // ==========================================

  useEffect(() => {

    dispatch(getProjects());

    fetchDropdownData();

  }, [dispatch]);



  // ==========================================
  // FETCH CLIENTS + TEMPLATES
  // ==========================================

  const fetchDropdownData =
    async () => {

      try {

        const clientRes =
          await axiosInstance.get(
            "/clients/all"
          );

        const templateRes =
          await axiosInstance.get(
            "/templates"
          );

        setClients(
          clientRes.data.data
        );

        setTemplates(
          templateRes.data.data
        );

      } catch (err) {

        console.log(err);
      }
    };



  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };



  // ==========================================
  // HANDLE SUBMIT
  // ==========================================

  const handleSubmit = (e) => {

    e.preventDefault();

    const payload = { ...formData };
    if (!payload.template) {
      delete payload.template;
    }

    if (editProject) {

      dispatch(
        updateProject({
          id: editProject._id,
          data: payload,
        })
      );

    } else {

      dispatch(
        createProject(payload)
      );
    }



    setOpenModal(false);

    setEditProject(null);



    setFormData({
      title: "",

      client: "",

      template: "",

      type:
        "Monthly Retainer",

      priority: "medium",

      startDate: "",

      endDate: "",

      description: "",
    });
  };



  // ==========================================
  // HANDLE EDIT
  // ==========================================

  const handleEdit = (
    project
  ) => {

    setEditProject(project);

    setFormData({

      title:
        project.title,

      client:
        project.client?._id || "",

      template:
        project.template?._id || "",

      type:
        project.type,

      priority:
        project.priority,

      startDate:
        project.startDate?.split(
          "T"
        )[0],

      endDate:
        project.endDate?.split(
          "T"
        )[0],

      description:
        project.description,
    });

    setOpenModal(true);
  };



  // ==========================================
  // FILTERED PROJECTS
  // ==========================================

  const filteredProjects =
    projects.filter((project) =>

      project.title
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );



  return (

    <div className="min-h-screen text-white">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>

          <h1 className="text-3xl md:text-4xl font-black">
            Projects
          </h1>

          <p className="text-gray-400 mt-2">
            Manage all projects
          </p>
        </div>



        <button
          onClick={() => {
            setOpenModal(true);
            setEditProject(null);
          }}
          className="
            flex items-center justify-center gap-2
            bg-gradient-to-r
            from-indigo-500
            to-purple-600
            px-5 py-3
            rounded-2xl
            hover:scale-105
            duration-300
            font-semibold
          "
        >
          <FiPlus />
          New Project
        </button>
      </div>



      {/* ========================================== */}
      {/* SEARCH */}
      {/* ========================================== */}

      <div className="mb-6">

        <div className="relative w-full md:w-96">

          <FiSearch
            className="
              absolute left-4 top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

          <input
            type="text"
            placeholder="Search project..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="
              w-full
              bg-[#111827]
              border border-gray-700
              rounded-2xl
              pl-12 pr-4 py-3
              outline-none
              focus:border-indigo-500
            "
          />
        </div>
      </div>



      {/* ========================================== */}
      {/* TABLE */}
      {/* ========================================== */}

      <div
        className="
          overflow-x-auto
          bg-[#111827]
          rounded-3xl
          border border-gray-800
        "
      >

        <table className="w-full min-w-[1200px]">

          <thead
            className="
              bg-[#1F2937]
              text-gray-300
            "
          >

            <tr>

              <th className="px-6 py-4 text-left">
                Project
              </th>

              <th className="px-6 py-4 text-left">
                Client
              </th>

              <th className="px-6 py-4 text-left">
                Template
              </th>

              <th className="px-6 py-4 text-left">
                Type
              </th>

              <th className="px-6 py-4 text-left">
                Priority
              </th>

              <th className="px-6 py-4 text-left">
                Start Date
              </th>

              <th className="px-6 py-4 text-left">
                End Date
              </th>

              <th className="px-6 py-4 text-left">
                Status
              </th>

              <th className="px-6 py-4 text-center">
                Actions
              </th>
            </tr>
          </thead>



          <tbody>

            {
              loading ? (

                <tr>

                  <td
                    colSpan="9"
                    className="text-center py-10"
                  >
                    Loading...
                  </td>
                </tr>

              ) : filteredProjects.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="text-center py-10 text-gray-400"
                  >
                    No Projects Found
                  </td>
                </tr>

              ) : (

                filteredProjects.map(
                  (project) => (

                    <tr
                      key={
                        project._id
                      }
                      className="
                        border-t border-gray-800
                        hover:bg-[#1A2235]
                        duration-300
                      "
                    >

                      {/* PROJECT */}

                      <td className="px-6 py-5">

                        <div>

                          <h2 className="font-semibold">
                            {
                              project.title
                            }
                          </h2>

                          <p className="text-gray-400 text-sm mt-1 max-w-xs line-clamp-1">
                            {
                              project.description
                            }
                          </p>
                        </div>
                      </td>



                      {/* CLIENT */}

                      <td className="px-6 py-5">

                        {
                          project.client
                            ?.companyName ||
                          "-"
                        }
                      </td>



                      {/* TEMPLATE */}

                      <td className="px-6 py-5">

                        {
                          project.template
                            ?.title || "-"
                        }
                      </td>



                      {/* TYPE */}

                      <td className="px-6 py-5">
                        {
                          project.type
                        }
                      </td>



                      {/* PRIORITY */}

                      <td className="px-6 py-5">

                        <span
                          className={`
                            px-3 py-1 rounded-full text-xs font-semibold

                            ${
                              project.priority ===
                              "high"
                                ? "bg-red-500/20 text-red-400"
                                : project.priority ===
                                  "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }
                          `}
                        >
                          {
                            project.priority
                          }
                        </span>
                      </td>



                      {/* START DATE */}

                      <td className="px-6 py-5">

                        {
                          project.startDate
                            ?.split(
                              "T"
                            )[0]
                        }
                      </td>



                      {/* END DATE */}

                      <td className="px-6 py-5">

                        {
                          project.endDate
                            ?.split(
                              "T"
                            )[0]
                        }
                      </td>



                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <span
                          className="
                            bg-indigo-500/20
                            text-indigo-400
                            px-3 py-1
                            rounded-full
                            text-xs
                          "
                        >
                          {
                            project.status
                          }
                        </span>
                      </td>



                      {/* ACTIONS */}

                      <td className="px-6 py-5">

                        <div className="flex items-center justify-center gap-3">

                          <button
                            onClick={() =>
                              handleEdit(
                                project
                              )
                            }
                            className="
                              p-2 rounded-xl
                              bg-indigo-500/20
                              hover:bg-indigo-500
                              duration-300
                            "
                          >
                            <FiEdit />
                          </button>



                          <button
                            onClick={() =>
                              dispatch(
                                deleteProject(
                                  project._id
                                )
                              )
                            }
                            className="
                              p-2 rounded-xl
                              bg-red-500/20
                              hover:bg-red-500
                              duration-300
                            "
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )
            }
          </tbody>
        </table>
      </div>



      {/* ========================================== */}
      {/* MODAL */}
      {/* ========================================== */}

      {
        openModal && (

          <div
            className="
              fixed inset-0
              bg-black/70
              backdrop-blur-sm
              flex items-center justify-center
              p-4 z-50
            "
          >

            <div
              className="
                bg-[#0F172A]
                w-full
                max-w-3xl
                rounded-3xl
                border border-gray-800
                overflow-hidden
              "
            >

              {/* TOP */}

              <div
                className="
                  flex items-center justify-between
                  px-6 py-5
                  border-b border-gray-800
                "
              >

                <h2 className="text-2xl font-bold">
                  {
                    editProject
                      ? "Edit Project"
                      : "Create Project"
                  }
                </h2>

                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                >
                  <FiX size={24} />
                </button>
              </div>



              {/* FORM */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="p-6 space-y-5"
              >

                {/* TITLE */}

                <input
                  type="text"
                  name="title"
                  placeholder="Project Name"
                  value={
                    formData.title
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="
                    w-full
                    bg-[#1E293B]
                    border border-gray-700
                    rounded-2xl
                    px-4 py-3
                    outline-none
                    focus:border-indigo-500
                  "
                />



                {/* CLIENT + TEMPLATE */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* CLIENT */}

                  <select
                    name="client"
                    value={
                      formData.client
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                    "
                  >

                    <option value="">
                      Select Client
                    </option>

                    {
                      clients.map(
                        (
                          client
                        ) => (

                          <option
                            key={
                              client._id
                            }
                            value={
                              client._id
                            }
                          >
                            {
                              client.companyName
                            }
                          </option>
                        )
                      )
                    }
                  </select>



                  {/* TEMPLATE */}

                  <select
                    name="template"
                    value={
                      formData.template
                    }
                    onChange={
                      handleChange
                    }
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                    "
                  >

                    <option value="">
                      No Template
                    </option>

                    {
                      templates.map(
                        (
                          template
                        ) => (

                          <option
                            key={
                              template._id
                            }
                            value={
                              template._id
                            }
                          >
                            {
                              template.title
                            }
                          </option>
                        )
                      )
                    }
                  </select>
                </div>



                {/* TYPE + PRIORITY */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <select
                    name="type"
                    value={
                      formData.type
                    }
                    onChange={
                      handleChange
                    }
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                    "
                  >

                    <option>
                      Monthly Retainer
                    </option>

                    <option>
                      One Time Project
                    </option>

                    <option>
                      Internal Project
                    </option>
                  </select>



                  <select
                    name="priority"
                    value={
                      formData.priority
                    }
                    onChange={
                      handleChange
                    }
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                    "
                  >

                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>
                  </select>
                </div>



                {/* DATES */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <input
                    type="date"
                    name="startDate"
                    value={
                      formData.startDate
                    }
                    onChange={
                      handleChange
                    }
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                    "
                  />



                  <input
                    type="date"
                    name="endDate"
                    value={
                      formData.endDate
                    }
                    onChange={
                      handleChange
                    }
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                    "
                  />
                </div>



                {/* DESCRIPTION */}

                <textarea
                  rows="4"
                  name="description"
                  placeholder="Description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  className="
                    w-full
                    bg-[#1E293B]
                    border border-gray-700
                    rounded-2xl
                    px-4 py-3
                  "
                />



                {/* BUTTONS */}

                <div className="flex justify-end gap-4 pt-3">

                  <button
                    type="button"
                    onClick={() =>
                      setOpenModal(false)
                    }
                    className="
                      px-5 py-3
                      border border-gray-700
                      rounded-2xl
                    "
                  >
                    Cancel
                  </button>



                  <button
                    type="submit"
                    className="
                      bg-gradient-to-r
                      from-indigo-500
                      to-purple-600
                      px-6 py-3
                      rounded-2xl
                      hover:scale-105
                      duration-300
                    "
                  >
                    {
                      editProject
                        ? "Update Project"
                        : "Create Project"
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Project;