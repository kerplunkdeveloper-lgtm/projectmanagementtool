import React, { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiUsers,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiDollarSign,
  FiPercent,
  FiGlobe,
  FiLayers,
  FiUser,
  FiAlertTriangle,
  FiBookOpen,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiVideo,
  FiPlusCircle,
  FiHelpCircle,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../../features/clients/clientslice";

import { getUsers } from "../../../features/users/userSlice";
import { useTheme } from "../../../context/ThemeContext";

const getUserColor = (userId) => {
  if (!userId)
    return {
      bg: "bg-slate-50/80 dark:bg-slate-900/10",
      text: "text-slate-400 dark:text-slate-500",
      border: "border-slate-200 dark:border-slate-800",
    };
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    {
      bg: "bg-indigo-50/80 dark:bg-indigo-950/30",
      text: "text-indigo-600 dark:text-indigo-300",
      border: "border-indigo-100/80 dark:border-indigo-900/40",
    },
    {
      bg: "bg-fuchsia-50/80 dark:bg-fuchsia-950/30",
      text: "text-fuchsia-600 dark:text-fuchsia-300",
      border: "border-fuchsia-100/80 dark:border-fuchsia-900/40",
    },
    {
      bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
      text: "text-emerald-600 dark:text-emerald-300",
      border: "border-emerald-100/80 dark:border-emerald-900/40",
    },
    {
      bg: "bg-rose-50/80 dark:bg-rose-950/30",
      text: "text-rose-600 dark:text-rose-300",
      border: "border-rose-100/80 dark:border-rose-900/40",
    },
    {
      bg: "bg-cyan-50/80 dark:bg-cyan-950/30",
      text: "text-cyan-600 dark:text-cyan-300",
      border: "border-cyan-100/80 dark:border-cyan-900/40",
    },
    {
      bg: "bg-amber-50/80 dark:bg-amber-950/30",
      text: "text-amber-600 dark:text-amber-300",
      border: "border-amber-100/80 dark:border-amber-900/40",
    },
    {
      bg: "bg-teal-50/80 dark:bg-teal-950/30",
      text: "text-teal-600 dark:text-teal-300",
      border: "border-teal-100/80 dark:border-teal-900/40",
    },
    {
      bg: "bg-violet-50/80 dark:bg-violet-950/30",
      text: "text-violet-600 dark:text-violet-300",
      border: "border-violet-100/80 dark:border-violet-900/40",
    },
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const MultiSelect = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  // Group options if 'group' property exists
  const hasGrouping = options.some((o) => o.group);

  const groupedOptions = useMemo(() => {
    if (!hasGrouping) return { "": options };

    return options.reduce((acc, opt) => {
      const g = opt.group || "Others";
      if (!acc[g]) acc[g] = [];
      acc[g].push(opt);
      return acc;
    }, {});
  }, [options, hasGrouping]);

  return (
    <div className="relative">
      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-450" />}
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-10 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 flex flex-wrap gap-1.5 items-center cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all"
      >
        {selectedValues.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            {placeholder}
          </span>
        ) : (
          selectedValues.map((val) => {
            const opt = options.find((o) => o.value === val);
            const displayLabel = opt ? opt.label : val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-550/5 text-blue-600 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40"
              >
                {displayLabel}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(val);
                  }}
                  className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-0.5 focus:outline-none"
                >
                  <FiX size={10} className="stroke-[3]" />
                </button>
              </span>
            );
          })
        )}
        <span className="ml-auto pointer-events-none text-slate-400">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-1.5 space-y-1">
            {Object.entries(groupedOptions).map(([groupName, items]) => (
              <div key={groupName} className="space-y-0.5">
                {groupName && (
                  <div className="px-3 py-1 text-[9px] font-black text-indigo-600 dark:text-[#3b82f6] uppercase tracking-wider bg-indigo-50/40 dark:bg-white/[0.02] rounded-md mb-1 mt-1 font-bold">
                    {groupName}
                  </div>
                )}
                {items.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggleOption(opt.value)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-500/5 text-indigo-600 dark:bg-[#3b82f6]/5 dark:text-[#3b82f6]"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-705 dark:text-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-indigo-600 dark:text-[#3b82f6] focus:ring-indigo-500 w-3.5 h-3.5 border-slate-350 dark:border-slate-700 bg-transparent cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[11px]">
                          {opt.label}
                        </span>
                        {opt.subLabel && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Clients = () => {
  const dispatch = useDispatch();

  const { clients, loading } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const { theme } = useTheme();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [clientToDelete, setClientToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'service', 'finance'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const initialForm = {
    companyName: "",
    industry: "",
    phoneNumber: "",
    email: "",
    budget: "",
    gst: "",
    totalBudget: "",
    service: [],
    reels: "",
    posts: "",
    videos: "",
    needDslr: "",
    pages: "",
    onpage: false,
    offpage: false,
    assignedTo: [],
  };

  const [formData, setFormData] = useState(initialForm);

  const handleServiceChange = (services) => {
    setFormData((prev) => ({
      ...prev,
      service: services,
    }));
  };

  const handleAssignedChange = (assigned) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: assigned,
    }));
  };

  useEffect(() => {
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateTotal = () => {
    const budget = Number(formData.budget || 0);
    const gst = Number(formData.gst || 0);
    return budget + (budget * gst) / 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      budget: formData.budget === "" ? 0 : Number(formData.budget),
      gst: formData.gst === "" ? 18 : Number(formData.gst),
      reels: formData.reels === "" ? 0 : Number(formData.reels),
      posts: formData.posts === "" ? 0 : Number(formData.posts),
      videos: formData.videos === "" ? 0 : Number(formData.videos),
      pages: formData.pages === "" ? 0 : Number(formData.pages),
      totalBudget: calculateTotal(),
    };

    if (!payload.assignedTo) {
      delete payload.assignedTo;
    }

    if (editId) {
      await dispatch(updateClient({ id: editId, data: payload }));
    } else {
      await dispatch(createClient(payload));
    }

    setShowModal(false);
    setFormData(initialForm);
    setEditId(null);
  };

  const handleEdit = (client) => {
    setFormData({
      ...client,
      service: Array.isArray(client.service)
        ? client.service
        : client.service
          ? [client.service]
          : [],
      assignedTo: Array.isArray(client.assignedTo)
        ? client.assignedTo.map((u) => u._id || u)
        : client.assignedTo
          ? [client.assignedTo._id || client.assignedTo]
          : [],
    });
    setEditId(client._id);
    setActiveTab("profile");
    setShowModal(true);
  };

  const allUsers = useMemo(() => {
    return users || [];
  }, [users]);

  const filteredClients = useMemo(() => {
    return (clients || []).filter((client) => {
      const matchesSearch =
        (client.companyName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (client.industry || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesService =
        serviceFilter === "All"
          ? true
          : Array.isArray(client.service)
            ? client.service.includes(serviceFilter)
            : client.service === serviceFilter;

      return matchesSearch && matchesService;
    });
  }, [clients, searchTerm, serviceFilter]);

  // Reset pagination to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter]);

  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Dynamic Service-Based styling helpers
  const getServiceStyles = (service) => {
    switch (service) {
      case "Digital Marketing":
        return {
          bg: "bg-blue-50/50 dark:bg-blue-950/10",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-100 dark:border-blue-900/30",
          pill: "bg-blue-50 text-blue-705 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50",
          gradient: "from-blue-550 to-cyan-500",
          icon: FiLayers,
        };
      case "Website":
        return {
          bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-100 dark:border-emerald-900/30",
          pill: "bg-emerald-50 text-emerald-707 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50",
          gradient: "from-emerald-550 to-teal-500",
          icon: FiGlobe,
        };
      case "SEO":
        return {
          bg: "bg-purple-50/50 dark:bg-purple-950/10",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-100 dark:border-purple-900/30",
          pill: "bg-purple-50 text-purple-705 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/50",
          gradient: "from-purple-550 to-pink-500",
          icon: FiSearch,
        };
      case "Additional work":
        return {
          bg: "bg-amber-50/50 dark:bg-amber-950/10",
          text: "text-amber-600 dark:text-amber-400",
          border: "border-amber-100 dark:border-amber-900/30",
          pill: "bg-amber-50 text-amber-705 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50",
          gradient: "from-amber-550 to-orange-500",
          icon: FiPlusCircle,
        };
      case "Video Production":
        return {
          bg: "bg-rose-50/50 dark:bg-rose-950/10",
          text: "text-rose-600 dark:text-rose-400",
          border: "border-rose-100 dark:border-rose-900/30",
          pill: "bg-rose-50 text-rose-705 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/50",
          gradient: "from-rose-550 to-red-500",
          icon: FiVideo,
        };
      case "Others":
        return {
          bg: "bg-teal-50/50 dark:bg-teal-950/10",
          text: "text-teal-605 dark:text-teal-400",
          border: "border-teal-100 dark:border-teal-900/30",
          pill: "bg-teal-50 text-teal-705 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/50",
          gradient: "from-teal-550 to-emerald-500",
          icon: FiHelpCircle,
        };
      default:
        return {
          bg: "bg-slate-50/50 dark:bg-slate-800/20",
          text: "text-slate-605 dark:text-slate-400",
          border: "border-slate-100 dark:border-slate-800",
          pill: "bg-slate-50 text-slate-650 border border-slate-200/50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
          gradient: "from-slate-500 to-slate-755",
          icon: FiBriefcase,
        };
    }
  };

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      {/* SEARCH + FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-800 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* SEARCH BOX */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search company or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-black text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* SERVICE FILTER */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider hidden sm:inline"></span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-10 px-3.5 py-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-xs text-slate-850 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer w-full md:w-52 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.85em_0.85em] pr-8"
          >
            <option value="All">All Services</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Website">Website Development</option>
            <option value="SEO">SEO Strategy</option>
            <option value="Additional work">Additional work</option>
            <option value="Video Production">Video Production</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div>
          {(user?.role === "admin" || user?.role === "operationmanager") && (
            <button
              onClick={() => {
                setFormData(initialForm);
                setEditId(null);
                setActiveTab("profile");
                setShowModal(true);
              }}
              className="dashboard-btn-primary dark:dashboard-btn-primary   px-5 py-3 rounded-xl flex items-center  justify-center gap-2.5 shadow-md hover:shadow-lg text-xs font-medium active:scale-[0.98] transition-all cursor-pointer"
            >
              <FiPlus size={15} className="stroke-[3]" />
              Add New Client
            </button>
          )}
        </div>
      </div>

      {/* LOADING LOADER */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-[3.5px]  rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-semibold animate-pulse">
            Syncing client details...
          </span>
        </div>
      )}

      {/* MAIN CONTENT TABLE */}
      {!loading && (
        <motion.div
          layout
          className=" overflow-hidden bg-white dark:bg-slate-900/30 shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px] text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/60 text-slate-705 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                    Client Details
                  </th>
                  <th className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                    Contact Info
                  </th>
                  <th className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                    Service & Members
                  </th>
                  {user?.role === "team" && (
                    <th className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                      Assigned By
                    </th>
                  )}
                  {user?.role !== "team" && (
                    <th className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                      Budget (INR)
                    </th>
                  )}
                  {(user?.role === "admin" ||
                    user?.role === "operationmanager") && (
                    <th className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 text-center w-28">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredClients.length > 0 ? (
                    paginatedClients.map((client, index) => {
                      const primaryService = Array.isArray(client.service)
                        ? client.service[0] || ""
                        : client.service || "";
                      const conf = getServiceStyles(primaryService);
                      const ServiceIcon = conf.icon;
                      return (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={client._id}
                          className={`group transition-colors ${
                            index % 2 === 0
                              ? "bg-white dark:bg-slate-800/40"
                              : "bg-slate-50/40 dark:bg-slate-900/10"
                          } hover:bg-[var(--accent-light-bg-subtle)] dark:hover:bg-[var(--accent-dark-bg-subtle)]`}
                        >
                          {/* Client Info */}
                          <td className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className="min-w-[120px]">
                                <h2 className=" theme-text-accent  transition-colors text-md md:text-xl truncate">
                                  {client.companyName}
                                </h2>
                                <p className="text-[13px] text-slate-400 dark:text-slate-700 font-medium flex items-center gap-1 mt-0.5 truncate">
                                  <FiBriefcase size={9} />
                                  {client.industry}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                            <div className="space-y-1">
                              {client.phoneNumber ? (
                                <a
                                  href={`tel:${client.phoneNumber}`}
                                  className="flex items-center gap-1 text-[11px] md:text-[14px] text-slate-650 dark:text-white hover:theme-text-accent font-medium"
                                >
                                  <FiPhone
                                    size={11}
                                    md:size={14}
                                    className="text-slate-400 dark:text-slate-500"
                                  />
                                  {client.phoneNumber}
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-405 dark:text-slate-505 italic">
                                  No Phone
                                </span>
                              )}

                              {client.email ? (
                                <a
                                  href={`mailto:${client.email}`}
                                  className="flex items-center gap-1 text-[11px] md:text-[14px] text-slate-655 dark:text-white hover:theme-text-accent font-medium"
                                >
                                  <FiMail
                                    size={11}
                                    md:size={14}
                                    className="text-slate-400 dark:text-slate-500"
                                  />
                                  {client.email}
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-405 dark:text-slate-550 italic">
                                  No Email
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Service Info */}
                          <td className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {Array.isArray(client.service)
                                ? client.service.map((srv) => {
                                    const sConf = getServiceStyles(srv);
                                    const SIcon = sConf.icon;
                                    return (
                                      <span
                                        key={srv}
                                        className={`inline-flex px-2 py-0.5 rounded-full text-[9px] md:text-[11px] font-bold tracking-wider uppercase border ${sConf.pill} items-center gap-1`}
                                      >
                                        <SIcon size={9} />
                                        {srv}
                                      </span>
                                    );
                                  })
                                : (() => {
                                    const sConf = getServiceStyles(
                                      client.service || "",
                                    );
                                    const SIcon = sConf.icon;
                                    return (
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded-full text-[9px] md:text-[11px] font-bold tracking-wider uppercase border ${sConf.pill} items-center gap-1`}
                                      >
                                        <SIcon size={9} />
                                        {client.service || "Contract"}
                                      </span>
                                    );
                                  })()}
                            </div>
                            <div className="pt-1.5 flex flex-wrap gap-1 max-w-[200px]">
                              {client.assignedTo &&
                              (Array.isArray(client.assignedTo)
                                ? client.assignedTo.length > 0
                                : true) ? (
                                Array.isArray(client.assignedTo) ? (
                                  client.assignedTo.map((member) => {
                                    const uCol = getUserColor(
                                      member._id || member,
                                    );
                                    return (
                                      <span
                                        key={member._id || member}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${uCol.bg} ${uCol.text} border ${uCol.border} font-semibold text-[9.5px] md:text-[11px]`}
                                      >
                                        <FiUser size={9} />
                                        <span>
                                          {member.name || member.email}
                                        </span>
                                      </span>
                                    );
                                  })
                                ) : (
                                  (() => {
                                    const uCol = getUserColor(
                                      client.assignedTo._id ||
                                        client.assignedTo,
                                    );
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${uCol.bg} ${uCol.text} border ${uCol.border} font-semibold text-[9.5px] md:text-[11px]`}
                                      >
                                        <FiUser size={9} />
                                        <span>
                                          {client.assignedTo.name ||
                                            client.assignedTo.email}
                                        </span>
                                      </span>
                                    );
                                  })()
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 dark:text-slate-500 italic text-[9.5px]">
                                  <FiUser size={9} />
                                  <span>Unassigned</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Assigned By */}
                          {user?.role === "team" && (
                            <td className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-1">
                                {client.createdBy ? (
                                  (() => {
                                    const uCol = getUserColor(
                                      client.createdBy._id || client.createdBy,
                                    );
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${uCol.bg} ${uCol.text} border ${uCol.border} font-semibold text-[9.5px] md:text-[11px]`}
                                      >
                                        <FiUser size={9} />
                                        <span>
                                          {client.createdBy.name ||
                                            client.createdBy.email}
                                        </span>
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-slate-450 dark:text-slate-500 italic text-[9.5px]">
                                    <FiUser size={9} />
                                    <span>System / Admin</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Budget Info */}
                          {user?.role !== "team" && (
                            <td className="px-4 py-2.5 border-r border-b border-slate-200 dark:border-slate-800">
                              <div className="space-y-0.5">
                                <p className="text-[10px] md:text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                  Base:{" "}
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    ₹
                                    {Number(client.budget || 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </span>
                                </p>
                                <p className="text-[11px] md:text-[13px] text-slate-605 dark:text-slate-400 font-medium">
                                  Total:{" "}
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    ₹
                                    {Number(
                                      client.totalBudget || 0,
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </p>
                                <p className="text-[9.5px] md:text-[11px] text-amber-600 dark:text-amber-500 font-semibold uppercase tracking-wider">
                                  GST: {client.gst}%
                                </p>
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          {(user?.role === "admin" ||
                            user?.role === "operationmanager") && (
                            <td className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEdit(client)}
                                  className="p-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:border-amber-900/30 text-amber-600 dark:text-amber-455 rounded transition-all"
                                  title="Edit Record"
                                >
                                  <FiEdit
                                    size={12}
                                    md:size={14}
                                    className="stroke-[2.5]"
                                  />
                                </button>
                                <button
                                  onClick={() => setClientToDelete(client)}
                                  className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/40 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-455 rounded transition-all"
                                  title="Delete Record"
                                >
                                  <FiTrash2
                                    size={12}
                                    md:size={14}
                                    className="stroke-[2.5]"
                                  />
                                </button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          user?.role === "admin" ||
                          user?.role === "operationmanager"
                            ? 5
                            : 4
                        }
                        className="px-5 py-16 border-b border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-full theme-bg-main flex items-center justify-center mb-3">
                            <FiUsers
                              className="text-blue-500 animate-pulse"
                              size={22}
                            />
                          </div>
                          <h2 className="text-[14px] font-extrabold theme-text-primary">
                            No Registered Clients Found
                          </h2>
                          <p className="text-[11px] theme-text-secondary mt-1 max-w-xs leading-relaxed">
                            Add a new client and configure budgets, services,
                            and commitment deliverables.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Premium Pagination Controls */}
          {totalItems > itemsPerPage && (
            <div className="px-5 py-4 bg-slate-50/50 dark:bg-[#111111]/30  flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left Side: Info */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Showing{" "}
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>{" "}
                to{" "}
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of{" "}
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {totalItems}
                </span>{" "}
                clients
              </div>

              {/* Right Side: Page buttons */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`h-8 w-8 rounded-xl border text-[10px] font-bold flex items-center justify-center transition-all ${
                      currentPage === 1
                        ? "border-slate-200 dark:border-slate-800/80 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        : "border-slate-200 dark:border-slate-800 hover:bg-[var(--accent-light-bg-subtle)] dark:hover:bg-[var(--accent-dark-bg-subtle)] text-slate-705 dark:text-slate-400 hover:border-[var(--accent-color)] dark:hover:border-[var(--accent-color-dark)] hover:theme-text-accent active:scale-90 cursor-pointer shadow-sm"
                    }`}
                  >
                    <FiChevronLeft size={14} className="stroke-[2.5]" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      const isSelected = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-xl border text-[10px] font-extrabold flex items-center justify-center transition-all ${
                            isSelected
                              ? "theme-bg-accent border-[var(--accent-color)] dark:border-[var(--accent-color-dark)] text-white dark:text-black shadow-md"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-400 hover:bg-[var(--accent-light-bg-subtle)] dark:hover:bg-[var(--accent-dark-bg-subtle)] hover:border-[var(--accent-color)] dark:hover:border-[var(--accent-color-dark)] hover:theme-text-accent active:scale-90 cursor-pointer shadow-sm"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`h-8 w-8 rounded-xl border text-[10px] font-bold flex items-center justify-center transition-all ${
                      currentPage === totalPages
                        ? "border-slate-200 dark:border-slate-800/80 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        : "border-slate-200 dark:border-slate-805 hover:bg-[var(--accent-light-bg-subtle)] dark:hover:bg-[var(--accent-dark-bg-subtle)] text-slate-705 dark:text-slate-400 hover:border-[var(--accent-color)] dark:hover:border-[var(--accent-color-dark)] hover:theme-text-accent active:scale-90 cursor-pointer shadow-sm"
                    }`}
                  >
                    <FiChevronRight size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CREATE & EDIT CLIENT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 h-[85vh] sm:h-auto min-h-[500px] sm:min-h-[560px] md:min-h-[600px] max-h-[90vh] flex flex-col"
            >
              {/* MODAL HEADER */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-black/25">
                <div>
                  <h2 className="text-[15px] md:text-[20px] font-bold theme-text-accent  flex items-center gap-2">
                    <FiUsers
                      size={16}
                      md:size={40}
                      className="theme-text-accent"
                    />
                    {editId ? "Update Client details" : "Register New Client"}
                  </h2>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-400 dark:text-slate-350 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-100 transition-all cursor-pointer shadow-sm"
                >
                  <FiX size={14} className="stroke-[3]" />
                </button>
              </div>

              {/* MODERN TAB NAVIGATION */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 bg-[var(--accent-color)]/20 dark:bg-[var(--accent-color-dark)]/20">
                {["profile", "service", "finance"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3.5 text-[13px] font-bold capitalize  border-b-2 transition-all cursor-pointer ${
                      activeTab === tab
                        ? "border-[var(--accent-color)] dark:border-[var(--accent-color-dark)] theme-text-accent font-black"
                        : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650"
                    }`}
                  >
                    {tab === "profile"
                      ? "1. Company Details"
                      : tab === "service"
                        ? "2. Service Plan"
                        : "3. Budget Settings"}
                  </button>
                ))}
              </div>

              {/* MODAL FORM */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                {/* TAB 1: BASIC INFORMATION */}
                {activeTab === "profile" && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 min-h-[280px] sm:min-h-[340px]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter Client or Company Name"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Industry Sector
                        </label>
                        <input
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          placeholder="e.g. Technology / Retail"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="Enter Phone Number"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Corporate Email ID
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter Client Email Address"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: SERVICE CATEGORIES & COMMITMENTS */}
                {activeTab === "service" && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 min-h-[280px] sm:min-h-[340px] pb-32"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MultiSelect
                        label="Core Contract Service"
                        placeholder="Select Service Areas"
                        options={[
                          {
                            value: "Digital Marketing",
                            label: "Digital Marketing",
                          },
                          { value: "Website", label: "Website Development" },
                          { value: "SEO", label: "SEO Strategy" },
                          {
                            value: "Additional work",
                            label: "Additional work",
                          },
                          {
                            value: "Video Production",
                            label: "Video Production",
                          },
                          { value: "Others", label: "Others" },
                        ]}
                        selectedValues={formData.service || []}
                        onChange={handleServiceChange}
                        icon={FiLayers}
                      />

                      <MultiSelect
                        label="Assign to members"
                        placeholder="Select members"
                        options={allUsers.map((u) => ({
                          value: u._id,
                          label: u.name,
                          subLabel: u.email,
                          group: u.department
                            ? u.department.toUpperCase()
                            : "UNASSIGNED",
                        }))}
                        selectedValues={formData.assignedTo || []}
                        onChange={handleAssignedChange}
                        icon={FiUsers}
                      />
                    </div>

                    {/* Commitments Dynamic Blocks */}
                    {formData.service &&
                      (Array.isArray(formData.service)
                        ? formData.service.length > 0
                        : formData.service) && (
                        <div className="pt-2 space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                            <FiBookOpen size={11} />
                            Deliverables Setup
                          </label>

                          {/* Digital Marketing commitments */}
                          {((Array.isArray(formData.service) &&
                            formData.service.includes("Digital Marketing")) ||
                            formData.service === "Digital Marketing") && (
                            <div className="bg-blue-50/30 dark:bg-black/40 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl p-4 space-y-3.5">
                              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <FiLayers size={12} /> Digital Marketing
                                Deliverables
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Reels
                                  </label>
                                  <input
                                    type="number"
                                    name="reels"
                                    value={formData.reels}
                                    onChange={handleChange}
                                    placeholder="Count"
                                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Posts
                                  </label>
                                  <input
                                    type="number"
                                    name="posts"
                                    value={formData.posts}
                                    onChange={handleChange}
                                    placeholder="Count"
                                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Videos
                                  </label>
                                  <input
                                    type="number"
                                    name="videos"
                                    value={formData.videos}
                                    onChange={handleChange}
                                    placeholder="Count"
                                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                  DSLR requirement
                                </label>
                                <select
                                  name="needDslr"
                                  value={formData.needDslr}
                                  onChange={handleChange}
                                  className="h-10 px-3.5 py-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold cursor-pointer w-full md:w-52 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.85em_0.85em] pr-8"
                                >
                                  <option value="">Select Option</option>
                                  <option value="Need DSLR">Need DSLR</option>
                                  <option value="No DSLR">No DSLR</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Website commitments */}
                          {((Array.isArray(formData.service) &&
                            formData.service.includes("Website")) ||
                            formData.service === "Website") && (
                            <div className="bg-emerald-50/30 dark:bg-black/40 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl p-4">
                              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2.5">
                                <FiGlobe size={12} /> Website Deliverables
                              </h4>
                              <div className="w-full md:w-1/2">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Estimated Web Pages
                                </label>
                                <input
                                  type="number"
                                  name="pages"
                                  value={formData.pages}
                                  onChange={handleChange}
                                  placeholder="e.g. 5 Pages"
                                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-[#3b82f6]/25 font-semibold"
                                />
                              </div>
                            </div>
                          )}

                          {/* SEO commitments */}
                          {((Array.isArray(formData.service) &&
                            formData.service.includes("SEO")) ||
                            formData.service === "SEO") && (
                            <div className="bg-purple-50/30 dark:bg-black/40 border border-purple-100/50 dark:border-purple-900/20 rounded-2xl p-4">
                              <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-2.5">
                                <FiSearch size={12} /> SEO Deliverables
                              </h4>
                              <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 mb-2">
                                Select Deliverables
                              </label>
                              <div className="flex flex-wrap gap-3">
                                <label className="flex items-center gap-2.5 bg-white dark:bg-black px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all font-semibold">
                                  <input
                                    type="checkbox"
                                    name="onpage"
                                    checked={formData.onpage}
                                    onChange={handleChange}
                                    className="rounded text-purple-650 focus:ring-purple-500"
                                  />
                                  On-Page SEO
                                </label>

                                <label className="flex items-center gap-2.5 bg-white dark:bg-black px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all font-semibold">
                                  <input
                                    type="checkbox"
                                    name="offpage"
                                    checked={formData.offpage}
                                    onChange={handleChange}
                                    className="rounded text-purple-650 focus:ring-purple-500"
                                  />
                                  Off-Page Link Building
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Video Production commitments */}
                          {((Array.isArray(formData.service) &&
                            formData.service.includes("Video Production")) ||
                            formData.service === "Video Production") && (
                            <div className="bg-rose-50/30 dark:bg-black/40 border border-rose-100/50 dark:border-rose-900/20 rounded-2xl p-4 space-y-3.5">
                              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-405 flex items-center gap-1.5">
                                <FiVideo size={12} /> Video Production
                                Deliverables
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Videos Count
                                  </label>
                                  <input
                                    type="number"
                                    name="videos"
                                    value={formData.videos}
                                    onChange={handleChange}
                                    placeholder="Count"
                                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Reels Count
                                  </label>
                                  <input
                                    type="number"
                                    name="reels"
                                    value={formData.reels}
                                    onChange={handleChange}
                                    placeholder="Count"
                                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                  DSLR requirement
                                </label>
                                <select
                                  name="needDslr"
                                  value={formData.needDslr}
                                  onChange={handleChange}
                                  className="h-10 px-3.5 py-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 font-semibold cursor-pointer w-full md:w-52 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.85em_0.85em] pr-8"
                                >
                                  <option value="">Select Option</option>
                                  <option value="Need DSLR">Need DSLR</option>
                                  <option value="No DSLR">No DSLR</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Additional work commitments */}
                          {((Array.isArray(formData.service) &&
                            formData.service.includes("Additional work")) ||
                            formData.service === "Additional work") && (
                            <div className="bg-amber-50/30 dark:bg-black/40 border border-amber-100/50 dark:border-amber-900/20 rounded-2xl p-4">
                              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-455 flex items-center gap-1.5 mb-2.5">
                                <FiPlusCircle size={12} /> Additional Work
                                Details
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                Additional deliverables and project-specific
                                tasks can be added directly via the project
                                boards or EOD notes.
                              </p>
                            </div>
                          )}

                          {/* Others commitments */}
                          {((Array.isArray(formData.service) &&
                            formData.service.includes("Others")) ||
                            formData.service === "Others") && (
                            <div className="bg-teal-50/30 dark:bg-black/40 border border-teal-100/50 dark:border-teal-900/20 rounded-2xl p-4">
                              <h4 className="text-xs font-bold text-teal-605 dark:text-teal-400 flex items-center gap-1.5 mb-2.5">
                                <FiHelpCircle size={12} /> Custom Service
                                Deliverables
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                Configure specific milestones and guidelines
                                directly with the assigned team members.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                  </motion.div>
                )}

                {/* TAB 3: FINANCIALS & GST SETUP */}
                {activeTab === "finance" && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 min-h-[280px] sm:min-h-[340px]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <FiDollarSign size={10} className="text-slate-450" />
                          Base Budget (INR)
                        </label>
                        <input
                          type="number"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="e.g. 50000"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <FiPercent size={10} className="text-slate-450" />
                          GST Slab (%)
                        </label>
                        <input
                          type="number"
                          name="gst"
                          value={formData.gst}
                          onChange={handleChange}
                          placeholder="e.g. 18"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Grand Total (Inc. GST)
                        </label>
                        <div className="w-full h-10 rounded-xl bg-emerald-555/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-900/30 px-3.5 flex items-center text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                          ₹{Number(calculateTotal()).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ACTION FOOTER */}
                <div className="border-t border-slate-100 dark:border-white/5 pt-5 mt-3">
                  {/* Step Progress Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    {["profile", "service", "finance"].map((step, i) => {
                      const stepIndex = [
                        "profile",
                        "service",
                        "finance",
                      ].indexOf(activeTab);
                      const isCurrent = step === activeTab;
                      const isDone = i < stepIndex;
                      return (
                        <div key={step} className="flex items-center gap-2">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-black transition-all duration-300 ${
                              isCurrent
                                ? "theme-bg-accent text-white dark:text-black shadow-lg scale-110"
                                : isDone
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                            }`}
                          >
                            {isDone ? "✓" : i + 1}
                          </div>
                          <span
                            className={`text-[9px] font-bold hidden sm:block ${
                              isCurrent
                                ? "theme-text-accent"
                                : isDone
                                  ? "text-emerald-500"
                                  : "text-slate-400 dark:text-slate-600"
                            }`}
                          >
                            {step === "profile"
                              ? "Company"
                              : step === "service"
                                ? "Service"
                                : "Finance"}
                          </span>
                          {i < 2 && (
                            <div
                              className={`w-8 h-[2px] rounded-full ${isDone ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-800"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center gap-3">
                    {/* Back Button */}
                    <div>
                      {activeTab !== "profile" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeTab === "finance")
                              setActiveTab("service");
                            else if (activeTab === "service")
                              setActiveTab("profile");
                          }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all text-xs cursor-pointer shadow-sm group"
                        >
                          <svg
                            className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                          Back
                        </button>
                      )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2.5">
                      {/* Cancel */}
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-all text-xs cursor-pointer shadow-sm group"
                      >
                        <svg
                          className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Cancel
                      </button>

                      {/* Next Step / Submit */}
                      {activeTab !== "finance" ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeTab === "profile")
                              setActiveTab("service");
                            else if (activeTab === "service")
                              setActiveTab("finance");
                          }}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 group text-white dark:text-black"
                          style={{ background: "var(--accent-gradient)" }}
                        >
                          Next Step
                          <svg
                            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group text-white dark:text-black"
                          style={{ background: "var(--accent-gradient)" }}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d={
                                editId
                                  ? "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                  : "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              }
                            />
                          </svg>
                          {editId ? "Update Record" : "Register Client"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE WARNING POPUP */}
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 border border-rose-100/50 dark:border-rose-950/20 text-slate-850 dark:text-slate-200"
            >
              <h2 className="text-[15px] font-black text-rose-600 dark:text-rose-405 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FiAlertTriangle size={15} />
                </span>
                Confirm Client Deletion
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-350 mt-3 leading-relaxed font-semibold">
                Are you sure you want to permanently delete the client record
                for{" "}
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                  "{clientToDelete.companyName}"
                </span>
                ?
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-medium">
                This will purge all commitment details, taxation configurations,
                and related project assignments from the system. This operation
                is irreversible.
              </p>

              {/* POPUP BUTTON ACTIONS */}
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold transition-all text-xs cursor-pointer"
                >
                  No, Keep Record
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await dispatch(deleteClient(clientToDelete._id));
                    setClientToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow-md hover:scale-[1.01] transition-all text-xs cursor-pointer"
                >
                  Yes, Purge Client
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
