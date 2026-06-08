import React, { useEffect } from "react";
import {
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";

import { motion } from "framer-motion";

import { getClients } from "../../../features/clients/clientslice";
import { getUsers } from "../../../features/users/userSlice";
import { getProjects } from "../../../features/projects/projectSlice";

const DashboardCards = () => {
  const dispatch = useDispatch();

  const { clients } = useSelector(
    (state) => state.clients
  );

  const { users } = useSelector(
    (state) => state.users
  );

  const { projects } = useSelector(
    (state) => state.projects
  );

  useEffect(() => {
    dispatch(getClients());
    dispatch(getUsers());
    dispatch(getProjects());
  }, [dispatch]);

  // ============================================
  // CALCULATIONS
  // ============================================

  const activeClientsCount = clients ? clients.length : 0;
  const teamStrengthCount = users ? users.length : 0;
  const activeProjectsCount = projects ? projects.filter(p => p.status === "Active").length : 0;
  const completedProjectsCount = projects ? projects.filter(p => p.status === "Completed").length : 0;
  const onHoldProjectsCount = projects ? projects.filter(p => p.status === "On Hold").length : 0;
  const inactiveProjectsCount = projects ? projects.filter(p => p.status === "Inactive").length : 0;
  const totalProjectsCount = projects ? projects.length : 0;

  // ============================================
  // CARD DATA
  // ============================================

  const cards = [
    {
      title: "No.of Active Clients",
      value: activeClientsCount,
      icon: FiBriefcase,
      gradient: "bg-gradient-to-br from-amber-300 to-orange-400 dark:from-amber-400/10 dark:to-orange-400/5",
      border: "border-white/30 dark:border-amber-500/20",
      titleColor: "text-amber-50 dark:text-amber-400",
      valueColor: "text-white dark:text-amber-300",
      glowColor: "rgba(245, 158, 11, 0.4)",
      subtitleColor: "text-white/80 dark:text-amber-500/70",
      subtitle: "Total managed client accounts",
    },
    {
      title: "No.of Projects",
      value: activeProjectsCount,
      icon: FiBriefcase,
      gradient: "bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-400/10 dark:to-indigo-400/5",
      border: "border-white/30 dark:border-blue-500/20",
      titleColor: "text-blue-50 dark:text-blue-400",
      valueColor: "text-white dark:text-blue-300",
      glowColor: "rgba(59, 130, 246, 0.4)",
      subtitleColor: "text-white/80 dark:text-blue-500/70",
      subtitle: `Completed: ${completedProjectsCount} • On Hold: ${onHoldProjectsCount} • Inactive: ${inactiveProjectsCount} • Active: ${totalProjectsCount}`,
    },
    {
      title: "Total Strength",
      value: teamStrengthCount,
      icon: FiUsers,
      gradient: "bg-gradient-to-br from-emerald-300 to-teal-400 dark:from-emerald-400/10 dark:to-teal-400/5",
      border: "border-white/30 dark:border-emerald-500/20",
      titleColor: "text-emerald-50 dark:text-emerald-400",
      valueColor: "text-white dark:text-emerald-300",
      glowColor: "rgba(16, 185, 129, 0.4)",
      subtitleColor: "text-white/80 dark:text-emerald-500/70",
      subtitle: "Active registered team members",
    }
  ];

  return (
    <div className="w-full">
      {/* GRID */}
      <div className="grid grid-cols-1 gap-4 ">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
           <motion.div
  key={index}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.5,
    delay: index * 0.1,
    ease: "easeOut",
  }}
  whileHover={{
    y: -3,
    scale: 1.01,
  }}
  className={`relative overflow-hidden rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 theme-bg-card ${card.gradient} ${card.border}`}
>
  <div className="px-4 py-3 md:px-6 md:py-3 flex items-center justify-between relative z-10">
    
    <p
      className={`text-xs md:text-sm uppercase tracking-wider font-bold ${card.titleColor}`}
    >
      {card.title}
    </p>

    <div className="flex flex-col items-end">
      <h2
        className={`text-base md:text-lg font-bold ${card.valueColor}`}
      >
        {card.value}
      </h2>
    </div>

  </div>
</motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCards;