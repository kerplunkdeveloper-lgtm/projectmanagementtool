import React from "react";
import {
  FiBarChart2,
  FiFolder,
  FiUsers,
  FiPieChart,
  FiDollarSign,
  FiDownload,
} from "react-icons/fi";

const tabs = [
  { id: "overview", label: "Overview", icon: FiBarChart2 },
  { id: "projects", label: "Projects", icon: FiFolder },
  { id: "team", label: "Team Strength", icon: FiUsers },
  { id: "clients", label: "Client Splits", icon: FiPieChart },
  { id: "financials", label: "Financials", icon: FiDollarSign },
];

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const FinancialsNav = ({ activeTab, setActiveTab, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear }) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0e1a2e] border border-[#1e2d45] rounded-xl p-1 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Month + Year Selector */}
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-[#0e1a2e] border border-[#1e2d45] text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-[#0e1a2e] border border-[#1e2d45] text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Export */}
        <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-violet-500/25 whitespace-nowrap">
          <FiDownload size={14} />
          <span className="hidden sm:inline">Export Report</span>
        </button>
      </div>
    </div>
  );
};

export default FinancialsNav;
