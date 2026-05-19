import React from "react";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiBriefcase, FiPieChart } from "react-icons/fi";

const formatINR = (amount) =>
  `₹${amount.toLocaleString("en-IN")}`;

const ICONS = {
  revenue:   { icon: FiDollarSign, color: "text-cyan-400 bg-white/10" },
  cost:      { icon: FiBriefcase,  color: "text-violet-400 bg-white/10" },
  profit:    { icon: FiActivity,   color: "text-emerald-400 bg-white/10" },
  overhead:  { icon: FiPieChart,   color: "text-amber-400 bg-white/10" },
};

const StatCard = ({ label, value, sub, subType = "neutral", bg, glow, iconKey }) => {
  const IconComponent = ICONS[iconKey]?.icon || FiDollarSign;

  return (
    <div
      className={`
        relative overflow-hidden
        ${bg}
        rounded-2xl
        p-4
        flex-1
        min-w-[240px]
        hover:shadow-xl
        hover:-translate-y-1
        transition-all duration-300
        group
        shadow-sm
        border border-white/10
      `}
    >
      {/* Glow */}
      <div
        className={`absolute -inset-10 bg-gradient-to-r ${glow} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500`}
      />

      {/* Light streak */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <p className="text-white/70 text-[10px] font-black uppercase tracking-wider">
          {label}
        </p>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${ICONS[iconKey]?.color} backdrop-blur-md`}>
          <IconComponent size={14} className="text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-white leading-none mb-2 relative z-10 tracking-tight drop-shadow-sm">
        {formatINR(value)}
      </h2>

      {sub && (
        <div className="flex items-center gap-1 mt-1 relative z-10 bg-white/10 border border-white/5 rounded-lg py-1 px-2.5 self-start w-fit backdrop-blur-sm">
          {subType === "up" && (
            <FiTrendingUp size={12} className="text-emerald-300" />
          )}
          {subType === "down" && (
            <FiTrendingDown size={12} className="text-rose-300" />
          )}
          <span
            className={`text-[10px] font-bold ${
              subType === "up"
                ? "text-emerald-300"
                : subType === "down"
                ? "text-rose-300"
                : "text-white/80"
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
      label: "Total Revenue",
      value: data.totalRevenue,
      sub: "+12% vs last month",
      subType: "up",
      bg: "bg-gradient-to-br from-yellow-500 via-yellow-400 to-orange-400",
      glow: "from-yellow-400 to-orange-400",
      iconKey: "revenue"
    },
    {
      label: "Cost to Company",
      value: data.totalCost,
      sub: "Salaries + Overhead",
      subType: "neutral",
      bg: "bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-600",
      glow: "from-violet-400 to-purple-400",
      iconKey: "cost"
    },
    {
      label: "Net Profit",
      value: data.netProfit,
      sub: `Margin ${data.marginPercent}%`,
      subType: "neutral",
      bg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600",
      glow: "from-emerald-400 to-teal-400",
      iconKey: "profit"
    },
    {
      label: "Overhead Expenses",
      value: data.overhead,
      sub: "Office, Tools, Misc",
      subType: "neutral",
      bg: "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500",
      glow: "from-amber-400 to-orange-400",
      iconKey: "overhead"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
};

export default RevenueStatCards;
