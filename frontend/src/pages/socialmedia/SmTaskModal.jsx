import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiX,
  FiCalendar,
  FiClock,
  FiLock,
  FiAlertCircle,
  FiCheck,
  FiTrash2,
  FiLayers,
  FiShare2,
  FiImage,
  FiFilm,
  FiPlayCircle,
  FiChevronDown,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGoogle,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  createSocialmediaTask,
  updateSocialmediaTask,
  deleteSocialmediaTask,
} from "../../features/socialmediaTasks/socialmediaTaskSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import {
  formatLocalDateKey,
  formatLocalTimeKey,
  parseLocalDateTime,
  parseLocalDateOnly,
} from "../../utils/dateUtils";

export const CATEGORIES = [
  "Content Calendar",
  "Content Creation",
  "Ad campaign check",
  "Google review reply",
  "Engagement monitor",
  "Platform qc",
  "Client app",
  "Influencer",
  "Client call",
  "Model arrangement",
  "Content kt",
  "Business development",
  "Competitor analysis",
  "Trend analysis",
  "Insight report",
];

export const SME_CATEGORIES = [
  "Content Creation",
  "Content Calendar",
  "Ad campaign check",
  "Google review reply",
  "Engagement monitor",
  "Platform qc",
  "Client app",
  "Influencer",
  "Client call",
  "Model arrangement",
  "Content kt",
  "Business development",
  "Competitor analysis",
  "Trend analysis",
  "Insight report",
];

export const isContentCalendarCategory = (cat) => {
  if (!cat) return false;
  const c = cat.trim().toLowerCase();
  return c === "content calendar" || c === "content calendor" || c === "content";
};

export const CONTENT_CALENDAR_TYPES = ["Post", "Reels", "Stories"];

