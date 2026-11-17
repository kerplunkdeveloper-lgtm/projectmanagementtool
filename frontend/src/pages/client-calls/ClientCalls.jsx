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
  FiX,
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
const UserAvatar = React.memo(({ userObj, sizeClass = "w-6 h-6 text-[9px]" }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = useMemo(() => getAvatarUrl(userObj), [userObj]);

  if (!userObj) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0`}
      >
        <FiUser size={10} />
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
      <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <FiCalendar size={12} />
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {formatDateDMY(call.date)}
          </span>
        </div>
      </td>

      {/* Client */}
      <td className="px-3.5 py-2.5 whitespace-nowrap text-xs font-medium">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
          {call.client?.companyName || "Unknown"}
        </span>
      </td>

      {/* Posted By with User Profile Image */}
      <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <UserAvatar userObj={call.createdBy} sizeClass="w-6 h-6 text-[9px]" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-tight">
              {call.createdBy?.name || "Unknown"}
            </span>
            {call.createdBy?.department && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {call.createdBy.department === "Social Media Manager" ? "Social Media Executive" : call.createdBy.department}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Time */}
      <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <FiClock className="text-slate-400 shrink-0" size={12} />
          <span>
            {formatTime12hr(call.startTime)} - {formatTime12hr(call.endTime)}
          </span>
        </div>
      </td>

      {/* Duration */}
      <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {call.duration}
        </span>
      </td>

      {/* Discussion Points */}
      <td className="px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 max-w-sm">
        <div className="line-clamp-2 text-xs leading-relaxed" title={call.discussionPoints}>
          {call.discussionPoints}
        </div>
      </td>

      {/* Actions */}
      <td className="px-3.5 py-2.5 whitespace-nowrap text-right text-xs font-medium">
        <button
          onClick={() => onEdit(call)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-1.5 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
          title="Edit Call"
        >
          <FiEdit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(call._id)}
          className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
          title="Delete Call"
        >
          <FiTrash2 size={13} />
        </button>
      </td>
    </tr>
  );
});
CallRow.displayName = "CallRow";

// --- MAIN CLIENT CALLS COMPONENT ---
const ClientCalls = ({ isEmbedded = false }) => {
  const { user } = useSelector((state) => state.auth);
  const deptLower = (user?.department || "").toLowerCase();
  const roleLower = (user?.role || "").toLowerCase();
  const isSocialMediaManager =
    roleLower === "socialmediamanager" ||
    roleLower === "socialmediahead" ||
    deptLower.includes("social media head");
  const isTeamUser = user?.role === "team" && !isSocialMediaManager;

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

  // Sorted clients alphabetically for easier selection
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const nameA = a.companyName || a.clientName || "";
      const nameB = b.companyName || b.clientName || "";
      return nameA.localeCompare(nameB);
    });
  }, [clients]);

  // Optimized Filtered Calls
  const filteredCalls = useMemo(() => {
    const currentUserId = user?._id || user?.id;

    return calls.filter((call) => {
      // Social Media Head restriction: Chennai branch users or Chennai branch clients
      if (isSocialMediaManager) {
        const isChennaiUser = (call.createdBy?.location || "").toLowerCase() === "chennai";
        const clientId = (typeof call.client === "object" ? call.client?._id : call.client)?.toString();
        const isChennaiClient = clientId ? clients.some((c) => c._id?.toString() === clientId) : false;
        const isMe = (call.createdBy?._id || call.createdBy?.id || call.createdBy)?.toString() === currentUserId?.toString();
        if (!isChennaiUser && !isChennaiClient && !isMe) return false;
      }

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
  }, [calls, user, filterDate, filterClient, filterPostedBy, isTeamUser]);

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
    if (isTimerRunning) {
      if (!window.confirm("A call timer is actively running. Are you sure you want to cancel and discard it?")) {
        return;
      }
    }
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
  }, [isTimerRunning]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showAddForm) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddForm, handleCancel]);

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
    <div className={isEmbedded ? "px-3.5 pb-4" : "p-3 sm:p-4"}>
      {/* Top Header when standalone */}
      {!isEmbedded && (
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <FiPhoneCall size={18} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Client Calls</h1>
        </div>
      )}

      {/* Filter Bar Above Table */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 p-2.5 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pr-1">
            <FiFilter size={12} className="text-indigo-500" />
            <span>Filters:</span>
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={`toolbar-filter-date ${filterDate ? "is-active" : ""}`}
            title="Filter by Call Date"
          />

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className={`toolbar-filter-select max-w-[200px] ${filterClient ? "is-active" : ""}`}
          >
            <option value="">All Clients ({clients.length})</option>
            {sortedClients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.companyName || c.clientName || "Unnamed Client"}
              </option>
            ))}
          </select>

          {/* Posted By Filter */}
          {(user?.role !== "team" || isSocialMediaManager) && (
            <select
              value={filterPostedBy}
              onChange={(e) => setFilterPostedBy(e.target.value)}
              className={`toolbar-filter-select max-w-[190px] ${filterPostedBy ? "is-active" : ""}`}
            >
              <option value="">All Posted By ({postedByList.length})</option>
              {postedByList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {(filterDate || filterClient || filterPostedBy) && (
            <button
              onClick={handleResetFilters}
              className="h-9 px-2.5 flex items-center text-xs text-rose-500 hover:text-rose-600 font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Section: Counter Summary & Log New Call Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap hidden sm:block">
            Total Calls: <span className="font-bold text-slate-700 dark:text-slate-300">{filteredCalls.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setTimeMode("timer");
              setShowAddForm(true);
            }}
            className="h-9 flex items-center gap-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-xs font-bold text-xs cursor-pointer transition-all whitespace-nowrap"
          >
            <FiPlus size={14} />
            <span>Log New Call</span>
          </button>
        </div>
      </div>

      {/* Log / Edit Call Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancel();
            }
          }}
        >
          <div
            className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-white to-transparent dark:from-indigo-950/20 dark:via-transparent dark:to-transparent shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FiPhoneCall size={16} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-1.5">
                    {editId ? "Edit Call Record" : "Log New Client Call"}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {editId ? "Update discussion notes or call timing" : "Record client discussion, action items, and duration"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Time Mode Segmented Switcher */}
            <div className="px-5 pt-3.5 pb-1 shrink-0">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTimeMode("timer")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeMode === "timer"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <FiPlay size={11} className={timeMode === "timer" ? "text-indigo-500 dark:text-white" : ""} />
                  <span>Live Stopwatch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimeMode("manual")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeMode === "manual"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <FiClock size={11} className={timeMode === "manual" ? "text-indigo-500 dark:text-white" : ""} />
                  <span>Manual Entry</span>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5">
              {/* Row 1: Date & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white text-xs h-9 cursor-pointer transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="client"
                    required
                    value={formData.client}
                    onChange={handleChange}
                    disabled={loading || clients.length === 0}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white text-xs h-9 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <option value="">Loading clients...</option>
                    ) : clients.length === 0 ? (
                      <option value="">No clients available</option>
                    ) : (
                      <>
                        <option value="">Select client...</option>
                        {sortedClients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.companyName || client.clientName || "Unnamed"}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Row 2: Timing Section (Live Stopwatch or Manual Entry) */}
              {timeMode === "timer" ? (
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-indigo-50/30 dark:from-indigo-950/30 dark:via-slate-800/50 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
                        {formatElapsedTime(elapsedSeconds)}
                      </div>
                      <div className="text-xs">
                        {formData.startTime && !isTimerRunning && formData.endTime ? (
                          <div className="text-slate-600 dark:text-slate-300">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Call Finished</span>
                            <div className="text-[11px] text-slate-400">
                              {formatTime12hr(formData.startTime)} - {formatTime12hr(formData.endTime)} ({formData.duration})
                            </div>
                          </div>
                        ) : isTimerRunning ? (
                          <div>
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <span className="animate-ping mr-1.5 h-2 w-2 bg-emerald-500 rounded-full"></span>
                              Call in progress...
                            </span>
                            <div className="text-[11px] text-slate-400">Started at {formatTime12hr(formData.startTime)}</div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Ready to start</span>
                            <div className="text-[11px] text-slate-400">Select client & click Start Call</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="self-end sm:self-center">
                      {!isTimerRunning ? (
                        <button
                          type="button"
                          onClick={startTimer}
                          disabled={!formData.client}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <FiPlay size={13} /> <span>Start Call</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopTimer}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer animate-pulse"
                        >
                          <FiSquare size={13} /> <span>End Call</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Start Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      required
                      value={formData.startTime}
                      onChange={handleTimeChange}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white text-xs h-9 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      End Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      required
                      value={formData.endTime}
                      onChange={handleTimeChange}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white text-xs h-9 cursor-pointer"
                    />
                  </div>
                  {formData.duration && (
                    <div className="col-span-2 flex items-center justify-end text-[11px] text-slate-500 dark:text-slate-400">
                      Calculated Duration: <span className="font-bold text-indigo-600 dark:text-indigo-400 ml-1.5">{formData.duration}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Discussion Points / MOM */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Discussion Points / MOM <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="discussionPoints"
                  rows="3"
                  required
                  value={formData.discussionPoints}
                  onChange={handleChange}
                  placeholder="What was discussed in this call? Key decisions, action items, feedback, deliverables..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white text-xs resize-none placeholder:text-slate-400 leading-relaxed"
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FiClock size={12} className="text-slate-400" />
                  <span>Duration:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formData.duration || "--"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isTimerRunning || !formData.duration}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <FiSave size={13} />
                    <span>{submitting ? "Saving..." : editId ? "Update Call" : "Save Call"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
          </div>
        ) : calls.length === 0 && !showAddForm ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2.5">
              <FiPhoneCall size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Calls Logged</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
              You haven't recorded any client calls yet.
            </p>
            <button
              onClick={() => {
                setEditId(null);
                setTimeMode("timer");
                setShowAddForm(true);
              }}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-bold text-xs cursor-pointer"
            >
              <FiPlus className="mr-1.5" size={13} /> Log Your First Call
            </button>
          </div>
        ) : filteredCalls.length === 0 && !showAddForm ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2.5">
              <FiFilter size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching call records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
              No client calls match your current filter criteria.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-semibold text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-2.5 font-bold">Date</th>
                  <th className="px-3.5 py-2.5 font-bold">Client</th>
                  <th className="px-3.5 py-2.5 font-bold">Posted By</th>
                  <th className="px-3.5 py-2.5 font-bold">Time</th>
                  <th className="px-3.5 py-2.5 font-bold">Duration</th>
                  <th className="px-3.5 py-2.5 font-bold">Discussion Points</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {paginatedCalls.map((call) => (
                  <CallRow key={call._id} call={call} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredCalls.length > 0 && (
          <div className="px-3.5 py-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-[#0E1526]">
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
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
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
                          className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-2xs ring-1 ring-indigo-600"
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
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
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
