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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Clients Portfolio
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Manage and monitor your business relationships</p>
          </div>

          <button
            onClick={() => {
              setOpenModal(true);
              setEditClient(null);
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95"
          >
            <FiPlus size={24} />
            New Client
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-10">
          <div className="relative group w-full md:w-96">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-xl group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white border border-gray-200 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* CLIENT CARDS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-[6px] border-blue-100 border-t-blue-500 rounded-full animate-spin shadow-lg"></div>
            <p className="text-slate-500 font-bold text-lg animate-pulse">Loading clients...</p>
          </div>
        ) : (
          <>
            {currentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <FiSearch size={48} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-700">No Clients Found</h2>
                <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {currentClients.map((client) => (
                  <div
                    key={client._id}
                    className="group relative overflow-hidden rounded-[32px] border border-gray-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] hover:shadow-[0_30px_80px_rgba(15,23,42,0.1)] transition-all duration-500 hover:-translate-y-2"
                  >
                    {/* PREMIUM DECORATION */}
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-50/50 blur-3xl group-hover:bg-blue-100/50 transition-colors -z-0" />

                    <div className="relative z-10">
                      {/* TOP */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                            {client.companyName}
                          </h2>
                          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                            {client.industry}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:scale-110 hover:bg-amber-100 transition-all shadow-sm"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => dispatch(deleteClient(client._id))}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:scale-110 hover:bg-rose-100 transition-all shadow-sm"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* DETAILS */}
                      <div className="mt-8 space-y-4">
                        <div className="flex justify-between border rounded-xl p-4 bg-slate-50">

                     
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all">
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Phone</p>
                          <p className="mt-1 font-bold text-slate-700">{client.primaryContact}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all">
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Email</p>
                          <p className="mt-1 font-bold text-slate-700 break-all">{client.email}</p>
                        </div>

                           </div>

                        <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all">
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Health</span>
                          <span
                            className={`
                              px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                              ${
                                client.healthStatus === "Green"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : client.healthStatus === "Yellow"
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-rose-50 text-rose-600 border border-rose-100"
                              }
                            `}
                          >
                            {client.healthStatus}
                          </span>
                        </div>
                      </div>

                      {/* SERVICES */}
                      <div className="flex flex-wrap gap-2 mt-6">
                        {client.services.map((service, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                          >
                            {service}
                          </span>
                        ))}
                      </div>

                      {/* NOTES */}
                      <div className="mt-6 bg-slate-50 rounded-[2rem] p-5 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all">
                        <p className="text-slate-500 text-xs font-medium leading-relaxed italic">
                          "{client.notes || "No additional notes provided for this client."}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16 pb-10">
                <button
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-slate-600 font-bold shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`
                        w-12 h-12 rounded-2xl font-black text-sm transition-all duration-300 active:scale-90
                        ${
                          currentPage === index + 1
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                            : "bg-white border border-gray-200 text-slate-500 hover:bg-slate-50"
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-slate-600 font-bold shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] border border-gray-200 shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden">
              {/* HEADER */}
              <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-slate-50/50">
                <h2 className="text-3xl font-black text-slate-800">
                  {editClient ? "Update Client" : "Add New Client"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-300 shadow-sm"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="E.g., Acme Corporation"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      placeholder="E.g., Technology"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Phone Number</label>
                    <input
                      type="text"
                      name="primaryContact"
                      placeholder="E.g., +1 234 567 890"
                      value={formData.primaryContact}
                      onChange={handleChange}
                      required
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="E.g., contact@acme.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Notes & History</label>
                  <textarea
                    name="notes"
                    placeholder="Briefly describe the client relationship or specific requirements..."
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
                  />
                </div>

                {/* SERVICES */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-4 ml-1">Provided Services</label>
                  <div className="flex flex-wrap gap-4">
                    {["SMM", "SEO", "Ads", "Video", "Brand"].map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleService(service)}
                        className={`
                          px-6 py-2.5 rounded-xl font-bold text-sm border transition-all duration-300
                          ${
                            formData.services.includes(service)
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105"
                              : "bg-white text-slate-500 border-gray-200 hover:bg-slate-50"
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
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Client Health Status</label>
                  <select
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleChange}
                    className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                  >
                    <option>Green</option>
                    <option>Yellow</option>
                    <option>Red</option>
                  </select>
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-5 pt-6">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-10 py-4 rounded-2xl border border-gray-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg shadow-[0_15px_35px_rgba(37,99,235,0.3)] hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(37,99,235,0.4)] transition-all active:scale-95"
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