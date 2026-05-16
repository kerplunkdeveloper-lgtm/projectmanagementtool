import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getEodReports,
  createEodReport,
  updateEodReport,
} from "../../features/eodReports/eodReportSlice";
import { FiPlus, FiEdit, FiX } from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";

const EodReports = () => {
  const dispatch = useDispatch();
  const { eodReports, loading } = useSelector((state) => state.eodReports);
  
  const [openModal, setOpenModal] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    project: "",
    tasksCompleted: "",
    blockers: "None",
    nextDayPlan: "",
  });

  useEffect(() => {
    dispatch(getEodReports());
    fetchProjects();
  }, [dispatch]);

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get("/projects");
      setProjects(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = { ...formData };
    if (!payload.project) {
      delete payload.project;
    }

    if (editReport) {
      dispatch(updateEodReport({ id: editReport._id, data: payload }));
    } else {
      dispatch(createEodReport(payload));
    }

    setOpenModal(false);
    setEditReport(null);
    setFormData({
      project: "",
      tasksCompleted: "",
      blockers: "None",
      nextDayPlan: "",
    });
  };

  const handleEdit = (report) => {
    setEditReport(report);
    setFormData({
      project: report.project?._id || "",
      tasksCompleted: report.tasksCompleted,
      blockers: report.blockers,
      nextDayPlan: report.nextDayPlan,
    });
    setOpenModal(true);
  };

  return (
    <div className="min-h-screen text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">My EOD Reports</h1>
          <p className="text-gray-400 mt-2">Log your daily progress and plans</p>
        </div>

        <button
          onClick={() => {
            setOpenModal(true);
            setEditReport(null);
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 rounded-2xl hover:scale-105 duration-300 font-semibold"
        >
          <FiPlus />
          Submit EOD Report
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-[#111827] rounded-3xl border border-gray-800">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-[#1F2937] text-gray-300">
            <tr>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Project</th>
              <th className="px-6 py-4 text-left">Tasks Completed</th>
              <th className="px-6 py-4 text-left">Blockers</th>
              <th className="px-6 py-4 text-left">Next Day Plan</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10">Loading...</td>
              </tr>
            ) : eodReports.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">No Reports Found</td>
              </tr>
            ) : (
              eodReports.map((report) => (
                <tr key={report._id} className="border-t border-gray-800 hover:bg-[#1A2235] duration-300">
                  <td className="px-6 py-5 whitespace-nowrap">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold">
                      {report.project?.title || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-5 max-w-xs truncate" title={report.tasksCompleted}>
                    {report.tasksCompleted}
                  </td>
                  <td className="px-6 py-5 max-w-xs truncate" title={report.blockers}>
                    {report.blockers}
                  </td>
                  <td className="px-6 py-5 max-w-xs truncate" title={report.nextDayPlan}>
                    {report.nextDayPlan}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => handleEdit(report)}
                      className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 duration-300"
                    >
                      <FiEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] w-full max-w-2xl rounded-3xl border border-gray-800 overflow-hidden">
            {/* TOP */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <h2 className="text-2xl font-bold">
                {editReport ? "Edit EOD Report" : "Submit EOD Report"}
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <select
                name="project"
                value={formData.project}
                onChange={handleChange}
                className="w-full bg-[#1E293B] border border-gray-700 rounded-2xl px-4 py-3 outline-none"
              >
                <option value="">General (No Project)</option>
                {projects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.title}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm text-gray-400 mb-1 ml-1">Tasks Completed</label>
                <textarea
                  rows="3"
                  name="tasksCompleted"
                  required
                  placeholder="What did you accomplish today?"
                  value={formData.tasksCompleted}
                  onChange={handleChange}
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1 ml-1">Blockers / Issues</label>
                <textarea
                  rows="2"
                  name="blockers"
                  placeholder="Any blockers faced?"
                  value={formData.blockers}
                  onChange={handleChange}
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1 ml-1">Next Day Plan</label>
                <textarea
                  rows="2"
                  name="nextDayPlan"
                  required
                  placeholder="What do you plan to work on tomorrow?"
                  value={formData.nextDayPlan}
                  onChange={handleChange}
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-5 py-3 border border-gray-700 rounded-2xl hover:bg-gray-800 duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 rounded-2xl hover:scale-105 duration-300 font-semibold"
                >
                  {editReport ? "Update Report" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EodReports;
