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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              My EOD Reports
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Log your daily progress and future initiatives</p>
          </div>

          <button
            onClick={() => {
              setOpenModal(true);
              setEditReport(null);
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95"
          >
            <FiPlus size={24} />
            Submit Report
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Context</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Achievements</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Obstacles</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Plan</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold italic">Synchronizing reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : eodReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-20">
                      <p className="text-slate-400 font-bold text-lg italic">No tactical reports found in your history.</p>
                    </td>
                  </tr>
                ) : (
                  eodReports.map((report) => (
                    <tr key={report._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap font-bold text-slate-700">
                        {new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100 shadow-sm">
                          {report.project?.title || "Operational"}
                        </span>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className="text-slate-600 text-sm font-medium leading-relaxed truncate group-hover:whitespace-normal" title={report.tasksCompleted}>
                          {report.tasksCompleted}
                        </p>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className={`text-sm font-bold truncate group-hover:whitespace-normal ${report.blockers && report.blockers !== 'None' ? 'text-rose-500' : 'text-slate-400 font-medium italic'}`} title={report.blockers}>
                          {report.blockers || "No obstacles."}
                        </p>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className="text-blue-600 text-sm font-bold leading-relaxed truncate group-hover:whitespace-normal" title={report.nextDayPlan}>
                          {report.nextDayPlan}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => handleEdit(report)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100 border border-transparent transition-all shadow-sm active:scale-90"
                        >
                          <FiEdit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-gray-200 shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden">
              {/* HEADER */}
              <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-slate-50/50">
                <h2 className="text-3xl font-black text-slate-800">
                  {editReport ? "Update Report" : "Daily Briefing"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-300 shadow-sm"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Project Alignment *</label>
                  <select
                    name="project"
                    required
                    value={formData.project}
                    onChange={handleChange}
                    className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="">Select Specific Project...</option>
                    {projects.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        {proj.title} {proj.client?.companyName ? `(${proj.client.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Key Achievements *</label>
                  <textarea
                    rows="3"
                    name="tasksCompleted"
                    required
                    placeholder="Document your milestones for today..."
                    value={formData.tasksCompleted}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Obstacles & Blockers</label>
                  <textarea
                    rows="2"
                    name="blockers"
                    placeholder="Any challenges that required intervention?"
                    value={formData.blockers}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Strategic Roadmap (Next Day) *</label>
                  <textarea
                    rows="2"
                    name="nextDayPlan"
                    required
                    placeholder="What is your primary objective for tomorrow?"
                    value={formData.nextDayPlan}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
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
                    {editReport ? "Confirm Update" : "Launch Report"}
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

export default EodReports;