export const CONTENT_TYPES_CONFIG = [
  { id: "Post", name: "Post", icon: FiImage, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/50" },
  { id: "Reels", name: "Reels", icon: FiFilm, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/50" },
  { id: "Stories", name: "Stories", icon: FiPlayCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/50" },
];

export const SOCIAL_PLATFORMS = [
  {
    id: "Instagram",
    name: "Instagram",
    icon: FaInstagram,
    color: "#E1306C",
    bgActive: "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/20 border-pink-500",
    bgInactive: "bg-white dark:bg-[#162033] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#22324f] hover:border-pink-300 dark:hover:border-pink-500/40 hover:bg-pink-50/40 dark:hover:bg-pink-950/20",
  },
  {
    id: "Facebook",
    name: "Facebook",
    icon: FaFacebook,
    color: "#1877F2",
    bgActive: "bg-[#1877F2] text-white shadow-md shadow-blue-500/20 border-[#1877F2]",
    bgInactive: "bg-white dark:bg-[#162033] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#22324f] hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20",
  },
  {
    id: "YouTube",
    name: "YouTube",
    icon: FaYoutube,
    color: "#FF0000",
    bgActive: "bg-[#FF0000] text-white shadow-md shadow-red-500/20 border-[#FF0000]",
    bgInactive: "bg-white dark:bg-[#162033] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#22324f] hover:border-rose-300 dark:hover:border-rose-500/40 hover:bg-rose-50/40 dark:hover:bg-rose-950/20",
  },
  {
    id: "GMB",
    name: "GMB",
    icon: FaGoogle,
    color: "#4285F4",
    bgActive: "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border-emerald-500",
    bgInactive: "bg-white dark:bg-[#162033] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#22324f] hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
  },
  {
    id: "Twitter",
    name: "Twitter",
    icon: FaTwitter,
    color: "#1DA1F2",
    bgActive: "bg-[#1DA1F2] text-white shadow-md shadow-sky-500/20 border-[#1DA1F2]",
    bgInactive: "bg-white dark:bg-[#162033] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#22324f] hover:border-sky-300 dark:hover:border-sky-500/40 hover:bg-sky-50/40 dark:hover:bg-sky-950/20",
  },
  {
    id: "LinkedIn",
    name: "LinkedIn",
    icon: FaLinkedin,
    color: "#0A66C2",
    bgActive: "bg-[#0A66C2] text-white shadow-md shadow-indigo-500/20 border-[#0A66C2]",
    bgInactive: "bg-white dark:bg-[#162033] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#22324f] hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20",
  },
];

const COMMITMENT_STATUSES = [
  "Not started",
  "Inprogress",
  "QC",
  "Completed and wait CLient Approval",
  "Published Live",
];
const NON_COMMITMENT_STATUSES = [
  "Not started",
  "Inprogress",
  "Waiting for Response",
  "Completed",
];
const STATUSES = COMMITMENT_STATUSES;
const PRIORITIES = ["High", "Medium", "Low"];
const QC_STATUSES = ["-", "Pending", "Passed", "Rejected"];

const SmTaskModal = ({ isOpen, onClose, task = null, initialDate = null, isReadOnly: isReadOnlyProp = null, initialCommitment = null }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const clientsState = useSelector((state) => state.clients);
  const clients = clientsState?.clients || [];
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  const [isCommitment, setIsCommitment] = useState(true);

  const userRoleClean = (currentUser?.role?.name || currentUser?.role || "")
    .toString()
    .toLowerCase()
    .replace(/[\s_]/g, "")
    .trim();
  const isReadOnly = isReadOnlyProp !== null
    ? Boolean(isReadOnlyProp)
    : (userRoleClean === "admin" || userRoleClean === "operationmanager");

  useEffect(() => {
    if (isOpen) {
      dispatch(getClients());
      dispatch(getUsers());
    }
  }, [dispatch, isOpen]);

  const [formData, setFormData] = useState({
    taskTitle: "",
    clientId: "",
    clientName: "",
    clientColor: "#6366f1",
    category: "Content Calendar",
    contentType: "Post",
    platform: "Instagram",
    platforms: ["Instagram"],
    createdById: "",
    createdByName: "",
    assigneeId: "",
    assigneeName: "",
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
  const activeSessionRef = useRef({ isOpen: false, taskId: null, initialDateStr: null });

  useEffect(() => {
    if (!isOpen) {
      activeSessionRef.current = { isOpen: false, taskId: null, initialDateStr: null };
      return;
    }

    const currentTaskId = task?._id || "new";
    const currentInitialDateStr = initialDate ? formatLocalDateKey(initialDate) : null;

    const alreadyInitialized =
      activeSessionRef.current.isOpen &&
      activeSessionRef.current.taskId === currentTaskId &&
      activeSessionRef.current.initialDateStr === currentInitialDateStr;

    if (alreadyInitialized) {
      if (!formData.clientId && clients.length > 0 && !task) {
        setFormData((prev) => ({
          ...prev,
          clientId: prev.clientId || clients[0]._id,
          clientName: prev.clientName || clients[0].companyName,
          clientColor: prev.clientColor || clients[0].color || "#6366f1",
        }));
      }
      return;
    }

    activeSessionRef.current = {
      isOpen: true,
      taskId: currentTaskId,
      initialDateStr: currentInitialDateStr,
    };

    if (task) {
      let pDate = "";
      let pTime = "18:00";
      if (task.publishDate) {
        pDate = formatLocalDateKey(task.publishDate);
        pTime = formatLocalTimeKey(task.publishDate, "18:00");
      }

      let dDate = "";
      if (task.dueDate) {
        dDate = formatLocalDateKey(task.dueDate);
      }

      const foundClient = clients.find(
        (c) => c._id === task.client?._id || c._id === task.client || c.companyName === task.clientName
      );

      const creatorName =
        task.createdBy?.name ||
        task.createdByName ||
        currentUser?.name ||
        "Admin";

      const assigneeId =
        (typeof task.assignee === "object" ? task.assignee?._id : task.assignee) ||
        currentUser?._id ||
        "";
      const assigneeName =
        (typeof task.assignee === "object" ? task.assignee?.name : null) ||
        task.assigneeName ||
        currentUser?.name ||
        "Admin";

      const isTaskCommitment =
        task.commitment !== undefined
          ? Boolean(task.commitment)
          : isContentCalendarCategory(task.category);
      setIsCommitment(isTaskCommitment);

      const currentCat = task.category || (isTaskCommitment ? "Content Calendar" : "Content Creation");

      const initialContentType = isTaskCommitment
        ? (["Post", "Reels", "Stories", "Reel", "Story"].includes(task.contentType)
            ? (task.contentType === "Reel" ? "Reels" : task.contentType === "Story" ? "Stories" : task.contentType)
            : "Post")
        : "Others Task";

      const initialPlatform = task.platform || (task.platforms && task.platforms[0]) || "Instagram";
      const initialPlatforms = task.platforms && task.platforms.length > 0
        ? task.platforms
        : [initialPlatform];

      setFormData({
        taskTitle: task.taskTitle || "",
        clientId: foundClient?._id || task.client?._id || task.client || "",
        clientName: task.clientName || foundClient?.companyName || "",
        clientColor: task.clientColor || foundClient?.color || "#6366f1",
        category: currentCat,
        contentType: initialContentType,
        platform: initialPlatform,
        platforms: initialPlatforms,
        createdById: task.createdBy?._id || task.createdBy || currentUser?._id || "",
        createdByName: creatorName,
        assigneeId,
        assigneeName,
        dueDate: dDate,
        publishDate: pDate,
        publishTime: pTime,
        hasPublishDate: isTaskCommitment && Boolean(task.publishDate),
        status: task.status || "Not started",
        priority: task.priority || "Medium",
        qc: task.qc || "-",
        notes: task.notes || "",
      });
    } else {
      const defaultIsCommitment =
        initialCommitment !== null
          ? Boolean(initialCommitment)
          : Boolean(initialDate);
      setIsCommitment(defaultIsCommitment);

      const defaultDateStr = initialDate
        ? formatLocalDateKey(initialDate)
        : formatLocalDateKey(new Date());

      const defaultClient = clients[0] || null;

      setFormData({
        taskTitle: "",
        clientId: defaultClient?._id || "",
        clientName: defaultClient?.companyName || "",
        clientColor: defaultClient?.color || "#6366f1",
        category: defaultIsCommitment ? "Content Calendar" : "Content Creation",
        contentType: defaultIsCommitment ? "Post" : "Others Task",
        platform: defaultIsCommitment ? "Instagram" : "",
        platforms: defaultIsCommitment ? ["Instagram"] : [],
        createdById: currentUser?._id || "",
        createdByName: currentUser?.name || "Admin",
        assigneeId: currentUser?._id || "",
        assigneeName: currentUser?.name || "Admin",
        dueDate: defaultDateStr,
        publishDate: defaultDateStr,
        publishTime: "18:00",
        hasPublishDate: defaultIsCommitment,
        status: "Not started",
        priority: "Medium",
        qc: "-",
        notes: "",
      });
    }
  }, [isOpen, task, initialDate, clients, users, currentUser, initialCommitment]);

  const isContentCalendar = isCommitment;

  const contentTypeDropdownRef = useRef(null);
  const [isContentTypeOpen, setIsContentTypeOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentTypeDropdownRef.current && !contentTypeDropdownRef.current.contains(event.target)) {
        setIsContentTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabChange = (tab) => {
    if (isReadOnly) return;
    if (tab === "commitment") {
      setIsCommitment(true);
      setFormData((prev) => ({
        ...prev,
        category: "Content Calendar",
        contentType: ["Post", "Reels", "Stories"].includes(prev.contentType) ? prev.contentType : "Post",
        platform: prev.platforms?.[0] || prev.platform || "Instagram",
        platforms: prev.platforms?.length ? prev.platforms : ["Instagram"],
        hasPublishDate: true,
      }));
    } else {
      setIsCommitment(false);
      setFormData((prev) => ({
        ...prev,
        category: prev.category && prev.category !== "Content" && SME_CATEGORIES.includes(prev.category) ? prev.category : "Content Creation",
        contentType: "Others Task",
        platform: "",
        platforms: [],
        hasPublishDate: false,
      }));
    }
  };

  const handlePlatformSelect = (platId) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const currentList = Array.isArray(prev.platforms)
        ? prev.platforms
        : (prev.platform ? [prev.platform] : []);
      const exists = currentList.includes(platId);
      const updated = exists
        ? currentList.filter((p) => p !== platId)
        : [...currentList, platId];

      return {
        ...prev,
        platforms: updated,
        platform: updated.length > 0 ? updated[0] : "",
      };
    });
  };

  const handleSelectAllPlatforms = () => {
    if (isReadOnly) return;
    const allIds = SOCIAL_PLATFORMS.map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      platforms: allIds,
      platform: allIds[0] || "Instagram",
    }));
  };

  const handleClearAllPlatforms = () => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      platforms: [],
      platform: "",
    }));
  };

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
    if (isReadOnly) return;
    if (!formData.taskTitle.trim()) return;

    setSaving(true);
    try {
      const isCal = isCommitment;

      if (isCal && (!formData.platforms || formData.platforms.length === 0)) {
        toast.error("Please select at least one social media platform");
        setSaving(false);
        return;
      }

      const s = (formData.status || "").trim().toLowerCase();
      const isVerificationStatus =
        s === "qc" ||
        s === "in qc" ||
        s.includes("client approval") ||
        s === "published live" ||
        s === "live" ||
        s === "published";

      if (isVerificationStatus && isCal) {
        const targetPlatforms = formData.platforms && formData.platforms.length > 0
          ? formData.platforms
          : (formData.platform ? [formData.platform] : []);
        const completed = Array.isArray(task?.completedPlatforms) ? task.completedPlatforms : [];
        const unticked = targetPlatforms.filter(
          (p) => !completed.some((cp) => cp.toLowerCase() === p.toLowerCase())
        );
        if (unticked.length > 0) {
          const proceed = window.confirm(
            `⚠️ Platform Post Verification Alert:\n\nIntha platforms-la innum post podala / tick panla:\n• ${unticked.join(
              "\n• "
            )}\n\nStatus "${formData.status}"-ku matha ela platforms-layum post panni tick aagi irukanum.\n\nDo you want to proceed and save as "${formData.status}" anyway?\nClick Cancel to go back and tick the platforms.`
          );
          if (!proceed) {
            toast.error(`Please tick all assigned platforms (${unticked.join(", ")}) before setting status to "${formData.status}"!`, { icon: "⚠️" });
            setSaving(false);
            return;
          }
        }
      }

      let finalPublishDate = null;
      if (isCal && formData.hasPublishDate && formData.publishDate) {
        finalPublishDate = parseLocalDateTime(formData.publishDate, formData.publishTime || "18:00");
      }

      let finalDueDate = null;
      if (formData.dueDate) {
        finalDueDate = parseLocalDateOnly(formData.dueDate, true);
      } else {
        finalDueDate = new Date();
      }

      const payload = {
        taskTitle: formData.taskTitle.trim(),
        client: formData.clientId || null,
        clientName: formData.clientName || "General",
        clientColor: formData.clientColor || "#6366f1",
        category: isCal ? "Content" : formData.category,
        contentType: isCal ? formData.contentType : "Others Task",
        platform: isCal ? formData.platform : "",
        platforms: isCal ? (formData.platforms && formData.platforms.length > 0 ? formData.platforms : [formData.platform].filter(Boolean)) : [],
        createdBy: formData.createdById || currentUser?._id || currentUser?.id || null,
        createdByName: formData.createdByName || currentUser?.name || "Admin",
        assignee: formData.assigneeId || currentUser?._id || currentUser?.id || null,
        assigneeName: formData.assigneeName || currentUser?.name || "Admin",
        dueDate: finalDueDate,
        publishDate: finalPublishDate,
        commitment: isCal,
        onCalendar: isCal && Boolean(finalPublishDate),
        status: formData.status,
        priority: formData.priority,
        qc: isCal ? formData.qc : "-",
        notes: formData.notes,
      };

      if (task?._id) {
        await dispatch(updateSocialmediaTask({ id: task._id, data: payload })).unwrap();
        toast.success("Task updated successfully");
      } else {
        await dispatch(createSocialmediaTask(payload)).unwrap();
        toast.success("Task created successfully");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly || !task?._id) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await dispatch(deleteSocialmediaTask(task._id)).unwrap();
        toast.success("Task deleted");
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Failed to delete task");
      }
    }
  };

  const targetDateForRisk =
    isCommitment && formData.hasPublishDate && formData.publishDate
      ? parseLocalDateTime(formData.publishDate, formData.publishTime || "18:00")
      : formData.dueDate
        ? parseLocalDateOnly(formData.dueDate, true)
        : null;

  const diffHours = targetDateForRisk
    ? (targetDateForRisk.getTime() - Date.now()) / (1000 * 60 * 60)
    : -1;

  const isAtRisk =
    isCommitment &&
    !["Completed", "Live", "Published"].includes(formData.status) &&
    targetDateForRisk &&
    diffHours >= 0 &&
    diffHours <= 24;

  const currentTypeConfig =
    CONTENT_TYPES_CONFIG.find((c) => c.id.toLowerCase() === (formData.contentType || "").toLowerCase()) ||
    CONTENT_TYPES_CONFIG[0];
  const CurrentTypeIcon = currentTypeConfig.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e2a40] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#1e2a40] flex items-center justify-between bg-slate-50/90 dark:bg-[#0f172a]">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30 shrink-0">
              {task?.taskCode || (isReadOnly ? "TASK" : "NEW TASK")}
            </span>
            {isCommitment ? (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-300/80 dark:border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <FiLock size={9} /> Commitment
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-[#1e2a40] border border-slate-300 dark:border-[#2a3c5a] px-2 py-0.5 rounded-md shrink-0">
                SME tasks 
              </span>
            )}
            {isAtRisk && (
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300/80 dark:border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <FiAlertCircle size={10} /> At Risk (&lt;24h)
              </span>
            )}
            {isReadOnly && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <FiLock size={9} /> Read Only
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {isReadOnly
                ? "View Social Media Task"
                : task
                  ? "Edit Social Media Task"
                  : "Create Social Media Task"}
            </h2>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Commitment vs SME tasks  Mode Tabs */}
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-[#0f172a] border-b border-slate-100 dark:border-[#1e2a40] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-[#162033] rounded-xl border border-slate-200 dark:border-[#22324f]">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleTabChange("commitment")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isContentCalendar
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-500/40 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent border border-transparent"
              }`}
            >
              <FiLock size={12} className={isContentCalendar ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"} />
              <span>Commitment</span>
              {isContentCalendar && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>

            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleTabChange("non-commitment")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isContentCalendar
                  ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-300/80 dark:border-indigo-500/40 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent border border-transparent"
              }`}
            >
              <FiLayers size={12} className={!isContentCalendar ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"} />
              <span>SME tasks </span>
              {!isContentCalendar && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            {isContentCalendar ? "Content Calendar Task (Locked Commitment)" : "Ad-hoc / Non-commitment Task"}
          </span>
        </div>

        {/* Form Body - Compact 2-Column Grid Layout */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 bg-white dark:bg-[#0c1220]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
            
            {/* LEFT COLUMN: Task Details & Content Brief (7 of 12 cols) */}
            <div className="md:col-span-7 space-y-2.5">
              {/* Task Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  placeholder="e.g. Create Diwali reel, Weekend lineup carousel..."
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#182338] transition-all disabled:opacity-85 disabled:cursor-not-allowed"
                />
              </div>

              {/* Client & Creator Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.clientId || formData.clientName}
                    onChange={handleClientSelect}
                    required
                    disabled={isReadOnly}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#182338] cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    <option value="" className="dark:bg-[#131d31] dark:text-white">Select Client</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id} className="dark:bg-[#131d31] dark:text-white">
                        {c.companyName}
                      </option>
                    ))}
                    {formData.clientName && !clients.some((c) => c.companyName === formData.clientName) && (
                      <option value={formData.clientName} className="dark:bg-[#131d31] dark:text-white">{formData.clientName}</option>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Created By
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-[#162033] border border-slate-200/80 dark:border-[#22324f] text-xs">
                    <div className="relative shrink-0 w-4 h-4">
                      {creatorInfo.avatarUrl ? (
                        <img
                          src={creatorInfo.avatarUrl}
                          alt={creatorInfo.name}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".modal-avatar-fallback");
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="modal-avatar-fallback w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[8px] items-center justify-center uppercase"
                        style={{ display: creatorInfo.avatarUrl ? "none" : "flex" }}
                      >
                        {creatorInfo.initials}
                      </div>
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs truncate">
                      {creatorInfo.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category & Content Type */}
              <div className="grid grid-cols-2 gap-2.5">
                {isContentCalendar ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <div className="w-full px-2.5 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-300/80 dark:border-emerald-500/30 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 select-none shadow-2xs">
                      <FiCalendar size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Content Calendar</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed truncate"
                    >
                      {SME_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="dark:bg-[#131d31] dark:text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isContentCalendar ? (
                  <div className="relative" ref={contentTypeDropdownRef}>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Content Type
                    </label>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setIsContentTypeOpen(!isContentTypeOpen)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CurrentTypeIcon size={13} className={currentTypeConfig.color} />
                        <span className="truncate">{currentTypeConfig.name}</span>
                      </div>
                      <FiChevronDown size={12} className={`text-slate-400 transition-transform ${isContentTypeOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isContentTypeOpen && !isReadOnly && (
                      <div className="absolute left-0 top-full mt-1 w-full z-50 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-[#22324f] rounded-lg shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95">
                        {CONTENT_TYPES_CONFIG.map((ct) => {
                          const IconComp = ct.icon;
                          const isSelected = formData.contentType === ct.id;
                          return (
                            <button
                              key={ct.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, contentType: ct.id });
                                setIsContentTypeOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162033]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <IconComp size={13} className={ct.color} />
                                <span>{ct.name}</span>
                              </div>
                              {isSelected && <FiCheck size={12} className="text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Content Type
                    </label>
                    <div className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-[#162033] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between select-none shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <FiLayers size={12} className="text-slate-400 dark:text-slate-500" />
                        <span>Others Task</span>
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Non Comm</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media Platform Selector (Visible when Category is Content Calendar) */}
              {isContentCalendar && (
                <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#131d31]/50 border border-slate-200/80 dark:border-[#1e2a40] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        <FiShare2 size={12} className="text-indigo-500 dark:text-indigo-400" />
                        <span>Platforms</span>
                      </label>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/30">
                        {(formData.platforms || []).length}/{SOCIAL_PLATFORMS.length}
                      </span>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1 text-[10.5px] font-semibold">
                        <button
                          type="button"
                          onClick={handleSelectAllPlatforms}
                          className="px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:underline transition-all cursor-pointer font-bold"
                          title="Select all platforms"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={handleClearAllPlatforms}
                          className="px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer font-bold"
                          title="Clear all selected platforms"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {SOCIAL_PLATFORMS.map((plat) => {
                      const IconComp = plat.icon;
                      const isSelected = (formData.platforms || []).includes(plat.id);
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handlePlatformSelect(plat.id)}
                          title={
                            isSelected
                              ? `${plat.name} selected - Click to unselect`
                              : `Click to select ${plat.name}`
                          }
                          className={`group/platBtn flex items-center justify-between py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? plat.bgActive
                              : plat.bgInactive
                          } active:scale-95 disabled:opacity-85 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconComp
                              size={13}
                              className="shrink-0 transition-transform group-hover/platBtn:scale-110"
                              style={{ color: isSelected ? "#ffffff" : plat.color }}
                            />
                            <span className="truncate">{plat.name}</span>
                          </div>

                          {/* Checkbox indicator */}
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? "bg-white/25 text-white shadow-2xs"
                                : "border border-slate-300 dark:border-[#2d3f60] bg-white dark:bg-[#0c1427] group-hover/platBtn:border-indigo-400 text-transparent"
                            }`}
                          >
                            <FiCheck size={10} className={`stroke-[3] ${isSelected ? "opacity-100" : "opacity-0"}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes / Caption Brief / Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Notes &amp; Caption Brief
                </label>
                <textarea
                  rows={isContentCalendar ? 2 : 3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Add reel concept details, visual reference links, copy, hashtags..."
                  className="w-full px-3 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#182338] resize-none font-medium leading-relaxed disabled:opacity-85 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Schedule, Commitment & Workflow (5 of 12 cols) */}
            <div className="md:col-span-5 space-y-2.5">
              {/* Publish Date / Content Calendar Scheduling Card */}
              {isContentCalendar ? (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1e2a40] bg-slate-50/70 dark:bg-[#131d31]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.hasPublishDate}
                        onChange={(e) => setFormData({ ...formData, hasPublishDate: e.target.checked })}
                        disabled={isReadOnly}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Publish on Calendar
                      </span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {formData.hasPublishDate ? "Calendar Slot" : "Unscheduled"}
                    </span>
                  </div>

                  {formData.hasPublishDate && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                          Publish Date
                        </label>
                        <div className="relative flex items-center">
                          <FiCalendar className="absolute left-2 text-slate-400 dark:text-slate-500 pointer-events-none" size={12} />
                          <input
                            type="date"
                            value={formData.publishDate}
                            onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                            disabled={isReadOnly}
                            className="w-full pl-7 pr-1.5 py-1 bg-white dark:bg-[#162033] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 disabled:opacity-85 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                          Time
                        </label>
                        <div className="relative flex items-center">
                          <FiClock className="absolute left-2 text-slate-400 dark:text-slate-500 pointer-events-none" size={12} />
                          <input
                            type="time"
                            value={formData.publishTime}
                            onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
                            disabled={isReadOnly}
                            className="w-full pl-7 pr-1.5 py-1 bg-white dark:bg-[#162033] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 disabled:opacity-85 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1e2a40] bg-slate-50/70 dark:bg-[#131d31]/50 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
                    Non-commitment Task
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                    Tracked under SM Tasks (not shown on Calendar).
                  </p>
                </div>
              )}

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 disabled:opacity-85 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    {PRIORITIES.map((pr) => (
                      <option key={pr} value={pr} className="dark:bg-[#131d31] dark:text-white">
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & QC */}
              <div className={`grid ${isCommitment ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={
                      isCommitment
                        ? (["Live", "Published", "Published Live"].includes(formData.status)
                            ? "Published Live"
                            : ["In QC", "QC"].includes(formData.status)
                              ? "QC"
                              : ["In progress", "Inprogress"].includes(formData.status)
                                ? "Inprogress"
                                : (formData.status || "").toLowerCase().includes("client approval")
                                  ? "Completed and wait CLient Approval"
                                  : formData.status || "Not started")
                        : (["In progress", "Inprogress"].includes(formData.status)
                            ? "Inprogress"
                            : formData.status || "Not started")
                    }
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed truncate"
                  >
                    {(isCommitment ? COMMITMENT_STATUSES : NON_COMMITMENT_STATUSES).map((st) => (
                      <option key={st} value={st} className="dark:bg-[#131d31] dark:text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {isCommitment && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      QC Status
                    </label>
                    <select
                      value={formData.qc}
                      onChange={(e) => setFormData({ ...formData, qc: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-[#131d31] border border-slate-200 dark:border-[#22324f] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                    >
                      {QC_STATUSES.map((q) => (
                        <option key={q} value={q} className="dark:bg-[#131d31] dark:text-white">
                          {q === "-" ? "None (-)" : q}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1e2a40] flex items-center justify-between">
            {isReadOnly ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <FiLock size={12} className="text-amber-500" />
                <span>Read-only view</span>
              </div>
            ) : task ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <FiTrash2 size={13} /> <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162033] transition-colors cursor-pointer"
              >
                Close
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FiCheck size={14} className="stroke-[2.5]" />
                  <span>{saving ? "Saving..." : task ? "Save Changes" : "Create Task"}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmTaskModal;
