import React, { useEffect } from "react";
import {
  FiUsers,
  FiDollarSign,
  FiBriefcase,
  FiTrendingUp,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";

import { motion } from "framer-motion";

import { getClients } from "../../../features/clients/clientslice";

const DashboardCards = () => {
  const dispatch = useDispatch();

  const { clients } = useSelector(
    (state) => state.clients
  );

  useEffect(() => {
    dispatch(getClients());
  }, [dispatch]);

  // ============================================
  // CALCULATIONS
  // ============================================

  const activeClientsCount = clients
    ? clients.length
    : 0;

  const totalRevenue = clients?.reduce(
    (acc, client) =>
      acc + Number(client.totalBudget || 0),
    0
  );

  const digitalMarketingCount =
    clients?.filter(
      (client) =>
        client.service ===
        "Digital Marketing"
    ).length;

  const websiteCount = clients?.filter(
    (client) =>
      client.service === "Website"
  ).length;

  // ============================================
  // CARD DATA
  // ============================================

  const cards = [
    {
      title: "Active Clients",
      value: activeClientsCount,
      icon: FiUsers,
      gradient:
        "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      text: "text-blue-600",
    }

  ];

  return (
    <div className="w-full">
      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                duration: 0.4,
                delay: index * 0.1,
              }}
              whileHover={{
                y: -4,
                scale: 1.01,
              }}
              className={`relative overflow-hidden rounded-3xl border border-white/40 backdrop-blur-xl shadow-sm hover:shadow-2xl transition-all duration-500 ${card.bg}`}
            >
              {/* TOP GLOW */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}
              ></div>

              {/* CONTENT */}
              <div className="p-5">
                {/* TOP */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {card.title}
                    </p>

                    <h2 className="text-[28px] font-bold text-gray-800 mt-3 leading-none">
                      {card.value}
                    </h2>
                  </div>

                  {/* ICON */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${card.iconBg}`}
                  >
                    <Icon
                      size={24}
                      className={card.text}
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