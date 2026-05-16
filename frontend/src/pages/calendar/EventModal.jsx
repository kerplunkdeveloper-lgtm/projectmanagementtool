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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] border border-gray-200 shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-slate-50/50">
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FiCalendar size={26} />
            </div>
            {isEditing ? "Modify Initiative" : "Launch Post"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-300 shadow-sm"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Event Identification *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g., ABC Restaurant — Product Launch"
              className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Client Association *</label>
              <select
                name="client"
                required
                value={formData.client}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
              >
                <option value="">Select Target Client</option>
                {clients?.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Content Format</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium cursor-pointer"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Scheduling Date *</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full h-14 bg-slate-50 border border-gray-200 rounded-2xl px-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Strategy Notes</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detail the objectives or execution steps..."
              className="w-full bg-slate-50 border border-gray-200 rounded-[2rem] p-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-5 pt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-10 py-4 rounded-2xl border border-gray-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg shadow-[0_15px_35px_rgba(37,99,235,0.3)] hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(37,99,235,0.4)] transition-all active:scale-95"
            >
              {isEditing ? "Commit Changes" : "Deploy Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
