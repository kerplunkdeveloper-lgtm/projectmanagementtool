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
      gradient: "from-yellow-600 via-amber-600 to-orange-600",
      iconBg: "bg-white/15 border border-white/10 backdrop-blur-md",
      titleColor: "text-yellow-100/90",
      valueColor: "text-white",
      glowColor: "rgba(59, 130, 246, 0.4)",
      subtitle: "Total managed client accounts",
    },
    {
      title: "No.of Projects",
      value: activeProjectsCount,
      icon: FiBriefcase,
      gradient: "from-blue-900 via-indigo-900 to-violet-900",
      iconBg: "bg-white/15 border border-white/10 backdrop-blur-md",
      titleColor: "text-blue-100/90",
      valueColor: "text-white",
      glowColor: "rgba(59, 130, 246, 0.4)",
      subtitle: `Completed: ${completedProjectsCount} • On Hold: ${onHoldProjectsCount} • Inactive: ${inactiveProjectsCount} • Active: ${totalProjectsCount}`,
    },

    {
      title: "Total Strength",
      value: teamStrengthCount,
      icon: FiUsers,
      gradient: "from-emerald-500 via-teal-600 to-cyan-600",
      iconBg: "bg-white/15 border border-white/10 backdrop-blur-md",
      titleColor: "text-emerald-100/90",
      valueColor: "text-white",
      glowColor: "rgba(16, 185, 129, 0.4)",
      subtitle: "Active registered team members",
    }
  ];

  return (
    <div className="w-full">
      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{
                y: -4,
                scale: 1.01,
              }}
              className={`relative overflow-hidden rounded-2xl border border-white/20 shadow-md hover:shadow-xl transition-all duration-500 bg-gradient-to-br ${card.gradient}`}
              style={{
                boxShadow: `0 10px 25px -10px ${card.glowColor}`,
              }}
            >
              {/* SHINE EFFECT Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

              {/* CONTENT */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${card.titleColor}`}>
                      {card.title}
                    </p>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 ${card.valueColor}`}>
                      {card.value}
                    </h2>
                    <p className={`text-[10px] font-medium mt-2 opacity-80 ${card.titleColor}`}>
                      {card.subtitle}
                    </p>
                  </div>

                  {/* ICON */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${card.iconBg}`}
                  >
                    <Icon
                      size={18}
                      className="text-white"
                    />
                  </div>
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