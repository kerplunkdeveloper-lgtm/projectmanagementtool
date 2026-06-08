import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiTrash2,
  FiEdit3,
  FiCheck,
  FiChevronLeft,
  FiMoreHorizontal,
  FiCalendar,
  FiStar,
  FiSearch,
  FiX,
  FiArrowRight,
  FiFolder,
} from "react-icons/fi";
import { LuPlus, LuFolderOpen } from "react-icons/lu";

import {
  getProjects,
  createProject,
} from "../../../features/projects/projectSlice";
import { getTasks } from "../../../features/tasks/taskSlice";
import { getUsers } from "../../../features/users/userSlice";
import {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addProjectsToPortfolio,
  removeProjectFromPortfolio,
} from "../../../features/portfolio/portfolioSlice";

const Portfolio = () => {
  const dispatch = useDispatch();

  // Redux state
  const { projects } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  const { users } = useSelector((state) => state.users);
  const { portfolios: rawPortfolios, loading: portfolioLoading } = useSelector((state) => state.portfolios);

  // Normalize projectIds into a list of strings to handle backend populate
  const portfolios = useMemo(() => {
    return rawPortfolios.map(p => ({
      ...p,
      projectIdsList: (p.projectIds || []).map(proj => typeof proj === 'object' && proj !== null ? proj._id : proj)
    }));
  }, [rawPortfolios]);

  // Local UI state
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [showAddProjectDropdown, setShowAddProjectDropdown] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [selectedAddProjects, setSelectedAddProjects] = useState([]);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Modal & form states for create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioColor, setPortfolioColor] = useState("#ff80bf");
  const [portfolioId, setPortfolioId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => setMenuOpenId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Fetch all data on load
  useEffect(() => {
    dispatch(getProjects());
    dispatch(getTasks());
    dispatch(getUsers());
    dispatch(getPortfolios());
  }, [dispatch]);

  // Open create modal
  const handleOpenCreateModal = () => {
    setPortfolioName("New Portfolio");
    setPortfolioColor("#ff80bf");
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (p) => {
    setPortfolioId(p._id);
    setPortfolioName(p.name);
    setPortfolioColor(p.color || "#ff80bf");
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Save portfolio from modal (create or update)
  const handleSavePortfolio = (e) => {
    e.preventDefault();
    if (!portfolioName.trim()) return;
    if (isEditMode) {
      dispatch(updatePortfolio({ id: portfolioId, data: { name: portfolioName.trim(), color: portfolioColor } }));
    } else {
      dispatch(createPortfolio({ name: portfolioName.trim(), color: portfolioColor }));
    }
    setIsModalOpen(false);
  };

  // Delete portfolio
  const handleDeletePortfolio = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this portfolio folder?")) {
      dispatch(deletePortfolio(id));
      if (selectedPortfolioId === id) setSelectedPortfolioId(null);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (e, portfolio) => {
    e.stopPropagation();
    dispatch(updatePortfolio({ id: portfolio._id, data: { isFavorite: !portfolio.isFavorite } }));
  };

  // Batch add selected projects to portfolio
  const handleBatchAddProjects = () => {
    if (!selectedAddProjects.length || !activePortfolio) return;
    dispatch(addProjectsToPortfolio({ id: activePortfolio._id, projectIds: selectedAddProjects }));
    setSelectedAddProjects([]);
    setShowAddProjectDropdown(false);
    setProjectSearchQuery("");
  };

  // Remove project from current portfolio
  const handleRemoveProject = (projectId) => {
    if (!activePortfolio) return;
    dispatch(removeProjectFromPortfolio({ id: activePortfolio._id, projectId }));
  };

  // Create a brand-new project and immediately add it to this portfolio
  const handleCreateAndAddProject = async () => {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const result = await dispatch(
        createProject({ name: newProjectName.trim(), status: "Active" }),
      );
      const newProj = result?.payload?.data;
      if (newProj?._id && activePortfolio) {
        dispatch(addProjectsToPortfolio({ id: activePortfolio._id, projectIds: [newProj._id] }));
      }
    } finally {
      setCreatingProject(false);
      setNewProjectName("");
      setShowCreateProjectForm(false);
      setShowAddProjectDropdown(false);
    }
  };

  // Find current active portfolio details
  const activePortfolio = portfolios.find((p) => p._id === selectedPortfolioId);

  // Guard clause to prevent rendering detail view before portfolios state is loaded/resolved
  if (selectedPortfolioId && !activePortfolio) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700/60 shadow-sm">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Resolving portfolio group...
        </p>
        <button
          onClick={() => setSelectedPortfolioId(null)}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-3 hover:underline uppercase tracking-wider block mx-auto"
        >
          Go Back to Directory
        </button>
      </div>
    );
  }

  // Get status badge colors
  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50";
      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50";
      default:
        return "bg-slate-50 text-slate-605 border-slate-205 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
    }
  };

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 md:p-0  transition-all duration-300">
      <AnimatePresence mode="wait">
        {!selectedPortfolioId ? (
          /* ========================================================
             VIEW 1: PORTFOLIO GRID DIRECTORY (IMAGE 1)
             ======================================================== */
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">
                Portfolios Dashboard
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">
                Group projects into custom folder portfolios for high-level
                management
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {/* "+ New portfolio" Card */}
              <button
                onClick={handleOpenCreateModal}
                className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/40 hover:bg-blue-50/10 dark:bg-slate-900/10 rounded-[2.5rem] h-60 transition-all duration-300 cursor-pointer shadow-sm relative"
              >
                <div className="w-12 h-12 rounded-xl border border-slate-250 dark:border-slate-750 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-300 dark:group-hover:border-blue-800 transition-all shadow-inner">
                  <FiPlus
                    size={22}
                    className="group-hover:scale-110 transition-transform"
                  />
                </div>
                <span className="text-xs font-black text-slate-655 dark:text-slate-300 mt-4 group-hover:text-blue-500 transition-colors uppercase tracking-wider">
                  New portfolio
                </span>
              </button>

              {portfolios.map((portfolio) => {
                return (
                  <div
                    key={portfolio._id}
                    onDoubleClick={() => {
                      setSelectedPortfolioId(portfolio._id);
                    }}
                    className="group flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer relative text-center"
                  >
                    {/* Folder Container */}
                    <div className="relative w-36 h-28 flex items-center justify-center shrink-0">
                      <svg
                        viewBox="0 0 240 180"
                        className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                        style={{ fill: portfolio.color || "#ff80bf" }}
                      >
                        <path d="M 16 0 A 16 16 0 0 0 0 16 L 0 144 A 16 16 0 0 0 16 160 L 224 160 A 16 16 0 0 0 240 144 L 240 48 A 16 16 0 0 0 224 32 L 120 32 L 96 6 A 16 16 0 0 0 80 0 Z" />
                      </svg>

                      {/* Star Icon (Top-Left inside folder) */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, portfolio)}
                        className="absolute top-7 left-4 text-white/85 hover:text-white transition-colors cursor-pointer"
                      >
                        <FiStar
                          size={15}
                          className={
                            portfolio.isFavorite ? "fill-white text-white" : ""
                          }
                        />
                      </button>

                      {/* Actions Menu Trigger (Top-Right inside folder) */}
                      <div
                        className="absolute top-7 right-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === portfolio._id ? null : portfolio._id,
                            )
                          }
                          className="text-white/85 hover:text-white transition-colors cursor-pointer flex items-center justify-center p-0.5"
                        >
                          <FiMoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpenId === portfolio._id && (
                          <div className="absolute right-0 mt-1.5 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-150 dark:border-slate-700 py-1 z-30">
                            <button
                              onClick={() => {
                                handleOpenEditModal(portfolio);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2"
                            >
                              <FiEdit3 size={12} className="text-slate-400" />{" "}
                              Edit Details
                            </button>
                            <button
                              onClick={(e) => {
                                handleDeletePortfolio(e, portfolio._id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                            >
                              <FiTrash2 size={12} className="text-red-400" />{" "}
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider truncate mt-4 w-full px-2">
                      {portfolio.name}
                    </h3>

                    {/* Project count — only count IDs that still exist in Redux */}
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase mt-1">
                      {(portfolio.projectIdsList || []).filter(id => projects.some(p => p._id === id)).length} Project
                      {(portfolio.projectIdsList || []).filter(id => projects.some(p => p._id === id)).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* ========================================================
             VIEW 2: PORTFOLIO DETAIL WORKSPACE (IMAGE 2)
             ======================================================== */
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Breadcrumb Back Button */}
            <button
              onClick={() => setSelectedPortfolioId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 transition-colors"
            >
              <FiChevronLeft size={16} />
              Back to Portfolios
            </button>

            {/* Premium Header Block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-sm shrink-0"
                  style={{
                    backgroundColor: activePortfolio.color || "#ff80bf",
                  }}
                >
                  <LuFolderOpen size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      {activePortfolio.name}
                    </h1>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    Portfolio Group Workspace •{" "}
                    {(activePortfolio.projectIdsList || []).filter(id => projects.some(p => p._id === id)).length} Project
                    {(activePortfolio.projectIdsList || []).filter(id => projects.some(p => p._id === id)).length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-[350px] space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 ">
                <div>
                  <button
                    onClick={() => {
                      setSelectedAddProjects([]);
                      setProjectSearchQuery("");
                      setShowAddProjectDropdown(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <LuPlus
                      size={14}
                      className="text-slate-500 dark:text-slate-400"
                    />
                    Add work
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <button className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    Filter
                  </button>
                  <button className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    Sort
                  </button>
                  <button className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    Group
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <FiMoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              {/* Grouped Projects Table (Image 2) */}
              <div className="overflow-x-auto bg-white dark:bg-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50  text-slate-405 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3.5">ProjectName</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Task progress</th>
                      <th className="px-6 py-3.5">Due date</th>
                      <th className="px-6 py-3.5">Priority</th>
                      <th className="px-6 py-3.5 text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {activePortfolio.projectIdsList?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic"
                        >
                          No projects added. Choose "+ Add work" or search below
                          to group projects inside this portfolio.
                        </td>
                      </tr>
                    ) : (
                      activePortfolio.projectIdsList.map((projId) => {
                        const project = projects.find((p) => p._id === projId);
                        if (!project) return null;

                        // Calculate progress percentage
                        const projectTasks = tasks.filter(
                          (t) =>
                            t.project?._id === projId || t.project === projId,
                        );
                        const totalTasks = projectTasks.length;
                        const completedTasks = projectTasks.filter(
                          (t) => t.status === "Completed",
                        ).length;
                        const progressPercent =
                          totalTasks > 0
                            ? Math.round((completedTasks / totalTasks) * 100)
                            : 0;

                        // Calculate due date (maximum task due date)
                        const dueDates = projectTasks
                          .map((t) => t.dueDate)
                          .filter(Boolean)
                          .map((d) => new Date(d).getTime());
                        const latestDueDate =
                          dueDates.length > 0
                            ? new Date(Math.max(...dueDates))
                            : null;

                        // Calculate highest priority task
                        const priorities = projectTasks
                          .map((t) => t.priority)
                          .filter(Boolean);
                        const highestPriority = priorities.includes("High")
                          ? "High"
                          : priorities.includes("Medium")
                            ? "Medium"
                            : priorities.includes("Low")
                              ? "Low"
                              : "Medium";

                        return (
                          <tr
                            key={projId}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors"
                          >
                            {/* Name */}
                            <td className="px-6 py-4 font-black text-slate-800 dark:text-white uppercase tracking-wider">
                              {project.name}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span
                                className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusBadge(project.status)}`}
                              >
                                {project.status || "Active"}
                              </span>
                            </td>

                            {/* Task Progress */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5 max-w-[140px]">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-450 dark:text-slate-500">
                                  <span>
                                    {completedTasks}/{totalTasks} Tasks
                                  </span>
                                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                                    {progressPercent}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-350"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Due Date */}
                            <td className="px-6 py-4 font-semibold text-slate-655 dark:text-slate-400">
                              {latestDueDate ? (
                                <span className="flex items-center gap-1">
                                  <FiCalendar
                                    size={11}
                                    className="text-slate-400"
                                  />
                                  {latestDueDate.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                                  No due date
                                </span>
                              )}
                            </td>

                            {/* Priority */}
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                                  highestPriority === "High"
                                    ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
                                    : highestPriority === "Medium"
                                      ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
                                      : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                                }`}
                              >
                                {highestPriority}
                              </span>
                            </td>

                            {/* Remove Project Option */}
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleRemoveProject(projId)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 rounded transition-colors"
                                title="Remove from group"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================
           BATCH ADD WORK MODAL
          ==================================================== */}
      <AnimatePresence>
        {showAddProjectDropdown && activePortfolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddProjectDropdown(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-150 dark:border-slate-800 shadow-2xl z-10 flex flex-col"
              style={{ maxHeight: "85vh" }}
            >
              {/* Header */}
              <div className="mb-5">
                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Add work to portfolio
                </h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-wider">
                  {activePortfolio.name} • select projects to add
                </p>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search projects..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full bg-slate-50  dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-[#e5ff00]/50 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Select All toggle */}
              {(() => {
                const available = projects
                  .filter((p) => !activePortfolio.projectIdsList.includes(p._id))
                  .filter((p) =>
                    p.name
                      ?.toLowerCase()
                      .includes(projectSearchQuery.toLowerCase()),
                  );
                if (available.length === 0) return null;
                const allSelected = available.every((p) =>
                  selectedAddProjects.includes(p._id),
                );
                return (
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800/80 px-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {available.length} available
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (allSelected) {
                          setSelectedAddProjects((prev) =>
                            prev.filter(
                              (id) => !available.some((a) => a._id === id),
                            ),
                          );
                        } else {
                          setSelectedAddProjects((prev) =>
                            Array.from(
                              new Set([
                                ...prev,
                                ...available.map((a) => a._id),
                              ]),
                            ),
                          );
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-[#e5ff00] hover:underline cursor-pointer transition-colors"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                );
              })()}

              {/* Project list */}
              <div
                className="flex-1 overflow-y-auto space-y-1.5 pr-1"
                style={{ minHeight: "120px", maxHeight: "340px" }}
              >
                {(() => {
                  const available = projects
                    .filter((p) => !activePortfolio.projectIdsList.includes(p._id))
                    .filter((p) =>
                      p.name
                        ?.toLowerCase()
                        .includes(projectSearchQuery.toLowerCase()),
                    );

                  if (
                    projects.filter(
                      (p) => !activePortfolio.projectIdsList.includes(p._id),
                    ).length === 0
                  ) {
                    return (
                      <div className="text-center py-10 text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                        All projects are already in this portfolio.
                      </div>
                    );
                  }

                  if (available.length === 0) {
                    return (
                      <div className="text-center py-10 text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                        No projects match your search.
                      </div>
                    );
                  }

                  return available.map((proj) => {
                    const isChecked = selectedAddProjects.includes(proj._id);
                    return (
                      <div
                        key={proj._id}
                        onClick={() => {
                          setSelectedAddProjects((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== proj._id)
                              : [...prev, proj._id],
                          );
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-blue-50/60 border-blue-200 dark:bg-[#e5ff00]/10 dark:border-[#e5ff00]/40"
                            : "bg-slate-50/40 border-slate-100 dark:bg-slate-950/40 dark:border-slate-850 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 dark:bg-[#e5ff00] dark:border-[#e5ff00]"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {isChecked && (
                            <FiCheck
                              size={11}
                              className="text-white dark:text-black font-black"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider truncate">
                            {proj.name}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                            {proj.status || "Active"}
                          </p>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${getStatusBadge(proj.status)}`}
                        >
                          {proj.status || "Active"}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {selectedAddProjects.length > 0
                    ? `${selectedAddProjects.length} selected`
                    : "None selected"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddProjectDropdown(false)}
                    className="px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchAddProjects}
                    disabled={selectedAddProjects.length === 0}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                      selectedAddProjects.length > 0
                        ? "bg-gradient-to-b from-[#92d1ef] via-[#69afe2] to-[#408ed8] text-white dark:bg-none dark:bg-[#e5ff00] dark:text-black cursor-pointer hover:opacity-95"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50 shadow-none"
                    }`}
                  >
                    Add{" "}
                    {selectedAddProjects.length > 0
                      ? `(${selectedAddProjects.length})`
                      : ""}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE/EDIT PORTFOLIO MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10"
            >
              <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">
                {isEditMode ? "Edit Portfolio Group" : "Create New Portfolio"}
              </h2>

              <form onSubmit={handleSavePortfolio} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Portfolio Name
                  </label>
                  <input
                    type="text"
                    required
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    placeholder="e.g. WEB DEVELOPER"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Color Selection Field */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Choose Folder Color
                  </label>

                  {/* Swatches Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { name: "Pink", value: "#ff80bf" },
                      { name: "Orange", value: "#f5a623" },
                      { name: "Blue", value: "#4a90e2" },
                      { name: "Green", value: "#7ed321" },
                      { name: "Purple", value: "#9013fe" },
                      { name: "Red", value: "#d0021b" },
                      { name: "Teal", value: "#50e3c2" },
                      { name: "Yellow", value: "#f8e71c" },
                      { name: "Lavender", value: "#bd10e0" },
                      { name: "Slate", value: "#9b9b9b" },
                    ].map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setPortfolioColor(col.value)}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center shadow-inner relative hover:scale-110 active:scale-95"
                        style={{ backgroundColor: col.value }}
                        title={col.name}
                      >
                        {portfolioColor === col.value && (
                          <FiCheck
                            size={14}
                            className="text-white drop-shadow-sm font-black"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="relative w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner shrink-0">
                      <input
                        type="color"
                        value={portfolioColor}
                        onChange={(e) => setPortfolioColor(e.target.value)}
                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        Custom color picker
                      </span>
                      <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                        {portfolioColor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-white dark:text-black transition-all shadow-md bg-gradient-to-b from-[#92d1ef] via-[#69afe2] to-[#408ed8] dark:bg-[#e5ff00] dark:bg-none hover:opacity-95 active:scale-95"
                  >
                    {isEditMode ? "Save Changes" : "Create Portfolio"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Portfolio;
