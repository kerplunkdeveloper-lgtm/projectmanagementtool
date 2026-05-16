import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEodReports } from "../../features/eodReports/eodReportSlice";

const AdminEodReports = () => {
  const dispatch = useDispatch();
  const { eodReports, loading } = useSelector((state) => state.eodReports);

  useEffect(() => {
    dispatch(getEodReports());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Team Intelligence
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Centralized oversight of daily operations and project velocity</p>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Log Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Context</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Accomplishments</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Blockers</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Next Steps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold italic">Gathering team data...</p>
                      </div>
                    </td>
                  </tr>
                ) : eodReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-20 text-slate-400 font-bold text-lg italic">
                      No operational logs detected for this period.
                    </td>
                  </tr>
                ) : (
                  eodReports.map((report) => (
                    <tr key={report._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap font-bold text-slate-500">
                        {new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-200">
                            {report.user?.name?.charAt(0) || "U"}
                          </div>
                          <div className="font-bold text-slate-800 tracking-tight">{report.user?.name || "Anonymous"}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200 shadow-sm">
                          {report.project?.title || "Operational"}
                        </span>
                      </td>
                      <td className="px-8 py-6 max-w-xs break-words whitespace-pre-wrap text-sm text-slate-600 font-medium leading-relaxed">
                        {report.tasksCompleted}
                      </td>
                      <td className="px-8 py-6 max-w-xs break-words whitespace-pre-wrap text-sm font-bold text-rose-500 bg-rose-50/30">
                        {report.blockers || "None"}
                      </td>
                      <td className="px-8 py-6 max-w-xs break-words whitespace-pre-wrap text-sm font-bold text-blue-600 bg-blue-50/30">
                        {report.nextDayPlan}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEodReports;
