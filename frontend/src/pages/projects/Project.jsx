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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
             All Projects 
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Manage and monitor your business initiatives</p>
          </div>

          <button
            onClick={() => {
              setOpenModal(true);
              setEditProject(null);
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95"
          >
            <FiPlus size={24} />
            New Project
          </button>
        </div>

        {/* ========================================== */}
        {/* SEARCH & FILTERS */}
        {/* ========================================== */}
        <div className="mb-8">
          <div className="relative group w-full md:w-96">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-xl group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white border border-gray-200 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* TABLE */}
        {/* ========================================== */}
        <div className="relative overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {/* PREMIUM DECORATION */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-50/60 blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-cyan-50/50 blur-3xl -z-0" />

          <div className="overflow-x-auto relative z-10">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/50">
                  <th className="px-8 py-6 text-left text-sm font-bold text-slate-700">Project</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">Client</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">Template</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">Type</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">Priority</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">Start Date</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">End Date</th>
                  <th className="px-6 py-6 text-left text-sm font-bold text-slate-700">Status</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 border-[5px] border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">Fetching projects...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-20 text-center">
                      <div className="flex flex-col items-center opacity-50">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <FiSearch size={40} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700">No Projects Found</h2>
                        <p className="text-gray-500">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr
                      key={project._id}
                      className="border-b border-gray-100 hover:bg-slate-50/80 transition-all duration-300 group"
                    >
                      <td className="px-8 py-6">
                        <div>
                          <h2 className="font-bold text-slate-800 text-base">{project.title}</h2>
                          <p className="text-gray-500 text-sm mt-1 max-w-xs line-clamp-1">{project.description}</p>
                        </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {project.client?.companyName?.charAt(0) || "C"}
                          </div>
                          <span className="text-slate-700 font-medium">{project.client?.companyName || "—"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-6 text-slate-600 font-medium">{project.template?.title || "—"}</td>

                      <td className="px-6 py-6">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                          {project.type}
                        </span>
                      </td>

                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-bold shadow-sm ${
                            project.priority === "high"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : project.priority === "medium"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            project.priority === "high" ? "bg-rose-600" : project.priority === "medium" ? "bg-amber-600" : "bg-emerald-600"
                          }`} />
                          {project.priority.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-6 text-slate-600 font-medium">
                        {project.startDate?.split("T")[0] || "—"}
                      </td>

                      <td className="px-6 py-6 text-slate-600 font-medium">
                        {project.endDate?.split("T")[0] || "—"}
                      </td>

                      <td className="px-6 py-6">
                        <span className="px-4 py-1.5 rounded-2xl bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 shadow-sm">
                          {project.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-3 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:scale-110 transition-all duration-300 shadow-sm"
                          >
                            <FiEdit size={18} />
                          </button>

                          <button
                            onClick={() => dispatch(deleteProject(project._id))}
                            className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-110 transition-all duration-300 shadow-sm"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================== */}
        {/* MODAL */}
        {/* ========================================== */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] border border-gray-200 shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-slate-50/50">
                <h2 className="text-3xl font-black text-slate-800">
                  {editProject ? "Update Project" : "Create New Project"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-300 shadow-sm"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Project Name</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="E.g., Brand Re-design 2024"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Client</label>
                    <select
                      name="client"
                      value={formData.client}
                      onChange={handleChange}
                      required
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>{client.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Service Template</label>
                    <select
                      name="template"
                      value={formData.template}
                      onChange={handleChange}
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="">No Template</option>
                      {templates.map((template) => (
                        <option key={template._id} value={template._id}>{template.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Project Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                    >
                      <option>Monthly Retainer</option>
                      <option>One Time Project</option>
                      <option>Internal Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Priority Level</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Project Description</label>
                  <textarea
                    rows="4"
                    name="description"
                    placeholder="Briefly describe the project goals..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-5 pt-6">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-10 py-4 rounded-2xl border border-gray-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg shadow-[0_15px_35px_rgba(37,99,235,0.3)] hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(37,99,235,0.4)] transition-all active:scale-95"
                  >
                    {editProject ? "Save Changes" : "Launch Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Project;