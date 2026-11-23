import { BRANCH_TABS } from "../../hooks/useBranchFilter";

const BranchTabs = ({ value, onChange, className = "" }) => (
  <div
    className={`flex items-center bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e2a40] rounded-xl p-1 shadow-xs ${className}`}
    role="tablist"
    aria-label="Branch"
  >
    {BRANCH_TABS.map((tab) => (
      <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={value === tab}
        onClick={() => onChange(tab)}
        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          value === tab
            ? "bg-indigo-600 text-white shadow-xs"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default BranchTabs;
