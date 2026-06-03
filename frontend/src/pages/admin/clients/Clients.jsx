import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiUsers,
  FiSearch,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiDollarSign,
  FiPercent,
  FiCheck,
  FiVideo,
  FiImage,
  FiGlobe,
  FiLayers,
  FiUser,
  FiAlertTriangle,
  FiBookOpen,
} from "react-icons/fi";

import {
  useDispatch,
  useSelector,
} from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../../features/clients/clientslice";

import { getUsers } from "../../../features/users/userSlice";

const Clients = () => {
  const dispatch = useDispatch();

  const { clients, loading } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [clientToDelete, setClientToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'service', 'finance'

  const initialForm = {
    companyName: "",
    industry: "",
    phoneNumber: "",
    email: "",
    budget: "",
    gst: "",
    totalBudget: "",
    service: "",
    reels: "",
    posts: "",
    videos: "",
    needDslr: "",
    pages: "",
    onpage: false,
    offpage: false,
    assignedTo: "",
  };

  const [formData, setFormData] = useState(initialForm);

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
      totalBudget: calculateTotal(),
    };

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
      assignedTo: client.assignedTo?._id || client.assignedTo || "",
    });
    setEditId(client._id);
    setActiveTab("profile");
    setShowModal(true);
  };

  const adminUsers = useMemo(() => {
    return (users || []).filter((u) => u.role === "admin");
  }, [users]);

  const filteredClients = useMemo(() => {
    return (clients || []).filter((client) => {
      const matchesSearch = (client.companyName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        (client.industry || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesService =
        serviceFilter === "All" ? true : client.service === serviceFilter;

      return matchesSearch && matchesService;
    });
  }, [clients, searchTerm, serviceFilter]);

  // Dynamic Service-Based styling helpers
  const getServiceStyles = (service) => {
    switch (service) {
      case "Digital Marketing":
        return {
          bg: "bg-blue-50/40 dark:bg-blue-950/10",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-100 dark:border-blue-900/30",
          pill: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20",
          gradient: "from-blue-550 to-cyan-500",
          icon: FiLayers,
        };
      case "Website":
        return {
          bg: "bg-emerald-50/40 dark:bg-emerald-950/10",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-100 dark:border-emerald-900/30",
          pill: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20",
          gradient: "from-emerald-550 to-teal-500",
          icon: FiGlobe,
        };
      case "SEO":
        return {
          bg: "bg-purple-50/40 dark:bg-purple-950/10",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-100 dark:border-purple-900/30",
          pill: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20",
          gradient: "from-purple-550 to-pink-500",
          icon: FiSearch,
        };
      default:
        return {
          bg: "bg-slate-50/40 dark:bg-slate-800/20",
          text: "text-slate-600 dark:text-slate-400",
          border: "border-slate-100 dark:border-slate-800",
          pill: "bg-slate-50 dark:bg-slate-800/30 text-slate-650 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800",
          gradient: "from-slate-500 to-slate-755",
          icon: FiBriefcase,
        };
    }
  };

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-yellow-50 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl  dashboard-btn-primary dark:dashboard-btn-primary text-white flex items-center justify-center  shrink-0">
              <FiUsers size={18} />
            </div>
            <div>
              <span>Client Portfolio</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-normal mt-0.5">Manage accounts, budgets, and deliverable agreements</p>
            </div>
          </h1>
        </div>

        <button
          onClick={() => {
            setFormData(initialForm);
            setEditId(null);
            setActiveTab("profile");
            setShowModal(true);
          }}
          className="dashboard-btn-primary dark:dashboard-btn-primary   px-5 py-3 rounded-xl flex items-center text-white dark:text-yellow-50 justify-center gap-2.5 shadow-md hover:shadow-lg text-xs font-black active:scale-[0.98] transition-all cursor-pointer"
        >
          <FiPlus size={15} className="stroke-[3]" />
          Add New Client
        </button>
      </div>

      {/* SEARCH + FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* SEARCH BOX */}
        <div className="relative w-full md:w-80">
          <FiSearch
            size={14}
            className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400 dark:text-slate-500"
          />
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
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider hidden sm:inline">
            Service Filter:
          </span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-xs text-slate-850 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer w-full md:w-52"
          >
            <option value="All">All Services</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Website">Website Development</option>
            <option value="SEO">SEO Strategy</option>
          </select>
        </div>
      </div>

      {/* LOADING LOADER */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-[3.5px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-semibold animate-pulse">Syncing client details...</span>
        </div>
      )}

      {/* MAIN CONTENT TABLE */}
      {!loading && (
        <motion.div 
          layout
          className="theme-bg-card border theme-border rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="theme-bg-main border-b theme-border text-[10px] uppercase tracking-wider theme-text-secondary font-black">
                  <th className="px-5 py-4">Client Details</th>
                  <th className="px-5 py-4">Contact Info</th>
                  <th className="px-5 py-4">Service & Plan</th>
                  <th className="px-5 py-4">Budget (INR)</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => {
                      const conf = getServiceStyles(client.service);
                      const ServiceIcon = conf.icon;
                      return (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={client._id}
                          className="border-b theme-border hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* Client Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${conf.gradient} text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm`}>
                                {client.companyName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-[120px]">
                                <h2 className="text-[13px] font-black theme-text-primary group-hover:text-blue-600 transition-colors truncate">
                                  {client.companyName}
                                </h2>
                                <p className="text-[10px] theme-text-secondary font-bold flex items-center gap-1.5 mt-0.5 truncate">
                                  <FiBriefcase size={10} />
                                  {client.industry}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              {client.phoneNumber ? (
                                <a
                                  href={`tel:${client.phoneNumber}`}
                                  className="flex items-center gap-1.5 text-[10px] theme-text-secondary hover:text-blue-500 font-semibold"
                                >
                                  <FiPhone size={10} className="theme-icon" />
                                  {client.phoneNumber}
                                </a>
                              ) : <span className="text-[10px] theme-text-secondary italic">No Phone</span>}
                              
                              {client.email ? (
                                <a
                                  href={`mailto:${client.email}`}
                                  className="flex items-center gap-1.5 text-[10px] theme-text-secondary hover:text-blue-500 font-semibold truncate max-w-[150px]"
                                >
                                  <FiMail size={10} className="theme-icon" />
                                  {client.email}
                                </a>
                              ) : <span className="text-[10px] theme-text-secondary italic">No Email</span>}
                            </div>
                          </td>

                          {/* Service Info */}
                          <td className="px-5 py-4">
                            <div className="space-y-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase ${conf.pill} items-center gap-1`}>
                                <ServiceIcon size={9} />
                                {client.service || "Contract"}
                              </span>
                              <div className="text-[10px] font-semibold theme-text-secondary flex items-center gap-1">
                                {client.assignedTo ? (
                                  <>
                                    <FiUser size={10} className="theme-icon" />
                                    Mgr: {client.assignedTo.name || client.assignedTo.email}
                                  </>
                                ) : (
                                  <span className="italic">Unassigned</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Budget Info */}
                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <p className="text-[10px] theme-text-secondary font-bold">
                                Base: <span className="theme-text-primary font-black">₹{Number(client.budget || 0).toLocaleString("en-IN")}</span>
                              </p>
                              <p className="text-[10px] theme-text-secondary font-bold">
                                Total: <span className="text-emerald-600 dark:text-emerald-400 font-black">₹{Number(client.totalBudget || 0).toLocaleString("en-IN")}</span>
                              </p>
                              <p className="text-[9px] text-amber-600 dark:text-amber-500 font-bold">
                                GST: {client.gst}%
                              </p>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(client)}
                                className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-600 flex items-center justify-center transition-all"
                                title="Edit Record"
                              >
                                <FiEdit size={12} className="stroke-[3]" />
                              </button>
                              <button
                                onClick={() => setClientToDelete(client)}
                                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 flex items-center justify-center transition-all"
                                title="Delete Record"
                              >
                                <FiTrash2 size={12} className="stroke-[3]" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-full theme-bg-main flex items-center justify-center mb-3">
                            <FiUsers className="text-blue-500 animate-pulse" size={22} />
                          </div>
                          <h2 className="text-[14px] font-extrabold theme-text-primary">
                            No Registered Clients Found
                          </h2>
                          <p className="text-[11px] theme-text-secondary mt-1 max-w-xs leading-relaxed">
                            Add a new client and configure budgets, services, and commitment deliverables.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
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
              className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              
              {/* MODAL HEADER */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-black/25">
                <div>
                  <h2 className="text-[15px] font-black text-slate-800 dark:text-yellow-50 mb-5  flex items-center gap-2">
                    <FiUsers size={16} className="text-blue-550" />
                    {editId ? "Update Client details" : "Register New Client"}
                  </h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-0.5">
                    Configure corporate parameters, assignees, and contract services.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-400 dark:text-slate-350 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-100 transition-all cursor-pointer shadow-sm"
                >
                  <FiX size={14} className="stroke-[3]" />
                </button>
              </div>

              {/* MODERN TAB NAVIGATION */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 bg-slate-50/40 dark:bg-black/10">
                {["profile", "service", "finance"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3.5 text-[11px] font-extrabold capitalize border-b-2 transition-all cursor-pointer ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600 dark:text-blue-400 font-black"
                        : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650"
                    }`}
                  >
                    {tab === "profile" ? "1. Company Details" : tab === "service" ? "2. Service Plan" : "3. Budget Settings"}
                  </button>
                ))}
              </div>

              {/* MODAL FORM */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* TAB 1: BASIC INFORMATION */}
                {activeTab === "profile" && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
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
                          placeholder="e.g. Acme Corporation"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
                          placeholder="e.g. contact@acme.com"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Core Contract Service
                        </label>
                        <select
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          className="w-full h-10 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                        >
                          <option value="">Select Service Area</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Website">Website Development</option>
                          <option value="SEO">SEO Strategy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1">
                          Assign to Administrator
                        </label>
                        <select
                          name="assignedTo"
                          value={formData.assignedTo}
                          onChange={handleChange}
                          className="w-full h-10 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                        >
                          <option value="">Select Account Owner</option>
                          {adminUsers.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Commitments Dynamic Blocks */}
                    {formData.service && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <FiBookOpen size={11} />
                          {formData.service} Deliverables
                        </label>

                        {/* Digital Marketing commitments */}
                        {formData.service === "Digital Marketing" && (
                          <div className="bg-blue-50/30 dark:bg-black/40 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl p-4 space-y-3.5">
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
                                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
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
                                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
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
                                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
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
                                className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold cursor-pointer w-full md:w-52"
                              >
                                <option value="">Select Option</option>
                                <option value="Need DSLR">Need DSLR</option>
                                <option value="No DSLR">No DSLR</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Website commitments */}
                        {formData.service === "Website" && (
                          <div className="bg-emerald-50/30 dark:bg-black/40 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl p-4">
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
                                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/25 font-semibold"
                              />
                            </div>
                          </div>
                        )}

                        {/* SEO commitments */}
                        {formData.service === "SEO" && (
                          <div className="bg-purple-50/30 dark:bg-black/40 border border-purple-100/50 dark:border-purple-900/20 rounded-2xl p-4">
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
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: FINANCIALS & GST SETUP */}
                {activeTab === "finance" && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
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
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-3 flex justify-between items-center">
                  <div>
                    {activeTab !== "profile" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === "finance") setActiveTab("service");
                          else if (activeTab === "service") setActiveTab("profile");
                        }}
                        className="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-350 font-bold transition-all text-xs cursor-pointer shadow-sm"
                      >
                        Back
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4.5 py-2.5 rounded-xl hover:bg-red-500 hover:text-white bg-red-500 text-white dark:text-slate-350 font-bold transition-all text-xs cursor-pointer shadow-sm"
                    >
                      Cancel
                    </button>

                    {activeTab !== "finance" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === "profile") setActiveTab("service");
                          else if (activeTab === "service") setActiveTab("finance");
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Next Step
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold shadow-md hover:shadow-lg transition-all text-xs cursor-pointer"
                      >
                        {editId ? "Update Record" : "Register Client"}
                      </button>
                    )}
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
                Are you sure you want to permanently delete the client record for <span className="text-rose-600 dark:text-rose-400 font-extrabold">"{clientToDelete.companyName}"</span>?
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-medium">
                This will purge all commitment details, taxation configurations, and related project assignments from the system. This operation is irreversible.
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