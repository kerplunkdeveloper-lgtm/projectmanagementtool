import React, { useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiLink,
  FiUser,
  FiAlertCircle,
} from "react-icons/fi";

// Helper: get priority badge colors based on priority value
const getPriorityStyle = (priority) => {
  const p = priority?.toLowerCase() || "";
  if (p.includes("top high"))
    return "bg-red-100 text-red-600";
  if (p.includes("high"))
    return "bg-yellow-100 text-yellow-700";
  if (p.includes("medium"))
    return "bg-orange-100 text-orange-700";
  if (p.includes("low"))
    return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
};

const EodReports = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "WBLT2 - Reels",
      client: "BlackThunder",
      category: "REEL",
      priority: "TOP HIGH",
      code: "WBLT2",
      revision: 0,
      time: "35 mins",
      status: "Rejected",
      output: "",
      reason: "Client feedback — pacing / edit issue",
      nextAction: "Re-cut and resubmit tomorrow AM",
      note: "Logged — pacing too slow, client wants beat-matched cuts on the drop.",
      reviewer: "Vasanth",
    },
    {
      id: 2,
      title: "WBLT1 - Banner",
      client: "BlackThunder",
      category: "IMAGE",
      priority: "HIGH",
      code: "WBLT1",
      revision: 0,
      time: "",
      status: "Pending",
      output: "",
      reason: "Waiting for client input",
      nextAction: "Continue tomorrow AM",
      note: "",
      reviewer: "",
    },
  ]);

  // Update a single field for a task by id
  const updateTask = (taskId, field, value) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  // Dynamic stats
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const rejectedCount = tasks.filter((t) => t.status === "Rejected").length;
  const totalTasks = tasks.length;

  // Progress bar widths
  const completedWidth = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const pendingWidth = totalTasks > 0 ? (pendingCount / totalTasks) * 100 : 0;
  const rejectedWidth = totalTasks > 0 ? (rejectedCount / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen ">
      {/* Header */}

      <div className="bg-white p-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Today's Tasks — Prasana
            </h1>

            <p className="text-slate-500 text-sm mt-1">
              Log status and close before end of day
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
            <FiCalendar />

            <span className="font-medium">08 Jul 2026</span>
          </div>
        </div>

        {/* Progress */}

        <div className="mt-4">
          <div className="h-2 rounded-full overflow-hidden bg-gray-200 flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${completedWidth}%` }}
            ></div>

            <div
              className="bg-yellow-400 transition-all duration-500"
              style={{ width: `${pendingWidth}%` }}
            ></div>

            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${rejectedWidth}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}

        <div className="flex flex-wrap gap-6 mt-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>

            <span className="text-xs font-medium">{completedCount} Completed</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>

            <span className="text-xs font-medium">{pendingCount} Pending</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>

            <span className="text-xs font-medium">{rejectedCount} Rejected</span>
          </div>
        </div>
      </div>

      {/* Task Cards — all rendered from tasks state */}

      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-slate-200 rounded-3xl mt-3 p-4 px-3 shadow-xl transition-all duration-300"
        >
          {/* Top */}

          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="p-2">
              <h2 className="font-bold text-md text-slate-800">{task.title}</h2>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                  {task.code}
                </span>

                <span
                  className={`${getPriorityStyle(task.priority)} text-xs px-3 py-1 rounded-full`}
                >
                  {task.priority}
                </span>

                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                  {task.client}
                </span>

                <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                  {task.category}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500">Rev. {task.revision}</p>

              {task.time && (
                <div className="flex items-center justify-end gap-2 mt-2 text-slate-500">
                  <FiClock />

                  {task.time}
                </div>
              )}
            </div>
          </div>

          {/* Form */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
            {/* Status */}

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">
                Status at EOD
              </label>

              <select
                className="w-full mt-2 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={task.status}
                onChange={(e) => updateTask(task.id, "status", e.target.value)}
              >
                <option>Completed</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>
            </div>

            {/* Output */}

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">
                Output Link
              </label>

              <div className="relative">
                <FiLink className="absolute left-4 top-4 text-gray-400" />

                <input
                  className="w-full mt-2 border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Paste Drive / Figma Link"
                  value={task.output}
                  onChange={(e) => updateTask(task.id, "output", e.target.value)}
                />
              </div>
            </div>

            {/* Reason */}

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">
                Reason
              </label>

              <select
                className="w-full mt-2 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                value={task.reason}
                onChange={(e) => updateTask(task.id, "reason", e.target.value)}
              >
                <option>{task.reason}</option>
              </select>
            </div>

            {/* Next Action */}

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">
                Next Action
              </label>

              <select
                className="w-full mt-2 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                value={task.nextAction}
                onChange={(e) => updateTask(task.id, "nextAction", e.target.value)}
              >
                <option>{task.nextAction}</option>
              </select>
            </div>
          </div>

          {/* Alert — only show if note exists */}

          {task.note && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="text-red-600 mt-1" />

              <p className="text-red-700 text-sm">{task.note}</p>
            </div>
          )}

          {/* Reviewer */}

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Reviewed By
            </label>

            <div className="relative">
              <FiUser className="absolute left-4 top-4 text-gray-400" />

              <select
                className="w-full lg:w-72 mt-2 border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-emerald-500"
                value={task.reviewer}
                onChange={(e) => updateTask(task.id, "reviewer", e.target.value)}
              >
                <option value="">Select Reviewer</option>
                <option value="Vasanth">Vasanth</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {/* ================================
                DAY SUMMARY
      ================================= */}

      <div className="bg-slate-100 rounded-2xl shadow  mt-8 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Day Summary</h2>

          <span className="text-sm text-slate-400">
            Submitted once, covers all tasks
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div>
            <label className="text-xs uppercase font-semibold text-slate-500">
              Tools / Resource Issues
            </label>

            <input
              className="w-full mt-2 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g Photoshop crashing"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-semibold text-slate-500">
              Client Calls / Briefings
            </label>

            <input
              className="w-full mt-2 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g BlackThunder Call"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs uppercase font-semibold text-slate-500">
            Anything Else Ops Should Know
          </label>

          <textarea
            rows={5}
            placeholder="Optional free note..."
            className="w-full mt-2 border rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Footer */}

        <div className="flex flex-col md:flex-row justify-between items-center gap-5 mt-8 border-t pt-6">
          <p className="text-sm text-slate-500">
            {completedCount + pendingCount + rejectedCount} of {totalTasks} tasks logged
          </p>

          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3 rounded-xl border font-medium hover:bg-slate-100 transition">
              Save Draft
            </button>

            <button className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-lg">
              Submit EOD Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EodReports;
