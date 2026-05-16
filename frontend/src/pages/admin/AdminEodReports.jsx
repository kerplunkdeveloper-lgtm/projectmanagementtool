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
    <div className="min-h-screen text-white">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black">Team EOD Reports</h1>
        <p className="text-gray-400 mt-2">Review daily work logs submitted by your team</p>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-[#111827] rounded-3xl border border-gray-800">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-[#1F2937] text-gray-300">
            <tr>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Team Member</th>
              <th className="px-6 py-4 text-left">Project</th>
              <th className="px-6 py-4 text-left">Tasks Completed</th>
              <th className="px-6 py-4 text-left">Blockers</th>
              <th className="px-6 py-4 text-left">Next Day Plan</th>
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
                  <td className="px-6 py-5 font-semibold text-indigo-400">
                    {report.user?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-semibold">
                      {report.project?.title || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-5 max-w-xs break-words whitespace-pre-wrap">
                    {report.tasksCompleted}
                  </td>
                  <td className="px-6 py-5 max-w-xs break-words whitespace-pre-wrap text-red-400">
                    {report.blockers}
                  </td>
                  <td className="px-6 py-5 max-w-xs break-words whitespace-pre-wrap text-blue-400">
                    {report.nextDayPlan}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEodReports;
