import React from "react";

export const ProjectIcon = ({ name, size = "sm", className = "" }) => {
  const char = name ? name.trim().charAt(0).toUpperCase() : "?";

  // Curated, stylish light/dark color schemes
  const getColors = (str) => {
    const schemes = [
      {
        // Indigo
        classes:
          "bg-indigo-50/80 text-indigo-600 border-indigo-100/70 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
      },
      {
        // Neon Accent / Dark Grey
        classes:
          "bg-emerald-50/80 text-emerald-600 border-emerald-100/70 dark:bg-[#3b82f6]/10 dark:text-[#3b82f6] dark:border-[#3b82f6]/20",
      },
      {
        // Rose / Pink
        classes:
          "bg-rose-50/80 text-rose-600 border-rose-100/70 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
      },
      {
        // Amber / Orange
        classes:
          "bg-amber-50/80 text-amber-600 border-amber-100/70 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      },
      {
        // Purple / Violet
        classes:
          "bg-purple-50/80 text-purple-600 border-purple-100/70 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
      },
      {
        // Cyan / Sky Blue
        classes:
          "bg-cyan-50/80 text-cyan-600 border-cyan-100/70 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30",
      },
    ];

    if (!str) return schemes[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % schemes.length;
    return schemes[index];
  };

  const scheme = getColors(name);

  // Responsive / standard size classes
  const sizeClasses = {
    xs: "w-4 h-4 text-[8px] italic rounded",
    sm: "w-5 h-5 text-[9.5px] italic rounded",
    md: "w-6 h-6 text-[11px] italic rounded-lg",
    lg: "w-8 h-8 text-[14px] italic rounded-lg",
    xl: "w-10 h-10 text-[16px] italic rounded-xl",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <div
      className={`flex items-center justify-center shrink-0 font-black shadow-sm border ${scheme.classes} ${sizeClass} ${className}`}
    >
      {char}
    </div>
  );
};

export default ProjectIcon;
