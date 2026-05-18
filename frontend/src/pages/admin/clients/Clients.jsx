// pages/Clients.jsx

import React, {
  useEffect,
  useState,
} from "react";

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

import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSearch,
} from "react-icons/fi";

const Clients = () => {

  const dispatch = useDispatch();

  const {
    clients,
    loading,
  } = useSelector(
    (state) => state.clients
  );



  const [openModal, setOpenModal] =
    useState(false);

  const [editClient, setEditClient] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const clientsPerPage = 6;



  const [formData, setFormData] =
    useState({
      companyName: "",
      industry: "",
      primaryContact: "",
      email: "",
      services: [],
      healthStatus: "Green",
      notes: "",
    });



  useEffect(() => {
    dispatch(getClients());
  }, [dispatch]);



  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };



  const handleService = (service) => {

    const exists =
      formData.services.includes(
        service
      );

    if (exists) {
      setFormData({
        ...formData,
        services:
          formData.services.filter(
            (s) => s !== service
          ),
      });
    } else {
      setFormData({
        ...formData,
        services: [
          ...formData.services,
          service,
        ],
      });
    }
  };



  const handleSubmit = (e) => {

    e.preventDefault();

    if (editClient) {

      dispatch(
        updateClient({
          id: editClient._id,
          data: formData,
        })
      );

    } else {

      dispatch(
        createClient(formData)
      );
    }

    setOpenModal(false);

    setEditClient(null);

    setFormData({
      companyName: "",
      industry: "",
      primaryContact: "",
      email: "",
      services: [],
      healthStatus: "Green",
      notes: "",
    });
  };



  const handleEdit = (client) => {

    setEditClient(client);

    setFormData({
      companyName:
        client.companyName,
      industry: client.industry,
      primaryContact:
        client.primaryContact,
      email: client.email,
      services: client.services,
      healthStatus:
        client.healthStatus,
      notes: client.notes,
    });

    setOpenModal(true);
  };



  // SEARCH FILTER

  const filteredClients =
    clients.filter((client) =>
      client.companyName
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );



  // ALPHABET SORT

  const sortedClients =
    [...filteredClients].sort((a, b) =>
      a.companyName.localeCompare(
        b.companyName
      )
    );



  // PAGINATION

  const indexOfLastClient =
    currentPage * clientsPerPage;

  const indexOfFirstClient =
    indexOfLastClient -
    clientsPerPage;

  const currentClients =
    sortedClients.slice(
      indexOfFirstClient,
      indexOfLastClient
    );

  const totalPages = Math.ceil(
    sortedClients.length /
      clientsPerPage
  );



  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#0f172a] flex items-center gap-3">
              <span>🏢</span> Client Directory
            </h1>
            <p className="text-[#64748b] mt-1 text-sm font-medium">Manage your business relationships and track client health</p>
          </div>

          <button
            onClick={() => {
              setOpenModal(true);
              setEditClient(null);
            }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:bg-[#6c4be0] hover:-translate-y-0.5 transition-all w-full md:w-auto"
          >
            <FiPlus size={18} />
            New Client
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-8">
          <div className="relative group w-full md:w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-lg group-focus-within:text-[#7c5ff0] transition-colors" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-slate-200 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all text-[#1e293b] font-medium text-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* CLIENT CARDS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-[#64748b] font-bold text-sm animate-pulse">Loading clients...</p>
          </div>
        ) : (
          <>
            {currentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div className="w-20 h-20 bg-[#f1f3f9] rounded-full flex items-center justify-center mb-4">
                  <FiSearch size={32} className="text-[#94a3b8]" />
                </div>
                <h2 className="text-xl font-black text-[#1e293b]">No Clients Found</h2>
                <p className="text-[#64748b] mt-1 text-sm font-medium">Try adjusting your search criteria or add a new client.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentClients.map((client) => (
                  <div
                    key={client._id}
                    className="group relative overflow-hidden bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                          {client.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[#1e293b] font-black text-lg group-hover:text-[#7c5ff0] transition-colors truncate" title={client.companyName}>
                            {client.companyName}
                          </h3>
                          <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-wider truncate" title={client.industry}>
                            {client.industry}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          client.healthStatus === 'Green' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          client.healthStatus === 'Yellow' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${client.healthStatus === 'Green' ? 'bg-emerald-500' : client.healthStatus === 'Yellow' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                          {client.healthStatus}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(client)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-[#7c5ff0] hover:bg-indigo-50 flex items-center justify-center transition-colors">
                            <FiEdit2 size={12} />
                          </button>
                          <button onClick={() => dispatch(deleteClient(client._id))} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors">
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Body */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 min-w-0">
                        <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-[#334155] font-bold text-xs truncate" title={client.primaryContact}>{client.primaryContact}</p>
                      </div>
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 min-w-0">
                        <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-1">Email</p>
                        <p className="text-[#334155] font-bold text-xs truncate" title={client.email}>{client.email}</p>
                      </div>
                    </div>
                    
                    {/* Services */}
                    <div className="mb-4">
                      <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-2">Provided Services</p>
                      <div className="flex flex-wrap gap-1.5">
                        {client.services.map((service, index) => (
                          <span key={index} className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-white border border-slate-200 text-[#475569] shadow-sm">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-[#64748b] text-xs font-medium italic line-clamp-2">
                        "{client.notes || "No notes provided."}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RESPONSIVE PAGINATION */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 pt-6 border-t border-slate-200 pb-10">
                <span className="text-[#64748b] font-medium text-xs sm:text-sm text-center sm:text-left">
                  Showing <span className="font-bold text-[#1e293b]">{indexOfFirstClient + 1}</span> to <span className="font-bold text-[#1e293b]">{Math.min(indexOfLastClient, filteredClients.length)}</span> of <span className="font-bold text-[#1e293b]">{filteredClients.length}</span> clients
                </span>
                
                <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-[#475569] font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    Prev
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      // simple sliding window for pagination
                      if (totalPages > 5 && i !== 0 && i !== totalPages - 1 && Math.abs(i + 1 - currentPage) > 1) {
                        if (i + 1 === currentPage - 2 || i + 1 === currentPage + 2) {
                          return <span key={i} className="px-1 text-slate-400">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${
                            currentPage === i + 1
                              ? "bg-[#7c5ff0] text-white shadow-md shadow-indigo-500/20"
                              : "bg-white border border-slate-200 text-[#475569] hover:bg-slate-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile simple page indicator */}
                  <span className="sm:hidden text-xs font-bold text-[#1e293b] px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-[#475569] font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white w-full max-w-3xl rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
              {/* HEADER */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-[#f8fafc]">
                <h2 className="text-xl font-black text-[#1e293b] flex items-center gap-2">
                  <span>{editClient ? "✏️" : "✨"}</span> {editClient ? "Update Client Details" : "Add New Client"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-2">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="E.g., Acme Corporation"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-[#1e293b] font-bold text-sm placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-2">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      placeholder="E.g., Technology"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-[#1e293b] font-bold text-sm placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="text"
                      name="primaryContact"
                      placeholder="E.g., +1 234 567 890"
                      value={formData.primaryContact}
                      onChange={handleChange}
                      required
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-[#1e293b] font-bold text-sm placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="E.g., contact@acme.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-[#1e293b] font-bold text-sm placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-2">Notes & History</label>
                  <textarea
                    name="notes"
                    placeholder="Briefly describe the client relationship or specific requirements..."
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-[#1e293b] font-medium text-sm placeholder:text-slate-400 resize-none shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SERVICES */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-3">Provided Services</label>
                    <div className="flex flex-wrap gap-2">
                      {["SMM", "SEO", "Ads", "Video", "Brand"].map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleService(service)}
                          className={`
                            px-4 py-1.5 rounded-lg font-bold text-xs border transition-all duration-200
                            ${
                              formData.services.includes(service)
                                ? "bg-[#7c5ff0] text-white border-[#7c5ff0] shadow-md shadow-indigo-200 scale-105"
                                : "bg-[#f8fafc] text-[#475569] border-slate-200 hover:bg-white hover:border-slate-300"
                            }
                          `}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HEALTH STATUS */}
                  <div>
                    <label className="block text-xs font-black text-[#64748b] uppercase tracking-wider mb-3">Health Status</label>
                    <select
                      name="healthStatus"
                      value={formData.healthStatus}
                      onChange={handleChange}
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-[#1e293b] font-bold text-sm cursor-pointer shadow-sm"
                    >
                      <option>Green</option>
                      <option>Yellow</option>
                      <option>Red</option>
                    </select>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 text-[#475569] font-bold text-sm bg-white hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] hover:bg-[#6c4be0] text-white font-bold text-sm shadow-md shadow-indigo-500/30 transition-colors"
                  >
                    {editClient ? "Save Changes" : "Create Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;