import React, { useEffect } from "react";
import { 
  FiUsers, FiBriefcase, FiVideo, FiZap, FiDollarSign, 
  FiPenTool, FiCode, FiTrendingUp, FiSearch, FiShoppingBag, 
  FiFileText, FiMessageCircle, FiMonitor, FiMoreVertical, 
  FiCalendar, FiRefreshCw, FiArrowUpRight, FiArrowDownRight 
} from "react-icons/fi";
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

  const getDeptStyles = (deptName) => {
    const lower = deptName.toLowerCase();
    if (lower.includes("cinema") || lower.includes("video")) return { icon: <FiVideo />, bg: "bg-indigo-500", color: "text-indigo-500", lightBg: "bg-indigo-50" };
    if (lower.includes("creative")) return { icon: <FiZap />, bg: "bg-purple-500", color: "text-purple-500", lightBg: "bg-purple-50" };
    if (lower.includes("finance")) return { icon: <FiDollarSign />, bg: "bg-rose-500", color: "text-rose-500", lightBg: "bg-rose-50" };
    if (lower.includes("graphic") || lower.includes("design")) return { icon: <FiPenTool />, bg: "bg-blue-500", color: "text-blue-500", lightBg: "bg-blue-50" };
    if (lower.includes("hr") || lower.includes("human")) return { icon: <FiUsers />, bg: "bg-orange-500", color: "text-orange-500", lightBg: "bg-orange-50" };
    if (lower.includes("mobile") || lower.includes("app")) return { icon: <FiCode />, bg: "bg-emerald-500", color: "text-emerald-500", lightBg: "bg-emerald-50" };
    if (lower.includes("performance") || lower.includes("market")) return { icon: <FiTrendingUp />, bg: "bg-amber-500", color: "text-amber-500", lightBg: "bg-amber-50" };
    if (lower.includes("seo")) return { icon: <FiSearch />, bg: "bg-violet-500", color: "text-violet-500", lightBg: "bg-violet-50" };
    if (lower.includes("sales")) return { icon: <FiShoppingBag />, bg: "bg-teal-500", color: "text-teal-500", lightBg: "bg-teal-50" };
    if (lower.includes("script") || lower.includes("write")) return { icon: <FiFileText />, bg: "bg-red-500", color: "text-red-500", lightBg: "bg-red-50" };
    if (lower.includes("social")) return { icon: <FiMessageCircle />, bg: "bg-pink-500", color: "text-pink-500", lightBg: "bg-pink-50" };
    if (lower.includes("web")) return { icon: <FiMonitor />, bg: "bg-blue-600", color: "text-blue-600", lightBg: "bg-blue-50" };
    
    return { icon: <FiUsers />, bg: "bg-slate-500", color: "text-slate-500", lightBg: "bg-slate-50" };
  };

  const isAdminOrOpManager = user?.role === "admin" || user?.role === "operationmanager";

  if (!isAdminOrOpManager) return null;

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 items-stretch">
      {/* LEFT SIDE: Clients Overview */}
      <div className="flex flex-col gap-4 w-full xl:w-[280px] shrink-0">
        <div className="mb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-700">
            <FiUsers size={18} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Client Overview</h2>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Summary of client activity</p>
          </div>
        </div>

        {/* Active Clients Card */}
        <div className="bg-[#24fa24] rounded-[24px] p-6 shadow-sm relative overflow-hidden group flex-1 min-h-[220px] flex flex-col">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl mb-4 shadow-lg shadow-blue-500/30">
            <FiUsers />
          </div>
          <p className="text-[16px] font-bold text-slate-800 dark:text-slate-200 mb-1">No. of Active Clients</p>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">{activeClientsCount}</h1>
          
        </div>

        {/* Inactive Clients Card */}
        {isAdminOrOpManager && (
          <div className="bg-[#f81942] rounded-[24px] p-6 shadow-sm relative overflow-hidden group flex-1 min-h-[220px] flex flex-col">
            <div className="absolute right-6 bottom-6 opacity-5 w-24 h-24 bg-rose-500 rounded-full blur-2xl pointer-events-none"></div>
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl mb-4 shadow-lg shadow-rose-500/30">
              <FiUsers />
            </div>
            <p className="text-[16px] font-bold text-slate-800 dark:text-slate-200 mb-1">No. of Inactive Clients</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">{inactiveClientsCount}</h1>
            <div className="flex items-center justify-between mt-auto pt-2 z-10">
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Team Strength */}
      <div className="flex-1 sidebar-bg rounded-[24px] p-6  shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Team Strength by Role</h2>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Overview of team members by role</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 p-2">
              <FiCalendar className="text-slate-400" size={14} />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Last Updated</span>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <button className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-3 mb-6">
          {uniqueDepts.map((dept, index) => {
            const count = (users || []).filter((u) => u.department === dept).length;
            const styles = getDeptStyles(dept);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className=" rounded-2xl p-3.5 flex items-center gap-3 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group bg-white dark:bg-slate-800/50 relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-2 right-2 p-1 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors">
                  <FiMoreVertical size={12} />
                </div>
                
                {/* Background Icon Watermark */}
                <div className={`absolute -bottom-2 -right-2 text-5xl opacity-[0.03] pointer-events-none ${styles.color}`}>
                  {styles.icon}
                </div>

                <div className={`w-11 h-11 rounded-full ${styles.bg} text-white flex items-center justify-center text-lg shrink-0 shadow-sm`}>
                  {styles.icon}
                </div>
                <div className="flex-1 pr-4">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5 line-clamp-1">{dept}</p>
                  <h3 className={`text-xl font-black leading-none ${styles.color}`}>{count}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Total Strength Footer Bar */}
        <div className="mt-auto pt-2">
          <div className="w-full bg-[#5244e8] dark:bg-indigo-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
            {/* abstract background shape */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent skew-x-12 translate-x-10"></div>
            
            <div className="flex items-center gap-3 z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <FiUsers className="text-lg" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-indigo-100 mb-0.5">Total Team Strength</p>
                <h2 className="text-2xl font-black leading-none">{teamStrengthCount}</h2>
              </div>
            </div>
            <div className="flex flex-col items-end z-10">
              <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-1 rounded backdrop-blur-sm mb-1">
                <FiArrowUpRight size={12} /> +8%
              </span>
              <span className="text-[9px] text-indigo-200">vs last month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
