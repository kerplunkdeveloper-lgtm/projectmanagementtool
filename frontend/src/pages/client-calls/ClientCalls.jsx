import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiPhoneCall,
  FiPlus,
  FiClock,
  FiCalendar,
  FiSave,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiSquare,
  FiUser,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

// --- STATIC PURE HELPERS (Extracted to avoid re-allocation on every render) ---

const formatDateDMY = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return "-";
  }
};

const formatTime12hr = (timeStr) => {
  if (!timeStr) return "";
  const [hourStr, minStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minStr} ${ampm}`;
};

const formatElapsedTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0)
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const calculateDuration = (start, end) => {
  if (!start || !end) return "";
  const startTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  let diffMs = endTime - startTime;
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.round((diffMs % 3600000) / 60000);

  if (diffHrs === 0) return `${diffMins} mins`;
  if (diffMins === 0) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""}`;
  return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ${diffMins} mins`;
};

const getAvatarUrl = (userObj) => {
  if (!userObj) return null;
  return (
    (typeof userObj.profile?.profileImage === "object"
      ? userObj.profile?.profileImage?.url
      : userObj.profile?.profileImage) ||
    (typeof userObj.profileImage === "object"
      ? userObj.profileImage?.url
      : userObj.profileImage) ||
    userObj.profilePic ||
    userObj.avatar ||
    userObj.profile?.profilePic ||
    userObj.profile?.avatar ||
    null
  );
};

const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-fuchsia-600",
];

// --- MEMOIZED USER AVATAR COMPONENT ---
const UserAvatar = React.memo(({ userObj, sizeClass = "w-7 h-7 text-[10px]" }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = useMemo(() => getAvatarUrl(userObj), [userObj]);

  if (!userObj) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0`}
      >
        <FiUser size={12} />
      </div>
    );
  }

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={userObj.name || "User"}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200/90 dark:border-white/10 shadow-2xs shrink-0`}
      />
    );
  }

  const name = userObj.name || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(name.length - 1) || 0);
  const colorClass = AVATAR_COLORS[charCode % AVATAR_COLORS.length];

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold tracking-tight shadow-2xs shrink-0 border border-white/20`}
    >
      {initials}
    </div>
  );
});
UserAvatar.displayName = "UserAvatar";

