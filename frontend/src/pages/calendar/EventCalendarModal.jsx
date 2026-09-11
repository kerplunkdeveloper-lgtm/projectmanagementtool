import React, { useState, useEffect } from "react";
import {
  FiX,
  FiCalendar,
  FiTrash2,
  FiUsers,
  FiGift,
  FiSun,
  FiStar,
  FiUser,
  FiClock,
} from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getClients } from "../../features/clients/clientslice";

const CATEGORIES = [
  "Client Meeting",
  "Birthday",
  "Team Outing",
  "Holiday",
  "Personal",
  "Other",
];

const CATEGORY_CONFIG = {
  "Client Meeting": {
    color: "#3b82f6",
    icon: FiUsers,
    bg: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50 border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  Birthday: {
    color: "#ec4899",
    icon: FiGift,
    bg: "bg-pink-500",
    text: "text-pink-600",
    light: "bg-pink-50 border-pink-200",
    gradient: "from-pink-400 to-pink-600",
  },
  "Team Outing": {
    color: "#8b5cf6",
    icon: FiSun,
    bg: "bg-violet-600",
    text: "text-violet-600",
    light: "bg-violet-50 border-violet-200",
    gradient: "from-violet-500 to-violet-600",
  },
  Holiday: {
    color: "#10b981",
    icon: FiStar,
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    light: "bg-emerald-50 border-emerald-200",
    gradient: "from-emerald-400 to-emerald-600",
  },
  Personal: {
    color: "#f59e0b",
    icon: FiUser,
    bg: "bg-amber-500",
    text: "text-amber-600",
    light: "bg-amber-50 border-amber-200",
    gradient: "from-amber-400 to-amber-600",
  },
  Other: {
    color: "#6366f1",
    icon: FiCalendar,
    bg: "bg-indigo-500",
    text: "text-indigo-600",
    light: "bg-indigo-50 border-indigo-200",
    gradient: "from-indigo-400 to-indigo-600",
  },
};

const EventCalendarModal = ({
  open,
  setOpen,
  onSubmit,
  initialData,
  isEditing,
  onDelete,
}) => {
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.clients);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    category: "Client Meeting",
    client: "",
    color: "#3b82f6",
    allDay: false,
  });

  const [isClosing, setIsClosing] = useState(false);

  const fmt = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  };

  useEffect(() => {
    if (!open) return;
    dispatch(getClients());

    if (isEditing && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        date: fmt(initialData.date),
        endDate: initialData.endDate ? fmt(initialData.endDate) : "",
        category: initialData.category || "Client Meeting",
        client: initialData.client?._id || initialData.client || "",
        color: initialData.color || "#3b82f6",
        allDay: initialData.allDay || false,
      });
    } else if (initialData?.start) {
      setFormData({
        title: "",
        description: "",
        date: fmt(initialData.start),
        endDate: "",
        category: "Client Meeting",
        client: "",
        color: "#3b82f6",
        allDay: false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        date: "",
        endDate: "",
        category: "Client Meeting",
        client: "",
        color: "#3b82f6",
        allDay: false,
      });
    }
    setIsClosing(false);
  }, [open, isEditing, initialData, dispatch]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategorySelect = (cat) => {
    const conf = CATEGORY_CONFIG[cat];
    setFormData((p) => ({
      ...p,
      category: cat,
      color: conf?.color || "#6366f1",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      client: formData.client || null,
    };
    // Remove endDate if empty
    if (!submitData.endDate) {
      delete submitData.endDate;
    }
    onSubmit(submitData);
  };

  if (!open) return null;

  const catConf = CATEGORY_CONFIG[formData.category] || CATEGORY_CONFIG.Other;
  const CatIcon = catConf.icon;

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden transition-all duration-200 ${
          isClosing
            ? "scale-95 opacity-0"
            : "scale-100 opacity-100 animate-[modalIn_0.25s_ease-out]"
        }`}
      >
        {/* HEADER with gradient accent */}
        <div
          className={`relative px-5 py-4 border-b border-gray-100 dark:border-slate-700/50`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-r ${catConf.gradient} opacity-[0.06]`}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${catConf.gradient} flex items-center justify-center shadow-sm`}
              >
                <CatIcon size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {isEditing ? "Edit Event" : "New Event"}
                </h2>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                  {formData.category}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"
            >
              <FiX size={14} />
            </button>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 space-y-3.5 max-h-[75vh] overflow-y-auto"
        >
          {/* CATEGORY PILLS */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Event Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const isActive = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
                      isActive
                        ? `${conf.bg} text-white border-transparent shadow-sm scale-[1.02]`
                        : `bg-white dark:bg-slate-800 ${conf.text} ${conf.light} dark:border-slate-600 hover:shadow-sm`
                    }`}
                  >
                    <Icon size={12} />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TITLE */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Client Strategy Review"
              className="w-full h-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-sm text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* CLIENT (show only for Client Meeting) + DATE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Client{" "}
                <span className="text-slate-300 dark:text-slate-600 normal-case">
                  (optional)
                </span>
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="w-full h-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="">No client</option>
                {clients?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full h-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* END DATE + ALL DAY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                End Date{" "}
                <span className="text-slate-300 dark:text-slate-600 normal-case">
                  (optional)
                </span>
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full h-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs text-slate-700 dark:text-slate-200"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={formData.allDay}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <FiClock
                    size={12}
                    className="text-slate-400 group-hover:text-blue-500 transition-colors"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    All Day Event
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Notes
            </label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any details or notes..."
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-sm text-slate-700 dark:text-slate-200 resize-none"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-slate-700/50">
            {isEditing ? (
              <button
                type="button"
                onClick={onDelete}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <FiTrash2 size={13} /> Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-95 bg-gradient-to-r ${catConf.gradient} hover:opacity-90 hover:shadow-md`}
              >
                {isEditing ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EventCalendarModal;
