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



  return (
    <div className="min-h-screen bg-[#070B1A] text-white p-4 md:p-8">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl font-black">
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
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 duration-300 px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/20"
        >
          <FiPlus />
          New Client
        </button>
      </div>



      {/* CLIENT CARDS */}

      {
        loading ? (
          <h1>Loading...</h1>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {
              clients.map((client) => (

                <div
                  key={client._id}
                  className="bg-[#111827] border border-gray-800 rounded-2xl p-5 hover:border-indigo-500 duration-300"
                >

                  <div className="flex items-start justify-between">

                    <div>
                      <h2 className="text-xl font-bold">
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
                        className="bg-indigo-500/20 hover:bg-indigo-500 p-2 rounded-lg duration-300"
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
                        className="bg-red-500/20 hover:bg-red-500 p-2 rounded-lg duration-300"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>



                  <div className="mt-5 space-y-3 text-sm">

                    <p>
                      📞 {
                        client.primaryContact
                      }
                    </p>

                    <p>
                      ✉️ {client.email}
                    </p>

                    <p>
                      🟢 {
                        client.healthStatus
                      }
                    </p>
                  </div>



                  <div className="flex flex-wrap gap-2 mt-5">

                    {
                      client.services.map(
                        (
                          service,
                          index
                        ) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-lg text-xs bg-indigo-500/20 text-indigo-300"
                          >
                            {service}
                          </span>
                        )
                      )
                    }
                  </div>



                  <p className="text-gray-400 text-sm mt-5">
                    {client.notes}
                  </p>
                </div>
              ))
            }
          </div>
        )
      }



      {/* MODAL */}

      {
        openModal && (

          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

            <div className="bg-[#0F172A] w-full max-w-3xl rounded-2xl border border-gray-800 overflow-hidden">

              {/* TOP */}

              <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">

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
                  className="text-gray-400 hover:text-white"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

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
                    className="bg-[#1E293B] border border-gray-700 rounded-xl px-4 py-3 outline-none"
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
                    className="bg-[#1E293B] border border-gray-700 rounded-xl px-4 py-3 outline-none"
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
                    className="bg-[#1E293B] border border-gray-700 rounded-xl px-4 py-3 outline-none"
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
                    className="bg-[#1E293B] border border-gray-700 rounded-xl px-4 py-3 outline-none"
                  />
                </div>



                <textarea
                  name="notes"
                  placeholder="Notes"
                  rows="4"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-xl px-4 py-3 outline-none"
                />



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
                            className={`px-4 py-2 rounded-xl border duration-300 ${
                              formData.services.includes(
                                service
                              )
                                ? "bg-indigo-500 border-indigo-500"
                                : "border-gray-700"
                            }`}
                          >
                            {service}
                          </button>
                        )
                      )
                    }
                  </div>
                </div>



                <select
                  name="healthStatus"
                  value={
                    formData.healthStatus
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-xl px-4 py-3 outline-none"
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



                <div className="flex justify-end gap-4 pt-4">

                  <button
                    type="button"
                    onClick={() =>
                      setOpenModal(false)
                    }
                    className="px-5 py-3 border border-gray-700 rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 duration-300"
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