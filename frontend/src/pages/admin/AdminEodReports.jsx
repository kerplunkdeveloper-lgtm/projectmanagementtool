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
    <div className="min-h-screen bg-[#f8fafc] px-3 sm:px-5 lg:px-8 py-5">
      <div className="max-w-[1500px] mx-auto">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Team Intelligence
          </h1>

          <p className="text-sm sm:text-base text-slate-500">
            Centralized oversight of daily operations and project velocity
          </p>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Team Member
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Project
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Accomplishments
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Blockers
                  </th>

                  <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Next Steps
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-16">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>

                        <p className="text-sm font-medium text-slate-500">
                          Loading reports...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : eodReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-16 text-slate-400 font-medium"
                    >
                      No reports available
                    </td>
                  </tr>
                ) : (
                  eodReports.map((report) => (
                    <tr
                      key={report._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      {/* DATE */}
                      <td className="px-4 py-5 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {new Date(report.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* USER */}
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {report.user?.name?.charAt(0) || "U"}
                          </div>

                          <div className="font-semibold text-sm text-slate-800">
                            {report.user?.name || "Anonymous"}
                          </div>
                        </div>
                      </td>

                      {/* PROJECT */}
                      <td className="px-4 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {report.project?.title || "Operational"}
                        </span>
                      </td>

                      {/* TASKS */}
                      <td className="px-4 py-5 text-sm text-slate-600 leading-relaxed max-w-[260px]">
                        {report.tasksCompleted}
                      </td>

                      {/* BLOCKERS */}
                      <td className="px-4 py-5 text-sm text-rose-500 font-medium leading-relaxed max-w-[220px]">
                        {report.blockers || "None"}
                      </td>

                      {/* NEXT PLAN */}
                      <td className="px-4 py-5 text-sm text-blue-600 font-medium leading-relaxed max-w-[220px]">
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