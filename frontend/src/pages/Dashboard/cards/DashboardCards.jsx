import React, { useEffect } from "react";
import {
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";

import { motion } from "framer-motion";

import { getClients } from "../../../features/clients/clientslice";
import { getUsers } from "../../../features/users/userSlice";

const DashboardCards = () => {
  const dispatch = useDispatch();

  const { clients } = useSelector(
    (state) => state.clients
  );

  const { users } = useSelector(
    (state) => state.users
  );

  useEffect(() => {
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch]);

  // ============================================
  // CALCULATIONS
  // ============================================

  const activeClientsCount = clients ? clients.length : 0;
  const teamStrengthCount = users ? users.length : 0;

  // ============================================
  // CARD DATA
  // ============================================

  const cards = [
    {
      title: "Active Clients",
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
      title: "Projects",
      value: 0,
      icon: FiBriefcase,
      gradient: "from-blue-900 via-indigo-900 to-violet-900",
      iconBg: "bg-white/15 border border-white/10 backdrop-blur-md",
      titleColor: "text-blue-100/90",
      valueColor: "text-white",
      glowColor: "rgba(59, 130, 246, 0.4)",
      subtitle: "Total projects",
    },

    {
      title: "Team Strength",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
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
                y: -6,
                scale: 1.02,
              }}
              className={`relative overflow-hidden rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br ${card.gradient}`}
              style={{
                boxShadow: `0 15px 35px -10px ${card.glowColor}`,
              }}
            >
              {/* SHINE EFFECT Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

              {/* CONTENT */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className={`text-xs font-bold uppercase tracking-wider ${card.titleColor}`}>
                      {card.title}
                    </p>
                    <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mt-3 ${card.valueColor}`}>
                      {card.value}
                    </h2>
                    <p className={`text-[11px] font-medium mt-2 opacity-80 ${card.titleColor}`}>
                      {card.subtitle}
                    </p>
                  </div>

                  {/* ICON */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${card.iconBg}`}
                  >
                    <Icon
                      size={24}
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