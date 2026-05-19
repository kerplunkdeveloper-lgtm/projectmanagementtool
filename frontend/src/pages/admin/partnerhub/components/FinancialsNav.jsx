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
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "team", label: "Team Strength", icon: "👥" },
  { id: "clients", label: "Client Splits", icon: "🏢" },
  { id: "financials", label: "Financials", icon: "💰" },
];

const FinancialsNav = ({ activeTab, setActiveTab, onExport }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-3 animate-fadeIn print:hidden">
      {/* Spacer for centering */}
      <div className="hidden lg:block w-40"></div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#f1f3f9] border border-[#e2e8f0] rounded-2xl p-1.5 shadow-sm overflow-x-auto custom-scrollbar">


        {/* Tabs */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? "bg-[#7c5ff0] text-white shadow-md shadow-indigo-500/20"
                  : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/60"
                }
              `}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}

      </div>

      {/* Right Controls - Export */}
      <div className="w-full lg:w-40 flex justify-end mt-4 sm:mt-0">
        {activeTab === "overview" && (
          <button 
            onClick={onExport}
            className="flex items-center gap-1.5 bg-[#f8fafc] hover:bg-white text-[#475569] border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Export Report</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FinancialsNav;
