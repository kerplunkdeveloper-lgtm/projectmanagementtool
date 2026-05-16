import React, {
  useEffect,
  useState,
} from "react";

import {
  IoAdd,
  IoClose,
} from "react-icons/io5";

import {
  MdDelete,
  MdEdit,
} from "react-icons/md";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import toast from "react-hot-toast";

import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  toggleTemplate,
  updateTemplate,
} from "../../../features/template/templateSlice";

const Templatelib = () => {

  const dispatch = useDispatch();

  const { templates } = useSelector(
    (state) => state.templates
  );



  // STATES
  const [activeTab, setActiveTab] =
    useState("all");

  const [openModal, setOpenModal] =
    useState(false);

  const [editMode, setEditMode] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  const [formData, setFormData] =
    useState({
      title: "",
      type: "Campaign",
      description: "",
      services: [],
      totalTasks: 0,
    });



  // GET TEMPLATES
  useEffect(() => {

    dispatch(getTemplates());

  }, [dispatch]);



  // TABS
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



  // SERVICE BADGE COLORS
  const getServiceBadgeColor =
    (service) => {

      const colors = {
        SMM:
          "bg-blue-100 text-blue-600",

        SEO:
          "bg-teal-100 text-teal-600",

        Ads:
          "bg-orange-100 text-orange-600",

        Video:
          "bg-pink-100 text-pink-600",
      };

      return (
        colors[service] ||
        "bg-gray-100 text-gray-600"
      );
    };



  // SERVICE TOGGLE
  const handleServiceToggle =
    (service) => {

      setFormData((prev) => ({
        ...prev,

        services:
          prev.services.includes(
            service
          )
            ? prev.services.filter(
                (s) =>
                  s !== service
              )
            : [
                ...prev.services,
                service,
              ],
      }));
    };



  // CREATE / UPDATE
  const handleCreateTemplate =
    async (e) => {

      e.preventDefault();

      try {

        if (editMode) {

          await dispatch(
            updateTemplate({
              id: editId,
              templateData:
                formData,
            })
          ).unwrap();

          toast.success(
            "Template Updated"
          );

        } else {

          await dispatch(
            createTemplate(
              formData
            )
          ).unwrap();

          toast.success(
            "Template Created"
          );
        }

        setOpenModal(false);

        setEditMode(false);

        setEditId(null);

        setFormData({
          title: "",
          type: "Campaign",
          description: "",
          services: [],
       
        });

      } catch (error) {

        toast.error(error);
      }
    };



  // FILTER
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Template Library
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Manage and monitor reusable workflow templates</p>
          </div>

          <button
            onClick={() => {
              setEditMode(false);
              setOpenModal(true);
              setFormData({
                title: "",
                type: "Campaign",
                description: "",
                services: [],
              });
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95"
          >
            <IoAdd size={24} />
            New Template
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-2.5
                rounded-full
                whitespace-nowrap
                font-bold
                transition-all
                duration-300
                shadow-sm
                ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-blue-200 shadow-lg scale-105"
                    : "bg-white text-slate-500 hover:bg-slate-50 border border-gray-200"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template._id}
              className="group relative overflow-hidden rounded-[32px] border border-gray-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] hover:shadow-[0_30px_80px_rgba(15,23,42,0.1)] transition-all duration-500 hover:-translate-y-2"
            >
              {/* PREMIUM DECORATION */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-50/50 blur-2xl group-hover:bg-blue-100/50 transition-colors" />

              {/* TOP */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                    {template.title}
                  </h2>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                    {template.type}
                  </div>
                </div>

                {/* TOGGLE */}
                <button
                  onClick={async () => {
                    try {
                      await dispatch(toggleTemplate(template._id)).unwrap();
                      toast.success(template.isActive ? "Template Disabled" : "Template Enabled");
                    } catch (error) {
                      toast.error(error);
                    }
                  }}
                  className="shrink-0"
                >
                  <div
                    className={`
                      w-14 h-8
                      rounded-full
                      flex items-center
                      px-1
                      transition-all
                      duration-500
                      ${template.isActive ? "bg-emerald-500 shadow-emerald-200 shadow-lg justify-end" : "bg-slate-200 justify-start"}
                    `}
                  >
                    <div className="w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-500" />
                  </div>
                </button>
              </div>

              {/* DESCRIPTION */}
              <p className="text-gray-500 mt-6 leading-relaxed text-sm line-clamp-3 relative z-10">
                {template.description}
              </p>

              {/* SERVICES */}
              <div className="flex flex-wrap gap-2 mt-6 relative z-10">
                {template.services.map((service) => (
                  <span
                    key={service}
                    className={`
                      px-3 py-1.5
                      rounded-xl
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      border
                      ${getServiceBadgeColor(service)}
                      bg-opacity-50
                    `}
                  >
                    {service}
                  </span>
                ))}
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end mt-8 pt-6 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-3">
                  {/* EDIT */}
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setEditId(template._id);
                      setOpenModal(true);
                      setFormData({
                        title: template.title,
                        type: template.type,
                        description: template.description,
                        services: template.services,
                      });
                    }}
                    className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:scale-110 hover:bg-amber-100 transition-all shadow-sm"
                  >
                    <MdEdit size={22} />
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this template?")) return;
                      try {
                        await dispatch(deleteTemplate(template._id)).unwrap();
                        toast.success("Template Deleted");
                      } catch (error) {
                        toast.error(error);
                      }
                    }}
                    className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:scale-110 hover:bg-rose-100 transition-all shadow-sm"
                  >
                    <MdDelete size={22} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY */}
        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <IoAdd size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-700">No Templates Found</h2>
            <p className="text-gray-500 mt-2">Start by creating your first workflow template</p>
          </div>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-gray-200 shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden">
              {/* HEADER */}
              <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-slate-50/50">
                <h2 className="text-3xl font-black text-slate-800">
                  {editMode ? "Update Template" : "Create Template"}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-300 shadow-sm"
                >
                  <IoClose size={24} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleCreateTemplate} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* TITLE */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Template Name</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g., Client Onboarding Flow"
                    className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
                  />
                </div>

                {/* TYPE */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Workflow Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
                  >
                    <option>Onboarding</option>
                    <option>Service Process</option>
                    <option>Checklist</option>
                    <option>Campaign</option>
                  </select>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Process Description</label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the steps or purpose of this template..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
                  />
                </div>

                {/* SERVICES */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-4 ml-1">Associated Services</label>
                  <div className="flex flex-wrap gap-4">
                    {["SMM", "SEO", "Ads", "Video"].map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleServiceToggle(service)}
                        className={`
                          px-6 py-2.5
                          rounded-xl
                          font-bold
                          text-sm
                          border
                          transition-all
                          duration-300
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
                    {editMode ? "Update Template" : "Create Template"}
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
export default Templatelib;