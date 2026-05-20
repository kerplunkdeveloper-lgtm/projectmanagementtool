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

  const { clients, loading } =
    useSelector(
      (state) => state.clients
    );

  const { users } =
    useSelector(
      (state) => state.users
    );

  const [showModal, setShowModal] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [serviceFilter, setServiceFilter] =
    useState("All");

  const [clientToDelete, setClientToDelete] =
    useState(null);

  const initialForm = {
    companyName: "",
    industry: "",
    phoneNumber: "",
    email: "",

    budget: "",
    gst: "",
    totalBudget: "",

    service: "",

    // Digital Marketing
    reels: "",
    posts: "",
    videos: "",
    needDslr: "",

    // Website
    pages: "",

    // SEO
    onpage: false,
    offpage: false,

    assignedTo: "",
  };

  const [formData, setFormData] =
    useState(initialForm);

  // ============================================
  // GET CLIENTS
  // ============================================

  useEffect(() => {
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch]);

  // ============================================
  // HANDLE CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ============================================
  // CALCULATE TOTAL
  // ============================================

  const calculateTotal = () => {
    const budget = Number(
      formData.budget || 0
    );

    const gst = Number(
      formData.gst || 0
    );

    return (
      budget + (budget * gst) / 100
    );
  };

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      totalBudget:
        calculateTotal(),
    };

    if (editId) {
      await dispatch(
        updateClient({
          id: editId,
          data: payload,
        })
      );
    } else {
      await dispatch(
        createClient(payload)
      );
    }

    setShowModal(false);
    setFormData(initialForm);
    setEditId(null);
  };

  // ============================================
  // EDIT
  // ============================================

  const handleEdit = (client) => {
    setFormData({
      ...client,
      assignedTo: client.assignedTo?._id || client.assignedTo || "",
    });

    setEditId(client._id);

    setShowModal(true);
  };

  // ============================================
  // DELETE
  // ============================================

  const handleDelete = async (id) => {
    await dispatch(deleteClient(id));
  };

  // ============================================
  // FILTER
  // ============================================

  const adminUsers = useMemo(() => {
    return (users || []).filter((u) => u.role === "admin");
  }, [users]);

  const filteredClients = useMemo(() => {
    return (clients || []).filter((client) => {
      const matchesSearch = (
        client.companyName || ""
      )
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        );

      const matchesService =
        serviceFilter === "All"
          ? true
          : client.service ===
            serviceFilter;

      return (
        matchesSearch &&
        matchesService
      );
    });
  }, [
    clients,
    searchTerm,
    serviceFilter,
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-3">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow">
              <FiUsers size={14} />
            </div>

            Client Details
          </h1>

          <p className="text-[10px] text-gray-500 mt-1">
            Manage all client details
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);

            setEditId(null);

            setFormData(initialForm);
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow text-[12px] font-medium w-fit"
        >
          <FiPlus size={12} />
          Add Client
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* SEARCH */}
        <div className="relative w-full lg:w-[240px]">
          <FiSearch
            size={12}
            className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search client..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* FILTER */}
        <select
          value={serviceFilter}
          onChange={(e) =>
            setServiceFilter(
              e.target.value
            )
          }
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-[12px] outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-[180px]"
        >
          <option value="All">
            All Services
          </option>

          <option value="Digital Marketing">
            Digital Marketing
          </option>

          <option value="Website">
            Website
          </option>

          <option value="SEO">
            SEO
          </option>
        </select>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* GRID */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {filteredClients.length >
          0 ? (
            filteredClients.map(
              (client) => (
                <div
                  key={client._id}
                  className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* TOP LINE */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500"></div>

                  {/* HEADER */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
                        {client.companyName?.charAt(
                          0
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-[13px] font-semibold text-gray-800 truncate">
                          {
                            client.companyName
                          }
                        </h2>

                        <p className="text-[10px] text-gray-500 truncate">
                          {
                            client.industry
                          }
                        </p>

                        {/* PHONE */}
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                            <FiPhone size={9} />

                            {
                              client.phoneNumber
                            }
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                            <FiMail size={9} />

                            {client.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap">
                      {client.service}
                    </span>
                  </div>

                  {/* BUDGET */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[9px] text-gray-400">
                        Budget
                      </p>

                      <h3 className="text-[12px] font-semibold text-gray-800 mt-1">
                        ₹
                        {Number(
                          client.budget
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </h3>
                    </div>

                    <div className="bg-green-50 rounded-xl p-2">
                      <p className="text-[9px] text-gray-400">
                        Total
                      </p>

                      <h3 className="text-[12px] font-semibold text-green-600 mt-1">
                        ₹
                        {Number(
                          client.totalBudget
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* GST */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[9px] font-medium inline-flex">
                      GST {client.gst}%
                    </span>
                    {client.assignedTo && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[9px] font-semibold inline-flex items-center gap-1 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Assigned: {client.assignedTo.name || client.assignedTo.email}
                      </span>
                    )}
                  </div>

                  {/* COMMITMENT */}
                  <div className="mt-3">
                    <h4 className="text-[10px] font-semibold text-gray-700 mb-2">
                      Commitment
                    </h4>

                    {/* DIGITAL MARKETING */}
                    {client.service ===
                      "Digital Marketing" && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-gray-100 px-2 py-1 rounded-lg text-[9px]">
                            Reels :{" "}
                            {client.reels ||
                              0}
                          </span>

                          <span className="bg-gray-100 px-2 py-1 rounded-lg text-[9px]">
                            Posts :{" "}
                            {client.posts ||
                              0}
                          </span>

                          <span className="bg-gray-100 px-2 py-1 rounded-lg text-[9px]">
                            Videos :{" "}
                            {client.videos ||
                              0}
                          </span>
                        </div>

                        {/* DSLR */}
                        {client.needDslr && (
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[9px]">
                              {
                                client.needDslr
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WEBSITE */}
                    {client.service ===
                      "Website" && (
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[10px] inline-flex">
                        Pages :{" "}
                        {client.pages ||
                          0}
                      </div>
                    )}

                    {/* SEO */}
                    {client.service ===
                      "SEO" && (
                      <div className="flex flex-wrap gap-1">
                        {client.onpage && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[9px]">
                            On Page
                          </span>
                        )}

                        {client.offpage && (
                          <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-[9px]">
                            Off Page
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() =>
                        handleEdit(
                          client
                        )
                      }
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-medium transition-all duration-300"
                    >
                      <FiEdit size={11} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        setClientToDelete(
                          client
                        )
                      }
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-medium transition-all duration-300"
                    >
                      <FiTrash2 size={11} />
                      Delete
                    </button>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <FiUsers
                  className="text-blue-600"
                  size={20}
                />
              </div>

              <h2 className="text-[14px] font-semibold text-gray-700">
                No Clients Found
              </h2>

              <p className="text-[10px] text-gray-500 mt-1">
                Add your first client
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto">
            {/* HEADER */}
            <div className=" px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold">
                  {editId
                    ? "Edit Client"
                    : "Add Client"}
                </h2>

                <p className="text-blue-800 text-[10px] mt-1">
                  Manage client
                  information
                </p>
              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {/* COMPANY */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Company Name
                </label>

                <input
                  type="text"
                  name="companyName"
                  value={
                    formData.companyName
                  }
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                  required
                />
              </div>

              {/* INDUSTRY */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Industry
                </label>

                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="Enter industry"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                  required
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phoneNumber"
                  value={
                    formData.phoneNumber
                  }
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Email ID
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email id"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                />
              </div>

              {/* BUDGET */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Budget
                </label>

                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Enter budget"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                />
              </div>

              {/* GST */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  GST %
                </label>

                <input
                  type="number"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  placeholder="Enter GST"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                />
              </div>

              {/* TOTAL */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Total Budget
                </label>

                <input
                  type="text"
                  value={`₹${calculateTotal().toLocaleString(
                    "en-IN"
                  )}`}
                  readOnly
                  className="w-full h-10 rounded-lg bg-green-50 border border-green-100 px-3 text-green-600 font-medium text-[12px]"
                />
              </div>


                 {/* ASSIGNED TO */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Assign to Admin User
                </label>

                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                >
                  <option value="">
                    Select Admin User
                  </option>

                  {adminUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>


              {/* SERVICE */}
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Service
                </label>

                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-[12px]"
                >
                  <option value="">
                    Select Service
                  </option>

                  <option value="Digital Marketing">
                    Digital Marketing
                  </option>

                  <option value="Website">
                    Website
                  </option>

                  <option value="SEO">
                    SEO
                  </option>
                </select>
              </div>

           

              {/* DIGITAL MARKETING */}
              {formData.service ===
                "Digital Marketing" && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <h3 className="text-[13px] font-semibold text-blue-700 mb-3">
                    Commitment
                    Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="number"
                      name="reels"
                      value={formData.reels}
                      onChange={handleChange}
                      placeholder="No.of Reels"
                      className="h-10 rounded-lg border border-gray-200 px-3 text-[12px]"
                    />

                    <input
                      type="number"
                      name="posts"
                      value={formData.posts}
                      onChange={handleChange}
                      placeholder="No.of Posts"
                      className="h-10 rounded-lg border border-gray-200 px-3 text-[12px]"
                    />

                    <input
                      type="number"
                      name="videos"
                      value={formData.videos}
                      onChange={handleChange}
                      placeholder="No.of Videos"
                      className="h-10 rounded-lg border border-gray-200 px-3 text-[12px]"
                    />
                  </div>

                  {/* DSLR */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-medium text-gray-700 mb-2">
                      DSLR Requirement
                    </label>

                    <select
                      name="needDslr"
                      value={
                        formData.needDslr
                      }
                      onChange={handleChange}
                      className="w-full md:w-[220px] h-10 rounded-lg border border-gray-200 px-3 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        Select DSLR
                        Requirement
                      </option>

                      <option value="Need DSLR">
                        Need DSLR
                      </option>

                      <option value="No DSLR">
                        No DSLR
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* WEBSITE */}
              {formData.service ===
                "Website" && (
                <div className="md:col-span-2 bg-green-50 border border-green-100 rounded-xl p-3">
                  <h3 className="text-[13px] font-semibold text-green-700 mb-3">
                    Website
                    Commitment
                  </h3>

                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleChange}
                    placeholder="No.of Pages"
                    className="w-full md:w-1/2 h-10 rounded-lg border border-gray-200 px-3 text-[12px]"
                  />
                </div>
              )}

              {/* SEO */}
              {formData.service ===
                "SEO" && (
                <div className="md:col-span-2 bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <h3 className="text-[13px] font-semibold text-purple-700 mb-3">
                    SEO Commitment
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-[11px]">
                      <input
                        type="checkbox"
                        name="onpage"
                        checked={
                          formData.onpage
                        }
                        onChange={handleChange}
                      />
                      On Page SEO
                    </label>

                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-[11px]">
                      <input
                        type="checkbox"
                        name="offpage"
                        checked={
                          formData.offpage
                        }
                        onChange={handleChange}
                      />
                      Off Page SEO
                    </label>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-100 transition-all duration-300 text-[11px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow hover:scale-[1.01] transition-all duration-300 text-[11px]"
                >
                  {editId
                    ? "Update Client"
                    : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 border border-red-100">
            <h2 className="text-[16px] font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <FiTrash2 size={14} />
              </span>
              Confirm Delete
            </h2>
            
            <p className="text-[12px] text-gray-600 mt-3 leading-relaxed">
              Are you sure you want to delete client <span className="font-semibold text-red-600">"{clientToDelete.companyName}"</span>? This action cannot be undone.
            </p>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-100 transition-all duration-300 text-[11px]"
              >
                No, Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  await dispatch(deleteClient(clientToDelete._id));
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium shadow hover:scale-[1.01] transition-all duration-300 text-[11px]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Clients;