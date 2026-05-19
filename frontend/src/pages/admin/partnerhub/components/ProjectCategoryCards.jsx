import React from "react";

const formatINR = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const ProjectCategoryCards = ({ categories }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
      {categories.map((cat, i) => (
        <div
          key={i}
          className="
            relative overflow-hidden
            bg-white
            border border-slate-200
            rounded-xl
            p-3
            text-center
            hover:border-violet-300
            hover:shadow-lg
            hover:-translate-y-1
            transition-all duration-300
            group
            shadow-sm
          "
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${cat.color}, transparent 70%)`,
            }}
          />

          {/* Count */}
          <div
            className="text-3xl font-black mb-1"
            style={{ color: cat.color }}
          >
            {cat.count}
          </div>

          {/* Name */}
          <h3 className="text-[#1e293b] font-extrabold text-sm mb-0.5">{cat.name}</h3>

          {/* Tags */}
          <p className="text-slate-500 text-[11px] font-medium mb-2">{cat.tags}</p>

          {/* Revenue badge */}
          <div
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold"
            style={{
              background: `${cat.color}15`,
              color: cat.color,
            }}
          >
            {formatINR(cat.revenue)} revenue
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectCategoryCards;
