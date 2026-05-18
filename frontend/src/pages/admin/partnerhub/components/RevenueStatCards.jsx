import React from "react";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const formatINR = (amount) =>
  `₹${amount.toLocaleString("en-IN")}`;

const StatCard = ({ label, value, sub, subType = "neutral", accent }) => {
  return (
    <div
      className="
        relative overflow-hidden
        bg-white
        border border-slate-200
        rounded-2xl
        p-6
        flex-1
        min-w-[200px]
        hover:border-violet-300
        hover:shadow-md
        transition-all duration-300
        group
        shadow-sm
      "
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: accent }}
      />

      {/* Top border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />

      <p className="text-[#94a3b8] text-[11px] font-extrabold uppercase tracking-wider mb-2">
        {label}
      </p>

      <h2
        className="text-3xl font-black mb-1"
        style={{ color: '#0f172a' }}
      >
        {formatINR(value)}
      </h2>

      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {subType === "up" && (
            <FiTrendingUp size={12} className="text-emerald-400" />
          )}
          {subType === "down" && (
            <FiTrendingDown size={12} className="text-rose-400" />
          )}
          <span
            className={`text-[11px] font-bold ${
              subType === "up"
                ? "text-emerald-500"
                : subType === "down"
                ? "text-rose-500"
                : "text-slate-500"
            }`}
          >
            {sub}
          </span>
        </div>
      )}
    </div>
  );
};

const RevenueStatCards = ({ data }) => {
  const cards = [
    {
      label: "Total Revenue (Month)",
      value: data.totalRevenue,
      sub: "+12% vs last month",
      subType: "up",
      accent: "#22d3ee",
    },
    {
      label: "Total Cost to Company",
      value: data.totalCost,
      sub: "Salaries + Overhead",
      subType: "neutral",
      accent: "#a78bfa",
    },
    {
      label: "Net Profit",
      value: data.netProfit,
      sub: `Margin ${data.marginPercent}%`,
      subType: "neutral",
      accent: "#34d399",
    },
    {
      label: "Overhead Expenses",
      value: data.overhead,
      sub: "Office, Tools, Misc",
      subType: "neutral",
      accent: "#f59e0b",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
};

export default RevenueStatCards;
