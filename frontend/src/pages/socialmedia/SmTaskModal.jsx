import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiX, FiCalendar, FiClock, FiLock, FiAlertCircle, FiCheck, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  createSocialmediaTask,
  updateSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";

const CATEGORIES = [
  "Content",
  "Copy",
  "Posting",
  "Engagement",
  "Client",
  "Ads",
  "Strategy",
  "Reporting",
  "Calendar",
  "Audit",
  "Other",
];
const CONTENT_TYPES = [
  "Reel",
  "Post",
  "Carousel",
  "Story",
  "GMB",
  "YouTube",
  "Blog",
  "Ad",
  "Other",
];
const STATUSES = ["Not started", "In progress", "In QC", "Scheduled", "Overdue", "Completed", "Live"];
const PRIORITIES = ["High", "Medium", "Low"];
const QC_STATUSES = ["-", "Pending", "Passed", "Rejected"];

const SmTaskModal = ({ isOpen, onClose, task = null, initialDate = null }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  // Fetch real clients & team members if not already loaded
  useEffect(() => {
    if (isOpen) {
      if (!clients || clients.length === 0) dispatch(getClients());
      if (!users || users.length === 0) dispatch(getUsers());
    }
  }, [dispatch, isOpen, clients.length, users.length]);

  const [formData, setFormData] = useState({
    taskTitle: "",
    clientId: "",
    clientName: "",
    clientColor: "#6366f1",
    category: "Content",
    contentType: "Reel",
    createdById: "",
    createdByName: "",
    dueDate: "",
    publishDate: "",
    publishTime: "18:00",
    hasPublishDate: true,
    status: "Not started",
    priority: "Medium",
    qc: "-",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      let pDate = "";
      let pTime = "18:00";
      if (task.publishDate) {
        const d = new Date(task.publishDate);
        pDate = d.toISOString().split("T")[0];
        pTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }

      let dDate = "";
      if (task.dueDate) {
        dDate = new Date(task.dueDate).toISOString().split("T")[0];
      }

      const foundClient = clients.find(
        (c) => c._id === task.client?._id || c._id === task.client || c.companyName === task.clientName
      );

      const creatorName =
        task.createdBy?.name ||
        task.createdByName ||
        task.assigneeName ||
        currentUser?.name ||
        "Admin";

      setFormData({
        taskTitle: task.taskTitle || "",
        clientId: foundClient?._id || task.client?._id || task.client || "",
        clientName: task.clientName || foundClient?.companyName || "",
        clientColor: task.clientColor || foundClient?.color || "#6366f1",
        category: task.category || "Content",
        contentType: task.contentType || "Reel",
        createdById: task.createdBy?._id || task.createdBy || currentUser?._id || "",
        createdByName: creatorName,
        dueDate: dDate,
        publishDate: pDate,
        publishTime: pTime,
        hasPublishDate: Boolean(task.publishDate),
        status: task.status || "Not started",
        priority: task.priority || "Medium",
        qc: task.qc || "-",
        notes: task.notes || "",
      });
    } else {
      const defaultDateStr = initialDate
        ? new Date(initialDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const defaultClient = clients[0] || null;

      setFormData({
        taskTitle: "",
        clientId: defaultClient?._id || "",
        clientName: defaultClient?.companyName || "",
        clientColor: defaultClient?.color || "#6366f1",
        category: "Content",
        contentType: "Reel",
        createdById: currentUser?._id || "",
        createdByName: currentUser?.name || "Admin",
        dueDate: defaultDateStr,
        publishDate: defaultDateStr,
        publishTime: "18:00",
        hasPublishDate: true,
        status: "Not started",
        priority: "Medium",
        qc: "-",
        notes: "",
      });
    }
  }, [isOpen, task, initialDate, clients, users]);

  // Resolve creator info (name, profile avatar, initials)
  const creatorInfo = useMemo(() => {
    const cId = formData.createdById || task?.createdBy?._id || task?.createdBy || currentUser?._id;
    const cName = formData.createdByName || task?.createdBy?.name || task?.createdByName || currentUser?.name || "Admin";

    const matchedUser =
      (cId && users.find((u) => u._id === cId)) ||
      (cName && users.find((u) => u.name?.trim().toLowerCase() === cName.trim().toLowerCase())) ||
      (currentUser?._id === cId || currentUser?.name === cName ? currentUser : null);

    const avatarUrl =
      matchedUser?.profile?.profileImage?.url ||
      (typeof matchedUser?.profile?.profileImage === "string" ? matchedUser.profile.profileImage : null) ||
      matchedUser?.profileImage?.url ||
      (typeof matchedUser?.profileImage === "string" ? matchedUser.profileImage : null) ||
      matchedUser?.profilePic ||
      matchedUser?.avatar?.url ||
      task?.createdBy?.profile?.profileImage?.url ||
      null;

    const initials = (cName || "U")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

    return {
      name: cName,
      avatarUrl: avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null,
      initials,
    };
  }, [formData.createdById, formData.createdByName, task, currentUser, users]);

  if (!isOpen) return null;

  const handleClientSelect = (e) => {
    const val = e.target.value;
    const clientObj = clients.find((c) => c._id === val || c.companyName === val);
    if (clientObj) {
      setFormData((prev) => ({
        ...prev,
        clientId: clientObj._id,
        clientName: clientObj.companyName,
        clientColor: clientObj.color || "#6366f1",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientId: "",
        clientName: val,
        clientColor: "#6366f1",
      }));
    }
  };

  const handleAssigneeSelect = (e) => {
    const val = e.target.value;
    const userObj = users.find((u) => u._id === val || u.name === val);
    if (userObj) {
      setFormData((prev) => ({
        ...prev,
        assigneeId: userObj._id,
        assigneeName: userObj.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assigneeId: "",
        assigneeName: val || "Unassigned",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.taskTitle.trim()) return;

    setSaving(true);
    try {
      let finalPublishDate = null;
      if (formData.hasPublishDate && formData.publishDate) {
        const [hh, mm] = (formData.publishTime || "12:00").split(":");
        const d = new Date(formData.publishDate);
        d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
        finalPublishDate = d;
      }

      const payload = {
        taskTitle: formData.taskTitle.trim(),
        client: formData.clientId || null,
        clientName: formData.clientName || "General",
        clientColor: formData.clientColor || "#6366f1",
        category: formData.category,
        contentType: formData.contentType,
        createdBy: formData.createdById || currentUser?._id || currentUser?.id || null,
        createdByName: formData.createdByName || currentUser?.name || "Admin",
        assignee: formData.createdById || currentUser?._id || currentUser?.id || null,
        assigneeName: formData.createdByName || currentUser?.name || "Admin",
        dueDate: formData.dueDate ? new Date(formData.dueDate) : new Date(),
        publishDate: finalPublishDate,
        status: formData.status,
        priority: formData.priority,
        qc: formData.qc,
        notes: formData.notes,
      };

      if (task?._id) {
        await dispatch(updateSocialmediaTask({ id: task._id, data: payload })).unwrap();
      } else {
        await dispatch(createSocialmediaTask(payload)).unwrap();
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task?._id) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await dispatch(deleteSocialmediaTask(task._id)).unwrap();
        onClose();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const isCommitment = formData.hasPublishDate && Boolean(formData.publishDate);
  const isAtRisk =
    isCommitment &&
    !["Completed", "Live"].includes(formData.status) &&
    formData.publishDate &&
    (new Date(formData.publishDate).getTime() - Date.now()) / (1000 * 60 * 60) <= 24;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {task?.taskCode || "NEW TASK"}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Social Media Manager
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {task ? "Edit Social Media Task" : "Create New Social Media Task"}
            </h2>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form Body - Left & Right 2-Column Grid Layout */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Task Details & Content Brief (7 of 12 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Create Oktoberfest reel, Weekend lineup carousel..."
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold transition-all"
                />
              </div>

              {/* Client & Assignee (2-cols in Left Pane) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Client (Dynamic DB) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.clientId || formData.clientName}
                    onChange={handleClientSelect}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName}
                      </option>
                    ))}
                    {formData.clientName && !clients.some((c) => c.companyName === formData.clientName) && (
                      <option value={formData.clientName}>{formData.clientName}</option>
                    )}
                  </select>
                </div>

                {/* Created By (Logged-in User Who Posts) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Created By
                  </label>
                  <div className="w-full px-3.5 py-2 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <div className="relative shrink-0 w-5 h-5">
                      {creatorInfo.avatarUrl ? (
                        <img
                          src={creatorInfo.avatarUrl}
                          alt={creatorInfo.name}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".modal-avatar-fallback");
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="modal-avatar-fallback w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[9px] items-center justify-center uppercase"
                        style={{ display: creatorInfo.avatarUrl ? "none" : "flex" }}
                      >
                        {creatorInfo.initials}
                      </div>
                    </div>
                    <span className="truncate">
                      {creatorInfo.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category & Content Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Content Type
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {CONTENT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes / Caption Brief / Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Notes &amp; Caption Brief
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add reel concept details, visual reference links, copy, hashtags, or reviewer feedback..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Schedule, Commitment & Workflow (5 of 12 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Dynamic Workflow Live Badge Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/70 dark:to-indigo-950/20 border border-indigo-100/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Workflow Status
                  </span>
                  {isAtRisk && (
                    <span className="inline-flex items-center gap-1 font-black text-[10px] text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      <FiAlertCircle size={11} /> AT RISK (&lt; 24h)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Commitment</span>
                    {isCommitment ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400">
                        <FiLock size={11} /> Yes (Locked)
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-500">No (Internal)</span>
                    )}
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Calendar View</span>
                    <span className={`font-bold ${isCommitment ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
                      {isCommitment ? "On calendar" : "Not shown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish Date / Content Calendar Scheduling Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.hasPublishDate}
                      onChange={(e) => setFormData({ ...formData, hasPublishDate: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Publish on Calendar
                    </span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formData.hasPublishDate ? "Calendar Slot" : "Unscheduled"}
                  </span>
                </div>

                {formData.hasPublishDate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Publish Date
                      </label>
                      <div className="relative flex items-center">
                        <FiCalendar className="absolute left-2.5 text-slate-400 pointer-events-none" size={13} />
                        <input
                          type="date"
                          value={formData.publishDate}
                          onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                          className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Publish Time
                      </label>
                      <div className="relative flex items-center">
                        <FiClock className="absolute left-2.5 text-slate-400 pointer-events-none" size={13} />
                        <input
                          type="time"
                          value={formData.publishTime}
                          onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
                          className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & QC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    QC Status
                  </label>
                  <select
                    value={formData.qc}
                    onChange={(e) => setFormData({ ...formData, qc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {QC_STATUSES.map((q) => (
                      <option key={q} value={q}>
                        {q === "-" ? "None (-)" : q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {task ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <FiTrash2 size={15} /> <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <FiCheck size={16} />
                <span>{saving ? "Saving..." : task ? "Save Changes" : "Create Task"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmTaskModal;

