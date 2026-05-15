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

    <div className="min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Template Library
          </h1>

          <p className="text-gray-400 mt-2">
            Manage reusable workflow templates
          </p>

        </div>



        {/* CREATE BUTTON */}
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

          className="
            flex
            items-center
            gap-2

            bg-gradient-to-r
            from-indigo-600
            to-blue-600

            hover:scale-105

            text-white

            px-5
            py-3

            rounded-2xl

            font-semibold

            transition-all
          "
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

            className={`
              pb-2

              whitespace-nowrap

              font-semibold

              transition-all

              ${
                activeTab === tab.id
                  ? `
                    text-cyan-400
                    border-b-2
                    border-cyan-400
                  `
                  : `
                    text-gray-400
                    hover:text-white
                  `
              }
            `}
          >

            {tab.label}

          </button>
        ))}

      </div>



      {/* GRID */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {filteredTemplates.map(
          (template) => (

            <div
              key={template._id}

              className="
                bg-white/5

                backdrop-blur-xl

                border
                border-white/10

                rounded-3xl

                p-6

                shadow-xl

                hover:shadow-cyan-500/10
                hover:-translate-y-1

                transition-all
                duration-300
              "
            >

              {/* TOP */}
              <div className="flex justify-between gap-4">

                <div>

                  <h2 className="text-xl font-bold text-white">
                    {template.title}
                  </h2>

                  <p className="text-xs font-semibold uppercase text-cyan-300 mt-1">
                    {template.type}
                  </p>

                </div>



                {/* TOGGLE */}
                <button
                  onClick={async () => {

                    try {

                      await dispatch(
                        toggleTemplate(
                          template._id
                        )
                      ).unwrap();

                      toast.success(
                        template.isActive
                          ? "Template Disabled"
                          : "Template Enabled"
                      );

                    } catch (error) {

                      toast.error(error);
                    }
                  }}
                >

                  <div
                    className={`
                      w-14
                      h-8

                      rounded-full

                      flex
                      items-center

                      px-1

                      transition-all
                      duration-300

                      ${
                        template.isActive
                          ? `
                            bg-green-500
                            justify-end
                          `
                          : `
                            bg-gray-500
                            justify-start
                          `
                      }
                    `}
                  >

                    <div
                      className="
                        w-6
                        h-6

                        rounded-full

                        bg-white

                        shadow-md
                      "
                    />

                  </div>

                </button>

              </div>



              {/* DESCRIPTION */}
              <p className="text-gray-300 mt-5 leading-7 text-sm">
                {template.description}
              </p>



              {/* SERVICES */}
              <div className="flex flex-wrap gap-2 mt-5">

                {template.services.map(
                  (service) => (

                    <span
                      key={service}

                      className={`
                        px-3
                        py-1

                        rounded-xl

                        text-xs
                        font-semibold

                        ${getServiceBadgeColor(
                          service
                        )}
                      `}
                    >

                      {service}

                    </span>
                  )
                )}

              </div>



              {/* FOOTER */}
              <div className="flex items-center justify-end mt-8">

               


                <div className="flex items-center gap-4">

                  {/* EDIT */}
                  <button
                    onClick={() => {

                      setEditMode(true);

                      setEditId(
                        template._id
                      );

                      setOpenModal(true);

                      setFormData({
                        title:
                          template.title,

                        type:
                          template.type,

                        description:
                          template.description,

                        services:
                          template.services,

                      
                      });
                    }}

                    className="
                      text-cyan-400
                      text-2xl

                      hover:scale-110

                      transition-all
                    "
                  >

                    <MdEdit />

                  </button>



                  {/* DELETE */}
                  <button
                    onClick={async () => {

                      const confirmDelete =
                        window.confirm(
                          "Delete this template?"
                        );

                      if (
                        !confirmDelete
                      )
                        return;

                      try {

                        await dispatch(
                          deleteTemplate(
                            template._id
                          )
                        ).unwrap();

                        toast.success(
                          "Template Deleted"
                        );

                      } catch (error) {

                        toast.error(error);
                      }
                    }}

                    className="
                      text-red-400
                      text-2xl

                      hover:scale-110

                      transition-all
                    "
                  >

                    <MdDelete />

                  </button>

                </div>

              </div>

            </div>
          )
        )}

      </div>



      {/* EMPTY */}
      {filteredTemplates.length ===
        0 && (

        <div className="text-center py-20">

          <h2 className="text-2xl font-bold text-white">
            No Templates Found
          </h2>

          <p className="text-gray-400 mt-3">
            Create your first template
          </p>

        </div>
      )}



      {/* MODAL */}
      {openModal && (

        <div
          className="
            fixed
            inset-0

            bg-black/60

            backdrop-blur-sm

            flex
            items-center
            justify-center

            z-50

            p-4
          "
        >

          <div
            className="
              w-full
              max-w-3xl

              rounded-3xl

              overflow-hidden

              bg-[#101826]

              border
              border-white/10

              shadow-2xl
            "
          >

            {/* HEADER */}
            <div
              className="
                flex
                justify-between
                items-center

                p-6

                border-b
                border-white/10
              "
            >

              <h2 className="text-3xl font-bold text-white">

                {editMode
                  ? "Update Template"
                  : "Create Template"}

              </h2>



              <button
                onClick={() =>
                  setOpenModal(false)
                }

                className="
                  w-10
                  h-10

                  rounded-xl

                  bg-white/10

                  hover:bg-white/20

                  flex
                  items-center
                  justify-center

                  text-white
                  text-2xl

                  transition-all
                "
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

                <label className="text-white font-semibold">
                  Template Name
                </label>

                <input
                  type="text"

                  required

                  value={formData.title}

                  onChange={(e) =>
                    setFormData({
                      ...formData,

                      title:
                        e.target.value,
                    })
                  }

                  placeholder="Enter template name"

                  className="
                    w-full
                    mt-2

                    px-4
                    py-4

                    rounded-2xl

                    bg-white/5

                    border
                    border-white/10

                    text-white

                    outline-none
                  "
                />

              </div>



              {/* TYPE */}
              <div className="mb-5">

                <label className="text-white font-semibold">
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

                  className="
                    w-full
                    mt-2

                    px-4
                    py-4

                    rounded-2xl

                    bg-white/5

                    border
                    border-white/10

                    text-white

                    outline-none
                  "
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

                <label className="text-white font-semibold">
                  Description
                </label>

                <textarea
                  rows="4"

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

                  placeholder="Enter description"

                  className="
                    w-full
                    mt-2

                    px-4
                    py-4

                    rounded-2xl

                    bg-white/5

                    border
                    border-white/10

                    text-white

                    outline-none
                    resize-none
                  "
                />

              </div>






              {/* SERVICES */}
              <div className="mb-8">

                <label className="text-white font-semibold">
                  Services
                </label>

                <div className="flex flex-wrap gap-3 mt-4">

                  {[
                    "SMM",
                    "SEO",
                    "Ads",
                    "Video",
                  ].map((service) => (

                    <button
                      key={service}

                      type="button"

                      onClick={() =>
                        handleServiceToggle(
                          service
                        )
                      }

                      className={`
                        px-4
                        py-2

                        rounded-xl

                        font-semibold

                        border

                        transition-all

                        ${
                          formData.services.includes(
                            service
                          )
                            ? `
                              bg-cyan-500
                              text-white
                              border-cyan-500
                            `
                            : `
                              bg-white/5
                              text-gray-300
                              border-white/10
                            `
                        }
                      `}
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

                  className="
                    px-6
                    py-3

                    rounded-2xl

                    bg-white/10

                    text-white

                    font-semibold
                  "
                >

                  Cancel

                </button>



                <button
                  type="submit"

                  className="
                    px-8
                    py-3

                    rounded-2xl

                    bg-gradient-to-r
                    from-cyan-500
                    to-blue-600

                    text-white

                    font-semibold
                  "
                >

                  {editMode
                    ? "Update Template"
                    : "Create Template"}

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