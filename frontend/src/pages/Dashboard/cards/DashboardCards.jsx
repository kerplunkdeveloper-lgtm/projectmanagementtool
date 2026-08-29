import React, { useEffect } from "react";
import { FiUsers, FiBriefcase } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { getClients } from "../../../features/clients/clientslice";
import { getUsers } from "../../../features/users/userSlice";
import { getProjects } from "../../../features/projects/projectSlice";

const DashboardCards = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { clients } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { projects } = useSelector((state) => state.projects);

  useEffect(() => {
    if (!clients || clients.length === 0) dispatch(getClients());
    if (!users || users.length === 0) dispatch(getUsers());
    if (!projects || projects.length === 0) dispatch(getProjects());
  }, [dispatch, clients, users, projects]);

  // ============================================
  // CALCULATIONS
  // ============================================

  const activeClientsCount = (clients || []).filter(
    (c) => !c.status || c.status === "Active",
  ).length;

  const inactiveClientsCount = (clients || []).filter(
    (c) => c.status === "Inactive",
  ).length;

  const teamStrengthCount = users ? users.length : 0;

  const uniqueDepts = Array.from(
    new Set(
      (users || [])
        .map((u) => u.department)
        .filter((dept) => typeof dept === "string" && dept.trim() !== ""),
    ),
  )
    .filter((d) => {
      const lower = d.toLowerCase();
      return (
        !lower.includes("managing partner") &&
        !lower.includes("operation manager") &&
        !lower.includes("admin")
      );
    })
    .sort();

  // Vibrant gradients matching the reference image for departments
  const deptGradients = [
    "bg-gradient-to-r from-[#4A72FF] to-[#6049FF]", // Blue/Indigo
    "bg-gradient-to-r from-[#B450FF] to-[#8C3AFF]", // Purple
    "bg-gradient-to-r from-[#FF4E98] to-[#FF2F69]", // Pink
    "bg-gradient-to-r from-[#00C2FF] to-[#0070FF]", // Cyan/Blue
    "bg-gradient-to-r from-[#F53844] to-[#42378F]", // Red to Dark Purple
    "bg-gradient-to-r from-[#11998E] to-[#38EF7D]", // Emerald Green
    "bg-gradient-to-r from-[#FC4A1A] to-[#F7B733]", // Orange/Yellow
    "bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0]", // Violet
    "bg-gradient-to-r from-[#1D976C] to-[#93F9B9]", // Sea Green
    "bg-gradient-to-r from-[#EB3349] to-[#F45C43]", // Coral Red
    "bg-gradient-to-r from-[#FF758C] to-[#FF7EB3]", // Rose Pink
    "bg-gradient-to-r from-[#1E3C72] to-[#2A5298]", // Deep Blue
    "bg-gradient-to-r from-[#EE0979] to-[#FF6A00]", // Hot Pink to Orange
    "bg-gradient-to-r from-[#00B4DB] to-[#0083B0]", // Aqua Blue
    "bg-gradient-to-r from-[#8360C3] to-[#2EBF91]", // Purple to Mint
  ];

  const deptCards = uniqueDepts.map((dept, idx) => {
    const count = (users || []).filter((u) => u.department === dept).length;
    const gradient = deptGradients[idx % deptGradients.length];
    return {
      title: `No.of ${dept}`,
      value: count,
      gradient: gradient,
      textColor: "text-slate-900 dark:text-white",
    };
  });

  const isAdminOrOpManager =
    user?.role === "admin" || user?.role === "operationmanager";

  // ============================================
  // CARD DATA
  // ============================================

  const activeClientCard = {
    title: isAdminOrOpManager
      ? "No.of Active Clients"
      : "No.of Assigned Clients",
    value: activeClientsCount,
    gradient: "bg-gradient-to-r from-[#FFC837] to-[#FF8008]", // Golden orange
    textColor: "text-slate-900 dark:text-white",
  };

  const inactiveClientCard = {
    title: "No.of Inactive Clients",
    value: inactiveClientsCount,
    gradient: "bg-gradient-to-r from-[#FF8C94] to-[#FF5252]", // Pinkish red
    textColor: "text-slate-900 dark:text-white",
  };

  const totalStrengthCard = {
    title: "Total Team Strength",
    value: teamStrengthCount,
    gradient: "bg-gradient-to-r from-[#2AF598] to-[#009EFD]", // Teal/Green
    textColor: "text-slate-900 dark:text-white",
  };

  const rightCards = isAdminOrOpManager
    ? [...deptCards, totalStrengthCard]
    : [];

  const CardComponent = ({ card, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={{ y: -3, scale: 1.02 }}
      className={`relative overflow-hidden rounded-full shadow-md hover:shadow-lg transition-all duration-300 ${card.gradient} flex items-center px-5 py-3`}
    >
      <div className="flex items-center justify-between w-full z-10">
        <p
          className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${card.textColor}`}
        >
          {card.title}
        </p>
        <h2 className={`text-sm md:text-base font-extrabold ${card.textColor}`}>
          {card.value}
        </h2>
      </div>
      {/* Subtle overlay for dark mode readability if needed, or glossy effect */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 pointer-events-none rounded-full" />
    </motion.div>
  );

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* LEFT SIDE: Clients */}
      <div className="flex flex-col gap-4 w-full lg:w-1/4 xl:w-1/5 shrink-0">
        <CardComponent card={activeClientCard} index={0} />
        {isAdminOrOpManager && (
          <CardComponent card={inactiveClientCard} index={1} />
        )}
      </div>

      {/* RIGHT SIDE: Departments & Total Team Strength in a grid */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rightCards.map((card, index) => (
            <CardComponent key={index} card={card} index={index + 2} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
