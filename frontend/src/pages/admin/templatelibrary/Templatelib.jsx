import React, {
  useEffect,
  useState,
} from "react";

import {
  IoAdd,
  IoClose,
} from "react-icons/io5";

import {
  MdToggleOn,
  MdToggleOff,
  MdDelete,
  MdEdit,
} from "react-icons/md";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  toggleTemplate,
} from "../../../features/template/templateSlice";



const Templatelib = () => {
  const dispatch = useDispatch();

  const { templates } = useSelector(
    (state) => state.templates
  );

  const [activeTab, setActiveTab] =
    useState("all");

  const [openModal, setOpenModal] =
    useState(false);

  const [formData, setFormData] =
    useState({
      title: "",
      type: "Campaign",
      description: "",
      services: [],
      totalTasks: 0,
    });



  useEffect(() => {
    dispatch(getTemplates());
  }, [dispatch]);



  const tabs = [
    {
      id: "all",
      label: "All Templates",
    },
    {
      id: "onboarding",
      label: "Onboarding",
    },
    {
      id: "service process",
      label: "Service Process",
    },
    {
      id: "checklist",
      label: "Checklists",
    },
    {
      id: "campaign",
      label: "Campaign",
    },
  ];



  const getServiceBadgeColor = (
    service
  ) => {
    const colors = {
      SMM: "bg-blue-100 text-blue-600",
      SEO: "bg-teal-100 text-teal-600",
      Ads: "bg-orange-100 text-orange-600",
      Video: "bg-pink-100 text-pink-600",
    };

    return (
      colors[service] ||
      "bg-gray-100 text-gray-600"
    );
  };



  const handleServiceToggle = (
    service
  ) => {
    setFormData((prev) => ({
      ...prev,

      services: prev.services.includes(
        service
      )
        ? prev.services.filter(
            (s) => s !== service
          )
        : [...prev.services, service],
    }));
  };



  const handleCreateTemplate = (
    e
  ) => {
    e.preventDefault();

    dispatch(
      createTemplate(formData)
    );

    setOpenModal(false);

    setFormData({
      title: "",
      type: "Campaign",
      description: "",
      services: [],
    
    });
  };



  const filteredTemplates =
    templates.filter((template) => {
      if (activeTab === "all")
        return true;

      return (
        template.type.toLowerCase() ===
        activeTab
      );
    });



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 md:p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Template Library
        </h1>

        <button
          onClick={() =>
            setOpenModal(true)
          }
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-105 text-white px-5 py-3 rounded-xl font-semibold transition-all"
        >
          <IoAdd className="text-xl" />

          New Template
        </button>
      </div>



      {/* TABS */}
      <div className="flex gap-5 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id)
            }
            className={`pb-2 whitespace-nowrap font-semibold ${
              activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>



      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(
          (template) => (
            <div
              key={template._id}
              className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-indigo-500 hover:shadow-2xl transition-all"
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {template.title}
                  </h2>

                  <p className="text-xs font-bold uppercase text-gray-400 mt-1">
                    {template.type}
                  </p>
                </div>

                <button
                  onClick={() =>
                    dispatch(
                      toggleTemplate(
                        template._id
                      )
                    )
                  }
                >
                  {template.isActive ? (
                    <MdToggleOn className="text-4xl text-teal-500" />
                  ) : (
                    <MdToggleOff className="text-4xl text-gray-300" />
                  )}
                </button>
              </div>



              <p className="text-gray-600 mt-4 text-sm leading-7">
                {
                  template.description
                }
              </p>



              <div className="flex flex-wrap gap-2 mt-5">
                {template.services.map(
                  (service) => (
                    <span
                      key={service}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getServiceBadgeColor(
                        service
                      )}`}
                    >
                      {service}
                    </span>
                  )
                )}
              </div>



              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-400">
                  {
                    template.totalTasks
                  }{" "}
                  tasks
                </p>

                <div className="flex items-center gap-3">
                  <button className="text-blue-500 text-xl">
                    <MdEdit />
                  </button>

                  <button
                    onClick={() =>
                      dispatch(
                        deleteTemplate(
                          template._id
                        )
                      )
                    }
                    className="text-red-500 text-xl"
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>



      {/* CREATE MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EDEFF8] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-3xl font-bold text-gray-900">
                Create Template
              </h2>

              <button
                onClick={() =>
                  setOpenModal(false)
                }
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-500 text-2xl"
              >
                <IoClose />
              </button>
            </div>



            {/* FORM */}
            <form
              onSubmit={
                handleCreateTemplate
              }
              className="p-6"
            >
              {/* TITLE */}
              <div className="mb-5">
                <label className="font-semibold text-gray-700">
                  Template Name
                </label>

                <input
                  type="text"
                  placeholder="Enter template name"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title:
                        e.target.value,
                    })
                  }
                  className="w-full mt-2 px-4 py-4 rounded-2xl border outline-none"
                />
              </div>



              {/* TYPE */}
              <div className="mb-5">
                <label className="font-semibold text-gray-700">
                  Type
                </label>

                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type:
                        e.target.value,
                    })
                  }
                  className="w-full mt-2 px-4 py-4 rounded-2xl border outline-none"
                >
                  <option>
                    Onboarding
                  </option>

                  <option>
                    Service Process
                  </option>

                  <option>
                    Checklist
                  </option>

                  <option>
                    Campaign
                  </option>
                </select>
              </div>



              {/* DESCRIPTION */}
              <div className="mb-5">
                <label className="font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  rows="4"
                  placeholder="Enter description"
                  value={
                    formData.description
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description:
                        e.target.value,
                    })
                  }
                  className="w-full mt-2 px-4 py-4 rounded-2xl border outline-none resize-none"
                />
              </div>



             



              {/* SERVICES */}
              <div className="mb-8">
                <label className="font-semibold text-gray-700">
                  Services
                </label>

                <div className="flex gap-3 flex-wrap mt-3">
                  {[
                    "SMM",
                    "SEO",
                    "Ads",
                    "Video",
                  ].map((service) => (
                    <button
                      type="button"
                      key={service}
                      onClick={() =>
                        handleServiceToggle(
                          service
                        )
                      }
                      className={`px-4 py-2 rounded-xl font-semibold border transition-all ${
                        formData.services.includes(
                          service
                        )
                          ? "bg-indigo-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>



              {/* BUTTONS */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="px-6 py-3 rounded-2xl bg-white font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templatelib;