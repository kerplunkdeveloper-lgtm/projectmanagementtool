import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FiChevronDown,
  FiSearch,
  FiCheck,
  FiFolder,
  FiPlus,
  FiX,
  FiLayers,
  FiArrowLeft,
  FiGrid,
  FiBriefcase,
} from "react-icons/fi";
import { LuVideo, LuBuilding2, LuFolderKanban, LuClapperboard } from "react-icons/lu";

import {
  getProjects,
  createProject,
} from "../../features/projects/projectSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import ProjectTaskBoard from "./ProjectTaskBoard";
import ClientBadge, {
  getClientBranding,
} from "../../components/common/ClientBadge";
import { getClientIconComponent } from "../../utils/clientHelpers";
import toast from "react-hot-toast";

const CinematographerTasks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux State
  const { projects = [], loading: projectsLoading } = useSelector(
    (state) => state.projects,
  );
  const { clients = [], loading: clientsLoading } = useSelector(
    (state) => state.clients,
  );
  const { users = [] } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const role = currentUser?.role || "team";
  const isExecutive =
    role === "admin" || role === "operationmanager";
  // Full task management permissions (Create, Read, Update, Delete) like in ProjectTaskBoard
  const isAdminOrManager = true;

  const currentUserId = currentUser?._id || currentUser?.id || "";
  const currentUserIdStr = currentUserId ? String(currentUserId) : "";

  // Filter clients based on user role:
  // Admin & Operation Manager see ALL clients.
  // Cinematographer / other users see assigned clients, or clients referenced by their accessible projects.
  const accessibleClients = useMemo(() => {
    if (isExecutive) return clients || [];
    if (!clients || clients.length === 0) return [];

    // Filter to clients explicitly assigned to this user
    const userExplicitClients = (clients || []).filter((c) => {
      const assignedList = Array.isArray(c.assignedTo)
        ? c.assignedTo
        : (c.assignedTo ? [c.assignedTo] : []);
      const isAssigned = assignedList.some((u) => {
        const uid = u?._id || u?.id || u;
        return String(uid) === currentUserIdStr;
      });
      const isCreator =
        String(c.createdBy?._id || c.createdBy?.id || c.createdBy) ===
        currentUserIdStr;
      return isAssigned || isCreator;
    });

    if (userExplicitClients.length > 0) return userExplicitClients;

    // Check if clients are referenced by any projects belonging to the user
    const projClientIds = new Set(
      (projects || [])
        .map((p) => {
          if (!p.client) return null;
          return typeof p.client === "object"
            ? String(p.client._id || p.client.id)
            : String(p.client);
        })
        .filter(Boolean),
    );

    const projMatchedClients = (clients || []).filter((c) =>
      projClientIds.has(String(c._id)),
    );
    if (projMatchedClients.length > 0) return projMatchedClients;

    // Fallback: Whatever clients backend returned to this non-admin user
    return clients || [];
  }, [clients, projects, currentUserIdStr, isExecutive]);

  const accessibleClientIds = useMemo(() => {
    return new Set(accessibleClients.map((c) => String(c._id)));
  }, [accessibleClients]);

  // Filter projects based on accessible clients
  const accessibleProjects = useMemo(() => {
    if (isExecutive) return projects || [];
    if (!projects || projects.length === 0) return [];

    if (accessibleClientIds.size > 0) {
      const filtered = (projects || []).filter((p) => {
        const cId = p.client
          ? typeof p.client === "object"
            ? String(p.client._id || p.client.id)
            : String(p.client)
          : null;
        if (cId && accessibleClientIds.has(cId)) return true;
        const creatorId = p.createdBy
          ? typeof p.createdBy === "object"
            ? String(p.createdBy._id || p.createdBy.id)
            : String(p.createdBy)
          : null;
        if (creatorId && creatorId === currentUserIdStr) return true;
        return false;
      });
      if (filtered.length > 0) return filtered;
    }

    return projects || [];
  }, [projects, accessibleClientIds, currentUserIdStr, isExecutive]);

  // Fetch fresh initial data on mount
  useEffect(() => {
    dispatch(getProjects());
    dispatch(getClients());
    if (!users || users.length === 0) dispatch(getUsers());
  }, [dispatch]);

  // Selected Client & Project State - Defaults to first accessible client
  const paramClientId = searchParams.get("clientId");
  const paramProjectId =
    searchParams.get("id") || searchParams.get("projectId");

  const [selectedClientId, setSelectedClientId] = useState(() => {
    const saved = localStorage.getItem("cinematographer_tasks_last_client_id");
    return paramClientId || (saved && saved !== "all" ? saved : "");
  });

  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const saved = localStorage.getItem("cinematographer_tasks_last_project_id");
    return paramProjectId || (saved && saved !== "all" ? saved : "");
  });

  // Client dropdown modal / portal state
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientDropdownCoords, setClientDropdownCoords] = useState({
    top: 0,
    left: 0,
    width: 280,
  });
  const clientDropdownBtnRef = useRef(null);

  // Project selector dropdown state (if client has multiple projects)
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownBtnRef = useRef(null);

  // Quick Create Project Modal State
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Map of client -> projects
  const clientProjectsMap = useMemo(() => {
    const map = {};
    (accessibleProjects || []).forEach((proj) => {
      const cId = proj.client?._id || proj.client;
      if (cId) {
        if (!map[cId]) map[cId] = [];
        map[cId].push(proj);
      }
    });
    return map;
  }, [accessibleProjects]);

  // Ensure an active client is selected from accessibleClients
  useEffect(() => {
    if (!accessibleClients || accessibleClients.length === 0) return;

    const exists = accessibleClients.some((c) => c._id === selectedClientId);
    if (!selectedClientId || selectedClientId === "all" || !exists) {
      const firstClient = accessibleClients[0];
      if (firstClient) {
        setSelectedClientId(firstClient._id);
        localStorage.setItem("cinematographer_tasks_last_client_id", firstClient._id);
      }
    }
  }, [accessibleClients, selectedClientId]);

  // Projects belonging to currently selected client
  const currentClientProjects = useMemo(() => {
    if (!selectedClientId || selectedClientId === "all") return [];
    return (accessibleProjects || []).filter((p) => {
      const cId = p.client?._id || p.client;
      return cId === selectedClientId;
    });
  }, [accessibleProjects, selectedClientId]);

  // Ensure an active project is selected for the current client
  useEffect(() => {
    if (currentClientProjects.length === 0) {
      setSelectedProjectId("");
      return;
    }

    const projectExists = currentClientProjects.some(
      (p) => p._id === selectedProjectId,
    );

    if (!selectedProjectId || selectedProjectId === "all" || !projectExists) {
      const defaultProj = currentClientProjects[0];
      if (defaultProj) {
        setSelectedProjectId(defaultProj._id);
        localStorage.setItem("cinematographer_tasks_last_project_id", defaultProj._id);
      }
    }
  }, [currentClientProjects, selectedProjectId]);

  // Keep URL parameters in sync
  useEffect(() => {
    if (selectedClientId && selectedProjectId) {
      const currentParamClientId = searchParams.get("clientId");
      const currentParamId = searchParams.get("id");
      if (
        currentParamClientId !== selectedClientId ||
        currentParamId !== selectedProjectId
      ) {
        setSearchParams(
          { clientId: selectedClientId, id: selectedProjectId },
          { replace: true },
        );
      }
    }
  }, [selectedClientId, selectedProjectId, searchParams, setSearchParams]);

  // Measure and update client dropdown coordinates
  const updateClientDropdownCoords = () => {
    if (clientDropdownBtnRef.current) {
      const rect = clientDropdownBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      let left = rect.left;
      if (rect.left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, rect.right - dropdownWidth);
      }
      setClientDropdownCoords({
        top: rect.bottom + 8,
        left: left,
        width: dropdownWidth,
      });
    }
  };

  useEffect(() => {
    if (isClientDropdownOpen) {
      updateClientDropdownCoords();
      window.addEventListener("scroll", updateClientDropdownCoords, true);
      window.addEventListener("resize", updateClientDropdownCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateClientDropdownCoords, true);
      window.removeEventListener("resize", updateClientDropdownCoords);
    };
  }, [isClientDropdownOpen]);

  // Close client dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        clientDropdownBtnRef.current &&
        !clientDropdownBtnRef.current.contains(e.target) &&
        !e.target.closest(".cinematographer-client-dropdown-portal")
      ) {
        setIsClientDropdownOpen(false);
      }
    };
    if (isClientDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isClientDropdownOpen]);

  // Selected client object
  const selectedClient = useMemo(() => {
    if (!selectedClientId || selectedClientId === "all") return null;
    return (
      (accessibleClients || []).find((c) => c._id === selectedClientId) || null
    );
  }, [accessibleClients, selectedClientId]);

  // Active project object
  const activeProject = useMemo(() => {
    return (
      currentClientProjects.find((p) => p._id === selectedProjectId) ||
      currentClientProjects[0] ||
      null
    );
  }, [currentClientProjects, selectedProjectId]);

  // Handle client selection
  const handleSelectClient = (client) => {
    if (!client || !client._id || client._id === "all") return;

    setSelectedClientId(client._id);
    localStorage.setItem("cinematographer_tasks_last_client_id", client._id);
    setIsClientDropdownOpen(false);

    // Auto-select first project for this client
    const clientProjs = clientProjectsMap[client._id] || [];
    if (clientProjs.length > 0) {
      setSelectedProjectId(clientProjs[0]._id);
      localStorage.setItem(
        "cinematographer_tasks_last_project_id",
        clientProjs[0]._id,
      );
    } else {
      setSelectedProjectId("");
    }
  };

  // Handle quick create project
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }

    try {
      setCreatingProject(true);
      const newProj = await dispatch(
        createProject({
          name: newProjectName.trim(),
          client: selectedClientId,
          sections: ["General"],
          status: "Active",
        }),
      ).unwrap();

      toast.success("Project created successfully");
      setShowCreateProjectModal(false);
      setNewProjectName("");
      if (newProj?._id) {
        setSelectedProjectId(newProj._id);
        localStorage.setItem("cinematographer_tasks_last_project_id", newProj._id);
      }
    } catch (err) {
      toast.error(err || "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  // Helper colors and badges
  const getAvatarColor = (name) => {
    const colors = [
      "from-amber-500 to-orange-500",
      "from-emerald-500 to-teal-500",
      "from-violet-500 to-purple-500",
      "from-pink-500 to-rose-500",
      "from-blue-500 to-indigo-500",
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20";
      case "Completed":
        return "bg-blue-50 dark:bg-[#3b82f6]/10 text-blue-700 dark:text-[#3b82f6] border-blue-200/50 dark:border-[#3b82f6]/20";
      case "On Hold":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20";
      case "Inactive":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  // Filtered clients in dropdown
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return accessibleClients || [];
    return (accessibleClients || []).filter((c) =>
      (c.companyName || "")
        .toLowerCase()
        .includes(clientSearchTerm.toLowerCase()),
    );
  }, [accessibleClients, clientSearchTerm]);

  // Client switcher node to inject into ProjectTaskBoard header
  const renderClientSwitcherNode = () => {
    return (
      <div className="flex items-center gap-2">
        {/* All Clients Switcher Button */}
        <div className="relative">
          <button
            ref={clientDropdownBtnRef}
            type="button"
            onClick={() => {
              setIsClientDropdownOpen(!isClientDropdownOpen);
              setClientSearchTerm("");
            }}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs h-8 ${
              isClientDropdownOpen
                ? "bg-amber-50/90 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                : "bg-white dark:bg-[#131316] border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-100 hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
            title="Switch Client"
          >
            {selectedClient ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-4.5 h-4.5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: `${selectedClient.color || "#f59e0b"}20`,
                    color: selectedClient.color || "#f59e0b",
                    border: `1px solid ${selectedClient.color || "#f59e0b"}40`,
                  }}
                >
                  {(selectedClient.companyName || "C").charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[110px] sm:max-w-[150px]">
                  {selectedClient.companyName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500">
                <LuBuilding2 size={13} />
                <span>Select Client</span>
              </div>
            )}
            <FiChevronDown
              size={12}
              className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                isClientDropdownOpen ? "rotate-180 text-amber-500" : ""
              }`}
            />
          </button>

          {/* Portal Dropdown for Client Switcher */}
          {isClientDropdownOpen &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: `${clientDropdownCoords.top}px`,
                  left: `${clientDropdownCoords.left}px`,
                  width: `${clientDropdownCoords.width}px`,
                  zIndex: 999999,
                }}
                className="cinematographer-client-dropdown-portal rounded-2xl bg-white dark:bg-[#14151a] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Bar */}
                <div className="p-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="relative flex items-center">
                    <FiSearch
                      size={13}
                      className="absolute left-2.5 text-slate-400 dark:text-slate-500 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0d10] pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 dark:focus:border-amber-400 text-slate-800 dark:text-white transition-all placeholder-slate-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Clients List */}
                <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 sidebar-scrollbar">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => {
                      const isSelected = client._id === selectedClientId;
                      const projCount = (clientProjectsMap[client._id] || [])
                        .length;
                      return (
                        <button
                          key={client._id}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                              : "hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: `${client.color || "#f59e0b"}20`,
                                color: client.color || "#f59e0b",
                                border: `1px solid ${client.color || "#f59e0b"}40`,
                              }}
                            >
                              {(client.companyName || "C")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0 truncate">
                              <span className="truncate text-xs">
                                {client.companyName}
                              </span>
                              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                                {projCount}{" "}
                                {projCount === 1 ? "project" : "projects"}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <FiCheck
                              size={14}
                              className="text-amber-600 dark:text-amber-400 shrink-0 ml-2"
                            />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                      No clients found
                    </div>
                  )}
                </div>
              </div>,
              document.body,
            )}
        </div>

        {/* Project Switcher for Selected Client */}
        {currentClientProjects.length > 0 && (
          <div className="relative">
            <button
              ref={projectDropdownBtnRef}
              type="button"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#131316] text-slate-800 dark:text-slate-100 text-xs font-bold hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-2xs h-8"
              title="Switch Project"
            >
              <LuFolderKanban size={13} className="text-slate-400 shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-[160px]">
                {activeProject?.name || "Select Project"}
              </span>
              {currentClientProjects.length > 1 && (
                <FiChevronDown
                  size={12}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                    isProjectDropdownOpen ? "rotate-180 text-amber-500" : ""
                  }`}
                />
              )}
            </button>

            {isProjectDropdownOpen && currentClientProjects.length > 1 && (
              <div
                className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#14151a] border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 space-y-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 mb-1">
                  Projects ({currentClientProjects.length})
                </div>
                {currentClientProjects.map((p) => {
                  const isProjSelected = p._id === selectedProjectId;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(p._id);
                        localStorage.setItem(
                          "cinematographer_tasks_last_project_id",
                          p._id,
                        );
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                        isProjSelected
                          ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                          : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {isProjSelected && (
                        <FiCheck
                          size={13}
                          className="text-amber-600 dark:text-amber-400 shrink-0 ml-2"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading Screen
  if (clientsLoading && (!clients || clients.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase animate-pulse">
          Loading Cinematographer Workspace...
        </p>
      </div>
    );
  }

  // Empty State: Specific Client has NO projects
  if (
    selectedClient &&
    currentClientProjects.length === 0 &&
    !projectsLoading
  ) {
    return (
      <div className="space-y-6 w-full max-w-8xl mx-auto px-2 md:px-0">
        {/* Workspace Top Header with Client Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <LuVideo size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                  <LuVideo size={12} /> Cinematographer
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderClientSwitcherNode()}
          </div>
        </div>

        {/* Empty State Banner */}
        <div className="p-12 rounded-3xl bg-white dark:bg-[#111319] border border-slate-200/80 dark:border-white/10 shadow-sm text-center flex flex-col items-center justify-center max-w-lg mx-auto mt-10">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
            <LuFolderKanban size={28} />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            No Projects for {selectedClient.companyName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
            There are no projects associated with this client yet. Switch to
            another client from the dropdown above or create a new project
            below.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsClientDropdownOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Choose Another Client
            </button>
            {isAdminOrManager && (
              <button
                type="button"
                onClick={() => {
                  setNewProjectName(
                    `${selectedClient.companyName} - Video Tasks`,
                  );
                  setShowCreateProjectModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                <FiPlus size={14} />
                Create Project
              </button>
            )}
          </div>
        </div>

        {/* Quick Create Project Modal */}
        <AnimatePresence>
          {showCreateProjectModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#14151c] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-white/10 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Create Project for {selectedClient.companyName}
                  </h3>
                  <button
                    onClick={() => setShowCreateProjectModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <form
                  onSubmit={handleCreateProjectSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Video Production Tasks"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white outline-none focus:border-amber-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateProjectModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingProject}
                      className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {creatingProject ? "Creating..." : "Create Project"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ACTIVE WORKSPACE VIEW: Renders exact ProjectTaskBoard with Cinematographer Tasks customizations!
  if (activeProject) {
    return (
      <ProjectTaskBoard
        key={activeProject._id}
        activeProjectId={activeProject._id}
        activeProject={activeProject}
        currentUser={currentUser}
        users={users}
        clients={accessibleClients}
        projects={accessibleProjects}
        isAdminOrManager={isAdminOrManager}
        getStatusBadge={getStatusBadge}
        getAvatarColor={getAvatarColor}
        filterAssigneeDepartment="Cinematographer"
        showDepartmentBadge={true}
        isCinematographerTasksMode={true}
        hideTitle={true}
        hideProjectIcon={true}
        headerBadge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/30 shadow-2xs h-7.5">
            <LuVideo
              size={15}
              className="text-amber-500 dark:text-amber-400 shrink-0"
            />
            <span className="text-xl">Cinematographer</span>
          </span>
        }
        clientSwitcherNode={renderClientSwitcherNode()}
      />
    );
  }

  // Fallback Empty State
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
        <LuVideo size={24} />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
        No active project selected
      </p>
      <div className="mt-2">{renderClientSwitcherNode()}</div>
    </div>
  );
};

export default CinematographerTasks;
