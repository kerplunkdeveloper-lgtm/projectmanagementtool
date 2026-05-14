import React from "react";

import {
  FiFolder,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const AdminHome = () => {

  const stats = [
    {
      title: "Ongoing SEO Projects",
      count: 2,
      icon: FiFolder,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Completed Projects",
      count: 8,
      icon: FiCheckCircle,
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      title: "Pending Tasks",
      count: 14,
      icon: FiClock,
      gradient: "from-yellow-500 to-orange-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      title: "High Priority",
      count: 3,
      icon: FiAlertCircle,
      gradient: "from-red-500 to-pink-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-[#0f172a]">

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Admin Dashboard
        </h1>

        <p className="text-slate-400 mt-2 text-sm sm:text-base">
          Manage all projects and team activities
        </p>

      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {stats.map((item, index) => {

          const Icon = item.icon;

          return (
            <div
              key={index}
              className={`
                relative overflow-hidden
                rounded-3xl
                border ${item.border}
                ${item.bg}
                backdrop-blur-xl
                p-6
                shadow-2xl
                hover:scale-[1.03]
                transition-all duration-300
                group
              `}
            >

              {/* Glow Effect */}
              <div
                className={`
                  absolute top-0 right-0 w-32 h-32
                  bg-gradient-to-br ${item.gradient}
                  opacity-20 blur-3xl
                `}
              />

              {/* Content */}
              <div className="relative z-10 flex items-start justify-between">

                <div>

                  <p className="text-slate-300 text-sm font-medium">
                    {item.title}
                  </p>

                  <h2 className="text-4xl font-extrabold text-white mt-3">
                    {item.count}
                  </h2>

                </div>

                <div
                  className={`
                    w-14 h-14 rounded-2xl
                    flex items-center justify-center
                    bg-gradient-to-r ${item.gradient}
                    shadow-lg
                  `}
                >
                  <Icon className="text-white text-2xl" />
                </div>

              </div>

              {/* Bottom */}
              <div className="relative z-10 mt-6">

                <div className="flex items-center justify-between">

                  <span className="text-slate-400 text-sm">
                    Updated just now
                  </span>

                  <button
                    className="
                      text-white text-sm font-semibold
                      hover:text-cyan-300
                      transition
                    "
                  >
                    View →
                  </button>

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* SEO Project Section */}
      <div className="mt-10">

        <div
          className="
            rounded-3xl
            bg-gradient-to-r from-cyan-500 to-blue-600
            p-6 sm:p-8
            shadow-2xl
            overflow-hidden
            relative
          "
        >

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

            <div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Ongoing SEO Projects
              </h2>

              <p className="text-cyan-100 mt-2 max-w-xl">
                Currently managing 2 active SEO campaigns with ongoing
                optimization, keyword research, and performance tracking.
              </p>

            </div>

            <div className="flex gap-4">

              <div className="bg-white/10 backdrop-blur-lg px-6 py-4 rounded-2xl text-center">
                <h3 className="text-white text-3xl font-bold">
                  2
                </h3>
                <p className="text-cyan-100 text-sm">
                  Active Projects
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminHome;