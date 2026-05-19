import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../../features/clients/clientslice";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSearch,
  FiUsers,
  FiMail,
  FiPhone,
} from "react-icons/fi";

const HEALTH_CONFIG = {
  Green:  { pill: "bg-emerald-50 text-emerald-600 border-emerald-200",  dot: "bg-emerald-500" },
  Yellow: { pill: "bg-amber-50  text-amber-600  border-amber-200",   dot: "bg-amber-500"  },
  Red:    { pill: "bg-rose-50   text-rose-600   border-rose-200",    dot: "bg-rose-500"   },
};

const SERVICE_TAG = "px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200";

const ALL_SERVICES = ["SMM", "SEO", "Ads", "Video", "Brand"];

const CLIENTS_PER_PAGE = 6;

const AVATAR_COLORS = [
  "from-violet-400 to-indigo-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
];

const Clients = () => {
  const dispatch = useDispatch();
  const { clients, loading } = useSelector((state) => state.clients);

  const [openModal, setOpenModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    primaryContact: "",
    email: "",
    services: [],
    healthStatus: "Green",
    notes: "",
  });

  useEffect(() => { dispatch(getClients()); }, [dispatch]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleService = (s) =>
    setFormData((p) => ({
      ...p,
      services: p.services.includes(s)
        ? p.services.filter((x) => x !== s)
        : [...p.services, s],
    }));

  const openCreate = () => {
    setEditClient(null);
    setFormData({ companyName: "", industry: "", primaryContact: "", email: "", services: [], healthStatus: "Green", notes: "" });
    setOpenModal(true);
  };

  const openEdit = (client) => {
    setEditClient(client);
    setFormData({
      companyName: client.companyName,
      industry: client.industry,
      primaryContact: client.primaryContact,
      email: client.email,
      services: client.services,
      healthStatus: client.healthStatus,
      notes: client.notes,
    });
    setOpenModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editClient) dispatch(updateClient({ id: editClient._id, data: formData }));
    else dispatch(createClient(formData));
    setOpenModal(false);
    setEditClient(null);
  };

  const filtered = [...clients]
    .filter((c) => c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  const totalPages = Math.ceil(filtered.length / CLIENTS_PER_PAGE);
  const start = (currentPage - 1) * CLIENTS_PER_PAGE;
  const paginated = filtered.slice(start, start + CLIENTS_PER_PAGE);

  const avatarColor = (name) =>
    AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <FiUsers size={14} className="text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">Client Directory</h1>
            </div>
            <p className="text-xs text-gray-400 ml-9">
              {clients.length} client{clients.length !== 1 ? "s" : ""} · manage relationships &amp; health
            </p>
          </div>

          <button
            onClick={openCreate}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm shadow-violet-200 transition-all active:scale-95"
          >
            <FiPlus size={16} />
            New Client
          </button>
        </div>

        {/* ── SEARCH ── */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 mb-5 w-full sm:w-72">
          <FiSearch size={13} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="bg-transparent outline-none text-xs text-gray-700 placeholder:text-gray-400 w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-gray-300 hover:text-gray-500">
              <FiX size={12} />
            </button>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-xs">Loading clients...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <FiUsers size={22} className="text-gray-300" />
            </div>
            <h2 className="text-sm font-bold text-slate-600">No Clients Found</h2>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? "Try a different search" : "Add your first client to get started"}
            </p>
            {!searchTerm && (
              <button onClick={openCreate} className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all">
                <FiPlus size={13} /> New Client
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {paginated.map((client) => {
                const health = HEALTH_CONFIG[client.healthStatus] || HEALTH_CONFIG.Green;
                const grad = avatarColor(client.companyName);
                return (
                  <div
                    key={client._id}
                    className="group bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                  >
                    {/* CARD TOP */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                        {client.companyName.charAt(0).toUpperCase()}
                      </div>

                      {/* Name & Industry */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-bold text-slate-800 group-hover:text-violet-600 transition-colors truncate"
                          title={client.companyName}
                        >
                          {client.companyName}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium truncate">{client.industry}</p>
                      </div>

                      {/* Health + Actions */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${health.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                          {client.healthStatus}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(client)}
                            className="w-6 h-6 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-all"
                            title="Edit"
                          >
                            <FiEdit2 size={11} />
                          </button>
                          <button
                            onClick={() => dispatch(deleteClient(client._id))}
                            className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all"
                            title="Delete"
                          >
                            <FiTrash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CONTACT INFO */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 min-w-0">
                        <FiPhone size={10} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-600 truncate font-medium" title={client.primaryContact}>
                          {client.primaryContact || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 min-w-0">
                        <FiMail size={10} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-600 truncate font-medium" title={client.email}>
                          {client.email || "—"}
                        </span>
                      </div>
                    </div>

                    {/* SERVICES */}
                    {client.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {client.services.map((s) => (
                          <span key={s} className={SERVICE_TAG}>{s}</span>
                        ))}
                      </div>
                    )}

                    {/* NOTES */}
                    {client.notes && (
                      <div className="pt-2.5 mt-auto border-t border-gray-100">
                        <p className="text-[11px] text-gray-400 italic line-clamp-2">
                          {client.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-400">
                  {start + 1}–{Math.min(start + CLIENTS_PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-800">
                {editClient ? "✏️ Update Client" : "✨ New Client"}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[78vh] overflow-y-auto">

              {/* Name + Industry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Company Name *</label>
                  <input
                    name="companyName" required value={formData.companyName} onChange={handleChange}
                    placeholder="Acme Corp"
                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Industry *</label>
                  <input
                    name="industry" required value={formData.industry} onChange={handleChange}
                    placeholder="Technology"
                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm text-slate-700"
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone *</label>
                  <input
                    name="primaryContact" required value={formData.primaryContact} onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Email *</label>
                  <input
                    type="email" name="email" required value={formData.email} onChange={handleChange}
                    placeholder="contact@acme.com"
                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm text-slate-700"
                  />
                </div>
              </div>

              {/* Services + Health */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Services</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SERVICES.map((s) => (
                      <button
                        key={s} type="button" onClick={() => handleService(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          formData.services.includes(s)
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-slate-500 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Health Status</label>
                  <select
                    name="healthStatus" value={formData.healthStatus} onChange={handleChange}
                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm text-slate-700 cursor-pointer"
                  >
                    <option>Green</option>
                    <option>Yellow</option>
                    <option>Red</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
                <textarea
                  name="notes" rows="2" value={formData.notes} onChange={handleChange}
                  placeholder="Client relationship notes..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm text-slate-700 resize-none"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button" onClick={() => setOpenModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm shadow-violet-200 transition-all active:scale-95"
                >
                  {editClient ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;