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
} from "react-icons/fi";

import {
  useDispatch,
  useSelector,
} from "react-redux";

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
    setShowModal(true);
  };

  const adminUsers = useMemo(() => {
    return (users || []).filter((u) => u.role === "admin");
  }, [users]);

  const filteredClients = useMemo(() => {
    return (clients || []).filter((client) => {
      const matchesSearch = (client.companyName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

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
          bg: "bg-blue-50 dark:bg-blue-950/20",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-100 dark:border-blue-900/30",
          pill: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
          gradient: "from-blue-500 to-cyan-500",
        };
      case "Website":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-100 dark:border-emerald-900/30",
          pill: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
          gradient: "from-emerald-500 to-teal-500",
        };
      case "SEO":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/20",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-100 dark:border-purple-900/30",
          pill: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300",
          gradient: "from-purple-500 to-pink-500",
        };
      default:
        return {
          bg: "bg-slate-50 dark:bg-slate-800/40",
          text: "text-slate-600 dark:text-slate-400",
          border: "border-slate-100 dark:border-slate-800",
          pill: "bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300",
          gradient: "from-slate-500 to-slate-700",
        };
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl md:text-[22px] font-bold text-gray-900 dark:text-gray-300 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shrink-0">
              <FiUsers size={16} />
            </div>
            Client Details
          </h1>
        </div>

        <button
          onClick={() => {
            setFormData(initialForm);
            setEditId(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs font-bold active:scale-[0.98] transition-all cursor-pointer"
        >
          <FiPlus size={14} className="stroke-[3]" />
          Add New Client
        </button>
      </div>

      {/* SEARCH + FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* SEARCH BOX */}
        <div className="relative w-full md:w-80">
          <FiSearch
            size={14}
            className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400 dark:text-slate-550"
          />
          <input
            type="text"
            placeholder="Search company or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* SERVICE FILTER */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
            Service:
          </span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer w-full md:w-52"
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
          <div className="w-9 h-9 border-[3.5px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-semibold animate-pulse">Syncing client details...</span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const conf = getServiceStyles(client.service);
              return (
                <div
                  key={client._id}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Decorative Border Line */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${conf.gradient}`}></div>

                  <div>
                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${conf.gradient} text-white flex items-center justify-center text-sm font-black shrink-0 shadow-md`}>
                          {client.companyName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-[14px] font-black text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                            {client.companyName}
                          </h2>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 mt-0.5 truncate">
                            <FiBriefcase size={10} className="text-slate-400" />
                            {client.industry}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase shrink-0 ${conf.pill}`}>
                        {client.service}
                      </span>
                    </div>

                    {/* CONTACT CARD SECTION */}
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-850">
                      {client.phoneNumber && (
                        <a
                          href={`tel:${client.phoneNumber}`}
                          className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium truncate"
                        >
                          <FiPhone size={11} className="text-slate-400 shrink-0" />
                          {client.phoneNumber}
                        </a>
                      )}
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium truncate"
                        >
                          <FiMail size={11} className="text-slate-400 shrink-0" />
                          {client.email}
                        </a>
                      )}
                    </div>

                    {/* BUDGET INFORMATION */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100/50 dark:border-slate-850">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Base Budget
                        </p>
                        <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 mt-1 flex items-center">
                          ₹{Number(client.budget || 0).toLocaleString("en-IN")}
                        </h3>
                      </div>

                      <div className="bg-emerald-500/5 dark:bg-emerald-950/10 rounded-xl p-3 border border-emerald-500/10 dark:border-emerald-900/20">
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                          Total (Inc. GST)
                        </p>
                        <h3 className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                          ₹{Number(client.totalBudget || 0).toLocaleString("en-IN")}
                        </h3>
                      </div>
                    </div>

                    {/* TAX AND ASSIGNED TO ACCENTS */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                      <span className="bg-amber-100/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border border-amber-200/30">
                        GST: {client.gst}%
                      </span>
                      {client.assignedTo && (
                        <span className="bg-blue-50/50 dark:bg-blue-950/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 border border-slate-200/50 dark:border-slate-800/80">
                          <FiUser size={9} className="text-slate-400 shrink-0" />
                          Assigned: {client.assignedTo.name || client.assignedTo.email}
                        </span>
                      )}
                    </div>

                    {/* CLIENT COMMITMENT DELIVERABLES */}
                    <div className="mt-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Deliverable Commitments
                      </h4>

                      {/* Digital Marketing Deliverables */}
                      {client.service === "Digital Marketing" && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/30 dark:border-slate-850 px-2.5 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
                              <FiVideo size={10} className="text-blue-500" />
                              Reels: <strong className="text-slate-850 dark:text-white font-extrabold">{client.reels || 0}</strong>
                            </span>

                            <span className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/30 dark:border-slate-850 px-2.5 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
                              <FiImage size={10} className="text-cyan-500" />
                              Posts: <strong className="text-slate-850 dark:text-white font-extrabold">{client.posts || 0}</strong>
                            </span>

                            <span className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/30 dark:border-slate-850 px-2.5 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
                              <FiLayers size={10} className="text-purple-500" />
                              Videos: <strong className="text-slate-850 dark:text-white font-extrabold">{client.videos || 0}</strong>
                            </span>
                          </div>

                          {client.needDslr && (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                              client.needDslr === "Need DSLR"
                                ? "bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400"
                                : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-950/20 dark:border-slate-850 dark:text-slate-400"
                            }`}>
                              🎥 {client.needDslr}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Website Deliverables */}
                      {client.service === "Website" && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] inline-flex items-center gap-1.5 font-bold">
                          <FiGlobe size={11} className="animate-spin-slow" />
                          Total Structured Pages: {client.pages || 0} Pages
                        </div>
                      )}

                      {/* SEO Deliverables */}
                      {client.service === "SEO" && (
                        <div className="flex flex-wrap gap-1.5">
                          {client.onpage && (
                            <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                              <FiCheck size={10} className="stroke-[3]" />
                              On-Page Setup
                            </span>
                          )}

                          {client.offpage && (
                            <span className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                              <FiCheck size={10} className="stroke-[3]" />
                              Off-Page Strategy
                            </span>
                          )}

                          {!client.onpage && !client.offpage && (
                            <span className="text-[10px] text-slate-400 font-semibold italic">
                              No SEO deliverables checked.
                            </span>
                          )}
                        </div>
                      )}

                      {/* Fallback for no Service */}
                      {!client.service && (
                        <span className="text-[10px] text-slate-400 font-semibold italic">
                          No service selected for commitment layout.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="flex items-center gap-2 mt-5">
                    <button
                      onClick={() => handleEdit(client)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <FiEdit size={11} className="stroke-[3]" />
                      Edit Record
                    </button>

                    <button
                      onClick={() => setClientToDelete(client)}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-750 dark:text-rose-400 py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <FiTrash2 size={11} className="stroke-[3]" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-3">
                <FiUsers className="text-blue-550" size={22} />
              </div>
              <h2 className="text-[14px] font-extrabold text-slate-800 dark:text-white">
                No Registered Clients Found
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                Add a new client and configure budgets, services, and commitment deliverables.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT CLIENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 max-h-[92vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/25">
              <div>
                <h2 className="text-[15px] font-black text-slate-800 flex items-center gap-2">
                  <FiUsers size={16} className="text-blue-500" />
                  {editId ? "Update Client Details" : "Register New Client"}
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-0.5">
                  Configure corporate parameters, assignees, and contract services.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-450 hover:border-rose-100 transition-all cursor-pointer shadow-sm"
              >
                <FiX size={14} className="stroke-[3]" />
              </button>
            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* SECTION: BASIC INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1">
                  1. Company & Contact Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corporation"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Industry Sector
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g. Technology / Retail"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Corporate Email ID
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. contact@acme.com"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: ACCOUNTS & ASSIGNMENTS */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1">
                  2. Service Category & Account Managers
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Core Contract Service
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                    >
                      <option value="">Select Service Area</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Website">Website Development</option>
                      <option value="SEO">SEO Strategy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Assign to Administrator
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
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
              </div>

              {/* SECTION: FINANCIALS */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1">
                  3. Budgets & Taxation (INR)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <FiDollarSign size={10} className="text-slate-450" />
                      Base Budget (INR)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 50000"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <FiPercent size={10} className="text-slate-450" />
                      GST Slab (%)
                    </label>
                    <input
                      type="number"
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                      placeholder="e.g. 18"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Calculated Total (Inc. GST)
                    </label>
                    <div className="w-full h-10 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 dark:border-emerald-900/30 px-3.5 flex items-center text-emerald-600 dark:text-emerald-450 font-extrabold text-xs">
                      ₹{Number(calculateTotal()).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC SECTION: COMMITMENTS SPECIFIC TO SELECTED SERVICE */}
              {formData.service && (
                <div className="space-y-3 pt-2 animate-slide-up">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1">
                    4. {formData.service} Commitments
                  </h3>

                  {/* Digital Marketing commitments form */}
                  {formData.service === "Digital Marketing" && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">
                            Reels count
                          </label>
                          <input
                            type="number"
                            name="reels"
                            value={formData.reels}
                            onChange={handleChange}
                            placeholder="No. of Reels"
                            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/25"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">
                            Posts count
                          </label>
                          <input
                            type="number"
                            name="posts"
                            value={formData.posts}
                            onChange={handleChange}
                            placeholder="No. of Posts"
                            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/25"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">
                            Videos count
                          </label>
                          <input
                            type="number"
                            name="videos"
                            value={formData.videos}
                            onChange={handleChange}
                            placeholder="No. of Videos"
                            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/25"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1.5">
                          Camera DSLR Requirements
                        </label>
                        <select
                          name="needDslr"
                          value={formData.needDslr}
                          onChange={handleChange}
                          className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold cursor-pointer w-full md:w-52"
                        >
                          <option value="">Select DSLR Need</option>
                          <option value="Need DSLR">Need DSLR</option>
                          <option value="No DSLR">No DSLR</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Website commitments form */}
                  {formData.service === "Website" && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl p-4">
                      <div className="w-full md:w-1/2">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-350 mb-1">
                          Estimated Structured Pages
                        </label>
                        <input
                          type="number"
                          name="pages"
                          value={formData.pages}
                          onChange={handleChange}
                          placeholder="No. of Pages"
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/25"
                        />
                      </div>
                    </div>
                  )}

                  {/* SEO commitments form */}
                  {formData.service === "SEO" && (
                    <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/20 rounded-2xl p-4">
                      <label className="block text-[10px] font-bold text-slate-650 dark:text-slate-300 mb-2">
                        Select Checked Deliverables
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2.5 bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all font-semibold">
                          <input
                            type="checkbox"
                            name="onpage"
                            checked={formData.onpage}
                            onChange={handleChange}
                            className="rounded text-purple-650 focus:ring-purple-500"
                          />
                          On-Page SEO Configuration
                        </label>

                        <label className="flex items-center gap-2.5 bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all font-semibold">
                          <input
                            type="checkbox"
                            name="offpage"
                            checked={formData.offpage}
                            onChange={handleChange}
                            className="rounded text-purple-650 focus:ring-purple-500"
                          />
                          Off-Page SEO Backlinks
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-55/70 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold transition-all text-xs cursor-pointer shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all text-xs cursor-pointer"
                >
                  {editId ? "Update Client Details" : "Save Registered Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE WARNING POPUP */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 border border-rose-100/50 dark:border-rose-950/20 text-slate-800 dark:text-slate-200">
            <h2 className="text-[15px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FiAlertTriangle size={15} />
              </span>
              Confirm Client Deletion
            </h2>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed font-semibold">
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
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold transition-all text-xs cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;