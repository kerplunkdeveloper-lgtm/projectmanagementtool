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
    <div className="min-h-screen py-5">
      <div className="max-w-[1500px] mx-auto">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-md font-bold text-slate-800">
            Team EOD Reports
          </h1>

          
        </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">

  <div className="overflow-x-auto custom-scrollbar">
    <table className="w-full min-w-[760px] border-separate border-spacing-0">
      {/* TABLE HEAD */}
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
            Date
          </th>

          <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
            Team Member
          </th>

          <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
            Project
          </th>

          <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
            Accomplishments
          </th>

          <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
            Blockers
          </th>

          <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
            Next Steps
          </th>
        </tr>
      </thead>

      {/* TABLE BODY */}
      <tbody>
        {loading ? (
          <tr>
            <td colSpan="6" className="py-14">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>

                <p className="text-xs font-semibold text-slate-500">
                  Loading reports...
                </p>
              </div>
            </td>
          </tr>
        ) : eodReports.length === 0 ? (
          <tr>
            <td
              colSpan="6"
              className="text-center py-14 text-sm font-semibold text-slate-400"
            >
              No reports available
            </td>
          </tr>
        ) : (
          eodReports.map((report) => (
            <tr
              key={report._id}
              className="border-b border-slate-100 hover:bg-slate-50/70 transition-all duration-200"
            >
              {/* DATE */}
              <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                <p className="text-[11px] font-semibold text-slate-600">
                  {new Date(report.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </td>

              {/* USER */}
              <td className="px-3 sm:px-4 py-3.5">
                <div className="flex items-center gap-2.5 min-w-[170px]">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm flex-shrink-0">
                    {report.user?.name?.charAt(0) || "U"}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">
                      {report.user?.name || "Anonymous"}
                    </p>
                  </div>
                </div>
              </td>

              {/* PROJECT */}
              <td className="px-3 sm:px-4 py-3.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold whitespace-nowrap border border-slate-200">
                  {report.project?.title || "Operational"}
                </span>
              </td>

              {/* TASKS */}
              <td className="px-3 sm:px-4 py-3.5 max-w-[240px]">
                <p className="text-[12px] text-slate-600 leading-5 line-clamp-3">
                  {report.tasksCompleted}
                </p>
              </td>

              {/* BLOCKERS */}
              <td className="px-3 sm:px-4 py-3.5 max-w-[200px]">
                <p className="text-[12px] text-rose-500 font-medium leading-5 line-clamp-3">
                  {report.blockers || "None"}
                </p>
              </td>

              {/* NEXT STEPS */}
              <td className="px-3 sm:px-4 py-3.5 max-w-[220px]">
                <p className="text-[12px] text-blue-600 font-medium leading-5 line-clamp-3">
                  {report.nextDayPlan}
                </p>
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