// --- MEMOIZED CALL ROW COMPONENT ---
const CallRow = React.memo(({ call, onEdit, onDelete }) => {
  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group">
      {/* Date in Date Month Year format */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <FiCalendar size={13} />
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
            {formatDateDMY(call.date)}
          </span>
        </div>
      </td>

      {/* Client */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
          {call.client?.companyName || "Unknown"}
        </span>
      </td>

      {/* Posted By with User Profile Image */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <UserAvatar userObj={call.createdBy} sizeClass="w-7 h-7 text-[10px]" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-tight">
              {call.createdBy?.name || "Unknown"}
            </span>
            {call.createdBy?.department && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {call.createdBy.department}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Time */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <FiClock className="text-slate-400 shrink-0" size={13} />
          <span>
            {formatTime12hr(call.startTime)} - {formatTime12hr(call.endTime)}
          </span>
        </div>
      </td>

      {/* Duration */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {call.duration}
        </span>
      </td>

      {/* Discussion Points */}
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-md">
        <div className="line-clamp-2 text-xs leading-relaxed" title={call.discussionPoints}>
          {call.discussionPoints}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(call)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-2.5 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
          title="Edit Call"
        >
          <FiEdit2 size={15} />
        </button>
        <button
          onClick={() => onDelete(call._id)}
          className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
          title="Delete Call"
        >
          <FiTrash2 size={15} />
        </button>
      </td>
    </tr>
  );
});
CallRow.displayName = "CallRow";

// --- MAIN CLIENT CALLS COMPONENT ---
const ClientCalls = ({ isEmbedded = false }) => {
  const { user } = useSelector((state) => state.auth);
  const [calls, setCalls] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filters & Pagination State
  const [filterDate, setFilterDate] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterPostedBy, setFilterPostedBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Timer State
  const [timeMode, setTimeMode] = useState("manual"); // 'manual' or 'timer'
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    client: "",
    discussionPoints: "",
    startTime: "",
    endTime: "",
    duration: "",
  });

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [callsRes, clientsRes] = await Promise.all([
        axiosInstance.get("/client-calls"),
        axiosInstance.get("/clients"),
      ]);
      setCalls(callsRes.data.data || []);
      setClients(clientsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load client calls");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterClient, filterPostedBy]);

  // Memoized unique postedBy list for filter dropdown
  const postedByList = useMemo(() => {
    const map = new Map();
    calls.forEach((c) => {
      const u = c.createdBy;
      if (u && (u._id || u.id)) {
        const id = (u._id || u.id).toString();
        const name = u.name || "Unknown";
        if (!map.has(id)) {
          map.set(id, { _id: id, name });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [calls]);

  // Optimized Filtered Calls
  const filteredCalls = useMemo(() => {
    const currentUserId = user?._id || user?.id;
    const isTeamUser = user?.role === "team";

    return calls.filter((call) => {
      // Role scope restriction
      if (isTeamUser) {
        const creatorId = call.createdBy?._id || call.createdBy?.id || call.createdBy;
        if (creatorId !== currentUserId) return false;
      }

      // Date Filter
      if (filterDate) {
        if (!call.date) return false;
        const d = new Date(call.date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const callDate = `${yyyy}-${mm}-${dd}`;
        if (callDate !== filterDate) return false;
      }

      // Client Filter
      if (filterClient) {
        const clientId = (typeof call.client === "object" ? call.client?._id : call.client)?.toString();
        if (clientId !== filterClient) return false;
      }

      // Posted By Filter
      if (filterPostedBy) {
        const creatorId = (typeof call.createdBy === "object" ? call.createdBy?._id : call.createdBy)?.toString();
        if (creatorId !== filterPostedBy) return false;
      }

      return true;
    });
  }, [calls, user, filterDate, filterClient, filterPostedBy]);

  const totalPages = Math.ceil(filteredCalls.length / ITEMS_PER_PAGE) || 1;

  const paginatedCalls = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCalls.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCalls, currentPage, ITEMS_PER_PAGE]);

  const handleTimeChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (updated.startTime && updated.endTime) {
        updated.duration = calculateDuration(updated.startTime, updated.endTime);
      }
      return updated;
    });
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEdit = useCallback((call) => {
    setEditId(call._id);
    setFormData({
      date: new Date(call.date).toISOString().split("T")[0],
      client: call.client?._id || "",
      discussionPoints: call.discussionPoints || "",
      startTime: call.startTime || "",
      endTime: call.endTime || "",
      duration: call.duration || "",
    });
    setTimeMode("manual");
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this call record?")) return;

      try {
        await axiosInstance.delete(`/client-calls/${id}`);
        toast.success("Call record deleted successfully!");
        fetchData();
      } catch (error) {
        console.error("Error deleting call:", error);
        toast.error("Failed to delete record");
      }
    },
    [fetchData]
  );

  const handleCancel = useCallback(() => {
    setShowAddForm(false);
    setEditId(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      client: "",
      discussionPoints: "",
      startTime: "",
      endTime: "",
      duration: "",
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.duration) {
        toast.error("Please provide valid Start and End times.");
        return;
      }

      setSubmitting(true);
      try {
        if (editId) {
          await axiosInstance.put(`/client-calls/${editId}`, formData);
          toast.success("Call record updated!");
        } else {
          await axiosInstance.post("/client-calls", formData);
          toast.success("Call record saved!");
        }

        handleCancel();
        fetchData();
      } catch (error) {
        console.error("Error saving call:", error);
        toast.error(error.response?.data?.message || "Failed to save call record");
      } finally {
        setSubmitting(false);
      }
    },
    [editId, formData, handleCancel, fetchData]
  );

  // Stopwatch functions
  const startTimer = useCallback(() => {
    if (!formData.client) {
      toast.error("Please select a client before starting the call");
      return;
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    setFormData((prev) => ({
      ...prev,
      startTime: `${hh}:${mm}`,
      endTime: "",
      duration: "",
    }));

    setElapsedSeconds(0);
    setIsTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [formData.client]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;

    let durationStr = "";
    if (hrs > 0) durationStr += `${hrs} hr${hrs > 1 ? "s" : ""} `;
    if (mins > 0 || hrs > 0) durationStr += `${mins} min${mins !== 1 ? "s" : ""} `;
    if (secs > 0 || (hrs === 0 && mins === 0)) durationStr += `${secs} sec${secs !== 1 ? "s" : ""}`;

    setFormData((prev) => {
      const newData = { ...prev, endTime: `${hh}:${mm}` };
      if (newData.startTime) {
        newData.duration = durationStr.trim();
      }
      return newData;
    });
  }, [elapsedSeconds]);

  const handleResetFilters = useCallback(() => {
    setFilterDate("");
    setFilterClient("");
    setFilterPostedBy("");
  }, []);

  return (
    <div className={isEmbedded ? "px-6 pb-6" : "p-6"}>
      {/* Top Header when standalone */}
      {!isEmbedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <FiPhoneCall size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Client Calls</h1>
          </div>
          {!showAddForm && (
            <button
              onClick={() => {
                setEditId(null);
                setTimeMode("timer");
                setShowAddForm(true);
              }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm cursor-pointer"
            >
              <FiPlus className="mr-2" /> Log New Call
            </button>
          )}
        </div>
      )}

      {/* Button when embedded */}
      {isEmbedded && !showAddForm && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setEditId(null);
              setTimeMode("timer");
              setShowAddForm(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-semibold cursor-pointer"
          >
            <FiPlus className="mr-2" /> Log New Call
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal/Section */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#0B1120] rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-6 mb-6 shadow-sm transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              {editId ? <FiEdit2 className="mr-2 text-indigo-500" /> : <FiPlus className="mr-2 text-indigo-500" />}
              {editId ? "Edit Call Record" : "Create New Call Record"}
            </h2>

            {/* Time Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTimeMode("timer")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeMode === "timer"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Live Timer
              </button>
              <button
                type="button"
                onClick={() => setTimeMode("manual")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeMode === "manual"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client</label>
                <select
                  name="client"
                  required
                  value={formData.client}
                  onChange={handleChange}
                  disabled={loading || clients.length === 0}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <option value="">Loading clients...</option>
                  ) : clients.length === 0 ? (
                    <option value="">No clients available</option>
                  ) : (
                    <>
                      <option value="">Select client...</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.companyName}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Conditional Time Inputs */}
              {timeMode === "manual" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      required
                      value={formData.startTime}
                      onChange={handleTimeChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      required
                      value={formData.endTime}
                      onChange={handleTimeChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                    />
                  </div>
                </>
              ) : (
                <div className="lg:col-span-2 flex items-end">
                  <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="font-mono text-xl font-medium text-indigo-600 dark:text-indigo-400 tracking-wider w-20 text-center">
                        {formatElapsedTime(elapsedSeconds)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formData.startTime && !isTimerRunning && formData.endTime ? (
                          <span>
                            Call finished ({formatTime12hr(formData.startTime)} - {formatTime12hr(formData.endTime)})
                          </span>
                        ) : isTimerRunning ? (
                          <span className="flex items-center text-emerald-500">
                            <span className="animate-pulse mr-1 h-2 w-2 bg-emerald-500 rounded-full"></span> Call in
                            progress...
                          </span>
                        ) : (
                          <span>Click start when call begins</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {!isTimerRunning ? (
                        <button
                          type="button"
                          onClick={startTimer}
                          disabled={!formData.client}
                          className="flex items-center px-4 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <FiPlay className="mr-1.5" /> Start
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopTimer}
                          className="flex items-center px-4 py-1.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 text-sm font-medium transition-colors cursor-pointer"
                        >
                          <FiSquare className="mr-1.5" /> End Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Discussion Points / MOM
              </label>
              <textarea
                name="discussionPoints"
                rows="4"
                required
                value={formData.discussionPoints}
                onChange={handleChange}
                placeholder="What was discussed in this call? Key decisions, action items, or feedback..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Duration:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formData.duration || "--"}
                </span>
              </div>
              <div className="flex space-x-3">
                {!isTimerRunning && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || isTimerRunning}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center cursor-pointer"
                >
                  <FiSave className="mr-2" /> {submitting ? "Saving..." : editId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar Above Table */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3.5 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pr-1">
            <FiFilter size={14} className="text-indigo-500" />
            <span>Filters:</span>
          </div>

          {/* Date Filter */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer"
              title="Filter by Call Date"
            />
          </div>

          {/* Client Filter */}
          <div className="relative">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer max-w-[200px]"
            >
              <option value="">All Clients ({clients.length})</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName || c.clientName || "Unnamed Client"}
                </option>
              ))}
            </select>
          </div>

          {/* Posted By Filter */}
          {user?.role !== "team" && (
            <div className="relative">
              <select
                value={filterPostedBy}
                onChange={(e) => setFilterPostedBy(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer max-w-[180px]"
              >
                <option value="">All Posted By ({postedByList.length})</option>
                {postedByList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters Button */}
          {(filterDate || filterClient || filterPostedBy) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Counter Summary */}
        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap self-center">
          Total Calls: <span className="font-bold text-slate-700 dark:text-slate-300">{filteredCalls.length}</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : calls.length === 0 && !showAddForm ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <FiPhoneCall size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Calls Logged</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 mb-4">
              You haven't recorded any client calls yet.
            </p>
            <button
              onClick={() => {
                setEditId(null);
                setTimeMode("timer");
                setShowAddForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium text-sm cursor-pointer"
            >
              <FiPlus className="mr-2" /> Log Your First Call
            </button>
          </div>
        ) : filteredCalls.length === 0 && !showAddForm ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <FiFilter size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No matching call records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              No client calls match your current filter criteria.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Posted By</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium">Discussion Points</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {paginatedCalls.map((call) => (
                  <CallRow key={call._id} call={call} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredCalls.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0E1526]">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCalls.length)}
              </span>{" "}
              of <span className="font-bold text-slate-700 dark:text-slate-200">{filteredCalls.length}</span> calls
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && page - prev > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-xs text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCalls;
