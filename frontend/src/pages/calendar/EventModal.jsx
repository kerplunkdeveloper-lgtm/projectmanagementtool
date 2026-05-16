import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiUser, FiLayers } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getClients } from "../../features/clients/clientSlice";

const EventModal = ({ open, setOpen, onSubmit, initialData, isEditing }) => {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    type: "Post",
    client: "",
    color: "#3b82f6",
  });

  const eventTypes = ["Post", "Reel", "Story", "Ad", "Report"];

  useEffect(() => {
    if (open) {
      dispatch(getClients());
      if (isEditing && initialData) {
        const formatForInput = (date) => {
          if (!date) return "";
          const d = new Date(date);
          return d.toISOString().split("T")[0];
        };

        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          date: formatForInput(initialData.date),
          type: initialData.type || "Post",
          client: initialData.client?._id || initialData.client || "",
          color: initialData.color || "#3b82f6",
        });
      } else if (initialData?.start) {
          const d = new Date(initialData.start);
          setFormData({
            title: "",
            description: "",
            date: d.toISOString().split("T")[0],
            type: "Post",
            client: "",
            color: "#3b82f6",
          });
      } else {
        setFormData({
          title: "",
          description: "",
          date: "",
          type: "Post",
          client: "",
          color: "#3b82f6",
        });
      }
    }
  }, [open, isEditing, initialData, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "client" && value) {
      const selectedClient = clients.find(c => c._id === value);
      if (selectedClient) {
         // Auto-map title: "Client Name — "
         setFormData(prev => ({
           ...prev,
           client: value,
           title: `${selectedClient.companyName} — ${prev.title.split(" — ").pop() || ""}`
         }));
         return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#0D1B2A] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
              <FiCalendar size={24} />
            </div>
            {isEditing ? "Edit Event" : "Post Event"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-12 h-12 rounded-2xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TITLE */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Event Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., ABC Restaurant — Thursday Reel"
              className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CLIENT */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Client *</label>
              <select
                name="client"
                required
                value={formData.client}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="">Select client...</option>
                {clients?.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* TYPE */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full h-14 px-6 rounded-2xl bg-[#1a2a3a] border border-white/10 text-white outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DATE */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Date *</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50 transition-all invert-calendar-icon"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Any additional notes..."
              className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-cyan-500/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-14 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-[1.02] shadow-xl shadow-cyan-500/20 transition-all"
            >
              {isEditing ? "Update Event" : "Post Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
