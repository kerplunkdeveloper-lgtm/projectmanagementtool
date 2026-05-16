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

    <div className="min-h-screen  text-white ">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>

          <h1 className="text-3xl md:text-4xl font-black">
            Clients
          </h1>

          <p className="text-gray-400 mt-2">
            Manage all client details
          </p>
        </div>



        <button
          onClick={() => {
            setOpenModal(true);
            setEditClient(null);
          }}
          className="
            flex items-center justify-center gap-2
            bg-gradient-to-r from-indigo-500 to-purple-600
            hover:scale-105 duration-300
            px-5 py-3 rounded-2xl
            font-semibold
            shadow-lg shadow-indigo-500/20
          "
        >
          <FiPlus />
          New Client
        </button>
      </div>



      {/* SEARCH */}

      <div className="mb-8">

        <div className="relative w-full md:w-96">

          <FiSearch
            className="
              absolute left-4 top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

          <input
            type="text"
            placeholder="Search client..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(
                e.target.value
              );
              setCurrentPage(1);
            }}
            className="
              w-full
              bg-[#111827]
              border border-gray-700
              rounded-2xl
              pl-12 pr-4 py-3
              outline-none
              focus:border-indigo-500
              transition-all duration-300
            "
          />
        </div>
      </div>



      {/* CLIENT CARDS */}

      {
        loading ? (

          <div className="flex justify-center py-20">

            <div
              className="
                w-12 h-12
                border-4 border-indigo-500
                border-t-transparent
                rounded-full
                animate-spin
              "
            />
          </div>

        ) : (

          <>
            {
              currentClients.length ===
              0 ? (

                <div
                  className="
                    bg-[#111827]
                    border border-gray-800
                    rounded-3xl
                    p-10
                    text-center
                  "
                >
                  <h2 className="text-2xl font-bold">
                    No Clients Found
                  </h2>

                  <p className="text-gray-400 mt-3">
                    Try searching with
                    another keyword
                  </p>
                </div>

              ) : (

                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-6
                  "
                >

                  {
                    currentClients.map(
                      (client) => (

                        <div
                          key={client._id}
                          className="
                            relative
                            bg-[#111827]/90
                            backdrop-blur-xl
                            border border-gray-800
                            rounded-3xl
                            p-6
                            hover:border-indigo-500
                            hover:-translate-y-2
                            transition-all duration-300
                            overflow-hidden
                          "
                        >

                          {/* Glow */}

                          <div
                            className="
                              absolute
                              top-0 right-0
                              w-40 h-40
                              bg-indigo-500/10
                              blur-3xl
                              rounded-full
                            "
                          />



                          {/* TOP */}

                          <div className="relative flex items-start justify-between">

                            <div>

                              <h2 className="text-2xl font-bold">
                                {
                                  client.companyName
                                }
                              </h2>

                              <p className="text-gray-400 text-sm mt-1">
                                {
                                  client.industry
                                }
                              </p>
                            </div>



                            <div className="flex gap-2">

                              <button
                                onClick={() =>
                                  handleEdit(
                                    client
                                  )
                                }
                                className="
                                  bg-indigo-500/20
                                  hover:bg-indigo-500
                                  p-2.5
                                  rounded-xl
                                  duration-300
                                "
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                onClick={() =>
                                  dispatch(
                                    deleteClient(
                                      client._id
                                    )
                                  )
                                }
                                className="
                                  bg-red-500/20
                                  hover:bg-red-500
                                  p-2.5
                                  rounded-xl
                                  duration-300
                                "
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>



                          {/* DETAILS */}

                          <div className="mt-6 space-y-4 text-sm">

                            <div
                              className="
                                bg-[#1E293B]
                                rounded-2xl
                                p-3
                              "
                            >
                              <p className="text-gray-400 text-xs">
                                Phone
                              </p>

                              <p className="mt-1 font-medium">
                                {
                                  client.primaryContact
                                }
                              </p>
                            </div>



                            <div
                              className="
                                bg-[#1E293B]
                                rounded-2xl
                                p-3
                              "
                            >
                              <p className="text-gray-400 text-xs">
                                Email
                              </p>

                              <p className="mt-1 font-medium break-all">
                                {
                                  client.email
                                }
                              </p>
                            </div>



                            <div
                              className="
                                flex items-center justify-between
                                bg-[#1E293B]
                                rounded-2xl
                                p-3
                              "
                            >
                              <span className="text-gray-400">
                                Health
                              </span>

                              <span
                                className={`
                                  px-3 py-1 rounded-full text-xs font-semibold
                                  ${
                                    client.healthStatus ===
                                    "Green"
                                      ? "bg-green-500/20 text-green-400"
                                      : client.healthStatus ===
                                        "Yellow"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                  }
                                `}
                              >
                                {
                                  client.healthStatus
                                }
                              </span>
                            </div>
                          </div>



                          {/* SERVICES */}

                          <div className="flex flex-wrap gap-2 mt-5">

                            {
                              client.services.map(
                                (
                                  service,
                                  index
                                ) => (

                                  <span
                                    key={index}
                                    className="
                                      px-3 py-1
                                      rounded-xl
                                      text-xs
                                      bg-indigo-500/20
                                      text-indigo-300
                                      border border-indigo-500/20
                                    "
                                  >
                                    {service}
                                  </span>
                                )
                              )
                            }
                          </div>



                          {/* NOTES */}

                          <div
                            className="
                              mt-5
                              bg-[#1E293B]
                              rounded-2xl
                              p-4
                            "
                          >
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {
                                client.notes ||
                                "No notes available"
                              }
                            </p>
                          </div>
                        </div>
                      )
                    )
                  }
                </div>
              )
            }



            {/* PAGINATION */}

            {
              totalPages > 1 && (

                <div
                  className="
                    flex items-center justify-center
                    gap-3 flex-wrap
                    mt-10
                  "
                >

                  <button
                    onClick={() =>
                      setCurrentPage(
                        (prev) => prev - 1
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="
                      px-5 py-3 rounded-2xl
                      bg-[#111827]
                      border border-gray-700
                      hover:border-indigo-500
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    Prev
                  </button>



                  {
                    [...Array(totalPages)].map(
                      (_, index) => (

                        <button
                          key={index}
                          onClick={() =>
                            setCurrentPage(
                              index + 1
                            )
                          }
                          className={`
                            w-12 h-12 rounded-2xl
                            border font-semibold
                            transition-all duration-300
                            ${
                              currentPage ===
                              index + 1
                                ? "bg-indigo-500 border-indigo-500"
                                : "bg-[#111827] border-gray-700 hover:border-indigo-500"
                            }
                          `}
                        >
                          {index + 1}
                        </button>
                      )
                    )
                  }



                  <button
                    onClick={() =>
                      setCurrentPage(
                        (prev) => prev + 1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="
                      px-5 py-3 rounded-2xl
                      bg-[#111827]
                      border border-gray-700
                      hover:border-indigo-500
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    Next
                  </button>
                </div>
              )
            }
          </>
        )
      }



      {/* MODAL */}

      {
        openModal && (

          <div
            className="
              fixed inset-0
              bg-black/70
              backdrop-blur-sm
              flex items-center justify-center
              p-4
              z-50
            "
          >

            <div
              className="
                bg-[#0F172A]
                w-full
                max-w-3xl
                rounded-3xl
                border border-gray-800
                overflow-hidden
              "
            >

              {/* TOP */}

              <div
                className="
                  flex items-center justify-between
                  border-b border-gray-800
                  px-6 py-5
                "
              >

                <h2 className="text-2xl font-bold">
                  {
                    editClient
                      ? "Edit Client"
                      : "Add New Client"
                  }
                </h2>

                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="
                    text-gray-400
                    hover:text-white
                  "
                >
                  <FiX size={24} />
                </button>
              </div>



              {/* FORM */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="p-6 space-y-5"
              >

                <div className="grid grid-cols-1 md:grid-cols-2  gap-5">

                  <input
                    type="text"
                    name="companyName"
                    placeholder="Company Name"
                    value={
                      formData.companyName
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                      outline-none
                      focus:border-indigo-500
                    "
                  />



                  <input
                    type="text"
                    name="industry"
                    placeholder="Industry"
                    value={
                      formData.industry
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                      outline-none
                      focus:border-indigo-500
                    "
                  />



                  <input
                    type="text"
                    name="primaryContact"
                    placeholder="Phone Number"
                    value={
                      formData.primaryContact
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                      outline-none
                      focus:border-indigo-500
                    "
                  />



                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      bg-[#1E293B]
                      border border-gray-700
                      rounded-2xl
                      px-4 py-3
                      outline-none
                      focus:border-indigo-500
                    "
                  />
                </div>



                <textarea
                  name="notes"
                  placeholder="Notes"
                  rows="4"
                  value={formData.notes}
                  onChange={handleChange}
                  className="
                    w-full
                    bg-[#1E293B]
                    border border-gray-700
                    rounded-2xl
                    px-4 py-3
                    outline-none
                    focus:border-indigo-500
                  "
                />



                {/* SERVICES */}

                <div>

                  <h3 className="mb-3 font-semibold">
                    Services
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {
                      [
                        "SMM",
                        "SEO",
                        "Ads",
                        "Video",
                        "Brand",
                      ].map(
                        (
                          service
                        ) => (

                          <button
                            type="button"
                            key={service}
                            onClick={() =>
                              handleService(
                                service
                              )
                            }
                            className={`
                              px-4 py-2 rounded-2xl
                              border duration-300
                              ${
                                formData.services.includes(
                                  service
                                )
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-gray-700 bg-[#1E293B]"
                              }
                            `}
                          >
                            {service}
                          </button>
                        )
                      )
                    }
                  </div>
                </div>



                {/* HEALTH STATUS */}

                <select
                  name="healthStatus"
                  value={
                    formData.healthStatus
                  }
                  onChange={
                    handleChange
                  }
                  className="
                    w-full
                    bg-[#1E293B]
                    border border-gray-700
                    rounded-2xl
                    px-4 py-3
                    outline-none
                    focus:border-indigo-500
                  "
                >
                  <option>
                    Green
                  </option>

                  <option>
                    Yellow
                  </option>

                  <option>
                    Red
                  </option>
                </select>



                {/* BUTTONS */}

                <div className="flex justify-end gap-4 pt-4">

                  <button
                    type="button"
                    onClick={() =>
                      setOpenModal(false)
                    }
                    className="
                      px-5 py-3
                      border border-gray-700
                      rounded-2xl
                    "
                  >
                    Cancel
                  </button>



                  <button
                    type="submit"
                    className="
                      bg-gradient-to-r
                      from-indigo-500
                      to-purple-600
                      px-6 py-3
                      rounded-2xl
                      font-semibold
                      hover:scale-105
                      duration-300
                    "
                  >
                    {
                      editClient
                        ? "Update Client"
                        : "Add Client"
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Clients;